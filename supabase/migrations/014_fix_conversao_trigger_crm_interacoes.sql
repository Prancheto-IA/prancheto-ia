-- =============================================================
-- FASE 2 — Migration 014: Corrige gatilho de conversão Lead→Cliente
--
-- BUG: A função trigger_processar_conversao_lead (migration 013)
--      inseria a coluna `tenant_id` em crm_interacoes, mas essa
--      tabela NÃO possui tal coluna (o isolamento de tenant é
--      derivado do contato pai via RLS — ver política
--      crm_interacoes_parent_access na migration 001).
--
--      Como o corpo de funções plpgsql só é validado em runtime, a
--      migration 013 foi aplicada sem erro, porém TODA conversão
--      falhava com "column tenant_id of relation crm_interacoes does
--      not exist", abortando a transação e revertendo o UPDATE — o
--      lead nunca era convertido em cliente.
--
-- FIX: Recria a função removendo `tenant_id` do INSERT em
--      crm_interacoes. O INSERT em notificacoes mantém tenant_id,
--      pois aquela tabela possui a coluna (migration 012).
-- =============================================================

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
    --     (crm_interacoes NÃO tem tenant_id — deriva do contato pai)
    INSERT INTO public.crm_interacoes (
      contato_id, criado_por, tipo, conteudo, metadata
    ) VALUES (
      NEW.id,
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
    IF v_responsavel_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
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
    IF NEW.time_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
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

-- O trigger trg_conversao_lead (migration 013) continua válido —
-- apenas o corpo da função foi corrigido via CREATE OR REPLACE.
