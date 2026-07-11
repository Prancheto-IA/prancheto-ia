import { useState, useEffect } from 'react';
import { useOrg } from '../../../hooks/useOrg';
import { useAuthStore } from '../../../store/authStore';

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
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
    <AvatarUsuario nome={membro.nome} tamanho={10} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{membro.nome}</p>
      <p className="text-xs opacity-40 truncate">{membro.email}</p>
    </div>
    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 opacity-60 flex-shrink-0 capitalize">
      {membro.cargo}
    </span>
  </div>
);

const CardTime = ({ time, membros, expandido, onToggle }) => (
  <div className="rounded-xl border border-white/10 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
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
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs opacity-40">{membros.length} membro{membros.length !== 1 ? 's' : ''}</span>
        <span className={`text-xs opacity-40 transition-transform ${expandido ? 'rotate-180' : ''}`}>▼</span>
      </div>
    </button>
    {expandido && (
      <div className="border-t border-white/5 divide-y divide-white/5">
        {membros.length === 0 ? (
          <p className="text-sm opacity-40 text-center py-6">Nenhum membro neste time</p>
        ) : (
          membros.map(m => (
            <div key={m.id} className="px-4">
              <CardMembro membro={m} />
            </div>
          ))
        )}
      </div>
    )}
  </div>
);

const TimesPessoas = () => {
  const usuario = useAuthStore(s => s.usuario);
  const { listarTimes, listarUsuariosTenant, carregando } = useOrg();
  const [times, setTimes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [timesExpandidos, setTimesExpandidos] = useState({});
  const [aba, setAba] = useState('times');

  useEffect(() => {
    const carregar = async () => {
      const [ts, us] = await Promise.all([
        listarTimes(),
        listarUsuariosTenant(),
      ]);
      setTimes(ts || []);
      setUsuarios(us || []);
    };
    carregar();
  }, []);

  const toggleTime = (timeId) => {
    setTimesExpandidos(prev => ({ ...prev, [timeId]: !prev[timeId] }));
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
    !times.some(t => t.org_time_membros?.some(m => m.user_id === u.id))
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
      <div>
        <h1 className="text-2xl font-bold">Times e Pessoas</h1>
        <p className="text-sm opacity-50">
          {times.length} time{times.length !== 1 ? 's' : ''} · {usuarios.length} pessoa{usuarios.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Busca */}
      <input
        className="w-full px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 focus:outline-none focus:border-primary-500"
        placeholder="Buscar times ou pessoas..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* Abas */}
      <div className="flex rounded-lg border border-white/10 overflow-hidden w-fit">
        <button
          onClick={() => setAba('times')}
          className={`px-4 py-2 text-sm transition-colors ${aba === 'times' ? 'bg-primary-600' : 'hover:bg-white/5'}`}
        >
          🏷️ Times ({times.length})
        </button>
        <button
          onClick={() => setAba('pessoas')}
          className={`px-4 py-2 text-sm transition-colors ${aba === 'pessoas' ? 'bg-primary-600' : 'hover:bg-white/5'}`}
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
                time.org_time_membros?.some(m => m.user_id === u.id)
              );
              return (
                <CardTime
                  key={time.id}
                  time={time}
                  membros={membrosDoTime}
                  expandido={!!timesExpandidos[time.id]}
                  onToggle={() => toggleTime(time.id)}
                />
              );
            })
          )}

          {/* Sem time */}
          {!busca && semTime.length > 0 && (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => toggleTime('sem-time')}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
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
                <div className="border-t border-white/5 divide-y divide-white/5">
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
                t.org_time_membros?.some(m => m.user_id === u.id)
              );
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
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
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 opacity-60 capitalize">
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
    </div>
  );
};

export default TimesPessoas;
