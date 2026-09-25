-- =============================================================
-- ESCONDER NOTAS INTERNAS DO CLIENTE
--
-- suporte_ticket_mensagens.interno (comentário original: "true = nota
-- interna do time; false = resposta visível ao cliente") nunca foi
-- respeitado pela policy de SELECT do lado do tenant — a coluna existia
-- mas nada a usava, então não vazava nada na prática. Isso muda ao ligar
-- a resposta da equipe Prancheto.IA (painel /admin/tickets), que passa a
-- gravar notas com interno = true: sem este filtro, o tenant leria essas
-- notas internas na própria tela de "Meus Tickets".
-- =============================================================

DROP POLICY IF EXISTS "suporte_ticket_mensagens_select" ON "public"."suporte_ticket_mensagens";
CREATE POLICY "suporte_ticket_mensagens_select" ON "public"."suporte_ticket_mensagens"
    FOR SELECT
    USING (
      NOT "interno"
      AND EXISTS (
        SELECT 1 FROM "public"."suporte_tickets" t
          JOIN "public"."users" u ON u."tenant_id" = t."tenant_id"
         WHERE t."id" = "suporte_ticket_mensagens"."ticket_id"
           AND u."id" = "auth"."uid"()
      )
    );
