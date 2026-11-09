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
  Task01Icon,
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
        <section
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          className="lg:col-span-6 relative bg-gradient-to-b from-[#08261e] to-[#0e382c] p-8 sm:p-12 lg:p-14 flex flex-col justify-between overflow-hidden text-white hero-grid-pattern rounded-[2.5rem] select-none"
          data-purpose="hero-panel"
        >
          {/* Top Ambient Decorative Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 -left-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none"></div>

          {/* Floating App Showcase Cards Container */}
          <div
            key={`cards-${slideAtual}`}
            className="relative w-full max-w-[440px] mx-auto pt-4 pb-8 min-h-[360px] flex items-center justify-center animate-fade-in"
            data-purpose="floating-cards-showcase"
          >
            {/* SLIDE 0: PIPELINE & PREVISÃO DE VENDAS COM IA */}
            {slideAtual === 0 && (
              <>
                {/* Background Card (Pipeline & Volume Comercial) */}
                <article className="absolute -top-1 left-2 sm:left-4 w-60 sm:w-64 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">Funil de Vendas Ativo</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      IA Preditiva
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full donut-visual p-[7px] flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-black text-emerald-700">92%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium leading-none">Negociações no Mês</div>
                      <div className="text-base font-extrabold text-slate-900">R$ 184.500,00</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Fechamento</span>
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Proposta</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0e382c] text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide flex items-center justify-center gap-1.5">
                    <HugeiconsIcon icon={FlashIcon} size={12} className="text-emerald-300" />
                    <span>Previsão de Fechamento: +34%</span>
                  </div>
                </article>

                {/* Right Overlapping Card (Lead Scoring por IA) */}
                <article className="absolute top-16 right-0 sm:-right-2 w-56 sm:w-60 bg-white/95 text-slate-900 rounded-2xl p-3.5 shadow-floating-card border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Lead Score por IA</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      98 / 100
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 truncate">TechCorp Enterprise</p>
                  <div className="flex justify-between items-baseline my-1">
                    <span className="text-xs font-bold text-slate-900">R$ 48.000 <span className="text-[10px] font-normal text-slate-400">/ ano</span></span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">Lead Quente</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Insight & Ação Recomendada) */}
                <article className="relative z-15 mt-28 -ml-6 sm:-ml-12 w-64 sm:w-72 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Insight Prancheto IA</span>
                      <span className="text-sm font-extrabold text-slate-900">Oportunidade no Ponto</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <HugeiconsIcon icon={SparklesIcon} size={12} className="text-emerald-600" />
                      Agir Agora
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug mb-3 border-t border-slate-100 pt-2">
                    Roberto (Decisor) abriu a proposta 3x hoje. Momento ideal para contato direto.
                  </p>
                  <div className="w-full bg-[#0e382c] text-white rounded-lg py-1.5 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#07241c]">
                    <span>Disparar Follow-up Inteligente</span>
                  </div>
                </article>
              </>
            )}

            {/* SLIDE 1: ATENDIMENTO 24/7 & QUALIFICAÇÃO COM CHAT IA */}
            {slideAtual === 1 && (
              <>
                {/* Background Card (Métricas do Agente IA) */}
                <article className="absolute -top-1 left-2 sm:left-4 w-60 sm:w-64 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">Pranchetinho IA</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Online 24/7
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200">
                      <HugeiconsIcon icon={BotIcon} size={24} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium leading-none">Tempo de Resposta</div>
                      <div className="text-base font-extrabold text-slate-900">&lt; 1.2 segundos</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>1.840 conversas no mês</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0e382c] text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide flex items-center justify-center gap-1">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} className="text-emerald-300" />
                    <span>96% de Satisfação dos Clientes</span>
                  </div>
                </article>

                {/* Right Overlapping Card (Lead Qualificado Automático) */}
                <article className="absolute top-16 right-0 sm:-right-2 w-56 sm:w-60 bg-white/95 text-slate-900 rounded-2xl p-3.5 shadow-floating-card border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Lead Qualificado</span>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800">Mariana Souza</p>
                  <p className="text-[9px] text-slate-400 mb-1.5">FinTech Brasil • Decisora</p>
                  <div className="bg-emerald-50 text-emerald-800 rounded-lg p-2 text-[10px] font-medium leading-tight mb-1">
                    "Demonstração agendada para amanhã às 10h via IA"
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Mini Chat Interativo IA) */}
                <article className="relative z-15 mt-28 -ml-6 sm:-ml-12 w-64 sm:w-72 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-[11px] font-bold text-slate-800">Triagem Comercial com IA</span>
                    </div>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">Chat IA</span>
                  </div>
                  <div className="space-y-2 mb-2.5">
                    <div className="bg-slate-100 text-slate-700 rounded-xl rounded-tl-sm p-2 text-[10px] leading-relaxed">
                      "Olá! Preciso de um CRM para equipe comercial de 15 pessoas."
                    </div>
                    <div className="bg-[#0e382c] text-emerald-100 rounded-xl rounded-tr-sm p-2 text-[10px] leading-relaxed">
                      "Temos o plano ideal! Quer agendar uma apresentação de 15 min?"
                    </div>
                  </div>
                  <div className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg py-1 px-2 text-center text-[10px] font-semibold">
                    ✓ Lead Direcionado ao SDR
                  </div>
                </article>
              </>
            )}

            {/* SLIDE 2: GESTÃO 360°, METAS & RETENÇÃO */}
            {slideAtual === 2 && (
              <>
                {/* Background Card (Metas Comerciais & Batimento) */}
                <article className="absolute -top-1 left-2 sm:left-4 w-60 sm:w-64 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/80 transform -rotate-1 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 tracking-tight">Meta Comercial (Trimestre)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">89% Atingida</span>
                  </div>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-12 h-12 rounded-full donut-visual p-[7px] flex items-center justify-center flex-shrink-0">
                      <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                        <span className="text-[9px] font-black text-emerald-700">89%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium leading-none">Receita Recorrente</div>
                      <div className="text-base font-extrabold text-slate-900">R$ 420.000,00</div>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Meta: R$ 480k</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#0e382c] text-white rounded-xl py-1.5 px-3 text-center text-[10px] font-semibold tracking-wide">
                    Previsão de Superação: 104%
                  </div>
                </article>

                {/* Right Overlapping Card (Health Score da Carteira) */}
                <article className="absolute top-16 right-0 sm:-right-2 w-56 sm:w-60 bg-white/95 text-slate-900 rounded-2xl p-3.5 shadow-floating-card border border-white/80 z-10 transform rotate-2 transition-all duration-300 hover:rotate-0 hover:z-20 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">Saúde da Carteira</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-[10px] text-slate-500">NPS Geral &amp; Retenção</p>
                  <div className="flex justify-between items-baseline my-1">
                    <span className="text-sm font-bold text-slate-900">94 <span className="text-[10px] font-normal text-slate-400">/ 100</span></span>
                    <span className="text-[10px] font-bold text-emerald-600">Churn 0.5%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </article>

                {/* Front Lower Card (Follow-ups & Tarefas Comerciais) */}
                <article className="relative z-15 mt-28 -ml-6 sm:-ml-12 w-64 sm:w-72 bg-white/95 text-slate-900 rounded-2xl p-4 shadow-floating-card border border-white/90 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Follow-ups do Dia</span>
                      <span className="text-base font-extrabold text-slate-900">12 Atividades</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center">
                      ↑ 100% no prazo
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] border-t border-slate-100 pt-2 mb-2.5">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium flex items-center gap-1.5 truncate">
                        <span className="text-emerald-600">✓</span> Assinatura de Contrato
                      </span>
                      <span className="font-bold text-slate-900 text-[10px]">R$ 36.000</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-medium flex items-center gap-1.5 truncate">
                        <span className="text-amber-500">◷</span> Demo Comercial Agendada
                      </span>
                      <span className="font-bold text-slate-900 text-[10px]">15:00</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 hover:bg-[#0e382c] text-white rounded-lg py-1.5 text-[11px] font-medium transition-colors text-center cursor-pointer">
                    Acessar Painel de Tarefas
                  </div>
                </article>
              </>
            )}
          </div>

          {/* Value Proposition Header & Content */}
          <div
            key={`text-${slideAtual}`}
            className="relative z-10 text-center max-w-lg mx-auto mt-4 mb-2 animate-fade-in"
          >
            {/* Floating Brand Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-lg transition-transform duration-300 hover:scale-110">
              {slideAtual === 0 && <HugeiconsIcon icon={AiBrain01Icon} size={24} strokeWidth={2} className="text-emerald-400" />}
              {slideAtual === 1 && <HugeiconsIcon icon={BotIcon} size={24} strokeWidth={2} className="text-emerald-400" />}
              {slideAtual === 2 && <HugeiconsIcon icon={Analytics01Icon} size={24} strokeWidth={2} className="text-emerald-400" />}
            </div>

            {slideAtual === 0 && (
              <>
                <h2 className="text-2xl sm:text-[1.85rem] font-bold text-white tracking-tight leading-snug mb-3">
                  Pipeline Comercial &amp; Previsão de Vendas com IA
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed font-normal max-w-md mx-auto">
                  Monitore negociações em tempo real, priorize os leads mais quentes e impulsione conversões com recomendações preditivas automatizadas.
                </p>
              </>
            )}

            {slideAtual === 1 && (
              <>
                <h2 className="text-2xl sm:text-[1.85rem] font-bold text-white tracking-tight leading-snug mb-3">
                  Atendimento Automatizado &amp; Qualificação 24/7
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed font-normal max-w-md mx-auto">
                  O Pranchetinho IA engaja clientes instantaneamente, esclarece dúvidas, qualifica oportunidades e agenda reuniões diretamente na sua agenda.
                </p>
              </>
            )}

            {slideAtual === 2 && (
              <>
                <h2 className="text-2xl sm:text-[1.85rem] font-bold text-white tracking-tight leading-snug mb-3">
                  Visão 360°, Metas &amp; Retenção de Clientes
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/75 leading-relaxed font-normal max-w-md mx-auto">
                  Acompanhe metas comerciais, saúde da carteira de clientes, automações de tarefas e follow-ups em um único ecossistema integrado.
                </p>
              </>
            )}
          </div>

          {/* Carousel / Step Indicator Pills */}
          <div
            aria-label="Indicadores de slides"
            className="flex justify-center items-center gap-2 pt-4 pb-1"
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
