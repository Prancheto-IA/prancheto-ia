import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Catálogo de todos os módulos disponíveis
export const CATALOGO_MODULOS = [
  {
    slug: 'dashboard',
    nome: 'Dashboard',
    descricao: 'KPIs, métricas e widgets da organização',
    icone: '📊',
    cor: '#6366f1',
    rota: '/modulos/dashboard',
  },
  {
    slug: 'calendario',
    nome: 'Calendário',
    descricao: 'Agenda interativa com drag-and-drop',
    icone: '📅',
    cor: '#0ea5e9',
    rota: '/modulos/calendario',
  },
  {
    slug: 'projetos',
    nome: 'Projetos',
    descricao: 'Projetos de alto nível com milestones',
    icone: '📁',
    cor: '#f59e0b',
    rota: '/modulos/projetos',
  },
  {
    slug: 'tarefas',
    nome: 'Tarefas',
    descricao: 'Board operacional de tarefas e checklists',
    icone: '✅',
    cor: '#10b981',
    rota: '/modulos/tarefas',
  },
  {
    slug: 'feed',
    nome: 'Feed',
    descricao: 'Mural social com postagens e reações',
    icone: '📢',
    cor: '#ec4899',
    rota: '/modulos/feed',
  },
  {
    slug: 'chat',
    nome: 'Chat',
    descricao: 'Mensagens instantâneas em canais',
    icone: '💬',
    cor: '#8b5cf6',
    rota: '/modulos/chat',
  },
  {
    slug: 'times_pessoas',
    nome: 'Times e Pessoas',
    descricao: 'Diretório de membros e times',
    icone: '👥',
    cor: '#14b8a6',
    rota: '/modulos/times-pessoas',
  },
  {
    slug: 'crm',
    nome: 'CRM',
    descricao: 'Leads, clientes e pipeline de vendas',
    icone: '🎯',
    cor: '#f97316',
    rota: '/crm/leads',
  },
];

export const useModulos = (timeId = null) => {
  const usuario = useAuthStore(s => s.usuario);
  const [configs, setConfigs] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const tenantId = usuario?.tenant_id;

  // Carrega configurações do banco
  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      let query = supabase
        .from('modulos_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: true });

      if (timeId) {
        query = query.eq('time_id', timeId);
      } else {
        query = query.is('time_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      console.error('useModulos.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, timeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Retorna módulos ativos (ordenados) e disponíveis (não ativos)
  const modulosAtivos = CATALOGO_MODULOS
    .filter(m => configs.some(c => c.modulo_slug === m.slug && c.ativo))
    .sort((a, b) => {
      const ca = configs.find(c => c.modulo_slug === a.slug);
      const cb = configs.find(c => c.modulo_slug === b.slug);
      return (ca?.ordem ?? 999) - (cb?.ordem ?? 999);
    });

  const modulosDisponiveis = CATALOGO_MODULOS.filter(
    m => !configs.some(c => c.modulo_slug === m.slug && c.ativo)
  );

  // Ativa um módulo (INSERT ou UPDATE)
  const ativarModulo = useCallback(async (slug, ordemFinal) => {
    if (!tenantId) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('modulos_config')
        .upsert(
          {
            tenant_id: tenantId,
            time_id: timeId,
            modulo_slug: slug,
            ativo: true,
            ordem: ordemFinal,
          },
          { onConflict: 'tenant_id,time_id,modulo_slug' }
        );
      if (error) throw error;
      await carregar();
    } catch (err) {
      console.error('useModulos.ativarModulo:', err);
    } finally {
      setSalvando(false);
    }
  }, [tenantId, timeId, carregar]);

  // Desativa um módulo
  const desativarModulo = useCallback(async (slug) => {
    if (!tenantId) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('modulos_config')
        .upsert(
          {
            tenant_id: tenantId,
            time_id: timeId,
            modulo_slug: slug,
            ativo: false,
            ordem: 0,
          },
          { onConflict: 'tenant_id,time_id,modulo_slug' }
        );
      if (error) throw error;
      await carregar();
    } catch (err) {
      console.error('useModulos.desativarModulo:', err);
    } finally {
      setSalvando(false);
    }
  }, [tenantId, timeId, carregar]);

  // Reordena módulos ativos em batch
  const reordenar = useCallback(async (slugsOrdenados) => {
    if (!tenantId) return;
    setSalvando(true);
    try {
      const upserts = slugsOrdenados.map((slug, idx) => ({
        tenant_id: tenantId,
        time_id: timeId,
        modulo_slug: slug,
        ativo: true,
        ordem: idx,
      }));
      const { error } = await supabase
        .from('modulos_config')
        .upsert(upserts, { onConflict: 'tenant_id,time_id,modulo_slug' });
      if (error) throw error;
      await carregar();
    } catch (err) {
      console.error('useModulos.reordenar:', err);
    } finally {
      setSalvando(false);
    }
  }, [tenantId, timeId, carregar]);

  return {
    modulosAtivos,
    modulosDisponiveis,
    configs,
    carregando,
    salvando,
    ativarModulo,
    desativarModulo,
    reordenar,
    carregar,
  };
};
