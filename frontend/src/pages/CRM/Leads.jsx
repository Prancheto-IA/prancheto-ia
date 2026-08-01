// =============================================================
// PRANCHETO.IA - PÁGINA DE LEADS (FASE 2)
// Funil de entrada: triagem, qualificação, scoring e conversão
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  useLeads, useInteracoes,
  FUNIL_LEAD, TIPOS_INTERACAO, ORIGENS,
  funilInfo, tipoInfo, origemInfo,
  formatarMoeda, tempoRelativo,
} from '../../hooks/useCRM.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';

// ─── Componentes auxiliares ────────────────────────────────────
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);

const BadgeFunil = ({ status }) => {
  const f = funilInfo(status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${f.cor}`}>
      {f.emoji} {f.label}
    </span>
  );
};

const BadgeScore = ({ score }) => {
  const cor = score >= 50 ? 'text-emerald-400' : score >= 20 ? 'text-amber-400' : 'text-slate-400';
  return <span className={`text-xs font-bold ${cor}`}>⚡ {score} pts</span>;
};

// ─── Modal: Criar/Editar Lead ──────────────────────────────────
const ModalLead = ({ aberto, onFechar, onSalvar, leadEditando }) => {
  const FORM_VAZIO = {
    nome: '', email: '', telefone: '', empresa: '', cargo: '',
    origem: 'manual', status_funil: 'lead', valor_estimado: '', observacoes: '',
  };
  const [form, setForm]         = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (leadEditando) {
      setForm({
        nome:          leadEditando.nome          || '',
        email:         leadEditando.email         || '',
        telefone:      leadEditando.telefone      || '',
        empresa:       leadEditando.empresa       || '',
        cargo:         leadEditando.cargo         || '',
        origem:        leadEditando.origem        || 'manual',
        status_funil:  leadEditando.status_funil  || 'lead',
        valor_estimado:leadEditando.valor_estimado|| '',
        observacoes:   leadEditando.observacoes   || '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [leadEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        nome:           form.nome.trim(),
        email:          form.email.trim()    || null,
        telefone:       form.telefone.trim() || null,
        empresa:        form.empresa.trim()  || null,
        cargo:          form.cargo.trim()    || null,
        origem:         form.origem,
        status_funil:   form.status_funil,
        valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
        observacoes:    form.observacoes.trim() || null,
      });
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar lead.');
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-xl p-6 w-full max-w-lg my-4 border"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {leadEditando ? '✏️ Editar Lead' : '🎯 Novo Lead'}
          </h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nome *</label>
              <input type="text" value={form.nome} onChange={set('nome')} placeholder="João Silva"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Empresa</label>
              <input type="text" value={form.empresa} onChange={set('empresa')} placeholder="Acme Corp"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="joao@empresa.com"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Telefone</label>
              <input type="text" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Cargo</label>
              <input type="text" value={form.cargo} onChange={set('cargo')} placeholder="CEO"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Valor estimado (R$)</label>
              <input type="number" value={form.valor_estimado} onChange={set('valor_estimado')} placeholder="0,00" min="0" step="0.01"
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Status no funil</label>
              <select value={form.status_funil} onChange={set('status_funil')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                {FUNIL_LEAD.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Origem</label>
              <select value={form.origem} onChange={set('origem')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                {ORIGENS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Observações</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Notas sobre o lead..."
              className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              style={inputStyle} />
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Painel de detalhes do Lead ────────────────────────────────
const PainelLead = ({ lead, onFechar, onEditar, onExcluir, onMudarStatus, onConverter }) => {
  const { interacoes, carregando: carregandoInt, carregar, adicionar } = useInteracoes(lead?.id);
  const [novaInteracao, setNovaInteracao]         = useState('');
  const [tipoInteracao, setTipoInteracao]         = useState('nota');
  const [enviando, setEnviando]                   = useState(false);
  const [convertendo, setConvertendo]             = useState(false);
  const [confirmarConversao, setConfirmarConversao] = useState(false);
  const [erroConversao, setErroConversao]         = useState('');

  useEffect(() => { if (lead?.id) carregar(); }, [lead?.id, carregar]);

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

  const handleConverter = async () => {
    setConvertendo(true);
    setErroConversao('');
    try {
      await onConverter(lead.id);
      onFechar();
    } catch (err) {
      setErroConversao(err?.message || 'Erro ao converter o lead em cliente.');
    } finally {
      setConvertendo(false);
    }
  };

  if (!lead) return null;

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl flex flex-col border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{lead.nome}</h3>
              <BadgeFunil status={lead.status_funil} />
              <BadgeScore score={lead.score || 0} />
            </div>
            {lead.empresa && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{lead.empresa}</p>
            )}
            <div className="flex gap-3 mt-2 flex-wrap">
              {lead.email    && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>✉️ {lead.email}</span>}
              {lead.telefone && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📞 {lead.telefone}</span>}
              {lead.valor_estimado && (
                <span className="text-xs text-emerald-400">💰 {formatarMoeda(lead.valor_estimado)}</span>
              )}
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                📍 {origemInfo(lead.origem).label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3">
            <button onClick={() => onEditar(lead)} className="text-slate-400 hover:text-primary-400 transition-colors" title="Editar">✏️</button>
            <PermissaoGuarda permissao="crm.excluir"><button onClick={() => onExcluir(lead.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Excluir">🗑️</button></PermissaoGuarda>
            <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors text-lg">✕</button>
          </div>
        </div>

        {/* Mover no funil */}
        <div className="px-5 py-3 border-b flex gap-2 flex-wrap flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <span className="text-xs font-medium self-center" style={{ color: 'var(--color-text-secondary)' }}>Mover para:</span>
          {FUNIL_LEAD.map(f => (
            <button key={f.key}
              onClick={() => onMudarStatus(lead.id, f.key)}
              disabled={f.key === lead.status_funil}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${f.cor} ${f.key === lead.status_funil ? 'opacity-100 ring-1 ring-white/20' : 'opacity-50 hover:opacity-100'}`}>
              {f.emoji} {f.label}
            </button>
          ))}
        </div>

        {/* Botão de Conversão */}
        <div className="px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)', backgroundColor: 'rgba(16,185,129,0.05)' }}>
          {!confirmarConversao ? (
            <button
              onClick={() => setConfirmarConversao(true)}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-2">
              🎉 Converter para Cliente
            </button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm text-emerald-300 flex-1">
                Confirmar conversão de <strong>{lead.nome}</strong> para Cliente?
              </p>
              <button onClick={() => { setConfirmarConversao(false); setErroConversao(''); }}
                className="text-xs px-3 py-1.5 rounded-lg border text-slate-400"
                style={{ borderColor: 'var(--color-surface-border)' }}>
                Cancelar
              </button>
              <button onClick={handleConverter} disabled={convertendo}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-50">
                {convertendo ? 'Convertendo...' : 'Confirmar'}
              </button>
            </div>
          )}
          {erroConversao && (
            <p className="text-red-400 text-xs mt-2">{erroConversao}</p>
          )}
        </div>

        {/* Histórico de interações */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
            Histórico de Interações
          </h4>

          {carregandoInt ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : interacoes.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhuma interação registrada ainda.
            </p>
          ) : (
            interacoes.map(int => {
              const t = tipoInfo(int.tipo);
              return (
                <div key={int.id} className="flex gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.label}</span>
                      {int.tipo !== 'conversao' && (
                        <span className="text-xs text-emerald-400">+{t.score} pts</span>
                      )}
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

        {/* Formulário de nova interação */}
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
      </div>
    </div>
  );
};

// ─── Card do Lead (Kanban) ─────────────────────────────────────
const CardLead = ({ lead, onAbrir }) => (
  <div
    onClick={() => onAbrir(lead)}
    className="rounded-lg p-3 border cursor-pointer hover:border-primary-500/40 transition-all group"
    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}>
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium group-hover:text-primary-300 transition-colors truncate"
        style={{ color: 'var(--color-text-primary)' }}>
        {lead.nome}
      </p>
      <BadgeScore score={lead.score || 0} />
    </div>
    {lead.empresa && (
      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>{lead.empresa}</p>
    )}
    <div className="flex items-center justify-between mt-2">
      {lead.valor_estimado ? (
        <span className="text-xs text-emerald-400">{formatarMoeda(lead.valor_estimado)}</span>
      ) : (
        <span />
      )}
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {tempoRelativo(lead.criado_em)}
      </span>
    </div>
  </div>
);

// ─── Coluna do Kanban ──────────────────────────────────────────
const ColunaKanban = ({ funil, leads, onAbrir }) => (
  <div className="flex-shrink-0 w-64">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span>{funil.emoji}</span>
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{funil.label}</span>
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
        {leads.length}
      </span>
    </div>
    <div className="space-y-2 min-h-24">
      {leads.map(lead => (
        <CardLead key={lead.id} lead={lead} onAbrir={onAbrir} />
      ))}
      {leads.length === 0 && (
        <div className="rounded-lg border-2 border-dashed p-4 text-center"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Nenhum lead</p>
        </div>
      )}
    </div>
  </div>
);

// ─── Linha da lista ────────────────────────────────────────────
const LinhaLead = ({ lead, onAbrir, onEditar, onExcluir }) => (
  <tr className="border-b hover:bg-white/5 transition-colors cursor-pointer"
    style={{ borderColor: 'var(--color-surface-border)' }}
    onClick={() => onAbrir(lead)}>
    <td className="px-4 py-3">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{lead.nome}</p>
        {lead.empresa && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{lead.empresa}</p>}
      </div>
    </td>
    <td className="px-4 py-3"><BadgeFunil status={lead.status_funil} /></td>
    <td className="px-4 py-3"><BadgeScore score={lead.score || 0} /></td>
    <td className="px-4 py-3">
      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {lead.valor_estimado ? formatarMoeda(lead.valor_estimado) : '—'}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {origemInfo(lead.origem).label}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {tempoRelativo(lead.criado_em)}
      </span>
    </td>
    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
      <div className="flex gap-2">
        <button onClick={() => onEditar(lead)} className="text-slate-500 hover:text-primary-400 transition-colors text-sm">✏️</button>
        <PermissaoGuarda permissao="crm.excluir"><button onClick={() => onExcluir(lead.id)} className="text-slate-500 hover:text-red-400 transition-colors text-sm">🗑️</button></PermissaoGuarda>
      </div>
    </td>
  </tr>
);

// ─── Página Principal: Leads ───────────────────────────────────
const PaginaLeads = () => {
  const {
    leads, carregando, erro,
    carregar, criar, atualizar, excluir,
    converterParaCliente, mudarStatus,
  } = useLeads();

  const [modalAberto, setModalAberto]   = useState(false);
  const [leadEditando, setLeadEditando] = useState(null);
  const [painelLead, setPainelLead]     = useState(null);
  const [busca, setBusca]               = useState('');
  const [vista, setVista]               = useState('kanban');

  useEffect(() => { carregar(); }, [carregar]);

  const leadsFiltrados = leads.filter(l =>
    !busca ||
    l.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (l.empresa || '').toLowerCase().includes(busca.toLowerCase())
  );

  const handleSalvar = async (dados) => {
    if (leadEditando) {
      const atualizado = await atualizar(leadEditando.id, dados);
      if (painelLead?.id === leadEditando.id) setPainelLead(atualizado);
    } else {
      await criar(dados);
    }
    setLeadEditando(null);
  };

  const handleEditar = (lead) => {
    setLeadEditando(lead);
    setModalAberto(true);
    setPainelLead(null);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este lead?')) return;
    await excluir(id);
    if (painelLead?.id === id) setPainelLead(null);
  };

  const handleMudarStatus = async (id, novoStatus) => {
    const atualizado = await mudarStatus(id, novoStatus);
    if (painelLead?.id === id) setPainelLead(atualizado);
  };

  const handleConverter = async (id) => {
    await converterParaCliente(id);
    setPainelLead(null);
  };

  // Agrupar por status_funil para o Kanban
  const kanban = FUNIL_LEAD.reduce((acc, f) => {
    acc[f.key] = leadsFiltrados.filter(l => l.status_funil === f.key);
    return acc;
  }, {});

  const totalScore = leads.reduce((s, l) => s + (l.score || 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            🎯 Leads
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {leads.length} leads · Score total: ⚡ {totalScore} pts
          </p>
        </div>
        <button
          onClick={() => { setLeadEditando(null); setModalAberto(true); }}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          + Novo Lead
        </button>
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
          <button onClick={() => setVista('kanban')}
            className={`px-3 py-2 text-sm transition-colors ${vista === 'kanban' ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
            style={vista !== 'kanban' ? { backgroundColor: 'var(--color-surface-card)' } : {}}>
            🗂️ Kanban
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

      {/* Vista Kanban */}
      {!carregando && vista === 'kanban' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {FUNIL_LEAD.map(f => (
              <ColunaKanban key={f.key} funil={f} leads={kanban[f.key] || []} onAbrir={setPainelLead} />
            ))}
          </div>
        </div>
      )}

      {/* Vista Lista */}
      {!carregando && vista === 'lista' && (
        <div className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          {leadsFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum lead encontrado</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {busca ? 'Tente outro termo de busca.' : 'Crie seu primeiro lead clicando em "+ Novo Lead".'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
                  {['Nome', 'Status', 'Score', 'Valor', 'Origem', 'Criado', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--color-text-secondary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.map(lead => (
                  <LinhaLead
                    key={lead.id}
                    lead={lead}
                    onAbrir={setPainelLead}
                    onEditar={handleEditar}
                    onExcluir={handleExcluir}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal criar/editar */}
      <ModalLead
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setLeadEditando(null); }}
        onSalvar={handleSalvar}
        leadEditando={leadEditando}
      />

      {/* Painel de detalhes */}
      {painelLead && (
        <PainelLead
          lead={painelLead}
          onFechar={() => setPainelLead(null)}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
          onMudarStatus={handleMudarStatus}
          onConverter={handleConverter}
        />
      )}
    </div>
  );
};

export default PaginaLeads;