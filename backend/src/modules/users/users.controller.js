// =============================================================
// PRANCHETO.IA - CONTROLLER DE USUÁRIOS
// Gerencia usuários dentro de um tenant (empresa cliente).
// Admins do tenant podem criar/editar usuários do seu próprio tenant.
// Super Admin pode gerenciar usuários de qualquer tenant.
//
// Rotas:
//   GET    /api/users          → Listar usuários do tenant
//   POST   /api/users          → Criar novo usuário
//   GET    /api/users/:id      → Detalhes de um usuário
//   PUT    /api/users/:id      → Atualizar usuário
//   PATCH  /api/users/:id/status → Ativar/desativar usuário
//   DELETE /api/users/:id      → Remover usuário (soft delete)
// =============================================================

'use strict';

const bcrypt = require('bcryptjs');
const { db } = require('../../config/database');
const logger = require('../../services/logger.service');

/**
 * GET /api/users
 * Lista os usuários do tenant do usuário logado.
 */
const listarUsuarios = async (req, res, next) => {
  try {
    const { pagina = 1, limite = 20, cargo, ativo, busca } = req.query;
    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Super Admin pode ver usuários de qualquer tenant via query param
    const tenantId = req.isSuperAdmin
      ? (req.query.tenant_id || null)
      : req.tenantId;

    let query = db('users')
      .select('id', 'nome', 'email', 'cargo', 'ativo', 'ultimo_login', 'criado_em')
      .orderBy('criado_em', 'desc');

    // Filtra por tenant (usuários comuns só veem seu próprio tenant)
    if (tenantId) {
      query = query.where({ tenant_id: tenantId });
    } else if (!req.isSuperAdmin) {
      // Segurança: usuário sem tenant não pode listar nada
      return res.json({ dados: [], paginacao: { total: 0 } });
    }

    // Filtros opcionais
    if (cargo)  query = query.where({ cargo });
    if (ativo !== undefined) query = query.where({ ativo: ativo === 'true' });
    if (busca)  query = query.where((q) => {
      q.whereILike('nome', `%${busca}%`).orWhereILike('email', `%${busca}%`);
    });

    const [usuarios, [{ total }]] = await Promise.all([
      query.limit(parseInt(limite)).offset(offset),
      db('users').count('id as total')
        .modify((q) => {
          if (tenantId) q.where({ tenant_id: tenantId });
          if (cargo)    q.where({ cargo });
        }),
    ]);

    res.json({
      dados: usuarios,
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
 * POST /api/users
 * Cria um novo usuário no tenant.
 */
const criarUsuario = async (req, res, next) => {
  const { nome, email, senha, cargo, permissoes } = req.body;

  try {
    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro:   'Nome, e-mail e senha são obrigatórios.',
        codigo: 'CRM-0400',
      });
    }

    // Usuário comum só pode criar usuários no seu próprio tenant
    const tenantId = req.isSuperAdmin
      ? (req.body.tenant_id || req.tenantId)
      : req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        erro:   'tenant_id é obrigatório para criar usuários.',
        codigo: 'CRM-0400',
      });
    }

    // Verifica se o e-mail já existe no tenant
    const emailExistente = await db('users')
      .where({ email: email.toLowerCase(), tenant_id: tenantId })
      .first();

    if (emailExistente) {
      return res.status(409).json({
        erro:   'Este e-mail já está cadastrado nesta empresa.',
        codigo: 'CRM-0409',
      });
    }

    // Verifica o limite de usuários do tenant
    const tenant = await db('tenants').where({ id: tenantId }).first();
    const [{ qtd_usuarios }] = await db('users')
      .where({ tenant_id: tenantId, ativo: true })
      .count('id as qtd_usuarios');

    if (parseInt(qtd_usuarios) >= tenant.limite_usuarios) {
      return res.status(403).json({
        erro:   `Limite de usuários atingido (${tenant.limite_usuarios}). Faça upgrade do plano.`,
        codigo: 'CRM-0403',
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Cria o usuário
    const [novoUsuario] = await db('users')
      .insert({
        tenant_id:  tenantId,
        nome,
        email:      email.toLowerCase().trim(),
        senha_hash: senhaHash,
        cargo:      cargo || 'member',
        permissoes: JSON.stringify(permissoes || {}),
        ativo:      true,
      })
      .returning(['id', 'nome', 'email', 'cargo', 'ativo', 'criado_em']);

    // Registra no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   tenantId,
      user_id:     req.userId,
      user_email:  req.userEmail,
      acao:        'create',
      recurso:     'user',
      recurso_id:  novoUsuario.id,
      descricao:   `Novo usuário criado: ${nome} (${email})`,
      ip_address:  req.ip,
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    logger.info(`Novo usuário criado: ${email}`, { tenantId, criadoPor: req.userId });

    res.status(201).json({ dados: novoUsuario });

  } catch (erro) {
    next(erro);
  }
};

/**
 * GET /api/users/:id
 * Retorna os detalhes de um usuário específico.
 */
const obterUsuario = async (req, res, next) => {
  try {
    const query = db('users')
      .where({ id: req.params.id })
      .select('id', 'tenant_id', 'nome', 'email', 'cargo', 'permissoes', 'ativo', 'ultimo_login', 'criado_em');

    // Usuário comum só pode ver usuários do seu tenant
    if (!req.isSuperAdmin) {
      query.where({ tenant_id: req.tenantId });
    }

    const usuario = await query.first();

    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.', codigo: 'CRM-0404' });
    }

    res.json({ dados: usuario });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PUT /api/users/:id
 * Atualiza os dados de um usuário.
 */
const atualizarUsuario = async (req, res, next) => {
  const { nome, cargo, permissoes, senha } = req.body;

  try {
    const query = db('users').where({ id: req.params.id });
    if (!req.isSuperAdmin) query.where({ tenant_id: req.tenantId });

    const usuario = await query.first();
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.', codigo: 'CRM-0404' });
    }

    const atualizacao = {
      nome:         nome        || usuario.nome,
      cargo:        cargo       || usuario.cargo,
      permissoes:   permissoes  ? JSON.stringify(permissoes) : usuario.permissoes,
      atualizado_em: new Date(),
    };

    // Atualiza a senha apenas se fornecida
    if (senha) {
      atualizacao.senha_hash = await bcrypt.hash(senha, 12);
    }

    await db('users').where({ id: req.params.id }).update(atualizacao);

    res.json({ mensagem: 'Usuário atualizado com sucesso.' });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PATCH /api/users/:id/status
 * Ativa ou desativa um usuário.
 */
const alterarStatusUsuario = async (req, res, next) => {
  const { ativo } = req.body;

  try {
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        erro:   'O campo "ativo" deve ser true ou false.',
        codigo: 'CRM-0400',
      });
    }

    const query = db('users').where({ id: req.params.id });
    if (!req.isSuperAdmin) query.where({ tenant_id: req.tenantId });

    const usuario = await query.first();
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado.', codigo: 'CRM-0404' });
    }

    // Impede desativar a si mesmo
    if (req.params.id === req.userId) {
      return res.status(400).json({
        erro:   'Você não pode desativar sua própria conta.',
        codigo: 'CRM-0400',
      });
    }

    await db('users').where({ id: req.params.id }).update({
      ativo,
      atualizado_em: new Date(),
    });

    res.json({ mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso.` });

  } catch (erro) {
    next(erro);
  }
};

module.exports = {
  listarUsuarios,
  criarUsuario,
  obterUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
};
