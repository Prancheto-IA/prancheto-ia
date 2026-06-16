// =============================================================
// PRANCHETO.IA - CONTROLLER DE AUTENTICAÇÃO
// Gerencia login, logout e renovação de token JWT.
//
// Fluxo de Login:
//   1. Valida e-mail e senha
//   2. Verifica bloqueio por tentativas excessivas
//   3. Compara senha com hash bcrypt
//   4. Gera token JWT (curta duração) + refresh token (longa duração)
//   5. Detecta se é Super Admin e retorna flag isSuperAdmin
//   6. Registra o login no log de auditoria
// =============================================================

'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../config/database');
const logger = require('../../services/logger.service');
const Sentry = require('../../config/sentry');

// Tempo máximo de bloqueio após tentativas excessivas (30 minutos)
const MINUTOS_BLOQUEIO = 30;
// Número de tentativas antes do bloqueio
const MAX_TENTATIVAS   = 5;

/**
 * Gera um par de tokens JWT (access token + refresh token).
 * @param {object} usuario - Dados do usuário
 * @returns {{ token: string, refreshToken: string }}
 */
const gerarTokens = (usuario) => {
  // Payload do token: dados mínimos necessários (não inclui senha ou dados sensíveis)
  const payload = {
    userId:      usuario.id,
    tenantId:    usuario.tenant_id,
    cargo:       usuario.cargo,
    isSuperAdmin: usuario.cargo === 'super_admin',
  };

  // Token de acesso: curta duração (8 horas por padrão)
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer:    'prancheto-ia',
    subject:   usuario.id,
  });

  // Refresh token: longa duração (7 dias por padrão)
  const refreshToken = jwt.sign(
    { userId: usuario.id, tipo: 'refresh' },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer:    'prancheto-ia',
      subject:   usuario.id,
    }
  );

  return { token, refreshToken };
};

/**
 * POST /api/auth/login
 * Autentica o usuário e retorna os tokens JWT.
 */
const login = async (req, res, next) => {
  const { email, senha } = req.body;

  try {
    // --- VALIDAÇÃO DOS CAMPOS ---
    if (!email || !senha) {
      return res.status(400).json({
        erro:   'E-mail e senha são obrigatórios.',
        codigo: 'CRM-0400',
      });
    }

    // --- BUSCA DO USUÁRIO ---
    const usuario = await db('users')
      .where({ email: email.toLowerCase().trim() })
      .select(
        'id', 'tenant_id', 'nome', 'email', 'senha_hash',
        'cargo', 'permissoes', 'ativo',
        'tentativas_login_falhas', 'bloqueado_ate'
      )
      .first();

    // Mensagem genérica para não revelar se o e-mail existe ou não (segurança)
    const MENSAGEM_CREDENCIAIS_INVALIDAS = 'E-mail ou senha incorretos.';

    if (!usuario) {
      return res.status(401).json({
        erro:   MENSAGEM_CREDENCIAIS_INVALIDAS,
        codigo: 'CRM-0401',
      });
    }

    // --- VERIFICAÇÃO DE CONTA ATIVA ---
    if (!usuario.ativo) {
      return res.status(403).json({
        erro:   'Conta desativada. Entre em contato com o suporte.',
        codigo: 'CRM-0403',
      });
    }

    // --- VERIFICAÇÃO DE BLOQUEIO TEMPORÁRIO ---
    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.bloqueado_ate) - new Date()) / 60000
      );
      return res.status(403).json({
        erro:   `Conta bloqueada por segurança. Tente novamente em ${minutosRestantes} minuto(s).`,
        codigo: 'CRM-0403',
      });
    }

    // --- VERIFICAÇÃO DA SENHA ---
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaCorreta) {
      // Incrementa o contador de tentativas falhas
      const novasTentativas = (usuario.tentativas_login_falhas || 0) + 1;
      const atualizacao = { tentativas_login_falhas: novasTentativas };

      // Bloqueia a conta após MAX_TENTATIVAS falhas
      if (novasTentativas >= MAX_TENTATIVAS) {
        const bloqueadoAte = new Date(Date.now() + MINUTOS_BLOQUEIO * 60 * 1000);
        atualizacao.bloqueado_ate = bloqueadoAte;

        // Alerta de segurança: notifica o Sentry
        const mensagemAlerta = `🚨 Conta bloqueada por excesso de tentativas: ${email}`;
        logger.warn(mensagemAlerta, { email, ip: req.ip, tentativas: novasTentativas });
        Sentry.captureMessage(mensagemAlerta, { level: 'warning', extra: { email, ip: req.ip } });
      }

      await db('users').where({ id: usuario.id }).update(atualizacao);

      return res.status(401).json({
        erro:   MENSAGEM_CREDENCIAIS_INVALIDAS,
        codigo: 'CRM-0401',
      });
    }

    // --- LOGIN BEM-SUCEDIDO ---
    // Gera os tokens JWT
    const { token, refreshToken } = gerarTokens(usuario);

    // Salva o hash do refresh token no banco (para invalidação no logout)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 8);

    // Reseta o contador de tentativas e atualiza o último login
    await db('users').where({ id: usuario.id }).update({
      tentativas_login_falhas: 0,
      bloqueado_ate:           null,
      ultimo_login:            new Date(),
      refresh_token_hash:      refreshTokenHash,
    });

    // Registra o login no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   usuario.tenant_id,
      user_id:     usuario.id,
      user_email:  usuario.email,
      user_cargo:  usuario.cargo,
      acao:        'login',
      recurso:     'auth',
      descricao:   `Login bem-sucedido: ${usuario.email}`,
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    logger.info(`Login bem-sucedido: ${usuario.email}`, {
      userId:   usuario.id,
      tenantId: usuario.tenant_id,
      cargo:    usuario.cargo,
    });

    // --- RESPOSTA ---
    return res.status(200).json({
      token,
      refreshToken,
      usuario: {
        id:          usuario.id,
        nome:        usuario.nome,
        email:       usuario.email,
        cargo:       usuario.cargo,
        tenantId:    usuario.tenant_id,
        isSuperAdmin: usuario.cargo === 'super_admin',
        permissoes:  usuario.permissoes || {},
      },
    });

  } catch (erro) {
    logger.error('Erro no processo de login', { erro: erro.message, email });
    next(erro);
  }
};

/**
 * POST /api/auth/refresh
 * Renova o token JWT usando o refresh token.
 */
const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res.status(400).json({
        erro:   'Refresh token não fornecido.',
        codigo: 'CRM-0400',
      });
    }

    // Verifica a validade do refresh token
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        erro:   'Refresh token inválido ou expirado. Faça login novamente.',
        codigo: 'CRM-0401',
      });
    }

    // Busca o usuário e verifica se o refresh token ainda é válido
    const usuario = await db('users')
      .where({ id: payload.userId, ativo: true })
      .select('id', 'tenant_id', 'cargo', 'email', 'refresh_token_hash')
      .first();

    if (!usuario || !usuario.refresh_token_hash) {
      return res.status(401).json({
        erro:   'Sessão inválida. Faça login novamente.',
        codigo: 'CRM-0401',
      });
    }

    // Verifica se o refresh token corresponde ao armazenado no banco
    const tokenValido = await bcrypt.compare(refreshToken, usuario.refresh_token_hash);
    if (!tokenValido) {
      return res.status(401).json({
        erro:   'Refresh token inválido. Faça login novamente.',
        codigo: 'CRM-0401',
      });
    }

    // Gera novos tokens
    const { token: novoToken, refreshToken: novoRefreshToken } = gerarTokens(usuario);
    const novoRefreshTokenHash = await bcrypt.hash(novoRefreshToken, 8);

    await db('users').where({ id: usuario.id }).update({
      refresh_token_hash: novoRefreshTokenHash,
    });

    return res.status(200).json({
      token:        novoToken,
      refreshToken: novoRefreshToken,
    });

  } catch (erro) {
    next(erro);
  }
};

/**
 * POST /api/auth/logout
 * Invalida o refresh token do usuário (logout seguro).
 */
const logout = async (req, res, next) => {
  try {
    // Invalida o refresh token removendo-o do banco
    await db('users').where({ id: req.userId }).update({
      refresh_token_hash: null,
    });

    // Registra o logout no log de auditoria
    await db('audit_logs').insert({
      tenant_id:   req.tenantId,
      user_id:     req.userId,
      user_email:  req.userEmail,
      user_cargo:  req.userCargo,
      acao:        'logout',
      recurso:     'auth',
      descricao:   `Logout: ${req.userEmail}`,
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      metodo_http: req.method,
      rota:        req.originalUrl,
      resultado:   'success',
    });

    return res.status(200).json({ mensagem: 'Logout realizado com sucesso.' });

  } catch (erro) {
    next(erro);
  }
};

module.exports = { login, refresh, logout };
