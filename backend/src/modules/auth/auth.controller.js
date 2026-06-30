// =============================================================
// PRANCHETO.IA - CONTROLLER DE AUTENTICAÇÃO
// Gerencia login, refresh de token e logout.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { supabase } = require('../../config/database');
const logger  = require('../../services/logger.service');

// ----------------------------------------------------------
// HELPER: Gera o par de tokens (access + refresh)
// ----------------------------------------------------------
const gerarTokens = (usuario) => {
  const payload = {
    userId:       usuario.id,
    tenantId:     usuario.tenant_id,
    cargo:        usuario.cargo,
    isSuperAdmin: usuario.cargo === 'super_admin',
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  const refreshToken = jwt.sign(
    { userId: usuario.id, tipo: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
};

// ----------------------------------------------------------
// HELPER: Registra evento no audit_log (sem lançar exceção)
// ----------------------------------------------------------
const registrarAudit = async (dados) => {
  const { error } = await supabase.from('audit_logs').insert(dados);
  if (error) logger.warn('[Auth] Falha ao registrar audit_log:', error.message);
};

// =============================================================
// POST /api/auth/login
// =============================================================
const login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;

    // Validação básica
    if (!email || !senha) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0101',
        mensagem: 'E-mail e senha são obrigatórios.',
      });
    }

    // Busca o usuário pelo e-mail
    const { data: usuarios, error: erroBusca } = await supabase
      .from('users')
      .select('id, tenant_id, nome, email, senha_hash, cargo, permissoes, ativo, tentativas_login_falhas, bloqueado_ate, ultimo_login')
      .eq('email', email.toLowerCase().trim())
      .limit(1);

    if (erroBusca) throw erroBusca;

    const usuario = usuarios?.[0];

    // Usuário não encontrado — retorna mensagem genérica (segurança)
    if (!usuario) {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0102',
        mensagem: 'E-mail ou senha incorretos.',
      });
    }

    // Verifica se a conta está ativa
    if (!usuario.ativo) {
      return res.status(403).json({
        sucesso:  false,
        codigo:   'CRM-0103',
        mensagem: 'Conta desativada. Entre em contato com o suporte.',
      });
    }

    // Verifica bloqueio temporário por tentativas falhas
    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.bloqueado_ate) - new Date()) / 60000
      );
      return res.status(403).json({
        sucesso:  false,
        codigo:   'CRM-0104',
        mensagem: `Conta temporariamente bloqueada por segurança. Tente novamente em ${minutosRestantes} minuto(s).`,
      });
    }

    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      // Incrementa tentativas falhas
      const tentativas = (usuario.tentativas_login_falhas || 0) + 1;
      const MAX_TENTATIVAS = 5;
      const bloqueadoAte = tentativas >= MAX_TENTATIVAS
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos
        : null;

      await supabase
        .from('users')
        .update({
          tentativas_login_falhas: tentativas,
          bloqueado_ate:           bloqueadoAte,
        })
        .eq('id', usuario.id);

      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0102',
        mensagem: tentativas >= MAX_TENTATIVAS
          ? 'Conta bloqueada por 15 minutos após múltiplas tentativas falhas.'
          : 'E-mail ou senha incorretos.',
      });
    }

    // Login bem-sucedido — gera tokens
    const { token, refreshToken } = gerarTokens(usuario);

    // Hash do refresh token para armazenar no banco
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    // Atualiza o usuário: zera tentativas, salva refresh token e ultimo_login
    await supabase
      .from('users')
      .update({
        tentativas_login_falhas: 0,
        bloqueado_ate:           null,
        ultimo_login:            new Date().toISOString(),
        refresh_token_hash:      refreshTokenHash,
      })
      .eq('id', usuario.id);

    // Registra o login no audit_log
    await registrarAudit({
      user_id:     usuario.id,
      user_email:  usuario.email,
      user_cargo:  usuario.cargo,
      tenant_id:   usuario.tenant_id,
      acao:        'login',
      recurso:     'auth',
      descricao:   `Login bem-sucedido: ${usuario.email}`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    logger.info(`Login bem-sucedido: ${usuario.email}`, { userId: usuario.id });

    return res.status(200).json({
      sucesso: true,
      token,
      refreshToken,
      usuario: {
        id:           usuario.id,
        nome:         usuario.nome,
        email:        usuario.email,
        cargo:        usuario.cargo,
        tenantId:     usuario.tenant_id,
        isSuperAdmin: usuario.cargo === 'super_admin',
        permissoes:   usuario.permissoes || {},
      },
    });
  } catch (erro) {
    logger.error('[Auth] Erro no login:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/auth/refresh
// =============================================================
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0201',
        mensagem: 'Refresh token não fornecido.',
      });
    }

    // Verifica a assinatura do refresh token
    let payload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0202',
        mensagem: 'Refresh token inválido ou expirado.',
      });
    }

    if (payload.tipo !== 'refresh') {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0202',
        mensagem: 'Token inválido.',
      });
    }

    // Busca o usuário e verifica se ainda está ativo
    const { data: usuarios, error } = await supabase
      .from('users')
      .select('id, tenant_id, nome, email, cargo, permissoes, ativo, refresh_token_hash')
      .eq('id', payload.userId)
      .eq('ativo', true)
      .limit(1);

    if (error) throw error;

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0203',
        mensagem: 'Usuário não encontrado ou inativo.',
      });
    }

    // Verifica se o refresh token bate com o hash armazenado
    if (!usuario.refresh_token_hash) {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0204',
        mensagem: 'Sessão encerrada. Faça login novamente.',
      });
    }

    const tokenValido = await bcrypt.compare(refreshToken, usuario.refresh_token_hash);
    if (!tokenValido) {
      return res.status(401).json({
        sucesso:  false,
        codigo:   'CRM-0204',
        mensagem: 'Refresh token inválido.',
      });
    }

    // Gera novos tokens (rotação de refresh token)
    const { token: novoToken, refreshToken: novoRefreshToken } = gerarTokens(usuario);
    const novoRefreshHash = await bcrypt.hash(novoRefreshToken, 10);

    await supabase
      .from('users')
      .update({ refresh_token_hash: novoRefreshHash })
      .eq('id', usuario.id);

    return res.status(200).json({
      sucesso:      true,
      token:        novoToken,
      refreshToken: novoRefreshToken,
    });
  } catch (erro) {
    logger.error('[Auth] Erro no refresh:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/auth/logout
// =============================================================
const logout = async (req, res, next) => {
  try {
    // Invalida o refresh token no banco
    await supabase
      .from('users')
      .update({ refresh_token_hash: null })
      .eq('id', req.userId);

    // Registra o logout no audit_log
    await registrarAudit({
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      tenant_id:   req.tenantId,
      acao:        'logout',
      recurso:     'auth',
      descricao:   `Logout: ${req.userEmail}`,
      resultado:   'success',
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
    });

    logger.info(`Logout: ${req.userEmail}`);

    return res.status(200).json({
      sucesso:  true,
      mensagem: 'Logout realizado com sucesso.',
    });
  } catch (erro) {
    logger.error('[Auth] Erro no logout:', erro.message);
    next(erro);
  }
};

module.exports = { login, refresh, logout };
