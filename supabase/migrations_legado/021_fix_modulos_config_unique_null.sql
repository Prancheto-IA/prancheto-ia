-- Migration 021: Corrige constraint UNIQUE em modulos_config para tratar NULL corretamente
-- Problema: UNIQUE(tenant_id, time_id, modulo_slug) com time_id NULL não funciona no PostgreSQL
-- porque NULL != NULL, permitindo duplicatas e causando erro 23505 no upsert.
-- Solução: substituir a constraint por dois índices únicos parciais.

-- 1. Remove a constraint UNIQUE existente
ALTER TABLE modulos_config DROP CONSTRAINT IF EXISTS modulos_config_tenant_id_time_id_modulo_slug_key;

-- 2. Cria índice único que trata NULL como valor comparável
--    Para registros globais (time_id IS NULL): unicidade por tenant_id + modulo_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_modulos_config_unique_global
  ON modulos_config (tenant_id, modulo_slug)
  WHERE time_id IS NULL;

--    Para registros de time específico: unicidade por tenant_id + time_id + modulo_slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_modulos_config_unique_time
  ON modulos_config (tenant_id, time_id, modulo_slug)
  WHERE time_id IS NOT NULL;

-- 3. Recria a política de INSERT com WITH CHECK correto
DROP POLICY IF EXISTS "modulos_config_insert" ON modulos_config;

CREATE POLICY "modulos_config_insert" ON modulos_config
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
        AND cargo IN ('admin', 'manager')
    )
  );

-- Nota: RLS mantida restrita a admin/manager pois modulos_config é configuração
-- compartilhada do time/organização (não preferência individual).
-- Preferências individuais ficam em sidebar_preferencias (migration 022).
