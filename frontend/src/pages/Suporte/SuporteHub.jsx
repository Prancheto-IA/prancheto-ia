// =============================================================
// PRANCHETO.IA - SUPORTE HUB
// Roteamento interno do módulo Suporte com abas:
//   - Novo Ticket
//   - Meus Tickets
//   - Base de Conhecimento
//   - Status do Sistema
// =============================================================

import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import NovoTicket       from './NovoTicket.jsx';
import MeusTickets      from './MeusTickets.jsx';
import BaseConhecimento from './BaseConhecimento.jsx';
import StatusSistema    from './StatusSistema.jsx';

// ─── Abas de navegação do Suporte ──────────────────────────────
const ABAS = [
  { path: '/suporte/novo',   label: '🎫 Novo Ticket'          },
  { path: '/suporte/meus',   label: '📨 Meus Tickets'         },
  { path: '/suporte/base',   label: '📚 Base de Conhecimento' },
  { path: '/suporte/status', label: '📡 Status do Sistema'    },
];

const NavSuporte = () => (
  <div
    className="border-b flex-shrink-0"
    style={{
      backgroundColor: 'var(--color-surface-card)',
      borderColor: 'var(--color-surface-border)',
    }}
  >
    {/* Header do módulo */}
    <div className="px-4 sm:px-6 pt-4 pb-0">
      <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
        🎧 Suporte
      </h1>
      <p className="text-xs mt-0.5 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Tickets, base de conhecimento e status do sistema
      </p>
    </div>

    {/* Abas */}
    <nav className="flex px-4 sm:px-6 gap-1 overflow-x-auto">
      {ABAS.map(aba => (
        <NavLink
          key={aba.path}
          to={aba.path}
          className={({ isActive }) =>
            `px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              isActive
                ? 'border-primary-500 text-primary-300'
                : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
            }`
          }
        >
          {aba.label}
        </NavLink>
      ))}
    </nav>
  </div>
);

// ─── Suporte Hub ───────────────────────────────────────────────
const SuporteHub = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Navegação por abas */}
      <NavSuporte />

      {/* Conteúdo da aba ativa */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="novo"   element={<NovoTicket />} />
          <Route path="meus"   element={<MeusTickets />} />
          <Route path="base"   element={<BaseConhecimento />} />
          <Route path="status" element={<StatusSistema />} />
          {/* Redireciona /suporte e /suporte/* para a aba inicial */}
          <Route path="*" element={<Navigate to="/suporte/meus" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default SuporteHub;
