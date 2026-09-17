// =============================================================
// PRANCHETO.IA - PAINEL DO WIDGET DE CHAT IA
// Versão compacta do assistente (mesmo hooks/useAssistente.js da página
// cheia em pages/DashboardCliente/Chat/Chat.jsx), sem a lista de
// conversas — o widget é acesso rápido, o histórico completo continua em
// /dashboard/chat quando o Chat IA está no modo "fixo".
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../hooks/useAssistente.js';
import {
  Bolha, LinhaAtividade, CartaoAcao, FaixaIndisponivel, SUGESTOES,
} from '../../pages/DashboardCliente/Chat/ChatMensagens.jsx';

const PainelChatFlutuante = ({ onFechar, style }) => {
  const {
    conversaAtual, mensagens, acoesPendentes,
    carregando, enviando, resolvendoAcao, erro,
    carregarConversas, novaConversa, enviar, responderAcao,
  } = useAssistente();

  const [texto, setTexto] = useState('');
  const fimRef = useRef(null);

  useEffect(() => { carregarConversas(); }, [carregarConversas]);
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, acoesPendentes]);

  const submeter = (e) => {
    e.preventDefault();
    enviar(texto);
    setTexto('');
  };

  const indisponivel = erro && CODIGOS_INDISPONIVEL.includes(erro.codigo);
  const vazio = mensagens.length === 0 && !enviando && !carregando;

  return (
    <div
      className="fixed z-[60] w-[360px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[75vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)', ...style }}
    >
      <div className="h-14 border-b flex items-center px-4 gap-2 flex-shrink-0" style={{ borderColor: 'var(--color-surface-border)' }}>
        <span className="text-xl">🤖</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
            {conversaAtual?.titulo || 'Assistente'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Consulta e age no seu CRM</p>
        </div>
        <button onClick={novaConversa} title="Nova conversa" className="acao-sutil text-base flex-shrink-0">＋</button>
        <button onClick={onFechar} title="Fechar" className="acao-sutil text-lg flex-shrink-0">✕</button>
      </div>

      {indisponivel && <FaixaIndisponivel erro={erro} />}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {carregando && mensagens.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>Carregando...</p>
        )}

        {vazio && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-4xl mb-3">🤖</p>
            <p className="text-sm max-w-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Peça pra consultar, criar ou atualizar algo no CRM.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGESTOES.slice(0, 2).map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="acao-sutil acao-sutil-bloco text-xs px-3 py-1.5 rounded-full border"
                  style={{ borderColor: 'var(--color-surface-border)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensagens.map((msg) => {
          if (msg.remetente === 'tool') {
            let falhou = false;
            try { falhou = !!JSON.parse(msg.conteudo)?.recusada; } catch { /* conteudo cru */ }
            return <LinhaAtividade key={msg.id} ferramenta={msg.metadata?.ferramenta} falhou={falhou} />;
          }
          if (msg.remetente === 'assistant' && !msg.conteudo?.trim()) return null;
          return <Bolha key={msg.id} mensagem={msg} />;
        })}

        {acoesPendentes.map((acao) => (
          <CartaoAcao key={acao.id} acao={acao} resolvendo={resolvendoAcao} onResponder={responderAcao} />
        ))}

        {enviando && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}
            >
              🤖
            </div>
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm border"
              style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}
            >
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((atraso) => (
                  <span
                    key={atraso}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: 'var(--color-text-secondary)', animationDelay: `${atraso}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={fimRef} />
      </div>

      <form onSubmit={submeter} className="p-3 border-t flex-shrink-0" style={{ borderColor: 'var(--color-surface-border)' }}>
        {erro && !indisponivel && <p className="text-red-500 text-xs mb-2">{erro.mensagem}</p>}
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={acoesPendentes.length > 0 ? 'Confirme a ação acima...' : 'Pergunte algo...'}
            disabled={enviando}
            aria-label="Mensagem para o assistente"
            className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-surface-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2.5 rounded-xl transition-colors"
            aria-label="Enviar"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
};

export default PainelChatFlutuante;
