// =============================================================
// PRANCHETO.IA - WIDGET: MINHAS TAREFAS DE HOJE (EMITLY DESIGN SYSTEM)
// Tarefas pendentes do usuário logado com indicadores visuais de prioridade.
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import WidgetShell from './WidgetShell.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Task01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

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
      icone={<HugeiconsIcon icon={Task01Icon} size={16} strokeWidth={1.8} className="text-[#0E382C]" />}
      acaoLabel="Ver todas"
      onAcao={() => navigate('/tarefas')}
    >
      {carregando ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tarefas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F7FAF8] rounded-xl border border-[#E4ECE7]">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} strokeWidth={1.5} className="text-[#15803D]/60 mb-2" />
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
