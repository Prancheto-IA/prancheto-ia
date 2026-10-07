// =============================================================
// PRANCHETO.IA - PÁGINA DE LOGIN (STITCH UI CODE.HTML)
// Tela de autenticação baseada rigorosamente no template code.html
// com suporte total ao React Hooks, useAuth, useAuthStore e redirecionamento.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';

const PaginaLogin = () => {
  const navigate = useNavigate();
  const { login, carregando, erroLogin } = useAuth();
  const { token, usuario } = useAuthStore();

  const [modo, setModo]                 = useState('login'); // 'login' | 'cadastro'
  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar]           = useState(true);

  // Redirecionamento automático se já estiver autenticado
  useEffect(() => {
    if (token && usuario) {
      const destino = usuario.isSuperAdmin ? '/admin' : '/dashboard';
      navigate(destino, { replace: true });
    }
  }, [token, usuario, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !senha) return;
    await login(email.trim(), senha);
  };

  return (
    <div className="bg-[#dbe7e1] min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-800 selection:bg-emerald-200 selection:text-[#07241c] pb-8">
      {/* BEGIN: MainContainer */}
      <main className="w-full max-w-[1240px] bg-white rounded-[2.5rem] shadow-modal overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[780px] border border-white/60 p-3">
        
        {/* BEGIN: LeftColumnAuthentication */}
        <section className="lg:col-span-6 flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-white" data-purpose="auth-panel">
          <div>
            {/* Top Branding */}
            <header className="flex items-center space-x-2.5 mb-10">
              <div className="w-8 h-8 rounded-lg bg-[#0e382c] flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#07241c]">
                Prancheto<span className="text-emerald-600">.IA</span>
              </span>
            </header>

            {/* Welcome Title & Subtitle */}
            <div className="text-center max-w-sm mx-auto mb-7">
              <h1 className="text-2xl sm:text-[1.75rem] font-bold text-slate-900 tracking-tight mb-2" id="form-heading">
                {modo === 'login' ? 'Boas-vindas ao Prancheto.IA' : 'Crie sua conta no Prancheto.IA'}
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed" id="form-subheading">
                {modo === 'login'
                  ? 'Inicie sua experiência fazendo login ou criando sua conta gratuita na plataforma.'
                  : 'Junte-se à nossa comunidade e comece a criar com IA hoje mesmo.'}
              </p>
            </div>

            {/* Segmented Tab Control (Sign In / Sign Up) */}
            <div className="bg-slate-100/90 p-1 rounded-2xl flex max-w-sm mx-auto mb-8 text-sm font-medium border border-slate-200/60" role="tablist">
              <button
                type="button"
                id="tab-login"
                role="tab"
                aria-selected={modo === 'login'}
                onClick={() => setModo('login')}
                className={`flex-1 py-2.5 rounded-xl transition-all duration-200 ${
                  modo === 'login'
                    ? 'bg-white text-[#07241c] font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                id="tab-register"
                role="tab"
                aria-selected={modo === 'cadastro'}
                onClick={() => setModo('cadastro')}
                className={`flex-1 py-2.5 rounded-xl transition-all duration-200 ${
                  modo === 'cadastro'
                    ? 'bg-white text-[#07241c] font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cadastrar-se
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto" data-purpose="login-form">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide" htmlFor="email">
                  Endereço de E-mail <span className="text-emerald-700">*</span>
                </label>
                <div className="input-field relative flex items-center border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white transition-all">
                  <svg className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm border-0 p-0 text-slate-800 placeholder-slate-400 focus:ring-0 outline-none"
                    placeholder="seu.email@exemplo.com"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide" htmlFor="password">
                  Senha <span className="text-emerald-700">*</span>
                </label>
                <div className="input-field relative flex items-center border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white transition-all">
                  <svg className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <input
                    id="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full text-sm border-0 p-0 text-slate-800 placeholder-slate-400 focus:ring-0 outline-none pr-8"
                    placeholder="Digite sua senha de acesso"
                    required
                    disabled={carregando}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    tabIndex={-1}
                    title="Alternar visibilidade"
                    className="text-slate-400 hover:text-slate-600 focus:outline-none ml-2 absolute right-3"
                  >
                    <svg className="w-4 h-4" fill="none" id="eye-icon" stroke="currentColor" viewBox="0 0 24 24">
                      {mostrarSenha ? (
                        <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908A9.972 9.972 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      ) : (
                        <>
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {/* Remember & Forgot Password Link */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#0e382c] focus:ring-[#0e382c] focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-emerald-800 hover:text-[#0e382c] transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              {/* Mensagem de Erro do Auth */}
              {erroLogin && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                  </svg>
                  <span>{erroLogin}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={carregando || !email.trim() || !senha}
                className="w-full py-3.5 px-4 bg-[#0e382c] hover:bg-[#07241c] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition duration-150 ease-in-out shadow-sm shadow-[#0e382c]/20 active:scale-[0.99] flex items-center justify-center space-x-2"
              >
                {carregando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>{modo === 'login' ? 'Entrar na Plataforma' : 'Criar Minha Conta'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Social Auth Divider */}
            <div className="max-w-sm mx-auto my-6 flex items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="px-3 text-xs text-slate-400 uppercase tracking-wider font-medium">Ou continue com</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Social Buttons Grid */}
            <div className="max-w-xs mx-auto flex items-center justify-center gap-3" data-purpose="social-login">
              {/* Google */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com Google">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"></path>
                </svg>
              </button>

              {/* Apple */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com Apple">
                <svg className="w-5 h-5 text-slate-900 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.76 1.04-1.82.92-2.88-.9.04-1.99.6-2.63 1.36-.57.65-1.07 1.74-.93 2.77 1 .08 2.02-.49 2.64-1.25z"></path>
                </svg>
              </button>

              {/* Facebook */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com Facebook">
                <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path>
                </svg>
              </button>

              {/* X (Twitter) */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com X">
                <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Footer Copyright and Legal */}
          <footer className="pt-8 border-t border-slate-100 mt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 pb-2">
            <p>Copyright © Prancheto.IA. Todos os direitos reservados.</p>
            <div className="flex items-center space-x-3">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-emerald-700 transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-emerald-700 transition-colors">Política de Privacidade</a>
            </div>
          </footer>
        </section>
        {/* END: LeftColumnAuthentication */}

        {/* BEGIN: RightColumnHeroVisual */}
        <section className="lg:col-span-6 relative bg-gradient-to-b from-[#08261e] to-[#0e382c] p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden text-white hero-grid-pattern rounded-[2.5rem]" data-purpose="hero-panel">
          {/* Top Ambient Decorative Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Floating App Showcase Cards Container */}
          <div className="relative w-full max-w-[440px] mx-auto pt-4 pb-8 min-h-[360px] flex items-center justify-center" data-purpose="floating-cards-showcase">
            {/* Background Card (Financial Plan / Metrics) */}
            <article className="absolute -top-1 left-2 sm:left-4 w-60 sm:w-64 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 tracking-tight">Plano de Criação</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Este Mês</span>
              </div>
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-full donut-visual p-[7px] flex items-center justify-center flex-shrink-0">
                  <div className="w-full h-full bg-white rounded-full"></div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">Disponível em IA</div>
                  <div className="text-base font-extrabold text-slate-900">R$ 2.450,00</div>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Produção</span>
                    <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Buffer</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#0e382c] text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide">
                Explorar Painel Completo
              </div>
            </article>

            {/* Right Overlapping Card (AI Flow / Goals) */}
            <article className="absolute top-16 right-0 sm:-right-2 w-56 sm:w-60 bg-white/95 text-slate-900 rounded-2xl p-3.5 shadow-floating-card border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">Fluxo de Trabalho IA</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] text-slate-500">Geração de Design System</p>
              <div className="flex justify-between items-baseline my-1">
                <span className="text-sm font-bold text-slate-900">1.920 <span className="text-[10px] font-normal text-slate-400">/ 2.500</span></span>
                <span className="text-[10px] font-bold text-emerald-600">82%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '82%' }}></div>
              </div>
            </article>

            {/* Front Lower Card (Team Performance) */}
            <article className="relative z-15 mt-28 -ml-6 sm:-ml-12 w-64 sm:w-72 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Alocação de Projetos</span>
                  <span className="text-base font-extrabold text-slate-900">R$ 17.366,00</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
                  ↑ 12%
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-2 mb-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Design System 2.0</span>
                  <span className="font-bold text-slate-800">R$ 7.100</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Render 3D &amp; E-commerce</span>
                  <span className="font-bold text-slate-800">R$ 5.400</span>
                </div>
              </div>
              <button type="button" className="w-full bg-slate-900 hover:bg-[#0e382c] text-white rounded-lg py-1.5 text-[11px] font-medium transition-colors">
                Revisar Alocações
              </button>
            </article>
          </div>

          {/* Value Proposition Header & Content */}
          <div className="relative z-10 text-center max-w-lg mx-auto mt-4 mb-2">
            {/* Floating Brand Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-lg">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-[1.85rem] font-bold text-white tracking-tight leading-snug mb-3">
              Um Hub Unificado para Design Inteligente e Decisões Ágeis
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed font-normal max-w-md mx-auto">
              O Prancheto.IA capacita times modernos com uma central completa de prototipagem, automação e inteligência artificial para acelerar seu fluxo criativo.
            </p>
          </div>

          {/* Carousel / Step Indicator Pills */}
          <div aria-label="Indicadores de slides" className="flex justify-center items-center gap-2 pt-4 pb-1" data-purpose="carousel-pills">
            <span className="w-10 h-1 bg-white rounded-full transition-all"></span>
            <span className="w-10 h-1 bg-white/20 hover:bg-white/40 rounded-full cursor-pointer transition-all"></span>
            <span className="w-10 h-1 bg-white/20 hover:bg-white/40 rounded-full cursor-pointer transition-all"></span>
          </div>
        </section>
        {/* END: RightColumnHeroVisual */}

      </main>
      {/* END: MainContainer */}
    </div>
  );
};

export default PaginaLogin;
