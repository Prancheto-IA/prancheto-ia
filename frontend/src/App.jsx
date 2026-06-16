// =============================================================
// PRANCHETO.IA - COMPONENTE RAIZ DA APLICAÇÃO
// Responsável por:
//   1. Configurar o roteamento principal (React Router)
//   2. Envolver toda a aplicação com o ErrorBoundary global
//   3. Detectar se o usuário é Super Admin e redirecionar
//      para o Painel Administrativo oculto
//   4. Proteger rotas autenticadas via PrivateRoute
// =============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';

// --- IMPORTAÇÕES DE STORES (Estado Global) ---
// O authStore gerencia o token JWT e os dados do usuário logado
import { useAuthStore } from './store/authStore.js';

// --- IMPORTAÇÃO DO TOAST CONTAINER ---
import ToastContainer from './components/ui/Toast.jsx';

// --- BANNER DE IMPERSONATION ---
// Exibido globalmente quando o Super Admin está acessando como outro usuário
import BannerImpersonation from './components/BannerImpersonation/BannerImpersonation.jsx';

// =============================================================
// LAZY LOADING DAS PÁGINAS
// Carrega cada página apenas quando o usuário navegar até ela,
// reduzindo o tamanho do bundle inicial e acelerando o carregamento.
// =============================================================
const PaginaLogin      = lazy(() => import('./pages/Login/Login.jsx'));
const PaginaCRM        = lazy(() => import('./pages/CRM/CRM.jsx'));
const PaginaAdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel.jsx'));

// =============================================================
// COMPONENTE: ROTA PRIVADA
// Redireciona para /login se o usuário não estiver autenticado.
// =============================================================
const RotaPrivada = ({ children }) => {
  const { token } = useAuthStore();
  // Se não há token, redireciona para o login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// =============================================================
// COMPONENTE: ROTA EXCLUSIVA DO SUPER ADMIN
// Redireciona para o CRM padrão se o usuário não for Super Admin.
// O Painel Administrativo é INVISÍVEL para usuários comuns.
// =============================================================
const RotaSuperAdmin = ({ children }) => {
  const { token, usuario } = useAuthStore();

  // Sem token: vai para login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Com token mas sem permissão de Super Admin: vai para o CRM padrão
  if (!usuario?.isSuperAdmin) {
    return <Navigate to="/crm" replace />;
  }

  return children;
};

// =============================================================
// COMPONENTE: TELA DE CARREGAMENTO (Fallback do Suspense)
// Exibida enquanto as páginas são carregadas via lazy loading.
// =============================================================
const TelaCarregando = () => (
  <div className="flex items-center justify-center min-h-screen bg-surface">
    <div className="flex flex-col items-center gap-4">
      {/* Spinner de carregamento */}
      <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Carregando Prancheto.IA...</p>
    </div>
  </div>
);

// =============================================================
// COMPONENTE PRINCIPAL: APP
// =============================================================
const App = () => {
  return (
    // ErrorBoundary do Sentry: captura erros de renderização React
    // e os envia automaticamente para o painel do Sentry
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="flex items-center justify-center min-h-screen bg-surface p-8">
          <div className="bg-surface-card border border-surface-border rounded-xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-white text-xl font-semibold mb-2">
              Algo deu errado
            </h1>
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

        {/* Container global de notificações Toast (visível em todas as páginas) */}
        <ToastContainer />

        {/* Suspense: exibe tela de carregamento enquanto as páginas são importadas */}
        <Suspense fallback={<TelaCarregando />}>
          <Routes>
            {/* --- ROTA PÚBLICA: LOGIN --- */}
            <Route path="/login" element={<PaginaLogin />} />

            {/* --- ROTA PRIVADA: CRM PADRÃO (clientes comuns) --- */}
            <Route
              path="/crm/*"
              element={
                <RotaPrivada>
                  <PaginaCRM />
                </RotaPrivada>
              }
            />

            {/* --- ROTA EXCLUSIVA: PAINEL ADMINISTRATIVO (Super Admin) ---
                Esta rota é INVISÍVEL para usuários comuns.
                Mesmo que alguém descubra a URL, será redirecionado para /crm. */}
            <Route
              path="/admin/*"
              element={
                <RotaSuperAdmin>
                  <PaginaAdminPanel />
                </RotaSuperAdmin>
              }
            />

            {/* --- ROTA PADRÃO: Redireciona para o CRM --- */}
            <Route path="/" element={<Navigate to="/crm" replace />} />

            {/* --- ROTA 404: Qualquer URL não mapeada --- */}
            <Route
              path="*"
              element={
                <div className="flex items-center justify-center min-h-screen bg-surface">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
                    <p className="text-slate-400 mb-6">Página não encontrada</p>
                    <a href="/crm" className="text-primary-400 hover:text-primary-300 underline">
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

export default App;
