import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export const LiveWaveform = ({
  active = false,
  falando = false,
  volume = 0.08,
  barWidth = 3,
  barGap = 1.5,
  barRadius = 1.5,
  barColor = '#F43F5E',
  fadeEdges = true,
  fadeWidth = 20,
  height = 36,
  sensitivity = 1.2,
  className,
  ...props
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const gradientCacheRef = useRef(null);
  const lastWidthRef = useRef(0);
  const currentVolumeRef = useRef(0.08);

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  // Redimensionamento responsivo do Canvas com DPI nativo da tela
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      gradientCacheRef.current = null;
      lastWidthRef.current = rect.width;
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Animação reativa de onda sonora vinculada ao áudio recebido
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, rect.width, rect.height);

      if (active) {
        // Interpolação suave do volume (inércia física natural)
        const targetVolume = falando ? Math.max(0.65, volume || 1.0) : 0.08;
        currentVolumeRef.current += (targetVolume - currentVolumeRef.current) * 0.14;
        const curVol = currentVolumeRef.current;

        // Só avança o tempo de fase se houver som/fala ativa ou transição
        if (curVol > 0.1) {
          time += 0.06 * curVol;
        } else {
          time += 0.01;
        }

        const step = barWidth + barGap;
        const barCount = Math.floor(rect.width / step);
        const halfCount = Math.floor(barCount / 2);
        const centerY = rect.height / 2;

        for (let i = 0; i < barCount; i++) {
          const normalizedPosition = (i - halfCount) / (halfCount || 1);
          const centerWeight = 1 - Math.abs(normalizedPosition) * 0.35;

          let barHeight = 3.5;

          if (curVol > 0.12) {
            // Harmônicos de voz humana proporcional à intensidade do áudio recebido
            const wave1 = Math.sin(time * 2.8 + normalizedPosition * 4.2) * 0.38;
            const wave2 = Math.sin(time * 1.4 - normalizedPosition * 2.6) * 0.28;
            const wave3 = Math.cos(time * 4.2 + normalizedPosition * 1.8) * 0.18;
            const waveCombined = Math.max(0.08, (0.3 + wave1 + wave2 + wave3) * centerWeight * sensitivity * curVol);

            barHeight = Math.max(3.5, waveCombined * rect.height * 0.9);
          } else {
            // Em silêncio: linha de repouso estável e plana (como WhatsApp / Siri)
            barHeight = 3.5;
          }

          const x = i * step;
          const y = centerY - barHeight / 2;

          ctx.fillStyle = barColor;
          ctx.globalAlpha = curVol > 0.12 ? 0.45 + (barHeight / rect.height) * 0.55 : 0.35;

          if (barRadius > 0 && ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth, barHeight, barRadius);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // Desvanecimento suave nas bordas laterais
        if (fadeEdges && fadeWidth > 0 && rect.width > 0) {
          if (!gradientCacheRef.current || lastWidthRef.current !== rect.width) {
            const gradient = ctx.createLinearGradient(0, 0, rect.width, 0);
            const fadePercent = Math.min(0.2, fadeWidth / rect.width);

            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(fadePercent, 'rgba(255,255,255,0)');
            gradient.addColorStop(1 - fadePercent, 'rgba(255,255,255,0)');
            gradient.addColorStop(1, 'rgba(255,255,255,1)');

            gradientCacheRef.current = gradient;
            lastWidthRef.current = rect.width;
          }

          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillStyle = gradientCacheRef.current;
          ctx.fillRect(0, 0, rect.width, rect.height);
          ctx.globalCompositeOperation = 'source-over';
        }

        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, falando, volume, barWidth, barGap, barRadius, barColor, fadeEdges, fadeWidth, sensitivity]);

  return (
    <div
      className={cn('relative h-full w-full flex items-center', className)}
      ref={containerRef}
      style={{ height: heightStyle }}
      aria-label={active ? (falando ? 'Gravando voz' : 'Aguardando fala') : 'Onda sonora inativa'}
      role="img"
      {...props}
    >
      <canvas className="block h-full w-full" ref={canvasRef} aria-hidden="true" />
    </div>
  );
};

export default LiveWaveform;
