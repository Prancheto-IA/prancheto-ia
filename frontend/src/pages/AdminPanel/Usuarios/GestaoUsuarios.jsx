// =============================================================
// PRANCHETO.IA - GESTÃO DE USUÁRIOS (Super Admin)
// Página completa de gerenciamento de usuários de todos os tenants.
//
// FUNCIONALIDADES:
//   - Listar todos os usuários com paginação e filtros
//   - Criar novo usuário (com seleção de tenant e cargo)
//   - Editar dados de um usuário
//   - Ativar / Desativar usuário
//   - Impersonation: "Acessar como este usuário"
//
// ROTA: /admin/usuarios
// ACESSO: Apenas Super Admin
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';

// =============================================================
// CONSTANTES
// =============================================================
const CARGOS = [
  { value: 'admin',   label: 'Admin' },
  { value: 'manager', label: 'Gerente' },
  { value: 'member',  label: 'Membro' },
  { value: 'viewer',  label: 'Visualizador' },
];

const BADGE_CARGO = {
  admin:   'bg-purple-900/50 text-purple-300 border-purple-700/50',
  manager: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  member:  'bg-green-900/50 text-green-300 border-green-700/50',
  viewer:  'bg-slate-700/50 text-slate-300 border-slate-600/50',
};

const LABEL_CARGO = {
  admin:   'Admin',
  manager: 'Gerente',
  member:  'Membro',
  viewer:  'Visualizador',
};

// =============================================================
// COMPONENTE: Spinner
// =============================================================
const Spinner = ({ tamanho = 'md' }) => {
  const cls = tamanho === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4';
  return (
    <div
      className={`${cls} border-primary-500 border-t-transparent rounded-full animate-spin`}
      aria-label="Carregando"
    />
  );
};

// =============================================================
// COMPONENTE: Modal de Criar/Editar Usuário
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
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: null }));
  };

  const validar = () => {
    const novosErros = {};
    if (!form.nome.trim())  novosErros.nome  = 'Nome é obrigatório.';
    if (!form.email.trim()) novosErros.email = 'E-mail é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      novosErros.email = 'E-mail inválido.';
    if (!editando && !form.senha.trim())
      novosErros.senha = 'Senha é obrigatória para novos usuários.';
    if (form.senha && form.senha.length < 8)
      novosErros.senha = 'Senha deve ter pelo menos 8 caracteres.';
    if (!form.tenantId) novosErros.tenantId = 'Selecione um cliente.';
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-surface border border-primary-800 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-800">
          <h2 className="text-white font-semibold text-lg">
            {editando ? '✏️ Editar Usuário' : '➕ Novo Usuário'}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            aria-label="Fechar modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nome completo</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => atualizar('nome', e.target.value)}
              placeholder="João Silva"
              className={`input w-full ${erros.nome ? 'border-red-500' : ''}`}
              disabled={salvando}
            />
            {erros.nome && <p className="text-red-400 text-xs mt-1">{erros.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar('email', e.target.value)}
              placeholder="joao@empresa.com"
              className={`input w-full ${erros.email ? 'border-red-500' : ''}`}
              disabled={salvando || editando}
            />
            {editando && (
              <p className="text-slate-500 text-xs mt-1">E-mail não pode ser alterado.</p>
            )}
            {erros.email && <p className="text-red-400 text-xs mt-1">{erros.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha'}
            </label>
            <input
              type="password"
              value={form.senha}
              onChange={(e) => atualizar('senha', e.target.value)}
              placeholder={editando ? '••••••••' : 'Mínimo 8 caracteres'}
              className={`input w-full ${erros.senha ? 'border-red-500' : ''}`}
              disabled={salvando}
            />
            {erros.senha && <p className="text-red-400 text-xs mt-1">{erros.senha}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cargo</label>
            <select
              value={form.cargo}
              onChange={(e) => atualizar('cargo', e.target.value)}
              className="input w-full"
              disabled={salvando}
            >
              {CARGOS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cliente (Tenant)</label>
            <select
              value={form.tenantId}
              onChange={(e) => atualizar('tenantId', e.target.value)}
              className={`input w-full ${erros.tenantId ? 'border-red-500' : ''}`}
              disabled={salvando || editando}
            >
              <option value="">Selecione um cliente...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
            {editando && (
              <p className="text-slate-500 text-xs mt-1">Tenant não pode ser alterado.</p>
            )}
            {erros.tenantId && <p className="text-red-400 text-xs mt-1">{erros.tenantId}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="btn-secondary flex-1"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={salvando}
            >
              {salvando ? (
                <>
                  <Spinner tamanho="sm" />
                  Salvando...
                </>
              ) : (
                editando ? 'Salvar alterações' : 'Criar usuário'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE: Modal de Confirmação
// =============================================================
const ModalConfirmacao = ({ titulo, mensagem, onConfirmar, onCancelar, confirmando, corBotao }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    onClick={(e) => e.target === e.currentTarget && onCancelar()}
  >
    <div className="bg-surface border border-primary-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
      <h3 className="text-white font-semibold text-lg mb-2">{titulo}</h3>
      <p className="text-slate-400 text-sm mb-6">{mensagem}</p>
      <div className="flex gap-3">
        <button onClick={onCancelar} className="btn-secondary flex-1" disabled={confirmando}>
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          className={`${corBotao || 'btn-primary'} flex-1 flex items-center justify-center gap-2`}
          disabled={confirmando}
        >
          {confirmando && <Spinner tamanho="sm" />}
          Confirmar
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
  const { iniciarImpersonation } = useAuthStore();

  const [usuarios,      setUsuarios]      = useState([]);
  const [tenants,       setTenants]       = useState([]);
  const [carregando,    setCarregando]    = useState(true);
  const [erro,          setErro]          = useState(null);
  const [pagina,        setPagina]        = useState(1);
  const [totalPaginas,  setTotalPaginas]  = useState(1);
  const [total,         setTotal]         = useState(0);
  const [busca,         setBusca]         = useState('');
  const [filtroStatus,  setFiltroStatus]  = useState('');
  const [filtroTenant,  setFiltroTenant]  = useState('');
  const [modalCriar,    setModalCriar]    = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [confirmacao,   setConfirmacao]   = useState(null);
  const [salvando,      setSalvando]      = useState(false);
  const [impersonando,  setImpersonando]  = useState(null);

  // --- Carregar tenants (para filtros e modal) ---
  const carregarTenants = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tenants')
        .select('id, nome')
        .order('nome', { ascending: true });
      setTenants(data || []);
    } catch {
      // silencioso
    }
  }, []);

  // --- Carregar usuários ---
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
      
      const lista = (data || []).map(u => ({
        ...u,
        tenantNome: u.tenants ? u.tenants.nome : null
      }));

      setUsuarios(lista);
      setTotal(count || 0);
      setTotalPaginas(Math.ceil((count || 0) / 15) || 1);
    } catch (err) {
      setErro(err?.message || 'Erro ao carregar usuários. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }, [pagina, busca, filtroStatus, filtroTenant]);

  useEffect(() => { carregarTenants(); }, [carregarTenants]);
  useEffect(() => { carregarUsuarios(); }, [carregarUsuarios]);

  // Debounce na busca
  useEffect(() => {
    const timer = setTimeout(() => setPagina(1), 400);
    return () => clearTimeout(timer);
  }, [busca]);

  // --- CRUD ---
  const handleCriar = async (dados) => {
    setSalvando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'create', payload: dados }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setModalCriar(false);
      setPagina(1);
      await carregarUsuarios();
    } catch (err) {
      alert(err?.message || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = async (dados) => {
    setSalvando(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'update', userId: usuarioEditar.id, payload: dados }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setUsuarioEditar(null);
      await carregarUsuarios();
    } catch (err) {
      alert(err?.message || 'Erro ao atualizar usuário.');
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
        body: { action: 'status', userId: usuario.id, payload: { status: novoStatus } }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setConfirmacao(null);
      await carregarUsuarios();
    } catch (err) {
      alert(err?.message || 'Erro ao alterar status.');
    } finally {
      setSalvando(false);
    }
  };

  // --- Impersonation ---
  const handleImpersonar = async (usuario) => {
    setImpersonando(usuario.id);
    try {
      // 1. Obter o token temporário chamando a Edge Function "admin-impersonate"
      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: { targetUserId: usuario.id }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // 2. Definir o JWT temporário do Supabase na store/localStorage
      const { token, session } = data;
      // Inicia impersonation na authStore customizada se necessário
      iniciarImpersonation(token, usuario);
      
      // Salva sessão localmente se for usar supabase-js como impersonated (pode ser trickier)
      // O Supabase suporta setSession() 
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      navigate('/', { replace: true });
    } catch (err) {
      alert(
        err?.message ||
        'Não foi possível iniciar a sessão como este usuário.'
      );
    } finally {
      setImpersonando(null);
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
          <span className="text-2xl">👥</span>
          <div>
            <span className="text-white font-semibold">Gestão de Usuários</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Super Admin
            </span>
          </div>
        </div>
        <button
          onClick={() => setModalCriar(true)}
          className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
        >
          <span>+</span> Novo Usuário
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
                placeholder="Buscar por nome ou e-mail..."
                className="input w-full pl-9"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => { setFiltroStatus(e.target.value); setPagina(1); }}
              className="input w-40"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>

            <select
              value={filtroTenant}
              onChange={(e) => { setFiltroTenant(e.target.value); setPagina(1); }}
              className="input w-52"
            >
              <option value="">Todos os clientes</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>

            <span className="text-slate-400 text-sm whitespace-nowrap">
              {total} usuário{total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabela */}
          <div className="card p-0 overflow-hidden">
            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <Spinner />
              </div>
            ) : erro ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">⚠️</span>
                <p className="text-slate-400 text-sm">{erro}</p>
                <button onClick={carregarUsuarios} className="btn-secondary text-sm">
                  Tentar novamente
                </button>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">👤</span>
                <p className="text-slate-400 text-sm">
                  {busca || filtroStatus || filtroTenant
                    ? 'Nenhum usuário encontrado com os filtros aplicados.'
                    : 'Nenhum usuário cadastrado ainda.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-800 bg-primary-950/30">
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuário</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Cliente</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Cargo</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-medium">Criado em</th>
                      <th className="text-right px-4 py-3 text-slate-400 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-800/50">
                    {usuarios.map((u) => (
                      <tr key={u.id} className="hover:bg-primary-900/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-800 flex items-center justify-center text-primary-300 font-semibold text-xs flex-shrink-0">
                              {(u.nome || u.email || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-medium truncate">{u.nome || '—'}</p>
                              <p className="text-slate-400 text-xs truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          {u.tenantNome || u.tenant_nome || '—'}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`badge border ${BADGE_CARGO[u.cargo] || BADGE_CARGO.viewer}`}>
                            {LABEL_CARGO[u.cargo] || u.cargo}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {u.status === 'ativo' ? (
                            <span className="inline-flex items-center gap-1.5 badge bg-green-900/50 text-green-400 border border-green-700/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 badge bg-red-900/50 text-red-400 border border-red-700/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Inativo
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {u.criadoEm || u.created_at
                            ? new Date(u.criadoEm || u.created_at).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {/* Impersonar */}
                            <button
                              onClick={() => handleImpersonar(u)}
                              disabled={!!impersonando || u.status !== 'ativo'}
                              title="Acessar como este usuário"
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Acessar como ${u.nome || u.email}`}
                            >
                              {impersonando === u.id ? (
                                <Spinner tamanho="sm" />
                              ) : (
                                <span className="text-base">👁️</span>
                              )}
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => setUsuarioEditar(u)}
                              title="Editar usuário"
                              className="p-1.5 rounded-md text-slate-400 hover:bg-primary-800 hover:text-white transition-colors"
                              aria-label={`Editar ${u.nome || u.email}`}
                            >
                              <span className="text-base">✏️</span>
                            </button>

                            {/* Ativar/Desativar */}
                            <button
                              onClick={() => setConfirmacao({ tipo: 'status', usuario: u })}
                              title={u.status === 'ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                              className={`p-1.5 rounded-md transition-colors ${
                                u.status === 'ativo'
                                  ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300'
                                  : 'text-green-400 hover:bg-green-900/30 hover:text-green-300'
                              }`}
                            >
                              <span className="text-base">{u.status === 'ativo' ? '🚫' : '✅'}</span>
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
              <span className="text-slate-400 text-sm">
                Página {pagina} de {totalPaginas}
              </span>
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

      {/* Modal: Criar usuário */}
      {modalCriar && (
        <ModalUsuario
          tenants={tenants}
          onSalvar={handleCriar}
          onFechar={() => setModalCriar(false)}
          salvando={salvando}
        />
      )}

      {/* Modal: Editar usuário */}
      {usuarioEditar && (
        <ModalUsuario
          usuario={usuarioEditar}
          tenants={tenants}
          onSalvar={handleEditar}
          onFechar={() => setUsuarioEditar(null)}
          salvando={salvando}
        />
      )}

      {/* Modal: Confirmar alteração de status */}
      {confirmacao?.tipo === 'status' && (
        <ModalConfirmacao
          titulo={
            confirmacao.usuario.status === 'ativo'
              ? '🚫 Desativar usuário'
              : '✅ Ativar usuário'
          }
          mensagem={
            confirmacao.usuario.status === 'ativo'
              ? `Deseja desativar "${confirmacao.usuario.nome || confirmacao.usuario.email}"? Ele não conseguirá mais fazer login.`
              : `Deseja reativar "${confirmacao.usuario.nome || confirmacao.usuario.email}"?`
          }
          onConfirmar={handleAlterarStatus}
          onCancelar={() => setConfirmacao(null)}
          confirmando={salvando}
          corBotao={confirmacao.usuario.status === 'ativo' ? 'btn-secondary' : 'btn-primary'}
        />
      )}
    </div>
  );
};

export default GestaoUsuarios;
