// =============================================================
// PRANCHETO.IA - CASCA COMUM DOS WIDGETS (EMITLY DESIGN SYSTEM)
// Moldura orgânica moderna com sombra sutil e bordas suaves.
// =============================================================

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

const WidgetShell = ({ titulo, icone, acaoLabel, onAcao, children, className = '' }) => (
  <div className={`bg-surface-card rounded-2xl border border-surface-border p-3.5 sm:p-4 flex flex-col h-full shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] dark:shadow-[0_4px_20px_-2px_rgba(0,0,0,0.3)] hover:shadow-md transition-all ${className}`}>
    <div className="flex items-center justify-between mb-2.5 sm:mb-3 flex-shrink-0">
      <h3 className="font-semibold text-sm text-ink-primary flex items-center gap-2">
        {icone && <span className="p-1 rounded-lg bg-surface-subtle text-brand-primary dark:text-[#7DD3FC] border border-surface-border flex-shrink-0">{icone}</span>}
        <span className="truncate">{titulo}</span>
      </h3>
      {acaoLabel && (
        <button onClick={onAcao} className="text-[11px] font-semibold text-brand-primary dark:text-[#7DD3FC] hover:underline transition-colors flex-shrink-0 flex items-center gap-1 cursor-pointer">
          <span>{acaoLabel}</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
        </button>
      )}
    </div>
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-0.5">{children}</div>
  </div>
);

export default WidgetShell;
