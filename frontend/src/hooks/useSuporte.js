// =============================================================
// PRANCHETO.IA - HOOK: useSuporte
// Camada de acesso a dados do módulo de Suporte (tickets).
// Segue o padrão dos demais módulos (useProjetos/useModulos):
// escopo por tenant_id e operações CRUD via supabase.
//
// Base para as próximas etapas — a interface (páginas) é ligada
// gradualmente a estas operações.
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ─── Constantes de domínio (rótulos e cores) ──────────────────
export const CATEGORIA_TICKET = {
  duvida:           { label: 'Dúvida',           emoji: '❓' },
  problema_tecnico: { label: 'Problema técnico', emoji: '🛠️' },
  financeiro:       { label: 'Financeiro',       emoji: '💳' },
  sugestao:         { label: 'Sugestão',         emoji: '💡' },
  outro:            { label: 'Outro',            emoji: '📋' },
};

export const STATUS_TICKET = {
  aberto:             { label: 'Aberto',              cor: '#3b82f6' },
  em_atendimento:     { label: 'Em atendimento',      cor: '#f59e0b' },
  aguardando_cliente: { label: 'Aguardando cliente',  cor: '#a855f7' },
  resolvido:          { label: 'Resolvido',           cor: '#10b981' },
  fechado:            { label: 'Fechado',             cor: '#94a3b8' },
};

export const PRIORIDADE_TICKET = {
  baixa:   { label: 'Baixa',    cor: '#94a3b8' },
  media:   { label: 'Média',    cor: '#3b82f6' },
  alta:    { label: 'Alta',     cor: '#f59e0b' },
  critica: { label: 'Crítica',  cor: '#ef4444' },
};

export const useSuporte = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [tickets, setTickets] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('suporte_tickets')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('useSuporte.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criarTicket = async (dados) => {
    const { data, error } = await supabase
      .from('suporte_tickets')
      .insert({ ...dados, tenant_id: tenantId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarTicket = async (id, dados) => {
    const { error } = await supabase.from('suporte_tickets').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirTicket = async (id) => {
    const { error } = await supabase.from('suporte_tickets').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const carregarMensagens = async (ticketId) => {
    const { data, error } = await supabase
      .from('suporte_ticket_mensagens')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('criado_em', { ascending: true });
    if (error) throw error;
    return data || [];
  };

  const adicionarMensagem = async (ticketId, dados) => {
    const { data, error } = await supabase
      .from('suporte_ticket_mensagens')
      .insert({ ...dados, ticket_id: ticketId, autor_id: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  return {
    tickets,
    carregando,
    carregar,
    criarTicket,
    atualizarTicket,
    excluirTicket,
    carregarMensagens,
    adicionarMensagem,
  };
};
