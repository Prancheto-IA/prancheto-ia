// =============================================================
// PRANCHETO.IA - CONTROLLER DE IMPERSONATION
// Permite ao Super Admin "acessar como" qualquer usuário do sistema
// para fins de suporte, diagnóstico e testes.
//
// FLUXO:
//   1. Super Admin clica em "Acessar como usuário" na lista de tenants
//   2. Backend gera um JWT especial com flag 'impersonating: true'
//      e salva o token original do Super Admin no payload
//   3. Frontend troca o token atual pelo token de impersonation
//   4. Banner flutuante "Voltar para Admin" aparece em todas as páginas
//   5. Ao clicar em "Voltar", o token original é restaurado
//
// SEGURANÇA:
//   - Apenas Super Admin pode iniciar impersonation
//   - Token de impersonation expira em 2 horas
//   - Toda sessão é registrada no audit_log
//   - Impersonation não pode ser aninhado (não pode impersonar dentro de impersonation)
//   - O token original do Super Admin é armazenado no payload do JWT de impersonation
// =============================================================

'use strict';

const jwt    = require('jsonwebtoken');
const { db } = require('../../config/database');
const logger = require('../../services/logger.service');

/**
 * POST /api/admin/impersonate/:userId
 * Inicia uma sessão de impersonation como o usuário especificado.
 * Apenas Super Admin pode chamar esta rota.
 *
 * Retorna um novo JWT com os dados do usuário alvo + flag de impersonation.
 * O frontend deve substituir o token atual por este novo token.
 */
const iniciarImpersonation = async (req, res, next) => {
  try {
    const superAdminId    = req.userId;
    const superAdminEmail = req.userEmail;
    const { userId }      = req.params;

    // Impede impersonation aninhado (Super Admin já está em modo impersonation)
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
    const usuarioAlvo = await db('users')
      .where({ id: userId, ativo: true })
      .select('id', 'nome', 'email', 'cargo', 'tenant_id', 'permissoes')
      .first();

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
      const tenant = await db('tenants')
        .where({ id: usuarioAlvo.tenant_id })
        .select('nome')
        .first();
      nomeTenant = tenant?.nome || null;
    }

    // Gera o token de impersonation com os dados do usuário alvo
    // O payload inclui o ID do Super Admin para restaurar a sessão depois
    const tokenImpersonation = jwt.sign(
      {
        userId:          usuarioAlvo.id,
        tenantId:        usuarioAlvo.tenant_id,
        cargo:           usuarioAlvo.cargo,
        isSuperAdmin:    false,
        isImpersonating: true,           // Flag que identifica sessão de impersonation
        superAdminId:    superAdminId,   // ID do Super Admin para restaurar sessão
        superAdminEmail: superAdminEmail,
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Registra o início da impersonation no audit_log
    await db('audit_logs').insert({
      user_id:    superAdminId,
      user_email: superAdminEmail,
      user_cargo: 'super_admin',
      acao:       'impersonation_inicio',
      descricao:  `Super Admin iniciou impersonation como: ${usuarioAlvo.email} (${usuarioAlvo.cargo})`,
      recurso:    'impersonation',
      resultado:  'success',
      rota:       req.originalUrl,
      metodo_http: req.method,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      tenant_id:  usuarioAlvo.tenant_id,
    }).catch((e) => logger.warn('[Impersonation] Falha ao registrar audit_log:', e.message));

    logger.info(`[Impersonation] Super Admin ${superAdminEmail} iniciou impersonation como ${usuarioAlvo.email}`);

    return res.status(200).json({
      sucesso: true,
      mensagem: `Sessão iniciada como ${usuarioAlvo.nome || usuarioAlvo.email}`,
      token: tokenImpersonation,
      usuario: {
        id:           usuarioAlvo.id,
        nome:         usuarioAlvo.nome,
        email:        usuarioAlvo.email,
        cargo:        usuarioAlvo.cargo,
        tenantId:     usuarioAlvo.tenant_id,
        nomeTenant,
        isSuperAdmin: false,
        isImpersonating: true,
        superAdminId,
        superAdminEmail,
        permissoes:   usuarioAlvo.permissoes || {},
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
 * Pode ser chamada tanto pelo token de impersonation quanto pelo token original.
 *
 * O frontend envia o superAdminId extraído do payload do token de impersonation.
 * O backend gera um novo JWT para o Super Admin.
 */
const encerrarImpersonation = async (req, res, next) => {
  try {
    // Extrai o superAdminId do payload do token atual (token de impersonation)
    const superAdminId = req.superAdminId || req.userId;

    // Busca os dados atualizados do Super Admin no banco
    const superAdmin = await db('users')
      .where({ id: superAdminId, ativo: true })
      .select('id', 'nome', 'email', 'cargo', 'tenant_id', 'permissoes')
      .first();

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
        userId:       superAdmin.id,
        tenantId:     null,
        cargo:        'super_admin',
        isSuperAdmin: true,
        isImpersonating: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Registra o encerramento no audit_log
    await db('audit_logs').insert({
      user_id:    superAdmin.id,
      user_email: superAdmin.email,
      user_cargo: 'super_admin',
      acao:       'impersonation_fim',
      descricao:  `Super Admin encerrou sessão de impersonation`,
      recurso:    'impersonation',
      resultado:  'success',
      rota:       req.originalUrl,
      metodo_http: req.method,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      tenant_id:  null,
    }).catch((e) => logger.warn('[Impersonation] Falha ao registrar audit_log:', e.message));

    logger.info(`[Impersonation] Sessão encerrada. Super Admin ${superAdmin.email} restaurado.`);

    return res.status(200).json({
      sucesso:  true,
      mensagem: 'Sessão de impersonation encerrada. Retornando ao painel admin.',
      token:    novoToken,
      usuario: {
        id:           superAdmin.id,
        nome:         superAdmin.nome,
        email:        superAdmin.email,
        cargo:        'super_admin',
        tenantId:     null,
        isSuperAdmin: true,
        isImpersonating: false,
        permissoes:   superAdmin.permissoes || {},
      },
    });
  } catch (erro) {
    logger.error('[Impersonation] Erro ao encerrar impersonation:', erro.message);
    next(erro);
  }
};

module.exports = { iniciarImpersonation, encerrarImpersonation };
