-- =============================================================
-- FIX: recursão infinita na RLS de chat_membros
--
-- Achado testando o Chat em dev logo após o merge dos Blocos 1-5:
-- abrir a aba Chat quebrava com "infinite recursion detected in
-- policy for relation chat_membros" (Postgres 42P17), escondendo
-- todos os canais do usuário (a tela caía no estado "Nenhum canal
-- ainda"). Bug real e ativo, não um problema de teste.
--
-- Causa: chat_membros_select (desde a baseline) checa se o usuário é
-- membro do canal com um EXISTS que consulta a própria chat_membros.
-- Isso já é auto-referência; o Bloco 4 (grupos) piorou aplicando o
-- mesmo padrão em chat_membros_insert/delete (admin_check). Ao buscar
-- canais com o embed `chat_canais(...,chat_membros!inner(...))`, o
-- Postgres precisa avaliar chat_canais_select (que consulta
-- chat_membros) E chat_membros_select (que consulta chat_membros de
-- novo) na mesma árvore de planejamento — o mesmo ciclo já corrigido
-- para projetos/projeto_membros em 20260907000000, agora em chat.
--
-- Correção: mesmo padrão — uma função SECURITY DEFINER que checa a
-- membresia direto na tabela, sem passar pela RLS de chat_membros de
-- novo, rompendo o ciclo.
-- =============================================================

CREATE OR REPLACE FUNCTION public.is_membro_canal(p_canal_id uuid, p_papel text DEFAULT NULL)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1 FROM public.chat_membros
        WHERE canal_id = p_canal_id
          AND user_id = auth.uid()
          AND (p_papel IS NULL OR papel = p_papel)
      );
    $$;

ALTER FUNCTION public.is_membro_canal(uuid, text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.is_membro_canal(uuid, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "chat_membros_select" ON public.chat_membros;
CREATE POLICY "chat_membros_select" ON public.chat_membros FOR SELECT
    USING (public.is_membro_canal(canal_id));

DROP POLICY IF EXISTS "chat_membros_insert" ON public.chat_membros;
CREATE POLICY "chat_membros_insert" ON public.chat_membros
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_canais c
      WHERE c.id = chat_membros.canal_id
        AND (
          c.tipo = 'direto'
          OR c.criado_por = auth.uid()
          OR public.is_membro_canal(c.id, 'admin')
        )
    )
  );

DROP POLICY IF EXISTS "chat_membros_delete" ON public.chat_membros;
CREATE POLICY "chat_membros_delete" ON public.chat_membros
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_canais c
      WHERE c.id = chat_membros.canal_id AND c.criado_por = auth.uid()
    )
    OR public.is_membro_canal(chat_membros.canal_id, 'admin')
  );
