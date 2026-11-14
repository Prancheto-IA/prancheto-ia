// =============================================================
// PRANCHETO.IA - BOTÃO FLUTUANTE DO AGENTE DE IA (PRANCHETINHO)
//
// Botão circular com fundo branco fixo no canto inferior direito,
// contendo a arte estática do Pranchetinho na base, camada SVG
// absoluta com animação CSS (@keyframes) para o piscar das pálpebras
// e botão X no canto superior direito para ocultar e fixar na sidebar.
// =============================================================

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useChatBubbleStore } from '../../store/chatBubbleStore.js';
import PainelChatFlutuante from './PainelChatFlutuante.jsx';
import pranchetinho from '../../assets/mascote/pranchetinho-chat.png';

const ESTILO_PAINEL = {
  bottom: 98, // 24px (margem inferior) + 62px (altura do botão) + 12px (respiro)
  right: 24,
};

const BolhaChatIA = ({ onFixarNaSidebar }) => {
  const aberta = useChatBubbleStore((s) => s.aberta);
  const alternarAberta = useChatBubbleStore((s) => s.alternarAberta);
  const fecharPainel = useChatBubbleStore((s) => s.fecharPainel);

  const handleFixarNaSidebar = (e) => {
    e.stopPropagation();
    fecharPainel();
    onFixarNaSidebar?.();
  };

  return (
    <>
      {aberta && <PainelChatFlutuante onFechar={fecharPainel} style={ESTILO_PAINEL} />}

      {/* 1. Wrapper fixo no canto inferior direito */}
      <div className="botao-flutuante-ia-wrapper">
        {/* Botão X no canto superior direito ao passar o mouse */}
        <button
          type="button"
          onClick={handleFixarNaSidebar}
          title="Ocultar botão flutuante e fixar Chat com IA na sidebar"
          aria-label="Ocultar botão flutuante e fixar Chat com IA na sidebar"
          className="botao-flutuante-ia-fechar"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2.4} />
        </button>

        {/* Container circular com fundo branco e overflow: hidden */}
        <button
          type="button"
          onClick={alternarAberta}
          title="Pranchetinho — Chat com IA"
          aria-label="Abrir chat com o Pranchetinho, assistente de IA"
          aria-expanded={aberta}
          className="botao-flutuante-ia"
        >
          {/* Palco interno mantendo a proporção 1174x948 da arte original */}
          <span className="botao-ia-mascote-palco">
            {/* 2. Imagem estática base do boneco */}
            <img
              src={pranchetinho}
              alt="Pranchetinho"
              draggable={false}
              className="botao-ia-imagem-base"
            />

            {/* 3. SVG absoluto das pálpebras alinhado exatamente sobre os olhos */}
            <svg
              className="botao-ia-palpebras-svg"
              viewBox="0 0 1174 948"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
            >
              <defs>
                {/* Máscara circular exata da região dos olhos para manter a pálpebra contida */}
                <clipPath id="recorte-olhos-pranchetinho">
                  <circle cx="382.5" cy="542.5" r="120.5" />
                  <circle cx="795.5" cy="542.5" r="120.5" />
                </clipPath>
              </defs>

              <g clipPath="url(#recorte-olhos-pranchetinho)">
                <g className="botao-ia-palpebras-grupo">
                  {/* Pálpebra esquerda */}
                  <circle cx="382.5" cy="542.5" r="121" fill="#030C29" />
                  {/* Pálpebra direita */}
                  <circle cx="795.5" cy="542.5" r="121" fill="#030C29" />
                </g>
              </g>
            </svg>
          </span>
        </button>
      </div>
    </>
  );
};

export default BolhaChatIA;
