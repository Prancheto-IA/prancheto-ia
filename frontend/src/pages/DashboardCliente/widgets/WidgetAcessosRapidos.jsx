// =============================================================
// PRANCHETO.IA - WIDGET: ACESSOS RÁPIDOS (EMITLY DESIGN SYSTEM)
// Atalhos diretos com ícones de vetor limpos e botões de toque suave.
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetShell from './WidgetShell.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserMultiple02Icon,
  Analytics01Icon,
  Calendar03Icon,
  Settings02Icon,
  FlashIcon,
} from '@hugeicons/core-free-icons';

const ATALHOS = [
  {
    label: 'CRM Leads',
    rota: '/crm/leads',
    icone: <HugeiconsIcon icon={UserMultiple02Icon} size={20} strokeWidth={1.8} className="text-[#0E382C]" />,
  },
  {
    label: 'Relatórios',
    rota: '/dashboard/relatorios',
    icone: <HugeiconsIcon icon={Analytics01Icon} size={20} strokeWidth={1.8} className="text-[#0E382C]" />,
  },
  {
    label: 'Agenda',
    rota: '/dashboard/agenda',
    icone: <HugeiconsIcon icon={Calendar03Icon} size={20} strokeWidth={1.8} className="text-[#0E382C]" />,
  },
  {
    label: 'Configurações',
    rota: '/dashboard/configuracoes',
    icone: <HugeiconsIcon icon={Settings02Icon} size={20} strokeWidth={1.8} className="text-[#0E382C]" />,
  },
];

const WidgetAcessosRapidos = () => {
  const navigate = useNavigate();

  return (
    <WidgetShell
      titulo="Acessos Rápidos"
      icone={<HugeiconsIcon icon={FlashIcon} size={16} strokeWidth={1.8} className="text-[#0E382C]" />}
    >
      <div className="grid grid-cols-2 gap-2">
        {ATALHOS.map((a) => (
          <button
            key={a.rota}
            onClick={() => navigate(a.rota)}
            className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-[#D4EC9D]/30 hover:border-[#0E382C]/30 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-white border border-[#E4ECE7] shadow-2xs group-hover:scale-105 transition-transform">
              {a.icone}
            </div>
            <span className="text-[11px] font-semibold text-[#111915]">{a.label}</span>
          </button>
        ))}
      </div>
    </WidgetShell>
  );
};

export default WidgetAcessosRapidos;
