import { useState, useEffect } from 'react';
import { useTarefas, STATUS_TAREFAS, PRIORIDADES } from '../../hooks/useTarefas';
import { useAuthStore } from '../../store/authStore';

const FORM_VAZIO = {
  titulo: '', descricao: '', status: 'pendente', prioridade: 'media',
  data_vencimento: '', estimativa_h: '',
};

const ModalTarefa = ({ aberto, onFechar, onSalvar, onExcluir, tarefaEditando, usuariosTenant }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [atribuidosIds, setAtribuidosIds] = useState([]);

  // O modal nunca desmonta (só retorna null quando fechado), então o form
  // precisa ser resincronizado aqui sempre que a tarefa a editar mudar —
  // um useState(() => ...) só roda uma vez, na primeira montagem, e depois
  // disso toda edição reabria com os campos da primeira tarefa aberta (ou
  // vazios, se a primeira abertura foi "Nova tarefa").
  useEffect(() => {
    if (tarefaEditando) {
      setForm({
        titulo: tarefaEditando.titulo || '',
        descricao: tarefaEditando.descricao || '',
        status: tarefaEditando.status || 'pendente',
        prioridade: tarefaEditando.prioridade || 'media',
        data_vencimento: tarefaEditando.data_vencimento
          ? new Date(tarefaEditando.data_vencimento).toISOString().split('T')[0]
          : '',
        estimativa_h: tarefaEditando.estimativa_h || '',
      });
      setAtribuidosIds((tarefaEditando.tarefa_atribuicoes || []).map(a => a.user_id));
    } else {
      setForm(FORM_VAZIO);
      setAtribuidosIds([]);
    }
  }, [tarefaEditando, aberto]);

  if (!aberto) return null;

  const toggleAtribuido = (userId) => {
    setAtribuidosIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSalvar({
      ...form,
      data_vencimento: form.data_vencimento ? new Date(form.data_vencimento).toISOString() : null,
      estimativa_h: form.estimativa_h ? parseFloat(form.estimativa_h) : null,
    }, atribuidosIds);
    onFechar();
  };

  const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500';
  const inpStyle = { border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{tarefaEditando ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inp} style={inpStyle} placeholder="Título da tarefa" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <textarea className={inp} style={inpStyle} placeholder="Descrição (opcional)" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-50 mb-1 block">Status</label>
              <select className={inp} style={inpStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {STATUS_TAREFAS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs opacity-50 mb-1 block">Prioridade</label>
              <select className={inp} style={inpStyle} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                {PRIORIDADES.map(p => <option key={p.slug} value={p.slug}>{p.icone} {p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs opacity-50 mb-1 block">Vencimento</label>
              <input type="date" className={inp} style={inpStyle} value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs opacity-50 mb-1 block">Estimativa (h)</label>
              <input type="number" step="0.5" min="0" className={inp} style={inpStyle} placeholder="Ex: 2.5" value={form.estimativa_h} onChange={e => setForm(f => ({ ...f, estimativa_h: e.target.value }))} />
            </div>
          </div>
          {usuariosTenant.length > 0 && (
            <div>
              <label className="text-xs opacity-50 mb-1 block">Responsáveis</label>
              <div className="flex flex-wrap gap-1.5">
                {usuariosTenant.map(u => {
                  const ativo = atribuidosIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAtribuido(u.id)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${ativo ? 'bg-primary-600 text-white' : 'opacity-60'}`}
                      style={ativo ? undefined : inpStyle}
                    >
                      {u.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {tarefaEditando && (
              <button type="button" onClick={() => { onExcluir(tarefaEditando.id); onFechar(); }}
                className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10">
                Excluir
              </button>
            )}
            <button type="button" onClick={onFechar}
              className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ border: '1px solid var(--color-surface-border)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CardTarefa = ({ tarefa, onAbrir }) => {
  const prioridade = PRIORIDADES.find(p => p.slug === tarefa.prioridade) || PRIORIDADES[1];
  const checklist = tarefa.tarefa_checklist || [];
  const checkConcluidos = checklist.filter(c => c.concluido).length;
  const vencida = tarefa.data_vencimento && new Date(tarefa.data_vencimento) < new Date() && tarefa.status !== 'concluida';
  const atribuicoes = tarefa.tarefa_atribuicoes || [];

  return (
    <div
      onClick={() => onAbrir(tarefa)}
      className="p-3 rounded-xl cursor-pointer transition-colors space-y-2 border"
      style={{ borderColor: 'var(--color-surface-border)' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight">{tarefa.titulo}</p>
        <span className="text-xs flex-shrink-0" style={{ color: prioridade.cor }} title={prioridade.label}>
          {prioridade.icone}
        </span>
      </div>
      {tarefa.descricao && (
        <p className="text-xs opacity-40 line-clamp-2">{tarefa.descricao}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {checklist.length > 0 && (
          <span className="text-xs opacity-40">☑ {checkConcluidos}/{checklist.length}</span>
        )}
        {tarefa.data_vencimento && (
          <span className={`text-xs ${vencida ? 'text-red-400' : 'opacity-40'}`}>
            📅 {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
          </span>
        )}
        {tarefa.estimativa_h && (
          <span className="text-xs opacity-40">⏱ {tarefa.estimativa_h}h</span>
        )}
        {atribuicoes.length > 0 && (
          <div className="flex items-center -space-x-1.5 ml-auto">
            {atribuicoes.slice(0, 3).map(a => (
              <span
                key={a.user_id}
                title={a.users?.nome}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border-2"
                style={{ backgroundColor: 'var(--color-surface-border)', borderColor: 'var(--color-surface)' }}
              >
                {(a.users?.nome || '?').charAt(0).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ColunaKanban = ({ status, tarefas, onAbrir, onNovaTarefa }) => (
  <div className="flex flex-col gap-3 min-w-[240px] w-full">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.cor }} />
        <span className="text-sm font-medium">{status.label}</span>
        <span className="text-xs opacity-40 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-surface-border)' }}>{tarefas.length}</span>
      </div>
      <button
        onClick={() => onNovaTarefa(status.slug)}
        className="text-xs opacity-40 hover:opacity-100 transition-opacity"
        title="Nova tarefa"
      >
        +
      </button>
    </div>
    <div className="space-y-2 min-h-[100px]">
      {tarefas.map(t => (
        <CardTarefa key={t.id} tarefa={t} onAbrir={onAbrir} />
      ))}
    </div>
  </div>
);

const Tarefas = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [apenasMinhas, setApenasMinhas] = useState(false);
  const filtros = apenasMinhas && usuario?.id ? { atribuidoA: usuario.id } : {};
  const {
    tarefas, kanban, carregando, criarTarefa, atualizarTarefa, excluirTarefa,
    atribuirUsuario, removerAtribuicao, usuariosTenant,
  } = useTarefas(filtros);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [statusInicial, setStatusInicial] = useState('pendente');
  const [visao, setVisao] = useState('kanban'); // 'kanban' | 'lista'
  const [busca, setBusca] = useState('');

  const handleSalvar = async (dados, atribuidosIds = []) => {
    let tarefaId;
    if (tarefaEditando) {
      await atualizarTarefa(tarefaEditando.id, dados);
      tarefaId = tarefaEditando.id;
    } else {
      const nova = await criarTarefa({ ...dados, status: statusInicial });
      tarefaId = nova.id;
    }

    const atuaisIds = (tarefaEditando?.tarefa_atribuicoes || []).map(a => a.user_id);
    const paraAdicionar = atribuidosIds.filter(id => !atuaisIds.includes(id));
    const paraRemover = atuaisIds.filter(id => !atribuidosIds.includes(id));
    await Promise.all([
      ...paraAdicionar.map(id => atribuirUsuario(tarefaId, id)),
      ...paraRemover.map(id => removerAtribuicao(tarefaId, id)),
    ]);
  };

  const handleAbrir = (tarefa) => {
    setTarefaEditando(tarefa);
    setModalAberto(true);
  };

  const handleNovaTarefa = (status) => {
    setTarefaEditando(null);
    setStatusInicial(status);
    setModalAberto(true);
  };

  const tarefasFiltradas = busca
    ? tarefas.filter(t => t.titulo.toLowerCase().includes(busca.toLowerCase()))
    : tarefas;

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between max-w-full">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-sm opacity-50">{tarefas.length} tarefa{tarefas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setApenasMinhas(m => !m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${apenasMinhas ? 'bg-primary-600 text-white' : 'opacity-60'}`}
            style={{ borderColor: 'var(--color-surface-border)' }}
          >
            Minhas tarefas
          </button>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-surface-border)' }}>
            <button
              onClick={() => setVisao('kanban')}
              className={`px-3 py-1.5 text-xs transition-colors ${visao === 'kanban' ? 'bg-primary-600' : ''}`}
              onMouseEnter={e => { if (visao !== 'kanban') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={e => { if (visao !== 'kanban') e.currentTarget.style.backgroundColor = ''; }}
            >
              Kanban
            </button>
            <button
              onClick={() => setVisao('lista')}
              className={`px-3 py-1.5 text-xs transition-colors ${visao === 'lista' ? 'bg-primary-600' : ''}`}
              onMouseEnter={e => { if (visao !== 'lista') e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={e => { if (visao !== 'lista') e.currentTarget.style.backgroundColor = ''; }}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => { setTarefaEditando(null); setStatusInicial('pendente'); setModalAberto(true); }}
            className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium"
          >
            + Nova tarefa
          </button>
        </div>
      </div>

      {/* Busca */}
      <input
        className="w-full max-w-sm px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500"
        style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
        placeholder="Buscar tarefas..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {/* Kanban */}
      {visao === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUS_TAREFAS.map(s => (
              <div key={s.slug} className="w-64">
                <ColunaKanban
                  status={s}
                  tarefas={kanban[s.slug] || []}
                  onAbrir={handleAbrir}
                  onNovaTarefa={handleNovaTarefa}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista */}
      {visao === 'lista' && (
        <div className="space-y-2 max-w-3xl">
          {tarefasFiltradas.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-sm">Nenhuma tarefa encontrada</p>
            </div>
          ) : (
            tarefasFiltradas.map(t => {
              const status = STATUS_TAREFAS.find(s => s.slug === t.status);
              const prioridade = PRIORIDADES.find(p => p.slug === t.prioridade);
              return (
                <div
                  key={t.id}
                  onClick={() => handleAbrir(t)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status?.cor }} />
                  <p className={`flex-1 text-sm ${t.status === 'concluida' ? 'line-through opacity-40' : ''}`}>
                    {t.titulo}
                  </p>
                  <span className="text-xs flex-shrink-0" style={{ color: prioridade?.cor }}>
                    {prioridade?.icone}
                  </span>
                  {t.data_vencimento && (
                    <span className="text-xs opacity-40 flex-shrink-0">
                      {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <ModalTarefa
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setTarefaEditando(null); }}
        onSalvar={handleSalvar}
        onExcluir={excluirTarefa}
        tarefaEditando={tarefaEditando}
        usuariosTenant={usuariosTenant}
      />
    </div>
  );
};

export default Tarefas;
