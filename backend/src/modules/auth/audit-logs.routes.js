// =============================================================
// PRANCHETO.IA - ROTAS DE LOGS DE AUDITORIA (Super Admin)
// Consulta os registros da tabela audit_logs para fins de
// segurança, investigação de incidentes e conformidade LGPD.
//
// Prefixo: /api/admin/logs
// Proteção: autenticar + exigirSuperAdmin
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');
const { db }    = require('../../config/database');
const logger    = require('../../services/logger.service');

// Aplica autenticação + Super Admin em todas as rotas
router.use(autenticar, exigirSuperAdmin);

/**
 * GET /api/admin/logs
 * Lista os logs de auditoria com filtros e paginação.
 *
 * Query params:
 *   pagina, limite, acao, resultado, tenantId, userId, busca (email/descricao)
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      pagina    = 1,
      limite    = 30,
      acao,
      resultado,
      tenantId,
      userId,
      busca,
    } = req.query;

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    // Query base com LEFT JOIN para trazer nome do tenant
    let query = db('audit_logs as al')
      .leftJoin('tenants as t', 'al.tenant_id', 't.id')
      .select(
        'al.id',
        'al.acao',
        'al.recurso',
        'al.recurso_id',
        'al.descricao',
        'al.resultado',
        'al.user_id',
        'al.user_email',
        'al.user_cargo',
        'al.ip_address',
        'al.metodo_http',
        'al.rota',
        'al.codigo_erro',
        'al.criado_em',
        'al.tenant_id',
        't.nome as tenantNome'
      )
      .orderBy('al.criado_em', 'desc');

    // Filtros
    if (acao)      query = query.where('al.acao', acao);
    if (resultado) query = query.where('al.resultado', resultado);
    if (tenantId)  query = query.where('al.tenant_id', tenantId);
    if (userId)    query = query.where('al.user_id', userId);
    if (busca) {
      query = query.where((q) => {
        q.whereILike('al.user_email', `%${busca}%`)
          .orWhereILike('al.descricao', `%${busca}%`)
          .orWhereILike('al.rota', `%${busca}%`);
      });
    }

    // Query de contagem
    let countQuery = db('audit_logs as al').count('al.id as total');
    if (acao)      countQuery = countQuery.where('al.acao', acao);
    if (resultado) countQuery = countQuery.where('al.resultado', resultado);
    if (tenantId)  countQuery = countQuery.where('al.tenant_id', tenantId);
    if (userId)    countQuery = countQuery.where('al.user_id', userId);
    if (busca) {
      countQuery = countQuery.where((q) => {
        q.whereILike('al.user_email', `%${busca}%`)
          .orWhereILike('al.descricao', `%${busca}%`)
          .orWhereILike('al.rota', `%${busca}%`);
      });
    }

    const [logs, [{ total }]] = await Promise.all([
      query.limit(parseInt(limite)).offset(offset),
      countQuery,
    ]);

    return res.json({
      logs,
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
});

/**
 * GET /api/admin/logs/acoes
 * Retorna a lista de ações distintas para popular o filtro.
 */
router.get('/acoes', async (req, res, next) => {
  try {
    const acoes = await db('audit_logs')
      .distinct('acao')
      .orderBy('acao')
      .pluck('acao');

    return res.json({ acoes });
  } catch (erro) {
    next(erro);
  }
});

module.exports = router;
