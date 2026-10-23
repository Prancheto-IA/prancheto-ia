// =============================================================
// PRANCHETO.IA - SUPORTE HUB (EMITLY DESIGN SYSTEM)
// Central de Suporte, Tickets, Artigos e Status da Plataforma.
// =============================================================

import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import NovoTicket       from './NovoTicket.jsx';
import MeusTickets      from './MeusTickets.jsx';
import BaseConhecimento from './BaseConhecimento.jsx';
import StatusSistema    from './StatusSistema.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Ticket01Icon,
  BookOpen01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';

const ABAS = [
  {
    path: '/suporte/novo',
    label: 'Abrir Chamado',
    icone: <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={1.8} />,
  },
  {
    path: '/suporte/meus',
    label: 'Meus Tickets',
    icone: <HugeiconsIcon icon={Ticket01Icon} size={16} strokeWidth={1.8} />,
  },
  {
    path: '/suporte/base',
    label: 'Base de Conhecimento',
    icone: <HugeiconsIcon icon={BookOpen01Icon} size={16} strokeWidth={1.8} />,
  },
  {
    path: '/suporte/status',
    label: 'Status do Sistema',
    icone: <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={1.8} />,
  },
];

const NavSuporte = () => (
  <div className="bg-white border-b border-[#E4ECE7] px-6 pt-5 pb-0 mb-6 rounded-2xl shadow-xs">
    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
      <div>
        <h1 className="text-xl font-extrabold text-[#111915] tracking-tight">
          Central de Suporte &amp; Ajuda
        </h1>
        <p className="text-xs text-[#687770]">
          Abra chamados técnicos, consulte a documentação ou verifique a saúde dos serviços.
        </p>
      </div>
    </div>

    <nav className="flex gap-2 border-b border-[#E4ECE7] pb-3 overflow-x-auto">
      {ABAS.map((aba) => (
        <NavLink
          key={aba.path}
          to={aba.path}
          className={({ isActive }) =>
            `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'text-[#687770] hover:bg-[#F7FAF8] hover:text-[#111915]'
            }`
          }
        >
          {aba.icone}
          <span>{aba.label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

const SuporteHub = () => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-full">
      <NavSuporte />
      <div className="flex-1">
        <Routes>
          <Route path="novo" element={<NovoTicket />} />
          <Route path="meus" element={<MeusTickets />} />
          <Route path="base" element={<BaseConhecimento />} />
          <Route path="status" element={<StatusSistema />} />
          <Route path="*" element={<Navigate to="/suporte/meus" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default SuporteHub;
