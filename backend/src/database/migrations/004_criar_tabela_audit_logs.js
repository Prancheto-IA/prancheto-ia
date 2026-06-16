// =============================================================
// PRANCHETO.IA - MIGRATION 004: TABELA DE LOGS DE AUDITORIA
// Registra todas as ações críticas do sistema para fins de:
//   - Auditoria de segurança (quem fez o quê e quando)
//   - Investigação de incidentes
//   - Conformidade com LGPD (rastreabilidade de acesso a dados)
//   - Apresentação a investidores (demonstra maturidade do sistema)
// =============================================================

'use strict';

/**
 * Cria a tabela 'audit_logs' no banco de dados.
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {
  await knex.schema.createTable('audit_logs', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // --- CONTEXTO DO TENANT ---
    // Nullable: ações do Super Admin não têm tenant_id
    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('SET NULL');

    // --- CONTEXTO DO USUÁRIO ---
    tabela.uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');

    tabela.string('user_email', 255).nullable(); // Cópia do e-mail (caso o usuário seja deletado)
    tabela.string('user_cargo', 50).nullable();

    // --- AÇÃO REALIZADA ---
    // Tipo da ação: login, logout, create, update, delete, view, export, permission_change
    tabela.string('acao', 100).notNullable();

    // Recurso afetado: user, tenant, section, module, tab, widget
    tabela.string('recurso', 100).notNullable();

    // ID do recurso afetado (UUID do registro modificado)
    tabela.uuid('recurso_id').nullable();

    // Descrição legível da ação (ex: "Usuário criou o módulo 'Leads'")
    tabela.text('descricao').nullable();

    // Dados anteriores (para ações de update/delete — permite rollback manual)
    tabela.jsonb('dados_anteriores').nullable();

    // Dados novos (para ações de create/update)
    tabela.jsonb('dados_novos').nullable();

    // --- CONTEXTO DA REQUISIÇÃO ---
    tabela.string('ip_address', 45).nullable();   // IPv4 ou IPv6
    tabela.text('user_agent').nullable();          // Navegador/dispositivo
    tabela.string('metodo_http', 10).nullable();   // GET, POST, PUT, DELETE
    tabela.text('rota').nullable();                // /api/users/123

    // --- RESULTADO ---
    // success, failure, blocked
    tabela.enum('resultado', ['success', 'failure', 'blocked'])
      .notNullable()
      .defaultTo('success');

    // Código de erro se resultado = failure
    tabela.string('codigo_erro', 20).nullable();

    // --- TIMESTAMP ---
    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    // Logs de auditoria NUNCA são atualizados (imutáveis por design)
  });

  // Índices para consultas frequentes de auditoria
  await knex.raw('CREATE INDEX idx_audit_tenant_id ON audit_logs(tenant_id)');
  await knex.raw('CREATE INDEX idx_audit_user_id ON audit_logs(user_id)');
  await knex.raw('CREATE INDEX idx_audit_acao ON audit_logs(acao)');
  await knex.raw('CREATE INDEX idx_audit_criado_em ON audit_logs(criado_em DESC)');
  await knex.raw('CREATE INDEX idx_audit_resultado ON audit_logs(resultado)');
};

/**
 * Reverte a criação da tabela 'audit_logs'.
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('audit_logs');
};
