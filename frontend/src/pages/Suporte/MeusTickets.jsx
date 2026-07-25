// =============================================================
// PRANCHETO.IA - SUPORTE / Meus Tickets
// Lista os tickets abertos pelo usuário, com detalhe e thread.
// =============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useSuporte,
  STATUS_TICKET,
  PRIORIDADE_TICKET,
  CATEGORIA_TICKET,
} from '../../hooks/useSuporte.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';

const formatarData = (valor) =>
  valor ? new Date(valor).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

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
            <p className="text-slate-500 text-xs">{categoria.label}</p>
          </div>
        </div>
        <BadgeStatus status={ticket.status} />
      </div>

      {ticket.descricao && (
        <p className="text-slate-400 text-xs mt-3 line-clamp-2">{ticket.descricao}</p>
      )}

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span className="text-xs" style={{ color: prioridade.cor }}>● {prioridade.label}</span>
        <span className="text-slate-500 text-xs">📅 {formatarData(ticket.criado_em)}</span>
      </div>
    </div>
  );
};

// ─── Modal de detalhe do ticket (info + thread) ────────────────
const ModalTicket = ({ ticket, onFechar, onEnviarMensagem, onMudarStatus, carregarMensagens }) => {
  const [mensagens, setMensagens] = useState([]);
  const [carregandoMsgs, setCarregandoMsgs] = useState(true);
  const [texto, setTexto] = useState('');
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

  // Carrega a thread ao abrir
  useEffect(() => { carregar(); }, [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await onEnviarMensagem(ticket.id, texto.trim());
      setTexto('');
      await carregar();
    } catch {
      // Erro já notificado pela página; mantém o texto para nova tentativa.
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-lg my-4 flex flex-col max-h-[85vh]">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-surface-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{categoria.emoji}</span>
              <BadgeStatus status={ticket.status} />
            </div>
            <h3 className="text-white font-semibold truncate">{ticket.assunto}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs" style={{ color: prioridade.cor }}>● {prioridade.label}</span>
              <span className="text-slate-500 text-xs">📅 {formatarData(ticket.criado_em)}</span>
            </div>
          </div>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg flex-shrink-0">✕</button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {ticket.descricao && (
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{ticket.descricao}</p>
          )}

          <div className="border-t border-surface-border/50 pt-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Mensagens</p>
            {carregandoMsgs ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : mensagens.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma mensagem ainda.</p>
            ) : (
              <div className="space-y-3">
                {mensagens.map((m) => (
                  <div key={m.id} className="bg-surface border border-surface-border rounded-lg p-3">
                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{m.conteudo}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(m.criado_em).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé: resposta + ações */}
        <div className="p-5 border-t border-surface-border space-y-3">
          {!encerrado ? (
            <form onSubmit={handleEnviar} className="space-y-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva uma resposta..."
                rows={2}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onMudarStatus(ticket.id, 'resolvido')}
                  className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                >
                  Marcar como resolvido
                </button>
                <button
                  type="submit"
                  disabled={enviando || !texto.trim()}
                  className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => onMudarStatus(ticket.id, 'aberto')}
              className="w-full bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Reabrir ticket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Página principal ──────────────────────────────────────────
const MeusTickets = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const { adicionarNotificacao } = useUIStore();
  const {
    tickets,
    carregando,
    atualizarTicket,
    carregarMensagens,
    adicionarMensagem,
  } = useSuporte();

  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ticketAberto, setTicketAberto] = useState(null);

  // "Meus" tickets = abertos pelo próprio usuário
  const meusTickets = useMemo(
    () => tickets.filter((t) => t.criado_por === usuario?.id),
    [tickets, usuario?.id]
  );

  const ticketsFiltrados = filtroStatus === 'todos'
    ? meusTickets
    : meusTickets.filter((t) => t.status === filtroStatus);

  const handleEnviarMensagem = async (ticketId, conteudo) => {
    try {
      await adicionarMensagem(ticketId, { conteudo });
    } catch (err) {
      console.error('MeusTickets.handleEnviarMensagem:', err);
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
      adicionarNotificacao('success', novoStatus === 'resolvido' ? 'Ticket resolvido.' : 'Ticket reaberto.');
    } catch (err) {
      console.error('MeusTickets.handleMudarStatus:', err);
      adicionarNotificacao('error', 'Não foi possível atualizar o ticket.');
    }
  };

  const filtros = [{ slug: 'todos', label: 'Todos' },
    ...Object.entries(STATUS_TICKET).map(([k, v]) => ({ slug: k, label: v.label }))];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Meus Tickets</h2>
          <p className="text-slate-400 text-sm mt-1">
            {meusTickets.length} ticket{meusTickets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/suporte/novo')}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Novo ticket
        </button>
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
                : 'bg-surface-card border border-surface-border text-slate-400 hover:text-white'
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
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      ) : ticketsFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-surface-border rounded-xl">
          <p className="text-5xl mb-4">📨</p>
          <p className="text-white font-medium mb-1">Nenhum ticket encontrado</p>
          <p className="text-slate-400 text-sm mb-5">
            {filtroStatus !== 'todos'
              ? `Você não tem tickets com status "${STATUS_TICKET[filtroStatus]?.label}".`
              : 'Você ainda não abriu nenhum ticket de suporte.'}
          </p>
          {filtroStatus !== 'todos' ? (
            <button
              onClick={() => setFiltroStatus('todos')}
              className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
            >
              Limpar filtro
            </button>
          ) : (
            <button
              onClick={() => navigate('/suporte/novo')}
              className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Abrir primeiro ticket
            </button>
          )}
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

export default MeusTickets;
