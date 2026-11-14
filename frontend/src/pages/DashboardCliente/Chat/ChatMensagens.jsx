// =============================================================
// PRANCHETO.IA - PEÇAS DE APRESENTAÇÃO DO CHAT COM IA (EMITLY DESIGN SYSTEM)
// Compartilhado entre a página cheia (Chat.jsx) e o widget flutuante
// (components/ChatIA/PainelChatFlutuante.jsx).
// =============================================================

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore.js';
import { LiveWaveform } from '../../../components/ui/live-waveform.jsx';
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
  BotIcon,
  Settings02Icon,
  Mic01Icon,
  Cancel01Icon,
  SentIcon,
} from '@hugeicons/core-free-icons';

// Rótulo e ícone de cada ferramenta na linha de atividade
export const ROTULO_FERRAMENTA = {
  buscar_contatos:      { icon: Search01Icon, texto: 'Consultou os contatos' },
  detalhar_contato:     { icon: UserIcon, texto: 'Abriu um contato' },
  resumo_funil:         { icon: Analytics01Icon, texto: 'Resumiu o funil de vendas' },
  criar_lead:           { icon: Add01Icon, texto: 'Criou um novo negócio' },
  registrar_interacao:  { icon: Comment01Icon, texto: 'Registrou uma interação' },
  atualizar_contato:    { icon: Edit02Icon, texto: 'Atualizou dados do contato' },
  mover_no_funil:       { icon: ArrowRight01Icon, texto: 'Moveu negócio no funil' },
  converter_em_cliente: { icon: CheckmarkCircle02Icon, texto: 'Converteu lead em cliente' },
};

export const horario = (iso) =>
  new Date(iso || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const SUGESTOES = [
  'Como está meu funil de negócios?',
  'Crie um lead: Joana Prado, da Vertex (joana@vertex.com)',
  'Quais negociações estão em aberto?',
  'Resuma as atividades mais recentes do CRM',
];

export const DicaVoz = () => (
  <div className="flex items-center justify-center gap-1.5 text-xs text-ink-muted pt-2 pb-1">
    <span className="w-5 h-5 rounded-full bg-brand-accent/60 dark:bg-brand-primary/20 flex items-center justify-center text-brand-secondary">
      <HugeiconsIcon icon={Mic01Icon} size={11} strokeWidth={2} />
    </span>
    <span>Dica: você pode clicar no microfone para enviar comandos por voz</span>
  </div>
);

// ----------------------------------------------------------
// WAVEFORM DE ENTRADA POR VOZ (Substitui campo de texto)
// ----------------------------------------------------------
export const EntradaVozWaveform = ({
  texto = '',
  falando = false,
  volume = 0.08,
  onCancelar,
  onEnviar,
  enviando = false,
  barColor = '#F43F5E',
}) => {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSegundos((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutos = Math.floor(segundos / 60).toString().padStart(2, '0');
  const segs = (segundos % 60).toString().padStart(2, '0');
  const tempoFormatado = `${minutos}:${segs}`;

  return (
    <div className="flex-1 flex items-center gap-2 bg-surface-subtle dark:bg-[#0D121F] border border-rose-500/40 dark:border-rose-500/30 rounded-2xl px-3 py-1.5 shadow-2xs min-h-[46px]">
      {/* Indicador pulsante e contador de tempo */}
      <div className="flex items-center gap-1.5 shrink-0 px-1">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs font-semibold tabular-nums text-rose-500 dark:text-rose-400">
          {tempoFormatado}
        </span>
      </div>

      {/* Onda Sonora Viva Reativa */}
      <div className="flex-1 h-8 flex items-center min-w-0 overflow-hidden">
        <LiveWaveform
          active={true}
          falando={falando}
          volume={volume}
          height={32}
          barWidth={3}
          barGap={1.5}
          barRadius={1.5}
          barColor={barColor}
        />
      </div>

      {/* Botão Cancelar */}
      <button
        type="button"
        onClick={onCancelar}
        title="Cancelar gravação de voz"
        aria-label="Cancelar gravação de voz"
        className="p-2 rounded-xl text-ink-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={2} />
      </button>

      {/* Botão Enviar */}
      <button
        type="button"
        onClick={onEnviar}
        disabled={enviando || !texto.trim()}
        title={texto.trim() ? 'Enviar comando por voz' : 'Fale para enviar...'}
        aria-label="Enviar comando por voz"
        className="p-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:opacity-40 text-white transition-all shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed shrink-0"
      >
        <HugeiconsIcon icon={SentIcon} size={18} strokeWidth={2} />
      </button>
    </div>
  );
};

// ----------------------------------------------------------
// MENSAGEM (BOLHA)
// ----------------------------------------------------------
export const Bolha = ({ mensagem }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const ehUsuario = mensagem.remetente === 'user';

  return (
    <div className={`flex gap-2.5 sm:gap-3 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
      {/* Avatar */}
      {ehUsuario ? (
        <div className="w-8 h-8 rounded-xl bg-brand-primary text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-xs mt-0.5">
          {usuario?.nome ? usuario.nome[0].toUpperCase() : 'U'}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-brand-accent text-brand-secondary flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <HugeiconsIcon icon={BotIcon} size={18} strokeWidth={2} />
        </div>
      )}

      {/* Conteúdo */}
      {ehUsuario ? (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs text-sm leading-relaxed bg-brand-primary text-white shadow-2xs">
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-[10px] mt-1.5 text-white/75 text-right font-medium">{horario(mensagem.criado_em)}</p>
        </div>
      ) : (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-xs text-sm leading-relaxed bg-surface-card border border-surface-border text-ink-primary shadow-2xs">
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-[10px] mt-1.5 text-ink-secondary font-medium">{horario(mensagem.criado_em)}</p>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// ATIVIDADE DE FERRAMENTA
// ----------------------------------------------------------
export const LinhaAtividade = ({ ferramenta, falhou }) => {
  const rotulo = ROTULO_FERRAMENTA[ferramenta] || { icon: Settings02Icon, texto: 'Executou uma ação no CRM' };
  const IconComp = rotulo.icon;

  return (
    <div className="flex items-center gap-2 pl-11 text-sm text-ink-secondary">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${falhou ? 'text-amber-600 bg-amber-50 dark:text-[#FBBF24] dark:bg-amber-500/15' : 'text-brand-secondary bg-brand-accent'}`}>
        <HugeiconsIcon icon={falhou ? Alert02Icon : IconComp} size={11} strokeWidth={2} />
      </span>
      <span className="font-medium">{falhou ? `Falhou: ${rotulo.texto.toLowerCase()}` : rotulo.texto}</span>
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
          <p className="text-sm font-bold text-ink-primary">
            {acao.resumo}
          </p>
          <p className="text-sm text-ink-secondary mt-0.5">
            O assistente só grava esta ação após a sua confirmação.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onResponder(acao.id, true)}
          disabled={ocupado}
          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-brand-primary hover:bg-brand-primary-hover text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
          className="px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-surface-card border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
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
  <div className="mx-4 my-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
    <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={2} className="text-amber-600 dark:text-[#FBBF24] shrink-0 mt-0.5" />
    <div>
      <p className="font-bold">Assistente temporariamente indisponível</p>
      <p className="text-sm text-amber-800/90 dark:text-amber-300/90 mt-0.5">
        {erro.mensagem} As ações do CRM continuam acessíveis diretamente pelas telas do sistema.
      </p>
    </div>
  </div>
);
