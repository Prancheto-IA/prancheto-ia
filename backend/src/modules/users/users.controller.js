// =============================================================
// PRANCHETO.IA - CONTROLLER DE USUÁRIOS (escopo do tenant)
// CRUD de usuários dentro do tenant do usuário autenticado.
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
  if (error) logger.warn('[Users] Falha ao registrar audit_log:', error.message);
};

// Campos seguros para retornar (sem senha_hash)
const CAMPOS_USUARIO = 'id, tenant_id, nome, email, cargo, permissoes, ativo, criado_em, atualizado_em, ultimo_login';

// =============================================================
// GET /api/users
// Lista usuários do tenant com paginação e busca
// =============================================================
const listarUsuarios = async (req, res, next) => {
  try {
    const {
      pagina = 1,
      limite = 20,
      busca,
      cargo,
      ativo,
    } = req.query;

    const paginaNum = parseInt(pagina, 10);
    const limiteNum = parseInt(limite, 10);
    const offset    = (paginaNum - 1) * limiteNum;

    let query = supabase
      .from('users')
      .select(CAMPOS_USUARIO, { count: 'exact' })
      .eq('tenant_id', req.tenantId)
      .order('criado_em', { ascending: false })
      .range(offset, offset + limiteNum - 1);

    if (cargo) query = query.eq('cargo', cargo);
    if (ativo !== undefined) query = query.eq('ativo', ativo === 'true');
    if (busca) {
      query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`);
    }

    const { data: usuarios, error, count } = await query;

    if (error) throw error;

    const total = count || 0;

    return res.json({
      usuarios: usuarios || [],
      paginacao: {
        pagina:       paginaNum,
        limite:       limiteNum,
        total,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });
  } catch (erro) {
    logger.error('[Users] Erro ao listar usuários:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/users
// Cria um novo usuário no tenant
// =============================================================
const criarUsuario = async (req, res, next) => {
  try {
    const {
      nome,
      email,
      senha,
      cargo       = 'member',
      permissoes  = {},
    } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0501',
        mensagem: 'Nome, e-mail e senha são obrigatórios.',
      });
    }

    // Valida o cargo
    const cargosValidos = ['admin', 'manager', 'member', 'viewer'];
    if (!cargosValidos.includes(cargo)) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0502',
        mensagem: `Cargo inválido. Use: ${cargosValidos.join(', ')}.`,
      });
    }

    // Verifica se o e-mail já existe no tenant
    const { data: existente } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .eq('tenant_id', req.tenantId)
      .limit(1);

    if (existente?.length > 0) {
      return res.status(409).json({
        sucesso:  false,
        codigo:   'CRM-0503',
        mensagem: 'Já existe um usuário com este e-mail neste tenant.',
      });
    }

    // Verifica limite de usuários do tenant
    const { data: tenants } = await supabase
      .from('tenants')
      .select('limite_usuarios')
      .eq('id', req.tenantId)
      .limit(1);

    const tenant = tenants?.[0];

    if (tenant) {
      const { count: qtdAtual } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', req.tenantId)
        .eq('ativo', true);

      if (qtdAtual >= tenant.limite_usuarios) {
        return res.status(403).json({
          sucesso:  false,
          codigo:   'CRM-0504',
          mensagem: `Limite de usuários atingido (${tenant.limite_usuarios}). Faça upgrade do plano.`,
        });
      }
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 12);

    // Cria o usuário
    const { data: novosUsuarios, error } = await supabase
      .from('users')
      .insert({
        tenant_id:  req.tenantId,
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
      tenant_id:   req.tenantId,
      acao:        'usuario_criado',
      recurso:     'users',
      recurso_id:  novoUsuario.id,
      descricao:   `Novo usuário criado: ${email} (${cargo})`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    logger.info(`Novo usuário criado: ${email}`, { userId: novoUsuario.id, tenantId: req.tenantId });

    return res.status(201).json({
      sucesso:  true,
      mensagem: 'Usuário criado com sucesso.',
      usuario:  novoUsuario,
    });
  } catch (erro) {
    logger.error('[Users] Erro ao criar usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// GET /api/users/:id
// Retorna um usuário específico do tenant
// =============================================================
const obterUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: usuarios, error } = await supabase
      .from('users')
      .select(CAMPOS_USUARIO)
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
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

    return res.json({ sucesso: true, usuario });
  } catch (erro) {
    logger.error('[Users] Erro ao obter usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// PUT /api/users/:id
// Atualiza dados de um usuário do tenant
// =============================================================
const atualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, cargo, permissoes, senha } = req.body;

    // Verifica se o usuário pertence ao tenant
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, nome, email')
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .limit(1);

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0505',
        mensagem: 'Usuário não encontrado.',
      });
    }

    const atualizacao = { atualizado_em: new Date().toISOString() };
    if (nome       !== undefined) atualizacao.nome       = nome.trim();
    if (cargo      !== undefined) atualizacao.cargo      = cargo;
    if (permissoes !== undefined) atualizacao.permissoes = permissoes;
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
      tenant_id:   req.tenantId,
      acao:        'usuario_atualizado',
      recurso:     'users',
      recurso_id:  id,
      descricao:   `Usuário atualizado: ${usuario.email}`,
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
    logger.error('[Users] Erro ao atualizar usuário:', erro.message);
    next(erro);
  }
};

// =============================================================
// PATCH /api/users/:id/status
// Ativa ou desativa um usuário do tenant
// =============================================================
const alterarStatusUsuario = async (req, res, next) => {
  try {
    const { id }   = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0506',
        mensagem: 'O campo "ativo" deve ser um booleano.',
      });
    }

    // Impede que o usuário desative a si mesmo
    if (id === req.userId) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0507',
        mensagem: 'Você não pode alterar o status da sua própria conta.',
      });
    }

    // Verifica se o usuário pertence ao tenant
    const { data: usuarios } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .eq('tenant_id', req.tenantId)
      .limit(1);

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0505',
        mensagem: 'Usuário não encontrado.',
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
      tenant_id:   req.tenantId,
      acao:        ativo ? 'usuario_ativado' : 'usuario_desativado',
      recurso:     'users',
      recurso_id:  id,
      descricao:   `Usuário ${ativo ? 'ativado' : 'desativado'}: ${usuario.email}`,
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
    logger.error('[Users] Erro ao alterar status do usuário:', erro.message);
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
