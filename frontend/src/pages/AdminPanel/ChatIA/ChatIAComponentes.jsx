// =============================================================
// PRANCHETO.IA - SUB-COMPONENTES DO CHAT COM IA
// Componentes visuais reutilizáveis usados pelo ChatIA.jsx.
//
// COMPONENTES EXPORTADOS:
//   BotaoVoltar       → Botão para retornar ao Painel Admin
//   ItemConversa      → Card de conversa na sidebar
//   BolhaMensagem     → Mensagem individual com formatação Markdown
//   IndicadorDigitando → Animação "IA está digitando..."
//   TelaVazia         → Tela inicial quando nenhuma conversa está selecionada
// =============================================================

import React, { useState } from 'react';

// =============================================================
// COMPONENTE: BotaoVoltar
// =============================================================
export const BotaoVoltar = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
    Voltar ao Painel
  </button>
);

// =============================================================
// COMPONENTE: ItemConversa
// Card de conversa exibido na sidebar
// =============================================================
export const ItemConversa = ({ conversa, ativa, onClick, onArquivar }) => (
  <div
    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
      ativa
        ? 'bg-primary-800/60 border border-primary-600/50'
        : 'hover:bg-surface-card border border-transparent'
    }`}
    onClick={onClick}
  >
    {/* Título truncado */}
    <p className={`text-sm font-medium truncate pr-6 ${ativa ? 'text-white' : 'text-slate-300'}`}>
      {conversa.titulo}
    </p>

    {/* Metadados: contagem de mensagens e tokens */}
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-slate-500">{conversa.total_mensagens || 0} msgs</span>
      {conversa.total_tokens > 0 && (
        <>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-500">
            {conversa.total_tokens.toLocaleString()} tokens
          </span>
        </>
      )}
    </div>

    {/* Botão arquivar — visível apenas no hover */}
    <button
      onClick={(e) => {
        e.stopPropagation(); // Evita selecionar a conversa ao clicar em arquivar
        onArquivar(conversa.id);
      }}
      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-900/50 text-slate-500 hover:text-red-400"
      title="Arquivar conversa"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
);

// =============================================================
// COMPONENTE: BolhaMensagem
// Renderiza uma mensagem individual com formatação básica de Markdown:
//   - Blocos de código (```...```) com botão de copiar
//   - Negrito (**texto**)
//   - Quebras de linha preservadas
// =============================================================
export const BolhaMensagem = ({ mensagem }) => {
  const [copiado, setCopiado] = useState(false);
  const ehUsuario = mensagem.remetente === 'user';

  // Copia texto para a área de transferência
  const copiarTexto = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para navegadores sem suporte à Clipboard API moderna
      const el = document.createElement('textarea');
      el.value = texto;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Formata o conteúdo da IA separando blocos de código do texto normal
  const formatarConteudo = (texto) => {
    // Divide o texto em blocos de código (```...```) e texto normal
    const partes = texto.split(/(```[\s\S]*?```)/g);

    return partes.map((parte, idx) => {
      // Bloco de código
      if (parte.startsWith('```')) {
        const linhas    = parte.split('\n');
        const linguagem = linhas[0].replace('```', '').trim() || 'código';
        const codigo    = linhas.slice(1, -1).join('\n');

        return (
          <div key={idx} className="my-3 rounded-lg overflow-hidden border border-slate-700">
            {/* Header do bloco: linguagem + botão copiar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">{linguagem}</span>
              <button
                onClick={() => copiarTexto(codigo)}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Copiar
              </button>
            </div>
            {/* Conteúdo do código */}
            <pre className="p-3 bg-slate-900 overflow-x-auto text-sm text-slate-200 font-mono leading-relaxed">
              <code>{codigo}</code>
            </pre>
          </div>
        );
      }

      // Texto normal: converte **negrito** e preserva quebras de linha
      return (
        <span key={idx}>
          {parte.split('\n').map((linha, i) => (
            <React.Fragment key={i}>
              {i > 0 && <br />}
              {linha.split(/(\*\*.*?\*\*)/g).map((trecho, j) => {
                if (trecho.startsWith('**') && trecho.endsWith('**')) {
                  return (
                    <strong key={j} className="font-semibold text-white">
                      {trecho.slice(2, -2)}
                    </strong>
                  );
                }
                return trecho;
              })}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  // Formata a hora da mensagem no padrão HH:MM
  const formatarHora = (dataISO) =>
    new Date(dataISO).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
        ehUsuario ? 'bg-primary-700 text-white' : 'bg-slate-700 text-slate-200'
      }`}>
        {ehUsuario ? '👤' : '🤖'}
      </div>

      {/* Bolha da mensagem */}
      <div className={`group relative max-w-[80%] flex flex-col ${ehUsuario ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          ehUsuario
            ? 'bg-primary-700 text-white rounded-tr-sm'
            : 'bg-surface-card text-slate-200 rounded-tl-sm border border-surface-border'
        }`}>
          <div className="whitespace-pre-wrap break-words">
            {ehUsuario ? mensagem.conteudo : formatarConteudo(mensagem.conteudo)}
          </div>
        </div>

        {/* Rodapé: hora + botão copiar (apenas para respostas da IA) */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-xs text-slate-600">{formatarHora(mensagem.criado_em)}</span>

          {!ehUsuario && (
            <button
              onClick={() => copiarTexto(mensagem.conteudo)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              {copiado ? (
                <span className="text-green-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE: IndicadorDigitando
// Animação de três pontos pulsantes enquanto a IA processa
// =============================================================
export const IndicadorDigitando = () => (
  <div className="flex gap-3">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
      🤖
    </div>
    <div className="bg-surface-card border border-surface-border rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// =============================================================
// COMPONENTE: TelaVazia
// Exibida quando nenhuma conversa está selecionada.
// Mostra sugestões de prompts para o usuário começar rapidamente.
// =============================================================
const SUGESTOES_PROMPT = [
  { emoji: '🏗️', texto: 'Criar um novo módulo de Vendas para o CRM' },
  { emoji: '🗄️', texto: 'Gerar migration Knex para tabela de contratos' },
  { emoji: '⚛️', texto: 'Criar componente React para dashboard de métricas' },
  { emoji: '🔐', texto: 'Implementar permissão RBAC customizada para relatórios' },
];

export const TelaVazia = ({ onNovaConversa, carregando }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
    <div className="text-6xl mb-4">🤖</div>
    <h2 className="text-xl font-semibold text-white mb-2">Chat com IA</h2>
    <p className="text-slate-400 mb-6 max-w-sm">
      Converse com a IA para criar módulos, gerar código, planejar funcionalidades
      e resolver problemas técnicos do Prancheto.IA.
    </p>

    {/* Botão principal de nova conversa */}
    <button
      onClick={() => onNovaConversa()}
      disabled={carregando}
      className="btn-primary flex items-center gap-2 disabled:opacity-50"
    >
      {carregando ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Criando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Conversa
        </>
      )}
    </button>

    {/* Sugestões de prompts rápidos */}
    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
      {SUGESTOES_PROMPT.map((s, i) => (
        <button
          key={i}
          onClick={() => onNovaConversa(s.texto)}
          disabled={carregando}
          className="text-left p-3 rounded-lg border border-surface-border hover:border-primary-600 bg-surface-card hover:bg-primary-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg mr-2">{s.emoji}</span>
          <span className="text-sm text-slate-300">{s.texto}</span>
        </button>
      ))}
    </div>
  </div>
);
