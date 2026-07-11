-- Migration 018: Módulo de Feed de Postagens (social wall)

-- Tabela principal de postagens
CREATE TABLE feed_postagens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  time_id     uuid REFERENCES org_times(id) ON DELETE SET NULL,  -- NULL = feed global
  autor_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo    text NOT NULL,
  tipo        text NOT NULL DEFAULT 'texto' CHECK (
                tipo IN ('texto', 'anuncio', 'conquista', 'atualizacao', 'pergunta')
              ),
  fixado      boolean NOT NULL DEFAULT false,
  metadata    jsonb NOT NULL DEFAULT '{}',  -- anexos, links, menções
  editado_em  timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE feed_postagens IS 'Postagens do feed social da organização ou de um time';
COMMENT ON COLUMN feed_postagens.time_id IS 'NULL = feed global da organização; UUID = feed de um time específico';
COMMENT ON COLUMN feed_postagens.metadata IS 'Dados extras: { anexos: [], mencoes: [], link_preview: {} }';

-- Reações às postagens (emoji reactions)
CREATE TABLE feed_reacoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id uuid NOT NULL REFERENCES feed_postagens(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji       text NOT NULL DEFAULT '👍',
  criado_em   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (postagem_id, user_id, emoji)
);

COMMENT ON TABLE feed_reacoes IS 'Reações emoji às postagens do feed';

-- Comentários nas postagens
CREATE TABLE feed_comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postagem_id uuid NOT NULL REFERENCES feed_postagens(id) ON DELETE CASCADE,
  autor_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conteudo    text NOT NULL,
  editado_em  timestamptz,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE feed_comentarios IS 'Comentários nas postagens do feed';

-- Índices
CREATE INDEX idx_feed_postagens_tenant ON feed_postagens(tenant_id);
CREATE INDEX idx_feed_postagens_time ON feed_postagens(time_id) WHERE time_id IS NOT NULL;
CREATE INDEX idx_feed_postagens_autor ON feed_postagens(autor_id);
CREATE INDEX idx_feed_postagens_criado ON feed_postagens(tenant_id, criado_em DESC);
CREATE INDEX idx_feed_postagens_fixado ON feed_postagens(tenant_id, fixado) WHERE fixado = true;
CREATE INDEX idx_feed_reacoes_postagem ON feed_reacoes(postagem_id);
CREATE INDEX idx_feed_comentarios_postagem ON feed_comentarios(postagem_id);
CREATE INDEX idx_feed_comentarios_criado ON feed_comentarios(postagem_id, criado_em);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_feed_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_feed_postagens_updated_at
  BEFORE UPDATE ON feed_postagens
  FOR EACH ROW EXECUTE FUNCTION trigger_feed_updated_at();

CREATE TRIGGER trg_feed_comentarios_updated_at
  BEFORE UPDATE ON feed_comentarios
  FOR EACH ROW EXECUTE FUNCTION trigger_feed_updated_at();

-- RLS
ALTER TABLE feed_postagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_reacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_comentarios ENABLE ROW LEVEL SECURITY;

-- Membros do tenant veem postagens do tenant
CREATE POLICY "feed_postagens_select" ON feed_postagens
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "feed_postagens_insert" ON feed_postagens
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND autor_id = auth.uid()
  );

CREATE POLICY "feed_postagens_update" ON feed_postagens
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      autor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "feed_postagens_delete" ON feed_postagens
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      autor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

-- RLS para feed_reacoes
CREATE POLICY "feed_reacoes_select" ON feed_reacoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feed_postagens p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = feed_reacoes.postagem_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "feed_reacoes_insert" ON feed_reacoes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM feed_postagens p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = feed_reacoes.postagem_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "feed_reacoes_delete" ON feed_reacoes
  FOR DELETE USING (user_id = auth.uid());

-- RLS para feed_comentarios
CREATE POLICY "feed_comentarios_select" ON feed_comentarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM feed_postagens p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = feed_comentarios.postagem_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "feed_comentarios_insert" ON feed_comentarios
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM feed_postagens p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = feed_comentarios.postagem_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "feed_comentarios_update" ON feed_comentarios
  FOR UPDATE USING (autor_id = auth.uid());

CREATE POLICY "feed_comentarios_delete" ON feed_comentarios
  FOR DELETE USING (
    autor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
    )
  );
