// =============================================================
// PRANCHETO.IA - COMPONENTE DE NOTIFICAÇÕES (Toast)
// Exibe notificações temporárias na tela (sucesso, erro, aviso, info).
// Conectado ao uiStore para exibir notificações de qualquer parte do app.
//
// Uso em qualquer componente:
//   const { adicionarNotificacao } = useUIStore();
//   adicionarNotificacao('success', 'Usuário criado com sucesso!');
//   adicionarNotificacao('error', 'Erro ao salvar. Tente novamente.');
// =============================================================

import React from 'react';
import { useUIStore } from '../../store/uiStore.js';

// Mapeamento de tipos para estilos e ícones
const ESTILOS_TOAST = {
  success: {
    container: 'bg-green-900/90 border-green-700/50',
    icone:     '✅',
    texto:     'text-green-300',
  },
  error: {
    container: 'bg-red-900/90 border-red-700/50',
    icone:     '❌',
    texto:     'text-red-300',
  },
  warning: {
    container: 'bg-yellow-900/90 border-yellow-700/50',
    icone:     '⚠️',
    texto:     'text-yellow-300',
  },
  info: {
    container: 'bg-blue-900/90 border-blue-700/50',
    icone:     'ℹ️',
    texto:     'text-blue-300',
  },
};

/**
 * Componente individual de Toast.
 */
const ToastItem = ({ id, tipo, mensagem }) => {
  const { removerNotificacao } = useUIStore();
  const estilo = ESTILOS_TOAST[tipo] || ESTILOS_TOAST.info;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm
        shadow-lg max-w-sm w-full animate-slide-in
        ${estilo.container}
      `}
    >
      <span className="text-lg flex-shrink-0">{estilo.icone}</span>
      <p className={`text-sm flex-1 ${estilo.texto}`}>{mensagem}</p>
      <button
        onClick={() => removerNotificacao(id)}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2"
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  );
};

/**
 * Container de Toasts — deve ser renderizado uma vez no App.jsx ou layout principal.
 * Posicionado no canto inferior direito da tela.
 */
const ToastContainer = () => {
  const { notificacoes } = useUIStore();

  if (notificacoes.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3"
      aria-live="polite"
      aria-label="Notificações"
    >
      {notificacoes.map((notificacao) => (
        <ToastItem
          key={notificacao.id}
          id={notificacao.id}
          tipo={notificacao.tipo}
          mensagem={notificacao.mensagem}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
