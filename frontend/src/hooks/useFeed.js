import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const TIPOS_POSTAGEM = [
  { slug: 'texto',       label: 'Texto',       icone: '📝' },
  { slug: 'anuncio',     label: 'Anúncio',     icone: '📣' },
  { slug: 'conquista',   label: 'Conquista',   icone: '🏆' },
  { slug: 'atualizacao', label: 'Atualização', icone: '🔄' },
  { slug: 'pergunta',    label: 'Pergunta',    icone: '❓' },
];

export const EMOJIS_REACAO = ['👍', '❤️', '🎉', '😂', '😮', '👏'];

export const useFeed = (timeId = null) => {
  const usuario = useAuthStore(s => s.usuario);
  const [postagens, setPostagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(true);
  const POR_PAGINA = 20;

  const tenantId = usuario?.tenant_id;

  const carregar = useCallback(async (paginaNum = 0) => {
    if (!tenantId) return;
    if (paginaNum === 0) setCarregando(true);
    try {
      let query = supabase
        .from('feed_postagens')
        .select(`
          *,
          feed_reacoes(id, user_id, emoji),
          feed_comentarios(id, autor_id, conteudo, criado_em)
        `)
        .eq('tenant_id', tenantId)
        .order('fixado', { ascending: false })
        .order('criado_em', { ascending: false })
        .range(paginaNum * POR_PAGINA, (paginaNum + 1) * POR_PAGINA - 1);

      if (timeId) query = query.eq('time_id', timeId);
      else query = query.is('time_id', null);

      const { data, error } = await query;
      if (error) throw error;

      const novas = data || [];
      setTemMais(novas.length === POR_PAGINA);

      if (paginaNum === 0) {
        setPostagens(novas);
      } else {
        setPostagens(prev => [...prev, ...novas]);
      }
      setPagina(paginaNum);
    } catch (err) {
      console.error('useFeed.carregar:', err);
    } finally {
      setCarregando(false);
    }
  }, [tenantId, timeId]);

  useEffect(() => { carregar(0); }, [carregar]);

  const carregarMais = () => {
    if (temMais && !carregando) carregar(pagina + 1);
  };

  const publicar = async (dados) => {
    const { data, error } = await supabase
      .from('feed_postagens')
      .insert({
        ...dados,
        tenant_id: tenantId,
        time_id: timeId,
        autor_id: usuario?.id,
      })
      .select()
      .single();
    if (error) throw error;
    await carregar(0);
    return data;
  };

  const editarPostagem = async (id, conteudo) => {
    const { error } = await supabase
      .from('feed_postagens')
      .update({ conteudo, editado_em: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    await carregar(0);
  };

  const excluirPostagem = async (id) => {
    const { error } = await supabase.from('feed_postagens').delete().eq('id', id);
    if (error) throw error;
    setPostagens(prev => prev.filter(p => p.id !== id));
  };

  const reagir = async (postagemId, emoji) => {
    // Toggle: se já reagiu com esse emoji, remove; senão, adiciona
    const postagem = postagens.find(p => p.id === postagemId);
    const jaReagiu = postagem?.feed_reacoes?.some(
      r => r.user_id === usuario?.id && r.emoji === emoji
    );

    if (jaReagiu) {
      const { error } = await supabase
        .from('feed_reacoes')
        .delete()
        .eq('postagem_id', postagemId)
        .eq('user_id', usuario?.id)
        .eq('emoji', emoji);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('feed_reacoes')
        .upsert(
          { postagem_id: postagemId, user_id: usuario?.id, emoji },
          { onConflict: 'postagem_id,user_id,emoji' }
        );
      if (error) throw error;
    }
    await carregar(0);
  };

  const comentar = async (postagemId, conteudo) => {
    const { error } = await supabase
      .from('feed_comentarios')
      .insert({ postagem_id: postagemId, autor_id: usuario?.id, conteudo });
    if (error) throw error;
    await carregar(0);
  };

  const excluirComentario = async (comentarioId) => {
    const { error } = await supabase
      .from('feed_comentarios')
      .delete()
      .eq('id', comentarioId);
    if (error) throw error;
    await carregar(0);
  };

  return {
    postagens,
    carregando,
    temMais,
    carregar,
    carregarMais,
    publicar,
    editarPostagem,
    excluirPostagem,
    reagir,
    comentar,
    excluirComentario,
  };
};
