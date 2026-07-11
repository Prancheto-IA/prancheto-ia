import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjetos } from '../../../hooks/useProjetos';
import { useTarefas } from '../../../hooks/useTarefas';

const ProjetoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projetos, carregando, atualizarProjeto, criarMilestone, atualizarMilestone, excluirMilestone } = useProjetos();
  const { tarefas, carregando: carregandoTarefas } = useTarefas({ projetoId: id });

  const [novoMilestone, setNovoMilestone] = useState('');
  const [adicionandoMilestone, setAdicionandoMilestone] = useState(false);

  const projeto = projetos.find(p => p.id === id);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="text-center py-16 opacity-40">
        <p className="text-4xl mb-3">🔍</p>
        <p>Projeto não encontrado</p>
        <button onClick={() => navigate('/modulos/projetos')} className="mt-3 text-sm text-primary-400 hover:underline">
          Voltar para projetos
        </button>
      </div>
    );
  }

  const milestones = (projeto.projeto_milestones || []).sort((a, b) => a.ordem - b.ordem);
  const concluidos = milestones.filter(m => m.concluido).length;
  const progressoMilestones = milestones.length > 0 ? Math.round((concluidos / milestones.length) * 100) : 0;

  const handleAdicionarMilestone = async (e) => {
    e.preventDefault();
    if (!novoMilestone.trim()) return;
    setAdicionandoMilestone(true);
    try {
      await criarMilestone(id, { titulo: novoMilestone.trim(), ordem: milestones.length });
      setNovoMilestone('');
    } finally {
      setAdicionandoMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestone) => {
    const concluido = !milestone.concluido;
    await atualizarMilestone(milestone.id, {
      concluido,
      concluido_em: concluido ? new Date().toISOString() : null,
    });
    // Atualiza progresso do projeto
    const novoConcluidos = milestones.filter(m => m.id !== milestone.id ? m.concluido : concluido).length;
    const novoProgresso = milestones.length > 0 ? Math.round((novoConcluidos / milestones.length) * 100) : 0;
    await atualizarProjeto(id, { progresso: novoProgresso });
  };

  const STATUS_COR = {
    planejamento: '#94a3b8', em_andamento: '#3b82f6', pausado: '#f59e0b',
    concluido: '#10b981', cancelado: '#ef4444',
  };

  const corStatus = STATUS_COR[projeto.status] || '#94a3b8';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/modulos/projetos')} className="mt-1 opacity-50 hover:opacity-100 text-sm">← Voltar</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{projeto.icone}</span>
            <div>
              <h1 className="text-2xl font-bold">{projeto.nome}</h1>
              {projeto.descricao && <p className="text-sm opacity-60 mt-0.5">{projeto.descricao}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: corStatus + '22', color: corStatus }}
            >
              {projeto.status.replace('_', ' ')}
            </span>
            {projeto.data_inicio && (
              <span className="text-xs opacity-40">
                📅 {new Date(projeto.data_inicio).toLocaleDateString('pt-BR')}
              </span>
            )}
            {projeto.data_fim && (
              <span className="text-xs opacity-40">
                🏁 {new Date(projeto.data_fim).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: projeto.cor + '15' }}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso geral</span>
          <span className="font-bold" style={{ color: projeto.cor }}>{projeto.progresso}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${projeto.progresso}%`, backgroundColor: projeto.cor }}
          />
        </div>
        <div className="flex items-center gap-4 text-xs opacity-50">
          <span>🏁 {concluidos}/{milestones.length} milestones</span>
          <span>✅ {tarefas.filter(t => t.status === 'concluida').length}/{tarefas.length} tarefas</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">Milestones</h2>
          <div className="space-y-2">
            {milestones.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
              >
                <button
                  onClick={() => handleToggleMilestone(m)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    m.concluido
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-white/30 hover:border-green-500'
                  }`}
                >
                  {m.concluido && <span className="text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${m.concluido ? 'line-through opacity-40' : ''}`}>{m.titulo}</p>
                  {m.data_alvo && (
                    <p className="text-xs opacity-40">{new Date(m.data_alvo).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
                <button
                  onClick={() => excluirMilestone(m.id)}
                  className="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={handleAdicionarMilestone} className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 focus:outline-none focus:border-primary-500"
              placeholder="Novo milestone..."
              value={novoMilestone}
              onChange={e => setNovoMilestone(e.target.value)}
            />
            <button
              type="submit"
              disabled={adicionandoMilestone || !novoMilestone.trim()}
              className="px-3 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 disabled:opacity-40"
            >
              +
            </button>
          </form>
        </div>

        {/* Tarefas do projeto */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
            Tarefas ({tarefas.length})
          </h2>
          {carregandoTarefas ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : tarefas.length === 0 ? (
            <p className="text-sm opacity-40 text-center py-8">Nenhuma tarefa neste projeto</p>
          ) : (
            <div className="space-y-2">
              {tarefas.map(t => {
                const corStatus = { pendente: '#94a3b8', em_andamento: '#3b82f6', em_revisao: '#f59e0b', concluida: '#10b981', cancelada: '#ef4444' };
                return (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: corStatus[t.status] }} />
                    <p className={`text-sm flex-1 truncate ${t.status === 'concluida' ? 'line-through opacity-40' : ''}`}>
                      {t.titulo}
                    </p>
                    {t.data_vencimento && (
                      <span className="text-xs opacity-40 flex-shrink-0">
                        {new Date(t.data_vencimento).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjetoDetalhe;
