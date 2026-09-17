// =============================================================
// PRANCHETO.IA - WIDGET: LEADS QUENTES
// score >= 70 é o mesmo limiar de "quente" já usado em
// pages/DashboardCliente/Relatorios/Relatorios.jsx — aqui filtrado no
// servidor (não contado no cliente sobre a tabela inteira, como lá).
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { formatarMoeda } from '../../../hooks/useCRM.js';
import WidgetShell from './WidgetShell.jsx';

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
    <WidgetShell titulo="Leads Quentes" emoji="🔥" acaoLabel="Ver no CRM" onAcao={() => navigate('/crm/leads')}>
      {carregando ? (
        <p className="text-xs opacity-40 text-center py-4">Carregando...</p>
      ) : leads.length === 0 ? (
        <p className="text-xs opacity-40 text-center py-4">Nenhum lead com score ≥ 70 no momento.</p>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => (
            <div
              key={l.id}
              onClick={() => navigate('/crm/leads')}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{l.nome}</p>
                {l.empresa && <p className="text-xs opacity-50 truncate">{l.empresa}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-orange-400">⚡ {l.score}</p>
                {l.valor_estimado ? (
                  <p className="text-xs opacity-40">{formatarMoeda(l.valor_estimado)}</p>
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
