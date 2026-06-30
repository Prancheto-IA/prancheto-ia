// =============================================================
// PRANCHETO.IA - OUTBOUND (CRUD REAL)
// Conectado ao backend: GET/POST/PUT/DELETE /api/outbound
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../services/api.js';

const TIPOS = {
  email:    { label: 'E-mail',   emoji: '✉️' },
  ligacao:  { label: 'Ligação',  emoji: '📞' },
  whatsapp: { label: 'WhatsApp', emoji: '💬' },
  linkedin: { label: 'LinkedIn', emoji: '💼' },
  visita:   { label: 'Visita',   emoji: '🤝' },
  outro:    { label: 'Outro',    emoji: '📋' },
};

const STATUS_COR = {
  pendente:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  enviado:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  respondido:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  sem_retorno: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  convertido:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const STATUS_LABEL = {
  pendente:    'Pendente',
  enviado:     'Enviado',
  respondido:  'Respondido',
  sem_retorno: 'Sem retorno',
  convertido:  'Convertido',
};

const FORM_VAZIO = {
  contato_nome: '', contato_email: '', contato_telefone: '',
  tipo: 'email', assunto: '', conteudo: '', proxima_acao_em: '', notas: '',
};

// ─── Modal de criação/edição ───────────────────────────────────
const ModalAcao = ({ aberto, onFechar, onSalvar, acaoEditando }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (acaoEditando) {
      setForm({
        contato_nome:     acaoEditando.contato_nome     || '',
        contato_email:    acaoEditando.contato_email    || '',
        contato_telefone: acaoEditando.contato_telefone || '',
        tipo:             acaoEditando.tipo             || 'email',
        assunto:          acaoEditando.assunto          || '',
        conteudo:         acaoEditando.conteudo         || '',
        proxima_acao_em:  acaoEditando.proxima_acao_em
          ? acaoEditando.proxima_acao_em.slice(0, 16)
          : '',
        notas:            acaoEditando.notas            || '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [acaoEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contato_nome.trim()) { setErro('Nome do contato é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        contato_nome:     form.contato_nome.trim(),
        contato_email:    form.contato_email.trim()    || null,
        contato_telefone: form.contato_telefone.trim() || null,
        tipo:             form.tipo,
        assunto:          form.assunto.trim()          || null,
        conteudo:         form.conteudo.trim()         || null,
        proxima_acao_em:  form.proxima_acao_em         || null,
        notas:            form.notas.trim()            || null,
      });
      onFechar();
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao salvar ação.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-lg my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {acaoEditando ? 'Editar Ação' : 'Nova Ação de Outbound'}
          </h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Nome do contato *</label>
              <input
                type="text"
                value={form.contato_nome}
                onChange={set('contato_nome')}
                placeholder="João Silva"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={set('tipo')}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
              >
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={form.contato_email}
                onChange={set('contato_email')}
                placeholder="joao@empresa.com"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Telefone</label>
              <input
                type="text"
                value={form.contato_telefone}
                onChange={set('contato_telefone')}
                placeholder="(11) 99999-9999"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Assunto</label>
              <input
                type="text"
                value={form.assunto}
                onChange={set('assunto')}
                placeholder="Ex: Proposta comercial Q3"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Próxima ação em</label>
              <input
                type="datetime-local"
                value={form.proxima_acao_em}
                onChange={set('proxima_acao_em')}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Conteúdo / Mensagem</label>
            <textarea
              value={form.conteudo}
              onChange={set('conteudo')}
              placeholder="Texto da mensagem ou abordagem..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Notas internas</label>
            <textarea
              value={form.notas}
              onChange={set('notas')}
              placeholder="Observações sobre o contato..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Card de ação ──────────────────────────────────────────────
const CardAcao = ({ acao, onEditar, onExcluir, onMudarStatus, excluindo }) => {
  const tipo   = TIPOS[acao.tipo]   || TIPOS.outro;
  const corSt  = STATUS_COR[acao.status]   || STATUS_COR.pendente;
  const labelSt = STATUS_LABEL[acao.status] || acao.status;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-primary-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary-500/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {tipo.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{acao.contato_nome}</p>
            {acao.contato_telefone && <p className="text-slate-400 text-xs truncate">📞 {acao.contato_telefone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${corSt}`}>{labelSt}</span>
          <button
            onClick={() => onEditar(acao)}
            className="text-slate-500 hover:text-primary-400 transition-colors text-sm"
            title="Editar"
          >✏️</button>
          <button
            onClick={() => onExcluir(acao.id)}
            disabled={excluindo === acao.id}
            className="text-slate-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
            title="Excluir"
          >🗑️</button>
        </div>
      </div>

      {acao.assunto && (
        <p className="text-slate-300 text-xs mt-2 font-medium">{acao.assunto}</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-slate-500 text-xs">{tipo.label}</span>
        {acao.contato_email && (
          <span className="text-slate-500 text-xs truncate">✉️ {acao.contato_email}</span>
        )}
        {acao.proxima_acao_em && (
          <span className="text-slate-500 text-xs">
            📅 {new Date(acao.proxima_acao_em).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Mudar status */}
      <div className="mt-3 pt-3 border-t border-surface-border/50">
        <select
          value={acao.status}
          onChange={(e) => onMudarStatus(acao.id, e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-primary-500/50"
        >
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ─── Componente principal ──────────────────────────────────────
const Outbound = () => {
  const [acoes, setAcoes]               = useState([]);
  const [carregando, setCarregando]     = useState(true);
  const [modalAberto, setModalAberto]   = useState(false);
  const [acaoEditando, setAcaoEditando] = useState(null);
  const [excluindo, setExcluindo]       = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');

  const carregarAcoes = useCallback(async () => {
    setCarregando(true);
    try {
      const params = filtroStatus ? { status: filtroStatus } : {};
      const { data } = await api.get('/outbound', { params });
      setAcoes(data.dados || []);
    } catch (err) {
      console.error('Erro ao carregar outbound:', err);
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus]);

  useEffect(() => { carregarAcoes(); }, [carregarAcoes]);

  const handleSalvar = async (dadosAcao) => {
    if (acaoEditando) {
      await api.put(`/outbound/${acaoEditando.id}`, dadosAcao);
    } else {
      await api.post('/outbound', dadosAcao);
    }
    await carregarAcoes();
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta ação?')) return;
    setExcluindo(id);
    try {
      await api.delete(`/outbound/${id}`);
      setAcoes((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      setExcluindo(null);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      await api.put(`/outbound/${id}`, { status: novoStatus });
      setAcoes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a))
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const abrirNova = () => { setAcaoEditando(null); setModalAberto(true); };
  const abrirEdicao = (acao) => { setAcaoEditando(acao); setModalAberto(true); };

  // Contadores por status
  const contadores = Object.keys(STATUS_LABEL).reduce((acc, k) => {
    acc[k] = acoes.filter((a) => a.status === k).length;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📧 Outbound</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie suas ações de prospecção e follow-up.
          </p>
        </div>
        <button
          onClick={abrirNova}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Nova ação
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFiltroStatus(filtroStatus === k ? '' : k)}
            className={`bg-surface-card border rounded-xl p-3 text-center transition-all ${
              filtroStatus === k
                ? 'border-primary-500/50 bg-primary-500/10'
                : 'border-surface-border hover:border-primary-500/30'
            }`}
          >
            <p className="text-white text-lg font-bold">{contadores[k] || 0}</p>
            <p className="text-slate-400 text-xs mt-0.5">{v}</p>
          </button>
        ))}
      </div>

      {/* Lista de ações */}
      {carregando ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      ) : acoes.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-surface-border rounded-xl">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-white font-medium mb-1">Nenhuma ação encontrada</p>
          <p className="text-slate-400 text-sm mb-5">
            {filtroStatus
              ? `Nenhuma ação com status "${STATUS_LABEL[filtroStatus]}".`
              : 'Comece criando sua primeira ação de outbound.'}
          </p>
          {filtroStatus ? (
            <button
              onClick={() => setFiltroStatus('')}
              className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
            >
              Limpar filtro
            </button>
          ) : (
            <button
              onClick={abrirNova}
              className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Nova ação
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {acoes.map((acao) => (
            <CardAcao
              key={acao.id}
              acao={acao}
              onEditar={abrirEdicao}
              onExcluir={handleExcluir}
              onMudarStatus={handleMudarStatus}
              excluindo={excluindo}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ModalAcao
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setAcaoEditando(null); }}
        onSalvar={handleSalvar}
        acaoEditando={acaoEditando}
      />
    </div>
  );
};

export default Outbound;
