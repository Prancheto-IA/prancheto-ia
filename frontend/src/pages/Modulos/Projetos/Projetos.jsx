import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjetos } from '../../../hooks/useProjetos';

// Estilo reutilizável para inputs com tema
const inpStyle = { border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' };

const STATUS_COR = {
  planejamento: '#94a3b8',
  em_andamento: '#3b82f6',
  pausado:      '#f59e0b',
  concluido:    '#10b981',
  cancelado:    '#ef4444',
};

const STATUS_LABEL = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausado:      'Pausado',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
};

const PRIORIDADE_COR = { baixa: '#94a3b8', media: '#3b82f6', alta: '#f59e0b', critica: '#ef4444' };

const FORM_VAZIO = {
  nome: '', descricao: '', status: 'planejamento', prioridade: 'media',
  cor: '#6366f1', icone: '📁', data_inicio: '', data_fim: '',
};

const ModalProjeto = ({ aberto, onFechar, onSalvar, projetoEditando }) => {
  const [form, setForm] = useState(projetoEditando || FORM_VAZIO);

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

  const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-lg rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{projetoEditando ? 'Editar projeto' : 'Novo projeto'}</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input className="w-16 px-3 py-2 rounded-lg text-sm text-center" style={inpStyle} placeholder="📁" value={form.icone} onChange={e => setForm(f => ({ ...f, icone: e.target.value }))} />
              <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="Nome do projeto" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
            </div>
            <textarea className={inp} style={inpStyle} placeholder="Descrição (opcional)" rows={2} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <select className={inp} style={inpStyle} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select className={inp} style={inpStyle} value={form.prioridade} onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs opacity-50 mb-1 block">Início</label>
                <input type="date" className={inp} style={inpStyle} value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs opacity-50 mb-1 block">Fim</label>
                <input type="date" className={inp} style={inpStyle} value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs opacity-50">Cor:</label>
              <input type="color" value={form.cor} onChange={e => setForm(f => ({ ...f, cor: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
            </div>
            <div className="flex gap-2 pt-2">
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

const CardProjeto = ({ projeto, onClick, onEditar }) => {
  const milestones = projeto.projeto_milestones || [];
  const concluidos = milestones.filter(m => m.concluido).length;

  return (
    <div
      onClick={onClick}
      className="rounded-xl p-5 cursor-pointer hover:scale-[1.01] transition-transform space-y-4"
      style={{ backgroundColor: projeto.cor + '15', borderLeft: `3px solid ${projeto.cor}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{projeto.icone}</span>
          <div>
            <p className="font-semibold">{projeto.nome}</p>
            {projeto.descricao && <p className="text-xs opacity-50 mt-0.5 line-clamp-1">{projeto.descricao}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: STATUS_COR[projeto.status] + '22', color: STATUS_COR[projeto.status] }}
          >
            {STATUS_LABEL[projeto.status]}
          </span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEditar(projeto); }}
            className="opacity-40 hover:opacity-100 text-sm"
          >
            ✏️
          </button>
        </div>
      </div>

      {/* Progresso */}
      <div>
        <div className="flex items-center justify-between text-xs opacity-50 mb-1">
          <span>Progresso</span>
          <span>{projeto.progresso}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-surface-border)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${projeto.progresso}%`, backgroundColor: projeto.cor }}
          />
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div className="flex items-center gap-2 text-xs opacity-50">
          <span>🏁</span>
          <span>{concluidos}/{milestones.length} milestones</span>
        </div>
      )}

      {/* Datas */}
      {(projeto.data_inicio || projeto.data_fim) && (
        <div className="flex items-center gap-3 text-xs opacity-40">
          {projeto.data_inicio && <span>📅 {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}</span>}
          {projeto.data_fim && <span>🏁 {new Date(projeto.data_fim).toLocaleDateString('pt-BR')}</span>}
        </div>
      )}
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
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/modulos')}
        className="text-sm opacity-50 hover:opacity-100 transition-opacity"
        title="Voltar para Módulos"
      >
        ← Voltar
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-sm opacity-50">{projetos.length} projeto{projetos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setProjetoEditando(null); setModalAberto(true); }}
          className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium"
        >
          + Novo projeto
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {[{ slug: 'todos', label: 'Todos' }, ...Object.entries(STATUS_LABEL).map(([k, v]) => ({ slug: k, label: v }))].map(f => (
          <button
            key={f.slug}
            onClick={() => setFiltroStatus(f.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroStatus === f.slug ? 'bg-primary-600 text-white' : 'opacity-60'
              }`}
              onMouseEnter={e => { if (filtroStatus !== f.slug) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={e => { if (filtroStatus !== f.slug) e.currentTarget.style.backgroundColor = ''; }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {projetosFiltrados.length === 0 ? (
        <div className="text-center py-16 opacity-40">
          <p className="text-4xl mb-3">📁</p>
          <p className="text-sm">Nenhum projeto encontrado</p>
          <button onClick={() => { setProjetoEditando(null); setModalAberto(true); }} className="mt-3 text-sm text-primary-400 hover:underline">
            Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projetosFiltrados.map(p => (
            <CardProjeto
              key={p.id}
              projeto={p}
              onClick={() => navigate(`/modulos/projetos/${p.id}`)}
              onEditar={(proj) => { setProjetoEditando(proj); setModalAberto(true); }}
            />
          ))}
        </div>
      )}

      <ModalProjeto
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setProjetoEditando(null); }}
        onSalvar={handleSalvar}
        projetoEditando={projetoEditando}
      />
    </div>
  );
};

export default Projetos;
