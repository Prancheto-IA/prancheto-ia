// =============================================================
// PRANCHETO.IA - MÓDULO DE TAREFAS
// Inspirado no design system "Weihu":
// 1. Quadro Kanban com 4 colunas arredondadas e limpas (A Fazer, Em Progresso, Em Revisão, Concluído).
// 2. Cards com tons pastel distintos e suaves para cada card, tags translúcidas,
//    barra de progresso em contas circulares (dots), checklists interativos e avatares sobrepostos.
// 3. Drag-and-drop fluído com @dnd-kit (sensores por clique/arrasto, collision detection e DragOverlay).
// 4. Header estilizado com Mês, Data em Português, Seletor de Quadro, Filtros Avançados e Alternador Quadro/Lista.
// =============================================================

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDroppable,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTarefas } from '../../hooks/useTarefas';
import { useAuthStore } from '../../store/authStore';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MoreVerticalIcon,
  FilterIcon,
  Add01Icon,
  Calendar03Icon,
  Attachment01Icon,
  Comment01Icon,
  Menu01Icon,
  ArrowDown01Icon,
  Sorting01Icon,
  DashboardSquare01Icon,
  Search01Icon,
  Edit02Icon,
  Delete02Icon,
  CheckmarkSquare01Icon,
} from '@hugeicons/core-free-icons';

// ─────────────────────────────────────────────────────────────
// PALETA DE CORES EM TONS PASTEL (Inspiração Weihu UI)
// ─────────────────────────────────────────────────────────────
export const CORES_PASTEL = [
  {
    id: 'azul',
    nome: 'Azul Pastel',
    bg: 'bg-[#EAF3FF]',
    borda: 'border-[#D1E4FA]',
    hoverBorda: 'hover:border-[#B7D6F8]',
    tagBg: 'bg-white/85 text-[#1D4ED8]',
    progressoCor: 'bg-[#2563EB]',
    checkCor: 'text-[#2563EB]',
    badgeBg: 'bg-[#E0EEFF] text-[#1D4ED8]',
  },
  {
    id: 'pessego',
    nome: 'Pêssego / Laranja',
    bg: 'bg-[#FFF1E8]',
    borda: 'border-[#FEDBC7]',
    hoverBorda: 'hover:border-[#FCC2A3]',
    tagBg: 'bg-white/85 text-[#C2410C]',
    progressoCor: 'bg-[#EA580C]',
    checkCor: 'text-[#EA580C]',
    badgeBg: 'bg-[#FFE5D4] text-[#C2410C]',
  },
  {
    id: 'lavanda',
    nome: 'Lavanda / Roxo',
    bg: 'bg-[#F4EEFF]',
    borda: 'border-[#E6DAFA]',
    hoverBorda: 'hover:border-[#D5C0F6]',
    tagBg: 'bg-white/85 text-[#6D28D9]',
    progressoCor: 'bg-[#7C3AED]',
    checkCor: 'text-[#7C3AED]',
    badgeBg: 'bg-[#ECE0FF] text-[#6D28D9]',
  },
  {
    id: 'menta',
    nome: 'Menta / Verde',
    bg: 'bg-[#E7F8F0]',
    borda: 'border-[#C8EED9]',
    hoverBorda: 'hover:border-[#A6E3C0]',
    tagBg: 'bg-white/85 text-[#047857]',
    progressoCor: 'bg-[#059669]',
    checkCor: 'text-[#059669]',
    badgeBg: 'bg-[#D6F4E4] text-[#047857]',
  },
  {
    id: 'rosa',
    nome: 'Rosa / Framboesa',
    bg: 'bg-[#FFEBF0]',
    borda: 'border-[#FDCDD8]',
    hoverBorda: 'hover:border-[#FAAEC0]',
    tagBg: 'bg-white/85 text-[#BE123C]',
    progressoCor: 'bg-[#E11D48]',
    checkCor: 'text-[#E11D48]',
    badgeBg: 'bg-[#FDD8E3] text-[#BE123C]',
  },
  {
    id: 'aqua',
    nome: 'Aqua / Ciano',
    bg: 'bg-[#E5F7F8]',
    borda: 'border-[#C1EDF0]',
    hoverBorda: 'hover:border-[#9EE1E6]',
    tagBg: 'bg-white/85 text-[#0E7490]',
    progressoCor: 'bg-[#0891B2]',
    checkCor: 'text-[#0891B2]',
    badgeBg: 'bg-[#D4F2F5] text-[#0E7490]',
  },
  {
    id: 'creme',
    nome: 'Creme / Amarelo',
    bg: 'bg-[#FEF8E7]',
    borda: 'border-[#FCE8B3]',
    hoverBorda: 'hover:border-[#FAD785]',
    tagBg: 'bg-white/85 text-[#B45309]',
    progressoCor: 'bg-[#D97706]',
    checkCor: 'text-[#D97706]',
    badgeBg: 'bg-[#FDF0CE] text-[#B45309]',
  },
];

// Obtém deterministicamente a cor pastel para cada card
export const obterCorPastel = (tarefa, index = 0) => {
  if (tarefa?.cor_pastel) {
    const achou = CORES_PASTEL.find(c => c.id === tarefa.cor_pastel);
    if (achou) return achou;
  }
  const str = String(tarefa?.id || tarefa?.titulo || index);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % CORES_PASTEL.length;
  return CORES_PASTEL[idx];
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Barra de Progresso em Contas / Pontos Circulares (Dots)
// ─────────────────────────────────────────────────────────────
const BarraPontosProgresso = ({ progresso = 0, corAtiva = 'bg-blue-600' }) => {
  const totalPontos = 10;
  const pontosAtivos = Math.min(10, Math.max(0, Math.round((progresso || 0) / 10)));

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      {Array.from({ length: totalPontos }).map((_, i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < pontosAtivos ? corAtiva : 'bg-black/10'
          }`}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COLUNAS DO KANBAN
// ─────────────────────────────────────────────────────────────
const COLUNAS_KANBAN = [
  {
    slug: 'pendente',
    label: 'A Fazer',
    subtitulo: 'Todo list',
  },
  {
    slug: 'em_andamento',
    label: 'Em Progresso',
    subtitulo: 'In Progress',
  },
  {
    slug: 'em_revisao',
    label: 'Em Revisão',
    subtitulo: 'In Review',
  },
  {
    slug: 'concluida',
    label: 'Concluído',
    subtitulo: 'Done',
  },
];

// Equipe para avatares ilustrativos
const MEMBROS_EQUIPE_DEMO = [
  { nome: 'Brooklyn Simmons', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80', bg: '#4338CA' },
  { nome: 'Alexandre Ramos', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80', bg: '#0E382C' },
  { nome: 'Mariana Lima', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80', bg: '#D97706' },
  { nome: 'Carlos Mendes', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80', bg: '#BE123C' },
];

// ─────────────────────────────────────────────────────────────
// DADOS DE DEMONSTRAÇÃO (Fieis à estética Weihu da imagem)
// ─────────────────────────────────────────────────────────────
const TAREFAS_DEMO = [
  // ── Coluna: A Fazer (Todo list) ──
  {
    id: 'demo-t1',
    titulo: 'Pesquisa de Inspirações para Novos Projetos',
    descricao: 'Levantamento de referências e diretrizes visuais para o próximo ciclo de produto.',
    nota: 'Referência principal: Behance project Mise',
    projeto: 'Website',
    tags: ['#website', '#cliente'],
    status: 'pendente',
    prioridade: 'alta',
    cor_pastel: 'azul',
    progresso: 40,
    anexos_count: 1,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[0], MEMBROS_EQUIPE_DEMO[1]],
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Brooklyn Simmons' } }],
  },
  {
    id: 'demo-t2',
    titulo: 'Design do Aplicativo Mobile Ginko',
    descricao: 'Estruturação da experiência de ponta a ponta para o app iOS e Android.',
    nota: 'Alinhamento com stakeholders às 14:30',
    projeto: 'Mobile App',
    tags: ['#mobile app', '#cliente'],
    status: 'pendente',
    prioridade: 'critica',
    cor_pastel: 'lavanda',
    progresso: 15,
    anexos_count: 0,
    comentarios_count: 2,
    subtarefas_count: 7,
    tarefa_checklist: [
      { id: 'c1', texto: 'Criar fluxo do usuário', concluido: true },
      { id: 'c2', texto: 'Construir wireframes', concluido: true },
      { id: 'c3', texto: 'Design de telas de onboarding', concluido: false },
      { id: 'c4', texto: 'Construção do protótipo no Figma', concluido: false },
    ],
    membros: [MEMBROS_EQUIPE_DEMO[1], MEMBROS_EQUIPE_DEMO[2], MEMBROS_EQUIPE_DEMO[3]],
    tarefa_atribuicoes: [{ user_id: 'u2', users: { nome: 'Alexandre Ramos' } }],
  },
  {
    id: 'demo-t3',
    titulo: 'Fluxo de Onboarding Mobile Banking Akua',
    descricao: 'Mapeamento de jornada de abertura de conta com validação biométrica e KYC.',
    nota: 'Revisar conformidade regulatória',
    projeto: 'Fintech',
    tags: ['#mobile app', '#cliente'],
    status: 'pendente',
    prioridade: 'media',
    cor_pastel: 'rosa',
    progresso: 30,
    anexos_count: 0,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[0]],
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Brooklyn Simmons' } }],
  },

  // ── Coluna: Em Progresso (In Progress) ──
  {
    id: 'demo-t4',
    titulo: 'Tarefas de Produto Wehiu e Processos das Telas',
    descricao: 'Desenvolvimento das telas de visualização de tarefas, kanban board e fluxos de aprovação.',
    nota: 'Necessário finalizar antes do fim de semana',
    projeto: 'Produto',
    tags: ['#dribbble shot', '#produto'],
    status: 'em_andamento',
    prioridade: 'alta',
    cor_pastel: 'pessego',
    progresso: 90,
    previewMockup: true,
    anexos_count: 2,
    comentarios_count: 1,
    subtarefas_count: 6,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[0], MEMBROS_EQUIPE_DEMO[2]],
    tarefa_atribuicoes: [{ user_id: 'u3', users: { nome: 'Mariana Lima' } }],
  },
  {
    id: 'demo-t5',
    titulo: 'Design Responsivo do CRM Shop & E-commerce',
    descricao: 'Ajuste de breakpoints, grid flexível e tipografia responsiva para tablets e desktops.',
    nota: 'Testar performance no Safari mobile',
    projeto: 'Website',
    tags: ['#produtos', '#cliente'],
    status: 'em_andamento',
    prioridade: 'media',
    cor_pastel: 'menta',
    progresso: 40,
    anexos_count: 1,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[1], MEMBROS_EQUIPE_DEMO[2], MEMBROS_EQUIPE_DEMO[3]],
    tarefa_atribuicoes: [{ user_id: 'u2', users: { nome: 'Alexandre Ramos' } }],
  },

  // ── Coluna: Em Revisão (In Review) ──
  {
    id: 'demo-t6',
    titulo: 'Landing Page Orypto e Implementação Webflow',
    descricao: 'Construção da página de captação institucional com animações suaves e integrações.',
    nota: 'Aguardando aprovação do copy final',
    projeto: 'Desenvolvimento',
    tags: ['#desenvolvimento', '#cliente'],
    status: 'em_revisao',
    prioridade: 'alta',
    cor_pastel: 'lavanda',
    progresso: 85,
    anexos_count: 1,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[0], MEMBROS_EQUIPE_DEMO[1], MEMBROS_EQUIPE_DEMO[2]],
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Brooklyn Simmons' } }],
  },
  {
    id: 'demo-t7',
    titulo: 'Plataforma de Vídeo Natverk - Web App e Dev',
    descricao: 'Pipeline de streaming sob demanda e painel de controle administrativo.',
    nota: 'Revisão técnica de endpoints',
    projeto: 'Produto',
    tags: ['#produto', '#cliente'],
    status: 'em_revisao',
    prioridade: 'media',
    cor_pastel: 'azul',
    progresso: 60,
    anexos_count: 1,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[1], MEMBROS_EQUIPE_DEMO[3]],
    tarefa_atribuicoes: [{ user_id: 'u4', users: { nome: 'Carlos Mendes' } }],
  },
  {
    id: 'demo-t8',
    titulo: 'Redesign Grab - Telas de Login e Acesso',
    descricao: 'Modernização da autenticação e suporte a SSO empresarial.',
    nota: 'Alinhamento marcado para as 15:12',
    projeto: 'Website',
    tags: ['#website', '#cliente'],
    status: 'em_revisao',
    prioridade: 'baixa',
    cor_pastel: 'creme',
    progresso: 75,
    anexos_count: 0,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[2]],
    tarefa_atribuicoes: [{ user_id: 'u3', users: { nome: 'Mariana Lima' } }],
  },
  {
    id: 'demo-t9',
    titulo: 'Protótipo Odyah no Figma para Notificações',
    descricao: 'Fluxo interativo de envio de avisos em tempo real e centro de notificações.',
    nota: 'Configurar variantes nos componentes',
    projeto: 'Mobile App',
    tags: ['#mobile app', '#cliente'],
    status: 'em_revisao',
    prioridade: 'baixa',
    cor_pastel: 'lavanda',
    progresso: 50,
    anexos_count: 0,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[0]],
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Brooklyn Simmons' } }],
  },

  // ── Coluna: Concluído (Done) ──
  {
    id: 'demo-t10',
    titulo: 'Serviço Completo de Produto Affitto',
    descricao: 'Entrega consolidada com design system, brand guide e interfaces operacionais.',
    nota: 'Documentação disponibilizada no drive',
    projeto: 'Mobile App',
    tags: ['#mobile app', '#cliente'],
    status: 'concluida',
    prioridade: 'alta',
    cor_pastel: 'aqua',
    progresso: 100,
    anexos_count: 2,
    comentarios_count: 2,
    subtarefas_count: 7,
    tarefa_checklist: [
      { id: 'c5', texto: 'Branding e identidade visual', concluido: true },
      { id: 'c6', texto: 'Design & desenvolvimento do app', concluido: true },
      { id: 'c7', texto: 'Landing page e materiais de conversão', concluido: true },
      { id: 'c8', texto: 'Dashboard do cliente', concluido: true },
      { id: 'c9', texto: 'Peças e campanhas de marketing', concluido: true },
    ],
    membros: [MEMBROS_EQUIPE_DEMO[0], MEMBROS_EQUIPE_DEMO[1], MEMBROS_EQUIPE_DEMO[2]],
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Brooklyn Simmons' } }],
  },
  {
    id: 'demo-t11',
    titulo: 'Redesign da Página de Produto Moli App',
    descricao: 'Nova apresentação comercial e precificação das assinaturas anuais.',
    nota: 'Publicado em produção com sucesso',
    projeto: 'Produtos',
    tags: ['#produtos', '#cliente'],
    status: 'concluida',
    prioridade: 'baixa',
    cor_pastel: 'pessego',
    progresso: 100,
    anexos_count: 1,
    comentarios_count: 8,
    subtarefas_count: 12,
    tarefa_checklist: [],
    membros: [MEMBROS_EQUIPE_DEMO[3]],
    tarefa_atribuicoes: [{ user_id: 'u4', users: { nome: 'Carlos Mendes' } }],
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Card de Tarefa Visual (Tons Pastel - Weihu Design)
// ─────────────────────────────────────────────────────────────
const CardTarefaVisual = ({
  tarefa,
  isDragging = false,
  isOverlay = false,
  onEditar = null,
  onExcluir = null,
  onMoverStatus = null,
  onToggleChecklist = null,
}) => {
  const cor = obterCorPastel(tarefa);
  const checklist = tarefa.tarefa_checklist || [];
  const concluidosCount = checklist.filter(c => c.concluido).length;

  const [menuOpcoesAberto, setMenuOpcoesAberto] = useState(false);
  const menuRef = useRef(null);

  // Fecha menu de opções ao clicar fora
  useEffect(() => {
    if (!menuOpcoesAberto) return;
    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpcoesAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuOpcoesAberto]);

  // Lista de tags (com fallback limpo)
  const tags = tarefa.tags && tarefa.tags.length > 0
    ? tarefa.tags
    : tarefa.projeto
    ? [`#${tarefa.projeto.toLowerCase().replace(/\s+/g, '-')}`, '#cliente']
    : ['#tarefa'];

  // Membros para os avatares sobrepostos
  const membros = tarefa.membros && tarefa.membros.length > 0
    ? tarefa.membros
    : [
        {
          nome: tarefa.tarefa_atribuicoes?.[0]?.users?.nome || 'Você',
          avatar: null,
          bg: '#0E382C',
        },
      ];

  // Cálculo do progresso (usa valor do card ou calcula de checklist)
  const progresso = typeof tarefa.progresso === 'number'
    ? tarefa.progresso
    : checklist.length > 0
    ? Math.round((concluidosCount / checklist.length) * 100)
    : tarefa.status === 'concluida'
    ? 100
    : 0;

  // Verificação de prazo segura contra Invalid Date
  const dataVenc = tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : null;
  const dataValida = dataVenc && !isNaN(dataVenc.getTime());
  const ehHoje = dataValida && dataVenc.toDateString() === new Date().toDateString();

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border transition-all duration-200 select-none space-y-3 relative ${cor.bg} ${cor.borda} ${
        isOverlay
          ? 'shadow-2xl ring-2 ring-black/10 rotate-1 scale-[1.03] cursor-grabbing z-50'
          : isDragging
          ? 'opacity-30 border-2 border-dashed border-neutral-400 bg-neutral-100'
          : `shadow-2xs ${cor.hoverBorda} hover:shadow-md cursor-grab active:cursor-grabbing`
      }`}
    >
      {/* Topo do Card: Tags em pills brancas translúcidas + Botão de Mais Opções */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-2xs backdrop-blur-xs ${cor.tagBg}`}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>

        {/* Botão ⋮ com Menu de Ações Rápidas */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpcoesAberto(v => !v);
            }}
            className="w-6 h-6 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-black/5 flex items-center justify-center transition-colors flex-shrink-0"
            title="Opções da tarefa"
          >
            <HugeiconsIcon icon={MoreVerticalIcon} size={14} strokeWidth={2} />
          </button>

          {menuOpcoesAberto && (
            <div
              className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-[#E4ECE7] py-1.5 z-40 text-xs font-semibold animate-fade-in"
              onClick={e => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpcoesAberto(false);
                  if (onEditar) onEditar(tarefa);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
              >
                <HugeiconsIcon icon={Edit02Icon} size={13} strokeWidth={1.8} />
                <span>Editar tarefa</span>
              </button>

              <div className="my-1 border-t border-neutral-100" />
              <div className="px-3.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Mover status
              </div>
              {COLUNAS_KANBAN.map(col => (
                <button
                  key={col.slug}
                  type="button"
                  disabled={tarefa.status === col.slug}
                  onClick={() => {
                    setMenuOpcoesAberto(false);
                    if (onMoverStatus) onMoverStatus(tarefa.id, col.slug);
                  }}
                  className={`w-full text-left px-3.5 py-1 hover:bg-neutral-50 flex items-center justify-between text-xs ${
                    tarefa.status === col.slug ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-700'
                  }`}
                >
                  <span>{col.label}</span>
                  {tarefa.status === col.slug && <span className="text-[10px] text-emerald-600">✓</span>}
                </button>
              ))}

              <div className="my-1 border-t border-neutral-100" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpcoesAberto(false);
                  if (onExcluir) onExcluir(tarefa.id);
                }}
                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
              >
                <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={1.8} />
                <span>Excluir tarefa</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Título da Tarefa */}
      <h4 className="text-xs sm:text-[13px] font-bold text-[#14221D] leading-snug tracking-tight">
        {tarefa.titulo}
      </h4>

      {/* Mockup Ilustrativo Opcional (Fiel à coluna "In Progress" da imagem) */}
      {tarefa.previewMockup && (
        <div className="rounded-xl overflow-hidden border border-white/80 shadow-2xs bg-white/70 p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 pb-1 border-b border-black/5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span>Wehiu Process Board</span>
            </span>
            <span className="text-[9px] bg-white px-1.5 py-0.2 rounded-md font-bold text-neutral-600">4 colunas</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            <div className="h-11 bg-[#EAF3FF] rounded-lg p-1 space-y-1 border border-[#D1E4FA]/60">
              <div className="h-1.5 bg-blue-300 rounded w-3/4" />
              <div className="h-1 bg-blue-200 rounded w-1/2" />
            </div>
            <div className="h-11 bg-[#FFF1E8] rounded-lg p-1 space-y-1 border border-[#FEDBC7]/60">
              <div className="h-1.5 bg-orange-300 rounded w-2/3" />
              <div className="h-1 bg-orange-200 rounded w-1/2" />
            </div>
            <div className="h-11 bg-[#F4EEFF] rounded-lg p-1 space-y-1 border border-[#E6DAFA]/60">
              <div className="h-1.5 bg-purple-300 rounded w-3/4" />
              <div className="h-1 bg-purple-200 rounded w-2/3" />
            </div>
            <div className="h-11 bg-[#E7F8F0] rounded-lg p-1 space-y-1 border border-[#C8EED9]/60">
              <div className="h-1.5 bg-emerald-300 rounded w-full" />
              <div className="h-1 bg-emerald-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      )}

      {/* Checklist Interativo com itens circulares (✓ e ○) */}
      {checklist.length > 0 && (
        <div className="space-y-1.5 pt-0.5">
          {checklist.slice(0, 5).map((item, idx) => (
            <button
              key={item.id || idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleChecklist) onToggleChecklist(tarefa.id, item.id);
              }}
              className="flex items-center gap-2 text-[11px] leading-tight text-left w-full group/check cursor-pointer"
            >
              <span
                className={`flex-shrink-0 flex items-center justify-center w-3.5 h-3.5 rounded-full transition-all ${
                  item.concluido
                    ? `${cor.checkCor} bg-white shadow-2xs`
                    : 'border border-black/25 bg-transparent group-hover/check:border-black/50'
                }`}
              >
                {item.concluido && (
                  <svg
                    className="w-2.5 h-2.5"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2.5 6 5 8.5 9.5 3.5" />
                  </svg>
                )}
              </span>
              <span
                className={`font-medium ${
                  item.concluido ? 'line-through text-neutral-400' : 'text-[#1F2937]/90'
                }`}
              >
                {item.texto}
              </span>
            </button>
          ))}
          {checklist.length > 5 && (
            <span className="text-[10px] text-neutral-500 pl-5 font-semibold block">
              +{checklist.length - 5} adicionais
            </span>
          )}
        </div>
      )}

      {/* Nota / Instrução Sutil */}
      {(tarefa.nota || tarefa.descricao) && (
        <p className="text-[11px] text-[#4A5D54] italic leading-tight">
          {tarefa.nota ? `Note: ${tarefa.nota}` : tarefa.descricao}
        </p>
      )}

      {/* Barra de Progresso com Contas / Pontos (Dots) */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#3E5248] mb-1">
          <span>Progress</span>
          <span className="font-bold text-[#1F2937]">{progresso}%</span>
        </div>
        <BarraPontosProgresso progresso={progresso} corAtiva={cor.progressoCor} />
      </div>

      {/* Rodapé: Avatares Sobrepostos + Badges de Métricas */}
      <div className="flex items-center justify-between pt-1 text-xs">
        {/* Avatares dos Membros */}
        <div className="flex items-center -space-x-2">
          {membros.map((m, idx) => {
            const letra = ((m?.nome || 'V').trim().charAt(0) || 'V').toUpperCase();
            return (
              <div
                key={idx}
                title={m?.nome || 'Membro'}
                className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-black/5 flex items-center justify-center font-bold text-[9px] text-white overflow-hidden shadow-2xs flex-shrink-0"
                style={{ backgroundColor: m?.bg || '#0E382C' }}
              >
                {m?.avatar ? (
                  <img
                    src={m.avatar}
                    alt={m.nome || 'Avatar'}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{letra}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Metadados: Subtarefas, Prazo, Comentários, Anexos */}
        <div className="flex items-center gap-2.5 text-[#5B6D64] font-medium text-[11px]">
          {/* Data de Vencimento se configurada */}
          {dataValida && (
            <span
              className={`flex items-center gap-1 font-semibold ${
                ehHoje ? 'text-rose-600 font-bold' : 'text-[#687770]'
              }`}
              title={dataVenc.toLocaleDateString('pt-BR')}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={13} strokeWidth={1.8} />
              <span className="text-[10px]">
                {ehHoje ? 'Hoje' : dataVenc.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </span>
          )}

          {/* Subtarefas / Checklist */}
          {(tarefa.subtarefas_count || checklist.length > 0) && (
            <span className="flex items-center gap-1" title="Subtarefas / Checklist">
              <HugeiconsIcon icon={CheckmarkSquare01Icon} size={13} strokeWidth={1.8} />
              <span>{checklist.length ? `${concluidosCount}/${checklist.length}` : (tarefa.subtarefas_count || 12)}</span>
            </span>
          )}

          {/* Anexos */}
          {tarefa.anexos_count > 0 && (
            <span className="flex items-center gap-1" title="Anexos">
              <HugeiconsIcon icon={Attachment01Icon} size={13} strokeWidth={1.8} />
              <span>{tarefa.anexos_count}</span>
            </span>
          )}

          {/* Comentários */}
          {(tarefa.comentarios_count > 0 || !tarefa.subtarefas_count) && (
            <span className="flex items-center gap-1" title="Comentários">
              <HugeiconsIcon icon={Comment01Icon} size={13} strokeWidth={1.8} />
              <span>{tarefa.comentarios_count || 8}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Card Sortable dentro da Coluna
// ─────────────────────────────────────────────────────────────
const CardTarefaSortable = ({
  tarefa,
  onAbrir,
  onExcluir,
  onMoverStatus,
  onToggleChecklist,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) {
          onAbrir(tarefa);
        }
      }}
      className="transition-all duration-150"
    >
      <CardTarefaVisual
        tarefa={tarefa}
        isDragging={isDragging}
        onEditar={onAbrir}
        onExcluir={onExcluir}
        onMoverStatus={onMoverStatus}
        onToggleChecklist={onToggleChecklist}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Coluna do Kanban
// ─────────────────────────────────────────────────────────────
const ColunaDroppable = ({
  coluna,
  tarefas,
  onAbrir,
  onNovaTarefa,
  onExcluir,
  onMoverStatus,
  onToggleChecklist,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.slug });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[270px] w-full bg-[#F7FAF8]/90 rounded-3xl p-3 sm:p-3.5 border transition-all ${
        isOver ? 'border-[#0E382C] bg-[#EDF4F0]' : 'border-[#E4ECE7]'
      }`}
    >
      {/* Cabeçalho da Coluna: ▸ Nome, + e ⋮ */}
      <div className="flex items-center justify-between mb-3 px-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 font-bold text-xs select-none">▸</span>
          <span className="text-xs sm:text-sm font-bold text-[#14221D]">
            {coluna.label}
          </span>
          <span className="ml-1 text-[11px] font-semibold text-neutral-500 bg-white/90 px-2 py-0.2 rounded-full border border-black/5 shadow-2xs">
            {tarefas.length}
          </span>
        </div>

        <div className="flex items-center gap-1 text-neutral-500">
          <button
            type="button"
            onClick={() => onNovaTarefa(coluna.slug)}
            title={`Adicionar tarefa em ${coluna.label}`}
            className="w-6 h-6 rounded-lg hover:text-[#0E382C] hover:bg-black/5 flex items-center justify-center transition-colors font-bold text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Lista Sortable de Cards */}
      <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[160px]">
          {tarefas.length === 0 ? (
            <div className="h-32 rounded-2xl border border-dashed border-[#CCD9D2] flex flex-col items-center justify-center text-xs text-[#99A6A0] gap-1 bg-white/40">
              <span className="font-semibold">Nenhuma tarefa aqui</span>
              <span className="text-[10px] text-neutral-400">Arraste ou clique em +</span>
            </div>
          ) : (
            tarefas.map(tarefa => (
              <CardTarefaSortable
                key={tarefa.id}
                tarefa={tarefa}
                onAbrir={onAbrir}
                onExcluir={onExcluir}
                onMoverStatus={onMoverStatus}
                onToggleChecklist={onToggleChecklist}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: Tarefas
// ─────────────────────────────────────────────────────────────
const Tarefas = () => {
  const usuario = useAuthStore(s => s.usuario);
  const {
    tarefas: tarefasDb,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
    toggleChecklist: toggleChecklistDb,
  } = useTarefas();

  // Estado das tarefas ativas (inicial com o demo enriquecido)
  const [tarefasLocais, setTarefasLocais] = useState(() => TAREFAS_DEMO);

  // Atualiza tarefas locais se o banco tiver dados cadastrados
  useEffect(() => {
    if (tarefasDb && tarefasDb.length > 0) {
      setTarefasLocais(tarefasDb.map((t, idx) => ({
        ...t,
        cor_pastel: t.cor_pastel || CORES_PASTEL[idx % CORES_PASTEL.length].id,
        progresso: typeof t.progresso === 'number'
          ? t.progresso
          : (t.tarefa_checklist?.length > 0
              ? Math.round((t.tarefa_checklist.filter(c => c.concluido).length / t.tarefa_checklist.length) * 100)
              : (t.status === 'concluida' ? 100 : 0)),
        tags: t.tags || (t.projeto ? [`#${t.projeto.toLowerCase().replace(/\s+/g, '-')}`, '#cliente'] : ['#tarefa']),
        membros: t.membros || (t.tarefa_atribuicoes?.map(a => ({
          nome: a.users?.nome || 'Membro',
          avatar: null,
          bg: '#0E382C',
        })) || [{ nome: usuario?.nome || 'Você', avatar: null, bg: '#0E382C' }]),
      })));
    }
  }, [tarefasDb, usuario?.nome]);

  // Estados de Interface
  const [visao, setVisao] = useState('kanban'); // 'kanban' | 'lista'
  const [filtroPill, setFiltroPill] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('padrao');
  const [dropdownViews, setDropdownViews] = useState(false);
  const [viewSelecionada, setViewSelecionada] = useState('Quadro – Tarefas Diárias');
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas');
  const [filtroPrazo, setFiltroPrazo] = useState('todos');

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [formTarefa, setFormTarefa] = useState({
    titulo: '',
    descricao: '',
    nota: '',
    projeto: '',
    status: 'pendente',
    prioridade: 'media',
    data_vencimento: '',
    estimativa_h: '',
    cor_pastel: 'azul',
    progresso: 0,
    checklist: [],
  });
  const [novoItemChecklist, setNovoItemChecklist] = useState('');

  // Estado para o DragOverlay e snapshot de origem
  const [cardAtivo, setCardAtivo] = useState(null);
  const [cardOrigem, setCardOrigem] = useState(null);

  // Sensor com restrição de distância de 5px para não travar cliques normais
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Data atual formatada em português (estilo "May / Today is Saturday...")
  const dataHoje = useMemo(() => {
    const hoje = new Date();
    const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(hoje);
    const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
    const dataCompleta = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(hoje);
    return {
      mes: mesCapitalizado,
      subtitulo: `Hoje é ${dataCompleta.charAt(0).toUpperCase() + dataCompleta.slice(1)}`,
    };
  }, []);

  // Contadores para filtros
  const contadores = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const todas = tarefasLocais.length;
    const pendente = tarefasLocais.filter(t => t.status === 'pendente').length;
    const andamento = tarefasLocais.filter(t => t.status === 'em_andamento').length;
    const revisao = tarefasLocais.filter(t => t.status === 'em_revisao').length;
    const concluidas = tarefasLocais.filter(t => t.status === 'concluida').length;
    const atrasadas = tarefasLocais.filter(t => {
      if (!t.data_vencimento || t.status === 'concluida') return false;
      const d = new Date(t.data_vencimento);
      return !isNaN(d.getTime()) && d < hoje;
    }).length;
    const hojeCount = tarefasLocais.filter(t => {
      if (!t.data_vencimento) return false;
      const d = new Date(t.data_vencimento);
      return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
    }).length;
    const minhas = tarefasLocais.filter(t =>
      t.tarefa_atribuicoes?.some(a => a.user_id === usuario?.id) ||
      t.membros?.some(m => m.nome === usuario?.nome)
    ).length;

    return { todas, pendente, andamento, revisao, concluidas, atrasadas, hojeCount, minhas };
  }, [tarefasLocais, usuario]);

  // Filtragem e Ordenação
  const tarefasFiltradas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return tarefasLocais
      .filter(t => {
        // Filtro por Seletor de Views
        if (viewSelecionada === 'Quadro – Tarefas Diárias') {
          if (t.status === 'concluida') return false;
        } else if (viewSelecionada === 'Quadro – Urgentes') {
          if (t.prioridade !== 'critica' && t.prioridade !== 'alta') return false;
        }

        // Filtros Avançados
        if (filtroPrioridade !== 'todas' && t.prioridade !== filtroPrioridade) {
          return false;
        }
        if (filtroPrazo === 'atrasadas') {
          if (!t.data_vencimento || t.status === 'concluida') return false;
          const d = new Date(t.data_vencimento);
          if (isNaN(d.getTime()) || d >= hoje) return false;
        } else if (filtroPrazo === 'hoje') {
          if (!t.data_vencimento) return false;
          const d = new Date(t.data_vencimento);
          if (isNaN(d.getTime()) || d.toDateString() !== new Date().toDateString()) return false;
        }

        // Busca textual
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const matchTitulo = t.titulo?.toLowerCase().includes(termo);
          const matchDesc = t.descricao?.toLowerCase().includes(termo);
          const matchNota = t.nota?.toLowerCase().includes(termo);
          const matchProj = t.projeto?.toLowerCase().includes(termo);
          const matchTag = t.tags?.some(tag => tag.toLowerCase().includes(termo));
          if (!matchTitulo && !matchDesc && !matchNota && !matchProj && !matchTag) {
            return false;
          }
        }

        // Filtro por Pills
        if (filtroPill === 'pendente') return t.status === 'pendente';
        if (filtroPill === 'andamento') return t.status === 'em_andamento';
        if (filtroPill === 'revisao') return t.status === 'em_revisao';
        if (filtroPill === 'concluidas') return t.status === 'concluida';
        if (filtroPill === 'minhas') {
          return (
            t.tarefa_atribuicoes?.some(a => a.user_id === usuario?.id) ||
            t.membros?.some(m => m.nome === usuario?.nome)
          );
        }
        if (filtroPill === 'atrasadas') {
          if (!t.data_vencimento || t.status === 'concluida') return false;
          const d = new Date(t.data_vencimento);
          return !isNaN(d.getTime()) && d < hoje;
        }
        if (filtroPill === 'hoje') {
          if (!t.data_vencimento) return false;
          const d = new Date(t.data_vencimento);
          return !isNaN(d.getTime()) && d.toDateString() === new Date().toDateString();
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === 'prazo') {
          if (!a.data_vencimento) return 1;
          if (!b.data_vencimento) return -1;
          return new Date(a.data_vencimento) - new Date(b.data_vencimento);
        }
        if (ordenacao === 'prioridade') {
          const pesos = { critica: 4, alta: 3, media: 2, baixa: 1 };
          return (pesos[b.prioridade] || 0) - (pesos[a.prioridade] || 0);
        }
        if (ordenacao === 'progresso') {
          return (b.progresso || 0) - (a.progresso || 0);
        }
        if (ordenacao === 'titulo') {
          return (a.titulo || '').localeCompare(b.titulo || '');
        }
        return 0;
      });
  }, [tarefasLocais, busca, filtroPill, ordenacao, viewSelecionada, filtroPrioridade, filtroPrazo, usuario]);

  // Agrupamento para as 4 colunas do Kanban
  const kanbanAgrupado = useMemo(() => {
    return COLUNAS_KANBAN.reduce((acc, col) => {
      acc[col.slug] = tarefasFiltradas.filter(t => t.status === col.slug);
      return acc;
    }, {});
  }, [tarefasFiltradas]);

  // ── Drag and Drop Handlers ────────────────────────────────
  const customCollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) return rectCollisions;
    return closestCorners(args);
  }, []);

  const handleDragStart = (event) => {
    const { active } = event;
    const card = tarefasLocais.find(t => t.id === active.id);
    if (card) {
      setCardAtivo(card);
      setCardOrigem({ ...card });
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeTask = tarefasLocais.find(t => t.id === activeId);
    if (!activeTask) return;

    const isColuna = COLUNAS_KANBAN.some(c => c.slug === overId);
    const targetStatus = isColuna ? overId : tarefasLocais.find(t => t.id === overId)?.status;
    if (!targetStatus) return;

    if (activeTask.status !== targetStatus) {
      setTarefasLocais(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        if (activeIndex === -1) return prev;

        const updated = [...prev];
        const taskToMove = { ...updated[activeIndex], status: targetStatus };
        updated.splice(activeIndex, 1);

        const overIndex = updated.findIndex(t => t.id === overId);
        if (overIndex !== -1) {
          updated.splice(overIndex, 0, taskToMove);
        } else {
          updated.push(taskToMove);
        }

        return updated;
      });
    } else if (!isColuna) {
      setTarefasLocais(prev => {
        const oldIndex = prev.findIndex(t => t.id === activeId);
        const newIndex = prev.findIndex(t => t.id === overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          return arrayMove(prev, oldIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const tarefaId = active?.id;
    const origem = cardOrigem;

    setCardAtivo(null);
    setCardOrigem(null);

    if (!over || !tarefaId) {
      if (origem) {
        setTarefasLocais(prev =>
          prev.map(t => (t.id === origem.id ? { ...t, status: origem.status } : t))
        );
      }
      return;
    }

    const destinoId = over.id;
    let novoStatus = COLUNAS_KANBAN.find(c => c.slug === destinoId)?.slug;
    if (!novoStatus) {
      const tarefaAlvo = tarefasLocais.find(t => t.id === destinoId);
      if (tarefaAlvo) novoStatus = tarefaAlvo.status;
    }

    const currentTask = tarefasLocais.find(t => t.id === tarefaId);
    const finalStatus = novoStatus || currentTask?.status;

    if (finalStatus) {
      setTarefasLocais(prev =>
        prev.map(t => (t.id === tarefaId ? { ...t, status: finalStatus } : t))
      );

      if (origem && origem.status !== finalStatus && !String(tarefaId).startsWith('demo-') && !String(tarefaId).startsWith('local-')) {
        try {
          await atualizarTarefa(tarefaId, { status: finalStatus });
        } catch (e) {
          console.error('Erro ao atualizar status da tarefa:', e);
        }
      }
    }
  };

  const handleDragCancel = () => {
    if (cardOrigem) {
      setTarefasLocais(prev =>
        prev.map(t => (t.id === cardOrigem.id ? { ...t, status: cardOrigem.status } : t))
      );
    }
    setCardAtivo(null);
    setCardOrigem(null);
  };

  // ── Ações de Tarefas ──────────────────────────────────────
  const handleAbrirModal = (tarefa = null, statusDefault = 'pendente') => {
    if (tarefa) {
      setTarefaEditando(tarefa);
      setFormTarefa({
        titulo: tarefa.titulo || '',
        descricao: tarefa.descricao || '',
        nota: tarefa.nota || '',
        projeto: tarefa.projeto || '',
        status: tarefa.status || 'pendente',
        prioridade: tarefa.prioridade || 'media',
        data_vencimento: tarefa.data_vencimento ? tarefa.data_vencimento.split('T')[0] : '',
        estimativa_h: tarefa.estimativa_h !== undefined && tarefa.estimativa_h !== null ? tarefa.estimativa_h : '',
        cor_pastel: tarefa.cor_pastel || obterCorPastel(tarefa).id,
        progresso: typeof tarefa.progresso === 'number' ? tarefa.progresso : 0,
        checklist: tarefa.tarefa_checklist ? [...tarefa.tarefa_checklist] : [],
      });
    } else {
      setTarefaEditando(null);
      const corNova = CORES_PASTEL[tarefasLocais.length % CORES_PASTEL.length].id;
      setFormTarefa({
        titulo: '',
        descricao: '',
        nota: '',
        projeto: '',
        status: statusDefault,
        prioridade: 'media',
        data_vencimento: '',
        estimativa_h: '',
        cor_pastel: corNova,
        progresso: 0,
        checklist: [],
      });
    }
    setNovoItemChecklist('');
    setModalAberto(true);
  };

  const handleMoverStatus = async (tarefaId, novoStatus) => {
    setTarefasLocais(prev =>
      prev.map(t => (t.id === tarefaId ? { ...t, status: novoStatus } : t))
    );
    if (!String(tarefaId).startsWith('demo-') && !String(tarefaId).startsWith('local-')) {
      try {
        await atualizarTarefa(tarefaId, { status: novoStatus });
      } catch (err) {
        console.error('Erro ao mover status:', err);
      }
    }
  };

  const handleToggleChecklist = async (tarefaId, itemId) => {
    let itemNovoEstado = false;
    setTarefasLocais(prev =>
      prev.map(t => {
        if (t.id === tarefaId) {
          const list = (t.tarefa_checklist || []).map(item => {
            if (item.id === itemId) {
              itemNovoEstado = !item.concluido;
              return { ...item, concluido: itemNovoEstado };
            }
            return item;
          });
          const concluidos = list.filter(c => c.concluido).length;
          const novoProgresso = list.length > 0 ? Math.round((concluidos / list.length) * 100) : t.progresso;
          return { ...t, tarefa_checklist: list, progresso: novoProgresso };
        }
        return t;
      })
    );

    if (!String(tarefaId).startsWith('demo-') && !String(tarefaId).startsWith('local-') && toggleChecklistDb) {
      try {
        await toggleChecklistDb(itemId, itemNovoEstado);
      } catch (err) {
        console.error('Erro ao atualizar checklist:', err);
      }
    }
  };

  const handleAdicionarItemChecklist = (e) => {
    e.preventDefault();
    if (!novoItemChecklist.trim()) return;
    const novoItem = {
      id: `check-${Date.now()}`,
      texto: novoItemChecklist.trim(),
      concluido: false,
    };
    setFormTarefa(f => ({
      ...f,
      checklist: [...f.checklist, novoItem],
    }));
    setNovoItemChecklist('');
  };

  const handleRemoverItemChecklist = (itemId) => {
    setFormTarefa(f => ({
      ...f,
      checklist: f.checklist.filter(c => c.id !== itemId),
    }));
  };

  const handleSalvarTarefa = async (e) => {
    e.preventDefault();
    if (!formTarefa.titulo.trim()) return;

    // Payload sanitizado estritamente para o Supabase (sem colunas virtuais e sem strings vazias)
    const dadosParaBanco = {
      titulo: formTarefa.titulo.trim(),
      descricao: formTarefa.descricao?.trim() || null,
      status: formTarefa.status,
      prioridade: formTarefa.prioridade,
      data_vencimento: formTarefa.data_vencimento ? new Date(formTarefa.data_vencimento).toISOString() : null,
      estimativa_h: formTarefa.estimativa_h !== '' && formTarefa.estimativa_h !== null && !isNaN(Number(formTarefa.estimativa_h))
        ? Number(formTarefa.estimativa_h)
        : null,
    };

    if (tarefaEditando) {
      const atualizada = {
        ...tarefaEditando,
        ...formTarefa,
        data_vencimento: dadosParaBanco.data_vencimento,
        estimativa_h: dadosParaBanco.estimativa_h,
        tarefa_checklist: formTarefa.checklist,
      };
      setTarefasLocais(prev => prev.map(t => (t.id === tarefaEditando.id ? atualizada : t)));

      if (!String(tarefaEditando.id).startsWith('demo-') && !String(tarefaEditando.id).startsWith('local-')) {
        try {
          await atualizarTarefa(tarefaEditando.id, dadosParaBanco);
        } catch (err) {
          console.error('Erro ao atualizar no banco:', err);
        }
      }
    } else {
      const nova = {
        id: `local-t-${Date.now()}`,
        ...formTarefa,
        data_vencimento: dadosParaBanco.data_vencimento,
        estimativa_h: dadosParaBanco.estimativa_h,
        tags: formTarefa.projeto ? [`#${formTarefa.projeto.toLowerCase().replace(/\s+/g, '-')}`, '#cliente'] : ['#tarefa'],
        anexos_count: 0,
        comentarios_count: 0,
        subtarefas_count: formTarefa.checklist.length,
        tarefa_checklist: formTarefa.checklist,
        membros: [{ nome: usuario?.nome || 'Você', avatar: null, bg: '#0E382C' }],
        tarefa_atribuicoes: [{ user_id: usuario?.id || 'me', users: { nome: usuario?.nome || 'Você' } }],
      };
      setTarefasLocais(prev => [nova, ...prev]);

      if (usuario?.tenant_id) {
        try {
          await criarTarefa(dadosParaBanco);
        } catch (err) {
          console.error('Erro ao salvar no banco:', err);
        }
      }
    }
    setModalAberto(false);
  };

  const handleExcluirTarefa = async (id) => {
    if (!window.confirm('Tem certeza de que deseja remover esta tarefa?')) return;
    setTarefasLocais(prev => prev.filter(t => t.id !== id));
    setModalAberto(false);
    if (!String(id).startsWith('demo-') && !String(id).startsWith('local-')) {
      try {
        await excluirTarefa(id);
      } catch (err) {
        console.error('Erro ao excluir:', err);
      }
    }
  };

  const toggleConcluida = (id) => {
    setTarefasLocais(prev =>
      prev.map(t => {
        if (t.id === id) {
          const novo = t.status === 'concluida' ? 'em_andamento' : 'concluida';
          if (!String(id).startsWith('demo-') && !String(id).startsWith('local-')) {
            atualizarTarefa(id, { status: novo });
          }
          return { ...t, status: novo, progresso: novo === 'concluida' ? 100 : t.progresso };
        }
        return t;
      })
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans pb-12 space-y-5">
      {/* ─────────────────────────────────────────────────────────
          1. HEADER SUPERIOR ESTILO WEIHU: MÊS, DATA, SELETOR E AÇÕES
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        {/* Esquerda: Mês & Data Dinâmica */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111915] tracking-tight">
            {dataHoje.mes}
          </h2>
          <p className="text-xs text-[#687770] mt-0.5 font-medium">
            {dataHoje.subtitulo}
          </p>
        </div>

        {/* Centro-Esquerda: Seletor de Views do Board */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownViews(v => !v)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-[#14221D] bg-white border border-[#E4ECE7] shadow-2xs hover:border-[#CCD9D2] transition-all"
          >
            <span>{viewSelecionada}</span>
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} className="text-[#687770]" />
          </button>

          {dropdownViews && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-[#E4ECE7] py-2 z-40 text-xs font-semibold animate-fade-in">
              {[
                'Quadro – Tarefas Diárias',
                'Quadro – Todas as Tarefas',
                'Quadro – Urgentes',
              ].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setViewSelecionada(v);
                    setDropdownViews(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-[#F7FAF8] transition-colors ${
                    viewSelecionada === v
                      ? 'text-[#0E382C] bg-[#F7FAF8] font-bold'
                      : 'text-[#687770]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direita: Avatares da Equipe, Filtros, Botão Primário + Criar Tarefa e Visão */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Avatares da Equipe Sobrepostos */}
          <div className="hidden sm:flex items-center -space-x-2 mr-1">
            {MEMBROS_EQUIPE_DEMO.map((m, idx) => (
              <img
                key={idx}
                src={m.avatar}
                alt={m.nome}
                title={m.nome}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-7 h-7 rounded-full border-2 border-white ring-1 ring-black/5 object-cover shadow-2xs"
              />
            ))}
          </div>

          {/* Botão de Filtros */}
          <button
            type="button"
            onClick={() => setMostrarFiltrosAvancados(v => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs ${
              mostrarFiltrosAvancados
                ? 'bg-[#0E382C] text-white border-[#0E382C]'
                : 'bg-white text-[#14221D] border-[#E4ECE7] hover:border-[#CCD9D2]'
            }`}
          >
            <HugeiconsIcon icon={FilterIcon} size={14} strokeWidth={2} />
            <span>Filtros</span>
          </button>

          {/* Botão Primário: + Criar Tarefa */}
          <button
            type="button"
            onClick={() => handleAbrirModal(null, 'pendente')}
            className="px-4 py-2 bg-[#111915] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.5} />
            <span>Criar tarefa</span>
          </button>

          {/* Alternador Quadro / Lista */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4ECE7] shadow-2xs">
            <button
              type="button"
              onClick={() => setVisao('kanban')}
              title="Visualização em Quadro Kanban"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                visao === 'kanban'
                  ? 'bg-[#0E382C] text-white shadow-2xs'
                  : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
              }`}
            >
              <HugeiconsIcon icon={DashboardSquare01Icon} size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">Quadro</span>
            </button>
            <button
              type="button"
              onClick={() => setVisao('lista')}
              title="Visualização em Lista / Tabela"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                visao === 'lista'
                  ? 'bg-[#0E382C] text-white shadow-2xs'
                  : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
              }`}
            >
              <HugeiconsIcon icon={Menu01Icon} size={14} strokeWidth={1.8} />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. FILTROS AVANÇADOS EXPANSÍVEIS
         ───────────────────────────────────────────────────────── */}
      {mostrarFiltrosAvancados && (
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-3.5 shadow-xs flex items-center justify-between flex-wrap gap-3 animate-fade-in">
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {/* Filtro por Prioridade */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#14221D]">Prioridade:</span>
              <select
                value={filtroPrioridade}
                onChange={e => setFiltroPrioridade(e.target.value)}
                className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-lg px-2.5 py-1 text-xs text-[#111915] focus:outline-none"
              >
                <option value="todas">Todas</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>

            {/* Filtro por Prazo */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#14221D]">Prazo:</span>
              <select
                value={filtroPrazo}
                onChange={e => setFiltroPrazo(e.target.value)}
                className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-lg px-2.5 py-1 text-xs text-[#111915] focus:outline-none"
              >
                <option value="todos">Todos os prazos</option>
                <option value="hoje">Vencem Hoje</option>
                <option value="atrasadas">Atrasadas</option>
              </select>
            </div>
          </div>

          {(filtroPrioridade !== 'todas' || filtroPrazo !== 'todos') && (
            <button
              type="button"
              onClick={() => {
                setFiltroPrioridade('todas');
                setFiltroPrazo('todos');
              }}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Limpar filtros avançados
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          3. BARRA DE BUSCA E STATUS PILLS
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        {/* Pills de Filtragem Rápida */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setFiltroPill('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'todos'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'todos' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.todas}
            </span>
            <span>Todas</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroPill('pendente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'pendente'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'pendente' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.pendente}
            </span>
            <span>A Fazer</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroPill('andamento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'andamento'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'andamento' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.andamento}
            </span>
            <span>Em Progresso</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroPill('revisao')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'revisao'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'revisao' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.revisao}
            </span>
            <span>Em Revisão</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltroPill('concluidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'concluidas'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'concluidas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.concluidas}
            </span>
            <span>Concluídas</span>
          </button>

          {/* Minhas Tarefas */}
          <button
            type="button"
            onClick={() => setFiltroPill('minhas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'minhas'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                filtroPill === 'minhas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
              }`}
            >
              {contadores.minhas}
            </span>
            <span>Minhas Tarefas</span>
          </button>

          {/* Atrasadas */}
          {contadores.atrasadas > 0 && (
            <button
              type="button"
              onClick={() => setFiltroPill('atrasadas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                filtroPill === 'atrasadas'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-white text-rose-700">
                {contadores.atrasadas}
              </span>
              <span>Atrasadas</span>
            </button>
          )}
        </div>

        {/* Busca e Ordenação */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-full sm:w-64 relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={14}
              strokeWidth={1.8}
              className="text-[#99A6A0] absolute left-3 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Buscar tarefa ou tag..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4ECE7] rounded-xl text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C] shadow-2xs"
            />
          </div>

          <div className="flex items-center bg-white rounded-xl border border-[#E4ECE7] px-2.5 py-1.5 shadow-2xs flex-shrink-0">
            <HugeiconsIcon icon={Sorting01Icon} size={14} strokeWidth={1.8} className="text-[#687770] mr-1.5" />
            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#111915] focus:outline-none cursor-pointer"
            >
              <option value="padrao">Padrão</option>
              <option value="prazo">Prazo</option>
              <option value="prioridade">Prioridade</option>
              <option value="progresso">Progresso</option>
              <option value="titulo">Nome</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. VISUALIZAÇÃO: KANBAN BOARD (WEIHU STYLE COM CARDS PASTEL)
         ───────────────────────────────────────────────────────── */}
      {visao === 'kanban' && (
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="overflow-x-auto no-scrollbar pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-[1100px] items-start">
              {COLUNAS_KANBAN.map(col => (
                <ColunaDroppable
                  key={col.slug}
                  coluna={col}
                  tarefas={kanbanAgrupado[col.slug] || []}
                  onAbrir={handleAbrirModal}
                  onNovaTarefa={status => handleAbrirModal(null, status)}
                  onExcluir={handleExcluirTarefa}
                  onMoverStatus={handleMoverStatus}
                  onToggleChecklist={handleToggleChecklist}
                />
              ))}
            </div>
          </div>

          {/* Overlay flutuante durante o drag com estilo pastel idêntico */}
          <DragOverlay
            dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.4',
                  },
                },
              }),
            }}
          >
            {cardAtivo ? (
              <div className="w-[280px] pointer-events-none">
                <CardTarefaVisual tarefa={cardAtivo} isOverlay={true} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* ─────────────────────────────────────────────────────────
          5. VISUALIZAÇÃO: LISTA / TABELA
         ───────────────────────────────────────────────────────── */}
      {visao === 'lista' && (
        <div className="bg-white rounded-3xl border border-[#E4ECE7] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4ECE7] bg-[#F7FAF8] text-[11px] font-bold text-[#687770] uppercase tracking-wider">
                  <th className="py-3.5 pl-5 pr-2 w-10"></th>
                  <th className="py-3.5 px-4">Tarefa & Projeto</th>
                  <th className="py-3.5 px-4">Progresso</th>
                  <th className="py-3.5 px-4">Prazo</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 pr-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4ECE7] text-xs">
                {tarefasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#687770]">
                      Nenhuma tarefa encontrada com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  tarefasFiltradas.map(tarefa => {
                    const concluida = tarefa.status === 'concluida';
                    const cor = obterCorPastel(tarefa);
                    const dataVenc = tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : null;
                    const dataValida = dataVenc && !isNaN(dataVenc.getTime());
                    const ehHoje = dataValida && dataVenc.toDateString() === new Date().toDateString();
                    const nomeResp = tarefa.tarefa_atribuicoes?.[0]?.users?.nome || tarefa.membros?.[0]?.nome || 'Você';
                    const letraResp = ((nomeResp || 'V').trim().charAt(0) || 'V').toUpperCase();

                    return (
                      <tr
                        key={tarefa.id}
                        onClick={() => handleAbrirModal(tarefa)}
                        className="hover:bg-[#F7FAF8] transition-colors cursor-pointer group"
                      >
                        {/* Checkbox de Conclusão */}
                        <td className="py-3.5 pl-5 pr-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={concluida}
                            onChange={() => toggleConcluida(tarefa.id)}
                            className="w-4 h-4 rounded-md text-[#0E382C] focus:ring-[#0E382C] cursor-pointer"
                          />
                        </td>

                        {/* Título & Tags em Tom Pastel */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                concluida ? 'line-through text-[#99A6A0]' : 'text-[#111915] group-hover:text-[#0E382C]'
                              }`}
                            >
                              {tarefa.titulo}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cor.badgeBg}`}>
                              {cor.nome}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#687770] truncate mt-0.5">
                            {tarefa.projeto || tarefa.descricao || tarefa.nota || 'Sem notas'}
                          </p>
                        </td>

                        {/* Progresso em Dots */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <BarraPontosProgresso progresso={tarefa.progresso || 0} corAtiva={cor.progressoCor} />
                            <span className="text-[11px] font-bold text-neutral-600">
                              {tarefa.progresso || 0}%
                            </span>
                          </div>
                        </td>

                        {/* Prazo */}
                        <td className="py-3.5 px-4">
                          {dataValida ? (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${
                                ehHoje ? 'text-rose-600 bg-rose-50 border border-rose-200/60 font-bold' : 'text-[#687770]'
                              }`}
                            >
                              <HugeiconsIcon icon={Calendar03Icon} size={12} strokeWidth={1.8} />
                              <span>{dataVenc.toLocaleDateString('pt-BR')}</span>
                            </span>
                          ) : (
                            <span className="text-[#99A6A0] text-[11px]">-</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              tarefa.status === 'concluida'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tarefa.status === 'em_andamento'
                                ? 'bg-orange-100 text-orange-800'
                                : tarefa.status === 'em_revisao'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tarefa.status === 'em_andamento'
                              ? 'Em Progresso'
                              : tarefa.status === 'em_revisao'
                              ? 'Em Revisão'
                              : tarefa.status === 'concluida'
                              ? 'Concluída'
                              : 'A Fazer'}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-full bg-[#0E382C] text-white font-bold text-[10px] flex items-center justify-center"
                            >
                              {letraResp}
                            </div>
                            <span className="text-xs text-[#111915] font-medium truncate max-w-[100px]">
                              {nomeResp}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleAbrirModal(tarefa)}
                              className="p-1 rounded-lg text-[#687770] hover:text-[#0E382C] hover:bg-[#EDF2EE]"
                              title="Editar"
                            >
                              <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirTarefa(tarefa.id)}
                              className="p-1 rounded-lg text-[#99A6A0] hover:text-rose-600 hover:bg-rose-50"
                              title="Excluir"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          6. MODAL DE CRIAÇÃO / EDIÇÃO DE TAREFA
         ───────────────────────────────────────────────────────── */}
      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7] max-h-[90vh] overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
              <div>
                <h2 className="text-base font-bold text-[#111915]">
                  {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h2>
                <p className="text-xs text-[#687770]">Selecione a cor pastel e os detalhes da tarefa</p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-7 h-7 rounded-lg text-[#687770] hover:text-[#111915] hover:bg-neutral-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarTarefa} className="space-y-3.5">
              {/* Seletor de Tom Pastel */}
              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1.5">
                  Tom Pastel do Card
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {CORES_PASTEL.map(c => {
                    const selecionada = formTarefa.cor_pastel === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setFormTarefa(f => ({ ...f, cor_pastel: c.id }))}
                        title={c.nome}
                        className={`h-9 rounded-xl border flex items-center justify-center transition-all ${c.bg} ${c.borda} ${
                          selecionada ? 'ring-2 ring-[#0E382C] shadow-xs scale-105' : 'hover:scale-102'
                        }`}
                      >
                        {selecionada && (
                          <span className="w-2 h-2 rounded-full bg-[#0E382C]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  placeholder="Ex: Pesquisa de Inspirações para Novos Projetos"
                  value={formTarefa.titulo}
                  onChange={e => setFormTarefa(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Projeto ou Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Website, Mobile App"
                    value={formTarefa.projeto}
                    onChange={e => setFormTarefa(f => ({ ...f, projeto: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Progresso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={formTarefa.progresso}
                    onChange={e => setFormTarefa(f => ({ ...f, progresso: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Nota Rápida (Subtítulo itálico)</label>
                <input
                  type="text"
                  placeholder="Ex: Referência principal: Behance project Mise"
                  value={formTarefa.nota}
                  onChange={e => setFormTarefa(f => ({ ...f, nota: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  placeholder="Instruções ou escopo detalhado..."
                  value={formTarefa.descricao}
                  onChange={e => setFormTarefa(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                />
              </div>

              {/* Gerenciador de Checklist no Modal */}
              <div className="space-y-2 pt-1 border-t border-neutral-100">
                <label className="block text-xs font-semibold text-[#111915]">Itens do Checklist</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar item (ex: Criar fluxo de onboarding)"
                    value={novoItemChecklist}
                    onChange={e => setNovoItemChecklist(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarItemChecklist(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarItemChecklist}
                    className="px-3 py-1.5 bg-[#0E382C] text-white rounded-xl text-xs font-bold hover:bg-[#07261E]"
                  >
                    +
                  </button>
                </div>

                {formTarefa.checklist.length > 0 && (
                  <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
                    {formTarefa.checklist.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 bg-neutral-50 rounded-xl text-xs border border-neutral-100"
                      >
                        <span className="text-neutral-700 truncate">{item.texto}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoverItemChecklist(item.id)}
                          className="text-neutral-400 hover:text-rose-600 text-xs px-1"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Coluna / Status</label>
                  <select
                    value={formTarefa.status}
                    onChange={e => setFormTarefa(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  >
                    <option value="pendente">A Fazer</option>
                    <option value="em_andamento">Em Progresso</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="concluida">Concluído</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Prioridade</label>
                  <select
                    value={formTarefa.prioridade}
                    onChange={e => setFormTarefa(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Urgente)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    value={formTarefa.data_vencimento}
                    onChange={e => setFormTarefa(f => ({ ...f, data_vencimento: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Estimativa (Horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 4"
                    value={formTarefa.estimativa_h}
                    onChange={e => setFormTarefa(f => ({ ...f, estimativa_h: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E4ECE7]">
                {tarefaEditando && (
                  <button
                    type="button"
                    onClick={() => handleExcluirTarefa(tarefaEditando.id)}
                    className="text-xs font-bold text-rose-600 hover:underline"
                  >
                    Excluir
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl hover:text-[#111915]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#111915] hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Salvar Tarefa
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tarefas;
