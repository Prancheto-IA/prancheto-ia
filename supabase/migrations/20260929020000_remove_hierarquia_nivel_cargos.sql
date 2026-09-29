-- =============================================================
-- PRANCHETO.IA - Remove o "nível hierárquico" numérico dos cargos,
-- substituindo por regra de SUBCONJUNTO DE PERMISSÕES. Duas forças
-- diferentes:
--
--   (a) criar/editar CARGO (trg_valida_permissoes_cargo): subconjunto NÃO
--       ESTRITO — você só marca permissões que já possui, pode usar
--       exatamente as suas.
--
--   (b) gerenciar USUÁRIO (definir_ativo_usuario/definir_cargo_usuario e a
--       criação de usuário na Edge Function tenant-usuarios): subconjunto
--       ESTRITO — o alvo precisa ter permissões estritamente menores que
--       as suas. Dois cargos com o MESMO conjunto de permissões não se
--       gerenciam um ao outro; só o dono do tenant/super_admin gerencia
--       qualquer um (preserva "só o Chefe Supremo gerencia outros
--       administradores").
--
-- '*' dentro de um array `permissoes` vale "tem tudo" (mesma convenção já
-- usada em tem_permissao()).
--
-- org_cargos.nivel NÃO é apagada agora (cargos já criados não podem
-- quebrar) — só vira nullable e sem uso, candidata a DROP COLUMN futuro.
-- =============================================================

DROP TRIGGER IF EXISTS trg_valida_nivel_cargo ON public.org_cargos;

-- permissoes_dominam(dominante, dominado): true quando `dominante` tem
-- ESTRITAMENTE mais que `dominado`. Dupla contenção jsonb (<@) em vez de
-- igualdade, pra não depender da ordem dos elementos no array.
CREATE OR REPLACE FUNCTION public.permissoes_dominam(p_dominante jsonb, p_dominado jsonb)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN COALESCE(p_dominante, '[]'::jsonb) ? '*' AND COALESCE(p_dominado, '[]'::jsonb) ? '*' THEN false
    WHEN COALESCE(p_dominante, '[]'::jsonb) ? '*' THEN true
    WHEN COALESCE(p_dominado, '[]'::jsonb) ? '*' THEN false
    ELSE
      (COALESCE(p_dominado, '[]'::jsonb) <@ COALESCE(p_dominante, '[]'::jsonb))
      AND NOT (COALESCE(p_dominante, '[]'::jsonb) <@ COALESCE(p_dominado, '[]'::jsonb))
  END;
$$;

-- get_user_permissoes(): permissões do cargo do usuário logado. Mesmo
-- estilo fail-safe de get_user_cargo_nivel() (removida abaixo): COALESCE
-- envolve a subquery inteira — zero linhas bate = array vazio, checagem
-- falha FECHADA.
CREATE OR REPLACE FUNCTION public.get_user_permissoes() RETURNS jsonb
    LANGUAGE sql SECURITY DEFINER SET search_path = public
    AS $$
  SELECT COALESCE((
    SELECT c.permissoes
      FROM public.users u
      LEFT JOIN public.org_cargos c ON c.id = u.cargo_id
     WHERE u.id = auth.uid()
     LIMIT 1
  ), '[]'::jsonb);
$$;

GRANT EXECUTE ON FUNCTION public.permissoes_dominam(jsonb, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_permissoes() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.permissoes_dominam(jsonb, jsonb) IS 'true quando o primeiro array de permissões domina ESTRITAMENTE o segundo (superconjunto próprio, "*" conta como ter tudo). Usada nas regras de "quem gerencia quem" — pares de poder igual não se gerenciam.';
COMMENT ON FUNCTION public.get_user_permissoes() IS 'Permissões do cargo do usuário logado. Substitui get_user_cargo_nivel() (removida nesta migration).';

-- Trigger novo em org_cargos — regra (a), subconjunto NÃO ESTRITO.
CREATE OR REPLACE FUNCTION public.trigger_valida_permissoes_cargo() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
    AS $$
DECLARE
  v_minhas_permissoes jsonb;
BEGIN
  IF public.get_user_cargo() = 'super_admin' OR public.sou_dono_tenant() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  v_minhas_permissoes := public.get_user_permissoes();

  -- Não dá pra editar/excluir um cargo cujas permissões ATUAIS você não
  -- possui integralmente.
  IF TG_OP IN ('UPDATE', 'DELETE')
     AND NOT (v_minhas_permissoes ? '*')
     AND (COALESCE(OLD.permissoes, '[]'::jsonb) ? '*'
          OR NOT (COALESCE(OLD.permissoes, '[]'::jsonb) <@ v_minhas_permissoes)) THEN
    RAISE EXCEPTION 'Você não pode alterar ou excluir um cargo com permissões que você não possui.'
      USING ERRCODE = '42501';
  END IF;

  -- Não dá pra conceder (NEW) uma permissão que você mesmo não tem.
  IF TG_OP IN ('INSERT', 'UPDATE')
     AND NOT (v_minhas_permissoes ? '*')
     AND (COALESCE(NEW.permissoes, '[]'::jsonb) ? '*'
          OR NOT (COALESCE(NEW.permissoes, '[]'::jsonb) <@ v_minhas_permissoes)) THEN
    RAISE EXCEPTION 'Você só pode conceder a um cargo permissões que você mesmo possui.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_valida_permissoes_cargo
  BEFORE INSERT OR UPDATE OR DELETE ON public.org_cargos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_valida_permissoes_cargo();

DROP FUNCTION IF EXISTS public.trigger_valida_nivel_cargo();

-- Regra (b), subconjunto ESTRITO — reescritas por completo. Tudo que não é
-- hierarquia (tenant, e_dono_tenant, auto-edição, tem_permissao(), bypass
-- de sou_dono_tenant()/super_admin) permanece idêntico ao original.
CREATE OR REPLACE FUNCTION public.definir_ativo_usuario(p_user_id uuid, p_ativo boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_alvo public.users;
  v_minhas_permissoes jsonb;
  v_permissoes_alvo jsonb;
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

      v_minhas_permissoes := public.get_user_permissoes();
      v_permissoes_alvo := COALESCE(
        (SELECT permissoes FROM public.org_cargos WHERE id = v_alvo.cargo_id),
        '[]'::jsonb
      );
      IF NOT public.permissoes_dominam(v_minhas_permissoes, v_permissoes_alvo) THEN
        RAISE EXCEPTION 'Você só pode gerenciar usuários com permissões estritamente abaixo das suas.'
          USING ERRCODE = '42501';
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
  v_minhas_permissoes jsonb;
  v_cargo_tenant uuid;
  v_permissoes_alvo jsonb;
  v_permissoes_novo_cargo jsonb;
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

      v_minhas_permissoes := public.get_user_permissoes();

      v_permissoes_alvo := COALESCE(
        (SELECT permissoes FROM public.org_cargos WHERE id = v_alvo.cargo_id),
        '[]'::jsonb
      );
      IF NOT public.permissoes_dominam(v_minhas_permissoes, v_permissoes_alvo) THEN
        RAISE EXCEPTION 'Você só pode gerenciar usuários com permissões estritamente abaixo das suas.'
          USING ERRCODE = '42501';
      END IF;

      v_permissoes_novo_cargo := COALESCE(
        (SELECT permissoes FROM public.org_cargos WHERE id = p_cargo_id),
        '[]'::jsonb
      );
      IF NOT public.permissoes_dominam(v_minhas_permissoes, v_permissoes_novo_cargo) THEN
        RAISE EXCEPTION 'Você não pode atribuir um cargo com permissões iguais ou superiores às suas.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  UPDATE public.users SET cargo_id = p_cargo_id, atualizado_em = now() WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.definir_ativo_usuario(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.definir_cargo_usuario(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.definir_ativo_usuario(uuid, boolean) IS 'Único caminho pra ativar/desativar um usuário de outro. Aplica a regra do dono intocável e o subconjunto ESTRITO de permissões.';
COMMENT ON FUNCTION public.definir_cargo_usuario(uuid, uuid) IS 'Único caminho pra mudar o cargo de outro usuário. Aplica a regra do dono intocável e o subconjunto ESTRITO de permissões (alvo e cargo novo).';

DROP FUNCTION IF EXISTS public.get_user_cargo_nivel();
DROP FUNCTION IF EXISTS public.get_cargo_nivel(uuid);

-- Coluna mantida (cargos existentes não podem quebrar), só nullable e sem uso.
ALTER TABLE public.org_cargos ALTER COLUMN nivel DROP NOT NULL;

COMMENT ON COLUMN public.org_cargos.nivel IS 'DEPRECATED — não é mais lida por nenhuma policy, função, trigger ou Edge Function desde 20260929020000_remove_hierarquia_nivel_cargos.sql. Poder de um cargo agora é definido só pelo conjunto de permissões (ver get_user_permissoes()/permissoes_dominam()). Nullable, sem dado apagado, candidata a DROP COLUMN futuro.';
