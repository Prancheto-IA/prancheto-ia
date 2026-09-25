-- =============================================================
-- TICKETS RECEBIDOS NO PAINEL ADMIN (super_admin)
--
-- suporte_tickets/suporte_ticket_mensagens só tinham policies
-- escopadas ao tenant do usuário (baseline_producao.sql). Diferente
-- de tenants/audit_logs, não existia nenhum bypass para
-- users.cargo = 'super_admin' — a equipe Prancheto.IA não conseguia
-- ler nem responder tickets de clientes. Segue o mesmo padrão já
-- usado em "tenants_super_admin_all" e "audit_logs_select".
-- =============================================================

-- Leitura de tickets de todos os tenants
CREATE POLICY "suporte_tickets_super_admin_select" ON "public"."suporte_tickets"
    FOR SELECT
    USING (
      (SELECT "users"."cargo" FROM "public"."users" WHERE "users"."id" = "auth"."uid"() LIMIT 1) = 'super_admin'
    );

-- Atualizar status/responsável de qualquer ticket
CREATE POLICY "suporte_tickets_super_admin_update" ON "public"."suporte_tickets"
    FOR UPDATE
    USING (
      (SELECT "users"."cargo" FROM "public"."users" WHERE "users"."id" = "auth"."uid"() LIMIT 1) = 'super_admin'
    )
    WITH CHECK (
      (SELECT "users"."cargo" FROM "public"."users" WHERE "users"."id" = "auth"."uid"() LIMIT 1) = 'super_admin'
    );

-- Leitura da thread de mensagens de qualquer ticket
CREATE POLICY "suporte_ticket_mensagens_super_admin_select" ON "public"."suporte_ticket_mensagens"
    FOR SELECT
    USING (
      (SELECT "users"."cargo" FROM "public"."users" WHERE "users"."id" = "auth"."uid"() LIMIT 1) = 'super_admin'
    );

-- Responder como equipe Prancheto.IA
CREATE POLICY "suporte_ticket_mensagens_super_admin_insert" ON "public"."suporte_ticket_mensagens"
    FOR INSERT
    WITH CHECK (
      "autor_id" = "auth"."uid"()
      AND (SELECT "users"."cargo" FROM "public"."users" WHERE "users"."id" = "auth"."uid"() LIMIT 1) = 'super_admin'
    );
