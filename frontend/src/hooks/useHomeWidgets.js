// =============================================================
// PRANCHETO.IA - HOOK: useHomeWidgets
// Gerencia preferências individuais dos widgets da tela de Início.
// Persiste em home_widgets_config no Supabase (RLS por user_id).
//
// Mesmo padrão de useSidebarPrefs.js: cada item tem { slug, visivel, ordem }.
// Diferença importante: aqui os widgets padrão já nascem visíveis (ver
// VISIVEIS_PADRAO) — ao contrário de modulos_config, que exige ativação
// manual e é por tenant/time, não por usuário.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Catálogo de widgets ativáveis. "tamanho" controla quantas colunas o
// widget ocupa na grade da Home (ver DashboardCliente.jsx).
export const CATALOGO_WIDGETS = [
  { slug: 'mini_agenda',     label: 'Mini Agenda',            emoji: '🗓️', descricao: 'Seus próximos compromissos da semana.',              tamanho: 'padrao' },
  { slug: 'mural_anuncios',  label: 'Mural de Anúncios',      emoji: '📣', descricao: 'Últimas publicações do Feed da empresa.',             tamanho: 'grande' },
  { slug: 'acessos_rapidos', label: 'Acessos Rápidos',        emoji: '⚡', descricao: 'Atalhos para CRM, Relatórios, Agenda e Configurações.', tamanho: 'padrao' },
  { slug: 'minhas_tarefas',  label: 'Minhas Tarefas de Hoje', emoji: '✅', descricao: 'Tarefas atribuídas a você com vencimento hoje.',       tamanho: 'padrao' },
  { slug: 'leads_quentes',   label: 'Leads Quentes',          emoji: '🔥', descricao: 'Leads com score alto, prontos pra abordar.',          tamanho: 'padrao' },
];

// Reservado no catálogo, mas não ativável — fonte de dados ainda em
// definição. Aparece só no painel de personalização como "Em breve".
export const CATALOGO_EM_BREVE = [
  { slug: 'noticias_negocios', label: 'Notícias de Negócios', emoji: '📰', descricao: 'Fonte de dados ainda em definição.' },
];

// Widgets que já vêm visíveis pra quem nunca personalizou a Home.
const VISIVEIS_PADRAO = ['mini_agenda', 'mural_anuncios'];

const gerarWidgetsDefault = () =>
  CATALOGO_WIDGETS.map((w, idx) => ({
    slug: w.slug,
    visivel: VISIVEIS_PADRAO.includes(w.slug),
    ordem: idx,
  }));

// Mescla preferências salvas com o catálogo atual (garante que widgets
// novos adicionados ao catálogo apareçam pra quem já tinha personalizado).
const mesclarComCatalogo = (itensSalvos) => {
  const slugsSalvos = itensSalvos.map((i) => i.slug);
  const novosItens = CATALOGO_WIDGETS
    .filter((c) => !slugsSalvos.includes(c.slug))
    .map((c, idx) => ({
      slug: c.slug,
      visivel: VISIVEIS_PADRAO.includes(c.slug),
      ordem: itensSalvos.length + idx,
    }));
  return [...itensSalvos, ...novosItens];
};

export const useHomeWidgets = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const [itens, setItens] = useState(gerarWidgetsDefault());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const userId = usuario?.id;
  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('home_widgets_config')
        .select('widgets')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data?.widgets && Array.isArray(data.widgets) && data.widgets.length > 0) {
        setItens(mesclarComCatalogo(data.widgets));
      } else {
        setItens(gerarWidgetsDefault());
      }
    } catch (err) {
      console.error('useHomeWidgets.carregar:', err);
      setItens(gerarWidgetsDefault());
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const persistir = useCallback(async (novosItens) => {
    if (!userId || !tenantId) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('home_widgets_config')
        .upsert(
          { user_id: userId, tenant_id: tenantId, widgets: novosItens },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    } catch (err) {
      console.error('useHomeWidgets.persistir:', err);
    } finally {
      setSalvando(false);
    }
  }, [userId, tenantId]);

  const reordenar = useCallback(async (slugsOrdenados) => {
    const novosItens = slugsOrdenados.map((slug, idx) => {
      const existente = itens.find((i) => i.slug === slug);
      return { slug, visivel: existente?.visivel ?? true, ordem: idx };
    });
    const slugsNaLista = new Set(slugsOrdenados);
    const foraDaLista = itens
      .filter((i) => !slugsNaLista.has(i.slug))
      .map((i, idx) => ({ ...i, ordem: slugsOrdenados.length + idx }));
    const final = [...novosItens, ...foraDaLista];
    setItens(final);
    await persistir(final);
  }, [itens, persistir]);

  const toggleVisivel = useCallback(async (slug) => {
    const novosItens = itens.map((i) =>
      i.slug === slug ? { ...i, visivel: !i.visivel } : i
    );
    setItens(novosItens);
    await persistir(novosItens);
  }, [itens, persistir]);

  const resetar = useCallback(async () => {
    const defaults = gerarWidgetsDefault();
    setItens(defaults);
    await persistir(defaults);
  }, [persistir]);

  const widgetsVisiveis = itens
    .filter((i) => i.visivel && CATALOGO_WIDGETS.some((c) => c.slug === i.slug))
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => CATALOGO_WIDGETS.find((c) => c.slug === i.slug))
    .filter(Boolean);

  const itensParaModal = itens
    .filter((i) => CATALOGO_WIDGETS.some((c) => c.slug === i.slug))
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => {
      const cat = CATALOGO_WIDGETS.find((c) => c.slug === i.slug);
      return cat ? { ...cat, visivel: i.visivel } : null;
    })
    .filter(Boolean);

  return {
    itens,
    widgetsVisiveis,
    itensParaModal,
    carregando,
    salvando,
    reordenar,
    toggleVisivel,
    resetar,
  };
};
