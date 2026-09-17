// =============================================================
// PRANCHETO.IA - OUTBOUND (CRUD REAL)
// Conectado ao backend: GET/POST/PUT/DELETE /api/outbound
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useRotulosOutbound, STATUS_ORDEM } from '../../../hooks/useRotulosOutbound.js';

const TIPOS = {
  email:    { label: 'E-mail',   emoji: '✉️' },
  ligacao:  { label: 'Ligação',  emoji: '📞' },
  whatsapp: { label: 'WhatsApp', emoji: '💬' },
  linkedin: { label: 'LinkedIn', emoji: '💼' },
  visita:   { label: 'Visita',   emoji: '🤝' },
  outro:    { label: 'Outro',    emoji: '📋' },
};

// Cor é fixa por status técnico — só o rótulo exibido é personalizável
// (ver useRotulosOutbound).
const STATUS_COR = {
  pendente:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  enviado:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  respondido:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  sem_retorno: 'badge-neutro',
  convertido:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
};

const FORM_VAZIO = {
  contato_id: '', contato_nome: '', contato_email: '', contato_telefone: '',
  tipo: 'email', assunto: '', conteudo: '', proxima_acao_em: '', notas: '',
};

// ─── Modal de criação/edição ───────────────────────────────────
const ModalAcao = ({ aberto, onFechar, onSalvar, acaoEditando, contatosCRM }) => {
  const [form, setForm] = useState(FORM_VAZIO);
  const [buscaContato, setBuscaContato] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (acaoEditando) {
      setForm({
        contato_id:       acaoEditando.contato_id       || '',
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
    setBuscaContato('');
    setErro('');
  }, [acaoEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  // Vincular a um contato do CRM copia nome/e-mail/telefone pra cá (ainda
  // editáveis) e guarda o contato_id, que é o que o trigger de
  // sincronização de funil usa pra saber o que atualizar no CRM.
  const handleSelecionarContato = (e) => {
    const id = e.target.value;
    const contato = contatosCRM.find((c) => c.id === id);
    setForm((f) => ({
      ...f,
      contato_id: id,
      contato_nome: contato ? contato.nome : f.contato_nome,
      contato_email: contato ? (contato.email || '') : f.contato_email,
      contato_telefone: contato ? (contato.telefone || '') : f.contato_telefone,
    }));
  };

  const contatosFiltrados = buscaContato
    ? contatosCRM.filter((c) =>
        c.nome.toLowerCase().includes(buscaContato.toLowerCase()) ||
        (c.empresa || '').toLowerCase().includes(buscaContato.toLowerCase()))
    : contatosCRM;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contato_nome.trim()) { setErro('Nome do contato é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        contato_id:       form.contato_id || null,
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
          <h3 className="font-semibold">
            {acaoEditando ? 'Editar Ação' : 'Nova Ação de Outbound'}
          </h3>
          <button onClick={onFechar} className="text-muted hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted text-xs font-medium mb-1">Vincular a um contato do CRM (opcional)</label>
            <input
              type="text"
              value={buscaContato}
              onChange={(e) => setBuscaContato(e.target.value)}
              placeholder="Buscar por nome ou empresa..."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 mb-2"
            />
            <select
              value={form.contato_id}
              onChange={handleSelecionarContato}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500/50"
            >
              <option value="">Sem vínculo (prospecção sem contato no CRM)</option>
              {contatosFiltrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tipo_registro === 'cliente' ? '✅' : '🎯'} {c.nome}{c.empresa ? ` — ${c.empresa}` : ''}
                </option>
              ))}
            </select>
            <p className="text-muted text-xs mt-1">
              Vincular permite que o funil do contato no CRM avance automaticamente conforme o status desta ação muda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-xs font-medium mb-1">Nome do contato *</label>
              <input
                type="text"
                value={form.contato_nome}
                onChange={set('contato_nome')}
                placeholder="João Silva"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-muted text-xs font-medium mb-1">Tipo *</label>
              <select
                value={form.tipo}
                onChange={set('tipo')}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500/50"
              >
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-xs font-medium mb-1">E-mail</label>
              <input
                type="email"
                value={form.contato_email}
                onChange={set('contato_email')}
                placeholder="joao@empresa.com"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-muted text-xs font-medium mb-1">Telefone</label>
              <input
                type="text"
                value={form.contato_telefone}
                onChange={set('contato_telefone')}
                placeholder="(11) 99999-9999"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted text-xs font-medium mb-1">Assunto</label>
              <input
                type="text"
                value={form.assunto}
                onChange={set('assunto')}
                placeholder="Ex: Proposta comercial Q3"
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div>
              <label className="block text-muted text-xs font-medium mb-1">Próxima ação em</label>
              <input
                type="datetime-local"
                value={form.proxima_acao_em}
                onChange={set('proxima_acao_em')}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted text-xs font-medium mb-1">Conteúdo / Mensagem</label>
            <textarea
              value={form.conteudo}
              onChange={set('conteudo')}
              placeholder="Texto da mensagem ou abordagem..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-muted text-xs font-medium mb-1">Notas internas</label>
            <textarea
              value={form.notas}
              onChange={set('notas')}
              placeholder="Observações sobre o contato..."
              rows={2}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
            />
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-muted py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
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
const CardAcao = ({ acao, rotulos, onEditar, onExcluir, onMudarStatus, excluindo }) => {
  const tipo   = TIPOS[acao.tipo]   || TIPOS.outro;
  const corSt  = STATUS_COR[acao.status]   || STATUS_COR.pendente;
  const labelSt = rotulos[acao.status] || acao.status;

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4 hover:border-primary-500/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary-500/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {tipo.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">
              {acao.contato_nome}
              {acao.contato_id && <span title="Vinculado a um contato do CRM"> 🔗</span>}
            </p>
            {acao.contato_telefone && <p className="text-muted text-xs truncate">📞 {acao.contato_telefone}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${corSt}`}>{labelSt}</span>
          <button
            onClick={() => onEditar(acao)}
            className="text-muted hover:text-primary-400 transition-colors text-sm"
            title="Editar"
          >✏️</button>
          <button
            onClick={() => onExcluir(acao.id)}
            disabled={excluindo === acao.id}
            className="text-muted hover:text-red-400 transition-colors text-sm disabled:opacity-50"
            title="Excluir"
          >🗑️</button>
        </div>
      </div>

      {acao.assunto && (
        <p className="text-muted text-xs mt-2 font-medium">{acao.assunto}</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-muted text-xs">{tipo.label}</span>
        {acao.contato_email && (
          <span className="text-muted text-xs truncate">✉️ {acao.contato_email}</span>
        )}
        {acao.proxima_acao_em && (
          <span className="text-muted text-xs">
            📅 {new Date(acao.proxima_acao_em).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Mudar status */}
      <div className="mt-3 pt-3 border-t border-surface-border/50">
        <select
          value={acao.status}
          onChange={(e) => onMudarStatus(acao.id, e.target.value)}
          className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-muted text-xs focus:outline-none focus:border-primary-500/50"
        >
          {STATUS_ORDEM.map((k) => (
            <option key={k} value={k}>{rotulos[k]}</option>
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
  const [contatosCRM, setContatosCRM]   = useState([]);
  const [contadores, setContadores]     = useState({});
  const { usuario }                     = useAuthStore();
  const { rotulos }                     = useRotulosOutbound(usuario?.id);

  // Contadores agregados no banco (RPC outbound_contadores) — independentes
  // do filtro ativo, pra não zerar as outras abas ao trocar de status.
  const carregarContadores = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('outbound_contadores');
      if (error) throw error;
      const mapa = STATUS_ORDEM.reduce((acc, k) => ({ ...acc, [k]: 0 }), {});
      (data || []).forEach((linha) => { mapa[linha.status] = Number(linha.total); });
      setContadores(mapa);
    } catch (err) {
      console.error('Erro ao carregar contadores:', err);
    }
  }, []);

  useEffect(() => { carregarContadores(); }, [carregarContadores]);

  // Contatos do CRM (leads e clientes) pra vincular uma ação de outbound.
  useEffect(() => {
    if (!usuario?.tenant_id) return;
    supabase
      .from('crm_contatos')
      .select('id, nome, empresa, email, telefone, tipo_registro')
      .order('nome')
      .then(({ data, error }) => {
        if (error) { console.error('Erro ao carregar contatos do CRM:', error); return; }
        setContatosCRM(data || []);
      });
  }, [usuario?.tenant_id]);

  const carregarAcoes = useCallback(async () => {
    if (!usuario?.id) return;
    setCarregando(true);
    try {
      let query = supabase
        .from('outbound_acoes')
        .select('*')
        .order('criado_em', { ascending: false });
        
      if (filtroStatus) {
        query = query.eq('status', filtroStatus);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      setAcoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar outbound:', err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id, filtroStatus]);

  useEffect(() => { carregarAcoes(); }, [carregarAcoes]);

  const handleSalvar = async (dadosAcao) => {
    if (acaoEditando) {
      const { error } = await supabase
        .from('outbound_acoes')
        .update(dadosAcao)
        .eq('id', acaoEditando.id);
      if (error) throw error;
    } else {
      const payload = {
        ...dadosAcao,
        user_id: usuario.id,
        tenant_id: usuario.tenant_id
      };
      const { error } = await supabase
        .from('outbound_acoes')
        .insert(payload);
      if (error) throw error;
    }
    await Promise.all([carregarAcoes(), carregarContadores()]);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta ação?')) return;
    setExcluindo(id);
    try {
      const { error } = await supabase.from('outbound_acoes').delete().eq('id', id);
      if (error) throw error;
      setAcoes((prev) => prev.filter((a) => a.id !== id));
      await carregarContadores();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    } finally {
      setExcluindo(null);
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    try {
      const { error } = await supabase
        .from('outbound_acoes')
        .update({ status: novoStatus })
        .eq('id', id);
      if (error) throw error;

      setAcoes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: novoStatus } : a))
      );
      await carregarContadores();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const abrirNova = () => { setAcaoEditando(null); setModalAberto(true); };
  const abrirEdicao = (acao) => { setAcaoEditando(acao); setModalAberto(true); };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">📧 Outbound</h1>
          <p className="text-muted text-sm mt-1">
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
        {STATUS_ORDEM.map((k) => (
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
            <p className="text-muted text-xs mt-0.5">{rotulos[k]}</p>
          </button>
        ))}
      </div>

      {/* Lista de ações */}
      {carregando ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Carregando...</p>
        </div>
      ) : acoes.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-surface-border rounded-xl">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-white font-medium mb-1">Nenhuma ação encontrada</p>
          <p className="text-muted text-sm mb-5">
            {filtroStatus
              ? `Nenhuma ação com status "${rotulos[filtroStatus]}".`
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
              rotulos={rotulos}
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
        contatosCRM={contatosCRM}
      />
    </div>
  );
};

export default Outbound;
