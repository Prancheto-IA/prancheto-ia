// =============================================================
// PRANCHETO.IA - STORE DA ORGANIZAÇÃO (Zustand)
//
// Guarda a linha de 'tenants' do usuário logado: nome, logo, plano e
// identidade visual. É carregada uma vez pelo LayoutCliente e reaproveitada
// por quem precisa desses dados (Identidade Visual, aba Plano das
// Configurações), em vez de cada tela repetir a mesma consulta.
//
// Guardar o tenant aqui também é o que faz a identidade visual valer para
// a interface inteira: toda gravação passa por definir(), que reflete as
// cores no DOM na mesma ação.
//
// Não é persistido no localStorage de propósito — é dado do servidor, e
// cache de marca entre sessões diferentes no mesmo navegador confundiria
// mais do que ajudaria.
// =============================================================

import { create } from 'zustand';
import { supabase } from '../lib/supabase.js';
import { aplicarIdentidadeNoDOM, normalizarIdentidade } from '../utils/identidadeVisual.js';

/** Colunas do tenant que a área do cliente consome. */
export const COLUNAS_TENANT = 'id, nome, logo_url, identidade_visual, plano';

export const useTenantStore = create((set, get) => ({
  /** Linha de 'tenants' do usuário logado, ou null antes de carregar */
  tenant: null,

  carregando: false,
  erro:       null,

  /**
   * Carrega o tenant e aplica a identidade visual.
   * Repetir a chamada com o mesmo id não refaz a consulta.
   *
   * @param {string} tenantId
   * @param {{ forcar?: boolean }} [opcoes] - forcar recarrega mesmo em cache
   */
  carregar: async (tenantId, { forcar = false } = {}) => {
    if (!tenantId) return null;

    const { tenant, carregando } = get();
    if (carregando) return tenant;
    if (tenant?.id === tenantId && !forcar) return tenant;

    set({ carregando: true, erro: null });
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(COLUNAS_TENANT)
        .eq('id', tenantId)
        .single();
      if (error) throw error;

      get().definir(data);
      return data;
    } catch (err) {
      set({ erro: err.message });
      return null;
    } finally {
      set({ carregando: false });
    }
  },

  /** Guarda o tenant e reflete a identidade visual no DOM na mesma ação. */
  definir: (tenant) => {
    set({ tenant });
    aplicarIdentidadeNoDOM(normalizarIdentidade(tenant?.identidade_visual));
  },

  /** Identidade visual completa, com os padrões preenchidos. */
  identidade: () => normalizarIdentidade(get().tenant?.identidade_visual),

  /** Descarta o tenant e devolve a interface à marca do produto (logout). */
  limpar: () => {
    set({ tenant: null, erro: null });
    aplicarIdentidadeNoDOM(null);
  },
}));
