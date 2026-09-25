-- =============================================================
-- DONO DO TENANT SEM ACESSO ("conta root sem acessos")
--
-- tem_permissao() (20260808000000_organizacao_e_perfil_proprio.sql) só
-- libera automaticamente users.cargo IN ('admin','super_admin'). O dono do
-- tenant (users.e_dono_tenant, criado em 20260919000000_hierarquia_
-- usuarios_cargos.sql como o primeiro usuário do tenant) não entra nessa
-- lista quando ainda não tem cargo_id atribuído — cai no branch
-- "c.permissoes IS NULL" e usa p_padrao, que é false para times.gerenciar/
-- cargos.gerenciar. Resultado: o front-end libera o botão (authStore.
-- temPermissao "fail open" quando não há lista de permissões), mas o INSERT
-- é rejeitado pela RLS — exatamente o sintoma relatado ("problema ao criar
-- times", "conta root sem acessos").
--
-- Já existe o helper sou_dono_tenant() para esse caso (usado pelo trigger
-- de nível de cargo e por definir_ativo_usuario/definir_cargo_usuario).
-- Falta só este function dele reconhecer o dono também.
-- =============================================================

CREATE OR REPLACE FUNCTION public.tem_permissao(p_slug text, p_padrao boolean DEFAULT false)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
  SELECT COALESCE((
    SELECT CASE
             WHEN u.cargo IN ('admin', 'super_admin') THEN true
             WHEN public.sou_dono_tenant()             THEN true
             WHEN c.permissoes IS NULL                 THEN p_padrao
             ELSE (c.permissoes ? p_slug) OR (c.permissoes ? '*')
           END
      FROM public.users u
      LEFT JOIN public.org_cargos c ON c.id = u.cargo_id
     WHERE u.id = auth.uid()
     LIMIT 1
  ), false);
$$;

COMMENT ON FUNCTION public.tem_permissao(text, boolean) IS
  'Verifica um slug de org_cargos.permissoes para o usuário autenticado. p_padrao vale quando o usuário não tem cargo organizacional. O dono do tenant (sou_dono_tenant()) sempre passa, mesmo sem cargo_id atribuído.';
