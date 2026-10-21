// =============================================================
// PRANCHETO.IA - MENU SUPERIOR UNIFICADO DE AJUSTES & ORGANIZAÇÃO
// Menu horizontal no topo conectando /dashboard/configuracoes
// e /dashboard/organizacao/times.
// =============================================================

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings02Icon, Building01Icon } from '@hugeicons/core-free-icons';

export const AjustesTopNav = () => {
  const location = useLocation();
  const isOrgAtiva = location.pathname.startsWith('/dashboard/organizacao');
  const isConfigAtiva = location.pathname.startsWith('/dashboard/configuracoes');

  return (
    <div className="w-full flex items-center gap-2.5 pb-2 border-b border-[#E4ECE7] overflow-x-auto">
      <NavLink
        to="/dashboard/configuracoes"
        className={() =>
          `flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            isConfigAtiva
              ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
              : 'bg-white border border-[#E4ECE7] text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8]'
          }`
        }
      >
        <HugeiconsIcon icon={Settings02Icon} size={18} strokeWidth={1.8} className="flex-shrink-0" />
        <span>Configurações</span>
      </NavLink>

      <NavLink
        to="/dashboard/organizacao/times"
        className={() =>
          `flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            isOrgAtiva
              ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
              : 'bg-white border border-[#E4ECE7] text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8]'
          }`
        }
      >
        <HugeiconsIcon icon={Building01Icon} size={18} strokeWidth={1.8} className="flex-shrink-0" />
        <span>Organização e Times</span>
      </NavLink>
    </div>
  );
};

export default AjustesTopNav;
