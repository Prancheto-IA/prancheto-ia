// =============================================================
// PRANCHETO.IA - PAINEL ADMINISTRATIVO (LAYOUT SUPER ADMIN)
// Shell do Painel Admin com Sidebar no mesmo estilo do LayoutCliente,
// com cores sólidas (sem gradiente) para governança e distinção visual.
// =============================================================

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useTema } from '../../hooks/useTema.js';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/reui/tooltip';
import logoCompletoPrancheto from '@/assets/logo/Logo-LHW.svg';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DashboardSquare01Icon,
  BotIcon,
  UserGroupIcon,
  Building01Icon,
  PackageIcon,
  Analytics01Icon,
  Shield01Icon,
  Ticket01Icon,
  LockKeyIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Menu01Icon,
  Cancel01Icon,
  Search01Icon,
  Sun01Icon,
  Moon02Icon,
  Logout01Icon,
  UserIcon,
  ArrowRight02Icon,
} from '@hugeicons/core-free-icons';

// Lazy loading das sub-páginas do painel admin
const PaginaChatIA           = lazy(() => import('./ChatIA/ChatIA.jsx'));
const PaginaGestaoUsuarios   = lazy(() => import('./Usuarios/GestaoUsuarios.jsx'));
const PaginaGestaoClientes   = lazy(() => import('./Clientes/GestaoClientes.jsx'));
const PaginaPlanoLimites     = lazy(() => import('./Planos/PlanoLimites.jsx'));
const PaginaLogsSeguranca    = lazy(() => import('./Seguranca/LogsSeguranca.jsx'));
const PaginaMonitoramento    = lazy(() => import('./Monitoramento/Monitoramento.jsx'));
const PaginaTicketsRecebidos = lazy(() => import('./Suporte/TicketsRecebidos.jsx'));

// Módulos de navegação do Super Admin
const ITENS_NAV_ADMIN = [
  {
    slug: 'visao-geral',
    label: 'Visão Geral',
    rota: '/admin',
    exact: true,
    icone: DashboardSquare01Icon,
  },
  {
    slug: 'chat',
    label: 'Chat com IA',
    rota: '/admin/chat',
    icone: BotIcon,
  },
  {
    slug: 'usuarios',
    label: 'Gestão de Usuários',
    rota: '/admin/usuarios',
    icone: UserGroupIcon,
  },
  {
    slug: 'clientes',
    label: 'Clientes & Tenants',
    rota: '/admin/clientes',
    icone: Building01Icon,
  },
  {
    slug: 'planos',
    label: 'Planos e Limites',
    rota: '/admin/planos',
    icone: PackageIcon,
  },
  {
    slug: 'monitoramento',
    label: 'Monitoramento',
    rota: '/admin/monitoramento',
    icone: Analytics01Icon,
  },
  {
    slug: 'seguranca',
    label: 'Segurança & Auditoria',
    rota: '/admin/seguranca',
    icone: Shield01Icon,
  },
  {
    slug: 'tickets',
    label: 'Tickets Recebidos',
    rota: '/admin/tickets',
    icone: Ticket01Icon,
  },
];

const TelaCarregandoAdmin = () => (
  <div className="flex items-center justify-center flex-1 min-h-[400px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-ink-secondary">Carregando painel admin...</p>
    </div>
  </div>
);

// ----------------------------------------------------------
// COMPONENTE: Item de Navegação da Sidebar (Sem gradiente)
// ----------------------------------------------------------
const ItemNavAdmin = ({ item, colapsada, onClick }) => {
  const location = useLocation();
  const ativo = item.exact
    ? location.pathname === item.rota
    : location.pathname.startsWith(item.rota);

  return (
    <div className={`relative group transition-[width] duration-150 ease-out ${colapsada ? 'w-10' : 'w-full'}`}>
      <Tooltip disabled={!colapsada}>
        <TooltipTrigger
          render={
            <NavLink
              to={item.rota}
              onClick={onClick}
              className={`h-10 flex items-center rounded-xl text-sm transition-all duration-150 relative overflow-hidden cursor-pointer ${
                colapsada ? 'w-10 justify-center' : 'w-full px-2.5 gap-2.5'
              } ${
                ativo
                  ? 'bg-[#0E382C] text-[#D4EC9D] font-bold border border-[#D4EC9D]/30 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 font-medium'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <HugeiconsIcon icon={item.icone} size={18} strokeWidth={ativo ? 2.2 : 1.8} />
              </span>
              <span
                className={`truncate whitespace-nowrap transition-opacity duration-100 ${
                  colapsada ? 'opacity-0 pointer-events-none hidden' : 'opacity-100 flex-1'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          }
        />
        <TooltipContent side="inline-end" sideOffset={10}>
          <p className="text-xs font-semibold">{item.label}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Sidebar Administrativa (Sem gradiente)
// ----------------------------------------------------------
const SidebarAdmin = ({ aberta, onFechar, colapsada }) => {
  return (
    <>
      {aberta && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onFechar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-screen flex flex-col z-40 overflow-hidden bg-[#0F172A] lg:bg-transparent
          transition-[width] duration-150 ease-out flex-shrink-0
          lg:static lg:z-auto lg:h-full lg:translate-x-0
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          w-64 ${colapsada ? 'lg:w-16' : 'lg:w-64'}
        `}
      >
        <div className={`h-full flex flex-col flex-shrink-0 ${colapsada ? 'w-16' : 'w-64'}`}>
          <TooltipProvider delay={100}>
            {/* Topo visível exclusivamente no drawer mobile */}
            <div className="h-16 flex items-center justify-between px-4 flex-shrink-0 lg:hidden border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src={logoCompletoPrancheto} alt="Prancheto.IA" className="h-9 w-auto" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E382C] text-[#D4EC9D]">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={onFechar}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Fechar menu"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1">
              {ITENS_NAV_ADMIN.map((item) => (
                <ItemNavAdmin
                  key={item.slug}
                  item={item}
                  colapsada={colapsada}
                  onClick={onFechar}
                />
              ))}
            </nav>

            {/* Base da Sidebar: Indicador de Governança */}
            <div className="p-3 flex-shrink-0 overflow-hidden border-t border-slate-800/80">
              <div className={`flex items-center ${colapsada ? 'justify-center' : 'gap-2 px-2'} text-slate-400 text-xs py-1`}>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                {!colapsada && (
                  <span className="truncate font-medium text-[11px] text-slate-300">
                    Modo Governança Ativo
                  </span>
                )}
              </div>
            </div>
          </TooltipProvider>
        </div>
      </aside>
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Visão Geral / Dashboard Administrativo
// ----------------------------------------------------------
const VisaoGeralAdmin = () => {
  const navigate = useNavigate();

  const modulos = [
    {
      icone: <HugeiconsIcon icon={BotIcon} size={20} strokeWidth={1.8} />,
      titulo: 'Chat com IA',
      descricao: 'Gerar novos módulos, código e configurações via chat com a IA.',
      status: 'ativo',
      rota: '/admin/chat',
    },
    {
      icone: <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />,
      titulo: 'Gestão de Usuários',
      descricao: 'Gerenciar todos os usuários, cargos e sessão de impersonation.',
      status: 'ativo',
      rota: '/admin/usuarios',
    },
    {
      icone: <HugeiconsIcon icon={Building01Icon} size={20} strokeWidth={1.8} />,
      titulo: 'Clientes & Tenants',
      descricao: 'Criar, editar e gerenciar tenants de organizações parceiras.',
      status: 'ativo',
      rota: '/admin/clientes',
    },
    {
      icone: <HugeiconsIcon icon={PackageIcon} size={20} strokeWidth={1.8} />,
      titulo: 'Planos e Limites',
      descricao: 'Configurar planos, recursos liberados e limites por empresa.',
      status: 'ativo',
      rota: '/admin/planos',
    },
    {
      icone: <HugeiconsIcon icon={Analytics01Icon} size={20} strokeWidth={1.8} />,
      titulo: 'Monitoramento',
      descricao: 'Saúde do sistema, tempo de resposta e métricas de servidores.',
      status: 'ativo',
      rota: '/admin/monitoramento',
    },
    {
      icone: <HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.8} />,
      titulo: 'Segurança & Auditoria',
      descricao: 'Logs de acessos, registros de auditoria e controle LGPD.',
      status: 'ativo',
      rota: '/admin/seguranca',
    },
    {
      icone: <HugeiconsIcon icon={Ticket01Icon} size={20} strokeWidth={1.8} />,
      titulo: 'Tickets Recebidos',
      descricao: 'Atender tickets de suporte abertos por qualquer empresa parceira.',
      status: 'ativo',
      rota: '/admin/tickets',
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink-primary tracking-tight">
                Painel de Controle Super Admin
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E382C] text-[#D4EC9D]">
                Governança
              </span>
            </div>
            <p className="text-sm text-ink-secondary">
              Gerencie permissões, empresas parceiras, cotas de recursos e auditorias globais do sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistemas Operacionais
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Acesso aos Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map((modulo, i) => (
          <div
            key={i}
            onClick={() => navigate(modulo.rota)}
            className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-2xs flex flex-col justify-between space-y-4 hover:border-brand-primary/40 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border text-[#0E382C] dark:text-[#D4EC9D] flex items-center justify-center group-hover:scale-105 transition-transform">
                {modulo.icone}
              </div>
              <h3 className="font-extrabold text-sm text-ink-primary flex items-center justify-between">
                <span>{modulo.titulo}</span>
                <HugeiconsIcon icon={ArrowRight02Icon} size={16} strokeWidth={2} className="text-ink-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">{modulo.descricao}</p>
            </div>

            <div className="pt-2 border-t border-surface-border flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ativo
              </span>
              <span className="text-[11px] font-semibold text-brand-primary hover:underline">
                Acessar →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Layout & Roteador do Painel Admin
// ----------------------------------------------------------
const PaginaAdminPanel = () => {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [colapsada, setColapsada] = useState(() => {
    try {
      return localStorage.getItem('admin_sidebar_colapsada') === 'true';
    } catch {
      return false;
    }
  });
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const menuUsuarioRef = useRef(null);

  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const { temaEscuro, alternarTema } = useTema();

  const alternarColapsada = (novo) => {
    setColapsada(novo);
    try {
      localStorage.setItem('admin_sidebar_colapsada', String(novo));
    } catch {}
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
        setMenuUsuarioAberto(false);
      }
    };
    if (menuUsuarioAberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [menuUsuarioAberto]);

  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Admin';

  return (
    <div className="h-screen bg-[#0F172A] flex flex-col overflow-hidden font-sans">
      {/* ─── Top Header Fixo (Cores sólidas sem gradiente) ─── */}
      <header className="h-16 bg-transparent pl-3 sm:pl-4 lg:pl-[15.5px] pr-4 sm:pr-6 flex items-center justify-between gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => setSidebarAberta(true)}
                  className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg cursor-pointer"
                  aria-label="Abrir menu admin"
                >
                  <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
                </button>
              }
            />
            <TooltipContent side="bottom" sideOffset={8}>
              <p className="text-xs font-semibold">Abrir menu admin</p>
            </TooltipContent>
          </Tooltip>

          {/* Logo da Marca com Badge Super Admin */}
          <NavLink
            to="/admin"
            className="flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-90 cursor-pointer"
          >
            <img
              src={logoCompletoPrancheto}
              alt="Prancheto.IA"
              className="h-10 w-auto max-w-[200px] object-contain select-none"
            />
            <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0E382C] text-[#D4EC9D] border border-[#D4EC9D]/30 tracking-wider uppercase">
              Super Admin
            </span>
          </NavLink>
        </div>

        {/* Busca / Título Central */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={1.8}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              readOnly
              placeholder="Painel Administrativo Prancheto.IA"
              className="w-full h-10 pl-11 pr-4 bg-slate-800/80 text-white placeholder-slate-400 border border-slate-700/70 rounded-full text-xs cursor-default focus:outline-none"
            />
          </div>
        </div>

        {/* Ações à Direita */}
        <TooltipProvider delay={100}>
          <div className="flex items-center gap-2.5">
            {/* Atalho rápido para o App do Cliente */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="h-9 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Área do Cliente</span>
                    <span className="text-[10px] text-slate-400">↗</span>
                  </button>
                }
              />
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-semibold">Ir para o painel de cliente (/dashboard)</p>
              </TooltipContent>
            </Tooltip>

            {/* Alternar Tema */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => alternarTema(usuario?.id)}
                    aria-label={temaEscuro ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                    className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <HugeiconsIcon
                      icon={temaEscuro ? Sun01Icon : Moon02Icon}
                      size={18}
                      strokeWidth={1.8}
                    />
                  </button>
                }
              />
              <TooltipContent side="bottom" sideOffset={8}>
                <p className="text-xs font-semibold">
                  {temaEscuro ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Perfil do Super Admin */}
            <div className="relative" ref={menuUsuarioRef}>
              <Tooltip disabled={menuUsuarioAberto}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => setMenuUsuarioAberto((v) => !v)}
                      className="w-9 h-9 rounded-full bg-[#0E382C] text-[#D4EC9D] border-2 border-slate-700 font-bold text-sm flex items-center justify-center flex-shrink-0 transition-all cursor-pointer hover:border-[#D4EC9D]/50"
                      aria-label={`Perfil: ${usuario?.nome || 'Super Admin'}`}
                    >
                      <span>{primeiroNome[0]?.toUpperCase() || 'A'}</span>
                    </button>
                  }
                />
                <TooltipContent side="bottom" sideOffset={8}>
                  <p className="text-xs font-semibold">{usuario?.nome || 'Super Admin'}</p>
                </TooltipContent>
              </Tooltip>

              {menuUsuarioAberto && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-card rounded-2xl shadow-xl border border-surface-border py-2 z-50 animate-fade-in text-sm">
                  {/* Dados do usuário */}
                  <div className="px-4 py-2.5 border-b border-surface-border">
                    <p className="font-bold text-ink-primary truncate">{usuario?.nome || 'Super Admin'}</p>
                    <p className="text-[11px] text-ink-secondary truncate">{usuario?.email}</p>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-1.5 bg-[#0E382C] text-[#D4EC9D]">
                      Super Admin
                    </span>
                  </div>

                  {/* Sair */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setMenuUsuarioAberto(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold text-left cursor-pointer transition-colors"
                    >
                      <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.8} className="text-red-600" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>
      </header>

      {/* ─── Corpo: Sidebar + Main Content Canvas ─── */}
      <div className="flex-1 flex items-stretch min-h-0 overflow-hidden">
        {/* Sidebar */}
        <SidebarAdmin
          aberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
          colapsada={colapsada}
        />

        {/* Botão de Toggle da Sidebar (Desktop) */}
        <TooltipProvider delay={100}>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  onClick={() => alternarColapsada(!colapsada)}
                  className="hidden lg:flex fixed bottom-12 z-50 items-center justify-center w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md focus:outline-none transition-[left,transform] duration-150 ease-out cursor-pointer"
                  style={{
                    left: colapsada ? 'calc(4rem - 0.875rem)' : 'calc(16rem - 0.875rem)',
                  }}
                  aria-label={colapsada ? 'Expandir menu' : 'Recolher menu'}
                >
                  <HugeiconsIcon
                    icon={colapsada ? ArrowRight01Icon : ArrowLeft01Icon}
                    size={14}
                    strokeWidth={2.2}
                    className="transition-transform duration-150"
                  />
                </button>
              }
            />
            <TooltipContent side="inline-end" sideOffset={10}>
              <p className="text-xs font-semibold">{colapsada ? 'Expandir menu' : 'Recolher menu'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Canvas de Conteúdo Principal (Canto arredondado rounded-tl-3xl) */}
        <main className="flex-1 bg-surface-primary dark:bg-[#0D121F] rounded-tl-3xl dark:border-t dark:border-l dark:border-white/[0.08] flex flex-col min-h-0 shadow-sm overflow-auto">
          <Suspense fallback={<TelaCarregandoAdmin />}>
            <Routes>
              <Route index element={<VisaoGeralAdmin />} />
              <Route path="chat"          element={<PaginaChatIA />} />
              <Route path="usuarios"      element={<PaginaGestaoUsuarios />} />
              <Route path="clientes"      element={<PaginaGestaoClientes />} />
              <Route path="planos"        element={<PaginaPlanoLimites />} />
              <Route path="seguranca"     element={<PaginaLogsSeguranca />} />
              <Route path="monitoramento" element={<PaginaMonitoramento />} />
              <Route path="tickets"       element={<PaginaTicketsRecebidos />} />
              <Route path="*"             element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default PaginaAdminPanel;
