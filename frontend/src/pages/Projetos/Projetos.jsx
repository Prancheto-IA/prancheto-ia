// =============================================================
// PRANCHETO.IA - MÓDULO DE PROJETOS (EMITLY DESIGN SYSTEM)
// Gestão de projetos com cards visuais, barra de progresso e filtros por abas.
// =============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjetos } from '../../hooks/useProjetos';

const STATUS_BADGE = {
  planejamento: { label: 'Planejamento', bg: 'bg-slate-100', text: 'text-slate-600' },
  em_andamento: { label: 'Em andamento', bg: 'bg-[#DCF5E4]', text: 'text-[#15803D]' },
  pausado:      { label: 'Pausado',      bg: 'bg-amber-100', text: 'text-amber-800' },
  concluido:    { label: 'Concluído',    bg: 'bg-[#0E382C]', text: 'text-white' },
  cancelado:    { label: 'Cancelado',    bg: 'bg-red-100',   text: 'text-red-700' },
};

const FORM_VAZIO = {
  nome: '', descricao: '', status: 'planejamento', prioridade: 'media',
  cor: '#0E382C', icone: 'folder', data_inicio: '', data_fim: '',
};

const ModalProjeto = ({ aberto, onFechar, onSalvar, onExcluir, projetoEditando }) => {
  const [form, setForm] = useState(FORM_VAZIO);

  useEffect(() => {
    if (projetoEditando) {
      setForm({
        nome:        projetoEditando.nome        || '',
        descricao:   projetoEditando.descricao   || '',
        status:      projetoEditando.status      || 'planejamento',
        prioridade:  projetoEditando.prioridade  || 'media',
        cor:         projetoEditando.cor         || '#0E382C',
        icone:       projetoEditando.icone       || 'folder',
        data_inicio: projetoEditando.data_inicio || '',
        data_fim:    projetoEditando.data_fim    || '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
  }, [projetoEditando, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSalvar({
      ...form,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
    });
    onFechar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <h2 className="text-base font-extrabold text-[#111915]">{projetoEditando ? 'Editar Projeto' : 'Novo Projeto'}</h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Nome do Projeto *</label>
            <input
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              placeholder="Digite o nome do projeto"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">Descrição</label>
            <textarea
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              placeholder="Descreva os objetivos do projeto"
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
                {Object.entries(STATUS_BADGE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Prioridade</label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
                value={form.prioridade}
                onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Data Início</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                value={form.data_inicio}
                onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111915] mb-1">Data Fim</label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915]"
                value={form.data_fim}
                onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#E4ECE7]">
            {projetoEditando && (
              <button
                type="button"
                onClick={() => { onExcluir(projetoEditando.id); onFechar(); }}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Excluir Projeto
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

const CardProjeto = ({ projeto, onClick, onEditar }) => {
  const milestones = projeto.projeto_milestones || [];
  const concluidos = milestones.filter(m => m.concluido).length;
  const badge = STATUS_BADGE[projeto.status] || STATUS_BADGE.planejamento;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center flex-shrink-0 shadow-xs">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#111915]">{projeto.nome}</h3>
            {projeto.descricao && <p className="text-xs text-[#687770] line-clamp-1">{projeto.descricao}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onEditar(projeto); }}
            className="p-1 text-slate-400 hover:text-[#0E382C]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-[#687770] font-semibold mb-1">
          <span>Progresso</span>
          <span>{projeto.progresso}%</span>
        </div>
        <div className="w-full bg-[#F7FAF8] h-2 rounded-full overflow-hidden border border-[#E4ECE7]">
          <div
            className="bg-gradient-to-r from-emerald-500 to-[#0E382C] h-full rounded-full transition-all"
            style={{ width: `${projeto.progresso}%` }}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E4ECE7] text-[11px] text-[#687770]">
        <span>Milestones: {concluidos}/{milestones.length}</span>
        {projeto.data_fim && (
          <span>Entrega: {new Date(projeto.data_fim).toLocaleDateString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
};

const Projetos = () => {
  const navigate = useNavigate();
  const { projetos, carregando, criarProjeto, atualizarProjeto, excluirProjeto } = useProjetos();
  const [modalAberto, setModalAberto] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const handleSalvar = async (dados) => {
    if (projetoEditando) {
      await atualizarProjeto(projetoEditando.id, dados);
    } else {
      await criarProjeto(dados);
    }
  };

  const projetosFiltrados = filtroStatus === 'todos'
    ? projetos
    : projetos.filter(p => p.status === filtroStatus);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915]">Painel de Projetos</h1>
          <p className="text-xs text-[#687770]">{projetos.length} projeto(s) cadastrado(s)</p>
        </div>
        <button
          onClick={() => { setProjetoEditando(null); setModalAberto(true); }}
          className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 border-b border-[#E4ECE7] pb-3 overflow-x-auto">
        {[{ slug: 'todos', label: 'Todos' }, ...Object.entries(STATUS_BADGE).map(([k, v]) => ({ slug: k, label: v.label }))].map(f => (
          <button
            key={f.slug}
            onClick={() => setFiltroStatus(f.slug)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              filtroStatus === f.slug
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {projetosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#E4ECE7]">
          <p className="text-xs text-[#687770] mb-3">Nenhum projeto encontrado nesta categoria.</p>
          <button
            onClick={() => { setProjetoEditando(null); setModalAberto(true); }}
            className="text-xs font-bold text-[#0E382C] hover:underline"
          >
            + Criar novo projeto agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projetosFiltrados.map(p => (
            <CardProjeto
              key={p.id}
              projeto={p}
              onClick={() => navigate(`/projetos/${p.id}`)}
              onEditar={(proj) => { setProjetoEditando(proj); setModalAberto(true); }}
            />
          ))}
        </div>
      )}

      <ModalProjeto
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setProjetoEditando(null); }}
        onSalvar={handleSalvar}
        onExcluir={excluirProjeto}
        projetoEditando={projetoEditando}
      />
    </div>
  );
};

export default Projetos;
