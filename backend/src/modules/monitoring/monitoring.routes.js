// =============================================================
// PRANCHETO.IA - ROTAS DE MONITORAMENTO (Super Admin)
// Agrega métricas do sistema a partir dos dados existentes no banco.
//
// Prefixo: /api/admin/monitoring
// Proteção: autenticar + exigirSuperAdmin
//
// ENDPOINTS:
//   GET /api/admin/monitoring/overview   → Métricas gerais do sistema
//   GET /api/admin/monitoring/atividade  → Atividade recente (logins, erros)
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();
const os      = require('os');

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');
const { db }    = require('../../config/database');
const logger    = require('../../services/logger.service');

router.use(autenticar, exigirSuperAdmin);

/**
 * GET /api/admin/monitoring/overview
 * Retorna métricas agregadas do sistema:
 *   - Totais: tenants, usuários, conversas IA, mensagens IA
 *   - Distribuição por plano
 *   - Distribuição por status de tenant
 *   - Usuários ativos vs inativos
 *   - Eventos de auditoria nas últimas 24h
 *   - Saúde do servidor (uptime, memória, CPU)
 */
router.get('/overview', async (req, res, next) => {
  try {
    const agora    = new Date();
    const h24atras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const d7atras  = new Date(agora.getTime() - 7  * 24 * 60 * 60 * 1000);
    const d30atras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Executa todas as queries em paralelo para máxima performance
    const [
      [{ totalTenants }],
      [{ totalUsuarios }],
      [{ usuariosAtivos }],
      [{ totalConversas }],
      [{ totalMensagens }],
      distribuicaoPlanos,
      distribuicaoStatusTenant,
      [{ eventosHoje }],
      [{ errosHoje }],
      [{ loginsHoje }],
      [{ novosTenants7d }],
      [{ novosUsuarios7d }],
      [{ conversas7d }],
      tenantsMaisAtivos,
    ] = await Promise.all([
      // Totais gerais
      db('tenants').count('id as totalTenants'),
      db('users').count('id as totalUsuarios'),
      db('users').where({ ativo: true }).count('id as usuariosAtivos'),
      db('ai_conversations').count('id as totalConversas'),
      db('ai_messages').count('id as totalMensagens'),

      // Distribuição por plano
      db('tenants')
        .select('plano')
        .count('id as qtd')
        .groupBy('plano')
        .orderBy('qtd', 'desc'),

      // Distribuição por status de tenant
      db('tenants')
        .select('status')
        .count('id as qtd')
        .groupBy('status'),

      // Eventos de auditoria hoje
      db('audit_logs')
        .where('criado_em', '>=', h24atras)
        .count('id as eventosHoje'),

      // Erros nas últimas 24h
      db('audit_logs')
        .where('criado_em', '>=', h24atras)
        .where('resultado', 'failure')
        .count('id as errosHoje'),

      // Logins nas últimas 24h
      db('audit_logs')
        .where('criado_em', '>=', h24atras)
        .where('acao', 'login')
        .count('id as loginsHoje'),

      // Novos tenants nos últimos 7 dias
      db('tenants')
        .where('criado_em', '>=', d7atras)
        .count('id as novosTenants7d'),

      // Novos usuários nos últimos 7 dias
      db('users')
        .where('criado_em', '>=', d7atras)
        .count('id as novosUsuarios7d'),

      // Conversas IA nos últimos 7 dias
      db('ai_conversations')
        .where('criado_em', '>=', d7atras)
        .count('id as conversas7d'),

      // Top 5 tenants com mais usuários
      db('tenants as t')
        .leftJoin('users as u', 'u.tenant_id', 't.id')
        .select('t.id', 't.nome', 't.plano', 't.status')
        .count('u.id as qtd_usuarios')
        .groupBy('t.id', 't.nome', 't.plano', 't.status')
        .orderBy('qtd_usuarios', 'desc')
        .limit(5),
    ]);

    // Métricas do servidor Node.js
    const memoriaTotal  = os.totalmem();
    const memoriaLivre  = os.freemem();
    const memoriaUsada  = memoriaTotal - memoriaLivre;
    const pctMemoria    = Math.round((memoriaUsada / memoriaTotal) * 100);
    const uptimeSegundos = process.uptime();
    const uptimeHoras   = Math.floor(uptimeSegundos / 3600);
    const uptimeMinutos = Math.floor((uptimeSegundos % 3600) / 60);

    return res.json({
      gerado_em: agora.toISOString(),

      // Totais
      totais: {
        tenants:       parseInt(totalTenants),
        usuarios:      parseInt(totalUsuarios),
        usuariosAtivos: parseInt(usuariosAtivos),
        conversasIA:   parseInt(totalConversas),
        mensagensIA:   parseInt(totalMensagens),
      },

      // Crescimento recente
      crescimento: {
        novosTenants7d:   parseInt(novosTenants7d),
        novosUsuarios7d:  parseInt(novosUsuarios7d),
        conversasIA7d:    parseInt(conversas7d),
      },

      // Atividade nas últimas 24h
      atividade24h: {
        eventos:  parseInt(eventosHoje),
        erros:    parseInt(errosHoje),
        logins:   parseInt(loginsHoje),
      },

      // Distribuições
      distribuicaoPlanos: distribuicaoPlanos.map(d => ({
        plano: d.plano,
        qtd:   parseInt(d.qtd),
      })),

      distribuicaoStatus: distribuicaoStatusTenant.map(d => ({
        status: d.status,
        qtd:    parseInt(d.qtd),
      })),

      // Top tenants
      topTenants: tenantsMaisAtivos.map(t => ({
        id:          t.id,
        nome:        t.nome,
        plano:       t.plano,
        status:      t.status,
        qtdUsuarios: parseInt(t.qtd_usuarios),
      })),

      // Saúde do servidor
      servidor: {
        uptime:        `${uptimeHoras}h ${uptimeMinutos}m`,
        uptimeSegundos: Math.floor(uptimeSegundos),
        memoriaUsadaMB: Math.round(memoriaUsada / 1024 / 1024),
        memoriaTotalMB: Math.round(memoriaTotal / 1024 / 1024),
        pctMemoria,
        nodeVersion:   process.version,
        plataforma:    process.platform,
        ambiente:      process.env.NODE_ENV || 'development',
      },
    });

  } catch (erro) {
    logger.error('[Monitoring] Erro ao gerar overview:', erro.message);
    next(erro);
  }
});

/**
 * GET /api/admin/monitoring/atividade
 * Retorna os últimos 30 eventos de auditoria agrupados por dia (últimos 7 dias).
 * Útil para gráfico de atividade.
 */
router.get('/atividade', async (req, res, next) => {
  try {
    // Atividade por dia nos últimos 7 dias
    const atividadePorDia = await db('audit_logs')
      .select(db.raw("DATE(criado_em) as dia"))
      .count('id as total')
      .where('criado_em', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .groupByRaw("DATE(criado_em)")
      .orderBy('dia', 'asc');

    // Erros por dia nos últimos 7 dias
    const errosPorDia = await db('audit_logs')
      .select(db.raw("DATE(criado_em) as dia"))
      .count('id as total')
      .where('criado_em', '>=', db.raw("NOW() - INTERVAL '7 days'"))
      .where('resultado', 'failure')
      .groupByRaw("DATE(criado_em)")
      .orderBy('dia', 'asc');

    // Últimas 10 ações críticas (falhas e bloqueios)
    const alertas = await db('audit_logs as al')
      .leftJoin('tenants as t', 'al.tenant_id', 't.id')
      .select(
        'al.id',
        'al.acao',
        'al.resultado',
        'al.user_email',
        'al.descricao',
        'al.ip_address',
        'al.criado_em',
        't.nome as tenantNome'
      )
      .whereIn('al.resultado', ['failure', 'blocked'])
      .orderBy('al.criado_em', 'desc')
      .limit(10);

    return res.json({
      atividadePorDia: atividadePorDia.map(d => ({
        dia:   d.dia,
        total: parseInt(d.total),
      })),
      errosPorDia: errosPorDia.map(d => ({
        dia:   d.dia,
        total: parseInt(d.total),
      })),
      alertas,
    });

  } catch (erro) {
    logger.error('[Monitoring] Erro ao gerar atividade:', erro.message);
    next(erro);
  }
});

module.exports = router;
