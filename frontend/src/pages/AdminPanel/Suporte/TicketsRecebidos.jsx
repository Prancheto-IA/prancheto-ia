// =============================================================
// PRANCHETO.IA - PAINEL ADMIN / Tickets Recebidos
// Visão da equipe Prancheto.IA sobre os tickets de suporte abertos
// por qualquer tenant. Espelha Suporte/MeusTickets.jsx, mas sem o
// escopo de tenant/usuário (depende das policies *_super_admin_*).
// =============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  useSuporteAdmin,
  STATUS_TICKET,
  PRIORIDADE_TICKET,
  CATEGORIA_TICKET,
} from '../../../hooks/useSuporte.js';
import { useUIStore } from '../../../store/uiStore.js';

const formatarData = (valor) =>
  valor ? new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const formatarDataHora = (valor) =>
  valor ? new Date(valor).toLocaleString('pt-BR') : '';

// ─── Badge de status (cores do domínio) ────────────────────────
const BadgeStatus = ({ status }) => {
  const s = STATUS_TICKET[status] || STATUS_TICKET.aberto;
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.cor + '22', color: s.cor }}
    >
      {s.label}
    </span>
  );
};

// ─── Card de ticket ────────────────────────────────────────────
const CardTicket = ({ ticket, onClick }) => {
  const categoria = CATEGORIA_TICKET[ticket.categoria] || CATEGORIA_TICKET.outro;
  const prioridade = PRIORIDADE_TICKET[ticket.prioridade] || PRIORIDADE_TICKET.media;

  return (
    <div
      onClick={onClick}
      className="bg-surface-card border border-surface-border rounded-xl p-4 cursor-pointer hover:border-primary-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-primary-500/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {categoria.emoji}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{ticket.assunto}</p>
            <p className="text-muted text-xs truncate">
              🏢 {ticket.tenant?.nome || 'Tenant desconhecido'}
            </p>
          </div>
        </div>
        <BadgeStatus status={ticket.status} />
      </div>

      {ticket.descricao && (
        <p className="text-muted text-xs mt-3 line-clamp-2">{ticket.descricao}</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-xs" style={{ color: prioridade.cor }}>● {prioridade.label}</span>
        <span className="text-muted text-xs">📅 {formatarData(ticket.criado_em)}</span>
        {ticket.criador?.nome && (
          <span className="text-muted text-xs">👤 {ticket.criador.nome}</span>
        )}
      </div>
    </div>
  );
};

// ─── Modal de detalhe do ticket (info + thread + resposta da equipe) ──
const ModalTicket = ({ ticket, onFechar, onEnviarMensagem, onMudarStatus, carregarMensagens }) => {
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMsgs, setCarregandoMsgs] = useState(true);
  const [texto, setTexto] = useState('');
  const [notaInterna, setNotaInterna] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const categoria = CATEGORIA_TICKET[ticket.categoria] || CATEGORIA_TICKET.outro;
  const prioridade = PRIORIDADE_TICKET[ticket.prioridade] || PRIORIDADE_TICKET.media;
  const encerrado = ['resolvido', 'fechado'].includes(ticket.status);

  const carregar = async () => {
    setCarregandoMsgs(true);
    try {
      setMensagens(await carregarMensagens(ticket.id));
    } finally {
      setCarregandoMsgs(false);
    }
  };

  useEffect(() => { carregar(); }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await onEnviarMensagem(ticket.id, texto.trim(), notaInterna);
      setTexto('');
      setNotaInterna(false);
      await carregar();
    } catch {
      // Erro já notificado pela página; mantém o texto para nova tentativa.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onFechar}>
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-lg my-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-surface-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{categoria.emoji}</span>
              <BadgeStatus status={ticket.status} />
            </div>
            <h3 className="font-semibold truncate">{ticket.assunto}</h3>
            <p className="text-muted text-xs mt-0.5">🏢 {ticket.tenant?.nome || 'Tenant desconhecido'}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs" style={{ color: prioridade.cor }}>● {prioridade.label}</span>
              <span className="text-muted text-xs">📅 {formatarData(ticket.criado_em)}</span>
              {ticket.criador?.email && (
                <span className="text-muted text-xs">✉️ {ticket.criador.email}</span>
              )}
            </div>
          </div>
          <button onClick={onFechar} className="text-muted hover:text-white text-lg flex-shrink-0">✕</button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {ticket.descricao && (
            <p className="text-muted text-sm whitespace-pre-wrap">{ticket.descricao}</p>
          )}

          <div className="border-t border-surface-border/50 pt-4">
            <p className="text-muted text-xs font-medium uppercase tracking-wider mb-3">Mensagens</p>
            {carregandoMsgs ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mensagens.length === 0 ? (
              <p className="text-muted text-sm">Nenhuma mensagem ainda.</p>
            ) : (
              <div className="space-y-3">
                {mensagens.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg p-3 border"
                    style={m.interno
                      ? { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }
                      : { backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)' }}
                  >
                    {m.interno && (
                      <p className="text-amber-400 text-xs font-medium mb-1">🔒 Nota interna (não visível ao cliente)</p>
                    )}
                    <p className="text-muted text-sm whitespace-pre-wrap">{m.conteudo}</p>
                    <p className="text-muted text-xs mt-1">
                      {m.autor?.nome ? `${m.autor.nome} · ` : ''}{formatarDataHora(m.criado_em)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé: resposta + ações */}
        <div className="p-5 border-t border-surface-border space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_TICKET).map(([slug, info]) => (
              <button
                key={slug}
                onClick={() => onMudarStatus(ticket.id, slug)}
                disabled={ticket.status === slug}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-default ${
                  ticket.status === slug ? '' : 'hover:bg-white/5'
                }`}
                style={{ borderColor: 'var(--color-surface-border)', color: info.cor }}
              >
                {info.label}
              </button>
            ))}
          </div>

          {!encerrado && (
            <form onSubmit={handleEnviar} className="space-y-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={notaInterna ? 'Nota interna para o time...' : 'Escreva uma resposta ao cliente...'}
                rows={2}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notaInterna}
                    onChange={(e) => setNotaInterna(e.target.checked)}
                  />
                  Nota interna (equipe, não visível ao cliente)
                </label>
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  className="bg-primary-600 hover:bg-primary-500 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ──────────────────────────────────────────
const TicketsRecebidos = () => {
  const { adicionarNotificacao } = useUIStore();
  const {
    tickets,
    carregando,
    atualizarTicket,
    carregarMensagens,
    adicionarMensagem,
  } = useSuporteAdmin();

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [ticketAberto, setTicketAberto] = useState(null);

  const ticketsFiltrados = useMemo(() => {
    let lista = filtroStatus === 'todos' ? tickets : tickets.filter((t) => t.status === filtroStatus);
    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter((t) =>
        t.assunto?.toLowerCase().includes(termo) ||
        t.tenant?.nome?.toLowerCase().includes(termo) ||
        t.criador?.nome?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [tickets, filtroStatus, busca]);

  const handleEnviarMensagem = async (ticketId, conteudo, interno) => {
    try {
      await adicionarMensagem(ticketId, { conteudo, interno });
    } catch (err) {
      console.error('TicketsRecebidos.handleEnviarMensagem:', err);
      adicionarNotificacao('error', 'Não foi possível enviar a mensagem.');
      throw err;
    }
  };

  const handleMudarStatus = async (ticketId, novoStatus) => {
    try {
      await atualizarTicket(ticketId, {
        status: novoStatus,
        resolvido_em: novoStatus === 'resolvido' ? new Date().toISOString() : null,
      });
      setTicketAberto((t) => (t && t.id === ticketId ? { ...t, status: novoStatus } : t));
      adicionarNotificacao('success', 'Status do ticket atualizado.');
    } catch (err) {
      console.error('TicketsRecebidos.handleMudarStatus:', err);
      adicionarNotificacao('error', 'Não foi possível atualizar o ticket.');
    }
  };

  const filtros = [{ slug: 'todos', label: 'Todos' },
    ...Object.entries(STATUS_TICKET).map(([k, v]) => ({ slug: k, label: v.label }))];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Tickets Recebidos</h2>
          <p className="text-muted text-sm mt-1">
            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} de todos os clientes
          </p>
        </div>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por assunto, cliente ou tenant..."
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm w-full sm:w-72 focus:outline-none focus:border-primary-500/50"
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filtros.map((f) => (
          <button
            key={f.slug}
            onClick={() => setFiltroStatus(f.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroStatus === f.slug
                ? 'bg-primary-600 text-white'
                : 'bg-surface-card border border-surface-border text-muted hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted text-sm">Carregando...</p>
        </div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-surface-border rounded-xl">
          <p className="text-5xl mb-4">📨</p>
          <p className="text-white font-medium mb-1">Nenhum ticket encontrado</p>
          <p className="text-muted text-sm">
            {busca.trim() || filtroStatus !== 'todos'
              ? 'Nenhum ticket corresponde a esse filtro.'
              : 'Nenhum cliente abriu um ticket de suporte ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ticketsFiltrados.map((t) => (
            <CardTicket key={t.id} ticket={t} onClick={() => setTicketAberto(t)} />
          ))}
        </div>
      )}

      {/* Modal de detalhe */}
      {ticketAberto && (
        <ModalTicket
          ticket={ticketAberto}
          onFechar={() => setTicketAberto(null)}
          onEnviarMensagem={handleEnviarMensagem}
          onMudarStatus={handleMudarStatus}
          carregarMensagens={carregarMensagens}
        />
      )}
    </div>
  );
};

export default TicketsRecebidos;
