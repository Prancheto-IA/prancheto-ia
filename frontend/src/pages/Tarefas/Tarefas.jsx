// =============================================================
// PRANCHETO.IA - MÓDULO DE TAREFAS (EMITLY DESIGN SYSTEM)
// Gestão de tarefas Kanban/Lista com cartões orgânicos e sem emojis.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useTarefas, STATUS_TAREFAS, PRIORIDADES } from '../../hooks/useTarefas';
import { useAuthStore } from '../../store/authStore';

const FORM_VAZIO = {
  titulo: '', descricao: '', status: 'pendente', prioridade: 'media',
  data_vencimento: '', estimativa_h: '',
};

const ModalTarefa = ({ aberto, onFechar, onSalvar, onExcluir, tarefaEditando, usuariosTenant }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [atribuidosIds, setAtribuidosIds] = useState([]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <h2 className="text-base font-extrabold text-[#111915]">{tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Título *</label>
            <input
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              placeholder="Ex: Desenvolver componente da sidebar"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição</label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              placeholder="Detalhes adicionais da tarefa"
              rows={2}
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Status</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {STATUS_TAREFAS.map(s => <option key={s.slug} value={s.slug}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Prioridade</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                value={form.prioridade}
                onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
              >
                {PRIORIDADES.map(p => <option key={p.slug} value={p.slug}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Vencimento</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                value={form.data_vencimento}
                onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Estimativa (horas)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                placeholder="Ex: 2.5"
                value={form.estimativa_h}
                onChange={e => setForm(f => ({ ...f, estimativa_h: e.target.value }))}
              />
            </div>
          </div>

          {usuariosTenant.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1.5">Atribuir a</label>
              <div className="flex flex-wrap gap-1.5">
                {usuariosTenant.map(u => {
                  const ativo = atribuidosIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleAtribuido(u.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        ativo
                          ? 'bg-[#0E382C] text-white shadow-xs'
                          : 'bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770]'
                      }`}
                    >
                      {u.nome}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-3 border-t border-[#E4ECE7]">
            {tarefaEditando && (
              <button
                type="button"
                onClick={() => { onExcluir(tarefaEditando.id); onFechar(); }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Excluir Tarefa
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#0E382C] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#07261E]"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const CardTarefa = ({ tarefa, onAbrir }) => {
  const checklist = tarefa.tarefa_checklist || [];
  const checkConcluidos = checklist.filter(c => c.concluido).length;
  const vencida = tarefa.data_vencimento && new Date(tarefa.data_vencimento) < new Date() && tarefa.status !== 'concluida';
  const atribuicoes = tarefa.tarefa_atribuicoes || [];

  return (
    <div
      onClick={() => onAbrir(tarefa)}
      className="bg-white rounded-xl p-3.5 border border-[#E4ECE7] shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-[#111915] leading-snug">{tarefa.titulo}</p>
      </div>
      {tarefa.descricao && (
        <p className="text-[11px] text-[#687770] line-clamp-2">{tarefa.descricao}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-[#E4ECE7]/60">
        {checklist.length > 0 && (
          <span className="text-[10px] text-[#687770]">Check: {checkConcluidos}/{checklist.length}</span>
        )}
        {tarefa.data_vencimento && (
          <span className={`text-[10px] font-bold ${vencida ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md' : 'text-[#687770]'}`}>
            {new Date(tarefa.data_vencimento).toLocaleDateString('pt-BR')}
          </span>
        )}
        {tarefa.estimativa_h && (
          <span className="text-[10px] text-[#687770]">{tarefa.estimativa_h}h</span>
        )}
        {atribuicoes.length > 0 && (
          <div className="flex items-center -space-x-1 ml-auto">
            {atribuicoes.slice(0, 3).map(a => (
              <span
                key={a.user_id}
                title={a.users?.nome}
                className="w-5 h-5 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center text-[9px] font-bold border border-white"
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
  <div className="flex flex-col gap-3 min-w-[260px] w-full bg-[#F7FAF8] p-3 rounded-2xl border border-[#E4ECE7]">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#0E382C]" />
        <span className="text-xs font-extrabold text-[#111915]">{status.label}</span>
        <span className="text-[10px] font-bold bg-[#EBF0ED] text-[#0E382C] px-2 py-0.5 rounded-full">
          {tarefas.length}
        </span>
      </div>
      <button
        onClick={() => onNovaTarefa(status.slug)}
        className="text-xs font-bold text-[#0E382C] hover:bg-[#EBF0ED] px-2 py-1 rounded-lg"
      >
        +
      </button>
    </div>
    <div className="space-y-2 min-h-[140px]">
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
  const [visao, setVisao] = useState('kanban');
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
        <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915]">Gestão de Tarefas</h1>
          <p className="text-xs text-[#687770]">{tarefas.length} tarefas ativas no quadro</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setApenasMinhas(m => !m)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              apenasMinhas ? 'bg-[#D4EC9D] text-[#132E22] border-transparent' : 'bg-white text-[#687770] border-[#E4ECE7]'
            }`}
          >
            Minhas Tarefas
          </button>
          <div className="flex bg-white p-1 rounded-xl border border-[#E4ECE7]">
            <button
              onClick={() => setVisao('kanban')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${visao === 'kanban' ? 'bg-[#0E382C] text-white' : 'text-[#687770]'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setVisao('lista')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${visao === 'lista' ? 'bg-[#0E382C] text-white' : 'text-[#687770]'}`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => { setTarefaEditando(null); setStatusInicial('pendente'); setModalAberto(true); }}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            + Nova Tarefa
          </button>
        </div>
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <input
          type="text"
          placeholder="Filtrar tarefas pelo título..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-[#E4ECE7] rounded-xl text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C]"
        />
      </div>

      {/* Kanban Board */}
      {visao === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUS_TAREFAS.map(s => (
              <div key={s.slug} className="w-72">
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

      {/* Visão Lista */}
      {visao === 'lista' && (
        <div className="space-y-2 max-w-4xl bg-white rounded-2xl p-4 border border-[#E4ECE7]">
          {tarefasFiltradas.length === 0 ? (
            <p className="text-xs text-[#687770] text-center py-6">Nenhuma tarefa encontrada.</p>
          ) : (
            tarefasFiltradas.map(t => (
              <div
                key={t.id}
                onClick={() => handleAbrir(t)}
                className="flex items-center justify-between gap-3 p-3 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7] hover:bg-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0E382C]" />
                  <span className={`text-xs font-bold ${t.status === 'concluida' ? 'line-through text-slate-400' : 'text-[#111915]'}`}>
                    {t.titulo}
                  </span>
                </div>
                {t.data_vencimento && (
                  <span className="text-[10px] font-semibold text-[#687770]">
                    {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            ))
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
