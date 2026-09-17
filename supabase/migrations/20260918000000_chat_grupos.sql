-- Migration: Bloco 4 — corrige a criação de canal (causa raiz do Chat não
-- funcionar) e adiciona suporte a grupos (papel de admin, promover,
-- adicionar/remover membro), gated pela permissão chat.criar_grupo.
--
-- CAUSA RAIZ DO BUG: criarCanal (useChat.js) fazia INSERT...RETURNING em
-- chat_canais e só depois inseria o criador em chat_membros. A policy
-- chat_canais_select exige associação em chat_membros para enxergar a
-- linha — no instante do RETURNING essa associação ainda não existe, o
-- SELECT do retorno vem vazio, .single() estoura, e o insert em
-- chat_membros nunca chega a rodar. O canal fica criado e órfão: invisível
-- pra sempre, inclusive pro criador. Resolvido criando uma função
-- SECURITY DEFINER que insere canal + membresia do criador na mesma
-- transação, sem depender de RETURNING passar pela RLS de SELECT.

-- 1. Papel do membro dentro do canal (não existia nenhuma noção disso).
ALTER TABLE public.chat_membros
  ADD COLUMN IF NOT EXISTS papel text NOT NULL DEFAULT 'membro';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_membros_papel_check') THEN
    ALTER TABLE public.chat_membros
      ADD CONSTRAINT chat_membros_papel_check CHECK (papel = ANY (ARRAY['membro'::text, 'admin'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.chat_membros.papel IS 'Papel do usuário dentro do canal: membro ou admin. Só é relevante para canais tipo=grupo; canais diretos ignoram isso.';

-- 2. Criação atômica de canal: insere chat_canais + a membresia do criador
--    (como admin) + membros iniciais opcionais, tudo na mesma transação.
--    Grupos exigem a permissão chat.criar_grupo; canais diretos não.
CREATE OR REPLACE FUNCTION public.criar_canal_chat(
  p_nome text,
  p_tipo text,
  p_descricao text DEFAULT NULL,
  p_icone text DEFAULT '💬',
  p_membros_iniciais uuid[] DEFAULT '{}'
) RETURNS public.chat_canais
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_tenant_id uuid;
  v_canal public.chat_canais;
  v_membro uuid;
BEGIN
  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem tenant.';
  END IF;

  IF p_tipo = 'grupo' AND NOT public.tem_permissao('chat.criar_grupo') THEN
    RAISE EXCEPTION 'Sem permissão para criar grupos de chat.';
  END IF;

  INSERT INTO public.chat_canais (tenant_id, nome, tipo, descricao, icone, criado_por)
  VALUES (v_tenant_id, p_nome, p_tipo, p_descricao, p_icone, auth.uid())
  RETURNING * INTO v_canal;

  INSERT INTO public.chat_membros (canal_id, user_id, papel)
  VALUES (v_canal.id, auth.uid(), 'admin');

  IF p_membros_iniciais IS NOT NULL THEN
    FOREACH v_membro IN ARRAY p_membros_iniciais LOOP
      IF v_membro <> auth.uid() THEN
        INSERT INTO public.chat_membros (canal_id, user_id, papel)
        VALUES (v_canal.id, v_membro, 'membro')
        ON CONFLICT (canal_id, user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  RETURN v_canal;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_canal_chat(text, text, text, text, uuid[]) TO authenticated;

-- 3. Promover/despromover admin de um canal — só admin do próprio canal
--    pode chamar, e nunca deixa o canal sem nenhum admin.
CREATE OR REPLACE FUNCTION public.definir_papel_chat(p_canal_id uuid, p_user_id uuid, p_papel text)
RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_sou_admin boolean;
  v_admins_restantes integer;
BEGIN
  IF p_papel NOT IN ('membro', 'admin') THEN
    RAISE EXCEPTION 'Papel inválido: %', p_papel;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.chat_membros
    WHERE canal_id = p_canal_id AND user_id = auth.uid() AND papel = 'admin'
  ) INTO v_sou_admin;

  IF NOT v_sou_admin THEN
    RAISE EXCEPTION 'Só administradores do canal podem alterar papéis.';
  END IF;

  IF p_papel = 'membro' THEN
    SELECT count(*) INTO v_admins_restantes
    FROM public.chat_membros
    WHERE canal_id = p_canal_id AND papel = 'admin' AND user_id <> p_user_id;

    IF v_admins_restantes = 0 THEN
      RAISE EXCEPTION 'O grupo precisa de pelo menos um administrador.';
    END IF;
  END IF;

  UPDATE public.chat_membros SET papel = p_papel
  WHERE canal_id = p_canal_id AND user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.definir_papel_chat(uuid, uuid, text) TO authenticated;

-- 4. chat_membros_insert era permissivo demais: qualquer pessoa do tenant
--    podia adicionar qualquer outra a qualquer canal. Agora exige ser
--    admin do canal (ou o criador) para grupos; canais diretos continuam
--    livres entre os 2 participantes.
DROP POLICY IF EXISTS "chat_membros_insert" ON public.chat_membros;
CREATE POLICY "chat_membros_insert" ON public.chat_membros
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_canais c
      WHERE c.id = chat_membros.canal_id
        AND (
          c.tipo = 'direto'
          OR c.criado_por = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.chat_membros admin_check
            WHERE admin_check.canal_id = c.id
              AND admin_check.user_id = auth.uid()
              AND admin_check.papel = 'admin'
          )
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
    OR EXISTS (
      SELECT 1 FROM public.chat_membros admin_check
      WHERE admin_check.canal_id = chat_membros.canal_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.papel = 'admin'
    )
  );

-- 5. chat_canais/chat_mensagens ainda checavam users.cargo IN admin/manager
--    hardcoded — nunca migraram pro sistema de permissões granulares que o
--    resto do app usa desde 20260808. Alinha com tem_permissao().
DROP POLICY IF EXISTS "chat_canais_update" ON public.chat_canais;
CREATE POLICY "chat_canais_update" ON public.chat_canais
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.chat_membros WHERE canal_id = chat_canais.id AND user_id = auth.uid())
    AND (
      criado_por = auth.uid()
      OR EXISTS (SELECT 1 FROM public.chat_membros WHERE canal_id = chat_canais.id AND user_id = auth.uid() AND papel = 'admin')
      OR public.tem_permissao('usuarios.gerenciar')
    )
  );

DROP POLICY IF EXISTS "chat_mensagens_delete" ON public.chat_mensagens;
CREATE POLICY "chat_mensagens_delete" ON public.chat_mensagens
  FOR DELETE USING (
    autor_id = auth.uid()
    OR public.tem_permissao('usuarios.gerenciar')
  );

-- 6. Garante chat_mensagens na publicação de realtime — não havia nenhuma
--    migration versionada habilitando isso, então ambientes recriados do
--    zero (staging/local) nunca recebiam mensagens em tempo real.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_mensagens'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_mensagens;
  END IF;
END $$;
