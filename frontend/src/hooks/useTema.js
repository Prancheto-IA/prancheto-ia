// =============================================================
// PRANCHETO.IA - HOOK DE TEMA
// Persiste a preferência de tema (escuro/claro) no localStorage.
// Aplica a classe 'dark' no <html> para suporte a Tailwind dark mode.
// =============================================================

import { useState, useEffect } from 'react';

const CHAVE_STORAGE = 'prancheto-tema';

export const useTema = () => {
  const [temaEscuro, setTemaEscuro] = useState(() => {
    // Lê do localStorage na inicialização
    try {
      const salvo = localStorage.getItem(CHAVE_STORAGE);
      if (salvo !== null) return salvo === 'escuro';
    } catch {}
    // Fallback: preferência do sistema operacional
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  });

  useEffect(() => {
    // Persiste no localStorage sempre que mudar
    try {
      localStorage.setItem(CHAVE_STORAGE, temaEscuro ? 'escuro' : 'claro');
    } catch {}

    // Aplica/remove classe 'dark' no <html> (Tailwind dark mode)
    if (temaEscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [temaEscuro]);

  const alternarTema = () => setTemaEscuro(t => !t);

  return { temaEscuro, alternarTema, setTemaEscuro };
};
