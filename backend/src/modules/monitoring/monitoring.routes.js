// =============================================================
// PRANCHETO.IA - ROTAS DE MONITORAMENTO (Super Admin)
// Agrega métricas do sistema a partir dos dados existentes no banco.
// Migrado de Knex.js para @supabase/supabase-js
//
// Prefixo: /api/admin/monitoring
// Proteção: autenticar + exigirSuperAdmin
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();
const os      = require('os');

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');
const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

router.use(autenticar, exigirSuperAdmin);

// ----------------------------------------------------------
// HELPER: Conta registros com filtros opcionais
// ----------------------------------------------------------
const contarRegistros = async (tabela, filtros = {}) => {
  let query = supabase
    .from(tabela)
    .select('id', { count: 'exact', head: true });

  for (const [campo, valor] of Object.entries(filtros)) {
    if (valor !== undefined) query = query.eq(campo, valor);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

// ----------------------------------------------------------
// HELPER: Conta registros com filtro de data (>=)
// ----------------------------------------------------------
const contarComData = async (tabela, campoDt, dataInicio, filtrosExtras = {}) => {
  let query = supabase
    .from(tabela)
    .select('id', { count: 'exact', head: true })
    .gte(campoDt, dataInicio.toISOString());

  for (const [campo, valor] of Object.entries(filtrosExtras)) {
    query = query.eq(campo, valor);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
};

/**
 * GET /api/admin/monitoring/overview
 * Retorna métricas agregadas do sistema.
 */
router.get('/overview', async (req, res, next) => {
  try {
    const agora    = new Date();
    const h24atras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const d7atras  = new Date(agora.getTime() - 7  * 24 * 60 * 60 * 1000);

    // Executa todas as queries em paralelo para máxima performance
    const [
      totalTenants,
      totalUsuarios,
      usuariosAtivos,
      totalConversas,
      totalMensagens,
      eventosHoje,
      errosHoje,
      loginsHoje,
      novosTenants7d,
      novosUsuarios7d,
      conversas7d,
    ] = await Promise.all([
      contarRegistros('tenants'),
      contarRegistros('users'),
      contarRegistros('users', { ativo: true }),
      contarRegistros('ai_conversations'),
      contarRegistros('ai_messages'),
      contarComData('audit_logs', 'criado_em', h24atras),
      contarComData('audit_logs', 'criado_em', h24atras, { resultado: 'failure' }),
      contarComData('audit_logs', 'criado_em', h24atras, { acao: 'login' }),
      contarComData('tenants', 'criado_em', d7atras),
      contarComData('users', 'criado_em', d7atras),
      contarComData('ai_conversations', 'criado_em', d7atras),
    ]);

    // Distribuição por plano
    const { data: distPlanos, error: errPlanos } = await supabase
      .from('tenants')
      .select('plano');
    if (errPlanos) throw errPlanos;

    const distribuicaoPlanos = Object.entries(
      (distPlanos || []).reduce((acc, t) => {
        acc[t.plano] = (acc[t.plano] || 0) + 1;
        return acc;
      }, {})
    ).map(([plano, qtd]) => ({ plano, qtd }));

    // Distribuição por status de tenant
    const { data: distStatus, error: errStatus } = await supabase
      .from('tenants')
      .select('status');
    if (errStatus) throw errStatus;

    const distribuicaoStatus = Object.entries(
      (distStatus || []).reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {})
    ).map(([status, qtd]) => ({ status, qtd }));

    // Top 5 tenants com mais usuários
    const { data: todosUsuarios, error: errUsuarios } = await supabase
      .from('users')
      .select('tenant_id');
    if (errUsuarios) throw errUsuarios;

    // Conta usuários por tenant
    const contagemPorTenant = (todosUsuarios || []).reduce((acc, u) => {
      if (u.tenant_id) acc[u.tenant_id] = (acc[u.tenant_id] || 0) + 1;
      return acc;
    }, {});

    // Busca dados dos top 5 tenants
    const topTenantIds = Object.entries(contagemPorTenant)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    let topTenants = [];
    if (topTenantIds.length > 0) {
      const { data: tenantsDados } = await supabase
        .from('tenants')
        .select('id, nome, plano, status')
        .in('id', topTenantIds);

      topTenants = (tenantsDados || []).map(t => ({
        id:          t.id,
        nome:        t.nome,
        plano:       t.plano,
        status:      t.status,
        qtdUsuarios: contagemPorTenant[t.id] || 0,
      })).sort((a, b) => b.qtdUsuarios - a.qtdUsuarios);
    }

    // Métricas do servidor Node.js
    const memoriaTotal   = os.totalmem();
    const memoriaLivre   = os.freemem();
    const memoriaUsada   = memoriaTotal - memoriaLivre;
    const pctMemoria     = Math.round((memoriaUsada / memoriaTotal) * 100);
    const uptimeSegundos = process.uptime();
    const uptimeHoras    = Math.floor(uptimeSegundos / 3600);
    const uptimeMinutos  = Math.floor((uptimeSegundos % 3600) / 60);

    return res.json({
      gerado_em: agora.toISOString(),

      totais: {
        tenants:        totalTenants,
        usuarios:       totalUsuarios,
        usuariosAtivos,
        conversasIA:    totalConversas,
        mensagensIA:    totalMensagens,
      },

      crescimento: {
        novosTenants7d,
        novosUsuarios7d,
        conversasIA7d: conversas7d,
      },

      atividade24h: {
        eventos: eventosHoje,
        erros:   errosHoje,
        logins:  loginsHoje,
      },

      distribuicaoPlanos,
      distribuicaoStatus,
      topTenants,

      servidor: {
        uptime:         `${uptimeHoras}h ${uptimeMinutos}m`,
        uptimeSegundos: Math.floor(uptimeSegundos),
        memoriaUsadaMB: Math.round(memoriaUsada / 1024 / 1024),
        memoriaTotalMB: Math.round(memoriaTotal / 1024 / 1024),
        pctMemoria,
        nodeVersion:    process.version,
        plataforma:     process.platform,
        ambiente:       process.env.NODE_ENV || 'development',
      },
    });

  } catch (erro) {
    logger.error('[Monitoring] Erro ao gerar overview:', erro.message);
    next(erro);
  }
});

/**
 * GET /api/admin/monitoring/atividade
 * Retorna atividade agrupada por dia (últimos 7 dias) e alertas recentes.
 */
router.get('/atividade', async (req, res, next) => {
  try {
    const d7atras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Busca todos os logs dos últimos 7 dias
    const { data: logsRecentes, error: erroLogs } = await supabase
      .from('audit_logs')
      .select('criado_em, resultado')
      .gte('criado_em', d7atras.toISOString())
      .order('criado_em', { ascending: true });

    if (erroLogs) throw erroLogs;

    // Agrupa por dia
    const porDia = (logsRecentes || []).reduce((acc, log) => {
      const dia = log.criado_em.substring(0, 10); // 'YYYY-MM-DD'
      if (!acc[dia]) acc[dia] = { total: 0, erros: 0 };
      acc[dia].total++;
      if (log.resultado === 'failure') acc[dia].erros++;
      return acc;
    }, {});

    const atividadePorDia = Object.entries(porDia)
      .map(([dia, v]) => ({ dia, total: v.total }))
      .sort((a, b) => a.dia.localeCompare(b.dia));

    const errosPorDia = Object.entries(porDia)
      .map(([dia, v]) => ({ dia, total: v.erros }))
      .sort((a, b) => a.dia.localeCompare(b.dia));

    // Últimas 10 ações críticas (falhas e bloqueios)
    const { data: alertasRaw, error: erroAlertas } = await supabase
      .from('audit_logs')
      .select('id, acao, resultado, user_email, descricao, ip_address, criado_em, tenant_id')
      .in('resultado', ['failure', 'blocked'])
      .order('criado_em', { ascending: false })
      .limit(10);

    if (erroAlertas) throw erroAlertas;

    // Enriquece alertas com nome do tenant
    const tenantIds = [...new Set((alertasRaw || []).map(a => a.tenant_id).filter(Boolean))];
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

    const alertas = (alertasRaw || []).map(a => ({
      ...a,
      tenantNome: a.tenant_id ? (tenantsMap[a.tenant_id] || null) : null,
    }));

    return res.json({
      atividadePorDia,
      errosPorDia,
      alertas,
    });

  } catch (erro) {
    logger.error('[Monitoring] Erro ao gerar atividade:', erro.message);
    next(erro);
  }
});

module.exports = router;
