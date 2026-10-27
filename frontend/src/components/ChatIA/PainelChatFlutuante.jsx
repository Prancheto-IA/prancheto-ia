// =============================================================
// PRANCHETO.IA - PAINEL DO WIDGET DE CHAT IA (EMITLY DESIGN SYSTEM)
// Versão modal compacta do assistente com design system Emitly.
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../hooks/useAssistente.js';
import {
  Bolha,
  LinhaAtividade,
  CartaoAcao,
  FaixaIndisponivel,
  SUGESTOES,
} from '../../pages/DashboardCliente/Chat/ChatMensagens.jsx';
import pranchetinho from '../../assets/mascote/pranchetinho-chat.png';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  Cancel01Icon,
  SentIcon,
  ArrowUpRight01Icon,
  SparklesIcon,
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

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, acoesPendentes]);

  const submeter = (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    enviar(texto);
    setTexto('');
  };

  const abrirChatCompleto = () => {
    onFechar();
    navigate('/dashboard/chat');
  };

  const indisponivel = erro && CODIGOS_INDISPONIVEL.includes(erro.codigo);
  const vazio = mensagens.length === 0 && !enviando && !carregando;

  return (
    <div
      className="fixed z-[60] w-[380px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[78vh] flex flex-col rounded-3xl border border-[#E4ECE7] bg-white shadow-2xl overflow-hidden animate-scale-in"
      style={style}
    >
      {/* 1. Header do Assistente */}
      <div className="h-16 px-4 bg-white border-b border-[#E4ECE7] flex items-center gap-3 shrink-0">
        <div className="relative">
          <div className="w-10 h-10 rounded-2xl bg-[#DCF5E4] p-1 flex items-center justify-center shrink-0 border border-[#bbf0ca]">
            <img
              src={pranchetinho}
              alt="Pranchetinho"
              className="w-full h-full object-contain"
            />
          </div>
          {/* Indicador de status online */}
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-sm text-[#111915] truncate">
              {conversaAtual?.titulo || 'Assistente IA'}
            </h3>
            <span className="bg-[#DCF5E4] text-[#15803D] text-[10px] font-bold px-1.5 py-0.2 rounded">
              Beta
            </span>
          </div>
          <p className="text-[11px] text-[#687770] truncate">
            Pranchetinho • CRM Inteligente
          </p>
        </div>

        {/* Ações do cabeçalho */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={novaConversa}
            title="Nova conversa"
            className="p-1.5 rounded-xl text-[#687770] hover:text-[#0E382C] hover:bg-[#F2F5F3] transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={abrirChatCompleto}
            title="Abrir em tela cheia"
            className="p-1.5 rounded-xl text-[#687770] hover:text-[#0E382C] hover:bg-[#F2F5F3] transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={18} strokeWidth={1.8} />
          </button>

          <button
            type="button"
            onClick={onFechar}
            title="Fechar assistente"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      {/* Alerta de erro de conexão / indisponibilidade */}
      {indisponivel && <FaixaIndisponivel erro={erro} />}

      {/* 2. Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F7FAF8]/60">
        {carregando && mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <div className="w-7 h-7 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[#687770]">Carregando histórico...</p>
          </div>
        )}

        {/* Estado Vazio (Boas-vindas) */}
        {vazio && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
            <div className="w-16 h-16 rounded-3xl bg-[#DCF5E4] p-2 flex items-center justify-center mb-3 shadow-xs border border-[#bbf0ca]">
              <img
                src={pranchetinho}
                alt="Pranchetinho"
                className="w-full h-full object-contain"
              />
            </div>
            <h4 className="text-sm font-bold text-[#111915] mb-1">
              Olá! Como posso te ajudar hoje?
            </h4>
            <p className="text-xs text-[#687770] max-w-xs mb-5 leading-relaxed">
              Consulte seu funil de vendas, adicione novos leads ou registre tarefas usando linguagem natural.
            </p>

            <div className="w-full space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#687770] text-left px-1">
                Sugestões rápidas:
              </p>
              {SUGESTOES.slice(0, 3).map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => enviar(sugestao)}
                  className="w-full text-left bg-white hover:bg-[#F2F5F3] hover:border-[#0E382C]/30 text-xs font-semibold text-[#111915] px-3.5 py-2.5 rounded-2xl border border-[#E4ECE7] shadow-2xs transition-all flex items-center gap-2 group cursor-pointer"
                >
                  <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} className="text-[#15803D] shrink-0" />
                  <span className="truncate flex-1">{sugestao}</span>
                </button>
              ))}
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
            <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center shrink-0 shadow-xs mt-0.5 border border-[#bbf0ca]">
              <img src={pranchetinho} alt="Pranchetinho" className="w-5 h-5 object-contain" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-white border border-[#E4ECE7] shadow-2xs">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 150, 300].map((atraso) => (
                  <span
                    key={atraso}
                    className="w-2 h-2 rounded-full bg-[#0E382C] animate-bounce"
                    style={{ animationDelay: `${atraso}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* 3. Rodapé com Campo de Entrada */}
      <form onSubmit={submeter} className="p-3 bg-white border-t border-[#E4ECE7] shrink-0">
        {erro && !indisponivel && (
          <p className="text-red-500 text-xs mb-2 px-1 font-medium">{erro.mensagem}</p>
        )}
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
            className="flex-1 bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-2xl px-4 py-2.5 text-xs sm:text-sm placeholder-[#687770]/60 focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="w-10 h-10 rounded-2xl bg-[#0E382C] hover:bg-[#154637] disabled:opacity-40 text-[#D4EC9D] transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Enviar mensagem"
          >
            <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={2} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default PainelChatFlutuante;
