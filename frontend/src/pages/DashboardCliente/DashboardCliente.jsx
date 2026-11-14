// =============================================================
// PRANCHETO.IA - DASHBOARD DO CLIENTE (EMITLY DESIGN SYSTEM)
// Painel Início com Hero KPI Cards (Pastel Yellow/Pink & Sage),
// donut visual, resumo de métricas do negócio e sistema de widgets.
// =============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { saudacao } from '../../lib/saudacao.js';
import { useHomeWidgets } from '../../hooks/useHomeWidgets.js';
import PainelPersonalizarHome from './widgets/PainelPersonalizarHome.jsx';
import WidgetMiniAgenda from './widgets/WidgetMiniAgenda.jsx';
import WidgetMuralAnuncios from './widgets/WidgetMuralAnuncios.jsx';
import WidgetAcessosRapidos from './widgets/WidgetAcessosRapidos.jsx';
import WidgetMinhasTarefas from './widgets/WidgetMinhasTarefas.jsx';
import WidgetLeadsQuentes from './widgets/WidgetLeadsQuentes.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Edit02Icon, DashboardSquare01Icon } from '@hugeicons/core-free-icons';

const BADGE_CARGO = {
  admin:   { label: 'Administrador', bg: 'bg-brand-primary dark:bg-[#2563EB]', text: 'text-white' },
  manager: { label: 'Gerente',       bg: 'bg-blue-100 dark:bg-[#38BDF8]/20 dark:border dark:border-[#38BDF8]/35',  text: 'text-blue-800 dark:text-[#7DD3FC]' },
  member:  { label: 'Membro',        bg: 'bg-[#DCF5E4] dark:bg-[#34D399]/20 dark:border dark:border-[#34D399]/35', text: 'text-[#15803D] dark:text-[#6EE7B7]' },
  viewer:  { label: 'Visualizador',  bg: 'bg-slate-100 dark:bg-slate-700/50 dark:border dark:border-slate-500/40', text: 'text-slate-600 dark:text-slate-200' },
};

const DashboardCliente = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const badgeCargo = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  const prefs = useHomeWidgets();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="w-full flex-1 flex flex-col space-y-3.5 sm:space-y-4">

      {/* Top Banner Header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 sm:gap-4 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111915] tracking-tight truncate">
              {saudacao()}, {primeiroNome}!
            </h1>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${badgeCargo.bg} ${badgeCargo.text}`}>
              {badgeCargo.label}
            </span>
          </div>
          <p className="text-sm text-[#687770] mt-0.5 truncate">
            Aqui está o resumo geral das operações, métricas e tarefas da sua equipe hoje.
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-surface-card border border-surface-border text-brand-primary dark:text-[#7DD3FC] font-semibold text-sm rounded-xl shadow-xs hover:bg-surface-hover transition-all flex-shrink-0 cursor-pointer"
        >
          <HugeiconsIcon icon={Edit02Icon} size={16} strokeWidth={1.8} className="text-brand-primary dark:text-[#7DD3FC]" />
          <span>Personalizar Dashboard</span>
        </button>
      </div>

      {/* KPI Cards Showcase (Emitly Pastel Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 flex-shrink-0">
        
        {/* Card 1: Donut Metric */}
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-4 sm:p-4.5 flex items-center gap-3.5 shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] min-h-[96px]">
          <div className="w-12 h-12 rounded-full donut-visual p-[6px] flex items-center justify-center flex-shrink-0">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#0E382C]">82%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm text-[#687770] font-semibold uppercase tracking-wider block truncate">Capacidade IA</span>
            <div className="text-xl font-bold text-[#111915] mt-0.5">1.920 / 2.500</div>
            <span className="text-[10px] text-[#15803D] bg-[#DCF5E4] px-2 py-0.5 rounded-full font-semibold inline-block mt-1">
              ↑ 14% este mês
            </span>
          </div>
        </div>

        {/* Card 2: Azul Claro Schedule (#D8E8F2) */}
        <div className="bg-brand-accent dark:bg-[#161F33] dark:border dark:border-[#38BDF8]/30 text-brand-primary dark:text-[#F8FAFC] rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xs min-h-[96px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold uppercase tracking-wide opacity-80 dark:opacity-100 dark:text-[#7DD3FC]">Próxima Reunião</span>
            <span className="text-[10px] bg-white/80 dark:bg-[#38BDF8]/20 dark:border dark:border-[#38BDF8]/40 backdrop-blur-xs text-brand-primary dark:text-[#7DD3FC] px-2.5 py-0.5 rounded-full font-bold">14:30</span>
          </div>
          <div className="text-sm font-bold truncate">Alinhamento Design System</div>
          <p className="text-sm opacity-75 dark:opacity-100 dark:text-ink-secondary truncate mt-1">Com Equipe de Produto & IA</p>
        </div>

        {/* Card 3: Roxo & Violeta Highlight (#7338F2 / #A36BF2) */}
        <div className="bg-brand-violet dark:bg-[#1E1B4B] dark:border dark:border-[#818CF8]/35 text-white rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xs min-h-[96px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-white/90 dark:text-[#C4B5FD]">Pipeline CRM</span>
            <span className="text-[10px] bg-brand-purple dark:bg-[#818CF8]/25 dark:border dark:border-[#818CF8]/40 text-white dark:text-[#E0E7FF] px-2.5 py-0.5 rounded-full font-bold">8 Novos</span>
          </div>
          <div className="text-xl font-bold">R$ 48.500,00</div>
          <p className="text-sm text-white/85 dark:text-slate-300 truncate mt-1">Leads qualificados em negociação</p>
        </div>

        {/* Card 4: Azul Escuro Stats (#001769) */}
        <div className="bg-brand-primary dark:bg-[#172554] dark:border dark:border-[#3B82F6]/35 text-white rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between shadow-xs min-h-[96px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-accent dark:text-[#93C5FD]">Projetos Ativos</span>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-violet animate-pulse"></span>
          </div>
          <div className="flex items-end justify-between">
            <div className="text-xl font-bold">12 Projetos</div>
            <button onClick={() => navigate('/projetos')} className="text-sm text-brand-accent dark:text-[#7DD3FC] font-semibold hover:underline flex items-center gap-1">
              <span>Ver todos</span>
              <span>→</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Widgets Grid (Layout de 3 Colunas) */}
      {prefs.carregando ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-[#E4ECE7]">
          <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prefs.widgetsVisiveis.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E4ECE7]">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={40} strokeWidth={1.5} className="text-[#687770] mx-auto mb-2" />
          <p className="font-bold text-[#111915] text-sm mb-1">Nenhum widget visível</p>
          <p className="text-sm text-[#687770] mb-3">Personalize o seu painel adicionando blocos à sua tela inicial.</p>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-[#0E382C] hover:bg-[#07261E] text-white px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all shadow-xs"
          >
            Personalizar Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 flex-1 min-h-0">
          
          {/* Coluna 1: Tarefas de Hoje */}
          <div className="flex flex-col gap-3.5 sm:gap-4 h-full min-h-0">
            {prefs.widgetsVisiveis.some(w => w.slug === 'minhas_tarefas') && (
              <div className="flex-1 min-h-0 flex flex-col">
                <WidgetMinhasTarefas />
              </div>
            )}
            {prefs.widgetsVisiveis.some(w => w.slug === 'leads_quentes') && (
              <div className={prefs.widgetsVisiveis.some(w => w.slug === 'minhas_tarefas') ? 'h-48 flex-shrink-0' : 'flex-1 min-h-0 flex flex-col'}>
                <WidgetLeadsQuentes />
              </div>
            )}
          </div>

          {/* Coluna 2: Próximos Compromissos (Mini Agenda) */}
          <div className="flex flex-col gap-3.5 sm:gap-4 h-full min-h-0">
            {prefs.widgetsVisiveis.some(w => w.slug === 'mini_agenda') && (
              <div className="flex-1 min-h-0 flex flex-col">
                <WidgetMiniAgenda />
              </div>
            )}
          </div>

          {/* Coluna 3: Acessos Rápidos (em cima) e Mural de Anúncios (embaixo) */}
          <div className="flex flex-col gap-3.5 sm:gap-4 h-full min-h-0">
            {prefs.widgetsVisiveis.some(w => w.slug === 'acessos_rapidos') && (
              <div className="flex-shrink-0">
                <WidgetAcessosRapidos />
              </div>
            )}
            {prefs.widgetsVisiveis.some(w => w.slug === 'mural_anuncios') && (
              <div className="flex-1 min-h-0 flex flex-col">
                <WidgetMuralAnuncios />
              </div>
            )}
          </div>

        </div>
      )}

      <PainelPersonalizarHome
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        prefs={prefs}
      />
    </div>
  );
};

export default DashboardCliente;
