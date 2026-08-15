-- =============================================================
-- ASSISTENTE DE IA COM ACAO NO CRM
--
-- O chat de hoje so troca texto: uma pergunta, uma resposta. Para o
-- assistente agir, a conversa precisa guardar mais do que isso —
-- precisa guardar a chamada de ferramenta que o modelo pediu, o
-- resultado que o banco devolveu, e as acoes que ficaram esperando
-- o usuario confirmar.
--
-- Duas mudancas:
--
-- 1. ai_messages aceita remetente 'tool'. Sem isso nao da para
--    reconstruir a conversa no formato que a OpenAI exige: toda
--    chamada de ferramenta tem que ter a resposta dela na sequencia,
--    ou a proxima requisicao e recusada.
--
-- 2. ai_acoes registra o que o assistente propos. Serve a dois donos:
--    o cartao de confirmacao na tela le daqui, e a auditoria tambem —
--    fica gravado o que foi proposto, o que foi recusado, e o que de
--    fato executou.
--
-- O que NAO esta aqui, de proposito: nenhuma permissao nova. O
-- assistente age como o usuario que conversa com ele, pelo mesmo JWT,
-- entao RLS e org_cargos.permissoes ja decidem o que ele alcanca.
-- Uma permissao 'assistente.*' criaria uma segunda fonte de verdade
-- para a mesma pergunta.
-- =============================================================


-- -------------------------------------------------------------
-- 1. PAPEL 'tool' NAS MENSAGENS
-- -------------------------------------------------------------
ALTER TABLE public.ai_messages
  DROP CONSTRAINT IF EXISTS ai_messages_remetente_check;

ALTER TABLE public.ai_messages
  ADD CONSTRAINT ai_messages_remetente_check
  CHECK (remetente = ANY (ARRAY['user'::text, 'assistant'::text, 'tool'::text]));

COMMENT ON COLUMN public.ai_messages.metadata IS
  'Para remetente=assistant, guarda tool_calls quando o modelo pediu ferramenta. Para remetente=tool, guarda tool_call_id e a ferramenta executada. E o que permite remontar a conversa no formato da OpenAI.';


-- -------------------------------------------------------------
-- 2. ACOES PROPOSTAS PELO ASSISTENTE
--
-- status:
--   pendente  — proposta, esperando o usuario
--   executada — confirmada e gravada no CRM
--   recusada  — o usuario descartou
--   falhou    — confirmada, mas o banco recusou (RLS, validacao)
--
-- 'falhou' e separado de 'recusada' porque as duas pedem conversas
-- diferentes: uma e decisao do usuario, a outra e problema a resolver.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_acoes (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    tenant_id       uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tool_call_id    text NOT NULL,
    ferramenta      text NOT NULL,
    argumentos      jsonb NOT NULL DEFAULT '{}'::jsonb,
    resumo          text NOT NULL,
    status          text NOT NULL DEFAULT 'pendente',
    resultado       jsonb,
    erro            text,
    criado_em       timestamp with time zone NOT NULL DEFAULT now(),
    resolvido_em    timestamp with time zone,
    CONSTRAINT ai_acoes_status_check
      CHECK (status = ANY (ARRAY['pendente'::text, 'executada'::text, 'recusada'::text, 'falhou'::text]))
);

ALTER TABLE public.ai_acoes OWNER TO postgres;

COMMENT ON TABLE public.ai_acoes IS
  'Acoes que o assistente de IA propos no CRM. Alimenta o cartao de confirmacao na conversa e serve de trilha do que a IA fez.';

COMMENT ON COLUMN public.ai_acoes.tool_call_id IS
  'Id da chamada de ferramenta na resposta da OpenAI. E por ele que a execucao volta a conversa no lugar certo.';

COMMENT ON COLUMN public.ai_acoes.resumo IS
  'Frase curta, em portugues, do que a acao faz. Escrita no servidor e nao pelo modelo: o cartao de confirmacao precisa dizer a verdade sobre o que vai acontecer, e nao o que o modelo diz que vai acontecer.';

CREATE INDEX IF NOT EXISTS idx_ai_acoes_conversa
  ON public.ai_acoes USING btree (conversation_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_ai_acoes_pendentes
  ON public.ai_acoes USING btree (conversation_id)
  WHERE status = 'pendente';


-- -------------------------------------------------------------
-- 3. RLS
--
-- Mesma regra de ai_messages: pertence a quem e dono da conversa.
-- Sem WITH CHECK proprio, o Postgres reaproveita o USING no INSERT,
-- que e o comportamento desejado aqui.
-- -------------------------------------------------------------
ALTER TABLE public.ai_acoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_acoes_owner" ON public.ai_acoes;
CREATE POLICY "ai_acoes_owner" ON public.ai_acoes
    USING (conversation_id IN (
      SELECT c.id FROM public.ai_conversations c WHERE c.user_id = auth.uid()
    ));

GRANT ALL ON TABLE public.ai_acoes TO anon;
GRANT ALL ON TABLE public.ai_acoes TO authenticated;
GRANT ALL ON TABLE public.ai_acoes TO service_role;
