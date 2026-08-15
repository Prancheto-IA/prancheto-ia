// =============================================================
// PRANCHETO.IA - COMPONENTE RAIZ DA APLICAÇÃO
// Roteamento com redirecionamento inteligente por cargo:
//   - super_admin  → /admin  (Painel Administrativo)
//   - admin/manager/member/viewer → /dashboard (Dashboard do Cliente)
// =============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';

import { useAuthStore } from './store/authStore.js';
import { useSessaoSincronizada } from './hooks/useSessaoSincronizada.js';
import ToastContainer from './components/ui/Toast.jsx';
import BannerImpersonation from './components/BannerImpersonation/BannerImpersonation.jsx';

// =============================================================
// LAZY LOADING DAS PÁGINAS
// =============================================================
const PaginaLogin            = lazy(() => import('./pages/Login/Login.jsx'));
const PaginaCRM              = lazy(() => import('./pages/CRM/CRM.jsx'));
const PaginaCRMHub           = lazy(() => import('./pages/CRM/CRMHub.jsx'));
const PaginaSuporteHub       = lazy(() => import('./pages/Suporte/SuporteHub.jsx'));
const PaginaAdminPanel       = lazy(() => import('./pages/AdminPanel/AdminPanel.jsx'));

// Layout do cliente (Sidebar)
const LayoutCliente          = lazy(() => import('./pages/DashboardCliente/LayoutCliente.jsx'));

// Páginas do cliente
const PaginaDashboardCliente = lazy(() => import('./pages/DashboardCliente/DashboardCliente.jsx'));
const PaginaAgenda           = lazy(() => import('./pages/DashboardCliente/Agenda/Agenda.jsx'));
const PaginaChat             = lazy(() => import('./pages/DashboardCliente/Chat/Chat.jsx'));
const PaginaRelatorios       = lazy(() => import('./pages/DashboardCliente/Relatorios/Relatorios.jsx'));
const PaginaOutbound         = lazy(() => import('./pages/DashboardCliente/Outbound/Outbound.jsx'));
const PaginaConfiguracoes    = lazy(() => import('./pages/DashboardCliente/Configuracoes/Configuracoes.jsx'));

// Módulo Organização (Times, Cargos, Identidade Visual)
const PaginaOrganizacao      = lazy(() => import('./pages/DashboardCliente/Organizacao/Organizacao.jsx'));
const PaginaTimes            = lazy(() => import('./pages/DashboardCliente/Organizacao/Times.jsx'));
const PaginaCargos           = lazy(() => import('./pages/DashboardCliente/Organizacao/Cargos.jsx'));
const PaginaIdentidadeVisual = lazy(() => import('./pages/DashboardCliente/Organizacao/IdentidadeVisual.jsx'));

// ============================================================
// FASE 3 — Módulos
// ============================================================
const PaginaModulosHub       = lazy(() => import('./pages/Modulos/ModulosHub.jsx'));
const PaginaDashboardModulo  = lazy(() => import('./pages/Modulos/Dashboard/Dashboard.jsx'));
const PaginaCalendario       = lazy(() => import('./pages/Modulos/Calendario/Calendario.jsx'));
const PaginaProjetos         = lazy(() => import('./pages/Modulos/Projetos/Projetos.jsx'));
const PaginaProjetoDetalhe   = lazy(() => import('./pages/Modulos/Projetos/ProjetoDetalhe.jsx'));
const PaginaTarefas          = lazy(() => import('./pages/Modulos/Tarefas/Tarefas.jsx'));
const PaginaFeed             = lazy(() => import('./pages/Modulos/Feed/Feed.jsx'));
const PaginaChatModulo       = lazy(() => import('./pages/Modulos/Chat/ChatModulo.jsx'));
const PaginaTimesPessoas     = lazy(() => import('./pages/Modulos/TimesPessoas/TimesPessoas.jsx'));

// =============================================================
// HELPER: determina para onde redirecionar após login
// =============================================================
const rotaParaUsuario = (usuario) => {
  if (!usuario) return '/login';
  if (usuario.isSuperAdmin) return '/admin';
  return '/dashboard';
};

// =============================================================
// ROTA PRIVADA: exige autenticação
// =============================================================
const RotaPrivada = ({ children }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// =============================================================
// ROTA SUPER ADMIN: apenas super_admin pode acessar
// =============================================================
const RotaSuperAdmin = ({ children }) => {
  const { token, usuario } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!usuario?.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// =============================================================
// ROTA CLIENTE: apenas usuários com tenant (não super_admin)
// =============================================================
const RotaCliente = ({ children }) => {
  const { token, usuario } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  // Super Admin não acessa o dashboard de cliente
  if (usuario?.isSuperAdmin) return <Navigate to="/admin" replace />;
  return children;
};

// =============================================================
// TELA DE CARREGAMENTO (Fallback do Suspense)
// =============================================================
const TelaCarregando = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Carregando Prancheto.IA...</p>
    </div>
  </div>
);

// =============================================================
// WRAPPER: Layout do cliente com Sidebar
// =============================================================
const ClienteComLayout = ({ children }) => (
  <RotaCliente>
    <LayoutCliente>
      {children}
    </LayoutCliente>
  </RotaCliente>
);

// =============================================================
// COMPONENTE PRINCIPAL: APP
// =============================================================
const App = () => {
  // Antes de montar qualquer rota: o usuario guardado ainda e o dono da
  // sessao? Renderizar primeiro e conferir depois faria a interface
  // aparecer com dados de outra conta ate a resposta chegar.
  const { verificando } = useSessaoSincronizada();
  if (verificando) return <TelaCarregando />;

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen bg-surface p-8">
          <div className="bg-surface-card border border-surface-border rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-white text-xl font-semibold mb-2">Algo deu errado</h1>
            <p className="text-slate-400 text-sm mb-6">
              Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
            </p>
            <p className="text-slate-500 text-xs font-mono mb-6 bg-slate-800 p-2 rounded">
              {error?.message || 'Erro desconhecido'}
            </p>
            <button
              onClick={resetError}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      showDialog={false}
    >
      <BrowserRouter>
        {/* Banner de impersonation: visível em TODAS as páginas quando ativo */}
        <BannerImpersonation />

        {/* Container global de notificações Toast */}
        <ToastContainer />

        <Suspense fallback={<TelaCarregando />}>
          <Routes>
            {/* --- PÚBLICA: LOGIN --- */}
            <Route path="/login" element={<PaginaLogin />} />

            {/* ============================================================
                ÁREA DO CLIENTE (com Sidebar)
                Todas as rotas /dashboard/* são envolvidas pelo LayoutCliente
            ============================================================ */}

            {/* Início do dashboard */}
            <Route
              path="/dashboard"
              element={
                <ClienteComLayout>
                  <PaginaDashboardCliente />
                </ClienteComLayout>
              }
            />

            {/* Chat com IA */}
            <Route
              path="/dashboard/chat"
              element={
                <ClienteComLayout>
                  <PaginaChat />
                </ClienteComLayout>
              }
            />

            {/* Agenda */}
            <Route
              path="/dashboard/agenda"
              element={
                <ClienteComLayout>
                  <PaginaAgenda />
                </ClienteComLayout>
              }
            />

            {/* Relatórios */}
            <Route
              path="/dashboard/relatorios"
              element={
                <ClienteComLayout>
                  <PaginaRelatorios />
                </ClienteComLayout>
              }
            />

            {/* Outbound */}
            <Route
              path="/dashboard/outbound"
              element={
                <ClienteComLayout>
                  <PaginaOutbound />
                </ClienteComLayout>
              }
            />

            {/* Configurações */}
            <Route
              path="/dashboard/configuracoes"
              element={
                <ClienteComLayout>
                  <PaginaConfiguracoes />
                </ClienteComLayout>
              }
            />

            {/* Planos deixou de ser página própria: o plano da organização
                virou uma aba de Configurações. A rota antiga permanece como
                redirecionamento, para não quebrar links já salvos. */}
            <Route
              path="/dashboard/planos"
              element={<Navigate to="/dashboard/configuracoes?aba=plano" replace />}
            />

            {/* ============================================================
                ORGANIZAÇÃO: Times, Cargos e Identidade Visual
                Sub-rotas aninhadas dentro do layout do módulo
            ============================================================ */}
            <Route
              path="/dashboard/organizacao"
              element={
                <ClienteComLayout>
                  <PaginaOrganizacao />
                </ClienteComLayout>
              }
            >
              <Route path="times"      element={<PaginaTimes />} />
              <Route path="cargos"     element={<PaginaCargos />} />
              <Route path="identidade" element={<PaginaIdentidadeVisual />} />
            </Route>

            {/* Wildcard do dashboard (redireciona para /dashboard) */}
            <Route
              path="/dashboard/*"
              element={<Navigate to="/dashboard" replace />}
            />

            {/* ============================================================
                CRM LEGADO: mantido para compatibilidade (redireciona para novo hub)
            ============================================================ */}
            <Route
              path="/crm"
              element={<Navigate to="/crm/leads" replace />}
            />

            {/* ============================================================
                CRM HUB (FASE 2): Leads, Clientes, Campos Customizados
                Usa o LayoutCliente (Sidebar) + abas internas
            ============================================================ */}
            <Route
              path="/crm/*"
              element={
                <ClienteComLayout>
                  <PaginaCRMHub />
                </ClienteComLayout>
              }
            />

            {/* ============================================================
                SUPORTE: Tickets, Base de Conhecimento e Status do Sistema
                Usa o LayoutCliente (Sidebar) + abas internas
            ============================================================ */}
            <Route
              path="/suporte/*"
              element={
                <ClienteComLayout>
                  <PaginaSuporteHub />
                </ClienteComLayout>
              }
            />

            {/* ============================================================
                FASE 3 — MÓDULOS
            ============================================================ */}

            {/* Hub de configuração DnD */}
            <Route
              path="/modulos"
              element={
                <ClienteComLayout>
                  <PaginaModulosHub />
                </ClienteComLayout>
              }
            />

            {/* Dashboard */}
            <Route
              path="/modulos/dashboard"
              element={
                <ClienteComLayout>
                  <PaginaDashboardModulo />
                </ClienteComLayout>
              }
            />

            {/* Calendário interativo */}
            <Route
              path="/modulos/calendario"
              element={
                <ClienteComLayout>
                  <PaginaCalendario />
                </ClienteComLayout>
              }
            />

            {/* Projetos */}
            <Route
              path="/modulos/projetos"
              element={
                <ClienteComLayout>
                  <PaginaProjetos />
                </ClienteComLayout>
              }
            />
            <Route
              path="/modulos/projetos/:id"
              element={
                <ClienteComLayout>
                  <PaginaProjetoDetalhe />
                </ClienteComLayout>
              }
            />

            {/* Tarefas */}
            <Route
              path="/modulos/tarefas"
              element={
                <ClienteComLayout>
                  <PaginaTarefas />
                </ClienteComLayout>
              }
            />

            {/* Feed */}
            <Route
              path="/modulos/feed"
              element={
                <ClienteComLayout>
                  <PaginaFeed />
                </ClienteComLayout>
              }
            />

            {/* Chat */}
            <Route
              path="/modulos/chat"
              element={
                <ClienteComLayout>
                  <PaginaChatModulo />
                </ClienteComLayout>
              }
            />

            {/* Times e Pessoas */}
            <Route
              path="/modulos/times-pessoas"
              element={
                <ClienteComLayout>
                  <PaginaTimesPessoas />
                </ClienteComLayout>
              }
            />

            {/* ============================================================
                SUPER ADMIN: Painel Administrativo (invisível para clientes)
            ============================================================ */}
            <Route
              path="/admin/*"
              element={
                <RotaSuperAdmin>
                  <PaginaAdminPanel />
                </RotaSuperAdmin>
              }
            />

            {/* --- RAIZ: redireciona baseado no cargo do usuário logado --- */}
            <Route
              path="/"
              element={<RedirecionarRaiz />}
            />

            {/* --- 404 --- */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-surface">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
                    <p className="text-slate-400 mb-6">Página não encontrada</p>
                    <a href="/dashboard" className="text-primary-400 hover:text-primary-300 underline">
                      Voltar ao início
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
};

// Componente auxiliar para redirecionar a raiz baseado no cargo
const RedirecionarRaiz = () => {
  const { token, usuario } = useAuthStore();
  return <Navigate to={rotaParaUsuario(token ? usuario : null)} replace />;
};

export default App;
