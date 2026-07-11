// =============================================================
// PRANCHETO.IA - CRM HUB (FASE 2)
// Roteamento interno do módulo CRM com abas:
//   - Leads (funil de entrada)
//   - Clientes (centro de relacionamento)
//   - Campos (campos customizados "Lego")
// =============================================================

import React from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import PaginaLeads            from './Leads.jsx';
import PaginaClientes         from './Clientes.jsx';
import PaginaCamposCustomizados from './CamposCustomizados.jsx';

// ─── Abas de navegação do CRM ──────────────────────────────────
const ABAS = [
  { path: '/crm/leads',   label: '🎯 Leads',   descricao: 'Funil de entrada'         },
  { path: '/crm/clientes',label: '🏆 Clientes', descricao: 'Centro de relacionamento' },
  { path: '/crm/campos',  label: '🧩 Campos',   descricao: 'Campos customizados'      },
];

const NavCRM = () => {
  const location = useLocation();

  return (
    <div
      className="border-b flex-shrink-0"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderColor: 'var(--color-surface-border)',
      }}
    >
      {/* Header do módulo */}
      <div className="px-4 sm:px-6 pt-4 pb-0">
        <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          📋 CRM
        </h1>
        <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Gestão de Leads, Clientes e Campos Customizados
        </p>
      </div>

      {/* Abas */}
      <nav className="flex px-4 sm:px-6 gap-1 overflow-x-auto">
        {ABAS.map(aba => (
          <NavLink
            key={aba.path}
            to={aba.path}
            className={({ isActive }) =>
              `px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-500 text-primary-300'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
              }`
            }
          >
            {aba.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

// ─── CRM Hub ───────────────────────────────────────────────────
const CRMHub = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Navegação por abas */}
      <NavCRM />

      {/* Conteúdo da aba ativa */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="leads"   element={<PaginaLeads />} />
          <Route path="clientes" element={<PaginaClientes />} />
          <Route path="campos"  element={<PaginaCamposCustomizados />} />
          {/* Redireciona /crm e /crm/* para /crm/leads */}
          <Route path="*" element={<Navigate to="/crm/leads" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default CRMHub;
