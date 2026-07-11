import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useChat = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [canais, setCanais] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [carregandoCanais, setCarregandoCanais] = useState(true);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const subscriptionRef = useRef(null);

  const tenantId = usuario?.tenant_id;

  // Carrega lista de canais do usuário
  const carregarCanais = useCallback(async () => {
    if (!tenantId) return;
    setCarregandoCanais(true);
    try {
      const { data, error } = await supabase
        .from('chat_canais')
        .select(`
          *,
          chat_membros!inner(user_id, ultimo_lido_em, silenciado)
        `)
        .eq('chat_membros.user_id', usuario?.id)
        .eq('arquivado', false)
        .order('atualizado_em', { ascending: false });

      if (error) throw error;
      setCanais(data || []);
    } catch (err) {
      console.error('useChat.carregarCanais:', err);
    } finally {
      setCarregandoCanais(false);
    }
  }, [tenantId, usuario?.id]);

  useEffect(() => { carregarCanais(); }, [carregarCanais]);

  // Carrega mensagens de um canal e assina realtime
  const abrirCanal = useCallback(async (canal) => {
    setCanalAtivo(canal);
    setCarregandoMensagens(true);
    setMensagens([]);

    // Cancela subscription anterior
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    try {
      const { data, error } = await supabase
        .from('chat_mensagens')
        .select('*')
        .eq('canal_id', canal.id)
        .is('deletado_em', null)
        .order('criado_em', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMensagens(data || []);

      // Marca como lido
      await supabase
        .from('chat_membros')
        .update({ ultimo_lido_em: new Date().toISOString() })
        .eq('canal_id', canal.id)
        .eq('user_id', usuario?.id);

      // Assina realtime para novas mensagens
      const channel = supabase
        .channel(`chat:${canal.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_mensagens',
            filter: `canal_id=eq.${canal.id}`,
          },
          (payload) => {
            setMensagens(prev => {
              // Evita duplicatas
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        )
        .subscribe();

      subscriptionRef.current = channel;
    } catch (err) {
      console.error('useChat.abrirCanal:', err);
    } finally {
      setCarregandoMensagens(false);
    }
  }, [usuario?.id]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  const enviarMensagem = async (conteudo, tipo = 'texto', respostaId = null) => {
    if (!canalAtivo || !conteudo.trim()) return;
    setEnviando(true);
    try {
      const { error } = await supabase
        .from('chat_mensagens')
        .insert({
          canal_id: canalAtivo.id,
          autor_id: usuario?.id,
          conteudo: conteudo.trim(),
          tipo,
          resposta_id: respostaId,
        });
      if (error) throw error;
    } catch (err) {
      console.error('useChat.enviarMensagem:', err);
      throw err;
    } finally {
      setEnviando(false);
    }
  };

  const editarMensagem = async (mensagemId, novoConteudo) => {
    const { error } = await supabase
      .from('chat_mensagens')
      .update({ conteudo: novoConteudo, editado_em: new Date().toISOString() })
      .eq('id', mensagemId);
    if (error) throw error;
    setMensagens(prev =>
      prev.map(m => m.id === mensagemId ? { ...m, conteudo: novoConteudo, editado_em: new Date().toISOString() } : m)
    );
  };

  const deletarMensagem = async (mensagemId) => {
    const { error } = await supabase
      .from('chat_mensagens')
      .update({ deletado_em: new Date().toISOString() })
      .eq('id', mensagemId);
    if (error) throw error;
    setMensagens(prev => prev.filter(m => m.id !== mensagemId));
  };

  const criarCanal = async (dados) => {
    const { data: canal, error } = await supabase
      .from('chat_canais')
      .insert({ ...dados, tenant_id: tenantId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;

    // Adiciona criador como membro
    await supabase
      .from('chat_membros')
      .insert({ canal_id: canal.id, user_id: usuario?.id });

    await carregarCanais();
    return canal;
  };

  const adicionarMembro = async (canalId, userId) => {
    const { error } = await supabase
      .from('chat_membros')
      .upsert({ canal_id: canalId, user_id: userId }, { onConflict: 'canal_id,user_id' });
    if (error) throw error;
    await carregarCanais();
  };

  const criarCanalDireto = async (outroUserId) => {
    // Verifica se já existe canal direto entre os dois
    const { data: existente } = await supabase
      .from('chat_canais')
      .select('id, chat_membros!inner(user_id)')
      .eq('tipo', 'direto')
      .eq('tenant_id', tenantId);

    const canalExistente = existente?.find(c => {
      const membros = c.chat_membros.map(m => m.user_id);
      return membros.includes(usuario?.id) && membros.includes(outroUserId) && membros.length === 2;
    });

    if (canalExistente) {
      const canal = canais.find(c => c.id === canalExistente.id);
      if (canal) await abrirCanal(canal);
      return canalExistente;
    }

    // Cria novo canal direto
    const canal = await criarCanal({ tipo: 'direto' });
    await adicionarMembro(canal.id, outroUserId);
    await abrirCanal(canal);
    return canal;
  };

  // Conta mensagens não lidas por canal
  const naoLidas = canais.reduce((acc, canal) => {
    const membro = canal.chat_membros?.find(m => m.user_id === usuario?.id);
    if (!membro?.ultimo_lido_em) {
      acc[canal.id] = 99; // nunca leu
    }
    return acc;
  }, {});

  return {
    canais,
    canalAtivo,
    mensagens,
    carregandoCanais,
    carregandoMensagens,
    enviando,
    naoLidas,
    carregarCanais,
    abrirCanal,
    enviarMensagem,
    editarMensagem,
    deletarMensagem,
    criarCanal,
    adicionarMembro,
    criarCanalDireto,
  };
};
