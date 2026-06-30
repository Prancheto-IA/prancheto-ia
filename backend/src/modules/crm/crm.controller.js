'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// Colunas de crm_contatos:
// id, tenant_id, responsavel_id, nome, email, telefone, empresa, cargo,
// origem, status_funil, valor_estimado, observacoes, tags, criado_em, atualizado_em

// Colunas de crm_interacoes:
// id, contato_id, tenant_id, criado_por, tipo, conteudo, criado_em

// ─── Helper: filtro base por tenant ou user ────────────────────
const filtroBase = (query, req) => {
  if (req.tenantId) return query.eq('tenant_id', req.tenantId);
  return query.eq('responsavel_id', req.userId);
};

// =============================================================
// CONTATOS — LISTAR
// GET /api/crm/contatos
// =============================================================
const listarContatos = async (req, res, next) => {
  try {
    const { busca, status, pagina = 1, limite = 50 } = req.query;
    const offset = (Number(pagina) - 1) * Number(limite);

    let query = supabase
      .from('crm_contatos')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + Number(limite) - 1);

    query = filtroBase(query, req);
    if (status) query = query.eq('status_funil', status);
    if (busca)  query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%,empresa.ilike.%${busca}%`);

    const { data, error, count } = await query;
    if (error) { logger.error('Erro ao listar contatos CRM', { error }); return next(error); }

    return res.status(200).json({ sucesso: true, dados: data || [], total: count || 0 });
  } catch (err) { next(err); }
};

// =============================================================
// CONTATOS — CRIAR
// POST /api/crm/contatos
// =============================================================
const criarContato = async (req, res, next) => {
  try {
    const { nome, email, telefone, empresa, cargo, origem, status_funil, valor_estimado, observacoes, tags } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({ sucesso: false, mensagem: 'Nome é obrigatório.' });
    }

    const registro = {
      responsavel_id: req.userId,
      nome:           nome.trim(),
      email:          email?.trim()    || null,
      telefone:       telefone?.trim() || null,
      empresa:        empresa?.trim()  || null,
      cargo:          cargo?.trim()    || null,
      origem:         origem           || 'manual',
      status_funil:   status_funil     || 'lead',
      valor_estimado: valor_estimado   || null,
      observacoes:    observacoes?.trim() || null,
      tags:           tags             || [],
    };
    if (req.tenantId) registro.tenant_id = req.tenantId;

    const { data, error } = await supabase.from('crm_contatos').insert(registro).select().single();
    if (error) { logger.error('Erro ao criar contato CRM', { error }); return next(error); }

    return res.status(201).json({ sucesso: true, mensagem: 'Contato criado.', dados: data });
  } catch (err) { next(err); }
};

// =============================================================
// CONTATOS — BUSCAR POR ID (com interações)
// GET /api/crm/contatos/:id
// =============================================================
const buscarContato = async (req, res, next) => {
  try {
    const { id } = req.params;

    let q = supabase.from('crm_contatos').select('*').eq('id', id);
    q = filtroBase(q, req);
    const { data: contato, error } = await q.single();

    if (error || !contato) {
      return res.status(404).json({ sucesso: false, mensagem: 'Contato não encontrado.' });
    }

    // Busca interações do contato
    const { data: interacoes } = await supabase
      .from('crm_interacoes')
      .select('*')
      .eq('contato_id', id)
      .order('criado_em', { ascending: false });

    return res.status(200).json({ sucesso: true, dados: { ...contato, interacoes: interacoes || [] } });
  } catch (err) { next(err); }
};

// =============================================================
// CONTATOS — ATUALIZAR
// PUT /api/crm/contatos/:id
// =============================================================
const atualizarContato = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verifica posse
    let q = supabase.from('crm_contatos').select('id').eq('id', id);
    q = filtroBase(q, req);
    const { data: existente, error: errBusca } = await q.single();
    if (errBusca || !existente) {
      return res.status(404).json({ sucesso: false, mensagem: 'Contato não encontrado.' });
    }

    const campos = ['nome','email','telefone','empresa','cargo','origem','status_funil','valor_estimado','observacoes','tags'];
    const atualizacao = {};
    campos.forEach(c => { if (req.body[c] !== undefined) atualizacao[c] = req.body[c]; });
    atualizacao.atualizado_em = new Date().toISOString();

    const { data, error } = await supabase.from('crm_contatos').update(atualizacao).eq('id', id).select().single();
    if (error) { logger.error('Erro ao atualizar contato CRM', { error }); return next(error); }

    return res.status(200).json({ sucesso: true, mensagem: 'Contato atualizado.', dados: data });
  } catch (err) { next(err); }
};

// =============================================================
// CONTATOS — EXCLUIR
// DELETE /api/crm/contatos/:id
// =============================================================
const excluirContato = async (req, res, next) => {
  try {
    const { id } = req.params;

    let q = supabase.from('crm_contatos').select('id').eq('id', id);
    q = filtroBase(q, req);
    const { data: existente, error: errBusca } = await q.single();
    if (errBusca || !existente) {
      return res.status(404).json({ sucesso: false, mensagem: 'Contato não encontrado.' });
    }

    const { error } = await supabase.from('crm_contatos').delete().eq('id', id);
    if (error) { logger.error('Erro ao excluir contato CRM', { error }); return next(error); }

    return res.status(200).json({ sucesso: true, mensagem: 'Contato excluído.' });
  } catch (err) { next(err); }
};

// =============================================================
// INTERAÇÕES — LISTAR POR CONTATO
// GET /api/crm/contatos/:id/interacoes
// =============================================================
const listarInteracoes = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('crm_interacoes')
      .select('*')
      .eq('contato_id', id)
      .order('criado_em', { ascending: false });

    if (error) { logger.error('Erro ao listar interações', { error }); return next(error); }

    return res.status(200).json({ sucesso: true, dados: data || [] });
  } catch (err) { next(err); }
};

// =============================================================
// INTERAÇÕES — CRIAR
// POST /api/crm/contatos/:id/interacoes
// =============================================================
const criarInteracao = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { tipo, conteudo } = req.body;

    if (!conteudo?.trim()) {
      return res.status(400).json({ sucesso: false, mensagem: 'Conteúdo é obrigatório.' });
    }

    const registro = {
      contato_id: id,
      criado_por: req.userId,
      tipo:       tipo    || 'nota',
      conteudo:   conteudo.trim(),
    };
    if (req.tenantId) registro.tenant_id = req.tenantId;

    const { data, error } = await supabase.from('crm_interacoes').insert(registro).select().single();
    if (error) { logger.error('Erro ao criar interação', { error }); return next(error); }

    // Atualiza atualizado_em do contato
    await supabase.from('crm_contatos').update({ atualizado_em: new Date().toISOString() }).eq('id', id);

    return res.status(201).json({ sucesso: true, mensagem: 'Interação registrada.', dados: data });
  } catch (err) { next(err); }
};

// =============================================================
// KANBAN — RESUMO POR STATUS
// GET /api/crm/kanban
// =============================================================
const kanban = async (req, res, next) => {
  try {
    let query = supabase.from('crm_contatos').select('id, nome, empresa, email, status_funil, valor_estimado, atualizado_em');
    query = filtroBase(query, req);
    const { data, error } = await query;
    if (error) { logger.error('Erro ao buscar kanban CRM', { error }); return next(error); }

    const COLUNAS = ['lead','qualificado','proposta','negociacao','fechado','perdido'];
    const kanbanData = {};
    COLUNAS.forEach(col => {
      kanbanData[col] = (data || []).filter(c => c.status_funil === col);
    });

    return res.status(200).json({ sucesso: true, dados: kanbanData });
  } catch (err) { next(err); }
};

module.exports = {
  listarContatos, criarContato, buscarContato, atualizarContato, excluirContato,
  listarInteracoes, criarInteracao, kanban,
};
