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
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  Alert02Icon,
  InformationCircleIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';

// Mapeamento de tipos para estilos e ícones
const ESTILOS_TOAST = {
  success: {
    container: 'bg-green-950/90 border-green-700/50',
    icon: CheckmarkCircle02Icon,
    iconColor: 'text-emerald-400',
    texto:     'text-green-200',
  },
  error: {
    container: 'bg-red-950/90 border-red-700/50',
    icon: CancelCircleIcon,
    iconColor: 'text-red-400',
    texto:     'text-red-200',
  },
  warning: {
    container: 'bg-amber-950/90 border-amber-700/50',
    icon: Alert02Icon,
    iconColor: 'text-amber-400',
    texto:     'text-amber-200',
  },
  info: {
    container: 'bg-blue-950/90 border-blue-700/50',
    icon: InformationCircleIcon,
    iconColor: 'text-blue-400',
    texto:     'text-blue-200',
  },
};

/**
 * Componente individual de Toast.
 */
const ToastItem = ({ id, tipo, mensagem }) => {
  const { removerNotificacao } = useUIStore();
  const estilo = ESTILOS_TOAST[tipo] || ESTILOS_TOAST.info;
  const IconComp = estilo.icon;

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm
        shadow-lg max-w-sm w-full animate-slide-in
        ${estilo.container}
      `}
    >
      <span className={`flex-shrink-0 mt-0.5 ${estilo.iconColor}`}>
        <HugeiconsIcon icon={IconComp} size={18} strokeWidth={2} />
      </span>
      <p className={`text-sm flex-1 ${estilo.texto}`}>{mensagem}</p>
      <button
        onClick={() => removerNotificacao(id)}
        className="text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2 p-0.5"
        aria-label="Fechar notificação"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
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
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {notificacoes.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <ToastItem id={n.id} tipo={n.tipo} mensagem={n.mensagem} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
