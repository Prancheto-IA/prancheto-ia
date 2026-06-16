// =============================================================
// PRANCHETO.IA - MIGRATION 006: SUPORTE A IMPERSONATION
// Adiciona campos necessários para a funcionalidade de
// "Acessar como usuário" (Impersonation) no Painel Admin.
//
// CAMPOS ADICIONADOS NA TABELA users:
//   impersonation_token      → Token temporário gerado pelo Super Admin
//   impersonation_expires_at → Expiração do token (15 minutos)
//
// SEGURANÇA:
//   - Token expira em 15 minutos
//   - Apenas Super Admin pode gerar tokens de impersonation
//   - O token é invalidado após o primeiro uso
//   - Toda sessão de impersonation é registrada no audit_log
// =============================================================

'use strict';

/**
 * Adiciona campos de impersonation na tabela users.
 * @param {import('knex').Knex} knex
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('users', (table) => {
    // Token temporário para impersonation (UUID gerado pelo backend)
    table.string('impersonation_token', 255).nullable().defaultTo(null);

    // Data/hora de expiração do token (15 minutos após geração)
    table.timestamp('impersonation_expires_at').nullable().defaultTo(null);
  });

  // Índice para busca rápida por token (usado na validação)
  await knex.schema.raw(
    'CREATE INDEX idx_users_impersonation_token ON users(impersonation_token) WHERE impersonation_token IS NOT NULL'
  );
};

/**
 * Remove os campos de impersonation da tabela users.
 * @param {import('knex').Knex} knex
 */
exports.down = async function (knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_users_impersonation_token');
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('impersonation_token');
    table.dropColumn('impersonation_expires_at');
  });
};
