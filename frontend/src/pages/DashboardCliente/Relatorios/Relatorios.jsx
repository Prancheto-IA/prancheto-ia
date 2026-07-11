// =============================================================
// PRANCHETO.IA - RELATÓRIOS
// Dados reais do banco via /api/crm/contatos + /api/crm/kanban
// + /api/agenda/eventos + /api/outbound/acoes
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';

// ─── Card de métrica ──────────────────────────────────────────
const CardMetrica = ({ emoji, titulo, valor, variacao, cor = '' }) => (
  <div className="rounded-xl p-5 border"
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{emoji}</span>
      {variacao !== undefined && variacao !== null && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          variacao > 0
            ? 'bg-emerald-500/20 text-emerald-300'
            : variacao < 0
              ? 'bg-red-500/20 text-red-300'
              : 'bg-slate-500/20 text-slate-400'
        }`}>
          {variacao > 0 ? '↑' : variacao < 0 ? '↓' : '—'} {Math.abs(variacao)}%
        </span>
      )}
    </div>
    <p className={`text-2xl font-bold mb-1 ${cor}`} style={!cor ? { color: 'var(--color-text-primary)' } : {}}>
      {valor}
    </p>
    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{titulo}</p>
  </div>
);

// ─── Barra de progresso simples ───────────────────────────────
const BarraProgresso = ({ label, valor, total, cor = 'bg-primary-500' }) => {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span style={{ color: 'var(--color-text-primary)' }}>{label}</span>
        <span style={{ color: 'var(--color-text-secondary)' }}>{valor} ({pct}%)</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className={`h-full rounded-full transition-all ${cor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Spinner ──────────────────────────────────────────────────
const Spinner = () => (
  <div className="flex items-center justify-center py-8">
    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Componente principal ──────────────────────────────────────
const Relatorios = () => {
  const [dados, setDados]       = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]         = useState('');

  const { usuario } = useAuthStore();

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      // Campos específicos — evita carregar campos_custom JSONB pesado
      const camposContato = 'id, tipo_registro, status_funil, valor_estimado, origem, score, time_id';

      let queryContatos = supabase.from('crm_contatos').select(camposContato);
      if (usuario?.tenant_id) queryContatos = queryContatos.eq('tenant_id', usuario.tenant_id);
      else if (usuario?.id) queryContatos = queryContatos.eq('responsavel_id', usuario.id);

      let queryAgenda = supabase.from('agenda_eventos').select('id, data_inicio');
      if (usuario?.tenant_id) queryAgenda = queryAgenda.eq('tenant_id', usuario.tenant_id);

      let queryOutbound = supabase.from('outbound_acoes').select('id, status, tipo');
      if (usuario?.tenant_id) queryOutbound = queryOutbound.eq('tenant_id', usuario.tenant_id);

      let queryTimes = supabase.from('org_times').select('id, nome, icone, cor_primaria');
      if (usuario?.tenant_id) queryTimes = queryTimes.eq('tenant_id', usuario.tenant_id);

      const [respContatos, respAgenda, respOutbound, respTimes] = await Promise.allSettled([
        queryContatos,
        queryAgenda,
        queryOutbound,
        queryTimes,
      ]);

      const contatos  = respContatos.status  === 'fulfilled' ? (respContatos.value.data  || []) : [];
      const eventos   = respAgenda.status    === 'fulfilled' ? (respAgenda.value.data    || []) : [];
      const acoes     = respOutbound.status  === 'fulfilled' ? (respOutbound.value.data  || []) : [];
      const times     = respTimes.status     === 'fulfilled' ? (respTimes.value.data     || []) : [];

      // ── Separação leads vs clientes ──────────────────────────────
      const soLeads    = contatos.filter(c => c.tipo_registro === 'lead');
      const soClientes = contatos.filter(c => c.tipo_registro === 'cliente');

      // ── Funil (apenas leads) ──────────────────────────────────────
      const totalContatos  = contatos.length;
      const totalLeads     = soLeads.length;
      const totalClientes  = soClientes.length;
      const leads          = soLeads.filter(c => c.status_funil === 'lead').length;
      const qualificados   = soLeads.filter(c => c.status_funil === 'qualificado').length;
      const propostas      = soLeads.filter(c => c.status_funil === 'proposta').length;
      const negociacao     = soLeads.filter(c => c.status_funil === 'negociacao').length;
      const fechados       = contatos.filter(c => c.status_funil === 'fechado').length;
      const perdidos       = soLeads.filter(c => c.status_funil === 'perdido').length;

      // ── Pipeline e receita ────────────────────────────────────────
      const valorPipeline  = soLeads
        .filter(c => !['fechado','perdido'].includes(c.status_funil))
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      const valorFechado   = contatos
        .filter(c => c.status_funil === 'fechado')
        .reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

      // ── LTV de clientes ───────────────────────────────────────────
      const ltvTotal = soClientes.reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);
      const ltvMedio = soClientes.length > 0 ? ltvTotal / soClientes.length : 0;

      // ── Taxa de conversão ─────────────────────────────────────────
      const taxaConversao = totalLeads > 0 ? Math.round((fechados / totalLeads) * 100) : 0;

      // ── Score distribution (apenas leads) ────────────────────────
      const leadsQuentes = soLeads.filter(c => (c.score || 0) >= 70).length;
      const leadsMornos  = soLeads.filter(c => (c.score || 0) >= 30 && (c.score || 0) < 70).length;
      const leadsFrios   = soLeads.filter(c => (c.score || 0) < 30).length;

      // ── Origens ───────────────────────────────────────────────────
      const origens = contatos.reduce((acc, c) => {
        const o = c.origem || 'manual';
        acc[o] = (acc[o] || 0) + 1;
        return acc;
      }, {});

      // ── Distribuição por time ─────────────────────────────────────
      const porTime = times.map(t => ({
        ...t,
        total: contatos.filter(c => c.time_id === t.id).length,
        leads: soLeads.filter(c => c.time_id === t.id).length,
        clientes: soClientes.filter(c => c.time_id === t.id).length,
      })).filter(t => t.total > 0);

      // ── Agenda ────────────────────────────────────────────────────
      const totalEventos   = eventos.length;
      const hoje           = new Date();
      const eventosHoje    = eventos.filter(e => {
        const d = new Date(e.data_inicio);
        return d.toDateString() === hoje.toDateString();
      }).length;

      // ── Outbound ──────────────────────────────────────────────────
      const totalAcoes      = acoes.length;
      const acoesPendentes  = acoes.filter(a => a.status === 'pendente').length;
      const acoesConcluidas = acoes.filter(a => a.status === 'concluido').length;

      setDados({
        totalContatos, totalLeads, totalClientes,
        leads, qualificados, propostas, negociacao,
        fechados, perdidos, valorPipeline, valorFechado,
        ltvTotal, ltvMedio, taxaConversao,
        leadsQuentes, leadsMornos, leadsFrios,
        origens, porTime,
        totalEventos, eventosHoje,
        totalAcoes, acoesPendentes, acoesConcluidas,
      });
    } catch (err) {
      setErro('Erro ao carregar dados. Tente novamente.');
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.tenant_id, usuario?.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fmt = (v) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            📊 Relatórios
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Métricas e indicadores do seu negócio em tempo real.
          </p>
        </div>
        <button
          onClick={carregar}
          disabled={carregando}
          className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-primary-500/50 disabled:opacity-50"
          style={{ borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}
          title="Atualizar dados"
        >
          🔄 Atualizar
        </button>
      </div>

      {carregando && <Spinner />}

      {erro && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
          <p className="text-red-400 text-sm">{erro}</p>
        </div>
      )}

      {!carregando && !erro && dados && (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardMetrica
              emoji="🎯"
              titulo="Total de leads"
              valor={dados.totalLeads}
              cor="text-primary-400"
            />
            <CardMetrica
              emoji="🤝"
              titulo="Clientes ativos"
              valor={dados.totalClientes}
              cor="text-emerald-400"
            />
            <CardMetrica
              emoji="✅"
              titulo="Negócios fechados"
              valor={dados.fechados}
              cor="text-emerald-400"
            />
            <CardMetrica
              emoji="💰"
              titulo="Receita fechada"
              valor={dados.valorFechado > 0 ? `R$ ${fmt(dados.valorFechado)}` : 'R$ 0,00'}
              cor="text-yellow-400"
            />
          </div>

          {/* KPIs secundários */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardMetrica
              emoji="📈"
              titulo="Taxa de conversão"
              valor={`${dados.taxaConversao}%`}
              cor="text-blue-400"
            />
            <CardMetrica
              emoji="💎"
              titulo="LTV médio (clientes)"
              valor={dados.ltvMedio > 0 ? `R$ ${fmt(dados.ltvMedio)}` : 'R$ 0,00'}
              cor="text-violet-400"
            />
            <CardMetrica
              emoji="🔥"
              titulo="Leads quentes"
              valor={dados.leadsQuentes}
              cor="text-red-400"
            />
            <CardMetrica
              emoji="❄️"
              titulo="Leads frios"
              valor={dados.leadsFrios}
              cor="text-slate-400"
            />
          </div>

          {/* Pipeline + Outbound */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

            {/* Funil de vendas */}
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                🔽 Funil de vendas
              </h3>
              {dados.totalLeads === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Nenhum lead cadastrado ainda.
                </p>
              ) : (
                <>
                  <BarraProgresso label="Lead"        valor={dados.leads}        total={dados.totalLeads} cor="bg-slate-500" />
                  <BarraProgresso label="Qualificado" valor={dados.qualificados} total={dados.totalLeads} cor="bg-blue-500" />
                  <BarraProgresso label="Proposta"    valor={dados.propostas}    total={dados.totalLeads} cor="bg-violet-500" />
                  <BarraProgresso label="Negociação"  valor={dados.negociacao}   total={dados.totalLeads} cor="bg-amber-500" />
                  <BarraProgresso label="Fechado"     valor={dados.fechados}     total={dados.totalLeads} cor="bg-emerald-500" />
                  <BarraProgresso label="Perdido"     valor={dados.perdidos}     total={dados.totalLeads} cor="bg-red-500" />
                  {dados.valorPipeline > 0 && (
                    <p className="text-xs mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
                      Pipeline ativo:{' '}
                      <span className="text-emerald-400 font-medium">R$ {fmt(dados.valorPipeline)}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Outbound */}
            <div className="rounded-xl border p-5"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                📧 Outbound & Agenda
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b"
                  style={{ borderColor: 'var(--color-surface-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total de ações outbound</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{dados.totalAcoes}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b"
                  style={{ borderColor: 'var(--color-surface-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ações pendentes</span>
                  <span className="font-semibold text-amber-400">{dados.acoesPendentes}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b"
                  style={{ borderColor: 'var(--color-surface-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ações concluídas</span>
                  <span className="font-semibold text-emerald-400">{dados.acoesConcluidas}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b"
                  style={{ borderColor: 'var(--color-surface-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Eventos na agenda</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{dados.totalEventos}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Eventos hoje</span>
                  <span className="font-semibold text-primary-400">{dados.eventosHoje}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Score distribution */}
          {dados.totalLeads > 0 && (
            <div className="rounded-xl border p-5 mb-6"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                🌡️ Temperatura dos leads
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#ef444415' }}>
                  <p className="text-2xl font-bold text-red-400">{dados.leadsQuentes}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>🔥 Quentes (≥70)</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#f59e0b15' }}>
                  <p className="text-2xl font-bold text-amber-400">{dados.leadsMornos}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>🌡️ Mornos (30–69)</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ backgroundColor: '#94a3b815' }}>
                  <p className="text-2xl font-bold text-slate-400">{dados.leadsFrios}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>❄️ Frios (&lt;30)</p>
                </div>
              </div>
            </div>
          )}

          {/* Distribuição por time */}
          {dados.porTime?.length > 0 && (
            <div className="rounded-xl border overflow-hidden mb-6"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  🏷️ Distribuição por time
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                    <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Time</th>
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Leads</th>
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Clientes</th>
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.porTime.map(t => (
                    <tr key={t.id} className="border-b last:border-0"
                      style={{ borderColor: 'var(--color-surface-border)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        <span className="mr-1">{t.icone}</span>
                        <span style={{ color: t.cor_primaria }}>{t.nome}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-primary-400 font-medium">{t.leads}</td>
                      <td className="px-4 py-3 text-sm text-right text-emerald-400 font-medium">{t.clientes}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Fontes de leads */}
          {Object.keys(dados.origens).length > 0 && (
            <div className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
              <div className="p-4 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  🌐 Fontes de contatos
                </h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                    <th className="text-left text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Fonte</th>
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>Contatos</th>
                    <th className="text-right text-xs font-medium px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>% do total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(dados.origens)
                    .sort(([,a],[,b]) => b - a)
                    .map(([fonte, qtd]) => (
                      <tr key={fonte} className="border-b last:border-0"
                        style={{ borderColor: 'var(--color-surface-border)' }}>
                        <td className="px-4 py-3 text-sm capitalize" style={{ color: 'var(--color-text-primary)' }}>
                          {fonte}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {qtd}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-emerald-400">
                          {dados.totalContatos > 0 ? Math.round((qtd / dados.totalContatos) * 100) : 0}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Estado vazio */}
          {dados.totalContatos === 0 && dados.totalLeads === 0 && dados.totalAcoes === 0 && dados.totalEventos === 0 && (
            <div className="text-center py-12 rounded-xl border border-dashed mt-4"
              style={{ borderColor: 'var(--color-surface-border)' }}>
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Nenhum dado ainda
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Adicione contatos no CRM, eventos na Agenda ou ações no Outbound para ver métricas aqui.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Relatorios;
