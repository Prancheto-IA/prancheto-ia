-- Habilitar RLS nas tabelas restantes
ALTER TABLE agenda_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para 'agenda_eventos'
CREATE POLICY "agenda_tenant_or_owner" ON agenda_eventos
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  OR criado_por = auth.uid()
);

-- Políticas para 'outbound_acoes'
CREATE POLICY "outbound_tenant_or_owner" ON outbound_acoes
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  OR user_id = auth.uid()
);

-- Políticas para 'planos'
-- Todos autenticados podem ver os planos disponíveis
CREATE POLICY "planos_select_all" ON planos
FOR SELECT
USING (auth.role() = 'authenticated');

-- Apenas super_admin pode modificar planos
CREATE POLICY "planos_admin_all" ON planos
FOR ALL
USING (
  (SELECT cargo FROM users WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- Políticas para 'user_preferencias'
CREATE POLICY "user_preferencias_owner" ON user_preferencias
FOR ALL
USING (
  user_id = auth.uid()
);

-- Políticas para 'tenants'
-- Usuário vê o próprio tenant
CREATE POLICY "tenants_select_own" ON tenants
FOR SELECT
USING (
  id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- super_admin vê e altera todos os tenants
CREATE POLICY "tenants_super_admin_all" ON tenants
FOR ALL
USING (
  (SELECT cargo FROM users WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- Políticas para 'audit_logs'
-- Usuários podem ver logs do seu tenant se forem admin (opcional) ou super_admin vê tudo
CREATE POLICY "audit_logs_select" ON audit_logs
FOR SELECT
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  OR (SELECT cargo FROM users WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- Inserção de logs liberada para operações do sistema pelo próprio usuário
CREATE POLICY "audit_logs_insert" ON audit_logs
FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
);
