// =============================================================
// PRANCHETO.IA - PÁGINA DE LOGIN (STITCH UI CODE.HTML)
// Tela de autenticação baseada rigorosamente no template code.html
// com suporte total ao React Hooks, useAuth, useAuthStore e redirecionamento.
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
  GoogleIcon,
  AppleIcon,
  Facebook01Icon,
  NewTwitterIcon,
  SourceCodeIcon,
} from '@hugeicons/core-free-icons';

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
                  <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.8} className="text-slate-400 mr-2.5 flex-shrink-0" />
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
                  <HugeiconsIcon icon={LockKeyIcon} size={16} strokeWidth={1.8} className="text-slate-400 mr-2.5 flex-shrink-0" />
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
                    {mostrarSenha ? (
                      <HugeiconsIcon icon={ViewOffSlashIcon} size={16} strokeWidth={1.8} />
                    ) : (
                      <HugeiconsIcon icon={ViewIcon} size={16} strokeWidth={1.8} />
                    )}
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
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.8} className="flex-shrink-0" />
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
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} />
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
                <HugeiconsIcon icon={GoogleIcon} size={20} strokeWidth={1.8} />
              </button>

              {/* Apple */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com Apple">
                <HugeiconsIcon icon={AppleIcon} size={20} strokeWidth={1.8} className="text-slate-900" />
              </button>

              {/* Facebook */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com Facebook">
                <HugeiconsIcon icon={Facebook01Icon} size={20} strokeWidth={1.8} className="text-[#1877F2]" />
              </button>

              {/* X (Twitter) */}
              <button type="button" className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-colors shadow-2xs" title="Continuar com X">
                <HugeiconsIcon icon={NewTwitterIcon} size={18} strokeWidth={1.8} className="text-slate-900" />
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
              <HugeiconsIcon icon={SourceCodeIcon} size={24} strokeWidth={2} className="text-emerald-400" />
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
