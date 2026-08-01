-- =============================================================
-- FASE 1: Tabelas org_times e org_time_membros
-- Times da organização e seus membros.
-- Aplicada via MCP em 2026-07-11.
-- =============================================================

-- Tabela de times
CREATE TABLE IF NOT EXISTS public.org_times (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome          TEXT        NOT NULL,
  descricao     TEXT,
  icone         TEXT        NOT NULL DEFAULT '👥',
  cor_primaria  TEXT        NOT NULL DEFAULT '#6366f1',
  cor_texto     TEXT        NOT NULL DEFAULT '#ffffff',
  criado_por    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, nome)
);

-- Tabela de membros de time
CREATE TABLE IF NOT EXISTS public.org_time_membros (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  time_id   UUID        NOT NULL REFERENCES public.org_times(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cargo_id  UUID        REFERENCES public.org_cargos(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(time_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.org_times        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_time_membros ENABLE ROW LEVEL SECURITY;

-- Policies: org_times
CREATE POLICY "org_times_select" ON public.org_times
FOR SELECT
USING (
  tenant_id IN (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo = 'super_admin')
);

CREATE POLICY "org_times_write" ON public.org_times
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND tenant_id = org_times.tenant_id
      AND cargo = ANY(ARRAY['admin', 'super_admin'])
  )
  OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND cargo = 'super_admin'
  )
);

-- Policies: org_time_membros
CREATE POLICY "org_time_membros_select" ON public.org_time_membros
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.org_times t
    JOIN public.users u ON u.tenant_id = t.tenant_id
    WHERE t.id = org_time_membros.time_id AND u.id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo = 'super_admin')
);

CREATE POLICY "org_time_membros_write" ON public.org_time_membros
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.org_times t
    JOIN public.users u ON u.tenant_id = t.tenant_id
    WHERE t.id = org_time_membros.time_id
      AND u.id = auth.uid()
      AND u.cargo = ANY(ARRAY['admin', 'super_admin'])
  )
  OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND cargo = 'super_admin')
);
