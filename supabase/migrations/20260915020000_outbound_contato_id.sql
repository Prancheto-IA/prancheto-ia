-- Migration: vincula outbound_acoes a crm_contatos (Bloco 1, item 3).
-- outbound_acoes nunca teve FK para crm_contatos — guardava só
-- contato_nome/contato_email/contato_telefone como texto solto. Sem esse
-- vínculo não há como o trigger de sincronização de funil saber qual
-- contato atualizar.

ALTER TABLE public.outbound_acoes
  ADD COLUMN IF NOT EXISTS contato_id uuid REFERENCES public.crm_contatos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_outbound_contato_id
  ON public.outbound_acoes (contato_id)
  WHERE contato_id IS NOT NULL;

-- Backfill best-effort: liga ações antigas a um contato do CRM quando
-- existe exatamente um contato do mesmo tenant com o mesmo e-mail. Ações
-- sem correspondência única ficam com contato_id nulo — o trigger de
-- sincronização simplesmente as ignora (prospecção sem vínculo).
UPDATE public.outbound_acoes oa
SET contato_id = c.id
FROM public.crm_contatos c
WHERE oa.contato_id IS NULL
  AND oa.contato_email IS NOT NULL
  AND c.tenant_id = oa.tenant_id
  AND lower(c.email) = lower(oa.contato_email)
  AND (
    SELECT count(*) FROM public.crm_contatos c2
    WHERE c2.tenant_id = oa.tenant_id AND lower(c2.email) = lower(oa.contato_email)
  ) = 1;

COMMENT ON COLUMN public.outbound_acoes.contato_id IS 'Vínculo opcional com crm_contatos. Quando presente, mudanças de status disparam trigger_sincronizar_funil_outbound para atualizar o funil do contato automaticamente.';
