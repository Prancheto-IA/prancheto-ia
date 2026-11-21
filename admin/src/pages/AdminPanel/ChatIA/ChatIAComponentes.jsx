// =============================================================
// PRANCHETO.IA - PEÇAS DE APRESENTAÇÃO DO CHAT COM IA (ADMIN)
// Padrão visual baseado em frontend/.../Chat/ChatMensagens.jsx
// Suporta Markdown rico, avatares estilizados e Pranchetinho.
// =============================================================

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '../../../store/authStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  UserIcon,
  Analytics01Icon,
  Add01Icon,
  Comment01Icon,
  Edit02Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Settings02Icon,
  Attachment01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import pranchetinho from '../../../assets/mascote/pranchetinho-chat.png';

// Rótulo e ícone de cada ferramenta na linha de atividade
export const ROTULO_FERRAMENTA = {
  buscar_clientes:     { icon: Search01Icon, texto: 'Consultou os clientes do sistema' },
  detalhar_cliente:    { icon: UserIcon, texto: 'Abriu detalhes do cliente' },
  metricas_sistema:    { icon: Analytics01Icon, texto: 'Consultou métricas de infraestrutura' },
  criar_cliente:       { icon: Add01Icon, texto: 'Criou novo cliente' },
  auditoria_seguranca: { icon: Comment01Icon, texto: 'Verificou logs de auditoria' },
  atualizar_plano:     { icon: Edit02Icon, texto: 'Atualizou plano e limites' },
  verificar_status:    { icon: ArrowRight01Icon, texto: 'Checou status dos serviços' },
  redefinir_senha:     { icon: CheckmarkCircle02Icon, texto: 'Redefiniu credencial de acesso' },
};

export const horario = (iso) =>
  new Date(iso || Date.now()).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

export const SUGESTOES = [
  'Quais clientes tiveram mais atividade hoje?',
  'Resuma as falhas de autenticação recentes no sistema',
  'Quantos usuários estão próximos do limite de assentos?',
  'Como está a integridade do cluster e banco de dados?',
];

// ----------------------------------------------------------
// MENSAGEM (BOLHA) COM RENDERIZAÇÃO MARKDOWN
// ----------------------------------------------------------
export const Bolha = ({ mensagem }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const ehUsuario = mensagem.remetente === 'user';
  const [copiadoIdx, setCopiadoIdx] = useState(null);

  const handleCopiarCodigo = async (codigo, idx) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiadoIdx(idx);
      setTimeout(() => setCopiadoIdx(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={`flex gap-2.5 sm:gap-3 ${
        ehUsuario ? 'flex-row-reverse' : 'flex-row'
      } items-start group`}
    >
      {/* Avatar */}
      {ehUsuario ? (
        <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs mt-0.5">
          {usuario?.nome ? usuario.nome[0].toUpperCase() : 'A'}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-brand-accent/40 dark:bg-brand-primary/10 border border-brand-accent/60 dark:border-brand-primary/20 flex items-center justify-center shrink-0 shadow-xs mt-0.5 p-1 overflow-hidden">
          <img
            src={pranchetinho}
            alt="Pranchetinho"
            className="w-full h-full object-contain select-none pointer-events-none"
            draggable={false}
          />
        </div>
      )}

      {/* Conteúdo da Mensagem */}
      {ehUsuario ? (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs text-xs sm:text-sm leading-relaxed bg-brand-primary text-white shadow-2xs">
          {mensagem.metadata?.anexos && mensagem.metadata.anexos.length > 0 && (
            <div className="mb-2 space-y-1">
              {mensagem.metadata.anexos.map((anexo, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs bg-white/15 px-2.5 py-1 rounded-lg"
                >
                  <HugeiconsIcon icon={Attachment01Icon} size={13} strokeWidth={2} />
                  <span className="truncate max-w-[200px]">{anexo.nome || anexo.name}</span>
                  {anexo.tamanho && (
                    <span className="text-[10px] opacity-75">({anexo.tamanho})</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-[10px] mt-1.5 text-white/75 text-right font-medium">
            {horario(mensagem.criado_em)}
          </p>
        </div>
      ) : (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-xs text-xs sm:text-sm leading-relaxed bg-surface-card border border-surface-border text-ink-primary shadow-2xs">
          <div className="space-y-2 text-ink-primary">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="my-2 space-y-1.5 pl-1 list-none">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 space-y-1.5 pl-4 list-decimal">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-ink-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-2 shrink-0" />
                    <span className="flex-1 leading-relaxed">{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-ink-primary">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-surface-subtle px-1.5 py-0.5 rounded text-xs font-mono font-semibold text-brand-primary border border-surface-border">
                      {children}
                    </code>
                  ) : (
                    <div className="my-2 rounded-xl border border-surface-border overflow-hidden bg-surface-subtle">
                      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-muted/60 border-b border-surface-border text-[11px] font-mono text-ink-secondary">
                        <span>código</span>
                        <button
                          type="button"
                          onClick={() => handleCopiarCodigo(String(children))}
                          className="flex items-center gap-1 hover:text-ink-primary transition-colors cursor-pointer"
                        >
                          <HugeiconsIcon
                            icon={copiadoIdx !== null ? CheckmarkCircle01Icon : Copy01Icon}
                            size={12}
                          />
                          <span>{copiadoIdx !== null ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                      <pre className="p-3 font-mono text-xs overflow-x-auto text-ink-primary">
                        <code>{children}</code>
                      </pre>
                    </div>
                  ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2 rounded-xl border border-surface-border">
                    <table className="w-full text-left text-xs divide-y divide-surface-border">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="px-3 py-2 bg-surface-subtle font-bold text-ink-primary">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-3 py-2 border-t border-surface-border">{children}</td>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-bold text-ink-primary mt-3 mb-1.5">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-bold text-ink-primary mt-2.5 mb-1">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xs font-bold text-ink-primary mt-2 mb-1">{children}</h3>
                ),
              }}
            >
              {mensagem.conteudo}
            </ReactMarkdown>
          </div>
          <p className="text-[10px] mt-2 text-ink-secondary font-medium text-right">
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
  const rotulo = ROTULO_FERRAMENTA[ferramenta] || {
    icon: Settings02Icon,
    texto: 'Executou uma ação administrativa no sistema',
  };
  const IconComp = rotulo.icon;

  return (
    <div className="flex items-center gap-2 pl-11 text-xs sm:text-sm text-ink-secondary">
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center ${
          falhou
            ? 'text-amber-600 bg-amber-50 dark:text-[#FBBF24] dark:bg-amber-500/15'
            : 'text-brand-secondary bg-brand-accent'
        }`}
      >
        <HugeiconsIcon icon={falhou ? Alert02Icon : IconComp} size={11} strokeWidth={2} />
      </span>
      <span className="font-medium">
        {falhou ? `Falhou: ${rotulo.texto.toLowerCase()}` : rotulo.texto}
      </span>
    </div>
  );
};

// ----------------------------------------------------------
// CARTÃO DE CONFIRMAÇÃO DE AÇÃO
// ----------------------------------------------------------
export const CartaoAcao = ({ acao, resolvendo, onResponder }) => {
  const rotulo = ROTULO_FERRAMENTA[acao.ferramenta] || { icon: Settings02Icon };
  const IconComp = rotulo.icon;
  const ocupado = resolvendo === acao.id;

  return (
    <div className="ml-11 rounded-2xl border border-brand-secondary/30 bg-surface-subtle p-4 shadow-sm max-w-md space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-xl bg-brand-accent text-brand-secondary flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <HugeiconsIcon icon={IconComp} size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-ink-primary">{acao.resumo}</p>
          <p className="text-xs text-ink-secondary mt-0.5">
            O assistente só executa esta alteração administrativa com sua aprovação.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onResponder(acao.id, true)}
          disabled={ocupado}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          {ocupado ? (
            <>
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              <span>Executando...</span>
            </>
          ) : (
            <span>Confirmar</span>
          )}
        </button>
        <button
          onClick={() => onResponder(acao.id, false)}
          disabled={ocupado}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-card border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
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
  <div className="mx-4 my-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
    <HugeiconsIcon
      icon={Alert02Icon}
      size={18}
      strokeWidth={2}
      className="text-amber-600 dark:text-[#FBBF24] shrink-0 mt-0.5"
    />
    <div>
      <p className="font-bold">Assistente temporariamente indisponível</p>
      <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
        {erro?.mensagem || erro || 'O serviço de IA está passando por uma oscilação temporária.'}
      </p>
    </div>
  </div>
);
