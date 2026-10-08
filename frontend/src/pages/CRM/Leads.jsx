// =============================================================
// PRANCHETO.IA - DEALS PIPELINE (CRM KANBAN - EMITLY DESIGN SYSTEM)
// Pipeline visual com 5 etapas (Qualifying, Discovery, Proposal,
// Negotiation, Closing), drag & drop, filtros e cards enriquecidos.
// Baseado fielmente na especificação visual de Deals Pipeline.
// =============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  useLeads, useInteracoes,
  TIPOS_INTERACAO, ORIGENS,
  tipoInfo, origemInfo, formatarData, tempoRelativo,
} from '../../hooks/useCRM.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import {
  ENDERECO_VAZIO, CamposNegocio, CampoWhatsapp, CamposEmpresa, limparEndereco,
  PORTE_LABEL, formatarEndereco,
  SecaoRecolhivel, temDadosNegocio, temDadosEmpresa,
} from '../../components/crm/CamposContatoExtras.jsx';

// ─── 5 ETAPAS DO PIPELINE (FIÉIS À IMAGEM) ─────────────────────
export const ETAPAS_PIPELINE = [
  {
    key: 'lead',
    titulo: 'Qualifying',
    rotuloPt: 'Qualificação',
    corTotal: 'text-blue-700',
    corBg: 'bg-[#F3F7FA]',
    corBorda: 'border-[#E2EAF1]',
    corBotaoAdd: 'border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50/60',
    tagPadrao: 'New',
    probabilidadePadrao: 30,
  },
  {
    key: 'qualificado',
    titulo: 'Discovery',
    rotuloPt: 'Descoberta',
    corTotal: 'text-purple-700',
    corBg: 'bg-[#F7F4FA]',
    corBorda: 'border-[#E9E2F2]',
    corBotaoAdd: 'border-purple-200 text-purple-600 hover:border-purple-300 hover:bg-purple-50/60',
    tagPadrao: 'Enterprise',
    probabilidadePadrao: 50,
  },
  {
    key: 'proposta',
    titulo: 'Proposal',
    rotuloPt: 'Proposta',
    corTotal: 'text-amber-800',
    corBg: 'bg-[#FAF7EC]',
    corBorda: 'border-[#EFE8D3]',
    corBotaoAdd: 'border-amber-300 text-amber-700 hover:border-amber-400 hover:bg-amber-50/60',
    tagPadrao: 'Warm',
    probabilidadePadrao: 65,
  },
  {
    key: 'negociacao',
    titulo: 'Negotiation',
    rotuloPt: 'Negociação',
    corTotal: 'text-rose-800',
    corBg: 'bg-[#FAF3F3]',
    corBorda: 'border-[#F2E0E2]',
    corBotaoAdd: 'border-rose-300 text-rose-600 hover:border-rose-400 hover:bg-rose-50/60',
    tagPadrao: 'Active',
    probabilidadePadrao: 80,
  },
  {
    key: 'fechado',
    titulo: 'Closing',
    rotuloPt: 'Fechamento',
    corTotal: 'text-blue-900',
    corBg: 'bg-[#F2F6F4]',
    corBorda: 'border-[#E1ECE5]',
    corBotaoAdd: 'border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50/60',
    tagPadrao: 'Renewal',
    probabilidadePadrao: 90,
  },
];

// ─── DEALS DEMO (EXATOS DA IMAGEM PARA RESILIÊNCIA E APRESENTAÇÃO) ─
const DEALS_DEMO = [
  {
    id: 'demo-1',
    nome: 'Compliance module',
    negocio_nome: 'Compliance module',
    empresa: 'Verado Group',
    status_funil: 'lead',
    valor_estimado: 118000,
    score: 30,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 41 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 41 * 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    nome: 'Pilot: route optimiser',
    negocio_nome: 'Pilot: route optimiser',
    empresa: 'Northwind Freight',
    status_funil: 'lead',
    valor_estimado: 42000,
    score: 35,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 33 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 33 * 86400000).toISOString(),
  },
  {
    id: 'demo-3',
    nome: 'Studio workspace plan',
    negocio_nome: 'Studio workspace plan',
    empresa: 'Cadenza Studio',
    status_funil: 'lead',
    valor_estimado: 19000,
    score: 25,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 48 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 48 * 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    nome: 'Clinical data platform',
    negocio_nome: 'Clinical data platform',
    empresa: 'Meridian Health',
    status_funil: 'qualificado',
    valor_estimado: 262000,
    score: 45,
    tags: ['Enterprise'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 26 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 26 * 86400000).toISOString(),
  },
  {
    id: 'demo-5',
    nome: 'Shop-floor sensors',
    negocio_nome: 'Shop-floor sensors',
    empresa: 'Quartzline Systems',
    status_funil: 'qualificado',
    valor_estimado: 76000,
    score: 55,
    tags: ['Warm'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 18 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
  {
    id: 'demo-6',
    nome: 'Fleet telemetry rollout',
    negocio_nome: 'Fleet telemetry rollout',
    empresa: 'Northwind Freight',
    status_funil: 'proposta',
    valor_estimado: 148000,
    score: 65,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 12 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'demo-7',
    nome: 'Regional CRM migration',
    negocio_nome: 'Regional CRM migration',
    empresa: 'Halden Marine',
    status_funil: 'proposta',
    valor_estimado: 204000,
    score: 40,
    tags: ['Enterprise'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 22 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    id: 'demo-8',
    nome: 'Data residency add-on',
    negocio_nome: 'Data residency add-on',
    empresa: 'Meridian Health',
    status_funil: 'proposta',
    valor_estimado: 67000,
    score: 50,
    tags: ['Warm'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'demo-9',
    nome: 'Warehouse automation',
    negocio_nome: 'Warehouse automation',
    empresa: 'Brightpath Retail',
    status_funil: 'negociacao',
    valor_estimado: 91000,
    score: 80,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 5 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'demo-10',
    nome: 'Vendor consolidation',
    negocio_nome: 'Vendor consolidation',
    empresa: 'Brightpath Retail',
    status_funil: 'negociacao',
    valor_estimado: 158000,
    score: 35,
    tags: ['New'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 9 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
  {
    id: 'demo-11',
    nome: 'Cloud migration',
    negocio_nome: 'Cloud migration',
    empresa: 'Summit Technologies',
    status_funil: 'negociacao',
    valor_estimado: 230000,
    score: 62,
    tags: ['Active'],
    responsavel: { nome: 'John Russell' },
    criado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'demo-12',
    nome: 'Platform redesign',
    negocio_nome: 'Platform redesign',
    empresa: 'Meridian Health',
    status_funil: 'negociacao',
    valor_estimado: 89000,
    score: 18,
    tags: ['Review'],
    responsavel: { nome: 'Anna Lee' },
    criado_em: new Date(Date.now() - 14 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'demo-13',
    nome: 'Analytics seat expansion',
    negocio_nome: 'Analytics seat expansion',
    empresa: 'Latchkey Labs',
    status_funil: 'fechado',
    valor_estimado: 34000,
    score: 90,
    tags: ['Renewal'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 2 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'demo-14',
    nome: 'Support tier upgrade',
    negocio_nome: 'Support tier upgrade',
    empresa: 'Orbit Analytics',
    status_funil: 'fechado',
    valor_estimado: 28000,
    score: 85,
    tags: ['Renewal'],
    responsavel: { nome: 'Kevin Taylor' },
    criado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

// ─── HELPERS DE FORMATAÇÃO E ESTILO ────────────────────────────
export const formatarK = (valor, prefixo = '$') => {
  if (!valor || isNaN(valor)) return `${prefixo}0K`;
  const v = Number(valor);
  if (v >= 1000000) {
    return `${prefixo}${(v / 1000000).toFixed(1).replace('.0', '')}M`;
  }
  if (v >= 1000) {
    return `${prefixo}${Math.round(v / 1000)}K`;
  }
  return `${prefixo}${v.toLocaleString('pt-BR')}`;
};

const obterEstiloTag = (tag) => {
  const t = (tag || '').toLowerCase();
  if (t.includes('new') || t.includes('novo') || t.includes('inbound')) {
    return 'bg-blue-50 text-blue-700 border border-blue-200/60';
  }
  if (t.includes('enterprise') || t.includes('indicacao')) {
    return 'bg-indigo-50 text-indigo-700 border border-indigo-200/60';
  }
  if (t.includes('warm') || t.includes('morno') || t.includes('evento')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200/60';
  }
  if (t.includes('active') || t.includes('ativo') || t.includes('negociacao')) {
    return 'bg-orange-50 text-orange-700 border border-orange-200/60';
  }
  if (t.includes('renewal') || t.includes('recorrente') || t.includes('saas')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200/60';
  }
  if (t.includes('review') || t.includes('revisao') || t.includes('proposta')) {
    return 'bg-rose-50 text-rose-700 border border-rose-200/60';
  }
  return 'bg-slate-50 text-slate-700 border border-slate-200/60';
};

const formatarTagTexto = (lead, etapa) => {
  if (Array.isArray(lead.tags) && lead.tags.length > 0) {
    const raw = String(lead.tags[0]);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  if (typeof lead.tags === 'string' && lead.tags.trim()) {
    try {
      const parsed = JSON.parse(lead.tags);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const raw = String(parsed[0]);
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      }
    } catch {
      return lead.tags;
    }
  }
  return etapa?.tagPadrao || 'New';
};

const extrairIniciais = (deal) => {
  const nome = deal?.responsavel?.nome || deal?.nome || 'KT';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const diasNaEtapa = (isoData) => {
  if (!isoData) return '2d in stage';
  const diff = Date.now() - new Date(isoData).getTime();
  const dias = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return `${dias}d in stage`;
};

// ─── COMPONENTE: CARD DO DEAL (KANBAN) ─────────────────────────
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
      className="bg-white rounded-2xl p-4 border border-[#E4ECE7] shadow-[0_2px_8px_-2px_rgba(14,56,44,0.03)] hover:shadow-md hover:border-[#CBDCD1] transition-all cursor-grab active:cursor-grabbing select-none group space-y-2.5"
    >
      {/* Topo: Título do Deal e Badge de Categoria */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-extrabold text-[#111915] leading-snug group-hover:text-[#0E382C] transition-colors truncate flex-1">
            {deal.negocio_nome || deal.nome}
          </h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${tagClasse}`}>
            {tagTexto}
          </span>
        </div>
        <p className="text-xs text-[#687770] font-medium mt-0.5 truncate">
          {deal.empresa || deal.nome}
        </p>
      </div>

      {/* Meio: Valor em destaque e Barra de Probabilidade */}
      <div className="pt-0.5">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg sm:text-xl font-extrabold text-[#111915] tracking-tight">
            {valorFormatado}
          </span>
          <span className="text-xs font-bold text-[#687770]">
            {probabilidade}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#EBF0ED] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#15803D] transition-all duration-300"
            style={{ width: `${probabilidade}%` }}
          />
        </div>
      </div>

      {/* Rodapé: Avatar e Tempo na Etapa */}
      <div className="flex items-center justify-between pt-1">
        <div
          className="w-6 h-6 rounded-full bg-[#FFE8E1] text-[#C84B31] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs"
          title={deal.responsavel?.nome || deal.nome}
        >
          {iniciais}
        </div>
        <span className="text-[11px] text-[#687770] font-medium">
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
      className={`w-72 sm:w-80 flex-shrink-0 flex flex-col rounded-3xl p-3 sm:p-3.5 transition-all duration-200 ${etapa.corBg} border ${
        isDragOver ? 'ring-2 ring-emerald-500 border-emerald-400 scale-[1.01]' : etapa.corBorda
      } group/coluna relative`}
    >
      {/* Header da Coluna */}
      <div className="px-1 pt-1 pb-3 flex items-center justify-between min-h-[36px]">
        {modoBusca ? (
          /* Modo Busca Ativo: Substitui cabeçalho e botões por barra de pesquisa */
          <div className="flex items-center gap-1.5 w-full bg-white border border-[#E4ECE7] rounded-xl px-2.5 py-1.5 shadow-2xs transition-all duration-300">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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
              className="w-full bg-transparent text-xs text-[#111915] placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setBuscaColuna('');
                setModoBusca(false);
              }}
              className="text-slate-400 hover:text-slate-600 text-xs p-0.5 rounded-md shrink-0"
              title="Fechar pesquisa"
            >
              ✕
            </button>
          </div>
        ) : (
          /* Modo Padrão: Titulo [quantidade] valor_total à esquerda | Ações à direita */
          <div className="flex items-center justify-between w-full gap-2 min-w-0">
            {/* Lado Esquerdo: Nome da coluna [2] $242k */}
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <h3 className="font-extrabold text-xs sm:text-sm text-[#111915] truncate">
                {etapa.titulo}
              </h3>
              <span className="w-5 h-5 min-w-[20px] rounded-md bg-white/90 border border-[#D5E0D9] text-[#111915] flex items-center justify-center text-[11px] font-bold shadow-2xs shrink-0">
                {deals.length}
              </span>
              <span className={`text-xs sm:text-sm font-extrabold shrink-0 ${etapa.corTotal}`}>
                {totalFormatado}
              </span>
            </div>

            {/* Lado Direito: Engrenagem (hover), + (adicionar deal), Lupa (pesquisar) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* 1. Botão de Engrenagem (visível apenas ao posicionar o mouse na coluna) */}
              <button
                type="button"
                onClick={() => onConfigurarColuna(etapa)}
                className="opacity-0 group-hover/coluna:opacity-100 transition-opacity p-1.5 text-[#687770] hover:text-[#0E382C] hover:bg-white/80 rounded-lg"
                title="Configurações da coluna"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* 2. Botão de + para adicionar novo negócio na coluna */}
              <button
                type="button"
                onClick={() => onNovoDealEtapa(etapa.key)}
                className="p-1.5 text-[#687770] hover:text-[#0E382C] hover:bg-white/80 rounded-lg transition-colors"
                title="Adicionar negócio nesta coluna"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
                </svg>
              </button>

              {/* 3. Botão de Lupa para pesquisar negócio na coluna */}
              <button
                type="button"
                onClick={() => setModoBusca(true)}
                className="p-1.5 text-[#687770] hover:text-[#0E382C] hover:bg-white/80 rounded-lg transition-colors"
                title="Pesquisar negócios nesta coluna"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Cards */}
      <div className="space-y-3 min-h-[140px] flex-1">
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
          <div className="h-28 rounded-2xl border-2 border-dashed border-slate-200/80 flex items-center justify-center p-3 text-center">
            <p className="text-xs text-[#687770] font-medium">
              {buscaColuna ? `Nenhum resultado para "${buscaColuna}"` : 'Nenhum negócio nesta etapa'}
            </p>
          </div>
        )}
      </div>

      {/* Botão + Add deal na base da coluna */}
      <div className="pt-3">
        <button
          type="button"
          onClick={() => onNovoDealEtapa(etapa.key)}
          className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-98 border border-dashed bg-white/70 hover:bg-white shadow-2xs ${etapa.corBotaoAdd}`}
        >
          <span>+ Add deal</span>
        </button>
      </div>
    </div>
  );
};

// ─── MODAL: CONFIGURAÇÃO DA COLUNA (ENGRENAGEM) ────────────────
const ModalConfigColuna = ({ aberto, onFechar, etapa, onSalvar }) => {
  const [titulo, setTitulo] = useState('');
  const [probabilidade, setProbabilidade] = useState('');
  const [limiteWip, setLimiteWip] = useState('');

  useEffect(() => {
    if (etapa) {
      setTitulo(etapa.titulo || '');
      setProbabilidade(etapa.probabilidadePadrao != null ? String(etapa.probabilidadePadrao) : '50');
      setLimiteWip(etapa.limiteWip != null ? String(etapa.limiteWip) : '');
    }
  }, [etapa, aberto]);

  if (!aberto || !etapa) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSalvar(etapa.key, {
      titulo: titulo.trim(),
      probabilidadePadrao: probabilidade ? Number(probabilidade) : 50,
      limiteWip: limiteWip ? Number(limiteWip) : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={onFechar}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md border border-[#E4ECE7] shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <div>
            <h3 className="font-extrabold text-base text-[#111915]">
              Configurações da Coluna
            </h3>
            <p className="text-xs text-[#687770]">Etapa: {etapa.titulo}</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#111915] mb-1">Nome da Etapa / Coluna</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl px-3.5 py-2 text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Probabilidade Padrão (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={probabilidade}
                onChange={(e) => setProbabilidade(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl px-3.5 py-2 text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Limite Máximo (WIP)</label>
              <input
                type="number"
                min="1"
                placeholder="Sem limite"
                value={limiteWip}
                onChange={(e) => setLimiteWip(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl px-3.5 py-2 text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              />
            </div>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-[#E4ECE7]">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#687770] bg-[#F7FAF8] hover:bg-[#EDF2EE] border border-[#E4ECE7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0E382C] hover:bg-[#07261E] shadow-xs"
            >
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── FORM VAZIO PARA CRIAÇÃO/EDIÇÃO DE NEGÓCIO ─────────────────
const FORM_VAZIO = {
  nome: '', email: '', telefone: '', whatsapp: '', empresa: '', cargo: '',
  origem: 'manual', status_funil: 'lead', valor_estimado: '', observacoes: '',
  negocio_nome: '', score: '50', tag_categoria: 'New',
  previsao_fechamento: '', campanha: '',
  razao_social: '', documento: '', segmento: '', site: '', porte: '',
  endereco: ENDERECO_VAZIO,
};

// ─── MODAL: CRIAR / EDITAR DEAL ────────────────────────────────
const ModalLead = ({ aberto, onFechar, onSalvar, leadEditando, statusInicial = 'lead', etapas }) => {
  const [form, setForm]         = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (leadEditando) {
      setForm({
        nome:          leadEditando.nome          || '',
        email:         leadEditando.email         || '',
        telefone:      leadEditando.telefone      || '',
        whatsapp:      leadEditando.whatsapp      || '',
        empresa:       leadEditando.empresa       || '',
        cargo:         leadEditando.cargo         || '',
        origem:        leadEditando.origem        || 'manual',
        status_funil:  leadEditando.status_funil  || statusInicial,
        valor_estimado:leadEditando.valor_estimado|| '',
        score:         leadEditando.score != null ? String(leadEditando.score) : '50',
        tag_categoria: Array.isArray(leadEditando.tags) && leadEditando.tags[0] ? leadEditando.tags[0] : 'New',
        observacoes:   leadEditando.observacoes   || '',
        negocio_nome:        leadEditando.negocio_nome        || leadEditando.nome || '',
        previsao_fechamento: leadEditando.previsao_fechamento ? leadEditando.previsao_fechamento.slice(0, 10) : '',
        campanha:            leadEditando.campanha            || '',
        razao_social:  leadEditando.razao_social  || '',
        documento:     leadEditando.documento     || '',
        segmento:      leadEditando.segmento      || '',
        site:          leadEditando.site          || '',
        porte:         leadEditando.porte         || '',
        endereco:      { ...ENDERECO_VAZIO, ...(leadEditando.endereco || {}) },
      });
    } else {
      setForm({ ...FORM_VAZIO, status_funil: statusInicial });
    }
    setErro('');
  }, [leadEditando, aberto, statusInicial]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim() && !form.negocio_nome.trim()) {
      setErro('Nome do negócio ou contato é obrigatório.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const nomeFinal = form.negocio_nome.trim() || form.nome.trim();
      await onSalvar({
        nome:           nomeFinal,
        negocio_nome:   form.negocio_nome.trim() || nomeFinal,
        email:          form.email.trim()    || null,
        telefone:       form.telefone.trim() || null,
        whatsapp:       form.whatsapp.trim() || null,
        empresa:        form.empresa.trim()  || null,
        cargo:          form.cargo.trim()    || null,
        origem:         form.origem,
        status_funil:   form.status_funil,
        valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
        score:          form.score ? Number(form.score) : 50,
        tags:           [form.tag_categoria],
        observacoes:    form.observacoes.trim() || null,
        previsao_fechamento: form.previsao_fechamento || null,
        campanha:            form.campanha.trim() || null,
        razao_social:   form.razao_social.trim() || null,
        documento:      form.documento.trim()    || null,
        segmento:       form.segmento.trim()     || null,
        site:           form.site.trim()         || null,
        porte:          form.porte || null,
        endereco:       limparEndereco(form.endereco),
      });
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar negócio.');
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    backgroundColor: '#F7FAF8',
    borderColor: '#E4ECE7',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onFechar}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg my-6 border border-[#E4ECE7] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7] mb-4">
          <div>
            <h3 className="font-extrabold text-base text-[#111915]">
              {leadEditando ? '✏️ Editar Negócio' : '💼 Novo Negócio (Deal)'}
            </h3>
            <p className="text-xs text-[#687770]">Preencha os dados da oportunidade e etapa no funil</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Título do Negócio *</label>
              <input
                type="text"
                value={form.negocio_nome}
                onChange={set('negocio_nome')}
                placeholder="Ex: Compliance module"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Empresa / Cliente *</label>
              <input
                type="text"
                value={form.empresa}
                onChange={set('empresa')}
                placeholder="Ex: Verado Group"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Valor Estimado ($ ou R$)</label>
              <input
                type="number"
                value={form.valor_estimado}
                onChange={set('valor_estimado')}
                placeholder="118000"
                min="0"
                step="1"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Probabilidade / Score (%)</label>
              <input
                type="number"
                value={form.score}
                onChange={set('score')}
                placeholder="30"
                min="0"
                max="100"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Etapa no Funil</label>
              <select
                value={form.status_funil}
                onChange={set('status_funil')}
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              >
                {(etapas || ETAPAS_PIPELINE).map(e => (
                  <option key={e.key} value={e.key}>{e.titulo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Categoria / Tag</label>
              <select
                value={form.tag_categoria}
                onChange={set('tag_categoria')}
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              >
                <option value="New">New (Novo)</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Warm">Warm (Morno)</option>
                <option value="Active">Active (Ativo)</option>
                <option value="Renewal">Renewal (Renovação)</option>
                <option value="Review">Review (Revisão)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">Nome do Contato</label>
              <input
                type="text"
                value={form.nome}
                onChange={set('nome')}
                placeholder="João Silva"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#111915] mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="contato@empresa.com"
                className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915]"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111915] mb-1">Observações do Negócio</label>
            <textarea
              value={form.observacoes}
              onChange={set('observacoes')}
              rows={2}
              placeholder="Detalhes, alinhamentos da reunião, escopo..."
              className="w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#0E382C] text-[#111915] resize-none"
              style={inputStyle}
            />
          </div>

          {erro && <p className="text-red-500 text-xs font-semibold">{erro}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-[#687770] bg-[#F7FAF8] hover:bg-[#EDF2EE] border border-[#E4ECE7] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0E382C] hover:bg-[#07261E] transition-all disabled:opacity-50 shadow-xs"
            >
              {salvando ? 'Salvando...' : 'Salvar Negócio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PAINEL DE DETALHES DO DEAL ────────────────────────────────
const PainelLead = ({ lead, onFechar, onEditar, onExcluir, onMudarStatus, onConverter, etapas }) => {
  const { interacoes, carregar, adicionar } = useInteracoes(lead?.id);
  const [novaInteracao, setNovaInteracao] = useState('');
  const [tipoInteracao, setTipoInteracao] = useState('nota');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (lead?.id && !String(lead.id).startsWith('demo-')) {
      carregar();
    }
  }, [lead?.id, carregar]);

  const handleInteracao = async (e) => {
    e.preventDefault();
    if (!novaInteracao.trim()) return;
    setEnviando(true);
    try {
      if (!String(lead?.id).startsWith('demo-')) {
        await adicionar(tipoInteracao, novaInteracao.trim());
      }
      setNovaInteracao('');
    } catch {
      // silencioso
    } finally {
      setEnviando(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onFechar}>
      <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] bg-white rounded-none sm:rounded-2xl flex flex-col border border-[#E4ECE7] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header do Painel */}
        <div className="flex items-start justify-between p-5 border-b border-[#E4ECE7] flex-shrink-0 bg-[#F7FAF8]">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-lg text-[#111915]">
                {lead.negocio_nome || lead.nome}
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${obterEstiloTag(formatarTagTexto(lead))}`}>
                {formatarTagTexto(lead)}
              </span>
            </div>
            {lead.empresa && (
              <p className="text-xs font-semibold text-[#687770] mt-1">{lead.empresa}</p>
            )}
            <div className="flex gap-4 mt-2.5 flex-wrap">
              <span className="text-xs font-extrabold text-[#0E382C]">
                💰 {formatarK(lead.valor_estimado)}
              </span>
              <span className="text-xs font-bold text-[#15803D]">
                ⚡ {lead.score || 50}% prob.
              </span>
              {lead.email && <span className="text-xs text-[#687770]">✉️ {lead.email}</span>}
              {lead.telefone && <span className="text-xs text-[#687770]">📞 {lead.telefone}</span>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3">
            <button
              onClick={() => onEditar(lead)}
              className="p-1.5 rounded-lg border border-[#E4ECE7] hover:bg-white text-xs font-bold text-[#111915]"
              title="Editar"
            >
              ✏️ Editar
            </button>
            <PermissaoGuarda permissao="crm.excluir">
              <button
                onClick={() => onExcluir(lead.id)}
                className="p-1.5 rounded-lg border border-[#E4ECE7] hover:bg-red-50 text-xs font-bold text-red-600"
                title="Excluir"
              >
                🗑️
              </button>
            </PermissaoGuarda>
            <button onClick={onFechar} className="p-1.5 text-slate-400 hover:text-slate-600 text-base">✕</button>
          </div>
        </div>

        {/* Mudar de Etapa */}
        <div className="px-5 py-3 border-b border-[#E4ECE7] flex items-center gap-2 flex-wrap bg-white flex-shrink-0">
          <span className="text-xs font-bold text-[#687770]">Mover para:</span>
          {(etapas || ETAPAS_PIPELINE).map((e) => (
            <button
              key={e.key}
              onClick={() => onMudarStatus(lead.id, e.key)}
              className={`text-xs px-2.5 py-1 rounded-full font-bold transition-all border ${
                lead.status_funil === e.key
                  ? 'bg-[#0E382C] text-white border-[#0E382C]'
                  : 'bg-[#F7FAF8] text-[#687770] border-[#E4ECE7] hover:border-[#0E382C]'
              }`}
            >
              {e.titulo}
            </button>
          ))}
        </div>

        {/* Histórico / Interações */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div>
            <h4 className="text-xs font-bold text-[#111915] uppercase tracking-wider mb-2">Registrar Atividade</h4>
            <form onSubmit={handleInteracao} className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                {TIPOS_INTERACAO.slice(0, 5).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTipoInteracao(t.key)}
                    className={`text-xs px-2.5 py-1 rounded-xl font-semibold border transition-all ${
                      tipoInteracao === t.key
                        ? 'bg-[#D4EC9D] text-[#0E382C] border-[#D4EC9D]'
                        : 'bg-[#F7FAF8] text-[#687770] border-[#E4ECE7]'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaInteracao}
                  onChange={(e) => setNovaInteracao(e.target.value)}
                  placeholder="Escreva uma nota sobre a reunião ou alinhamento..."
                  className="flex-1 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0E382C]"
                />
                <button
                  type="submit"
                  disabled={enviando || !novaInteracao.trim()}
                  className="px-4 py-2 bg-[#0E382C] text-white rounded-xl text-xs font-bold disabled:opacity-40"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-[#111915] uppercase tracking-wider mb-2">Linha do Tempo</h4>
            {interacoes && interacoes.length > 0 ? (
              <div className="space-y-2">
                {interacoes.map((item) => (
                  <div key={item.id} className="p-3 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#111915]">{item.tipo}</span>
                      <span className="text-[10px] text-[#687770]">{formatarData(item.criado_em)}</span>
                    </div>
                    <p className="text-[#687770]">{item.descricao}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#687770] italic">Nenhuma interação registrada ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PÁGINA PRINCIPAL: LEADS / DEALS PIPELINE ──────────────────
const PaginaLeads = () => {
  const {
    leads: leadsDb, carregando, erro,
    carregar, criar, atualizar, excluir,
    mudarStatus, converterParaCliente,
  } = useLeads();

  const [etapas, setEtapas]                   = useState(ETAPAS_PIPELINE);
  const [colunaConfigurando, setColunaConfigurando] = useState(null);
  const [modalAberto, setModalAberto]         = useState(false);
  const [etapaPreSelecionada, setEtapaPre]    = useState('lead');
  const [leadEditando, setLeadEditando]       = useState(null);
  const [painelLead, setPainelLead]           = useState(null);
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

  // Lista única de Owners para o dropdown "All owners"
  const listaOwners = useMemo(() => {
    const map = new Map();
    dealsLocais.forEach((d) => {
      const nome = d.responsavel?.nome || 'Kevin Taylor';
      if (!map.has(nome)) {
        map.set(nome, { id: nome, nome });
      }
    });
    return Array.from(map.values());
  }, [dealsLocais]);

  // Filtro por busca geral e por responsável (owner)
  const dealsFiltrados = useMemo(() => {
    return dealsLocais.filter((deal) => {
      const matchBusca = !busca ||
        (deal.negocio_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (deal.nome || '').toLowerCase().includes(busca.toLowerCase()) ||
        (deal.empresa || '').toLowerCase().includes(busca.toLowerCase()) ||
        (Array.isArray(deal.tags) && deal.tags.some(t => t.toLowerCase().includes(busca.toLowerCase())));

      if (!matchBusca) return false;

      if (ownerSelecionado) {
        const nomeResp = deal.responsavel?.nome || 'Kevin Taylor';
        if (nomeResp !== ownerSelecionado.nome) return false;
      }

      return true;
    });
  }, [dealsLocais, busca, ownerSelecionado]);

  // Agrupamento dos deals por etapa do pipeline
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

  // Cálculo das métricas gerais do topo (ex: $1247K weighted across 12 open deals)
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
    if (leadEditando) {
      if (!String(leadEditando.id).startsWith('demo-')) {
        const atualizado = await atualizar(leadEditando.id, dados);
        if (painelLead?.id === leadEditando.id) setPainelLead(atualizado);
      } else {
        setDealsLocais(prev =>
          prev.map(d => d.id === leadEditando.id ? { ...d, ...dados } : d)
        );
      }
    } else {
      try {
        const novo = await criar(dados);
        if (novo) {
          setDealsLocais(prev => [novo, ...prev]);
        }
      } catch (err) {
        const novoLocal = {
          ...dados,
          id: `local-${Date.now()}`,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        };
        setDealsLocais(prev => [novoLocal, ...prev]);
      }
    }
    setLeadEditando(null);
  };

  const handleEditar = (deal) => {
    setLeadEditando(deal);
    setModalAberto(true);
    setPainelLead(null);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este negócio?')) return;
    setDealsLocais(prev => prev.filter(d => d.id !== id));
    if (!String(id).startsWith('demo-') && !String(id).startsWith('local-')) {
      await excluir(id);
    }
    if (painelLead?.id === id) setPainelLead(null);
  };

  const handleMudarStatus = async (id, novaEtapa) => {
    setDealsLocais(prev =>
      prev.map(d => d.id === id ? { ...d, status_funil: novaEtapa, atualizado_em: new Date().toISOString() } : d)
    );
    if (!String(id).startsWith('demo-') && !String(id).startsWith('local-')) {
      await mudarStatus(id, novaEtapa);
    }
    if (painelLead?.id === id) {
      setPainelLead(prev => ({ ...prev, status_funil: novaEtapa }));
    }
  };

  const handleConverter = async (id) => {
    if (!String(id).startsWith('demo-') && !String(id).startsWith('local-')) {
      await converterParaCliente(id);
    }
    setDealsLocais(prev => prev.filter(d => d.id !== id));
    setPainelLead(null);
  };

  const handleSalvarConfigColuna = (etapaKey, novosDados) => {
    setEtapas(prev => prev.map(e => e.key === etapaKey ? { ...e, ...novosDados } : e));
    setColunaConfigurando(null);
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────
          HEADER DO DEALS PIPELINE (HERO BAR)
         ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111915] tracking-tight">
            Deals Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-[#687770] font-medium mt-1">
            {formatarK(totalValorGeral)} weighted across {totalDealsAbertos} open deals · drag a card to change stage
          </p>
        </div>

        {/* Controles do Topo (Busca Geral, All owners, + New deal) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Busca Rápida Geral */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar deals..."
              className="pl-8 pr-7 py-2 bg-white border border-[#E4ECE7] rounded-full text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C] shadow-2xs w-44 sm:w-52 transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro: All owners */}
          <div className="relative" ref={filtroRef}>
            <button
              type="button"
              onClick={() => setDropdownOwnersAberto(!dropdownOwnersAberto)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E4ECE7] rounded-full text-xs font-semibold text-[#111915] hover:bg-[#F7FAF8] shadow-2xs transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{ownerSelecionado ? ownerSelecionado.nome : 'All owners'}</span>
              <svg className="w-3.5 h-3.5 text-[#687770]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOwnersAberto && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E4ECE7] rounded-2xl shadow-lg p-1.5 z-30 space-y-0.5">
                <button
                  type="button"
                  onClick={() => { setOwnerSelecionado(null); setDropdownOwnersAberto(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors ${
                    !ownerSelecionado ? 'bg-[#DCF5E4] text-[#15803D]' : 'text-[#111915] hover:bg-[#F7FAF8]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    All owners
                  </span>
                  {!ownerSelecionado && <span>✓</span>}
                </button>
                {listaOwners.map((owner) => (
                  <button
                    key={owner.id}
                    type="button"
                    onClick={() => { setOwnerSelecionado(owner); setDropdownOwnersAberto(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors ${
                      ownerSelecionado?.id === owner.id ? 'bg-[#DCF5E4] text-[#15803D]' : 'text-[#111915] hover:bg-[#F7FAF8]'
                    }`}
                  >
                    <span className="truncate">{owner.nome}</span>
                    {ownerSelecionado?.id === owner.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão + New deal */}
          <button
            type="button"
            onClick={() => handleNovoDealEtapa(etapas[0]?.key || 'lead')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white rounded-full text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 shrink-0"
          >
            <span>+ New deal</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          KANBAN COM AS 5 ETAPAS DO PIPELINE
         ───────────────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
        <div className="flex gap-4 items-start min-w-max">
          {etapas.map((etapa) => (
            <ColunaPipeline
              key={etapa.key}
              etapa={etapa}
              deals={dealsPorEtapa[etapa.key] || []}
              onAbrir={setPainelLead}
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

      {/* Modal Criar / Editar Deal */}
      <ModalLead
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setLeadEditando(null); }}
        onSalvar={handleSalvarDeal}
        leadEditando={leadEditando}
        statusInicial={etapaPreSelecionada}
        etapas={etapas}
      />

      {/* Painel de Detalhes do Deal */}
      {painelLead && (
        <PainelLead
          lead={painelLead}
          onFechar={() => setPainelLead(null)}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
          onMudarStatus={handleMudarStatus}
          onConverter={handleConverter}
          etapas={etapas}
        />
      )}
    </div>
  );
};

export default PaginaLeads;