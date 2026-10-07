// =============================================================
// PRANCHETO.IA - CRM HUB (EMITLY DESIGN SYSTEM)
// Hub de gestão de Leads, Clientes e Campos com abas orgânicas ativas.
// =============================================================

import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import PaginaLeads            from './Leads.jsx';
import PaginaClientes         from './Clientes.jsx';
import PaginaCamposCustomizados from './CamposCustomizados.jsx';

const ABAS = [
  {
    path: '/crm/leads',
    label: 'Funil de Leads',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    path: '/crm/clientes',
    label: 'Carteira de Clientes',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/crm/campos',
    label: 'Campos Customizados',
    icone: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
];

const NavCRM = () => {
  return (
    <div className="bg-white border-b border-[#E4ECE7] px-6 pt-5 pb-0 mb-6 rounded-2xl shadow-xs">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915] tracking-tight">
            Central CRM &amp; Relacionamento
          </h1>
          <p className="text-xs text-[#687770]">
            Gerencie prospecção, novos leads, clientes ativos e regras de qualificação.
          </p>
        </div>
      </div>

      {/* Abas Pill emitly */}
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
};

const CRMHub = () => {
  return (
    <div className="max-w-7xl mx-auto flex flex-col min-h-full">
      <NavCRM />
      <div className="flex-1">
        <Routes>
          <Route path="leads" element={<PaginaLeads />} />
          <Route path="clientes" element={<PaginaClientes />} />
          <Route path="campos" element={<PaginaCamposCustomizados />} />
          <Route path="*" element={<Navigate to="/crm/leads" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default CRMHub;
