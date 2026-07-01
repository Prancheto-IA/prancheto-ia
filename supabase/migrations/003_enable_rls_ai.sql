-- Habilitar RLS nas tabelas de IA
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para 'ai_conversations'
CREATE POLICY "ai_conversations_owner" ON ai_conversations
FOR ALL
USING (user_id = auth.uid());

-- Políticas para 'ai_messages'
CREATE POLICY "ai_messages_owner" ON ai_messages
FOR ALL
USING (
  conversation_id IN (
    SELECT id FROM ai_conversations WHERE user_id = auth.uid()
  )
);
