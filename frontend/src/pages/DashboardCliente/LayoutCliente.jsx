// =============================================================
// PRANCHETO.IA - LAYOUT DO CLIENTE (com Sidebar)
// Wrapper com navegação lateral para todas as páginas do cliente.
// =============================================================

import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useAuth } from '../../hooks/useAuth.js';

// ----------------------------------------------------------
// ITENS DA NAVEGAÇÃO LATERAL
// ----------------------------------------------------------
const NAV_ITENS = [
  {
    slug:  'dashboard',
    label: 'Início',
    emoji: '🏠',
    rota:  '/dashboard',
    exact: true,
  },
  {
    slug:  'crm',
    label: 'CRM',
    emoji: '📋',
    rota:  '/crm',
    exact: false,
  },
  {
    slug:  'chat_ia',
    label: 'Chat com IA',
    emoji: '🤖',
    rota:  '/dashboard/chat',
    exact: false,
  },
  {
    slug:  'agenda',
    label: 'Agenda',
    emoji: '🗓️',
    rota:  '/dashboard/agenda',
    exact: false,
  },
  {
    slug:  'relatorios',
    label: 'Relatórios',
    emoji: '📊',
    rota:  '/dashboard/relatorios',
    exact: false,
  },
  {
    slug:  'outbound',
    label: 'Outbound',
    emoji: '📧',
    rota:  '/dashboard/outbound',
    exact: false,
  },
];

const NAV_SECUNDARIO = [
  {
    slug:  'planos',
    label: 'Planos',
    emoji: '🚀',
    rota:  '/dashboard/planos',
    exact: false,
  },
  {
    slug:  'configuracoes',
    label: 'Configurações',
    emoji: '⚙️',
    rota:  '/dashboard/configuracoes',
    exact: false,
  },
];

const BADGE_CARGO = {
  admin:   { label: 'Admin',         cor: 'bg-violet-500/20 text-violet-300' },
  manager: { label: 'Gerente',       cor: 'bg-blue-500/20 text-blue-300' },
  member:  { label: 'Membro',        cor: 'bg-emerald-500/20 text-emerald-300' },
  viewer:  { label: 'Visualizador',  cor: 'bg-slate-500/20 text-slate-300' },
};

// ----------------------------------------------------------
// COMPONENTE: Item da Sidebar
// ----------------------------------------------------------
const ItemNav = ({ item, onClick }) => (
  <NavLink
    to={item.rota}
    end={item.exact}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group
      ${isActive
        ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`
    }
  >
    <span className="text-base flex-shrink-0">{item.emoji}</span>
    <span className="truncate">{item.label}</span>
  </NavLink>
);

// ----------------------------------------------------------
// COMPONENTE: Sidebar
// ----------------------------------------------------------
const Sidebar = ({ aberta, onFechar }) => {
  const { usuario } = useAuthStore();
  const { logout }  = useAuth();
  const badgeCargo  = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onFechar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface-card border-r border-surface-border
        flex flex-col z-40 transition-transform duration-300
        ${aberta ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-4 border-b border-surface-border flex-shrink-0">
          <span className="text-2xl">🧠</span>
          <span className="text-white font-bold text-lg">
            {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
          </span>
          {/* Botão fechar mobile */}
          <button
            onClick={onFechar}
            className="ml-auto text-slate-500 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navegação principal */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITENS.map((item) => (
            <ItemNav key={item.slug} item={item} onClick={onFechar} />
          ))}

          {/* Divisor */}
          <div className="my-3 border-t border-surface-border" />

          {/* Navegação secundária */}
          {NAV_SECUNDARIO.map((item) => (
            <ItemNav key={item.slug} item={item} onClick={onFechar} />
          ))}
        </nav>

        {/* Perfil do usuário */}
        <div className="p-3 border-t border-surface-border flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {primeiroNome[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{primeiroNome}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeCargo.cor}`}>
                {badgeCargo.label}
              </span>
            </div>
            {/* Botão sair */}
            <button
              onClick={logout}
              title="Sair"
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 text-lg"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Header mobile
// ----------------------------------------------------------
const HeaderMobile = ({ onAbrirSidebar }) => (
  <header className="h-14 bg-surface-card border-b border-surface-border flex items-center px-4 gap-3 lg:hidden sticky top-0 z-20">
    <button
      onClick={onAbrirSidebar}
      className="text-slate-400 hover:text-white transition-colors text-xl"
    >
      ☰
    </button>
    <span className="text-2xl">🧠</span>
    <span className="text-white font-bold">
      {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
    </span>
  </header>
);

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Layout do Cliente
// ----------------------------------------------------------
const LayoutCliente = ({ children }) => {
  const [sidebarAberta, setSidebarAberta] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <Sidebar
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
      />

      {/* Área de conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <HeaderMobile onAbrirSidebar={() => setSidebarAberta(true)} />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutCliente;
