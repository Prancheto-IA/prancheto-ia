// =============================================================
// PRANCHETO.IA - PÁGINA DE LOGIN
// Tela de autenticação unificada para todos os tipos de usuário.
//
// REDIRECIONAMENTO AUTOMÁTICO:
//   - super_admin  → /admin     (Painel Administrativo)
//   - Demais cargos → /dashboard (Dashboard do Cliente)
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';

const PaginaLogin = () => {
  const navigate = useNavigate();
  const { login, carregando, erroLogin } = useAuth();
  const { token, usuario } = useAuthStore();

  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Se já está autenticado, redireciona automaticamente
  useEffect(() => {
    if (token && usuario) {
      const destino = usuario.isSuperAdmin ? '/admin' : '/dashboard';
      navigate(destino, { replace: true });
    }
  }, [token, usuario, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email.trim(), senha);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      {/* Fundo com gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/30 via-surface to-surface pointer-events-none" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo e título */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-white">
            {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Card do formulário */}
        <div className="card animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campo de e-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                autoFocus
                disabled={carregando}
                className="input w-full"
              />
            </div>

            {/* Campo de senha */}
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={carregando}
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {mostrarSenha ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {erroLogin && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 animate-fade-in">
                <p className="text-red-400 text-sm">{erroLogin}</p>
              </div>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={carregando || !email || !senha}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {carregando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Rodapé */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Prancheto.IA © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default PaginaLogin;
