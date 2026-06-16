// =============================================================
// PRANCHETO.IA - GESTÃO DE CLIENTES (Super Admin)
// Página completa de gerenciamento de tenants (empresas clientes).
//
// FUNCIONALIDADES:
//   - Listar todos os clientes com paginação e filtros
//   - Criar novo cliente (tenant)
//   - Editar dados de um cliente
//   - Suspender / Reativar / Cancelar cliente
//   - Ver contagem de usuários por cliente
//
// ROTA: /admin/clientes
// ACESSO: Apenas Super Admin
// Backend: GET/POST/PUT/PATCH /api/admin/tenants
// Resposta do backend: { dados, paginacao }
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';

// =============================================================
// CONSTANTES
// =============================================================
const PLANOS = [
  { value: 'free',       label: 'Free' },
  { value: 'starter',    label: 'Starter' },
  { value: 'pro',        label: 'Pro' },
  { value: 'enterprise', label: 'Enterprise' },
];

const BADGE_PLANO = {
  free:       'bg-slate-700/50 text-slate-300 border-slate-600/50',
  starter:    'bg-blue-900/50 text-blue-300 border-blue-700/50',
  pro:        'bg-purple-900/50 text-purple-300 border-purple-700/50',
  enterprise: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
};

const BADGE_STATUS = {
  active:    'bg-green-900/50 text-green-400 border-green-700/50',
  suspended: 'bg-red-900/50 text-red-400 border-red-700/50',
  cancelled: 'bg-slate-700/50 text-slate-400 border-slate-600/50',
};

const LABEL_STATUS = {
  active:    'Ativo',
  suspended: 'Suspenso',
  cancelled: 'Cancelado',
};

// =============================================================
// COMPONENTE: Spinner
// =============================================================
const Spinner = ({ tamanho = 'md' }) => {
  const cls = tamanho === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4';
  return (
    <div className={`${cls} border-primary-500 border-t-transparent rounded-full animate-spin`} />
  );
};

// =============================================================
// COMPONENTE: Modal de Criar/Editar Cliente
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

  // Auto-gera slug a partir do nome (apenas na criação)
  const gerarSlug = (nome) =>
    nome.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const atualizar = (campo, valor) => {
    setForm(prev => {
      const novo = { ...prev, [campo]: valor };
      // Auto-preenche slug ao digitar nome (apenas criação)
      if (campo === 'nome' && !editando) {
        novo.slug = gerarSlug(valor);
      }
      return novo;
    });
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const novosErros = {};
    if (!form.nome.trim())          novosErros.nome          = 'Nome é obrigatório.';
    if (!form.slug.trim())          novosErros.slug          = 'Slug é obrigatório.';
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      novosErros.slug = 'Slug deve conter apenas letras minúsculas, números e hífens.';
    if (!form.email_contato.trim()) novosErros.email_contato = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_contato))
      novosErros.email_contato = 'E-mail inválido.';
    if (!form.limite_usuarios || form.limite_usuarios < 1)
      novosErros.limite_usuarios = 'Limite deve ser pelo menos 1.';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({ ...form, limite_usuarios: parseInt(form.limite_usuarios) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-surface border border-primary-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-800">
          <h2 className="text-white font-semibold text-lg">
            {editando ? '✏️ Editar Cliente' : '➕ Novo Cliente'}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome da empresa</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="Acme Corp"
              className={`input w-full ${erros.nome ? 'border-red-500' : ''}`}
              disabled={salvando}
            />
            {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Slug <span className="text-slate-500 font-normal">(identificador único)</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => atualizar('slug', e.target.value.toLowerCase())}
              placeholder="acme-corp"
              className={`input w-full font-mono text-sm ${erros.slug ? 'border-red-500' : ''}`}
              disabled={salvando || editando}
            />
            {editando && <p className="text-slate-500 text-xs mt-1">Slug não pode ser alterado.</p>}
            {erros.slug && <p className="text-red-400 text-xs mt-1">{erros.slug}</p>}
          </div>

          {/* E-mail de contato */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail de contato</label>
            <input
              type="email"
              value={form.email_contato}
              onChange={(e) => atualizar('email_contato', e.target.value)}
              placeholder="contato@empresa.com"
              className={`input w-full ${erros.email_contato ? 'border-red-500' : ''}`}
              disabled={salvando}
            />
            {erros.email_contato && <p className="text-red-400 text-xs mt-1">{erros.email_contato}</p>}
          </div>

          {/* Plano + Limite de usuários (lado a lado) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Plano</label>
              <select
                value={form.plano}
                onChange={(e) => atualizar('plano', e.target.value)}
                className="input w-full"
                disabled={salvando}
              >
                {PLANOS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Limite de usuários</label>
              <input
                type="number"
                min="1"
                max="9999"
                value={form.limite_usuarios}
                onChange={(e) => atualizar('limite_usuarios', e.target.value)}
                className={`input w-full ${erros.limite_usuarios ? 'border-red-500' : ''}`}
                disabled={salvando}
              />
              {erros.limite_usuarios && <p className="text-red-400 text-xs mt-1">{erros.limite_usuarios}</p>}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1" disabled={salvando}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={salvando}
            >
              {salvando ? <><Spinner tamanho="sm" /> Salvando...</> : (editando ? 'Salvar alterações' : 'Criar cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE: Modal de Confirmação de Status
// =============================================================
const ModalStatusTenant = ({ tenant, onConfirmar, onCancelar, confirmando }) => {
  const [novoStatus, setNovoStatus] = useState(
    tenant.status === 'active' ? 'suspended' : 'active'
  );

  const opcoes = [
    { value: 'active',    label: '✅ Reativar',  cor: 'text-green-400' },
    { value: 'suspended', label: '⏸️ Suspender', cor: 'text-amber-400' },
    { value: 'cancelled', label: '❌ Cancelar',  cor: 'text-red-400' },
  ].filter(o => o.value !== tenant.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div className="bg-surface border border-primary-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-white font-semibold text-lg mb-1">Alterar status</h3>
        <p className="text-slate-400 text-sm mb-4">
          Cliente: <strong className="text-white">{tenant.nome}</strong>
        </p>

        <div className="space-y-2 mb-6">
          {opcoes.map(o => (
            <label key={o.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary-900/30">
              <input
                type="radio"
                name="novoStatus"
                value={o.value}
                checked={novoStatus === o.value}
                onChange={() => setNovoStatus(o.value)}
                className="accent-primary-500"
              />
              <span className={`font-medium ${o.cor}`}>{o.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancelar} className="btn-secondary flex-1" disabled={confirmando}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirmar(novoStatus)}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            disabled={confirmando}
          >
            {confirmando && <Spinner tamanho="sm" />}
            Confirmar
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

  const [clientes,     setClientes]     = useState([]);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState(null);
  const [pagina,       setPagina]       = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [total,        setTotal]        = useState(0);
  const [busca,        setBusca]        = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPlano,  setFiltroPlano]  = useState('');
  const [modalCriar,   setModalCriar]   = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [clienteStatus, setClienteStatus] = useState(null);
  const [salvando,     setSalvando]     = useState(false);

  // --- Carregar clientes ---
  const carregarClientes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const params = { pagina, limite: 15 };
      if (busca)        params.busca   = busca;
      if (filtroStatus) params.status  = filtroStatus;
      if (filtroPlano)  params.plano   = filtroPlano;

      // Backend retorna { dados, paginacao }
      const resp = await api.get('/admin/tenants', { params });
      const { dados, paginacao } = resp.data;

      setClientes(dados || []);
      setTotal(paginacao?.total || 0);
      setTotalPaginas(paginacao?.totalPaginas || 1);
    } catch (err) {
      setErro(err?.response?.data?.mensagem || err?.response?.data?.erro || 'Erro ao carregar clientes.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroStatus, filtroPlano]);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => setPagina(1), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  // --- CRUD ---
  const handleCriar = async (dados) => {
    setSalvando(true);
    try {
      await api.post('/admin/tenants', dados);
      setModalCriar(false);
      setPagina(1);
      await carregarClientes();
    } catch (err) {
      alert(err?.response?.data?.erro || err?.response?.data?.mensagem || 'Erro ao criar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = async (dados) => {
    setSalvando(true);
    try {
      await api.put(`/admin/tenants/${clienteEditar.id}`, dados);
      setClienteEditar(null);
      await carregarClientes();
    } catch (err) {
      alert(err?.response?.data?.erro || err?.response?.data?.mensagem || 'Erro ao atualizar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const handleAlterarStatus = async (novoStatus) => {
    if (!clienteStatus) return;
    setSalvando(true);
    try {
      await api.patch(`/admin/tenants/${clienteStatus.id}/status`, { status: novoStatus });
      setClienteStatus(null);
      await carregarClientes();
    } catch (err) {
      alert(err?.response?.data?.erro || err?.response?.data?.mensagem || 'Erro ao alterar status.');
    } finally {
      setSalvando(false);
    }
  };

  // =============================================================
  // RENDER
  // =============================================================
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-primary-800 bg-primary-950/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-2xl">🏢</span>
          <div>
            <span className="text-white font-semibold">Gestão de Clientes</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Super Admin
            </span>
          </div>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <span>+</span> Novo Cliente
        </button>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-5">

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome..."
                className="input w-full pl-9"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}
              className="input w-40"
            >
              <option value="">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
              <option value="cancelled">Cancelado</option>
            </select>

            <select
              value={filtroPlano}
              onChange={(e) => { setFiltroPlano(e.target.value); setPagina(1); }}
              className="input w-40"
            >
              <option value="">Todos os planos</option>
              {PLANOS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <span className="text-slate-400 text-sm whitespace-nowrap">
              {total} cliente{total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabela */}
          <div className="card p-0 overflow-hidden">
            {carregando ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">⚠️</span>
                <p className="text-slate-400 text-sm">{erro}</p>
                <button onClick={carregarClientes} className="btn-secondary text-sm">Tentar novamente</button>
              </div>
            ) : clientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">🏢</span>
                <p className="text-slate-400 text-sm">
                  {busca || filtroStatus || filtroPlano
                    ? 'Nenhum cliente encontrado com os filtros aplicados.'
                    : 'Nenhum cliente cadastrado ainda.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-800 bg-primary-950/30">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Empresa</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Slug</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Plano</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuários</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Criado em</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-800/50">
                    {clientes.map((c) => (
                      <tr key={c.id} className="hover:bg-primary-900/20 transition-colors">
                        {/* Empresa */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                              {(c.nome || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{c.nome}</p>
                              <p className="text-slate-400 text-xs truncate">{c.email_contato}</p>
                            </div>
                          </div>
                        </td>

                        {/* Slug */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-400 bg-primary-900/50 px-2 py-0.5 rounded">
                            {c.slug}
                          </span>
                        </td>

                        {/* Plano */}
                        <td className="px-4 py-3">
                          <span className={`badge border ${BADGE_PLANO[c.plano] || BADGE_PLANO.free}`}>
                            {PLANOS.find(p => p.value === c.plano)?.label || c.plano}
                          </span>
                        </td>

                        {/* Usuários */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-medium">{c.qtd_usuarios ?? 0}</span>
                            <span className="text-slate-500 text-xs">/ {c.limite_usuarios}</span>
                          </div>
                          {/* Barra de progresso */}
                          <div className="w-16 h-1 bg-primary-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full transition-all"
                              style={{ width: `${Math.min(100, ((c.qtd_usuarios ?? 0) / c.limite_usuarios) * 100)}%` }}
                            />
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 badge border ${BADGE_STATUS[c.status] || BADGE_STATUS.active}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              c.status === 'active' ? 'bg-green-400' :
                              c.status === 'suspended' ? 'bg-red-400' : 'bg-slate-400'
                            }`} />
                            {LABEL_STATUS[c.status] || c.status}
                          </span>
                        </td>

                        {/* Criado em */}
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {c.criado_em
                            ? new Date(c.criado_em).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Ver usuários */}
                            <button
                              onClick={() => navigate(`/admin/usuarios?tenantId=${c.id}`)}
                              title="Ver usuários deste cliente"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-primary-800 hover:text-white transition-colors"
                            >
                              <span className="text-base">👥</span>
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => setClienteEditar(c)}
                              title="Editar cliente"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-primary-800 hover:text-white transition-colors"
                            >
                              <span className="text-base">✏️</span>
                            </button>

                            {/* Alterar status */}
                            <button
                              onClick={() => setClienteStatus(c)}
                              title="Alterar status"
                              className={`p-1.5 rounded-md transition-colors ${
                                c.status === 'active'
                                  ? 'text-amber-400 hover:bg-amber-900/30 hover:text-amber-300'
                                  : 'text-green-400 hover:bg-green-900/30 hover:text-green-300'
                              }`}
                            >
                              <span className="text-base">{c.status === 'active' ? '⏸️' : '▶️'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1 || carregando}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-slate-400 text-sm">Página {pagina} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas || carregando}
                className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Criar cliente */}
      {modalCriar && (
        <ModalCliente
          onSalvar={handleCriar}
          onFechar={() => setModalCriar(false)}
          salvando={salvando}
        />
      )}

      {/* Modal: Editar cliente */}
      {clienteEditar && (
        <ModalCliente
          cliente={clienteEditar}
          onSalvar={handleEditar}
          onFechar={() => setClienteEditar(null)}
          salvando={salvando}
        />
      )}

      {/* Modal: Alterar status */}
      {clienteStatus && (
        <ModalStatusTenant
          tenant={clienteStatus}
          onConfirmar={handleAlterarStatus}
          onCancelar={() => setClienteStatus(null)}
          confirmando={salvando}
        />
      )}
    </div>
  );
};

export default GestaoClientes;
