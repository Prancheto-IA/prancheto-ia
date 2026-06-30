// =============================================================
// PRANCHETO.IA - CONTROLLER DE USUÁRIOS (Super Admin)
// CRUD de usuários com visão global (todos os tenants).
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const bcrypt       = require('bcryptjs');
const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// ----------------------------------------------------------
// HELPER: Registra evento no audit_log (sem lançar exceção)
// ----------------------------------------------------------
const registrarAudit = async (dados) => {
  const { error } = await supabase.from('audit_logs').insert(dados);
  if (error) logger.warn('[AdminUsers] Falha ao registrar audit_log:', error.message);
};

// Campos seguros para retornar (sem senha_hash)
const CAMPOS_USUARIO = 'id, tenant_id, nome, email, cargo, permissoes, ativo, criado_em, atualizado_em, ultimo_login';

// =============================================================
// GET /api/admin/usuarios
// Lista todos os usuários do sistema com JOIN no tenant
// =============================================================
const listarUsuariosAdmin = async (req, res, next) => {
  try {
    const {
      pagina   = 1,
      limite   = 20,
      busca,
      cargo,
      ativo,
      tenantId,
    } = req.query;

    const paginaNum = parseInt(pagina, 10);
    const limiteNum = parseInt(limite, 10);
    const offset    = (paginaNum - 1) * limiteNum;

    // Supabase não suporta JOIN direto no cliente JS — fazemos em duas etapas:
    // 1. Busca usuários com filtros
    // 2. Busca tenants correspondentes e mescla

    let query = supabase
      .from('users')
      .select(CAMPOS_USUARIO, { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limiteNum - 1);

    if (cargo)    query = query.eq('cargo', cargo);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`);
    }

    const { data: usuarios, error, count } = await query;

    if (error) throw error;

    // Busca os tenants dos usuários para enriquecer a resposta
    const tenantIds = [...new Set((usuarios || []).map(u => u.tenant_id).filter(Boolean))];
    let tenantsMap = {};

    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, nome, slug, plano, status')
        .in('id', tenantIds);

      tenantsMap = (tenants || []).reduce((acc, t) => {
        acc[t.id] = t;
        return acc;
      }, {});
    }

    // Mescla dados do tenant em cada usuário
    const usuariosNormalizados = (usuarios || []).map((u) => ({
      ...u,
      tenant: u.tenant_id ? (tenantsMap[u.tenant_id] || null) : null,
    }));

    const total = count || 0;

    return res.json({
      usuarios: usuariosNormalizados,
      paginacao: {
        pagina:       paginaNum,
        limite:       limiteNum,
        total,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });
  } catch (erro) {
    logger.error('[AdminUsers] Erro ao listar usuários:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/admin/usuarios
// Cria um usuário em qualquer tenant (visão Super Admin)
// =============================================================
const criarUsuarioAdmin = async (req, res, next) => {
  try {
    const {
      nome,
      email,
      senha,
      cargo      = 'member',
      tenant_id,
      permissoes = {},
    } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0501',
        mensagem: 'Nome, e-mail e senha são obrigatórios.',
      });
    }

    // Valida o cargo (super_admin não pode ser criado por esta rota)
    const cargosValidos = ['admin', 'manager', 'member', 'viewer'];
    if (!cargosValidos.includes(cargo)) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0502',
        mensagem: `Cargo inválido. Use: ${cargosValidos.join(', ')}.`,
      });
    }

    // Se tenant_id fornecido, verifica se existe
    if (tenant_id) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', tenant_id)
        .limit(1);

      if (!tenants?.length) {
        return res.status(404).json({
          sucesso:  false,
          codigo:   'CRM-0303',
          mensagem: 'Tenant não encontrado.',
        });
      }
    }

    // Verifica se o e-mail já existe (globalmente)
    const { data: existente } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .limit(1);

    if (existente?.length > 0) {
      return res.status(409).json({
        sucesso:  false,
        codigo:   'CRM-0503',
        mensagem: 'Já existe um usuário com este e-mail.',
      });
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Cria o usuário
    const { data: novosUsuarios, error } = await supabase
      .from('users')
      .insert({
        tenant_id:  tenant_id || null,
        nome:       nome.trim(),
        email:      email.toLowerCase().trim(),
        senha_hash: senhaHash,
        cargo,
        permissoes,
        ativo:      true,
      })
      .select(CAMPOS_USUARIO);

    if (error) throw error;

    const novoUsuario = novosUsuarios?.[0];

    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      tenant_id:   tenant_id || null,
      acao:        'usuario_criado',
      recurso:     'users',
      recurso_id:  novoUsuario.id,
      descricao:   `[Admin] Novo usuário criado: ${email} (${cargo})`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    logger.info(`[Admin] Novo usuário criado: ${email}`, { userId: novoUsuario.id });

    return res.status(201).json({
      sucesso:  true,
      mensagem: 'Usuário criado com sucesso.',
      usuario: {
        ...novoUsuario,
        tenant: null,
      },
    });
  } catch (erro) {
    logger.error('[AdminUsers] Erro ao criar usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// GET /api/admin/usuarios/:id
// Retorna um usuário específico com dados do tenant
// =============================================================
const obterUsuarioAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: usuarios, error } = await supabase
      .from('users')
      .select(CAMPOS_USUARIO)
      .eq('id', id)
      .limit(1);

    if (error) throw error;

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0505',
        mensagem: 'Usuário não encontrado.',
      });
    }

    // Busca dados do tenant se existir
    let tenant = null;
    if (usuario.tenant_id) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, nome, slug, plano, status')
        .eq('id', usuario.tenant_id)
        .limit(1);
      tenant = tenants?.[0] || null;
    }

    return res.json({
      sucesso:  true,
      usuario:  { ...usuario, tenant },
    });
  } catch (erro) {
    logger.error('[AdminUsers] Erro ao obter usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// PUT /api/admin/usuarios/:id
// Atualiza dados de qualquer usuário (visão Super Admin)
// =============================================================
const atualizarUsuarioAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cargo, permissoes, senha, tenant_id } = req.body;

    // Verifica se o usuário existe
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, email, cargo')
      .eq('id', id)
      .limit(1);

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0505',
        mensagem: 'Usuário não encontrado.',
      });
    }

    // Impede alteração de super_admin por esta rota
    if (usuario.cargo === 'super_admin' && cargo && cargo !== 'super_admin') {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0508',
        mensagem: 'Não é possível alterar o cargo de um Super Admin.',
      });
    }

    const atualizacao = { atualizado_em: new Date().toISOString() };
    if (nome      !== undefined) atualizacao.nome      = nome.trim();
    if (cargo     !== undefined) atualizacao.cargo     = cargo;
    if (permissoes !== undefined) atualizacao.permissoes = permissoes;
    if (tenant_id !== undefined) atualizacao.tenant_id = tenant_id || null;
    if (senha) {
      atualizacao.senha_hash = await bcrypt.hash(senha, 12);
    }

    const { data: atualizados, error } = await supabase
      .from('users')
      .update(atualizacao)
      .eq('id', id)
      .select(CAMPOS_USUARIO);

    if (error) throw error;

    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        'usuario_atualizado',
      recurso:     'users',
      recurso_id:  id,
      descricao:   `[Admin] Usuário atualizado: ${usuario.email}`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    return res.json({
      sucesso:  true,
      mensagem: 'Usuário atualizado com sucesso.',
      usuario:  atualizados?.[0],
    });
  } catch (erro) {
    logger.error('[AdminUsers] Erro ao atualizar usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// PATCH /api/admin/usuarios/:id/status
// Ativa ou desativa qualquer usuário (visão Super Admin)
// =============================================================
const alterarStatusUsuarioAdmin = async (req, res, next) => {
  try {
    const { id }    = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0506',
        mensagem: 'O campo "ativo" deve ser um booleano.',
      });
    }

    // Verifica se o usuário existe
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, email, cargo')
      .eq('id', id)
      .limit(1);

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0505',
        mensagem: 'Usuário não encontrado.',
      });
    }

    // Impede desativar super_admin
    if (usuario.cargo === 'super_admin' && !ativo) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0509',
        mensagem: 'Não é possível desativar um Super Admin.',
      });
    }

    const { error } = await supabase
      .from('users')
      .update({ ativo, atualizado_em: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        ativo ? 'usuario_ativado' : 'usuario_desativado',
      recurso:     'users',
      recurso_id:  id,
      descricao:   `[Admin] Usuário ${ativo ? 'ativado' : 'desativado'}: ${usuario.email}`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    return res.json({
      sucesso:  true,
      mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso.`,
    });
  } catch (erro) {
    logger.error('[AdminUsers] Erro ao alterar status do usuário:', erro.message);
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
