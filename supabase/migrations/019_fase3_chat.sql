-- Migration 019: Módulo de Chat de Mensagens (canais, membros, mensagens)

-- Canais de chat (direto, grupo, projeto)
CREATE TABLE chat_canais (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome        text,  -- NULL para canais diretos (nome gerado dinamicamente)
  tipo        text NOT NULL DEFAULT 'grupo' CHECK (
                tipo IN ('direto', 'grupo', 'projeto', 'time')
              ),
  projeto_id  uuid REFERENCES projetos(id) ON DELETE CASCADE,  -- para tipo='projeto'
  time_id     uuid REFERENCES org_times(id) ON DELETE CASCADE,  -- para tipo='time'
  descricao   text,
  icone       text DEFAULT '💬',
  arquivado   boolean NOT NULL DEFAULT false,
  criado_por  uuid REFERENCES users(id) ON DELETE SET NULL,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chat_canais IS 'Canais de chat: direto (1:1), grupo, vinculado a projeto ou time';
COMMENT ON COLUMN chat_canais.nome IS 'NULL para canais diretos — nome exibido é gerado a partir dos membros';

-- Membros de cada canal
CREATE TABLE chat_membros (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id        uuid NOT NULL REFERENCES chat_canais(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ultimo_lido_em  timestamptz,  -- para calcular mensagens não lidas
  silenciado      boolean NOT NULL DEFAULT false,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canal_id, user_id)
);

COMMENT ON TABLE chat_membros IS 'Membros de um canal de chat com controle de leitura';

-- Mensagens do chat
CREATE TABLE chat_mensagens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canal_id        uuid NOT NULL REFERENCES chat_canais(id) ON DELETE CASCADE,
  autor_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo        text NOT NULL,
  tipo            text NOT NULL DEFAULT 'texto' CHECK (
                    tipo IN ('texto', 'arquivo', 'imagem', 'sistema', 'resposta')
                  ),
  resposta_id     uuid REFERENCES chat_mensagens(id) ON DELETE SET NULL,  -- thread/reply
  metadata        jsonb NOT NULL DEFAULT '{}',  -- { arquivo_url, arquivo_nome, tamanho_kb }
  editado_em      timestamptz,
  deletado_em     timestamptz,  -- soft delete
  criado_em       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE chat_mensagens IS 'Mensagens de um canal de chat com suporte a respostas (threads)';
COMMENT ON COLUMN chat_mensagens.deletado_em IS 'Soft delete — mensagem deletada mantém registro mas conteúdo é ocultado';

-- Índices
CREATE INDEX idx_chat_canais_tenant ON chat_canais(tenant_id);
CREATE INDEX idx_chat_canais_tipo ON chat_canais(tenant_id, tipo);
CREATE INDEX idx_chat_canais_projeto ON chat_canais(projeto_id) WHERE projeto_id IS NOT NULL;
CREATE INDEX idx_chat_canais_time ON chat_canais(time_id) WHERE time_id IS NOT NULL;
CREATE INDEX idx_chat_membros_canal ON chat_membros(canal_id);
CREATE INDEX idx_chat_membros_user ON chat_membros(user_id);
CREATE INDEX idx_chat_mensagens_canal ON chat_mensagens(canal_id, criado_em DESC);
CREATE INDEX idx_chat_mensagens_autor ON chat_mensagens(autor_id);
CREATE INDEX idx_chat_mensagens_ativas ON chat_mensagens(canal_id, criado_em DESC)
  WHERE deletado_em IS NULL;

-- Trigger updated_at para canais
CREATE OR REPLACE FUNCTION trigger_chat_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chat_canais_updated_at
  BEFORE UPDATE ON chat_canais
  FOR EACH ROW EXECUTE FUNCTION trigger_chat_updated_at();

-- Trigger: ao inserir mensagem, atualiza atualizado_em do canal
CREATE OR REPLACE FUNCTION trigger_chat_mensagem_atualiza_canal()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE chat_canais SET atualizado_em = now() WHERE id = NEW.canal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chat_mensagem_atualiza_canal
  AFTER INSERT ON chat_mensagens
  FOR EACH ROW EXECUTE FUNCTION trigger_chat_mensagem_atualiza_canal();

-- RLS
ALTER TABLE chat_canais ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensagens ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas canais dos quais é membro
CREATE POLICY "chat_canais_select" ON chat_canais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_membros
      WHERE canal_id = chat_canais.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_canais_insert" ON chat_canais
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "chat_canais_update" ON chat_canais
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_membros
      WHERE canal_id = chat_canais.id AND user_id = auth.uid()
    )
    AND (
      criado_por = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

-- RLS para chat_membros
CREATE POLICY "chat_membros_select" ON chat_membros
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_membros cm
      WHERE cm.canal_id = chat_membros.canal_id AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "chat_membros_insert" ON chat_membros
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_canais c
      JOIN users u ON u.tenant_id = c.tenant_id
      WHERE c.id = chat_membros.canal_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "chat_membros_update" ON chat_membros
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "chat_membros_delete" ON chat_membros
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM chat_canais c
      WHERE c.id = chat_membros.canal_id AND c.criado_por = auth.uid()
    )
  );

-- RLS para chat_mensagens
CREATE POLICY "chat_mensagens_select" ON chat_mensagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_membros
      WHERE canal_id = chat_mensagens.canal_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_mensagens_insert" ON chat_mensagens
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_membros
      WHERE canal_id = chat_mensagens.canal_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "chat_mensagens_update" ON chat_mensagens
  FOR UPDATE USING (
    autor_id = auth.uid()
    AND deletado_em IS NULL
  );

CREATE POLICY "chat_mensagens_delete" ON chat_mensagens
  FOR DELETE USING (
    autor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
    )
  );
