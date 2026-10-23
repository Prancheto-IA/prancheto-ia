// =============================================================
// PRANCHETO.IA - WIDGET: MINI AGENDA (EMITLY DESIGN SYSTEM)
// Próximos compromissos da agenda em cartões pasteis limpos.
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import WidgetShell from './WidgetShell.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon } from '@hugeicons/core-free-icons';

const formatarData = (iso) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

const WidgetMiniAgenda = () => {
  const navigate = useNavigate();
  const tenantId = useAuthStore((s) => s.usuario?.tenant_id);
  const [eventos, setEventos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      const hoje = new Date();
      const fimSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('agenda_eventos')
        .select('id, titulo, tipo, data_inicio, cor')
        .eq('tenant_id', tenantId)
        .gte('data_inicio', hoje.toISOString())
        .lte('data_inicio', fimSemana)
        .order('data_inicio', { ascending: true })
        .limit(5);
      if (!ativo) return;
      if (error) console.error('WidgetMiniAgenda.carregar:', error);
      setEventos(data || []);
      setCarregando(false);
    };
    carregar();
    return () => { ativo = false; };
  }, [tenantId]);

  return (
    <WidgetShell
      titulo="Próximos Compromissos"
      icone={<HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={1.8} className="text-[#0E382C]" />}
      acaoLabel="Ver agenda"
      onAcao={() => navigate('/dashboard/agenda')}
    >
      {carregando ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : eventos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7]">
          <HugeiconsIcon icon={Calendar03Icon} size={32} strokeWidth={1.5} className="text-[#687770]/50 mb-2" />
          <p className="text-xs font-semibold text-[#687770]">Nenhum compromisso nos próximos 7 dias.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eventos.map((e) => (
            <div
              key={e.id}
              onClick={() => navigate('/dashboard/agenda')}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor || '#0E382C' }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#111915] truncate">{e.titulo}</p>
                <p className="text-[11px] text-[#687770] capitalize">{formatarData(e.data_inicio)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

export default WidgetMiniAgenda;
