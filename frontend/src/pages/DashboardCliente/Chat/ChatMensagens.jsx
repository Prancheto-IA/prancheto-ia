// =============================================================
// PRANCHETO.IA - PEÇAS DE APRESENTAÇÃO DO CHAT COM IA (EMITLY DESIGN SYSTEM)
// Compartilhado entre a página cheia (Chat.jsx) e o widget flutuante
// (components/ChatIA/PainelChatFlutuante.jsx).
// =============================================================

import React from 'react';
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
  BotIcon,
  Settings02Icon,
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

// ----------------------------------------------------------
// MENSAGEM (BOLHA)
// ----------------------------------------------------------
export const Bolha = ({ mensagem }) => {
  const usuario = useAuthStore((s) => s.usuario);
  const ehUsuario = mensagem.remetente === 'user';
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <div className={`flex gap-2.5 sm:gap-3 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
      {/* Avatar */}
      {ehUsuario ? (
        <div className="w-8 h-8 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center text-xs font-bold shrink-0 shadow-xs mt-0.5">
          {usuario?.nome ? usuario.nome[0].toUpperCase() : 'U'}
        </div>
      ) : (
        <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <HugeiconsIcon icon={BotIcon} size={18} strokeWidth={2} />
        </div>
      )}

      {/* Conteúdo */}
      {ehUsuario ? (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-xs text-xs sm:text-sm leading-relaxed bg-[#0E382C] text-white shadow-2xs">
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-[10px] mt-1.5 text-emerald-200/80 text-right font-medium">{horario(mensagem.criado_em)}</p>
        </div>
      ) : (
        <div className="max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-xs text-xs sm:text-sm leading-relaxed bg-white border border-[#E4ECE7] text-[#111915] shadow-2xs">
          <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
          <p className="text-[10px] mt-1.5 text-[#687770] font-medium">{horario(mensagem.criado_em)}</p>
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
    <div className="flex items-center gap-2 pl-11 text-xs text-[#687770]">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${falhou ? 'text-amber-600 bg-amber-50' : 'text-[#15803D] bg-[#DCF5E4]'}`}>
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
    <div className="ml-11 rounded-2xl border border-emerald-500/30 bg-[#F7FAF8] p-4 shadow-sm max-w-md space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
          <HugeiconsIcon icon={IconComp} size={16} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold text-[#111915]">
            {acao.resumo}
          </p>
          <p className="text-xs text-[#687770] mt-0.5">
            O assistente só grava esta ação após a sua confirmação.
          </p>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onResponder(acao.id, true)}
          disabled={ocupado}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0E382C] hover:bg-[#07261E] text-white transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
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
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E4ECE7] text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8] transition-colors disabled:opacity-50 cursor-pointer"
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
  <div className="mx-4 my-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
    <HugeiconsIcon icon={Alert02Icon} size={18} strokeWidth={2} className="text-amber-600 shrink-0 mt-0.5" />
    <div>
      <p className="font-bold">Assistente temporariamente indisponível</p>
      <p className="text-xs text-amber-800/90 mt-0.5">
        {erro.mensagem} As ações do CRM continuam acessíveis diretamente pelas telas do sistema.
      </p>
    </div>
  </div>
);
