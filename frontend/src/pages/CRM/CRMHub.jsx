// =============================================================
// PRANCHETO.IA - CRM HUB (EMITLY DESIGN SYSTEM)
// Hub de gestão do Pipeline de Negócios (Deals Pipeline)
// =============================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PaginaLeads            from './Leads.jsx';
import PaginaLeadDetalhe      from './LeadDetalhe.jsx';
import PaginaClientes         from './Clientes.jsx';
import PaginaCamposCustomizados from './CamposCustomizados.jsx';

const CRMHub = () => {
  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 h-full">
        <Routes>
          <Route path="leads" element={<PaginaLeads />} />
          <Route path="leads/:id" element={<PaginaLeadDetalhe />} />
          <Route path="clientes" element={<PaginaClientes />} />
          <Route path="campos" element={<PaginaCamposCustomizados />} />
          <Route path="*" element={<Navigate to="/crm/leads" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default CRMHub;
