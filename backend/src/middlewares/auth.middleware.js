// =============================================================
// PRANCHETO.IA - MIDDLEWARE DE AUTENTICAÇÃO (JWT)
// Verifica e decodifica o token JWT em cada requisição protegida.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const jwt    = require('jsonwebtoken');
const { supabase } = require('../config/database');
const logger = require('../services/logger.service');

/**
 * Middleware de autenticação JWT.
 * Deve ser aplicado em todas as rotas protegidas.
 */
const autenticar = async (req, res, next) => {
  try {
    // --- 1. EXTRAÇÃO DO TOKEN ---
    const headerAutorizacao = req.headers.authorization;

    if (!headerAutorizacao || !headerAutorizacao.startsWith('Bearer ')) {
      return res.status(401).json({
        erro:   'Token de autenticação não fornecido.',
        codigo: 'CRM-0401',
      });
    }

    const token = headerAutorizacao.split(' ')[1];

    // --- 2. VERIFICAÇÃO DO TOKEN ---
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (erroJwt) {
      if (erroJwt.name === 'TokenExpiredError') {
        return res.status(401).json({
          erro:   'Sessão expirada. Faça login novamente.',
          codigo: 'CRM-0401',
        });
      }
      return res.status(401).json({
        erro:   'Token de autenticação inválido.',
        codigo: 'CRM-0401',
      });
    }

    // --- 3. VERIFICAÇÃO DO USUÁRIO NO BANCO (Supabase) ---
    const { data: usuarios, error } = await supabase
      .from('users')
      .select('id, tenant_id, cargo, email, permissoes, bloqueado_ate')
      .eq('id', payload.userId)
      .eq('ativo', true)
      .limit(1);

    if (error) throw error;

    const usuario = usuarios?.[0];

    if (!usuario) {
      return res.status(401).json({
        erro:   'Usuário não encontrado ou inativo.',
        codigo: 'CRM-0401',
      });
    }

    // --- 4. VERIFICAÇÃO DE BLOQUEIO TEMPORÁRIO ---
    if (usuario.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
      const minutosRestantes = Math.ceil(
        (new Date(usuario.bloqueado_ate) - new Date()) / 60000
      );
      return res.status(403).json({
        erro:   `Conta temporariamente bloqueada por segurança. Tente novamente em ${minutosRestantes} minuto(s).`,
        codigo: 'CRM-0403',
      });
    }

    // --- 5. INJEÇÃO DOS DADOS NO REQUEST ---
    req.userId       = usuario.id;
    req.tenantId     = usuario.tenant_id;
    req.userCargo    = usuario.cargo;
    req.userEmail    = usuario.email;
    req.permissoes   = usuario.permissoes || {};
    req.isSuperAdmin = usuario.cargo === 'super_admin';

    // --- 6. SUPORTE A IMPERSONATION ---
    req.isImpersonating = payload.isImpersonating === true;
    req.superAdminId    = payload.superAdminId    || null;
    req.superAdminEmail = payload.superAdminEmail || null;

    next();

  } catch (erro) {
    logger.error('Erro inesperado no middleware de autenticação', {
      erro:  erro.message,
      stack: erro.stack,
    });
    next(erro);
  }
};

/**
 * Middleware que verifica se o usuário é Super Admin.
 * Deve ser usado APÓS o middleware 'autenticar'.
 */
const exigirSuperAdmin = (req, res, next) => {
  if (!req.isSuperAdmin) {
    logger.warn('Tentativa de acesso ao painel admin por usuário não autorizado', {
      userId:   req.userId,
      tenantId: req.tenantId,
      cargo:    req.userCargo,
      rota:     req.originalUrl,
    });
    return res.status(403).json({
      erro:   'Acesso negado. Esta área é restrita aos administradores do sistema.',
      codigo: 'CRM-0403',
    });
  }
  next();
};

module.exports = { autenticar, exigirSuperAdmin };
