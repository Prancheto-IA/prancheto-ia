import { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../hooks/useOrg';
import { useAuthStore } from '../../store/authStore';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';

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

const AvatarUsuario = ({ nome, tamanho = 10 }) => {
  const iniciais = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const cores = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#14b8a6'];
  const cor = cores[iniciais.charCodeAt(0) % cores.length];
  return (
    <div
      className={`w-${tamanho} h-${tamanho} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: cor, fontSize: tamanho <= 8 ? '0.65rem' : tamanho <= 10 ? '0.8rem' : '1rem' }}
    >
      {iniciais}
    </div>
  );
};

const CardMembro = ({ membro }) => (
  <div
    className="flex items-center gap-3 p-3 rounded-xl transition-colors"
    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
  >
    <AvatarUsuario nome={membro.nome} tamanho={10} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{membro.nome}</p>
      <p className="text-xs opacity-40 truncate">{membro.email}</p>
    </div>
    <span className="text-xs px-2 py-0.5 rounded-full opacity-60 flex-shrink-0 capitalize"
      style={{ backgroundColor: 'var(--color-surface-border)' }}>
      {membro.cargo}
    </span>
  </div>
);

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
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
            {timeEditando ? '✏️ Editar Time' : '➕ Novo Time'}
          </h2>
          <button onClick={onFechar} className="text-muted hover:text-white transition-colors text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                    form.cor_primaria === cor.valor ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface-card)] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: cor.valor }}
                />
              ))}
            </div>
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

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

  const usuariosFiltrados = (todosUsuarios || []).filter(u =>
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
          <button onClick={onFechar} className="text-muted hover:text-white transition-colors text-xl">✕</button>
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

const CardTime = ({ time, membros, expandido, onToggle, onEditar, onExcluir, excluindo, onAdicionarMembro, onRemoverMembro, todosUsuarios }) => {
  const [modalMembro, setModalMembro] = useState(false);
  const [removendo, setRemovendo]     = useState(null);

  const handleRemover = async (userId) => {
    setRemovendo(userId);
    try {
      await onRemoverMembro(time.id, userId);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-surface-border)' }}>
      <div
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 transition-colors text-left cursor-pointer"
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: time.cor_primaria + '22' }}
        >
          {time.icone}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{time.nome}</p>
          {time.descricao && <p className="text-xs opacity-50 truncate">{time.descricao}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <span className="text-xs opacity-40 mr-1">{membros.length} membro{membros.length !== 1 ? 's' : ''}</span>
          <PermissaoGuarda permissao="times.gerenciar">
            <button
              onClick={() => onEditar(time)}
              className="p-1.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity text-sm"
              title="Editar time"
            >
              ✏️
            </button>
          </PermissaoGuarda>
          <PermissaoGuarda permissao="times.gerenciar">
            <button
              onClick={() => onExcluir(time.id)}
              disabled={excluindo === time.id}
              className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-red-400 transition-opacity text-sm disabled:opacity-30"
              title="Excluir time"
            >
              {excluindo === time.id ? '⏳' : '🗑️'}
            </button>
          </PermissaoGuarda>
          <button onClick={onToggle} className={`p-1.5 text-xs opacity-40 transition-transform ${expandido ? 'rotate-180' : ''}`}>▼</button>
        </div>
      </div>
      {expandido && (
        <div className="border-t divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
          {membros.length === 0 ? (
            <p className="text-sm opacity-40 text-center py-6">Nenhum membro neste time</p>
          ) : (
            membros.map(m => (
              <div key={m.id} className="px-4 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <CardMembro membro={m} />
                </div>
                <PermissaoGuarda permissao="times.gerenciar">
                  <button
                    onClick={() => handleRemover(m.id)}
                    disabled={removendo === m.id}
                    className="text-xs opacity-40 hover:opacity-100 hover:text-red-400 transition-opacity disabled:opacity-20 flex-shrink-0"
                    title="Remover do time"
                  >
                    {removendo === m.id ? '⏳' : '✕'}
                  </button>
                </PermissaoGuarda>
              </div>
            ))
          )}
          <PermissaoGuarda permissao="times.gerenciar">
            <div className="p-3">
              <button
                onClick={() => setModalMembro(true)}
                className="w-full py-2 rounded-lg text-sm font-medium transition-colors border border-dashed opacity-60 hover:opacity-100"
                style={{ borderColor: 'var(--color-surface-border)' }}
              >
                + Adicionar membro
              </button>
            </div>
          </PermissaoGuarda>
        </div>
      )}

      <ModalAdicionarMembro
        aberto={modalMembro}
        onFechar={() => setModalMembro(false)}
        onAdicionar={(userId) => onAdicionarMembro(time.id, userId)}
        membrosAtuais={time.membros}
        todosUsuarios={todosUsuarios}
      />
    </div>
  );
};

const TimesPessoas = () => {
  const usuario = useAuthStore(s => s.usuario);
  const {
    listarTimes,
    listarUsuariosTenant,
    criarTime,
    atualizarTime,
    excluirTime,
    adicionarMembro,
    removerMembro,
    carregando,
  } = useOrg();
  const [times, setTimes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [timesExpandidos, setTimesExpandidos] = useState({});
  const [aba, setAba] = useState('times');
  const [modalTime, setModalTime] = useState(false);
  const [timeEditando, setTimeEditando] = useState(null);
  const [excluindo, setExcluindo] = useState(null);
  const [erroAcao, setErroAcao] = useState('');

  const carregar = useCallback(async () => {
    const [ts, us] = await Promise.all([
      listarTimes(),
      listarUsuariosTenant(),
    ]);
    setTimes(ts || []);
    setUsuarios(us || []);
  }, [listarTimes, listarUsuariosTenant]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const toggleTime = (timeId) => {
    setTimesExpandidos(prev => ({ ...prev, [timeId]: !prev[timeId] }));
  };

  const abrirCriarTime = () => { setTimeEditando(null); setModalTime(true); };
  const abrirEditarTime = (time) => { setTimeEditando(time); setModalTime(true); };

  const handleSalvarTime = async (dados) => {
    if (timeEditando) {
      await atualizarTime(timeEditando.id, dados);
    } else {
      await criarTime(dados);
    }
    await carregar();
  };

  const handleExcluirTime = async (id) => {
    if (!window.confirm('Excluir este time? Os membros não serão excluídos, apenas removidos do time.')) return;
    setExcluindo(id);
    try {
      await excluirTime(id);
      await carregar();
    } catch (err) {
      setErroAcao(err.message || 'Erro ao excluir time.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleAdicionarMembro = async (timeId, userId) => {
    try {
      await adicionarMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErroAcao(err.message || 'Erro ao adicionar membro.');
    }
  };

  const handleRemoverMembro = async (timeId, userId) => {
    try {
      await removerMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErroAcao(err.message || 'Erro ao remover membro.');
    }
  };

  const usuariosFiltrados = busca
    ? usuarios.filter(u =>
        u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        u.email?.toLowerCase().includes(busca.toLowerCase())
      )
    : usuarios;

  const timesFiltrados = busca
    ? times.filter(t => t.nome?.toLowerCase().includes(busca.toLowerCase()))
    : times;

  // Membros sem time
  const semTime = usuarios.filter(u =>
    !times.some(t => t.membros?.some(m => m.usuario?.id === u.id))
  );

  if (carregando && times.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Times e Pessoas</h1>
          <p className="text-sm opacity-50">
            {times.length} time{times.length !== 1 ? 's' : ''} · {usuarios.length} pessoa{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <PermissaoGuarda permissao="times.gerenciar">
          <button
            onClick={abrirCriarTime}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            <span>+</span>
            <span>Novo time</span>
          </button>
        </PermissaoGuarda>
      </div>

      {erroAcao && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{erroAcao}</span>
          <button onClick={() => setErroAcao('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Busca */}
      <input
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500"
        style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
        placeholder="Buscar times ou pessoas..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* Abas */}
      <div className="flex rounded-lg border overflow-hidden w-fit" style={{ borderColor: 'var(--color-surface-border)' }}>
        <button
          onClick={() => setAba('times')}
          className={`px-4 py-2 text-sm transition-colors ${aba === 'times' ? 'bg-primary-600' : ''}`}
          onMouseEnter={e => { if (aba !== 'times') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
          onMouseLeave={e => { if (aba !== 'times') e.currentTarget.style.backgroundColor = ''; }}
        >
          🏷️ Times ({times.length})
        </button>
        <button
          onClick={() => setAba('pessoas')}
          className={`px-4 py-2 text-sm transition-colors ${aba === 'pessoas' ? 'bg-primary-600' : ''}`}
          onMouseEnter={e => { if (aba !== 'pessoas') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
          onMouseLeave={e => { if (aba !== 'pessoas') e.currentTarget.style.backgroundColor = ''; }}
        >
          👤 Pessoas ({usuarios.length})
        </button>
      </div>

      {/* Aba Times */}
      {aba === 'times' && (
        <div className="space-y-3">
          {timesFiltrados.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <p className="text-4xl mb-3">🏷️</p>
              <p className="text-sm">Nenhum time encontrado</p>
            </div>
          ) : (
            timesFiltrados.map(time => {
              const membrosDoTime = usuarios.filter(u =>
                time.membros?.some(m => m.usuario?.id === u.id)
              );
              return (
                <CardTime
                  key={time.id}
                  time={time}
                  membros={membrosDoTime}
                  expandido={!!timesExpandidos[time.id]}
                  onToggle={() => toggleTime(time.id)}
                  onEditar={abrirEditarTime}
                  onExcluir={handleExcluirTime}
                  excluindo={excluindo}
                  onAdicionarMembro={handleAdicionarMembro}
                  onRemoverMembro={handleRemoverMembro}
                  todosUsuarios={usuarios}
                />
              );
            })
          )}

          {/* Sem time */}
          {!busca && semTime.length > 0 && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-surface-border)' }}>
              <button
                onClick={() => toggleTime('sem-time')}
                className="w-full flex items-center gap-3 p-4 transition-colors text-left"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-white/5">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-semibold opacity-60">Sem time</p>
                  <p className="text-xs opacity-40">Membros não alocados em times</p>
                </div>
                <span className="text-xs opacity-40">{semTime.length} membro{semTime.length !== 1 ? 's' : ''}</span>
              </button>
              {timesExpandidos['sem-time'] && (
                <div className="border-t divide-y" style={{ borderColor: 'var(--color-surface-border)' }}>
                  {semTime.map(m => (
                    <div key={m.id} className="px-4">
                      <CardMembro membro={m} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Aba Pessoas */}
      {aba === 'pessoas' && (
        <div className="space-y-1">
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <p className="text-4xl mb-3">👤</p>
              <p className="text-sm">Nenhuma pessoa encontrada</p>
            </div>
          ) : (
            usuariosFiltrados.map(u => {
              const timesDoUsuario = times.filter(t =>
                t.membros?.some(m => m.usuario?.id === u.id)
              );
              return (
                <div key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <AvatarUsuario nome={u.nome} tamanho={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      {u.id === usuario?.id && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400">você</span>
                      )}
                    </div>
                    <p className="text-xs opacity-40 truncate">{u.email}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full opacity-60 capitalize"
                      style={{ backgroundColor: 'var(--color-surface-border)' }}>
                      {u.cargo}
                    </span>
                    {timesDoUsuario.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-end">
                        {timesDoUsuario.slice(0, 2).map(t => (
                          <span
                            key={t.id}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: t.cor_primaria + '22', color: t.cor_primaria }}
                          >
                            {t.icone} {t.nome}
                          </span>
                        ))}
                        {timesDoUsuario.length > 2 && (
                          <span className="text-xs opacity-40">+{timesDoUsuario.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <ModalTime
        aberto={modalTime}
        onFechar={() => setModalTime(false)}
        onSalvar={handleSalvarTime}
        timeEditando={timeEditando}
      />
    </div>
  );
};

export default TimesPessoas;
