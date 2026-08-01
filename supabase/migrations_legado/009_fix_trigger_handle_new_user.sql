-- =============================================================
-- FIX: Trigger handle_new_user — isolamento multi-tenant correto
--
-- PROBLEMA ANTERIOR:
--   tenant_id = new.id  (usava o próprio auth.uid() como tenant_id)
--   Isso criava um tenant_id inválido para signups diretos.
--
-- SOLUÇÃO:
--   - Se tenant_id vier nos user_metadata (criação via admin-users):
--     usa o tenant_id fornecido e cria o usuário ativo.
--   - Se não vier (signup direto/público):
--     cria com tenant_id = NULL e ativo = false (pendente).
--     O usuário não consegue acessar dados de nenhum tenant (RLS bloqueia).
--     Um admin deve associá-lo a um tenant posteriormente.
--
-- IMPACTO NOS DADOS EXISTENTES: nenhum.
--   - super_admin (tenant_id = user_id): comportamento intencional, não alterado.
--   - Usuários criados via admin-users: não afetados (já têm tenant correto).
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_cargo     TEXT;
  v_nome      TEXT;
  v_ativo     BOOLEAN;
BEGIN
  -- Tenta extrair tenant_id dos metadados (passado pela Edge Function admin-users)
  v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;

  -- Tenta extrair cargo dos metadados; padrão: 'member'
  v_cargo := COALESCE(new.raw_user_meta_data->>'cargo', 'member');

  -- Nome: usa metadado ou deriva do e-mail
  v_nome := COALESCE(
    new.raw_user_meta_data->>'nome',
    'Usuário ' || split_part(new.email, '@', 1)
  );

  -- Ativo: true apenas se veio com tenant_id válido (criação via admin)
  -- Signup direto sem tenant_id → ativo = false (pendente)
  v_ativo := (v_tenant_id IS NOT NULL);

  INSERT INTO public.users (id, email, nome, cargo, tenant_id, ativo)
  VALUES (
    new.id,
    new.email,
    v_nome,
    v_cargo,
    v_tenant_id,  -- NULL para signup direto; UUID válido para criação via admin
    v_ativo       -- false para signup direto; true para criação via admin
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recria o trigger (a função foi substituída, mas o trigger permanece)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
