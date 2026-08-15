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

// Rotulo de cada ferramenta na linha de atividade. Vive aqui porque e
// texto de interface: o catalogo de verdade esta na Edge Function, e
// uma ferramenta sem rotulo cai no padrao em vez de sumir da tela.
const ROTULO_FERRAMENTA = {
  buscar_contatos:     { emoji: '🔍', texto: 'Consultou os contatos' },
  detalhar_contato:    { emoji: '📇', texto: 'Abriu um contato' },
  resumo_funil:        { emoji: '📊', texto: 'Resumiu o funil' },
  criar_lead:          { emoji: '✨', texto: 'Criou um lead' },
  registrar_interacao: { emoji: '📝', texto: 'Registrou uma interacao' },
  atualizar_contato:   { emoji: '✏️', texto: 'Alterou um contato' },
  mover_no_funil:      { emoji: '↔️', texto: 'Moveu no funil' },
  converter_em_cliente:{ emoji: '🏆', texto: 'Converteu em cliente' },
};

const horario = (iso) =>
  new Date(iso || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ----------------------------------------------------------
// MENSAGEM
// ----------------------------------------------------------
const Bolha = ({ mensagem }) => {
  const ehUsuario = mensagem.remetente === 'user';
  return (
    <div className={`flex gap-3 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"
        style={ehUsuario
          ? undefined
          : { backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}
      >
        {ehUsuario
          ? <span className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center">👤</span>
          : '🤖'}
      </div>

      {ehUsuario ? (
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-primary-600 text-white">
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-xs mt-1 text-primary-100 opacity-80">{horario(mensagem.criado_em)}</p>
        </div>
      ) : (
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed border"
          style={{
            backgroundColor: 'var(--color-surface-card)',
            borderColor: 'var(--color-surface-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {horario(mensagem.criado_em)}
          </p>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// ATIVIDADE DE FERRAMENTA
// ----------------------------------------------------------
const LinhaAtividade = ({ ferramenta, falhou }) => {
  const rotulo = ROTULO_FERRAMENTA[ferramenta] || { emoji: '🔧', texto: 'Executou uma acao' };
  return (
    <div className="flex items-center gap-2 pl-11 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      <span>{falhou ? '⚠️' : rotulo.emoji}</span>
      <span>{falhou ? `Falhou: ${rotulo.texto.toLowerCase()}` : rotulo.texto}</span>
    </div>
  );
};

// ----------------------------------------------------------
// CARTAO DE CONFIRMACAO
// ----------------------------------------------------------
const CartaoAcao = ({ acao, resolvendo, onResponder }) => {
  const rotulo = ROTULO_FERRAMENTA[acao.ferramenta] || { emoji: '🔧' };
  const ocupado = resolvendo === acao.id;

  return (
    <div
      className="ml-11 rounded-xl border p-4"
      style={{
        backgroundColor: 'var(--color-surface-card)',
        borderColor: 'rgb(var(--color-primary-500) / 0.4)',
      }}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className="text-base leading-none mt-0.5">{rotulo.emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {acao.resumo}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            O assistente so grava isto depois da sua confirmacao.
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onResponder(acao.id, true)}
          disabled={ocupado}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
        >
          {ocupado ? 'Executando...' : 'Confirmar'}
        </button>
        <button
          onClick={() => onResponder(acao.id, false)}
          disabled={ocupado}
          className="acao-sutil acao-sutil-bloco px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
        >
          Descartar
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// FAIXA DE INDISPONIBILIDADE
// ----------------------------------------------------------
const FaixaIndisponivel = ({ erro }) => (
  <div
    className="mx-4 mt-4 rounded-lg border px-4 py-3 text-sm"
    style={{ backgroundColor: 'rgb(245 158 11 / 0.08)', borderColor: 'rgb(245 158 11 / 0.35)', color: 'var(--color-text-primary)' }}
  >
    <p className="font-medium">Assistente indisponivel no momento</p>
    <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
      {erro.mensagem} As acoes no CRM continuam disponiveis normalmente pelas telas do sistema.
    </p>
  </div>
);

// ----------------------------------------------------------
// SUGESTOES DO ESTADO VAZIO
// ----------------------------------------------------------
const SUGESTOES = [
  'Como esta meu funil?',
  'Crie um lead: Joana Prado, da Vertex, joana@vertex.com',
  'Quais leads estao em negociacao?',
  'Registre uma ligacao no contato da Marina',
];

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
