// =============================================================
// PRANCHETO.IA - RELATÓRIOS (Em Construção)
// =============================================================

import React from 'react';

const CardMetrica = ({ emoji, titulo, valor, variacao, cor = 'text-white' }) => (
  <div className="bg-surface-card border border-surface-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{emoji}</span>
      {variacao !== undefined && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${variacao >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          {variacao >= 0 ? '↑' : '↓'} {Math.abs(variacao)}%
        </span>
      )}
    </div>
    <p className={`text-2xl font-bold ${cor} mb-1`}>{valor}</p>
    <p className="text-slate-400 text-sm">{titulo}</p>
  </div>
);

const Relatorios = () => (
  <div className="p-6 max-w-5xl mx-auto">

    {/* Cabeçalho */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Relatórios</h1>
        <p className="text-slate-400 text-sm mt-1">Métricas e indicadores do seu negócio.</p>
      </div>
      <div className="flex gap-2">
        {['7d', '30d', '90d'].map(p => (
          <button
            key={p}
            disabled
            className="px-3 py-1.5 rounded-lg text-xs border border-surface-border text-slate-400 cursor-not-allowed opacity-60"
          >
            {p}
          </button>
        ))}
      </div>
    </div>

    {/* Banner Em Construção */}
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
      <span className="text-2xl">🚧</span>
      <div>
        <p className="text-amber-300 font-medium text-sm">Módulo em construção</p>
        <p className="text-amber-400/70 text-xs">Os dados abaixo são demonstrativos. A integração real estará disponível em breve.</p>
      </div>
    </div>

    {/* Cards de métricas (demo) */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <CardMetrica emoji="👥" titulo="Total de contatos"   valor="248"   variacao={12}  cor="text-white" />
      <CardMetrica emoji="🎯" titulo="Leads ativos"        valor="34"    variacao={-5}  cor="text-primary-400" />
      <CardMetrica emoji="✅" titulo="Negócios fechados"   valor="12"    variacao={20}  cor="text-emerald-400" />
      <CardMetrica emoji="💰" titulo="Receita estimada"    valor="R$ 0"  variacao={0}   cor="text-yellow-400" />
    </div>

    {/* Gráfico placeholder */}
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 mb-6">
      <h3 className="text-white font-semibold mb-4">Evolução de leads (últimos 30 dias)</h3>
      <div className="h-48 flex items-end gap-2">
        {[20, 35, 28, 45, 38, 52, 41, 60, 48, 55, 42, 68, 58, 72, 65, 80, 70, 85, 75, 90, 82, 95, 88, 100, 92, 88, 95, 85, 92, 98].map((v, i) => (
          <div
            key={i}
            className="flex-1 bg-primary-500/30 hover:bg-primary-500/50 rounded-t transition-colors"
            style={{ height: `${v}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>1 Jun</span>
        <span>15 Jun</span>
        <span>30 Jun</span>
      </div>
    </div>

    {/* Tabela placeholder */}
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-surface-border">
        <h3 className="text-white font-semibold">Top fontes de leads</h3>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="text-left text-xs text-slate-400 font-medium px-4 py-3">Fonte</th>
            <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Leads</th>
            <th className="text-right text-xs text-slate-400 font-medium px-4 py-3">Conversão</th>
          </tr>
        </thead>
        <tbody>
          {[
            { fonte: 'Site / Orgânico', leads: 98, conv: '12%' },
            { fonte: 'Indicação',       leads: 67, conv: '28%' },
            { fonte: 'LinkedIn',        leads: 45, conv: '8%' },
            { fonte: 'E-mail',          leads: 38, conv: '15%' },
          ].map((row, i) => (
            <tr key={i} className="border-b border-surface-border/50 hover:bg-white/2">
              <td className="px-4 py-3 text-slate-300 text-sm">{row.fonte}</td>
              <td className="px-4 py-3 text-white text-sm text-right font-medium">{row.leads}</td>
              <td className="px-4 py-3 text-emerald-400 text-sm text-right">{row.conv}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default Relatorios;
