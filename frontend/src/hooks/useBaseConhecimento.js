// =============================================================
// PRANCHETO.IA - HOOK: useBaseConhecimento
// Camada de acesso a dados da Base de Conhecimento do Suporte.
// Escopo por tenant_id (padrão dos demais módulos).
// =============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useBaseConhecimento = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [categorias, setCategorias] = useState([]);
  const [artigos, setArtigos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async () => {
    if (!tenantId) return;
    setCarregando(true);
    try {
      const [resCategorias, resArtigos] = await Promise.all([
        supabase
          .from('suporte_kb_categorias')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('ordem', { ascending: true }),
        supabase
          .from('suporte_kb_artigos')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('criado_em', { ascending: false }),
      ]);
      if (resCategorias.error) throw resCategorias.error;
      if (resArtigos.error) throw resArtigos.error;
      setCategorias(resCategorias.data || []);
      setArtigos(resArtigos.data || []);
    } catch (err) {
      console.error('useBaseConhecimento.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  useEffect(() => { carregar(); }, [carregar]);

  const criarCategoria = async (dados) => {
    const { data, error } = await supabase
      .from('suporte_kb_categorias')
      .insert({ ...dados, tenant_id: tenantId })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const excluirCategoria = async (id) => {
    const { error } = await supabase.from('suporte_kb_categorias').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const criarArtigo = async (dados) => {
    const { data, error } = await supabase
      .from('suporte_kb_artigos')
      .insert({ ...dados, tenant_id: tenantId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    await carregar();
    return data;
  };

  const atualizarArtigo = async (id, dados) => {
    const { error } = await supabase.from('suporte_kb_artigos').update(dados).eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const excluirArtigo = async (id) => {
    const { error } = await supabase.from('suporte_kb_artigos').delete().eq('id', id);
    if (error) throw error;
    await carregar();
  };

  const registrarVisualizacao = async (artigo) => {
    const { error } = await supabase
      .from('suporte_kb_artigos')
      .update({ visualizacoes: (artigo.visualizacoes || 0) + 1 })
      .eq('id', artigo.id);
    if (error) console.error('useBaseConhecimento.registrarVisualizacao:', error);
  };

  return {
    categorias,
    artigos,
    carregando,
    carregar,
    criarCategoria,
    excluirCategoria,
    criarArtigo,
    atualizarArtigo,
    excluirArtigo,
    registrarVisualizacao,
  };
};
