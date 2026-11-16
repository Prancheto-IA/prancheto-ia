// =============================================================
// PRANCHETO.IA - PIPELINE DE NEGÓCIOS (CRM KANBAN - EMITLY DESIGN SYSTEM)
// Pipeline visual com 5 etapas (Não Chamei, Chamei, Chamar Novamente,
// Deu Bom!, Deu Ruim!), drag & drop, filtros e cards enriquecidos.
// Baseado fielmente na especificação visual de Deals Pipeline.
// =============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads, normalizarEtapaFunil } from '../../hooks/useCRM.js';
import { supabase } from '../../lib/supabase.js';
import { SelectField } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { AutocompleteReUI9 } from '@/components/reui/c-autocomplete-9';
import { SimpleTooltip } from '@/components/reui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/reui/tabs';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Settings02Icon,
  Add01Icon,
  ArrowDown01Icon,
  Briefcase02Icon,
  UserIcon,
  Building02Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  Cancel01Icon,
  Globe02Icon,
  Location01Icon,
  Mail01Icon,
  Call02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';

// ─── PALETA DE CORES DAS COLUNAS / ETAPAS ───────────────────────
export const CORES_COLUNA_PRESETS = [
  {
    id: 'azul',
    nome: 'Azul',
    hex: '#0284C7',
    corDot: 'bg-brand-secondary dark:bg-[#38BDF8]',
    corTotal: 'text-brand-secondary dark:text-[#38BDF8]',
    corBg: 'bg-surface dark:bg-[#111827]',
    corBorda: 'border-surface-border dark:border-[#23304D]',
    corBotaoAdd: 'border-brand-accent text-brand-secondary hover:border-brand-secondary/40 hover:bg-brand-accent/40',
  },
  {
    id: 'roxo',
    nome: 'Roxo',
    hex: '#7C3AED',
    corDot: 'bg-brand-purple dark:bg-[#818CF8]',
    corTotal: 'text-brand-purple dark:text-[#818CF8]',
    corBg: 'bg-[#F5F2FC] dark:bg-[#111827]',
    corBorda: 'border-[#E4DBF7] dark:border-[#23304D]',
    corBotaoAdd: 'border-purple-200 text-brand-purple hover:border-purple-300 hover:bg-purple-50/60',
  },
  {
    id: 'ambar',
    nome: 'Âmbar',
    hex: '#F59E0B',
    corDot: 'bg-amber-500 dark:bg-[#FBBF24]',
    corTotal: 'text-amber-700 dark:text-[#FBBF24]',
    corBg: 'bg-[#FAF7EC] dark:bg-[#111827]',
    corBorda: 'border-[#EFE8D3] dark:border-[#23304D]',
    corBotaoAdd: 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50/60',
  },
  {
    id: 'verde',
    nome: 'Verde',
    hex: '#10B981',
    corDot: 'bg-emerald-500 dark:bg-[#34D399]',
    corTotal: 'text-emerald-700 dark:text-[#34D399]',
    corBg: 'bg-[#EDF9F2] dark:bg-[#111827]',
    corBorda: 'border-[#D1EFE0] dark:border-[#23304D]',
    corBotaoAdd: 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60',
  },
  {
    id: 'vermelho',
    nome: 'Vermelho',
    hex: '#F43F5E',
    corDot: 'bg-rose-500 dark:bg-[#F87171]',
    corTotal: 'text-rose-600 dark:text-[#F87171]',
    corBg: 'bg-[#FDF2F2] dark:bg-[#111827]',
    corBorda: 'border-[#FAD8D8] dark:border-[#23304D]',
    corBotaoAdd: 'border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50/60',
  },
  {
    id: 'laranja',
    nome: 'Laranja',
    hex: '#F97316',
    corDot: 'bg-orange-500 dark:bg-[#FB923C]',
    corTotal: 'text-orange-700 dark:text-[#FB923C]',
    corBg: 'bg-[#FFF7ED] dark:bg-[#111827]',
    corBorda: 'border-[#FED7AA] dark:border-[#23304D]',
    corBotaoAdd: 'border-orange-200 text-orange-700 hover:border-orange-300 hover:bg-orange-50/60',
  },
  {
    id: 'teal',
    nome: 'Teal',
    hex: '#0D9488',
    corDot: 'bg-teal-500 dark:bg-[#2DD4BF]',
    corTotal: 'text-teal-700 dark:text-[#2DD4BF]',
    corBg: 'bg-[#F0FDFA] dark:bg-[#111827]',
    corBorda: 'border-[#CCFBF1] dark:border-[#23304D]',
    corBotaoAdd: 'border-teal-200 text-teal-700 hover:border-teal-300 hover:bg-teal-50/60',
  },
  {
    id: 'indigo',
    nome: 'Índigo',
    hex: '#4F46E5',
    corDot: 'bg-indigo-500 dark:bg-[#818CF8]',
    corTotal: 'text-indigo-700 dark:text-[#818CF8]',
    corBg: 'bg-[#EEF2FF] dark:bg-[#111827]',
    corBorda: 'border-[#E0E7FF] dark:border-[#23304D]',
    corBotaoAdd: 'border-indigo-200 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50/60',
  },
  {
    id: 'pink',
    nome: 'Pink',
    hex: '#EC4899',
    corDot: 'bg-pink-500 dark:bg-[#F472B6]',
    corTotal: 'text-pink-700 dark:text-[#F472B6]',
    corBg: 'bg-[#FDF2F8] dark:bg-[#111827]',
    corBorda: 'border-[#FCE7F3] dark:border-[#23304D]',
    corBotaoAdd: 'border-pink-200 text-pink-700 hover:border-pink-300 hover:bg-pink-50/60',
  },
  {
    id: 'slate',
    nome: 'Cinza',
    hex: '#64748B',
    corDot: 'bg-slate-500 dark:bg-[#94A3B8]',
    corTotal: 'text-slate-700 dark:text-[#94A3B8]',
    corBg: 'bg-[#F8FAFC] dark:bg-[#111827]',
    corBorda: 'border-[#E2E8F0] dark:border-[#23304D]',
    corBotaoAdd: 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60',
  },
];

// ─── 5 ETAPAS DO PIPELINE EM PORTUGUÊS ─────────────────────────
export const ETAPAS_PIPELINE = [
  {
    key: 'nao_chamei',
    titulo: 'Não Chamei',
    rotuloPt: 'Não Chamei',
    corId: 'azul',
    corHex: '#0284C7',
    corDot: 'bg-brand-secondary dark:bg-[#38BDF8]',
    corTotal: 'text-brand-secondary dark:text-[#38BDF8]',
    corBg: 'bg-surface dark:bg-[#111827]',
    corBorda: 'border-surface-border dark:border-[#23304D]',
    corBotaoAdd: 'border-brand-accent text-brand-secondary hover:border-brand-secondary/40 hover:bg-brand-accent/40',
    tagPadrao: 'Novo',
    probabilidadePadrao: 25,
  },
  {
    key: 'chamei',
    titulo: 'Chamei',
    rotuloPt: 'Chamei',
    corId: 'roxo',
    corHex: '#7C3AED',
    corDot: 'bg-brand-purple dark:bg-[#818CF8]',
    corTotal: 'text-brand-purple dark:text-[#818CF8]',
    corBg: 'bg-[#F5F2FC] dark:bg-[#111827]',
    corBorda: 'border-[#E4DBF7] dark:border-[#23304D]',
    corBotaoAdd: 'border-purple-200 text-brand-purple hover:border-purple-300 hover:bg-purple-50/60',
    tagPadrao: 'Enterprise',
    probabilidadePadrao: 50,
  },
  {
    key: 'chamar_novamente',
    titulo: 'Chamar Novamente',
    rotuloPt: 'Chamar Novamente',
    corId: 'ambar',
    corHex: '#F59E0B',
    corDot: 'bg-amber-500 dark:bg-[#FBBF24]',
    corTotal: 'text-amber-700 dark:text-[#FBBF24]',
    corBg: 'bg-[#FAF7EC] dark:bg-[#111827]',
    corBorda: 'border-[#EFE8D3] dark:border-[#23304D]',
    corBotaoAdd: 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50/60',
    tagPadrao: 'Morno',
    probabilidadePadrao: 65,
  },
  {
    key: 'deu_bom',
    titulo: 'Deu Bom!',
    rotuloPt: 'Deu Bom!',
    corId: 'verde',
    corHex: '#10B981',
    corDot: 'bg-emerald-500 dark:bg-[#34D399]',
    corTotal: 'text-emerald-700 dark:text-[#34D399]',
    corBg: 'bg-[#EDF9F2] dark:bg-[#111827]',
    corBorda: 'border-[#D1EFE0] dark:border-[#23304D]',
    corBotaoAdd: 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/60',
    tagPadrao: 'Ativo',
    probabilidadePadrao: 100,
  },
  {
    key: 'deu_ruim',
    titulo: 'Deu Ruim!',
    rotuloPt: 'Deu Ruim!',
    corId: 'vermelho',
    corHex: '#F43F5E',
    corDot: 'bg-rose-500 dark:bg-[#F87171]',
    corTotal: 'text-rose-600 dark:text-[#F87171]',
    corBg: 'bg-[#FDF2F2] dark:bg-[#111827]',
    corBorda: 'border-[#FAD8D8] dark:border-[#23304D]',
    corBotaoAdd: 'border-rose-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50/60',
    tagPadrao: 'Revisão',
    probabilidadePadrao: 0,
  },
];

// ─── DEALS DEMO EM PORTUGUÊS ───────────────────────────────────
export const DEALS_DEMO = [
  {
    id: 'demo-1',
    nome: 'Módulo de compliance',
    negocio_nome: 'Módulo de compliance',
    empresa: 'Grupo Verado',
    status_funil: 'nao_chamei',
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
    status_funil: 'nao_chamei',
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
    status_funil: 'chamei',
    valor_estimado: 19000,
    score: 45,
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
    status_funil: 'chamei',
    valor_estimado: 262000,
    score: 50,
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
    status_funil: 'chamar_novamente',
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
    status_funil: 'chamar_novamente',
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
    status_funil: 'deu_bom',
    valor_estimado: 204000,
    score: 95,
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
    status_funil: 'deu_ruim',
    valor_estimado: 67000,
    score: 10,
    tags: ['Revisão'],
    responsavel: { nome: 'Carlos Silva' },
    criado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'demo-9',
    nome: 'Automação de armazém',
    negocio_nome: 'Automação de armazém',
    empresa: 'Varejo Brightpath',
    status_funil: 'nao_chamei',
    valor_estimado: 91000,
    score: 30,
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
    status_funil: 'chamei',
    valor_estimado: 158000,
    score: 50,
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
    status_funil: 'chamar_novamente',
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
    status_funil: 'deu_ruim',
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
    status_funil: 'deu_bom',
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
    status_funil: 'deu_bom',
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
        <SimpleTooltip content={deal.responsavel?.nome || deal.nome}>
          <div
            className="w-6 h-6 rounded-full bg-brand-accent text-brand-primary border border-brand-secondary/15 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none cursor-default"
          >
            {iniciais}
          </div>
        </SimpleTooltip>
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
      className={`w-80 sm:w-[340px] flex-shrink-0 h-full max-h-full flex flex-col rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 transition-all duration-200 ${etapa.corBg} border ${
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
            <SimpleTooltip content="Fechar pesquisa">
              <button
                type="button"
                onClick={() => {
                  setBuscaColuna('');
                  setModoBusca(false);
                }}
                className="text-ink-muted hover:text-ink-primary text-sm p-0.5 rounded-md shrink-0 cursor-pointer"
              >
                ✕
              </button>
            </SimpleTooltip>
          </div>
        ) : (
          /* Modo Padrão: Titulo [quantidade] valor_total à esquerda | Ações à direita */
          <div className="flex items-center justify-between w-full gap-1.5 min-w-0">
            {/* Lado Esquerdo: Dot + Nome da coluna [2] R$ 242k */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${etapa.corDot || 'bg-brand-secondary'}`} />
              <h3 className="font-bold text-sm text-ink-primary whitespace-nowrap tracking-tight">
                {etapa.titulo}
              </h3>
              <span className="w-5 h-5 min-w-[20px] rounded-md bg-surface-card border border-surface-border text-ink-primary flex items-center justify-center text-[11px] font-semibold shadow-2xs shrink-0">
                {deals.length}
              </span>
              <span className={`text-xs font-bold shrink-0 whitespace-nowrap ${etapa.corTotal}`}>
                {totalFormatado}
              </span>
            </div>

            {/* Lado Direito: Engrenagem (hover), + (adicionar negócio), Lupa (pesquisar) */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* 1. Botão de Engrenagem (visível apenas ao posicionar o mouse na coluna) */}
              <SimpleTooltip content="Configurações da coluna" side="top">
                <button
                  type="button"
                  onClick={() => onConfigurarColuna(etapa)}
                  className="hidden group-hover/coluna:inline-flex items-center justify-center transition-opacity p-1 text-ink-secondary hover:text-brand-primary hover:bg-white/80 dark:hover:bg-surface-hover rounded-lg cursor-pointer"
                  aria-label="Configurações da coluna"
                >
                  <HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={1.8} />
                </button>
              </SimpleTooltip>

              {/* 2. Botão de + para adicionar novo negócio na coluna */}
              <SimpleTooltip content="Adicionar negócio nesta coluna" side="top">
                <button
                  type="button"
                  onClick={() => onNovoDealEtapa(etapa.key)}
                  className={`p-1 ${etapa.corTotal} hover:bg-white/90 dark:hover:bg-surface-hover rounded-lg transition-all hover:shadow-2xs active:scale-95 cursor-pointer`}
                  aria-label="Adicionar negócio nesta coluna"
                >
                  <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.2} />
                </button>
              </SimpleTooltip>

              {/* 3. Botão de Lupa para pesquisar negócio na coluna */}
              <SimpleTooltip content="Pesquisar negócios nesta coluna" side="top">
                <button
                  type="button"
                  onClick={() => setModoBusca(true)}
                  className="p-1 text-ink-secondary hover:text-brand-primary hover:bg-white/80 dark:hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                  aria-label="Pesquisar negócios nesta coluna"
                >
                  <HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={1.8} />
                </button>
              </SimpleTooltip>
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
  const [corSelecionada, setCorSelecionada] = useState('azul');

  useEffect(() => {
    if (etapa) {
      setTitulo(etapa.titulo || '');
      setProbabilidade(etapa.probabilidadePadrao != null ? String(etapa.probabilidadePadrao) : '50');

      if (etapa.corId) {
        setCorSelecionada(etapa.corId);
      } else if (etapa.corDot?.includes('purple')) {
        setCorSelecionada('roxo');
      } else if (etapa.corDot?.includes('amber')) {
        setCorSelecionada('ambar');
      } else if (etapa.corDot?.includes('emerald')) {
        setCorSelecionada('verde');
      } else if (etapa.corDot?.includes('rose')) {
        setCorSelecionada('vermelho');
      } else if (etapa.corDot?.includes('orange')) {
        setCorSelecionada('laranja');
      } else if (etapa.corDot?.includes('teal')) {
        setCorSelecionada('teal');
      } else if (etapa.corDot?.includes('indigo')) {
        setCorSelecionada('indigo');
      } else if (etapa.corDot?.includes('pink')) {
        setCorSelecionada('pink');
      } else if (etapa.corDot?.includes('slate')) {
        setCorSelecionada('slate');
      } else {
        setCorSelecionada('azul');
      }
    }
  }, [etapa, aberto]);

  if (!aberto || !etapa) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const presetEscolhido = CORES_COLUNA_PRESETS.find(p => p.id === corSelecionada) || CORES_COLUNA_PRESETS[0];

    onSalvar(etapa.key, {
      titulo: titulo.trim(),
      probabilidadePadrao: probabilidade ? Number(probabilidade) : 50,
      limiteWip: null,
      corId: presetEscolhido.id,
      corDot: presetEscolhido.corDot,
      corTotal: presetEscolhido.corTotal,
      corBg: presetEscolhido.corBg,
      corBorda: presetEscolhido.corBorda,
      corBotaoAdd: presetEscolhido.corBotaoAdd,
      corHex: presetEscolhido.hex,
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
            <label className="block text-sm font-semibold text-ink-primary mb-1.5">
              Cor da Coluna
            </label>
            <div className="p-2.5 rounded-xl bg-surface-subtle border border-surface-border">
              <div className="grid grid-cols-5 gap-2.5">
                {CORES_COLUNA_PRESETS.map((preset) => {
                  const selecionada = corSelecionada === preset.id;
                  return (
                    <SimpleTooltip key={preset.id} content={preset.nome}>
                      <button
                        type="button"
                        onClick={() => setCorSelecionada(preset.id)}
                        className={`w-full h-8 rounded-lg transition-all duration-150 relative flex items-center justify-center cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${
                          selecionada
                            ? 'ring-2 ring-offset-2 ring-brand-primary dark:ring-offset-slate-900 scale-105 shadow-md'
                            : 'hover:ring-1 hover:ring-surface-border-strong opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      >
                        {selecionada && (
                          <span className="text-white drop-shadow-sm font-bold text-xs select-none">
                            ✓
                          </span>
                        )}
                      </button>
                    </SimpleTooltip>
                  );
                })}
              </div>
            </div>
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

// ─── CONFIGURAÇÕES E OPÇÕES DO MODAL DE NEGÓCIOS ─────────────
const DDIS_PAISES = [
  { ddi: '+55', pais: 'Brasil', flag: '🇧🇷' },
  { ddi: '+1', pais: 'EUA / Canadá', flag: '🇺🇸' },
  { ddi: '+351', pais: 'Portugal', flag: '🇵🇹' },
  { ddi: '+54', pais: 'Argentina', flag: '🇦🇷' },
  { ddi: '+34', pais: 'Espanha', flag: '🇪🇸' },
  { ddi: '+44', pais: 'Reino Unido', flag: '🇬🇧' },
  { ddi: '+56', pais: 'Chile', flag: '🇨🇱' },
  { ddi: '+52', pais: 'México', flag: '🇲🇽' },
  { ddi: '+598', pais: 'Uruguai', flag: '🇺🇾' },
  { ddi: '+595', pais: 'Paraguai', flag: '🇵🇾' },
];

const FONTES_OPCOES = [
  { value: '', label: 'Selecionar fonte' },
  { value: 'site', label: 'Site / Formulário Web' },
  { value: 'indicacao', label: 'Indicação' },
  { value: 'linkedin', label: 'LinkedIn / Social' },
  { value: 'trafego_pago', label: 'Tráfego Pago (Google / Meta Ads)' },
  { value: 'whatsapp', label: 'WhatsApp / Prospecção' },
  { value: 'email', label: 'E-mail Marketing' },
  { value: 'evento', label: 'Evento / Feira' },
  { value: 'manual', label: 'Outbound / Manual' },
  { value: 'outro', label: 'Outro' },
];

const SEGMENTOS_EMPRESA_OPCOES = [
  { value: '', label: 'Selecionar segmento' },
  { value: 'tecnologia', label: 'Tecnologia & Software (SaaS)' },
  { value: 'servicos', label: 'Serviços Corporativos / B2B' },
  { value: 'financeiro', label: 'Financeiro, Fintech & Seguros' },
  { value: 'saude', label: 'Saúde, Clínicas & Farmacêutica' },
  { value: 'varejo', label: 'Varejo & E-commerce' },
  { value: 'industria', label: 'Indústria, Manufatura & Logística' },
  { value: 'educacao', label: 'Educação & Treinamentos' },
  { value: 'agronegocio', label: 'Agronegócio' },
  { value: 'consultoria', label: 'Consultoria & Auditoria' },
  { value: 'imobiliario', label: 'Imobiliário & Construção Civil' },
  { value: 'outro', label: 'Outro' },
];

const BASES_LEGAIS_OPCOES = [
  { value: 'sem_base', label: 'Não sei dizer ou não possuo base legal' },
  { value: 'consentimento', label: 'Consentimento explícito do titular (Art. 7º, I LGPD)' },
  { value: 'legitimo_interesse', label: 'Legítimo interesse do controlador (Art. 7º, IX LGPD)' },
  { value: 'execucao_contrato', label: 'Execução de contrato / Procedimentos preliminares' },
  { value: 'obrigacao_legal', label: 'Cumprimento de obrigação legal ou regulatória' },
];

const ABAS_MODAL_NEGOCIO = [
  { id: 'negocio', label: 'Negócio', icone: Briefcase02Icon, descricao: 'Informações da negociação' },
  { id: 'contato', label: 'Contato', icone: UserIcon, descricao: 'Informações do contato' },
  { id: 'empresa', label: 'Empresa', icone: Building02Icon, descricao: 'Informações da empresa' },
];

// ─── FORM VAZIO PARA CRIAÇÃO/EDIÇÃO DE NEGÓCIO ─────────────────
const FORM_VAZIO = {
  // Aba 1: Negócio
  negocio_nome: '',
  valor_formatado: '',
  status_funil: 'nao_chamei',
  responsavel_nome: 'Lucas Bastos',
  previsao_fechamento: '',
  origem: '',
  campanha: '',
  observacoes: '',
  score: '50',
  tag_categoria: 'Novo',

  // Aba 2: Contato
  contato_id: '',
  contato_nome: '',
  contato_cargo: '',
  contato_telefones: [{ ddi: '+55', numero: '' }],
  contato_emails: [{ email: '' }],
  base_legal_comunicacao: 'sem_base',

  // Aba 3: Empresa
  empresa_id: '',
  empresa_nome: '',
  empresa_segmento: '',
  empresa_site: '',
  empresa_resumo: '',
  empresa_endereco: '',
};

// ─── MODAL: NOVO / EDITAR NEGÓCIO (EMITLY / PRANCHETO DESIGN) ──
const ModalLead = ({
  aberto,
  onFechar,
  onSalvar,
  leadEditando,
  statusInicial = 'nao_chamei',
  etapas,
  dealsExistentes = [],
}) => {
  const [form, setForm]                         = useState(FORM_VAZIO);
  const [salvando, setSalvando]                 = useState(false);
  const [erro, setErro]                         = useState('');

  // Controle de Abas e Notificação de Exclamação (!)
  const [abaAtiva, setAbaAtiva]                 = useState('negocio');
  const [abasVisualizadas, setAbasVisualizadas] = useState(() => new Set(['negocio']));

  // Controle de Alertas informativos nas abas
  const [alertaContatoAberto, setAlertaContatoAberto] = useState(true);
  const [alertaEmpresaAberto, setAlertaEmpresaAberto] = useState(true);

  // Estados de listas para sugestões / busca
  const [listaContatos, setListaContatos]             = useState(CONTATOS_SUGERIDOS_PADRAO);
  const [listaEmpresas, setListaEmpresas]             = useState(EMPRESAS_SUGERIDAS_PADRAO);
  const [empresasCompletas, setEmpresasCompletas]     = useState([]);

  // Troca de aba e remoção automática da exclamação
  const mudarAba = (novaAba) => {
    setAbaAtiva(novaAba);
    setAbasVisualizadas((prev) => {
      const next = new Set(prev);
      next.add(novaAba);
      return next;
    });
  };

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
          cargo: d.cargo || '',
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

    // Busca assíncrona adicional no Supabase (crm_contatos e crm_empresas)
    async function carregarDadosDb() {
      try {
        const { data: dbContatos } = await supabase
          .from('crm_contatos')
          .select('id, nome, cargo, email, telefone, empresa, empresa_id')
          .limit(60);

        if (dbContatos && dbContatos.length > 0) {
          dbContatos.forEach((item) => {
            if (item.nome && !contatosMapeados.has(item.nome.toLowerCase())) {
              contatosMapeados.set(item.nome.toLowerCase(), {
                id: item.id,
                nome: item.nome,
                cargo: item.cargo || '',
                email: item.email || '',
                telefone: item.telefone || '',
                empresa: item.empresa || '',
              });
            }
            if (item.empresa) empresasSet.add(item.empresa.trim());
          });
          setListaContatos(Array.from(contatosMapeados.values()));
          setListaEmpresas(Array.from(empresasSet));
        }

        const { data: dbEmp } = await supabase
          .from('crm_empresas')
          .select('id, nome_fantasia, razao_social, segmento, site, endereco, observacoes')
          .limit(60);

        if (dbEmp && dbEmp.length > 0) {
          setEmpresasCompletas(dbEmp);
          dbEmp.forEach(emp => {
            const nome = emp.nome_fantasia || emp.razao_social;
            if (nome) empresasSet.add(nome.trim());
          });
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

      const enderecoStr = typeof leadEditando.endereco === 'string'
        ? leadEditando.endereco
        : (leadEditando.endereco?.logradouro
            ? [leadEditando.endereco.logradouro, leadEditando.endereco.numero, leadEditando.endereco.cidade].filter(Boolean).join(', ')
            : '');

      setForm({
        negocio_nome:        leadEditando.negocio_nome || leadEditando.nome || '',
        valor_formatado:     leadEditando.valor_estimado != null ? formatarMoedaBRL(Number(leadEditando.valor_estimado)) : '',
        status_funil:        normalizarEtapaFunil(leadEditando.status_funil || statusInicial || 'nao_chamei'),
        responsavel_nome:    leadEditando.responsavel?.nome || 'Lucas Bastos',
        previsao_fechamento: leadEditando.previsao_fechamento ? leadEditando.previsao_fechamento.slice(0, 10) : '',
        origem:              leadEditando.origem || '',
        campanha:            leadEditando.campanha || '',
        observacoes:         leadEditando.observacoes || '',
        score:               leadEditando.score != null ? String(leadEditando.score) : '50',
        tag_categoria:       tagInicial,

        contato_id:          leadEditando.id || '',
        contato_nome:        leadEditando.nome || '',
        contato_cargo:       leadEditando.cargo || '',
        contato_telefones:   leadEditando.telefone ? [{ ddi: '+55', numero: leadEditando.telefone }] : [{ ddi: '+55', numero: '' }],
        contato_emails:      leadEditando.email ? [{ email: leadEditando.email }] : [{ email: '' }],
        base_legal_comunicacao: leadEditando.origem_detalhes?.base_legal || 'sem_base',

        empresa_id:          leadEditando.empresa_id || '',
        empresa_nome:        leadEditando.empresa || leadEditando.razao_social || '',
        empresa_segmento:    leadEditando.segmento || '',
        empresa_site:        leadEditando.site || '',
        empresa_resumo:      leadEditando.origem_detalhes?.empresa_resumo || '',
        empresa_endereco:    enderecoStr,
      });

      // Na edição, todas as abas já são consideradas vistas
      setAbasVisualizadas(new Set(['negocio', 'contato', 'empresa']));
      setAbaAtiva('negocio');
    } else {
      setForm({
        ...FORM_VAZIO,
        status_funil: normalizarEtapaFunil(statusInicial || 'nao_chamei'),
      });
      // Ao criar um negócio, apenas a primeira aba foi vista; contato e empresa exibirão a exclamação
      setAbasVisualizadas(new Set(['negocio']));
      setAbaAtiva('negocio');
    }

    setErro('');
    setAlertaContatoAberto(true);
    setAlertaEmpresaAberto(true);
  }, [leadEditando, aberto, statusInicial]);

  // Itens formatados para o Autocomplete de Contatos
  const contatosAutocompleteItems = useMemo(
    () =>
      listaContatos.map((c) => ({
        id: String(c.id || c.nome),
        name: c.nome,
        subtitle: [c.cargo, c.email, c.telefone].filter(Boolean).join(' · ') || 'Contato cadastrado',
        raw: c,
      })),
    [listaContatos]
  );

  // Itens formatados para o Autocomplete de Empresas
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

  // Gerenciamento de Telefones dinâmicos
  const handleTelefoneChange = (index, campo, valor) => {
    setForm(f => {
      const novos = [...f.contato_telefones];
      novos[index] = { ...novos[index], [campo]: valor };
      return { ...f, contato_telefones: novos };
    });
  };

  const handleAdicionarTelefone = () => {
    setForm(f => ({
      ...f,
      contato_telefones: [...f.contato_telefones, { ddi: '+55', numero: '' }],
    }));
  };

  const handleRemoverTelefone = (index) => {
    setForm(f => ({
      ...f,
      contato_telefones: f.contato_telefones.filter((_, i) => i !== index),
    }));
  };

  // Gerenciamento de E-mails dinâmicos
  const handleEmailChange = (index, valor) => {
    setForm(f => {
      const novos = [...f.contato_emails];
      novos[index] = { ...novos[index], email: valor };
      return { ...f, contato_emails: novos };
    });
  };

  const handleAdicionarEmail = () => {
    setForm(f => ({
      ...f,
      contato_emails: [...f.contato_emails, { email: '' }],
    }));
  };

  const handleRemoverEmail = (index) => {
    setForm(f => ({
      ...f,
      contato_emails: f.contato_emails.filter((_, i) => i !== index),
    }));
  };

  // Seleção e preenchimento de contato existente
  const handleSelecionarContato = (contato) => {
    setForm(f => ({
      ...f,
      contato_id: contato.id || '',
      contato_nome: contato.nome || f.contato_nome,
      contato_cargo: contato.cargo || f.contato_cargo,
      contato_emails: contato.email ? [{ email: contato.email }] : f.contato_emails,
      contato_telefones: contato.telefone ? [{ ddi: '+55', numero: contato.telefone }] : f.contato_telefones,
      empresa_nome: contato.empresa || f.empresa_nome,
    }));
  };

  const handleLimparContato = () => {
    setForm(f => ({
      ...f,
      contato_id: '',
      contato_nome: '',
      contato_cargo: '',
      contato_telefones: [{ ddi: '+55', numero: '' }],
      contato_emails: [{ email: '' }],
      base_legal_comunicacao: 'sem_base',
    }));
  };

  // Seleção e preenchimento de empresa existente
  const handleSelecionarEmpresa = (empresaNome) => {
    const achada = empresasCompletas.find(
      e => (e.nome_fantasia || e.razao_social || '').toLowerCase() === empresaNome.toLowerCase()
    );

    const endFormatado = achada?.endereco
      ? (typeof achada.endereco === 'string'
          ? achada.endereco
          : [achada.endereco.logradouro, achada.endereco.numero, achada.endereco.cidade].filter(Boolean).join(', '))
      : '';

    setForm(f => ({
      ...f,
      empresa_nome: empresaNome,
      empresa_id: achada?.id || '',
      empresa_segmento: achada?.segmento || f.empresa_segmento,
      empresa_site: achada?.site || f.empresa_site,
      empresa_resumo: achada?.observacoes || f.empresa_resumo,
      empresa_endereco: endFormatado || f.empresa_endereco,
    }));
  };

  const handleLimparEmpresa = () => {
    setForm(f => ({
      ...f,
      empresa_id: '',
      empresa_nome: '',
      empresa_segmento: '',
      empresa_site: '',
      empresa_resumo: '',
      empresa_endereco: '',
    }));
  };

  // Envio do formulário
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!form.negocio_nome.trim()) {
      setErro('Informe o nome da negociação.');
      mudarAba('negocio');
      return;
    }

    setSalvando(true);
    setErro('');

    try {
      const valorEstimadoNumerico = desformatarMoedaBRL(form.valor_formatado);

      // Telefones consolidados
      const telefonesValidos = form.contato_telefones
        .map(t => `${t.ddi} ${t.numero}`.trim())
        .filter(t => t.length > 4);
      const primeiroTelefone = telefonesValidos[0] || form.contato_telefones[0]?.numero?.trim() || null;

      // E-mails consolidados
      const emailsValidos = form.contato_emails
        .map(e => e.email.trim())
        .filter(Boolean);
      const primeiroEmail = emailsValidos[0] || null;

      // Endereço estruturado
      const enderecoObj = form.empresa_endereco.trim()
        ? { logradouro: form.empresa_endereco.trim() }
        : {};

      let empresaIdResolvido = form.empresa_id || null;

      // Se informou nome da empresa mas não tem empresa_id cadastrado, cadastra em crm_empresas
      if (form.empresa_nome.trim() && !empresaIdResolvido) {
        try {
          const { data: novaEmpresaDb } = await supabase
            .from('crm_empresas')
            .insert({
              nome_fantasia: form.empresa_nome.trim(),
              razao_social: form.empresa_nome.trim(),
              segmento: form.empresa_segmento || null,
              site: form.empresa_site.trim() || null,
              observacoes: form.empresa_resumo.trim() || null,
              endereco: enderecoObj,
            })
            .select('id')
            .single();

          if (novaEmpresaDb?.id) {
            empresaIdResolvido = novaEmpresaDb.id;
          }
        } catch (_errEmp) {
          // Continua sem falhar
        }
      }

      await onSalvar({
        negocio_nome:        form.negocio_nome.trim(),
        nome:                form.contato_nome.trim() || form.negocio_nome.trim(),
        cargo:               form.contato_cargo.trim() || null,
        email:               primeiroEmail,
        telefone:            primeiroTelefone,
        empresa:             form.empresa_nome.trim() || null,
        empresa_id:          empresaIdResolvido,
        segmento:            form.empresa_segmento || null,
        site:                form.empresa_site.trim() || null,
        endereco:            enderecoObj,
        origem:              form.origem || 'manual',
        campanha:            form.campanha ? form.campanha.trim() : null,
        valor_estimado:      valorEstimadoNumerico,
        status_funil:        form.status_funil,
        responsavel_nome:    form.responsavel_nome,
        previsao_fechamento: form.previsao_fechamento || null,
        observacoes:         form.observacoes.trim() || null,
        score:               Number(form.score) || 50,
        tags:                [form.tag_categoria || 'Novo'],
        origem_detalhes: {
          base_legal:        form.base_legal_comunicacao,
          telefones_extras:  telefonesValidos.slice(1),
          emails_extras:     emailsValidos.slice(1),
          empresa_resumo:    form.empresa_resumo.trim() || null,
        },
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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onFechar}
    >
      <div
        className="bg-surface-card rounded-2xl w-full max-w-2xl border border-surface-border shadow-2xl transition-all flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-surface-border shrink-0">
          <div>
            <h3 className="font-bold text-lg text-ink-primary tracking-tight">
              {leadEditando ? 'Editar Negociação' : 'Criar Negociação'}
            </h3>
            <p className="text-xs sm:text-sm text-ink-secondary font-medium mt-0.5">
              Preencha as informações do negócio, contato e empresa
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

        {/* Abas com indicador de exclamação (!) */}
        <div className="px-6 pt-4 pb-2 shrink-0 border-b border-surface-border/60 bg-surface-subtle/40">
          <Tabs value={abaAtiva} onValueChange={mudarAba} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-surface-subtle p-1 rounded-xl border border-surface-border">
              {ABAS_MODAL_NEGOCIO.map((tab) => {
                const Icone = tab.icone;
                const precisaVisualizar = !leadEditando && !abasVisualizadas.has(tab.id);

                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all relative"
                  >
                    <HugeiconsIcon icon={Icone} size={15} strokeWidth={2} className="shrink-0" />
                    <span>{tab.label}</span>
                    {precisaVisualizar && (
                      <SimpleTooltip content="Aba pendente de visualização / preenchimento">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[10px] leading-none shadow-xs animate-bounce ml-0.5">
                          !
                        </span>
                      </SimpleTooltip>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Formulário Principal com Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ══════════════ ABA 1: NEGÓCIO ══════════════ */}
          {abaAtiva === 'negocio' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Nome da Negociação */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Nome da negociação <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.negocio_nome}
                  onChange={set('negocio_nome')}
                  placeholder="Digite o nome da negociação"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Fonte e Etapa do funil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                    Fonte
                  </label>
                  <SelectField
                    value={form.origem}
                    onChange={set('origem')}
                  >
                    {FONTES_OPCOES.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </SelectField>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                    Etapa do funil de vendas
                  </label>
                  <SelectField
                    value={form.status_funil}
                    onChange={set('status_funil')}
                  >
                    {(etapas || ETAPAS_PIPELINE).map(e => (
                      <option key={e.key} value={e.key}>{e.titulo}</option>
                    ))}
                  </SelectField>
                </div>
              </div>

              {/* Valor do Negócio e Previsão de Fechamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                    Valor do negócio
                  </label>
                  <input
                    type="text"
                    value={form.valor_formatado}
                    onChange={handleValorChange}
                    placeholder="R$ 0,00"
                    className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                  />
                </div>

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

              {/* Responsável pelo Negócio */}
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

              {/* Descrição do negócio */}
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
            </div>
          )}

          {/* ══════════════ ABA 2: CONTATO ══════════════ */}
          {abaAtiva === 'contato' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Informações do Contato
                </span>
                {form.contato_nome && (
                  <button
                    type="button"
                    onClick={handleLimparContato}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                    <span>Limpar dados</span>
                  </button>
                )}
              </div>

              {/* Seleção de Contato Existente via Autocomplete ReUI */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Buscar contato existente
                </label>
                <AutocompleteReUI9
                  items={contatosAutocompleteItems}
                  value={form.contato_nome}
                  onValueChange={(val) => setForm(f => ({ ...f, contato_nome: val }))}
                  onSelectItem={(item) => handleSelecionarContato(item.raw || { nome: item.name })}
                  placeholder="Pesquisar por nome, cargo ou e-mail..."
                  entitySingular="contato"
                  entityPlural="contatos"
                  addLabel="Criar novo contato"
                  onAddClick={(termo) => setForm(f => ({ ...f, contato_nome: termo || f.contato_nome }))}
                />
              </div>

              {/* Nome do Contato */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Nome do contato <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contato_nome}
                  onChange={set('contato_nome')}
                  placeholder="Digite o nome do contato"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Cargo
                </label>
                <input
                  type="text"
                  value={form.contato_cargo}
                  onChange={set('contato_cargo')}
                  placeholder="Digite o cargo do contato"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Telefones com Seletor DDI e Múltiplos Números */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Telefone(s)
                </label>
                <div className="space-y-2">
                  {form.contato_telefones.map((tel, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {/* Seletor DDI com bandeira */}
                      <div className="w-28 shrink-0">
                        <select
                          value={tel.ddi}
                          onChange={(e) => handleTelefoneChange(idx, 'ddi', e.target.value)}
                          className="w-full bg-surface-subtle border border-surface-border rounded-xl px-2 py-2.5 text-xs sm:text-sm font-semibold text-ink-primary focus:outline-none focus:border-brand-primary"
                        >
                          {DDIS_PAISES.map(p => (
                            <option key={p.ddi} value={p.ddi}>
                              {p.flag} {p.ddi}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Input de número de telefone */}
                      <input
                        type="tel"
                        value={tel.numero}
                        onChange={(e) => handleTelefoneChange(idx, 'numero', e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                      />

                      {/* Remover telefone se houver mais de um */}
                      {form.contato_telefones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoverTelefone(idx)}
                          className="p-2 text-ink-secondary hover:text-rose-500 rounded-lg transition-colors"
                          title="Remover telefone"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAdicionarTelefone}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover pt-1 transition-colors"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    <span>Adicionar telefone</span>
                  </button>
                </div>
              </div>

              {/* E-mails com Múltiplos Campos */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  E-mail(s)
                </label>
                <div className="space-y-2">
                  {form.contato_emails.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="email"
                        value={item.email}
                        onChange={(e) => handleEmailChange(idx, e.target.value)}
                        placeholder="seunome@email.com"
                        className="flex-1 bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                      />
                      {form.contato_emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoverEmail(idx)}
                          className="p-2 text-ink-secondary hover:text-rose-500 rounded-lg transition-colors"
                          title="Remover e-mail"
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={16} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAdicionarEmail}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-primary-hover pt-1 transition-colors"
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
                    <span>Adicionar email</span>
                  </button>
                </div>
              </div>

              {/* Base Legal de Comunicação / LGPD */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Contato e envio de comunicação (LGPD)
                </label>
                <SelectField
                  value={form.base_legal_comunicacao}
                  onChange={set('base_legal_comunicacao')}
                >
                  {BASES_LEGAIS_OPCOES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </SelectField>
              </div>

              {/* Alerta Informativo */}
              {alertaContatoAberto && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border-l-4 border-l-sky-500 border border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>As informações serão salvas ao criar a negociação</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertaContatoAberto(false)}
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-100 p-0.5 rounded transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              )}

              {/* Botão Remover Contato */}
              {form.contato_nome && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLimparContato}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200/80 dark:hover:bg-sky-900/60 text-xs font-bold transition-all shadow-2xs border border-sky-200/60 dark:border-sky-800"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.5} />
                    <span>Remover contato</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══════════════ ABA 3: EMPRESA ══════════════ */}
          {abaAtiva === 'empresa' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  Informações da Empresa
                </span>
                {form.empresa_nome && (
                  <button
                    type="button"
                    onClick={handleLimparEmpresa}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} />
                    <span>Limpar dados</span>
                  </button>
                )}
              </div>

              {/* Seleção de Empresa Existente via Autocomplete ReUI */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Buscar empresa cadastrada
                </label>
                <AutocompleteReUI9
                  items={empresasAutocompleteItems}
                  value={form.empresa_nome}
                  onValueChange={(val) => setForm(f => ({ ...f, empresa_nome: val }))}
                  onSelectItem={(item) => handleSelecionarEmpresa(item.name)}
                  placeholder="Pesquisar ou selecionar empresa..."
                  entitySingular="empresa"
                  entityPlural="empresas"
                  addLabel="Criar nova empresa"
                  onAddClick={(termo) => setForm(f => ({ ...f, empresa_nome: termo || f.empresa_nome }))}
                  avatarClassName="bg-[#F5F2FC] text-brand-purple"
                />
              </div>

              {/* Nome da Empresa */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Nome da empresa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.empresa_nome}
                  onChange={set('empresa_nome')}
                  placeholder="Digite o nome da empresa"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Segmento */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Segmento
                </label>
                <SelectField
                  value={form.empresa_segmento}
                  onChange={set('empresa_segmento')}
                >
                  {SEGMENTOS_EMPRESA_OPCOES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </SelectField>
              </div>

              {/* URL / Website */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  URL
                </label>
                <input
                  type="text"
                  value={form.empresa_site}
                  onChange={set('empresa_site')}
                  placeholder="Digite o endereço do site da empresa"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Resumo */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Resumo
                </label>
                <textarea
                  value={form.empresa_resumo}
                  onChange={set('empresa_resumo')}
                  rows={3}
                  placeholder="Descreva a empresa"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary resize-none"
                />
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-1.5">
                  Endereço
                </label>
                <input
                  type="text"
                  value={form.empresa_endereco}
                  onChange={set('empresa_endereco')}
                  placeholder="Digite o endereço da empresa"
                  className="w-full bg-surface-subtle border border-surface-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-primary text-ink-primary font-medium transition-colors"
                />
              </div>

              {/* Alerta Informativo */}
              {alertaEmpresaAberto && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border-l-4 border-l-sky-500 border border-sky-200 dark:border-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={InformationCircleIcon} size={16} className="text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>As informações serão salvas ao criar a negociação</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertaEmpresaAberto(false)}
                    className="text-sky-600 dark:text-sky-400 hover:text-sky-900 dark:hover:text-sky-100 p-0.5 rounded transition-colors"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} />
                  </button>
                </div>
              )}

              {/* Botão Remover Empresa */}
              {form.empresa_nome && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLimparEmpresa}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200/80 dark:hover:bg-sky-900/60 text-xs font-bold transition-all shadow-2xs border border-sky-200/60 dark:border-sky-800"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2.5} />
                    <span>Remover empresa</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {erro && (
            <p className="text-rose-600 text-sm font-semibold bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900">
              {erro}
            </p>
          )}

          {/* Rodapé com Navegação e Ações */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-border">
            {/* Navegação entre etapas */}
            <div className="flex items-center gap-2">
              {abaAtiva === 'negocio' && (
                <button
                  type="button"
                  onClick={() => mudarAba('contato')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-brand-secondary hover:bg-brand-secondary/10 transition-colors"
                >
                  Ir para Contato →
                </button>
              )}
              {abaAtiva === 'contato' && (
                <button
                  type="button"
                  onClick={() => mudarAba('empresa')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-brand-secondary hover:bg-brand-secondary/10 transition-colors"
                >
                  Ir para Empresa →
                </button>
              )}
              {abaAtiva === 'empresa' && (
                <button
                  type="button"
                  onClick={() => mudarAba('negocio')}
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-ink-secondary hover:bg-surface-hover transition-colors"
                >
                  ← Voltar ao Negócio
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
                {salvando ? 'Salvando...' : leadEditando ? 'Salvar Negociação' : 'Criar Negociação'}
              </button>
            </div>
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
  const [etapas, setEtapas]                   = useState(() => {
    try {
      const salvo = localStorage.getItem('prancheto_crm_etapas_config');
      if (salvo) {
        const configSalva = JSON.parse(salvo);
        return ETAPAS_PIPELINE.map(p => ({
          ...p,
          ...(configSalva[p.key] || {})
        }));
      }
    } catch {
      // fallback
    }
    return ETAPAS_PIPELINE;
  });
  const [colunaConfigurando, setColunaConfigurando] = useState(null);
  const [modalAberto, setModalAberto]         = useState(false);
  const [etapaPreSelecionada, setEtapaPre]    = useState('nao_chamei');
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
      const st = normalizarEtapaFunil(deal.status_funil || etapas[0]?.key || 'nao_chamei');
      if (acc[st]) {
        acc[st].push(deal);
      } else if (acc.nao_chamei) {
        acc.nao_chamei.push(deal);
      } else if (acc[etapas[0]?.key]) {
        acc[etapas[0]?.key].push(deal);
      }
    });
    return acc;
  }, [dealsFiltrados, etapas]);

  // Cálculo das métricas gerais do topo (ex: R$ 1.2M ponderados em 14 negócios em aberto)
  const { totalValorGeral, totalDealsAbertos } = useMemo(() => {
    const dealsAbertos = dealsFiltrados.filter(d => normalizarEtapaFunil(d.status_funil) !== 'deu_ruim');
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
    setEtapas(prev => {
      const atualizado = prev.map(e => e.key === etapaKey ? { ...e, ...novosDados } : e);
      try {
        const configs = {};
        atualizado.forEach(e => {
          configs[e.key] = {
            titulo: e.titulo,
            probabilidadePadrao: e.probabilidadePadrao,
            corId: e.corId,
            corDot: e.corDot,
            corTotal: e.corTotal,
            corBg: e.corBg,
            corBorda: e.corBorda,
            corBotaoAdd: e.corBotaoAdd,
            corHex: e.corHex,
          };
        });
        localStorage.setItem('prancheto_crm_etapas_config', JSON.stringify(configs));
      } catch (err) {
        console.error('Erro ao salvar configurações da coluna no localStorage:', err);
      }
      return atualizado;
    });
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
            onClick={() => handleNovoDealEtapa(etapas[0]?.key || 'nao_chamei')}
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