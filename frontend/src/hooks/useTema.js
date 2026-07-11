// =============================================================
// PRANCHETO.IA - HOOK DE TEMA
// Fonte de verdade: banco (user_preferencias.tema)
// Cache local: localStorage (evita flash de tema errado no carregamento)
//
// ORDEM DE PRIORIDADE:
//   1. Banco (user_preferencias.tema) — prevalece sempre para usuários autenticados
//   2. localStorage — usado como cache instantâneo antes do banco responder
//   3. Preferência do sistema operacional — fallback quando não há nada salvo
//
// FLUXO:
//   - No carregamento: aplica localStorage imediatamente (sem flash)
//   - Após login: busca do banco e sincroniza localStorage
//   - Ao salvar em Configuracoes.jsx: salva no banco E atualiza localStorage
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const CHAVE_STORAGE = 'prancheto-tema';

// Aplica ou remove a classe 'dark' no <html> imediatamente (sem re-render)
const aplicarTemaNoDOM = (escuro) => {
  if (escuro) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Lê o tema do localStorage (cache local)
const lerTemaCache = () => {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    if (salvo !== null) return salvo === 'escuro';
  } catch {}
  // Fallback: preferência do sistema operacional
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
};

// Salva o tema no localStorage (cache local)
const salvarTemaCache = (escuro) => {
  try {
    localStorage.setItem(CHAVE_STORAGE, escuro ? 'escuro' : 'claro');
  } catch {}
};

export const useTema = () => {
  // Inicializa com o cache local para evitar flash de tema errado
  const [temaEscuro, setTemaEscuroState] = useState(() => {
    const cache = lerTemaCache();
    // Aplica imediatamente no DOM (antes do primeiro render)
    aplicarTemaNoDOM(cache);
    return cache;
  });

  // Aplica o tema no DOM sempre que mudar
  useEffect(() => {
    aplicarTemaNoDOM(temaEscuro);
    salvarTemaCache(temaEscuro);
  }, [temaEscuro]);

  /**
   * Define o tema e sincroniza localStorage.
   * Chamado pelo Configuracoes.jsx após salvar no banco.
   * @param {boolean} escuro
   */
  const setTemaEscuro = useCallback((escuro) => {
    setTemaEscuroState(escuro);
    salvarTemaCache(escuro);
    aplicarTemaNoDOM(escuro);
  }, []);

  /**
   * Sincroniza o tema a partir do banco (fonte de verdade).
   * Deve ser chamado após o login ou ao carregar as preferências do banco.
   * Se o banco retornar um valor diferente do cache, o banco prevalece.
   * @param {string|null} temaDB - 'escuro', 'claro' ou null
   */
  const sincronizarComBanco = useCallback((temaDB) => {
    if (temaDB === null || temaDB === undefined) return; // banco sem preferência: mantém cache
    const escuro = temaDB === 'escuro';
    setTemaEscuroState(escuro);
    salvarTemaCache(escuro); // atualiza cache com o valor do banco
    aplicarTemaNoDOM(escuro);
  }, []);

  /**
   * Busca o tema do banco e sincroniza.
   * Chamado no carregamento do app para usuários autenticados.
   * @param {string} userId
   */
  const carregarTemaDoUsuario = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_preferencias')
        .select('tema')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = row not found (usuário sem preferência salva — mantém cache)
        console.warn('[useTema] Erro ao buscar tema do banco:', error.message);
        return;
      }

      if (data?.tema) {
        sincronizarComBanco(data.tema);
      }
    } catch (err) {
      console.warn('[useTema] Falha ao carregar tema do banco:', err.message);
    }
  }, [sincronizarComBanco]);

  const alternarTema = useCallback(() => {
    setTemaEscuro(!temaEscuro);
  }, [temaEscuro, setTemaEscuro]);

  return {
    temaEscuro,
    alternarTema,
    setTemaEscuro,
    sincronizarComBanco,
    carregarTemaDoUsuario,
  };
};
