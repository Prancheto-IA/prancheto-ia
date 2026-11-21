// =============================================================
// PRANCHETO.IA - PLANOS E LIMITES (Super Admin)
// Gestão de modalidades comerciais, cotas de assentos e limites por cliente.
//
// Construído com:
// - Componentes ReUI (Card, Badge, Tooltip)
// - Ícones oficiais HugeIcons (@hugeicons/react)
// - Design System Prancheto (Dark/Light mode, superfícies sólidas, largura fluida)
//
// ROTA: /planos
// ACESSO: Super Admin
// =============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useUIStore } from '../../../store/uiStore.js';
import { Badge } from '@/components/reui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { TooltipProvider } from '@/components/reui/tooltip';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PackageIcon,
  Search01Icon,
  Edit02Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  Building01Icon,
  UserGroupIcon,
  Cancel01Icon,
  RefreshIcon,
  UserIcon,
  Rocket01Icon,
  CrownIcon,
  Award01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';

// =============================================================
// DEFINIÇÃO DOS PLANOS COM DESIGN SYSTEM
// =============================================================
const DEFINICAO_PLANOS = [
  {
    id: 'free',
    label: 'Free',
    icone: UserIcon,
    corBadge: 'secondary',
    corIcone: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20',
    limiteDefault: 5,
    descricao: 'Para experimentação e avaliação inicial do sistema.',
    recursos: ['Até 5 usuários', 'Módulos básicos', 'Suporte comunitário'],
  },
  {
    id: 'starter',
    label: 'Starter',
    icone: Rocket01Icon,
    corBadge: 'primary',
    corIcone: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    limiteDefault: 15,
    descricao: 'Para pequenas equipes em processo de expansão.',
    recursos: ['Até 15 usuários', 'Todos os módulos operacionais', 'Suporte prioritário'],
  },
  {
    id: 'pro',
    label: 'Pro',
    icone: CrownIcon,
    corBadge: 'violet',
    corIcone: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
    limiteDefault: 50,
    descricao: 'Para empresas com times estruturados e múltiplos setores.',
    recursos: ['Até 50 usuários', 'Todos os módulos e relatórios avançados', 'Suporte 24/7'],
  },
  {
    id: 'enterprise',
    label: 'Enterprise',
    icone: Award01Icon,
    corBadge: 'warning',
    corIcone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    limiteDefault: 999,
    descricao: 'Escala máxima, suporte dedicado e governança corporativa.',
    recursos: ['Usuários ilimitados', 'Todos os módulos e integrações', 'Gerente de contas dedicado', 'SLA 99.9%'],
  },
];

// =============================================================
// COMPONENTE: Modal de Edição de Plano & Limite
// =============================================================
const ModalEditarPlano = ({ tenant, onSalvar, onFechar, salvando }) => {
  const [plano, setPlano] = useState(tenant.plano || 'free');
  const [limiteUsuarios, setLimiteUsuarios] = useState(tenant.limite_usuarios || 5);
  const [erro, setErro] = useState('');

  const planoSelecionado = DEFINICAO_PLANOS.find((p) => p.id === plano);

  const handleSubmit = (e) => {
    e.preventDefault();
    const limiteNum = parseInt(limiteUsuarios, 10);
    if (!limiteNum || limiteNum < 1) {
      setErro('O limite deve ser de pelo menos 1 usuário.');
      return;
    }
    onSalvar({ plano, limite_usuarios: limiteNum });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-surface dark:bg-[#111928] border border-surface-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header do modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle/50">
          <div>
            <h2 className="font-bold text-base text-ink-primary">Editar Plano e Limites</h2>
            <p className="text-xs text-ink-secondary mt-0.5">{tenant.nome}</p>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seleção do Plano */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-2.5">
              Selecione o Plano
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {DEFINICAO_PLANOS.map((p) => {
                const ativo = plano === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPlano(p.id);
                      setLimiteUsuarios(p.limiteDefault);
                      setErro('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      ativo
                        ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-2xs'
                        : 'border-surface-border bg-surface-card hover:bg-surface-subtle/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${p.corIcone}`}>
                        <HugeiconsIcon icon={p.icone} size={15} strokeWidth={2} />
                      </div>
                      <Badge variant={p.corBadge} size="xs">
                        {p.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-ink-secondary line-clamp-2">
                      {p.descricao}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Limite de Usuários */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-ink-primary">
                Limite de Assentos (Usuários)
              </label>
              {planoSelecionado && (
                <span className="text-[11px] text-ink-secondary">
                  Padrão do plano: {planoSelecionado.limiteDefault}
                </span>
              )}
            </div>
            <input
              type="number"
              min="1"
              max="99999"
              value={limiteUsuarios}
              onChange={(e) => {
                setLimiteUsuarios(e.target.value);
                setErro('');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erro
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando}
            />
            {erro && <p className="text-red-500 text-xs mt-1 font-medium">{erro}</p>}
            <p className="text-[11px] text-ink-secondary mt-1.5">
              Atualmente o cliente possui <strong>{tenant.qtd_usuarios ?? 0}</strong> usuário(s) ativos.
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} strokeWidth={2} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: PlanoLimites
// =============================================================
const PlanoLimites = () => {
  const adicionarNotificacao = useUIStore((s) => s.adicionarNotificacao);

  const [tenants, setTenants] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [tenantEditar, setTenantEditar] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // --- Carregar todos os tenants ---
  const carregarTenants = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, users(count)', { count: 'exact' });

      if (error) throw error;

      const dados = (data || []).map((t) => ({
        ...t,
        qtd_usuarios: t.users && t.users[0] ? t.users[0].count : 0,
      }));

      setTenants(dados);
    } catch (err) {
      setErro(err?.message || 'Erro ao carregar clientes e planos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTenants();
  }, [carregarTenants]);

  // --- Estatísticas por plano ---
  const estatisticas = useMemo(() => {
    return DEFINICAO_PLANOS.reduce((acc, p) => {
      acc[p.id] = tenants.filter((t) => (t.plano || 'free') === p.id).length;
      return acc;
    }, {});
  }, [tenants]);

  // --- Filtro de clientes ---
  const tenantsFiltrados = useMemo(() => {
    return tenants.filter((t) => {
      const nomeOuSlug = `${t.nome || ''} ${t.slug || ''}`.toLowerCase();
      const matchBusca = !busca || nomeOuSlug.includes(busca.toLowerCase());
      const planoTenant = t.plano || 'free';
      const matchPlano = !filtroPlano || planoTenant === filtroPlano;
      return matchBusca && matchPlano;
    });
  }, [tenants, busca, filtroPlano]);

  // --- Salvar alteração de plano/limite ---
  const handleSalvar = async (dados) => {
    if (!tenantEditar) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update(dados)
        .eq('id', tenantEditar.id);

      if (error) throw error;

      setTenantEditar(null);
      if (adicionarNotificacao) {
        adicionarNotificacao(
          'success',
          `Plano de "${tenantEditar.nome}" atualizado com sucesso.`
        );
      }
      await carregarTenants();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao atualizar plano.');
      } else {
        alert(err?.message || 'Erro ao atualizar plano.');
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex-1 flex flex-col min-h-0 bg-surface dark:bg-[#111928] overflow-y-auto select-text w-full">
        <div className="p-4 sm:p-6 space-y-6 w-full">
          {/* ─── CABEÇALHO DA PÁGINA (SEM ESPAÇOS LATERAIS) ───── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-surface-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-ink-primary tracking-tight">
                  Planos e Limites
                </h1>
                <Badge variant="primary" size="sm">
                  {tenants.length} {tenants.length === 1 ? 'Cliente' : 'Clientes'}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-ink-secondary">
                Configuração de modalidades comerciais, cotas de usuários e limites por cliente corporativo.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                onClick={carregarTenants}
                disabled={carregando}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Recarregar clientes"
              >
                <HugeiconsIcon
                  icon={RefreshIcon}
                  size={16}
                  strokeWidth={2}
                  className={carregando ? 'animate-spin text-blue-600' : 'text-ink-secondary'}
                />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* ─── CARREGAMENTO / ERRO ────────────────────────── */}
          {carregando && tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 gap-3">
              <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-ink-secondary font-medium">
                Carregando planos e cotas dos clientes...
              </p>
            </div>
          ) : erro ? (
            <Card className="border-red-500/30 bg-red-500/5 p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <HugeiconsIcon icon={Alert02Icon} size={24} strokeWidth={2} />
                </div>
                <h3 className="text-base font-bold text-ink-primary">Falha ao carregar planos</h3>
                <p className="text-xs text-ink-secondary max-w-md">{erro}</p>
                <button
                  onClick={carregarTenants}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={2} />
                  <span>Tentar novamente</span>
                </button>
              </div>
            </Card>
          ) : (
            <>
              {/* ─── SEÇÃO 1: CARDS DOS 4 PLANOS (FILTRO INTERATIVO) ─ */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                    Modalidades Disponíveis
                  </h2>
                  {filtroPlano && (
                    <button
                      onClick={() => setFiltroPlano('')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mostrar todos os planos</span>
                      <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DEFINICAO_PLANOS.map((plano) => {
                    const qtd = estatisticas[plano.id] || 0;
                    const ativo = filtroPlano === plano.id;

                    return (
                      <Card
                        key={plano.id}
                        onClick={() =>
                          setFiltroPlano(filtroPlano === plano.id ? '' : plano.id)
                        }
                        className={`transition-all duration-200 cursor-pointer overflow-hidden ${
                          ativo
                            ? 'ring-2 ring-brand-primary border-brand-primary shadow-sm bg-brand-primary/5 dark:bg-brand-primary/10'
                            : 'hover:border-surface-border-strong hover:-translate-y-0.5'
                        }`}
                      >
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${plano.corIcone}`}>
                              <HugeiconsIcon icon={plano.icone} size={17} strokeWidth={2} />
                            </div>
                            <Badge variant={plano.corBadge} size="xs">
                              {plano.label}
                            </Badge>
                          </div>
                          <div className="pt-2">
                            <div className="text-2xl font-bold text-ink-primary font-mono">
                              {qtd}
                            </div>
                            <p className="text-[11px] text-ink-secondary">
                              {qtd === 1 ? 'cliente ativo' : 'clientes ativos'}
                            </p>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 space-y-3">
                          <p className="text-xs text-ink-secondary leading-snug">
                            {plano.descricao}
                          </p>

                          <ul className="space-y-1.5 pt-2 border-t border-surface-border">
                            {plano.recursos.map((r, i) => (
                              <li
                                key={i}
                                className="text-[11px] text-ink-secondary flex items-center gap-1.5"
                              >
                                <span className="text-emerald-600 dark:text-emerald-400 shrink-0">
                                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />
                                </span>
                                <span className="truncate">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ─── SEÇÃO 2: TABELA DE CLIENTES & LIMITES ───── */}
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-surface-border bg-surface-subtle/50 py-3.5 px-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon
                        icon={Building01Icon}
                        size={17}
                        strokeWidth={2}
                        className="text-ink-secondary"
                      />
                      <CardTitle className="text-sm font-bold">
                        Clientes Corporativos ({tenantsFiltrados.length})
                      </CardTitle>
                      {filtroPlano && (
                        <Badge variant="primary" size="xs">
                          Filtro: {DEFINICAO_PLANOS.find((p) => p.id === filtroPlano)?.label}
                        </Badge>
                      )}
                    </div>

                    {/* Busca */}
                    <div className="relative w-full sm:w-72">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={15}
                        strokeWidth={2}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-secondary"
                      />
                      <input
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar por nome ou slug..."
                        className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary placeholder:text-ink-secondary/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary transition-all"
                      />
                      {busca && (
                        <button
                          onClick={() => setBusca('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary text-xs"
                        >
                          <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {tenantsFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-surface-subtle text-ink-secondary flex items-center justify-center">
                        <HugeiconsIcon icon={PackageIcon} size={20} strokeWidth={2} />
                      </div>
                      <p className="text-xs font-bold text-ink-primary">Nenhum cliente encontrado</p>
                      <p className="text-[11px] text-ink-secondary">
                        Tente ajustar a busca ou limpar os filtros de plano selecionados.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-surface-border bg-surface-subtle/30 text-ink-secondary font-semibold">
                            <th className="px-5 py-3">Cliente / Tenant</th>
                            <th className="px-4 py-3">Plano Atual</th>
                            <th className="px-4 py-3">Assentos Alocados</th>
                            <th className="px-4 py-3">Utilização da Cota</th>
                            <th className="px-5 py-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {tenantsFiltrados.map((t) => {
                            const planoInfo =
                              DEFINICAO_PLANOS.find((p) => p.id === (t.plano || 'free')) ||
                              DEFINICAO_PLANOS[0];
                            const qtdUsuarios = t.qtd_usuarios ?? 0;
                            const limiteTotal = t.limite_usuarios || planoInfo.limiteDefault;
                            const pctUso = Math.min(
                              100,
                              Math.round((qtdUsuarios / Math.max(limiteTotal, 1)) * 100)
                            );

                            const corBarra =
                              pctUso >= 90
                                ? 'bg-red-500'
                                : pctUso >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500';

                            return (
                              <tr
                                key={t.id}
                                className="hover:bg-surface-subtle/30 transition-colors"
                              >
                                {/* Cliente */}
                                <td className="px-5 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                                      {(t.nome || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-ink-primary truncate max-w-xs">
                                        {t.nome}
                                      </p>
                                      <p className="text-[11px] text-ink-secondary font-mono truncate">
                                        {t.slug || t.id.slice(0, 8)}
                                      </p>
                                    </div>
                                  </div>
                                </td>

                                {/* Plano */}
                                <td className="px-4 py-3.5">
                                  <Badge variant={planoInfo.corBadge} size="xs" className="gap-1">
                                    <HugeiconsIcon icon={planoInfo.icone} size={12} strokeWidth={2} />
                                    <span>{planoInfo.label}</span>
                                  </Badge>
                                </td>

                                {/* Assentos */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <HugeiconsIcon
                                      icon={UserGroupIcon}
                                      size={14}
                                      strokeWidth={1.8}
                                      className="text-ink-secondary"
                                    />
                                    <span className="font-bold text-ink-primary">
                                      {qtdUsuarios}
                                    </span>
                                    <span className="text-ink-secondary">/ {limiteTotal}</span>
                                  </div>
                                </td>

                                {/* Barra de Uso */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-3 min-w-[140px] max-w-[200px]">
                                    <div className="flex-1 h-2 rounded-full bg-surface-subtle overflow-hidden border border-surface-border/50">
                                      <div
                                        className={`h-full ${corBarra} rounded-full transition-all duration-300`}
                                        style={{ width: `${pctUso}%` }}
                                      />
                                    </div>
                                    <span
                                      className={`text-[11px] font-mono font-bold shrink-0 ${
                                        pctUso >= 90
                                          ? 'text-red-500'
                                          : pctUso >= 70
                                            ? 'text-amber-500'
                                            : 'text-ink-secondary'
                                      }`}
                                    >
                                      {pctUso}%
                                    </span>
                                  </div>
                                </td>

                                {/* Ação */}
                                <td className="px-5 py-3.5 text-right">
                                  <button
                                    onClick={() => setTenantEditar(t)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-ink-primary text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer ml-auto"
                                  >
                                    <HugeiconsIcon icon={Edit02Icon} size={14} strokeWidth={2} />
                                    <span>Editar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Modal de Edição */}
        {tenantEditar && (
          <ModalEditarPlano
            tenant={tenantEditar}
            onSalvar={handleSalvar}
            onFechar={() => setTenantEditar(null)}
            salvando={salvando}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default PlanoLimites;
