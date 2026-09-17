-- Migration: sincroniza outbound_acoes.status -> crm_contatos.status_funil
-- (Bloco 1, item 3). Segue o mesmo padrão de trigger_atualizar_score_lead
-- e trigger_processar_conversao_lead: função SECURITY DEFINER (o autor da
-- ação de outbound pode não ter UPDATE direto no contato via RLS) chamada
-- por um trigger AFTER UPDATE OF status.
--
-- Mapeamento (validado com o time):
--   pendente     -> nada (estado inicial)
--   enviado      -> qualificado, só se o contato ainda estiver em 'lead'
--   respondido   -> qualificado, se estiver em 'lead' ou 'qualificado'
--                   ("proposta" só é setado manualmente no CRM quando o
--                   vendedor de fato formaliza uma proposta)
--   sem_retorno  -> perdido
--   convertido   -> fechado + tipo_registro='cliente' (reaproveita o
--                   trg_conversao_lead já existente, que dispara sozinho
--                   ao ver tipo_registro mudar de lead para cliente)
--
-- Regra de não regressão: uma vez que o contato já virou cliente ou está
-- em estágio terminal (fechado/perdido), outbound não mexe mais nele —
-- exceto 'convertido', que é sempre aplicado (idempotente).

CREATE OR REPLACE FUNCTION public.trigger_sincronizar_funil_outbound() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_funil_atual text;
  v_tipo_atual  text;
BEGIN
  IF NEW.contato_id IS NULL OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT status_funil, tipo_registro INTO v_funil_atual, v_tipo_atual
  FROM public.crm_contatos
  WHERE id = NEW.contato_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'convertido' THEN
    UPDATE public.crm_contatos
    SET
      status_funil  = 'fechado',
      tipo_registro = 'cliente',
      convertido_em  = COALESCE(convertido_em, now()),
      convertido_por = COALESCE(convertido_por, NEW.user_id),
      atualizado_em  = now()
    WHERE id = NEW.contato_id;
    RETURN NEW;
  END IF;

  -- Estágio terminal ou já cliente: outbound não regride o funil.
  IF v_tipo_atual = 'cliente' OR v_funil_atual IN ('fechado', 'perdido') THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'enviado' THEN
      IF v_funil_atual = 'lead' THEN
        UPDATE public.crm_contatos SET status_funil = 'qualificado', atualizado_em = now() WHERE id = NEW.contato_id;
      END IF;
    WHEN 'respondido' THEN
      IF v_funil_atual IN ('lead', 'qualificado') THEN
        UPDATE public.crm_contatos SET status_funil = 'qualificado', atualizado_em = now() WHERE id = NEW.contato_id;
      END IF;
    WHEN 'sem_retorno' THEN
      UPDATE public.crm_contatos SET status_funil = 'perdido', atualizado_em = now() WHERE id = NEW.contato_id;
    ELSE
      NULL; -- 'pendente' não sincroniza
  END CASE;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_outbound_sincroniza_funil
  AFTER UPDATE OF status ON public.outbound_acoes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sincronizar_funil_outbound();
