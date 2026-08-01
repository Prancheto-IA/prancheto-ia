-- =============================================================
-- Migration 020: Corrigir RLS de crm_contatos para restringir
-- acesso por time_id quando o contato pertence a um time.
--
-- Regras:
--   1. Contatos sem time_id (NULL): visíveis para qualquer
--      membro do mesmo tenant.
--   2. Contatos com time_id: visíveis apenas para:
--      a) Membros do time (org_time_membros)
--      b) Responsável direto (responsavel_id)
--      c) Usuários com permissão 'usuarios.gerenciar' (Líder Geral)
-- =============================================================

-- Remove a política antiga (permissiva demais — só verificava tenant)
DROP POLICY IF EXISTS crm_contatos_tenant_or_owner ON public.crm_contatos;

-- ── SELECT ────────────────────────────────────────────────────
CREATE POLICY crm_contatos_select
  ON public.crm_contatos
  FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    AND (
      -- Contato sem time: qualquer membro do tenant vê
      time_id IS NULL
      OR
      -- Responsável direto sempre vê
      responsavel_id = auth.uid()
      OR
      -- Membro do time ao qual o contato pertence
      EXISTS (
        SELECT 1 FROM public.org_time_membros m
        WHERE m.time_id = crm_contatos.time_id
          AND m.user_id = auth.uid()
      )
      OR
      -- Líder Geral: tem permissão 'usuarios.gerenciar' no cargo
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.org_cargos c ON c.id = u.cargo_id
        WHERE u.id = auth.uid()
          AND u.tenant_id = get_user_tenant_id()
          AND c.permissoes @> '["usuarios.gerenciar"]'::jsonb
      )
    )
  );

-- ── INSERT ────────────────────────────────────────────────────
CREATE POLICY crm_contatos_insert
  ON public.crm_contatos
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id()
  );

-- ── UPDATE ────────────────────────────────────────────────────
CREATE POLICY crm_contatos_update
  ON public.crm_contatos
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id()
    AND (
      time_id IS NULL
      OR
      responsavel_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.org_time_membros m
        WHERE m.time_id = crm_contatos.time_id
          AND m.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.org_cargos c ON c.id = u.cargo_id
        WHERE u.id = auth.uid()
          AND u.tenant_id = get_user_tenant_id()
          AND c.permissoes @> '["usuarios.gerenciar"]'::jsonb
      )
    )
  )
  WITH CHECK (
    tenant_id = get_user_tenant_id()
  );

-- ── DELETE ────────────────────────────────────────────────────
CREATE POLICY crm_contatos_delete
  ON public.crm_contatos
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id()
    AND (
      responsavel_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.org_cargos c ON c.id = u.cargo_id
        WHERE u.id = auth.uid()
          AND u.tenant_id = get_user_tenant_id()
          AND c.permissoes @> '["usuarios.gerenciar"]'::jsonb
      )
    )
  );

COMMENT ON TABLE public.crm_contatos IS
  'Contatos CRM (leads e clientes). RLS v2: contatos sem time_id são visíveis '
  'para todo o tenant; contatos com time_id são visíveis apenas para membros '
  'do time, responsável direto e Líderes Gerais (permissão usuarios.gerenciar).';
