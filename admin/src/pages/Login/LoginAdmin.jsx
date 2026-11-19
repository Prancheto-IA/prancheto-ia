// =============================================================
// PRANCHETO.IA - LOGIN SUPER ADMIN (GESTÃO)
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Mail01Icon,
  LockKeyIcon,
  ViewIcon,
  ViewOffSlashIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

const LoginAdmin = () => {
  const navigate = useNavigate();
  const { login, carregando, erroLogin } = useAuth();
  const { token, usuario } = useAuthStore();

  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Redirecionamento se já autenticado como Super Admin
  useEffect(() => {
    if (token && usuario?.isSuperAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [token, usuario, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) return;
    await login(email.trim(), senha);
  };

  return (
    <div className="bg-[#dbe7e1] min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 selection:bg-emerald-200 selection:text-[#07241c]">
      <main className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8 sm:p-10 border border-white/60">
        {/* Header */}
        <header className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0e382c] text-[#d4ec9d] flex items-center justify-center shadow-md mb-4">
            <HugeiconsIcon icon={LockKeyIcon} size={24} strokeWidth={2} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#07241c]">
              Prancheto<span className="text-emerald-600">.IA</span>
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#0e382c] text-[#d4ec9d]">
              Gestão
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-2">
            Painel Super Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Área de governança e gestão global da plataforma.
          </p>
        </header>

        {/* Mensagem de Erro */}
        {erroLogin && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{erroLogin}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              E-mail corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <HugeiconsIcon icon={Mail01Icon} size={16} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@prancheto.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e382c]/20 focus:border-[#0e382c] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Senha de acesso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <HugeiconsIcon icon={LockKeyIcon} size={16} />
              </div>
              <input
                type={mostrarSenha ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e382c]/20 focus:border-[#0e382c] transition-all"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <HugeiconsIcon icon={mostrarSenha ? ViewOffSlashIcon : ViewIcon} size={16} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 py-3 px-4 bg-[#0e382c] hover:bg-[#09271e] text-[#d4ec9d] font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-[#d4ec9d] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Acessar Painel</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>

        <footer className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Acesso monitorado e registrado sob protocolo de auditoria.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LoginAdmin;

