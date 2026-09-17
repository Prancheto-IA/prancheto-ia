-- Migration: Bloco 5 — Chefe Supremo (dono do tenant) + hierarquia de
-- cargos. Bloco de alta sensibilidade: nenhuma regra aqui depende só da
-- interface — tudo é reforçado no banco.
--
-- DECISÃO DE DESIGN: não existe (e não é criada aqui) nenhuma policy de
-- RLS permitindo UPDATE direto de um usuário sobre a linha de outro —
-- isso já não existia antes desta migration (só super_admin, via Edge
-- Function com service role, altera outro usuário). Abrir essa porta com
-- um USING/WITH CHECK cru arriscaria recursão (mesma classe de bug já
-- corrigida em 20260907000000_fix_recursao_rls_projetos_tarefas.sql) e
-- ficaria frágil pra codificar "nível A > nível B, exceto o dono". Em vez
-- disso, todas as ações sensíveis (mudar cargo de alguém, ativar/desativar)
-- passam exclusivamente por funções SECURITY DEFINER — mesmo padrão já
-- usado em criar_canal_chat/definir_papel_chat (Bloco 4). Essas funções são
-- o único portão, e é nelas que a regra do dono e da hierarquia mora.
--
-- Convenção de nível: MAIOR número = MAIS ALTO na hierarquia.

-- 1. Chefe Supremo — marcação independente do sistema de Cargos.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS e_dono_tenant boolean NOT NULL DEFAULT false;

-- Garante no máximo 1 dono por tenant, no próprio banco (não só na UI).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_dono_unico
  ON public.users (tenant_id)
  WHERE e_dono_tenant = true;

COMMENT ON COLUMN public.users.e_dono_tenant IS 'Chefe Supremo da empresa: criado automaticamente como primeiro usuário do tenant. Único, intocável por qualquer outro usuário da mesma empresa (nunca removido/rebaixado) — ver definir_ativo_usuario/definir_cargo_usuario.';

-- 2. Nível hierárquico do cargo, definido pela própria empresa.
ALTER TABLE public.org_cargos
  ADD COLUMN IF NOT EXISTS nivel integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_cargos_nivel_check') THEN
    ALTER TABLE public.org_cargos
      ADD CONSTRAINT org_cargos_nivel_check CHECK (nivel >= 0);
  END IF;
END $$;

COMMENT ON COLUMN public.org_cargos.nivel IS 'Nível hierárquico: maior = mais alto. Um cargo só gerencia (cria/edita/exclui cargos, gerencia usuários) cargos com nível estritamente menor que o seu. Backfill inicial: Líder Geral=90, Líder de Time=50, Membro de Time=10, demais=0.';

-- Backfill dos cargos do seed padrão (migrations_legado/008) — cargos
-- criados depois entram com o default 0 e o dono/quem tiver nível alto
-- ajusta na tela de Cargos.
UPDATE public.org_cargos SET nivel = 90 WHERE nome = 'Líder Geral'    AND nivel = 0;
UPDATE public.org_cargos SET nivel = 50 WHERE nome = 'Líder de Time'  AND nivel = 0;
UPDATE public.org_cargos SET nivel = 10 WHERE nome = 'Membro de Time' AND nivel = 0;

-- 3. Helpers SECURITY DEFINER — mesmo padrão de get_user_cargo()/
--    get_user_tenant_id()/get_projeto_tenant_id(): leem direto, sem
--    reacionar a RLS da tabela de origem.
CREATE OR REPLACE FUNCTION public.sou_dono_tenant() RETURNS boolean
    LANGUAGE sql SECURITY DEFINER SET search_path = public
    AS $$
  SELECT COALESCE((SELECT e_dono_tenant FROM public.users WHERE id = auth.uid()), false);
$$;

-- COALESCE precisa envolver a subquery inteira, não só a coluna: se zero
-- linhas baterem (cargo_id nulo, usuário sem linha em users, cargo
-- inexistente), a subquery em si já retorna NULL, e "NULL >= x" no
-- trigger/RPC vale como falso — ou seja, a checagem de hierarquia falharia
-- ABERTA em vez de fechada. Envolver com COALESCE(( ... ), 0) garante 0
-- ("sem nível") nesses casos, fail-safe.
CREATE OR REPLACE FUNCTION public.get_user_cargo_nivel() RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public
    AS $$
  SELECT COALESCE((
    SELECT c.nivel
      FROM public.users u
      LEFT JOIN public.org_cargos c ON c.id = u.cargo_id
     WHERE u.id = auth.uid()
     LIMIT 1
  ), 0);
$$;

CREATE OR REPLACE FUNCTION public.get_cargo_nivel(p_cargo_id uuid) RETURNS integer
    LANGUAGE sql SECURITY DEFINER SET search_path = public
    AS $$
  SELECT COALESCE((SELECT nivel FROM public.org_cargos WHERE id = p_cargo_id), 0);
$$;

GRANT EXECUTE ON FUNCTION public.sou_dono_tenant() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_cargo_nivel() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cargo_nivel(uuid) TO anon, authenticated, service_role;

-- 4. Trigger em org_cargos: ninguém cria/edita/exclui um cargo de nível
--    igual ou maior que o seu próprio. super_admin e o dono do tenant
--    (que pode não ter cargo_id nenhum ainda — problema do "ovo e a
--    galinha" pro primeiro cargo que ele cria) ficam de fora da checagem.
-- COALESCE(NEW, OLD) sobre tipo linha em trigger multi-operação não é o
-- idioma padrão do Postgres para este caso — usa o IF/ELSE explícito por
-- TG_OP, sem ambiguidade sobre o valor de retorno.
CREATE OR REPLACE FUNCTION public.trigger_valida_nivel_cargo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    AS $$
DECLARE
  v_nivel_ator integer;
BEGIN
  IF public.get_user_cargo() = 'super_admin' OR public.sou_dono_tenant() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  v_nivel_ator := public.get_user_cargo_nivel();

  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.nivel >= v_nivel_ator THEN
    RAISE EXCEPTION 'Você não pode alterar ou excluir um cargo de nível igual ou superior ao seu.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.nivel >= v_nivel_ator THEN
    RAISE EXCEPTION 'O cargo precisa ter nível abaixo do seu (seu nível: %).', v_nivel_ator
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_valida_nivel_cargo ON public.org_cargos;
CREATE TRIGGER trg_valida_nivel_cargo
  BEFORE INSERT OR UPDATE OR DELETE ON public.org_cargos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_valida_nivel_cargo();

-- 5. Ações sensíveis sobre outros usuários — único portão de escrita
--    cross-user, com a regra do dono e da hierarquia embutida.
CREATE OR REPLACE FUNCTION public.definir_ativo_usuario(p_user_id uuid, p_ativo boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_alvo public.users;
BEGIN
  SELECT * INTO v_alvo FROM public.users WHERE id = p_user_id;
  IF v_alvo.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode desativar a própria conta por aqui.';
  END IF;

  IF public.get_user_cargo() IS DISTINCT FROM 'super_admin' THEN
    IF v_alvo.tenant_id IS DISTINCT FROM public.get_user_tenant_id() THEN
      RAISE EXCEPTION 'Usuário fora do seu tenant.';
    END IF;

    IF v_alvo.e_dono_tenant THEN
      RAISE EXCEPTION 'O dono da empresa não pode ser desativado.';
    END IF;

    IF NOT public.sou_dono_tenant() THEN
      IF NOT public.tem_permissao('usuarios.gerenciar') THEN
        RAISE EXCEPTION 'Sem permissão para gerenciar usuários.';
      END IF;
      IF public.get_cargo_nivel(v_alvo.cargo_id) >= public.get_user_cargo_nivel() THEN
        RAISE EXCEPTION 'Você só pode gerenciar usuários com cargo abaixo do seu nível.';
      END IF;
    END IF;
  END IF;

  UPDATE public.users SET ativo = p_ativo, atualizado_em = now() WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_cargo_usuario(p_user_id uuid, p_cargo_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_alvo public.users;
  v_ator_tenant uuid;
  v_nivel_ator integer;
  v_cargo_tenant uuid;
BEGIN
  v_ator_tenant := public.get_user_tenant_id();
  SELECT * INTO v_alvo FROM public.users WHERE id = p_user_id;
  IF v_alvo.id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado.';
  END IF;

  IF public.get_user_cargo() IS DISTINCT FROM 'super_admin' THEN
    IF v_alvo.tenant_id IS DISTINCT FROM v_ator_tenant THEN
      RAISE EXCEPTION 'Usuário fora do seu tenant.';
    END IF;

    IF v_alvo.e_dono_tenant THEN
      RAISE EXCEPTION 'O cargo do dono da empresa não pode ser alterado.';
    END IF;

    IF p_cargo_id IS NOT NULL THEN
      SELECT tenant_id INTO v_cargo_tenant FROM public.org_cargos WHERE id = p_cargo_id;
      IF v_cargo_tenant IS DISTINCT FROM v_ator_tenant THEN
        RAISE EXCEPTION 'Cargo fora do seu tenant.';
      END IF;
    END IF;

    IF NOT public.sou_dono_tenant() THEN
      IF NOT public.tem_permissao('usuarios.gerenciar') THEN
        RAISE EXCEPTION 'Sem permissão para gerenciar usuários.';
      END IF;

      v_nivel_ator := public.get_user_cargo_nivel();

      IF public.get_cargo_nivel(v_alvo.cargo_id) >= v_nivel_ator THEN
        RAISE EXCEPTION 'Você só pode gerenciar usuários com cargo abaixo do seu nível.';
      END IF;

      IF public.get_cargo_nivel(p_cargo_id) >= v_nivel_ator THEN
        RAISE EXCEPTION 'Você não pode atribuir um cargo de nível igual ou superior ao seu.';
      END IF;
    END IF;
  END IF;

  UPDATE public.users SET cargo_id = p_cargo_id, atualizado_em = now() WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.definir_ativo_usuario(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.definir_cargo_usuario(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.definir_ativo_usuario(uuid, boolean) IS 'Único caminho pra ativar/desativar um usuário de outro (nunca DELETE — histórico preservado). Aplica a regra do dono intocável e da hierarquia de nível.';
COMMENT ON FUNCTION public.definir_cargo_usuario(uuid, uuid) IS 'Único caminho pra mudar o cargo de outro usuário. Aplica a regra do dono intocável e da hierarquia de nível (tanto no alvo quanto no cargo novo).';
