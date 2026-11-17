// =============================================================
// PRANCHETO.IA - CRM HUB (EMITLY DESIGN SYSTEM)
// Hub de gestão do Pipeline de Negócios e Empresas
// =============================================================

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import PaginaLeads from './Leads.jsx';
import PaginaLeadDetalhe from './LeadDetalhe.jsx';
import PaginaClientes from './Clientes.jsx';
import PaginaCamposCustomizados from './CamposCustomizados.jsx';
import PaginaEmpresas from './Empresas.jsx';
import PaginaEmpresaDetalhe from './EmpresaDetalhe.jsx';

const CRMHub = () => {
  const location = useLocation();
  const isKanban = location.pathname === '/crm/leads' || location.pathname === '/crm' || location.pathname === '/crm/';

  return (
    <div className={`w-full flex-1 flex flex-col bg-surface-primary ${isKanban ? 'h-full min-h-0 overflow-hidden' : 'min-h-full'}`}>
      <div className={`flex-1 flex flex-col ${isKanban ? 'min-h-0 h-full overflow-hidden' : ''}`}>
        <Routes>
          <Route path="leads" element={<PaginaLeads />} />
          <Route path="leads/:id" element={<PaginaLeadDetalhe />} />
          <Route path="empresas" element={<PaginaEmpresas />} />
          <Route path="empresas/:id" element={<PaginaEmpresaDetalhe />} />
          <Route path="clientes" element={<PaginaClientes />} />
          <Route path="campos" element={<PaginaCamposCustomizados />} />
          <Route path="*" element={<Navigate to="/crm/leads" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default CRMHub;
