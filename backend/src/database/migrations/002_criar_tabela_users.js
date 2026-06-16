// =============================================================
// PRANCHETO.IA - MIGRATION 002: TABELA DE USUÁRIOS
// Cada usuário pertence a um tenant (empresa cliente).
// O campo tenant_id garante o isolamento multi-tenant:
// um usuário NUNCA pode ver dados de outro tenant.
//
// Tipos de usuário:
//   - super_admin: Conta Tronco (equipe fundadora) — sem tenant_id
//   - admin:       Administrador da empresa cliente
//   - manager:     Gerente com permissões amplas
//   - member:      Membro padrão com permissões básicas
//   - viewer:      Apenas visualização, sem edição
// =============================================================

'use strict';

/**
 * Cria a tabela 'users' no banco de dados.
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('users', (tabela) => {
    // --- IDENTIFICAÇÃO ---
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Chave estrangeira para o tenant (nullable para o Super Admin que não tem tenant)
    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE'); // Se o tenant for deletado, seus usuários também são

    // --- DADOS PESSOAIS ---
    tabela.string('nome', 255).notNullable();
    tabela.string('email', 255).notNullable();

    // Senha criptografada com bcrypt (NUNCA armazenar senha em texto puro)
    tabela.string('senha_hash', 255).notNullable();

    // --- CARGO E PERMISSÕES ---
    // Cargo do usuário dentro do sistema
    tabela.enum('cargo', ['super_admin', 'admin', 'manager', 'member', 'viewer'])
      .notNullable()
      .defaultTo('member');

    // Permissões granulares em JSON (quais seções/módulos/abas/widgets o usuário pode acessar)
    // Estrutura: { secoes: ['comercial'], modulos: ['leads'], abas: ['kanban'], widgets: [] }
    tabela.jsonb('permissoes').defaultTo('{}');

    // --- STATUS ---
    tabela.boolean('ativo').notNullable().defaultTo(true);

    // Número de tentativas de login falhas consecutivas (para bloqueio de segurança)
    tabela.integer('tentativas_login_falhas').notNullable().defaultTo(0);

    // Data/hora do bloqueio temporário por excesso de tentativas
    tabela.timestamp('bloqueado_ate').nullable();

    // Data do último login bem-sucedido
    tabela.timestamp('ultimo_login').nullable();

    // Token de refresh JWT (armazenado para invalidação no logout)
    tabela.string('refresh_token_hash', 255).nullable();

    // --- AUDITORIA ---
    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  // Índice único: e-mail deve ser único POR TENANT (dois tenants podem ter o mesmo e-mail)
  await knex.raw(`
    CREATE UNIQUE INDEX idx_users_email_tenant
    ON users(email, tenant_id)
    WHERE tenant_id IS NOT NULL
  `);

  // Índice único para Super Admin (e-mail único sem tenant)
  await knex.raw(`
    CREATE UNIQUE INDEX idx_users_email_super_admin
    ON users(email)
    WHERE tenant_id IS NULL
  `);

  // Índices para buscas frequentes
  await knex.raw('CREATE INDEX idx_users_tenant_id ON users(tenant_id)');
  await knex.raw('CREATE INDEX idx_users_cargo ON users(cargo)');
  await knex.raw('CREATE INDEX idx_users_ativo ON users(ativo)');
};

/**
 * Reverte a criação da tabela 'users'.
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
};
