-- Migration 015: Configuração de módulos por time/organização (DnD persistência)

CREATE TABLE modulos_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  time_id       uuid REFERENCES org_times(id) ON DELETE CASCADE,  -- NULL = área global da org
  modulo_slug   text NOT NULL CHECK (modulo_slug IN (
                  'dashboard', 'calendario', 'projetos', 'tarefas',
                  'feed', 'chat', 'times_pessoas', 'crm'
                )),
  ativo         boolean NOT NULL DEFAULT true,
  ordem         integer NOT NULL DEFAULT 0,
  config        jsonb NOT NULL DEFAULT '{}',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, time_id, modulo_slug)
);

COMMENT ON TABLE modulos_config IS 'Configuração e ordem dos módulos por time ou área global da organização';
COMMENT ON COLUMN modulos_config.time_id IS 'NULL = configuração global da organização; UUID = configuração específica do time';
COMMENT ON COLUMN modulos_config.modulo_slug IS 'Identificador único do módulo';
COMMENT ON COLUMN modulos_config.config IS 'Configurações específicas do módulo (ex: widgets do dashboard, filtros padrão)';

-- Índices
CREATE INDEX idx_modulos_config_tenant ON modulos_config(tenant_id);
CREATE INDEX idx_modulos_config_time ON modulos_config(time_id) WHERE time_id IS NOT NULL;
CREATE INDEX idx_modulos_config_ativo ON modulos_config(tenant_id, ativo) WHERE ativo = true;

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_modulos_config_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_modulos_config_updated_at
  BEFORE UPDATE ON modulos_config
  FOR EACH ROW EXECUTE FUNCTION trigger_modulos_config_updated_at();

-- RLS
ALTER TABLE modulos_config ENABLE ROW LEVEL SECURITY;

-- Membros do tenant podem ver configurações
CREATE POLICY "modulos_config_select" ON modulos_config
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Apenas admin/manager podem inserir/atualizar/deletar
CREATE POLICY "modulos_config_insert" ON modulos_config
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
        AND cargo IN ('admin', 'manager')
    )
  );

CREATE POLICY "modulos_config_update" ON modulos_config
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
        AND cargo IN ('admin', 'manager')
    )
  );

CREATE POLICY "modulos_config_delete" ON modulos_config
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
        AND cargo IN ('admin', 'manager')
    )
  );
