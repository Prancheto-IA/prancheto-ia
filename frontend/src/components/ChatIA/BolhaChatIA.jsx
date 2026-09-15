// =============================================================
// PRANCHETO.IA - BOLINHA FLUTUANTE DO CHAT IA
//
// Arrastável com Pointer Events nativos (mouse/touch/caneta na mesma API,
// via setPointerCapture) — não usa @dnd-kit aqui porque ele é pensado pra
// listas/drop-zones (é o que o modal de personalizar a sidebar usa); uma
// bolinha livre por toda a tela é um pointer-follow mais simples na mão.
//
// Estado (posição/aberta/arrastando) vive em store/chatBubbleStore.js,
// fora do ciclo de vida deste componente — LayoutCliente remonta a cada
// troca de rota (ver App.jsx), então guardar a posição aqui a perderia a
// cada navegação.
// =============================================================

import React, { useCallback, useEffect, useRef } from 'react';
import { useChatBubbleStore } from '../../store/chatBubbleStore.js';
import PainelChatFlutuante from './PainelChatFlutuante.jsx';

const TAMANHO = 56; // px — mesma medida do w-14 h-14 abaixo
const MARGEM = 24; // px de respiro do canto da tela
const LIMIAR_ARRASTE = 4; // px: abaixo disso, é clique — não arraste

const clamp = (valor, min, max) => Math.min(Math.max(valor, min), max);

const BolhaChatIA = () => {
  const posicao      = useChatBubbleStore((s) => s.posicao);
  const arrastando    = useChatBubbleStore((s) => s.arrastando);
  const aberta        = useChatBubbleStore((s) => s.aberta);
  const definirPosicao = useChatBubbleStore((s) => s.definirPosicao);
  const setArrastando  = useChatBubbleStore((s) => s.setArrastando);
  const alternarAberta = useChatBubbleStore((s) => s.alternarAberta);
  const fecharPainel   = useChatBubbleStore((s) => s.fecharPainel);

  const arrasteRef = useRef({ offsetX: 0, offsetY: 0, moveu: false, inicioX: 0, inicioY: 0 });

  // Posição inicial: canto inferior direito, uma vez por sessão.
  useEffect(() => {
    if (posicao) return;
    definirPosicao(
      window.innerWidth - MARGEM - TAMANHO,
      window.innerHeight - MARGEM - TAMANHO
    );
  }, [posicao, definirPosicao]);

  // Mantém a bolinha dentro da tela se a janela for redimensionada.
  useEffect(() => {
    const aoRedimensionar = () => {
      const atual = useChatBubbleStore.getState().posicao;
      if (!atual) return;
      definirPosicao(
        clamp(atual.x, 0, window.innerWidth - TAMANHO),
        clamp(atual.y, 0, window.innerHeight - TAMANHO)
      );
    };
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, [definirPosicao]);

  const aoPressionar = useCallback((e) => {
    if (!posicao) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrasteRef.current = {
      offsetX: e.clientX - posicao.x,
      offsetY: e.clientY - posicao.y,
      moveu: false,
      inicioX: e.clientX,
      inicioY: e.clientY,
    };
    setArrastando(true);
  }, [posicao, setArrastando]);

  const aoMover = useCallback((e) => {
    if (!arrastando) return;
    const { offsetX, offsetY, inicioX, inicioY } = arrasteRef.current;
    if (Math.abs(e.clientX - inicioX) > LIMIAR_ARRASTE || Math.abs(e.clientY - inicioY) > LIMIAR_ARRASTE) {
      arrasteRef.current.moveu = true;
    }
    definirPosicao(
      clamp(e.clientX - offsetX, 0, window.innerWidth - TAMANHO),
      clamp(e.clientY - offsetY, 0, window.innerHeight - TAMANHO)
    );
  }, [arrastando, definirPosicao]);

  const aoSoltar = useCallback((e) => {
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setArrastando(false);
    if (!arrasteRef.current.moveu) {
      alternarAberta();
    }
  }, [setArrastando, alternarAberta]);

  if (!posicao) return null;

  // O painel abre pro lado com mais espaço na tela, sem sair da viewport.
  const abrirParaCima = posicao.y > window.innerHeight / 2;
  const abrirParaEsquerda = posicao.x > window.innerWidth / 2;
  const estiloPainel = {
    ...(abrirParaCima
      ? { bottom: window.innerHeight - posicao.y + 12 }
      : { top: posicao.y + TAMANHO + 12 }),
    ...(abrirParaEsquerda
      ? { right: window.innerWidth - posicao.x - TAMANHO }
      : { left: posicao.x }),
  };

  return (
    <>
      {aberta && <PainelChatFlutuante onFechar={fecharPainel} style={estiloPainel} />}
      <button
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        title="Chat com IA"
        aria-label="Abrir chat com IA"
        className="fixed z-[70] w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 text-white text-2xl shadow-2xl flex items-center justify-center select-none touch-none"
        style={{
          left: posicao.x,
          top: posicao.y,
          cursor: arrastando ? 'grabbing' : 'grab',
        }}
      >
        🤖
      </button>
    </>
  );
};

export default BolhaChatIA;
