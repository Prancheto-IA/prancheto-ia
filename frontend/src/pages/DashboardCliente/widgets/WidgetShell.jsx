// =============================================================
// PRANCHETO.IA - CASCA COMUM DOS WIDGETS DA HOME
// Título + emoji + ação opcional ("Ver mais" etc.) + conteúdo do widget.
// =============================================================

import React from 'react';

const WidgetShell = ({ titulo, emoji, acaoLabel, onAcao, children, className = '' }) => (
  <div
    className={`rounded-xl border p-5 flex flex-col h-full ${className}`}
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}
  >
    <div className="flex items-center justify-between mb-3 flex-shrink-0">
      <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
        <span>{emoji}</span> {titulo}
      </h3>
      {acaoLabel && (
        <button onClick={onAcao} className="text-xs opacity-50 hover:opacity-100 transition-opacity flex-shrink-0">
          {acaoLabel} →
        </button>
      )}
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

export default WidgetShell;
