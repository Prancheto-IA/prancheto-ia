import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export const useChat = () => {
  const usuario = useAuthStore(s => s.usuario);
  const [canais, setCanais] = useState([]);
  const [canalAtivo, setCanalAtivo] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [membros, setMembros] = useState([]);
  const [usuariosTenant, setUsuariosTenant] = useState([]);
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
          chat_membros!inner(user_id, papel, ultimo_lido_em, silenciado)
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

  // Lista de pessoas do tenant, pra montar grupos/DMs novas
  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from('users')
      .select('id, nome, email')
      .eq('tenant_id', tenantId)
      .order('nome')
      .then(({ data, error }) => {
        if (error) { console.error('useChat.usuariosTenant:', error); return; }
        setUsuariosTenant(data || []);
      });
  }, [tenantId]);

  // Carrega os membros do canal — nome do autor de cada mensagem é
  // resolvido a partir daqui na UI (evita join/lookup extra em cada
  // mensagem recebida via realtime, que não traz join nenhum).
  const carregarMembros = useCallback(async (canalId) => {
    try {
      const { data, error } = await supabase
        .from('chat_membros')
        .select('id, user_id, papel, usuario:users(id, nome, email)')
        .eq('canal_id', canalId)
        .order('criado_em', { ascending: true });
      if (error) throw error;
      setMembros(data || []);
    } catch (err) {
      console.error('useChat.carregarMembros:', err);
      setMembros([]);
    }
  }, []);

  // Carrega mensagens de um canal e assina realtime
  const abrirCanal = useCallback(async (canal) => {
    setCanalAtivo(canal);
    setCarregandoMensagens(true);
    setMensagens([]);
    setMembros([]);

    // Cancela subscription anterior
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    try {
      const [{ data, error }] = await Promise.all([
        supabase
          .from('chat_mensagens')
          .select('*')
          .eq('canal_id', canal.id)
          .is('deletado_em', null)
          .order('criado_em', { ascending: true })
          .limit(100),
        carregarMembros(canal.id),
      ]);

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
  }, [usuario?.id, carregarMembros]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  // Por enquanto só texto — tipo fixo, sem parâmetro variável.
  const enviarMensagem = async (conteudo, respostaId = null) => {
    if (!canalAtivo || !conteudo.trim()) return;
    setEnviando(true);
    try {
      const { error } = await supabase
        .from('chat_mensagens')
        .insert({
          canal_id: canalAtivo.id,
          autor_id: usuario?.id,
          conteudo: conteudo.trim(),
          tipo: 'texto',
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

  // Criação atômica via RPC — corrige o bug de origem do Chat: o insert
  // direto em chat_canais seguido de insert em chat_membros deixava uma
  // janela em que a RLS de SELECT de chat_canais (exige associação em
  // chat_membros) escondia a linha recém-criada do próprio RETURNING,
  // estourando erro antes do insert de membresia sequer rodar. A função
  // criar_canal_chat (SECURITY DEFINER) faz os dois inserts na mesma
  // transação e já volta a linha certa.
  const criarCanal = async ({ nome = null, tipo = 'grupo', descricao = null, icone = '💬', membrosIniciais = [] } = {}) => {
    const { data, error } = await supabase.rpc('criar_canal_chat', {
      p_nome: nome,
      p_tipo: tipo,
      p_descricao: descricao,
      p_icone: icone,
      p_membros_iniciais: membrosIniciais,
    });
    if (error) throw error;
    await carregarCanais();
    return data;
  };

  const adicionarMembro = async (canalId, userId) => {
    const { error } = await supabase
      .from('chat_membros')
      .upsert({ canal_id: canalId, user_id: userId, papel: 'membro' }, { onConflict: 'canal_id,user_id' });
    if (error) throw error;
    if (canalAtivo?.id === canalId) await carregarMembros(canalId);
    await carregarCanais();
  };

  const removerMembro = async (canalId, userId) => {
    const { error } = await supabase
      .from('chat_membros')
      .delete()
      .eq('canal_id', canalId)
      .eq('user_id', userId);
    if (error) throw error;
    if (canalAtivo?.id === canalId) await carregarMembros(canalId);
  };

  const promoverAdmin = async (canalId, userId) => {
    const { error } = await supabase.rpc('definir_papel_chat', {
      p_canal_id: canalId, p_user_id: userId, p_papel: 'admin',
    });
    if (error) throw error;
    await carregarMembros(canalId);
  };

  const rebaixarMembro = async (canalId, userId) => {
    const { error } = await supabase.rpc('definir_papel_chat', {
      p_canal_id: canalId, p_user_id: userId, p_papel: 'membro',
    });
    if (error) throw error;
    await carregarMembros(canalId);
  };

  const criarCanalDireto = async (outroUserId) => {
    // Verifica se já existe canal direto entre os dois
    const { data: existente } = await supabase
      .from('chat_canais')
      .select('id, chat_membros!inner(user_id)')
      .eq('tipo', 'direto')
      .eq('tenant_id', tenantId);

    const canalExistente = existente?.find(c => {
      const idsMembros = c.chat_membros.map(m => m.user_id);
      return idsMembros.includes(usuario?.id) && idsMembros.includes(outroUserId) && idsMembros.length === 2;
    });

    if (canalExistente) {
      const canal = canais.find(c => c.id === canalExistente.id) || { id: canalExistente.id, tipo: 'direto' };
      await abrirCanal(canal);
      return canalExistente;
    }

    // Cria novo canal direto já com os dois membros, atomicamente
    const canal = await criarCanal({ tipo: 'direto', membrosIniciais: [outroUserId] });
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

  const souAdminDoCanalAtivo = membros.some(m => m.user_id === usuario?.id && m.papel === 'admin');

  return {
    canais,
    canalAtivo,
    mensagens,
    membros,
    usuariosTenant,
    souAdminDoCanalAtivo,
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
    removerMembro,
    promoverAdmin,
    rebaixarMembro,
    criarCanalDireto,
  };
};
