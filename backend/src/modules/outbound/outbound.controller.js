'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// Colunas reais da tabela outbound_acoes:
// id, tenant_id, user_id, contato_nome, contato_email, contato_telefone,
// tipo, status, assunto, conteudo, enviado_em, proxima_acao_em, notas,
// metadata, criado_em, atualizado_em

// =============================================================
// LISTAR AÇÕES DE OUTBOUND
// GET /api/outbound
// =============================================================
const listarAcoes = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId   = req.userId;

    const { status, tipo, pagina = 1, limite = 20 } = req.query;
    const offset = (Number(pagina) - 1) * Number(limite);

    let query = supabase
      .from('outbound_acoes')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + Number(limite) - 1);

    // Filtra por tenant se disponível, senão por user_id
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    } else {
      query = query.eq('user_id', userId);
    }

    if (status) query = query.eq('status', status);
    if (tipo)   query = query.eq('tipo', tipo);

    const { data, error, count } = await query;

    if (error) {
      logger.error('Erro ao listar ações de outbound', { error, tenantId, userId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      dados: data || [],
      total: count || 0,
      pagina: Number(pagina),
      limite: Number(limite),
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// CRIAR AÇÃO DE OUTBOUND
// POST /api/outbound
// =============================================================
const criarAcao = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId   = req.userId;

    const {
      contato_nome,
      contato_email,
      contato_telefone,
      tipo,
      assunto,
      conteudo,
      proxima_acao_em,
      notas,
    } = req.body;

    if (!contato_nome || !tipo) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios: contato_nome, tipo',
      });
    }

    const registro = {
      user_id:          userId,
      contato_nome,
      contato_email:    contato_email    || null,
      contato_telefone: contato_telefone || null,
      tipo,
      assunto:          assunto          || null,
      conteudo:         conteudo         || null,
      status:           'pendente',
      proxima_acao_em:  proxima_acao_em  || null,
      notas:            notas            || null,
    };

    // Só inclui tenant_id se não for null
    if (tenantId) registro.tenant_id = tenantId;

    const { data, error } = await supabase
      .from('outbound_acoes')
      .insert(registro)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao criar ação de outbound', { error, tenantId, userId });
      return next(error);
    }

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Ação de outbound criada com sucesso.',
      dados: data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// ATUALIZAR AÇÃO DE OUTBOUND
// PUT /api/outbound/:id
// =============================================================
const atualizarAcao = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId   = req.userId;
    const { id }   = req.params;

    // Verifica se a ação pertence ao usuário/tenant
    let buscaQuery = supabase
      .from('outbound_acoes')
      .select('id')
      .eq('id', id);

    if (tenantId) {
      buscaQuery = buscaQuery.eq('tenant_id', tenantId);
    } else {
      buscaQuery = buscaQuery.eq('user_id', userId);
    }

    const { data: existente, error: errBusca } = await buscaQuery.single();

    if (errBusca || !existente) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Ação não encontrada.',
      });
    }

    const {
      contato_nome, contato_email, contato_telefone,
      tipo, assunto, conteudo, status,
      proxima_acao_em, enviado_em, notas,
    } = req.body;

    const atualizacao = {};
    if (contato_nome     !== undefined) atualizacao.contato_nome     = contato_nome;
    if (contato_email    !== undefined) atualizacao.contato_email    = contato_email;
    if (contato_telefone !== undefined) atualizacao.contato_telefone = contato_telefone;
    if (tipo             !== undefined) atualizacao.tipo             = tipo;
    if (assunto          !== undefined) atualizacao.assunto          = assunto;
    if (conteudo         !== undefined) atualizacao.conteudo         = conteudo;
    if (status           !== undefined) atualizacao.status           = status;
    if (proxima_acao_em  !== undefined) atualizacao.proxima_acao_em  = proxima_acao_em;
    if (enviado_em       !== undefined) atualizacao.enviado_em       = enviado_em;
    if (notas            !== undefined) atualizacao.notas            = notas;

    const { data, error } = await supabase
      .from('outbound_acoes')
      .update(atualizacao)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Erro ao atualizar ação de outbound', { error, id, tenantId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Ação atualizada com sucesso.',
      dados: data,
    });
  } catch (err) {
    next(err);
  }
};

// =============================================================
// EXCLUIR AÇÃO DE OUTBOUND
// DELETE /api/outbound/:id
// =============================================================
const excluirAcao = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId   = req.userId;
    const { id }   = req.params;

    let buscaQuery = supabase
      .from('outbound_acoes')
      .select('id')
      .eq('id', id);

    if (tenantId) {
      buscaQuery = buscaQuery.eq('tenant_id', tenantId);
    } else {
      buscaQuery = buscaQuery.eq('user_id', userId);
    }

    const { data: existente, error: errBusca } = await buscaQuery.single();

    if (errBusca || !existente) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Ação não encontrada.',
      });
    }

    const { error } = await supabase
      .from('outbound_acoes')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Erro ao excluir ação de outbound', { error, id, tenantId });
      return next(error);
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Ação excluída com sucesso.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listarAcoes,
  criarAcao,
  atualizarAcao,
  excluirAcao,
};
