// =============================================================
// PRANCHETO.IA - MONITORAMENTO DO SISTEMA (Super Admin)
// Dashboard de métricas e saúde do sistema em tempo real.
//
// FUNCIONALIDADES:
//   - Cards de totais: tenants, usuários, conversas IA
//   - Crescimento nos últimos 7 dias
//   - Atividade nas últimas 24h (eventos, erros, logins)
//   - Distribuição por plano (barra visual)
//   - Saúde do servidor (uptime, memória)
//   - Top 5 tenants com mais usuários
//   - Alertas recentes (falhas e bloqueios)
//   - Auto-refresh a cada 60 segundos
//
// ROTA: /admin/monitoramento
// ACESSO: Apenas Super Admin
// Backend: GET /api/admin/monitoring/overview + /atividade
// =============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api.js';

// =============================================================
// CONSTANTES
// =============================================================
const BADGE_PLANO = {
  free:       { cor: 'bg-slate-500',  label: 'Free' },
  starter:    { cor: 'bg-blue-500',   label: 'Starter' },
  pro:        { cor: 'bg-purple-500', label: 'Pro' },
  enterprise: { cor: 'bg-amber-500',  label: 'Enterprise' },
};

const COR_RESULTADO = {
  success: 'text-green-400',
  failure: 'text-red-400',
  blocked: 'text-amber-400',
};

const formatarDataHora = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const formatarUptime = (segundos) => {
  const d = Math.floor(segundos / 86400);
  const h = Math.floor((segundos % 86400) / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// =============================================================
// COMPONENTE: Spinner
// =============================================================
const Spinner = ({ tamanho = 'md' }) => {
  const cls = tamanho === 'sm' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4';
  return <div className={`${cls} border-primary-500 border-t-transparent rounded-full animate-spin`} />;
};

// =============================================================
// COMPONENTE: Card de Métrica
// =============================================================
const CardMetrica = ({ emoji, titulo, valor, subtitulo, corValor = 'text-white', destaque }) => (
  <div className={`card ${destaque ? 'border-primary-600 bg-primary-900/20' : ''}`}>
    <div className="flex items-start justify-between mb-2">
      <span className="text-2xl">{emoji}</span>
      {destaque && (
        <span className="badge bg-primary-900 text-primary-300 border border-primary-700 text-xs">
          Destaque
        </span>
      )}
    </div>
    <p className={`text-3xl font-bold ${corValor} mb-1`}>
      {typeof valor === 'number' ? valor.toLocaleString('pt-BR') : valor}
    </p>
    <p className="text-slate-300 text-sm font-medium">{titulo}</p>
    {subtitulo && <p className="text-slate-500 text-xs mt-1">{subtitulo}</p>}
  </div>
);

// =============================================================
// COMPONENTE: Barra de Progresso de Memória
// =============================================================
const BarraMemoria = ({ pct }) => {
  const cor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full h-2 bg-primary-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${cor} rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: Monitoramento
// =============================================================
const Monitoramento = () => {
  const navigate = useNavigate();

  const [overview,    setOverview]    = useState(null);
  const [atividade,   setAtividade]   = useState(null);
  const [carregando,  setCarregando]  = useState(true);
  const [erro,        setErro]        = useState(null);
  const [ultimaAtt,   setUltimaAtt]   = useState(null);
  const [contadorAtt, setContadorAtt] = useState(60);
  const intervalRef = useRef(null);
  const countdownRef = useRef(null);

  // --- Carregar dados ---
  const carregarDados = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro(null);
    try {
      const [respOverview, respAtividade] = await Promise.all([
        api.get('/admin/monitoring/overview'),
        api.get('/admin/monitoring/atividade'),
      ]);
      setOverview(respOverview.data);
      setAtividade(respAtividade.data);
      setUltimaAtt(new Date());
      setContadorAtt(60);
    } catch (err) {
      setErro(err?.response?.data?.mensagem || err?.response?.data?.erro || 'Erro ao carregar métricas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  // Auto-refresh a cada 60s
  useEffect(() => {
    carregarDados();

    intervalRef.current = setInterval(() => {
      carregarDados(true);
    }, 60000);

    countdownRef.current = setInterval(() => {
      setContadorAtt(prev => (prev > 0 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(countdownRef.current);
    };
  }, [carregarDados]);

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
          <span className="text-2xl">📊</span>
          <div>
            <span className="text-white font-semibold">Monitoramento</span>
            <span className="ml-2 badge bg-primary-900 text-primary-300 border border-primary-700">
              Super Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ultimaAtt && (
            <span className="text-slate-500 text-xs">
              Atualizado às {ultimaAtt.toLocaleTimeString('pt-BR')} · próximo em {contadorAtt}s
            </span>
          )}
          <button
            onClick={() => carregarDados()}
            disabled={carregando}
            className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1.5"
          >
            {carregando ? <Spinner tamanho="sm" /> : '🔄'}
            Atualizar
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 p-6">
        {carregando && !overview ? (
          <div className="flex items-center justify-center py-24"><Spinner /></div>
        ) : erro ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <span className="text-4xl">⚠️</span>
            <p className="text-slate-400 text-sm">{erro}</p>
            <button onClick={() => carregarDados()} className="btn-secondary text-sm">Tentar novamente</button>
          </div>
        ) : overview ? (
          <div className="max-w-7xl mx-auto space-y-8">

            {/* ===== SEÇÃO 1: Totais gerais ===== */}
            <section>
              <h2 className="text-white font-semibold text-lg mb-4">📈 Visão Geral</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <CardMetrica
                  emoji="🏢"
                  titulo="Clientes"
                  valor={overview.totais.tenants}
                  subtitulo={`+${overview.crescimento.novosTenants7d} nos últimos 7 dias`}
                />
                <CardMetrica
                  emoji="👥"
                  titulo="Usuários"
                  valor={overview.totais.usuarios}
                  subtitulo={`${overview.totais.usuariosAtivos} ativos`}
                />
                <CardMetrica
                  emoji="🤖"
                  titulo="Conversas IA"
                  valor={overview.totais.conversasIA}
                  subtitulo={`+${overview.crescimento.conversasIA7d} esta semana`}
                />
                <CardMetrica
                  emoji="💬"
                  titulo="Mensagens IA"
                  valor={overview.totais.mensagensIA}
                />
                <CardMetrica
                  emoji="⚡"
                  titulo="Eventos 24h"
                  valor={overview.atividade24h.eventos}
                  subtitulo={`${overview.atividade24h.logins} logins · ${overview.atividade24h.erros} erros`}
                  corValor={overview.atividade24h.erros > 0 ? 'text-amber-400' : 'text-white'}
                />
              </div>
            </section>

            {/* ===== SEÇÃO 2: Saúde do servidor + Distribuição de planos ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Saúde do servidor */}
              <section className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>🖥️</span> Saúde do Servidor
                </h3>
                <div className="space-y-4">
                  {/* Uptime */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Uptime</span>
                    <span className="text-green-400 font-mono font-semibold">
                      {formatarUptime(overview.servidor.uptimeSegundos)}
                    </span>
                  </div>

                  {/* Memória */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-400 text-sm">Memória RAM</span>
                      <span className={`font-mono text-sm font-semibold ${
                        overview.servidor.pctMemoria >= 90 ? 'text-red-400' :
                        overview.servidor.pctMemoria >= 70 ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {overview.servidor.memoriaUsadaMB} MB / {overview.servidor.memoriaTotalMB} MB
                        <span className="text-slate-500 ml-1">({overview.servidor.pctMemoria}%)</span>
                      </span>
                    </div>
                    <BarraMemoria pct={overview.servidor.pctMemoria} />
                  </div>

                  {/* Node.js */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Node.js</span>
                    <span className="text-slate-300 font-mono text-sm">{overview.servidor.nodeVersion}</span>
                  </div>

                  {/* Ambiente */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Ambiente</span>
                    <span className={`badge border text-xs ${
                      overview.servidor.ambiente === 'production'
                        ? 'bg-green-900/50 text-green-400 border-green-700/50'
                        : 'bg-amber-900/50 text-amber-400 border-amber-700/50'
                    }`}>
                      {overview.servidor.ambiente}
                    </span>
                  </div>

                  {/* Status geral */}
                  <div className="flex items-center justify-between pt-2 border-t border-primary-800">
                    <span className="text-slate-400 text-sm">Status geral</span>
                    <span className="inline-flex items-center gap-1.5 text-green-400 text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      Operacional
                    </span>
                  </div>
                </div>
              </section>

              {/* Distribuição por plano */}
              <section className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>📦</span> Distribuição por Plano
                </h3>
                <div className="space-y-3">
                  {overview.distribuicaoPlanos.length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhum cliente cadastrado.</p>
                  ) : (
                    overview.distribuicaoPlanos.map(({ plano, qtd }) => {
                      const info = BADGE_PLANO[plano] || { cor: 'bg-slate-500', label: plano };
                      const pct  = overview.totais.tenants > 0
                        ? Math.round((qtd / overview.totais.tenants) * 100)
                        : 0;
                      return (
                        <div key={plano}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-300 text-sm">{info.label}</span>
                            <span className="text-slate-400 text-xs">{qtd} cliente{qtd !== 1 ? 's' : ''} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2 bg-primary-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${info.cor} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Status dos tenants */}
                <div className="mt-5 pt-4 border-t border-primary-800">
                  <p className="text-slate-400 text-xs mb-3">Status dos clientes</p>
                  <div className="flex gap-4">
                    {overview.distribuicaoStatus.map(({ status, qtd }) => (
                      <div key={status} className="text-center">
                        <p className={`text-xl font-bold ${
                          status === 'active' ? 'text-green-400' :
                          status === 'suspended' ? 'text-red-400' : 'text-slate-400'
                        }`}>{qtd}</p>
                        <p className="text-slate-500 text-xs capitalize">{
                          status === 'active' ? 'Ativos' :
                          status === 'suspended' ? 'Suspensos' : 'Cancelados'
                        }</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            {/* ===== SEÇÃO 3: Top Tenants + Alertas ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top 5 tenants */}
              <section className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>🏆</span> Top Clientes por Usuários
                </h3>
                {overview.topTenants.length === 0 ? (
                  <p className="text-slate-500 text-sm">Nenhum cliente cadastrado.</p>
                ) : (
                  <div className="space-y-3">
                    {overview.topTenants.map((t, i) => {
                      const info = BADGE_PLANO[t.plano] || { cor: 'bg-slate-500', label: t.plano };
                      return (
                        <div key={t.id} className="flex items-center gap-3">
                          <span className="text-slate-500 text-sm w-5 text-right">{i + 1}.</span>
                          <div className="w-7 h-7 rounded-lg bg-primary-800 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                            {(t.nome || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{t.nome}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`w-2 h-2 rounded-full ${info.cor}`} />
                              <span className="text-slate-500 text-xs">{info.label}</span>
                            </div>
                          </div>
                          <span className="text-slate-300 text-sm font-semibold flex-shrink-0">
                            {t.qtdUsuarios} <span className="text-slate-500 font-normal text-xs">usuários</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Alertas recentes */}
              <section className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>🚨</span> Alertas Recentes
                  {atividade?.alertas?.length > 0 && (
                    <span className="badge bg-red-900/50 text-red-400 border border-red-700/50 text-xs ml-1">
                      {atividade.alertas.length}
                    </span>
                  )}
                </h3>
                {!atividade?.alertas?.length ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <span className="text-3xl">✅</span>
                    <p className="text-slate-400 text-sm">Nenhum alerta recente.</p>
                    <p className="text-slate-600 text-xs">Sistema operando normalmente.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {atividade.alertas.map((alerta) => (
                      <div key={alerta.id} className="flex items-start gap-3 p-2 rounded-lg bg-primary-900/30">
                        <span className={`text-sm mt-0.5 flex-shrink-0 ${COR_RESULTADO[alerta.resultado] || 'text-slate-400'}`}>
                          {alerta.resultado === 'failure' ? '❌' : '🛡️'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-slate-300 text-xs truncate">{alerta.descricao || alerta.acao}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {alerta.user_email || '—'} · {formatarDataHora(alerta.criado_em)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* ===== SEÇÃO 4: Atividade por dia (últimos 7 dias) ===== */}
            {atividade?.atividadePorDia?.length > 0 && (
              <section className="card">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>📅</span> Atividade — Últimos 7 Dias
                </h3>
                <div className="flex items-end gap-2 h-24">
                  {atividade.atividadePorDia.map((d) => {
                    const maxVal = Math.max(...atividade.atividadePorDia.map(x => x.total), 1);
                    const altura = Math.max(8, Math.round((d.total / maxVal) * 100));
                    const errosDia = atividade.errosPorDia?.find(e => e.dia === d.dia)?.total || 0;
                    const dataFormatada = new Date(d.dia + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit',
                    });
                    return (
                      <div key={d.dia} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '80px' }}>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                            <div className="bg-primary-900 border border-primary-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap">
                              {d.total} eventos · {errosDia} erros
                            </div>
                          </div>
                          {/* Barra de erros */}
                          {errosDia > 0 && (
                            <div
                              className="w-full bg-red-500/60 rounded-t"
                              style={{ height: `${Math.max(4, Math.round((errosDia / Math.max(d.total, 1)) * altura))}px` }}
                            />
                          )}
                          {/* Barra principal */}
                          <div
                            className="w-full bg-primary-500 rounded-t transition-all duration-300"
                            style={{ height: `${altura - (errosDia > 0 ? Math.max(4, Math.round((errosDia / Math.max(d.total, 1)) * altura)) : 0)}px` }}
                          />
                        </div>
                        <span className="text-slate-500 text-xs">{dataFormatada}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-primary-500 inline-block" /> Eventos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-red-500/60 inline-block" /> Erros
                  </span>
                </div>
              </section>
            )}

          </div>
        ) : null}
      </main>
    </div>
  );
};

export default Monitoramento;
