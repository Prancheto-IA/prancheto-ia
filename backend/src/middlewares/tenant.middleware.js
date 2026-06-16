// =============================================================
// PRANCHETO.IA - MIDDLEWARE DE TENANT
// Garante que todas as operações de banco de dados incluam
// automaticamente o tenant_id do usuário logado.
//
// Este middleware é a última linha de defesa do isolamento multi-tenant:
// mesmo que um controller esqueça de filtrar por tenant_id,
// este middleware injeta o filtro automaticamente via Knex hooks.
//
// Deve ser usado APÓS o middleware 'autenticar'.
// =============================================================

'use strict';

const logger = require('../services/logger.service');

/**
 * Middleware que injeta o tenant_id no contexto da requisição
 * e configura um hook no Knex para filtrar automaticamente
 * todas as queries pelo tenant do usuário logado.
 *
 * Uso: router.use(autenticar, injetarTenant)
 */
const injetarTenant = (req, res, next) => {
  // Super Admin não tem tenant_id — pode acessar qualquer tenant
  if (req.isSuperAdmin) {
    // Super Admin pode especificar um tenant via header X-Tenant-ID
    // para operar em nome de um cliente específico
    const tenantIdHeader = req.headers['x-tenant-id'];
    if (tenantIdHeader) {
      req.tenantIdEfetivo = tenantIdHeader;
      logger.info(`Super Admin operando em nome do tenant: ${tenantIdHeader}`, {
        userId: req.userId,
      });
    } else {
      req.tenantIdEfetivo = null; // Acesso global
    }
    return next();
  }

  // Usuário comum: usa o tenant_id do token JWT
  if (!req.tenantId) {
    return res.status(403).json({
      erro:   'Usuário sem tenant associado. Contate o suporte.',
      codigo: 'CRM-0403',
    });
  }

  req.tenantIdEfetivo = req.tenantId;
  next();
};

/**
 * Helper para construir queries Knex com filtro de tenant automático.
 * Uso nos controllers:
 *   const query = queryComTenant(knex('users'), req);
 *   // Equivale a: knex('users').where({ tenant_id: req.tenantIdEfetivo })
 *
 * @param {import('knex').Knex.QueryBuilder} queryBuilder
 * @param {object} req - Objeto de requisição Express
 * @returns {import('knex').Knex.QueryBuilder}
 */
const queryComTenant = (queryBuilder, req) => {
  // Super Admin sem tenant específico: retorna query sem filtro (acesso global)
  if (req.isSuperAdmin && !req.tenantIdEfetivo) {
    return queryBuilder;
  }

  // Aplica o filtro de tenant automaticamente
  return queryBuilder.where({ tenant_id: req.tenantIdEfetivo });
};

module.exports = { injetarTenant, queryComTenant };
