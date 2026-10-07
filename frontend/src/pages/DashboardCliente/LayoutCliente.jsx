// =============================================================
// PRANCHETO.IA - LAYOUT DO CLIENTE (DESIGN SYSTEM EMITLY)
// Shell principal do aplicativo com Sidebar orgânica, Header responsivo,
// modal de personalização DnD e Bolha Chat IA.
// =============================================================

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

// Páginas sem botão de voltar
const ROTAS_SEM_VOLTAR = [
  '/dashboard', '/crm', '/suporte', '/dashboard/organizacao',
  '/chat', '/calendario', '/tarefas', '/projetos', '/times-pessoas',
];

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

// Mapeamento de SVGs para a Sidebar
const ICONES_SVG = {
  dashboard: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  crm: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  projetos: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  tarefas: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  calendario: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chat: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  suporte: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  organizacao: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v14a2 2 0 01-2 2" />
    </svg>
  ),
  configuracoes: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  outbound: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  relatorios: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  times_pessoas: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

const getIconeItem = (slug) => ICONES_SVG[slug] || ICONES_SVG.dashboard;

// ----------------------------------------------------------
// COMPONENTE: ItemNav Emitly
// ----------------------------------------------------------
const ItemNav = ({ item, onClick }) => {
  const location = useLocation();
  const ativoViaPrefixo = item.prefixoAtivo
    ? location.pathname.startsWith(item.prefixoAtivo)
    : false;

  return (
    <NavLink
      to={item.rota}
      end={item.exact}
      onClick={onClick}
      className={({ isActive }) => {
        const ativo = isActive || ativoViaPrefixo;
        return `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
          ativo
            ? 'bg-[#D4EC9D] text-[#132E22] font-semibold shadow-xs'
            : 'text-[#687770] hover:bg-[#EDF2EE] hover:text-[#111915]'
        }`;
      }}
    >
      <span className="flex-shrink-0">{getIconeItem(item.slug)}</span>
      <span className="truncate">{item.label}</span>
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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
        </svg>
      </button>

      <span className="flex-shrink-0 text-slate-600">{getIconeItem(item.slug)}</span>
      <span className="flex-1 text-sm font-medium truncate">{item.label}</span>

      {fixo ? (
        <span className="text-xs text-slate-400 flex-shrink-0" title="Item fixo">
          🔒
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
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            ✕
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
              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                chatIaModo === 'flutuante' ? 'bg-[#0E382C] text-white shadow-xs' : 'text-[#687770]'
              }`}
            >
              💬 Flutuante
            </button>
            <button
              onClick={() => definirChatIaModo('fixo')}
              className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                chatIaModo === 'fixo' ? 'bg-[#0E382C] text-white shadow-xs' : 'text-[#687770]'
              }`}
            >
              📌 Na Sidebar
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
  const { usuario } = useAuthStore();
  const { logout }  = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  const { itensVisiveis, colapsada } = prefs;
  const badgeCargo  = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <>
      {aberta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden" onClick={onFechar} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 flex flex-col z-40 transition-all duration-300 overflow-hidden bg-white border-r border-[#E4ECE7]
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
          ${colapsada ? 'lg:w-0 lg:!border-0' : 'lg:w-64'}
        `}
      >
        <div className="w-64 h-full flex flex-col flex-shrink-0">
          {/* Logo Header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b border-[#E4ECE7] flex-shrink-0">
            <MarcaLogo />
            <span className="font-extrabold text-lg tracking-tight text-[#0E382C]">
              Prancheto<span className="text-emerald-600">.IA</span>
            </span>
            <button onClick={onFechar} className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden">
              ✕
            </button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {itensVisiveis.map((item) => (
              <ItemNav key={item.slug} item={item} onClick={onFechar} />
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-[#E4ECE7] flex-shrink-0 bg-[#F7FAF8]">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-[#0E382C] text-[#D4EC9D] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                {primeiroNome[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#111915] truncate">{primeiroNome}</p>
                <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeCargo.bg} ${badgeCargo.text}`}>
                  {badgeCargo.label}
                </span>
              </div>
              <button
                onClick={() => setModalAberto(true)}
                title="Personalizar sidebar"
                className="p-1.5 text-[#687770] hover:text-[#0E382C] hover:bg-[#EDF2EE] rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={logout}
                title="Sair"
                className="p-1.5 text-[#687770] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
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
  const navigate  = useNavigate();
  const location  = useLocation();
  const prefs     = useSidebarPrefs();

  const tenantId        = useAuthStore((s) => s.usuario?.tenant_id);
  const carregarTenant  = useTenantStore((s) => s.carregar);
  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  const cargoId          = useAuthStore((s) => s.usuario?.cargo_id);
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  useEffect(() => {
    if (!cargoId) return;
    carregarPermissoesCargo(cargoId).then((lista) => {
      if (Array.isArray(lista)) atualizarUsuario({ permissoesCargo: lista });
    });
  }, [cargoId, atualizarUsuario]);

  const mostrarVoltar = !ROTAS_SEM_VOLTAR.includes(location.pathname);

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
        className="hidden lg:flex fixed top-4 z-50 items-center justify-center w-7 h-7 rounded-full bg-white border border-[#E4ECE7] shadow-sm text-slate-500 hover:text-[#0E382C] transition-all"
        style={{
          left: prefs.colapsada ? '0.75rem' : 'calc(16rem - 0.875rem)',
        }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
        </svg>
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {mostrarVoltar && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#687770] hover:text-[#0E382C] bg-[#F7FAF8] border border-[#E4ECE7] px-3 py-1.5 rounded-xl transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Voltar</span>
              </button>
            )}
          </div>

          {/* Search Pill */}
          <div className="flex-1 max-w-md hidden sm:block relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar projetos, clientes ou tarefas..."
              className="w-full pl-9 pr-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-full text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C] transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] hover:text-[#0E382C] flex items-center justify-center transition-colors relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2"></span>
            </button>
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
