import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown, Pipette, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================
// UTILITÁRIOS DE CONVERSÃO DE COR (HEX <-> HSV)
// =============================================================
function hexToHsv(hex) {
  if (!hex || typeof hex !== 'string') return { h: 0, s: 0, v: 0 };
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return { h: 0, s: 0, v: 0 };
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }

  return {
    h: Math.round(h) % 360,
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

function hsvToHex(h, s, v) {
  const normS = Math.max(0, Math.min(100, s)) / 100;
  const normV = Math.max(0, Math.min(100, v)) / 100;
  const normH = ((h % 360) + 360) % 360;

  const c = normV * normS;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = normV - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (normH >= 0 && normH < 60) {
    r = c; g = x; b = 0;
  } else if (normH >= 60 && normH < 120) {
    r = x; g = c; b = 0;
  } else if (normH >= 120 && normH < 180) {
    r = 0; g = c; b = x;
  } else if (normH >= 180 && normH < 240) {
    r = 0; g = x; b = c;
  } else if (normH >= 240 && normH < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const AMOSTRAS_PADRAO = [
  '#000D3D',
  '#0455BF',
  '#7338F2',
  '#A36BF2',
  '#D8E8F2',
  '#10B981',
  '#064E3B',
  '#F59E0B',
  '#EF4444',
  '#18181B',
];

// =============================================================
// COMPONENTE: ÁREA DE SATURAÇÃO E BRILHO (2D PICKER)
// =============================================================
const SaturationArea = ({ hsv, onChange }) => {
  const areaRef = useRef(null);
  const isDragging = useRef(false);

  const handlePointer = useCallback(
    (e) => {
      if (!areaRef.current) return;
      const rect = areaRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const newS = Math.round((x / rect.width) * 100);
      const newV = Math.round((1 - y / rect.height) * 100);

      onChange({ ...hsv, s: newS, v: newV });
    },
    [hsv, onChange]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    handlePointer(e);

    const onPointerMove = (ev) => {
      if (!isDragging.current) return;
      handlePointer(ev);
    };

    const onPointerUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
  };

  return (
    <div
      ref={areaRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className="relative w-full h-36 rounded-xl overflow-hidden cursor-crosshair select-none border border-surface-border shadow-inner"
      style={{
        backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
      }}
    >
      {/* Gradiente Branco -> Transparente (Saturação horizontal) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to right, #FFFFFF, transparent)',
        }}
      />
      {/* Gradiente Transparente -> Preto (Brilho vertical) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, #000000, transparent)',
        }}
      />

      {/* Marcador do Ponto Atual */}
      <div
        className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/40"
        style={{
          left: `${hsv.s}%`,
          top: `${100 - hsv.v}%`,
          backgroundColor: hsvToHex(hsv.h, hsv.s, hsv.v),
        }}
      />
    </div>
  );
};

// =============================================================
// COMPONENTE: BARRA DESLIZANTE DE MATIZ (HUE SLIDER)
// =============================================================
const HueSlider = ({ hsv, onChange }) => {
  const barRef = useRef(null);
  const isDragging = useRef(false);

  const handlePointer = useCallback(
    (e) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newH = Math.round((x / rect.width) * 360) % 360;

      onChange({ ...hsv, h: newH });
    },
    [hsv, onChange]
  );

  const handlePointerDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    handlePointer(e);

    const onPointerMove = (ev) => {
      if (!isDragging.current) return;
      handlePointer(ev);
    };

    const onPointerUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove);
    window.addEventListener('touchend', onPointerUp);
  };

  return (
    <div
      ref={barRef}
      onMouseDown={handlePointerDown}
      onTouchStart={handlePointerDown}
      className="relative w-full h-3.5 rounded-full cursor-pointer select-none border border-surface-border shadow-2xs"
      style={{
        background:
          'linear-gradient(to right, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)',
      }}
    >
      <div
        className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/40"
        style={{
          left: `${(hsv.h / 360) * 100}%`,
          backgroundColor: `hsl(${hsv.h}, 100%, 50%)`,
        }}
      />
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: COLOR PICKER
// =============================================================
export const ColorPicker = ({
  id,
  value,
  defaultValue = '#000000',
  onChange,
  onValueChange,
  disabled = false,
  className,
  swatches = AMOSTRAS_PADRAO,
  placeholder = '#000000',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) => {
  const isControlled = value !== undefined;
  const [internalColor, setInternalColor] = useState(value || defaultValue);
  const [inputText, setInputText] = useState(value || defaultValue);
  const [copiado, setCopiado] = useState(false);
  const [aberto, setAberto] = useState(false);

  const corAtual = (isControlled ? value : internalColor) || defaultValue;
  const hsv = hexToHsv(corAtual);

  useEffect(() => {
    if (isControlled && value) {
      setInputText(value.toUpperCase());
    }
  }, [isControlled, value]);

  const emitirMudanca = useCallback(
    (novoHex) => {
      const formatado = novoHex.toUpperCase();
      if (!isControlled) {
        setInternalColor(formatado);
      }
      setInputText(formatado);
      if (onChange) onChange(formatado);
      if (onValueChange) onValueChange(formatado);
    },
    [isControlled, onChange, onValueChange]
  );

  const handleHsvChange = useCallback(
    (novoHsv) => {
      const hex = hsvToHex(novoHsv.h, novoHsv.s, novoHsv.v);
      emitirMudanca(hex);
    },
    [emitirMudanca]
  );

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase();
    setInputText(val);
    const clean = val.replace(/^#/, '');
    if (/^[0-9A-F]{6}$/i.test(clean) || /^[0-9A-F]{3}$/i.test(clean)) {
      emitirMudanca(`#${clean}`);
    }
  };

  const handleInputBlur = () => {
    const clean = inputText.replace(/^#/, '');
    if (/^[0-9A-F]{6}$/i.test(clean) || /^[0-9A-F]{3}$/i.test(clean)) {
      emitirMudanca(`#${clean}`);
    } else {
      setInputText(corAtual.toUpperCase());
    }
  };

  const copiarHex = async () => {
    try {
      await navigator.clipboard.writeText(corAtual.toUpperCase());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Ignorar falha de clipboard silenciosamente
    }
  };

  const usarContaGotas = async () => {
    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const resultado = await eyeDropper.open();
        if (resultado?.sRGBHex) {
          emitirMudanca(resultado.sRGBHex.toUpperCase());
        }
      } catch {
        // Cancelado pelo usuário
      }
    }
  };

  const temContaGotas = typeof window !== 'undefined' && 'EyeDropper' in window;

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          className={cn(
            'flex items-center justify-between w-full h-10 px-3 py-2 text-sm rounded-xl',
            'border border-surface-border bg-surface-subtle hover:bg-surface-hover hover:border-surface-border-strong',
            'text-ink-primary shadow-2xs transition-all outline-none',
            'focus:border-brand-primary focus:bg-surface-card focus:ring-2 focus:ring-brand-accent/50 cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Amostra / Swatch */}
            <span
              className="w-5 h-5 rounded-md border border-black/15 shadow-2xs flex-shrink-0"
              style={{ backgroundColor: corAtual }}
            />
            {/* Valor Hex */}
            <span className="font-mono text-xs font-semibold text-ink-primary truncate tracking-wider">
              {corAtual?.toUpperCase() || placeholder}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-ink-secondary opacity-70 flex-shrink-0 ml-2" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-3.5 space-y-3.5 bg-surface-card border border-surface-border rounded-2xl shadow-xl z-[120]"
      >
        {/* 1. Área 2D Saturação & Brilho */}
        <SaturationArea hsv={hsv} onChange={handleHsvChange} />

        {/* 2. Barra de Matiz (Hue) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-semibold text-ink-secondary uppercase tracking-wider">
            <span>Matiz</span>
            <span className="font-mono">{hsv.h}°</span>
          </div>
          <HueSlider hsv={hsv} onChange={handleHsvChange} />
        </div>

        {/* 3. Linha de Ações: Conta-gotas, Input HEX e Botão Copiar */}
        <div className="flex items-center gap-2 pt-1 border-t border-surface-border">
          {temContaGotas && (
            <button
              type="button"
              onClick={usarContaGotas}
              title="Conta-gotas (capturar cor da tela)"
              className="w-8 h-8 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer shadow-2xs flex-shrink-0"
            >
              <Pipette className="w-4 h-4" />
            </button>
          )}

          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              maxLength={7}
              placeholder="#000000"
              className="w-full h-8 px-2.5 font-mono text-xs font-bold uppercase rounded-lg border border-surface-border bg-surface-subtle text-ink-primary focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-colors shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={copiarHex}
            title={copiado ? 'Copiado!' : 'Copiar código HEX'}
            className="w-8 h-8 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover flex items-center justify-center text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer shadow-2xs flex-shrink-0"
          >
            {copiado ? (
              <Check className="w-4 h-4 text-emerald-600 animate-fade-in" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 4. Amostras Rápidas (Swatches) */}
        {swatches && swatches.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-surface-border">
            <span className="text-[10px] font-semibold text-ink-secondary uppercase tracking-wider block">
              Cores Rápidas
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {swatches.map((amostra, idx) => (
                <button
                  key={`${idx}-${amostra}`}
                  type="button"
                  onClick={() => emitirMudanca(amostra)}
                  title={amostra}
                  className={cn(
                    'w-5 h-5 rounded-md border border-black/15 shadow-2xs transition-transform hover:scale-115 cursor-pointer',
                    corAtual.toUpperCase() === amostra.toUpperCase() &&
                      'ring-2 ring-brand-primary ring-offset-1 scale-110'
                  )}
                  style={{ backgroundColor: amostra }}
                />
              ))}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;

