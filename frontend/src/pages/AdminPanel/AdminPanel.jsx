// =============================================================
// PRANCHETO.IA - PAINEL ADMINISTRATIVO (Super Admin / Conta Tronco)
// Painel OCULTO acessível apenas pela Conta Tronco.
// Usuários comuns são redirecionados automaticamente pelo App.jsx
// antes mesmo de chegar neste componente.
//
// ROTEAMENTO INTERNO (sub-rotas do /admin):
//   /admin                → Dashboard com cards de módulos
//   /admin/chat           → Chat com IA (OpenAI)
//   /admin/usuarios       → Gestão de Usuários + Impersonation
//   /admin/clientes       → Gestão de Clientes (Tenants)
//   /admin/planos         → Planos e Limites
//   /admin/seguranca      → Logs de Segurança e Auditoria
//   /admin/monitoramento  → Monitoramento do Sistema
//
// MÓDULOS DISPONÍVEIS:
//   ✅ Chat com IA          → /admin/chat
//   ✅ Usuários             → /admin/usuarios
//   ✅ Gestão de Clientes   → /admin/clientes
//   ✅ Planos e Limites     → /admin/planos
//   ✅ Segurança            → /admin/seguranca
//   ✅ Monitoramento        → /admin/monitoramento
// =============================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

// Lazy loading das sub-páginas do painel admin
const PaginaChatIA          = lazy(() => import('./ChatIA/ChatIA.jsx'));
const PaginaGestaoUsuarios  = lazy(() => import('./Usuarios/GestaoUsuarios.jsx'));
const PaginaGestaoClientes  = lazy(() => import('./Clientes/GestaoClientes.jsx'));
const PaginaPlanoLimites    = lazy(() => import('./Planos/PlanoLimites.jsx'));
const PaginaLogsSeguranca   = lazy(() => import('./Seguranca/LogsSeguranca.jsx'));
const PaginaMonitoramento   = lazy(() => import('./Monitoramento/Monitoramento.jsx'));

// =============================================================
// COMPONENTE: TelaCarregandoAdmin
// Fallback do Suspense para sub-páginas do painel admin
// =============================================================
const TelaCarregandoAdmin = () => (
  <div className="flex items-center justify-center flex-1 bg-surface">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Carregando módulo...</p>
    </div>
  </div>
);

// =============================================================
// COMPONENTE: CardModulo
// Card clicável do dashboard do painel admin
// =============================================================
const CardModulo = ({ emoji, titulo, descricao, status, onClick }) => {
  const ativo = status === 'ativo';

  return (
    <div
      onClick={ativo ? onClick : undefined}
      className={`card transition-all ${
        ativo
          ? 'hover:border-primary-600 cursor-pointer hover:bg-primary-900/10'
          : 'opacity-70 cursor-default'
      }`}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="text-white font-semibold mb-1">{titulo}</h3>
      <p className="text-slate-400 text-sm">{descricao}</p>

      {/* Badge de status */}
      {ativo ? (
        <span className="mt-3 inline-flex items-center gap-1.5 badge bg-green-900/50 text-green-400 border border-green-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Disponível
        </span>
      ) : (
        <span className="mt-3 inline-block badge bg-yellow-900/50 text-yellow-400 border border-yellow-700/50">
          Em breve
        </span>
      )}
    </div>
  );
};

// =============================================================
// COMPONENTE: DashboardAdmin
// Tela principal do painel com os cards de módulos
// =============================================================
const DashboardAdmin = () => {
  const navigate           = useNavigate();
  const { usuario, logout } = useAuthStore();

  // Definição dos módulos do painel admin
  const modulos = [
    {
      emoji:    '🤖',
      titulo:   'Chat com IA',
      descricao: 'Gerar novos módulos, código e configurações via chat com a IA.',
      status:   'ativo',
      onClick:  () => navigate('/admin/chat'),
    },
    {
      emoji:    '👥',
      titulo:   'Usuários',
      descricao: 'Gerenciar usuários de todos os tenants, cargos e impersonation.',
      status:   'ativo',
      onClick:  () => navigate('/admin/usuarios'),
    },
    {
      emoji:    '🏢',
      titulo:   'Gestão de Clientes',
      descricao: 'Criar, editar e gerenciar tenants (empresas clientes).',
      status:   'ativo',
      onClick:  () => navigate('/admin/clientes'),
    },
    {
      emoji:    '📦',
      titulo:   'Planos e Limites',
      descricao: 'Configurar planos, módulos disponíveis e limites por cliente.',
      status:   'ativo',
      onClick:  () => navigate('/admin/planos'),
    },
    {
      emoji:    '📊',
      titulo:   'Monitoramento',
      descricao: 'Saúde do sistema, logs de erros e métricas de uso.',
      status:   'ativo',
      onClick:  () => navigate('/admin/monitoramento'),
    },
    {
      emoji:    '🛡️',
      titulo:   'Segurança',
      descricao: 'Logs de acesso, auditoria de eventos e rastreabilidade LGPD.',
      status:   'ativo',
      onClick:  () => navigate('/admin/seguranca'),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header do Painel Admin */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-primary-800 bg-primary-950/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <span className="text-white font-semibold">Prancheto.IA</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Painel Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            Super Admin: {usuario?.nome || usuario?.email}
          </span>
          <button
            onClick={logout}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">
            Painel Administrativo
          </h1>
          <p className="text-slate-400 mb-8">
            Área exclusiva da equipe fundadora. Gerencie clientes, planos e módulos do sistema.
          </p>

          {/* Grid de cards de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modulos.map((modulo, i) => (
              <CardModulo key={i} {...modulo} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: PaginaAdminPanel
// Gerencia as sub-rotas do painel admin via React Router
// =============================================================
const PaginaAdminPanel = () => {
  return (
    <Suspense fallback={<TelaCarregandoAdmin />}>
      <Routes>
        {/* Dashboard principal do painel admin */}
        <Route index element={<DashboardAdmin />} />

        {/* Chat com IA */}
        <Route path="chat" element={<PaginaChatIA />} />

        {/* Gestão de Usuários + Impersonation */}
        <Route path="usuarios" element={<PaginaGestaoUsuarios />} />

        {/* Gestão de Clientes (Tenants) */}
        <Route path="clientes" element={<PaginaGestaoClientes />} />

        {/* Planos e Limites */}
        <Route path="planos" element={<PaginaPlanoLimites />} />

        {/* Logs de Segurança e Auditoria */}
        <Route path="seguranca" element={<PaginaLogsSeguranca />} />

        {/* Monitoramento do Sistema */}
        <Route path="monitoramento" element={<PaginaMonitoramento />} />

        {/* Rota fallback: redireciona sub-rotas desconhecidas para o dashboard */}
        <Route path="*" element={<DashboardAdmin />} />
      </Routes>
    </Suspense>
  );
};

export default PaginaAdminPanel;
