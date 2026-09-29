-- =============================================================
-- PRANCHETO.IA - Forma de aquisição do lead + contadores dos silos
--
-- 1) forma_aquisicao (inbound/outbound): direção de como o lead chegou,
--    não confundir com "origem" (canal: site/anúncio/indicação/...).
--    Nullable — leads existentes não têm essa informação e não devem
--    ser forçados a um valor.
--
-- 2) leads_contadores_silos(): contadores dos tiles de filtro rápido da
--    aba Leads. Mesmo padrão de outbound_contadores (20260915040000):
--    sem SECURITY DEFINER, roda como o caller pra RLS de crm_contatos/
--    crm_interacoes se aplicar normalmente. Cada silo conta seu próprio
--    universo, independente do filtro ativo no cliente — é isso que
--    evita "zerar" os outros tiles ao trocar de aba.
-- =============================================================

ALTER TABLE public.crm_contatos ADD COLUMN IF NOT EXISTS forma_aquisicao text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_contatos_forma_aquisicao_check') THEN
    ALTER TABLE public.crm_contatos
      ADD CONSTRAINT crm_contatos_forma_aquisicao_check
      CHECK (forma_aquisicao IS NULL OR forma_aquisicao = ANY (ARRAY['inbound'::text, 'outbound'::text]));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.leads_contadores_silos()
RETURNS TABLE (silo text, total bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT 'todos'::text, count(*)::bigint
  FROM public.crm_contatos
  WHERE tipo_registro = 'lead'

  UNION ALL

  SELECT 'minhas'::text, count(*)::bigint
  FROM public.crm_contatos
  WHERE tipo_registro = 'lead'
    AND responsavel_id = auth.uid()

  UNION ALL

  SELECT 'sem_contato'::text, count(*)::bigint
  FROM public.crm_contatos c
  WHERE c.tipo_registro = 'lead'
    AND NOT EXISTS (
      SELECT 1 FROM public.crm_interacoes i WHERE i.contato_id = c.id
    )

  UNION ALL

  SELECT 'andamento'::text, count(*)::bigint
  FROM public.crm_contatos
  WHERE tipo_registro = 'lead'
    AND status_funil NOT IN ('fechado', 'perdido');
$$;

GRANT EXECUTE ON FUNCTION public.leads_contadores_silos() TO authenticated;

COMMENT ON FUNCTION public.leads_contadores_silos() IS 'Contadores dos silos de filtro da aba Leads (todos, minhas, sem_contato, andamento). "Criadas por últimos" não filtra linhas (mesmo universo de "todos"), então não tem silo próprio aqui.';
