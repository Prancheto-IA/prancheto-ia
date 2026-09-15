-- Migration: novos campos de Negócio, Contato e Empresa em crm_contatos
-- (Bloco 1, item 2). Segue o padrão de extensão em lote já usado em
-- migrations_legado/010_fase2_expand_crm_contatos.sql: colunas nullable,
-- sem quebrar linhas existentes. Campos que já existiam (valor_estimado,
-- origem, responsavel_id, observacoes, nome, telefone, email) não são
-- duplicados.

-- Negócio
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS negocio_nome text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS previsao_fechamento timestamptz;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS campanha text;

-- Contato
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS whatsapp text;

-- Empresa ("empresa" já existente passa a representar o nome fantasia;
-- razao_social é o nome jurídico)
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS documento text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS segmento text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS site text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS porte text;
ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS endereco jsonb NOT NULL DEFAULT '{}';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_contatos_porte_check'
  ) THEN
    ALTER TABLE public.crm_contatos
      ADD CONSTRAINT crm_contatos_porte_check
      CHECK (porte IS NULL OR porte = ANY (ARRAY['mei'::text, 'micro'::text, 'pequena'::text, 'media'::text, 'grande'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.crm_contatos.empresa IS 'Nome fantasia da empresa. Nome jurídico completo fica em razao_social.';
COMMENT ON COLUMN public.crm_contatos.documento IS 'CNPJ ou CPF, sem formatação/máscara obrigatória no banco.';
COMMENT ON COLUMN public.crm_contatos.endereco IS 'Endereço estruturado: {cep, logradouro, numero, complemento, bairro, cidade, estado}.';
COMMENT ON COLUMN public.crm_contatos.porte IS 'Porte da empresa: mei, micro, pequena, media ou grande.';
