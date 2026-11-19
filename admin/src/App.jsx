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

          {/* Rotas administrativas sob /admin/* */}
          <Route
            path="/admin/*"
            element={
              <RotaSuperAdmin>
                <PaginaAdminPanel />
              </RotaSuperAdmin>
            }
          />

          {/* Redireciona a raiz para /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Redirecionamentos diretos caso alguém acesse /chat, /usuarios, etc. */}
          <Route path="/chat" element={<Navigate to="/admin/chat" replace />} />
          <Route path="/usuarios" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/clientes" element={<Navigate to="/admin/clientes" replace />} />
          <Route path="/planos" element={<Navigate to="/admin/planos" replace />} />
          <Route path="/seguranca" element={<Navigate to="/admin/seguranca" replace />} />
          <Route path="/monitoramento" element={<Navigate to="/admin/monitoramento" replace />} />
          <Route path="/tickets" element={<Navigate to="/admin/tickets" replace />} />

          {/* 404 / Fallback */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;

