// =============================================================
// PRANCHETO.IA - MIDDLEWARE RBAC (Role-Based Access Control)
// Controle de acesso granular baseado em cargo e permissões.
// Deve ser usado APÓS o middleware 'autenticar'.
//
// Hierarquia de cargos (do mais ao menos privilegiado):
//   super_admin > admin > manager > member > viewer
//
// Uso nos controllers:
//   router.get('/rota', autenticar, exigirCargo(['admin', 'manager']), controller)
//   router.get('/rota', autenticar, exigirPermissaoSecao('comercial'), controller)
// =============================================================

'use strict';

const logger = require('../services/logger.service');

// Define a hierarquia numérica dos cargos para comparações
const HIERARQUIA_CARGOS = {
  super_admin: 100,
  admin:       80,
  manager:     60,
  member:      40,
  viewer:      20,
};

/**
 * Middleware que exige que o usuário tenha um dos cargos especificados.
 * @param {string[]} cargosPermitidos - Lista de cargos que podem acessar a rota
 * @returns {Function} Middleware Express
 *
 * Exemplo: exigirCargo(['admin', 'manager'])
 */
const exigirCargo = (cargosPermitidos) => {
  return (req, res, next) => {
    // Super Admin sempre tem acesso (cargo mais alto da hierarquia)
    if (req.isSuperAdmin) return next();

    if (!cargosPermitidos.includes(req.userCargo)) {
      logger.warn('Acesso negado por cargo insuficiente', {
        userId:          req.userId,
        cargoUsuario:    req.userCargo,
        cargosExigidos:  cargosPermitidos,
        rota:            req.originalUrl,
      });
      return res.status(403).json({
        erro:   'Acesso negado. Seu cargo não tem permissão para esta ação.',
        codigo: 'CRM-0403',
      });
    }
    next();
  };
};

/**
 * Middleware que exige nível mínimo de cargo na hierarquia.
 * @param {string} cargoMinimo - Cargo mínimo necessário
 * @returns {Function} Middleware Express
 *
 * Exemplo: exigirNivelMinimo('manager') → permite manager, admin e super_admin
 */
const exigirNivelMinimo = (cargoMinimo) => {
  return (req, res, next) => {
    if (req.isSuperAdmin) return next();

    const nivelUsuario = HIERARQUIA_CARGOS[req.userCargo] || 0;
    const nivelMinimo  = HIERARQUIA_CARGOS[cargoMinimo]   || 0;

    if (nivelUsuario < nivelMinimo) {
      logger.warn('Acesso negado por nível de cargo insuficiente', {
        userId:       req.userId,
        cargoUsuario: req.userCargo,
        cargoMinimo,
        rota:         req.originalUrl,
      });
      return res.status(403).json({
        erro:   `Acesso negado. É necessário o cargo "${cargoMinimo}" ou superior.`,
        codigo: 'CRM-0403',
      });
    }
    next();
  };
};

/**
 * Middleware que verifica permissão de acesso a uma Seção específica.
 * Bloqueia a rota se o usuário não tiver a seção em suas permissões.
 * @param {string} nomeSecao - Nome da seção (ex: 'comercial', 'outreach')
 * @returns {Function} Middleware Express
 */
const exigirPermissaoSecao = (nomeSecao) => {
  return (req, res, next) => {
    // Super Admin tem acesso a tudo
    if (req.isSuperAdmin) return next();

    const secoesPermitidas = req.permissoes?.secoes || [];

    // Verifica se tem acesso global ('*') ou acesso específico à seção
    const temAcesso = secoesPermitidas.includes('*') ||
                      secoesPermitidas.includes(nomeSecao);

    if (!temAcesso) {
      logger.warn('Acesso negado a seção não autorizada', {
        userId:   req.userId,
        tenantId: req.tenantId,
        secao:    nomeSecao,
        rota:     req.originalUrl,
      });
      return res.status(403).json({
        erro:   'Acesso negado. Você não tem permissão para acessar esta área.',
        codigo: 'CRM-0403',
      });
    }
    next();
  };
};

/**
 * Middleware que verifica permissão de acesso a um Módulo específico.
 * @param {string} nomeModulo - Nome do módulo
 * @returns {Function} Middleware Express
 */
const exigirPermissaoModulo = (nomeModulo) => {
  return (req, res, next) => {
    if (req.isSuperAdmin) return next();

    const modulosPermitidos = req.permissoes?.modulos || [];
    const temAcesso = modulosPermitidos.includes('*') ||
                      modulosPermitidos.includes(nomeModulo);

    if (!temAcesso) {
      return res.status(403).json({
        erro:   'Acesso negado. Você não tem permissão para este módulo.',
        codigo: 'CRM-0403',
      });
    }
    next();
  };
};

/**
 * Middleware que garante que o usuário só acessa dados do seu próprio tenant.
 * Injeta automaticamente o tenant_id nas queries para isolamento multi-tenant.
 * Deve ser usado em todas as rotas que retornam dados de negócio.
 */
const garantirIsolamentoTenant = (req, res, next) => {
  // Super Admin pode acessar qualquer tenant (via parâmetro na query)
  if (req.isSuperAdmin) return next();

  // Usuários comuns só podem acessar dados do seu próprio tenant
  if (!req.tenantId) {
    return res.status(403).json({
      erro:   'Usuário sem tenant associado.',
      codigo: 'CRM-0403',
    });
  }

  // Garante que o tenant_id da query (se fornecido) corresponde ao do usuário
  if (req.query.tenant_id && req.query.tenant_id !== req.tenantId) {
    logger.warn('Tentativa de acesso a dados de outro tenant', {
      userId:          req.userId,
      tenantIdUsuario: req.tenantId,
      tenantIdQuery:   req.query.tenant_id,
      rota:            req.originalUrl,
    });
    return res.status(403).json({
      erro:   'Acesso negado. Você não pode acessar dados de outro cliente.',
      codigo: 'CRM-0403',
    });
  }

  next();
};

module.exports = {
  exigirCargo,
  exigirNivelMinimo,
  exigirPermissaoSecao,
  exigirPermissaoModulo,
  garantirIsolamentoTenant,
};
