// =============================================================
// PRANCHETO.IA - MIGRATION 001: TABELA DE TENANTS (Empresas Clientes)
// Esta é a tabela raiz do sistema multi-tenant.
// Cada registro representa uma empresa cliente do Prancheto.IA.
// O tenant_id é a chave global que isola 100% os dados de cada empresa.
//
// COMANDO PARA EXECUTAR: npm run migrate
// COMANDO PARA REVERTER: npm run migrate:rollback
// =============================================================

'use strict';

/**
 * Cria a tabela 'tenants' no banco de dados.
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('tenants', (tabela) => {
    // --- IDENTIFICAÇÃO ---
    // UUID como chave primária (mais seguro que inteiros sequenciais)
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Nome da empresa cliente
    tabela.string('nome', 255).notNullable();

    // Subdomínio único para identificar o tenant na URL (ex: clinica-abc.prancheto.ia)
    tabela.string('slug', 100).notNullable().unique();

    // E-mail principal de contato do tenant
    tabela.string('email_contato', 255).notNullable();

    // --- PLANO E STATUS ---
    // Plano contratado: free, starter, professional, enterprise
    tabela.enum('plano', ['free', 'starter', 'professional', 'enterprise'])
      .notNullable()
      .defaultTo('free');

    // Status do tenant: active, suspended, cancelled
    tabela.enum('status', ['active', 'suspended', 'cancelled'])
      .notNullable()
      .defaultTo('active');

    // --- CONFIGURAÇÕES DO TENANT ---
    // Configurações personalizadas em JSON (logo, cores, módulos ativos, etc.)
    tabela.jsonb('configuracoes').defaultTo('{}');

    // Limite de usuários permitidos no plano
    tabela.integer('limite_usuarios').notNullable().defaultTo(5);

    // --- AUDITORIA ---
    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('suspenso_em').nullable();
  });

  // Índices para busca rápida
  await knex.raw('CREATE INDEX idx_tenants_slug ON tenants(slug)');
  await knex.raw('CREATE INDEX idx_tenants_status ON tenants(status)');
};

/**
 * Reverte a criação da tabela 'tenants'.
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('tenants');
};
