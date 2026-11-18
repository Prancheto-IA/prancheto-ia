// =============================================================
// PRANCHETO.IA - PAINEL ADMINISTRATIVO (LAYOUT SUPER ADMIN)
// Shell do Painel Admin com Sidebar expandida no mesmo estilo do LayoutCliente,
// com cores sólidas (sem gradiente) e separação visual nítida.
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
  BotIcon,
  UserGroupIcon,
  Building01Icon,
  PackageIcon,
  Analytics01Icon,
  Shield01Icon,
  Ticket01Icon,
  Menu01Icon,
  Cancel01Icon,
  Search01Icon,
  Sun01Icon,
  Moon02Icon,
  Logout01Icon,
} from '@hugeicons/core-free-icons';

// Lazy loading das sub-páginas do painel admin
const PaginaChatIA           = lazy(() => import('./ChatIA/ChatIA.jsx'));
const PaginaGestaoUsuarios   = lazy(() => import('./Usuarios/GestaoUsuarios.jsx'));
const PaginaGestaoClientes   = lazy(() => import('./Clientes/GestaoClientes.jsx'));
const PaginaPlanoLimites     = lazy(() => import('./Planos/PlanoLimites.jsx'));
const PaginaLogsSeguranca    = lazy(() => import('./Seguranca/LogsSeguranca.jsx'));
const PaginaMonitoramento    = lazy(() => import('./Monitoramento/Monitoramento.jsx'));
const PaginaTicketsRecebidos = lazy(() => import('./Suporte/TicketsRecebidos.jsx'));

// Módulos de navegação do Super Admin (menu direto na sidebar, sem grid)
const ITENS_NAV_ADMIN = [
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
// COMPONENTE: Item de Navegação da Sidebar (Sólido, sem gradiente)
// ----------------------------------------------------------
const ItemNavAdmin = ({ item, onClick }) => {
  const location = useLocation();
  const ativo = location.pathname.startsWith(item.rota);

  return (
    <NavLink
      to={item.rota}
      onClick={onClick}
      className={`h-11 flex items-center rounded-xl text-sm transition-all duration-150 px-3.5 gap-3 w-full cursor-pointer ${
        ativo
          ? 'bg-[#0E382C] text-[#D4EC9D] font-bold border border-[#D4EC9D]/30 shadow-xs'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
      }`}
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <HugeiconsIcon icon={item.icone} size={18} strokeWidth={ativo ? 2.2 : 1.8} />
      </span>
      <span className="truncate whitespace-nowrap flex-1">
        {item.label}
      </span>
    </NavLink>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Sidebar Administrativa (Fixa e sempre expandida w-64)
// ----------------------------------------------------------
const SidebarAdmin = ({ aberta, onFechar }) => {
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
          flex-shrink-0 lg:static lg:z-auto lg:h-full lg:translate-x-0 w-64
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-200 ease-out
        `}
      >
        <div className="h-full w-64 flex flex-col flex-shrink-0">
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

          {/* Lista de Navegação dos Módulos */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-1.5">
            {ITENS_NAV_ADMIN.map((item) => (
              <ItemNavAdmin
                key={item.slug}
                item={item}
                onClick={onFechar}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Layout & Roteador do Painel Admin
// ----------------------------------------------------------
const PaginaAdminPanel = () => {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false);
  const menuUsuarioRef = useRef(null);

  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const { temaEscuro, alternarTema } = useTema();

  // Fecha dropdown de perfil ao clicar fora
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
      {/* ─── Top Header Fixo ─── */}
      <header className="h-16 bg-transparent pl-3 sm:pl-4 lg:pl-[15.5px] pr-4 sm:pr-6 flex items-center justify-between gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarAberta(true)}
            className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg cursor-pointer"
            aria-label="Abrir menu admin"
          >
            <HugeiconsIcon icon={Menu01Icon} size={22} strokeWidth={1.8} />
          </button>

          {/* Logo da Marca com Badge Super Admin */}
          <NavLink
            to="/admin/chat"
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
              placeholder="Painel de Controle Super Admin"
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
                <p className="text-xs font-semibold">Ir para o painel do cliente (/dashboard)</p>
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
              <button
                type="button"
                onClick={() => setMenuUsuarioAberto((v) => !v)}
                className="w-9 h-9 rounded-full bg-[#0E382C] text-[#D4EC9D] border-2 border-slate-700 font-bold text-sm flex items-center justify-center flex-shrink-0 transition-all cursor-pointer hover:border-[#D4EC9D]/50"
                aria-label={`Perfil: ${usuario?.nome || 'Super Admin'}`}
              >
                <span>{primeiroNome[0]?.toUpperCase() || 'A'}</span>
              </button>

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

      {/* ─── Corpo: Sidebar Sempre Expandida + Seção Principal (Canvas com Canto Arredondado) ─── */}
      <div className="flex-1 flex items-stretch min-h-0 overflow-hidden">
        {/* Sidebar fixa w-64 */}
        <SidebarAdmin
          aberta={sidebarAberta}
          onFechar={() => setSidebarAberta(false)}
        />

        {/* 
          Canvas de Conteúdo Principal (Nível 1):
          bg-surface garante que no modo claro ele seja #F2F6FA (fundo claro com contraste nítido),
          e dark:bg-[#111928] garante um tom de superfície distinto do #0F172A do shell externo.
          rounded-tl-3xl reproduz exatamente o corte característico do LayoutCliente.
        */}
        <main className="flex-1 bg-surface dark:bg-[#111928] rounded-tl-3xl border-t border-l border-slate-700/50 dark:border-white/10 flex flex-col min-h-0 shadow-sm overflow-auto">
          <Suspense fallback={<TelaCarregandoAdmin />}>
            <Routes>
              <Route index element={<Navigate to="/admin/chat" replace />} />
              <Route path="chat"          element={<PaginaChatIA />} />
              <Route path="usuarios"      element={<PaginaGestaoUsuarios />} />
              <Route path="clientes"      element={<PaginaGestaoClientes />} />
              <Route path="planos"        element={<PaginaPlanoLimites />} />
              <Route path="seguranca"     element={<PaginaLogsSeguranca />} />
              <Route path="monitoramento" element={<PaginaMonitoramento />} />
              <Route path="tickets"       element={<PaginaTicketsRecebidos />} />
              <Route path="*"             element={<Navigate to="/admin/chat" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default PaginaAdminPanel;
