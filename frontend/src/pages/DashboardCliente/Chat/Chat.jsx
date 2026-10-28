// =============================================================
// PRANCHETO.IA - CHAT COM IA / ASSISTENTE DO CRM (EMITLY DESIGN SYSTEM)
// Mesmo padrão visual, hero header e estrutura de layout do /crm/leads.
// =============================================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../../hooks/useAssistente.js';
import {
  Bolha, LinhaAtividade, CartaoAcao, FaixaIndisponivel, SUGESTOES,
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

  useEffect(() => { carregarConversas(); }, [carregarConversas]);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, acoesPendentes]);

  const submeter = (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
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
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0E382C] hover:bg-[#07261E] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-98 cursor-pointer"
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
              className="w-full bg-[#F7FAF8] hover:bg-white focus:bg-white text-xs text-[#111915] placeholder-slate-400 pl-8 pr-7 py-2 rounded-xl border border-[#E4ECE7] focus:outline-none focus:border-[#0E382C] transition-all"
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

        <div className="px-4 py-2 bg-[#F7FAF8]/70 border-b border-[#E4ECE7] flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#687770]">
            Histórico Recente
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#DCF5E4] text-[#15803D] text-[10px] font-bold">
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
                <p className="text-xs font-bold text-[#111915]">
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
                        ? 'bg-[#DCF5E4]/40 border-[#DCF5E4] text-[#0E382C] shadow-2xs'
                        : 'bg-white border-transparent hover:bg-[#F7FAF8] text-[#111915]'
                    }`}
                  >
                    {ativa && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#0E382C] rounded-r-full" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${ativa ? 'text-[#0E382C]' : 'text-[#111915]'}`}>
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
                <p className="text-xs text-[#687770] truncate">
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
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F7FAF8]/60 custom-scrollbar">
            {vazio && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center mb-3 shadow-2xs">
                  <HugeiconsIcon icon={BotIcon} size={28} strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-extrabold text-[#111915] mb-1.5">
                  O que vamos fazer no CRM hoje?
                </h3>
                <p className="text-xs text-[#687770] leading-relaxed mb-6">
                  Peça para consultar negócios no pipeline, cadastrar novos leads ou registrar contatos.
                  Ações que alteram dados sempre solicitarão sua confirmação prévia.
                </p>

                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#DCF5E4] border border-[#E4ECE7] hover:border-[#15803D]/30 text-[#111915] hover:text-[#0E382C] rounded-full text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <HugeiconsIcon icon={AiSparklesIcon} size={13} strokeWidth={2} className="text-emerald-600" />
                      <span>{s}</span>
                    </button>
                  ))}
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
            className="p-3 sm:p-4 bg-white border-t border-[#E4ECE7] flex-shrink-0"
          >
            {erro && !indisponivel && (
              <p className="text-red-500 text-xs mb-2 font-medium">{erro.mensagem}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={acoesPendentes.length > 0
                  ? 'Confirme ou descarte a ação acima...'
                  : 'Pergunte sobre seus leads ou peça uma ação no CRM...'}
                disabled={enviando}
                aria-label="Mensagem para o assistente"
                className="flex-1 bg-[#F7FAF8] hover:bg-white focus:bg-white text-xs sm:text-sm text-[#111915] placeholder-slate-400 px-4 py-3 rounded-xl border border-[#E4ECE7] focus:outline-none focus:border-[#0E382C] transition-all"
              />
              <button
                type="submit"
                disabled={!texto.trim() || enviando}
                className="px-4 py-3 bg-[#0E382C] hover:bg-[#07261E] disabled:opacity-40 disabled:hover:bg-[#0E382C] text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Enviar"
              >
                <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={2} />
              </button>
            </div>
          </form>
        </section>
      </div>
  );
};

export default Chat;
