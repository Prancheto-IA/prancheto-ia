// =============================================================
// PRANCHETO.IA - CONTROLLER DE TENANTS (Gestão de Clientes)
// Exclusivo para a Conta Tronco (Super Admin).
// Permite criar, listar, atualizar e suspender empresas clientes.
//
// Rotas:
//   GET    /api/admin/tenants          → Listar todos os clientes
//   POST   /api/admin/tenants          → Criar novo cliente
//   GET    /api/admin/tenants/:id      → Detalhes de um cliente
//   PUT    /api/admin/tenants/:id      → Atualizar dados do cliente
//   PATCH  /api/admin/tenants/:id/status → Suspender/reativar cliente
// =============================================================

'use strict';

const { db } = require('../../config/database');
const logger = require('../../services/logger.service');

/**
 * GET /api/admin/tenants
 * Lista todos os tenants com paginação e filtros.
 */
const listarTenants = async (req, res, next) => {
  try {
    const {
      pagina    = 1,
      limite    = 20,
      status,
      plano,
      busca,
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Constrói a query base
    let query = db('tenants')
      .select(
        'id', 'nome', 'slug', 'email_contato',
        'plano', 'status', 'limite_usuarios',
        'criado_em', 'atualizado_em', 'suspenso_em'
      )
      .orderBy('criado_em', 'desc');

    // Filtros opcionais
    if (status) query = query.where({ status });
    if (plano)  query = query.where({ plano });
    if (busca)  query = query.whereILike('nome', `%${busca}%`);

    // Executa a query com paginação
    const [tenants, [{ total }]] = await Promise.all([
      query.limit(parseInt(limite)).offset(offset),
      db('tenants').count('id as total')
        .modify((q) => {
          if (status) q.where({ status });
          if (plano)  q.where({ plano });
          if (busca)  q.whereILike('nome', `%${busca}%`);
        }),
    ]);

    // Adiciona contagem de usuários por tenant
    const tenantsComContagem = await Promise.all(
      tenants.map(async (tenant) => {
        const [{ qtd_usuarios }] = await db('users')
          .where({ tenant_id: tenant.id })
          .count('id as qtd_usuarios');
        return { ...tenant, qtd_usuarios: parseInt(qtd_usuarios) };
      })
    );

    res.json({
      dados:    tenantsComContagem,
      paginacao: {
        pagina:       parseInt(pagina),
        limite:       parseInt(limite),
        total:        parseInt(total),
        totalPaginas: Math.ceil(parseInt(total) / parseInt(limite)),
      },
    });

  } catch (erro) {
    next(erro);
  }
};

/**
 * POST /api/admin/tenants
 * Cria um novo tenant (empresa cliente).
 */
const criarTenant = async (req, res, next) => {
  const { nome, slug, email_contato, plano, limite_usuarios, configuracoes } = req.body;

  try {
    // Validação básica
    if (!nome || !slug || !email_contato) {
      return res.status(400).json({
        erro:   'Nome, slug e e-mail de contato são obrigatórios.',
        codigo: 'CRM-0400',
      });
    }

    // Verifica se o slug já existe
    const slugExistente = await db('tenants').where({ slug }).first();
    if (slugExistente) {
      return res.status(409).json({
        erro:   `O slug "${slug}" já está em uso. Escolha outro.`,
        codigo: 'CRM-0409',
      });
    }

    // Cria o tenant
    const [novoTenant] = await db('tenants')
      .insert({
        nome,
        slug:           slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        email_contato,
        plano:          plano || 'free',
        limite_usuarios: limite_usuarios || 5,
        configuracoes:  JSON.stringify(configuracoes || {}),
        status:         'active',
      })
      .returning(['id', 'nome', 'slug', 'email_contato', 'plano', 'status', 'criado_em']);

    // Registra no log de auditoria
    await db('audit_logs').insert({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        'create',
      recurso:     'tenant',
      recurso_id:  novoTenant.id,
      descricao:   `Novo cliente criado: ${nome} (${slug})`,
      ip_address:  req.ip,
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    logger.info(`Novo tenant criado: ${nome} (${slug})`, {
      tenantId: novoTenant.id,
      criadoPor: req.userId,
    });

    res.status(201).json({ dados: novoTenant });

  } catch (erro) {
    next(erro);
  }
};

/**
 * GET /api/admin/tenants/:id
 * Retorna os detalhes completos de um tenant.
 */
const obterTenant = async (req, res, next) => {
  try {
    const tenant = await db('tenants')
      .where({ id: req.params.id })
      .first();

    if (!tenant) {
      return res.status(404).json({
        erro:   'Cliente não encontrado.',
        codigo: 'CRM-0404',
      });
    }

    // Busca os usuários do tenant
    const usuarios = await db('users')
      .where({ tenant_id: tenant.id })
      .select('id', 'nome', 'email', 'cargo', 'ativo', 'ultimo_login', 'criado_em');

    res.json({ dados: { ...tenant, usuarios } });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PUT /api/admin/tenants/:id
 * Atualiza os dados de um tenant.
 */
const atualizarTenant = async (req, res, next) => {
  const { nome, email_contato, plano, limite_usuarios, configuracoes } = req.body;

  try {
    const tenant = await db('tenants').where({ id: req.params.id }).first();
    if (!tenant) {
      return res.status(404).json({ erro: 'Cliente não encontrado.', codigo: 'CRM-0404' });
    }

    const dadosAnteriores = { ...tenant };

    await db('tenants').where({ id: req.params.id }).update({
      nome:            nome            || tenant.nome,
      email_contato:   email_contato   || tenant.email_contato,
      plano:           plano           || tenant.plano,
      limite_usuarios: limite_usuarios || tenant.limite_usuarios,
      configuracoes:   configuracoes   ? JSON.stringify(configuracoes) : tenant.configuracoes,
      atualizado_em:   new Date(),
    });

    // Registra no log de auditoria
    await db('audit_logs').insert({
      tenant_id:        req.params.id,
      user_id:          req.userId,
      user_email:       req.userEmail,
      acao:             'update',
      recurso:          'tenant',
      recurso_id:       req.params.id,
      descricao:        `Cliente atualizado: ${tenant.nome}`,
      dados_anteriores: JSON.stringify(dadosAnteriores),
      dados_novos:      JSON.stringify(req.body),
      ip_address:       req.ip,
      metodo_http:      req.method,
      rota:             req.originalUrl,
      resultado:        'success',
    });

    res.json({ mensagem: 'Cliente atualizado com sucesso.' });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PATCH /api/admin/tenants/:id/status
 * Suspende ou reativa um tenant.
 */
const alterarStatusTenant = async (req, res, next) => {
  const { status } = req.body;

  try {
    if (!['active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({
        erro:   'Status inválido. Use: active, suspended ou cancelled.',
        codigo: 'CRM-0400',
      });
    }

    const tenant = await db('tenants').where({ id: req.params.id }).first();
    if (!tenant) {
      return res.status(404).json({ erro: 'Cliente não encontrado.', codigo: 'CRM-0404' });
    }

    await db('tenants').where({ id: req.params.id }).update({
      status,
      suspenso_em:  status === 'suspended' ? new Date() : null,
      atualizado_em: new Date(),
    });

    logger.info(`Status do tenant alterado: ${tenant.nome} → ${status}`, {
      tenantId:  req.params.id,
      alteradoPor: req.userId,
    });

    res.json({ mensagem: `Cliente ${status === 'active' ? 'reativado' : 'suspenso'} com sucesso.` });

  } catch (erro) {
    next(erro);
  }
};

module.exports = {
  listarTenants,
  criarTenant,
  obterTenant,
  atualizarTenant,
  alterarStatusTenant,
};
