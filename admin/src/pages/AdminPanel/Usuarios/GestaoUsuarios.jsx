// =============================================================
// PRANCHETO.IA - GESTÃO DE USUÁRIOS (Super Admin)
// Gestão de membros, credenciais, cargos e impersonation de sessões.
//
// Construído com:
// - Componentes ReUI (Card, Badge, Tooltip)
// - Ícones oficiais HugeIcons (@hugeicons/react)
// - Design System Prancheto (Dark/Light mode, superfícies sólidas, largura fluida)
//
// ROTA: /usuarios (ou /admin/usuarios)
// ACESSO: Super Admin
// =============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useUIStore } from '../../../store/uiStore.js';
import { Badge } from '@/components/reui/badge';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { SimpleTooltip, TooltipProvider } from '@/components/reui/tooltip';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserGroupIcon,
  UserIcon,
  Building01Icon,
  Search01Icon,
  Cancel01Icon,
  RefreshIcon,
  Edit02Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  PlusSignIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Login01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';

// =============================================================
// CONSTANTES DE CARGOS E STATUS
// =============================================================
const CARGOS = [
  { value: 'admin',   label: 'Administrador', variant: 'violet' },
  { value: 'manager', label: 'Gerente',       variant: 'primary' },
  { value: 'member',  label: 'Membro',        variant: 'success' },
  { value: 'viewer',  label: 'Visualizador',  variant: 'secondary' },
];

const STATUS_OPCOES = [
  { value: 'ativo',   label: 'Ativo',   variant: 'success' },
  { value: 'inativo', label: 'Inativo', variant: 'destructive' },
];

// =============================================================
// COMPONENTE: Modal de Criar / Editar Usuário
// =============================================================
const ModalUsuario = ({ usuario, tenants, onSalvar, onFechar, salvando }) => {
  const editando = !!usuario?.id;

  const [form, setForm] = useState({
    nome:     usuario?.nome     || '',
    email:    usuario?.email    || '',
    cargo:    usuario?.cargo    || 'member',
    tenantId: usuario?.tenantId || (tenants[0]?.id || ''),
    senha:    '',
  });
  const [erros, setErros] = useState({});

  const atualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros((prev) => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const novosErros = {};
    if (!form.nome.trim()) novosErros.nome = 'Nome é obrigatório.';
    if (!form.email.trim()) novosErros.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      novosErros.email = 'E-mail corporativo inválido.';
    if (!editando && !form.senha.trim())
      novosErros.senha = 'Senha provisória é obrigatória para novos usuários.';
    if (form.senha && form.senha.length < 8)
      novosErros.senha = 'A senha deve conter no mínimo 8 caracteres.';
    if (!form.tenantId) novosErros.tenantId = 'Selecione uma organização/cliente.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    const payload = { ...form };
    if (!payload.senha) delete payload.senha;
    onSalvar(payload);
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
              {editando ? 'Editar Usuário' : 'Novo Usuário'}
            </h2>
            <p className="text-xs text-ink-secondary mt-0.5">
              {editando ? usuario.email : 'Cadastrar credencial de acesso ao sistema'}
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
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Ex: Ana Silva"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.nome ? 'border-red-500' : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando}
            />
            {erros.nome && <p className="text-red-500 text-xs mt-1">{erros.nome}</p>}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              E-mail de Acesso
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="ana.silva@empresa.com"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.email ? 'border-red-500' : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando || editando}
            />
            {editando && (
              <p className="text-[11px] text-ink-secondary mt-1">
                O e-mail é o identificador de autenticação e não pode ser alterado.
              </p>
            )}
            {erros.email && <p className="text-red-500 text-xs mt-1">{erros.email}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-ink-primary mb-1.5">
              {editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => atualizar('senha', e.target.value)}
              placeholder={editando ? '••••••••' : 'Mínimo de 8 caracteres'}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                erros.senha ? 'border-red-500' : 'border-surface-border focus:border-brand-primary'
              }`}
              disabled={salvando}
            />
            {erros.senha && <p className="text-red-500 text-xs mt-1">{erros.senha}</p>}
          </div>

          {/* Cargo + Organização */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Cargo / Perfil
              </label>
              <select
                value={form.cargo}
                onChange={(e) => atualizar('cargo', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-surface-border bg-surface-card text-xs font-medium text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
                disabled={salvando}
              >
                {CARGOS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-primary mb-1.5">
                Organização (Tenant)
              </label>
              <select
                value={form.tenantId}
                onChange={(e) => atualizar('tenantId', e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium bg-surface-card text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  erros.tenantId
                    ? 'border-red-500'
                    : 'border-surface-border focus:border-brand-primary'
                }`}
                disabled={salvando || editando}
              >
                <option value="">Selecione...</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              {erros.tenantId && (
                <p className="text-red-500 text-xs mt-1">{erros.tenantId}</p>
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
                  <span>{editando ? 'Salvar Alterações' : 'Criar Usuário'}</span>
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
// COMPONENTE: Modal de Confirmação (Status)
// =============================================================
const ModalConfirmacao = ({ titulo, mensagem, onConfirmar, onCancelar, confirmando }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    onClick={(e) => e.target === e.currentTarget && onCancelar()}
  >
    <div className="bg-surface dark:bg-[#111928] border border-surface-border rounded-2xl shadow-xl w-full max-w-sm p-6">
      <h3 className="font-bold text-base text-ink-primary mb-2">{titulo}</h3>
      <p className="text-xs text-ink-secondary mb-6 leading-relaxed">{mensagem}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={onCancelar}
          className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary transition-colors cursor-pointer"
          disabled={confirmando}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
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

// =============================================================
// COMPONENTE PRINCIPAL: GestaoUsuarios
// =============================================================
const GestaoUsuarios = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantParam = searchParams.get('tenantId') || '';

  const { iniciarImpersonation } = useAuthStore();
  const adicionarNotificacao = useUIStore((s) => s.adicionarNotificacao);

  const [usuarios, setUsuarios] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTenant, setFiltroTenant] = useState(tenantParam);
  const [modalCriar, setModalCriar] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [confirmacao, setConfirmacao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [impersonando, setImpersonando] = useState(null);

  // Sincroniza se o tenantParam mudar na URL
  useEffect(() => {
    if (tenantParam) {
      setFiltroTenant(tenantParam);
    }
  }, [tenantParam]);

  // --- Carregar Tenants ---
  const carregarTenants = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('id, nome')
        .order('nome', { ascending: true });
      setTenants(data || []);
    } catch {
      // Silencioso
    }
  }, []);

  // --- Carregar Usuários ---
  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      let query = supabase
        .from('users')
        .select('*, tenants!users_tenant_id_fkey(nome)', { count: 'exact' });

      if (busca) query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`);
      if (filtroStatus) query = query.eq('status', filtroStatus);
      if (filtroTenant) query = query.eq('tenant_id', filtroTenant);

      const inicio = (pagina - 1) * 15;
      const fim = inicio + 14;
      query = query.range(inicio, fim).order('criado_em', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;

      const lista = (data || []).map((u) => ({
        ...u,
        tenantNome: u.tenants ? u.tenants.nome : '—',
      }));

      setUsuarios(lista);
      setTotal(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / 15) || 1);
    } catch (err) {
      setErro(err?.message || 'Erro ao carregar usuários.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroStatus, filtroTenant]);

  useEffect(() => {
    carregarTenants();
  }, [carregarTenants]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => setPagina(1), 350);
    return () => clearTimeout(timer);
  }, [busca]);

  // Totais para KPI cards
  const kpis = useMemo(() => {
    const ativos = usuarios.filter((u) => u.status === 'ativo').length;
    const inativos = usuarios.filter((u) => u.status === 'inativo').length;
    const admins = usuarios.filter((u) => u.cargo === 'admin').length;
    return { ativos, inativos, admins };
  }, [usuarios]);

  // --- Ações CRUD ---
  const handleCriar = async (dados) => {
    setSalvando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'create', payload: dados },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setModalCriar(false);
      setPagina(1);
      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Usuário "${dados.email}" cadastrado.`);
      }
      await carregarUsuarios();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao criar usuário.');
      } else {
        alert(err?.message || 'Erro ao criar usuário.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = async (dados) => {
    setSalvando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update', userId: usuarioEditar.id, payload: dados },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUsuarioEditar(null);
      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Usuário "${usuarioEditar.email}" atualizado.`);
      }
      await carregarUsuarios();
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao atualizar usuário.');
      } else {
        alert(err?.message || 'Erro ao atualizar usuário.');
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async () => {
    if (!confirmacao) return;
    const { usuario } = confirmacao;
    const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo';
    setSalvando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'status', userId: usuario.id, payload: { status: novoStatus } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const emailUsuario = usuario.email;
      setConfirmacao(null);
      if (adicionarNotificacao) {
        adicionarNotificacao(
          'success',
          `Usuário "${emailUsuario}" alterado para ${novoStatus}.`
        );
      }
      await carregarUsuarios();
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

  // --- Impersonation ---
  const handleImpersonar = async (usuario) => {
    setImpersonando(usuario.id);
    try {
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { targetUserId: usuario.id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const { token, session } = data;
      iniciarImpersonation(token, usuario);

      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (adicionarNotificacao) {
        adicionarNotificacao('success', `Sessão iniciada como "${usuario.nome || usuario.email}".`);
      }
      navigate('/', { replace: true });
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao(
          'error',
          err?.message || 'Não foi possível iniciar a sessão como este usuário.'
        );
      } else {
        alert(err?.message || 'Não foi possível iniciar a sessão como este usuário.');
      }
    } finally {
      setImpersonando(null);
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
                Gestão de Usuários
              </h1>
              <p className="text-xs md:text-sm text-ink-secondary">
                Administração de acessos, credenciais, cargos e impersonation de sessões.
              </p>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <button
                onClick={carregarUsuarios}
                disabled={carregando}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-surface-border bg-surface-card hover:bg-surface-subtle text-ink-primary shadow-2xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                title="Recarregar usuários"
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
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>

          {/* ─── KPI CARDS ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Total de Usuários</p>
                  <p className="text-2xl font-bold text-ink-primary mt-1 font-mono">{total}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <HugeiconsIcon icon={UserGroupIcon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink-secondary">Usuários Ativos</p>
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
                  <p className="text-xs font-semibold text-ink-secondary">Usuários Inativos</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 font-mono">
                    {kpis.inativos}
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
                  <p className="text-xs font-semibold text-ink-secondary">Administradores</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">
                    {kpis.admins}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={2} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── FILTROS & BUSCA ───────────────────────────── */}
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
                  placeholder="Pesquisar por nome ou e-mail..."
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
                className="w-full sm:w-40 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>

              {/* Filtro de Organização */}
              <select
                value={filtroTenant}
                onChange={(e) => {
                  setFiltroTenant(e.target.value);
                  setPagina(1);
                }}
                className="w-full sm:w-52 px-3 py-2 text-xs rounded-xl border border-surface-border bg-surface text-ink-primary focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-brand-primary"
              >
                <option value="">Todas as organizações</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs text-ink-secondary whitespace-nowrap self-end sm:self-center">
              Total: <strong>{total}</strong> usuário(s)
            </span>
          </div>

          {/* ─── TABELA DE USUÁRIOS ─────────────────────────── */}
          <Card className="overflow-hidden">
            {carregando ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-ink-secondary">Carregando usuários...</p>
              </div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
                  <HugeiconsIcon icon={Alert02Icon} size={20} strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-ink-primary">Falha ao carregar usuários</p>
                <p className="text-[11px] text-ink-secondary">{erro}</p>
                <button
                  onClick={carregarUsuarios}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Tentar novamente
                </button>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <div className="w-10 h-10 rounded-full bg-surface-subtle text-ink-secondary flex items-center justify-center">
                  <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-ink-primary">Nenhum usuário encontrado</p>
                <p className="text-[11px] text-ink-secondary">
                  Tente alterar a busca ou os filtros de status e organização.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface-subtle/40 text-ink-secondary font-semibold">
                      <th className="px-5 py-3">Membro</th>
                      <th className="px-4 py-3">Organização (Tenant)</th>
                      <th className="px-4 py-3">Cargo / Função</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Data de Entrada</th>
                      <th className="px-5 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {usuarios.map((u) => {
                      const confCargo = CARGOS.find((c) => c.value === u.cargo) || CARGOS[2];
                      const confStatus =
                        STATUS_OPCOES.find((s) => s.value === u.status) || STATUS_OPCOES[0];

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-subtle/30 transition-colors"
                        >
                          {/* Membro */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-500/20">
                                {(u.nome || u.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-ink-primary truncate max-w-xs">
                                  {u.nome || 'Usuário sem nome'}
                                </p>
                                <p className="text-[11px] text-ink-secondary truncate font-mono">
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Organização */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-ink-primary">
                              <HugeiconsIcon
                                icon={Building01Icon}
                                size={14}
                                strokeWidth={1.8}
                                className="text-ink-secondary"
                              />
                              <span className="font-medium truncate max-w-[180px]">
                                {u.tenantNome}
                              </span>
                            </div>
                          </td>

                          {/* Cargo */}
                          <td className="px-4 py-3.5">
                            <Badge variant={confCargo.variant} size="xs">
                              {confCargo.label}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5">
                            <Badge variant={confStatus.variant} size="xs" className="gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'ativo'
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-red-500'
                                }`}
                              />
                              <span>{confStatus.label}</span>
                            </Badge>
                          </td>

                          {/* Criado em */}
                          <td className="px-4 py-3.5 text-ink-secondary font-mono text-[11px]">
                            {u.criado_em
                              ? new Date(u.criado_em).toLocaleDateString('pt-BR')
                              : '—'}
                          </td>

                          {/* Ações */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonation */}
                              <SimpleTooltip content="Acessar conta como este usuário (Impersonation)">
                                <button
                                  onClick={() => handleImpersonar(u)}
                                  disabled={impersonando === u.id}
                                  className="p-1.5 rounded-lg text-ink-secondary hover:text-purple-600 hover:bg-purple-500/10 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {impersonando === u.id ? (
                                    <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <HugeiconsIcon icon={Login01Icon} size={15} strokeWidth={2} />
                                  )}
                                </button>
                              </SimpleTooltip>

                              {/* Editar */}
                              <SimpleTooltip content="Editar Dados do Usuário">
                                <button
                                  onClick={() => setUsuarioEditar(u)}
                                  className="p-1.5 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Edit02Icon} size={15} strokeWidth={2} />
                                </button>
                              </SimpleTooltip>

                              {/* Ativar/Desativar */}
                              <SimpleTooltip
                                content={u.status === 'ativo' ? 'Desativar Usuário' : 'Ativar Usuário'}
                              >
                                <button
                                  onClick={() =>
                                    setConfirmacao({
                                      usuario: u,
                                      titulo:
                                        u.status === 'ativo'
                                          ? 'Desativar Usuário'
                                          : 'Ativar Usuário',
                                      mensagem:
                                        u.status === 'ativo'
                                          ? `Deseja realmente desativar o acesso de ${u.nome || u.email}? O usuário não conseguirá autenticar.`
                                          : `Deseja reativar o acesso de ${u.nome || u.email}?`,
                                    })
                                  }
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    u.status === 'ativo'
                                      ? 'text-ink-secondary hover:text-red-600 hover:bg-red-500/10'
                                      : 'text-ink-secondary hover:text-emerald-600 hover:bg-emerald-500/10'
                                  }`}
                                >
                                  <HugeiconsIcon
                                    icon={u.status === 'ativo' ? Alert02Icon : CheckmarkCircle01Icon}
                                    size={15}
                                    strokeWidth={2}
                                  />
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
        {(modalCriar || usuarioEditar) && (
          <ModalUsuario
            usuario={usuarioEditar}
            tenants={tenants}
            onSalvar={usuarioEditar ? handleEditar : handleCriar}
            onFechar={() => {
              setModalCriar(false);
              setUsuarioEditar(null);
            }}
            salvando={salvando}
          />
        )}

        {/* Modal de Confirmação */}
        {confirmacao && (
          <ModalConfirmacao
            titulo={confirmacao.titulo}
            mensagem={confirmacao.mensagem}
            onConfirmar={handleAlterarStatus}
            onCancelar={() => setConfirmacao(null)}
            confirmando={salvando}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default GestaoUsuarios;
