import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const STATUS_TAREFAS = [
  { slug: 'pendente',     label: 'Pendente',     cor: '#94a3b8' },
  { slug: 'em_andamento', label: 'Em andamento',  cor: '#3b82f6' },
  { slug: 'em_revisao',   label: 'Em revisão',    cor: '#f59e0b' },
  { slug: 'concluida',    label: 'Concluída',     cor: '#10b981' },
  { slug: 'cancelada',    label: 'Cancelada',     cor: '#ef4444' },
];

export const PRIORIDADES = [
  { slug: 'baixa',   label: 'Baixa',   cor: '#94a3b8', icone: '↓' },
  { slug: 'media',   label: 'Média',   cor: '#3b82f6', icone: '→' },
  { slug: 'alta',    label: 'Alta',    cor: '#f59e0b', icone: '↑' },
  { slug: 'critica', label: 'Crítica', cor: '#ef4444', icone: '⚡' },
];

export const useTarefas = (filtros = {}) => {
  const usuario = useAuthStore(s => s.usuario);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      let query = supabase
        .from('tarefas')
        .select(`
          *,
          tarefa_checklist(id, texto, concluido, ordem),
          tarefa_atribuicoes(user_id)
        `)
        .eq('tenant_id', tenantId)
        .order('criado_em', { ascending: false });

      if (filtros.timeId) query = query.eq('time_id', filtros.timeId);
      if (filtros.projetoId) query = query.eq('projeto_id', filtros.projetoId);
      if (filtros.status) query = query.eq('status', filtros.status);
      if (filtros.atribuidoA) {
        // Filtra por atribuição via subquery não suportada diretamente — carrega tudo e filtra
      }

      const { data, error } = await query;
      if (error) throw error;

      let resultado = data || [];
      if (filtros.atribuidoA) {
        resultado = resultado.filter(t =>
          t.tarefa_atribuicoes?.some(a => a.user_id === filtros.atribuidoA)
        );
      }

      setTarefas(resultado);
    } catch (err) {
      console.error('useTarefas.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, filtros.timeId, filtros.projetoId, filtros.status, filtros.atribuidoA]);

  useEffect(() => { carregar(); }, [carregar]);

  const criarTarefa = async (dados) => {
    const { data, error } = await supabase
      .from('tarefas')
      .insert({ ...dados, tenant_id: tenantId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarTarefa = async (id, dados) => {
    const { error } = await supabase.from('tarefas').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirTarefa = async (id) => {
    const { error } = await supabase.from('tarefas').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const adicionarChecklist = async (tarefaId, texto) => {
    const { error } = await supabase
      .from('tarefa_checklist')
      .insert({ tarefa_id: tarefaId, texto });
    if (error) throw error;
    await carregar();
  };

  const toggleChecklist = async (itemId, concluido) => {
    const { error } = await supabase
      .from('tarefa_checklist')
      .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
      .eq('id', itemId);
    if (error) throw error;
    await carregar();
  };

  const excluirChecklist = async (itemId) => {
    const { error } = await supabase.from('tarefa_checklist').delete().eq('id', itemId);
    if (error) throw error;
    await carregar();
  };

  const atribuirUsuario = async (tarefaId, userId) => {
    const { error } = await supabase
      .from('tarefa_atribuicoes')
      .upsert({ tarefa_id: tarefaId, user_id: userId }, { onConflict: 'tarefa_id,user_id' });
    if (error) throw error;
    await carregar();
  };

  const removerAtribuicao = async (tarefaId, userId) => {
    const { error } = await supabase
      .from('tarefa_atribuicoes')
      .delete()
      .eq('tarefa_id', tarefaId)
      .eq('user_id', userId);
    if (error) throw error;
    await carregar();
  };

  // Agrupa tarefas por status para kanban
  const kanban = STATUS_TAREFAS.reduce((acc, s) => {
    acc[s.slug] = tarefas.filter(t => t.status === s.slug);
    return acc;
  }, {});

  return {
    tarefas,
    kanban,
    carregando,
    carregar,
    criarTarefa,
    atualizarTarefa,
    excluirTarefa,
    adicionarChecklist,
    toggleChecklist,
    excluirChecklist,
    atribuirUsuario,
    removerAtribuicao,
  };
};
