-- =============================================================
-- FASE 2 — Migration 010: Expandir crm_contatos
-- Adiciona: tipo_registro, score, origem_detalhes,
--           convertido_em/por, time_id, ltv, contratos
-- =============================================================

-- 1. Tipo de registro: lead ou cliente
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS tipo_registro TEXT NOT NULL DEFAULT 'lead'
  CHECK (tipo_registro IN ('lead', 'cliente'));

-- 2. Lead Scoring
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS score_historico JSONB NOT NULL DEFAULT '[]';
-- Formato: [{"data": "2024-01-01T10:00:00Z", "delta": 10, "motivo": "reuniao"}]

-- 3. Rastreio de origem detalhado
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS origem_detalhes JSONB NOT NULL DEFAULT '{}';
-- Formato: {"canal": "formulario", "utm_source": "google", "utm_campaign": "black-friday"}

-- 4. Conversão Lead → Cliente
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS convertido_em TIMESTAMPTZ;

ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS convertido_por UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. Vínculo com time (para relacionamentos entre times)
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS time_id UUID REFERENCES public.org_times(id) ON DELETE SET NULL;

-- 6. Dados de cliente (pós-conversão)
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS ltv NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS data_inicio_contrato TIMESTAMPTZ;

ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS data_fim_contrato TIMESTAMPTZ;

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_contatos_tipo_registro
  ON public.crm_contatos (tenant_id, tipo_registro);

CREATE INDEX IF NOT EXISTS idx_crm_contatos_time_id
  ON public.crm_contatos (time_id)
  WHERE time_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_contatos_score
  ON public.crm_contatos (tenant_id, score DESC);
