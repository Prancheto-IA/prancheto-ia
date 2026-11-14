// =============================================================
// PRANCHETO.IA - CHAT COM IA / ASSISTENTE DO CRM (EMITLY DESIGN SYSTEM)
// Mesmo padrão visual, hero header e estrutura de layout do /crm/leads.
// =============================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../../hooks/useAssistente.js';
import { useVoz } from '../../../hooks/useVoz.js';
import {
  Bolha, LinhaAtividade, CartaoAcao, FaixaIndisponivel, SUGESTOES, DicaVoz, EntradaVozWaveform,
} from './ChatMensagens.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  BotIcon,
  AiSparklesIcon,
  SentIcon,
  Comment01Icon,
  Mic01Icon,
  MicOff01Icon,
} from '@hugeicons/core-free-icons';

const Chat = () => {
  const {
    conversas, conversaAtual, mensagens, acoesPendentes,
    carregando, enviando, resolvendoAcao, erro,
    carregarConversas, abrirConversa, novaConversa, enviar, responderAcao,
  } = useAssistente();

  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
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

  useEffect(() => { carregarConversas(); }, [carregarConversas]);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, acoesPendentes]);

  const submeter = (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    pararEscuta();
    const msg = texto;
    setTexto('');
    enviar(msg);
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

  const conversasFiltradas = useMemo(() => {
    if (!busca.trim()) return conversas;
    const termo = busca.toLowerCase();
    return conversas.filter((c) =>
      c.titulo ? c.titulo.toLowerCase().includes(termo) : false
    );
  }, [conversas, busca]);

  const indisponivel = erro && CODIGOS_INDISPONIVEL.includes(erro.codigo);
  const vazio = mensagens.length === 0 && !enviando && !carregando;

  return (
    <div className="w-full h-full flex-1 flex gap-4 min-h-0 font-sans overflow-hidden">
      {/* ─────────────────────────────────────────────────────────
          COLUNA ESQUERDA: LISTA DE CONVERSAS (COM NOVO CHAT E BUSCA)
         ───────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-72 lg:w-80 bg-white rounded-2xl border border-[#E4ECE7] shadow-[0_8px_30px_-4px_rgba(14,56,44,0.04)] flex flex-col overflow-hidden shrink-0">
        {/* Controles no Topo: Botão Nova Conversa + Campo de Pesquisa */}
        <div className="p-3.5 border-b border-[#E4ECE7] space-y-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={novaConversa}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0E382C] hover:bg-[#07261E] text-white rounded-xl text-sm font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} />
            <span>Nova conversa</span>
          </button>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.8} />
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar conversas..."
              className="w-full bg-[#F7FAF8] hover:bg-white focus:bg-white text-sm text-[#111915] placeholder-slate-400 pl-8 pr-7 py-2 rounded-xl border border-[#E4ECE7] focus:outline-none focus:border-[#0E382C] transition-all"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpar busca"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>

        <div className="px-4 py-2 bg-surface-subtle border-b border-surface-border flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
            Histórico Recente
          </span>
          <span className="px-2 py-0.5 rounded-full bg-brand-accent text-brand-secondary text-[10px] font-bold">
            {conversasFiltradas.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {carregando && conversas.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : conversasFiltradas.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-10 h-10 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] flex items-center justify-center mx-auto mb-2.5">
                  <HugeiconsIcon icon={Comment01Icon} size={18} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-bold text-[#111915]">
                  {busca ? 'Nenhum resultado' : 'Nenhuma conversa'}
                </p>
                <p className="text-[11px] text-[#687770] mt-0.5">
                  {busca ? 'Tente outro termo de busca' : 'Clique em Nova conversa para começar'}
                </p>
              </div>
            ) : (
              conversasFiltradas.map((c) => {
                const ativa = conversaAtual?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => abrirConversa(c)}
                    className={`w-full text-left p-3 rounded-xl transition-all border relative flex items-start gap-2.5 cursor-pointer ${
                      ativa
                        ? 'bg-brand-accent border-brand-secondary/30 text-brand-primary shadow-2xs'
                        : 'bg-surface-card border-transparent hover:bg-surface-subtle text-ink-primary'
                    }`}
                  >
                    {ativa && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#0E382C] rounded-r-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${ativa ? 'text-[#0E382C]' : 'text-[#111915]'}`}>
                        {c.titulo || 'Conversa sem título'}
                      </p>
                      <p className="text-[10px] text-[#687770] font-medium mt-1">
                        {new Date(c.criado_em).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Coluna Direita: Tela Principal de Mensagens */}
        <section className="flex-1 bg-white rounded-2xl border border-[#E4ECE7] shadow-[0_8px_30px_-4px_rgba(14,56,44,0.04)] flex flex-col overflow-hidden min-w-0">
          {/* Top Bar do Chat */}
          <div className="px-5 py-3.5 border-b border-[#E4ECE7] flex items-center justify-between bg-white flex-shrink-0 z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center shrink-0 shadow-xs">
                <HugeiconsIcon icon={BotIcon} size={18} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm text-[#111915] truncate">
                  {conversaAtual?.titulo || 'Assistente IA do CRM'}
                </h3>
                <p className="text-sm text-[#687770] truncate">
                  Consulta de dados e automação do pipeline
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DCF5E4] text-[#15803D]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                IA Conectada
              </span>
            </div>
          </div>

          {indisponivel && <FaixaIndisponivel erro={erro} />}

          {/* Fluxo de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface custom-scrollbar">
            {vazio && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-brand-accent text-brand-secondary flex items-center justify-center mb-3 shadow-2xs">
                  <HugeiconsIcon icon={BotIcon} size={28} strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-extrabold text-ink-primary mb-1.5">
                  O que vamos fazer no CRM hoje?
                </h3>
                <p className="text-sm text-ink-secondary leading-relaxed mb-6">
                  Peça para consultar negócios no pipeline, cadastrar novos leads ou registrar contatos.
                  Ações que alteram dados sempre solicitarão sua confirmação prévia.
                </p>

                <div className="flex flex-wrap gap-2 justify-center mb-5">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-card hover:bg-brand-accent border border-surface-border hover:border-brand-secondary/40 text-ink-primary hover:text-brand-primary rounded-full text-sm font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <HugeiconsIcon icon={AiSparklesIcon} size={13} strokeWidth={2} className="text-brand-secondary" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>

                <div className="w-full max-w-sm">
                  <DicaVoz />
                </div>
              </div>
            )}

            {mensagens.map((msg) => {
              if (msg.remetente === 'tool') {
                let falhou = false;
                try { falhou = !!JSON.parse(msg.conteudo)?.recusada; } catch { /* conteudo cru */ }
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

            {acoesPendentes.map((acao) => (
              <CartaoAcao
                key={acao.id}
                acao={acao}
                resolvendo={resolvendoAcao}
                onResponder={responderAcao}
              />
            ))}

            {enviando && (
              <div className="flex gap-2.5 sm:gap-3 flex-row items-center">
                <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center shrink-0 shadow-2xs">
                  <HugeiconsIcon icon={BotIcon} size={18} strokeWidth={2} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-[#E4ECE7] shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={fimRef} />
          </div>

          {/* Form de Envio */}
          <form
            onSubmit={submeter}
            className="p-3 sm:p-4 bg-surface-card border-t border-surface-border flex-shrink-0"
          >
            {(erro && !indisponivel) || erroVoz ? (
              <p className="text-rose-500 text-sm mb-2 font-medium">
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
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder={
                    acoesPendentes.length > 0
                      ? 'Confirme ou descarte a ação acima...'
                      : 'Pergunte sobre seus leads ou comande o CRM...'
                  }
                  disabled={enviando}
                  aria-label="Mensagem para o assistente"
                  className="flex-1 bg-surface-subtle hover:bg-surface-card focus:bg-surface-card text-sm text-ink-primary placeholder:text-ink-muted px-4 py-3 rounded-xl border border-surface-border focus:outline-none focus:border-brand-primary transition-all shadow-2xs"
                />
                {vozSuportada && (
                  <button
                    type="button"
                    onClick={alternarEscuta}
                    disabled={enviando}
                    title="Falar comando por voz"
                    aria-label="Falar comando por voz"
                    className="p-3 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer bg-surface-subtle border border-surface-border text-ink-secondary hover:text-brand-primary hover:border-brand-primary/40 shadow-2xs active:scale-95"
                  >
                    <HugeiconsIcon icon={Mic01Icon} size={18} strokeWidth={2} />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!texto.trim() || enviando}
                  className="px-4 py-3 bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95"
                  aria-label="Enviar"
                  title="Enviar mensagem"
                >
                  <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={2} />
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
  );
};

export default Chat;
