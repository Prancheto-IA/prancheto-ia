-- =============================================================
-- FASE 2 — Migration 013: Expandir crm_interacoes + Triggers
-- - Adiciona time_id e metadata em crm_interacoes
-- - Trigger de lead scoring automático por interação
-- - Trigger de conversão Lead→Cliente (interação + notificação)
-- =============================================================

-- 1. Expandir crm_interacoes
ALTER TABLE public.crm_interacoes
  ADD COLUMN IF NOT EXISTS time_id  UUID REFERENCES public.org_times(id) ON DELETE SET NULL;

ALTER TABLE public.crm_interacoes
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
-- metadata: {"duracao_min": 15, "resultado": "positivo", "proximo_passo": "enviar proposta"}

-- Adicionar tipo 'conversao' ao check existente
ALTER TABLE public.crm_interacoes
  DROP CONSTRAINT IF EXISTS crm_interacoes_tipo_check;

ALTER TABLE public.crm_interacoes
  ADD CONSTRAINT crm_interacoes_tipo_check
  CHECK (tipo IN ('nota', 'ligacao', 'email', 'reuniao', 'whatsapp', 'outro', 'conversao'));

CREATE INDEX IF NOT EXISTS idx_crm_interacoes_time
  ON public.crm_interacoes (time_id)
  WHERE time_id IS NOT NULL;

-- 2. Função: calcular delta de score por tipo de interação
CREATE OR REPLACE FUNCTION public.score_delta_por_tipo(p_tipo TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN CASE p_tipo
    WHEN 'nota'      THEN 5
    WHEN 'email'     THEN 10
    WHEN 'whatsapp'  THEN 10
    WHEN 'ligacao'   THEN 15
    WHEN 'reuniao'   THEN 25
    WHEN 'conversao' THEN 0   -- conversão não pontua (é evento de estado)
    ELSE 5
  END;
END;
$$;

-- 3. Trigger: atualizar score do contato ao inserir interação
CREATE OR REPLACE FUNCTION public.trigger_atualizar_score_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  -- Só pontua se o contato ainda é lead
  IF NOT EXISTS (
    SELECT 1 FROM public.crm_contatos
    WHERE id = NEW.contato_id AND tipo_registro = 'lead'
  ) THEN
    RETURN NEW;
  END IF;

  v_delta := public.score_delta_por_tipo(NEW.tipo);

  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.crm_contatos
  SET
    score = score + v_delta,
    score_historico = score_historico || jsonb_build_object(
      'data',   to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'delta',  v_delta,
      'motivo', NEW.tipo,
      'interacao_id', NEW.id
    ),
    atualizado_em = now()
  WHERE id = NEW.contato_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_score_lead ON public.crm_interacoes;
CREATE TRIGGER trg_score_lead
  AFTER INSERT ON public.crm_interacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_atualizar_score_lead();

-- 4. Função: processar conversão Lead → Cliente
-- Chamada quando tipo_registro muda de 'lead' para 'cliente'
CREATE OR REPLACE FUNCTION public.trigger_processar_conversao_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_responsavel_id UUID;
  v_tenant_id      UUID;
  v_nome_contato   TEXT;
BEGIN
  -- Só age quando tipo_registro muda de 'lead' para 'cliente'
  IF OLD.tipo_registro = 'lead' AND NEW.tipo_registro = 'cliente' THEN

    v_responsavel_id := NEW.responsavel_id;
    v_tenant_id      := NEW.tenant_id;
    v_nome_contato   := NEW.nome;

    -- 4a. Registrar interação automática de conversão
    INSERT INTO public.crm_interacoes (
      contato_id, tenant_id, criado_por, tipo, conteudo, metadata
    ) VALUES (
      NEW.id,
      v_tenant_id,
      NEW.convertido_por,
      'conversao',
      'Lead convertido para Cliente.',
      jsonb_build_object(
        'convertido_por', NEW.convertido_por,
        'convertido_em',  to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'score_final',    NEW.score
      )
    );

    -- 4b. Notificar o responsável pelo contato (se existir)
    IF v_responsavel_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (
        tenant_id, user_id, tipo, titulo, mensagem, link, metadata
      ) VALUES (
        v_tenant_id,
        v_responsavel_id,
        'conversao',
        'Lead convertido: ' || v_nome_contato,
        v_nome_contato || ' foi convertido de Lead para Cliente.',
        '/crm/clientes/' || NEW.id::text,
        jsonb_build_object('contato_id', NEW.id, 'score_final', NEW.score)
      );
    END IF;

    -- 4c. Notificar membros do time vinculado (se houver time_id)
    IF NEW.time_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, link, metadata)
      SELECT
        v_tenant_id,
        m.user_id,
        'conversao',
        'Lead convertido: ' || v_nome_contato,
        v_nome_contato || ' foi convertido para Cliente no seu time.',
        '/crm/clientes/' || NEW.id::text,
        jsonb_build_object('contato_id', NEW.id, 'time_id', NEW.time_id)
      FROM public.org_time_membros m
      WHERE m.time_id = NEW.time_id
        AND m.user_id != COALESCE(v_responsavel_id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_conversao_lead ON public.crm_contatos;
CREATE TRIGGER trg_conversao_lead
  AFTER UPDATE OF tipo_registro ON public.crm_contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_processar_conversao_lead();
