-- =============================================================
-- ORGANIZAÇÃO E PERFIL PRÓPRIO
--
-- Três frentes, todas de permissão:
--
-- 1. IDENTIDADE VISUAL — a tabela 'tenants' só tinha policy de SELECT
--    para o cliente. A tela de Identidade Visual gravava contra o vazio:
--    o UPDATE não alcançava linha nenhuma. Ganha policy de UPDATE, e um
--    gatilho para que essa permissão não vire troca de plano.
--
-- 2. PERMISSÕES GRANULARES NO BANCO — org_times, org_time_membros e
--    org_cargos aceitavam escrita apenas de users.cargo = 'admin',
--    enquanto a interface liberava os botões por times.gerenciar e
--    cargos.gerenciar. Um "Líder de Time" via o botão e tomava erro do
--    RLS. As policies passam a ler org_cargos.permissoes.
--
-- 3. perfil.editar_proprio — nova permissão para editar os próprios
--    dados. O padrão é permitir, então ela é concedida a todos os cargos
--    já existentes. E a auto-edição em 'users', hoje irrestrita, passa a
--    valer só para o nome: a policy user_update_self permite ao usuário
--    gravar qualquer coluna da própria linha, inclusive cargo, o que é
--    escalada de privilégio.
-- =============================================================


-- -------------------------------------------------------------
-- 1. HELPER DE PERMISSÃO
--
-- Espelha temPermissao() do front-end (store/authStore.js), lendo o cargo
-- organizacional do usuário autenticado.
--
-- p_padrao decide o caso "usuário sem cargo organizacional": signup direto
-- não define cargo_id. Recursos que já eram restritos usam false; permissões
-- liberadas por padrão, como perfil.editar_proprio, passam true.
--
-- admin e super_admin passam sempre — é a distinção estrutural de cargo,
-- não uma permissão de funcionalidade.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tem_permissao(p_slug text, p_padrao boolean DEFAULT false)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
  SELECT COALESCE((
    SELECT CASE
             WHEN u.cargo IN ('admin', 'super_admin') THEN true
             WHEN c.permissoes IS NULL                THEN p_padrao
             ELSE (c.permissoes ? p_slug) OR (c.permissoes ? '*')
           END
      FROM public.users u
      LEFT JOIN public.org_cargos c ON c.id = u.cargo_id
     WHERE u.id = auth.uid()
     LIMIT 1
  ), false);
$$;

ALTER FUNCTION public.tem_permissao(text, boolean) OWNER TO postgres;

COMMENT ON FUNCTION public.tem_permissao(text, boolean) IS
  'Verifica um slug de org_cargos.permissoes para o usuário autenticado. p_padrao vale quando o usuário não tem cargo organizacional.';

GRANT ALL ON FUNCTION public.tem_permissao(text, boolean) TO anon;
GRANT ALL ON FUNCTION public.tem_permissao(text, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.tem_permissao(text, boolean) TO service_role;


-- -------------------------------------------------------------
-- 2. IDENTIDADE VISUAL DA ORGANIZAÇÃO
-- -------------------------------------------------------------

-- Quem edita configurações da organização pode gravar logo, cores e fonte.
DROP POLICY IF EXISTS "tenants_update_proprio" ON public.tenants;
CREATE POLICY "tenants_update_proprio" ON public.tenants
    FOR UPDATE
    USING (
      id = public.get_user_tenant_id()
      AND public.tem_permissao('configuracoes.editar')
    )
    WITH CHECK (
      id = public.get_user_tenant_id()
      AND public.tem_permissao('configuracoes.editar')
    );

-- A policy acima é por linha, e o Postgres não tem RLS por coluna. Sem este
-- gatilho, liberar a identidade visual liberaria também plano, status e
-- limite_usuarios — o cliente daria a si mesmo o plano Enterprise.
CREATE OR REPLACE FUNCTION public.trigger_tenants_protege_comercial()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
  -- Tudo que o cliente pode mudar na própria organização. O que não estiver
  -- aqui é decisão comercial e sai pelo painel interno (service_role).
  colunas_liberadas text[] := ARRAY[
    'nome', 'email_contato', 'logo_url', 'identidade_visual',
    'configuracoes', 'atualizado_em'
  ];
  bloqueadas text[];
BEGIN
  -- Sem auth.uid() a chamada vem do service_role: Edge Functions e painel
  -- da equipe Prancheto.IA, que não passam por RLS de propósito.
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.get_user_cargo() = 'super_admin' THEN RETURN NEW; END IF;

  SELECT array_agg(campo.chave ORDER BY campo.chave)
    INTO bloqueadas
    FROM jsonb_each(to_jsonb(NEW)) AS campo(chave, valor)
   WHERE campo.valor IS DISTINCT FROM (to_jsonb(OLD) -> campo.chave)
     AND NOT (campo.chave = ANY (colunas_liberadas));

  IF bloqueadas IS NOT NULL THEN
    RAISE EXCEPTION
      'Estes campos da organização são alterados apenas pela equipe Prancheto.IA: %',
      array_to_string(bloqueadas, ', ')
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.trigger_tenants_protege_comercial() OWNER TO postgres;

DROP TRIGGER IF EXISTS tenants_protege_comercial ON public.tenants;
CREATE TRIGGER tenants_protege_comercial
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.trigger_tenants_protege_comercial();

-- A chave que decide se a identidade visual vale para a interface.
-- Ausente é o mesmo que desligada: nenhum tenant que nunca personalizou
-- nada tem a aparência alterada por esta migration.
COMMENT ON COLUMN public.tenants.identidade_visual IS
  'Cores e fonte da identidade visual da organização. A chave "aplicar" (boolean) decide se valem na interface; ausente = desligada.';


-- -------------------------------------------------------------
-- 3. TIMES E CARGOS: PERMISSÃO GRANULAR EM VEZ DE CARGO FIXO
--
-- As policies antigas exigiam users.cargo IN ('admin','super_admin').
-- Agora aceitam também quem tem o slug correspondente no cargo, que é o
-- mesmo critério das guardas de interface. p_padrao fica em false: quem
-- não tem cargo organizacional não ganha acesso de escrita.
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "org_times_write" ON public.org_times;
CREATE POLICY "org_times_write" ON public.org_times
    USING (
      public.get_user_cargo() = 'super_admin'
      OR (tenant_id = public.get_user_tenant_id() AND public.tem_permissao('times.gerenciar'))
    )
    WITH CHECK (
      public.get_user_cargo() = 'super_admin'
      OR (tenant_id = public.get_user_tenant_id() AND public.tem_permissao('times.gerenciar'))
    );

DROP POLICY IF EXISTS "org_time_membros_write" ON public.org_time_membros;
CREATE POLICY "org_time_membros_write" ON public.org_time_membros
    USING (
      public.get_user_cargo() = 'super_admin'
      OR (
        public.tem_permissao('times.gerenciar')
        AND EXISTS (
          SELECT 1 FROM public.org_times t
           WHERE t.id = org_time_membros.time_id
             AND t.tenant_id = public.get_user_tenant_id()
        )
      )
    )
    WITH CHECK (
      public.get_user_cargo() = 'super_admin'
      OR (
        public.tem_permissao('times.gerenciar')
        AND EXISTS (
          SELECT 1 FROM public.org_times t
           WHERE t.id = org_time_membros.time_id
             AND t.tenant_id = public.get_user_tenant_id()
        )
      )
    );

DROP POLICY IF EXISTS "org_cargos_write" ON public.org_cargos;
CREATE POLICY "org_cargos_write" ON public.org_cargos
    USING (
      public.get_user_cargo() = 'super_admin'
      OR (tenant_id = public.get_user_tenant_id() AND public.tem_permissao('cargos.gerenciar'))
    )
    WITH CHECK (
      public.get_user_cargo() = 'super_admin'
      OR (tenant_id = public.get_user_tenant_id() AND public.tem_permissao('cargos.gerenciar'))
    );


-- -------------------------------------------------------------
-- 4. PERMISSÃO: perfil.editar_proprio
--
-- Concedida a todos os cargos existentes, porque o padrão definido é
-- permitir a edição dos próprios dados. Sem este passo a permissão
-- nasceria negada para quem já usa o sistema. Idempotente.
-- -------------------------------------------------------------
UPDATE public.org_cargos
   SET permissoes    = permissoes || '["perfil.editar_proprio"]'::jsonb,
       atualizado_em = now()
 WHERE NOT (permissoes ? 'perfil.editar_proprio');


-- -------------------------------------------------------------
-- 5. AUTO-EDIÇÃO EM 'users'
--
-- A policy user_update_self permite ao usuário gravar a própria linha sem
-- restrição de coluna — daria para trocar o próprio cargo para 'admin' ou
-- 'super_admin', ou se mudar de organização. O gatilho reduz a auto-edição
-- ao nome, e só quando o cargo autoriza.
--
-- Alterações feitas pela equipe (Edge Function admin-users) usam
-- service_role, sem auth.uid(), e seguem passando.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_users_protege_auto_edicao()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
  colunas_liberadas text[] := ARRAY['nome', 'atualizado_em'];
  bloqueadas text[];
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Não é auto-edição: quem cuida de linha de terceiro é a policy.
  IF auth.uid() IS DISTINCT FROM OLD.id THEN RETURN NEW; END IF;
  IF public.get_user_cargo() = 'super_admin' THEN RETURN NEW; END IF;

  SELECT array_agg(campo.chave ORDER BY campo.chave)
    INTO bloqueadas
    FROM jsonb_each(to_jsonb(NEW)) AS campo(chave, valor)
   WHERE campo.valor IS DISTINCT FROM (to_jsonb(OLD) -> campo.chave)
     AND NOT (campo.chave = ANY (colunas_liberadas));

  IF bloqueadas IS NOT NULL THEN
    RAISE EXCEPTION
      'Você pode alterar apenas os seus dados pessoais. Campos bloqueados: %',
      array_to_string(bloqueadas, ', ')
      USING ERRCODE = '42501';
  END IF;

  IF NEW.nome IS DISTINCT FROM OLD.nome
     AND NOT public.tem_permissao('perfil.editar_proprio', true) THEN
    RAISE EXCEPTION 'Seu cargo não permite alterar o próprio nome.'
      USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(NEW.nome, '')) = '' THEN
    RAISE EXCEPTION 'O nome não pode ficar vazio.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.trigger_users_protege_auto_edicao() OWNER TO postgres;

DROP TRIGGER IF EXISTS users_protege_auto_edicao ON public.users;
CREATE TRIGGER users_protege_auto_edicao
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.trigger_users_protege_auto_edicao();
