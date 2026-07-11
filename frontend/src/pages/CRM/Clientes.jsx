// =============================================================
// PRANCHETO.IA - PÁGINA DE CLIENTES (FASE 2)
// Centro de relacionamento: retenção, suporte, expansão (upsell)
// Herança de histórico completo do período como Lead
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  useClientes, useInteracoes, useDocumentos,
  TIPOS_INTERACAO, ORIGENS,
  tipoInfo, origemInfo,
  formatarMoeda, formatarData, formatarDataHora, tempoRelativo,
} from '../../hooks/useCRM.js';

// ─── Componentes auxiliares ────────────────────────────────────
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);

const BadgeLTV = ({ ltv }) => {
  if (!ltv || ltv === 0) return <span className="text-xs text-slate-500">LTV: —</span>;
  const cor = ltv >= 10000 ? 'text-emerald-400' : ltv >= 1000 ? 'text-amber-400' : 'text-slate-400';
  return <span className={`text-xs font-bold ${cor}`}>💎 {formatarMoeda(ltv)}</span>;
};

const BadgeTempo = ({ convertidoEm, criadoEm }) => {
  const inicio = convertidoEm || criadoEm;
  if (!inicio) return null;
  const dias = Math.floor((Date.now() - new Date(inicio).getTime()) / 86400000);
  const cor = dias >= 365 ? 'text-emerald-400' : dias >= 90 ? 'text-amber-400' : 'text-slate-400';
  const label = dias >= 365
    ? `${Math.floor(dias / 365)}a ${Math.floor((dias % 365) / 30)}m`
    : dias >= 30
    ? `${Math.floor(dias / 30)} meses`
    : `${dias} dias`;
  return <span className={`text-xs ${cor}`}>⏱️ {label} na base</span>;
};

// ─── Painel de detalhes do Cliente ────────────────────────────
const PainelCliente = ({ cliente, onFechar, onEditar, onExcluir }) => {
  const { interacoes, carregando: carregandoInt, carregar: carregarInt, adicionar } = useInteracoes(cliente?.id);
  const { documentos, carregando: carregandoDoc, carregar: carregarDoc } = useDocumentos(cliente?.id);
  const [aba, setAba]                     = useState('historico');
  const [novaInteracao, setNovaInteracao] = useState('');
  const [tipoInteracao, setTipoInteracao] = useState('nota');
  const [enviando, setEnviando]           = useState(false);

  useEffect(() => {
    if (cliente?.id) {
      carregarInt();
      carregarDoc();
    }
  }, [cliente?.id, carregarInt, carregarDoc]);

  const handleInteracao = async (e) => {
    e.preventDefault();
    if (!novaInteracao.trim()) return;
    setEnviando(true);
    try {
      await adicionar(tipoInteracao, novaInteracao.trim());
      setNovaInteracao('');
    } catch { /* silencioso */ }
    finally { setEnviando(false); }
  };

  if (!cliente) return null;

  const diasNaBase = cliente.convertido_em
    ? Math.floor((Date.now() - new Date(cliente.convertido_em).getTime()) / 86400000)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl flex flex-col border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{cliente.nome}</h3>
              <span className="text-xs px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                ✅ Cliente
              </span>
            </div>
            {cliente.empresa && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{cliente.empresa}</p>
            )}
            <div className="flex gap-3 mt-2 flex-wrap">
              {cliente.email    && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>✉️ {cliente.email}</span>}
              {cliente.telefone && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📞 {cliente.telefone}</span>}
              <BadgeLTV ltv={cliente.ltv} />
              <BadgeTempo convertidoEm={cliente.convertido_em} criadoEm={cliente.criado_em} />
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3">
            <button onClick={() => onEditar(cliente)} className="text-slate-400 hover:text-primary-400 transition-colors" title="Editar">✏️</button>
            <button onClick={() => onExcluir(cliente.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir">🗑️</button>
            <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-lg font-bold text-emerald-400">{formatarMoeda(cliente.ltv || 0)}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>LTV</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {diasNaBase != null ? `${diasNaBase}d` : '—'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Dias na base</p>
          </div>
          <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
            <p className="text-lg font-bold text-amber-400">⚡ {cliente.score || 0}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Score final</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--color-surface-border)' }}>
          {[
            { key: 'historico',  label: '📝 Histórico'   },
            { key: 'documentos', label: '📎 Documentos'  },
            { key: 'detalhes',   label: 'ℹ️ Detalhes'    },
          ].map(a => (
            <button key={a.key}
              onClick={() => setAba(a.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${aba === a.key ? 'border-primary-500 text-primary-300' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto">

          {/* Aba: Histórico (herança completa do período como Lead) */}
          {aba === 'historico' && (
            <div className="p-5 space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Exibindo todo o histórico — incluindo interações do período como Lead.
              </p>
              {carregandoInt ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : interacoes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Nenhuma interação registrada.
                </p>
              ) : (
                interacoes.map(int => {
                  const t = tipoInfo(int.tipo);
                  const isConversao = int.tipo === 'conversao';
                  return (
                    <div key={int.id} className={`flex gap-3 ${isConversao ? 'p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5' : ''}`}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {isConversao ? '🎉 Convertido para Cliente' : t.label}
                          </span>
                          <span className="text-xs ml-auto" style={{ color: 'var(--color-text-secondary)' }}>
                            {tempoRelativo(int.criado_em)}
                          </span>
                        </div>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{int.conteudo}</p>
                        {int.criado_por_user && (
                          <p className="text-xs mt-0.5 text-slate-500">por {int.criado_por_user.nome}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Aba: Documentos */}
          {aba === 'documentos' && (
            <div className="p-5 space-y-3">
              {carregandoDoc ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : documentos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-3xl mb-2">📎</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Nenhum documento anexado.
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    Upload de documentos disponível em breve.
                  </p>
                </div>
              ) : (
                documentos.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
                    <span className="text-2xl flex-shrink-0">
                      {doc.tipo === 'contrato' ? '📜' : doc.tipo === 'proposta' ? '📄' : doc.tipo === 'nf' ? '🧾' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{doc.nome}</p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {doc.tipo} · {doc.tamanho_kb ? `${doc.tamanho_kb} KB` : ''} · {formatarData(doc.criado_em)}
                      </p>
                    </div>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer"
                      className="text-primary-400 hover:text-primary-300 text-sm transition-colors flex-shrink-0">
                      ↗️
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Aba: Detalhes */}
          {aba === 'detalhes' && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Origem',          valor: origemInfo(cliente.origem).label },
                  { label: 'Cargo',           valor: cliente.cargo || '—' },
                  { label: 'Valor estimado',  valor: formatarMoeda(cliente.valor_estimado) },
                  { label: 'Convertido em',   valor: formatarDataHora(cliente.convertido_em) },
                  { label: 'Início contrato', valor: formatarData(cliente.data_inicio_contrato) },
                  { label: 'Fim contrato',    valor: formatarData(cliente.data_fim_contrato) },
                  { label: 'Cliente desde',   valor: formatarData(cliente.criado_em) },
                  { label: 'Responsável',     valor: cliente.responsavel?.nome || '—' },
                ].map(({ label, valor }) => (
                  <div key={label}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{valor}</p>
                  </div>
                ))}
              </div>
              {cliente.observacoes && (
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Observações</p>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{cliente.observacoes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulário de nova interação (apenas na aba histórico) */}
        {aba === 'historico' && (
          <form onSubmit={handleInteracao} className="p-4 border-t flex-shrink-0"
            style={{ borderColor: 'var(--color-surface-border)' }}>
            <div className="flex gap-2 mb-2 flex-wrap">
              {TIPOS_INTERACAO.filter(t => t.key !== 'conversao').map(t => (
                <button key={t.key} type="button"
                  onClick={() => setTipoInteracao(t.key)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${tipoInteracao === t.key ? 'bg-primary-500/20 text-primary-300 border-primary-500/30' : 'text-slate-500 border-slate-700 hover:border-slate-500'}`}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={novaInteracao}
                onChange={e => setNovaInteracao(e.target.value)}
                placeholder="Registrar interação..."
                className="flex-1 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
              />
              <button type="submit" disabled={enviando || !novaInteracao.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                {enviando ? '...' : 'Registrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Card do Cliente ───────────────────────────────────────────
const CardCliente = ({ cliente, onAbrir }) => (
  <div
    onClick={() => onAbrir(cliente)}
    className="rounded-xl p-4 border cursor-pointer hover:border-primary-500/40 transition-all group"
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold group-hover:text-primary-300 transition-colors truncate"
          style={{ color: 'var(--color-text-primary)' }}>
          {cliente.nome}
        </p>
        {cliente.empresa && (
          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{cliente.empresa}</p>
        )}
      </div>
      <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
        ✅
      </span>
    </div>
    <div className="flex items-center justify-between mt-3">
      <BadgeLTV ltv={cliente.ltv} />
      <BadgeTempo convertidoEm={cliente.convertido_em} criadoEm={cliente.criado_em} />
    </div>
  </div>
);

// ─── Linha da lista ────────────────────────────────────────────
const LinhaCliente = ({ cliente, onAbrir, onEditar, onExcluir }) => (
  <tr className="border-b hover:bg-white/5 transition-colors cursor-pointer"
    style={{ borderColor: 'var(--color-surface-border)' }}
    onClick={() => onAbrir(cliente)}>
    <td className="px-4 py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{cliente.nome}</p>
        {cliente.empresa && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cliente.empresa}</p>}
      </div>
    </td>
    <td className="px-4 py-3"><BadgeLTV ltv={cliente.ltv} /></td>
    <td className="px-4 py-3">
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {formatarMoeda(cliente.valor_estimado)}
      </span>
    </td>
    <td className="px-4 py-3"><BadgeTempo convertidoEm={cliente.convertido_em} criadoEm={cliente.criado_em} /></td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {formatarData(cliente.convertido_em)}
      </span>
    </td>
    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2">
        <button onClick={() => onEditar(cliente)} className="text-slate-500 hover:text-primary-400 transition-colors text-sm">✏️</button>
        <button onClick={() => onExcluir(cliente.id)} className="text-slate-500 hover:text-red-400 transition-colors text-sm">🗑️</button>
      </div>
    </td>
  </tr>
);

// ─── Página Principal: Clientes ────────────────────────────────
const PaginaClientes = () => {
  const { clientes, carregando, erro, carregar, atualizar, excluir } = useClientes();

  const [painelCliente, setPainelCliente] = useState(null);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [busca, setBusca]   = useState('');
  const [vista, setVista]   = useState('cards');

  useEffect(() => { carregar(); }, [carregar]);

  const clientesFiltrados = clientes.filter(c =>
    !busca ||
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.empresa || '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleEditar = (cliente) => {
    setClienteEditando(cliente);
    setPainelCliente(null);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este cliente?')) return;
    await excluir(id);
    if (painelCliente?.id === id) setPainelCliente(null);
  };

  // Métricas resumidas
  const totalLTV    = clientes.reduce((s, c) => s + (c.ltv || 0), 0);
  const mediaLTV    = clientes.length ? totalLTV / clientes.length : 0;
  const novos30dias = clientes.filter(c => {
    const d = c.convertido_em || c.criado_em;
    return d && (Date.now() - new Date(d).getTime()) < 30 * 86400000;
  }).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            🏆 Clientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {clientes.length} clientes · LTV total: {formatarMoeda(totalLTV)}
          </p>
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { emoji: '👥', label: 'Total de Clientes', valor: clientes.length,           cor: 'text-primary-400' },
          { emoji: '💎', label: 'LTV Total',          valor: formatarMoeda(totalLTV),   cor: 'text-emerald-400' },
          { emoji: '📈', label: 'Novos (30 dias)',    valor: novos30dias,               cor: 'text-amber-400'   },
        ].map(({ emoji, label, valor, cor }) => (
          <div key={label} className="rounded-xl p-4 border"
            style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
            <p className="text-2xl mb-1">{emoji}</p>
            <p className={`text-xl font-bold ${cor}`}>{valor}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros e controles */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou empresa..."
          className="flex-1 min-w-48 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button onClick={() => setVista('cards')}
            className={`px-3 py-2 text-sm transition-colors ${vista === 'cards' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            style={vista !== 'cards' ? { backgroundColor: 'var(--color-surface-card)' } : {}}>
            🃏 Cards
          </button>
          <button onClick={() => setVista('lista')}
            className={`px-3 py-2 text-sm transition-colors ${vista === 'lista' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            style={vista !== 'lista' ? { backgroundColor: 'var(--color-surface-card)' } : {}}>
            📋 Lista
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{erro}</div>
      )}

      {/* Carregando */}
      {carregando && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {/* Vista Cards */}
      {!carregando && vista === 'cards' && (
        clientesFiltrados.length === 0 ? (
          <div className="rounded-xl border p-12 text-center"
            style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
            <p className="text-4xl mb-3">🏆</p>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum cliente ainda</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {busca ? 'Tente outro termo de busca.' : 'Converta leads para clientes na aba Leads.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesFiltrados.map(c => (
              <CardCliente key={c.id} cliente={c} onAbrir={setPainelCliente} />
            ))}
          </div>
        )
      )}

      {/* Vista Lista */}
      {!carregando && vista === 'lista' && (
        <div className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          {clientesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🏆</p>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                  {['Nome', 'LTV', 'Valor', 'Tempo na base', 'Convertido em', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map(c => (
                  <LinhaCliente
                    key={c.id}
                    cliente={c}
                    onAbrir={setPainelCliente}
                    onEditar={handleEditar}
                    onExcluir={handleExcluir}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Painel de detalhes */}
      {painelCliente && (
        <PainelCliente
          cliente={painelCliente}
          onFechar={() => setPainelCliente(null)}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
        />
      )}
    </div>
  );
};

export default PaginaClientes;
