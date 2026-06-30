// =============================================================
// PRANCHETO.IA - CONTROLLER DE PLANOS
// Retorna os planos disponíveis com seus recursos.
// Rota pública (autenticada): GET /api/planos
// =============================================================

'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// =============================================================
// GET /api/planos
// Lista todos os planos ativos com seus recursos
// =============================================================
const listarPlanos = async (req, res, next) => {
  try {
    // Busca planos ativos ordenados
    const { data: planos, error: erroPlanos } = await supabase
      .from('planos')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (erroPlanos) throw erroPlanos;

    // Busca todos os recursos de uma vez
    const { data: recursos, error: erroRecursos } = await supabase
      .from('recursos_plano')
      .select('*')
      .order('slug', { ascending: true });

    if (erroRecursos) throw erroRecursos;

    // Agrupa recursos por plano_id
    const recursosPorPlano = {};
    (recursos || []).forEach(r => {
      if (!recursosPorPlano[r.plano_id]) recursosPorPlano[r.plano_id] = [];
      recursosPorPlano[r.plano_id].push(r);
    });

    // Monta resposta com recursos embutidos em cada plano
    const planosComRecursos = (planos || []).map(p => ({
      ...p,
      recursos: recursosPorPlano[p.id] || [],
    }));

    return res.status(200).json({
      sucesso: true,
      planos:  planosComRecursos,
    });
  } catch (err) {
    logger.error('Erro ao listar planos', { erro: err.message });
    next(err);
  }
};

// =============================================================
// GET /api/planos/meu-plano
// Retorna o plano e recursos do tenant do usuário autenticado
// =============================================================
const meuPlano = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(200).json({
        sucesso: true,
        plano:   null,
        recursos: [],
        mensagem: 'Usuário sem tenant associado.',
      });
    }

    // Busca o tenant para saber o plano
    const { data: tenant, error: erroTenant } = await supabase
      .from('tenants')
      .select('id, nome, plano, limite_usuarios, status')
      .eq('id', tenantId)
      .single();

    if (erroTenant) throw erroTenant;

    // Busca o plano pelo slug
    const { data: plano, error: erroPlano } = await supabase
      .from('planos')
      .select('*')
      .eq('slug', tenant.plano)
      .single();

    if (erroPlano) {
      // Plano não encontrado no banco — retorna dados básicos
      return res.status(200).json({
        sucesso: true,
        plano:   { slug: tenant.plano, nome: tenant.plano },
        recursos: [],
        tenant,
      });
    }

    // Busca recursos do plano
    const { data: recursos, error: erroRecursos } = await supabase
      .from('recursos_plano')
      .select('*')
      .eq('plano_id', plano.id)
      .order('slug', { ascending: true });

    if (erroRecursos) throw erroRecursos;

    return res.status(200).json({
      sucesso:  true,
      plano:    { ...plano, recursos: recursos || [] },
      tenant,
    });
  } catch (err) {
    logger.error('Erro ao buscar plano do usuário', { erro: err.message });
    next(err);
  }
};

module.exports = { listarPlanos, meuPlano };
