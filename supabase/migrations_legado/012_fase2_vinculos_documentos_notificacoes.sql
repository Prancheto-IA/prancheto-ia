-- =============================================================
-- FASE 2 — Migration 012: Vínculos entre Times, Documentos e Notificações
-- Tabelas: crm_vinculos_times + crm_documentos + notificacoes
-- =============================================================

-- 1. Vínculos entre registros de times diferentes
CREATE TABLE IF NOT EXISTS public.crm_vinculos_times (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contato_id      UUID        NOT NULL REFERENCES public.crm_contatos(id) ON DELETE CASCADE,
  time_origem_id  UUID        NOT NULL REFERENCES public.org_times(id) ON DELETE CASCADE,
  time_destino_id UUID        NOT NULL REFERENCES public.org_times(id) ON DELETE CASCADE,
  tipo_vinculo    TEXT        NOT NULL DEFAULT 'referencia'
                              CHECK (tipo_vinculo IN ('referencia', 'transferencia', 'colaboracao')),
  metadados       JSONB       NOT NULL DEFAULT '{}',
  criado_por      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contato_id, time_origem_id, time_destino_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_vinculos_contato
  ON public.crm_vinculos_times (contato_id);

CREATE INDEX IF NOT EXISTS idx_crm_vinculos_time_destino
  ON public.crm_vinculos_times (tenant_id, time_destino_id);

-- 2. Documentos/anexos vinculados a contatos
CREATE TABLE IF NOT EXISTS public.crm_documentos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contato_id  UUID        NOT NULL REFERENCES public.crm_contatos(id) ON DELETE CASCADE,
  nome        TEXT        NOT NULL,
  tipo        TEXT        NOT NULL DEFAULT 'outro'
              CHECK (tipo IN ('contrato', 'proposta', 'nf', 'outro')),
  url         TEXT        NOT NULL,   -- Supabase Storage URL
  mime_type   TEXT,                   -- ex: 'application/pdf', 'image/png'
  tamanho_kb  INTEGER,
  criado_por  UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_documentos_contato
  ON public.crm_documentos (contato_id);

-- 3. Notificações (para conversão Lead→Cliente e outros eventos)
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tipo        TEXT        NOT NULL DEFAULT 'info'
              CHECK (tipo IN ('info', 'sucesso', 'alerta', 'erro', 'conversao', 'vinculo')),
  titulo      TEXT        NOT NULL,
  mensagem    TEXT,
  lida        BOOLEAN     NOT NULL DEFAULT false,
  link        TEXT,                   -- rota interna: '/crm/clientes/uuid'
  metadata    JSONB       NOT NULL DEFAULT '{}',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_user
  ON public.notificacoes (user_id, lida, criado_em DESC);

-- 4. RLS — crm_vinculos_times
ALTER TABLE public.crm_vinculos_times ENABLE ROW LEVEL SECURITY;

-- Vínculo visível para todos do tenant (existência é pública dentro do tenant)
CREATE POLICY crm_vinculos_select ON public.crm_vinculos_times
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Escrita: membro do time de origem OU destino, ou admin
CREATE POLICY crm_vinculos_write ON public.crm_vinculos_times
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.tenant_id = crm_vinculos_times.tenant_id
        AND u.cargo IN ('admin', 'super_admin')
    )
    OR EXISTS (
      SELECT 1 FROM public.org_time_membros m
      WHERE m.user_id = auth.uid()
        AND m.time_id IN (crm_vinculos_times.time_origem_id, crm_vinculos_times.time_destino_id)
    )
  );

-- 5. RLS — crm_documentos
ALTER TABLE public.crm_documentos ENABLE ROW LEVEL SECURITY;

-- Acesso via contato pai
CREATE POLICY crm_documentos_parent_access ON public.crm_documentos
  FOR ALL USING (
    contato_id IN (
      SELECT id FROM public.crm_contatos
      WHERE tenant_id = get_user_tenant_id()
         OR responsavel_id = auth.uid()
    )
  );

-- 6. RLS — notificacoes
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas suas próprias notificações
CREATE POLICY notificacoes_own ON public.notificacoes
  FOR ALL USING (user_id = auth.uid());
