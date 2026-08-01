-- Migration 022: Preferências individuais da barra lateral por usuário
-- Cada usuário pode reordenar e ocultar itens da sidebar.
-- Configuração é por usuário (não por tenant/time).

CREATE TABLE sidebar_preferencias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  -- Array JSON de itens: [{"slug":"dashboard","visivel":true,"ordem":0}, ...]
  itens         jsonb NOT NULL DEFAULT '[]',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

COMMENT ON TABLE sidebar_preferencias IS 'Preferências individuais da barra lateral por usuário (ordem e visibilidade dos itens)';
COMMENT ON COLUMN sidebar_preferencias.itens IS 'Array JSON: [{slug, visivel, ordem}]. Itens não listados usam defaults.';

-- Índices
CREATE INDEX idx_sidebar_prefs_user ON sidebar_preferencias(user_id);
CREATE INDEX idx_sidebar_prefs_tenant ON sidebar_preferencias(tenant_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION trigger_sidebar_prefs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sidebar_prefs_updated_at
  BEFORE UPDATE ON sidebar_preferencias
  FOR EACH ROW EXECUTE FUNCTION trigger_sidebar_prefs_updated_at();

-- RLS: cada usuário só acessa o próprio registro
ALTER TABLE sidebar_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sidebar_prefs_select" ON sidebar_preferencias
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sidebar_prefs_insert" ON sidebar_preferencias
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sidebar_prefs_update" ON sidebar_preferencias
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "sidebar_prefs_delete" ON sidebar_preferencias
  FOR DELETE USING (user_id = auth.uid());
