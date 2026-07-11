-- =============================================================
-- FASE 1: Tabela org_cargos
-- Cargos customizáveis por organização com permissões granulares.
-- Aplicada via MCP em 2026-07-11.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.org_cargos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  permissoes    JSONB       NOT NULL DEFAULT '[]'::jsonb,
  e_padrao      BOOLEAN     NOT NULL DEFAULT false,
  e_sistema     BOOLEAN     NOT NULL DEFAULT false,
  ordem         INTEGER     NOT NULL DEFAULT 0,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, nome)
);

-- Habilitar RLS
ALTER TABLE public.org_cargos ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT — mesmo tenant ou super_admin
CREATE POLICY "org_cargos_select" ON public.org_cargos
FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo = 'super_admin')
);

-- Policy: ALL (INSERT/UPDATE/DELETE) — admin do mesmo tenant ou super_admin
CREATE POLICY "org_cargos_write" ON public.org_cargos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND tenant_id = org_cargos.tenant_id
      AND cargo = ANY(ARRAY['admin', 'super_admin'])
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND cargo = 'super_admin'
  )
);
