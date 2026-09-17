// =============================================================
// PRANCHETO.IA - WIDGET: MINI AGENDA
// Reaproveita a mesma janela de "próximos 7 dias" já usada em
// pages/Modulos/Dashboard/Dashboard.jsx (era um protótipo sem hook próprio
// de agenda — a query é copiada daqui, não inventada).
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import WidgetShell from './WidgetShell.jsx';

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
    <WidgetShell titulo="Mini Agenda" emoji="🗓️" acaoLabel="Ver agenda" onAcao={() => navigate('/dashboard/agenda')}>
      {carregando ? (
        <p className="text-xs opacity-40 text-center py-4">Carregando...</p>
      ) : eventos.length === 0 ? (
        <p className="text-xs opacity-40 text-center py-4">Nenhum compromisso nos próximos 7 dias.</p>
      ) : (
        <div className="space-y-2">
          {eventos.map((e) => (
            <div
              key={e.id}
              onClick={() => navigate('/dashboard/agenda')}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: e.cor || '#6366f1' }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{e.titulo}</p>
                <p className="text-xs opacity-50">{formatarData(e.data_inicio)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

export default WidgetMiniAgenda;
