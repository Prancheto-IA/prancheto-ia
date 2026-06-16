// =============================================================
// PRANCHETO.IA - CONTROLLER ADMIN DE USUÁRIOS (Super Admin)
// Gerencia usuários de TODOS os tenants sem restrição de isolamento.
// Exclusivo para o Super Admin via painel administrativo.
//
// Diferenças do users.controller.js padrão:
//   - Sem restrição de tenant_id (vê todos os tenants)
//   - Retorna campos extras: tenantNome, status (string)
//   - Aceita filtros: busca, status, tenantId, pagina, limite
//   - Resposta no formato { usuarios, paginacao } esperado pelo frontend
//
// Rotas:
//   GET    /api/admin/usuarios              → Listar todos os usuários
//   POST   /api/admin/usuarios              → Criar usuário em qualquer tenant
//   GET    /api/admin/usuarios/:id          → Detalhes de um usuário
//   PUT    /api/admin/usuarios/:id          → Atualizar usuário
//   PATCH  /api/admin/usuarios/:id/status   → Ativar/desativar usuário
// =============================================================

'use strict';

const bcrypt = require('bcryptjs');
const { db } = require('../../config/database');
const logger = require('../../services/logger.service');

/**
 * GET /api/admin/usuarios
 * Lista todos os usuários de todos os tenants com paginação e filtros.
 */
const listarUsuariosAdmin = async (req, res, next) => {
  try {
    const {
      pagina   = 1,
      limite   = 15,
      busca,
      status,
      tenantId,
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Query base com JOIN para trazer o nome do tenant
    let query = db('users as u')
      .join('tenants as t', 'u.tenant_id', 't.id')
      .select(
        'u.id',
        'u.nome',
        'u.email',
        'u.cargo',
        'u.ativo',
        'u.tenant_id as tenantId',
        't.nome as tenantNome',
        'u.criado_em as criadoEm',
        'u.ultimo_login as ultimoLogin'
      )
      .orderBy('u.criado_em', 'desc');

    // Filtro por tenant
    if (tenantId) {
      query = query.where('u.tenant_id', tenantId);
    }

    // Filtro por status (string 'ativo'/'inativo' → boolean)
    if (status === 'ativo') {
      query = query.where('u.ativo', true);
    } else if (status === 'inativo') {
      query = query.where('u.ativo', false);
    }

    // Filtro por busca (nome ou email)
    if (busca) {
      query = query.where((q) => {
        q.whereILike('u.nome', `%${busca}%`)
          .orWhereILike('u.email', `%${busca}%`);
      });
    }

    // Query de contagem (mesmos filtros, sem paginação)
    let countQuery = db('users as u')
      .join('tenants as t', 'u.tenant_id', 't.id')
      .count('u.id as total');

    if (tenantId)          countQuery = countQuery.where('u.tenant_id', tenantId);
    if (status === 'ativo')   countQuery = countQuery.where('u.ativo', true);
    if (status === 'inativo') countQuery = countQuery.where('u.ativo', false);
    if (busca) {
      countQuery = countQuery.where((q) => {
        q.whereILike('u.nome', `%${busca}%`)
          .orWhereILike('u.email', `%${busca}%`);
      });
    }

    const [usuarios, [{ total }]] = await Promise.all([
      query.limit(parseInt(limite)).offset(offset),
      countQuery,
    ]);

    // Normaliza o campo 'status' para string (frontend espera 'ativo'/'inativo')
    const usuariosNormalizados = usuarios.map((u) => ({
      ...u,
      status: u.ativo ? 'ativo' : 'inativo',
    }));

    return res.json({
      usuarios: usuariosNormalizados,
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
 * POST /api/admin/usuarios
 * Cria um novo usuário em qualquer tenant.
 */
const criarUsuarioAdmin = async (req, res, next) => {
  const { nome, email, senha, cargo, tenantId } = req.body;

  try {
    if (!nome || !email || !senha) {
      return res.status(400).json({
        mensagem: 'Nome, e-mail e senha são obrigatórios.',
        codigo:   'CRM-0400',
      });
    }

    if (!tenantId) {
      return res.status(400).json({
        mensagem: 'tenantId é obrigatório.',
        codigo:   'CRM-0400',
      });
    }

    // Verifica se o tenant existe
    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      return res.status(404).json({
        mensagem: 'Cliente (tenant) não encontrado.',
        codigo:   'CRM-0404',
      });
    }

    // Verifica se o e-mail já existe no tenant
    const emailExistente = await db('users')
      .where({ email: email.toLowerCase().trim(), tenant_id: tenantId })
      .first();

    if (emailExistente) {
      return res.status(409).json({
        mensagem: 'Este e-mail já está cadastrado neste cliente.',
        codigo:   'CRM-0409',
      });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Cria o usuário
    const [novoUsuario] = await db('users')
      .insert({
        tenant_id:  tenantId,
        nome:       nome.trim(),
        email:      email.toLowerCase().trim(),
        senha_hash: senhaHash,
        cargo:      cargo || 'member',
        ativo:      true,
        criado_em:  new Date(),
      })
      .returning(['id', 'nome', 'email', 'cargo', 'ativo', 'tenant_id', 'criado_em']);

    // Registra no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   tenantId,
      user_id:     req.userId,
      user_email:  req.userEmail,
      acao:        'create',
      recurso:     'user',
      recurso_id:  novoUsuario.id,
      descricao:   `[Admin] Novo usuário criado: ${nome} (${email}) no tenant ${tenant.nome}`,
      ip_address:  req.ip,
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    logger.info(`[Admin] Novo usuário criado: ${email}`, {
      tenantId,
      criadoPor: req.userId,
    });

    return res.status(201).json({
      mensagem: 'Usuário criado com sucesso.',
      usuario: {
        ...novoUsuario,
        status: 'ativo',
        tenantNome: tenant.nome,
      },
    });

  } catch (erro) {
    next(erro);
  }
};

/**
 * GET /api/admin/usuarios/:id
 * Retorna os detalhes de um usuário específico (qualquer tenant).
 */
const obterUsuarioAdmin = async (req, res, next) => {
  try {
    const usuario = await db('users as u')
      .join('tenants as t', 'u.tenant_id', 't.id')
      .where('u.id', req.params.id)
      .select(
        'u.id',
        'u.nome',
        'u.email',
        'u.cargo',
        'u.ativo',
        'u.tenant_id as tenantId',
        't.nome as tenantNome',
        'u.criado_em as criadoEm',
        'u.ultimo_login as ultimoLogin'
      )
      .first();

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
        codigo:   'CRM-0404',
      });
    }

    return res.json({
      usuario: { ...usuario, status: usuario.ativo ? 'ativo' : 'inativo' },
    });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PUT /api/admin/usuarios/:id
 * Atualiza nome, cargo e/ou senha de um usuário.
 */
const atualizarUsuarioAdmin = async (req, res, next) => {
  const { nome, cargo, senha } = req.body;

  try {
    const usuario = await db('users').where({ id: req.params.id }).first();

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
        codigo:   'CRM-0404',
      });
    }

    const atualizacao = {
      atualizado_em: new Date(),
    };

    if (nome)  atualizacao.nome  = nome.trim();
    if (cargo) atualizacao.cargo = cargo;
    if (senha) {
      if (senha.length < 8) {
        return res.status(400).json({
          mensagem: 'A senha deve ter pelo menos 8 caracteres.',
          codigo:   'CRM-0400',
        });
      }
      atualizacao.senha_hash = await bcrypt.hash(senha, 12);
    }

    await db('users').where({ id: req.params.id }).update(atualizacao);

    // Registra no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   usuario.tenant_id,
      user_id:     req.userId,
      user_email:  req.userEmail,
      acao:        'update',
      recurso:     'user',
      recurso_id:  req.params.id,
      descricao:   `[Admin] Usuário atualizado: ${usuario.email}`,
      ip_address:  req.ip,
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    return res.json({ mensagem: 'Usuário atualizado com sucesso.' });

  } catch (erro) {
    next(erro);
  }
};

/**
 * PATCH /api/admin/usuarios/:id/status
 * Ativa ou desativa um usuário.
 * Aceita { status: 'ativo' | 'inativo' } (string, padrão do frontend).
 */
const alterarStatusUsuarioAdmin = async (req, res, next) => {
  const { status } = req.body;

  try {
    if (!['ativo', 'inativo'].includes(status)) {
      return res.status(400).json({
        mensagem: 'O campo "status" deve ser "ativo" ou "inativo".',
        codigo:   'CRM-0400',
      });
    }

    const usuario = await db('users').where({ id: req.params.id }).first();

    if (!usuario) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
        codigo:   'CRM-0404',
      });
    }

    // Impede desativar a si mesmo
    if (req.params.id === req.userId) {
      return res.status(400).json({
        mensagem: 'Você não pode alterar o status da sua própria conta.',
        codigo:   'CRM-0400',
      });
    }

    const ativo = status === 'ativo';

    await db('users').where({ id: req.params.id }).update({
      ativo,
      atualizado_em: new Date(),
    });

    // Registra no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   usuario.tenant_id,
      user_id:     req.userId,
      user_email:  req.userEmail,
      acao:        ativo ? 'activate' : 'deactivate',
      recurso:     'user',
      recurso_id:  req.params.id,
      descricao:   `[Admin] Usuário ${ativo ? 'ativado' : 'desativado'}: ${usuario.email}`,
      ip_address:  req.ip,
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    logger.info(`[Admin] Status do usuário alterado: ${usuario.email} → ${status}`, {
      alteradoPor: req.userId,
    });

    return res.json({
      mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso.`,
    });

  } catch (erro) {
    next(erro);
  }
};

module.exports = {
  listarUsuariosAdmin,
  criarUsuarioAdmin,
  obterUsuarioAdmin,
  atualizarUsuarioAdmin,
  alterarStatusUsuarioAdmin,
};
