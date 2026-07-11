-- =============================================================
-- FASE 2 — Migration 011: Campos Customizados ("Campos Lego")
-- Tabelas: crm_campos_customizados + crm_valores_customizados
-- =============================================================

-- 1. Definição dos campos customizados por time/módulo
CREATE TABLE IF NOT EXISTS public.crm_campos_customizados (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  time_id       UUID        REFERENCES public.org_times(id) ON DELETE CASCADE,
  modulo        TEXT        NOT NULL DEFAULT 'crm'
                            CHECK (modulo IN ('crm', 'agenda', 'outbound')),
  nome          TEXT        NOT NULL,   -- slug interno: 'valor_proposta'
  label         TEXT        NOT NULL,   -- exibição: 'Valor da Proposta'
  tipo          TEXT        NOT NULL DEFAULT 'text'
                            CHECK (tipo IN ('text','number','date','boolean','select','multiselect','url','email')),
  opcoes        JSONB       NOT NULL DEFAULT '[]',  -- para select/multiselect: ["Opção A","Opção B"]
  obrigatorio   BOOLEAN     NOT NULL DEFAULT false,
  ordem         INTEGER     NOT NULL DEFAULT 0,
  ativo         BOOLEAN     NOT NULL DEFAULT true,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CORREÇÃO: UNIQUE para time_id NULL (PostgreSQL trata NULL != NULL em UNIQUE)
-- Campos globais (time_id IS NULL): unicidade por (tenant_id, modulo, nome) quando time_id é NULL
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_campos_global_unique
  ON public.crm_campos_customizados (tenant_id, modulo, nome)
  WHERE time_id IS NULL;

-- Campos de time (time_id IS NOT NULL): unicidade por (tenant_id, time_id, modulo, nome)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_campos_time_unique
  ON public.crm_campos_customizados (tenant_id, time_id, modulo, nome)
  WHERE time_id IS NOT NULL;

-- Índice para listagem por time
CREATE INDEX IF NOT EXISTS idx_crm_campos_time_id
  ON public.crm_campos_customizados (tenant_id, time_id, modulo, ordem);

-- 2. Valores dos campos customizados por registro
CREATE TABLE IF NOT EXISTS public.crm_valores_customizados (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id      UUID        NOT NULL REFERENCES public.crm_campos_customizados(id) ON DELETE CASCADE,
  contato_id    UUID        NOT NULL REFERENCES public.crm_contatos(id) ON DELETE CASCADE,
  tenant_id     UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  valor         TEXT,                   -- para tipos simples (text, number, date, boolean, url, email)
  valor_json    JSONB,                  -- para multiselect e tipos complexos
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campo_id, contato_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_valores_contato
  ON public.crm_valores_customizados (contato_id, campo_id);

-- 3. RLS — crm_campos_customizados
ALTER TABLE public.crm_campos_customizados ENABLE ROW LEVEL SECURITY;

-- Todos do tenant podem ver os campos
CREATE POLICY crm_campos_select ON public.crm_campos_customizados
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Apenas admin/super_admin ou membro do time podem criar/editar/excluir
CREATE POLICY crm_campos_write ON public.crm_campos_customizados
  FOR ALL USING (
    -- admin ou super_admin do tenant
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.tenant_id = crm_campos_customizados.tenant_id
        AND u.cargo IN ('admin', 'super_admin')
    )
    OR
    -- membro do time ao qual o campo pertence (quando time_id não é NULL)
    (
      crm_campos_customizados.time_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.org_time_membros m
        WHERE m.time_id = crm_campos_customizados.time_id
          AND m.user_id = auth.uid()
      )
    )
  );

-- 4. RLS — crm_valores_customizados
ALTER TABLE public.crm_valores_customizados ENABLE ROW LEVEL SECURITY;

-- Acesso via contato pai (mesmo padrão de crm_interacoes_parent_access)
CREATE POLICY crm_valores_parent_access ON public.crm_valores_customizados
  FOR ALL USING (
    contato_id IN (
      SELECT id FROM public.crm_contatos
      WHERE tenant_id = get_user_tenant_id()
         OR responsavel_id = auth.uid()
    )
  );
