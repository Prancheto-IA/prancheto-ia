// =============================================================
// PRANCHETO.IA - PAINEL ADMINISTRATIVO (EMITLY DESIGN SYSTEM)
// Painel Super Admin com cards orgânicos, visual moderno e ícones vetoriais.
// =============================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

// Lazy loading das sub-páginas do painel admin
const PaginaChatIA           = lazy(() => import('./ChatIA/ChatIA.jsx'));
const PaginaGestaoUsuarios   = lazy(() => import('./Usuarios/GestaoUsuarios.jsx'));
const PaginaGestaoClientes   = lazy(() => import('./Clientes/GestaoClientes.jsx'));
const PaginaPlanoLimites     = lazy(() => import('./Planos/PlanoLimites.jsx'));
const PaginaLogsSeguranca    = lazy(() => import('./Seguranca/LogsSeguranca.jsx'));
const PaginaMonitoramento    = lazy(() => import('./Monitoramento/Monitoramento.jsx'));
const PaginaTicketsRecebidos = lazy(() => import('./Suporte/TicketsRecebidos.jsx'));

const TelaCarregandoAdmin = () => (
  <div className="flex items-center justify-center flex-1 min-h-screen bg-[#F2F5F3]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-[#687770]">Carregando painel admin...</p>
    </div>
  </div>
);

const CardModulo = ({ icone, titulo, descricao, status, onClick }) => {
  const ativo = status === 'ativo';

  return (
    <div
      onClick={ativo ? onClick : undefined}
      className={`bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] flex flex-col justify-between space-y-4 transition-all ${
        ativo
          ? 'hover:shadow-md cursor-pointer hover:border-[#0E382C]/30'
          : 'opacity-50 cursor-default'
      }`}
    >
      <div className="space-y-2">
        <div className="w-10 h-10 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-[#0E382C] flex items-center justify-center">
          {icone}
        </div>
        <h3 className="font-extrabold text-sm text-[#111915]">{titulo}</h3>
        <p className="text-xs text-[#687770] leading-relaxed">{descricao}</p>
      </div>

      <div className="pt-2">
        {ativo ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCF5E4] text-[#15803D]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ativo
          </span>
        ) : (
          <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            Em breve
          </span>
        )}
      </div>
    </div>
  );
};

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();

  const modulos = [
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      titulo:   'Chat com IA',
      descricao: 'Gerar novos módulos, código e configurações via chat com a IA.',
      status:   'ativo',
      onClick:  () => navigate('/admin/chat'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      titulo:   'Gestão de Usuários',
      descricao: 'Gerenciar todos os usuários, cargos e sessão de impersonation.',
      status:   'ativo',
      onClick:  () => navigate('/admin/usuarios'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0a2 2 0 01-2-2V5a2 2 0 012-2h4a2 2 0 012 2v14a2 2 0 01-2 2" />
        </svg>
      ),
      titulo:   'Clientes & Tenants',
      descricao: 'Criar, editar e gerenciar tenants de organizações parceiras.',
      status:   'ativo',
      onClick:  () => navigate('/admin/clientes'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      titulo:   'Planos e Limites',
      descricao: 'Configurar planos, recursos liberados e limites por empresa.',
      status:   'ativo',
      onClick:  () => navigate('/admin/planos'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titulo:   'Monitoramento',
      descricao: 'Saúde do sistema, tempo de resposta e métricas de servidores.',
      status:   'ativo',
      onClick:  () => navigate('/admin/monitoramento'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      titulo:   'Segurança & Auditoria',
      descricao: 'Logs de acessos, registros de auditoria e controle LGPD.',
      status:   'ativo',
      onClick:  () => navigate('/admin/seguranca'),
    },
    {
      icone: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      titulo:   'Tickets Recebidos',
      descricao: 'Atender tickets de suporte abertos por qualquer empresa parceira.',
      status:   'ativo',
      onClick:  () => navigate('/admin/tickets'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F5F3] flex flex-col font-sans">
      {/* Header Admin */}
      <header className="h-16 bg-white border-b border-[#E4ECE7] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-[#111915]">Prancheto.IA</span>
            <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E382C] text-[#D4EC9D]">
              Super Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-[#111915] hidden sm:block">
            {usuario?.nome || usuario?.email}
          </span>
          <button
            onClick={logout}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Stream */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915]">Painel de Controle Super Admin</h1>
          <p className="text-xs text-[#687770]">
            Área restrita de governança. Gerencie permissões, empresas parceiras e auditorias do sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modulos.map((modulo, i) => (
            <CardModulo key={i} {...modulo} />
          ))}
        </div>
      </main>
    </div>
  );
};

const PaginaAdminPanel = () => {
  return (
    <Suspense fallback={<TelaCarregandoAdmin />}>
      <Routes>
        <Route index element={<DashboardAdmin />} />
        <Route path="chat"          element={<PaginaChatIA />} />
        <Route path="usuarios"      element={<PaginaGestaoUsuarios />} />
        <Route path="clientes"      element={<PaginaGestaoClientes />} />
        <Route path="planos"        element={<PaginaPlanoLimites />} />
        <Route path="seguranca"     element={<PaginaLogsSeguranca />} />
        <Route path="monitoramento" element={<PaginaMonitoramento />} />
        <Route path="tickets"       element={<PaginaTicketsRecebidos />} />
        <Route path="*"             element={<DashboardAdmin />} />
      </Routes>
    </Suspense>
  );
};

export default PaginaAdminPanel;
