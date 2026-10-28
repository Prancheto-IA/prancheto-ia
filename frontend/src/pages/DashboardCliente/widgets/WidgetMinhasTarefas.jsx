// =============================================================
// PRANCHETO.IA - WIDGET: MINHAS TAREFAS DE HOJE
// Filtra tarefas atribuídas ao usuário atual via tarefa_atribuicoes,
// usando o embedded filter !inner do PostgREST (mesmo padrão já usado em
// pages/Modulos/Dashboard/Dashboard.jsx) — mais eficiente que
// hooks/useTarefas.js, que hoje carrega tudo e filtra atribuição no
// cliente porque não usa esse recurso.
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import WidgetShell from './WidgetShell.jsx';

const COR_PRIORIDADE = { baixa: '#94a3b8', media: '#3b82f6', alta: '#f59e0b', critica: '#ef4444' };

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
    <WidgetShell titulo="Minhas Tarefas de Hoje" emoji="✅" acaoLabel="Ver todas" onAcao={() => navigate('/modulos/tarefas')}>
      {carregando ? (
        <p className="text-xs opacity-40 text-center py-4">Carregando...</p>
      ) : tarefas.length === 0 ? (
        <p className="text-xs opacity-40 text-center py-4">Nenhuma tarefa sua vence hoje 🎉</p>
      ) : (
        <div className="space-y-2">
          {tarefas.map((t) => (
            <div
              key={t.id}
              onClick={() => navigate('/modulos/tarefas')}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COR_PRIORIDADE[t.prioridade] }} />
              <p className="text-sm truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{t.titulo}</p>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
};

export default WidgetMinhasTarefas;
