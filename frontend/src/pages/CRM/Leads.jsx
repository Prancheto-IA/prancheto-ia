// =============================================================
// PRANCHETO.IA - PIPELINE DE NEGÓCIOS (CRM KANBAN - EMITLY DESIGN SYSTEM)
// Pipeline visual com 5 etapas (Qualificação, Descoberta, Proposta,
// Negociação, Fechamento), drag & drop, filtros e cards enriquecidos.
// Baseado fielmente na especificação visual de Deals Pipeline.
// =============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../../hooks/useCRM.js';
import { supabase } from '../../lib/supabase.js';
import { SelectField } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { AutocompleteReUI9 } from '@/components/reui/c-autocomplete-9';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Settings02Icon,
  Add01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';

// ─── 5 ETAPAS DO PIPELINE EM PORTUGUÊS ─────────────────────────
export const ETAPAS_PIPELINE = [
  {
    key: 'lead',
    titulo: 'Qualificação',
    rotuloPt: 'Qualificação',
    corDot: 'bg-brand-secondary dark:bg-[#38BDF8]',
    corTotal: 'text-brand-secondary dark:text-[#38BDF8]',
    corBg: 'bg-surface dark:bg-[#111827]',
    corBorda: 'border-surface-border dark:border-[#23304D]',
    corBotaoAdd: 'border-brand-accent text-brand-secondary hover:border-brand-secondary/40 hover:bg-brand-accent/40',
    tagPadrao: 'Novo',
    probabilidadePadrao: 30,
  },
  {
    key: 'qualificado',
    titulo: 'Descoberta',
    rotuloPt: 'Descoberta',
    corDot: 'bg-brand-purple dark:bg-[#818CF8]',
    corTotal: 'text-brand-purple dark:text-[#818CF8]',
    corBg: 'bg-[#F5F2FC] dark:bg-[#111827]',
    corBorda: 'border-[#E4DBF7] dark:border-[#23304D]',
    corBotaoAdd: 'border-purple-200 text-brand-purple hover:border-purple-300 hover:bg-purple-50/60',
    tagPadrao: 'Enterprise',
    probabilidadePadrao: 50,
  },
  {
    key: 'proposta',
    titulo: 'Proposta',
    rotuloPt: 'Proposta',
    corDot: 'bg-amber-500 dark:bg-[#FBBF24]',
    corTotal: 'text-amber-700 dark:text-[#FBBF24]',
    corBg: 'bg-[#FAF7EC] dark:bg-[#111827]',
    corBorda: 'border-[#EFE8D3] dark:border-[#23304D]',
    corBotaoAdd: 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50/60',
    tagPadrao: 'Morno',
    probabilidadePadrao: 65,
  },
  {
    key: 'negociacao',
    titulo: 'Negociação',
    rotuloPt: 'Negociação',
    corDot: 'bg-brand-violet dark:bg-[#A78BFA]',
    corTotal: 'text-brand-violet dark:text-[#A78BFA]',
    corBg: 'bg-[#F7F3FD] dark:bg-[#111827]',
    corBorda: 'border-[#EAE0FA] dark:border-[#23304D]',
    corBotaoAdd: 'border-violet-200 text-brand-violet hover:border-violet-300 hover:bg-violet-50/60',
    tagPadrao: 'Ativo',
    probabilidadePadrao: 80,
  },
  {
    key: 'fechado',
    titulo: 'Fechamento',
    rotuloPt: 'Fechamento',
    corDot: 'bg-brand-primary dark:bg-[#34D399]',
    corTotal: 'text-brand-primary dark:text-[#34D399]',
    corBg: 'bg-[#EDF4FA] dark:bg-[#111827]',
    corBorda: 'border-[#D8E8F2] dark:border-[#23304D]',
    corBotaoAdd: 'border-brand-accent text-brand-primary hover:border-brand-secondary/40 hover:bg-brand-accent/50',
    tagPadrao: 'Renovação',
    probabilidadePadrao: 90,
  },
];

// ─── DEALS DEMO EM PORTUGUÊS ───────────────────────────────────
export const DEALS_DEMO = [
  {
    id: 'demo-1',
    nome: 'Módulo de compliance',
    negocio_nome: 'Módulo de compliance',
    empresa: 'Grupo Verado',
    status_funil: 'lead',
    valor_estimado: 118000,
    score: 30,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 41 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 41 * 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    nome: 'Piloto: otimizador de rotas',
    negocio_nome: 'Piloto: otimizador de rotas',
    empresa: 'Transportadora Norte',
    status_funil: 'lead',
    valor_estimado: 42000,
    score: 35,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 33 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 33 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    nome: 'Plano de espaço Studio',
    negocio_nome: 'Plano de espaço Studio',
    empresa: 'Estúdio Cadenza',
    status_funil: 'lead',
    valor_estimado: 19000,
    score: 25,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 48 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 48 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    nome: 'Plataforma de dados clínicos',
    negocio_nome: 'Plataforma de dados clínicos',
    empresa: 'Saúde Meridional',
    status_funil: 'qualificado',
    valor_estimado: 262000,
    score: 45,
    tags: ['Enterprise'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 26 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 26 * 86400000).toISOString(),
  },
  {
    id: 'demo-5',
    nome: 'Sensores de chão de fábrica',
    negocio_nome: 'Sensores de chão de fábrica',
    empresa: 'Sistemas Quartzline',
    status_funil: 'qualificado',
    valor_estimado: 76000,
    score: 55,
    tags: ['Morno'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 18 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'demo-6',
    nome: 'Telemetria de frota',
    negocio_nome: 'Telemetria de frota',
    empresa: 'Transportadora Norte',
    status_funil: 'proposta',
    valor_estimado: 148000,
    score: 65,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 12 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'demo-7',
    nome: 'Migração regional de CRM',
    negocio_nome: 'Migração regional de CRM',
    empresa: 'Halden Marítima',
    status_funil: 'proposta',
    valor_estimado: 204000,
    score: 40,
    tags: ['Enterprise'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 22 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    id: 'demo-8',
    nome: 'Módulo de residência de dados',
    negocio_nome: 'Módulo de residência de dados',
    empresa: 'Saúde Meridional',
    status_funil: 'proposta',
    valor_estimado: 67000,
    score: 50,
    tags: ['Morno'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'demo-9',
    nome: 'Automação de armazém',
    negocio_nome: 'Automação de armazém',
    empresa: 'Varejo Brightpath',
    status_funil: 'negociacao',
    valor_estimado: 91000,
    score: 80,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 5 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-10',
    nome: 'Consolidação de fornecedores',
    negocio_nome: 'Consolidação de fornecedores',
    empresa: 'Varejo Brightpath',
    status_funil: 'negociacao',
    valor_estimado: 158000,
    score: 35,
    tags: ['Novo'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 9 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'demo-11',
    nome: 'Migração para nuvem',
    negocio_nome: 'Migração para nuvem',
    empresa: 'Tecnologia Summit',
    status_funil: 'negociacao',
    valor_estimado: 230000,
    score: 62,
    tags: ['Ativo'],
    responsavel: { nome: 'João Ferreira' },
    criado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-12',
    nome: 'Redesenho de plataforma',
    negocio_nome: 'Redesenho de plataforma',
    empresa: 'Saúde Meridional',
    status_funil: 'negociacao',
    valor_estimado: 89000,
    score: 18,
    tags: ['Revisão'],
    responsavel: { nome: 'Ana Paula' },
    criado_em: new Date(Date.now() - 14 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'demo-13',
    nome: 'Expansão de licenças de análise',
    negocio_nome: 'Expansão de licenças de análise',
    empresa: 'Laboratórios Latchkey',
    status_funil: 'fechado',
    valor_estimado: 34000,
    score: 90,
    tags: ['Renovação'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 2 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-14',
    nome: 'Upgrade de suporte',
    negocio_nome: 'Upgrade de suporte',
    empresa: 'Orbit Analytics',
    status_funil: 'fechado',
    valor_estimado: 28000,
    score: 85,
    tags: ['Renovação'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─── HELPERS DE FORMATAÇÃO E ESTILO ────────────────────────────
export const formatarK = (valor, prefixo = 'R$ ') => {
  if (!valor || isNaN(valor)) return `${prefixo}0`;
  const v = Number(valor);
  if (v >= 1000000) {
    return `${prefixo}${(v / 1000000).toFixed(1).replace('.0', '').replace('.', ',')}M`;
  }
  if (v >= 1000) {
    return `${prefixo}${Math.round(v / 1000)}k`;
  }
  return `${prefixo}${v.toLocaleString('pt-BR')}`;
};

// Mapeamento normalizado de tags inglês/português
const MAPA_TAGS_PT = {
  new: 'Novo',
  novo: 'Novo',
  enterprise: 'Enterprise',
  corporativo: 'Corporativo',
  warm: 'Morno',
  morno: 'Morno',
  active: 'Ativo',
  ativo: 'Ativo',
  renewal: 'Renovação',
  renovacao: 'Renovação',
  'renovação': 'Renovação',
  review: 'Revisão',
  revisao: 'Revisão',
  'revisão': 'Revisão',
};

const obterEstiloTag = (tag) => {
  const t = (tag || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.includes('new') || t.includes('novo') || t.includes('inbound')) {
    return 'bg-brand-accent/70 text-brand-primary border border-brand-secondary/20 dark:bg-[#38BDF8]/20 dark:text-[#7DD3FC] dark:border-[#38BDF8]/35';
  }
  if (t.includes('enterprise') || t.includes('corporativo') || t.includes('indicacao')) {
    return 'bg-[#F5F2FC] text-brand-purple border border-brand-purple/20 dark:bg-[#818CF8]/20 dark:text-[#A5B4FC] dark:border-[#818CF8]/35';
  }
  if (t.includes('warm') || t.includes('morno') || t.includes('evento')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-[#FBBF24]/20 dark:text-[#FCD34D] dark:border-[#FBBF24]/35';
  }
  if (t.includes('active') || t.includes('ativo') || t.includes('negociacao')) {
    return 'bg-[#F7F3FD] text-brand-violet border border-brand-violet/25 dark:bg-[#A78BFA]/20 dark:text-[#C4B5FD] dark:border-[#A78BFA]/35';
  }
  if (t.includes('renewal') || t.includes('renovacao') || t.includes('recorrente') || t.includes('saas')) {
    return 'bg-brand-accent text-brand-secondary border border-brand-secondary/25 dark:bg-[#34D399]/20 dark:text-[#6EE7B7] dark:border-[#34D399]/35';
  }
  if (t.includes('review') || t.includes('revisao') || t.includes('proposta')) {
    return 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-500/20 dark:text-[#FDA4AF] dark:border-rose-500/35';
  }
  return 'bg-surface-subtle text-ink-secondary border border-surface-border dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600/50';
};

const formatarTagTexto = (lead, etapa) => {
  let tag = '';
  if (Array.isArray(lead?.tags) && lead.tags.length > 0) {
    tag = String(lead.tags[0]);
  } else if (typeof lead?.tags === 'string' && lead.tags.trim()) {
    try {
      const parsed = JSON.parse(lead.tags);
      if (Array.isArray(parsed) && parsed.length > 0) {
        tag = String(parsed[0]);
      } else {
        tag = lead.tags;
      }
    } catch {
      tag = lead.tags;
    }
  } else {
    tag = etapa?.tagPadrao || 'Novo';
  }
  const limpo = tag.toLowerCase().trim();
  if (MAPA_TAGS_PT[limpo]) {
    return MAPA_TAGS_PT[limpo];
  }
  return tag.charAt(0).toUpperCase() + tag.slice(1);
};

const extrairIniciais = (deal) => {
  const nome = deal?.responsavel?.nome || deal?.nome || 'CS';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const diasNaEtapa = (isoData) => {
  if (!isoData) return '2d na etapa';
  const diff = Date.now() - new Date(isoData).getTime();
  const dias = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return `${dias}d na etapa`;
};

// ─── COMPONENTE: CARD DO NEGÓCIO (KANBAN) ──────────────────────
const CardDeal = ({ deal, etapa, onAbrir, onDragStart, onDragEnd }) => {
  const tagTexto = formatarTagTexto(deal, etapa);
  const tagClasse = obterEstiloTag(tagTexto);
  const iniciais = extrairIniciais(deal);
  const valorFormatado = formatarK(deal.valor_estimado);
  const probabilidade = Math.min(100, Math.max(10, deal.score || etapa?.probabilidadePadrao || 50));
  const tempoEtapa = diasNaEtapa(deal.atualizado_em || deal.criado_em);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onDragEnd={onDragEnd}
      onClick={() => onAbrir(deal)}
      className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-[0_2px_8px_-2px_rgba(0,23,105,0.04)] hover:shadow-md hover:border-surface-border-strong transition-all cursor-grab active:cursor-grabbing select-none group space-y-2.5"
    >
      {/* Topo: Título do Negócio e Badge de Categoria */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm sm:text-[13px] font-bold text-ink-primary leading-snug group-hover:text-brand-secondary transition-colors truncate flex-1 tracking-tight">
            {deal.negocio_nome || deal.nome}
          </h4>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${tagClasse}`}>
            {tagTexto}
          </span>
        </div>
        <p className="text-sm text-ink-secondary font-medium mt-0.5 truncate">
          {deal.empresa || deal.nome}
        </p>
      </div>

      {/* Meio: Valor em destaque e Barra de Probabilidade */}
      <div className="pt-0.5">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-base sm:text-lg font-bold text-ink-primary tracking-tight">
            {valorFormatado}
          </span>
          <span className="text-sm font-semibold text-ink-secondary">
            {probabilidade}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-brand-secondary transition-all duration-300"
            style={{ width: `${probabilidade}%` }}
          />
        </div>
      </div>

      {/* Rodapé: Avatar e Tempo na Etapa */}
      <div className="flex items-center justify-between pt-1">
        <div
          className="w-6 h-6 rounded-full bg-brand-accent text-brand-primary border border-brand-secondary/15 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs"
          title={deal.responsavel?.nome || deal.nome}
        >
          {iniciais}
        </div>
        <span className="text-[11px] text-ink-secondary font-medium">
          {tempoEtapa}
        </span>
      </div>
    </div>
  );
};

// ─── COMPONENTE: COLUNA DO PIPELINE ────────────────────────────
const ColunaPipeline = ({
  etapa,
  deals,
  onAbrir,
  onNovoDealEtapa,
  onConfigurarColuna,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
}) => {
  const [modoBusca, setModoBusca] = useState(false);
  const [buscaColuna, setBuscaColuna] = useState('');
  const inputBuscaRef = useRef(null);

  // Foca no input quando a busca na coluna é ativada
  useEffect(() => {
    if (modoBusca) {
      inputBuscaRef.current?.focus();
    }
  }, [modoBusca]);

  const totalValor = deals.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);
  const totalFormatado = formatarK(totalValor);

  // Filtragem interna da coluna quando a busca estiver ativa
  const dealsExibidos = useMemo(() => {
    if (!buscaColuna.trim()) return deals;
    const q = buscaColuna.toLowerCase();
    return deals.filter(d =>
      (d.negocio_nome || '').toLowerCase().includes(q) ||
      (d.nome || '').toLowerCase().includes(q) ||
      (d.empresa || '').toLowerCase().includes(q)
    );
  }, [deals, buscaColuna]);

  return (
    <div
      onDragOver={(e) => onDragOver(e, etapa.key)}
      onDragLeave={(e) => onDragLeave(e, etapa.key)}
      onDrop={(e) => onDrop(e, etapa.key)}
      className={`w-72 sm:w-80 flex-shrink-0 h-full max-h-full flex flex-col rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-200 ${etapa.corBg} border ${
        isDragOver ? 'ring-2 ring-brand-secondary border-brand-secondary scale-[1.01]' : etapa.corBorda
      } group/coluna relative`}
    >
      {/* Header da Coluna */}
      <div className="px-1 pt-1 pb-3 flex items-center justify-between min-h-[36px] flex-shrink-0">
        {modoBusca ? (
          /* Modo Busca Ativo: Substitui cabeçalho e botões por barra de pesquisa */
          <div className="flex items-center gap-1.5 w-full bg-surface-card border border-surface-border rounded-xl px-2.5 py-1.5 shadow-2xs transition-all duration-300">
            <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.8} className="text-ink-muted shrink-0" />
            <input
              ref={inputBuscaRef}
              type="text"
              value={buscaColuna}
              onChange={(e) => setBuscaColuna(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setBuscaColuna('');
                  setModoBusca(false);
                }
              }}
              placeholder={`Pesquisar em ${etapa.titulo}...`}
              className="w-full bg-transparent text-sm text-ink-primary placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setBuscaColuna('');
                setModoBusca(false);
              }}
              className="text-ink-muted hover:text-ink-primary text-sm p-0.5 rounded-md shrink-0"
              title="Fechar pesquisa"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Modo Padrão: Titulo [quantidade] valor_total à esquerda | Ações à direita */
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            {/* Lado Esquerdo: Dot + Nome da coluna [2] R$ 242k */}
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${etapa.corDot || 'bg-brand-secondary'}`} />
              <h3 className="font-bold text-sm text-ink-primary truncate tracking-tight">
                {etapa.titulo}
              </h3>
              <span className="w-5 h-5 min-w-[20px] rounded-md bg-surface-card border border-surface-border text-ink-primary flex items-center justify-center text-[11px] font-semibold shadow-2xs shrink-0">
                {deals.length}
              </span>
              <span className={`text-sm font-bold shrink-0 ${etapa.corTotal}`}>
                {totalFormatado}
              </span>
            </div>

            {/* Lado Direito: Engrenagem (hover), + (adicionar negócio), Lupa (pesquisar) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 1. Botão de Engrenagem (visível apenas ao posicionar o mouse na coluna) */}
              <button
                type="button"
                onClick={() => onConfigurarColuna(etapa)}
                className="opacity-0 group-hover/coluna:opacity-100 transition-opacity p-1.5 text-ink-secondary hover:text-brand-primary hover:bg-white/80 dark:hover:bg-surface-hover rounded-lg"
                title="Configurações da coluna"
              >
                <HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={1.8} />
              </button>

              {/* 2. Botão de + para adicionar novo negócio na coluna */}
              <button
                type="button"
                onClick={() => onNovoDealEtapa(etapa.key)}
                className={`p-1.5 ${etapa.corTotal} hover:bg-white/90 dark:hover:bg-surface-hover rounded-lg transition-all hover:shadow-2xs active:scale-95`}
                title="Adicionar negócio nesta coluna"
              >
                <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.2} />
              </button>

              {/* 3. Botão de Lupa para pesquisar negócio na coluna */}
              <button
                type="button"
                onClick={() => setModoBusca(true)}
                className="p-1.5 text-ink-secondary hover:text-brand-primary hover:bg-white/80 dark:hover:bg-surface-hover rounded-lg transition-colors"
                title="Pesquisar negócios nesta coluna"
              >
                <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Cards com scroll vertical interno sem barra visível */}
      <div className="space-y-3 flex-1 overflow-y-auto overflow-x-hidden min-h-0 pr-0.5 no-scrollbar">
        {dealsExibidos.map((deal) => (
          <CardDeal
            key={deal.id}
            deal={deal}
            etapa={etapa}
            onAbrir={onAbrir}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}

        {dealsExibidos.length === 0 && (
          <div className="h-28 rounded-2xl border border-dashed border-surface-border flex items-center justify-center p-3 text-center">
            <p className="text-sm text-ink-secondary font-medium">
              {buscaColuna ? `Nenhum resultado para "${buscaColuna}"` : 'Nenhum negócio nesta etapa'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MODAL: CONFIGURAÇÃO DA COLUNA (ENGRENAGEM) ────────────────
const ModalConfigColuna = ({ aberto, onFechar, etapa, onSalvar }) => {
  const [titulo, setTitulo] = useState('');
  const [probabilidade, setProbabilidade] = useState('');

  useEffect(() => {
    if (etapa) {
      setTitulo(etapa.titulo || '');
      setProbabilidade(etapa.probabilidadePadrao != null ? String(etapa.probabilidadePadrao) : '50');
    }
  }, [etapa, aberto]);

  if (!aberto || !etapa) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSalvar(etapa.key, {
      titulo: titulo.trim(),
      probabilidadePadrao: probabilidade ? Number(probabilidade) : 50,
      limiteWip: null,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onFechar}>
      <div className="bg-surface-card rounded-2xl p-6 w-full max-w-md border border-surface-border shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h3 className="font-bold text-base text-ink-primary">
              Configurações da Coluna
            </h3>
            <p className="text-sm text-ink-secondary">Etapa: {etapa.titulo}</p>
          </div>
          <button onClick={onFechar} className="text-ink-muted hover:text-ink-primary text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-primary mb-1">Nome da Etapa / Coluna</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-primary mb-1">Probabilidade Padrão (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={probabilidade}
              onChange={(e) => setProbabilidade(e.target.value)}
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2 text-sm text-ink-primary focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-ink-secondary bg-surface-subtle hover:bg-surface-hover border border-surface-border transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover shadow-xs transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── HELPERS DE MOEDA (BRL FORMAT: R$ 1.000,00) ───────────────
export const formatarMoedaBRL = (valor) => {
  if (valor === '' || valor == null) return '';
  if (typeof valor === 'number') {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  const apenasDigitos = String(valor).replace(/\D/g, '');
  if (!apenasDigitos) return '';
  const centavos = Number(apenasDigitos) / 100;
  return centavos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const desformatarMoedaBRL = (valorFormatado) => {
  if (!valorFormatado) return null;
  const apenasDigitos = String(valorFormatado).replace(/\D/g, '');
  if (!apenasDigitos) return null;
  return Number(apenasDigitos) / 100;
};

// ─── BASES DE SUGESTÃO PARA CONTATO E EMPRESA ──────────────────
const CONTATOS_SUGERIDOS_PADRAO = [
  { id: 'c-1', nome: 'Derek Souza', email: 'derek@empresa.com', telefone: '(11) 98765-4321' },
  { id: 'c-2', nome: 'Marina Costa', email: 'marina@inovacao.com', telefone: '(21) 97654-3210' },
  { id: 'c-3', nome: 'Guilherme Castro', email: 'guilherme@logistica.com.br', telefone: '(31) 99876-5432' },
  { id: 'c-4', nome: 'Renata Albuquerque', email: 'renata@meridional.med.br', telefone: '(41) 98888-7766' },
  { id: 'c-5', nome: 'Carlos Eduardo', email: 'carlos@quartzline.com', telefone: '(19) 99123-4567' },
];

const EMPRESAS_SUGERIDAS_PADRAO = [
  'FIA',
  'Grupo Verado',
  'Transportadora Norte',
  'Estúdio Cadenza',
  'Saúde Meridional',
  'Sistemas Quartzline',
  'Nexus Soluções Digitais',
  'Vanguard Seguros',
];

// ─── FORM VAZIO PARA CRIAÇÃO/EDIÇÃO DE NEGÓCIO ─────────────────
const FORM_VAZIO = {
  negocio_nome: '',
  valor_formatado: '',
  status_funil: 'lead',
  responsavel_nome: 'Lucas Bastos',
  previsao_fechamento: '',
  observacoes: '',
  contato_nome: '',
  contato_email: '',
  contato_telefone: '',
  empresa: '',
  score: '50',
  tag_categoria: 'Novo',
};

// ─── MODAL: NOVO / EDITAR NEGÓCIO (EMITLY / PRANCHETO DESIGN) ──
const ModalLead = ({
  aberto,
  onFechar,
  onSalvar,
  leadEditando,
  statusInicial = 'lead',
  etapas,
  dealsExistentes = [],
}) => {
  const [form, setForm]                         = useState(FORM_VAZIO);
  const [salvando, setSalvando]                 = useState(false);
  const [erro, setErro]                         = useState('');

  // Estados de Contatos (ReUI Autocomplete + criação inline)
  const [criandoContatoInline, setCriandoContato]     = useState(false);
  const [novoContato, setNovoContato]                 = useState({ nome: '', email: '', telefone: '' });
  const [listaContatos, setListaContatos]             = useState(CONTATOS_SUGERIDOS_PADRAO);

  // Estados de Empresas (ReUI Autocomplete + criação inline)
  const [criandoEmpresaInline, setCriandoEmpresa]     = useState(false);
  const [novaEmpresaNome, setNovaEmpresaNome]         = useState('');
  const [listaEmpresas, setListaEmpresas]             = useState(EMPRESAS_SUGERIDAS_PADRAO);

  // Sincroniza listas de contatos e empresas vindas de deals existentes e do Supabase
  useEffect(() => {
    if (!aberto) return;

    // Extrai contatos dos deals locais
    const contatosMapeados = new Map();
    CONTATOS_SUGERIDOS_PADRAO.forEach(c => contatosMapeados.set(c.nome.toLowerCase(), c));

    dealsExistentes.forEach((d) => {
      const nomeContato = d.nome || (d.responsavel?.nome);
      if (nomeContato && !contatosMapeados.has(nomeContato.toLowerCase())) {
        contatosMapeados.set(nomeContato.toLowerCase(), {
          id: d.id,
          nome: nomeContato,
          email: d.email || '',
          telefone: d.telefone || '',
        });
      }
    });

    // Extrai empresas dos deals locais
    const empresasSet = new Set(EMPRESAS_SUGERIDAS_PADRAO);
    dealsExistentes.forEach((d) => {
      if (d.empresa && typeof d.empresa === 'string') {
        empresasSet.add(d.empresa.trim());
      }
    });

    setListaContatos(Array.from(contatosMapeados.values()));
    setListaEmpresas(Array.from(empresasSet));

    // Busca assíncrona adicional no Supabase se houver conexão
    async function carregarDadosDb() {
      try {
        const { data } = await supabase
          .from('crm_contatos')
          .select('id, nome, email, telefone, empresa')
          .limit(40);

        if (data && data.length > 0) {
          data.forEach((item) => {
            if (item.nome && !contatosMapeados.has(item.nome.toLowerCase())) {
              contatosMapeados.set(item.nome.toLowerCase(), {
                id: item.id,
                nome: item.nome,
                email: item.email || '',
                telefone: item.telefone || '',
              });
            }
            if (item.empresa) empresasSet.add(item.empresa.trim());
          });
          setListaContatos(Array.from(contatosMapeados.values()));
          setListaEmpresas(Array.from(empresasSet));
        }
      } catch (_e) {
        // Fallback silencioso mantendo dados locais
      }
    }

    carregarDadosDb();
  }, [aberto, dealsExistentes]);

  // Carrega dados de edição ou reseta para novo negócio
  useEffect(() => {
    if (leadEditando) {
      const tagInicial = Array.isArray(leadEditando.tags) && leadEditando.tags[0]
        ? (MAPA_TAGS_PT[String(leadEditando.tags[0]).toLowerCase()] || leadEditando.tags[0])
        : 'Novo';

      setForm({
        negocio_nome:        leadEditando.negocio_nome || leadEditando.nome || '',
        valor_formatado:     leadEditando.valor_estimado != null ? formatarMoedaBRL(Number(leadEditando.valor_estimado)) : '',
        status_funil:        leadEditando.status_funil || statusInicial,
        responsavel_nome:    leadEditando.responsavel?.nome || 'Lucas Bastos',
        previsao_fechamento: leadEditando.previsao_fechamento ? leadEditando.previsao_fechamento.slice(0, 10) : '',
        observacoes:         leadEditando.observacoes || '',
        contato_nome:        leadEditando.nome || '',
        contato_email:       leadEditando.email || '',
        contato_telefone:    leadEditando.telefone || '',
        empresa:             leadEditando.empresa || '',
        score:               leadEditando.score != null ? String(leadEditando.score) : '50',
        tag_categoria:       tagInicial,
      });
    } else {
      setForm({
        ...FORM_VAZIO,
        status_funil: statusInicial || 'lead',
      });
    }

    setErro('');
    setCriandoContato(false);
    setCriandoEmpresa(false);
  }, [leadEditando, aberto, statusInicial]);

  // Itens formatados para o componente reui/c-autocomplete-9
  const contatosAutocompleteItems = useMemo(
    () =>
      listaContatos.map((c) => ({
        id: String(c.id || c.nome),
        name: c.nome,
        subtitle: [c.email, c.telefone].filter(Boolean).join(' · ') || 'Contato cadastrado',
        raw: c,
      })),
    [listaContatos]
  );

  const empresasAutocompleteItems = useMemo(
    () =>
      listaEmpresas.map((emp) => ({
        id: emp,
        name: emp,
        subtitle: 'Empresa cadastrada',
      })),
    [listaEmpresas]
  );

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  // Formatação de valor em tempo real
  const handleValorChange = (e) => {
    const raw = e.target.value;
    if (!raw.trim()) {
      setForm(f => ({ ...f, valor_formatado: '' }));
      return;
    }
    const masked = formatarMoedaBRL(raw);
    setForm(f => ({ ...f, valor_formatado: masked }));
  };

  // Ações de seleção de contato
  const selecionarContato = (contato) => {
    setForm(f => ({
      ...f,
      contato_nome: contato.nome,
      contato_email: contato.email || f.contato_email,
      contato_telefone: contato.telefone || f.contato_telefone,
    }));
  };

  const handleSalvarNovoContatoInline = () => {
    if (!novoContato.nome.trim()) return;
    const criado = {
      id: `contato-novo-${Date.now()}`,
      nome: novoContato.nome.trim(),
      email: novoContato.email.trim(),
      telefone: novoContato.telefone.trim(),
    };
    setListaContatos(prev => [criado, ...prev]);
    selecionarContato(criado);
    setNovoContato({ nome: '', email: '', telefone: '' });
    setCriandoContato(false);
  };

  // Ações de seleção de empresa
  const selecionarEmpresa = (empresaNome) => {
    setForm(f => ({ ...f, empresa: empresaNome }));
  };

  const handleSalvarNovaEmpresaInline = () => {
    if (!novaEmpresaNome.trim()) return;
    const nomeNormalizado = novaEmpresaNome.trim();
    setListaEmpresas(prev => [nomeNormalizado, ...prev.filter(e => e.toLowerCase() !== nomeNormalizado.toLowerCase())]);
    selecionarEmpresa(nomeNormalizado);
    setNovaEmpresaNome('');
    setCriandoEmpresa(false);
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.negocio_nome.trim()) {
      setErro('Informe o título do negócio.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      const valorEstimadoNumerico = desformatarMoedaBRL(form.valor_formatado);

      await onSalvar({
        negocio_nome:        form.negocio_nome.trim(),
        nome:                form.contato_nome.trim() || form.negocio_nome.trim(),
        empresa:             form.empresa.trim() || null,
        email:               form.contato_email.trim() || null,
        telefone:            form.contato_telefone.trim() || null,
        valor_estimado:      valorEstimadoNumerico,
        status_funil:        form.status_funil,
        responsavel_nome:    form.responsavel_nome,
        previsao_fechamento: form.previsao_fechamento || null,
        observacoes:         form.observacoes.trim() || null,
        score:               Number(form.score) || 50,
        tags:                [form.tag_categoria || 'Novo'],
      });

      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar oportunidade.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-start justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="bg-surface-card rounded-2xl p-6 sm:p-7 w-full max-w-xl my-auto border border-surface-border shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-5">
          <div>
            <h3 className="font-bold text-lg text-ink-primary tracking-tight">
              {leadEditando ? 'Editar negócio' : 'Adicione um novo negócio'}
            </h3>
            <p className="text-sm text-ink-secondary font-medium mt-0.5">
              Defina os parâmetros do negócio, previsões e contatos vinculados
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="w-8 h-8 rounded-xl border border-surface-border hover:border-surface-border-strong text-ink-secondary hover:text-ink-primary flex items-center justify-center transition-colors text-sm font-semibold shadow-2xs"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Linha 1: Título do Negócio & Valor do negócio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                Título do Negócio <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.negocio_nome}
                onChange={set('negocio_nome')}
                placeholder="Ex: Expansão de infraestrutura"
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                Valor do negócio
              </label>
              <input
                type="text"
                value={form.valor_formatado}
                onChange={handleValorChange}
                placeholder="R$ 1.000,00"
                className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
              />
            </div>
          </div>

          {/* Linha 2: Etapa & Responsável pelo Negócio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">Etapa</label>
              <SelectField
                value={form.status_funil}
                onChange={set('status_funil')}
              >
                {(etapas || ETAPAS_PIPELINE).map(e => (
                  <option key={e.key} value={e.key}>{e.titulo}</option>
                ))}
              </SelectField>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                Responsável pelo Negócio
              </label>
              <SelectField
                value={form.responsavel_nome}
                onChange={set('responsavel_nome')}
              >
                <option value="Lucas Bastos">Lucas Bastos</option>
                <option value="Carlos Silva">Carlos Silva</option>
                <option value="Marina Costa">Marina Costa</option>
                <option value="Diego Alves">Diego Alves</option>
                <option value="João Ferreira">João Ferreira</option>
                <option value="Ana Paula">Ana Paula</option>
              </SelectField>
            </div>
          </div>

          {/* Linha 3: Data de fechamento prevista */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                Data de fechamento prevista
              </label>
              <DatePicker
                value={form.previsao_fechamento}
                onChange={set('previsao_fechamento')}
                placeholder="Selecionar data prevista"
              />
            </div>
          </div>

          {/* Linha 4: Descrição do negócio */}
          <div>
            <label className="block text-sm font-semibold text-ink-primary mb-1.5">
              Descrição do negócio
            </label>
            <textarea
              value={form.observacoes}
              onChange={set('observacoes')}
              maxLength={1000}
              rows={3}
              placeholder="Descreva detalhes, alinhamentos, escopo ou histórico..."
              className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary resize-none"
            />
            <div className="text-right text-[11px] text-ink-secondary font-medium mt-1">
              {form.observacoes.length}/1000
            </div>
          </div>

          {/* Linha 5: Contato (ReUI c-autocomplete-9 + criação inline) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink-primary mb-1.5">Contato</label>
            <AutocompleteReUI9
              items={contatosAutocompleteItems}
              value={form.contato_nome}
              onValueChange={(val) =>
                setForm((f) => ({
                  ...f,
                  contato_nome: val,
                  ...(val === '' ? { contato_email: '', contato_telefone: '' } : {}),
                }))
              }
              onSelectItem={(item) => selecionarContato(item.raw || { nome: item.name })}
              placeholder="Pesquisar ou selecionar contato..."
              entitySingular="contato"
              entityPlural="contatos"
              addLabel="Adicionar um contato"
              onAddClick={(termo) => {
                setNovoContato((n) => ({ ...n, nome: termo || n.nome }));
                setCriandoContato(true);
              }}
            />

            {criandoContatoInline && (
              <div className="p-3.5 space-y-2.5 bg-surface-subtle border border-surface-border rounded-xl">
                <p className="text-sm font-semibold text-ink-primary">Adicionar novo contato</p>
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={novoContato.nome}
                  onChange={(e) => setNovoContato((n) => ({ ...n, nome: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-brand-primary bg-surface-card text-ink-primary"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="E-mail (opcional)"
                    value={novoContato.email}
                    onChange={(e) => setNovoContato((n) => ({ ...n, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-brand-primary bg-surface-card text-ink-primary"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone / WhatsApp (opcional)"
                    value={novoContato.telefone}
                    onChange={(e) => setNovoContato((n) => ({ ...n, telefone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-brand-primary bg-surface-card text-ink-primary"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCriandoContato(false)}
                    className="flex-1 py-1.5 text-sm font-semibold text-ink-secondary bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarNovoContatoInline}
                    className="flex-1 py-1.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Linha 6: Empresa (ReUI c-autocomplete-9 + criação inline) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-ink-primary mb-1.5">Empresa</label>
            <AutocompleteReUI9
              items={empresasAutocompleteItems}
              value={form.empresa}
              onValueChange={(val) => setForm((f) => ({ ...f, empresa: val }))}
              onSelectItem={(item) => selecionarEmpresa(item.name)}
              placeholder="Pesquisar ou selecionar empresa..."
              entitySingular="empresa"
              entityPlural="empresas"
              addLabel="Adicione uma empresa"
              onAddClick={(termo) => {
                setNovaEmpresaNome(termo || '');
                setCriandoEmpresa(true);
              }}
              avatarClassName="bg-[#F5F2FC] text-brand-purple"
            />

            {criandoEmpresaInline && (
              <div className="p-3.5 space-y-2.5 bg-surface-subtle border border-surface-border rounded-xl">
                <p className="text-sm font-semibold text-ink-primary">Adicionar nova empresa</p>
                <input
                  type="text"
                  placeholder="Nome da empresa *"
                  value={novaEmpresaNome}
                  onChange={(e) => setNovaEmpresaNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-border text-sm focus:outline-none focus:border-brand-primary bg-surface-card text-ink-primary"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCriandoEmpresa(false)}
                    className="flex-1 py-1.5 text-sm font-semibold text-ink-secondary bg-surface-card hover:bg-surface-hover border border-surface-border rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarNovaEmpresaInline}
                    className="flex-1 py-1.5 text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>

          {erro && (
            <p className="text-rose-600 text-sm font-semibold bg-rose-50 px-3 py-2 rounded-xl border border-rose-200">
              {erro}
            </p>
          )}

          {/* Rodapé com Ações (Cancelar e Criar / Salvar) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-border">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-ink-secondary bg-surface-subtle border border-surface-border hover:bg-surface-hover transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary-hover transition-all disabled:opacity-50 shadow-xs"
            >
              {salvando ? 'Salvando...' : leadEditando ? 'Salvar Negócio' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PÁGINA PRINCIPAL: LEADS / PIPELINE DE NEGÓCIOS ────────────
const PaginaLeads = () => {
  const {
    leads: leadsDb,
    carregar, criar, atualizar,
    mudarStatus,
  } = useLeads();

  const navigate                              = useNavigate();
  const [etapas, setEtapas]                   = useState(ETAPAS_PIPELINE);
  const [colunaConfigurando, setColunaConfigurando] = useState(null);
  const [modalAberto, setModalAberto]         = useState(false);
  const [etapaPreSelecionada, setEtapaPre]    = useState('lead');
  const [leadEditando, setLeadEditando]       = useState(null);
  const [busca, setBusca]                     = useState('');
  const [ownerSelecionado, setOwnerSelecionado] = useState(null);
  const [dropdownOwnersAberto, setDropdownOwnersAberto] = useState(false);
  const [draggedId, setDraggedId]             = useState(null);
  const [dragOverCol, setDragOverCol]         = useState(null);

  // Estado local para permitir drag & drop instantâneo e fallback
  const [dealsLocais, setDealsLocais]         = useState(DEALS_DEMO);
  const filtroRef = useRef(null);

  // Carrega contatos do Supabase na inicialização
  useEffect(() => {
    carregar();
  }, [carregar]);

  // Sincroniza dados do banco com o pipeline
  useEffect(() => {
    if (leadsDb && leadsDb.length > 0) {
      if (leadsDb.length >= 4) {
        setDealsLocais(leadsDb);
      } else {
        const idsDb = new Set(leadsDb.map(l => l.id));
        const demosRestantes = DEALS_DEMO.filter(d => !idsDb.has(d.id));
        setDealsLocais([...leadsDb, ...demosRestantes]);
      }
    }
  }, [leadsDb]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (filtroRef.current && !filtroRef.current.contains(e.target)) {
        setDropdownOwnersAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  // Lista única de Responsáveis para o dropdown "Todos os responsáveis"
  const listaOwners = useMemo(() => {
    const map = new Map();
    dealsLocais.forEach((d) => {
      const nome = d.responsavel?.nome || 'Carlos Silva';
      if (!map.has(nome)) {
        map.set(nome, { id: nome, nome });
      }
    });
    return Array.from(map.values());
  }, [dealsLocais]);

  // Filtro por busca geral e por responsável
  const dealsFiltrados = useMemo(() => {
    return dealsLocais.filter((deal) => {
      const matchBusca = !busca ||
        (deal.negocio_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (deal.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (deal.empresa || '').toLowerCase().includes(busca.toLowerCase()) ||
        (Array.isArray(deal.tags) && deal.tags.some(t => t.toLowerCase().includes(busca.toLowerCase())));

      if (!matchBusca) return false;

      if (ownerSelecionado) {
        const nomeResp = deal.responsavel?.nome || 'Carlos Silva';
        if (nomeResp !== ownerSelecionado.nome) return false;
      }

      return true;
    });
  }, [dealsLocais, busca, ownerSelecionado]);

  // Agrupamento dos negócios por etapa do pipeline
  const dealsPorEtapa = useMemo(() => {
    const acc = {};
    etapas.forEach(e => { acc[e.key] = []; });
    dealsFiltrados.forEach((deal) => {
      const st = deal.status_funil || etapas[0]?.key || 'lead';
      if (acc[st]) {
        acc[st].push(deal);
      } else if (acc[etapas[0]?.key]) {
        acc[etapas[0]?.key].push(deal);
      }
    });
    return acc;
  }, [dealsFiltrados, etapas]);

  // Cálculo das métricas gerais do topo (ex: R$ 1.2M ponderados em 14 negócios em aberto)
  const { totalValorGeral, totalDealsAbertos } = useMemo(() => {
    const dealsAbertos = dealsFiltrados.filter(d => d.status_funil !== 'perdido');
    const soma = dealsAbertos.reduce((s, d) => s + (Number(d.valor_estimado) || 0), 0);
    return {
      totalValorGeral: soma,
      totalDealsAbertos: dealsAbertos.length,
    };
  }, [dealsFiltrados]);

  // ─── HANDLERS DE DRAG & DROP ─────────────────────────────────
  const handleDragStart = (e, dealId) => {
    setDraggedId(dealId);
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, etapaKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== etapaKey) {
      setDragOverCol(etapaKey);
    }
  };

  const handleDragLeave = (e, etapaKey) => {
    if (dragOverCol === etapaKey) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e, novaEtapa) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedId;
    setDragOverCol(null);
    setDraggedId(null);

    if (!dealId) return;

    // Atualização otimista no estado local
    setDealsLocais(prev =>
      prev.map(d => d.id === dealId ? { ...d, status_funil: novaEtapa, atualizado_em: new Date().toISOString() } : d)
    );

    // Persistência no Supabase se for um deal real
    if (!String(dealId).startsWith('demo-')) {
      try {
        await mudarStatus(dealId, novaEtapa);
      } catch (err) {
        console.error('Erro ao atualizar status do deal:', err);
      }
    }
  };

  // ─── AÇÕES DE CRIAÇÃO / EDIÇÃO ───────────────────────────────
  const handleNovoDealEtapa = (etapaKey) => {
    setEtapaPre(etapaKey);
    setLeadEditando(null);
    setModalAberto(true);
  };

  const handleSalvarDeal = async (dados) => {
    // Sanitização para colunas reais de crm_contatos no Supabase
    const { responsavel_nome, ...payloadDb } = dados;

    // Objeto local para atualização imediata na UI com avatar e responsável
    const dealParaUI = {
      ...dados,
      responsavel: { nome: responsavel_nome || 'Lucas Bastos' },
    };

    if (leadEditando) {
      if (!String(leadEditando.id).startsWith('demo-')) {
        const atualizado = await atualizar(leadEditando.id, payloadDb);
        if (atualizado) {
          setDealsLocais(prev =>
            prev.map(d => d.id === leadEditando.id ? { ...d, ...atualizado, responsavel: dealParaUI.responsavel } : d)
          );
        }
      } else {
        setDealsLocais(prev =>
          prev.map(d => d.id === leadEditando.id ? { ...d, ...dealParaUI } : d)
        );
      }
    } else {
      try {
        const novo = await criar(payloadDb);
        if (novo) {
          setDealsLocais(prev => [{ ...novo, responsavel: dealParaUI.responsavel }, ...prev]);
        }
      } catch (_err) {
        const novoLocal = {
          ...dealParaUI,
          id: `local-${Date.now()}`,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };
        setDealsLocais(prev => [novoLocal, ...prev]);
      }
    }
    setLeadEditando(null);
  };

  const handleSalvarConfigColuna = (etapaKey, novosDados) => {
    setEtapas(prev => prev.map(e => e.key === etapaKey ? { ...e, ...novosDados } : e));
    setColunaConfigurando(null);
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 font-sans overflow-hidden">
      {/* ─────────────────────────────────────────────────────────
          HEADER DO PIPELINE DE NEGÓCIOS (HERO BAR)
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink-primary tracking-tight">
            Pipeline de Negócios
          </h2>
          <p className="text-sm text-ink-secondary font-medium mt-0.5">
            {formatarK(totalValorGeral)} ponderados em {totalDealsAbertos}{' '}
            {totalDealsAbertos === 1 ? 'negócio em aberto' : 'negócios em aberto'} · arraste um card para mudar de etapa
          </p>
        </div>

        {/* Controles do Topo (Busca Geral, Responsáveis, + Novo negócio) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Busca Rápida Geral */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.8} />
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar negócios..."
              className="pl-8 pr-7 py-2 bg-surface-card border border-surface-border rounded-xl text-sm text-ink-primary placeholder-slate-400 focus:outline-none focus:border-brand-primary shadow-2xs w-48 sm:w-56 transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted hover:text-ink-primary"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro: Todos os responsáveis */}
          <div className="relative" ref={filtroRef}>
            <button
              type="button"
              onClick={() => setDropdownOwnersAberto(!dropdownOwnersAberto)}
              className="flex items-center gap-2 px-3.5 py-2 bg-surface-card border border-surface-border rounded-xl text-sm font-semibold text-ink-primary hover:bg-surface-subtle shadow-2xs transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-brand-secondary shrink-0" />
              <span>{ownerSelecionado ? ownerSelecionado.nome : 'Todos os responsáveis'}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} className="text-ink-secondary" />
            </button>

            {dropdownOwnersAberto && (
              <div className="absolute right-0 mt-1.5 w-52 bg-surface-card border border-surface-border rounded-2xl shadow-lg p-1.5 z-30 space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setOwnerSelecionado(null); setDropdownOwnersAberto(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-left transition-colors ${
                    !ownerSelecionado ? 'bg-brand-accent text-brand-primary' : 'text-ink-primary hover:bg-surface-subtle'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-secondary" />
                    Todos os responsáveis
                  </span>
                  {!ownerSelecionado && <span>✓</span>}
                </button>
                {listaOwners.map((owner) => (
                  <button
                    key={owner.id}
                    type="button"
                    onClick={() => { setOwnerSelecionado(owner); setDropdownOwnersAberto(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl text-left transition-colors ${
                      ownerSelecionado?.id === owner.id ? 'bg-brand-accent text-brand-primary' : 'text-ink-primary hover:bg-surface-subtle'
                    }`}
                  >
                    <span className="truncate">{owner.nome}</span>
                    {ownerSelecionado?.id === owner.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão + Novo negócio */}
          <button
            type="button"
            onClick={() => handleNovoDealEtapa(etapas[0]?.key || 'lead')}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-semibold shadow-xs transition-all active:scale-95 shrink-0"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.8} />
            <span>Novo negócio</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          KANBAN COM AS 5 ETAPAS DO PIPELINE
         ───────────────────────────────────────────────────────── */}
      <div className="w-full flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
        <div className="flex gap-4 items-stretch h-full min-w-max pb-1">
          {etapas.map((etapa) => (
            <ColunaPipeline
              key={etapa.key}
              etapa={etapa}
              deals={dealsPorEtapa[etapa.key] || []}
              onAbrir={(deal) => navigate(`/crm/leads/${deal.id}`)}
              onNovoDealEtapa={handleNovoDealEtapa}
              onConfigurarColuna={(col) => setColunaConfigurando(col)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              isDragOver={dragOverCol === etapa.key}
            />
          ))}
        </div>
      </div>

      {/* Modal Configurações da Coluna (Engrenagem) */}
      <ModalConfigColuna
        aberto={!!colunaConfigurando}
        onFechar={() => setColunaConfigurando(null)}
        etapa={colunaConfigurando}
        onSalvar={handleSalvarConfigColuna}
      />

      {/* Modal Criar / Editar Negócio */}
      <ModalLead
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setLeadEditando(null); }}
        onSalvar={handleSalvarDeal}
        leadEditando={leadEditando}
        statusInicial={etapaPreSelecionada}
        etapas={etapas}
        dealsExistentes={dealsLocais}
      />
    </div>
  );
};

export default PaginaLeads;