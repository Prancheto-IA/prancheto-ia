// =============================================================
// PRANCHETO.IA - STORE DA BOLINHA FLUTUANTE DO CHAT IA
//
// Guarda a posição (x, y) e o estado de arraste/abertura da bolinha do
// Chat IA quando o usuário está no modo "flutuante" (padrão).
//
// De propósito, sem persist: a posição vive só em memória, sobrevive a
// navegações entre rotas (o store não depende do ciclo de vida de
// LayoutCliente, que remonta a cada troca de rota — ver App.jsx), mas
// reinicia sozinha a cada F5/novo login, exatamente como pedido: "reinicia
// no canto inferior direito a cada login". Mesmo raciocínio do
// tenantStore.js.
// =============================================================

import { create } from 'zustand';

export const useChatBubbleStore = create((set) => ({
  /** {x, y} em px, ou null quando ainda não foi posicionada nesta sessão */
  posicao: null,
  arrastando: false,
  /** painel do widget aberto/fechado */
  aberta: false,

  definirPosicao: (x, y) => set({ posicao: { x, y } }),
  setArrastando: (valor) => set({ arrastando: valor }),
  alternarAberta: () => set((s) => ({ aberta: !s.aberta })),
  fecharPainel: () => set({ aberta: false }),
}));
