// =============================================================
// PRANCHETO.IA - MIGRATION 005: TABELAS DE CHAT COM IA
// Cria as tabelas necessárias para armazenar o histórico de
// conversas com a IA (OpenAI/Anthropic).
//
// ESTRUTURA:
//   ai_conversations → Sessões de conversa (uma por "thread")
//   ai_messages      → Mensagens individuais dentro de cada sessão
//
// ISOLAMENTO MULTI-TENANT:
//   Ambas as tabelas possuem user_id para rastrear o autor.
//   Como o Chat com IA é exclusivo do Super Admin (sem tenant_id),
//   o isolamento é feito pelo user_id (super_admin é único).
//   Caso no futuro seja aberto para admins de tenants, basta
//   adicionar tenant_id e ajustar as queries.
//
// ROLES:
//   remetente → 'user' | 'assistant' | 'system'
//   (segue o padrão da API da OpenAI)
// =============================================================

'use strict';

/**
 * Cria as tabelas ai_conversations e ai_messages.
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  // ----------------------------------------------------------
  // TABELA: ai_conversations
  // Representa uma sessão/thread de conversa com a IA.
  // Cada conversa tem um título (gerado automaticamente ou
  // definido pelo usuário) e um modelo de IA utilizado.
  // ----------------------------------------------------------
  await knex.schema.createTable('ai_conversations', (table) => {
    // Identificador único da conversa (UUID)
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Usuário que iniciou a conversa (Super Admin)
    table
      .uuid('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE'); // Se o usuário for deletado, apaga as conversas

    // Título da conversa (primeiras palavras da 1ª mensagem ou definido pelo usuário)
    table.string('titulo', 255).notNullable().defaultTo('Nova conversa');

    // Modelo de IA utilizado (ex: 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo')
    table.string('modelo', 100).notNullable().defaultTo('gpt-4o-mini');

    // Número total de tokens consumidos nesta conversa (para controle de custo)
    table.integer('total_tokens').notNullable().defaultTo(0);

    // Status da conversa: 'ativa' | 'arquivada' | 'deletada'
    table.string('status', 20).notNullable().defaultTo('ativa');

    // Timestamps automáticos
    table.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  // ----------------------------------------------------------
  // TABELA: ai_messages
  // Armazena cada mensagem individual dentro de uma conversa.
  // Segue o formato de mensagens da API OpenAI (role + content).
  // ----------------------------------------------------------
  await knex.schema.createTable('ai_messages', (table) => {
    // Identificador único da mensagem (UUID)
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Conversa à qual esta mensagem pertence
    table
      .uuid('conversation_id')
      .notNullable()
      .references('id')
      .inTable('ai_conversations')
      .onDelete('CASCADE'); // Se a conversa for deletada, apaga as mensagens

    // Remetente da mensagem: 'user' | 'assistant' | 'system'
    table.string('remetente', 20).notNullable();

    // Conteúdo da mensagem (texto livre, pode ser longo)
    table.text('conteudo').notNullable();

    // Tokens consumidos por esta mensagem específica (0 para mensagens do usuário)
    table.integer('tokens_usados').notNullable().defaultTo(0);

    // Metadados extras em JSON (ex: finish_reason, model usado, etc.)
    table.jsonb('metadata').nullable();

    // Timestamp de criação (não tem atualizado_em pois mensagens são imutáveis)
    table.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
  });

  // ----------------------------------------------------------
  // ÍNDICES para performance nas queries mais comuns
  // ----------------------------------------------------------

  // Buscar conversas de um usuário específico (ordenadas por data)
  await knex.schema.raw(
    'CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id, criado_em DESC)'
  );

  // Buscar mensagens de uma conversa específica (ordenadas por data)
  await knex.schema.raw(
    'CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id, criado_em ASC)'
  );
};

/**
 * Desfaz a migration: remove as tabelas na ordem correta (filha → pai).
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  // Remove primeiro a tabela filha (ai_messages) para não violar FK
  await knex.schema.dropTableIfExists('ai_messages');
  await knex.schema.dropTableIfExists('ai_conversations');
};
