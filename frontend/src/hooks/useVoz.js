// =============================================================
// PRANCHETO.IA - HOOK DE RECONHECIMENTO DE VOZ (WEB SPEECH API)
// Suporte nativo ao microfone para transcrição em tempo real (pt-BR)
// com detecção de fala ativa e intensidade sonora para o waveform
// =============================================================

import { useState, useRef, useEffect, useCallback } from 'react';

export const useVoz = ({ onResultado, onFinal } = {}) => {
  const [ouvindo, setOuvindo] = useState(false);
  const [falando, setFalando] = useState(false);
  const [volume, setVolume] = useState(0.08);
  const [suportado, setSuportado] = useState(false);
  const [erro, setErro] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  // Mantém referências atualizadas aos callbacks sem reiniciar o reconhecimento a cada re-render
  const onResultadoRef = useRef(onResultado);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onResultadoRef.current = onResultado;
    onFinalRef.current = onFinal;
  }, [onResultado, onFinal]);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setSuportado(false);
      return;
    }

    setSuportado(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';

    recognition.onstart = () => {
      setOuvindo(true);
      setFalando(false);
      setVolume(0.08);
      setErro(null);
    };

    // Detecção nativa de som/voz humana entrando no microfone
    recognition.onsoundstart = () => {
      setFalando(true);
      setVolume(0.85);
    };

    recognition.onspeechstart = () => {
      setFalando(true);
      setVolume(1.0);
    };

    recognition.onsoundend = () => {
      setFalando(false);
      setVolume(0.08);
    };

    recognition.onspeechend = () => {
      setFalando(false);
      setVolume(0.08);
    };

    recognition.onresult = (event) => {
      let textoIntermediario = '';
      let textoFinal = '';

      // Áudio ativo detectado: impulsiona a amplitude da onda sonora
      setFalando(true);
      setVolume(1.0);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(() => {
        setFalando(false);
        setVolume(0.08);
      }, 750);

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        const transcript = resultado[0]?.transcript || '';
        if (resultado.isFinal) {
          textoFinal += transcript;
        } else {
          textoIntermediario += transcript;
        }
      }

      const textoAtual = (textoFinal || textoIntermediario).trim();
      if (textoAtual) {
        onResultadoRef.current?.(textoAtual);
      }
      if (textoFinal) {
        onFinalRef.current?.(textoFinal.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn('useVoz onerror:', event.error);
      if (event.error === 'not-allowed') {
        setErro('Permissão de microfone negada no navegador. Permita o microfone no ícone ao lado da URL.');
      } else if (event.error === 'audio-capture') {
        setErro('Nenhum microfone disponível ou o dispositivo está ocupado por outro aplicativo.');
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Encerramento normal, cancelamento do usuário ou silêncio — NÃO deve exibir mensagem de erro
      } else {
        setErro(`Erro no microfone: ${event.error}`);
      }
      setOuvindo(false);
      setFalando(false);
      setVolume(0.08);
    };

    recognition.onend = () => {
      setOuvindo(false);
      setFalando(false);
      setVolume(0.08);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  const alternarEscuta = useCallback(() => {
    if (!recognitionRef.current) return;

    if (ouvindo) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setOuvindo(false);
      setFalando(false);
      setVolume(0.08);
    } else {
      setErro(null);
      setFalando(false);
      setVolume(0.08);
      try {
        recognitionRef.current.start();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (_) {}
        }, 120);
      }
    }
  }, [ouvindo]);

  const pararEscuta = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setOuvindo(false);
      setFalando(false);
      setVolume(0.08);
    }
  }, []);

  const abortarEscuta = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
      setOuvindo(false);
      setFalando(false);
      setVolume(0.08);
    }
  }, []);

  return {
    ouvindo,
    falando,
    volume,
    suportado,
    erro,
    alternarEscuta,
    pararEscuta,
    abortarEscuta,
  };
};

export default useVoz;
