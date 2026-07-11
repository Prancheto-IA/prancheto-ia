// =============================================================
// PRANCHETO.IA - HUB DE ORGANIZAÇÃO
// Página de entrada do módulo Organização com sub-navegação
// para Times, Cargos e Identidade Visual.
// Usa React Router nested routes via <Outlet>.
// =============================================================

import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

// ----------------------------------------------------------
// SUB-NAVEGAÇÃO DO MÓDULO
// ----------------------------------------------------------
const SUB_NAV = [
  {
    slug:  'times',
    label: 'Times e Pessoas',
    emoji: '👥',
    rota:  '/dashboard/organizacao/times',
    desc:  'Gerencie times e membros',
  },
  {
    slug:  'cargos',
    label: 'Cargos e Permissões',
    emoji: '🎭',
    rota:  '/dashboard/organizacao/cargos',
    desc:  'Defina cargos e acessos',
  },
  {
    slug:  'identidade',
    label: 'Identidade Visual',
    emoji: '🎨',
    rota:  '/dashboard/organizacao/identidade',
    desc:  'Logo, cores e tipografia',
  },
];

// ----------------------------------------------------------
// COMPONENTE: Tab de sub-navegação
// ----------------------------------------------------------
const TabNav = ({ item }) => (
  <NavLink
    to={item.rota}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        isActive
          ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`
    }
  >
    <span className="text-base">{item.emoji}</span>
    <span className="hidden sm:inline">{item.label}</span>
    <span className="sm:hidden">{item.emoji}</span>
  </NavLink>
);

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Layout do módulo Organização
// ----------------------------------------------------------
const Organizacao = () => {
  const location = useLocation();

  // Redireciona /dashboard/organizacao → /dashboard/organizacao/times
  if (location.pathname === '/dashboard/organizacao' || location.pathname === '/dashboard/organizacao/') {
    return <Navigate to="/dashboard/organizacao/times" replace />;
  }

  return (
    <div className="min-h-full">
      {/* Sub-navegação horizontal */}
      <div
        className="sticky top-0 z-10 px-6 py-3 flex items-center gap-2 overflow-x-auto"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderBottom: '1px solid var(--color-surface-border)',
        }}
      >
        {SUB_NAV.map((item) => (
          <TabNav key={item.slug} item={item} />
        ))}
      </div>

      {/* Conteúdo da sub-rota */}
      <Outlet />
    </div>
  );
};

export default Organizacao;
