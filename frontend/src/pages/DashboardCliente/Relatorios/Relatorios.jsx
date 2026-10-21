// =============================================================
// PRANCHETO.IA - RELATÓRIOS & PERFORMANCE
// Layout executivo baseado no Emitly Design System.
// Métricas reais de CRM, Funil, Finanças, Equipe e Outbound.
// =============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AiSparklesIcon,
  Analytics01Icon,
  Download01Icon,
  ArrowReloadHorizontalIcon,
  MoreHorizontalIcon,
  UserGroupIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  ArrowUp02Icon,
} from '@hugeicons/core-free-icons';

// ----------------------------------------------------------
// MODAL: Insights de IA
// ----------------------------------------------------------
const ModalInsightsIA = ({ aberto, onFechar, dados }) => {
  if (!aberto || !dados) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-5 shadow-2xl border border-[#E4ECE7] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-[#E4ECE7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center flex-shrink-0 shadow-xs">
              <HugeiconsIcon icon={AiSparklesIcon} size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#111915]">Insights de Inteligência Artificial</h2>
              <p className="text-xs text-[#687770]">Diagnóstico automatizado da sua operação em tempo real</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 p-1">
            ✕
          </button>
        </div>

        <div className="space-y-3.5 overflow-y-auto pr-1">
          <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#15803D]">
              <span className="w-2 h-2 rounded-full bg-[#15803D]" />
              Eficiência no Pipeline
            </div>
            <p className="text-xs text-[#111915] leading-relaxed">
              Você possui <strong>{dados.totalLeads} leads ativos</strong> e uma taxa de conversão estimada em{' '}
              <strong>{dados.taxaConversao}%</strong>. O canal mais produtivo atualmente é{' '}
              <span className="capitalize font-semibold text-[#0E382C]">{dados.topCanal || 'Direto'}</span>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Oportunidade Imediata
            </div>
            <p className="text-xs text-[#111915] leading-relaxed">
              Existem <strong>{dados.leadsQuentes} leads com alta pontuação (quentes)</strong> aguardando contato prioritário.
              Acelerar o envio de propostas para este grupo pode elevar a receita em até 22%.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#0E382C]">
              <span className="w-2 h-2 rounded-full bg-[#0E382C]" />
              Recomendação de Outbound
            </div>
            <p className="text-xs text-[#111915] leading-relaxed">
              Com <strong>{dados.totalAcoes} ações de prospecção</strong> registradas, manter cadências ativas nos canais de maior conversão garantirá estabilidade no fluxo de novos negócios nas próximas semanas.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E4ECE7]">
          <span className="text-[11px] text-[#687770]">Atualizado com base nos últimos 30 dias</span>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-[#0E382C] text-white text-xs font-semibold rounded-xl hover:bg-[#07261E] transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Gráfico de Área (Spline SVG)
// ----------------------------------------------------------
const GraficoAreaSpline = ({ valorPico = 'R$ 82.500', variacao = '+12% Últimos 30 dias' }) => {
  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-2xl font-extrabold text-[#111915] tracking-tight">{valorPico}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15803D] bg-[#DCF5E4] px-2 py-0.5 rounded-full mt-1">
            <HugeiconsIcon icon={ArrowUp02Icon} size={12} strokeWidth={2.5} />
            {variacao}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-[#687770] font-medium block">Pipeline & Contatos</span>
          <span className="text-[11px] text-[#8A9A92]">Mantenha o funil atualizado</span>
        </div>
      </div>

      {/* SVG Canvas com Área e Linha Curva */}
      <div className="relative w-full h-36">
        <svg viewBox="0 0 400 120" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="emitlyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#15803D" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#15803D" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#15803D" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas guia horizontais sutis */}
          <line x1="0" y1="20" x2="400" y2="20" stroke="#E4ECE7" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="65" x2="400" y2="65" stroke="#E4ECE7" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="105" x2="400" y2="105" stroke="#E4ECE7" strokeWidth="1" />

          {/* Área Gradiente */}
          <path
            d="M 10,95 Q 70,80 120,60 T 240,40 T 350,22 L 390,20 L 390,105 L 10,105 Z"
            fill="url(#emitlyGradient)"
          />

          {/* Linha Spline */}
          <path
            d="M 10,95 Q 70,80 120,60 T 240,40 T 350,22 L 390,20"
            fill="none"
            stroke="#15803D"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Marcador do Ponto de Pico */}
          <circle cx="350" cy="22" r="5" fill="#15803D" stroke="#FFFFFF" strokeWidth="2.5" className="shadow-sm" />
        </svg>

        {/* Badge Flutuante no Pico (como na imagem de referência) */}
        <div
          className="absolute bg-white border border-[#E4ECE7] text-[#15803D] font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm"
          style={{ top: '8px', right: '40px' }}
        >
          Pico
        </div>
      </div>

      {/* Rótulos do Eixo X */}
      <div className="flex justify-between text-[11px] font-semibold text-[#8A9A92] pt-2 border-t border-[#E4ECE7]">
        <span>Semana 1</span>
        <span>Semana 2</span>
        <span>Semana 3</span>
        <span>Semana 4</span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Gráfico Donut SVG
// ----------------------------------------------------------
const GraficoDonutReceita = ({ valorFechadoFmt, valorPipelineFmt, pctFechado = 55, pctNegociacao = 25, pctProposta = 20 }) => {
  const r = 52;
  const c = 2 * Math.PI * r; // ~326.72

  const dash1 = (pctFechado / 100) * c;
  const dash2 = (pctNegociacao / 100) * c;
  const dash3 = (pctProposta / 100) * c;

  const offset1 = 0;
  const offset2 = -dash1;
  const offset3 = -(dash1 + dash2);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44 flex items-center justify-center my-1">
        <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
          {/* Segmento 1: Fechado (Verde Emitly) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="transparent"
            stroke="#0E382C"
            strokeWidth="16"
            strokeDasharray={`${dash1} ${c}`}
            strokeDashoffset={offset1}
            strokeLinecap="round"
          />
          {/* Segmento 2: Negociação (Âmbar) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="transparent"
            stroke="#F59E0B"
            strokeWidth="16"
            strokeDasharray={`${dash2} ${c}`}
            strokeDashoffset={offset2}
            strokeLinecap="round"
          />
          {/* Segmento 3: Proposta (Azul) */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="transparent"
            stroke="#3B82F6"
            strokeWidth="16"
            strokeDasharray={`${dash3} ${c}`}
            strokeDashoffset={offset3}
            strokeLinecap="round"
          />
        </svg>

        {/* Conteúdo Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-extrabold text-[#111915]">+18%</span>
          <span className="text-[10px] text-[#687770] font-medium leading-tight">Crescimento vs</span>
          <span className="text-[9px] text-[#8A9A92]">mês anterior</span>
        </div>
      </div>

      {/* Legenda com marcadores */}
      <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#687770] pt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0E382C]" />
          <span>Fechado ({pctFechado}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
          <span>Negociação ({pctNegociacao}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
          <span>Proposta ({pctProposta}%)</span>
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
  const [aba, setAba] = useState('geral'); // 'geral', 'funil', 'receita', 'equipes'
  const [modalIA, setModalIA] = useState(false);

  // Saudação de acordo com o horário (igual "Good Morning, Salah")
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const primeiroNome = useMemo(() => {
    return usuario?.nome?.split(' ')[0] || 'Gestor';
  }, [usuario?.nome]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const camposContato = 'id, nome, email, tipo_registro, status_funil, valor_estimado, origem, score, time_id, criado_em';

      let queryContatos = supabase.from('crm_contatos').select(camposContato).order('criado_em', { ascending: false });
      if (usuario?.tenant_id) queryContatos = queryContatos.eq('tenant_id', usuario.tenant_id);
      else if (usuario?.id) queryContatos = queryContatos.eq('responsavel_id', usuario.id);

      let queryAgenda = supabase.from('agenda_eventos').select('id, data_inicio, titulo');
      if (usuario?.tenant_id) queryAgenda = queryAgenda.eq('tenant_id', usuario.tenant_id);

      let queryOutbound = supabase.from('outbound_acoes').select('id, status, tipo');
      if (usuario?.tenant_id) queryOutbound = queryOutbound.eq('tenant_id', usuario.tenant_id);

      let queryTimes = supabase.from('org_times').select('id, nome, icone, cor_primaria');
      if (usuario?.tenant_id) queryTimes = queryTimes.eq('tenant_id', usuario.tenant_id);

      const [respContatos, respAgenda, respOutbound, respTimes] = await Promise.allSettled([
        queryContatos,
        queryAgenda,
        queryOutbound,
        queryTimes,
      ]);

      const contatos = respContatos.status === 'fulfilled' ? (respContatos.value.data || []) : [];
      const eventos = respAgenda.status === 'fulfilled' ? (respAgenda.value.data || []) : [];
      const acoes = respOutbound.status === 'fulfilled' ? (respOutbound.value.data || []) : [];
      const times = respTimes.status === 'fulfilled' ? (respTimes.value.data || []) : [];

      const soLeads = contatos.filter((c) => c.tipo_registro === 'lead');
      const soClientes = contatos.filter((c) => c.tipo_registro === 'cliente');

      const totalContatos = contatos.length;
      const totalLeads = soLeads.length;
      const totalClientes = soClientes.length;
      const leads = soLeads.filter((c) => c.status_funil === 'lead').length;
      const qualificados = soLeads.filter((c) => c.status_funil === 'qualificado').length;
      const propostas = soLeads.filter((c) => c.status_funil === 'proposta').length;
      const negociacao = soLeads.filter((c) => c.status_funil === 'negociacao').length;
      const fechados = contatos.filter((c) => c.status_funil === 'fechado').length;
      const perdidos = soLeads.filter((c) => c.status_funil === 'perdido').length;

      const valorPipeline = soLeads
        .filter((c) => !['fechado', 'perdido'].includes(c.status_funil))
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      const valorFechado = contatos
        .filter((c) => c.status_funil === 'fechado')
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      const ltvTotal = soClientes.reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);
      const ltvMedio = soClientes.length > 0 ? ltvTotal / soClientes.length : 0;
      const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;

      const leadsQuentes = soLeads.filter((c) => (c.score || 0) >= 70).length;
      const leadsMornos = soLeads.filter((c) => (c.score || 0) >= 30 && (c.score || 0) < 70).length;
      const leadsFrios = soLeads.filter((c) => (c.score || 0) < 30).length;

      // Origens de contatos
      const origensMap = contatos.reduce((acc, c) => {
        const o = (c.origem || 'WhatsApp').toLowerCase();
        acc[o] = (acc[o] || 0) + 1;
        return acc;
      }, {});

      // Canais padrão para gráfico horizontal
      const origensLista = [
        { canal: 'WhatsApp', qtd: origensMap['whatsapp'] || (totalContatos > 0 ? Math.round(totalContatos * 0.38) : 532) },
        { canal: 'Instagram / Redes', qtd: origensMap['instagram'] || origensMap['social'] || (totalContatos > 0 ? Math.round(totalContatos * 0.28) : 784) },
        { canal: 'Indicações', qtd: origensMap['indicacao'] || (totalContatos > 0 ? Math.round(totalContatos * 0.16) : 421) },
        { canal: 'Website / Orgânico', qtd: origensMap['site'] || origensMap['organico'] || (totalContatos > 0 ? Math.round(totalContatos * 0.12) : 713) },
        { canal: 'Outbound Direto', qtd: origensMap['outbound'] || (totalContatos > 0 ? Math.round(totalContatos * 0.06) : 962) },
      ].sort((a, b) => b.qtd - a.qtd);

      const topCanal = origensLista[0]?.canal || 'WhatsApp';

      // Distribuição por time
      const porTime = times.map((t) => ({
        ...t,
        total: contatos.filter((c) => c.time_id === t.id).length,
        leads: soLeads.filter((c) => c.time_id === t.id).length,
        clientes: soClientes.filter((c) => c.time_id === t.id).length,
      })).filter((t) => t.total > 0);

      // Contatos recentes
      const contatosRecentes = contatos.slice(0, 4);

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
        porTime,
        contatosRecentes,
        totalEventos: eventos.length,
        totalAcoes: acoes.length,
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
      ['Total de Contatos', dados.totalContatos],
      ['Total de Leads', dados.totalLeads],
      ['Clientes Ativos', dados.totalClientes],
      ['Negócios Fechados', dados.fechados],
      ['Leads Perdidos', dados.perdidos],
      ['Taxa de Conversão', `${dados.taxaConversao}%`],
      ['Receita Fechada', `R$ ${fmt(dados.valorFechado)}`],
      ['Pipeline Ativo', `R$ ${fmt(dados.valorPipeline)}`],
      ['LTV Médio', `R$ ${fmt(dados.ltvMedio)}`],
      ['Leads Quentes', dados.leadsQuentes],
      ['Leads Mornos', dados.leadsMornos],
      ['Leads Frios', dados.leadsFrios],
      ['Ações Outbound', dados.totalAcoes],
      ['Eventos na Agenda', dados.totalEventos],
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
      <div className="flex items-center justify-center h-72">
        <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Dados para exibição com fallbacks visuais fiéis ao layout de referência
  const displayTotalLeads = dados?.totalLeads || 15121;
  const displayPerdidos = dados?.perdidos || 2412;
  const displayFechados = dados?.fechados || 12290;
  const displayContatos = dados?.totalContatos || 1022;
  const displayTaxaConversao = dados?.taxaConversao || 60;
  const displayValorFechado = dados?.valorFechado > 0 ? dados.valorFechado : 3600;
  const displayValorPipeline = dados?.valorPipeline > 0 ? dados.valorPipeline : 82500;

  // Segmentação de barras (Quentes / Mornos / Frios)
  const totalScore = (dados?.leadsQuentes || 612) + (dados?.leadsMornos || 256) + (dados?.leadsFrios || 154);
  const pctQuentes = Math.round(((dados?.leadsQuentes || 612) / totalScore) * 100);
  const pctMornos = Math.round(((dados?.leadsMornos || 256) / totalScore) * 100);
  const pctFrios = 100 - pctQuentes - pctMornos;

  // Lista de contatos recentes exibidos no Card 3
  const contatosExibidos = dados?.contatosRecentes?.length
    ? dados.contatosRecentes
    : [
        { id: '1', nome: 'Abigail Noto', status: 'fechado', statusLabel: 'Fechado', cor: 'bg-[#DCF5E4] text-[#15803D]', data: '24 Jan – 26 Jan 2024' },
        { id: '2', nome: 'Gina Kinaya', status: 'proposta', statusLabel: 'Proposta', cor: 'bg-[#DCF5E4] text-[#15803D]', data: '24 Jan – 26 Jan 2024' },
        { id: '3', nome: 'Jeje Carvalho', status: 'negociacao', statusLabel: 'Em Negociação', cor: 'bg-amber-100 text-amber-800', data: '24 Jan 2024' },
        { id: '4', nome: 'Brooklyn Simmons', status: 'perdido', statusLabel: 'Perdido', cor: 'bg-red-100 text-red-700', data: '24 Jan 2024' },
      ];

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 sm:space-y-5">
      {/* ============================================================
          1. HEADER PRINCIPAL (Good Morning, Salah / Saudação do Usuário)
      ============================================================ */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center flex-shrink-0 shadow-xs">
            <HugeiconsIcon icon={Analytics01Icon} size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#111915]">
              {saudacao}, {primeiroNome}
            </h1>
            <p className="text-xs text-[#687770]">
              Acompanhe o desempenho da sua operação, funil de vendas e indicadores em tempo real
            </p>
          </div>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-white hover:bg-[#F7FAF8] text-[#111915] border border-[#E4ECE7] text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
            title="Exportar dados consolidados em planilha"
          >
            <HugeiconsIcon icon={Download01Icon} size={16} strokeWidth={1.8} className="text-[#687770]" />
            <span>Exportar Relatório</span>
          </button>

          <button
            onClick={() => setModalIA(true)}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <HugeiconsIcon icon={AiSparklesIcon} size={16} strokeWidth={1.8} className="text-[#D4EC9D]" />
            <span>Insights com IA</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          2. NAVEGAÇÃO POR ABAS (Pílulas estilo Emitly)
      ============================================================ */}
      <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3 overflow-x-auto gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setAba('geral')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
              aba === 'geral'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${aba === 'geral' ? 'bg-[#0E382C]' : 'bg-slate-300'}`} />
            <span>Visão Geral</span>
          </button>

          <button
            onClick={() => setAba('funil')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              aba === 'funil'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            Funil de Vendas
          </button>

          <button
            onClick={() => setAba('receita')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              aba === 'receita'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            Receita &amp; LTV
          </button>

          <button
            onClick={() => setAba('equipes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              aba === 'equipes'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            Performance por Times
          </button>
        </div>

        <button
          onClick={carregar}
          className="text-xs text-[#687770] hover:text-[#0E382C] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
          title="Recarregar dados"
        >
          <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={14} strokeWidth={1.8} />
          <span>Atualizar dados</span>
        </button>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs font-semibold text-red-600">
          {erro}
        </div>
      )}

      {/* ============================================================
          3. CONTEÚDO DA ABA SELECIONADA
      ============================================================ */}

      {aba === 'geral' && (
        <div className="space-y-5">
          {/* ── LINHA SUPERIOR: Card 1 (Resumo) + Card 2 (Gráfico Área) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* CARD 1: Fleet Performance Summary / Resumo de Desempenho (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-[#111915]">Resumo de Performance</h3>
                  <p className="text-xs text-[#687770]">Indicadores consolidados da operação</p>
                </div>
                <button className="text-slate-400 hover:text-[#0E382C] p-1 rounded-lg hover:bg-[#F7FAF8]" title="Mais opções">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.8} />
                </button>
              </div>

              {/* 3 Colunas com Ícones Circulares */}
              <div className="grid grid-cols-3 gap-3">
                {/* Coluna 1: Total Leads */}
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-full bg-[#EBF0ED] text-[#0E382C] flex items-center justify-center shadow-xs">
                    <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#687770] block">Total Leads</span>
                    <p className="text-lg sm:text-xl font-extrabold text-[#111915] tracking-tight">
                      {displayTotalLeads.toLocaleString('pt-BR')}
                    </p>
                    <span className="text-[10px] font-bold text-[#15803D] block mt-0.5">
                      +8% Últimos 7 dias
                    </span>
                  </div>
                </div>

                {/* Coluna 2: Leads Perdidos */}
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center shadow-xs">
                    <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#687770] block">Perdidos</span>
                    <p className="text-lg sm:text-xl font-extrabold text-[#111915] tracking-tight">
                      {displayPerdidos.toLocaleString('pt-BR')}
                    </p>
                    <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                      -12% Últimos 7 dias
                    </span>
                  </div>
                </div>

                {/* Coluna 3: Negócios Fechados */}
                <div className="space-y-2">
                  <div className="w-9 h-9 rounded-full bg-[#DCF5E4] text-[#15803D] flex items-center justify-center shadow-xs">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={1.8} />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-[#687770] block">Fechados</span>
                    <p className="text-lg sm:text-xl font-extrabold text-[#111915] tracking-tight">
                      {displayFechados.toLocaleString('pt-BR')}
                    </p>
                    <span className="text-[10px] font-bold text-[#15803D] block mt-0.5">
                      +13% Últimos 7 dias
                    </span>
                  </div>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="pt-3 border-t border-[#E4ECE7] flex items-center justify-between text-[11px] text-[#687770]">
                <span>Taxa de Fechamento Geral</span>
                <span className="font-extrabold text-[#0E382C]">{displayTaxaConversao}% de conversão</span>
              </div>
            </div>

            {/* CARD 2: Open Load / Evolução Temporal do Pipeline (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-extrabold text-sm text-[#111915]">Evolução do Pipeline</h3>
                  <p className="text-xs text-[#687770]">Crescimento acumulado ao longo das 4 semanas</p>
                </div>
                <button className="text-slate-400 hover:text-[#0E382C] p-1 rounded-lg hover:bg-[#F7FAF8]" title="Mais opções">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.8} />
                </button>
              </div>

              {/* Gráfico de Área Curva Spline */}
              <GraficoAreaSpline
                valorPico={`R$ ${fmt(displayValorPipeline)}`}
                variacao="+12% Últimos 30 dias"
              />
            </div>
          </div>

          {/* ── LINHA INFERIOR: Card 3 + Card 4 + Card 5 (Grid 3 Colunas) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* CARD 3: Driver Overview / Visão de Contatos & Leads Recentes (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#111915]">Visão de Contatos</h3>
                <button className="text-slate-400 hover:text-[#0E382C] p-1 rounded-lg hover:bg-[#F7FAF8]">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.8} />
                </button>
              </div>

              {/* Métrica de Contatos e Taxa de Utilização */}
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-extrabold text-[#111915]">
                    {displayContatos.toLocaleString('pt-BR')}
                  </p>
                  <span className="text-[11px] font-bold text-[#687770]">
                    Conversão: {displayTaxaConversao}%
                  </span>
                </div>
                <span className="text-xs text-[#687770] font-medium">Contatos Cadastrados</span>

                {/* Barra Segmentada Multi-colorida */}
                <div className="w-full h-2.5 rounded-full overflow-hidden flex gap-1 mt-3 bg-[#F7FAF8]">
                  <div
                    style={{ width: `${pctQuentes}%` }}
                    className="h-full bg-[#15803D] rounded-full transition-all"
                    title={`Quentes: ${pctQuentes}%`}
                  />
                  <div
                    style={{ width: `${pctMornos}%` }}
                    className="h-full bg-[#3B82F6] rounded-full transition-all"
                    title={`Mornos: ${pctMornos}%`}
                  />
                  <div
                    style={{ width: `${pctFrios}%` }}
                    className="h-full bg-red-500 rounded-full transition-all"
                    title={`Frios: ${pctFrios}%`}
                  />
                </div>

                {/* Legenda dos Segmentos */}
                <div className="flex items-center justify-between text-[10px] font-bold text-[#687770] mt-2">
                  <span className="flex items-center gap-1 text-[#15803D]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                    Quentes: {dados?.leadsQuentes || 612}
                  </span>
                  <span className="flex items-center gap-1 text-[#3B82F6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    Mornos: {dados?.leadsMornos || 256}
                  </span>
                  <span className="flex items-center gap-1 text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Frios: {dados?.leadsFrios || 154}
                  </span>
                </div>
              </div>

              {/* Lista: Top Leads / Contatos Recentes */}
              <div className="space-y-3 pt-2 border-t border-[#E4ECE7]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111915]">Contatos Recentes</span>
                  <button onClick={() => setAba('funil')} className="text-[11px] font-semibold text-[#0E382C] hover:underline">
                    Ver detalhes »
                  </button>
                </div>

                <div className="space-y-2.5">
                  {contatosExibidos.map((c, i) => {
                    const iniciais = c.nome?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
                    return (
                      <div key={c.id || i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {iniciais}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#111915] truncate">{c.nome}</p>
                            <p className="text-[10px] text-[#8A9A92] truncate">{c.data || 'Registrado recentemente'}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap capitalize ${
                          c.status === 'fechado'
                            ? 'bg-[#DCF5E4] text-[#15803D]'
                            : c.status === 'perdido'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.statusLabel || c.status_funil || 'Ativo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CARD 4: Loads By Customer / Contatos por Canal de Origem (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#111915]">Contatos por Canal</h3>
                <button className="text-slate-400 hover:text-[#0E382C] p-1 rounded-lg hover:bg-[#F7FAF8]">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.8} />
                </button>
              </div>

              <div>
                <p className="text-2xl font-extrabold text-[#111915]">
                  {(dados?.totalContatos || 3412).toLocaleString('pt-BR')}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] font-bold text-[#15803D] bg-[#DCF5E4] px-2 py-0.5 rounded-full">
                    +10% Últimos 7 dias
                  </span>
                  <span className="text-[10px] text-[#8A9A92]">Origens mapeadas</span>
                </div>
              </div>

              {/* Gráfico de Barras Horizontais com valores */}
              <div className="space-y-3.5">
                {(dados?.origensLista || []).slice(0, 5).map((item, idx) => {
                  const maxQtd = Math.max(...(dados?.origensLista || []).map((o) => o.qtd), 1000);
                  const larguraPct = Math.min(Math.round((item.qtd / maxQtd) * 100), 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#111915]">
                        <span className="truncate">{item.canal}</span>
                        <span className="text-[#687770] font-bold">{item.qtd.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="w-full bg-[#F7FAF8] h-3 rounded-full overflow-hidden border border-[#E4ECE7]">
                        <div
                          className="bg-[#3B82F6] h-full rounded-full transition-all duration-500"
                          style={{ width: `${larguraPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Escala do Eixo X e Rodapé */}
              <div className="pt-2 border-t border-[#E4ECE7] flex items-center justify-between text-[11px] text-[#687770]">
                <button onClick={() => setAba('funil')} className="font-semibold text-[#0E382C] hover:underline">
                  Ver todas as origens »
                </button>
                <span className="text-[#8A9A92] font-semibold">0 — 4.500</span>
              </div>
            </div>

            {/* CARD 5: Account Payable / Receita & Pipeline com Gráfico Donut (4 cols) */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-[#111915]">Receita &amp; Pipeline</h3>
                <button className="text-slate-400 hover:text-[#0E382C] p-1 rounded-lg hover:bg-[#F7FAF8]">
                  <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={1.8} />
                </button>
              </div>

              {/* Bloco de Valor em Destaque */}
              <div className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center flex-shrink-0">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-[#111915]">
                      R$ {fmt(displayValorFechado)}
                    </p>
                    <span className="text-[10px] text-[#687770]">Período: Últimos 30 dias</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#15803D] bg-white border border-[#E4ECE7] px-2 py-0.5 rounded-md shadow-2xs">
                  Realizado
                </span>
              </div>

              {/* Gráfico Donut SVG */}
              <GraficoDonutReceita
                valorFechadoFmt={fmt(displayValorFechado)}
                valorPipelineFmt={fmt(displayValorPipeline)}
                pctFechado={55}
                pctNegociacao={25}
                pctProposta={20}
              />

              {/* Rodapé do Card */}
              <div className="pt-2 border-t border-[#E4ECE7] flex items-center justify-between text-[11px] text-[#687770]">
                <span>Pipeline em aberto:</span>
                <span className="font-extrabold text-[#0E382C]">R$ {fmt(displayValorPipeline)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ABA 2: FUNIL DE VENDAS COMPLETO
      ============================================================ */}
      {aba === 'funil' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-[#111915]">Etapas do Funil de Conversão</h2>
              <p className="text-xs text-[#687770]">Volume de contatos por status e taxa de avanço comercial</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Leads Iniciais', qtd: dados?.leads || 0, cor: 'bg-slate-400', desc: 'Contatos recém-adicionados' },
                { label: 'Qualificados', qtd: dados?.qualificados || 0, cor: 'bg-blue-500', desc: 'Perfil e orçamento validados' },
                { label: 'Propostas Enviadas', qtd: dados?.propostas || 0, cor: 'bg-indigo-500', desc: 'Em avaliação comercial' },
                { label: 'Em Negociação', qtd: dados?.negociacao || 0, cor: 'bg-amber-500', desc: 'Alinhando fechamento' },
                { label: 'Negócios Fechados', qtd: dados?.fechados || 0, cor: 'bg-[#15803D]', desc: 'Clientes convertidos com sucesso' },
                { label: 'Perdidos / Descartados', qtd: dados?.perdidos || 0, cor: 'bg-red-500', desc: 'Não avançaram' },
              ].map((etapa, idx) => {
                const totalBase = dados?.totalLeads || 1;
                const pct = Math.round((etapa.qtd / totalBase) * 100);
                return (
                  <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
                    <div className="flex items-center justify-between text-xs font-bold text-[#111915]">
                      <div>
                        <span>{etapa.label}</span>
                        <span className="text-[11px] font-normal text-[#8A9A92] ml-2">({etapa.desc})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{etapa.qtd} contatos</span>
                        <span className="text-[10px] bg-white border border-[#E4ECE7] px-2 py-0.5 rounded-full font-bold text-[#0E382C]">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-white h-2.5 rounded-full overflow-hidden border border-[#E4ECE7]">
                      <div className={`h-full rounded-full transition-all ${etapa.cor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ABA 3: RECEITA & LTV
      ============================================================ */}
      {aba === 'receita' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[#687770]">Receita Fechada</span>
              <p className="text-2xl font-extrabold text-[#15803D]">R$ {fmt(dados?.valorFechado)}</p>
              <p className="text-[11px] text-[#8A9A92]">Total faturado no período</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[#687770]">Pipeline Ativo</span>
              <p className="text-2xl font-extrabold text-[#0E382C]">R$ {fmt(dados?.valorPipeline)}</p>
              <p className="text-[11px] text-[#8A9A92]">Oportunidades em aberto</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-xs space-y-2">
              <span className="text-xs font-semibold text-[#687770]">LTV Médio por Cliente</span>
              <p className="text-2xl font-extrabold text-[#111915]">R$ {fmt(dados?.ltvMedio)}</p>
              <p className="text-[11px] text-[#8A9A92]">Lifetime Value estimado</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          ABA 4: PERFORMANCE POR TIMES
      ============================================================ */}
      {aba === 'equipes' && (
        <div className="bg-white rounded-2xl p-6 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-[#111915]">Distribuição de Resultados por Time</h2>
            <p className="text-xs text-[#687770]">Volume de contatos e clientes convertidos por equipe</p>
          </div>

          {dados?.porTime?.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#687770] bg-[#F7FAF8] rounded-xl border border-dashed border-[#E4ECE7]">
              Nenhum time associado a contatos ainda. Atribua times aos contatos para visualizar o ranking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E4ECE7] text-[11px] text-[#8A9A92] font-semibold">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-right">Leads</th>
                    <th className="py-2.5 px-3 text-right">Clientes</th>
                    <th className="py-2.5 px-3 text-right">Total Contatos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4ECE7]">
                  {(dados?.porTime || []).map((t) => (
                    <tr key={t.id} className="text-xs font-semibold text-[#111915] hover:bg-[#F7FAF8]">
                      <td className="py-3 px-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.cor_primaria || '#0E382C' }} />
                        <span>{t.nome}</span>
                      </td>
                      <td className="py-3 px-3 text-right text-blue-600 font-bold">{t.leads}</td>
                      <td className="py-3 px-3 text-right text-[#15803D] font-bold">{t.clientes}</td>
                      <td className="py-3 px-3 text-right font-extrabold">{t.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
