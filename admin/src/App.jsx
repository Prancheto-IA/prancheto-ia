// =============================================================
// PRANCHETO.IA - APLICAÇÃO DE GESTÃO (SUPER ADMIN)
// =============================================================

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import Toast from './components/ui/Toast.jsx';

const PaginaLogin = lazy(() => import('./pages/Login/Login.jsx'));
const PaginaAdminPanel = lazy(() => import('./pages/AdminPanel/AdminPanel.jsx'));

// Guarda de rota: somente Super Admin autenticado
const RotaSuperAdmin = ({ children }) => {
  const { token, usuario } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (!usuario?.isSuperAdmin) return <Navigate to="/login" replace />;
  return children;
};

const TelaCarregando = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#F2F5F3]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-[#687770]">Carregando Painel de Gestão...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Toast />
      <Suspense fallback={<TelaCarregando />}>
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<PaginaLogin />} />

          {/* Rotas administrativas sob /admin/*, /tickets/* e /seguranca/* */}
          <Route
            path="/admin/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/tickets/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/seguranca/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/monitoramento/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/chat/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/planos/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/clientes/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />
          <Route
            path="/usuarios/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />

          {/* Redireciona a raiz para /chat */}
          <Route path="/" element={<Navigate to="/chat" replace />} />

          {/* Redirecionamentos diretos e rotas legadas */}
          <Route path="/admin/chat" element={<Navigate to="/chat" replace />} />
          <Route path="/admin/usuarios" element={<Navigate to="/usuarios" replace />} />
          <Route path="/admin/clientes" element={<Navigate to="/clientes" replace />} />
          <Route path="/admin/planos" element={<Navigate to="/planos" replace />} />
          <Route path="/admin/seguranca" element={<Navigate to="/seguranca" replace />} />
          <Route path="/admin/monitoramento" element={<Navigate to="/monitoramento" replace />} />
          <Route path="/admin/tickets" element={<Navigate to="/tickets" replace />} />

          {/* 404 / Fallback */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

