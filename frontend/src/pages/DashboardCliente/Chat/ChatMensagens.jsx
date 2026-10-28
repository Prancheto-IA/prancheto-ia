// =============================================================
// PRANCHETO.IA - PEÇAS DE APRESENTAÇÃO DO CHAT COM IA
// Compartilhado entre a página cheia (Chat.jsx) e o widget flutuante
// (components/ChatIA/PainelChatFlutuante.jsx) — mesma lógica de negócio
// (hooks/useAssistente.js), duas apresentações de tamanho diferente.
// =============================================================

import React from 'react';

// Rotulo de cada ferramenta na linha de atividade. Vive aqui porque e
// texto de interface: o catalogo de verdade esta na Edge Function, e
// uma ferramenta sem rotulo cai no padrao em vez de sumir da tela.
export const ROTULO_FERRAMENTA = {
  buscar_contatos:     { emoji: '🔍', texto: 'Consultou os contatos' },
  detalhar_contato:    { emoji: '📇', texto: 'Abriu um contato' },
  resumo_funil:        { emoji: '📊', texto: 'Resumiu o funil' },
  criar_lead:          { emoji: '✨', texto: 'Criou um lead' },
  registrar_interacao: { emoji: '📝', texto: 'Registrou uma interacao' },
  atualizar_contato:   { emoji: '✏️', texto: 'Alterou um contato' },
  mover_no_funil:      { emoji: '↔️', texto: 'Moveu no funil' },
  converter_em_cliente:{ emoji: '🏆', texto: 'Converteu em cliente' },
};

export const horario = (iso) =>
  new Date(iso || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const SUGESTOES = [
  'Como esta meu funil?',
  'Crie um lead: Joana Prado, da Vertex, joana@vertex.com',
  'Quais leads estao em negociacao?',
  'Registre uma ligacao no contato da Marina',
];

// ----------------------------------------------------------
// MENSAGEM
// ----------------------------------------------------------
export const Bolha = ({ mensagem }) => {
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
export const LinhaAtividade = ({ ferramenta, falhou }) => {
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
export const CartaoAcao = ({ acao, resolvendo, onResponder }) => {
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
export const FaixaIndisponivel = ({ erro }) => (
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
