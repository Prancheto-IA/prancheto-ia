import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useProjetos = (timeId = null) => {
  const usuario = useAuthStore(s => s.usuario);
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      let query = supabase
        .from('projetos')
        .select(`
          *,
          projeto_membros(user_id, papel),
          projeto_milestones(id, titulo, concluido, ordem, data_alvo)
        `)
        .eq('tenant_id', tenantId)
        .order('criado_em', { ascending: false });

      if (timeId) query = query.eq('time_id', timeId);

      const { data, error } = await query;
      if (error) throw error;
      setProjetos(data || []);
    } catch (err) {
      console.error('useProjetos.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, timeId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criarProjeto = async (dados) => {
    const { data, error } = await supabase
      .from('projetos')
      .insert({ ...dados, tenant_id: tenantId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarProjeto = async (id, dados) => {
    const { error } = await supabase.from('projetos').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirProjeto = async (id) => {
    const { error } = await supabase.from('projetos').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const criarMilestone = async (projetoId, dados) => {
    const { data, error } = await supabase
      .from('projeto_milestones')
      .insert({ ...dados, projeto_id: projetoId })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarMilestone = async (id, dados) => {
    const { error } = await supabase.from('projeto_milestones').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirMilestone = async (id) => {
    const { error } = await supabase.from('projeto_milestones').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  return {
    projetos,
    carregando,
    carregar,
    criarProjeto,
    atualizarProjeto,
    excluirProjeto,
    criarMilestone,
    atualizarMilestone,
    excluirMilestone,
  };
};
