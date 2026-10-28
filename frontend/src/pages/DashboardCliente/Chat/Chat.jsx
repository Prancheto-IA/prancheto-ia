// =============================================================
// PRANCHETO.IA - ASSISTENTE COM ACAO NO CRM
//
// A conversa tem tres tipos de coisa na tela, e cada uma pesa
// diferente:
//   - mensagem, em bolha;
//   - atividade de ferramenta, em uma linha discreta — e rastro do
//     que o assistente fez, nao conversa;
//   - cartao de confirmacao, destacado, porque exige decisao.
//
// A maquina de estados vive em hooks/useAssistente.js. Aqui e so
// apresentacao.
// =============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useAssistente, CODIGOS_INDISPONIVEL } from '../../../hooks/useAssistente.js';
import {
  Bolha, LinhaAtividade, CartaoAcao, FaixaIndisponivel, SUGESTOES,
} from './ChatMensagens.jsx';

const Chat = () => {
  const {
    conversas, conversaAtual, mensagens, acoesPendentes,
    carregando, enviando, resolvendoAcao, erro,
    carregarConversas, abrirConversa, novaConversa, enviar, responderAcao,
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
  const vazio = mensagens.length === 0 && !enviando;

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">

      {/* Conversas */}
      <div
        className="w-64 flex-col hidden md:flex border-r"
        style={{ borderColor: 'var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button
            onClick={novaConversa}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nova conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {carregando && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Carregando...
            </p>
          )}
          {!carregando && conversas.length === 0 && (
            <p className="text-xs text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhuma conversa ainda.
            </p>
          )}
          {conversas.map((c) => {
            const ativa = conversaAtual?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => abrirConversa(c)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  ativa ? 'bg-primary-500/15' : 'acao-sutil acao-sutil-bloco'
                }`}
                style={ativa ? { color: 'var(--color-primaria-contraste)' } : undefined}
              >
                <p className="truncate font-medium">{c.titulo}</p>
                <p className="text-xs mt-0.5 opacity-70">
                  {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversa */}
      <div className="flex-1 flex flex-col min-w-0">

        <div
          className="h-14 border-b flex items-center px-4 gap-3 flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}
        >
          <span className="text-xl">🤖</span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
              {conversaAtual?.titulo || 'Assistente'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Consulta e age no seu CRM
            </p>
          </div>
        </div>

        {indisponivel && <FaixaIndisponivel erro={erro} />}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {vazio && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <p className="text-5xl mb-4">🤖</p>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                O que vamos fazer no CRM?
              </h3>
              <p className="text-sm max-w-sm mb-5" style={{ color: 'var(--color-text-secondary)' }}>
                Peca para consultar, criar ou atualizar. O que mexe em dado existente passa por
                confirmacao sua antes de ser gravado.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGESTOES.map((s) => (
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
              return (
                <LinhaAtividade
                  key={msg.id}
                  ferramenta={msg.metadata?.ferramenta}
                  falhou={falhou}
                />
              );
            }
            // Turno em que o modelo so chamou ferramenta: sem texto, sem bolha.
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

        <form
          onSubmit={submeter}
          className="p-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}
        >
          {erro && !indisponivel && (
            <p className="text-red-500 text-xs mb-2">{erro.mensagem}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={acoesPendentes.length > 0
                ? 'Confirme ou descarte a acao acima, ou continue digitando...'
                : 'Peca algo do seu CRM...'}
              disabled={enviando}
              aria-label="Mensagem para o assistente"
              className="flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-surface-border)',
                color: 'var(--color-text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors"
              aria-label="Enviar"
            >
              ➤
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
