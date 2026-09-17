// =============================================================
// PRANCHETO.IA - HOOK DE RÓTULOS DO OUTBOUND
// Fonte de verdade: banco (user_preferencias.metadata.outbound_status_rotulos)
//
// O valor técnico do status (status em outbound_acoes) é fixo e
// compartilhado entre todos os usuários. O rótulo exibido é
// personalizável por usuário e cai no padrão abaixo quando não
// customizado.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

export const STATUS_ORDEM = ['pendente', 'enviado', 'respondido', 'sem_retorno', 'convertido'];

export const ROTULOS_PADRAO = {
  pendente:    'Não Chamei',
  enviado:     'Contato 1',
  respondido:  'Falar de Novo',
  sem_retorno: 'Vixe! Já Era.',
  convertido:  'Deu Certo!',
};

export const useRotulosOutbound = (userId) => {
  const [rotulos, setRotulos] = useState(ROTULOS_PADRAO);
  const [metadataOutros, setMetadataOutros] = useState({});
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!userId) { setCarregando(false); return; }
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('user_preferencias')
        .select('metadata')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const metadata = data?.metadata || {};
      const { outbound_status_rotulos, ...outros } = metadata;
      setMetadataOutros(outros);
      setRotulos({ ...ROTULOS_PADRAO, ...(outbound_status_rotulos || {}) });
    } catch (err) {
      console.warn('[useRotulosOutbound] Erro ao carregar rótulos:', err.message);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => { carregar(); }, [carregar]);

  // Salva os rótulos customizados sem tocar em outras chaves de metadata
  // nem nas demais colunas de user_preferencias.
  const salvar = useCallback(async (novosRotulos) => {
    if (!userId) return;
    const limpos = STATUS_ORDEM.reduce((acc, status) => {
      const valor = (novosRotulos[status] || '').trim();
      acc[status] = valor || ROTULOS_PADRAO[status];
      return acc;
    }, {});

    const { error } = await supabase
      .from('user_preferencias')
      .upsert({
        user_id: userId,
        metadata: { ...metadataOutros, outbound_status_rotulos: limpos },
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    setRotulos(limpos);
  }, [userId, metadataOutros]);

  return { rotulos, carregando, salvar, recarregar: carregar };
};
