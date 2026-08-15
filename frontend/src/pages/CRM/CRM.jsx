// =============================================================
// PRANCHETO.IA - CRM COMPLETO
// Lista de contatos, Kanban de funil, Modal de contato, Histórico
// Conectado ao backend: /api/crm/contatos + /api/crm/kanban
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTema } from '../../hooks/useTema.js';
import { supabase } from '../../lib/supabase.js';
import { NOME_PRODUTO } from '../../lib/ambiente.js';
import { useCamposCustom } from '../../hooks/useCRM.js';

// ─── Constantes ────────────────────────────────────────────────
const FUNIL = [
  { key: 'lead',        label: 'Lead',        cor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { key: 'qualificado', label: 'Qualificado', cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'proposta',    label: 'Proposta',    cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { key: 'negociacao',  label: 'Negociação',  cor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'fechado',     label: 'Fechado',     cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'perdido',     label: 'Perdido',     cor: 'bg-red-500/20 text-red-300 border-red-500/30' },
];

const TIPOS_INTERACAO = [
  { key: 'nota',     label: 'Nota',     emoji: '📝' },
  { key: 'ligacao',  label: 'Ligação',  emoji: '📞' },
  { key: 'email',    label: 'E-mail',   emoji: '✉️' },
  { key: 'reuniao',  label: 'Reunião',  emoji: '🤝' },
  { key: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  { key: 'outro',    label: 'Outro',    emoji: '📋' },
];

const ORIGENS = ['manual','site','indicacao','linkedin','email','outro'];

const FORM_VAZIO = {
  nome: '', email: '', telefone: '', empresa: '', cargo: '',
  origem: 'manual', status_funil: 'lead', valor_estimado: '', observacoes: '',
};

const funilInfo = (key) => FUNIL.find(f => f.key === key) || FUNIL[0];

// ─── Badge de status ───────────────────────────────────────────
// ─── Badge de temperatura (score) ─────────────────────────────
const BadgeScore = ({ score }) => {
  if (score == null) return null;
  const s = Number(score);
  if (s >= 70) return (
    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ef444422', color: '#ef4444' }} title={`Score: ${s}`}>
      🔥 {s}
    </span>
  );
  if (s >= 30) return (
    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#f59e0b22', color: '#f59e0b' }} title={`Score: ${s}`}>
      🌡️ {s}
    </span>
  );
  return (
    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#94a3b822', color: '#94a3b8' }} title={`Score: ${s}`}>
      ❄️ {s}
    </span>
  );
};

const BadgeFunil = ({ status }) => {
  const f = funilInfo(status);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${f.cor}`}>{f.label}</span>
  );
};

// ─── Modal de contato (criar/editar) ──────────────────────────
const ModalContato = ({ aberto, onFechar, onSalvar, contatoEditando }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (contatoEditando) {
      setForm({
        nome:           contatoEditando.nome           || '',
        email:          contatoEditando.email          || '',
        telefone:       contatoEditando.telefone       || '',
        empresa:        contatoEditando.empresa        || '',
        cargo:          contatoEditando.cargo          || '',
        origem:         contatoEditando.origem         || 'manual',
        status_funil:   contatoEditando.status_funil   || 'lead',
        valor_estimado: contatoEditando.valor_estimado || '',
        observacoes:    contatoEditando.observacoes    || '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [contatoEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        ...form,
        valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      });
      onFechar();
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao salvar contato.');
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
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {contatoEditando ? 'Editar Contato' : 'Novo Contato'}
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
                {FUNIL.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Origem</label>
              <select value={form.origem} onChange={set('origem')}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                style={inputStyle}>
                {ORIGENS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Observações</label>
            <textarea value={form.observacoes} onChange={set('observacoes')} rows={2} placeholder="Notas sobre o contato..."
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

// ─── Painel de detalhes do contato (histórico + interações) ────
const PainelContato = ({ contato, onFechar, onEditar, onExcluir, onMudarStatus }) => {
  const [interacoes, setInteracoes] = useState([]);
  const [novaInteracao, setNovaInteracao] = useState('');
  const [tipoInteracao, setTipoInteracao] = useState('nota');
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Campos customizados
  const { buscarValores } = useCamposCustom();
  const [valoresCampos, setValoresCampos] = useState([]);
  const [carregandoCampos, setCarregandoCampos] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const { data, error } = await supabase
          .from('crm_interacoes')
          .select('*')
          .eq('contato_id', contato.id)
          .order('criado_em', { ascending: false });
        
        if (error) throw error;
        setInteracoes(data || []);
      } catch { setInteracoes([]); }
      finally { setCarregando(false); }
    };
    carregar();
  }, [contato.id]);

  // Carrega valores de campos customizados do contato
  useEffect(() => {
    const carregarCampos = async () => {
      setCarregandoCampos(true);
      try {
        const valores = await buscarValores(contato.id);
        setValoresCampos(valores || []);
      } catch { setValoresCampos([]); }
      finally { setCarregandoCampos(false); }
    };
    carregarCampos();
  }, [contato.id, buscarValores]);

  // Agrupa valores por time e detecta labels duplicados entre times
  // para exibir namespace "label (NomeDoTime)" quando necessário
  const camposComNamespace = (() => {
    if (!valoresCampos.length) return [];
    // Conta quantos times têm cada label
    const contagemLabel = {};
    valoresCampos.forEach(v => {
      const label = v.campo?.label || v.campo?.nome || '';
      contagemLabel[label] = (contagemLabel[label] || 0) + 1;
    });
    return valoresCampos
      .filter(v => v.valor != null || v.valor_json != null)
      .map(v => {
        const label = v.campo?.label || v.campo?.nome || 'Campo';
        const nomeTime = v.campo?.time_id ? (v.campo?.time?.nome || null) : null;
        const temConflito = contagemLabel[label] > 1;
        return {
          ...v,
          labelExibido: temConflito && nomeTime ? `${label} (${nomeTime})` : label,
          nomeTime,
        };
      })
      // Ordena: campos do time atual do contato primeiro, depois outros
      .sort((a, b) => {
        const aDoTime = a.campo?.time_id === contato.time_id ? 0 : 1;
        const bDoTime = b.campo?.time_id === contato.time_id ? 0 : 1;
        return aDoTime - bDoTime;
      });
  })();

  const adicionarInteracao = async (e) => {
    e.preventDefault();
    if (!novaInteracao.trim()) return;
    setEnviando(true);
    try {
      const registro = {
        contato_id: contato.id,
        tipo: tipoInteracao,
        conteudo: novaInteracao.trim(),
      };
      
      const { data, error } = await supabase.from('crm_interacoes').insert(registro).select().single();
      if (error) throw error;
      
      setInteracoes(prev => [data, ...prev]);
      setNovaInteracao('');
    } catch { /* silencioso */ }
    finally { setEnviando(false); }
  };

  const tipoInfo = (key) => TIPOS_INTERACAO.find(t => t.key === key) || TIPOS_INTERACAO[0];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-xl flex flex-col border overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{contato.nome}</h3>
              <BadgeFunil status={contato.status_funil} />
            </div>
            {contato.empresa && <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{contato.empresa}</p>}
            <div className="flex gap-3 mt-2 flex-wrap">
              {contato.email    && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>✉️ {contato.email}</span>}
              {contato.telefone && <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📞 {contato.telefone}</span>}
              {contato.valor_estimado && (
                <span className="text-xs text-emerald-400">
                  💰 R$ {Number(contato.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3">
            <button onClick={() => onEditar(contato)}
              className="text-slate-400 hover:text-primary-400 transition-colors text-sm" title="Editar">✏️</button>
            <button onClick={() => onExcluir(contato.id)}
              className="text-slate-400 hover:text-red-400 transition-colors text-sm" title="Excluir">🗑️</button>
            <button onClick={onFechar}
              className="text-slate-400 hover:text-slate-200 transition-colors text-lg ml-1">✕</button>
          </div>
        </div>

        {/* Mudar status */}
        <div className="px-5 py-3 border-b flex items-center gap-2 flex-wrap flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Mover para:</span>
          {FUNIL.filter(f => f.key !== contato.status_funil).map(f => (
            <button key={f.key} onClick={() => onMudarStatus(contato.id, f.key)}
              className={`text-xs px-2 py-0.5 rounded-full border transition-opacity hover:opacity-80 ${f.cor}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Campos Customizados */}
        {(carregandoCampos || camposComNamespace.length > 0) && (
          <div className="px-5 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--color-surface-border)' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-2"
              style={{ color: 'var(--color-text-secondary)' }}>
              Campos customizados
            </h4>
            {carregandoCampos ? (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {camposComNamespace.map(v => (
                  <div key={v.id} className="min-w-0">
                    <span className="text-xs block truncate"
                      style={{ color: 'var(--color-text-secondary)' }}
                      title={v.labelExibido}>
                      {v.labelExibido}
                      {v.nomeTime && v.campo?.time_id !== contato.time_id && (
                        <span className="ml-1 px-1 py-0.5 rounded text-[10px]"
                          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
                          {v.nomeTime}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium truncate block"
                      style={{ color: 'var(--color-text-primary)' }}>
                      {v.valor_json != null
                        ? (Array.isArray(v.valor_json)
                            ? v.valor_json.join(', ')
                            : JSON.stringify(v.valor_json))
                        : (v.valor || '—')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Histórico de interações */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Histórico de interações
          </h4>
          {carregando && <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</p>}
          {!carregando && interacoes.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Nenhuma interação registrada.</p>
          )}
          {interacoes.map(inter => {
            const t = tipoInfo(inter.tipo);
            return (
              <div key={inter.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
                  {t.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.label}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(inter.criado_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{inter.conteudo}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Nova interação */}
        <form onSubmit={adicionarInteracao} className="p-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="flex gap-2 mb-2 flex-wrap">
            {TIPOS_INTERACAO.map(t => (
              <button key={t.key} type="button" onClick={() => setTipoInteracao(t.key)}
                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                  tipoInteracao === t.key
                    ? 'bg-primary-600 border-primary-500 text-white'
                    : ''
                }`}
                style={tipoInteracao !== t.key ? { borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' } : {}}>
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={novaInteracao} onChange={e => setNovaInteracao(e.target.value)}
              placeholder="Registrar interação..."
              className="flex-1 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }} />
            <button type="submit" disabled={!novaInteracao.trim() || enviando}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50">
              {enviando ? '...' : '➤'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Kanban ────────────────────────────────────────────────────
const KanbanView = ({ kanbanData, onAbrirContato }) => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {FUNIL.map(col => {
      const cards = kanbanData[col.key] || [];
      return (
        <div key={col.key} className="flex-shrink-0 w-56">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${col.cor}`}>{col.label}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{cards.length}</span>
          </div>
          <div className="space-y-2">
            {cards.map(c => (
              <button key={c.id} onClick={() => onAbrirContato(c)}
                className="w-full text-left p-3 rounded-xl border transition-all hover:border-primary-500/40"
                style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{c.nome}</p>
                  <BadgeScore score={c.score} />
                </div>
                {c.empresa && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{c.empresa}</p>}
                {c.valor_estimado && (
                  <p className="text-xs text-emerald-400 mt-1">
                    R$ {Number(c.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </button>
            ))}
            {cards.length === 0 && (
              <div className="text-center py-4 rounded-xl border border-dashed"
                style={{ borderColor: 'var(--color-surface-border)' }}>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Vazio</p>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── Card de contato (visão lista) ────────────────────────────
const CardContato = ({ contato, onAbrir, onEditar, onExcluir, excluindo }) => (
  <div
    className="flex items-center gap-4 p-4 rounded-xl border transition-all hover:border-primary-500/30 cursor-pointer"
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}
    onClick={() => onAbrir(contato)}
  >
    {/* Avatar */}
    <div className="w-10 h-10 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold text-sm flex-shrink-0">
      {contato.nome?.[0]?.toUpperCase() || '?'}
    </div>

    {/* Info principal */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{contato.nome}</p>
        <BadgeFunil status={contato.status_funil} />
        {contato.tipo_registro === 'lead' && <BadgeScore score={contato.score} />}
      </div>
      <div className="flex gap-3 mt-0.5 flex-wrap">
        {contato.empresa && (
          <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>🏢 {contato.empresa}</span>
        )}
        {contato.email && (
          <span className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>✉️ {contato.email}</span>
        )}
        {contato.telefone && (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>📞 {contato.telefone}</span>
        )}
      </div>
    </div>

    {/* Valor + ações */}
    <div className="flex items-center gap-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
      {contato.valor_estimado && (
        <span className="text-xs text-emerald-400 font-medium hidden sm:block">
          R$ {Number(contato.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )}
      <button onClick={() => onEditar(contato)}
        className="text-slate-500 hover:text-primary-400 transition-colors text-sm p-1" title="Editar">✏️</button>
      <button onClick={() => onExcluir(contato.id)} disabled={excluindo === contato.id}
        className="text-slate-500 hover:text-red-400 transition-colors text-sm p-1 disabled:opacity-50" title="Excluir">
        {excluindo === contato.id ? '⏳' : '🗑️'}
      </button>
    </div>
  </div>
);

// ─── Componente principal ──────────────────────────────────────
const PaginaCRM = () => {
  const { usuario } = useAuthStore();
  const { logout }  = useAuth();
  const { temaEscuro, alternarTema } = useTema();

  const [contatos, setContatos]               = useState([]);
  const [kanbanData, setKanbanData]           = useState({});
  const [carregando, setCarregando]           = useState(true);
  const [busca, setBusca]                     = useState('');
  const [filtroStatus, setFiltroStatus]       = useState('');
  const [aba, setAba]                         = useState('lista'); // 'lista' | 'kanban'
  const [modalAberto, setModalAberto]         = useState(false);
  const [contatoEditando, setContatoEditando] = useState(null);
  const [contatoDetalhe, setContatoDetalhe]   = useState(null);
  const [excluindo, setExcluindo]             = useState(null);

  const carregarContatos = useCallback(async () => {
    setCarregando(true);
    try {
      let queryLista = supabase.from('crm_contatos').select('*').order('criado_em', { ascending: false });
      
      // Filtros
      if (usuario?.tenant_id) queryLista = queryLista.eq('tenant_id', usuario.tenant_id);
      else if (usuario?.id) queryLista = queryLista.eq('responsavel_id', usuario.id);
      
      if (filtroStatus) queryLista = queryLista.eq('status_funil', filtroStatus);
      if (busca) queryLista = queryLista.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%,empresa.ilike.%${busca}%`);

      const { data: lista, error: erroLista } = await queryLista;
      if (erroLista) throw erroLista;

      setContatos(lista || []);

      // Kanban (carrega todos do usuario/tenant para agrupar)
      let queryKanban = supabase.from('crm_contatos').select('id, nome, empresa, email, status_funil, valor_estimado, atualizado_em').order('criado_em', { ascending: false });
      if (usuario?.tenant_id) queryKanban = queryKanban.eq('tenant_id', usuario.tenant_id);
      else if (usuario?.id) queryKanban = queryKanban.eq('responsavel_id', usuario.id);
      
      const { data: todos, error: erroKanban } = await queryKanban;
      if (!erroKanban) {
        const kanbanGrouped = {};
        FUNIL.forEach(col => {
           kanbanGrouped[col.key] = (todos || []).filter(c => c.status_funil === col.key);
        });
        setKanbanData(kanbanGrouped);
      }
    } catch (err) {
      console.error('Erro ao carregar CRM:', err);
    } finally {
      setCarregando(false);
    }
  }, [busca, filtroStatus, usuario]);

  useEffect(() => {
    const t = setTimeout(carregarContatos, 300);
    return () => clearTimeout(t);
  }, [carregarContatos]);

  const handleSalvar = async (dados) => {
    // Força inserção do tenant_id/responsavel_id caso falte na criação (ou confia no RLS se habilitado)
    if (!contatoEditando) {
      if (usuario?.tenant_id) dados.tenant_id = usuario.tenant_id;
      if (usuario?.id) dados.responsavel_id = usuario.id;
    }
    
    if (contatoEditando) {
      await supabase.from('crm_contatos').update({ ...dados, atualizado_em: new Date().toISOString() }).eq('id', contatoEditando.id);
    } else {
      await supabase.from('crm_contatos').insert(dados);
    }
    await carregarContatos();
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este contato e todo seu histórico?')) return;
    setExcluindo(id);
    try {
      await supabase.from('crm_contatos').delete().eq('id', id);
      setContatos(prev => prev.filter(c => c.id !== id));
      if (contatoDetalhe?.id === id) setContatoDetalhe(null);
      await carregarContatos();
    } catch { /* silencioso */ }
    finally { setExcluindo(null); }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await supabase.from('crm_contatos').update({ status_funil: novoStatus, atualizado_em: new Date().toISOString() }).eq('id', id);
      setContatos(prev => prev.map(c => c.id === id ? { ...c, status_funil: novoStatus } : c));
      if (contatoDetalhe?.id === id) setContatoDetalhe(prev => ({ ...prev, status_funil: novoStatus }));
      await carregarContatos();
    } catch { /* silencioso */ }
  };

  const abrirNovo   = () => { setContatoEditando(null); setModalAberto(true); };
  const abrirEdicao = (c) => { setContatoEditando(c); setModalAberto(true); setContatoDetalhe(null); };
  const abrirDetalhe = (c) => { setContatoDetalhe(c); };

  const totalContatos = contatos.length;
  const valorTotal = contatos.reduce((acc, c) => acc + (Number(c.valor_estimado) || 0), 0);

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {NOME_PRODUTO}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">CRM</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={alternarTema}
            className="text-slate-400 hover:text-white transition-colors text-lg" title="Alternar tema">
            {temaEscuro ? '☀️' : '🌙'}
          </button>
          <span className="text-sm hidden sm:block" style={{ color: 'var(--color-text-secondary)' }}>
            {usuario?.nome?.split(' ')[0] || 'Usuário'}
          </span>
          <button onClick={logout}
            className="text-slate-500 hover:text-red-400 transition-colors text-lg" title="Sair">
            🚪
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">

        {/* Título + botão novo */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              📋 CRM — Contatos & Leads
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {totalContatos} contato{totalContatos !== 1 ? 's' : ''}
              {valorTotal > 0 && (
                <span className="ml-2 text-emerald-400">
                  · R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em pipeline
                </span>
              )}
            </p>
          </div>
          <button onClick={abrirNovo}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <span>+</span> Novo contato
          </button>
        </div>

        {/* Barra de busca + filtros + abas */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Busca */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou empresa..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          {/* Filtro de status */}
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">Todos os status</option>
            {FUNIL.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>

          {/* Abas lista/kanban */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-surface-border)' }}>
            <button
              onClick={() => setAba('lista')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                aba === 'lista' ? 'bg-primary-600 text-white' : ''
              }`}
              style={aba !== 'lista' ? { backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)' } : {}}
            >
              ☰ Lista
            </button>
            <button
              onClick={() => setAba('kanban')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l ${
                aba === 'kanban' ? 'bg-primary-600 text-white' : ''
              }`}
              style={aba !== 'kanban'
                ? { backgroundColor: 'var(--color-surface-card)', color: 'var(--color-text-secondary)', borderColor: 'var(--color-surface-border)' }
                : { borderColor: 'var(--color-primary-500)' }}
            >
              ⬛ Kanban
            </button>
          </div>
        </div>

        {/* Resumo por status (chips) */}
        {aba === 'lista' && (
          <div className="flex gap-2 flex-wrap mb-4">
            {FUNIL.map(f => {
              const qtd = contatos.filter(c => c.status_funil === f.key).length;
              if (qtd === 0) return null;
              return (
                <button key={f.key}
                  onClick={() => setFiltroStatus(filtroStatus === f.key ? '' : f.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${f.cor} ${
                    filtroStatus === f.key ? 'ring-2 ring-white/30' : 'opacity-70 hover:opacity-100'
                  }`}>
                  {f.label} ({qtd})
                </button>
              );
            })}
          </div>
        )}

        {/* Estado de carregamento */}
        {carregando && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Vista: Lista */}
        {!carregando && aba === 'lista' && (
          <>
            {contatos.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed"
                style={{ borderColor: 'var(--color-surface-border)' }}>
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {busca || filtroStatus ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  {busca || filtroStatus
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Adicione seu primeiro contato para começar.'}
                </p>
                {!busca && !filtroStatus && (
                  <button onClick={abrirNovo}
                    className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Novo contato
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {contatos.map(c => (
                  <CardContato
                    key={c.id}
                    contato={c}
                    onAbrir={abrirDetalhe}
                    onEditar={abrirEdicao}
                    onExcluir={handleExcluir}
                    excluindo={excluindo}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Vista: Kanban */}
        {!carregando && aba === 'kanban' && (
          <KanbanView
            kanbanData={kanbanData}
            onAbrirContato={abrirDetalhe}
            onMudarStatus={handleMudarStatus}
          />
        )}
      </div>

      {/* Modal criar/editar contato */}
      <ModalContato
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setContatoEditando(null); }}
        onSalvar={handleSalvar}
        contatoEditando={contatoEditando}
      />

      {/* Painel de detalhes do contato */}
      {contatoDetalhe && (
        <PainelContato
          contato={contatoDetalhe}
          onFechar={() => setContatoDetalhe(null)}
          onEditar={(c) => { abrirEdicao(c); }}
          onExcluir={handleExcluir}
          onMudarStatus={handleMudarStatus}
        />
      )}
    </div>
  );
};

export default PaginaCRM;
