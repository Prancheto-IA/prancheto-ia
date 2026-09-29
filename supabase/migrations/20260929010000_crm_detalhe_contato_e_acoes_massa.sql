-- =============================================================
-- PRANCHETO.IA - Página cheia de contato: histórico de status + arquivos
--
-- 1) crm_interacoes ganha o tipo 'mudanca_status' — hoje nenhum mecanismo
--    loga uma troca de etapa do funil como interação (só a conversão
--    lead->cliente é logada, via trg_conversao_lead, que dispara em
--    UPDATE OF tipo_registro, não de status_funil). A aba Histórico da
--    página cheia de Lead/Cliente precisa mostrar "quem moveu e quando"
--    pra troca de etapa também.
--
-- 2) Bucket de Storage para a aba "Arquivos" (crm_documentos.url passa a
--    também aceitar um caminho interno deste bucket, além do link
--    externo legado — sem coluna nova, só uma convenção de leitura no
--    frontend: começa com "http" = link externo, senão = caminho interno).
--    Convenção de caminho: {contato_id}/{timestamp}-{filename}.
-- =============================================================

ALTER TABLE "public"."crm_interacoes"
  DROP CONSTRAINT IF EXISTS "crm_interacoes_tipo_check";

ALTER TABLE "public"."crm_interacoes"
  ADD CONSTRAINT "crm_interacoes_tipo_check"
  CHECK (("tipo" = ANY (ARRAY[
    'nota'::"text", 'ligacao'::"text", 'email'::"text", 'reuniao'::"text",
    'whatsapp'::"text", 'outro'::"text", 'conversao'::"text",
    'mudanca_status'::"text"
  ])));

INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-documentos', 'crm-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Mesmo predicado de crm_documentos_parent_access (tenant OU responsavel_id
-- do crm_contatos dono do arquivo) — só espelhado pro objeto no Storage.
DROP POLICY IF EXISTS "crm_documentos_storage_select" ON storage.objects;
CREATE POLICY "crm_documentos_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'crm-documentos'
    AND EXISTS (
      SELECT 1 FROM public.crm_contatos c
      WHERE c.id = (storage.foldername(name))[1]::uuid
        AND (c.tenant_id = public.get_user_tenant_id() OR c.responsavel_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "crm_documentos_storage_insert" ON storage.objects;
CREATE POLICY "crm_documentos_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'crm-documentos'
    AND EXISTS (
      SELECT 1 FROM public.crm_contatos c
      WHERE c.id = (storage.foldername(name))[1]::uuid
        AND (c.tenant_id = public.get_user_tenant_id() OR c.responsavel_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "crm_documentos_storage_delete" ON storage.objects;
CREATE POLICY "crm_documentos_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'crm-documentos'
    AND EXISTS (
      SELECT 1 FROM public.crm_contatos c
      WHERE c.id = (storage.foldername(name))[1]::uuid
        AND (c.tenant_id = public.get_user_tenant_id() OR c.responsavel_id = auth.uid())
    )
  );
