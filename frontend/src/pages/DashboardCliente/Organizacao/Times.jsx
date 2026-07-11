// =============================================================
// PRANCHETO.IA - TIMES E PESSOAS
// Gerencia times da organização e seus membros.
// Permite criar/editar/excluir times e adicionar/remover membros.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { useAuthStore } from '../../../store/authStore.js';

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------
const ICONES_DISPONIVEIS = ['👥', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '🏆', '🛡️', '🎨', '📊', '🤝', '💼', '🔧', '📱'];
const CORES_DISPONIVEIS  = [
  { label: 'Índigo',   valor: '#6366f1' },
  { label: 'Violeta',  valor: '#8b5cf6' },
  { label: 'Rosa',     valor: '#ec4899' },
  { label: 'Vermelho', valor: '#ef4444' },
  { label: 'Laranja',  valor: '#f97316' },
  { label: 'Âmbar',   valor: '#f59e0b' },
  { label: 'Verde',    valor: '#22c55e' },
  { label: 'Ciano',    valor: '#06b6d4' },
  { label: 'Azul',     valor: '#3b82f6' },
  { label: 'Slate',    valor: '#64748b' },
];

// ----------------------------------------------------------
// MODAL: Criar / Editar Time
// ----------------------------------------------------------
const ModalTime = ({ aberto, onFechar, onSalvar, timeEditando }) => {
  const [form, setForm] = useState({
    nome:        '',
    descricao:   '',
    icone:       '👥',
    cor_primaria: '#6366f1',
    cor_texto:   '#ffffff',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (timeEditando) {
      setForm({
        nome:        timeEditando.nome        || '',
        descricao:   timeEditando.descricao   || '',
        icone:       timeEditando.icone       || '👥',
        cor_primaria: timeEditando.cor_primaria || '#6366f1',
        cor_texto:   timeEditando.cor_texto   || '#ffffff',
      });
    } else {
      setForm({ nome: '', descricao: '', icone: '👥', cor_primaria: '#6366f1', cor_texto: '#ffffff' });
    }
    setErro('');
  }, [timeEditando, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar(form);
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar time.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
            {timeEditando ? '✏️ Editar Time' : '➕ Novo Time'}
          </h2>
          <button onClick={onFechar} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: form.cor_primaria, color: form.cor_texto }}
            >
              {form.icone}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {form.nome || 'Nome do time'}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {form.descricao || 'Descrição do time'}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Nome *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Time de Vendas"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              style={inputStyle}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Descrição
            </label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Breve descrição do time"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              style={inputStyle}
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONES_DISPONIVEIS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icone: ic }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    form.icone === ic ? 'ring-2 ring-primary-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: form.icone === ic ? form.cor_primaria : 'var(--color-surface)' }}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Cor do time
            </label>
            <div className="flex flex-wrap gap-2">
              {CORES_DISPONIVEIS.map((cor) => (
                <button
                  key={cor.valor}
                  type="button"
                  title={cor.label}
                  onClick={() => setForm(f => ({ ...f, cor_primaria: cor.valor }))}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.cor_primaria === cor.valor ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor.valor }}
                />
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : timeEditando ? 'Salvar' : 'Criar time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// MODAL: Adicionar Membro
// ----------------------------------------------------------
const ModalAdicionarMembro = ({ aberto, onFechar, onAdicionar, membrosAtuais, todosUsuarios }) => {
  const [busca, setBusca]       = useState('');
  const [adicionando, setAdicionando] = useState(null);

  const idsJaMembros = new Set((membrosAtuais || []).map(m => m.usuario?.id));

  const usuariosFiltrados = todosUsuarios.filter(u =>
    !idsJaMembros.has(u.id) &&
    (u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
     u.email?.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleAdicionar = async (usuario) => {
    setAdicionando(usuario.id);
    try {
      await onAdicionar(usuario.id);
    } finally {
      setAdicionando(null);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-sm rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
            👤 Adicionar Membro
          </h2>
          <button onClick={onFechar} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
        </div>

        <div className="p-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 mb-3"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              color: 'var(--color-text-primary)',
            }}
            autoFocus
          />

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {usuariosFiltrados.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {busca ? 'Nenhum usuário encontrado.' : 'Todos os usuários já são membros.'}
              </p>
            ) : (
              usuariosFiltrados.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {u.nome?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{u.nome}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAdicionar(u)}
                    disabled={adicionando === u.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {adicionando === u.id ? '...' : 'Adicionar'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD DE TIME
// ----------------------------------------------------------
const CardTime = ({ time, onEditar, onExcluir, onAdicionarMembro, onRemoverMembro, todosUsuarios, excluindo }) => {
  const [expandido, setExpandido]           = useState(false);
  const [modalMembro, setModalMembro]       = useState(false);
  const [removendo, setRemovendo]           = useState(null);

  const membros = time.membros || [];

  const handleRemover = async (userId) => {
    setRemovendo(userId);
    try {
      await onRemoverMembro(time.id, userId);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
    >
      {/* Header do card */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone colorido */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: time.cor_primaria, color: time.cor_texto }}
          >
            {time.icone}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {time.nome}
              </h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${time.cor_primaria}25`, color: time.cor_primaria }}
              >
                {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
              </span>
            </div>
            {time.descricao && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {time.descricao}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setExpandido(e => !e)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
              title={expandido ? 'Recolher' : 'Ver membros'}
            >
              {expandido ? '▲' : '▼'}
            </button>
            <button
              onClick={() => onEditar(time)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
              title="Editar time"
            >
              ✏️
            </button>
            <button
              onClick={() => onExcluir(time.id)}
              disabled={excluindo === time.id}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm disabled:opacity-50"
              title="Excluir time"
            >
              {excluindo === time.id ? '⏳' : '🗑️'}
            </button>
          </div>
        </div>

        {/* Avatares dos membros (preview) */}
        {membros.length > 0 && !expandido && (
          <div className="flex items-center gap-1 mt-3">
            <div className="flex -space-x-2">
              {membros.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  title={m.usuario?.nome}
                  className="w-6 h-6 rounded-full bg-primary-600 border-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{ borderColor: 'var(--color-surface-card)' }}
                >
                  {m.usuario?.nome?.[0]?.toUpperCase() || '?'}
                </div>
              ))}
              {membros.length > 5 && (
                <div
                  className="w-6 h-6 rounded-full bg-slate-600 border-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{ borderColor: 'var(--color-surface-card)' }}
                >
                  +{membros.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lista expandida de membros */}
      {expandido && (
        <div style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          {membros.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhum membro neste time.
            </p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
              {membros.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {m.usuario?.nome?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {m.usuario?.nome || 'Usuário'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                      {m.usuario?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemover(m.usuario?.id)}
                    disabled={removendo === m.usuario?.id}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Remover do time"
                  >
                    {removendo === m.usuario?.id ? '⏳' : '✕'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botão adicionar membro */}
          <div className="p-3">
            <button
              onClick={() => setModalMembro(true)}
              className="w-full py-2 rounded-lg text-sm font-medium transition-colors border border-dashed"
              style={{
                borderColor: 'var(--color-surface-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              + Adicionar membro
            </button>
          </div>
        </div>
      )}

      {/* Modal adicionar membro */}
      <ModalAdicionarMembro
        aberto={modalMembro}
        onFechar={() => setModalMembro(false)}
        onAdicionar={(userId) => onAdicionarMembro(time.id, userId)}
        membrosAtuais={membros}
        todosUsuarios={todosUsuarios}
      />
    </div>
  );
};

// ----------------------------------------------------------
// PÁGINA PRINCIPAL: TIMES
// ----------------------------------------------------------
const Times = () => {
  const { usuario } = useAuthStore();
  const {
    carregando,
    listarTimes,
    criarTime,
    atualizarTime,
    excluirTime,
    adicionarMembro,
    removerMembro,
    listarUsuariosTenant,
  } = useOrg();

  const [times, setTimes]               = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [modalTime, setModalTime]       = useState(false);
  const [timeEditando, setTimeEditando] = useState(null);
  const [excluindo, setExcluindo]       = useState(null);
  const [erro, setErro]                 = useState('');
  const [inicializado, setInicializado] = useState(false);

  const carregar = useCallback(async () => {
    const [timesData, usuariosData] = await Promise.all([
      listarTimes(),
      listarUsuariosTenant(),
    ]);
    setTimes(timesData);
    setTodosUsuarios(usuariosData);
    setInicializado(true);
  }, [listarTimes, listarUsuariosTenant]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSalvarTime = async (dados) => {
    if (timeEditando) {
      await atualizarTime(timeEditando.id, dados);
    } else {
      await criarTime(dados);
    }
    await carregar();
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este time? Os membros não serão excluídos, apenas removidos do time.')) return;
    setExcluindo(id);
    try {
      await excluirTime(id);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao excluir time.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleAdicionarMembro = async (timeId, userId) => {
    try {
      await adicionarMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar membro.');
    }
  };

  const handleRemoverMembro = async (timeId, userId) => {
    try {
      await removerMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao remover membro.');
    }
  };

  const abrirCriar = () => { setTimeEditando(null); setModalTime(true); };
  const abrirEditar = (time) => { setTimeEditando(time); setModalTime(true); };

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            👥 Times e Pessoas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Organize sua equipe em times e gerencie os membros de cada um.
          </p>
        </div>
        <button
          onClick={abrirCriar}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
        >
          <span>+</span>
          <span>Novo time</span>
        </button>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{times.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Times ativos</p>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {times.reduce((acc, t) => acc + (t.membros?.length || 0), 0)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Alocações totais</p>
        </div>
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{todosUsuarios.length}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Pessoas na org</p>
        </div>
      </div>

      {/* Lista de times */}
      {times.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        >
          <div className="text-5xl mb-3">👥</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Nenhum time criado
          </h3>
          <p className="text-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
            Crie o primeiro time da sua organização.
          </p>
          <button
            onClick={abrirCriar}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            Criar primeiro time
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {times.map((time) => (
            <CardTime
              key={time.id}
              time={time}
              onEditar={abrirEditar}
              onExcluir={handleExcluir}
              onAdicionarMembro={handleAdicionarMembro}
              onRemoverMembro={handleRemoverMembro}
              todosUsuarios={todosUsuarios}
              excluindo={excluindo}
            />
          ))}
        </div>
      )}

      {/* Modal criar/editar time */}
      <ModalTime
        aberto={modalTime}
        onFechar={() => setModalTime(false)}
        onSalvar={handleSalvarTime}
        timeEditando={timeEditando}
      />
    </div>
  );
};

export default Times;
