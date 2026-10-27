// =============================================================
// PRANCHETO.IA - HUB DE ORGANIZAÇÃO
// Página de entrada do módulo Organização com menu horizontal
// superior unificado e sub-navegação para Times, Cargos e Identidade.
// =============================================================

import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import AjustesTopNav from '../../../components/Ajustes/AjustesTopNav.jsx';

const SUB_NAV = [
  {
    slug:  'times',
    label: 'Times e Equipes',
    rota:  '/dashboard/organizacao/times',
  },
  {
    slug:  'cargos',
    label: 'Cargos e Permissões',
    rota:  '/dashboard/organizacao/cargos',
  },
  {
    slug:  'usuarios',
    label: 'Usuários da Organização',
    rota:  '/dashboard/organizacao/usuarios',
  },
  {
    slug:  'identidade',
    label: 'Identidade Visual',
    rota:  '/dashboard/organizacao/identidade',
  },
];

const Organizacao = () => {
  const location = useLocation();

  // Redireciona /dashboard/organizacao → /dashboard/organizacao/times
  if (location.pathname === '/dashboard/organizacao' || location.pathname === '/dashboard/organizacao/') {
    return <Navigate to="/dashboard/organizacao/times" replace />;
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* 1. Menu Horizontal no Topo (Configurações / Organização e Times) */}
      <AjustesTopNav />

      {/* 2. Sub-navegação das Áreas da Organização */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SUB_NAV.map((item) => (
          <NavLink
            key={item.slug}
            to={item.rota}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                  : 'bg-white border border-[#E4ECE7] text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8]'
              }`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* 3. Conteúdo da sub-rota (Times, Cargos, etc.) */}
      <div className="w-full flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
};

export default Organizacao;
