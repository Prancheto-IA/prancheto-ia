import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjeto } from '../../hooks/useProjetos';
import { useTarefas } from '../../hooks/useTarefas';
import { useOrg } from '../../hooks/useOrg';
import { usePermission } from '../../hooks/usePermission';
import { useAuthStore } from '../../store/authStore';

const PAPEL_LABEL = { lider: 'Líder', membro: 'Membro', observador: 'Observador' };

const ModalMembros = ({ aberto, onFechar, membros, usuariosTenant, podeGerenciar, onAdicionar, onRemover, onPromover }) => {
  const [busca, setBusca] = useState('');

  if (!aberto) return null;

  const idsAtuais = new Set(membros.map(m => m.user_id));
  const candidatos = busca.trim()
    ? usuariosTenant.filter(u =>
        !idsAtuais.has(u.id) && u.nome?.toLowerCase().includes(busca.trim().toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Membros do projeto</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {membros.length === 0 ? (
            <p className="text-sm opacity-40 text-center py-4">Nenhum membro adicionado</p>
          ) : (
            membros.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{m.usuario?.nome || 'Usuário removido'}</p>
                  <p className="text-xs opacity-40 truncate">{m.usuario?.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full opacity-60 flex-shrink-0" style={{ backgroundColor: 'var(--color-surface-border)' }}>
                  {PAPEL_LABEL[m.papel] || m.papel}
                </span>
                {podeGerenciar && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.papel !== 'lider' && (
                      <button onClick={() => onPromover(m)} className="text-xs opacity-50 hover:opacity-100" title="Promover a líder">
                        ⬆️
                      </button>
                    )}
                    <button onClick={() => onRemover(m.id)} className="text-xs text-red-400 opacity-70 hover:opacity-100" title="Remover">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {podeGerenciar && (
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
              placeholder="Buscar pessoa pelo nome..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            {candidatos.length > 0 && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {candidatos.map(u => (
                  <button
                    key={u.id}
                    onClick={() => { onAdicionar(u.id); setBusca(''); }}
                    className="w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors text-left"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <span className="truncate">{u.nome}</span>
                    <span className="text-xs text-primary-400 flex-shrink-0">+ adicionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProjetoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const { temCargo } = usePermission();
  const { listarUsuariosTenant } = useOrg();
  const {
    projeto, carregando,
    criarMilestone, alternarMilestone, excluirMilestone,
    adicionarMembro, removerMembro, alterarPapelMembro,
  } = useProjeto(id);
  const { tarefas, carregando: carregandoTarefas } = useTarefas({ projetoId: id });

  const [novoMilestone, setNovoMilestone] = useState('');
  const [adicionandoMilestone, setAdicionandoMilestone] = useState(false);
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const [usuariosTenant, setUsuariosTenant] = useState([]);

  useEffect(() => {
    if (modalMembrosAberto) {
      listarUsuariosTenant().then(setUsuariosTenant);
    }
  }, [modalMembrosAberto, listarUsuariosTenant]);

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
        <button onClick={() => navigate('/projetos')} className="mt-3 text-sm text-primary-400 hover:underline">
          Voltar para projetos
        </button>
      </div>
    );
  }

  const milestones = (projeto.projeto_milestones || []).sort((a, b) => a.ordem - b.ordem);
  const concluidos = milestones.filter(m => m.concluido).length;
  const membros = projeto.membros || [];
  const podeGerenciarMembros = temCargo(['admin', 'manager'])
    || projeto.criado_por === usuario?.id
    || membros.some(m => m.user_id === usuario?.id && m.papel === 'lider');

  const handleAdicionarMilestone = async (e) => {
    e.preventDefault();
    if (!novoMilestone.trim()) return;
    setAdicionandoMilestone(true);
    try {
      await criarMilestone({ titulo: novoMilestone.trim(), ordem: milestones.length });
      setNovoMilestone('');
    } finally {
      setAdicionandoMilestone(false);
    }
  };

  const handleToggleMilestone = (milestone) => alternarMilestone(milestone.id, !milestone.concluido);

  const handleAdicionarMembro = (userId) => adicionarMembro(userId, 'membro');
  const handlePromoverMembro = (membro) => alterarPapelMembro(membro, 'lider');

  const STATUS_COR = {
    planejamento: '#94a3b8', em_andamento: '#3b82f6', pausado: '#f59e0b',
    concluido: '#10b981', cancelado: '#ef4444',
  };

  const corStatus = STATUS_COR[projeto.status] || '#94a3b8';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{projeto.icone}</span>
              <div>
                <h1 className="text-2xl font-bold">{projeto.nome}</h1>
                {projeto.descricao && <p className="text-sm opacity-60 mt-0.5">{projeto.descricao}</p>}
              </div>
            </div>
            <button
              onClick={() => setModalMembrosAberto(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors"
              style={{ border: '1px solid var(--color-surface-border)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
            >
              👥 Membros{membros.length > 0 ? ` (${membros.length})` : ''}
            </button>
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
        <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-border)' }}>
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
                className="flex items-center gap-3 p-3 rounded-lg transition-colors group"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <button
                  onClick={() => handleToggleMilestone(m)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    m.concluido
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'hover:border-green-500'
                  }`}
                  style={!m.concluido ? { borderColor: 'var(--color-surface-border)' } : {}}
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
              className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500"
              style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
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
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
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

      <ModalMembros
        aberto={modalMembrosAberto}
        onFechar={() => setModalMembrosAberto(false)}
        membros={membros}
        usuariosTenant={usuariosTenant}
        podeGerenciar={podeGerenciarMembros}
        onAdicionar={handleAdicionarMembro}
        onRemover={removerMembro}
        onPromover={handlePromoverMembro}
      />
    </div>
  );
};

export default ProjetoDetalhe;
