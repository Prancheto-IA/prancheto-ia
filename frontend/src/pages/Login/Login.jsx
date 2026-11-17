// =============================================================
// PRANCHETO.IA - PÁGINA DE LOGIN (STITCH UI CODE.HTML)
// Tela de autenticação baseada rigorosamente no template code.html
// com suporte total ao React Hooks, useAuth, useAuthStore e redirecionamento.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useAuthStore } from '../../store/authStore.js';
import logoClaro from '@/assets/logo/Logo-LH.svg';
import logoEscuro from '@/assets/logo/Logo-LHW.svg';
import slide1Img from '@/assets/login/Login-Slide1.webp';
import slide2Img from '@/assets/login/Login-Slide2.webp';
import slide3Img from '@/assets/login/Login-Slide3.webp';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Mail01Icon,
  LockKeyIcon,
  ViewIcon,
  ViewOffSlashIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

// Lista de slides de imagem do painel lateral
const SLIDES_LOGIN = [
  {
    id: 1,
    imagem: slide1Img,
    alt: 'Previsão de Vendas - Antecipe resultados com inteligência e tome decisões mais estratégicas.',
  },
  {
    id: 2,
    imagem: slide2Img,
    alt: 'Atendimento Automatizado - Responda seus clientes 24/7 com inteligência, agilidade e mais eficiência.',
  },
  {
    id: 3,
    imagem: slide3Img,
    alt: 'Visão 360° de Metas - Acompanhe metas, resultados e desempenho da sua equipe em uma visão completa e estratégica.',
  },
];

const PaginaLogin = () => {
  const navigate = useNavigate();
  const { login, carregando, erroLogin } = useAuth();
  const { token, usuario } = useAuthStore();

  const [modo, setModo]                 = useState('login'); // 'login' | 'cadastro'
  const [email, setEmail]               = useState('');
  const [senha, setSenha]               = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar]           = useState(true);
  const [slideAtual, setSlideAtual]     = useState(0);
  const [pausado, setPausado]           = useState(false);

  // Alternância automática dos slides do banner (pausa ao passar o mouse)
  useEffect(() => {
    if (pausado || SLIDES_LOGIN.length <= 1) return;
    const timer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % SLIDES_LOGIN.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [pausado]);

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
    <div className="bg-brand-accent min-h-screen flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-6 xl:p-8 2xl:p-10 font-sans antialiased text-ink-primary selection:bg-brand-accent selection:text-brand-primary py-4 sm:py-6 lg:py-8">
      {/* BEGIN: MainContainer */}
      <main className="w-full max-w-md sm:max-w-lg lg:max-w-[1060px] xl:max-w-[1180px] 2xl:max-w-[1240px] bg-surface-card rounded-2xl sm:rounded-3xl lg:rounded-[2.25rem] xl:rounded-[2.5rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-white/80 p-2 sm:p-2.5 lg:p-3 my-auto transition-all duration-300">
        
        {/* BEGIN: LeftColumnAuthentication */}
        <section className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-7 xl:p-10 2xl:p-12 bg-surface-card" data-purpose="auth-panel">
          <div>
            {/* Top Branding com suporte a modo claro e escuro */}
            <header className="flex items-center mb-6 lg:mb-7 xl:mb-8">
              <img
                src={logoClaro}
                alt="Prancheto.IA"
                className="h-10 sm:h-11 w-auto max-w-[210px] object-contain select-none block dark:hidden"
              />
              <img
                src={logoEscuro}
                alt="Prancheto.IA"
                className="h-10 sm:h-11 w-auto max-w-[210px] object-contain select-none hidden dark:block"
              />
            </header>

            {/* Welcome Title & Subtitle */}
            <div className="text-center max-w-sm mx-auto mb-5 lg:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-[1.5rem] xl:text-[1.75rem] font-bold text-ink-primary tracking-tight mb-1.5" id="form-heading">
                {modo === 'login' ? 'Boas-vindas ao Prancheto.IA' : 'Crie sua conta no Prancheto.IA'}
              </h1>
              <p className="text-sm text-ink-secondary leading-relaxed" id="form-subheading">
                {modo === 'login'
                  ? 'Inicie sua experiência fazendo login ou criando sua conta gratuita na plataforma.'
                  : 'Junte-se à nossa comunidade e comece a criar com IA hoje mesmo.'}
              </p>
            </div>

            {/* Segmented Tab Control (Sign In / Sign Up) */}
            <div className="bg-surface p-1 rounded-2xl flex max-w-sm mx-auto mb-5 lg:mb-6 text-sm font-medium border border-surface-border" role="tablist">
              <button
                type="button"
                id="tab-login"
                role="tab"
                aria-selected={modo === 'login'}
                onClick={() => setModo('login')}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  modo === 'login'
                    ? 'bg-surface-card text-brand-primary font-semibold shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
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
                className={`flex-1 py-2 sm:py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                  modo === 'cadastro'
                    ? 'bg-surface-card text-brand-primary font-semibold shadow-sm'
                    : 'text-ink-secondary hover:text-ink-primary'
                }`}
              >
                Cadastrar-se
              </button>
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 max-w-sm mx-auto" data-purpose="login-form">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-primary tracking-wide" htmlFor="email">
                  Endereço de E-mail <span className="text-brand-secondary">*</span>
                </label>
                <div className="input-field relative flex items-center border border-surface-border rounded-xl px-3.5 py-2.5 bg-surface-subtle focus-within:bg-surface-card focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-accent/60 transition-all">
                  <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={1.8} className="text-ink-secondary mr-2.5 flex-shrink-0" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm border-0 bg-transparent p-0 text-ink-primary placeholder-ink-muted focus:ring-0 outline-none"
                    placeholder="seu.email@exemplo.com"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-ink-primary tracking-wide" htmlFor="password">
                  Senha <span className="text-brand-secondary">*</span>
                </label>
                <div className="input-field relative flex items-center border border-surface-border rounded-xl px-3.5 py-2.5 bg-surface-subtle focus-within:bg-surface-card focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-accent/60 transition-all">
                  <HugeiconsIcon icon={LockKeyIcon} size={16} strokeWidth={1.8} className="text-ink-secondary mr-2.5 flex-shrink-0" />
                  <input
                    id="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full text-sm border-0 bg-transparent p-0 text-ink-primary placeholder-ink-muted focus:ring-0 outline-none pr-8"
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
                    className="text-ink-secondary hover:text-ink-primary focus:outline-none ml-2 absolute right-3 cursor-pointer"
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
                <label className="flex items-center space-x-2 text-sm text-ink-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-surface-border accent-[#000D3D] focus:ring-brand-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors">
                  Esqueceu a senha?
                </a>
              </div>

              {/* Mensagem de Erro do Auth */}
              {erroLogin && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={1.8} className="flex-shrink-0" />
                  <span>{erroLogin}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={carregando || !email.trim() || !senha}
                className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition duration-150 ease-in-out shadow-sm active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
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
          </div>

          {/* Footer Copyright and Legal */}
          <footer className="pt-4 lg:pt-5 border-t border-surface-border mt-4 lg:mt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-[11px] text-ink-muted gap-2 pb-1">
            <p>Copyright © Prancheto.IA. Todos os direitos reservados.</p>
            <div className="flex items-center space-x-3">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-brand-secondary transition-colors">Termos de Uso</a>
              <span>•</span>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-brand-secondary transition-colors">Política de Privacidade</a>
            </div>
          </footer>
        </section>
        {/* END: LeftColumnAuthentication */}

        {/* BEGIN: RightColumnHeroVisual (Slide de Imagens Verticais) */}
        <section
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          className="hidden lg:flex lg:col-span-6 relative bg-slate-950 flex-col items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2rem] select-none min-h-[580px] lg:min-h-[640px]"
          data-purpose="hero-panel"
        >
          {/* Container de Imagens com transição suave */}
          <div className="relative w-full h-full min-h-[580px] lg:min-h-[640px] flex items-center justify-center overflow-hidden">
            {SLIDES_LOGIN.map((slide, idx) => (
              <img
                key={slide.id}
                src={slide.imagem}
                alt={slide.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                  slideAtual === idx
                    ? 'opacity-100 z-10 scale-100'
                    : 'opacity-0 z-0 scale-105 pointer-events-none'
                }`}
              />
            ))}
          </div>

          {/* Indicadores de slides (pills de navegação) */}
          {SLIDES_LOGIN.length > 1 && (
            <div
              aria-label="Indicadores de slides"
              className="absolute bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-2"
              data-purpose="carousel-pills"
            >
              {SLIDES_LOGIN.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideAtual(idx)}
                  aria-label={`Ir para o slide ${idx + 1}`}
                  title={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    slideAtual === idx
                      ? 'w-9 bg-white shadow-md'
                      : 'w-4 bg-white/40 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </section>
        {/* END: RightColumnHeroVisual */}

      </main>
      {/* END: MainContainer */}
    </div>
  );
};

export default PaginaLogin;
