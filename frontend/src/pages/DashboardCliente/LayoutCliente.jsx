// =============================================================
// PRANCHETO.IA - LAYOUT DO CLIENTE (DESIGN SYSTEM EMITLY)
// Shell principal do aplicativo com Sidebar orgânica, Header responsivo,
// modal de personalização DnD e Bolha Chat IA.
// =============================================================
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '../../store/authStore.js';
import { useTenantStore } from '../../store/tenantStore.js';
import { useAuth, carregarPermissoesCargo } from '../../hooks/useAuth.js';
import { useTema } from '../../hooks/useTema.js';
import { useSidebarPrefs, SLUGS_FIXOS } from '../../hooks/useSidebarPrefs.js';
import BolhaChatIA from '../../components/ChatIA/BolhaChatIA.jsx';
import { NotificationCenter, NOTIFICACOES_INICIAIS } from '@/components/ui/notification-center';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import logoCompletoPrancheto from '@/assets/logo/prancheto-logo.svg';
import iconePrancheto from '@/assets/logo/prancheto-icone.svg';
import { IconeCerebro } from '@/components/ui/IconeCerebro.jsx';


const BADGE_CARGO = {
  admin: { label: 'Admin', bg: 'bg-[#DCF5E4]', text: 'text-[#15803D]' },
  manager: { label: 'Gerente', bg: 'bg-blue-100', text: 'text-blue-800' },
  member: { label: 'Membro', bg: 'bg-[#EBF0ED]', text: 'text-[#0E382C]' },
  viewer: { label: 'Visualizador', bg: 'bg-slate-100', text: 'text-slate-600' },
};

// ----------------------------------------------------------
// COMPONENTE: Logo da Marca
// ----------------------------------------------------------
const MarcaLogo = ({ colapsada = false }) => {
  const logoTenantUrl = useTenantStore((s) => s.tenant?.logo_url);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => { setFalhou(false); }, [logoTenantUrl]);

  // Se o tenant configurou um logo próprio na organização (white-label)
  if (logoTenantUrl && !falhou) {
    return (
      <img
        src={logoTenantUrl}
        alt="Logo"
        className="h-8 max-w-full object-contain flex-shrink-0"
        onError={() => setFalhou(true)}
      />
    );
  }

  // Logo Oficial do Prancheto.IA (mantém ambos no DOM para transição instantânea sem remount)
  return (
    <div className="flex items-center">
      <img
        src={iconePrancheto}
        alt="Prancheto.IA"
        className={`w-8 h-8 object-contain flex-shrink-0 select-none ${colapsada ? 'block' : 'hidden'}`}
      />
      <img
        src={logoCompletoPrancheto}
        alt="Prancheto.IA"
        className={`h-7 w-auto max-w-[175px] object-contain select-none ${colapsada ? 'hidden' : 'block'}`}
      />
    </div>
  );
};

import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  UserGroupIcon,
  Folder01Icon,
  Task01Icon,
  Calendar03Icon,
  Comment01Icon,
  CustomerSupportIcon,
  Building01Icon,
  Settings02Icon,
  Analytics01Icon,
  DragDropVerticalIcon,
  PencilEdit01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Menu01Icon,
  Search01Icon,
  Notification01Icon,
  UserIcon,
  HelpCircleIcon,
  Logout01Icon,
  LockKeyIcon,
  Cancel01Icon,
  PinIcon,
  Brain02Icon,
  Sun01Icon,
  Moon02Icon,
} from '@hugeicons/core-free-icons';

// Mapeamento de Hugeicons para a Sidebar
const ICONES_MAP = {
  dashboard: DashboardSquare01Icon,
  crm: UserGroupIcon,
  projetos: Folder01Icon,
  tarefas: Task01Icon,
  calendario: Calendar03Icon,
  chat: Comment01Icon,
  chat_ia: Brain02Icon,
  suporte: CustomerSupportIcon,
  organizacao: Building01Icon,
  configuracoes: Settings02Icon,
  relatorios: Analytics01Icon,
  times_pessoas: Building01Icon,
};

const getIconeItem = (slug) => {
  if (slug === 'chat_ia') {
    return <IconeCerebro size={19} className="flex-shrink-0" />;
  }
  const IconComp = ICONES_MAP[slug] || ICONES_MAP.dashboard;
  return <HugeiconsIcon icon={IconComp} size={18} strokeWidth={1.8} />;
};

// ----------------------------------------------------------
// COMPONENTE: ItemNav Emitly
// ----------------------------------------------------------
const ItemNav = ({ item, colapsada, onClick, onDesafixarChatIa }) => {
  const location = useLocation();
  const rotaExata = location.pathname === item.rota;
  const ativoViaPrefixo = item.prefixoAtivo
    ? location.pathname.startsWith(item.prefixoAtivo)
    : false;
  const ativo = item.exact ? rotaExata : rotaExata || ativoViaPrefixo;
  const ehChatIa = item.slug === 'chat_ia' && typeof onDesafixarChatIa === 'function';
  const labelExibicao = item.slug === 'chat_ia' ? 'Pranchetinho' : item.label;

  return (
    <div className={`relative group transition-[width] duration-150 ease-out ${colapsada ? 'w-10' : 'w-full'}`}>
      <Tooltip disabled={!colapsada}>
        <TooltipTrigger
          render={
            <NavLink
              to={item.rota}
              end={item.exact}
              onClick={onClick}
              className={`h-10 w-full flex items-center rounded-xl font-medium text-sm transition-[background-color,color,box-shadow] duration-150 relative overflow-hidden ${
                ativo
                  ? 'bg-brand-accent text-brand-primary dark:bg-[#8B5CF6] dark:text-white font-semibold shadow-xs dark:shadow-[0_0_18px_rgba(139,92,246,0.65)] dark:border dark:border-white/30'
                  : 'text-white/85 dark:text-white/85 hover:bg-white/15 group-hover:bg-white/15 dark:hover:bg-[#7C3AED]/85 dark:group-hover:bg-[#7C3AED]/85 hover:text-white dark:hover:text-white group-hover:text-white dark:group-hover:text-white dark:hover:shadow-[0_0_14px_rgba(124,58,237,0.5)]'
              }`}
            >
              {/* Slot fixo para o ícone: exatamente 40px de largura e altura, sem encolher */}
              <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                {getIconeItem(item.slug)}
              </span>

              {/* Rótulo de texto: visível no estado expandido, clipe limpo no recolhido */}
              <span
                className={`truncate whitespace-nowrap ${ehChatIa ? 'pr-9' : 'pr-2.5'} transition-opacity duration-100 ${
                  colapsada ? 'opacity-0 pointer-events-none' : 'opacity-100 flex-1'
                }`}
              >
                {labelExibicao}
              </span>
            </NavLink>
          }
        />
        <TooltipContent side="inline-end" sideOffset={10}>
          <p className="text-xs font-semibold">{labelExibicao}</p>
        </TooltipContent>
      </Tooltip>

      {/* Botão X exclusivo do item "Pranchetinho" — aparece ao passar o mouse em qualquer parte do botão */}
      {ehChatIa && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDesafixarChatIa();
          }}
          title="Ocultar Pranchetinho da sidebar e voltar botão flutuante"
          aria-label="Ocultar Pranchetinho da sidebar e voltar botão flutuante"
          className={
            colapsada
              ? 'absolute -top-1 -right-1 z-10 w-4 h-4 rounded-full bg-surface-card text-ink-primary border border-surface-border shadow-md flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-all hover:bg-red-500 hover:border-red-500 hover:text-white cursor-pointer'
              : `absolute right-2 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto transition-all cursor-pointer ${
                  ativo
                    ? 'bg-brand-primary/10 text-brand-primary hover:bg-red-500 hover:text-white'
                    : 'bg-white/15 text-white hover:bg-red-500 hover:text-white'
                }`
          }
        >
          <HugeiconsIcon icon={Cancel01Icon} size={colapsada ? 10 : 14} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: ItemSortableModal (Personalizar Sidebar)
// ----------------------------------------------------------
const ItemSortableModal = ({ item, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slug });

  const fixo = SLUGS_FIXOS.includes(item.slug) || !item.removivel;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${item.visivel
        ? 'bg-white border-[#E4ECE7] text-[#111915]'
        : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 opacity-60'
        }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-1"
        title="Arrastar para reordenar"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} strokeWidth={1.8} />
      </button>

      <span className="flex-shrink-0 text-slate-600">{getIconeItem(item.slug)}</span>
      <span className="flex-1 text-sm font-medium truncate">{item.label}</span>

      {fixo ? (
        <span className="text-slate-400 flex-shrink-0 flex items-center justify-center p-1" title="Item fixo">
          <HugeiconsIcon icon={LockKeyIcon} size={14} strokeWidth={1.8} />
        </span>
      ) : (
        <button
          onClick={() => onToggle(item.slug)}
          className={`text-sm px-2.5 py-1 rounded-lg font-semibold transition-colors ${item.visivel
            ? 'text-red-600 hover:bg-red-50'
            : 'text-[#15803D] hover:bg-[#DCF5E4]'
            }`}
        >
          {item.visivel ? 'Ocultar' : '+ Mostrar'}
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Modal Personalizar Sidebar
// ----------------------------------------------------------
const ModalPersonalizarSidebar = ({ aberto, onFechar, prefs }) => {
  const {
    itensParaModal, reordenar, toggleVisivel, resetar, salvando,
    chatIaModo, definirChatIaModo,
  } = prefs;
  const [ordemLocal, setOrdemLocal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!aberto) return null;

  const itensExibidos = ordemLocal ?? itensParaModal;
  const slugsVisiveis = itensExibidos.filter(i => i.visivel).map(i => i.slug);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) {
      setOrdemLocal(null);
      return;
    }
    const slugsAtuais = itensExibidos.map(i => i.slug);
    const oldIdx = slugsAtuais.indexOf(active.id);
    const newIdx = slugsAtuais.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) { setOrdemLocal(null); return; }

    const novosSlugs = arrayMove(slugsAtuais, oldIdx, newIdx);
    const novosItens = novosSlugs.map(s => itensExibidos.find(i => i.slug === s)).filter(Boolean);
    setOrdemLocal(novosItens);
    await reordenar(novosSlugs);
    setOrdemLocal(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50" onClick={onFechar} />
      <div className="fixed inset-y-0 right-0 w-80 bg-surface-card z-50 flex flex-col shadow-2xl border-l border-surface-border">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 className="text-base font-bold text-ink-primary">Personalizar Navegação</h2>
            <p className="text-sm text-ink-secondary">Arraste para organizar o seu menu</p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors"
            title="Fechar"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Chat IA Config */}
        <div className="p-4 border-b border-surface-border">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-secondary mb-2">
            Assistente Chat IA
          </p>
          <div className="flex rounded-xl bg-surface-subtle p-1 border border-surface-border">
            <button
              onClick={() => definirChatIaModo('flutuante')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-semibold transition-all ${chatIaModo === 'flutuante' ? 'bg-brand-primary text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
                }`}
            >
              <HugeiconsIcon icon={Comment01Icon} size={14} strokeWidth={1.8} />
              <span>Flutuante</span>
            </button>
            <button
              onClick={() => definirChatIaModo('fixo')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm py-1.5 rounded-lg font-semibold transition-all ${chatIaModo === 'fixo' ? 'bg-brand-primary text-white shadow-xs' : 'text-ink-secondary hover:text-ink-primary'
                }`}
            >
              <HugeiconsIcon icon={PinIcon} size={14} strokeWidth={1.8} />
              <span>Na Sidebar</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-secondary mb-1">
            Itens Visíveis ({slugsVisiveis.length})
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itensExibidos.map(i => i.slug)} strategy={verticalListSortingStrategy}>
              {itensExibidos.map(item => (
                <ItemSortableModal key={item.slug} item={item} onToggle={toggleVisivel} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-surface-border space-y-2 bg-surface-subtle">
          {salvando && (
            <p className="text-sm text-center text-emerald-500 font-medium animate-pulse">Salvando alterações...</p>
          )}
          <button onClick={resetar} className="w-full text-sm py-2 text-ink-secondary hover:text-ink-primary font-semibold text-center">
            Restaurar Padrão
          </button>
          <button onClick={onFechar} className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-sm rounded-xl transition-all shadow-xs">
            Concluído
          </button>
        </div>
      </div>
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Sidebar Principal Emitly
// ----------------------------------------------------------
const Sidebar = ({ aberta, onFechar, prefs }) => {
  const [modalAberto, setModalAberto] = useState(false);
  const { itensVisiveis, colapsada } = prefs;

  return (
    <>
      {aberta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden" onClick={onFechar} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen flex flex-col z-40 overflow-hidden shell-sidebar lg:bg-transparent
          transition-[width] duration-150 ease-out flex-shrink-0
          lg:static lg:z-auto lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          w-64 ${colapsada ? 'lg:w-16' : 'lg:w-64'}
        `}
      >
        <div className="w-64 h-full flex flex-col flex-shrink-0">
          <TooltipProvider delay={100}>
            {/* Logo Header */}
            <div className="h-16 flex items-center px-3 flex-shrink-0 overflow-hidden">
              <Tooltip disabled={!colapsada}>
                <TooltipTrigger
                  render={
                    <NavLink
                      to="/dashboard"
                      className="flex items-center gap-2 min-w-0 transition-opacity hover:opacity-90 cursor-pointer"
                    >
                      <MarcaLogo colapsada={colapsada} />
                    </NavLink>
                  }
                />
                <TooltipContent side="inline-end" sideOffset={10}>
                  <p className="text-xs font-semibold">Ir para o início</p>
                </TooltipContent>
              </Tooltip>
              <button onClick={onFechar} className="ml-auto text-white/70 hover:text-white lg:hidden p-1 rounded-lg cursor-pointer" title="Fechar menu">
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
              {itensVisiveis.map((item) => (
                <ItemNav
                  key={item.slug}
                  item={item}
                  colapsada={colapsada}
                  onClick={onFechar}
                  onDesafixarChatIa={
                    item.slug === 'chat_ia'
                      ? () => prefs.definirChatIaModo('flutuante')
                      : undefined
                  }
                />
              ))}
            </nav>

            {/* Base da Sidebar: Apenas o botão de editar sidebar */}
            <div className="p-3 flex-shrink-0 overflow-hidden">
              <Tooltip disabled={!colapsada}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setModalAberto(true)}
                      className={`h-10 flex items-center rounded-xl font-medium text-sm transition-[width,background-color,color,box-shadow] duration-150 ease-out text-white/85 hover:bg-white/15 dark:hover:bg-[#7C3AED]/85 hover:text-white dark:hover:text-white dark:hover:shadow-[0_0_14px_rgba(124,58,237,0.5)] group relative overflow-hidden cursor-pointer ${colapsada ? 'w-10' : 'w-full'
                        }`}
                    >
                      <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <HugeiconsIcon icon={PencilEdit01Icon} size={18} strokeWidth={1.8} />
                      </span>
                      <span
                        className={`truncate whitespace-nowrap pr-2.5 transition-opacity duration-100 ${colapsada ? 'opacity-0 pointer-events-none' : 'opacity-100 flex-1'
                          }`}
                      >
                        Editar Menu
                      </span>
                    </button>
                  }
                />
                <TooltipContent side="inline-end" sideOffset={10}>
                  <p className="text-xs font-semibold">Editar Menu</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </aside>

      <ModalPersonalizarSidebar
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        prefs={prefs}
      />
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: LayoutCliente
// ----------------------------------------------------------
const LayoutCliente = ({ children }) => {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [notificacoes, setNotificacoes] = useState(NOTIFICACOES_INICIAIS);
  const menuUsuarioRef = useRef(null);
  const notificacoesRef = useRef(null);
  const naoLidasCount = notificacoes.filter((n) => n.unread).length;

  const location = useLocation();
  const prefs = useSidebarPrefs();
  const { temaEscuro, alternarTema } = useTema();

  const usuario = useAuthStore((s) => s.usuario);
  const { logout } = useAuth();
  const badgeCargo = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  const tenantId = usuario?.tenant_id;
  const carregarTenant = useTenantStore((s) => s.carregar);
  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  const cargoId = usuario?.cargo_id;
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  useEffect(() => {
    if (!cargoId) return;
    carregarPermissoesCargo(cargoId).then((lista) => {
      if (Array.isArray(lista)) atualizarUsuario({ permissoesCargo: lista });
    });
  }, [cargoId, atualizarUsuario]);

  // Fechar dropdown de perfil ou notificações ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
        setMenuUsuarioAberto(false);
      }
      if (notificacoesRef.current && !notificacoesRef.current.contains(e.target)) {
        setNotificacoesAbertas(false);
      }
    };
    if (menuUsuarioAberto || notificacoesAbertas) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuUsuarioAberto, notificacoesAbertas]);

  return (
    <div className="h-screen shell-app-bg flex items-stretch overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
        prefs={prefs}
      />

      {/* Toggle Sidebar Desktop Button */}
      <TooltipProvider delay={100}>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => prefs.alternarColapsada(!prefs.colapsada)}
                className="hidden lg:flex fixed bottom-12 z-50 items-center justify-center w-7 h-7 rounded-full bg-brand-accent text-brand-primary shadow-sm hover:bg-brand-accent-hover dark:bg-[#7C3AED] dark:text-white dark:border dark:border-white/35 dark:shadow-[0_2px_12px_rgba(124,58,237,0.65)] dark:hover:bg-[#8B5CF6] dark:hover:scale-105 focus:outline-none transition-[left,background-color,color,transform] duration-150 ease-out cursor-pointer"
                style={{
                  left: prefs.colapsada ? 'calc(4rem - 0.875rem)' : 'calc(16rem - 0.875rem)',
                }}
                aria-label={prefs.colapsada ? 'Expandir menu' : 'Recolher menu'}
              >
                <HugeiconsIcon
                  icon={prefs.colapsada ? ArrowRight01Icon : ArrowLeft01Icon}
                  size={14}
                  strokeWidth={2.2}
                  className="transition-transform duration-150"
                />
              </button>
            }
          />
          <TooltipContent side="inline-end" sideOffset={10}>
            <p className="text-xs font-semibold">{prefs.colapsada ? 'Expandir menu' : 'Recolher menu'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-transparent">
        {/* Top Header */}
        <header className="h-16 bg-transparent px-6 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => setSidebarAberta(true)}
                    className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg cursor-pointer"
                    aria-label="Abrir menu"
                  >
                    <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
                  </button>
                }
              />
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-semibold">Abrir menu</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Search Pill */}
          <div className="flex-1 max-w-xl hidden sm:block relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={1.8}
              className="text-slate-400 dark:text-white/65 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Pesquisar projetos, clientes ou tarefas..."
              className="w-full h-10 pl-11 pr-4 bg-white dark:bg-white/[0.09] dark:text-white dark:placeholder-white/55 dark:border dark:border-white/20 rounded-full text-sm text-ink-primary placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-accent dark:focus:ring-[#8B5CF6] dark:focus:bg-white/[0.14] shadow-xs transition-all"
            />
          </div>

          {/* Actions: Tema, Notificação, Configuração, Foto de Perfil */}
          <TooltipProvider delay={100}>
            <div className="flex items-center gap-2.5">
              {/* Botão de Alternar Tema (Claro / Escuro) */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => alternarTema(usuario?.id)}
                      aria-label={temaEscuro ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                      className="w-9 h-9 rounded-xl bg-brand-accent text-brand-primary hover:bg-brand-accent-hover dark:bg-white/15 dark:text-white dark:hover:bg-[#8B5CF6] dark:border dark:border-white/25 dark:hover:border-white/40 dark:hover:shadow-[0_0_14px_rgba(139,92,246,0.6)] flex items-center justify-center transition-all shadow-xs cursor-pointer"
                    >
                      <HugeiconsIcon
                        icon={temaEscuro ? Sun01Icon : Moon02Icon}
                        size={18}
                        strokeWidth={1.8}
                      />
                    </button>
                  }
                />
                <TooltipContent side="bottom" sideOffset={8}>
                  <p className="text-xs font-semibold">
                    {temaEscuro ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* 1. Botão de Notificação + Central de Notificações */}
              <div className="relative" ref={notificacoesRef}>
                <Tooltip disabled={notificacoesAbertas}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => {
                          setNotificacoesAbertas((v) => !v);
                          setMenuUsuarioAberto(false);
                        }}
                        aria-label="Notificações"
                        className="w-9 h-9 rounded-xl bg-brand-accent text-brand-primary hover:bg-brand-accent-hover dark:bg-white/15 dark:text-white dark:hover:bg-[#8B5CF6] dark:border dark:border-white/25 dark:hover:border-white/40 dark:hover:shadow-[0_0_14px_rgba(139,92,246,0.6)] flex items-center justify-center transition-all relative shadow-xs cursor-pointer"
                      >
                        <HugeiconsIcon icon={Notification01Icon} size={18} strokeWidth={1.8} />
                        {naoLidasCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-brand-purple dark:bg-[#38BDF8] absolute top-2 right-2"></span>
                        )}
                      </button>
                    }
                  />
                  <TooltipContent side="bottom" sideOffset={8}>
                    <p className="text-xs font-semibold">Notificações</p>
                  </TooltipContent>
                </Tooltip>

                {notificacoesAbertas && (
                  <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] z-50 animate-fade-in">
                    <NotificationCenter
                      items={notificacoes}
                      onItemsChange={setNotificacoes}
                      title="Notificações"
                    />
                  </div>
                )}
              </div>

              {/* 2. Botão de Configuração */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <NavLink
                      to="/dashboard/configuracoes"
                      aria-label="Configurações"
                      className={({ isActive }) => {
                        const ativa = isActive || location.pathname.startsWith('/dashboard/configuracoes');
                        return `w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-xs ${ativa
                          ? 'bg-brand-accent-hover text-brand-primary dark:bg-[#8B5CF6] dark:text-white dark:border dark:border-white/40 dark:shadow-[0_0_16px_rgba(139,92,246,0.65)]'
                          : 'bg-brand-accent text-brand-primary hover:bg-brand-accent-hover dark:bg-white/15 dark:text-white dark:hover:bg-[#8B5CF6] dark:border dark:border-white/25 dark:hover:border-white/40 dark:hover:shadow-[0_0_14px_rgba(139,92,246,0.6)]'
                          }`;
                      }}
                    >
                      <HugeiconsIcon icon={Settings02Icon} size={18} strokeWidth={1.8} />
                    </NavLink>
                  }
                />
                <TooltipContent side="bottom" sideOffset={8}>
                  <p className="text-xs font-semibold">Configurações</p>
                </TooltipContent>
              </Tooltip>

              {/* 3. Foto de Perfil */}
              <div className="relative" ref={menuUsuarioRef}>
                <Tooltip disabled={menuUsuarioAberto}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setMenuUsuarioAberto((v) => !v)}
                        className="w-9 h-9 rounded-full bg-brand-accent text-brand-primary font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs hover:bg-brand-accent-hover transition-all cursor-pointer overflow-hidden border border-brand-accent dark:bg-[#240B45] dark:text-white dark:border-white/25 dark:hover:bg-[#8B5CF6] dark:hover:border-white/40 dark:hover:shadow-[0_0_14px_rgba(139,92,246,0.6)]"
                        aria-label={`Perfil: ${usuario?.nome || 'Usuário'}`}
                      >
                        {usuario?.avatar_url || usuario?.foto_url ? (
                          <img
                            src={usuario.avatar_url || usuario.foto_url}
                            alt={primeiroNome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{primeiroNome[0]?.toUpperCase()}</span>
                        )}
                      </button>
                    }
                  />
                  <TooltipContent side="bottom" sideOffset={8}>
                    <p className="text-xs font-semibold">{`Perfil: ${usuario?.nome || 'Usuário'}`}</p>
                  </TooltipContent>
                </Tooltip>

              {menuUsuarioAberto && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-card rounded-2xl shadow-xl border border-surface-border py-2 z-50 animate-fade-in text-sm">
                  {/* Dados do usuário */}
                  <div className="px-4 py-2.5 border-b border-surface-border">
                    <p className="font-bold text-ink-primary truncate">{usuario?.nome || 'Usuário'}</p>
                    <p className="text-[11px] text-ink-secondary truncate">{usuario?.email}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1.5 ${badgeCargo.bg} ${badgeCargo.text}`}>
                      {badgeCargo.label}
                    </span>
                  </div>

                  {/* Links rápidos */}
                  <div className="py-1">
                    <NavLink
                      to="/dashboard/configuracoes"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-ink-primary hover:bg-surface-subtle font-medium"
                    >
                      <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={1.8} className="text-ink-secondary" />
                      <span>Meu Perfil</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/configuracoes"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-ink-primary hover:bg-surface-subtle font-medium"
                    >
                      <HugeiconsIcon icon={Settings02Icon} size={16} strokeWidth={1.8} className="text-ink-secondary" />
                      <span>Configurações</span>
                    </NavLink>
                    <NavLink
                      to="/suporte"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-ink-primary hover:bg-surface-subtle font-medium"
                    >
                      <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} className="text-ink-secondary" />
                      <span>Suporte</span>
                    </NavLink>
                  </div>

                  {/* Sair */}
                  <div className="pt-1 border-t border-surface-border">
                    <button
                      onClick={() => {
                        setMenuUsuarioAberto(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 font-semibold text-left"
                    >
                      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} className="text-red-600" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </header>

        {/* Page Content Stream (Nível 1) */}
        <main className="flex-1 overflow-auto bg-surface rounded-tl-3xl dark:border-t dark:border-l dark:border-white/[0.07] px-4 sm:px-6 py-5 sm:py-6 flex flex-col min-h-0 shadow-sm">
          {children}
        </main>
      </div>

      {/* Floating Chat IA */}
      {prefs.chatIaModo === 'flutuante' && !prefs.carregando && (
        <BolhaChatIA onFixarNaSidebar={() => prefs.definirChatIaModo('fixo')} />
      )}
    </div>
  );
};

export default LayoutCliente;
