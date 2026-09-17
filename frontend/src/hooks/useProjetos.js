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

// ==============================================================
// PROJETO ÚNICO (tela de detalhe)
//
// Busca apenas o projeto pedido em vez da coleção inteira do tenant —
// a tela de detalhe precisava de useProjetos() + find(p => p.id === id),
// o que carregava todos os projetos só para exibir um.
// ==============================================================
export const useProjeto = (id) => {
  const usuario = useAuthStore(s => s.usuario);
  const [projeto, setProjeto] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId || !id) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('projetos')
        .select(`
          *,
          membros:projeto_membros(id, user_id, papel, usuario:users(id, nome, email)),
          projeto_milestones(id, titulo, descricao, concluido, concluido_em, ordem, data_alvo)
        `)
        .eq('tenant_id', tenantId)
        .eq('id', id)
        .single();
      if (error) throw error;
      setProjeto(data);
    } catch (err) {
      console.error('useProjeto.carregar:', err);
      setProjeto(null);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, id]);

  useEffect(() => { carregar(); }, [carregar]);

  const atualizarProjeto = async (dados) => {
    const { error } = await supabase.from('projetos').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const criarMilestone = async (dados) => {
    const { data, error } = await supabase
      .from('projeto_milestones')
      .insert({ ...dados, projeto_id: id })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const excluirMilestone = async (milestoneId) => {
    const { error } = await supabase.from('projeto_milestones').delete().eq('id', milestoneId);
    if (error) throw error;
    await carregar();
  };

  /**
   * Alterna a conclusão de um milestone e recalcula projeto.progresso a
   * partir da contagem de milestones lida do banco após o toggle, não do
   * array `projeto.projeto_milestones` da closure — que fica desatualizado
   * quando dois toggles acontecem em sequência antes do primeiro re-render,
   * fazendo o segundo salvar um progresso calculado sobre dados velhos.
   */
  const alternarMilestone = async (milestoneId, concluido) => {
    const { error: erroMilestone } = await supabase
      .from('projeto_milestones')
      .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
      .eq('id', milestoneId);
    if (erroMilestone) throw erroMilestone;

    const { data: milestonesAtuais, error: erroLeitura } = await supabase
      .from('projeto_milestones')
      .select('concluido')
      .eq('projeto_id', id);
    if (erroLeitura) throw erroLeitura;

    const total = milestonesAtuais?.length || 0;
    const concluidos = milestonesAtuais?.filter(m => m.concluido).length || 0;
    const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

    const { error: erroProjeto } = await supabase.from('projetos').update({ progresso }).eq('id', id);
    if (erroProjeto) throw erroProjeto;

    await carregar();
  };

  // ========================================================
  // MEMBROS DO PROJETO
  //
  // RLS de projeto_membros só tem policies de select/insert/delete (sem
  // update) — trocar o papel de um membro é feito removendo e recriando
  // a linha, não com um UPDATE que a policy rejeitaria em silêncio.
  // ========================================================

  const adicionarMembro = async (userId, papel = 'membro') => {
    const { error } = await supabase
      .from('projeto_membros')
      .insert({ projeto_id: id, user_id: userId, papel });
    if (error) throw error;
    await carregar();
  };

  const removerMembro = async (membroId) => {
    const { error } = await supabase.from('projeto_membros').delete().eq('id', membroId);
    if (error) throw error;
    await carregar();
  };

  const alterarPapelMembro = async (membro, novoPapel) => {
    const { error: erroRemocao } = await supabase.from('projeto_membros').delete().eq('id', membro.id);
    if (erroRemocao) throw erroRemocao;
    const { error: erroInsercao } = await supabase
      .from('projeto_membros')
      .insert({ projeto_id: id, user_id: membro.user_id, papel: novoPapel });
    if (erroInsercao) throw erroInsercao;
    await carregar();
  };

  return {
    projeto,
    carregando,
    carregar,
    atualizarProjeto,
    criarMilestone,
    excluirMilestone,
    alternarMilestone,
    adicionarMembro,
    removerMembro,
    alterarPapelMembro,
  };
};
