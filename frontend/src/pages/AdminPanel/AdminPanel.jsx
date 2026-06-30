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
// =============================================================

import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useTema } from '../../hooks/useTema.js';

// Lazy loading das sub-páginas do painel admin
const PaginaChatIA          = lazy(() => import('./ChatIA/ChatIA.jsx'));
const PaginaGestaoUsuarios  = lazy(() => import('./Usuarios/GestaoUsuarios.jsx'));
const PaginaGestaoClientes  = lazy(() => import('./Clientes/GestaoClientes.jsx'));
const PaginaPlanoLimites    = lazy(() => import('./Planos/PlanoLimites.jsx'));
const PaginaLogsSeguranca   = lazy(() => import('./Seguranca/LogsSeguranca.jsx'));
const PaginaMonitoramento   = lazy(() => import('./Monitoramento/Monitoramento.jsx'));

// =============================================================
// COMPONENTE: TelaCarregandoAdmin
// =============================================================
const TelaCarregandoAdmin = () => (
  <div
    className="flex items-center justify-center flex-1"
    style={{ backgroundColor: 'var(--color-surface)' }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Carregando módulo...</p>
    </div>
  </div>
);

// =============================================================
// COMPONENTE: CardModulo
// =============================================================
const CardModulo = ({ emoji, titulo, descricao, status, onClick }) => {
  const ativo = status === 'ativo';

  return (
    <div
      onClick={ativo ? onClick : undefined}
      className={`rounded-xl p-5 border transition-all ${
        ativo
          ? 'hover:border-primary-600/60 cursor-pointer hover:bg-primary-900/10'
          : 'opacity-60 cursor-default'
      }`}
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderColor: 'var(--color-surface-border)',
      }}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>{titulo}</h3>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{descricao}</p>

      {ativo ? (
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Disponível
        </span>
      ) : (
        <span className="mt-3 inline-block text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
          Em breve
        </span>
      )}
    </div>
  );
};

// =============================================================
// COMPONENTE: DashboardAdmin
// =============================================================
const DashboardAdmin = () => {
  const navigate            = useNavigate();
  const { usuario, logout } = useAuthStore();
  const { temaEscuro, alternarTema } = useTema();

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
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>

      {/* Header do Painel Admin */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderColor: 'var(--color-surface-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Prancheto.IA
            </span>
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30"
            >
              Painel Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>
            {usuario?.nome || usuario?.email}
          </span>
          {/* Toggle de tema */}
          <button
            onClick={alternarTema}
            className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all hover:border-primary-500/50"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-surface-border)',
            }}
            title={temaEscuro ? 'Tema claro' : 'Tema escuro'}
          >
            {temaEscuro ? '☀️' : '🌙'}
          </button>
          <button
            onClick={logout}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-red-500/50 hover:text-red-400"
            style={{
              borderColor: 'var(--color-surface-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Painel Administrativo
          </h1>
          <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
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
// =============================================================
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
        <Route path="*"             element={<DashboardAdmin />} />
      </Routes>
    </Suspense>
  );
};

export default PaginaAdminPanel;
