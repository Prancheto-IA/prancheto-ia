// =============================================================
// PRANCHETO.IA - CONTROLLER DE PREFERÊNCIAS DO USUÁRIO
// GET  /api/preferencias       → Busca preferências do usuário logado
// PUT  /api/preferencias       → Atualiza preferências do usuário logado
// =============================================================

'use strict';

const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// =============================================================
// GET /api/preferencias
// =============================================================
const buscarPreferencias = async (req, res, next) => {
  try {
    const userId = req.userId;

    const { data, error } = await supabase
      .from('user_preferencias')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    // Se não existir, retorna defaults
    if (!data) {
      return res.status(200).json({
        sucesso: true,
        preferencias: {
          user_id:       userId,
          tema:          'escuro',
          notif_email:   true,
          notif_sistema: true,
          idioma:        'pt-BR',
        },
      });
    }

    return res.status(200).json({ sucesso: true, preferencias: data });
  } catch (err) {
    logger.error('Erro ao buscar preferências', { erro: err.message });
    next(err);
  }
};

// =============================================================
// PUT /api/preferencias
// =============================================================
const atualizarPreferencias = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { tema, notif_email, notif_sistema, idioma } = req.body;

    // Monta objeto de atualização apenas com campos enviados
    const atualizacao = { atualizado_em: new Date().toISOString() };
    if (tema          !== undefined) atualizacao.tema          = tema;
    if (notif_email   !== undefined) atualizacao.notif_email   = notif_email;
    if (notif_sistema !== undefined) atualizacao.notif_sistema = notif_sistema;
    if (idioma        !== undefined) atualizacao.idioma        = idioma;

    // Upsert: cria se não existir, atualiza se existir
    const { data, error } = await supabase
      .from('user_preferencias')
      .upsert(
        { user_id: userId, ...atualizacao },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ sucesso: true, preferencias: data });
  } catch (err) {
    logger.error('Erro ao atualizar preferências', { erro: err.message });
    next(err);
  }
};

module.exports = { buscarPreferencias, atualizarPreferencias };
