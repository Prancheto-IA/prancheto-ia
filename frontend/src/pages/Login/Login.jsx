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
  AiBrain01Icon,
  BotIcon,
  Analytics01Icon,
  SparklesIcon,
  FlashIcon,
  CheckmarkCircle02Icon,
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
  const [slideAtual, setSlideAtual]     = useState(0);
  const [pausado, setPausado]           = useState(false);

  // Alternância automática dos slides do banner (pausa ao passar o mouse)
  useEffect(() => {
    if (pausado) return;
    const timer = setInterval(() => {
      setSlideAtual((prev) => (prev + 1) % 3);
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
            {/* Top Branding */}
            <header className="flex items-center space-x-2.5 mb-6 lg:mb-7 xl:mb-8">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-brand-primary">
                Prancheto<span className="text-brand-secondary">.IA</span>
              </span>
            </header>

            {/* Welcome Title & Subtitle */}
            <div className="text-center max-w-sm mx-auto mb-5 lg:mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-[1.5rem] xl:text-[1.75rem] font-bold text-ink-primary tracking-tight mb-1.5" id="form-heading">
                {modo === 'login' ? 'Boas-vindas ao Prancheto.IA' : 'Crie sua conta no Prancheto.IA'}
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed" id="form-subheading">
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
                <label className="block text-xs font-semibold text-ink-primary tracking-wide" htmlFor="email">
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
                <label className="block text-xs font-semibold text-ink-primary tracking-wide" htmlFor="password">
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
                <label className="flex items-center space-x-2 text-xs text-ink-secondary cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={(e) => setLembrar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-surface-border accent-[#000D3D] focus:ring-brand-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs font-semibold text-brand-secondary hover:text-brand-primary transition-colors">
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

        {/* BEGIN: RightColumnHeroVisual */}
        <section
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          className="hidden lg:flex lg:col-span-6 relative bg-gradient-to-br from-[#000D3D] via-[#001769] to-[#0455BF] p-6 lg:p-7 xl:p-10 2xl:p-12 flex-col justify-between overflow-hidden text-white hero-grid-pattern rounded-2xl sm:rounded-3xl lg:rounded-[2rem] select-none"
          data-purpose="hero-panel"
        >
          {/* Top Ambient Decorative Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#7338F2]/25 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-[#A36BF2]/20 rounded-full blur-3xl pointer-events-none"></div>

          {/* Floating App Showcase Cards Container */}
          <div
            key={`cards-${slideAtual}`}
            className="relative w-full max-w-[340px] xl:max-w-[400px] 2xl:max-w-[440px] mx-auto pt-2 pb-4 min-h-[280px] xl:min-h-[320px] 2xl:min-h-[350px] flex items-center justify-center animate-fade-in"
            data-purpose="floating-cards-showcase"
          >
            {/* SLIDE 0: PIPELINE & PREVISÃO DE VENDAS COM IA */}
            {slideAtual === 0 && (
              <>
                {/* Background Card (Pipeline & Volume Comercial) */}
                <article className="absolute -top-1 left-1 xl:left-4 w-52 xl:w-60 2xl:w-64 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-surface-border">
                    <span className="text-xs font-bold text-ink-primary tracking-tight">Funil de Vendas Ativo</span>
                    <span className="text-[10px] bg-brand-accent text-brand-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse"></span>
                      IA Preditiva
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-full donut-visual p-[6px] xl:p-[7px] flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-black text-brand-primary">92%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] xl:text-[10px] text-ink-muted font-medium leading-none">Negociações no Mês</div>
                      <div className="text-sm xl:text-base font-extrabold text-ink-primary">R$ 184.500,00</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-ink-secondary font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>Fechamento</span>
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-violet"></span>Proposta</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-brand-primary text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide flex items-center justify-center gap-1.5">
                    <HugeiconsIcon icon={FlashIcon} size={12} className="text-brand-accent" />
                    <span>Previsão de Fechamento: +34%</span>
                  </div>
                </article>

                {/* Right Overlapping Card (Lead Scoring por IA) */}
                <article className="absolute top-12 xl:top-14 2xl:top-16 right-0 xl:-right-2 w-48 xl:w-56 2xl:w-60 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-3.5 shadow-xl border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-primary">Lead Score por IA</span>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-accent px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>
                      98 / 100
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-ink-primary truncate">TechCorp Enterprise</p>
                  <div className="flex justify-between items-baseline my-1">
                    <span className="text-xs font-bold text-ink-primary">R$ 48.000 <span className="text-[10px] font-normal text-ink-muted">/ ano</span></span>
                    <span className="text-[9px] font-bold text-white bg-brand-purple px-1.5 py-0.5 rounded">Lead Quente</span>
                  </div>
                  <div className="w-full bg-surface h-1.5 xl:h-2 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-gradient-to-r from-[#0455BF] to-[#7338F2] h-full rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Insight & Ação Recomendada) */}
                <article className="relative z-15 mt-20 xl:mt-24 2xl:mt-28 -ml-4 xl:-ml-8 2xl:-ml-12 w-56 xl:w-64 2xl:w-72 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted font-bold block">Insight Prancheto IA</span>
                      <span className="text-xs xl:text-sm font-extrabold text-ink-primary">Oportunidade no Ponto</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-accent px-2 py-0.5 rounded-full flex items-center gap-1">
                      <HugeiconsIcon icon={SparklesIcon} size={12} className="text-brand-purple" />
                      Agir Agora
                    </span>
                  </div>
                  <p className="text-[10px] xl:text-[11px] text-ink-secondary leading-snug mb-2.5 border-t border-surface-border pt-2">
                    Roberto (Decisor) abriu a proposta 3x hoje. Momento ideal para contato direto.
                  </p>
                  <div className="w-full bg-brand-primary text-white rounded-lg py-1.5 text-[10px] xl:text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-brand-primary-hover">
                    <span>Disparar Follow-up Inteligente</span>
                  </div>
                </article>
              </>
            )}

            {/* SLIDE 1: ATENDIMENTO 24/7 & QUALIFICAÇÃO COM CHAT IA */}
            {slideAtual === 1 && (
              <>
                {/* Background Card (Métricas do Agente IA) */}
                <article className="absolute -top-1 left-1 xl:left-4 w-52 xl:w-60 2xl:w-64 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-surface-border">
                    <span className="text-xs font-bold text-ink-primary tracking-tight">Pranchetinho IA</span>
                    <span className="text-[10px] bg-brand-accent text-brand-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary animate-ping"></span>
                      Online 24/7
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-full bg-brand-accent text-brand-primary flex items-center justify-center flex-shrink-0 border border-surface-border">
                      <HugeiconsIcon icon={BotIcon} size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-[9px] xl:text-[10px] text-ink-muted font-medium leading-none">Tempo de Resposta</div>
                      <div className="text-sm xl:text-base font-extrabold text-ink-primary">&lt; 1.2 segundos</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-ink-secondary font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>1.840 conversas/mês</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-brand-primary text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide flex items-center justify-center gap-1">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="text-brand-accent" />
                    <span>96% de Satisfação</span>
                  </div>
                </article>

                {/* Right Overlapping Card (Lead Qualificado Automático) */}
                <article className="absolute top-12 xl:top-14 2xl:top-16 right-0 xl:-right-2 w-48 xl:w-56 2xl:w-60 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-3.5 shadow-xl border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-primary">Lead Qualificado</span>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-brand-secondary" />
                  </div>
                  <p className="text-[11px] font-semibold text-ink-primary">Mariana Souza</p>
                  <p className="text-[9px] text-ink-muted mb-1.5">FinTech Brasil • Decisora</p>
                  <div className="bg-brand-accent text-brand-primary rounded-lg p-2 text-[10px] font-medium leading-tight mb-1">
                    "Demonstração agendada para amanhã às 10h via IA"
                  </div>
                  <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-brand-secondary h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Mini Chat Interativo IA) */}
                <article className="relative z-15 mt-20 xl:mt-24 2xl:mt-28 -ml-4 xl:-ml-8 2xl:-ml-12 w-56 xl:w-64 2xl:w-72 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-surface-border">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
                      <span className="text-[10px] xl:text-[11px] font-bold text-ink-primary">Triagem Comercial com IA</span>
                    </div>
                    <span className="text-[9px] bg-brand-accent text-brand-primary px-1.5 py-0.5 rounded font-mono font-semibold">Chat IA</span>
                  </div>
                  <div className="space-y-1.5 xl:space-y-2 mb-2">
                    <div className="bg-surface text-ink-primary rounded-xl rounded-tl-sm p-1.5 xl:p-2 text-[10px] leading-relaxed">
                      "Olá! Preciso de um CRM para equipe de 15 pessoas."
                    </div>
                    <div className="bg-brand-primary text-brand-accent rounded-xl rounded-tr-sm p-1.5 xl:p-2 text-[10px] leading-relaxed">
                      "Temos o plano ideal! Quer agendar demo de 15 min?"
                    </div>
                  </div>
                  <div className="w-full bg-brand-accent text-brand-primary border border-surface-border rounded-lg py-1 px-2 text-center text-[10px] font-semibold">
                    ✓ Lead Direcionado ao SDR
                  </div>
                </article>
              </>
            )}

            {/* SLIDE 2: GESTÃO 360°, METAS & RETENÇÃO */}
            {slideAtual === 2 && (
              <>
                {/* Background Card (Metas Comerciais & Batimento) */}
                <article className="absolute -top-1 left-1 xl:left-4 w-52 xl:w-60 2xl:w-64 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-surface-border">
                    <span className="text-xs font-bold text-ink-primary tracking-tight">Meta Comercial (Q4)</span>
                    <span className="text-[10px] bg-brand-accent text-brand-primary px-2 py-0.5 rounded-full font-semibold">89% Atingida</span>
                  </div>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-11 h-11 xl:w-12 xl:h-12 rounded-full donut-visual p-[6px] xl:p-[7px] flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-black text-brand-primary">89%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] xl:text-[10px] text-ink-muted font-medium leading-none">Receita Recorrente</div>
                      <div className="text-sm xl:text-base font-extrabold text-ink-primary">R$ 420.000,00</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-ink-secondary font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-secondary"></span>Meta: R$ 480k</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-brand-primary text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide">
                    Previsão de Superação: 104%
                  </div>
                </article>

                {/* Right Overlapping Card (Health Score da Carteira) */}
                <article className="absolute top-12 xl:top-14 2xl:top-16 right-0 xl:-right-2 w-48 xl:w-56 2xl:w-60 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-3.5 shadow-xl border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-ink-primary">Saúde da Carteira</span>
                    <span className="w-2 h-2 rounded-full bg-brand-purple animate-pulse"></span>
                  </div>
                  <p className="text-[10px] text-ink-secondary">NPS Geral &amp; Retenção</p>
                  <div className="flex justify-between items-baseline my-1">
                    <span className="text-sm font-bold text-ink-primary">94 <span className="text-[10px] font-normal text-ink-muted">/ 100</span></span>
                    <span className="text-[10px] font-bold text-brand-secondary">Churn 0.5%</span>
                  </div>
                  <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-[#0455BF] to-[#A36BF2] h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Follow-ups & Tarefas Comerciais) */}
                <article className="relative z-15 mt-20 xl:mt-24 2xl:mt-28 -ml-4 xl:-ml-8 2xl:-ml-12 w-56 xl:w-64 2xl:w-72 bg-white/95 text-ink-primary rounded-xl xl:rounded-2xl p-3 xl:p-4 shadow-xl border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-ink-muted font-bold block">Follow-ups do Dia</span>
                      <span className="text-xs xl:text-sm font-extrabold text-ink-primary">12 Atividades</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-primary bg-brand-accent px-2 py-0.5 rounded-full flex items-center">
                      ↑ 100% no prazo
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[10px] xl:text-[11px] border-t border-surface-border pt-2 mb-2">
                    <div className="flex justify-between items-center text-ink-primary">
                      <span className="font-medium flex items-center gap-1.5 truncate">
                        <span className="text-brand-secondary font-bold">✓</span> Assinatura de Contrato
                      </span>
                      <span className="font-bold text-ink-primary text-[10px]">R$ 36k</span>
                    </div>
                    <div className="flex justify-between items-center text-ink-primary">
                      <span className="font-medium flex items-center gap-1.5 truncate">
                        <span className="text-brand-purple font-bold">◷</span> Demo Comercial Agendada
                      </span>
                      <span className="font-bold text-ink-primary text-[10px]">15:00</span>
                    </div>
                  </div>
                  <div className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg py-1.5 text-[10px] xl:text-[11px] font-medium transition-colors text-center cursor-pointer">
                    Acessar Painel de Tarefas
                  </div>
                </article>
              </>
            )}
          </div>

          {/* Value Proposition Header & Content */}
          <div
            key={`text-${slideAtual}`}
            className="relative z-10 text-center max-w-lg mx-auto mt-2 xl:mt-3 mb-1 animate-fade-in"
          >
            {/* Floating Brand Icon Badge */}
            <div className="inline-flex items-center justify-center w-10 h-10 xl:w-11 xl:h-11 rounded-xl xl:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-2.5 xl:mb-3 shadow-lg transition-transform duration-300 hover:scale-110">
              {slideAtual === 0 && <HugeiconsIcon icon={AiBrain01Icon} size={22} strokeWidth={2} className="text-brand-accent" />}
              {slideAtual === 1 && <HugeiconsIcon icon={BotIcon} size={22} strokeWidth={2} className="text-brand-accent" />}
              {slideAtual === 2 && <HugeiconsIcon icon={Analytics01Icon} size={22} strokeWidth={2} className="text-brand-accent" />}
            </div>

            {slideAtual === 0 && (
              <>
                <h2 className="text-lg xl:text-xl 2xl:text-2xl font-bold text-white tracking-tight leading-snug mb-1.5">
                  Pipeline Comercial &amp; Previsão de Vendas com IA
                </h2>
                <p className="text-[11px] xl:text-xs 2xl:text-sm text-brand-accent/85 leading-relaxed font-normal max-w-sm xl:max-w-md mx-auto">
                  Monitore negociações em tempo real, priorize os leads mais quentes e impulsione conversões com recomendações preditivas automatizadas.
                </p>
              </>
            )}

            {slideAtual === 1 && (
              <>
                <h2 className="text-lg xl:text-xl 2xl:text-2xl font-bold text-white tracking-tight leading-snug mb-1.5">
                  Atendimento Automatizado &amp; Qualificação 24/7
                </h2>
                <p className="text-[11px] xl:text-xs 2xl:text-sm text-brand-accent/85 leading-relaxed font-normal max-w-sm xl:max-w-md mx-auto">
                  O Pranchetinho IA engaja clientes instantaneamente, esclarece dúvidas, qualifica oportunidades e agenda reuniões diretamente na sua agenda.
                </p>
              </>
            )}

            {slideAtual === 2 && (
              <>
                <h2 className="text-lg xl:text-xl 2xl:text-2xl font-bold text-white tracking-tight leading-snug mb-1.5">
                  Visão 360°, Metas &amp; Retenção de Clientes
                </h2>
                <p className="text-[11px] xl:text-xs 2xl:text-sm text-brand-accent/85 leading-relaxed font-normal max-w-sm xl:max-w-md mx-auto">
                  Acompanhe metas comerciais, saúde da carteira de clientes, automações de tarefas e follow-ups em um único ecossistema integrado.
                </p>
              </>
            )}
          </div>

          {/* Carousel / Step Indicator Pills */}
          <div
            aria-label="Indicadores de slides"
            className="flex justify-center items-center gap-2 pt-2 xl:pt-3 pb-1"
            data-purpose="carousel-pills"
          >
            {[0, 1, 2].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideAtual(idx)}
                aria-label={`Ir para o slide ${idx + 1}`}
                title={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                  slideAtual === idx
                    ? 'w-10 bg-white shadow-sm'
                    : 'w-7 bg-white/25 hover:bg-white/55 cursor-pointer'
                }`}
              />
            ))}
          </div>
        </section>
        {/* END: RightColumnHeroVisual */}

      </main>
      {/* END: MainContainer */}
    </div>
  );
};

export default PaginaLogin;
