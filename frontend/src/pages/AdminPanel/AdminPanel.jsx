// =============================================================
// PRANCHETO.IA - PAINEL ADMINISTRATIVO (EMITLY DESIGN SYSTEM)
// Painel Super Admin com cards orgânicos, visual moderno e ícones vetoriais.
// =============================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BotIcon,
  UserGroupIcon,
  Building01Icon,
  PackageIcon,
  Analytics01Icon,
  Shield01Icon,
  Ticket01Icon,
  LockKeyIcon,
} from '@hugeicons/core-free-icons';

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
      icone: <HugeiconsIcon icon={BotIcon} size={20} strokeWidth={1.8} />,
      titulo:   'Chat com IA',
      descricao: 'Gerar novos módulos, código e configurações via chat com a IA.',
      status:   'ativo',
      onClick:  () => navigate('/admin/chat'),
    },
    {
      icone: <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />,
      titulo:   'Gestão de Usuários',
      descricao: 'Gerenciar todos os usuários, cargos e sessão de impersonation.',
      status:   'ativo',
      onClick:  () => navigate('/admin/usuarios'),
    },
    {
      icone: <HugeiconsIcon icon={Building01Icon} size={20} strokeWidth={1.8} />,
      titulo:   'Clientes & Tenants',
      descricao: 'Criar, editar e gerenciar tenants de organizações parceiras.',
      status:   'ativo',
      onClick:  () => navigate('/admin/clientes'),
    },
    {
      icone: <HugeiconsIcon icon={PackageIcon} size={20} strokeWidth={1.8} />,
      titulo:   'Planos e Limites',
      descricao: 'Configurar planos, recursos liberados e limites por empresa.',
      status:   'ativo',
      onClick:  () => navigate('/admin/planos'),
    },
    {
      icone: <HugeiconsIcon icon={Analytics01Icon} size={20} strokeWidth={1.8} />,
      titulo:   'Monitoramento',
      descricao: 'Saúde do sistema, tempo de resposta e métricas de servidores.',
      status:   'ativo',
      onClick:  () => navigate('/admin/monitoramento'),
    },
    {
      icone: <HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.8} />,
      titulo:   'Segurança & Auditoria',
      descricao: 'Logs de acessos, registros de auditoria e controle LGPD.',
      status:   'ativo',
      onClick:  () => navigate('/admin/seguranca'),
    },
    {
      icone: <HugeiconsIcon icon={Ticket01Icon} size={20} strokeWidth={1.8} />,
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
            <HugeiconsIcon icon={LockKeyIcon} size={18} strokeWidth={2} />
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
