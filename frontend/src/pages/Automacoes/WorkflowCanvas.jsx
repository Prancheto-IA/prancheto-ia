// =============================================================
// PRANCHETO.IA - CONSTRUTOR VISUAL STUDIO TOP-DOWN (ESTILO N8N)
// Árvore vertical ramificada com curvas ortogonais arredondadas,
// botões '+' nas conexões, ícones mesh-gradient e controles HUD.
// =============================================================
import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  Clock,
  Code2,
  Settings,
  Play,
  Upload,
  MoreHorizontal,
  Plus,
  Minus,
  Maximize2,
  FileText,
  Zap,
  Sparkles,
  Trash2,
  GitBranch,
  Link2,
  X,
  RefreshCw,
  Search,
  UserPlus,
  Trophy,
  UserX,
  Calendar,
  Bell,
  Tag,
  CalendarClock,
  Timer,
  CheckCircle2,
  Hourglass,
  Filter,
} from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { WhatsappIcon } from '@hugeicons/core-free-icons';
import { Badge, BadgeDot } from '@/components/reui/badge';
import { Switch } from '@/components/reui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/reui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import pranchetinhoFavicon from '../../assets/mascote/pranchetinho-favicon.png';
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  MESH_GRADIENTS,
  CATEGORIAS_NO,
  CATALOGO_NOS,
  VARIAVEIS_DISPONIVEIS,
  FUNIL_LEAD,
  ORIGENS,
  getCatalogoNo,
  autoOrganizarNosVertical,
  interpolarMensagemWhatsApp,
} from './automacoesData.js';

// Constrói caminho ortogonal vertical com cantos arredondados estilo Studio
const buildOrthogonalEdgePath = (src, tgt, outCount, inCount) => {
  const x1 = src.position.x + NODE_WIDTH / 2;
  const y1 = src.position.y + NODE_HEIGHT;
  const x2 = tgt.position.x + NODE_WIDTH / 2;
  const y2 = tgt.position.y;

  // Fallback suave caso o usuário arraste o nó filho acima do nó pai
  if (y2 <= y1 + 12) {
    const midY = (y1 + y2) / 2;
    return {
      d: `M ${x1} ${y1} C ${x1} ${y1 + 48}, ${x2} ${y2 - 48}, ${x2} ${y2}`,
      btnX: (x1 + x2) / 2,
      btnY: midY,
      arrowX: x2,
      arrowY: y2,
    };
  }

  if (Math.abs(x1 - x2) < 4) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2 - 2}`,
      btnX: x1,
      btnY: (y1 + y2) / 2,
      arrowX: x2,
      arrowY: y2,
    };
  }

  let bendY;
  if (outCount > 1 && inCount === 1) {
    bendY = y1 + 26;
  } else if (inCount > 1) {
    bendY = y2 - 26;
  } else {
    bendY = (y1 + y2) / 2;
  }

  const r = Math.min(
    16,
    Math.abs(x2 - x1) / 2,
    Math.max(4, Math.abs(bendY - y1) / 2),
    Math.max(4, Math.abs(y2 - bendY) / 2)
  );
  const sx = x2 > x1 ? 1 : -1;

  const d = [
    `M ${x1} ${y1}`,
    `L ${x1} ${bendY - r}`,
    `Q ${x1} ${bendY} ${x1 + sx * r} ${bendY}`,
    `L ${x2 - sx * r} ${bendY}`,
    `Q ${x2} ${bendY} ${x2} ${bendY + r}`,
    `L ${x2} ${y2 - 2}`,
  ].join(' ');

  return {
    d,
    btnX: x1 + (x2 - x1) * 0.55,
    btnY: bendY,
    arrowX: x2,
    arrowY: y2,
  };
};

// Helper para renderizar o ícone temático de cada nó
const renderNodeIcon = (type, className = 'w-4 h-4') => {
  switch (type) {
    case 'trigger_stage_changed':
      return <Zap className={className} />;
    case 'trigger_lead_created':
      return <UserPlus className={className} />;
    case 'trigger_lead_won':
      return <Trophy className={className} />;
    case 'trigger_lead_lost':
      return <UserX className={className} />;
    case 'trigger_inactivity':
      return <Hourglass className={className} />;
    case 'trigger_no_contact':
      return <Timer className={className} />;
    case 'trigger_meeting_scheduled':
      return <Calendar className={className} />;
    case 'trigger_meeting_reminder':
      return <Bell className={className} />;
    case 'trigger_tag_added':
      return <Tag className={className} />;
    case 'trigger_schedule_datetime':
      return <CalendarClock className={className} />;
    case 'action_whatsapp_text':
      return <HugeiconsIcon icon={WhatsappIcon} size={16} className={className} />;
    case 'ai_pranchetinho':
      return <Sparkles className={className} />;
    case 'logic_condition':
      return <Filter className={className} />;
    case 'logic_delay':
      return <Clock className={className} />;
    case 'action_crm_task':
      return <CheckCircle2 className={className} />;
    default:
      return <Zap className={className} />;
  }
};

// -------------------------------------------------------------
// SUBCOMPONENTE: Card Horizontal Minimalista do Studio
// -------------------------------------------------------------
const StudioNodeCard = ({
  node,
  selecionado,
  statusSimulacao,
  conectandoOrigemId,
  onSelect,
  onPointerDownDrag,
  onInsertBelow,
  onAddBranch,
  onStartConnect,
  onFinishConnect,
  onToggleFinalRole,
  onDeleteNode,
}) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const meta = getCatalogoNo(node.type);
  const cfg = node.config || {};
  const role = node.nodeRole || meta.nodeRole || 'step';
  const meshBg = MESH_GRADIENTS[cfg.meshKey] || meta.meshGradient;
  const esperadoConexao = conectandoOrigemId && conectandoOrigemId !== node.id;

  const isFinal = role === 'final';

  const bordaClass =
    statusSimulacao === 'running'
      ? 'border-amber-400 ring-4 ring-amber-400/20 shadow-[0_12px_28px_-6px_rgba(245,158,11,0.3)]'
      : statusSimulacao === 'success'
      ? 'border-emerald-500 ring-4 ring-emerald-500/15 shadow-[0_12px_28px_-6px_rgba(16,185,129,0.22)]'
      : selecionado
      ? 'border-brand-secondary dark:border-brand-violet ring-4 ring-brand-secondary/15 shadow-lg'
      : isFinal
      ? 'border-[1.5px] border-[#0B132B] dark:border-brand-violet shadow-[0_6px_24px_-6px_rgba(11,19,43,0.16)]'
      : esperadoConexao
      ? 'border-brand-purple ring-4 ring-brand-purple/20'
      : 'border-surface-border hover:border-surface-border-strong shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] dark:shadow-[0_6px_22px_-6px_rgba(0,0,0,0.45)]';

  return (
    <div
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`,
      }}
      onPointerDown={(e) => onPointerDownDrag(e, node)}
      onClick={(e) => {
        e.stopPropagation();
        if (esperadoConexao) {
          onFinishConnect(node.id);
        } else {
          onSelect(node.id);
        }
      }}
      className={`group absolute top-0 left-0 select-none rounded-2xl border bg-surface-card px-3.5 flex items-center gap-3 transition-all duration-150 cursor-grab active:cursor-grabbing ${bordaClass}`}
    >
      {/* Bloco Esquerdo do Ícone */}
      <div
        style={{ background: isFinal ? undefined : meshBg }}
        className={`relative w-10 h-10 shrink-0 rounded-xl flex items-center justify-center shadow-xs overflow-hidden transition-transform group-hover:scale-105 ${
          isFinal
            ? 'bg-[#0B132B] dark:bg-brand-purple text-white ring-1 ring-inset ring-white/10'
            : 'text-white ring-1 ring-inset ring-white/20'
        }`}
      >
        <span className="absolute inset-0 bg-gradient-to-tr from-white/15 via-transparent to-white/25 pointer-events-none" />
        <span className="relative z-10 flex items-center justify-center">
          {isFinal ? (
            <Upload className="w-4 h-4 text-white" strokeWidth={2.2} />
          ) : (
            renderNodeIcon(node.type, 'w-4 h-4 text-white')
          )}
        </span>
      </div>

      {/* Textos Centrais em 2 Linhas */}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-ink-muted truncate leading-tight">
          {cfg.phaseLabel || meta.phaseLabel}
        </p>
        <h4 className="mt-0.5 text-[13px] font-bold text-ink-primary truncate leading-tight">
          {cfg.customTitle || meta.title}
        </h4>
      </div>

      {/* Indicador de Execução ao Vivo ou Menu '...' */}
      <div
        className="flex items-center gap-1 shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {statusSimulacao === 'running' && (
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
        )}
        {statusSimulacao === 'success' && (
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        )}

        <Popover open={menuAberto} onOpenChange={setMenuAberto}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="Opções do bloco"
              className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onSelect(node.id);
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-ink-secondary" />
              Configurar bloco
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onInsertBelow(node.id, 'action_whatsapp_text');
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-brand-secondary" />
              Adicionar passo abaixo
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onAddBranch(node.id);
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-brand-purple" />
              Criar ramo paralelo
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onStartConnect(node.id);
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-sky-500" />
              Conectar manualmente
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onToggleFinalRole(node.id);
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-ink-primary hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-ink-secondary" />
              {isFinal ? 'Definir como passo comum' : 'Marcar como bloco final'}
            </button>
            <div className="my-1 h-px bg-surface-border" />
            <button
              type="button"
              onClick={() => {
                setMenuAberto(false);
                onDeleteNode(node.id);
              }}
              className="w-full flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover bloco
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SUBCOMPONENTE: Botão Circular '+' sobre a Conexão SVG
// -------------------------------------------------------------
const EdgeAddButton = ({ edge, isFinalEdge, x, y, onInsertBetween, onAddBranchFromEdge, onRemoveEdge }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-20"
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Inserir bloco nesta conexão"
            className={`flex h-6 w-6 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-115 cursor-pointer ${
              isFinalEdge
                ? 'bg-slate-400 dark:bg-slate-600 hover:bg-[#0B132B]'
                : 'bg-[#0B132B] dark:bg-brand-purple hover:bg-brand-secondary'
            }`}
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={8} className="w-64 p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Inserir passo aqui
            </span>
            <button
              type="button"
              onClick={() => {
                onRemoveEdge(edge.id);
                setOpen(false);
              }}
              className="text-[11px] font-semibold text-red-500 hover:underline cursor-pointer"
            >
              Desconectar
            </button>
          </div>

          <div className="mt-1 space-y-1 max-h-64 overflow-y-auto">
            {CATALOGO_NOS.filter((item) => item.category !== 'trigger').map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  onInsertBetween(edge, item.type);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <span
                  style={{ background: item.meshGradient }}
                  className="h-6 w-6 shrink-0 rounded-lg"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink-primary truncate">{item.title}</p>
                  <p className="text-[10px] text-ink-muted truncate">{item.shortDesc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-1.5 pt-1.5 border-t border-surface-border">
            <button
              type="button"
              onClick={() => {
                onAddBranchFromEdge(edge.source);
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-surface-subtle hover:bg-surface-hover py-1.5 text-xs font-semibold text-brand-purple cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Criar ramo paralelo a partir daqui
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// -------------------------------------------------------------
// SUBCOMPONENTE: Card de Item do Catálogo (Drawer)
// -------------------------------------------------------------
const ItemBlocoCard = ({ item, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className="w-full flex items-start gap-3 rounded-2xl border border-surface-border/70 bg-surface-card hover:border-brand-primary/60 hover:shadow-xs p-3 text-left transition-all cursor-pointer group"
  >
    <span
      style={{ background: item.meshGradient }}
      className="h-9 w-9 shrink-0 rounded-xl shadow-xs ring-1 ring-inset ring-black/5 group-hover:scale-105 transition-transform mt-0.5 flex items-center justify-center text-white"
    >
      {renderNodeIcon(item.type, 'w-4 h-4 text-white')}
    </span>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="text-xs font-bold text-ink-primary group-hover:text-brand-secondary dark:group-hover:text-[#7DD3FC] truncate">
          {item.title}
        </p>
        <span className="text-[10px] text-ink-muted shrink-0">
          {item.category === 'trigger' ? 'Gatilho' : 'Ação'}
        </span>
      </div>
      <p className="text-[11px] text-ink-secondary line-clamp-2 leading-tight mt-0.5">
        {item.shortDesc}
      </p>
    </div>
  </button>
);

// -------------------------------------------------------------
// SUBCOMPONENTE: Menu Lateral Direito de Adicionar Blocos (ReUI)
// -------------------------------------------------------------
const StudioAddNodeDrawer = ({
  isOpen,
  onClose,
  selectedNode,
  onAddNodeType,
  onClearSelectedNode,
}) => {
  const [busca, setBusca] = useState('');
  const [tabAtiva, setTabAtiva] = useState('todos');

  if (!isOpen) return null;

  const termo = busca.trim().toLowerCase();

  const filtrados = CATALOGO_NOS.filter((item) => {
    if (tabAtiva === 'gatilhos' && item.category !== 'trigger') return false;
    if (tabAtiva === 'acoes' && item.category === 'trigger') return false;
    if (!termo) return true;
    return (
      item.title.toLowerCase().includes(termo) ||
      (item.shortDesc || '').toLowerCase().includes(termo) ||
      (item.phaseLabel || '').toLowerCase().includes(termo)
    );
  });

  const gatilhosFase1 = filtrados.filter(
    (i) => i.category === 'trigger' && i.grupo === 'fase1'
  );
  const gatilhosFase2 = filtrados.filter(
    (i) => i.category === 'trigger' && i.grupo === 'fase2'
  );
  const gatilhosAgendamento = filtrados.filter(
    (i) => i.category === 'trigger' && i.grupo === 'agendamento'
  );
  const acoesELogica = filtrados.filter((i) => i.category !== 'trigger');

  const totalGatilhos = CATALOGO_NOS.filter((i) => i.category === 'trigger').length;
  const totalAcoes = CATALOGO_NOS.filter((i) => i.category !== 'trigger').length;

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-0 right-0 bottom-0 z-40 w-full sm:w-[410px] border-l border-surface-border bg-surface-card/98 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-surface-border bg-surface-subtle/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            style={{ background: MESH_GRADIENTS.brand }}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-ink-primary truncate">Adicionar Bloco</h2>
              <Badge variant="violet" size="xs">ReUI</Badge>
            </div>
            <p className="text-[11px] text-ink-secondary truncate">
              Gatilhos CRM, mensagens WhatsApp e lógica
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
          aria-label="Fechar catálogo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Busca & Contexto */}
      <div className="p-3.5 border-b border-surface-border space-y-2.5 bg-surface-card">
        <div className="relative">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, gatilho, ação..."
            className="h-9 w-full rounded-xl border border-surface-border bg-surface-subtle pl-9 pr-8 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary transition-colors"
          />
          {busca && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-ink-muted hover:text-ink-primary cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {selectedNode ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/5 px-2.5 py-1.5 text-[11px] text-ink-primary">
            <div className="flex items-center gap-1.5 min-w-0">
              <Zap className="w-3.5 h-3.5 text-brand-purple shrink-0" />
              <span className="truncate">
                Conectar após: <strong>{selectedNode.config?.customTitle || selectedNode.id}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onClearSelectedNode}
              className="text-[10px] text-ink-secondary hover:text-ink-primary underline shrink-0 cursor-pointer"
            >
              Inserir avulso
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-ink-muted">
            Clique em qualquer bloco para adicionar ao workflow.
          </p>
        )}

        {/* Tabs ReUI */}
        <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="todos" className="text-xs">
              Todos ({CATALOGO_NOS.length})
            </TabsTrigger>
            <TabsTrigger value="gatilhos" className="text-xs">
              Gatilhos ({totalGatilhos})
            </TabsTrigger>
            <TabsTrigger value="acoes" className="text-xs">
              Ações ({totalAcoes})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Blocos */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {filtrados.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs font-bold text-ink-primary">Nenhum bloco encontrado</p>
            <p className="text-[11px] text-ink-muted">Tente buscar por outro termo</p>
          </div>
        ) : (
          <>
            {/* Seção Gatilhos Fase 1 */}
            {gatilhosFase1.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Gatilhos · Funil &amp; Ciclo de Vida (Fase 1)
                  </span>
                  <Badge variant="violet" size="xs">4 gatilhos</Badge>
                </div>
                <div className="space-y-1.5">
                  {gatilhosFase1.map((item) => (
                    <ItemBlocoCard
                      key={item.type}
                      item={item}
                      onSelect={() => onAddNodeType(item.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção Gatilhos Fase 2 */}
            {gatilhosFase2.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Gatilhos · Tempo, Agenda &amp; Tags (Fase 2)
                  </span>
                  <Badge variant="warning" size="xs">5 gatilhos</Badge>
                </div>
                <div className="space-y-1.5">
                  {gatilhosFase2.map((item) => (
                    <ItemBlocoCard
                      key={item.type}
                      item={item}
                      onSelect={() => onAddNodeType(item.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção Gatilhos Data e Horário */}
            {gatilhosAgendamento.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Agendamento · Data &amp; Horário
                  </span>
                  <Badge variant="info" size="xs">Cron</Badge>
                </div>
                <div className="space-y-1.5">
                  {gatilhosAgendamento.map((item) => (
                    <ItemBlocoCard
                      key={item.type}
                      item={item}
                      onSelect={() => onAddNodeType(item.type)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Seção Ações & Lógica */}
            {acoesELogica.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Ações, IA &amp; Controle de Fluxo
                  </span>
                  <Badge variant="success" size="xs">5 blocos</Badge>
                </div>
                <div className="space-y-1.5">
                  {acoesELogica.map((item) => (
                    <ItemBlocoCard
                      key={item.type}
                      item={item}
                      onSelect={() => onAddNodeType(item.type)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

// -------------------------------------------------------------
// SUBCOMPONENTE: Painel Inspetor Lateral Direito (ReUI)
// -------------------------------------------------------------
const StudioNodeInspector = ({
  node,
  conexoes,
  leadPreview,
  onChangeConfig,
  onClose,
  onDeleteNode,
}) => {
  const textareaRef = useRef(null);

  if (!node) return null;

  const meta = getCatalogoNo(node.type);
  const cat = CATEGORIAS_NO[meta.category] || CATEGORIAS_NO.trigger;
  const cfg = node.config || {};
  const meshBg = MESH_GRADIENTS[cfg.meshKey] || meta.meshGradient;

  const updateField = (chave, valor) => {
    onChangeConfig(node.id, { ...cfg, [chave]: valor });
  };

  const inserirVariavelTemplate = (token) => {
    const atual = cfg.mensagem || '';
    const el = textareaRef.current;
    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      updateField('mensagem', `${atual.slice(0, start)}${token}${atual.slice(end)}`);
    } else {
      updateField('mensagem', `${atual}${atual && !atual.endsWith(' ') ? ' ' : ''}${token}`);
    }
  };

  return (
    <aside
      onPointerDown={(e) => e.stopPropagation()}
      className="absolute top-3 right-3 bottom-20 z-30 w-[calc(100%-24px)] sm:w-[360px] rounded-2xl border border-surface-border bg-surface-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Cabeçalho do Inspetor */}
      <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-surface-border bg-surface-subtle/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            style={{ background: meshBg }}
            className="h-8 w-8 shrink-0 rounded-xl shadow-xs ring-1 ring-inset ring-black/5 flex items-center justify-center text-white"
          >
            {renderNodeIcon(node.type, 'w-4 h-4 text-white')}
          </span>
          <div className="min-w-0">
            <Badge variant={cat.badgeVariant} size="xs">
              {cat.label}
            </Badge>
            <h3 className="text-sm font-bold text-ink-primary truncate mt-0.5">
              {cfg.customTitle || meta.title}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
          aria-label="Fechar inspetor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formulário ReUI */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          <Field>
            <FieldLabel>Fase / Ramo</FieldLabel>
            <input
              type="text"
              value={cfg.phaseLabel || ''}
              onChange={(e) => updateField('phaseLabel', e.target.value)}
              placeholder="Ex: Fase 2 / Ramo 1"
              className="h-9 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary"
            />
          </Field>
          <Field>
            <FieldLabel>Título no Canvas</FieldLabel>
            <input
              type="text"
              value={cfg.customTitle || ''}
              onChange={(e) => updateField('customTitle', e.target.value)}
              placeholder={meta.title}
              className="h-9 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary"
            />
          </Field>
        </div>

        {/* Seletor visual de Mesh Orb */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
            Cor do Ícone Mesh
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MESH_GRADIENTS).map(([key, grad]) => (
              <button
                key={key}
                type="button"
                onClick={() => updateField('meshKey', key)}
                style={{ background: grad }}
                title={key}
                className={`h-6 w-6 rounded-lg transition-transform cursor-pointer ${
                  cfg.meshKey === key
                    ? 'scale-110 ring-2 ring-[#0B132B] dark:ring-white ring-offset-2 ring-offset-surface-card'
                    : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="h-px bg-surface-border" />

        {node.type === 'trigger_stage_changed' && (
          <>
            <Field>
              <FieldLabel>Etapa de Origem (Funil CRM)</FieldLabel>
              <Select
                value={cfg.etapaOrigem || 'qualquer'}
                onValueChange={(v) => updateField('etapaOrigem', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualquer">Qualquer etapa anterior</SelectItem>
                  {FUNIL_LEAD.map((etapa) => (
                    <SelectItem key={etapa.key} value={etapa.key}>
                      {etapa.emoji} {etapa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Etapa de Destino (Quando mover para)</FieldLabel>
              <Select
                value={cfg.etapaDestino || 'proposta'}
                onValueChange={(v) => updateField('etapaDestino', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNIL_LEAD.map((etapa) => (
                    <SelectItem key={etapa.key} value={etapa.key}>
                      {etapa.emoji} {etapa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-subtle p-3">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Apenas horário comercial</p>
                <p className="text-[11px] text-ink-secondary">Seg–Sex, 08:00 às 19:00</p>
              </div>
              <Switch
                size="sm"
                variant="violet"
                checked={Boolean(cfg.apenasHorarioComercial)}
                onCheckedChange={(checked) => updateField('apenasHorarioComercial', checked)}
              />
            </div>
          </>
        )}

        {node.type === 'trigger_lead_created' && (
          <Field>
            <FieldLabel>Filtrar por Origem</FieldLabel>
            <Select
              value={cfg.origem || 'qualquer'}
              onValueChange={(v) => updateField('origem', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualquer">Todas as origens</SelectItem>
                {ORIGENS.map((orig) => (
                  <SelectItem key={orig.key} value={orig.key}>
                    {orig.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}

        {node.type === 'trigger_inactivity' && (
          <>
            <Field>
              <FieldLabel>Horas sem interação no CRM</FieldLabel>
              <input
                type="number"
                min={1}
                max={720}
                value={cfg.horasSemResposta || 24}
                onChange={(e) => updateField('horasSemResposta', Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>
            <Field>
              <FieldLabel>Etapa Monitorada</FieldLabel>
              <Select
                value={cfg.etapaAlvo || 'negociacao'}
                onValueChange={(v) => updateField('etapaAlvo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUNIL_LEAD.map((etapa) => (
                    <SelectItem key={etapa.key} value={etapa.key}>
                      {etapa.emoji} {etapa.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </>
        )}

        {node.type === 'trigger_lead_won' && (
          <>
            <Field>
              <FieldLabel>Valor Mínimo do Negócio (R$)</FieldLabel>
              <input
                type="number"
                min={0}
                value={cfg.valorMinimo ?? 0}
                onChange={(e) => updateField('valorMinimo', Number(e.target.value) || 0)}
                placeholder="Ex: 5000 (0 para qualquer valor)"
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
              <FieldDescription>Dispara quando o lead for marcado como Ganho no CRM.</FieldDescription>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-subtle p-3">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Registrar comissão / Notificar</p>
                <p className="text-[11px] text-ink-secondary">Notifica o responsável pela conta</p>
              </div>
              <Switch
                size="sm"
                variant="violet"
                checked={Boolean(cfg.registrarComissao)}
                onCheckedChange={(checked) => updateField('registrarComissao', checked)}
              />
            </div>
          </>
        )}

        {node.type === 'trigger_lead_lost' && (
          <Field>
            <FieldLabel>Filtrar por Motivo da Perda</FieldLabel>
            <Select
              value={cfg.motivoPerda || 'todos'}
              onValueChange={(v) => updateField('motivoPerda', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os motivos de perda</SelectItem>
                <SelectItem value="orcamento">Preço / Sem orçamento</SelectItem>
                <SelectItem value="sem_interesse">Sem interesse / Desistência</SelectItem>
                <SelectItem value="sem_resposta">Sem resposta / Contato inativo</SelectItem>
                <SelectItem value="concorrente">Fechou com concorrente</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>Dispara quando a oportunidade for arquivada / perdida.</FieldDescription>
          </Field>
        )}

        {node.type === 'trigger_no_contact' && (
          <>
            <Field>
              <FieldLabel>Dias sem contato com o lead</FieldLabel>
              <input
                type="number"
                min={1}
                max={90}
                value={cfg.diasSemContato || 3}
                onChange={(e) => updateField('diasSemContato', Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
              <FieldDescription>Dispara quando o lead não possui atividade há X dias.</FieldDescription>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-subtle p-3">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Apenas horário comercial</p>
                <p className="text-[11px] text-ink-secondary">Seg–Sex, 08:00 às 19:00</p>
              </div>
              <Switch
                size="sm"
                variant="violet"
                checked={Boolean(cfg.apenasHorarioComercial)}
                onCheckedChange={(checked) => updateField('apenasHorarioComercial', checked)}
              />
            </div>
          </>
        )}

        {node.type === 'trigger_meeting_scheduled' && (
          <>
            <Field>
              <FieldLabel>Tipo de Reunião</FieldLabel>
              <Select
                value={cfg.tipoReuniao || 'online'}
                onValueChange={(v) => updateField('tipoReuniao', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Google Meet / Zoom)</SelectItem>
                  <SelectItem value="presencial">Presencial no escritório / cliente</SelectItem>
                  <SelectItem value="call">Alinhamento Telefônico / WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-subtle p-3">
              <div>
                <p className="text-xs font-semibold text-ink-primary">Confirmação Imediata</p>
                <p className="text-[11px] text-ink-secondary">Dispara logo após agendar no CRM</p>
              </div>
              <Switch
                size="sm"
                variant="violet"
                checked={Boolean(cfg.enviarConfirmacaoImediata)}
                onCheckedChange={(checked) => updateField('enviarConfirmacaoImediata', checked)}
              />
            </div>
          </>
        )}

        {node.type === 'trigger_meeting_reminder' && (
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Antecedência</FieldLabel>
              <input
                type="number"
                min={1}
                max={168}
                value={cfg.antecedenciaValor || 1}
                onChange={(e) => updateField('antecedenciaValor', Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>
            <Field>
              <FieldLabel>Unidade</FieldLabel>
              <Select
                value={cfg.antecedenciaUnidade || 'horas'}
                onValueChange={(v) => updateField('antecedenciaUnidade', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutos">Minutos antes</SelectItem>
                  <SelectItem value="horas">Horas antes</SelectItem>
                  <SelectItem value="dias">Dias antes</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {node.type === 'trigger_tag_added' && (
          <Field>
            <FieldLabel>Tag a Monitorar</FieldLabel>
            <Select
              value={cfg.tag || 'vip'}
              onValueChange={(v) => updateField('tag', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vip">⭐ VIP / Alta Prioridade</SelectItem>
                <SelectItem value="decisor">👔 Decisor / C-Level</SelectItem>
                <SelectItem value="urgente">🔥 Urgente / Fechamento</SelectItem>
                <SelectItem value="revisar-proposta">📄 Revisar Proposta</SelectItem>
                <SelectItem value="reativacao">🔄 Reativação de Contato</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>Dispara quando a tag for atribuída ao lead.</FieldDescription>
          </Field>
        )}

        {node.type === 'trigger_schedule_datetime' && (
          <>
            <Field>
              <FieldLabel>Tipo de Programação</FieldLabel>
              <Select
                value={cfg.tipoDisparo || 'pontual'}
                onValueChange={(v) => updateField('tipoDisparo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pontual">Disparo Pontual (Data e Hora Única)</SelectItem>
                  <SelectItem value="recorrente">Recorrente (Dias / Frequência)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {cfg.tipoDisparo === 'recorrente' ? (
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Horário do Disparo</FieldLabel>
                  <input
                    type="time"
                    value={cfg.horario || '09:00'}
                    onChange={(e) => updateField('horario', e.target.value)}
                    className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
                  />
                </Field>
                <Field>
                  <FieldLabel>Frequência</FieldLabel>
                  <Select
                    value={cfg.diasSemana || 'seg-sex'}
                    onValueChange={(v) => updateField('diasSemana', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seg-sex">Dias úteis (Seg–Sex)</SelectItem>
                      <SelectItem value="diario">Todos os dias</SelectItem>
                      <SelectItem value="semanal">Semanal (Segunda-feira)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel>Data</FieldLabel>
                  <input
                    type="date"
                    value={cfg.data || ''}
                    onChange={(e) => updateField('data', e.target.value)}
                    className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary"
                  />
                </Field>
                <Field>
                  <FieldLabel>Horário</FieldLabel>
                  <input
                    type="time"
                    value={cfg.horario || '09:00'}
                    onChange={(e) => updateField('horario', e.target.value)}
                    className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
                  />
                </Field>
              </div>
            )}
          </>
        )}

        {node.type === 'logic_delay' && (
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Duração</FieldLabel>
              <input
                type="number"
                min={1}
                max={365}
                value={cfg.quantidade || 5}
                onChange={(e) => updateField('quantidade', Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>
            <Field>
              <FieldLabel>Unidade</FieldLabel>
              <Select
                value={cfg.unidade || 'minutos'}
                onValueChange={(v) => updateField('unidade', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutos">Minutos</SelectItem>
                  <SelectItem value="horas">Horas</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {node.type === 'logic_condition' && (
          <>
            <Field>
              <FieldLabel>Campo do Lead</FieldLabel>
              <Select
                value={cfg.campo || 'valor_estimado'}
                onValueChange={(v) => updateField('campo', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="valor_estimado">Valor Estimado (R$)</SelectItem>
                  <SelectItem value="telefone">Telefone / WhatsApp</SelectItem>
                  <SelectItem value="origem">Origem do Lead</SelectItem>
                  <SelectItem value="score">Score do Lead</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Operador</FieldLabel>
                <Select
                  value={cfg.operador || '>='}
                  onValueChange={(v) => updateField('operador', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">=">&gt;= (Maior/Igual)</SelectItem>
                    <SelectItem value="==">== (Igual)</SelectItem>
                    <SelectItem value="!=">!= (Diferente)</SelectItem>
                    <SelectItem value="contem">Contém</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Valor</FieldLabel>
                <input
                  type="text"
                  value={cfg.valor || ''}
                  onChange={(e) => updateField('valor', e.target.value)}
                  className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
                />
              </Field>
            </div>
          </>
        )}

        {node.type === 'ai_pranchetinho' && (
          <>
            <Field>
              <FieldLabel>Tom de Voz do Pranchetinho IA</FieldLabel>
              <Select
                value={cfg.tom || 'consultivo'}
                onValueChange={(v) => updateField('tom', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultivo">Consultivo &amp; Estratégico</SelectItem>
                  <SelectItem value="amigavel">Amigável &amp; Próximo</SelectItem>
                  <SelectItem value="executivo">Executivo &amp; Direto</SelectItem>
                  <SelectItem value="urgente">Senso de Urgência</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Prompt de Instrução</FieldLabel>
              <textarea
                rows={4}
                value={cfg.promptInstrucao || ''}
                onChange={(e) => updateField('promptInstrucao', e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-subtle p-3 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary resize-none"
              />
              <FieldDescription>
                Resultado injetado em{' '}
                <code className="font-semibold text-brand-secondary">{'{{ia.mensagem_gerada}}'}</code>
              </FieldDescription>
            </Field>
          </>
        )}

        {node.type === 'action_whatsapp_text' && (
          <>
            <Field>
              <FieldLabel>Canal WhatsApp</FieldLabel>
              <Select
                value={cfg.conexaoId || conexoes[0]?.id || 'evo-comercial'}
                onValueChange={(v) => updateField('conexaoId', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conexoes.map((con) => (
                    <SelectItem key={con.id} value={con.id}>
                      {con.status === 'conectado' ? '🟢 ' : '🔴 '}
                      {con.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Template da Mensagem</FieldLabel>
              <textarea
                ref={textareaRef}
                rows={4}
                value={cfg.mensagem || ''}
                onChange={(e) => updateField('mensagem', e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-surface-subtle p-3 text-xs leading-relaxed font-medium text-ink-primary outline-none focus:border-brand-primary resize-y"
              />
            </Field>

            <div className="flex flex-wrap gap-1.5">
              {VARIAVEIS_DISPONIVEIS.map((v) => (
                <button
                  key={v.token}
                  type="button"
                  onClick={() => inserirVariavelTemplate(v.token)}
                  className="rounded-lg border border-surface-border bg-surface-subtle px-2 py-1 text-[10px] font-mono font-semibold text-brand-secondary dark:text-[#7DD3FC] hover:bg-brand-accent/60 transition-colors cursor-pointer"
                >
                  + {v.token}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon icon={WhatsappIcon} size={13} />
                  Preview WhatsApp
                </span>
                <span>{leadPreview?.nome || 'Mariana Costa'}</span>
              </div>
              <div className="rounded-xl bg-[#DCF8C6] dark:bg-[#005C4B] px-3 py-2 text-xs text-slate-900 dark:text-emerald-50 whitespace-pre-wrap leading-relaxed">
                {interpolarMensagemWhatsApp(cfg.mensagem, leadPreview)}
              </div>
            </div>
          </>
        )}

        {node.type === 'action_crm_task' && (
          <>
            <Field>
              <FieldLabel>Título da Ação no CRM</FieldLabel>
              <input
                type="text"
                value={cfg.tituloTarefa || ''}
                onChange={(e) => updateField('tituloTarefa', e.target.value)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>
            <Field>
              <FieldLabel>Prazo (horas)</FieldLabel>
              <input
                type="number"
                min={1}
                max={720}
                value={cfg.prazoHoras || 4}
                onChange={(e) => updateField('prazoHoras', Number(e.target.value) || 1)}
                className="h-10 w-full rounded-xl border border-surface-border bg-surface-subtle px-3 text-sm font-medium text-ink-primary outline-none focus:border-brand-primary"
              />
            </Field>
          </>
        )}
      </div>

      {/* Rodapé do Inspetor */}
      <div className="px-4 py-3 border-t border-surface-border bg-surface-subtle/50 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onDeleteNode(node.id)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-4 py-1.5 text-xs font-semibold text-white transition-opacity cursor-pointer"
        >
          Concluir
        </button>
      </div>
    </aside>
  );
};

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL DO STUDIO CANVAS TOP-DOWN
// -------------------------------------------------------------
const WorkflowCanvas = ({
  workflows,
  workflowAtual,
  conexoes,
  leadPreview,
  totalLogs,
  ultimoSalvoTexto,
  onUpdateWorkflow,
  onToggleAtivo,
  onExecutarSimulacao,
  onOpenFluxos,
  onOpenConexoes,
  onOpenLogs,
  onOpenSimuladorLead,
  simulacaoEstado,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 96, y: 12 });
  const [conectandoOrigemId, setConectandoOrigemId] = useState(null);
  const [sidebarAdicionarAberto, setSidebarAdicionarAberto] = useState(false);
  const [addCatalogPopoverOpen, setAddCatalogPopoverOpen] = useState(false);

  const dragStateRef = useRef(null);
  const panStateRef = useRef(null);

  useEffect(() => {
    setSelectedNodeId((prev) =>
      prev && workflowAtual?.nodes?.some((n) => n.id === prev) ? prev : null
    );
    setConectandoOrigemId(null);
  }, [workflowAtual?.id, workflowAtual?.nodes]);

  if (!workflowAtual) return null;

  const nodes = workflowAtual.nodes || [];
  const edges = workflowAtual.edges || [];
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const outgoingCountMap = new Map();
  const incomingCountMap = new Map();
  edges.forEach((e) => {
    outgoingCountMap.set(e.source, (outgoingCountMap.get(e.source) || 0) + 1);
    incomingCountMap.set(e.target, (incomingCountMap.get(e.target) || 0) + 1);
  });

  const handleNodePointerDown = (e, node) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragStateRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: node.position.x,
      originY: node.position.y,
    };

    const onMove = (ev) => {
      const ds = dragStateRef.current;
      if (!ds) return;
      const dx = (ev.clientX - ds.startX) / zoom;
      const dy = (ev.clientY - ds.startY) / zoom;
      const nextX = Math.max(20, Math.round(ds.originX + dx));
      const nextY = Math.max(20, Math.round(ds.originY + dy));
      onUpdateWorkflow(workflowAtual.id, (wf) => ({
        ...wf,
        nodes: wf.nodes.map((n) =>
          n.id === ds.nodeId ? { ...n, position: { x: nextX, y: nextY } } : n
        ),
      }));
    };

    const onUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleCanvasPointerDown = (e) => {
    if (e.button !== 0) return;
    panStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originPanX: pan.x,
      originPanY: pan.y,
    };

    const onMove = (ev) => {
      const ps = panStateRef.current;
      if (!ps) return;
      setPan({
        x: Math.round(ps.originPanX + (ev.clientX - ps.startX)),
        y: Math.round(ps.originPanY + (ev.clientY - ps.startY)),
      });
    };

    const onUp = () => {
      panStateRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const inserirNoEntreConexao = (edge, type) => {
    const meta = getCatalogoNo(type);
    const id = `n${Date.now().toString(36).slice(-4)}`;
    const srcNode = nodes.find((n) => n.id === edge.source);
    const tgtNode = nodes.find((n) => n.id === edge.target);
    const pos = srcNode && tgtNode
      ? {
          x: Math.round((srcNode.position.x + tgtNode.position.x) / 2),
          y: Math.round((srcNode.position.y + tgtNode.position.y) / 2),
        }
      : { x: 462, y: 200 };

    const novoNo = {
      id,
      type,
      nodeRole: 'step',
      position: pos,
      config: { ...meta.defaultConfig },
    };

    onUpdateWorkflow(workflowAtual.id, (wf) => {
      const nextNodes = [...wf.nodes, novoNo];
      const nextEdges = [
        ...wf.edges.filter((e) => e.id !== edge.id),
        { id: `e-${edge.source}-${id}`, source: edge.source, target: id },
        { id: `e-${id}-${edge.target}`, source: id, target: edge.target },
      ];
      return {
        ...wf,
        nodes: autoOrganizarNosVertical(nextNodes, nextEdges),
        edges: nextEdges,
      };
    });
    setSelectedNodeId(id);
  };

  const adicionarRamoParalelo = (sourceId, type = 'action_whatsapp_text') => {
    const meta = getCatalogoNo(type);
    const id = `n${Date.now().toString(36).slice(-4)}`;
    const srcNode = nodes.find((n) => n.id === sourceId);
    const pos = srcNode
      ? { x: srcNode.position.x + 310, y: srcNode.position.y + 128 }
      : { x: 640, y: 240 };

    const novoNo = {
      id,
      type,
      nodeRole: 'step',
      position: pos,
      config: {
        ...meta.defaultConfig,
        phaseLabel: 'Novo Ramo Paralelo',
      },
    };

    onUpdateWorkflow(workflowAtual.id, (wf) => {
      const nextNodes = [...wf.nodes, novoNo];
      const nextEdges = [...wf.edges, { id: `e-${sourceId}-${id}`, source: sourceId, target: id }];
      return {
        ...wf,
        nodes: autoOrganizarNosVertical(nextNodes, nextEdges),
        edges: nextEdges,
      };
    });
    setSelectedNodeId(id);
  };

  const adicionarPassoAbaixo = (sourceId, type = 'action_whatsapp_text') => {
    const meta = getCatalogoNo(type);
    const id = `n${Date.now().toString(36).slice(-4)}`;
    const anchor = sourceId
      ? nodes.find((n) => n.id === sourceId)
      : nodes[nodes.length - 1];
    const pos = anchor
      ? { x: anchor.position.x, y: anchor.position.y + 128 }
      : { x: 462, y: 60 };

    const novoNo = {
      id,
      type,
      nodeRole: anchor ? 'step' : 'start',
      position: pos,
      config: { ...meta.defaultConfig },
    };

    onUpdateWorkflow(workflowAtual.id, (wf) => {
      const nextNodes = [...wf.nodes, novoNo];
      const nextEdges = anchor
        ? [...wf.edges, { id: `e-${anchor.id}-${id}`, source: anchor.id, target: id }]
        : wf.edges;
      return {
        ...wf,
        nodes: autoOrganizarNosVertical(nextNodes, nextEdges),
        edges: nextEdges,
      };
    });
    setSelectedNodeId(id);
    setAddCatalogPopoverOpen(false);
  };

  const adicionarItemCatalogo = (type, sourceId = null) => {
    const meta = getCatalogoNo(type);
    const id = `n${Date.now().toString(36).slice(-4)}`;
    const isTrigger = meta.category === 'trigger';

    let anchor = null;
    if (sourceId) {
      anchor = nodes.find((n) => n.id === sourceId) || null;
    } else if (!isTrigger && nodes.length > 0) {
      anchor = nodes[nodes.length - 1];
    }

    let pos;
    if (anchor) {
      pos = { x: anchor.position.x, y: anchor.position.y + 128 };
    } else if (isTrigger) {
      const existingTriggers = nodes.filter((n) => n.type.startsWith('trigger_'));
      pos = { x: 482 + existingTriggers.length * 280, y: 46 };
    } else {
      pos = { x: 482, y: 60 };
    }

    const novoNo = {
      id,
      type,
      nodeRole: isTrigger ? 'start' : 'step',
      position: pos,
      config: { ...meta.defaultConfig },
    };

    onUpdateWorkflow(workflowAtual.id, (wf) => {
      const nextNodes = [...wf.nodes, novoNo];
      const nextEdges = anchor
        ? [...wf.edges, { id: `e-${anchor.id}-${id}`, source: anchor.id, target: id }]
        : wf.edges;
      return {
        ...wf,
        nodes: autoOrganizarNosVertical(nextNodes, nextEdges),
        edges: nextEdges,
      };
    });
    setSelectedNodeId(id);
    setSidebarAdicionarAberto(false);
  };

  const removerNo = (nodeId) => {
    onUpdateWorkflow(workflowAtual.id, (wf) => ({
      ...wf,
      nodes: wf.nodes.filter((n) => n.id !== nodeId),
      edges: wf.edges.filter((ed) => ed.source !== nodeId && ed.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const alternarFinalRole = (nodeId) => {
    onUpdateWorkflow(workflowAtual.id, (wf) => ({
      ...wf,
      nodes: wf.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const atualRole = n.nodeRole || getCatalogoNo(n.type).nodeRole;
        return { ...n, nodeRole: atualRole === 'final' ? 'step' : 'final' };
      }),
    }));
  };

  const conectarNos = (targetId) => {
    if (!conectandoOrigemId || conectandoOrigemId === targetId) {
      setConectandoOrigemId(null);
      return;
    }
    const jaExiste = edges.some(
      (ed) => ed.source === conectandoOrigemId && ed.target === targetId
    );
    if (!jaExiste) {
      const novaEdge = {
        id: `e-${conectandoOrigemId}-${targetId}-${Date.now().toString(36).slice(-3)}`,
        source: conectandoOrigemId,
        target: targetId,
      };
      onUpdateWorkflow(workflowAtual.id, (wf) => ({
        ...wf,
        edges: [...wf.edges, novaEdge],
      }));
    }
    setConectandoOrigemId(null);
  };

  const removerEdge = (edgeId) => {
    onUpdateWorkflow(workflowAtual.id, (wf) => ({
      ...wf,
      edges: wf.edges.filter((ed) => ed.id !== edgeId),
    }));
  };

  const reorganizarArvore = () => {
    onUpdateWorkflow(workflowAtual.id, (wf) => ({
      ...wf,
      nodes: autoOrganizarNosVertical(wf.nodes, wf.edges),
    }));
    setPan({ x: 96, y: 12 });
    setZoom(0.75);
  };

  const atualizarConfigNo = (nodeId, novoConfig) => {
    onUpdateWorkflow(workflowAtual.id, (wf) => ({
      ...wf,
      nodes: wf.nodes.map((n) => (n.id === nodeId ? { ...n, config: novoConfig } : n)),
    }));
  };

  return (
    <TooltipProvider>
      <div className="relative flex flex-col flex-1 w-full h-full min-h-0 bg-surface-card overflow-hidden">
        {/* TOP BAR MINIMALISTA ESTILO STUDIO */}
        <header className="h-14 shrink-0 border-b border-surface-border bg-surface-card/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 z-30">
          {/* Esquerda: Voltar para Lista + Ícone Mesh + Nome + Painel de Blocos */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenFluxos}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                  aria-label="Abrir lista de fluxos"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Meus Fluxos ({workflows.length})</TooltipContent>
            </Tooltip>

            <span
              style={{ background: MESH_GRADIENTS.brand }}
              className="h-7 w-7 shrink-0 rounded-lg shadow-xs ring-1 ring-inset ring-black/5 flex items-center justify-center text-white"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </span>

            <input
              type="text"
              value={workflowAtual.nome}
              onChange={(e) =>
                onUpdateWorkflow(workflowAtual.id, (wf) => ({ ...wf, nome: e.target.value }))
              }
              aria-label="Nome do fluxo"
              className="h-8 min-w-[140px] sm:min-w-[240px] max-w-sm rounded-lg border border-transparent hover:border-surface-border focus:border-brand-primary bg-transparent focus:bg-surface-subtle px-2 text-sm font-bold text-ink-primary outline-none transition-colors truncate"
            />
          </div>

          {/* Direita: Autosave + Logs + JSON + Conexões + Ativar + Testar + Executar */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden lg:inline-block text-xs font-medium text-ink-muted mr-1">
              Salvo automaticamente: {ultimoSalvoTexto}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenLogs}
                  className="relative flex h-8 w-8 items-center justify-center rounded-xl text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
                  aria-label="Histórico de execuções"
                >
                  <Clock className="w-4 h-4" />
                  {totalLogs > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Histórico de Execuções ({totalLogs})</TooltipContent>
            </Tooltip>

            {/* Botão JSON Schema / Variáveis */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Ver esquema JSON e variáveis"
                  className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-primary">Estrutura JSON do Fluxo</span>
                  <Badge variant="primary" size="xs">n8n Graph</Badge>
                </div>
                <pre className="max-h-52 overflow-auto rounded-xl border border-surface-border bg-surface-subtle p-2.5 text-[10px] font-mono text-ink-secondary">
                  {JSON.stringify(
                    {
                      id: workflowAtual.id,
                      ativo: workflowAtual.ativo,
                      nos: nodes.length,
                      conexoes: edges.length,
                      variaveis: VARIAVEIS_DISPONIVEIS.map((v) => v.token),
                    },
                    null,
                    2
                  )}
                </pre>
              </PopoverContent>
            </Popover>

            {/* Botão Conexões WhatsApp / Configurações */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onOpenConexoes}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                  aria-label="Conexões WhatsApp"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Conexões WhatsApp &amp; Webhooks</TooltipContent>
            </Tooltip>

            <div className="h-5 w-px bg-surface-border mx-0.5 hidden sm:block" />

            {/* Switch Ativar/Pausar Fluxo */}
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-xl border border-surface-border bg-surface-card shadow-2xs">
              <Switch
                size="sm"
                variant="success"
                checked={workflowAtual.ativo}
                onCheckedChange={(checked) => onToggleAtivo(workflowAtual.id, checked)}
              />
              <span className="text-xs font-semibold text-ink-primary hidden sm:inline">
                {workflowAtual.ativo ? 'Ativo' : 'Pausado'}
              </span>
              <BadgeDot variant={workflowAtual.ativo ? 'success' : 'default'} pulse={workflowAtual.ativo} />
            </div>

            {/* Botão Testar Fluxo com Lead CRM */}
            <button
              type="button"
              onClick={onOpenSimuladorLead}
              className="inline-flex items-center gap-1.5 h-8 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3 text-xs font-semibold text-ink-primary shadow-2xs transition-colors cursor-pointer"
              title="Testar disparo com lead do CRM"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
              <span className="hidden sm:inline">Testar Lead</span>
              <span className="sm:hidden">Testar</span>
            </button>

            {/* Botão Run / Executar */}
            <button
              type="button"
              disabled={simulacaoEstado.executando}
              onClick={() => onExecutarSimulacao(workflowAtual)}
              className="inline-flex items-center gap-1.5 h-8 rounded-xl border border-transparent bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-3.5 text-xs font-bold text-white shadow-2xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {simulacaoEstado.executando ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              <span>{simulacaoEstado.executando ? 'Executando' : 'Executar'}</span>
            </button>
          </div>
        </header>

        {/* ÁREA PRINCIPAL DO CANVAS */}
        <div
          onPointerDown={handleCanvasPointerDown}
          onClick={() => {
            setSelectedNodeId(null);
            if (conectandoOrigemId) setConectandoOrigemId(null);
          }}
          className="relative flex-1 overflow-hidden bg-[#FAFBFD] dark:bg-[#0B1222] cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(148,163,184,0.34) 1px, transparent 1px)',
            backgroundSize: `${Math.round(20 * zoom)}px ${Math.round(20 * zoom)}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* BOTÃO FLUTUANTE NO CANTO SUPERIOR DIREITO (PRANCHETINHO FAVICON + DRAWER) */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarAdicionarAberto((v) => !v);
                  }}
                  className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border shadow-lg transition-all cursor-pointer ${
                    sidebarAdicionarAberto
                      ? 'border-brand-primary bg-[#0B132B] text-white dark:bg-brand-purple scale-105 shadow-brand-primary/20'
                      : 'border-surface-border bg-surface-card/95 backdrop-blur-md text-ink-primary hover:border-brand-secondary/60 hover:shadow-brand-secondary/20 hover:scale-105'
                  }`}
                  aria-label="Adicionar bloco ou gatilho"
                >
                  {sidebarAdicionarAberto ? (
                    <X className="w-5 h-5 text-white transition-transform duration-200" />
                  ) : (
                    <>
                      <img
                        src={pranchetinhoFavicon}
                        alt="Pranchetinho"
                        className="w-6 h-6 object-contain select-none transition-transform duration-200 group-hover:scale-110 pointer-events-none"
                        draggable={false}
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-white text-[10px] font-bold shadow-2xs">
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {sidebarAdicionarAberto ? 'Fechar catálogo' : 'Adicionar Gatilhos e Ações (+)'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Banner de Conexão Manual */}
          {conectandoOrigemId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-brand-purple/40 bg-[#0B132B] dark:bg-brand-purple text-white px-4 py-1.5 text-xs font-semibold shadow-xl">
              <Link2 className="w-3.5 h-3.5" />
              Clique no card de destino para conectar
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConectandoOrigemId(null);
                }}
                className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] hover:bg-white/30 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Layer Transformado (Pan + Zoom) */}
          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
            className="absolute inset-0"
          >
            {/* Camada SVG Ortogonal */}
            <svg
              className="pointer-events-none overflow-visible"
              width="3200"
              height="2400"
            >
              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.source);
                const tgt = nodes.find((n) => n.id === edge.target);
                if (!src || !tgt) return null;

                const outCount = outgoingCountMap.get(edge.source) || 1;
                const inCount = incomingCountMap.get(edge.target) || 1;
                const geom = buildOrthogonalEdgePath(src, tgt, outCount, inCount);

                const animando =
                  simulacaoEstado.executando &&
                  (simulacaoEstado.nosStatus[edge.source] === 'success' ||
                    simulacaoEstado.nosStatus[edge.source] === 'running');

                return (
                  <g key={edge.id}>
                    <path
                      d={geom.d}
                      fill="none"
                      stroke={animando ? '#7338F2' : 'rgba(148,163,184,0.6)'}
                      strokeWidth={animando ? 2.4 : 1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={`M ${geom.arrowX - 3.5} ${geom.arrowY - 5} L ${geom.arrowX} ${geom.arrowY} L ${geom.arrowX + 3.5} ${geom.arrowY - 5}`}
                      fill="none"
                      stroke={animando ? '#7338F2' : 'rgba(148,163,184,0.75)'}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {animando && (
                      <circle r="4" fill="#10B981">
                        <animateMotion dur="0.75s" repeatCount="indefinite" path={geom.d} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Botões '+' Circulares nas Conexões */}
            {edges.map((edge) => {
              const src = nodes.find((n) => n.id === edge.source);
              const tgt = nodes.find((n) => n.id === edge.target);
              if (!src || !tgt) return null;

              const outCount = outgoingCountMap.get(edge.source) || 1;
              const inCount = incomingCountMap.get(edge.target) || 1;
              const geom = buildOrthogonalEdgePath(src, tgt, outCount, inCount);
              const isFinalEdge =
                (tgt.nodeRole || getCatalogoNo(tgt.type).nodeRole) === 'final';

              return (
                <EdgeAddButton
                  key={`btn-${edge.id}`}
                  edge={edge}
                  isFinalEdge={isFinalEdge}
                  x={geom.btnX}
                  y={geom.btnY}
                  onInsertBetween={inserirNoEntreConexao}
                  onAddBranchFromEdge={adicionarRamoParalelo}
                  onRemoveEdge={removerEdge}
                />
              );
            })}

            {/* Nós do Canvas */}
            {nodes.map((node) => (
              <StudioNodeCard
                key={node.id}
                node={node}
                selecionado={selectedNodeId === node.id}
                statusSimulacao={simulacaoEstado.nosStatus[node.id]}
                conectandoOrigemId={conectandoOrigemId}
                onSelect={setSelectedNodeId}
                onPointerDownDrag={handleNodePointerDown}
                onInsertBelow={adicionarPassoAbaixo}
                onAddBranch={adicionarRamoParalelo}
                onStartConnect={(srcId) =>
                  setConectandoOrigemId((prev) => (prev === srcId ? null : srcId))
                }
                onFinishConnect={conectarNos}
                onToggleFinalRole={alternarFinalRole}
                onDeleteNode={removerNo}
              />
            ))}
          </div>

          {/* PÍLULAS INFERIORES DIREITAS (HUD DE ZOOM, AÇÕES & MÉTRICAS) */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2.5"
          >
            {/* Pílula 1: Zoom & Ferramentas Rápidas */}
            <div className="flex items-center gap-0.5 rounded-2xl border border-surface-border bg-surface-card/95 backdrop-blur-md px-2 py-1.5 shadow-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(1.35, Number((z + 0.08).toFixed(2))))}
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Aumentar zoom</TooltipContent>
              </Tooltip>

              <span className="px-1.5 text-xs font-mono font-bold text-ink-primary min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.08).toFixed(2))))}
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Reduzir zoom</TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-surface-border mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={reorganizarArvore}
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Auto-organizar árvore vertical</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenFluxos}
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-ink-primary transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Meus Fluxos &amp; Templates</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenSimuladorLead}
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-brand-purple transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Simular mudança de etapa CRM</TooltipContent>
              </Tooltip>

              <Popover open={addCatalogPopoverOpen} onOpenChange={setAddCatalogPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    title="Adicionar novo bloco ao fluxo"
                    className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover hover:text-brand-secondary transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" side="top" sideOffset={10} className="w-64 p-2">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
                    Adicionar Bloco
                  </p>
                  <div className="mt-1 space-y-1 max-h-64 overflow-y-auto">
                    {CATALOGO_NOS.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => adicionarItemCatalogo(item.type, selectedNodeId)}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <span
                          style={{ background: item.meshGradient }}
                          className="h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-white"
                        >
                          {renderNodeIcon(item.type, 'w-3 h-3 text-white')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink-primary truncate">{item.title}</p>
                          <p className="text-[10px] text-ink-muted truncate">{item.shortDesc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Pílula 2: Tempo Médio */}
            <div className="hidden md:flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-card/95 backdrop-blur-md px-3.5 py-2 text-xs shadow-md">
              <span className="text-ink-secondary font-medium">Tempo médio:</span>
              <span className="font-bold text-ink-primary">{workflowAtual.tempoMedio || '1,2s'}</span>
            </div>

            {/* Pílula 3: Taxa de Entrega */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-surface-border bg-surface-card/95 backdrop-blur-md px-3.5 py-2 text-xs shadow-md">
              <span className="text-ink-secondary font-medium">Entrega WhatsApp:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {workflowAtual.taxaEntrega ?? 98.4}%
              </span>
            </div>
          </div>

          {/* MENU LATERAL DIREITO: ADICIONAR BLOCOS & GATILHOS (ReUI) */}
          <StudioAddNodeDrawer
            isOpen={sidebarAdicionarAberto}
            onClose={() => setSidebarAdicionarAberto(false)}
            selectedNode={selectedNode}
            onAddNodeType={(type) => adicionarItemCatalogo(type, selectedNodeId)}
            onClearSelectedNode={() => setSelectedNodeId(null)}
          />

          {/* INSPETOR FLUTUANTE DIREITO (visível quando o menu de adicionar não estiver ativo) */}
          {selectedNode && !sidebarAdicionarAberto && (
            <StudioNodeInspector
              node={selectedNode}
              conexoes={conexoes}
              leadPreview={leadPreview}
              onChangeConfig={atualizarConfigNo}
              onClose={() => setSelectedNodeId(null)}
              onDeleteNode={removerNo}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WorkflowCanvas;
