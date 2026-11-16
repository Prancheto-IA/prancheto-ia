-- Migration: Tabela crm_empresas e relacionamento com crm_contatos (B2B Accounts)
-- Prancheto.IA - Gestão de Empresas e Contas Comerciais

CREATE TABLE IF NOT EXISTS public.crm_empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome_fantasia text NOT NULL,
  razao_social text,
  cnpj text,
  logotipo_url text,
  segmento text,
  porte text CHECK (porte IS NULL OR porte IN ('mei', 'micro', 'pequena', 'media', 'grande')),
  site text,
  email_geral text,
  telefone_geral text,
  whatsapp_geral text,
  endereco jsonb NOT NULL DEFAULT '{"cep":"","logradouro":"","numero":"","complemento":"","bairro":"","cidade":"","estado":""}'::jsonb,
  responsavel_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text DEFAULT 'prospect' CHECK (status IN ('prospect', 'cliente_ativo', 'em_risco', 'churn', 'parceiro')),
  health_score integer DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  observacoes text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_crm_empresas_tenant ON public.crm_empresas (tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_empresas_cnpj ON public.crm_empresas (tenant_id, cnpj);
CREATE INDEX IF NOT EXISTS idx_crm_empresas_status ON public.crm_empresas (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_empresas_responsavel ON public.crm_empresas (responsavel_id);

-- Ativar RLS
ALTER TABLE public.crm_empresas ENABLE ROW LEVEL SECURITY;

-- Política de RLS para empresas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'crm_empresas' AND policyname = 'crm_empresas_tenant_or_owner'
  ) THEN
    CREATE POLICY "crm_empresas_tenant_or_owner" ON public.crm_empresas
    FOR ALL
    USING (
      tenant_id = public.get_user_tenant_id()
      OR responsavel_id = auth.uid()
    );
  END IF;
END $$;

-- Adiciona campos de relacionamento em crm_contatos
ALTER TABLE public.crm_contatos
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.crm_empresas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS papel_decisao text DEFAULT 'influenciador';

CREATE INDEX IF NOT EXISTS idx_crm_contatos_empresa_id ON public.crm_contatos (empresa_id);

-- Comentários descritivos
COMMENT ON TABLE public.crm_empresas IS 'Empresas/Contas corporativas B2B cadastradas no CRM.';
COMMENT ON COLUMN public.crm_empresas.nome_fantasia IS 'Nome fantasia / marca comercial da empresa.';
COMMENT ON COLUMN public.crm_empresas.endereco IS 'Endereço estruturado: {cep, logradouro, numero, complemento, bairro, cidade, estado}.';
COMMENT ON COLUMN public.crm_contatos.empresa_id IS 'Vínculo com a empresa (crm_empresas). O campo texto empresa permanece como fallback.';
COMMENT ON COLUMN public.crm_contatos.papel_decisao IS 'Papel do contato na organização: decisor, influenciador, financeiro, tecnico, operacional.';

