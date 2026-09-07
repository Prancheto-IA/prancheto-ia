-- =============================================================
-- FIX: recursão infinita na RLS de projetos e tarefas
--
-- Achado pelos testes automatizados de isolamento (item 3): salvar edição
-- de um projeto ou de uma tarefa quebrava com
-- "infinite recursion detected in policy for relation projetos/tarefas"
-- (Postgres 42P17) — em qualquer tenant, para qualquer usuário. Bug real
-- e ativo, não um problema do teste.
--
-- Causa: projetos_update e tarefas_update checam se o usuário é líder do
-- projeto / responsável pela tarefa via EXISTS em projeto_membros /
-- tarefa_atribuicoes. Para avaliar esse EXISTS, o Postgres aplica a RLS
-- dessas tabelas — e projeto_membros_select / tarefa_atribuicoes_select
-- fazem JOIN de volta em projetos / tarefas para checar o tenant. Isso
-- forma um ciclo (projetos -> projeto_membros -> projetos), que o
-- Postgres corretamente recusa a resolver.
--
-- Correção: mesmo padrão já usado em get_user_tenant_id()/get_user_cargo()
-- — uma função SECURITY DEFINER lê o tenant_id do projeto/tarefa direto,
-- sem passar pela RLS de projetos/tarefas de novo, rompendo o ciclo.
-- =============================================================

CREATE OR REPLACE FUNCTION public.get_projeto_tenant_id(p_projeto_id uuid)
    RETURNS uuid
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT tenant_id FROM public.projetos WHERE id = p_projeto_id;
    $$;

CREATE OR REPLACE FUNCTION public.get_tarefa_tenant_id(p_tarefa_id uuid)
    RETURNS uuid
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT tenant_id FROM public.tarefas WHERE id = p_tarefa_id;
    $$;

ALTER FUNCTION public.get_projeto_tenant_id(uuid) OWNER TO postgres;
ALTER FUNCTION public.get_tarefa_tenant_id(uuid) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_projeto_tenant_id(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_tarefa_tenant_id(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "projeto_membros_select" ON public.projeto_membros;
CREATE POLICY "projeto_membros_select" ON public.projeto_membros FOR SELECT
    USING (public.get_projeto_tenant_id(projeto_id) = public.get_user_tenant_id());

DROP POLICY IF EXISTS "tarefa_atribuicoes_select" ON public.tarefa_atribuicoes;
CREATE POLICY "tarefa_atribuicoes_select" ON public.tarefa_atribuicoes FOR SELECT
    USING (public.get_tarefa_tenant_id(tarefa_id) = public.get_user_tenant_id());
