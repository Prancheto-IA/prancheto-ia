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
import { useTema } from '../../hooks/useTema.js';

const PaginaLogin = () => {
  const navigate = useNavigate();
  const { login, carregando, erroLogin } = useAuth();
  const { token, usuario } = useAuthStore();
  const { temaEscuro, alternarTema } = useTema();

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
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Fundo com gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/30 via-transparent to-transparent pointer-events-none" />

      {/* Botão de tema no canto superior direito */}
      <button
        onClick={alternarTema}
        className="fixed top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 border"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderColor: 'var(--color-surface-border)',
          color: 'var(--color-text-secondary)',
        }}
        title={temaEscuro ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {temaEscuro ? '☀️' : '🌙'}
      </button>

      <div className="relative w-full max-w-md px-4">
        {/* Logo e título */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="text-5xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Card do formulário */}
        <div
          className="rounded-xl p-6 border animate-slide-in"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            borderColor: 'var(--color-surface-border)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Campo de e-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
                className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 transition-colors"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-surface-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Campo de senha */}
            <div>
              <label
                htmlFor="senha"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
                  className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 transition-colors pr-10"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-surface-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
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
              className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
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
        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-secondary)' }}>
          Prancheto.IA © {new Date().getFullYear()} — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};

export default PaginaLogin;
