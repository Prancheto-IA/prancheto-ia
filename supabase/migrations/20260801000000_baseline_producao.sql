-- =============================================================
-- BASELINE — estado real da producao em 2026-08-01
--
-- Este arquivo e o ponto de partida do historico de migrations.
-- Ele foi gerado por pg_dump --schema-only contra o projeto de
-- producao (ujspjhmfdinkhjccjjuo), e nao escrito a mao.
--
-- POR QUE ELE EXISTE
--
-- Ate aqui o banco era alterado diretamente pelo SQL Editor do
-- dashboard. As migrations em supabase/migrations_legado/
-- documentavam parte das mudancas, mas nao todas: 11 tabelas
-- fundamentais (users, tenants, crm_contatos, crm_interacoes,
-- planos, agenda_eventos, ai_conversations, ai_messages,
-- audit_logs, outbound_acoes, user_preferencias) nunca apareceram
-- em migration nenhuma. Aplicar aquela pasta num banco vazio
-- falhava, porque ela faz ALTER em tabelas que nunca cria.
--
-- Esta baseline captura o que a producao REALMENTE tem, incluindo
-- todo o drift acumulado fora do versionamento.
--
-- CONTEUDO
--   41 tabelas | 109 policies RLS | 85 indices
--   14 funcoes | 16 triggers      |  1 view
--
-- Schemas gerenciados pela plataforma (auth, storage, realtime,
-- extensions, ...) ficam de fora: o Supabase os mantem.
--
-- DAQUI EM DIANTE
--   Nenhuma alteracao pelo SQL Editor. Toda mudanca de schema
--   nasce de `supabase migration new`, e aplicada primeiro no
--   projeto de dev e so depois promovida. Ver docs/AMBIENTES.md.
--
-- As migrations antigas seguem em supabase/migrations_legado/
-- apenas como registro historico. Nao sao mais executadas.
-- =============================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_user_cargo"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT cargo FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_cargo"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."score_delta_por_tipo"("p_tipo" "text") RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
  RETURN CASE p_tipo
    WHEN 'nota'      THEN 5
    WHEN 'email'     THEN 10
    WHEN 'whatsapp'  THEN 10
    WHEN 'ligacao'   THEN 15
    WHEN 'reuniao'   THEN 25
    WHEN 'conversao' THEN 0   -- conversão não pontua (é evento de estado)
    ELSE 5
  END;
END;
$$;


ALTER FUNCTION "public"."score_delta_por_tipo"("p_tipo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_atualizar_score_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_delta INTEGER;
BEGIN
  -- Só pontua se o contato ainda é lead
  IF NOT EXISTS (
    SELECT 1 FROM public.crm_contatos
    WHERE id = NEW.contato_id AND tipo_registro = 'lead'
  ) THEN
    RETURN NEW;
  END IF;

  v_delta := public.score_delta_por_tipo(NEW.tipo);

  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  UPDATE public.crm_contatos
  SET
    score = score + v_delta,
    score_historico = score_historico || jsonb_build_object(
      'data',   to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'delta',  v_delta,
      'motivo', NEW.tipo,
      'interacao_id', NEW.id
    ),
    atualizado_em = now()
  WHERE id = NEW.contato_id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_atualizar_score_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE chat_canais SET atualizado_em = now() WHERE id = NEW.canal_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_chat_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_chat_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_feed_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_feed_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_modulos_config_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_modulos_config_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_processar_conversao_lead"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_responsavel_id UUID;
  v_tenant_id      UUID;
  v_nome_contato   TEXT;
BEGIN
  -- Só age quando tipo_registro muda de 'lead' para 'cliente'
  IF OLD.tipo_registro = 'lead' AND NEW.tipo_registro = 'cliente' THEN

    v_responsavel_id := NEW.responsavel_id;
    v_tenant_id      := NEW.tenant_id;
    v_nome_contato   := NEW.nome;

    -- 4a. Registrar interação automática de conversão
    --     (crm_interacoes NÃO tem tenant_id — deriva do contato pai)
    INSERT INTO public.crm_interacoes (
      contato_id, criado_por, tipo, conteudo, metadata
    ) VALUES (
      NEW.id,
      NEW.convertido_por,
      'conversao',
      'Lead convertido para Cliente.',
      jsonb_build_object(
        'convertido_por', NEW.convertido_por,
        'convertido_em',  to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'score_final',    NEW.score
      )
    );

    -- 4b. Notificar o responsável pelo contato (se existir)
    IF v_responsavel_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (
        tenant_id, user_id, tipo, titulo, mensagem, link, metadata
      ) VALUES (
        v_tenant_id,
        v_responsavel_id,
        'conversao',
        'Lead convertido: ' || v_nome_contato,
        v_nome_contato || ' foi convertido de Lead para Cliente.',
        '/crm/clientes/' || NEW.id::text,
        jsonb_build_object('contato_id', NEW.id, 'score_final', NEW.score)
      );
    END IF;

    -- 4c. Notificar membros do time vinculado (se houver time_id)
    IF NEW.time_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
      INSERT INTO public.notificacoes (tenant_id, user_id, tipo, titulo, mensagem, link, metadata)
      SELECT
        v_tenant_id,
        m.user_id,
        'conversao',
        'Lead convertido: ' || v_nome_contato,
        v_nome_contato || ' foi convertido para Cliente no seu time.',
        '/crm/clientes/' || NEW.id::text,
        jsonb_build_object('contato_id', NEW.id, 'time_id', NEW.time_id)
      FROM public.org_time_membros m
      WHERE m.time_id = NEW.time_id
        AND m.user_id != COALESCE(v_responsavel_id, '00000000-0000-0000-0000-000000000000'::uuid);
    END IF;

  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_processar_conversao_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_projetos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_projetos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_sidebar_prefs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_sidebar_prefs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_suporte_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_suporte_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_tarefas_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_tarefas_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agenda_eventos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "criado_por" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "tipo" "text" DEFAULT 'reuniao'::"text" NOT NULL,
    "status" "text" DEFAULT 'agendado'::"text" NOT NULL,
    "data_inicio" timestamp with time zone NOT NULL,
    "data_fim" timestamp with time zone,
    "dia_inteiro" boolean DEFAULT false NOT NULL,
    "local" "text",
    "link_reuniao" "text",
    "participantes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "cor" "text" DEFAULT '#6366f1'::"text",
    "recorrencia" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "agenda_eventos_status_check" CHECK (("status" = ANY (ARRAY['agendado'::"text", 'concluido'::"text", 'cancelado'::"text", 'em_andamento'::"text"]))),
    CONSTRAINT "agenda_eventos_tipo_check" CHECK (("tipo" = ANY (ARRAY['reuniao'::"text", 'tarefa'::"text", 'lembrete'::"text", 'ligacao'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."agenda_eventos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "titulo" "text" DEFAULT 'Nova conversa'::"text" NOT NULL,
    "modelo" "text" DEFAULT 'gpt-4o-mini'::"text" NOT NULL,
    "total_tokens" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'ativa'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_conversations_status_check" CHECK (("status" = ANY (ARRAY['ativa'::"text", 'arquivada'::"text"])))
);


ALTER TABLE "public"."ai_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "remetente" "text" NOT NULL,
    "conteudo" "text" NOT NULL,
    "tokens_usados" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ai_messages_remetente_check" CHECK (("remetente" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."ai_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "user_id" "uuid",
    "user_email" "text",
    "user_cargo" "text",
    "acao" "text" NOT NULL,
    "recurso" "text",
    "recurso_id" "text",
    "descricao" "text",
    "dados_anteriores" "jsonb",
    "dados_novos" "jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "metodo_http" "text",
    "rota" "text",
    "resultado" "text" DEFAULT 'success'::"text",
    "codigo_erro" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "audit_logs_resultado_check" CHECK (("resultado" = ANY (ARRAY['success'::"text", 'failure'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_canais" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text",
    "tipo" "text" DEFAULT 'grupo'::"text" NOT NULL,
    "projeto_id" "uuid",
    "time_id" "uuid",
    "descricao" "text",
    "icone" "text" DEFAULT '💬'::"text",
    "arquivado" boolean DEFAULT false NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_canais_tipo_check" CHECK (("tipo" = ANY (ARRAY['direto'::"text", 'grupo'::"text", 'projeto'::"text", 'time'::"text"])))
);


ALTER TABLE "public"."chat_canais" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_canais" IS 'Canais de chat: direto (1:1), grupo, vinculado a projeto ou time';



COMMENT ON COLUMN "public"."chat_canais"."nome" IS 'NULL para canais diretos — nome exibido é gerado a partir dos membros';



CREATE TABLE IF NOT EXISTS "public"."chat_membros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "canal_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ultimo_lido_em" timestamp with time zone,
    "silenciado" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_membros" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_membros" IS 'Membros de um canal de chat com controle de leitura';



CREATE TABLE IF NOT EXISTS "public"."chat_mensagens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "canal_id" "uuid" NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "conteudo" "text" NOT NULL,
    "tipo" "text" DEFAULT 'texto'::"text" NOT NULL,
    "resposta_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "editado_em" timestamp with time zone,
    "deletado_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_mensagens_tipo_check" CHECK (("tipo" = ANY (ARRAY['texto'::"text", 'arquivo'::"text", 'imagem'::"text", 'sistema'::"text", 'resposta'::"text"])))
);


ALTER TABLE "public"."chat_mensagens" OWNER TO "postgres";


COMMENT ON TABLE "public"."chat_mensagens" IS 'Mensagens de um canal de chat com suporte a respostas (threads)';



COMMENT ON COLUMN "public"."chat_mensagens"."deletado_em" IS 'Soft delete — mensagem deletada mantém registro mas conteúdo é ocultado';



CREATE TABLE IF NOT EXISTS "public"."crm_campos_customizados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "time_id" "uuid",
    "modulo" "text" DEFAULT 'crm'::"text" NOT NULL,
    "nome" "text" NOT NULL,
    "label" "text" NOT NULL,
    "tipo" "text" DEFAULT 'text'::"text" NOT NULL,
    "opcoes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "obrigatorio" boolean DEFAULT false NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_campos_customizados_modulo_check" CHECK (("modulo" = ANY (ARRAY['crm'::"text", 'agenda'::"text", 'outbound'::"text"]))),
    CONSTRAINT "crm_campos_customizados_tipo_check" CHECK (("tipo" = ANY (ARRAY['text'::"text", 'number'::"text", 'date'::"text", 'boolean'::"text", 'select'::"text", 'multiselect'::"text", 'url'::"text", 'email'::"text"])))
);


ALTER TABLE "public"."crm_campos_customizados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_contatos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid",
    "responsavel_id" "uuid",
    "nome" "text" NOT NULL,
    "email" "text",
    "telefone" "text",
    "empresa" "text",
    "cargo" "text",
    "origem" "text" DEFAULT 'manual'::"text",
    "status_funil" "text" DEFAULT 'lead'::"text" NOT NULL,
    "valor_estimado" numeric(12,2),
    "observacoes" "text",
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "atualizado_em" timestamp with time zone DEFAULT "now"(),
    "tipo_registro" "text" DEFAULT 'lead'::"text" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "score_historico" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "origem_detalhes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "convertido_em" timestamp with time zone,
    "convertido_por" "uuid",
    "time_id" "uuid",
    "ltv" numeric DEFAULT 0 NOT NULL,
    "data_inicio_contrato" timestamp with time zone,
    "data_fim_contrato" timestamp with time zone,
    CONSTRAINT "crm_contatos_status_funil_check" CHECK (("status_funil" = ANY (ARRAY['lead'::"text", 'qualificado'::"text", 'proposta'::"text", 'negociacao'::"text", 'fechado'::"text", 'perdido'::"text"]))),
    CONSTRAINT "crm_contatos_tipo_registro_check" CHECK (("tipo_registro" = ANY (ARRAY['lead'::"text", 'cliente'::"text"])))
);


ALTER TABLE "public"."crm_contatos" OWNER TO "postgres";


COMMENT ON TABLE "public"."crm_contatos" IS 'Contatos CRM (leads e clientes). RLS v2: contatos sem time_id são visíveis para todo o tenant; contatos com time_id são visíveis apenas para membros do time, responsável direto e Líderes Gerais (permissão usuarios.gerenciar).';



CREATE TABLE IF NOT EXISTS "public"."crm_documentos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "contato_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "tipo" "text" DEFAULT 'outro'::"text" NOT NULL,
    "url" "text" NOT NULL,
    "mime_type" "text",
    "tamanho_kb" integer,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_documentos_tipo_check" CHECK (("tipo" = ANY (ARRAY['contrato'::"text", 'proposta'::"text", 'nf'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."crm_documentos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_interacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contato_id" "uuid" NOT NULL,
    "tenant_id" "uuid",
    "criado_por" "uuid",
    "tipo" "text" DEFAULT 'nota'::"text" NOT NULL,
    "conteudo" "text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"(),
    "time_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    CONSTRAINT "crm_interacoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['nota'::"text", 'ligacao'::"text", 'email'::"text", 'reuniao'::"text", 'whatsapp'::"text", 'outro'::"text", 'conversao'::"text"])))
);


ALTER TABLE "public"."crm_interacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_valores_customizados" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "campo_id" "uuid" NOT NULL,
    "contato_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "valor" "text",
    "valor_json" "jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."crm_valores_customizados" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crm_vinculos_times" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "contato_id" "uuid" NOT NULL,
    "time_origem_id" "uuid" NOT NULL,
    "time_destino_id" "uuid" NOT NULL,
    "tipo_vinculo" "text" DEFAULT 'referencia'::"text" NOT NULL,
    "metadados" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "crm_vinculos_times_tipo_vinculo_check" CHECK (("tipo_vinculo" = ANY (ARRAY['referencia'::"text", 'transferencia'::"text", 'colaboracao'::"text"])))
);


ALTER TABLE "public"."crm_vinculos_times" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_time_membros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "time_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cargo_id" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_time_membros" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_time_membros" IS 'Membros de cada time com cargo específico no time';



CREATE TABLE IF NOT EXISTS "public"."org_times" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "icone" "text" DEFAULT '👥'::"text" NOT NULL,
    "cor_primaria" "text" DEFAULT '#6366f1'::"text" NOT NULL,
    "cor_texto" "text" DEFAULT '#ffffff'::"text" NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_times" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_times" IS 'Times por organização com identidade visual própria';



CREATE OR REPLACE VIEW "public"."crm_vinculos_times_view" AS
 SELECT "v"."id",
    "v"."tenant_id",
    "v"."contato_id",
    "v"."time_origem_id",
    "v"."time_destino_id",
    "v"."tipo_vinculo",
    "v"."metadados",
    "v"."criado_por",
    "v"."criado_em",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."org_time_membros" "m"
              WHERE (("m"."time_id" = "v"."time_origem_id") AND ("m"."user_id" = "auth"."uid"())))) THEN "c"."nome"
            ELSE '[Contato Restrito]'::"text"
        END AS "contato_nome_display",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."org_time_membros" "m"
              WHERE (("m"."time_id" = "v"."time_origem_id") AND ("m"."user_id" = "auth"."uid"())))) THEN "c"."status_funil"
            ELSE NULL::"text"
        END AS "contato_status_display",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."org_time_membros" "m"
              WHERE (("m"."time_id" = "v"."time_origem_id") AND ("m"."user_id" = "auth"."uid"())))) THEN "c"."email"
            ELSE NULL::"text"
        END AS "contato_email_display",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."org_time_membros" "m"
              WHERE (("m"."time_id" = "v"."time_origem_id") AND ("m"."user_id" = "auth"."uid"())))) THEN "c"."empresa"
            ELSE NULL::"text"
        END AS "contato_empresa_display",
        CASE
            WHEN (EXISTS ( SELECT 1
               FROM "public"."org_time_membros" "m"
              WHERE (("m"."time_id" = "v"."time_origem_id") AND ("m"."user_id" = "auth"."uid"())))) THEN true
            ELSE false
        END AS "tem_acesso_completo",
    "torigem"."nome" AS "time_origem_nome",
    "torigem"."icone" AS "time_origem_icone",
    "torigem"."cor_primaria" AS "time_origem_cor",
    "tdestino"."nome" AS "time_destino_nome",
    "tdestino"."icone" AS "time_destino_icone",
    "tdestino"."cor_primaria" AS "time_destino_cor"
   FROM ((("public"."crm_vinculos_times" "v"
     JOIN "public"."crm_contatos" "c" ON (("c"."id" = "v"."contato_id")))
     JOIN "public"."org_times" "torigem" ON (("torigem"."id" = "v"."time_origem_id")))
     JOIN "public"."org_times" "tdestino" ON (("tdestino"."id" = "v"."time_destino_id")));


ALTER VIEW "public"."crm_vinculos_times_view" OWNER TO "postgres";


COMMENT ON VIEW "public"."crm_vinculos_times_view" IS 'View de vínculos entre times com controle de acesso condicional. Exibe dados completos do contato apenas se o usuário autenticado for membro do time de origem. Caso contrário, exibe apenas nome mascarado e status do funil.';



CREATE TABLE IF NOT EXISTS "public"."feed_comentarios" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "postagem_id" "uuid" NOT NULL,
    "autor_id" "uuid" NOT NULL,
    "conteudo" "text" NOT NULL,
    "editado_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feed_comentarios" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_comentarios" IS 'Comentários nas postagens do feed';



CREATE TABLE IF NOT EXISTS "public"."feed_postagens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "time_id" "uuid",
    "autor_id" "uuid" NOT NULL,
    "conteudo" "text" NOT NULL,
    "tipo" "text" DEFAULT 'texto'::"text" NOT NULL,
    "fixado" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "editado_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "feed_postagens_tipo_check" CHECK (("tipo" = ANY (ARRAY['texto'::"text", 'anuncio'::"text", 'conquista'::"text", 'atualizacao'::"text", 'pergunta'::"text"])))
);


ALTER TABLE "public"."feed_postagens" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_postagens" IS 'Postagens do feed social da organização ou de um time';



COMMENT ON COLUMN "public"."feed_postagens"."time_id" IS 'NULL = feed global da organização; UUID = feed de um time específico';



COMMENT ON COLUMN "public"."feed_postagens"."metadata" IS 'Dados extras: { anexos: [], mencoes: [], link_preview: {} }';



CREATE TABLE IF NOT EXISTS "public"."feed_reacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "postagem_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" DEFAULT '👍'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."feed_reacoes" OWNER TO "postgres";


COMMENT ON TABLE "public"."feed_reacoes" IS 'Reações emoji às postagens do feed';



CREATE TABLE IF NOT EXISTS "public"."keep_alive" (
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."keep_alive" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."keep_alive_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."keep_alive_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."keep_alive_id_seq" OWNED BY "public"."keep_alive"."id";



CREATE TABLE IF NOT EXISTS "public"."modulos_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "time_id" "uuid",
    "modulo_slug" "text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "modulos_config_modulo_slug_check" CHECK (("modulo_slug" = ANY (ARRAY['dashboard'::"text", 'calendario'::"text", 'projetos'::"text", 'tarefas'::"text", 'feed'::"text", 'chat'::"text", 'times_pessoas'::"text", 'crm'::"text"])))
);


ALTER TABLE "public"."modulos_config" OWNER TO "postgres";


COMMENT ON TABLE "public"."modulos_config" IS 'Configuração e ordem dos módulos por time ou área global da organização';



COMMENT ON COLUMN "public"."modulos_config"."time_id" IS 'NULL = configuração global da organização; UUID = configuração específica do time';



COMMENT ON COLUMN "public"."modulos_config"."modulo_slug" IS 'Identificador único do módulo';



COMMENT ON COLUMN "public"."modulos_config"."config" IS 'Configurações específicas do módulo (ex: widgets do dashboard, filtros padrão)';



CREATE TABLE IF NOT EXISTS "public"."notificacoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tipo" "text" DEFAULT 'info'::"text" NOT NULL,
    "titulo" "text" NOT NULL,
    "mensagem" "text",
    "lida" boolean DEFAULT false NOT NULL,
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "notificacoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['info'::"text", 'sucesso'::"text", 'alerta'::"text", 'erro'::"text", 'conversao'::"text", 'vinculo'::"text"])))
);


ALTER TABLE "public"."notificacoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_cargos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "permissoes" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "e_padrao" boolean DEFAULT false NOT NULL,
    "e_sistema" boolean DEFAULT false NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_cargos" OWNER TO "postgres";


COMMENT ON TABLE "public"."org_cargos" IS 'Cargos customizáveis por organização com permissões granulares';



COMMENT ON COLUMN "public"."org_cargos"."permissoes" IS 'Array de slugs: crm.ver, crm.criar, agenda.ver, etc.';



COMMENT ON COLUMN "public"."org_cargos"."e_sistema" IS 'true = cargo de sistema, não pode ser excluído';



CREATE TABLE IF NOT EXISTS "public"."outbound_acoes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "contato_nome" "text" NOT NULL,
    "contato_email" "text",
    "contato_telefone" "text",
    "tipo" "text" DEFAULT 'email'::"text" NOT NULL,
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "assunto" "text",
    "conteudo" "text",
    "enviado_em" timestamp with time zone,
    "proxima_acao_em" timestamp with time zone,
    "notas" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "outbound_acoes_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'enviado'::"text", 'respondido'::"text", 'sem_resposta'::"text", 'cancelado'::"text"]))),
    CONSTRAINT "outbound_acoes_tipo_check" CHECK (("tipo" = ANY (ARRAY['email'::"text", 'whatsapp'::"text", 'ligacao'::"text", 'linkedin'::"text", 'outro'::"text"])))
);


ALTER TABLE "public"."outbound_acoes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "preco_mensal" numeric(10,2) DEFAULT 0 NOT NULL,
    "preco_anual" numeric(10,2),
    "limite_usuarios" integer DEFAULT 5 NOT NULL,
    "limite_contatos" integer DEFAULT 500 NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "destaque" boolean DEFAULT false NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."planos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projeto_membros" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "projeto_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "papel" "text" DEFAULT 'membro'::"text" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "projeto_membros_papel_check" CHECK (("papel" = ANY (ARRAY['lider'::"text", 'membro'::"text", 'observador'::"text"])))
);


ALTER TABLE "public"."projeto_membros" OWNER TO "postgres";


COMMENT ON TABLE "public"."projeto_membros" IS 'Membros adicionais de um projeto (além dos membros do time)';



CREATE TABLE IF NOT EXISTS "public"."projeto_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "projeto_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "data_alvo" "date",
    "concluido" boolean DEFAULT false NOT NULL,
    "concluido_em" timestamp with time zone,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."projeto_milestones" OWNER TO "postgres";


COMMENT ON TABLE "public"."projeto_milestones" IS 'Marcos/milestones de um projeto';



CREATE TABLE IF NOT EXISTS "public"."projetos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "time_id" "uuid",
    "nome" "text" NOT NULL,
    "descricao" "text",
    "status" "text" DEFAULT 'planejamento'::"text" NOT NULL,
    "prioridade" "text" DEFAULT 'media'::"text" NOT NULL,
    "cor" "text" DEFAULT '#6366f1'::"text" NOT NULL,
    "icone" "text" DEFAULT '📁'::"text" NOT NULL,
    "data_inicio" "date",
    "data_fim" "date",
    "progresso" integer DEFAULT 0 NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "projetos_prioridade_check" CHECK (("prioridade" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'critica'::"text"]))),
    CONSTRAINT "projetos_progresso_check" CHECK ((("progresso" >= 0) AND ("progresso" <= 100))),
    CONSTRAINT "projetos_status_check" CHECK (("status" = ANY (ARRAY['planejamento'::"text", 'em_andamento'::"text", 'pausado'::"text", 'concluido'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."projetos" OWNER TO "postgres";


COMMENT ON TABLE "public"."projetos" IS 'Projetos de alto nível, podendo ser multi-time ou globais';



COMMENT ON COLUMN "public"."projetos"."time_id" IS 'NULL = projeto global da organização; UUID = projeto de um time específico';



CREATE TABLE IF NOT EXISTS "public"."recursos_plano" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "plano_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "habilitado" boolean DEFAULT true NOT NULL,
    "limite" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recursos_plano" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sidebar_preferencias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "itens" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."sidebar_preferencias" OWNER TO "postgres";


COMMENT ON TABLE "public"."sidebar_preferencias" IS 'Preferências individuais da barra lateral por usuário (ordem e visibilidade dos itens)';



COMMENT ON COLUMN "public"."sidebar_preferencias"."itens" IS 'Array JSON: [{slug, visivel, ordem}]. Itens não listados usam defaults.';



CREATE TABLE IF NOT EXISTS "public"."suporte_kb_artigos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "categoria_id" "uuid",
    "titulo" "text" NOT NULL,
    "conteudo" "text",
    "publicado" boolean DEFAULT false NOT NULL,
    "visualizacoes" integer DEFAULT 0 NOT NULL,
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suporte_kb_artigos" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_kb_artigos" IS 'Artigos da base de conhecimento';



COMMENT ON COLUMN "public"."suporte_kb_artigos"."publicado" IS 'false = rascunho (visível só para admin/manager); true = publicado';



CREATE TABLE IF NOT EXISTS "public"."suporte_kb_categorias" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "icone" "text" DEFAULT '📚'::"text" NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suporte_kb_categorias" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_kb_categorias" IS 'Categorias da base de conhecimento';



CREATE TABLE IF NOT EXISTS "public"."suporte_status_componentes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "descricao" "text",
    "status" "text" DEFAULT 'operacional'::"text" NOT NULL,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "suporte_status_componentes_status_check" CHECK (("status" = ANY (ARRAY['operacional'::"text", 'degradado'::"text", 'instavel'::"text", 'em_manutencao'::"text", 'fora_do_ar'::"text"])))
);


ALTER TABLE "public"."suporte_status_componentes" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_status_componentes" IS 'Componentes monitorados na página de Status do Sistema';



CREATE TABLE IF NOT EXISTS "public"."suporte_status_incidentes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "componente_id" "uuid",
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "impacto" "text" DEFAULT 'menor'::"text" NOT NULL,
    "resolvido" boolean DEFAULT false NOT NULL,
    "resolvido_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "suporte_status_incidentes_impacto_check" CHECK (("impacto" = ANY (ARRAY['menor'::"text", 'maior'::"text", 'critico'::"text"])))
);


ALTER TABLE "public"."suporte_status_incidentes" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_status_incidentes" IS 'Incidentes registrados na página de Status do Sistema';



CREATE TABLE IF NOT EXISTS "public"."suporte_ticket_mensagens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "autor_id" "uuid",
    "conteudo" "text" NOT NULL,
    "interno" boolean DEFAULT false NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."suporte_ticket_mensagens" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_ticket_mensagens" IS 'Mensagens de um ticket (thread de atendimento)';



COMMENT ON COLUMN "public"."suporte_ticket_mensagens"."interno" IS 'true = nota interna do time; false = resposta visível ao cliente';



CREATE TABLE IF NOT EXISTS "public"."suporte_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "assunto" "text" NOT NULL,
    "descricao" "text",
    "categoria" "text" DEFAULT 'duvida'::"text" NOT NULL,
    "status" "text" DEFAULT 'aberto'::"text" NOT NULL,
    "prioridade" "text" DEFAULT 'media'::"text" NOT NULL,
    "criado_por" "uuid",
    "responsavel_id" "uuid",
    "resolvido_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "suporte_tickets_categoria_check" CHECK (("categoria" = ANY (ARRAY['duvida'::"text", 'problema_tecnico'::"text", 'financeiro'::"text", 'sugestao'::"text", 'outro'::"text"]))),
    CONSTRAINT "suporte_tickets_prioridade_check" CHECK (("prioridade" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'critica'::"text"]))),
    CONSTRAINT "suporte_tickets_status_check" CHECK (("status" = ANY (ARRAY['aberto'::"text", 'em_atendimento'::"text", 'aguardando_cliente'::"text", 'resolvido'::"text", 'fechado'::"text"])))
);


ALTER TABLE "public"."suporte_tickets" OWNER TO "postgres";


COMMENT ON TABLE "public"."suporte_tickets" IS 'Tickets de suporte abertos pela organização';



COMMENT ON COLUMN "public"."suporte_tickets"."criado_por" IS 'Usuário que abriu o ticket';



COMMENT ON COLUMN "public"."suporte_tickets"."responsavel_id" IS 'Agente responsável pelo atendimento (NULL = não atribuído)';



CREATE TABLE IF NOT EXISTS "public"."tarefa_atribuicoes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tarefa_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tarefa_atribuicoes" OWNER TO "postgres";


COMMENT ON TABLE "public"."tarefa_atribuicoes" IS 'Usuários atribuídos a uma tarefa';



CREATE TABLE IF NOT EXISTS "public"."tarefa_checklist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tarefa_id" "uuid" NOT NULL,
    "texto" "text" NOT NULL,
    "concluido" boolean DEFAULT false NOT NULL,
    "concluido_em" timestamp with time zone,
    "ordem" integer DEFAULT 0 NOT NULL,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tarefa_checklist" OWNER TO "postgres";


COMMENT ON TABLE "public"."tarefa_checklist" IS 'Itens de checklist de uma tarefa';



CREATE TABLE IF NOT EXISTS "public"."tarefas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tenant_id" "uuid" NOT NULL,
    "time_id" "uuid",
    "projeto_id" "uuid",
    "milestone_id" "uuid",
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "prioridade" "text" DEFAULT 'media'::"text" NOT NULL,
    "data_vencimento" timestamp with time zone,
    "estimativa_h" numeric(6,2),
    "criado_por" "uuid",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tarefas_prioridade_check" CHECK (("prioridade" = ANY (ARRAY['baixa'::"text", 'media'::"text", 'alta'::"text", 'critica'::"text"]))),
    CONSTRAINT "tarefas_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_andamento'::"text", 'em_revisao'::"text", 'concluida'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."tarefas" OWNER TO "postgres";


COMMENT ON TABLE "public"."tarefas" IS 'Tarefas operacionais, podendo estar vinculadas a projetos e milestones';



CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "nome" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "email_contato" "text",
    "plano" "text" DEFAULT 'starter'::"text" NOT NULL,
    "status" "text" DEFAULT 'ativo'::"text" NOT NULL,
    "limite_usuarios" integer DEFAULT 5 NOT NULL,
    "configuracoes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "suspenso_em" timestamp with time zone,
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "logo_url" "text",
    "identidade_visual" "jsonb" DEFAULT '{"fonte": "Inter", "cor_acento": "#ffffff", "cor_primaria": "#1e3a5f", "cor_secundaria": "#000000"}'::"jsonb" NOT NULL,
    CONSTRAINT "tenants_plano_check" CHECK (("plano" = ANY (ARRAY['starter'::"text", 'pro'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "tenants_status_check" CHECK (("status" = ANY (ARRAY['ativo'::"text", 'suspenso'::"text", 'cancelado'::"text"])))
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tenants"."logo_url" IS 'URL da logo da organização (armazenada no Supabase Storage)';



COMMENT ON COLUMN "public"."tenants"."identidade_visual" IS 'Cores e fonte da identidade visual da organização';



CREATE TABLE IF NOT EXISTS "public"."user_preferencias" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tema" "text" DEFAULT 'escuro'::"text" NOT NULL,
    "notif_email" boolean DEFAULT true NOT NULL,
    "notif_sistema" boolean DEFAULT true NOT NULL,
    "idioma" "text" DEFAULT 'pt-BR'::"text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_preferencias_tema_check" CHECK (("tema" = ANY (ARRAY['escuro'::"text", 'claro'::"text"])))
);


ALTER TABLE "public"."user_preferencias" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "tenant_id" "uuid",
    "nome" "text" NOT NULL,
    "email" "text" NOT NULL,
    "senha_hash" "text",
    "cargo" "text" DEFAULT 'member'::"text" NOT NULL,
    "permissoes" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "tentativas_login_falhas" integer DEFAULT 0 NOT NULL,
    "bloqueado_ate" timestamp with time zone,
    "ultimo_login" timestamp with time zone,
    "refresh_token_hash" "text",
    "criado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "atualizado_em" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cargo_id" "uuid",
    CONSTRAINT "users_cargo_check" CHECK (("cargo" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'manager'::"text", 'member'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."cargo_id" IS 'Cargo customizável da organização (substitui gradualmente o campo cargo enum)';



ALTER TABLE ONLY "public"."keep_alive" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."keep_alive_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agenda_eventos"
    ADD CONSTRAINT "agenda_eventos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_canais"
    ADD CONSTRAINT "chat_canais_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_membros"
    ADD CONSTRAINT "chat_membros_canal_id_user_id_key" UNIQUE ("canal_id", "user_id");



ALTER TABLE ONLY "public"."chat_membros"
    ADD CONSTRAINT "chat_membros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_mensagens"
    ADD CONSTRAINT "chat_mensagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_campos_customizados"
    ADD CONSTRAINT "crm_campos_customizados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_contatos"
    ADD CONSTRAINT "crm_contatos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_documentos"
    ADD CONSTRAINT "crm_documentos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_interacoes"
    ADD CONSTRAINT "crm_interacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_valores_customizados"
    ADD CONSTRAINT "crm_valores_customizados_campo_id_contato_id_key" UNIQUE ("campo_id", "contato_id");



ALTER TABLE ONLY "public"."crm_valores_customizados"
    ADD CONSTRAINT "crm_valores_customizados_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_contato_id_time_origem_id_time_destino_i_key" UNIQUE ("contato_id", "time_origem_id", "time_destino_id");



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_comentarios"
    ADD CONSTRAINT "feed_comentarios_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_postagens"
    ADD CONSTRAINT "feed_postagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_reacoes"
    ADD CONSTRAINT "feed_reacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feed_reacoes"
    ADD CONSTRAINT "feed_reacoes_postagem_id_user_id_emoji_key" UNIQUE ("postagem_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."keep_alive"
    ADD CONSTRAINT "keep_alive_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modulos_config"
    ADD CONSTRAINT "modulos_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_cargos"
    ADD CONSTRAINT "org_cargos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_cargos"
    ADD CONSTRAINT "org_cargos_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");



ALTER TABLE ONLY "public"."org_time_membros"
    ADD CONSTRAINT "org_time_membros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_time_membros"
    ADD CONSTRAINT "org_time_membros_time_id_user_id_key" UNIQUE ("time_id", "user_id");



ALTER TABLE ONLY "public"."org_times"
    ADD CONSTRAINT "org_times_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_times"
    ADD CONSTRAINT "org_times_tenant_id_nome_key" UNIQUE ("tenant_id", "nome");



ALTER TABLE ONLY "public"."outbound_acoes"
    ADD CONSTRAINT "outbound_acoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planos"
    ADD CONSTRAINT "planos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planos"
    ADD CONSTRAINT "planos_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."projeto_membros"
    ADD CONSTRAINT "projeto_membros_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projeto_membros"
    ADD CONSTRAINT "projeto_membros_projeto_id_user_id_key" UNIQUE ("projeto_id", "user_id");



ALTER TABLE ONLY "public"."projeto_milestones"
    ADD CONSTRAINT "projeto_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recursos_plano"
    ADD CONSTRAINT "recursos_plano_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recursos_plano"
    ADD CONSTRAINT "recursos_plano_plano_id_slug_key" UNIQUE ("plano_id", "slug");



ALTER TABLE ONLY "public"."sidebar_preferencias"
    ADD CONSTRAINT "sidebar_preferencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sidebar_preferencias"
    ADD CONSTRAINT "sidebar_preferencias_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."suporte_kb_artigos"
    ADD CONSTRAINT "suporte_kb_artigos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suporte_kb_categorias"
    ADD CONSTRAINT "suporte_kb_categorias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suporte_status_componentes"
    ADD CONSTRAINT "suporte_status_componentes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suporte_status_incidentes"
    ADD CONSTRAINT "suporte_status_incidentes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suporte_ticket_mensagens"
    ADD CONSTRAINT "suporte_ticket_mensagens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suporte_tickets"
    ADD CONSTRAINT "suporte_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tarefa_atribuicoes"
    ADD CONSTRAINT "tarefa_atribuicoes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tarefa_atribuicoes"
    ADD CONSTRAINT "tarefa_atribuicoes_tarefa_id_user_id_key" UNIQUE ("tarefa_id", "user_id");



ALTER TABLE ONLY "public"."tarefa_checklist"
    ADD CONSTRAINT "tarefa_checklist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_preferencias"
    ADD CONSTRAINT "user_preferencias_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferencias"
    ADD CONSTRAINT "user_preferencias_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_agenda_criado_por" ON "public"."agenda_eventos" USING "btree" ("criado_por");



CREATE INDEX "idx_agenda_data_inicio" ON "public"."agenda_eventos" USING "btree" ("data_inicio");



CREATE INDEX "idx_agenda_status" ON "public"."agenda_eventos" USING "btree" ("status");



CREATE INDEX "idx_agenda_tenant" ON "public"."agenda_eventos" USING "btree" ("tenant_id");



CREATE INDEX "idx_ai_conv_user" ON "public"."ai_conversations" USING "btree" ("user_id");



CREATE INDEX "idx_ai_msg_conv" ON "public"."ai_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_audit_logs_criado" ON "public"."audit_logs" USING "btree" ("criado_em" DESC);



CREATE INDEX "idx_audit_logs_tenant" ON "public"."audit_logs" USING "btree" ("tenant_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_chat_canais_projeto" ON "public"."chat_canais" USING "btree" ("projeto_id") WHERE ("projeto_id" IS NOT NULL);



CREATE INDEX "idx_chat_canais_tenant" ON "public"."chat_canais" USING "btree" ("tenant_id");



CREATE INDEX "idx_chat_canais_time" ON "public"."chat_canais" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_chat_canais_tipo" ON "public"."chat_canais" USING "btree" ("tenant_id", "tipo");



CREATE INDEX "idx_chat_membros_canal" ON "public"."chat_membros" USING "btree" ("canal_id");



CREATE INDEX "idx_chat_membros_user" ON "public"."chat_membros" USING "btree" ("user_id");



CREATE INDEX "idx_chat_mensagens_ativas" ON "public"."chat_mensagens" USING "btree" ("canal_id", "criado_em" DESC) WHERE ("deletado_em" IS NULL);



CREATE INDEX "idx_chat_mensagens_autor" ON "public"."chat_mensagens" USING "btree" ("autor_id");



CREATE INDEX "idx_chat_mensagens_canal" ON "public"."chat_mensagens" USING "btree" ("canal_id", "criado_em" DESC);



CREATE UNIQUE INDEX "idx_crm_campos_global_unique" ON "public"."crm_campos_customizados" USING "btree" ("tenant_id", "modulo", "nome") WHERE ("time_id" IS NULL);



CREATE INDEX "idx_crm_campos_time_id" ON "public"."crm_campos_customizados" USING "btree" ("tenant_id", "time_id", "modulo", "ordem");



CREATE UNIQUE INDEX "idx_crm_campos_time_unique" ON "public"."crm_campos_customizados" USING "btree" ("tenant_id", "time_id", "modulo", "nome") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_crm_contatos_resp" ON "public"."crm_contatos" USING "btree" ("responsavel_id");



CREATE INDEX "idx_crm_contatos_score" ON "public"."crm_contatos" USING "btree" ("tenant_id", "score" DESC);



CREATE INDEX "idx_crm_contatos_status" ON "public"."crm_contatos" USING "btree" ("status_funil");



CREATE INDEX "idx_crm_contatos_tenant" ON "public"."crm_contatos" USING "btree" ("tenant_id");



CREATE INDEX "idx_crm_contatos_time_id" ON "public"."crm_contatos" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_crm_contatos_tipo_registro" ON "public"."crm_contatos" USING "btree" ("tenant_id", "tipo_registro");



CREATE INDEX "idx_crm_documentos_contato" ON "public"."crm_documentos" USING "btree" ("contato_id");



CREATE INDEX "idx_crm_interacoes_contato" ON "public"."crm_interacoes" USING "btree" ("contato_id");



CREATE INDEX "idx_crm_interacoes_tenant" ON "public"."crm_interacoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_crm_interacoes_time" ON "public"."crm_interacoes" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_crm_valores_contato" ON "public"."crm_valores_customizados" USING "btree" ("contato_id", "campo_id");



CREATE INDEX "idx_crm_vinculos_contato" ON "public"."crm_vinculos_times" USING "btree" ("contato_id");



CREATE INDEX "idx_crm_vinculos_time_destino" ON "public"."crm_vinculos_times" USING "btree" ("tenant_id", "time_destino_id");



CREATE INDEX "idx_feed_comentarios_criado" ON "public"."feed_comentarios" USING "btree" ("postagem_id", "criado_em");



CREATE INDEX "idx_feed_comentarios_postagem" ON "public"."feed_comentarios" USING "btree" ("postagem_id");



CREATE INDEX "idx_feed_postagens_autor" ON "public"."feed_postagens" USING "btree" ("autor_id");



CREATE INDEX "idx_feed_postagens_criado" ON "public"."feed_postagens" USING "btree" ("tenant_id", "criado_em" DESC);



CREATE INDEX "idx_feed_postagens_fixado" ON "public"."feed_postagens" USING "btree" ("tenant_id", "fixado") WHERE ("fixado" = true);



CREATE INDEX "idx_feed_postagens_tenant" ON "public"."feed_postagens" USING "btree" ("tenant_id");



CREATE INDEX "idx_feed_postagens_time" ON "public"."feed_postagens" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_feed_reacoes_postagem" ON "public"."feed_reacoes" USING "btree" ("postagem_id");



CREATE INDEX "idx_modulos_config_ativo" ON "public"."modulos_config" USING "btree" ("tenant_id", "ativo") WHERE ("ativo" = true);



CREATE INDEX "idx_modulos_config_tenant" ON "public"."modulos_config" USING "btree" ("tenant_id");



CREATE INDEX "idx_modulos_config_time" ON "public"."modulos_config" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_modulos_config_unique_global" ON "public"."modulos_config" USING "btree" ("tenant_id", "modulo_slug") WHERE ("time_id" IS NULL);



CREATE UNIQUE INDEX "idx_modulos_config_unique_time" ON "public"."modulos_config" USING "btree" ("tenant_id", "time_id", "modulo_slug") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_notificacoes_user" ON "public"."notificacoes" USING "btree" ("user_id", "lida", "criado_em" DESC);



CREATE INDEX "idx_org_cargos_tenant_id" ON "public"."org_cargos" USING "btree" ("tenant_id");



CREATE INDEX "idx_org_time_membros_time_id" ON "public"."org_time_membros" USING "btree" ("time_id");



CREATE INDEX "idx_org_time_membros_user_id" ON "public"."org_time_membros" USING "btree" ("user_id");



CREATE INDEX "idx_org_times_tenant_id" ON "public"."org_times" USING "btree" ("tenant_id");



CREATE INDEX "idx_outbound_criado_em" ON "public"."outbound_acoes" USING "btree" ("criado_em" DESC);



CREATE INDEX "idx_outbound_status" ON "public"."outbound_acoes" USING "btree" ("status");



CREATE INDEX "idx_outbound_tenant_id" ON "public"."outbound_acoes" USING "btree" ("tenant_id");



CREATE INDEX "idx_outbound_tipo" ON "public"."outbound_acoes" USING "btree" ("tipo");



CREATE INDEX "idx_outbound_user_id" ON "public"."outbound_acoes" USING "btree" ("user_id");



CREATE INDEX "idx_projeto_membros_projeto" ON "public"."projeto_membros" USING "btree" ("projeto_id");



CREATE INDEX "idx_projeto_membros_user" ON "public"."projeto_membros" USING "btree" ("user_id");



CREATE INDEX "idx_projeto_milestones_projeto" ON "public"."projeto_milestones" USING "btree" ("projeto_id");



CREATE INDEX "idx_projetos_status" ON "public"."projetos" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_projetos_tenant" ON "public"."projetos" USING "btree" ("tenant_id");



CREATE INDEX "idx_projetos_time" ON "public"."projetos" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_recursos_plano_id" ON "public"."recursos_plano" USING "btree" ("plano_id");



CREATE INDEX "idx_recursos_slug" ON "public"."recursos_plano" USING "btree" ("slug");



CREATE INDEX "idx_sidebar_prefs_tenant" ON "public"."sidebar_preferencias" USING "btree" ("tenant_id");



CREATE INDEX "idx_sidebar_prefs_user" ON "public"."sidebar_preferencias" USING "btree" ("user_id");



CREATE INDEX "idx_suporte_kb_artigos_categoria" ON "public"."suporte_kb_artigos" USING "btree" ("categoria_id") WHERE ("categoria_id" IS NOT NULL);



CREATE INDEX "idx_suporte_kb_artigos_tenant" ON "public"."suporte_kb_artigos" USING "btree" ("tenant_id");



CREATE INDEX "idx_suporte_kb_categorias_tenant" ON "public"."suporte_kb_categorias" USING "btree" ("tenant_id");



CREATE INDEX "idx_suporte_status_componentes_tenant" ON "public"."suporte_status_componentes" USING "btree" ("tenant_id");



CREATE INDEX "idx_suporte_status_incidentes_tenant" ON "public"."suporte_status_incidentes" USING "btree" ("tenant_id");



CREATE INDEX "idx_suporte_ticket_mensagens_ticket" ON "public"."suporte_ticket_mensagens" USING "btree" ("ticket_id");



CREATE INDEX "idx_suporte_tickets_criado_por" ON "public"."suporte_tickets" USING "btree" ("criado_por");



CREATE INDEX "idx_suporte_tickets_responsavel" ON "public"."suporte_tickets" USING "btree" ("responsavel_id") WHERE ("responsavel_id" IS NOT NULL);



CREATE INDEX "idx_suporte_tickets_status" ON "public"."suporte_tickets" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_suporte_tickets_tenant" ON "public"."suporte_tickets" USING "btree" ("tenant_id");



CREATE INDEX "idx_tarefa_atribuicoes_tarefa" ON "public"."tarefa_atribuicoes" USING "btree" ("tarefa_id");



CREATE INDEX "idx_tarefa_atribuicoes_user" ON "public"."tarefa_atribuicoes" USING "btree" ("user_id");



CREATE INDEX "idx_tarefa_checklist_tarefa" ON "public"."tarefa_checklist" USING "btree" ("tarefa_id");



CREATE INDEX "idx_tarefas_projeto" ON "public"."tarefas" USING "btree" ("projeto_id") WHERE ("projeto_id" IS NOT NULL);



CREATE INDEX "idx_tarefas_status" ON "public"."tarefas" USING "btree" ("tenant_id", "status");



CREATE INDEX "idx_tarefas_tenant" ON "public"."tarefas" USING "btree" ("tenant_id");



CREATE INDEX "idx_tarefas_time" ON "public"."tarefas" USING "btree" ("time_id") WHERE ("time_id" IS NOT NULL);



CREATE INDEX "idx_tarefas_vencimento" ON "public"."tarefas" USING "btree" ("tenant_id", "data_vencimento") WHERE ("data_vencimento" IS NOT NULL);



CREATE INDEX "idx_user_preferencias_user_id" ON "public"."user_preferencias" USING "btree" ("user_id");



CREATE INDEX "idx_users_cargo_id" ON "public"."users" USING "btree" ("cargo_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_tenant_id" ON "public"."users" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "trg_chat_canais_updated_at" BEFORE UPDATE ON "public"."chat_canais" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_chat_updated_at"();



CREATE OR REPLACE TRIGGER "trg_chat_mensagem_atualiza_canal" AFTER INSERT ON "public"."chat_mensagens" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"();



CREATE OR REPLACE TRIGGER "trg_conversao_lead" AFTER UPDATE OF "tipo_registro" ON "public"."crm_contatos" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_processar_conversao_lead"();



CREATE OR REPLACE TRIGGER "trg_feed_comentarios_updated_at" BEFORE UPDATE ON "public"."feed_comentarios" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_feed_updated_at"();



CREATE OR REPLACE TRIGGER "trg_feed_postagens_updated_at" BEFORE UPDATE ON "public"."feed_postagens" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_feed_updated_at"();



CREATE OR REPLACE TRIGGER "trg_modulos_config_updated_at" BEFORE UPDATE ON "public"."modulos_config" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_modulos_config_updated_at"();



CREATE OR REPLACE TRIGGER "trg_projeto_milestones_updated_at" BEFORE UPDATE ON "public"."projeto_milestones" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_projetos_updated_at"();



CREATE OR REPLACE TRIGGER "trg_projetos_updated_at" BEFORE UPDATE ON "public"."projetos" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_projetos_updated_at"();



CREATE OR REPLACE TRIGGER "trg_score_lead" AFTER INSERT ON "public"."crm_interacoes" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_atualizar_score_lead"();



CREATE OR REPLACE TRIGGER "trg_sidebar_prefs_updated_at" BEFORE UPDATE ON "public"."sidebar_preferencias" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_sidebar_prefs_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suporte_kb_artigos_updated_at" BEFORE UPDATE ON "public"."suporte_kb_artigos" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_suporte_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suporte_kb_categorias_updated_at" BEFORE UPDATE ON "public"."suporte_kb_categorias" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_suporte_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suporte_status_componentes_updated_at" BEFORE UPDATE ON "public"."suporte_status_componentes" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_suporte_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suporte_status_incidentes_updated_at" BEFORE UPDATE ON "public"."suporte_status_incidentes" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_suporte_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suporte_tickets_updated_at" BEFORE UPDATE ON "public"."suporte_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_suporte_updated_at"();



CREATE OR REPLACE TRIGGER "trg_tarefas_updated_at" BEFORE UPDATE ON "public"."tarefas" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_tarefas_updated_at"();



ALTER TABLE ONLY "public"."agenda_eventos"
    ADD CONSTRAINT "agenda_eventos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agenda_eventos"
    ADD CONSTRAINT "agenda_eventos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_conversations"
    ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_messages"
    ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_canais"
    ADD CONSTRAINT "chat_canais_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_canais"
    ADD CONSTRAINT "chat_canais_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_canais"
    ADD CONSTRAINT "chat_canais_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_canais"
    ADD CONSTRAINT "chat_canais_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_membros"
    ADD CONSTRAINT "chat_membros_canal_id_fkey" FOREIGN KEY ("canal_id") REFERENCES "public"."chat_canais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_membros"
    ADD CONSTRAINT "chat_membros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_mensagens"
    ADD CONSTRAINT "chat_mensagens_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_mensagens"
    ADD CONSTRAINT "chat_mensagens_canal_id_fkey" FOREIGN KEY ("canal_id") REFERENCES "public"."chat_canais"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_mensagens"
    ADD CONSTRAINT "chat_mensagens_resposta_id_fkey" FOREIGN KEY ("resposta_id") REFERENCES "public"."chat_mensagens"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_campos_customizados"
    ADD CONSTRAINT "crm_campos_customizados_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_campos_customizados"
    ADD CONSTRAINT "crm_campos_customizados_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_contatos"
    ADD CONSTRAINT "crm_contatos_convertido_por_fkey" FOREIGN KEY ("convertido_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_contatos"
    ADD CONSTRAINT "crm_contatos_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_contatos"
    ADD CONSTRAINT "crm_contatos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_contatos"
    ADD CONSTRAINT "crm_contatos_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_documentos"
    ADD CONSTRAINT "crm_documentos_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "public"."crm_contatos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_documentos"
    ADD CONSTRAINT "crm_documentos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_documentos"
    ADD CONSTRAINT "crm_documentos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_interacoes"
    ADD CONSTRAINT "crm_interacoes_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "public"."crm_contatos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_interacoes"
    ADD CONSTRAINT "crm_interacoes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_interacoes"
    ADD CONSTRAINT "crm_interacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_interacoes"
    ADD CONSTRAINT "crm_interacoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_valores_customizados"
    ADD CONSTRAINT "crm_valores_customizados_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "public"."crm_campos_customizados"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_valores_customizados"
    ADD CONSTRAINT "crm_valores_customizados_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "public"."crm_contatos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_valores_customizados"
    ADD CONSTRAINT "crm_valores_customizados_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_contato_id_fkey" FOREIGN KEY ("contato_id") REFERENCES "public"."crm_contatos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_time_destino_id_fkey" FOREIGN KEY ("time_destino_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crm_vinculos_times"
    ADD CONSTRAINT "crm_vinculos_times_time_origem_id_fkey" FOREIGN KEY ("time_origem_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_comentarios"
    ADD CONSTRAINT "feed_comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_comentarios"
    ADD CONSTRAINT "feed_comentarios_postagem_id_fkey" FOREIGN KEY ("postagem_id") REFERENCES "public"."feed_postagens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_postagens"
    ADD CONSTRAINT "feed_postagens_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_postagens"
    ADD CONSTRAINT "feed_postagens_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_postagens"
    ADD CONSTRAINT "feed_postagens_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."feed_reacoes"
    ADD CONSTRAINT "feed_reacoes_postagem_id_fkey" FOREIGN KEY ("postagem_id") REFERENCES "public"."feed_postagens"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feed_reacoes"
    ADD CONSTRAINT "feed_reacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modulos_config"
    ADD CONSTRAINT "modulos_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modulos_config"
    ADD CONSTRAINT "modulos_config_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notificacoes"
    ADD CONSTRAINT "notificacoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_cargos"
    ADD CONSTRAINT "org_cargos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_time_membros"
    ADD CONSTRAINT "org_time_membros_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "public"."org_cargos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_time_membros"
    ADD CONSTRAINT "org_time_membros_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_time_membros"
    ADD CONSTRAINT "org_time_membros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_times"
    ADD CONSTRAINT "org_times_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."org_times"
    ADD CONSTRAINT "org_times_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outbound_acoes"
    ADD CONSTRAINT "outbound_acoes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."outbound_acoes"
    ADD CONSTRAINT "outbound_acoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projeto_membros"
    ADD CONSTRAINT "projeto_membros_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projeto_membros"
    ADD CONSTRAINT "projeto_membros_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projeto_milestones"
    ADD CONSTRAINT "projeto_milestones_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."recursos_plano"
    ADD CONSTRAINT "recursos_plano_plano_id_fkey" FOREIGN KEY ("plano_id") REFERENCES "public"."planos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sidebar_preferencias"
    ADD CONSTRAINT "sidebar_preferencias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sidebar_preferencias"
    ADD CONSTRAINT "sidebar_preferencias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_kb_artigos"
    ADD CONSTRAINT "suporte_kb_artigos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."suporte_kb_categorias"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_kb_artigos"
    ADD CONSTRAINT "suporte_kb_artigos_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_kb_artigos"
    ADD CONSTRAINT "suporte_kb_artigos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_kb_categorias"
    ADD CONSTRAINT "suporte_kb_categorias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_status_componentes"
    ADD CONSTRAINT "suporte_status_componentes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_status_incidentes"
    ADD CONSTRAINT "suporte_status_incidentes_componente_id_fkey" FOREIGN KEY ("componente_id") REFERENCES "public"."suporte_status_componentes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_status_incidentes"
    ADD CONSTRAINT "suporte_status_incidentes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_ticket_mensagens"
    ADD CONSTRAINT "suporte_ticket_mensagens_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_ticket_mensagens"
    ADD CONSTRAINT "suporte_ticket_mensagens_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."suporte_tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suporte_tickets"
    ADD CONSTRAINT "suporte_tickets_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_tickets"
    ADD CONSTRAINT "suporte_tickets_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suporte_tickets"
    ADD CONSTRAINT "suporte_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tarefa_atribuicoes"
    ADD CONSTRAINT "tarefa_atribuicoes_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tarefa_atribuicoes"
    ADD CONSTRAINT "tarefa_atribuicoes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tarefa_checklist"
    ADD CONSTRAINT "tarefa_checklist_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "public"."tarefas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "public"."projeto_milestones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tarefas"
    ADD CONSTRAINT "tarefas_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "public"."org_times"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_preferencias"
    ADD CONSTRAINT "user_preferencias_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "public"."org_cargos"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE SET NULL;



ALTER TABLE "public"."agenda_eventos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "agenda_tenant_or_owner" ON "public"."agenda_eventos" USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1)) OR ("criado_por" = "auth"."uid"())));



ALTER TABLE "public"."ai_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_conversations_owner" ON "public"."ai_conversations" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."ai_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_messages_owner" ON "public"."ai_messages" USING (("conversation_id" IN ( SELECT "ai_conversations"."id"
   FROM "public"."ai_conversations"
  WHERE ("ai_conversations"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_logs_insert" ON "public"."audit_logs" FOR INSERT WITH CHECK (("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "audit_logs_select" ON "public"."audit_logs" FOR SELECT USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1)) OR (( SELECT "users"."cargo"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1) = 'super_admin'::"text")));



ALTER TABLE "public"."chat_canais" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_canais_insert" ON "public"."chat_canais" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "chat_canais_select" ON "public"."chat_canais" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chat_membros"
  WHERE (("chat_membros"."canal_id" = "chat_canais"."id") AND ("chat_membros"."user_id" = "auth"."uid"())))));



CREATE POLICY "chat_canais_update" ON "public"."chat_canais" FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM "public"."chat_membros"
  WHERE (("chat_membros"."canal_id" = "chat_canais"."id") AND ("chat_membros"."user_id" = "auth"."uid"())))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



ALTER TABLE "public"."chat_membros" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_membros_delete" ON "public"."chat_membros" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."chat_canais" "c"
  WHERE (("c"."id" = "chat_membros"."canal_id") AND ("c"."criado_por" = "auth"."uid"()))))));



CREATE POLICY "chat_membros_insert" ON "public"."chat_membros" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."chat_canais" "c"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "c"."tenant_id")))
  WHERE (("c"."id" = "chat_membros"."canal_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "chat_membros_select" ON "public"."chat_membros" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chat_membros" "cm"
  WHERE (("cm"."canal_id" = "chat_membros"."canal_id") AND ("cm"."user_id" = "auth"."uid"())))));



CREATE POLICY "chat_membros_update" ON "public"."chat_membros" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."chat_mensagens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chat_mensagens_delete" ON "public"."chat_mensagens" FOR DELETE USING ((("autor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "chat_mensagens_insert" ON "public"."chat_mensagens" FOR INSERT WITH CHECK ((("autor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."chat_membros"
  WHERE (("chat_membros"."canal_id" = "chat_mensagens"."canal_id") AND ("chat_membros"."user_id" = "auth"."uid"()))))));



CREATE POLICY "chat_mensagens_select" ON "public"."chat_mensagens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."chat_membros"
  WHERE (("chat_membros"."canal_id" = "chat_mensagens"."canal_id") AND ("chat_membros"."user_id" = "auth"."uid"())))));



CREATE POLICY "chat_mensagens_update" ON "public"."chat_mensagens" FOR UPDATE USING ((("autor_id" = "auth"."uid"()) AND ("deletado_em" IS NULL)));



ALTER TABLE "public"."crm_campos_customizados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_campos_select" ON "public"."crm_campos_customizados" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "crm_campos_write" ON "public"."crm_campos_customizados" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."tenant_id" = "crm_campos_customizados"."tenant_id") AND ("u"."cargo" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (("time_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."org_time_membros" "m"
  WHERE (("m"."time_id" = "crm_campos_customizados"."time_id") AND ("m"."user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."crm_contatos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_contatos_delete" ON "public"."crm_contatos" FOR DELETE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("responsavel_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."org_cargos" "c" ON (("c"."id" = "u"."cargo_id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."tenant_id" = "public"."get_user_tenant_id"()) AND ("c"."permissoes" @> '["usuarios.gerenciar"]'::"jsonb")))))));



CREATE POLICY "crm_contatos_insert" ON "public"."crm_contatos" FOR INSERT WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



CREATE POLICY "crm_contatos_select" ON "public"."crm_contatos" FOR SELECT USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("time_id" IS NULL) OR ("responsavel_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."org_time_membros" "m"
  WHERE (("m"."time_id" = "crm_contatos"."time_id") AND ("m"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."org_cargos" "c" ON (("c"."id" = "u"."cargo_id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."tenant_id" = "public"."get_user_tenant_id"()) AND ("c"."permissoes" @> '["usuarios.gerenciar"]'::"jsonb")))))));



CREATE POLICY "crm_contatos_update" ON "public"."crm_contatos" FOR UPDATE USING ((("tenant_id" = "public"."get_user_tenant_id"()) AND (("time_id" IS NULL) OR ("responsavel_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."org_time_membros" "m"
  WHERE (("m"."time_id" = "crm_contatos"."time_id") AND ("m"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM ("public"."users" "u"
     JOIN "public"."org_cargos" "c" ON (("c"."id" = "u"."cargo_id")))
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."tenant_id" = "public"."get_user_tenant_id"()) AND ("c"."permissoes" @> '["usuarios.gerenciar"]'::"jsonb"))))))) WITH CHECK (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."crm_documentos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_documentos_parent_access" ON "public"."crm_documentos" USING (("contato_id" IN ( SELECT "crm_contatos"."id"
   FROM "public"."crm_contatos"
  WHERE (("crm_contatos"."tenant_id" = "public"."get_user_tenant_id"()) OR ("crm_contatos"."responsavel_id" = "auth"."uid"())))));



ALTER TABLE "public"."crm_interacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_interacoes_parent_access" ON "public"."crm_interacoes" USING (("contato_id" IN ( SELECT "crm_contatos"."id"
   FROM "public"."crm_contatos"
  WHERE (("crm_contatos"."tenant_id" = "public"."get_user_tenant_id"()) OR ("crm_contatos"."responsavel_id" = "auth"."uid"())))));



ALTER TABLE "public"."crm_valores_customizados" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_valores_parent_access" ON "public"."crm_valores_customizados" USING (("contato_id" IN ( SELECT "crm_contatos"."id"
   FROM "public"."crm_contatos"
  WHERE (("crm_contatos"."tenant_id" = "public"."get_user_tenant_id"()) OR ("crm_contatos"."responsavel_id" = "auth"."uid"())))));



CREATE POLICY "crm_vinculos_select" ON "public"."crm_vinculos_times" FOR SELECT USING (("tenant_id" = "public"."get_user_tenant_id"()));



ALTER TABLE "public"."crm_vinculos_times" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "crm_vinculos_write" ON "public"."crm_vinculos_times" USING (((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."id" = "auth"."uid"()) AND ("u"."tenant_id" = "crm_vinculos_times"."tenant_id") AND ("u"."cargo" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."org_time_membros" "m"
  WHERE (("m"."user_id" = "auth"."uid"()) AND ("m"."time_id" = ANY (ARRAY["crm_vinculos_times"."time_origem_id", "crm_vinculos_times"."time_destino_id"])))))));



ALTER TABLE "public"."feed_comentarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_comentarios_delete" ON "public"."feed_comentarios" FOR DELETE USING ((("autor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))));



CREATE POLICY "feed_comentarios_insert" ON "public"."feed_comentarios" FOR INSERT WITH CHECK ((("autor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."feed_postagens" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "feed_comentarios"."postagem_id") AND ("u"."id" = "auth"."uid"()))))));



CREATE POLICY "feed_comentarios_select" ON "public"."feed_comentarios" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."feed_postagens" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "feed_comentarios"."postagem_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "feed_comentarios_update" ON "public"."feed_comentarios" FOR UPDATE USING (("autor_id" = "auth"."uid"()));



ALTER TABLE "public"."feed_postagens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_postagens_delete" ON "public"."feed_postagens" FOR DELETE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("autor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



CREATE POLICY "feed_postagens_insert" ON "public"."feed_postagens" FOR INSERT WITH CHECK ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("autor_id" = "auth"."uid"())));



CREATE POLICY "feed_postagens_select" ON "public"."feed_postagens" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "feed_postagens_update" ON "public"."feed_postagens" FOR UPDATE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("autor_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



ALTER TABLE "public"."feed_reacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feed_reacoes_delete" ON "public"."feed_reacoes" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "feed_reacoes_insert" ON "public"."feed_reacoes" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."feed_postagens" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "feed_reacoes"."postagem_id") AND ("u"."id" = "auth"."uid"()))))));



CREATE POLICY "feed_reacoes_select" ON "public"."feed_reacoes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."feed_postagens" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "feed_reacoes"."postagem_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."keep_alive" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modulos_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "modulos_config_delete" ON "public"."modulos_config" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "modulos_config_insert" ON "public"."modulos_config" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "modulos_config_select" ON "public"."modulos_config" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "modulos_config_update" ON "public"."modulos_config" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."notificacoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notificacoes_own" ON "public"."notificacoes" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."org_cargos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_cargos_select" ON "public"."org_cargos" FOR SELECT USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



CREATE POLICY "org_cargos_write" ON "public"."org_cargos" USING (((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "org_cargos"."tenant_id") AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



ALTER TABLE "public"."org_time_membros" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_time_membros_select" ON "public"."org_time_membros" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM ("public"."org_times" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "org_time_membros"."time_id") AND ("u"."id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



CREATE POLICY "org_time_membros_write" ON "public"."org_time_membros" USING (((EXISTS ( SELECT 1
   FROM ("public"."org_times" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "org_time_membros"."time_id") AND ("u"."id" = "auth"."uid"()) AND ("u"."cargo" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



ALTER TABLE "public"."org_times" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "org_times_select" ON "public"."org_times" FOR SELECT USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



CREATE POLICY "org_times_write" ON "public"."org_times" USING (((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."tenant_id" = "org_times"."tenant_id") AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = 'super_admin'::"text"))))));



ALTER TABLE "public"."outbound_acoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "outbound_tenant_or_owner" ON "public"."outbound_acoes" USING ((("tenant_id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1)) OR ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."planos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "planos_admin_all" ON "public"."planos" USING ((( SELECT "users"."cargo"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1) = 'super_admin'::"text"));



CREATE POLICY "planos_select_all" ON "public"."planos" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."projeto_membros" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projeto_membros_delete" ON "public"."projeto_membros" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "projeto_membros"."projeto_id") AND (("p"."criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))))));



CREATE POLICY "projeto_membros_insert" ON "public"."projeto_membros" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "projeto_membros"."projeto_id") AND (("p"."criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."users"
          WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))) OR (EXISTS ( SELECT 1
           FROM "public"."projeto_membros" "pm"
          WHERE (("pm"."projeto_id" = "projeto_membros"."projeto_id") AND ("pm"."user_id" = "auth"."uid"()) AND ("pm"."papel" = 'lider'::"text")))))))));



CREATE POLICY "projeto_membros_select" ON "public"."projeto_membros" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."projetos" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "projeto_membros"."projeto_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."projeto_milestones" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projeto_milestones_delete" ON "public"."projeto_milestones" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."projetos" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "projeto_milestones"."projeto_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "projeto_milestones_insert" ON "public"."projeto_milestones" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."projetos" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "projeto_milestones"."projeto_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "projeto_milestones_select" ON "public"."projeto_milestones" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."projetos" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "projeto_milestones"."projeto_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "projeto_milestones_update" ON "public"."projeto_milestones" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."projetos" "p"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "p"."tenant_id")))
  WHERE (("p"."id" = "projeto_milestones"."projeto_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."projetos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projetos_delete" ON "public"."projetos" FOR DELETE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



CREATE POLICY "projetos_insert" ON "public"."projetos" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "projetos_select" ON "public"."projetos" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "projetos_update" ON "public"."projetos" FOR UPDATE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))) OR (EXISTS ( SELECT 1
   FROM "public"."projeto_membros"
  WHERE (("projeto_membros"."projeto_id" = "projetos"."id") AND ("projeto_membros"."user_id" = "auth"."uid"()) AND ("projeto_membros"."papel" = 'lider'::"text")))))));



ALTER TABLE "public"."recursos_plano" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recursos_plano_admin_all" ON "public"."recursos_plano" USING ((( SELECT "users"."cargo"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1) = 'super_admin'::"text"));



CREATE POLICY "recursos_plano_select_all" ON "public"."recursos_plano" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."sidebar_preferencias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sidebar_prefs_delete" ON "public"."sidebar_preferencias" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "sidebar_prefs_insert" ON "public"."sidebar_preferencias" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "sidebar_prefs_select" ON "public"."sidebar_preferencias" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "sidebar_prefs_update" ON "public"."sidebar_preferencias" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "super_admin_all" ON "public"."users" USING (("public"."get_user_cargo"() = 'super_admin'::"text"));



CREATE POLICY "super_admin_view_all" ON "public"."users" FOR SELECT USING (("public"."get_user_cargo"() = 'super_admin'::"text"));



ALTER TABLE "public"."suporte_kb_artigos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_kb_artigos_delete" ON "public"."suporte_kb_artigos" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_kb_artigos_insert" ON "public"."suporte_kb_artigos" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_kb_artigos_select" ON "public"."suporte_kb_artigos" FOR SELECT USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("publicado" = true) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



CREATE POLICY "suporte_kb_artigos_update" ON "public"."suporte_kb_artigos" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."suporte_kb_categorias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_kb_categorias_delete" ON "public"."suporte_kb_categorias" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_kb_categorias_insert" ON "public"."suporte_kb_categorias" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_kb_categorias_select" ON "public"."suporte_kb_categorias" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "suporte_kb_categorias_update" ON "public"."suporte_kb_categorias" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."suporte_status_componentes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_status_componentes_delete" ON "public"."suporte_status_componentes" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_status_componentes_insert" ON "public"."suporte_status_componentes" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_status_componentes_select" ON "public"."suporte_status_componentes" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "suporte_status_componentes_update" ON "public"."suporte_status_componentes" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."suporte_status_incidentes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_status_incidentes_delete" ON "public"."suporte_status_incidentes" FOR DELETE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_status_incidentes_insert" ON "public"."suporte_status_incidentes" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "suporte_status_incidentes_select" ON "public"."suporte_status_incidentes" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "suporte_status_incidentes_update" ON "public"."suporte_status_incidentes" FOR UPDATE USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."suporte_ticket_mensagens" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_ticket_mensagens_insert" ON "public"."suporte_ticket_mensagens" FOR INSERT WITH CHECK ((("autor_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."suporte_tickets" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "suporte_ticket_mensagens"."ticket_id") AND ("u"."id" = "auth"."uid"()))))));



CREATE POLICY "suporte_ticket_mensagens_select" ON "public"."suporte_ticket_mensagens" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."suporte_tickets" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "suporte_ticket_mensagens"."ticket_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."suporte_tickets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suporte_tickets_delete" ON "public"."suporte_tickets" FOR DELETE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



CREATE POLICY "suporte_tickets_insert" ON "public"."suporte_tickets" FOR INSERT WITH CHECK ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND ("criado_por" = "auth"."uid"())));



CREATE POLICY "suporte_tickets_select" ON "public"."suporte_tickets" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "suporte_tickets_update" ON "public"."suporte_tickets" FOR UPDATE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR ("responsavel_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



ALTER TABLE "public"."tarefa_atribuicoes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tarefa_atribuicoes_delete" ON "public"."tarefa_atribuicoes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_atribuicoes"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "tarefa_atribuicoes_insert" ON "public"."tarefa_atribuicoes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_atribuicoes"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "tarefa_atribuicoes_select" ON "public"."tarefa_atribuicoes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_atribuicoes"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."tarefa_checklist" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tarefa_checklist_delete" ON "public"."tarefa_checklist" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_checklist"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "tarefa_checklist_insert" ON "public"."tarefa_checklist" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_checklist"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "tarefa_checklist_select" ON "public"."tarefa_checklist" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_checklist"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



CREATE POLICY "tarefa_checklist_update" ON "public"."tarefa_checklist" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."tarefas" "t"
     JOIN "public"."users" "u" ON (("u"."tenant_id" = "t"."tenant_id")))
  WHERE (("t"."id" = "tarefa_checklist"."tarefa_id") AND ("u"."id" = "auth"."uid"())))));



ALTER TABLE "public"."tarefas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tarefas_delete" ON "public"."tarefas" FOR DELETE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



CREATE POLICY "tarefas_insert" ON "public"."tarefas" FOR INSERT WITH CHECK (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "tarefas_select" ON "public"."tarefas" FOR SELECT USING (("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))));



CREATE POLICY "tarefas_update" ON "public"."tarefas" FOR UPDATE USING ((("tenant_id" IN ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"()))) AND (("criado_por" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."tarefa_atribuicoes"
  WHERE (("tarefa_atribuicoes"."tarefa_id" = "tarefas"."id") AND ("tarefa_atribuicoes"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."cargo" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))))));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_select_own" ON "public"."tenants" FOR SELECT USING (("id" = ( SELECT "users"."tenant_id"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1)));



CREATE POLICY "tenants_super_admin_all" ON "public"."tenants" USING ((( SELECT "users"."cargo"
   FROM "public"."users"
  WHERE ("users"."id" = "auth"."uid"())
 LIMIT 1) = 'super_admin'::"text"));



ALTER TABLE "public"."user_preferencias" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_preferencias_owner" ON "public"."user_preferencias" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "user_update_self" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "user_view_own_or_tenant" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "id") OR ("tenant_id" = "public"."get_user_tenant_id"())));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_user_cargo"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_cargo"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_cargo"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."score_delta_por_tipo"("p_tipo" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."score_delta_por_tipo"("p_tipo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."score_delta_por_tipo"("p_tipo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_atualizar_score_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_atualizar_score_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_atualizar_score_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_chat_mensagem_atualiza_canal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_chat_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_chat_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_chat_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_feed_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_feed_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_feed_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_modulos_config_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_modulos_config_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_modulos_config_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_processar_conversao_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_processar_conversao_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_processar_conversao_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_projetos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_projetos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_projetos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_sidebar_prefs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_sidebar_prefs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_sidebar_prefs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_suporte_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_suporte_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_suporte_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_tarefas_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_tarefas_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_tarefas_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."agenda_eventos" TO "anon";
GRANT ALL ON TABLE "public"."agenda_eventos" TO "authenticated";
GRANT ALL ON TABLE "public"."agenda_eventos" TO "service_role";



GRANT ALL ON TABLE "public"."ai_conversations" TO "anon";
GRANT ALL ON TABLE "public"."ai_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_messages" TO "anon";
GRANT ALL ON TABLE "public"."ai_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_messages" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."chat_canais" TO "anon";
GRANT ALL ON TABLE "public"."chat_canais" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_canais" TO "service_role";



GRANT ALL ON TABLE "public"."chat_membros" TO "anon";
GRANT ALL ON TABLE "public"."chat_membros" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_membros" TO "service_role";



GRANT ALL ON TABLE "public"."chat_mensagens" TO "anon";
GRANT ALL ON TABLE "public"."chat_mensagens" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_mensagens" TO "service_role";



GRANT ALL ON TABLE "public"."crm_campos_customizados" TO "anon";
GRANT ALL ON TABLE "public"."crm_campos_customizados" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_campos_customizados" TO "service_role";



GRANT ALL ON TABLE "public"."crm_contatos" TO "anon";
GRANT ALL ON TABLE "public"."crm_contatos" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_contatos" TO "service_role";



GRANT ALL ON TABLE "public"."crm_documentos" TO "anon";
GRANT ALL ON TABLE "public"."crm_documentos" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_documentos" TO "service_role";



GRANT ALL ON TABLE "public"."crm_interacoes" TO "anon";
GRANT ALL ON TABLE "public"."crm_interacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_interacoes" TO "service_role";



GRANT ALL ON TABLE "public"."crm_valores_customizados" TO "anon";
GRANT ALL ON TABLE "public"."crm_valores_customizados" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_valores_customizados" TO "service_role";



GRANT ALL ON TABLE "public"."crm_vinculos_times" TO "anon";
GRANT ALL ON TABLE "public"."crm_vinculos_times" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_vinculos_times" TO "service_role";



GRANT ALL ON TABLE "public"."org_time_membros" TO "anon";
GRANT ALL ON TABLE "public"."org_time_membros" TO "authenticated";
GRANT ALL ON TABLE "public"."org_time_membros" TO "service_role";



GRANT ALL ON TABLE "public"."org_times" TO "anon";
GRANT ALL ON TABLE "public"."org_times" TO "authenticated";
GRANT ALL ON TABLE "public"."org_times" TO "service_role";



GRANT ALL ON TABLE "public"."crm_vinculos_times_view" TO "anon";
GRANT ALL ON TABLE "public"."crm_vinculos_times_view" TO "authenticated";
GRANT ALL ON TABLE "public"."crm_vinculos_times_view" TO "service_role";



GRANT ALL ON TABLE "public"."feed_comentarios" TO "anon";
GRANT ALL ON TABLE "public"."feed_comentarios" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_comentarios" TO "service_role";



GRANT ALL ON TABLE "public"."feed_postagens" TO "anon";
GRANT ALL ON TABLE "public"."feed_postagens" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_postagens" TO "service_role";



GRANT ALL ON TABLE "public"."feed_reacoes" TO "anon";
GRANT ALL ON TABLE "public"."feed_reacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_reacoes" TO "service_role";



GRANT ALL ON TABLE "public"."keep_alive" TO "anon";
GRANT ALL ON TABLE "public"."keep_alive" TO "authenticated";
GRANT ALL ON TABLE "public"."keep_alive" TO "service_role";



GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."keep_alive_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."modulos_config" TO "anon";
GRANT ALL ON TABLE "public"."modulos_config" TO "authenticated";
GRANT ALL ON TABLE "public"."modulos_config" TO "service_role";



GRANT ALL ON TABLE "public"."notificacoes" TO "anon";
GRANT ALL ON TABLE "public"."notificacoes" TO "authenticated";
GRANT ALL ON TABLE "public"."notificacoes" TO "service_role";



GRANT ALL ON TABLE "public"."org_cargos" TO "anon";
GRANT ALL ON TABLE "public"."org_cargos" TO "authenticated";
GRANT ALL ON TABLE "public"."org_cargos" TO "service_role";



GRANT ALL ON TABLE "public"."outbound_acoes" TO "anon";
GRANT ALL ON TABLE "public"."outbound_acoes" TO "authenticated";
GRANT ALL ON TABLE "public"."outbound_acoes" TO "service_role";



GRANT ALL ON TABLE "public"."planos" TO "anon";
GRANT ALL ON TABLE "public"."planos" TO "authenticated";
GRANT ALL ON TABLE "public"."planos" TO "service_role";



GRANT ALL ON TABLE "public"."projeto_membros" TO "anon";
GRANT ALL ON TABLE "public"."projeto_membros" TO "authenticated";
GRANT ALL ON TABLE "public"."projeto_membros" TO "service_role";



GRANT ALL ON TABLE "public"."projeto_milestones" TO "anon";
GRANT ALL ON TABLE "public"."projeto_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."projeto_milestones" TO "service_role";



GRANT ALL ON TABLE "public"."projetos" TO "anon";
GRANT ALL ON TABLE "public"."projetos" TO "authenticated";
GRANT ALL ON TABLE "public"."projetos" TO "service_role";



GRANT ALL ON TABLE "public"."recursos_plano" TO "anon";
GRANT ALL ON TABLE "public"."recursos_plano" TO "authenticated";
GRANT ALL ON TABLE "public"."recursos_plano" TO "service_role";



GRANT ALL ON TABLE "public"."sidebar_preferencias" TO "anon";
GRANT ALL ON TABLE "public"."sidebar_preferencias" TO "authenticated";
GRANT ALL ON TABLE "public"."sidebar_preferencias" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_kb_artigos" TO "anon";
GRANT ALL ON TABLE "public"."suporte_kb_artigos" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_kb_artigos" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_kb_categorias" TO "anon";
GRANT ALL ON TABLE "public"."suporte_kb_categorias" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_kb_categorias" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_status_componentes" TO "anon";
GRANT ALL ON TABLE "public"."suporte_status_componentes" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_status_componentes" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_status_incidentes" TO "anon";
GRANT ALL ON TABLE "public"."suporte_status_incidentes" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_status_incidentes" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_ticket_mensagens" TO "anon";
GRANT ALL ON TABLE "public"."suporte_ticket_mensagens" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_ticket_mensagens" TO "service_role";



GRANT ALL ON TABLE "public"."suporte_tickets" TO "anon";
GRANT ALL ON TABLE "public"."suporte_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."suporte_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."tarefa_atribuicoes" TO "anon";
GRANT ALL ON TABLE "public"."tarefa_atribuicoes" TO "authenticated";
GRANT ALL ON TABLE "public"."tarefa_atribuicoes" TO "service_role";



GRANT ALL ON TABLE "public"."tarefa_checklist" TO "anon";
GRANT ALL ON TABLE "public"."tarefa_checklist" TO "authenticated";
GRANT ALL ON TABLE "public"."tarefa_checklist" TO "service_role";



GRANT ALL ON TABLE "public"."tarefas" TO "anon";
GRANT ALL ON TABLE "public"."tarefas" TO "authenticated";
GRANT ALL ON TABLE "public"."tarefas" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferencias" TO "anon";
GRANT ALL ON TABLE "public"."user_preferencias" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferencias" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































