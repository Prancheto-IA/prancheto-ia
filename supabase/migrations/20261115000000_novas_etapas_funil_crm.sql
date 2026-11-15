-- Migration: Atualizar etapas do funil CRM para:
-- nao_chamei, chamei, chamar_novamente, deu_bom, deu_ruim

ALTER TABLE public.crm_contatos
  DROP CONSTRAINT IF EXISTS crm_contatos_status_funil_check;

UPDATE public.crm_contatos
SET status_funil = CASE status_funil
  WHEN 'lead'        THEN 'nao_chamei'
  WHEN 'qualificado' THEN 'chamei'
  WHEN 'proposta'    THEN 'chamei'
  WHEN 'negociacao'  THEN 'chamar_novamente'
  WHEN 'fechado'     THEN 'deu_bom'
  WHEN 'perdido'     THEN 'deu_ruim'
  ELSE status_funil
END
WHERE status_funil IN ('lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido');

ALTER TABLE public.crm_contatos
  ALTER COLUMN status_funil SET DEFAULT 'nao_chamei';

ALTER TABLE public.crm_contatos
  ADD CONSTRAINT crm_contatos_status_funil_check
  CHECK (status_funil = ANY (ARRAY[
    'nao_chamei'::text,
    'chamei'::text,
    'chamar_novamente'::text,
    'deu_bom'::text,
    'deu_ruim'::text,
    'lead'::text,
    'qualificado'::text,
    'proposta'::text,
    'negociacao'::text,
    'fechado'::text,
    'perdido'::text
  ]));

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
      status_funil   = 'deu_bom',
      tipo_registro  = 'cliente',
      convertido_em  = COALESCE(convertido_em, now()),
      convertido_por = COALESCE(convertido_por, NEW.user_id),
      atualizado_em  = now()
    WHERE id = NEW.contato_id;
    RETURN NEW;
  END IF;

  -- Estágio terminal ou já cliente: outbound não regride o funil.
  IF v_tipo_atual = 'cliente' OR v_funil_atual IN ('deu_bom', 'deu_ruim', 'fechado', 'perdido') THEN
    RETURN NEW;
  END IF;

  CASE NEW.status
    WHEN 'enviado' THEN
      IF v_funil_atual IN ('nao_chamei', 'lead') THEN
        UPDATE public.crm_contatos SET status_funil = 'chamei', atualizado_em = now() WHERE id = NEW.contato_id;
      END IF;
    WHEN 'respondido' THEN
      IF v_funil_atual IN ('nao_chamei', 'chamei', 'lead', 'qualificado') THEN
        UPDATE public.crm_contatos SET status_funil = 'chamei', atualizado_em = now() WHERE id = NEW.contato_id;
      END IF;
    WHEN 'sem_retorno' THEN
      UPDATE public.crm_contatos SET status_funil = 'deu_ruim', atualizado_em = now() WHERE id = NEW.contato_id;
    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$;

