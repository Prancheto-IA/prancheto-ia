// =============================================================
// PRANCHETO.IA - WIDGET: LEADS QUENTES (EMITLY DESIGN SYSTEM)
// Lista de leads de alto valor com pontuação e badges coloridas.
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { formatarMoeda } from '../../../hooks/useCRM.js';
import WidgetShell from './WidgetShell.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { FireIcon } from '@hugeicons/core-free-icons';

const WidgetLeadsQuentes = () => {
  const navigate = useNavigate();
  const tenantId = useAuthStore((s) => s.usuario?.tenant_id);
  const [leads, setLeads] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      const { data, error } = await supabase
        .from('crm_contatos')
        .select('id, nome, empresa, score, valor_estimado')
        .eq('tenant_id', tenantId)
        .eq('tipo_registro', 'lead')
        .gte('score', 70)
        .order('score', { ascending: false })
        .limit(5);
      if (!ativo) return;
      if (error) console.error('WidgetLeadsQuentes.carregar:', error);
      setLeads(data || []);
      setCarregando(false);
    };
    carregar();
    return () => { ativo = false; };
  }, [tenantId]);

  return (
    <WidgetShell
      titulo="Leads Quentes"
      icone={<HugeiconsIcon icon={FireIcon} size={16} strokeWidth={1.8} className="text-brand-primary dark:text-[#7DD3FC]" />}
      acaoLabel="Ver no CRM"
      onAcao={() => navigate('/crm/leads')}
    >
      {carregando ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <p className="text-sm text-ink-secondary text-center py-6">Nenhum lead com score ≥ 70 no momento.</p>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => (
            <div
              key={l.id}
              onClick={() => navigate('/crm/leads')}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-primary truncate">{l.nome}</p>
                {l.empresa && <p className="text-[11px] text-ink-secondary truncate">{l.empresa}</p>}
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/25">
                  Score {l.score}
                </span>
                {l.valor_estimado ? (
                  <span className="text-sm font-bold text-ink-primary">{formatarMoeda(l.valor_estimado)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

export default WidgetLeadsQuentes;
