// =============================================================
// PRANCHETO.IA - CASCA COMUM DOS WIDGETS (EMITLY DESIGN SYSTEM)
// Moldura orgânica moderna com sombra sutil e bordas suaves.
// =============================================================

import React from 'react';

const WidgetShell = ({ titulo, icone, acaoLabel, onAcao, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-[#E4ECE7] p-3.5 sm:p-4 flex flex-col h-full shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] hover:shadow-md transition-all ${className}`}>
    <div className="flex items-center justify-between mb-2.5 sm:mb-3 flex-shrink-0">
      <h3 className="font-semibold text-xs sm:text-sm text-[#111915] flex items-center gap-2">
        {icone && <span className="p-1 rounded-lg bg-[#F7FAF8] text-[#0E382C] border border-[#E4ECE7] flex-shrink-0">{icone}</span>}
        <span className="truncate">{titulo}</span>
      </h3>
      {acaoLabel && (
        <button onClick={onAcao} className="text-[11px] font-semibold text-[#0E382C] hover:text-[#07261E] hover:underline transition-colors flex-shrink-0 flex items-center gap-1">
          <span>{acaoLabel}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      )}
    </div>
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto pr-0.5">{children}</div>
  </div>
);

export default WidgetShell;
