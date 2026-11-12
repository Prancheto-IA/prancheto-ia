// =============================================================
// PRANCHETO.IA - RELATÓRIOS & PERFORMANCE
// Layout executivo reorganizado no Prancheto Design System.
// Métricas consolidadas de Leads, Funil, Outbound, Agenda e Fontes.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Target01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  Coins01Icon,
  TrendingUpIcon,
  Diamond01Icon,
  FireIcon,
  SnowflakeIcon,
  FilterIcon,
  Mail01Icon,
  Calendar03Icon,
  ThermometerWarmIcon,
  Globe02Icon,
  ArrowReloadHorizontalIcon,
  Download01Icon,
  AiSparklesIcon,
  HourglassIcon,
  Time02Icon,
} from '@hugeicons/core-free-icons';

// ----------------------------------------------------------
// MODAL: Insights de IA
// ----------------------------------------------------------
const ModalInsightsIA = ({ aberto, onFechar, dados }) => {
  if (!aberto || !dados) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-surface-card rounded-2xl p-6 space-y-5 shadow-2xl border border-surface-border max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <HugeiconsIcon icon={AiSparklesIcon} size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink-primary">Insights de Inteligência Artificial</h2>
              <p className="text-sm text-ink-secondary">Diagnóstico automatizado da sua operação em tempo real</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-ink-muted hover:text-ink-primary p-1 text-sm font-bold">
            ✕
          </button>
        </div>

        <div className="space-y-3.5 overflow-y-auto pr-1">
          <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-secondary dark:text-[#7DD3FC]">
              <span className="w-2 h-2 rounded-full bg-brand-secondary" />
              Eficiência no Pipeline
            </div>
            <p className="text-sm text-ink-primary leading-relaxed">
              Você possui <strong>{dados.totalLeads} leads ativos</strong> e uma taxa de conversão estimada em{' '}
              <strong>{dados.taxaConversao}%</strong>. O canal mais produtivo atualmente é{' '}
              <span className="capitalize font-semibold text-brand-primary">{dados.topCanal || 'Direto'}</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-[#FCD34D]">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Oportunidade Imediata
            </div>
            <p className="text-sm text-ink-primary leading-relaxed">
              Existem <strong>{dados.leadsQuentes} leads com alta pontuação (quentes)</strong> aguardando contato prioritário.
              Acelerar o envio de propostas para este grupo pode elevar a receita em até 22%.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-brand-primary dark:text-[#A5B4FC]">
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              Recomendação de Outbound
            </div>
            <p className="text-sm text-ink-primary leading-relaxed">
              Com <strong>{dados.totalAcoes} ações de prospecção</strong> registradas, manter cadências ativas nos canais de maior conversão garantirá estabilidade no fluxo de novos negócios.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-surface-border">
          <span className="text-[11px] text-ink-secondary">Atualizado com base nos dados consolidados</span>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary-hover transition-all shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Relatorios
// ----------------------------------------------------------
const Relatorios = () => {
  const { usuario } = useAuthStore();
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modalIA, setModalIA] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const camposContato = 'id, nome, email, tipo_registro, status_funil, valor_estimado, origem, score, criado_em';

      let queryContatos = supabase.from('crm_contatos').select(camposContato).order('criado_em', { ascending: false });
      if (usuario?.tenant_id) queryContatos = queryContatos.eq('tenant_id', usuario.tenant_id);
      else if (usuario?.id) queryContatos = queryContatos.eq('responsavel_id', usuario.id);

      let queryAgenda = supabase.from('agenda_eventos').select('id, data_inicio, titulo');
      if (usuario?.tenant_id) queryAgenda = queryAgenda.eq('tenant_id', usuario.tenant_id);

      let queryOutbound = supabase.from('outbound_acoes').select('id, status, tipo');
      if (usuario?.tenant_id) queryOutbound = queryOutbound.eq('tenant_id', usuario.tenant_id);

      const [respContatos, respAgenda, respOutbound] = await Promise.allSettled([
        queryContatos,
        queryAgenda,
        queryOutbound,
      ]);

      const contatos = respContatos.status === 'fulfilled' ? (respContatos.value.data || []) : [];
      const eventos = respAgenda.status === 'fulfilled' ? (respAgenda.value.data || []) : [];
      const acoes = respOutbound.status === 'fulfilled' ? (respOutbound.value.data || []) : [];

      const soLeads = contatos.filter((c) => c.tipo_registro === 'lead' || !c.tipo_registro);
      const soClientes = contatos.filter((c) => c.tipo_registro === 'cliente');

      const totalContatos = contatos.length;
      const totalLeads = soLeads.length;
      const totalClientes = soClientes.length;

      // Status do Funil
      const leads = soLeads.filter((c) => c.status_funil === 'lead').length;
      const qualificados = soLeads.filter((c) => c.status_funil === 'qualificado').length;
      const propostas = soLeads.filter((c) => c.status_funil === 'proposta').length;
      const negociacao = soLeads.filter((c) => c.status_funil === 'negociacao').length;
      const fechados = contatos.filter((c) => c.status_funil === 'fechado').length;
      const perdidos = soLeads.filter((c) => c.status_funil === 'perdido').length;

      // Pipeline Ativo (todas as oportunidades em aberto)
      const valorPipeline = soLeads
        .filter((c) => !['fechado', 'perdido'].includes(c.status_funil))
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      // Receita Fechada
      const valorFechado = contatos
        .filter((c) => c.status_funil === 'fechado')
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      // LTV Médio
      const ltvTotal = soClientes.reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);
      const ltvMedio = soClientes.length > 0
        ? ltvTotal / soClientes.length
        : (valorFechado > 0 ? valorFechado : (totalClientes > 0 ? 8000 : 0));

      // Taxa de Conversão
      const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;

      // Temperatura dos Leads (Score)
      const leadsQuentes = soLeads.filter((c) => (c.score || 0) >= 70).length;
      const leadsMornos = soLeads.filter((c) => (c.score || 0) >= 30 && (c.score || 0) < 70).length;
      const leadsFrios = soLeads.filter((c) => (c.score || 0) < 30).length;

      // Outbound & Agenda
      const totalAcoes = acoes.length;
      const acoesPendentes = acoes.filter((a) => a.status === 'pendente' || a.status === 'agendada' || a.status === 'planejada').length;
      const acoesConcluidas = acoes.filter((a) => a.status === 'concluida' || a.status === 'enviada' || a.status === 'sucesso').length;

      const totalEventos = eventos.length;
      const hojeStr = new Date().toISOString().slice(0, 10);
      const eventosHoje = eventos.filter((e) => e.data_inicio && e.data_inicio.slice(0, 10) === hojeStr).length;

      // Fontes de contatos
      const origensMap = contatos.reduce((acc, c) => {
        const o = (c.origem || 'Outro').trim();
        const canalFormatado = o.charAt(0).toUpperCase() + o.slice(1);
        acc[canalFormatado] = (acc[canalFormatado] || 0) + 1;
        return acc;
      }, {});

      const origensLista = Object.entries(origensMap).map(([canal, qtd]) => ({
        canal,
        qtd,
        pct: totalContatos > 0 ? Math.round((qtd / totalContatos) * 100) : 0,
      })).sort((a, b) => b.qtd - a.qtd);

      const topCanal = origensLista[0]?.canal || 'Outro';

      setDados({
        totalContatos,
        totalLeads,
        totalClientes,
        leads,
        qualificados,
        propostas,
        negociacao,
        fechados,
        perdidos,
        valorPipeline,
        valorFechado,
        ltvTotal,
        ltvMedio,
        taxaConversao,
        leadsQuentes,
        leadsMornos,
        leadsFrios,
        origensLista,
        topCanal,
        totalEventos,
        eventosHoje,
        totalAcoes,
        acoesPendentes,
        acoesConcluidas,
      });
    } catch (err) {
      setErro('Erro ao carregar dados do relatório.');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.tenant_id, usuario?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Formatação de moeda BRL
  const fmt = (v) =>
    (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Exportar Relatório CSV
  const exportarCSV = () => {
    if (!dados) return;
    const linhas = [
      ['RELATÓRIO DE DESEMPENHO E MÉTRICAS - PRANCHETO.IA', new Date().toLocaleDateString('pt-BR')],
      ['Indicador', 'Valor'],
      ['Total de Leads', dados.totalLeads],
      ['Clientes Ativos', dados.totalClientes],
      ['Negócios Fechados', dados.fechados],
      ['Receita Fechada', `R$ ${fmt(dados.valorFechado)}`],
      ['Taxa de Conversão', `${dados.taxaConversao}%`],
      ['LTV Médio', `R$ ${fmt(dados.ltvMedio)}`],
      ['Leads Quentes', dados.leadsQuentes],
      ['Leads Frios', dados.leadsFrios],
      ['Pipeline Ativo', `R$ ${fmt(dados.valorPipeline)}`],
      ['Total Ações Outbound', dados.totalAcoes],
      ['Ações Pendentes', dados.acoesPendentes],
      ['Ações Concluídas', dados.acoesConcluidas],
      ['Eventos na Agenda', dados.totalEventos],
      ['Eventos Hoje', dados.eventosHoje],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + linhas.map((e) => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_prancheto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Métricas do Funil
  const totalFunil = (dados?.leads || 0) +
    (dados?.qualificados || 0) +
    (dados?.propostas || 0) +
    (dados?.negociacao || 0) +
    (dados?.fechados || 0) +
    (dados?.perdidos || 0);

  const etapasFunil = [
    { key: 'lead', titulo: 'Lead', qtd: dados?.leads || 0, cor: 'bg-blue-600' },
    { key: 'qualificado', titulo: 'Qualificado', qtd: dados?.qualificados || 0, cor: 'bg-purple-600' },
    { key: 'proposta', titulo: 'Proposta', qtd: dados?.propostas || 0, cor: 'bg-[#0E382C]' },
    { key: 'negociacao', titulo: 'Negociação', qtd: dados?.negociacao || 0, cor: 'bg-amber-600' },
    { key: 'fechado', titulo: 'Fechado', qtd: dados?.fechados || 0, cor: 'bg-[#15803D]' },
    { key: 'perdido', titulo: 'Perdido', qtd: dados?.perdidos || 0, cor: 'bg-rose-500' },
  ];

  // Cálculo proporcional de temperatura
  const totalTemperatura = (dados?.leadsQuentes || 0) + (dados?.leadsMornos || 0) + (dados?.leadsFrios || 0);
  const pctQuentes = totalTemperatura > 0 ? Math.round(((dados?.leadsQuentes || 0) / totalTemperatura) * 100) : 0;
  const pctMornos = totalTemperatura > 0 ? Math.round(((dados?.leadsMornos || 0) / totalTemperatura) * 100) : 0;
  const pctFrios = totalTemperatura > 0 ? 100 - pctQuentes - pctMornos : 0;

  return (
    <div className="w-full flex-1 flex flex-col space-y-5 pb-6">
      {/* ============================================================
          1. HEADER PRINCIPAL
      ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111915] tracking-tight">
            Relatórios
          </h1>
          <p className="text-sm text-[#687770] font-medium mt-0.5">
            Métricas e indicadores do seu negócio em tempo real.
          </p>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={carregar}
            className="px-4 py-2 bg-white hover:bg-[#F7FAF8] text-[#111915] border border-[#E4ECE7] text-sm font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-2"
            title="Recarregar dados"
          >
            <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={15} strokeWidth={2} className="text-[#0E382C]" />
            <span>Atualizar</span>
          </button>

          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-white hover:bg-[#F7FAF8] text-[#111915] border border-[#E4ECE7] text-sm font-semibold rounded-xl shadow-2xs transition-all flex items-center gap-2"
            title="Exportar planilha CSV"
          >
            <HugeiconsIcon icon={Download01Icon} size={15} strokeWidth={2} className="text-[#687770]" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => setModalIA(true)}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <HugeiconsIcon icon={AiSparklesIcon} size={15} strokeWidth={2} className="text-[#D4EC9D]" />
            <span>Insights com IA</span>
          </button>
        </div>
      </div>

      {erro && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-sm font-semibold text-rose-700">
          {erro}
        </div>
      )}

      {/* ============================================================
          2. GRADE SUPERIOR: 8 CARDS DE KPIs (4 COLUNAS X 2 LINHAS)
      ============================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Card 1: Total de leads */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HugeiconsIcon icon={Target01Icon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-[#15803D] bg-[#DCF5E4] px-2 py-0.5 rounded-full">
              CRM
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111915] tracking-tight">
              {dados?.totalLeads ?? 0}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Total de leads
            </p>
          </div>
        </div>

        {/* Card 2: Clientes ativos */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center">
              <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-[#15803D] bg-[#DCF5E4] px-2 py-0.5 rounded-full">
              Ativos
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#15803D] tracking-tight">
              {dados?.totalClientes ?? 0}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Clientes ativos
            </p>
          </div>
        </div>

        {/* Card 3: Negócios fechados */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Ganhos
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111915] tracking-tight">
              {dados?.fechados ?? 0}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Negócios fechados
            </p>
          </div>
        </div>

        {/* Card 4: Receita fechada */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <HugeiconsIcon icon={Coins01Icon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
              Faturado
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#111915] tracking-tight truncate">
              R$ {fmt(dados?.valorFechado || 0)}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Receita fechada
            </p>
          </div>
        </div>

        {/* Card 5: Taxa de conversão */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HugeiconsIcon icon={TrendingUpIcon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Taxa
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#111915] tracking-tight">
              {dados?.taxaConversao || 0}%
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Taxa de conversão
            </p>
          </div>
        </div>

        {/* Card 6: LTV médio */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HugeiconsIcon icon={Diamond01Icon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Valor
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0E382C] tracking-tight truncate">
              R$ {fmt(dados?.ltvMedio || 0)}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              LTV médio (clientes)
            </p>
          </div>
        </div>

        {/* Card 7: Leads quentes */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <HugeiconsIcon icon={FireIcon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              Score ≥70
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
              {dados?.leadsQuentes ?? 0}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Leads quentes
            </p>
          </div>
        </div>

        {/* Card 8: Leads frios */}
        <div className="bg-white rounded-2xl p-4 sm:p-4.5 border border-[#E4ECE7] shadow-[0_2px_10px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <HugeiconsIcon icon={SnowflakeIcon} size={18} strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
              Score &lt;30
            </span>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-sky-700 tracking-tight">
              {dados?.leadsFrios ?? 0}
            </p>
            <p className="text-sm font-semibold text-[#687770] mt-1">
              Leads frios
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          3. SEÇÃO PRINCIPAL REORGANIZADA (2 COLUNAS PROPORCIONAIS)
      ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUNA ESQUERDA (7 COLS): Funil de Vendas + Fontes de Contatos */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: Funil de Vendas */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4ECE7] shadow-[0_2px_12px_-3px_rgba(14,56,44,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={FilterIcon} size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#111915]">
                    Funil de vendas
                  </h3>
                  <p className="text-[11px] text-[#687770]">
                    Distribuição e conversão das oportunidades por etapa
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#687770] bg-[#F7FAF8] border border-[#E4ECE7] px-2.5 py-1 rounded-xl">
                {totalFunil} {totalFunil === 1 ? 'oportunidade' : 'oportunidades'}
              </span>
            </div>

            {/* Lista das 6 Etapas do Funil */}
            <div className="space-y-3 pt-1">
              {etapasFunil.map((etapa) => {
                const pct = totalFunil > 0 ? Math.round((etapa.qtd / totalFunil) * 100) : 0;
                return (
                  <div key={etapa.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm font-bold text-[#111915]">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${etapa.cor}`} />
                        <span>{etapa.titulo}</span>
                      </span>
                      <span className="text-[#687770] font-semibold text-[11px]">
                        {etapa.qtd} ({pct}%)
                      </span>
                    </div>
                    {/* Barra de Progresso */}
                    <div className="w-full h-2 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct > 0 ? etapa.cor : 'bg-transparent'
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Destaque do Pipeline Ativo */}
            <div className="pt-2 border-t border-[#E4ECE7]">
              <div className="p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] flex items-center justify-between">
                <span className="text-sm font-bold text-[#111915]">
                  Pipeline ativo:
                </span>
                <span className="text-sm font-extrabold text-[#15803D]">
                  R$ {fmt(dados?.valorPipeline || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Fontes de Contatos */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4ECE7] shadow-[0_2px_12px_-3px_rgba(14,56,44,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EBF0ED] text-[#0E382C] flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={Globe02Icon} size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#111915]">
                    Fontes de contatos
                  </h3>
                  <p className="text-[11px] text-[#687770]">
                    Origem dos leads e canais de atração cadastrados
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-[#0E382C]">
                {dados?.totalContatos || 0} contatos
              </span>
            </div>

            {/* Tabela de Fontes */}
            {(dados?.origensLista || []).length === 0 ? (
              <div className="py-8 text-center text-sm text-[#687770] bg-[#F7FAF8] rounded-xl border border-dashed border-[#E4ECE7]">
                Nenhum contato com fonte cadastrada ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E4ECE7] text-[11px] font-bold text-[#687770]">
                      <th className="pb-2.5 font-bold">Fonte</th>
                      <th className="pb-2.5 text-center font-bold">Contatos</th>
                      <th className="pb-2.5 text-right font-bold">% do total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {(dados?.origensLista || []).map((item, idx) => (
                      <tr key={idx} className="hover:bg-surface-subtle transition-colors">
                        <td className="py-2.5 font-semibold text-ink-primary flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-primary" />
                          <span className="capitalize">{item.canal}</span>
                        </td>
                        <td className="py-2.5 text-center font-bold text-ink-primary">
                          {item.qtd}
                        </td>
                        <td className="py-2.5 text-right font-bold text-brand-primary">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-surface-muted overflow-hidden hidden sm:block">
                              <div
                                className="h-full bg-brand-primary rounded-full"
                                style={{ width: `${item.pct}%` }}
                              />
                            </div>
                            <span>{item.pct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA (5 COLS): Temperatura dos Leads + Outbound & Agenda */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Temperatura dos Leads */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4ECE7] shadow-[0_2px_12px_-3px_rgba(14,56,44,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={ThermometerWarmIcon} size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#111915]">
                    Temperatura dos leads
                  </h3>
                  <p className="text-[11px] text-[#687770]">
                    Classificação baseada em score e probabilidade
                  </p>
                </div>
              </div>
            </div>

            {/* 3 Blocos de Temperatura */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-1">
              {/* Quentes */}
              <div className="p-3 rounded-xl bg-[#FFF5F2] dark:bg-rose-500/20 border border-[#FDE1D9] dark:border-rose-500/35 text-center space-y-1">
                <p className="text-xl sm:text-2xl font-extrabold text-[#C84B31] dark:text-[#FDA4AF]">
                  {dados?.leadsQuentes ?? 0}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#C84B31] dark:text-[#FDA4AF]">
                  <HugeiconsIcon icon={FireIcon} size={13} strokeWidth={2} />
                  <span className="truncate">Quentes</span>
                </div>
                <p className="text-[10px] text-ink-secondary font-semibold">≥70</p>
              </div>

              {/* Mornos */}
              <div className="p-3 rounded-xl bg-[#FEF9EC] dark:bg-amber-500/20 border border-[#FBEEC8] dark:border-amber-500/35 text-center space-y-1">
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-[#FCD34D]">
                  {dados?.leadsMornos ?? 0}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-700 dark:text-[#FCD34D]">
                  <HugeiconsIcon icon={ThermometerWarmIcon} size={13} strokeWidth={2} />
                  <span className="truncate">Mornos</span>
                </div>
                <p className="text-[10px] text-ink-secondary font-semibold">30–69</p>
              </div>

              {/* Frios */}
              <div className="p-3 rounded-xl bg-[#F0F7FF] dark:bg-sky-500/20 border border-[#D8EBFE] dark:border-sky-500/35 text-center space-y-1">
                <p className="text-xl sm:text-2xl font-extrabold text-sky-700 dark:text-[#7DD3FC]">
                  {dados?.leadsFrios ?? 0}
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-sky-700 dark:text-[#7DD3FC]">
                  <HugeiconsIcon icon={SnowflakeIcon} size={13} strokeWidth={2} />
                  <span className="truncate">Frios</span>
                </div>
                <p className="text-[10px] text-ink-secondary font-semibold">&lt;30</p>
              </div>
            </div>

            {/* Barra Proporcional de Temperatura */}
            <div className="pt-2 border-t border-surface-border space-y-2">
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-muted">
                <div
                  style={{ width: `${pctQuentes}%` }}
                  className="h-full bg-[#C84B31] dark:bg-[#FB7185] transition-all"
                  title={`Quentes: ${pctQuentes}%`}
                />
                <div
                  style={{ width: `${pctMornos}%` }}
                  className="h-full bg-amber-500 dark:bg-[#FBBF24] transition-all"
                  title={`Mornos: ${pctMornos}%`}
                />
                <div
                  style={{ width: `${pctFrios}%` }}
                  className="h-full bg-sky-500 dark:bg-[#38BDF8] transition-all"
                  title={`Frios: ${pctFrios}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-ink-secondary">
                <span className="text-[#C84B31] dark:text-[#FDA4AF]">{pctQuentes}% Quentes</span>
                <span className="text-amber-700 dark:text-[#FCD34D]">{pctMornos}% Mornos</span>
                <span className="text-sky-700 dark:text-[#7DD3FC]">{pctFrios}% Frios</span>
              </div>
            </div>
          </div>

          {/* Card: Outbound & Agenda */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E4ECE7] shadow-[0_2px_12px_-3px_rgba(14,56,44,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#111915]">
                    Outbound &amp; Agenda
                  </h3>
                  <p className="text-[11px] text-[#687770]">
                    Atividades de prospecção e eventos programados
                  </p>
                </div>
              </div>
            </div>

            {/* Lista dos 5 Indicadores Operacionais com ícones padronizados */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#111915]">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={Mail01Icon} size={15} className="text-[#687770]" />
                  <span>Total de ações outbound</span>
                </span>
                <span className="font-extrabold text-sm text-[#111915]">
                  {dados?.totalAcoes ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#111915]">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={HourglassIcon} size={15} className="text-amber-600" />
                  <span>Ações pendentes</span>
                </span>
                <span className={`font-extrabold text-sm ${
                  (dados?.acoesPendentes || 0) > 0 ? 'text-amber-700' : 'text-[#687770]'
                }`}>
                  {dados?.acoesPendentes ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#111915]">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-[#15803D]" />
                  <span>Ações concluídas</span>
                </span>
                <span className={`font-extrabold text-sm ${
                  (dados?.acoesConcluidas || 0) > 0 ? 'text-[#15803D]' : 'text-[#687770]'
                }`}>
                  {dados?.acoesConcluidas ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#111915]">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={15} className="text-blue-600" />
                  <span>Eventos na agenda</span>
                </span>
                <span className="font-extrabold text-sm text-blue-700">
                  {dados?.totalEventos ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#111915]">
                <span className="flex items-center gap-2.5">
                  <HugeiconsIcon icon={Time02Icon} size={15} className="text-[#0E382C]" />
                  <span>Eventos hoje</span>
                </span>
                <span className={`font-extrabold text-sm ${
                  (dados?.eventosHoje || 0) > 0 ? 'text-[#0E382C]' : 'text-[#687770]'
                }`}>
                  {dados?.eventosHoje ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Insights com Inteligência Artificial */}
      <ModalInsightsIA
        aberto={modalIA}
        onFechar={() => setModalIA(false)}
        dados={dados}
      />
    </div>
  );
};

export default Relatorios;
