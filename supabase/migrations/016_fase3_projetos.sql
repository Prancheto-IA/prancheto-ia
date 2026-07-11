-- Migration 016: Módulo de Projetos (multi-time, com milestones)

-- Tabela principal de projetos
CREATE TABLE projetos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  time_id       uuid REFERENCES org_times(id) ON DELETE SET NULL,  -- NULL = projeto global
  nome          text NOT NULL,
  descricao     text,
  status        text NOT NULL DEFAULT 'planejamento' CHECK (
                  status IN ('planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado')
                ),
  prioridade    text NOT NULL DEFAULT 'media' CHECK (
                  prioridade IN ('baixa', 'media', 'alta', 'critica')
                ),
  cor           text NOT NULL DEFAULT '#6366f1',
  icone         text NOT NULL DEFAULT '📁',
  data_inicio   date,
  data_fim      date,
  progresso     integer NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  criado_por    uuid REFERENCES users(id) ON DELETE SET NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE projetos IS 'Projetos de alto nível, podendo ser multi-time ou globais';
COMMENT ON COLUMN projetos.time_id IS 'NULL = projeto global da organização; UUID = projeto de um time específico';

-- Membros do projeto (além dos membros do time)
CREATE TABLE projeto_membros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id  uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  papel       text NOT NULL DEFAULT 'membro' CHECK (papel IN ('lider', 'membro', 'observador')),
  criado_em   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (projeto_id, user_id)
);

COMMENT ON TABLE projeto_membros IS 'Membros adicionais de um projeto (além dos membros do time)';

-- Milestones do projeto
CREATE TABLE projeto_milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id  uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  titulo      text NOT NULL,
  descricao   text,
  data_alvo   date,
  concluido   boolean NOT NULL DEFAULT false,
  concluido_em timestamptz,
  ordem       integer NOT NULL DEFAULT 0,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE projeto_milestones IS 'Marcos/milestones de um projeto';

-- Índices
CREATE INDEX idx_projetos_tenant ON projetos(tenant_id);
CREATE INDEX idx_projetos_time ON projetos(time_id) WHERE time_id IS NOT NULL;
CREATE INDEX idx_projetos_status ON projetos(tenant_id, status);
CREATE INDEX idx_projeto_membros_projeto ON projeto_membros(projeto_id);
CREATE INDEX idx_projeto_membros_user ON projeto_membros(user_id);
CREATE INDEX idx_projeto_milestones_projeto ON projeto_milestones(projeto_id);

-- Trigger updated_at para projetos
CREATE OR REPLACE FUNCTION trigger_projetos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_projetos_updated_at
  BEFORE UPDATE ON projetos
  FOR EACH ROW EXECUTE FUNCTION trigger_projetos_updated_at();

CREATE TRIGGER trg_projeto_milestones_updated_at
  BEFORE UPDATE ON projeto_milestones
  FOR EACH ROW EXECUTE FUNCTION trigger_projetos_updated_at();

-- RLS para projetos
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE projeto_milestones ENABLE ROW LEVEL SECURITY;

-- Membros do tenant veem projetos do seu tenant
CREATE POLICY "projetos_select" ON projetos
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "projetos_insert" ON projetos
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "projetos_update" ON projetos
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
      OR EXISTS (
        SELECT 1 FROM projeto_membros
        WHERE projeto_id = projetos.id AND user_id = auth.uid() AND papel = 'lider'
      )
    )
  );

CREATE POLICY "projetos_delete" ON projetos
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

-- RLS para projeto_membros
CREATE POLICY "projeto_membros_select" ON projeto_membros
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = projeto_membros.projeto_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "projeto_membros_insert" ON projeto_membros
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = projeto_membros.projeto_id
        AND (
          p.criado_por = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
          )
          OR EXISTS (
            SELECT 1 FROM projeto_membros pm
            WHERE pm.projeto_id = projeto_membros.projeto_id
              AND pm.user_id = auth.uid() AND pm.papel = 'lider'
          )
        )
    )
  );

CREATE POLICY "projeto_membros_delete" ON projeto_membros
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos p
      WHERE p.id = projeto_membros.projeto_id
        AND (
          p.criado_por = auth.uid()
          OR EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
          )
        )
    )
  );

-- RLS para projeto_milestones
CREATE POLICY "projeto_milestones_select" ON projeto_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projetos p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = projeto_milestones.projeto_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "projeto_milestones_insert" ON projeto_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projetos p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = projeto_milestones.projeto_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "projeto_milestones_update" ON projeto_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projetos p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = projeto_milestones.projeto_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "projeto_milestones_delete" ON projeto_milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projetos p
      JOIN users u ON u.tenant_id = p.tenant_id
      WHERE p.id = projeto_milestones.projeto_id AND u.id = auth.uid()
    )
  );
