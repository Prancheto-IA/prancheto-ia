// =============================================================
// PRANCHETO.IA - WIDGET: ACESSOS RÁPIDOS (EMITLY DESIGN SYSTEM)
// Atalhos diretos com ícones de vetor limpos e botões de toque suave.
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetShell from './WidgetShell.jsx';

const ATALHOS = [
  {
    label: 'CRM Leads',
    rota: '/crm/leads',
    icone: (
      <svg className="w-5 h-5 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: 'Relatórios',
    rota: '/dashboard/relatorios',
    icone: (
      <svg className="w-5 h-5 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Agenda',
    rota: '/dashboard/agenda',
    icone: (
      <svg className="w-5 h-5 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Configurações',
    rota: '/dashboard/configuracoes',
    icone: (
      <svg className="w-5 h-5 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      </svg>
    ),
  },
];

const WidgetAcessosRapidos = () => {
  const navigate = useNavigate();

  return (
    <WidgetShell
      titulo="Acessos Rápidos"
      icone={
        <svg className="w-4 h-4 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {ATALHOS.map((a) => (
          <button
            key={a.rota}
            onClick={() => navigate(a.rota)}
            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-[#D4EC9D]/30 hover:border-[#0E382C]/30 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-white border border-[#E4ECE7] shadow-2xs group-hover:scale-105 transition-transform">
              {a.icone}
            </div>
            <span className="text-[11px] font-semibold text-[#111915]">{a.label}</span>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
};

export default WidgetAcessosRapidos;
