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

const ABAS = [
  {
    path: '/suporte/novo',
    label: 'Abrir Chamado',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    path: '/suporte/meus',
    label: 'Meus Tickets',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
  {
    path: '/suporte/base',
    label: 'Base de Conhecimento',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    path: '/suporte/status',
    label: 'Status do Sistema',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
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
