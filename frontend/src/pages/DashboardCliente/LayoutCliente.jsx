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
import { useSidebarPrefs, SLUGS_FIXOS } from '../../hooks/useSidebarPrefs.js';
import { NOME_PRODUTO } from '../../lib/ambiente.js';
import BolhaChatIA from '../../components/ChatIA/BolhaChatIA.jsx';


const BADGE_CARGO = {
  admin:   { label: 'Admin',        bg: 'bg-[#DCF5E4]', text: 'text-[#15803D]' },
  manager: { label: 'Gerente',      bg: 'bg-blue-100',   text: 'text-blue-800' },
  member:  { label: 'Membro',       bg: 'bg-[#EBF0ED]', text: 'text-[#0E382C]' },
  viewer:  { label: 'Visualizador', bg: 'bg-slate-100',  text: 'text-slate-600' },
};

// ----------------------------------------------------------
// COMPONENTE: Logo da Marca
// ----------------------------------------------------------
const MarcaLogo = () => {
  const logoUrl = useTenantStore((s) => s.tenant?.logo_url);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => { setFalhou(false); }, [logoUrl]);

  if (logoUrl && !falhou) {
    return (
      <img
        src={logoUrl}
        alt="Logo"
        className="h-8 w-8 rounded-lg object-contain flex-shrink-0"
        onError={() => setFalhou(true)}
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-xl bg-[#0E382C] flex items-center justify-center text-[#D4EC9D] shadow-sm flex-shrink-0">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
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
  SentIcon,
  Analytics01Icon,
  UserMultiple02Icon,
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
  BotIcon,
} from '@hugeicons/core-free-icons';

// Mapeamento de Hugeicons para a Sidebar
const ICONES_MAP = {
  dashboard: DashboardSquare01Icon,
  crm: UserGroupIcon,
  projetos: Folder01Icon,
  tarefas: Task01Icon,
  calendario: Calendar03Icon,
  chat: Comment01Icon,
  chat_ia: BotIcon,
  suporte: CustomerSupportIcon,
  organizacao: Building01Icon,
  configuracoes: Settings02Icon,
  outbound: SentIcon,
  relatorios: Analytics01Icon,
  times_pessoas: UserMultiple02Icon,
};

const getIconeItem = (slug) => {
  const IconComp = ICONES_MAP[slug] || ICONES_MAP.dashboard;
  return <HugeiconsIcon icon={IconComp} size={18} strokeWidth={1.8} />;
};

// ----------------------------------------------------------
// COMPONENTE: ItemNav Emitly
// ----------------------------------------------------------
const ItemNav = ({ item, colapsada, onClick }) => {
  const location = useLocation();
  const ativoViaPrefixo = item.prefixoAtivo
    ? location.pathname.startsWith(item.prefixoAtivo)
    : false;

  return (
    <NavLink
      to={item.rota}
      end={item.exact}
      onClick={onClick}
      title={item.label}
      className={({ isActive }) => {
        const ativo = isActive || ativoViaPrefixo;
        return `h-10 flex items-center rounded-xl font-medium text-sm transition-[width,background-color,color] duration-300 group relative overflow-hidden ${
          colapsada ? 'w-10' : 'w-full'
        } ${
          ativo
            ? 'bg-[#D4EC9D] text-[#132E22] font-semibold shadow-xs'
            : 'text-[#687770] hover:bg-[#EDF2EE] hover:text-[#111915]'
        }`;
      }}
    >
      {/* Slot fixo para o ícone: exatamente 40px de largura e altura, sem encolher */}
      <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        {getIconeItem(item.slug)}
      </span>

      {/* Rótulo de texto: visível no estado expandido, clipe limpo no recolhido */}
      <span
        className={`truncate whitespace-nowrap pr-2.5 transition-opacity duration-150 ${
          colapsada ? 'opacity-0 pointer-events-none' : 'opacity-100 flex-1'
        }`}
      >
        {item.label}
      </span>

      {/* Tooltip flutuante quando colapsada */}
      {colapsada && (
        <span className="hidden group-hover:block fixed left-[4.5rem] px-2.5 py-1 bg-[#0E382C] text-[#D4EC9D] text-xs font-semibold rounded-lg shadow-lg z-50 whitespace-nowrap pointer-events-none">
          {item.label}
        </span>
      )}
    </NavLink>
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
        item.visivel
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
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            item.visivel
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
      <div className="fixed inset-y-0 right-0 w-80 bg-white z-50 flex flex-col shadow-2xl border-l border-[#E4ECE7]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4ECE7]">
          <div>
            <h2 className="text-base font-bold text-[#111915]">Personalizar Navegação</h2>
            <p className="text-xs text-[#687770]">Arraste para organizar o seu menu</p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Fechar"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
          </button>
        </div>

        {/* Chat IA Config */}
        <div className="p-4 border-b border-[#E4ECE7]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#687770] mb-2">
            Assistente Chat IA
          </p>
          <div className="flex rounded-xl bg-[#F7FAF8] p-1 border border-[#E4ECE7]">
            <button
              onClick={() => definirChatIaModo('flutuante')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                chatIaModo === 'flutuante' ? 'bg-[#0E382C] text-white shadow-xs' : 'text-[#687770] hover:text-[#111915]'
              }`}
            >
              <HugeiconsIcon icon={Comment01Icon} size={14} strokeWidth={1.8} />
              <span>Flutuante</span>
            </button>
            <button
              onClick={() => definirChatIaModo('fixo')}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                chatIaModo === 'fixo' ? 'bg-[#0E382C] text-white shadow-xs' : 'text-[#687770] hover:text-[#111915]'
              }`}
            >
              <HugeiconsIcon icon={PinIcon} size={14} strokeWidth={1.8} />
              <span>Na Sidebar</span>
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[#687770] mb-1">
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
        <div className="p-4 border-t border-[#E4ECE7] space-y-2 bg-[#F7FAF8]">
          {salvando && (
            <p className="text-xs text-center text-emerald-700 font-medium animate-pulse">Salvando alterações...</p>
          )}
          <button onClick={resetar} className="w-full text-xs py-2 text-[#687770] hover:text-[#111915] font-semibold text-center">
            Restaurar Padrão
          </button>
          <button onClick={onFechar} className="w-full py-2.5 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-sm rounded-xl transition-all shadow-xs">
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
          fixed top-0 left-0 h-screen flex flex-col z-40 overflow-hidden bg-white border-r border-[#E4ECE7]
          transition-[width] duration-300 ease-in-out flex-shrink-0
          lg:static lg:z-auto lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          w-64 ${colapsada ? 'lg:w-16' : 'lg:w-64'}
        `}
      >
        <div className="w-64 h-full flex flex-col flex-shrink-0">
          {/* Logo Header */}
          <div className="h-16 flex items-center px-3 border-b border-[#E4ECE7] flex-shrink-0 overflow-hidden">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <MarcaLogo />
            </div>
            <span
              className={`font-extrabold text-lg tracking-tight text-[#0E382C] truncate whitespace-nowrap ml-2 transition-opacity duration-150 ${
                colapsada ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
            >
              Prancheto<span className="text-emerald-600">.IA</span>
            </span>
            <button onClick={onFechar} className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden p-1 rounded-lg" title="Fechar menu">
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
              />
            ))}
          </nav>

          {/* Base da Sidebar: Apenas o botão de editar sidebar */}
          <div className="p-3 border-t border-[#E4ECE7] flex-shrink-0 overflow-hidden">
            <button
              onClick={() => setModalAberto(true)}
              className={`h-10 flex items-center rounded-xl font-medium text-sm transition-[width,background-color,color] duration-300 text-[#687770] hover:bg-[#EDF2EE] hover:text-[#111915] group relative overflow-hidden ${
                colapsada ? 'w-10' : 'w-full'
              }`}
              title="Personalizar itens da sidebar"
            >
              <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={PencilEdit01Icon} size={18} strokeWidth={1.8} />
              </span>
              <span
                className={`truncate whitespace-nowrap pr-2.5 transition-opacity duration-150 ${
                  colapsada ? 'opacity-0 pointer-events-none' : 'opacity-100 flex-1'
                }`}
              >
                Editar Menu
              </span>
              {colapsada && (
                <span className="hidden group-hover:block fixed left-[4.5rem] px-2.5 py-1 bg-[#0E382C] text-[#D4EC9D] text-xs font-semibold rounded-lg shadow-lg z-50 whitespace-nowrap pointer-events-none">
                  Editar Menu
                </span>
              )}
            </button>
          </div>
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
  const menuUsuarioRef = useRef(null);

  const location  = useLocation();
  const prefs     = useSidebarPrefs();

  const usuario   = useAuthStore((s) => s.usuario);
  const { logout } = useAuth();
  const badgeCargo  = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  const tenantId        = usuario?.tenant_id;
  const carregarTenant  = useTenantStore((s) => s.carregar);
  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  const cargoId          = usuario?.cargo_id;
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  useEffect(() => {
    if (!cargoId) return;
    carregarPermissoesCargo(cargoId).then((lista) => {
      if (Array.isArray(lista)) atualizarUsuario({ permissoesCargo: lista });
    });
  }, [cargoId, atualizarUsuario]);

  // Fechar dropdown de perfil ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
        setMenuUsuarioAberto(false);
      }
    };
    if (menuUsuarioAberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuUsuarioAberto]);

  return (
    <div className="h-screen bg-[#F2F5F3] flex items-stretch overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
        prefs={prefs}
      />

      {/* Toggle Sidebar Desktop Button */}
      <button
        onClick={() => prefs.alternarColapsada(!prefs.colapsada)}
        title={prefs.colapsada ? 'Expandir menu' : 'Recolher menu'}
        className="hidden lg:flex fixed top-4 z-50 items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E4ECE7] shadow-sm text-slate-500 hover:text-[#0E382C] hover:border-[#0E382C] transition-[left] duration-300 ease-in-out cursor-pointer"
        style={{
          left: prefs.colapsada ? 'calc(4rem - 0.875rem)' : 'calc(16rem - 0.875rem)',
        }}
      >
        <HugeiconsIcon
          icon={prefs.colapsada ? ArrowRight01Icon : ArrowLeft01Icon}
          size={14}
          strokeWidth={2.2}
          className="transition-transform duration-200"
        />
      </button>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#E4ECE7] px-6 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarAberta(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-[#0E382C] rounded-lg"
            >
              <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
            </button>
          </div>

          {/* Search Pill */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              strokeWidth={1.8}
              className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Pesquisar projetos, clientes ou tarefas..."
              className="w-full pl-9 pr-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-full text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C] transition-all"
            />
          </div>

          {/* Actions: Notificação, Configuração, Foto de Perfil */}
          <div className="flex items-center gap-2.5">
            {/* 1. Botão de Notificação */}
            <button
              title="Notificações"
              className="w-9 h-9 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] hover:text-[#0E382C] flex items-center justify-center transition-colors relative"
            >
              <HugeiconsIcon icon={Notification01Icon} size={18} strokeWidth={1.8} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2"></span>
            </button>

            {/* 2. Botão de Configuração */}
            <NavLink
              to="/dashboard/configuracoes"
              title="Configurações e Organização"
              className={({ isActive }) => {
                const ativa = isActive || location.pathname.startsWith('/dashboard/organizacao');
                return `w-9 h-9 rounded-xl border border-[#E4ECE7] flex items-center justify-center transition-colors ${
                  ativa
                    ? 'bg-[#0E382C] text-[#D4EC9D]'
                    : 'bg-[#F7FAF8] text-[#687770] hover:text-[#0E382C]'
                }`;
              }}
            >
              <HugeiconsIcon icon={Settings02Icon} size={18} strokeWidth={1.8} />
            </NavLink>

            {/* 3. Foto de Perfil */}
            <div className="relative" ref={menuUsuarioRef}>
              <button
                onClick={() => setMenuUsuarioAberto((v) => !v)}
                className="w-9 h-9 rounded-xl bg-[#0E382C] text-[#D4EC9D] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs hover:ring-2 hover:ring-[#0E382C]/20 transition-all cursor-pointer overflow-hidden border border-[#E4ECE7]"
                title={`Perfil: ${usuario?.nome || 'Usuário'}`}
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

              {menuUsuarioAberto && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E4ECE7] py-2 z-50 animate-fade-in text-xs">
                  {/* Dados do usuário */}
                  <div className="px-4 py-2.5 border-b border-[#E4ECE7]">
                    <p className="font-bold text-[#111915] truncate">{usuario?.nome || 'Usuário'}</p>
                    <p className="text-[11px] text-[#687770] truncate">{usuario?.email}</p>
                    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1.5 ${badgeCargo.bg} ${badgeCargo.text}`}>
                      {badgeCargo.label}
                    </span>
                  </div>

                  {/* Links rápidos */}
                  <div className="py-1">
                    <NavLink
                      to="/dashboard/configuracoes"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#111915] hover:bg-[#F7FAF8] font-medium"
                    >
                      <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={1.8} className="text-[#687770]" />
                      <span>Meu Perfil</span>
                    </NavLink>
                    <NavLink
                      to="/dashboard/configuracoes"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#111915] hover:bg-[#F7FAF8] font-medium"
                    >
                      <HugeiconsIcon icon={Settings02Icon} size={16} strokeWidth={1.8} className="text-[#687770]" />
                      <span>Configurações</span>
                    </NavLink>
                    <NavLink
                      to="/suporte"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-[#111915] hover:bg-[#F7FAF8] font-medium"
                    >
                      <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} className="text-[#687770]" />
                      <span>Suporte</span>
                    </NavLink>
                  </div>

                  {/* Sair */}
                  <div className="pt-1 border-t border-[#E4ECE7]">
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
        </header>

        {/* Page Content Stream */}
        <main className="flex-1 overflow-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col min-h-0">
          {children}
        </main>
      </div>

      {/* Floating Chat IA */}
      {prefs.chatIaModo === 'flutuante' && !prefs.carregando && <BolhaChatIA />}
    </div>
  );
};

export default LayoutCliente;
