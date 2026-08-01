-- Migration 023: Módulo de Suporte (base)
-- Estrutura para: Tickets, Base de Conhecimento e Status do Sistema.
-- Segue o padrão multi-tenant do projeto: tenant_id + RLS por tenant,
-- triggers de atualizado_em e índices por tenant.

-- =============================================================
-- 1. TICKETS
-- =============================================================
CREATE TABLE suporte_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  assunto        text NOT NULL,
  descricao      text,
  categoria      text NOT NULL DEFAULT 'duvida' CHECK (
                   categoria IN ('duvida', 'problema_tecnico', 'financeiro', 'sugestao', 'outro')
                 ),
  status         text NOT NULL DEFAULT 'aberto' CHECK (
                   status IN ('aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'fechado')
                 ),
  prioridade     text NOT NULL DEFAULT 'media' CHECK (
                   prioridade IN ('baixa', 'media', 'alta', 'critica')
                 ),
  criado_por     uuid REFERENCES users(id) ON DELETE SET NULL,
  responsavel_id uuid REFERENCES users(id) ON DELETE SET NULL,
  resolvido_em   timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_tickets IS 'Tickets de suporte abertos pela organização';
COMMENT ON COLUMN suporte_tickets.criado_por IS 'Usuário que abriu o ticket';
COMMENT ON COLUMN suporte_tickets.responsavel_id IS 'Agente responsável pelo atendimento (NULL = não atribuído)';

-- Mensagens/interações de um ticket (thread de atendimento)
CREATE TABLE suporte_ticket_mensagens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid NOT NULL REFERENCES suporte_tickets(id) ON DELETE CASCADE,
  autor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  conteudo    text NOT NULL,
  interno     boolean NOT NULL DEFAULT false,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_ticket_mensagens IS 'Mensagens de um ticket (thread de atendimento)';
COMMENT ON COLUMN suporte_ticket_mensagens.interno IS 'true = nota interna do time; false = resposta visível ao cliente';

-- =============================================================
-- 2. BASE DE CONHECIMENTO
-- =============================================================
CREATE TABLE suporte_kb_categorias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  descricao     text,
  icone         text NOT NULL DEFAULT '📚',
  ordem         integer NOT NULL DEFAULT 0,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_kb_categorias IS 'Categorias da base de conhecimento';

CREATE TABLE suporte_kb_artigos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id  uuid REFERENCES suporte_kb_categorias(id) ON DELETE SET NULL,
  titulo        text NOT NULL,
  conteudo      text,
  publicado     boolean NOT NULL DEFAULT false,
  visualizacoes integer NOT NULL DEFAULT 0,
  criado_por    uuid REFERENCES users(id) ON DELETE SET NULL,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_kb_artigos IS 'Artigos da base de conhecimento';
COMMENT ON COLUMN suporte_kb_artigos.publicado IS 'false = rascunho (visível só para admin/manager); true = publicado';

-- =============================================================
-- 3. STATUS DO SISTEMA
-- =============================================================
CREATE TABLE suporte_status_componentes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  descricao     text,
  status        text NOT NULL DEFAULT 'operacional' CHECK (
                  status IN ('operacional', 'degradado', 'instavel', 'em_manutencao', 'fora_do_ar')
                ),
  ordem         integer NOT NULL DEFAULT 0,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_status_componentes IS 'Componentes monitorados na página de Status do Sistema';

CREATE TABLE suporte_status_incidentes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  componente_id uuid REFERENCES suporte_status_componentes(id) ON DELETE SET NULL,
  titulo        text NOT NULL,
  descricao     text,
  impacto       text NOT NULL DEFAULT 'menor' CHECK (
                  impacto IN ('menor', 'maior', 'critico')
                ),
  resolvido     boolean NOT NULL DEFAULT false,
  resolvido_em  timestamptz,
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE suporte_status_incidentes IS 'Incidentes registrados na página de Status do Sistema';

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX idx_suporte_tickets_tenant ON suporte_tickets(tenant_id);
CREATE INDEX idx_suporte_tickets_status ON suporte_tickets(tenant_id, status);
CREATE INDEX idx_suporte_tickets_criado_por ON suporte_tickets(criado_por);
CREATE INDEX idx_suporte_tickets_responsavel ON suporte_tickets(responsavel_id) WHERE responsavel_id IS NOT NULL;
CREATE INDEX idx_suporte_ticket_mensagens_ticket ON suporte_ticket_mensagens(ticket_id);
CREATE INDEX idx_suporte_kb_categorias_tenant ON suporte_kb_categorias(tenant_id);
CREATE INDEX idx_suporte_kb_artigos_tenant ON suporte_kb_artigos(tenant_id);
CREATE INDEX idx_suporte_kb_artigos_categoria ON suporte_kb_artigos(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX idx_suporte_status_componentes_tenant ON suporte_status_componentes(tenant_id);
CREATE INDEX idx_suporte_status_incidentes_tenant ON suporte_status_incidentes(tenant_id);

-- =============================================================
-- TRIGGER updated_at (compartilhado pelas tabelas do módulo)
-- =============================================================
CREATE OR REPLACE FUNCTION trigger_suporte_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_suporte_tickets_updated_at
  BEFORE UPDATE ON suporte_tickets
  FOR EACH ROW EXECUTE FUNCTION trigger_suporte_updated_at();

CREATE TRIGGER trg_suporte_kb_categorias_updated_at
  BEFORE UPDATE ON suporte_kb_categorias
  FOR EACH ROW EXECUTE FUNCTION trigger_suporte_updated_at();

CREATE TRIGGER trg_suporte_kb_artigos_updated_at
  BEFORE UPDATE ON suporte_kb_artigos
  FOR EACH ROW EXECUTE FUNCTION trigger_suporte_updated_at();

CREATE TRIGGER trg_suporte_status_componentes_updated_at
  BEFORE UPDATE ON suporte_status_componentes
  FOR EACH ROW EXECUTE FUNCTION trigger_suporte_updated_at();

CREATE TRIGGER trg_suporte_status_incidentes_updated_at
  BEFORE UPDATE ON suporte_status_incidentes
  FOR EACH ROW EXECUTE FUNCTION trigger_suporte_updated_at();

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE suporte_tickets            ENABLE ROW LEVEL SECURITY;
ALTER TABLE suporte_ticket_mensagens   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suporte_kb_categorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE suporte_kb_artigos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE suporte_status_componentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE suporte_status_incidentes  ENABLE ROW LEVEL SECURITY;

-- ── Tickets: membros do tenant veem; autor cria; autor/admin/manager/responsável editam ──
CREATE POLICY "suporte_tickets_select" ON suporte_tickets
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "suporte_tickets_insert" ON suporte_tickets
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND criado_por = auth.uid()
  );

CREATE POLICY "suporte_tickets_update" ON suporte_tickets
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR responsavel_id = auth.uid()
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
    )
  );

CREATE POLICY "suporte_tickets_delete" ON suporte_tickets
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
    )
  );

-- ── Mensagens: quem enxerga o ticket enxerga/comenta as mensagens ──
CREATE POLICY "suporte_ticket_mensagens_select" ON suporte_ticket_mensagens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM suporte_tickets t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = suporte_ticket_mensagens.ticket_id AND u.id = auth.uid()
    )
  );

CREATE POLICY "suporte_ticket_mensagens_insert" ON suporte_ticket_mensagens
  FOR INSERT WITH CHECK (
    autor_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM suporte_tickets t
      JOIN users u ON u.tenant_id = t.tenant_id
      WHERE t.id = suporte_ticket_mensagens.ticket_id AND u.id = auth.uid()
    )
  );

-- ── Base de conhecimento: leitura para o tenant; escrita para admin/manager ──
CREATE POLICY "suporte_kb_categorias_select" ON suporte_kb_categorias
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "suporte_kb_categorias_insert" ON suporte_kb_categorias
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_kb_categorias_update" ON suporte_kb_categorias
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_kb_categorias_delete" ON suporte_kb_categorias
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_kb_artigos_select" ON suporte_kb_artigos
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
      publicado = true
      OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
    )
  );

CREATE POLICY "suporte_kb_artigos_insert" ON suporte_kb_artigos
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_kb_artigos_update" ON suporte_kb_artigos
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_kb_artigos_delete" ON suporte_kb_artigos
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

-- ── Status do sistema: leitura para o tenant; escrita para admin/manager ──
CREATE POLICY "suporte_status_componentes_select" ON suporte_status_componentes
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "suporte_status_componentes_insert" ON suporte_status_componentes
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_status_componentes_update" ON suporte_status_componentes
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_status_componentes_delete" ON suporte_status_componentes
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_status_incidentes_select" ON suporte_status_incidentes
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "suporte_status_incidentes_insert" ON suporte_status_incidentes
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_status_incidentes_update" ON suporte_status_incidentes
  FOR UPDATE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );

CREATE POLICY "suporte_status_incidentes_delete" ON suporte_status_incidentes
  FOR DELETE USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND cargo IN ('admin', 'manager'))
  );
