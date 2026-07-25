// =============================================================
// PRANCHETO.IA - HOOK: useStatusSistema
// Camada de acesso a dados do Status do Sistema do Suporte.
// Escopo por tenant_id (padrão dos demais módulos).
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ─── Constantes de domínio ────────────────────────────────────
export const STATUS_COMPONENTE = {
  operacional:   { label: 'Operacional',      cor: '#10b981', emoji: '🟢' },
  degradado:     { label: 'Degradado',        cor: '#f59e0b', emoji: '🟡' },
  instavel:      { label: 'Instável',         cor: '#f97316', emoji: '🟠' },
  em_manutencao: { label: 'Em manutenção',    cor: '#3b82f6', emoji: '🔧' },
  fora_do_ar:    { label: 'Fora do ar',       cor: '#ef4444', emoji: '🔴' },
};

export const IMPACTO_INCIDENTE = {
  menor:   { label: 'Menor',   cor: '#f59e0b' },
  maior:   { label: 'Maior',   cor: '#f97316' },
  critico: { label: 'Crítico', cor: '#ef4444' },
};

export const useStatusSistema = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [componentes, setComponentes] = useState([]);
  const [incidentes, setIncidentes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      const [resComponentes, resIncidentes] = await Promise.all([
        supabase
          .from('suporte_status_componentes')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('ordem', { ascending: true }),
        supabase
          .from('suporte_status_incidentes')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('criado_em', { ascending: false }),
      ]);
      if (resComponentes.error) throw resComponentes.error;
      if (resIncidentes.error) throw resIncidentes.error;
      setComponentes(resComponentes.data || []);
      setIncidentes(resIncidentes.data || []);
    } catch (err) {
      console.error('useStatusSistema.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criarComponente = async (dados) => {
    const { data, error } = await supabase
      .from('suporte_status_componentes')
      .insert({ ...dados, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarComponente = async (id, dados) => {
    const { error } = await supabase.from('suporte_status_componentes').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirComponente = async (id) => {
    const { error } = await supabase.from('suporte_status_componentes').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const criarIncidente = async (dados) => {
    const { data, error } = await supabase
      .from('suporte_status_incidentes')
      .insert({ ...dados, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarIncidente = async (id, dados) => {
    const { error } = await supabase.from('suporte_status_incidentes').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirIncidente = async (id) => {
    const { error } = await supabase.from('suporte_status_incidentes').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  return {
    componentes,
    incidentes,
    carregando,
    carregar,
    criarComponente,
    atualizarComponente,
    excluirComponente,
    criarIncidente,
    atualizarIncidente,
    excluirIncidente,
  };
};
