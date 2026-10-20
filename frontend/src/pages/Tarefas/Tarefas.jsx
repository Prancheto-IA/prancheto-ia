// =============================================================
// PRANCHETO.IA - MÓDULO DE TAREFAS (EMITLY DESIGN SYSTEM)
// Fusão dos layouts modernos:
// 1. Kanban "Actions" com colunas interativas, cards com destaque de prioridade,
//    avatares gradiente, badges de prazo/anexos/comentários e drag-and-drop.
// 2. Barra de Filtros Rápidos (Pills) e Visão em Tabela/Lista "Orders"
//    com seleção rápida, ordenação e métricas de produtividade.
// =============================================================

import React, { useState, useMemo, useCallback } from 'react';
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
import { useTarefas, STATUS_TAREFAS, PRIORIDADES } from '../../hooks/useTarefas';
import { useAuthStore } from '../../store/authStore';

// Colunas do Kanban com ícones e cores temáticas Emitly
const COLUNAS_KANBAN = [
  {
    slug: 'pendente',
    label: 'Backlog',
    corIcone: 'text-slate-500',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
    ),
  },
  {
    slug: 'em_andamento',
    label: 'Em Progresso',
    corIcone: 'text-amber-600',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    slug: 'em_revisao',
    label: 'Em Revisão',
    corIcone: 'text-indigo-600',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    slug: 'concluida',
    label: 'Concluídas',
    corIcone: 'text-emerald-700',
    icone: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

// Tarefas de Demonstração (Fallback rico e profissional)
const TAREFAS_DEMO = [
  {
    id: 'demo-t1',
    titulo: 'Auditoria de Documentos e Revisão de Políticas',
    descricao: 'Revisão das normas de segurança da informação e governança corporativa.',
    projeto: 'Tratado de Governança',
    status: 'pendente',
    prioridade: 'alta',
    data_vencimento: new Date(Date.now() + 4 * 86400000).toISOString(),
    estimativa_h: 6,
    anexos_count: 2,
    comentarios_count: 5,
    tarefa_checklist: [
      { id: 'c1', texto: 'Revisar cláusulas do contrato', concluido: true },
      { id: 'c2', texto: 'Validação pelo comitê de compliance', concluido: false },
    ],
    gradienteAvatar: 'from-amber-400 to-orange-500',
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Carlos Mendes' } }],
  },
  {
    id: 'demo-t2',
    titulo: 'Pesquisa e Avaliação de Riscos Operacionais',
    descricao: 'Análise detalhada de vulnerabilidades em infraestrutura e impacto de continuidade.',
    projeto: 'Programa de Emissão Sustentável',
    status: 'pendente',
    prioridade: 'critica',
    data_vencimento: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimativa_h: 8,
    anexos_count: 1,
    comentarios_count: 2,
    tarefa_checklist: [
      { id: 'c3', texto: 'Coleta de dados de risco', concluido: true },
    ],
    gradienteAvatar: 'from-rose-500 to-pink-600',
    tarefa_atribuicoes: [{ user_id: 'u2', users: { nome: 'Mariana Lima' } }],
  },
  {
    id: 'demo-t3',
    titulo: 'Prazo Limite para Submissão Regulatória',
    descricao: 'Envio dos relatórios trimestrais de sustentabilidade e metas de investimento.',
    projeto: 'Investimentos de Impacto',
    status: 'em_andamento',
    prioridade: 'alta',
    data_vencimento: new Date().toISOString(), // VENCE HOJE!
    estimativa_h: 12,
    anexos_count: 2,
    comentarios_count: 6,
    tarefa_checklist: [
      { id: 'c4', texto: 'Compilação das planilhas financeiras', concluido: true },
      { id: 'c5', texto: 'Assinatura digital dos diretores', concluido: false },
    ],
    gradienteAvatar: 'from-indigo-500 to-purple-600',
    tarefa_atribuicoes: [{ user_id: 'u3', users: { nome: 'Andrey Silva' } }],
  },
  {
    id: 'demo-t4',
    titulo: 'Due Diligence de Fornecedores Homologados',
    descricao: 'Auditoria de terceiros e validação cadastral de prestadores de serviços de TI.',
    projeto: 'Cadeia de Suprimentos',
    status: 'em_andamento',
    prioridade: 'media',
    data_vencimento: new Date(Date.now() + 7 * 86400000).toISOString(),
    estimativa_h: 4,
    anexos_count: 2,
    comentarios_count: 1,
    tarefa_checklist: [],
    gradienteAvatar: 'from-blue-400 to-cyan-500',
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Carlos Mendes' } }],
  },
  {
    id: 'demo-t5',
    titulo: 'Checagem de Conformidade e Proteção de Dados LGPD',
    descricao: 'Revisão das permissões de acesso e políticas de privacidade dos clientes.',
    projeto: 'Transparência de Dados',
    status: 'em_andamento',
    prioridade: 'baixa',
    data_vencimento: new Date(Date.now() + 10 * 86400000).toISOString(),
    estimativa_h: 5,
    anexos_count: 3,
    comentarios_count: 8,
    tarefa_checklist: [
      { id: 'c6', texto: 'Mapeamento das bases de dados', concluido: true },
    ],
    gradienteAvatar: 'from-emerald-400 to-teal-500',
    tarefa_atribuicoes: [{ user_id: 'u2', users: { nome: 'Mariana Lima' } }],
  },
  {
    id: 'demo-t6',
    titulo: 'Preparação para Auditoria Interna de Processos',
    descricao: 'Levantamento de evidências para o comitê de ética e reutilização de recursos.',
    projeto: 'Padrões de Qualidade',
    status: 'em_revisao',
    prioridade: 'media',
    data_vencimento: new Date(Date.now() + 14 * 86400000).toISOString(),
    estimativa_h: 10,
    anexos_count: 2,
    comentarios_count: 5,
    tarefa_checklist: [],
    gradienteAvatar: 'from-amber-400 to-yellow-500',
    tarefa_atribuicoes: [{ user_id: 'u3', users: { nome: 'Andrey Silva' } }],
  },
  {
    id: 'demo-t7',
    titulo: 'Atualização de Políticas de Direitos Humanos',
    descricao: 'Publicação do manual revisado de conduta para todos os colaboradores.',
    projeto: 'Direitos Humanos e Ética',
    status: 'concluida',
    prioridade: 'baixa',
    data_vencimento: new Date(Date.now() - 3 * 86400000).toISOString(),
    estimativa_h: 3,
    anexos_count: 1,
    comentarios_count: 2,
    tarefa_checklist: [
      { id: 'c7', texto: 'Divulgação no portal corporativo', concluido: true },
    ],
    gradienteAvatar: 'from-emerald-500 to-green-600',
    tarefa_atribuicoes: [{ user_id: 'u1', users: { nome: 'Carlos Mendes' } }],
  },
];

// ─────────────────────────────────────────────────────────────
// COMPONENTE VISUAL: Card de Tarefa (Usado no Quadro e no DragOverlay)
// ─────────────────────────────────────────────────────────────
const CardTarefaVisual = ({ tarefa, isDragging = false, isOverlay = false }) => {
  const checklist = tarefa.tarefa_checklist || [];
  const concluidos = checklist.filter(c => c.concluido).length;

  // Verificação de prazo
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataVenc = tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : null;
  const ehHoje = dataVenc && dataVenc.toDateString() === new Date().toDateString();
  const atrasada = dataVenc && dataVenc < hoje && tarefa.status !== 'concluida';

  // Barra de prioridade no topo do card (estilo Image 1)
  const getBordaTopo = (prioridade) => {
    if (prioridade === 'critica' || prioridade === 'alta') return 'border-t-4 border-t-rose-500';
    if (prioridade === 'media') return 'border-t-4 border-t-amber-400';
    return 'border-t-2 border-t-emerald-400';
  };

  // Ícone de Bandeira de Prioridade
  const getCorBandeira = (prioridade) => {
    if (prioridade === 'critica' || prioridade === 'alta') return 'text-rose-500';
    if (prioridade === 'media') return 'text-amber-500';
    return 'text-emerald-500';
  };

  const responsavelNome = tarefa.tarefa_atribuicoes?.[0]?.users?.nome || 'Você';

  return (
    <div
      className={`rounded-2xl p-4 border transition-all select-none space-y-3 ${getBordaTopo(
        tarefa.prioridade
      )} ${
        isOverlay
          ? 'bg-white shadow-2xl ring-2 ring-[#0E382C]/25 rotate-2 scale-105 cursor-grabbing z-50 border-[#0E382C]/30'
          : isDragging
          ? 'opacity-35 border-2 border-dashed border-[#0E382C]/40 bg-[#EDF4F0]'
          : 'bg-white shadow-xs hover:shadow-md hover:border-[#CCD9D2] cursor-grab active:cursor-grabbing border-[#E4ECE7]'
      }`}
    >
      {/* Título & Projeto */}
      <div>
        <h4 className="text-xs sm:text-sm font-bold text-[#111915] leading-snug">
          {tarefa.titulo}
        </h4>
        <p className="text-[11px] text-[#687770] mt-1 line-clamp-1">
          {tarefa.projeto || tarefa.descricao || 'Geral'}
        </p>
      </div>

      {/* Faixa Inferior de Metadados: Bandeira, Prazo, Anexos, Comentários e Avatar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E4ECE7]/60 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bandeira de Prioridade */}
          <span title={`Prioridade ${tarefa.prioridade}`} className={getCorBandeira(tarefa.prioridade)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </span>

          {/* Prazo com badge destacada se for Hoje ou Atrasada */}
          {tarefa.data_vencimento && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-md px-1.5 py-0.5 ${
                atrasada
                  ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200/70'
                  : ehHoje
                  ? 'bg-rose-50 text-rose-600 font-bold border border-rose-200/70'
                  : 'text-[#687770]'
              }`}
              title={
                atrasada
                  ? `Prazo vencido em ${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}`
                  : ehHoje
                  ? 'Vence hoje'
                  : undefined
              }
            >
              <svg className={`w-3 h-3 ${atrasada || ehHoje ? 'text-rose-600' : 'text-[#99A6A0]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {ehHoje
                  ? 'Hoje'
                  : new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </span>
          )}

          {/* Anexos */}
          {(tarefa.anexos_count > 0 || tarefa.estimativa_h) && (
            <span className="flex items-center gap-1 text-[11px] text-[#99A6A0]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{tarefa.anexos_count || 1}</span>
            </span>
          )}

          {/* Comentários / Subtarefas */}
          {(tarefa.comentarios_count > 0 || checklist.length > 0) && (
            <span className="flex items-center gap-1 text-[11px] text-[#99A6A0]">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{tarefa.comentarios_count || (checklist.length ? `${concluidos}/${checklist.length}` : 2)}</span>
            </span>
          )}
        </div>

        {/* Avatar Gradiente do Responsável (Exato estilo do Image 1) */}
        <div
          title={responsavelNome}
          className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
            tarefa.gradienteAvatar || 'from-emerald-600 to-teal-500'
          } text-white font-bold text-[10px] flex items-center justify-center shadow-xs flex-shrink-0 ring-2 ring-white`}
        >
          {responsavelNome.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Card de Tarefa Sortable (Posicionado na Coluna)
// ─────────────────────────────────────────────────────────────
const CardTarefaSortable = ({ tarefa, onAbrir }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tarefa.id });

  // Quando o card está sendo arrastado (isDragging), o DragOverlay cuida do movimento com o cursor,
  // enquanto o elemento de origem permanece como placeholder na coluna com estilo tracejado
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
      <CardTarefaVisual tarefa={tarefa} isDragging={isDragging} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE: Coluna Droppable do Kanban
// ─────────────────────────────────────────────────────────────
const ColunaDroppable = ({ coluna, tarefas, onAbrir, onNovaTarefa }) => {
  const { setNodeRef, isOver } = useDroppable({ id: coluna.slug });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-full bg-[#F7FAF8] rounded-2xl p-3 sm:p-3.5 border transition-all ${
        isOver ? 'border-[#0E382C] bg-[#EDF4F0]' : 'border-[#E4ECE7]'
      }`}
    >
      {/* Cabeçalho da Coluna (Estilo Image 1) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={coluna.corIcone}>{coluna.icone}</span>
          <span className="text-xs font-bold text-[#111915]">{coluna.label}</span>
          <span className="text-xs font-semibold text-[#687770]">{tarefas.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onNovaTarefa(coluna.slug)}
            title={`Adicionar tarefa em ${coluna.label}`}
            className="w-6 h-6 rounded-lg text-[#687770] hover:text-[#0E382C] hover:bg-[#E4ECE7] flex items-center justify-center transition-colors font-bold text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Lista Sortable de Cards */}
      <SortableContext items={tarefas.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-3 min-h-[160px]">
          {tarefas.length === 0 ? (
            <div className="h-28 rounded-xl border border-dashed border-[#CCD9D2] flex items-center justify-center text-xs text-[#99A6A0]">
              Arraste tarefas aqui
            </div>
          ) : (
            tarefas.map(tarefa => (
              <CardTarefaSortable key={tarefa.id} tarefa={tarefa} onAbrir={onAbrir} />
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
    carregando,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
    usuariosTenant,
  } = useTarefas();

  // Tarefas ativas (com fallback automático resiliente)
  const [tarefasLocais, setTarefasLocais] = useState(() => {
    return TAREFAS_DEMO;
  });

  // Atualiza tarefas locais se o banco tiver dados
  React.useEffect(() => {
    if (tarefasDb && tarefasDb.length > 0) {
      setTarefasLocais(tarefasDb);
    }
  }, [tarefasDb]);

  // Estados de Controle de Interface
  const [visao, setVisao] = useState('kanban'); // 'kanban' | 'lista'
  const [filtroPill, setFiltroPill] = useState('todos'); // 'todos' | 'minhas' | 'atrasadas' | 'hoje' | 'andamento' | 'revisao' | 'concluidas'
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState('prazo'); // 'prazo' | 'prioridade' | 'titulo'
  const [dropdownViews, setDropdownViews] = useState(false);
  const [viewSelecionada, setViewSelecionada] = useState('Todas as Tarefas');
  const [bannerVisivel, setBannerVisivel] = useState(true);

  // Modal de Criação / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [formTarefa, setFormTarefa] = useState({
    titulo: '',
    descricao: '',
    projeto: '',
    status: 'pendente',
    prioridade: 'media',
    data_vencimento: '',
    estimativa_h: '',
  });

  // Estado para o card ativo no DragOverlay e snapshot de origem para cancelamento
  const [cardAtivo, setCardAtivo] = useState(null);
  const [cardOrigem, setCardOrigem] = useState(null);

  // Drag-and-Drop sensors com ativação por distância (5px) para não impedir cliques de abertura
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ─── Contadores Rápidos para as Pills (Estilo Image 2) ─────
  const contadores = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const todas = tarefasLocais.length;
    const minhas = tarefasLocais.filter(t =>
      t.tarefa_atribuicoes?.some(a => a.user_id === usuario?.id) || t.gradienteAvatar
    ).length;
    const atrasadas = tarefasLocais.filter(t => {
      if (!t.data_vencimento || t.status === 'concluida') return false;
      return new Date(t.data_vencimento) < hoje;
    }).length;
    const hojeCount = tarefasLocais.filter(t => {
      if (!t.data_vencimento) return false;
      return new Date(t.data_vencimento).toDateString() === new Date().toDateString();
    }).length;
    const andamento = tarefasLocais.filter(t => t.status === 'em_andamento').length;
    const revisao = tarefasLocais.filter(t => t.status === 'em_revisao').length;
    const concluidas = tarefasLocais.filter(t => t.status === 'concluida').length;

    return { todas, minhas, atrasadas, hojeCount, andamento, revisao, concluidas };
  }, [tarefasLocais, usuario]);

  // ─── Filtragem e Ordenação ─────────────────────────────────
  const tarefasFiltradas = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return tarefasLocais
      .filter(t => {
        // Busca textual
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const matchTitulo = t.titulo?.toLowerCase().includes(termo);
          const matchDesc = t.descricao?.toLowerCase().includes(termo);
          const matchProj = t.projeto?.toLowerCase().includes(termo);
          if (!matchTitulo && !matchDesc && !matchProj) return false;
        }

        // Filtro por Pills
        if (filtroPill === 'minhas') {
          return t.tarefa_atribuicoes?.some(a => a.user_id === usuario?.id) || t.gradienteAvatar;
        }
        if (filtroPill === 'atrasadas') {
          if (!t.data_vencimento || t.status === 'concluida') return false;
          return new Date(t.data_vencimento) < hoje;
        }
        if (filtroPill === 'hoje') {
          if (!t.data_vencimento) return false;
          return new Date(t.data_vencimento).toDateString() === new Date().toDateString();
        }
        if (filtroPill === 'andamento') return t.status === 'em_andamento';
        if (filtroPill === 'revisao') return t.status === 'em_revisao';
        if (filtroPill === 'concluidas') return t.status === 'concluida';

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
        if (ordenacao === 'titulo') {
          return (a.titulo || '').localeCompare(b.titulo || '');
        }
        return 0;
      });
  }, [tarefasLocais, busca, filtroPill, ordenacao, usuario]);

  // Agrupamento para Kanban
  const kanbanAgrupado = useMemo(() => {
    return COLUNAS_KANBAN.reduce((acc, col) => {
      acc[col.slug] = tarefasFiltradas.filter(t => t.status === col.slug);
      return acc;
    }, {});
  }, [tarefasFiltradas]);

  // ─── Drag and Drop: Detecção de Colisão e Handlers ─────────
  // Prioriza a posição real do ponteiro do mouse ao cruzar colunas largas
  const customCollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  }, []);

  // Início do arrasto: ativa o DragOverlay e grava o snapshot
  const handleDragStart = (event) => {
    const { active } = event;
    const card = tarefasLocais.find(t => t.id === active.id);
    if (card) {
      setCardAtivo(card);
      setCardOrigem({ ...card });
    }
  };

  // Durante o arrasto: move o card dinamicamente entre colunas ou reordena
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeTask = tarefasLocais.find(t => t.id === activeId);
    if (!activeTask) return;

    // Descobre se o cursor está sobre uma coluna ou sobre outro card
    const isColuna = COLUNAS_KANBAN.some(c => c.slug === overId);
    const targetStatus = isColuna ? overId : tarefasLocais.find(t => t.id === overId)?.status;

    if (!targetStatus) return;

    // Se o status da coluna mudou, move em tempo real
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
      // Reordenação de cards dentro da mesma coluna
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

  // Ao soltar o card: finaliza a animação de drop e persiste no backend
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    const tarefaId = active?.id;
    const origem = cardOrigem;

    setCardAtivo(null);
    setCardOrigem(null);

    if (!over || !tarefaId) {
      // Se soltou fora de qualquer droppable válido, restaura status original
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

      // Persiste no Supabase se não for ID demo e houve alteração
      if (origem && origem.status !== finalStatus && !String(tarefaId).startsWith('demo-')) {
        try {
          await atualizarTarefa(tarefaId, { status: finalStatus });
        } catch (e) {
          console.error('Erro ao atualizar status da tarefa:', e);
        }
      }
    }
  };

  // Cancelamento do arrasto (ex: tecla Escape)
  const handleDragCancel = () => {
    if (cardOrigem) {
      setTarefasLocais(prev =>
        prev.map(t => (t.id === cardOrigem.id ? { ...t, status: cardOrigem.status } : t))
      );
    }
    setCardAtivo(null);
    setCardOrigem(null);
  };

  // ─── Ações de Modal e Tarefa ──────────────────────────────
  const handleAbrirModal = (tarefa = null, statusDefault = 'pendente') => {
    if (tarefa) {
      setTarefaEditando(tarefa);
      setFormTarefa({
        titulo: tarefa.titulo || '',
        descricao: tarefa.descricao || '',
        projeto: tarefa.projeto || '',
        status: tarefa.status || 'pendente',
        prioridade: tarefa.prioridade || 'media',
        data_vencimento: tarefa.data_vencimento ? tarefa.data_vencimento.split('T')[0] : '',
        estimativa_h: tarefa.estimativa_h || '',
      });
    } else {
      setTarefaEditando(null);
      setFormTarefa({
        titulo: '',
        descricao: '',
        projeto: '',
        status: statusDefault,
        prioridade: 'media',
        data_vencimento: '',
        estimativa_h: '',
      });
    }
    setModalAberto(true);
  };

  const handleSalvarTarefa = async (e) => {
    e.preventDefault();
    if (!formTarefa.titulo.trim()) return;

    if (tarefaEditando) {
      const atualizada = {
        ...tarefaEditando,
        ...formTarefa,
        data_vencimento: formTarefa.data_vencimento ? new Date(formTarefa.data_vencimento).toISOString() : null,
      };
      setTarefasLocais(prev => prev.map(t => (t.id === tarefaEditando.id ? atualizada : t)));

      if (!String(tarefaEditando.id).startsWith('demo-')) {
        await atualizarTarefa(tarefaEditando.id, formTarefa);
      }
    } else {
      const nova = {
        id: `local-t-${Date.now()}`,
        ...formTarefa,
        data_vencimento: formTarefa.data_vencimento ? new Date(formTarefa.data_vencimento).toISOString() : null,
        anexos_count: 0,
        comentarios_count: 0,
        tarefa_checklist: [],
        gradienteAvatar: 'from-emerald-500 to-teal-600',
        tarefa_atribuicoes: [{ user_id: usuario?.id || 'me', users: { nome: usuario?.nome || 'Você' } }],
      };
      setTarefasLocais(prev => [nova, ...prev]);

      if (usuario?.tenant_id) {
        try {
          await criarTarefa(formTarefa);
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
          if (!String(id).startsWith('demo-')) {
            atualizarTarefa(id, { status: novo });
          }
          return { ...t, status: novo };
        }
        return t;
      })
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col font-sans pb-12 space-y-5">
      {/* ─────────────────────────────────────────────────────────
          1. HEADER SUPERIOR: TÍTULO, VIEWS DROPDOWN E AÇÕES
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#111915] tracking-tight">
              Tarefas
            </h1>
            {/* Seletor de Views Estilo Image 1 */}
            <div className="relative">
              <button
                onClick={() => setDropdownViews(v => !v)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#687770] hover:text-[#0E382C] hover:bg-white border border-transparent hover:border-[#E4ECE7] transition-all"
              >
                <svg className="w-3.5 h-3.5 text-[#0E382C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>{viewSelecionada}</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownViews && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E4ECE7] py-1.5 z-30 animate-fade-in text-xs font-semibold">
                  {['Todas as Tarefas', 'Por Projeto', 'Por Responsável', 'Urgentes'].map(v => (
                    <button
                      key={v}
                      onClick={() => { setViewSelecionada(v); setDropdownViews(false); }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#F7FAF8] ${
                        viewSelecionada === v ? 'text-[#0E382C] bg-[#F7FAF8] font-bold' : 'text-[#687770]'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-[#687770] mt-0.5">
            {tarefasFiltradas.length} tarefas encontradas no quadro
          </p>
        </div>

        {/* Controles de Ação (Estilo Image 1 + Image 2) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botão Primário: + Nova Tarefa */}
          <button
            onClick={() => handleAbrirModal(null, 'pendente')}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <span className="text-sm font-extrabold leading-none">+</span>
            <span>Nova Tarefa</span>
          </button>

          {/* Ordenação */}
          <div className="flex items-center bg-white rounded-xl border border-[#E4ECE7] px-2.5 py-1.5 shadow-2xs">
            <svg className="w-3.5 h-3.5 text-[#687770] mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#111915] focus:outline-none cursor-pointer"
            >
              <option value="prazo">Ordenar por Prazo</option>
              <option value="prioridade">Ordenar por Prioridade</option>
              <option value="titulo">Ordenar por Nome</option>
            </select>
          </div>

          {/* Alternador de Visualização: Quadro (Kanban) / Lista (Tabela) */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#E4ECE7] shadow-2xs">
            <button
              onClick={() => setVisao('kanban')}
              title="Visualização em Quadro Kanban"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                visao === 'kanban'
                  ? 'bg-[#0E382C] text-white shadow-2xs'
                  : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              <span>Quadro</span>
            </button>
            <button
              onClick={() => setVisao('lista')}
              title="Visualização em Lista / Tabela"
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                visao === 'lista'
                  ? 'bg-[#0E382C] text-white shadow-2xs'
                  : 'text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. BARRA DE FILTROS RÁPIDOS EM PILLS (FUSÃO DA IMAGEM 2)
         ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        {/* Pills com Contadores estilo Image 2 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* Todas */}
          <button
            onClick={() => setFiltroPill('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'todos'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'todos' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.todas}
            </span>
            <span>Todas</span>
          </button>

          {/* Atrasadas (destaque suave se houver) */}
          <button
            onClick={() => setFiltroPill('atrasadas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'atrasadas'
                ? 'bg-rose-700 text-white shadow-xs'
                : contadores.atrasadas > 0
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'atrasadas' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
            }`}>
              {contadores.atrasadas}
            </span>
            <span>Atrasadas</span>
          </button>

          {/* Minhas Tarefas */}
          <button
            onClick={() => setFiltroPill('minhas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'minhas'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'minhas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.minhas}
            </span>
            <span>Minhas Tarefas</span>
          </button>

          {/* Vencem Hoje */}
          <button
            onClick={() => setFiltroPill('hoje')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'hoje'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'hoje' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.hojeCount}
            </span>
            <span>Hoje</span>
          </button>

          {/* Em Progresso */}
          <button
            onClick={() => setFiltroPill('andamento')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'andamento'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'andamento' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.andamento}
            </span>
            <span>Em Progresso</span>
          </button>

          {/* Em Revisão */}
          <button
            onClick={() => setFiltroPill('revisao')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'revisao'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'revisao' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.revisao}
            </span>
            <span>Em Revisão</span>
          </button>

          {/* Concluídas */}
          <button
            onClick={() => setFiltroPill('concluidas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              filtroPill === 'concluidas'
                ? 'bg-[#0E382C] text-white shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:border-[#CCD9D2] hover:text-[#111915]'
            }`}
          >
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              filtroPill === 'concluidas' ? 'bg-[#D4EC9D] text-[#0E382C]' : 'bg-[#EBF0ED] text-[#111915]'
            }`}>
              {contadores.concluidas}
            </span>
            <span>Concluídas</span>
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="w-full sm:w-64 relative">
          <svg className="w-3.5 h-3.5 text-[#99A6A0] absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título ou projeto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E4ECE7] rounded-xl text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C] shadow-2xs"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────
          3. BANNER INFORMATIVO SUTIL (ESTILO IMAGE 2)
         ───────────────────────────────────────────────────────── */}
      {bannerVisivel && (
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-3.5 px-4 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#EBF5EC] border border-[#D4EC9D] flex items-center justify-center text-[#0E382C] flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-xs text-[#111915]">
              <strong className="font-semibold text-[#0E382C]">Dica de Produtividade:</strong> Você pode arrastar tarefas entre as colunas do Quadro ou marcar diretamente o checkbox no modo Lista para avançar seu fluxo de trabalho.
            </p>
          </div>
          <button
            onClick={() => setBannerVisivel(false)}
            className="text-[#99A6A0] hover:text-[#111915] text-xs p-1"
            title="Fechar dica"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          4. VISUALIZAÇÃO: KANBAN BOARD (ESTILO ACTIONS - IMAGE 1)
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
                />
              ))}
            </div>
          </div>

          {/* Overlay flutuante que acompanha o cursor fielmente com animação suave de drop */}
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
          5. VISUALIZAÇÃO: LISTA / TABELA (ESTILO ORDERS - IMAGE 2)
         ───────────────────────────────────────────────────────── */}
      {visao === 'lista' && (
        <div className="bg-white rounded-2xl border border-[#E4ECE7] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4ECE7] bg-[#F7FAF8] text-[11px] font-bold text-[#687770] uppercase tracking-wider">
                  <th className="py-3.5 pl-5 pr-2 w-10"></th>
                  <th className="py-3.5 px-4">Tarefa & Projeto</th>
                  <th className="py-3.5 px-4">Prazo</th>
                  <th className="py-3.5 px-4">Prioridade</th>
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
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const dataVenc = tarefa.data_vencimento ? new Date(tarefa.data_vencimento) : null;
                    const atrasada = dataVenc && dataVenc < hoje && !concluida;
                    const ehHoje = dataVenc && dataVenc.toDateString() === new Date().toDateString();

                    return (
                      <tr
                        key={tarefa.id}
                        onClick={() => handleAbrirModal(tarefa)}
                        className="hover:bg-[#F7FAF8] transition-colors cursor-pointer group"
                      >
                        {/* Checkbox de Conclusão Rápida */}
                        <td className="py-3.5 pl-5 pr-2" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={concluida}
                            onChange={() => toggleConcluida(tarefa.id)}
                            className="w-4 h-4 rounded-md text-[#0E382C] focus:ring-[#0E382C] cursor-pointer"
                          />
                        </td>

                        {/* Título & Projeto */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold ${
                                concluida ? 'line-through text-[#99A6A0]' : 'text-[#111915] group-hover:text-[#0E382C]'
                              }`}
                            >
                              {tarefa.titulo}
                            </span>
                            {/* Badge de Comentários / Anexos (estilo Image 2) */}
                            {tarefa.comentarios_count > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#99A6A0] font-semibold bg-[#F4F7F5] px-1.5 py-0.5 rounded-md">
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {tarefa.comentarios_count}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#687770] truncate mt-0.5">
                            {tarefa.projeto || tarefa.descricao || 'Sem projeto vinculado'}
                          </p>
                        </td>

                        {/* Prazo */}
                        <td className="py-3.5 px-4">
                          {tarefa.data_vencimento ? (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold text-[11px] px-2 py-0.5 rounded-md ${
                                atrasada
                                  ? 'text-rose-700 bg-rose-50 border border-rose-200/60 font-bold'
                                  : ehHoje
                                  ? 'text-rose-600 bg-rose-50 border border-rose-200/60 font-bold'
                                  : 'text-[#687770]'
                              }`}
                              title={
                                atrasada
                                  ? `Atrasada (Venceu em ${new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')})`
                                  : ehHoje
                                  ? 'Vence hoje'
                                  : undefined
                              }
                            >
                              <svg className={`w-3 h-3 ${atrasada || ehHoje ? 'text-rose-600' : 'text-[#99A6A0]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>
                                {ehHoje
                                  ? 'Hoje'
                                  : new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#99A6A0] text-[11px]">-</span>
                          )}
                        </td>

                        {/* Prioridade */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              tarefa.prioridade === 'critica' || tarefa.prioridade === 'alta'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : tarefa.prioridade === 'media'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              tarefa.prioridade === 'critica' || tarefa.prioridade === 'alta' ? 'bg-rose-600' : tarefa.prioridade === 'media' ? 'bg-amber-600' : 'bg-emerald-600'
                            }`} />
                            {tarefa.prioridade ? tarefa.prioridade.toUpperCase() : 'MÉDIA'}
                          </span>
                        </td>

                        {/* Status Pills */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                              tarefa.status === 'concluida'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tarefa.status === 'em_andamento'
                                ? 'bg-blue-100 text-blue-800'
                                : tarefa.status === 'em_revisao'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {tarefa.status === 'em_andamento'
                              ? 'Em Progresso'
                              : tarefa.status === 'em_revisao'
                              ? 'Em Revisão'
                              : tarefa.status === 'concluida'
                              ? 'Concluída'
                              : 'Backlog'}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-full bg-gradient-to-tr ${
                                tarefa.gradienteAvatar || 'from-emerald-500 to-teal-600'
                              } text-white font-bold text-[10px] flex items-center justify-center`}
                            >
                              {(tarefa.tarefa_atribuicoes?.[0]?.users?.nome || 'Você').slice(0, 1).toUpperCase()}
                            </div>
                            <span className="text-xs text-[#111915] font-medium truncate max-w-[100px]">
                              {tarefa.tarefa_atribuicoes?.[0]?.users?.nome || 'Você'}
                            </span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 pr-5 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleAbrirModal(tarefa)}
                              className="p-1 rounded-lg text-[#687770] hover:text-[#0E382C] hover:bg-[#EDF2EE]"
                              title="Editar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleExcluirTarefa(tarefa.id)}
                              className="p-1 rounded-lg text-[#99A6A0] hover:text-rose-600 hover:bg-rose-50"
                              title="Excluir"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
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
            className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-xl border border-[#E4ECE7] animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
              <h2 className="text-base font-bold text-[#111915]">
                {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-[#687770] hover:text-[#111915] text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarTarefa} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Título da Tarefa *</label>
                <input
                  type="text"
                  placeholder="Ex: Auditoria de Documentos e Políticas"
                  value={formTarefa.titulo}
                  onChange={e => setFormTarefa(f => ({ ...f, titulo: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Projeto ou Contexto</label>
                <input
                  type="text"
                  placeholder="Ex: Tratado de Governança ou Cliente Widget.io"
                  value={formTarefa.projeto}
                  onChange={e => setFormTarefa(f => ({ ...f, projeto: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Instruções ou escopo detalhado..."
                  value={formTarefa.descricao}
                  onChange={e => setFormTarefa(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111915] mb-1">Coluna / Status</label>
                  <select
                    value={formTarefa.status}
                    onChange={e => setFormTarefa(f => ({ ...f, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                  >
                    <option value="pendente">Backlog</option>
                    <option value="em_andamento">Em Progresso</option>
                    <option value="em_revisao">Em Revisão</option>
                    <option value="concluida">Concluída</option>
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
                    className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white text-xs font-bold rounded-xl shadow-xs"
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
