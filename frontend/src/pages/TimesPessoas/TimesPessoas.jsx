// =============================================================
// PRANCHETO.IA - TIMES E PESSOAS (EMITLY DESIGN SYSTEM)
// Gestão de equipes, cargos e membros da organização sem emojis.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../hooks/useOrg';
import { useAuthStore } from '../../store/authStore';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';

const AvatarUsuario = ({ nome, tamanho = 10 }) => {
  const iniciais = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  return (
    <div className="w-9 h-9 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
      {iniciais}
    </div>
  );
};

const CardMembro = ({ membro }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
    <AvatarUsuario nome={membro.nome} />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-[#111915] truncate">{membro.nome}</p>
      <p className="text-[11px] text-[#687770] truncate">{membro.email}</p>
    </div>
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF0ED] text-[#0E382C] capitalize">
      {membro.cargo}
    </span>
  </div>
);

const ModalTime = ({ aberto, onFechar, onSalvar, timeEditando }) => {
  const [form, setForm] = useState({
    nome:        '',
    descricao:   '',
    cor_primaria: '#0E382C',
    cor_texto:   '#ffffff',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (timeEditando) {
      setForm({
        nome:        timeEditando.nome        || '',
        descricao:   timeEditando.descricao   || '',
        cor_primaria: timeEditando.cor_primaria || '#0E382C',
        cor_texto:   timeEditando.cor_texto   || '#ffffff',
      });
    } else {
      setForm({ nome: '', descricao: '', cor_primaria: '#0E382C', cor_texto: '#ffffff' });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7]">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <h2 className="text-base font-extrabold text-[#111915]">
            {timeEditando ? 'Editar Time' : 'Novo Time'}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Nome do Time *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Time de Design & UX"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Atribuições e responsabilidades do time"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
            />
          </div>

          {erro && <p className="text-red-600 text-xs font-semibold">{erro}</p>}

          <div className="flex gap-2 pt-3 border-t border-[#E4ECE7]">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 py-2 bg-[#0E382C] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#07261E]"
            >
              {salvando ? 'Salvando...' : timeEditando ? 'Salvar' : 'Criar Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CardTime = ({ time, membros, expandido, onToggle, onEditar, onExcluir, excluindo, onAdicionarMembro, onRemoverMembro, todosUsuarios }) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E4ECE7] overflow-hidden shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)]">
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[#F7FAF8] transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#111915]">{time.nome}</h3>
            {time.descricao && <p className="text-xs text-[#687770]">{time.descricao}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#687770] bg-[#F7FAF8] px-2.5 py-1 rounded-full border border-[#E4ECE7]">
            {membros.length} membros
          </span>
          <button onClick={onToggle} className="text-slate-400 p-1">
            <svg className={`w-4 h-4 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      {expandido && (
        <div className="p-4 border-t border-[#E4ECE7] space-y-2 bg-[#F7FAF8]">
          {membros.length === 0 ? (
            <p className="text-xs text-[#687770] text-center py-4">Nenhum membro alocado neste time.</p>
          ) : (
            membros.map(m => (
              <CardMembro key={m.id} membro={m} />
            ))
          )}
        </div>
      )}
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
    carregando,
  } = useOrg();
  const [times, setTimes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [timesExpandidos, setTimesExpandidos] = useState({});
  const [aba, setAba] = useState('times');
  const [modalTime, setModalTime] = useState(false);
  const [timeEditando, setTimeEditando] = useState(null);

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

  const handleSalvarTime = async (dados) => {
    if (timeEditando) {
      await atualizarTime(timeEditando.id, dados);
    } else {
      await criarTime(dados);
    }
    await carregar();
  };

  if (carregando && times.length === 0) {
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
          <h1 className="text-xl font-extrabold text-[#111915]">Times &amp; Pessoas</h1>
          <p className="text-xs text-[#687770]">Estrutura da organização, atribuições e membros ativos</p>
        </div>
        <PermissaoGuarda permissao="times.gerenciar">
          <button
            onClick={() => { setTimeEditando(null); setModalTime(true); }}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            + Novo Time
          </button>
        </PermissaoGuarda>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#E4ECE7] pb-3">
        <button
          onClick={() => setAba('times')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            aba === 'times' ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs' : 'text-[#687770] hover:bg-white'
          }`}
        >
          Times ({times.length})
        </button>
        <button
          onClick={() => setAba('pessoas')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            aba === 'pessoas' ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs' : 'text-[#687770] hover:bg-white'
          }`}
        >
          Pessoas ({usuarios.length})
        </button>
      </div>

      {/* View Streams */}
      {aba === 'times' ? (
        <div className="space-y-4 max-w-4xl">
          {times.map(time => {
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
              />
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-5xl">
          {usuarios.map(u => (
            <CardMembro key={u.id} membro={u} />
          ))}
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
