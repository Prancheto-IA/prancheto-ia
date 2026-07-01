// =============================================================
// PRANCHETO.IA - PLANOS E LIMITES (Super Admin)
// Página de configuração de planos e limites por tenant.
//
// FUNCIONALIDADES:
//   - Visão geral dos planos disponíveis (Free, Starter, Pro, Enterprise)
//   - Listar todos os tenants com seu plano e limite atual
//   - Editar plano e limite de usuários de qualquer tenant inline
//   - Estatísticas: quantos clientes em cada plano
//
// ROTA: /admin/planos
// ACESSO: Apenas Super Admin
// Backend: GET /api/admin/tenants + PUT /api/admin/tenants/:id
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';

// =============================================================
// DEFINIÇÃO DOS PLANOS
// =============================================================
const DEFINICAO_PLANOS = [
  {
    id:          'free',
    label:       'Free',
    emoji:       '🆓',
    cor:         'border-slate-600 bg-slate-800/30',
    corBadge:    'bg-slate-700/50 text-slate-300 border-slate-600/50',
    corTexto:    'text-slate-300',
    limiteDefault: 5,
    descricao:   'Para testar o sistema. Sem suporte dedicado.',
    recursos:    ['Até 5 usuários', 'Módulos básicos', 'Suporte via e-mail'],
  },
  {
    id:          'starter',
    label:       'Starter',
    emoji:       '🚀',
    cor:         'border-blue-700 bg-blue-900/20',
    corBadge:    'bg-blue-900/50 text-blue-300 border-blue-700/50',
    corTexto:    'text-blue-300',
    limiteDefault: 15,
    descricao:   'Para pequenas equipes em crescimento.',
    recursos:    ['Até 15 usuários', 'Todos os módulos', 'Suporte prioritário'],
  },
  {
    id:          'pro',
    label:       'Pro',
    emoji:       '⚡',
    cor:         'border-purple-700 bg-purple-900/20',
    corBadge:    'bg-purple-900/50 text-purple-300 border-purple-700/50',
    corTexto:    'text-purple-300',
    limiteDefault: 50,
    descricao:   'Para empresas com equipes maiores.',
    recursos:    ['Até 50 usuários', 'Todos os módulos', 'Suporte 24/7', 'Relatórios avançados'],
  },
  {
    id:          'enterprise',
    label:       'Enterprise',
    emoji:       '🏆',
    cor:         'border-amber-600 bg-amber-900/20',
    corBadge:    'bg-amber-900/50 text-amber-300 border-amber-700/50',
    corTexto:    'text-amber-300',
    limiteDefault: 999,
    descricao:   'Sem limites. Suporte dedicado e SLA garantido.',
    recursos:    ['Usuários ilimitados', 'Todos os módulos', 'Gerente de conta', 'SLA 99.9%'],
  },
];

// =============================================================
// COMPONENTE: Spinner
// =============================================================
const Spinner = ({ tamanho = 'md' }) => {
  const cls = tamanho === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4';
  return <div className={`${cls} border-primary-500 border-t-transparent rounded-full animate-spin`} />;
};

// =============================================================
// COMPONENTE: Card de Plano (estatísticas)
// =============================================================
const CardPlano = ({ plano, qtdClientes, onClick }) => (
  <div
    onClick={onClick}
    className={`card border-2 ${plano.cor} cursor-pointer hover:scale-[1.02] transition-transform`}
  >
    <div className="flex items-start justify-between mb-3">
      <span className="text-3xl">{plano.emoji}</span>
      <span className={`badge border ${plano.corBadge} text-xs`}>{plano.label}</span>
    </div>
    <p className={`text-2xl font-bold ${plano.corTexto} mb-1`}>{qtdClientes}</p>
    <p className="text-slate-400 text-sm">cliente{qtdClientes !== 1 ? 's' : ''}</p>
    <p className="text-slate-500 text-xs mt-2">{plano.descricao}</p>
    <ul className="mt-3 space-y-1">
      {plano.recursos.map((r, i) => (
        <li key={i} className="text-xs text-slate-400 flex items-center gap-1.5">
          <span className="text-green-500">✓</span> {r}
        </li>
      ))}
    </ul>
  </div>
);

// =============================================================
// COMPONENTE: Modal de Edição de Plano/Limite
// =============================================================
const ModalEditarPlano = ({ tenant, onSalvar, onFechar, salvando }) => {
  const [plano,           setPlano]           = useState(tenant.plano || 'free');
  const [limiteUsuarios,  setLimiteUsuarios]  = useState(tenant.limite_usuarios || 5);
  const [erro,            setErro]            = useState('');

  const planoSelecionado = DEFINICAO_PLANOS.find(p => p.id === plano);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!limiteUsuarios || limiteUsuarios < 1) {
      setErro('Limite deve ser pelo menos 1.');
      return;
    }
    onSalvar({ plano, limite_usuarios: parseInt(limiteUsuarios) });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="bg-surface border border-primary-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-800">
          <div>
            <h2 className="text-white font-semibold text-lg">📦 Editar Plano</h2>
            <p className="text-slate-400 text-sm">{tenant.nome}</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Seleção de plano */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Plano</label>
            <div className="grid grid-cols-2 gap-2">
              {DEFINICAO_PLANOS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setPlano(p.id);
                    setLimiteUsuarios(p.limiteDefault);
                  }}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    plano === p.id
                      ? `${p.cor} border-opacity-100`
                      : 'border-primary-800 bg-primary-900/20 hover:border-primary-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>{p.emoji}</span>
                    <span className={`font-semibold text-sm ${plano === p.id ? p.corTexto : 'text-slate-300'}`}>
                      {p.label}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">{p.descricao}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Limite de usuários */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Limite de usuários
              {planoSelecionado && (
                <span className="ml-2 text-slate-500 font-normal text-xs">
                  (padrão {plano}: {planoSelecionado.limiteDefault})
                </span>
              )}
            </label>
            <input
              type="number"
              min="1"
              max="9999"
              value={limiteUsuarios}
              onChange={(e) => { setLimiteUsuarios(e.target.value); setErro(''); }}
              className={`input w-full ${erro ? 'border-red-500' : ''}`}
              disabled={salvando}
            />
            {erro && <p className="text-red-400 text-xs mt-1">{erro}</p>}
            <p className="text-slate-500 text-xs mt-1">
              Atualmente: {tenant.qtd_usuarios ?? 0} usuário{(tenant.qtd_usuarios ?? 0) !== 1 ? 's' : ''} ativos
            </p>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar} className="btn-secondary flex-1" disabled={salvando}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={salvando}
            >
              {salvando ? <><Spinner tamanho="sm" /> Salvando...</> : 'Salvar plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: PlanoLimites
// =============================================================
const PlanoLimites = () => {
  const navigate = useNavigate();

  const [tenants,      setTenants]      = useState([]);
  const [carregando,   setCarregando]   = useState(true);
  const [erro,         setErro]         = useState(null);
  const [busca,        setBusca]        = useState('');
  const [filtroPlano,  setFiltroPlano]  = useState('');
  const [tenantEditar, setTenantEditar] = useState(null);
  const [salvando,     setSalvando]     = useState(false);
  const [feedback,     setFeedback]     = useState(null); // { tipo, mensagem }

  // --- Carregar todos os tenants (sem paginação para ter estatísticas completas) ---
  const carregarTenants = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*, users(count)', { count: 'exact' });
        
      if (error) throw error;
      
      const dados = (data || []).map(t => ({
        ...t,
        qtd_usuarios: t.users && t.users[0] ? t.users[0].count : 0
      }));
      
      setTenants(dados);
    } catch (err) {
      setErro(err?.message || 'Erro ao carregar clientes.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregarTenants(); }, [carregarTenants]);

  // --- Estatísticas por plano ---
  const estatisticas = DEFINICAO_PLANOS.reduce((acc, p) => {
    acc[p.id] = tenants.filter(t => t.plano === p.id).length;
    return acc;
  }, {});

  // --- Filtro local ---
  const tenantsFiltrados = tenants.filter(t => {
    const matchBusca  = !busca       || t.nome.toLowerCase().includes(busca.toLowerCase());
    const matchPlano  = !filtroPlano || t.plano === filtroPlano;
    return matchBusca && matchPlano;
  });

  // --- Salvar plano ---
  const handleSalvar = async (dados) => {
    if (!tenantEditar) return;
    setSalvando(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update(dados)
        .eq('id', tenantEditar.id);
        
      if (error) throw error;
      
      setTenantEditar(null);
      setFeedback({ tipo: 'sucesso', mensagem: `Plano de "${tenantEditar.nome}" atualizado com sucesso.` });
      setTimeout(() => setFeedback(null), 4000);
      await carregarTenants();
    } catch (err) {
      alert(err?.message || 'Erro ao atualizar plano.');
    } finally {
      setSalvando(false);
    }
  };

  // =============================================================
  // RENDER
  // =============================================================
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-primary-800 bg-primary-950/50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
          <span className="text-slate-600">|</span>
          <span className="text-2xl">📦</span>
          <div>
            <span className="text-white font-semibold">Planos e Limites</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Super Admin
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Feedback */}
          {feedback && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
              feedback.tipo === 'sucesso'
                ? 'bg-green-900/30 border-green-700/50 text-green-300'
                : 'bg-red-900/30 border-red-700/50 text-red-300'
            }`}>
              <span>{feedback.tipo === 'sucesso' ? '✅' : '❌'}</span>
              {feedback.mensagem}
            </div>
          )}

          {/* Cards de estatísticas por plano */}
          {carregando ? (
            <div className="flex items-center justify-center py-16"><Spinner /></div>
          ) : erro ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-slate-400 text-sm">{erro}</p>
              <button onClick={carregarTenants} className="btn-secondary text-sm">Tentar novamente</button>
            </div>
          ) : (
            <>
              {/* Seção: Visão geral dos planos */}
              <section>
                <h2 className="text-white font-semibold text-lg mb-4">Visão Geral dos Planos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {DEFINICAO_PLANOS.map(plano => (
                    <CardPlano
                      key={plano.id}
                      plano={plano}
                      qtdClientes={estatisticas[plano.id] || 0}
                      onClick={() => setFiltroPlano(filtroPlano === plano.id ? '' : plano.id)}
                    />
                  ))}
                </div>
                {filtroPlano && (
                  <p className="text-slate-400 text-sm mt-3">
                    Filtrando por plano: <strong className="text-white">{DEFINICAO_PLANOS.find(p => p.id === filtroPlano)?.label}</strong>
                    <button onClick={() => setFiltroPlano('')} className="ml-2 text-primary-400 hover:text-primary-300 underline text-xs">
                      Limpar filtro
                    </button>
                  </p>
                )}
              </section>

              {/* Seção: Tabela de clientes por plano */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-lg">
                    Clientes ({tenantsFiltrados.length})
                  </h2>
                  <div className="relative w-64">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar cliente..."
                      className="input w-full pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="card p-0 overflow-hidden">
                  {tenantsFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <span className="text-4xl">📦</span>
                      <p className="text-slate-400 text-sm">Nenhum cliente encontrado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-primary-800 bg-primary-950/30">
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Cliente</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Plano atual</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuários</th>
                            <th className="text-left px-4 py-3 text-slate-400 font-medium">Uso</th>
                            <th className="text-right px-4 py-3 text-slate-400 font-medium">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-800/50">
                          {tenantsFiltrados.map((t) => {
                            const planoInfo   = DEFINICAO_PLANOS.find(p => p.id === t.plano) || DEFINICAO_PLANOS[0];
                            const qtdUsuarios = t.qtd_usuarios ?? 0;
                            const pctUso      = Math.min(100, (qtdUsuarios / t.limite_usuarios) * 100);
                            const corBarra    = pctUso >= 90 ? 'bg-red-500' : pctUso >= 70 ? 'bg-amber-500' : 'bg-primary-500';

                            return (
                              <tr key={t.id} className="hover:bg-primary-900/20 transition-colors">
                                {/* Cliente */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary-800 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                                      {(t.nome || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-white font-medium truncate">{t.nome}</p>
                                      <p className="text-slate-500 text-xs font-mono">{t.slug}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Plano */}
                                <td className="px-4 py-3">
                                  <span className={`badge border ${planoInfo.corBadge}`}>
                                    {planoInfo.emoji} {planoInfo.label}
                                  </span>
                                </td>

                                {/* Usuários */}
                                <td className="px-4 py-3">
                                  <span className="text-white font-medium">{qtdUsuarios}</span>
                                  <span className="text-slate-500 text-xs"> / {t.limite_usuarios}</span>
                                </td>

                                {/* Barra de uso */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-primary-800 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${corBarra} rounded-full transition-all`}
                                        style={{ width: `${pctUso}%` }}
                                      />
                                    </div>
                                    <span className={`text-xs font-medium ${
                                      pctUso >= 90 ? 'text-red-400' :
                                      pctUso >= 70 ? 'text-amber-400' : 'text-slate-400'
                                    }`}>
                                      {Math.round(pctUso)}%
                                    </span>
                                  </div>
                                </td>

                                {/* Ação */}
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => setTenantEditar(t)}
                                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 ml-auto"
                                  >
                                    ✏️ Editar plano
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Modal: Editar plano */}
      {tenantEditar && (
        <ModalEditarPlano
          tenant={tenantEditar}
          onSalvar={handleSalvar}
          onFechar={() => setTenantEditar(null)}
          salvando={salvando}
        />
      )}
    </div>
  );
};

export default PlanoLimites;
