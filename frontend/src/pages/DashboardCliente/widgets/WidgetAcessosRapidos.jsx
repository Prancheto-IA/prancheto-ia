// =============================================================
// PRANCHETO.IA - WIDGET: ACESSOS RÁPIDOS
// Atalhos estáticos — sem consulta ao banco. /crm/leads em vez de /crm
// porque /crm hoje é só um redirect (evita o hop extra).
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetShell from './WidgetShell.jsx';

const ATALHOS = [
  { emoji: '📋', label: 'CRM',            rota: '/crm/leads' },
  { emoji: '📊', label: 'Relatórios',     rota: '/dashboard/relatorios' },
  { emoji: '🗓️', label: 'Agenda',         rota: '/dashboard/agenda' },
  { emoji: '⚙️', label: 'Configurações',  rota: '/dashboard/configuracoes' },
];

const WidgetAcessosRapidos = () => {
  const navigate = useNavigate();

  return (
    <WidgetShell titulo="Acessos Rápidos" emoji="⚡">
      <div className="grid grid-cols-2 gap-2">
        {ATALHOS.map((a) => (
          <button
            key={a.rota}
            onClick={() => navigate(a.rota)}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border hover:border-primary-500/50 hover:bg-primary-500/5 transition-all"
            style={{ borderColor: 'var(--color-surface-border)' }}
          >
            <span className="text-xl">{a.emoji}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{a.label}</span>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
};

export default WidgetAcessosRapidos;
