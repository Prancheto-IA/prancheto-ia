// =============================================================
// PRANCHETO.IA - CHAT COM IA
// Interface de chat conectada ao backend (ai.controller.js).
// =============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';

const MensagemBolha = ({ mensagem }) => {
  const ehUsuario = mensagem.remetente === 'user';
  return (
    <div className={`flex gap-3 ${ehUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1
        ${ehUsuario ? 'bg-primary-600 text-white' : 'bg-slate-700 text-white'}
      `}>
        {ehUsuario ? '👤' : '🤖'}
      </div>

      {/* Bolha */}
      {ehUsuario ? (
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-primary-600 text-white">
          {mensagem.conteudo}
          <p className="text-xs mt-1 text-primary-200">
            {new Date(mensagem.criado_em || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      ) : (
        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed border"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
          {mensagem.conteudo}
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {new Date(mensagem.criado_em || Date.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </div>
  );
};

const Chat = () => {
  const [conversas, setConversas]       = useState([]);
  const [conversaAtual, setConversaAtual] = useState(null);
  const [mensagens, setMensagens]       = useState([]);
  const [texto, setTexto]               = useState('');
  const [carregando, setCarregando]     = useState(false);
  const [enviando, setEnviando]         = useState(false);
  const [erro, setErro]                 = useState(null);
  const fimRef = useRef(null);
  const { usuario } = useAuthStore();

  // Rola para o fim ao receber nova mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Carrega lista de conversas
  const carregarConversas = useCallback(async () => {
    if (!usuario?.id) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', usuario.id)
        .eq('status', 'ativa')
        .order('atualizado_em', { ascending: false });
        
      if (error) throw error;
      setConversas(data || []);
      setErro(null);
    } catch (e) {
      setErro('Não foi possível carregar as conversas.');
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  const abrirConversa = async (conversa) => {
    setConversaAtual(conversa);
    try {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversa.id)
        .order('criado_em', { ascending: true });
        
      if (error) throw error;
      setMensagens(data || []);
    } catch {
      setMensagens([]);
    }
  };

  const novaConversa = async () => {
    if (!usuario?.id) return;
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: usuario.id, titulo: 'Nova conversa', modelo: 'gpt-4o-mini' })
        .select('*')
        .single();
        
      if (error) throw error;
      const nova = data;
      setConversas(prev => [nova, ...prev]);
      setConversaAtual(nova);
      setMensagens([]);
    } catch {
      setErro('Erro ao criar conversa.');
    }
  };

  const enviarMensagem = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando || !usuario?.id) return;

    let idConversa = conversaAtual?.id;

    // Cria conversa se não existir
    if (!idConversa) {
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert({ user_id: usuario.id, titulo: texto.slice(0, 50), modelo: 'gpt-4o-mini' })
          .select('*')
          .single();
          
        if (error) throw error;
        idConversa = data.id;
        setConversaAtual(data);
        setConversas(prev => [data, ...prev]);
      } catch {
        setErro('Erro ao criar conversa.');
        return;
      }
    }

    const msgUsuario = {
      id: `temp-${Date.now()}`,
      remetente: 'user',
      conteudo: texto,
      criado_em: new Date().toISOString(),
    };
    setMensagens(prev => [...prev, msgUsuario]);
    setTexto('');
    setEnviando(true);

    try {
      // Chama a Edge Function para IA
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { conversationId: idConversa, mensagem: msgUsuario.conteudo }
      });
      
      if (error) throw error;
      if (data?.erro) throw new Error(data.erro);

      setMensagens(prev => [
        ...prev.filter(m => m.id !== msgUsuario.id), 
        data.mensagem_usuario,
        data.resposta_ia
      ]);
      
      // Atualiza lista de conversas
      await carregarConversas();
    } catch {
      setMensagens(prev => [...prev.filter(m => m.id !== msgUsuario.id), {
        id: Date.now() + 1,
        remetente: 'assistant',
        conteudo: '⚠️ Erro ao obter resposta. Tente novamente.',
        criado_em: new Date().toISOString(),
      }]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-screen flex">

      {/* Sidebar de conversas */}
      <div className="w-64 border-r border-surface-border bg-surface-card flex flex-col hidden md:flex">
        <div className="p-4 border-b border-surface-border">
          <button
            onClick={novaConversa}
            className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Nova conversa
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {carregando && (
            <p className="text-slate-500 text-xs text-center py-4">Carregando...</p>
          )}
          {!carregando && conversas.length === 0 && (
            <p className="text-slate-500 text-xs text-center py-4">Nenhuma conversa ainda.</p>
          )}
          {conversas.map(c => (
            <button
              key={c.id}
              onClick={() => abrirConversa(c)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                ${conversaAtual?.id === c.id
                  ? 'bg-primary-500/15 text-primary-300'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <p className="truncate font-medium">{c.titulo}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(c.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="h-14 border-b flex items-center px-4 gap-3 flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          <span className="text-xl">🤖</span>
          <div>
            <p className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {conversaAtual?.titulo || 'Chat com IA'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Powered by GPT-4o mini</p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {mensagens.length === 0 && !enviando && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-5xl mb-4">🤖</p>
              <h3 className="font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>Como posso ajudar?</h3>
              <p className="text-sm max-w-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Faça perguntas sobre seu negócio, peça análises, sugestões de vendas ou qualquer outra coisa.
              </p>
            </div>
          )}

          {mensagens.map(msg => (
            <MensagemBolha key={msg.id} mensagem={msg} />
          ))}

          {enviando && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">🤖</div>
              <div className="bg-surface-card border border-surface-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={fimRef} />
        </div>

        {/* Input */}
        <form onSubmit={enviarMensagem} className="p-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--color-surface-border)' }}>
          {erro && (
            <p className="text-red-400 text-xs mb-2">{erro}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Digite sua mensagem..."
              disabled={enviando}
              className="flex-1 rounded-xl px-4 py-3 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl transition-colors"
            >
              ➤
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
