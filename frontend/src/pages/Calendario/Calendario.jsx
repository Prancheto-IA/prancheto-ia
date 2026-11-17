// =============================================================
// PRANCHETO.IA - MÓDULO DE CALENDÁRIO & EVENT MANAGER
// Gerenciador de eventos integrado com Design System do Prancheto.IA,
// visões Mensal, Semanal, Diária e em Lista, filtros por Cor, Tag e
// Categoria, pesquisa instantânea e persistência via Supabase.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { EventManager, defaultColors, defaultCategories, defaultAvailableTags } from '@/components/ui/event-manager';

// Gerador de eventos iniciais de demonstração ancorados no mês e ano atuais
const gerarEventosIniciais = () => {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();
  const dia = agora.getDate();

  return [
    {
      id: 'demo-1',
      title: 'Alinhamento Semanal de Vendas',
      description: 'Revisão das metas semanais, contatos no funil e principais bloqueios com o time.',
      startTime: new Date(ano, mes, dia, 9, 0),
      endTime: new Date(ano, mes, dia, 10, 0),
      color: 'blue',
      category: 'Reunião',
      attendees: ['Equipe Comercial'],
      tags: ['Trabalho', 'Equipe'],
    },
    {
      id: 'demo-2',
      title: 'Apresentação de Proposta Comercial',
      description: 'Demonstração ao vivo dos módulos do Prancheto.IA e negociação de plano anual.',
      startTime: new Date(ano, mes, dia, 14, 30),
      endTime: new Date(ano, mes, dia, 15, 30),
      color: 'purple',
      category: 'Reunião',
      attendees: ['Diretoria do Cliente'],
      tags: ['Importante', 'Cliente'],
    },
    {
      id: 'demo-3',
      title: 'Revisão de Oportunidades no CRM',
      description: 'Atualização das etapas do pipeline, valores estimados e agendamento de follow-ups.',
      startTime: new Date(ano, mes, Math.min(28, dia + 1), 10, 30),
      endTime: new Date(ano, mes, Math.min(28, dia + 1), 11, 30),
      color: 'green',
      category: 'Tarefa',
      tags: ['Trabalho', 'Urgente'],
    },
    {
      id: 'demo-4',
      title: 'Reunião de Onboarding de Novo Cliente',
      description: 'Configuração dos fluxos automáticos e integração com o WhatsApp oficial.',
      startTime: new Date(ano, mes, Math.min(28, dia + 2), 15, 0),
      endTime: new Date(ano, mes, Math.min(28, dia + 2), 16, 0),
      color: 'orange',
      category: 'Reunião',
      attendees: ['Gestor de Sucesso'],
      tags: ['Cliente', 'Importante'],
    },
    {
      id: 'demo-5',
      title: 'Deploy de Melhorias na Plataforma',
      description: 'Liberação de atualizações de performance e novos componentes do calendário.',
      startTime: new Date(ano, mes, Math.min(28, dia + 3), 17, 0),
      endTime: new Date(ano, mes, Math.min(28, dia + 3), 18, 0),
      color: 'green',
      category: 'Tarefa',
      tags: ['Trabalho', 'Urgente'],
    },
    {
      id: 'demo-6',
      title: 'Lembrete: Fechamento Fiscal Mensal',
      description: 'Conciliação bancária das assinaturas e emissão de notas fiscais.',
      startTime: new Date(ano, mes, Math.max(1, dia - 1), 11, 0),
      endTime: new Date(ano, mes, Math.max(1, dia - 1), 12, 0),
      color: 'pink',
      category: 'Lembrete',
      tags: ['Importante'],
    },
  ];
};

export const Calendario = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const tenantId = usuario?.tenant_id;

  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Chave local para cache offline por tenant
  const chaveStorage = `prancheto_eventos_${tenantId || 'default'}`;

  // 1. Carregar eventos do Supabase e sincronizar
  const carregarEventos = useCallback(async () => {
    try {
      setCarregando(true);

      // Ler cache local inicial
      const salvo = localStorage.getItem(chaveStorage);
      let listaInicial = [];
      if (salvo) {
        try {
          const parsed = JSON.parse(salvo);
          listaInicial = parsed.map((e) => ({
            ...e,
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime),
          }));
        } catch {
          listaInicial = [];
        }
      }

      if (tenantId) {
        const { data, error } = await supabase
          .from('agenda_eventos')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('data_inicio', { ascending: true });

        if (!error && data && data.length > 0) {
          const formatados = data.map((item) => {
            const start = new Date(item.data_inicio);
            const end = item.data_fim
              ? new Date(item.data_fim)
              : new Date(start.getTime() + 3600000);

            return {
              id: String(item.id),
              title: item.titulo || 'Sem título',
              description: item.descricao || '',
              startTime: start,
              endTime: end,
              color: item.metadata?.color || 'blue',
              category: item.tipo || item.metadata?.category || 'Reunião',
              tags: item.metadata?.tags || [],
              attendees: item.metadata?.attendees || [],
            };
          });

          setEventos(formatados);
          localStorage.setItem(chaveStorage, JSON.stringify(formatados));
          return;
        }
      }

      // Se não houver dados no banco, usa o cache local ou os eventos de demonstração
      if (listaInicial.length > 0) {
        setEventos(listaInicial);
      } else {
        const demos = gerarEventosIniciais();
        setEventos(demos);
        localStorage.setItem(chaveStorage, JSON.stringify(demos));
      }
    } catch (err) {
      console.warn('Erro ao carregar eventos da agenda:', err);
      const demos = gerarEventosIniciais();
      setEventos(demos);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, chaveStorage]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  // 2. Manipuladores de Criação, Atualização e Exclusão
  const handleEventCreate = async (novoEvento) => {
    const formatado = {
      ...novoEvento,
      startTime: new Date(novoEvento.startTime),
      endTime: new Date(novoEvento.endTime),
    };

    setEventos((prev) => {
      const atualizados = [...prev, formatado];
      localStorage.setItem(chaveStorage, JSON.stringify(atualizados));
      return atualizados;
    });

    if (tenantId) {
      try {
        await supabase.from('agenda_eventos').insert({
          tenant_id: tenantId,
          titulo: formatado.title,
          descricao: formatado.description || null,
          data_inicio: formatado.startTime.toISOString(),
          data_fim: formatado.endTime.toISOString(),
          tipo: formatado.category || 'Reunião',
          metadata: {
            color: formatado.color,
            category: formatado.category,
            tags: formatado.tags || [],
            attendees: formatado.attendees || [],
          },
          criado_por: usuario?.id || null,
          status: 'agendado',
        });
      } catch (err) {
        console.warn('Erro ao inserir evento no Supabase:', err);
      }
    }
  };

  const handleEventUpdate = async (id, eventoAtualizado) => {
    const formatado = {
      ...eventoAtualizado,
      startTime: new Date(eventoAtualizado.startTime),
      endTime: new Date(eventoAtualizado.endTime),
    };

    setEventos((prev) => {
      const atualizados = prev.map((e) => (e.id === id ? formatado : e));
      localStorage.setItem(chaveStorage, JSON.stringify(atualizados));
      return atualizados;
    });

    if (tenantId) {
      try {
        await supabase
          .from('agenda_eventos')
          .update({
            titulo: formatado.title,
            descricao: formatado.description || null,
            data_inicio: formatado.startTime.toISOString(),
            data_fim: formatado.endTime.toISOString(),
            tipo: formatado.category || 'Reunião',
            metadata: {
              color: formatado.color,
              category: formatado.category,
              tags: formatado.tags || [],
              attendees: formatado.attendees || [],
            },
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Erro ao atualizar evento no Supabase:', err);
      }
    }
  };

  const handleEventDelete = async (id) => {
    setEventos((prev) => {
      const atualizados = prev.filter((e) => e.id !== id);
      localStorage.setItem(chaveStorage, JSON.stringify(atualizados));
      return atualizados;
    });

    if (tenantId) {
      try {
        await supabase.from('agenda_eventos').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao deletar evento no Supabase:', err);
      }
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-3 sm:p-5 lg:p-6 bg-surface-ground">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Componente EventManager Traduzido com Design System */}
        <EventManager
          events={eventos}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          categories={defaultCategories}
          colors={defaultColors}
          availableTags={defaultAvailableTags}
          defaultView="month"
        />
      </div>
    </div>
  );
};

export default Calendario;
