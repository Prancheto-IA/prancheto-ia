// =============================================================
// PRANCHETO.IA - PAINEL DO WIDGET DE CHAT IA (EMITLY DESIGN SYSTEM)
// Versão modal compacta do assistente com design system Emitly.
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../hooks/useAssistente.js';
import { useVoz } from '../../hooks/useVoz.js';
import {
  Bolha,
  LinhaAtividade,
  CartaoAcao,
  FaixaIndisponivel,
  SUGESTOES,
  DicaVoz,
  EntradaVozWaveform,
} from '../../pages/DashboardCliente/Chat/ChatMensagens.jsx';
import pranchetinho from '../../assets/mascote/pranchetinho-chat.png';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Cancel01Icon,
  SentIcon,
  ArrowUpRight01Icon,
  SparklesIcon,
  Mic01Icon,
  MicOff01Icon,
} from '@hugeicons/core-free-icons';

const PainelChatFlutuante = ({ onFechar, style }) => {
  const navigate = useNavigate();
  const {
    conversaAtual,
    mensagens,
    acoesPendentes,
    carregando,
    enviando,
    resolvendoAcao,
    erro,
    carregarConversas,
    novaConversa,
    enviar,
    responderAcao,
  } = useAssistente();

  const [texto, setTexto] = useState('');
  const fimRef = useRef(null);

  const {
    ouvindo,
    falando,
    volume,
    suportado: vozSuportada,
    erro: erroVoz,
    alternarEscuta,
    pararEscuta,
    abortarEscuta,
  } = useVoz({
    onResultado: (transcricao) => setTexto(transcricao),
  });

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, acoesPendentes]);

  const submeter = (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    pararEscuta();
    enviar(texto);
    setTexto('');
  };

  const cancelarVoz = () => {
    abortarEscuta();
    setTexto('');
  };

  const enviarVoz = () => {
    if (!texto.trim() || enviando) return;
    pararEscuta();
    const msg = texto;
    setTexto('');
    enviar(msg);
  };

  const abrirChatCompleto = () => {
    onFechar();
    navigate('/dashboard/agente');
  };

  const indisponivel = erro && CODIGOS_INDISPONIVEL.includes(erro.codigo);
  const vazio = mensagens.length === 0 && !enviando && !carregando;

  return (
    <div
      className="fixed z-[60] w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[78vh] flex flex-col rounded-3xl border border-surface-border bg-surface-card shadow-2xl overflow-hidden animate-scale-in"
      style={style}
    >
      {/* 1. Header do Assistente */}
      <div className="h-16 px-4 bg-surface-card border-b border-surface-border flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/30 dark:bg-brand-primary/10 p-1 flex items-center justify-center shrink-0 border border-brand-accent/50 dark:border-brand-primary/20">
            <img
              src={pranchetinho}
              alt="Pranchetinho"
              className="w-full h-full object-contain"
            />
          </div>
          {/* Indicador de status online */}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-surface-card" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-ink-primary truncate">
              {conversaAtual?.titulo || 'Assistente IA'}
            </h3>
            <span className="bg-brand-accent text-brand-secondary text-[10px] font-bold px-1.5 py-0.5 rounded border border-brand-accent/40">
              Beta
            </span>
          </div>
          <p className="text-[11px] text-ink-secondary truncate">
            Pranchetinho • CRM Inteligente
          </p>
        </div>

        {/* Ações do cabeçalho */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={novaConversa}
            title="Nova conversa"
            className="p-1.5 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={abrirChatCompleto}
            title="Abrir em tela cheia"
            className="p-1.5 rounded-xl text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={onFechar}
            title="Fechar assistente"
            className="p-1.5 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Alerta de erro de conexão / indisponibilidade */}
      {indisponivel && <FaixaIndisponivel erro={erro} />}

      {/* 2. Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-subtle/40 dark:bg-surface">
        {carregando && mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <div className="w-7 h-7 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-ink-secondary">Carregando histórico...</p>
          </div>
        )}

        {/* Estado Vazio (Boas-vindas) */}
        {vazio && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div className="w-16 h-16 rounded-3xl bg-brand-accent/30 dark:bg-brand-primary/10 p-2 flex items-center justify-center mb-3 shadow-xs border border-brand-accent/50 dark:border-brand-primary/20">
              <img
                src={pranchetinho}
                alt="Pranchetinho"
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="text-sm font-bold text-ink-primary mb-1">
              Olá! Como posso te ajudar hoje?
            </h4>
            <p className="text-sm text-ink-secondary max-w-xs mb-5 leading-relaxed">
              Consulte seu funil de vendas, adicione novos leads ou registre tarefas usando linguagem natural.
            </p>

            <div className="w-full space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted text-left px-1">
                Sugestões rápidas:
              </p>
              {SUGESTOES.slice(0, 3).map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviar(sugestao)}
                  className="w-full text-left bg-surface-card hover:bg-surface-subtle hover:border-brand-primary/40 text-sm font-semibold text-ink-primary px-3.5 py-2.5 rounded-2xl border border-surface-border shadow-2xs transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} className="text-brand-secondary shrink-0" />
                  <span className="truncate flex-1">{sugestao}</span>
                </button>
              ))}
              <DicaVoz />
            </div>
          </div>
        )}

        {/* Mensagens */}
        {mensagens.map((msg) => {
          if (msg.remetente === 'tool') {
            let falhou = false;
            try {
              falhou = !!JSON.parse(msg.conteudo)?.recusada;
            } catch {
              /* conteudo cru */
            }
            return (
              <LinhaAtividade
                key={msg.id}
                ferramenta={msg.metadata?.ferramenta}
                falhou={falhou}
              />
            );
          }
          if (msg.remetente === 'assistant' && !msg.conteudo?.trim()) return null;
          return <Bolha key={msg.id} mensagem={msg} />;
        })}

        {/* Ações Pendentes */}
        {acoesPendentes.map((acao) => (
          <CartaoAcao
            key={acao.id}
            acao={acao}
            resolvendo={resolvendoAcao}
            onResponder={responderAcao}
          />
        ))}

        {/* Indicador de Digitação do Assistente */}
        {enviando && (
          <div className="flex gap-2.5 items-start">
            <div className="w-8 h-8 rounded-xl bg-brand-accent text-brand-secondary flex items-center justify-center shrink-0 shadow-xs mt-0.5 border border-brand-accent/50 dark:border-brand-primary/20">
              <img src={pranchetinho} alt="Pranchetinho" className="w-5 h-5 object-contain" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-surface-card border border-surface-border shadow-2xs">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((atraso) => (
                  <span
                    key={atraso}
                    className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
                    style={{ animationDelay: `${atraso}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* 3. Rodapé com Campo de Entrada ou Waveform de Voz */}
      <form onSubmit={submeter} className="p-3 bg-surface-card border-t border-surface-border shrink-0">
        {(erro && !indisponivel) || erroVoz ? (
          <p className="text-rose-500 dark:text-rose-400 text-sm mb-2 px-1 font-medium">
            {erro?.mensagem || erroVoz}
          </p>
        ) : null}

        {ouvindo ? (
          <EntradaVozWaveform
            texto={texto}
            falando={falando}
            volume={volume}
            enviando={enviando}
            onCancelar={cancelarVoz}
            onEnviar={enviarVoz}
          />
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                acoesPendentes.length > 0
                  ? 'Confirme a ação pendente acima...'
                  : 'Pergunte ou comande o CRM...'
              }
              disabled={enviando}
              aria-label="Mensagem para o assistente"
              className="flex-1 bg-surface-subtle border border-surface-border focus:border-brand-primary text-ink-primary rounded-2xl px-4 py-2.5 text-sm placeholder:text-ink-muted focus:outline-none focus:bg-surface-card transition-all shadow-2xs disabled:opacity-50"
            />
            {vozSuportada && (
              <button
                type="button"
                onClick={alternarEscuta}
                disabled={enviando}
                title="Falar comando por voz"
                aria-label="Falar comando por voz"
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all cursor-pointer bg-surface-subtle border border-surface-border text-ink-secondary hover:text-brand-primary hover:border-brand-primary/40 shadow-2xs active:scale-95"
              >
                <HugeiconsIcon icon={Mic01Icon} size={18} strokeWidth={2} />
              </button>
            )}
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="w-10 h-10 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95"
              aria-label="Enviar mensagem"
              title="Enviar mensagem"
            >
              <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={2} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default PainelChatFlutuante;
