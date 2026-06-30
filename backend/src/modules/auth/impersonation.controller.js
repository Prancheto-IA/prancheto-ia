// =============================================================
// PRANCHETO.IA - CONTROLLER DE IMPERSONATION
// Permite ao Super Admin "acessar como" qualquer usuário do sistema.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const jwt          = require('jsonwebtoken');
const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// ----------------------------------------------------------
// HELPER: Registra evento no audit_log (sem lançar exceção)
// ----------------------------------------------------------
const registrarAudit = async (dados) => {
  const { error } = await supabase.from('audit_logs').insert(dados);
  if (error) logger.warn('[Impersonation] Falha ao registrar audit_log:', error.message);
};

/**
 * POST /api/admin/impersonate/:userId
 * Inicia uma sessão de impersonation como o usuário especificado.
 */
const iniciarImpersonation = async (req, res, next) => {
  try {
    const superAdminId    = req.userId;
    const superAdminEmail = req.userEmail;
    const { userId }      = req.params;

    // Impede impersonation aninhado
    if (req.isImpersonating) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0701',
        mensagem: 'Não é possível iniciar impersonation dentro de uma sessão de impersonation. Encerre a sessão atual primeiro.',
      });
    }

    // Impede que o Super Admin se impersone a si mesmo
    if (userId === superAdminId) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0702',
        mensagem: 'Não é possível iniciar impersonation com sua própria conta.',
      });
    }

    // Busca o usuário alvo no banco
    const { data: usuarios, error: erroBusca } = await supabase
      .from('users')
      .select('id, nome, email, cargo, tenant_id, permissoes')
      .eq('id', userId)
      .eq('ativo', true)
      .limit(1);

    if (erroBusca) throw erroBusca;

    const usuarioAlvo = usuarios?.[0];

    if (!usuarioAlvo) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0703',
        mensagem: 'Usuário não encontrado ou inativo.',
      });
    }

    // Impede impersonation de outro Super Admin
    if (usuarioAlvo.cargo === 'super_admin') {
      return res.status(403).json({
        sucesso:  false,
        codigo:   'CRM-0704',
        mensagem: 'Não é possível iniciar impersonation de outro Super Admin.',
      });
    }

    // Busca o nome do tenant do usuário alvo
    let nomeTenant = null;
    if (usuarioAlvo.tenant_id) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', usuarioAlvo.tenant_id)
        .limit(1);
      nomeTenant = tenants?.[0]?.nome || null;
    }

    // Gera o token de impersonation
    const tokenImpersonation = jwt.sign(
      {
        userId:          usuarioAlvo.id,
        tenantId:        usuarioAlvo.tenant_id,
        cargo:           usuarioAlvo.cargo,
        isSuperAdmin:    false,
        isImpersonating: true,
        superAdminId,
        superAdminEmail,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Registra o início da impersonation no audit_log
    await registrarAudit({
      user_id:     superAdminId,
      user_email:  superAdminEmail,
      user_cargo:  'super_admin',
      acao:        'impersonation_inicio',
      descricao:   `Super Admin iniciou impersonation como: ${usuarioAlvo.email} (${usuarioAlvo.cargo})`,
      recurso:     'impersonation',
      resultado:   'success',
      rota:        req.originalUrl,
      metodo_http: req.method,
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      tenant_id:   usuarioAlvo.tenant_id,
    });

    logger.info(`[Impersonation] Super Admin ${superAdminEmail} iniciou impersonation como ${usuarioAlvo.email}`);

    return res.status(200).json({
      sucesso:  true,
      mensagem: `Sessão iniciada como ${usuarioAlvo.nome || usuarioAlvo.email}`,
      token:    tokenImpersonation,
      usuario: {
        id:              usuarioAlvo.id,
        nome:            usuarioAlvo.nome,
        email:           usuarioAlvo.email,
        cargo:           usuarioAlvo.cargo,
        tenantId:        usuarioAlvo.tenant_id,
        nomeTenant,
        isSuperAdmin:    false,
        isImpersonating: true,
        superAdminId,
        superAdminEmail,
        permissoes:      usuarioAlvo.permissoes || {},
      },
    });
  } catch (erro) {
    logger.error('[Impersonation] Erro ao iniciar impersonation:', erro.message);
    next(erro);
  }
};

/**
 * POST /api/admin/impersonate/stop
 * Encerra a sessão de impersonation e restaura o token do Super Admin.
 */
const encerrarImpersonation = async (req, res, next) => {
  try {
    const superAdminId = req.superAdminId || req.userId;

    // Busca os dados atualizados do Super Admin no banco
    const { data: usuarios, error } = await supabase
      .from('users')
      .select('id, nome, email, cargo, tenant_id, permissoes')
      .eq('id', superAdminId)
      .eq('ativo', true)
      .limit(1);

    if (error) throw error;

    const superAdmin = usuarios?.[0];

    if (!superAdmin || superAdmin.cargo !== 'super_admin') {
      return res.status(403).json({
        sucesso:  false,
        codigo:   'CRM-0705',
        mensagem: 'Não foi possível restaurar a sessão do Super Admin.',
      });
    }

    // Gera um novo token JWT para o Super Admin
    const novoToken = jwt.sign(
      {
        userId:          superAdmin.id,
        tenantId:        null,
        cargo:           'super_admin',
        isSuperAdmin:    true,
        isImpersonating: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Registra o encerramento no audit_log
    await registrarAudit({
      user_id:     superAdmin.id,
      user_email:  superAdmin.email,
      user_cargo:  'super_admin',
      acao:        'impersonation_fim',
      descricao:   'Super Admin encerrou sessão de impersonation',
      recurso:     'impersonation',
      resultado:   'success',
      rota:        req.originalUrl,
      metodo_http: req.method,
      ip_address:  req.ip,
      user_agent:  req.headers['user-agent'],
      tenant_id:   null,
    });

    logger.info(`[Impersonation] Sessão encerrada. Super Admin ${superAdmin.email} restaurado.`);

    return res.status(200).json({
      sucesso:  true,
      mensagem: 'Sessão de impersonation encerrada. Retornando ao painel admin.',
      token:    novoToken,
      usuario: {
        id:              superAdmin.id,
        nome:            superAdmin.nome,
        email:           superAdmin.email,
        cargo:           'super_admin',
        tenantId:        null,
        isSuperAdmin:    true,
        isImpersonating: false,
        permissoes:      superAdmin.permissoes || {},
      },
    });
  } catch (erro) {
    logger.error('[Impersonation] Erro ao encerrar impersonation:', erro.message);
    next(erro);
  }
};

module.exports = { iniciarImpersonation, encerrarImpersonation };
