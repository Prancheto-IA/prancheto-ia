// =============================================================
// PRANCHETO.IA - MIGRATION 003: ESTRUTURA MODULAR (4 NÍVEIS)
// Cria as tabelas que representam a hierarquia de navegação:
//
//   Nível 1: sections   → Grandes áreas (ex: Comercial, Outreach)
//   Nível 2: modules    → Sub-nichos (ex: Leads, Campanhas)
//   Nível 3: tabs       → Visualizações (ex: Kanban, Dashboard)
//   Nível 4: widgets    → Elementos granulares (ex: Botão WhatsApp, KPI)
//
// Todas as tabelas têm tenant_id para isolamento multi-tenant.
// Registros sem tenant_id são templates globais (disponíveis para todos).
// =============================================================

'use strict';

/**
 * Cria as 4 tabelas da hierarquia modular.
 * @param {import('knex').Knex} knex
 */
exports.up = async (knex) => {

  // ==========================================================
  // NÍVEL 1: SECTIONS (Seções — Biblioteca Raiz)
  // ==========================================================
  await knex.schema.createTable('sections', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // tenant_id nullable: NULL = template global; preenchido = seção do tenant
    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    tabela.string('nome', 255).notNullable();
    tabela.string('slug', 100).notNullable();
    tabela.text('descricao').nullable();

    // Ícone da seção (nome do ícone ou emoji)
    tabela.string('icone', 100).nullable();

    // Cor de destaque da seção (hex)
    tabela.string('cor', 20).nullable();

    // Ordem de exibição na sidebar
    tabela.integer('ordem').notNullable().defaultTo(0);

    // Se false, a seção fica oculta para todos os usuários do tenant
    tabela.boolean('ativo').notNullable().defaultTo(true);

    // Configurações extras em JSON (permissões padrão, visibilidade por cargo, etc.)
    tabela.jsonb('configuracoes').defaultTo('{}');

    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_sections_tenant_id ON sections(tenant_id)');
  await knex.raw('CREATE INDEX idx_sections_ativo ON sections(ativo)');

  // ==========================================================
  // NÍVEL 2: MODULES (Módulos — Subpastas das Seções)
  // ==========================================================
  await knex.schema.createTable('modules', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    // Chave estrangeira para a seção pai (Nível 1)
    tabela.uuid('section_id')
      .notNullable()
      .references('id')
      .inTable('sections')
      .onDelete('CASCADE');

    tabela.string('nome', 255).notNullable();
    tabela.string('slug', 100).notNullable();
    tabela.text('descricao').nullable();
    tabela.string('icone', 100).nullable();
    tabela.integer('ordem').notNullable().defaultTo(0);
    tabela.boolean('ativo').notNullable().defaultTo(true);
    tabela.jsonb('configuracoes').defaultTo('{}');

    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_modules_tenant_id ON modules(tenant_id)');
  await knex.raw('CREATE INDEX idx_modules_section_id ON modules(section_id)');

  // ==========================================================
  // NÍVEL 3: TABS (Abas — Visualizações de Trabalho)
  // ==========================================================
  await knex.schema.createTable('tabs', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    // Chave estrangeira para o módulo pai (Nível 2)
    tabela.uuid('module_id')
      .notNullable()
      .references('id')
      .inTable('modules')
      .onDelete('CASCADE');

    tabela.string('nome', 255).notNullable();
    tabela.string('slug', 100).notNullable();

    // Tipo de visualização: kanban, table, dashboard, calendar, form, custom
    tabela.enum('tipo_view', ['kanban', 'table', 'dashboard', 'calendar', 'form', 'custom'])
      .notNullable()
      .defaultTo('table');

    tabela.integer('ordem').notNullable().defaultTo(0);
    tabela.boolean('ativo').notNullable().defaultTo(true);

    // Layout e configurações da view em JSON
    tabela.jsonb('configuracoes').defaultTo('{}');

    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_tabs_tenant_id ON tabs(tenant_id)');
  await knex.raw('CREATE INDEX idx_tabs_module_id ON tabs(module_id)');

  // ==========================================================
  // NÍVEL 4: WIDGETS (Utilitários Granulares)
  // ==========================================================
  await knex.schema.createTable('widgets', (tabela) => {
    tabela.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    tabela.uuid('tenant_id')
      .nullable()
      .references('id')
      .inTable('tenants')
      .onDelete('CASCADE');

    // Chave estrangeira para a aba pai (Nível 3)
    tabela.uuid('tab_id')
      .notNullable()
      .references('id')
      .inTable('tabs')
      .onDelete('CASCADE');

    tabela.string('nome', 255).notNullable();

    // Tipo do widget: kpi, button_whatsapp, chart, text, form_field, custom
    tabela.string('tipo', 100).notNullable();

    // Posição e tamanho no grid da aba (para layout drag-and-drop futuro)
    tabela.integer('posicao_x').notNullable().defaultTo(0);
    tabela.integer('posicao_y').notNullable().defaultTo(0);
    tabela.integer('largura').notNullable().defaultTo(1);
    tabela.integer('altura').notNullable().defaultTo(1);

    tabela.boolean('ativo').notNullable().defaultTo(true);

    // Configurações específicas do widget em JSON (cor, fonte de dados, etc.)
    tabela.jsonb('configuracoes').defaultTo('{}');

    tabela.timestamp('criado_em').notNullable().defaultTo(knex.fn.now());
    tabela.timestamp('atualizado_em').notNullable().defaultTo(knex.fn.now());
  });

  await knex.raw('CREATE INDEX idx_widgets_tenant_id ON widgets(tenant_id)');
  await knex.raw('CREATE INDEX idx_widgets_tab_id ON widgets(tab_id)');
};

/**
 * Reverte a criação das tabelas modulares (ordem inversa por causa das FKs).
 * @param {import('knex').Knex} knex
 */
exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('widgets');
  await knex.schema.dropTableIfExists('tabs');
  await knex.schema.dropTableIfExists('modules');
  await knex.schema.dropTableIfExists('sections');
};
