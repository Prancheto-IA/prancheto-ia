// =============================================================
// PRANCHETO.IA - WIDGET: MINHAS TAREFAS DE HOJE (EMITLY DESIGN SYSTEM)
// Tarefas pendentes do usuário logado com indicadores visuais de prioridade.
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import WidgetShell from './WidgetShell.jsx';

const COR_PRIORIDADE = {
  baixa: 'bg-slate-300',
  media: 'bg-blue-500',
  alta: 'bg-amber-500',
  critica: 'bg-red-500',
};

const WidgetMinhasTarefas = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore((s) => s.usuario);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario?.tenant_id || !usuario?.id) return;
    let ativo = true;
    const carregar = async () => {
      setCarregando(true);
      const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);
      const fimHoje = new Date(); fimHoje.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('tarefas')
        .select('id, titulo, status, prioridade, data_vencimento, tarefa_atribuicoes!inner(user_id)')
        .eq('tenant_id', usuario.tenant_id)
        .eq('tarefa_atribuicoes.user_id', usuario.id)
        .neq('status', 'concluida')
        .neq('status', 'cancelada')
        .gte('data_vencimento', inicioHoje.toISOString())
        .lte('data_vencimento', fimHoje.toISOString())
        .order('data_vencimento', { ascending: true })
        .limit(6);

      if (!ativo) return;
      if (error) console.error('WidgetMinhasTarefas.carregar:', error);
      setTarefas(data || []);
      setCarregando(false);
    };
    carregar();
    return () => { ativo = false; };
  }, [usuario?.tenant_id, usuario?.id]);

  return (
    <WidgetShell
      titulo="Minhas Tarefas de Hoje"
      icone={
        <svg className="w-4 h-4 text-[#0E382C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      }
      acaoLabel="Ver todas"
      onAcao={() => navigate('/tarefas')}
    >
      {carregando ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tarefas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7]">
          <svg className="w-8 h-8 text-[#15803D]/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs font-bold text-[#15803D]">Todas as tarefas concluídas!</p>
          <p className="text-[11px] text-[#687770] mt-0.5">Nenhuma pendência para a data de hoje.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tarefas.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate('/tarefas')}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-white hover:shadow-xs transition-all cursor-pointer"
            >
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${COR_PRIORIDADE[t.prioridade] || 'bg-slate-400'}`} />
              <p className="text-xs font-semibold text-[#111915] truncate flex-1">{t.titulo}</p>
              <span className="text-[10px] text-[#687770] font-medium uppercase">{t.prioridade}</span>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

export default WidgetMinhasTarefas;
