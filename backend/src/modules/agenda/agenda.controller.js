'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// Colunas reais da tabela agenda_eventos:
// id, tenant_id, criado_por, titulo, descricao, tipo, status,
// data_inicio, data_fim, dia_inteiro, local, link_reuniao,
// participantes, cor, recorrencia, metadata, criado_em, atualizado_em

// =============================================================
// LISTAR EVENTOS DA AGENDA
// GET /api/agenda
// =============================================================
const listarEventos = async (req, res, next) => {
  try {
    const userId   = req.userId;
    const tenantId = req.tenantId;

    let query = supabase
      .from('agenda_eventos')
      .select('*')
      .eq('criado_por', userId)
      .order('data_inicio', { ascending: true });

    // Se tiver tenantId, filtra também por tenant
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Erro ao listar eventos da agenda', { error, userId, tenantId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      dados: data || [],
      total: (data || []).length,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// CRIAR EVENTO
// POST /api/agenda
// =============================================================
const criarEvento = async (req, res, next) => {
  try {
    const userId   = req.userId;
    const tenantId = req.tenantId;

    const {
      titulo,
      descricao,
      data_inicio,
      data_fim,
      tipo,
      local,
      link_reuniao,
      participantes,
      cor,
      dia_inteiro,
    } = req.body;

    if (!titulo || !data_inicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios: titulo, data_inicio',
      });
    }

    const registro = {
      criado_por:   userId,
      titulo,
      descricao:    descricao    || null,
      data_inicio,
      data_fim:     data_fim     || null,
      tipo:         tipo         || 'reuniao',
      local:        local        || null,
      link_reuniao: link_reuniao || null,
      participantes: participantes || [],
      cor:          cor          || '#6366f1',
      status:       'agendado',
      dia_inteiro:  dia_inteiro  || false,
    };

    // Só inclui tenant_id se não for null (Super Admin não tem tenant)
    if (tenantId) registro.tenant_id = tenantId;

    const { data, error } = await supabase
      .from('agenda_eventos')
      .insert(registro)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar evento na agenda', { error, userId, tenantId });
      return next(error);
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Evento criado com sucesso.',
      dados: data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// ATUALIZAR EVENTO
// PUT /api/agenda/:id
// =============================================================
const atualizarEvento = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    // Verifica se o evento pertence ao usuário
    const { data: existente, error: errBusca } = await supabase
      .from('agenda_eventos')
      .select('id')
      .eq('id', id)
      .eq('criado_por', userId)
      .single();

    if (errBusca || !existente) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Evento não encontrado.',
      });
    }

    const {
      titulo, descricao, data_inicio, data_fim,
      tipo, local, link_reuniao, participantes, cor, status, dia_inteiro,
    } = req.body;

    const atualizacao = {};
    if (titulo        !== undefined) atualizacao.titulo        = titulo;
    if (descricao     !== undefined) atualizacao.descricao     = descricao;
    if (data_inicio   !== undefined) atualizacao.data_inicio   = data_inicio;
    if (data_fim      !== undefined) atualizacao.data_fim      = data_fim;
    if (tipo          !== undefined) atualizacao.tipo          = tipo;
    if (local         !== undefined) atualizacao.local         = local;
    if (link_reuniao  !== undefined) atualizacao.link_reuniao  = link_reuniao;
    if (participantes !== undefined) atualizacao.participantes = participantes;
    if (cor           !== undefined) atualizacao.cor           = cor;
    if (status        !== undefined) atualizacao.status        = status;
    if (dia_inteiro   !== undefined) atualizacao.dia_inteiro   = dia_inteiro;

    const { data, error } = await supabase
      .from('agenda_eventos')
      .update(atualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar evento da agenda', { error, id, userId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Evento atualizado com sucesso.',
      dados: data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// EXCLUIR EVENTO
// DELETE /api/agenda/:id
// =============================================================
const excluirEvento = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { data: existente, error: errBusca } = await supabase
      .from('agenda_eventos')
      .select('id')
      .eq('id', id)
      .eq('criado_por', userId)
      .single();

    if (errBusca || !existente) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Evento não encontrado.',
      });
    }

    const { error } = await supabase
      .from('agenda_eventos')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erro ao excluir evento da agenda', { error, id, userId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Evento excluído com sucesso.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listarEventos,
  criarEvento,
  atualizarEvento,
  excluirEvento,
};
