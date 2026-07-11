import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../store/authStore';

const CardKPI = ({ icone, label, valor, sub, cor = '#6366f1', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-xl p-5 flex flex-col gap-3 ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
    style={{ backgroundColor: cor + '15', borderLeft: `3px solid ${cor}` }}
  >
    <div className="flex items-center justify-between">
      <span className="text-2xl">{icone}</span>
      {onClick && <span className="text-xs opacity-40">→</span>}
    </div>
    <div>
      <p className="text-2xl font-bold">{valor ?? '—'}</p>
      <p className="text-sm opacity-60">{label}</p>
      {sub && <p className="text-xs opacity-40 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SecaoTitulo = ({ titulo, acao, onAcao }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">{titulo}</h2>
    {acao && (
      <button onClick={onAcao} className="text-xs opacity-50 hover:opacity-100 transition-opacity">
        {acao} →
      </button>
    )}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  useEffect(() => {
    const carregar = async () => {
      if (!tenantId) return;
      setCarregando(true);
      try {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        const fimSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
          resLeads,
          resClientes,
          resTarefas,
          resTarefasMinhas,
          resProjetos,
          resEventos,
          resNotif,
        ] = await Promise.allSettled([
          supabase.from('crm_contatos').select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId).eq('tipo_registro', 'lead'),
          supabase.from('crm_contatos').select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId).eq('tipo_registro', 'cliente'),
          supabase.from('tarefas').select('id, status', { count: 'exact' })
            .eq('tenant_id', tenantId).neq('status', 'concluida').neq('status', 'cancelada'),
          supabase.from('tarefas')
            .select('id, titulo, status, prioridade, data_vencimento, tarefa_atribuicoes!inner(user_id)')
            .eq('tenant_id', tenantId)
            .eq('tarefa_atribuicoes.user_id', usuario?.id)
            .neq('status', 'concluida')
            .order('data_vencimento', { ascending: true })
            .limit(5),
          supabase.from('projetos').select('id, nome, status, progresso, cor, icone')
            .eq('tenant_id', tenantId).eq('status', 'em_andamento').limit(4),
          supabase.from('agenda_eventos').select('id, titulo, tipo, data_inicio, cor')
            .eq('tenant_id', tenantId)
            .gte('data_inicio', hoje.toISOString())
            .lte('data_inicio', fimSemana)
            .order('data_inicio', { ascending: true })
            .limit(5),
          supabase.from('notificacoes').select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId).eq('user_id', usuario?.id).eq('lida', false),
        ]);

        setDados({
          leads: resLeads.value?.count ?? 0,
          clientes: resClientes.value?.count ?? 0,
          tarefasAbertas: resTarefas.value?.count ?? 0,
          minhasTarefas: resTarefasMinhas.value?.data ?? [],
          projetos: resProjetos.value?.data ?? [],
          eventos: resEventos.value?.data ?? [],
          notifNaoLidas: resNotif.value?.count ?? 0,
        });
      } catch (err) {
        console.error('Dashboard.carregar:', err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [tenantId, usuario?.id]);

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const formatarData = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const corPrioridade = { baixa: '#94a3b8', media: '#3b82f6', alta: '#f59e0b', critica: '#ef4444' };
  const corStatus = { pendente: '#94a3b8', em_andamento: '#3b82f6', em_revisao: '#f59e0b', concluida: '#10b981' };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-2xl font-bold">
          {saudacao()}, {usuario?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm opacity-50 mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {dados?.notifNaoLidas > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
              {dados.notifNaoLidas} notificação{dados.notifNaoLidas > 1 ? 'ões' : ''} não lida{dados.notifNaoLidas > 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CardKPI
          icone="🎯" label="Leads ativos" valor={dados?.leads}
          cor="#f97316" onClick={() => navigate('/crm/leads')}
        />
        <CardKPI
          icone="🤝" label="Clientes" valor={dados?.clientes}
          cor="#10b981" onClick={() => navigate('/crm/clientes')}
        />
        <CardKPI
          icone="✅" label="Tarefas abertas" valor={dados?.tarefasAbertas}
          cor="#3b82f6" onClick={() => navigate('/modulos/tarefas')}
        />
        <CardKPI
          icone="📁" label="Projetos ativos" valor={dados?.projetos?.length}
          cor="#6366f1" onClick={() => navigate('/modulos/projetos')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minhas tarefas */}
        <div>
          <SecaoTitulo titulo="Minhas tarefas" acao="Ver todas" onAcao={() => navigate('/modulos/tarefas')} />
          <div className="space-y-2">
            {dados?.minhasTarefas?.length === 0 ? (
              <p className="text-sm opacity-40 py-4 text-center">Nenhuma tarefa atribuída 🎉</p>
            ) : (
              dados?.minhasTarefas?.map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate('/modulos/tarefas')}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: corPrioridade[t.prioridade] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{t.titulo}</p>
                    {t.data_vencimento && (
                      <p className="text-xs opacity-40">{formatarData(t.data_vencimento)}</p>
                    )}
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: corStatus[t.status] + '22',
                      color: corStatus[t.status],
                    }}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos eventos */}
        <div>
          <SecaoTitulo titulo="Próximos eventos" acao="Ver agenda" onAcao={() => navigate('/modulos/calendario')} />
          <div className="space-y-2">
            {dados?.eventos?.length === 0 ? (
              <p className="text-sm opacity-40 py-4 text-center">Nenhum evento nos próximos 7 dias</p>
            ) : (
              dados?.eventos?.map(e => (
                <div
                  key={e.id}
                  onClick={() => navigate('/modulos/calendario')}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-2 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: e.cor || '#6366f1' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{e.titulo}</p>
                    <p className="text-xs opacity-40">{formatarData(e.data_inicio)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Projetos em andamento */}
      {dados?.projetos?.length > 0 && (
        <div>
          <SecaoTitulo titulo="Projetos em andamento" acao="Ver todos" onAcao={() => navigate('/modulos/projetos')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dados.projetos.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/modulos/projetos/${p.id}`)}
                className="p-4 rounded-xl cursor-pointer hover:scale-[1.01] transition-transform"
                style={{ backgroundColor: p.cor + '15', borderLeft: `3px solid ${p.cor}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{p.icone}</span>
                  <p className="text-sm font-medium truncate">{p.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${p.progresso}%`, backgroundColor: p.cor }}
                    />
                  </div>
                  <span className="text-xs opacity-50">{p.progresso}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
