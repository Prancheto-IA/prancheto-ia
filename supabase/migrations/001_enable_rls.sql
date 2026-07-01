-- 1. Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_interacoes ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'users'
-- Usuário vê a si mesmo ou usuários do mesmo tenant_id (se tiver tenant)
CREATE POLICY "user_view_own_or_tenant" ON users 
FOR SELECT 
USING (
  auth.uid() = id 
  OR tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Super admin pode ver todos os usuários
CREATE POLICY "super_admin_view_all" ON users
FOR SELECT
USING (
  (SELECT cargo FROM users WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- Usuários normais podem atualizar apenas o próprio perfil
CREATE POLICY "user_update_self" ON users
FOR UPDATE
USING (auth.uid() = id);

-- Super admins podem gerenciar todos os usuários
CREATE POLICY "super_admin_all" ON users
FOR ALL
USING (
  (SELECT cargo FROM users WHERE id = auth.uid() LIMIT 1) = 'super_admin'
);

-- 3. Políticas para 'crm_contatos'
CREATE POLICY "crm_contatos_tenant_or_owner" ON crm_contatos
FOR ALL
USING (
  tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1)
  OR responsavel_id = auth.uid()
);

-- 4. Políticas para 'crm_interacoes'
CREATE POLICY "crm_interacoes_parent_access" ON crm_interacoes
FOR ALL
USING (
  contato_id IN (
    SELECT id FROM crm_contatos 
    WHERE tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid() LIMIT 1) 
       OR responsavel_id = auth.uid()
  )
);

-- 5. Trigger de criação automática de perfil ao cadastrar-se no Auth
-- Permite inserções no public.users pelo supabase_auth_admin
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, cargo, tenant_id, ativo)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', 'Usuário ' || split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'cargo', 'admin'), -- Por padrão, novos cadastros são admin de seus próprios tenants
    new.id, -- O primeiro usuário cria o seu próprio tenant_id igual ao user.id
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exclui a trigger anterior se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria a trigger no esquema auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
