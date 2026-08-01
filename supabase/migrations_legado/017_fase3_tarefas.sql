-- Migration 017: Módulo de Tarefas (operacional, com checklist e atribuições)

-- Tabela principal de tarefas
CREATE TABLE tarefas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  time_id         uuid REFERENCES org_times(id) ON DELETE SET NULL,
  projeto_id      uuid REFERENCES projetos(id) ON DELETE SET NULL,
  milestone_id    uuid REFERENCES projeto_milestones(id) ON DELETE SET NULL,
  titulo          text NOT NULL,
  descricao       text,
  status          text NOT NULL DEFAULT 'pendente' CHECK (
                    status IN ('pendente', 'em_andamento', 'em_revisao', 'concluida', 'cancelada')
                  ),
  prioridade      text NOT NULL DEFAULT 'media' CHECK (
                    prioridade IN ('baixa', 'media', 'alta', 'critica')
                  ),
  data_vencimento timestamptz,
  estimativa_h    numeric(6,2),  -- horas estimadas
  criado_por      uuid REFERENCES users(id) ON DELETE SET NULL,
  criado_em       timestamptz NOT NULL DEFAULT now(),
  atualizado_em   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tarefas IS 'Tarefas operacionais, podendo estar vinculadas a projetos e milestones';

-- Checklist de uma tarefa
CREATE TABLE tarefa_checklist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id   uuid NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  texto       text NOT NULL,
  concluido   boolean NOT NULL DEFAULT false,
  concluido_em timestamptz,
  ordem       integer NOT NULL DEFAULT 0,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE tarefa_checklist IS 'Itens de checklist de uma tarefa';

-- Atribuições de usuários a tarefas
CREATE TABLE tarefa_atribuicoes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id   uuid NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  criado_em   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tarefa_id, user_id)
);

COMMENT ON TABLE tarefa_atribuicoes IS 'Usuários atribuídos a uma tarefa';

-- Índices
CREATE INDEX idx_tarefas_tenant ON tarefas(tenant_id);
CREATE INDEX idx_tarefas_time ON tarefas(time_id) WHERE time_id IS NOT NULL;
CREATE INDEX idx_tarefas_projeto ON tarefas(projeto_id) WHERE projeto_id IS NOT NULL;
CREATE INDEX idx_tarefas_status ON tarefas(tenant_id, status);
CREATE INDEX idx_tarefas_vencimento ON tarefas(tenant_id, data_vencimento) WHERE data_vencimento IS NOT NULL;
CREATE INDEX idx_tarefa_checklist_tarefa ON tarefa_checklist(tarefa_id);
CREATE INDEX idx_tarefa_atribuicoes_tarefa ON tarefa_atribuicoes(tarefa_id);
CREATE INDEX idx_tarefa_atribuicoes_user ON tarefa_atribuicoes(user_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION trigger_tarefas_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tarefas_updated_at
  BEFORE UPDATE ON tarefas
  FOR EACH ROW EXECUTE FUNCTION trigger_tarefas_updated_at();

-- RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefa_atribuicoes ENABLE ROW LEVEL SECURITY;

-- Membros do tenant veem todas as tarefas do tenant
CREATE POLICY "tarefas_select" ON tarefas
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "tarefas_insert" ON tarefas
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "tarefas_update" ON tarefas
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (
        SELECT 1 FROM tarefa_atribuicoes WHERE tarefa_id = tarefas.id AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

CREATE POLICY "tarefas_delete" ON tarefas
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager')
      )
    )
  );

-- RLS para tarefa_checklist
CREATE POLICY "tarefa_checklist_select" ON tarefa_checklist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_checklist.tarefa_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "tarefa_checklist_insert" ON tarefa_checklist
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_checklist.tarefa_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "tarefa_checklist_update" ON tarefa_checklist
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_checklist.tarefa_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "tarefa_checklist_delete" ON tarefa_checklist
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_checklist.tarefa_id AND u.id = auth.uid()
    )
  );

-- RLS para tarefa_atribuicoes
CREATE POLICY "tarefa_atribuicoes_select" ON tarefa_atribuicoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_atribuicoes.tarefa_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "tarefa_atribuicoes_insert" ON tarefa_atribuicoes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_atribuicoes.tarefa_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "tarefa_atribuicoes_delete" ON tarefa_atribuicoes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tarefas t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = tarefa_atribuicoes.tarefa_id AND u.id = auth.uid()
    )
  );
