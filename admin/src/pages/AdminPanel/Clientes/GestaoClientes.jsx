// =============================================================
// PRANCHETO.IA - GESTÃO DE CLIENTES & TENANTS (Super Admin)
// Gestão completa de empresas, planos e cotas corporativas.
//
// Construído com:
// - Componentes ReUI (Card, Badge, Tooltip)
// - Ícones oficiais HugeIcons (@hugeicons/react)
// - Design System Prancheto (Dark/Light mode, superfícies sólidas, largura fluida)
//
// ROTA: /clientes
// ACESSO: Super Admin
// =============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useUIStore } from '../../../store/uiStore.js';
import { Badge } from '@/components/reui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { SimpleTooltip, TooltipProvider } from '@/components/reui/tooltip';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building01Icon,
  UserGroupIcon,
  Search01Icon,
  Cancel01Icon,
  RefreshIcon,
  Edit02Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  PlusSignIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
} from '@hugeicons/core-free-icons';

// =============================================================
// CONSTANTES DE CONFIGURAÇÃO VISUAL
// =============================================================
const PLANOS = [
  { value: 'free',       label: 'Free',       variant: 'secondary' },
  { value: 'starter',    label: 'Starter',    variant: 'primary' },
  { value: 'pro',        label: 'Pro',        variant: 'violet' },
  { value: 'enterprise', label: 'Enterprise', variant: 'warning' },
];

const STATUS_OPCOES = [
  { value: 'active',    label: 'Ativo',     variant: 'success' },
  { value: 'suspended', label: 'Suspenso',  variant: 'destructive' },
  { value: 'cancelled', label: 'Cancelado', variant: 'secondary' },
];

// =============================================================
// COMPONENTE: Modal de Criar / Editar Cliente
// =============================================================
const ModalCliente = ({ cliente, onSalvar, onFechar, salvando }) => {
  const editando = !!cliente?.id;

  const [form, setForm] = useState({
    nome:            cliente?.nome            || '',
    slug:            cliente?.slug            || '',
    email_contato:   cliente?.email_contato   || '',
    plano:           cliente?.plano           || 'free',
    limite_usuarios: cliente?.limite_usuarios || 5,
  });
  const [erros, setErros] = useState({});

  const gerarSlug = (nome) =>
    nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const atualizar = (campo, valor) => {
    setForm((prev) => {
      const novo = { ...prev, [campo]: valor };
      if (campo === 'nome' && !editando) {
        novo.slug = gerarSlug(valor);
      }
      return novo;
    });
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!form.slug.trim()) novosErros.slug = 'Slug é obrigatório.';
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      novosErros.slug = 'Slug deve conter apenas letras minúsculas, números e hífens.';
    if (!form.email_contato.trim()) novosErros.email_contato = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_contato))
      novosErros.email_contato = 'E-mail corporativo inválido.';
    if (!form.limite_usuarios || form.limite_usuarios < 1)
      novosErros.limite_usuarios = 'Limite de usuários deve ser de pelo menos 1.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({ ...form, limite_usuarios: parseInt(form.limite_usuarios, 10) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-surface dark:bg-[#111928] border border-surface-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-surface-subtle/50">
          <div>
            <h2 className="font-bold text-base text-ink-primary">
              {editando ? 'Editar Cliente' : 'Novo Cliente (Tenant)'}
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              {editando ? cliente.nome : 'Cadastrar nova empresa no ecossistema'}
            </p>
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome da empresa */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              Razão Social / Nome da Empresa
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Ex: Prancheto Soluções Digitais"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.nome ? 'border-red-500' : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando}
            />
            {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              Slug Identificador <span className="text-ink-secondary font-normal">(único)</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => atualizar('slug', e.target.value.toLowerCase())}
              placeholder="prancheto-solucoes"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.slug ? 'border-red-500' : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando || editando}
            />
            {editando && (
              <p className="text-[11px] text-ink-secondary mt-1">
                O slug é imutável após a criação da organização.
              </p>
            )}
            {erros.slug && <p className="text-red-500 text-xs mt-1">{erros.slug}</p>}
          </div>

          {/* E-mail de Contato */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              E-mail de Contato Principal
            </label>
            <input
              type="email"
              value={form.email_contato}
              onChange={(e) => atualizar('email_contato', e.target.value)}
              placeholder="contato@empresa.com.br"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.email_contato
                  ? 'border-red-500'
                  : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando}
            />
            {erros.email_contato && (
              <p className="text-red-500 text-xs mt-1">{erros.email_contato}</p>
            )}
          </div>

          {/* Plano + Limite de Usuários */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Plano Contratado
              </label>
              <select
                value={form.plano}
                onChange={(e) => atualizar('plano', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-card text-xs font-medium text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
                disabled={salvando}
              >
                {PLANOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Limite de Usuários
              </label>
              <input
                type="number"
                min="1"
                max="99999"
                value={form.limite_usuarios}
                onChange={(e) => atualizar('limite_usuarios', e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erros.limite_usuarios
                    ? 'border-red-500'
                    : 'border-surface-border focus:border-brand-primary'
                }`}
                disabled={salvando}
              />
              {erros.limite_usuarios && (
                <p className="text-red-500 text-xs mt-1">{erros.limite_usuarios}</p>
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {salvando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} strokeWidth={2} />
                  <span>{editando ? 'Salvar Alterações' : 'Criar Cliente'}</span>
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
// COMPONENTE: Modal de Alteração de Status
// =============================================================
const ModalStatusTenant = ({ tenant, onConfirmar, onCancelar, confirmando }) => {
  const [novoStatus, setNovoStatus] = useState(
    tenant.status === 'active' ? 'suspended' : 'active'
  );

  const opcoes = [
    { value: 'active',    label: 'Reativar Cliente', descricao: 'Restaura o acesso total de todos os membros', variant: 'success' },
    { value: 'suspended', label: 'Suspender Cliente', descricao: 'Bloqueia temporariamente o login de usuários', variant: 'destructive' },
    { value: 'cancelled', label: 'Cancelar Cliente',  descricao: 'Desativa o tenant e desativa a assinatura', variant: 'secondary' },
  ].filter((o) => o.value !== tenant.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className="bg-surface dark:bg-[#111928] border border-surface-border rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="font-bold text-base text-ink-primary mb-1">Alterar Status da Organização</h3>
        <p className="text-xs text-ink-secondary mb-4">
          Cliente: <strong className="text-ink-primary font-semibold">{tenant.nome}</strong>
        </p>

        <div className="space-y-2.5 mb-6">
          {opcoes.map((o) => (
            <label
              key={o.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                novoStatus === o.value
                  ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-2xs'
                  : 'border-surface-border bg-surface-card hover:bg-surface-subtle/50'
              }`}
            >
              <input
                type="radio"
                name="novoStatus"
                value={o.value}
                checked={novoStatus === o.value}
                onChange={() => setNovoStatus(o.value)}
                className="mt-0.5 accent-brand-primary cursor-pointer"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-primary">{o.label}</span>
                  <Badge variant={o.variant} size="xs">
                    {o.value}
                  </Badge>
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5">{o.descricao}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary transition-colors cursor-pointer"
            disabled={confirmando}
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(novoStatus)}
            className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            disabled={confirmando}
          >
            {confirmando && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: GestaoClientes
// =============================================================
const GestaoClientes = () => {
  const navigate = useNavigate();
  const adicionarNotificacao = useUIStore((s) => s.adicionarNotificacao);

  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPlano, setFiltroPlano] = useState('');
  const [modalCriar, setModalCriar] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [clienteStatus, setClienteStatus] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // --- Carregar Clientes ---
  const carregarClientes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      let query = supabase
        .from('tenants')
        .select('*, users(count)', { count: 'exact' });

      if (busca) query = query.ilike('nome', `%${busca}%`);
      if (filtroStatus) query = query.eq('status', filtroStatus);
      if (filtroPlano) query = query.eq('plano', filtroPlano);

      const inicio = (pagina - 1) * 15;
      const fim = inicio + 14;
      query = query.range(inicio, fim).order('criado_em', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;

      const dados = (data || []).map((c) => ({
        ...c,
        qtd_usuarios: c.users && c.users[0] ? c.users[0].count : 0,
      }));

      setClientes(dados);
      setTotal(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / 15) || 1);
    } catch (err) {
      setErro(err?.message || 'Erro ao carregar clientes.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroStatus, filtroPlano]);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => setPagina(1), 350);
    return () => clearTimeout(timer);
  }, [busca]);

  // Totais para KPI cards
  const kpis = useMemo(() => {
    const ativos = clientes.filter((c) => c.status === 'active').length;
    const suspensos = clientes.filter((c) => c.status === 'suspended').length;
    const totalUsuariosAlocados = clientes.reduce((acc, c) => acc + (c.qtd_usuarios || 0), 0);
    return { ativos, suspensos, totalUsuariosAlocados };
  }, [clientes]);

  // --- Ações CRUD ---
  const handleCriar = async (dados) => {
    setSalvando(true);
    try {
      const { error } = await supabase.from('tenants').insert(dados);
      if (error) throw error;

      setModalCriar(false);
      setPagina(1);
      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Cliente "${dados.nome}" cadastrado com sucesso.`);
      }
      await carregarClientes();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao criar cliente.');
      } else {
        alert(err?.message || 'Erro ao criar cliente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = async (dados) => {
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update(dados)
        .eq('id', clienteEditar.id);
      if (error) throw error;

      setClienteEditar(null);
      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Cliente "${dados.nome}" atualizado.`);
      }
      await carregarClientes();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao atualizar cliente.');
      } else {
        alert(err?.message || 'Erro ao atualizar cliente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async (novoStatus) => {
    if (!clienteStatus) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: novoStatus })
        .eq('id', clienteStatus.id);
      if (error) throw error;

      const nomeCliente = clienteStatus.nome;
      setClienteStatus(null);
      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Status de "${nomeCliente}" alterado para ${novoStatus}.`);
      }
      await carregarClientes();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao alterar status.');
      } else {
        alert(err?.message || 'Erro ao alterar status.');
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
              <h1 className="text-xl md:text-2xl font-bold text-ink-primary tracking-tight">
                Gestão de Clientes & Tenants
              </h1>
              <p className="text-xs md:text-sm text-ink-secondary">
                Controle de organizações corporativas, planos contratados e limites de assentos.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                onClick={carregarClientes}
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

              <button
                onClick={() => setModalCriar(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2.5} />
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* ─── KPI CARDS ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Total de Clientes</p>
                  <p className="text-2xl font-bold text-ink-primary mt-1 font-mono">{total}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <HugeiconsIcon icon={Building01Icon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                    {kpis.ativos}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Suspensos / Inativos</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
                    {kpis.suspensos}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Usuários Alocados</p>
                  <p className="text-2xl font-bold text-ink-primary mt-1 font-mono">
                    {kpis.totalUsuariosAlocados}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── BARRA DE FILTROS & BUSCA ───────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
              {/* Campo de Busca */}
              <div className="relative flex-1 min-w-[220px]">
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
                  placeholder="Pesquisar cliente..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary placeholder:text-ink-secondary/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary transition-all"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink-primary"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
                  </button>
                )}
              </div>

              {/* Filtro de Status */}
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value);
                  setPagina(1);
                }}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
              >
                <option value="">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="cancelled">Cancelado</option>
              </select>

              {/* Filtro de Plano */}
              <select
                value={filtroPlano}
                onChange={(e) => {
                  setFiltroPlano(e.target.value);
                  setPagina(1);
                }}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
              >
                <option value="">Todos os planos</option>
                {PLANOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-ink-secondary whitespace-nowrap self-end sm:self-center">
              Total: <strong>{total}</strong> cliente(s)
            </span>
          </div>

          {/* ─── TABELA DE CLIENTES ─────────────────────────── */}
          <Card className="overflow-hidden">
            {carregando ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-ink-secondary">Carregando organizações...</p>
              </div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-ink-primary">Falha ao carregar clientes</p>
                <p className="text-[11px] text-ink-secondary">{erro}</p>
                <button
                  onClick={carregarClientes}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            ) : clientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-surface-subtle text-ink-secondary flex items-center justify-center">
                  <HugeiconsIcon icon={Building01Icon} size={20} strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-ink-primary">Nenhum cliente encontrado</p>
                <p className="text-[11px] text-ink-secondary">
                  Tente alterar os termos de busca ou remover os filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-subtle/40 text-ink-secondary font-semibold">
                      <th className="px-5 py-3">Organização</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Plano</th>
                      <th className="px-4 py-3">Usuários / Cota</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Data de Cadastro</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {clientes.map((c) => {
                      const confPlano = PLANOS.find((p) => p.value === c.plano) || PLANOS[0];
                      const confStatus =
                        STATUS_OPCOES.find((s) => s.value === c.status) || STATUS_OPCOES[0];
                      const qtdUsuarios = c.qtd_usuarios ?? 0;
                      const limite = c.limite_usuarios || 5;
                      const pctUso = Math.min(
                        100,
                        Math.round((qtdUsuarios / Math.max(limite, 1)) * 100)
                      );

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-surface-subtle/30 transition-colors"
                        >
                          {/* Empresa */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                                {(c.nome || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-ink-primary truncate max-w-xs">
                                  {c.nome}
                                </p>
                                <p className="text-[11px] text-ink-secondary truncate">
                                  {c.email_contato || 'Sem e-mail'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="px-4 py-3.5 font-mono text-ink-secondary">
                            <span className="px-2 py-0.5 rounded-md bg-surface-subtle border border-surface-border/60">
                              {c.slug}
                            </span>
                          </td>

                          {/* Plano */}
                          <td className="px-4 py-3.5">
                            <Badge variant={confPlano.variant} size="xs">
                              {confPlano.label}
                            </Badge>
                          </td>

                          {/* Usuários */}
                          <td className="px-4 py-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-ink-primary">
                                <span className="font-bold">{qtdUsuarios}</span>
                                <span className="text-ink-secondary">/ {limite}</span>
                              </div>
                              <div className="w-20 h-1.5 rounded-full bg-surface-subtle overflow-hidden border border-surface-border/50">
                                <div
                                  className={`h-full ${
                                    pctUso >= 90
                                      ? 'bg-red-500'
                                      : pctUso >= 70
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                                  } rounded-full`}
                                  style={{ width: `${pctUso}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <Badge variant={confStatus.variant} size="xs" className="gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  c.status === 'active'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : c.status === 'suspended'
                                      ? 'bg-red-500'
                                      : 'bg-slate-400'
                                }`}
                              />
                              <span>{confStatus.label}</span>
                            </Badge>
                          </td>

                          {/* Criado em */}
                          <td className="px-4 py-3.5 text-ink-secondary font-mono text-[11px]">
                            {c.criado_em
                              ? new Date(c.criado_em).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>

                          {/* Ações */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Ver usuários */}
                              <SimpleTooltip content="Ver Usuários deste Cliente">
                                <button
                                  onClick={() => navigate(`/usuarios?tenantId=${c.id}`)}
                                  className="p-1.5 rounded-lg text-ink-secondary hover:text-blue-600 hover:bg-surface-subtle transition-colors cursor-pointer"
                                >
                                  <HugeiconsIcon icon={UserGroupIcon} size={15} strokeWidth={2} />
                                </button>
                              </SimpleTooltip>

                              {/* Editar */}
                              <SimpleTooltip content="Editar Dados do Cliente">
                                <button
                                  onClick={() => setClienteEditar(c)}
                                  className="p-1.5 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={15} strokeWidth={2} />
                                </button>
                              </SimpleTooltip>

                              {/* Alterar Status */}
                              <SimpleTooltip content="Alterar Status da Organização">
                                <button
                                  onClick={() => setClienteStatus(c)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    c.status === 'active'
                                      ? 'text-ink-secondary hover:text-amber-600 hover:bg-amber-500/10'
                                      : 'text-ink-secondary hover:text-emerald-600 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  <HugeiconsIcon icon={Alert02Icon} size={15} strokeWidth={2} />
                                </button>
                              </SimpleTooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border bg-surface-subtle/30 text-xs text-ink-secondary">
                <span>
                  Página <strong>{pagina}</strong> de <strong>{totalPaginas}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1 || carregando}
                    className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-ink-primary disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas || carregando}
                    className="p-1.5 rounded-lg border border-surface-border bg-surface hover:bg-surface-subtle text-ink-primary disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Modal de Criação / Edição */}
        {(modalCriar || clienteEditar) && (
          <ModalCliente
            cliente={clienteEditar}
            onSalvar={clienteEditar ? handleEditar : handleCriar}
            onFechar={() => {
              setModalCriar(false);
              setClienteEditar(null);
            }}
            salvando={salvando}
          />
        )}

        {/* Modal de Status */}
        {clienteStatus && (
          <ModalStatusTenant
            tenant={clienteStatus}
            onConfirmar={handleAlterarStatus}
            onCancelar={() => setClienteStatus(null)}
            confirmando={salvando}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default GestaoClientes;
