// =============================================================
// PRANCHETO.IA - ROTAS DE LOGS DE AUDITORIA (Super Admin)
// Consulta os registros da tabela audit_logs.
// Migrado de Knex.js para @supabase/supabase-js
//
// Prefixo: /api/admin/logs
// Proteção: autenticar + exigirSuperAdmin
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');
const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

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

    const paginaNum = parseInt(pagina, 10);
    const limiteNum = parseInt(limite, 10);
    const offset    = (paginaNum - 1) * limiteNum;

    // --- Query de dados com paginação ---
    let query = supabase
      .from('audit_logs')
      .select('id, acao, recurso, recurso_id, descricao, resultado, user_id, user_email, user_cargo, ip_address, metodo_http, rota, codigo_erro, criado_em, tenant_id', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + limiteNum - 1);

    if (acao)      query = query.eq('acao', acao);
    if (resultado) query = query.eq('resultado', resultado);
    if (tenantId)  query = query.eq('tenant_id', tenantId);
    if (userId)    query = query.eq('user_id', userId);
    if (busca) {
      query = query.or(`user_email.ilike.%${busca}%,descricao.ilike.%${busca}%,rota.ilike.%${busca}%`);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    // Enriquece com nome do tenant (busca em paralelo para os tenant_ids únicos)
    const tenantIds = [...new Set((logs || []).map(l => l.tenant_id).filter(Boolean))];
    let tenantsMap = {};

    if (tenantIds.length > 0) {
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, nome')
        .in('id', tenantIds);

      tenantsMap = (tenants || []).reduce((acc, t) => {
        acc[t.id] = t.nome;
        return acc;
      }, {});
    }

    const logsEnriquecidos = (logs || []).map(log => ({
      ...log,
      tenantNome: log.tenant_id ? (tenantsMap[log.tenant_id] || null) : null,
    }));

    const total = count || 0;

    return res.json({
      logs: logsEnriquecidos,
      paginacao: {
        pagina:       paginaNum,
        limite:       limiteNum,
        total,
        totalPaginas: Math.ceil(total / limiteNum),
      },
    });

  } catch (erro) {
    logger.error('[AuditLogs] Erro ao listar logs:', erro.message);
    next(erro);
  }
});

/**
 * GET /api/admin/logs/acoes
 * Retorna a lista de ações distintas para popular o filtro.
 */
router.get('/acoes', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('acao')
      .order('acao', { ascending: true });

    if (error) throw error;

    // Extrai valores únicos
    const acoes = [...new Set((data || []).map(r => r.acao))].sort();

    return res.json({ acoes });
  } catch (erro) {
    logger.error('[AuditLogs] Erro ao listar ações:', erro.message);
    next(erro);
  }
});

module.exports = router;
