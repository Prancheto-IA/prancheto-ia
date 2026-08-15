// =============================================================
// PRANCHETO.IA - HOOK: useSidebarPrefs
// Gerencia preferências individuais da barra lateral por usuário.
// Persiste em sidebar_preferencias no Supabase (RLS por user_id).
//
// Cada item tem: { slug, visivel, ordem }
// Itens não removíveis (SLUGS_FIXOS) só podem ser reordenados.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Itens que nunca podem ser ocultados (apenas reordenados)
export const SLUGS_FIXOS = ['configuracoes'];

// Catálogo completo de itens da sidebar com defaults
// Ordem padrão e visibilidade inicial
export const CATALOGO_SIDEBAR = [
  { slug: 'dashboard',    label: 'Início',        emoji: '🏠', rota: '/dashboard',                   exact: true,  prefixoAtivo: null,                    removivel: true  },
  { slug: 'modulos',      label: 'Módulos',        emoji: '🧩', rota: '/modulos',                     exact: true,  prefixoAtivo: '/modulos',              removivel: true,  apenasAdmin: true },
  { slug: 'crm',          label: 'CRM',            emoji: '📋', rota: '/crm',                         exact: false, prefixoAtivo: '/crm',                  removivel: true  },
  { slug: 'chat_ia',      label: 'Chat com IA',    emoji: '🤖', rota: '/dashboard/chat',              exact: false, prefixoAtivo: null,                    removivel: true  },
  { slug: 'agenda',       label: 'Agenda',         emoji: '🗓️', rota: '/dashboard/agenda',            exact: false, prefixoAtivo: null,                    removivel: true  },
  { slug: 'relatorios',   label: 'Relatórios',     emoji: '📊', rota: '/dashboard/relatorios',        exact: false, prefixoAtivo: null,                    removivel: true  },
  { slug: 'outbound',     label: 'Outbound',       emoji: '📧', rota: '/dashboard/outbound',          exact: false, prefixoAtivo: null,                    removivel: true  },
  { slug: 'organizacao',  label: 'Organização',    emoji: '🏢', rota: '/dashboard/organizacao/times', exact: false, prefixoAtivo: '/dashboard/organizacao', removivel: true  },
  { slug: 'suporte',      label: 'Suporte',        emoji: '🎧', rota: '/suporte',                     exact: false, prefixoAtivo: '/suporte',              removivel: true  },
  { slug: 'configuracoes',label: 'Configurações',  emoji: '⚙️', rota: '/dashboard/configuracoes',    exact: false, prefixoAtivo: null,                    removivel: false },
];

// 'planos' saiu do catálogo: o plano da empresa passou a viver dentro de
// Configurações, na aba Plano. Preferências já salvas com o item continuam
// válidas — itensVisiveis descarta slugs que não estão mais no catálogo.

// Gera a lista padrão de itens (todos visíveis, ordem do catálogo)
const gerarItensDefault = () =>
  CATALOGO_SIDEBAR.map((item, idx) => ({
    slug: item.slug,
    visivel: true,
    ordem: idx,
  }));

// Mescla preferências salvas com o catálogo atual
// (garante que novos itens adicionados ao catálogo apareçam)
const mesclarComCatalogo = (itensSalvos) => {
  const slugsSalvos = itensSalvos.map(i => i.slug);
  const novosItens = CATALOGO_SIDEBAR
    .filter(c => !slugsSalvos.includes(c.slug))
    .map((c, idx) => ({
      slug: c.slug,
      visivel: true,
      ordem: itensSalvos.length + idx,
    }));
  return [...itensSalvos, ...novosItens];
};

export const useSidebarPrefs = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [itens, setItens] = useState(gerarItensDefault());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const userId   = usuario?.id;
  const tenantId = usuario?.tenant_id;
  const cargo    = usuario?.cargo;

  // Carrega preferências do banco
  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('sidebar_preferencias')
        .select('itens')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.itens && Array.isArray(data.itens) && data.itens.length > 0) {
        // Mescla com catálogo para incluir itens novos
        const mesclado = mesclarComCatalogo(data.itens);
        setItens(mesclado);
      } else {
        // Primeira vez: usa defaults
        setItens(gerarItensDefault());
      }
    } catch (err) {
      console.error('useSidebarPrefs.carregar:', err);
      setItens(gerarItensDefault());
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Persiste no banco
  const persistir = useCallback(async (novosItens) => {
    if (!userId || !tenantId) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('sidebar_preferencias')
        .upsert(
          { user_id: userId, tenant_id: tenantId, itens: novosItens },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } catch (err) {
      console.error('useSidebarPrefs.persistir:', err);
    } finally {
      setSalvando(false);
    }
  }, [userId, tenantId]);

  // Reordena itens (recebe array de slugs na nova ordem)
  const reordenar = useCallback(async (slugsOrdenados) => {
    const novosItens = slugsOrdenados.map((slug, idx) => {
      const existente = itens.find(i => i.slug === slug);
      return { slug, visivel: existente?.visivel ?? true, ordem: idx };
    });
    // Inclui itens que não estão na lista (ex: ocultos)
    const slugsNaLista = new Set(slugsOrdenados);
    const ocultos = itens
      .filter(i => !slugsNaLista.has(i.slug))
      .map((i, idx) => ({ ...i, ordem: slugsOrdenados.length + idx }));
    const final = [...novosItens, ...ocultos];
    setItens(final);
    await persistir(final);
  }, [itens, persistir]);

  // Alterna visibilidade de um item
  const toggleVisivel = useCallback(async (slug) => {
    // Itens não removíveis não podem ser ocultados
    const catalogo = CATALOGO_SIDEBAR.find(c => c.slug === slug);
    if (catalogo && !catalogo.removivel) return;

    const novosItens = itens.map(i =>
      i.slug === slug ? { ...i, visivel: !i.visivel } : i
    );
    setItens(novosItens);
    await persistir(novosItens);
  }, [itens, persistir]);

  // Reseta para defaults
  const resetar = useCallback(async () => {
    const defaults = gerarItensDefault();
    setItens(defaults);
    await persistir(defaults);
  }, [persistir]);

  // Retorna itens visíveis ordenados, filtrados por cargo
  const itensVisiveis = itens
    .filter(i => {
      if (!i.visivel) return false;
      const cat = CATALOGO_SIDEBAR.find(c => c.slug === i.slug);
      if (!cat) return false;
      // Itens apenasAdmin só aparecem para admin/manager
      if (cat.apenasAdmin && !['admin', 'manager'].includes(cargo)) return false;
      return true;
    })
    .sort((a, b) => a.ordem - b.ordem)
    .map(i => CATALOGO_SIDEBAR.find(c => c.slug === i.slug))
    .filter(Boolean);

  // Itens ocultos (para o modal de personalização)
  const itensOcultos = itens
    .filter(i => {
      if (i.visivel) return false;
      const cat = CATALOGO_SIDEBAR.find(c => c.slug === i.slug);
      if (!cat) return false;
      if (cat.apenasAdmin && !['admin', 'manager'].includes(cargo)) return false;
      return true;
    })
    .map(i => CATALOGO_SIDEBAR.find(c => c.slug === i.slug))
    .filter(Boolean);

  // Todos os itens visíveis para o modal (incluindo os que podem ser reordenados)
  const itensParaModal = itens
    .filter(i => {
      const cat = CATALOGO_SIDEBAR.find(c => c.slug === i.slug);
      if (!cat) return false;
      if (cat.apenasAdmin && !['admin', 'manager'].includes(cargo)) return false;
      return true;
    })
    .sort((a, b) => a.ordem - b.ordem)
    .map(i => {
      const cat = CATALOGO_SIDEBAR.find(c => c.slug === i.slug);
      return cat ? { ...cat, visivel: i.visivel } : null;
    })
    .filter(Boolean);

  return {
    itens,
    itensVisiveis,
    itensOcultos,
    itensParaModal,
    carregando,
    salvando,
    reordenar,
    toggleVisivel,
    resetar,
  };
};
