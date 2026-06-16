// =============================================================
// PRANCHETO.IA - STORE DE INTERFACE (Zustand)
// Gerencia o estado global da UI:
//   - Navegação atual (seção, módulo, aba ativa)
//   - Estado do sidebar (aberto/fechado)
//   - Notificações e toasts
//   - Estado de carregamento global
// =============================================================

import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  // ==========================================================
  // ESTADO DE NAVEGAÇÃO (hierarquia de 4 níveis)
  // ==========================================================

  /** ID da seção atualmente selecionada (Nível 1) */
  secaoAtiva: null,

  /** ID do módulo atualmente selecionado (Nível 2) */
  moduloAtivo: null,

  /** ID da aba atualmente selecionada (Nível 3) */
  abaAtiva: null,

  // ==========================================================
  // ESTADO DO SIDEBAR
  // ==========================================================

  /** Controla se o sidebar está expandido ou recolhido */
  sidebarAberto: true,

  // ==========================================================
  // NOTIFICAÇÕES (Toast)
  // ==========================================================

  /** Lista de notificações ativas na tela */
  notificacoes: [],

  // ==========================================================
  // CARREGAMENTO GLOBAL
  // ==========================================================

  /** Indica se há uma operação global em andamento */
  carregandoGlobal: false,

  // ==========================================================
  // AÇÕES DE NAVEGAÇÃO
  // ==========================================================

  /**
   * Define a seção ativa e limpa módulo/aba (navegação em cascata).
   * @param {string|null} secaoId
   */
  setSecaoAtiva: (secaoId) => set({
    secaoAtiva:  secaoId,
    moduloAtivo: null,
    abaAtiva:    null,
  }),

  /**
   * Define o módulo ativo e limpa a aba.
   * @param {string|null} moduloId
   */
  setModuloAtivo: (moduloId) => set({
    moduloAtivo: moduloId,
    abaAtiva:    null,
  }),

  /**
   * Define a aba ativa.
   * @param {string|null} abaId
   */
  setAbaAtiva: (abaId) => set({ abaAtiva: abaId }),

  /** Alterna o estado do sidebar */
  toggleSidebar: () => set((state) => ({ sidebarAberto: !state.sidebarAberto })),

  // ==========================================================
  // AÇÕES DE NOTIFICAÇÃO
  // ==========================================================

  /**
   * Adiciona uma notificação toast na tela.
   * @param {'success'|'error'|'warning'|'info'} tipo
   * @param {string} mensagem
   * @param {number} duracaoMs - Duração em ms (padrão: 4000)
   */
  adicionarNotificacao: (tipo, mensagem, duracaoMs = 4000) => {
    const id = Date.now().toString();
    set((state) => ({
      notificacoes: [...state.notificacoes, { id, tipo, mensagem }],
    }));

    // Remove automaticamente após a duração
    setTimeout(() => {
      get().removerNotificacao(id);
    }, duracaoMs);

    return id;
  },

  /**
   * Remove uma notificação pelo ID.
   * @param {string} id
   */
  removerNotificacao: (id) => set((state) => ({
    notificacoes: state.notificacoes.filter((n) => n.id !== id),
  })),

  /** Define o estado de carregamento global */
  setCarregandoGlobal: (valor) => set({ carregandoGlobal: valor }),
}));
