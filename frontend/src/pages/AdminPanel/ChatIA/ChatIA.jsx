// =============================================================
// PRANCHETO.IA - TELA DE CHAT COM IA
// Interface completa de chat integrada ao Painel Admin.
// Acessível apenas pelo Super Admin.
// Sub-componentes visuais estão em ChatIAComponentes.jsx
// =============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }     from 'react-router-dom';
import api                 from '../../../services/api.js';
import { useErrorHandler } from '../../../hooks/useErrorHandler.js';
import {
  BotaoVoltar,
  ItemConversa,
  BolhaMensagem,
  IndicadorDigitando,
  TelaVazia,
} from './ChatIAComponentes.jsx';

// =============================================================
// COMPONENTE PRINCIPAL: PaginaChatIA
// =============================================================
const PaginaChatIA = () => {
  const navigate                      = useNavigate();
  const { tratarErro, tratarSucesso } = useErrorHandler();

  // --- Estado ---
  const [conversas,       setConversas]       = useState([]);
  const [conversaAtiva,   setConversaAtiva]   = useState(null);
  const [mensagemInput,   setMensagemInput]   = useState('');
  const [carregando,      setCarregando]      = useState(false);
  const [carregandoLista, setCarregandoLista] = useState(true);
  const [carregandoChat,  setCarregandoChat]  = useState(false);

  // Refs
  const fimDaListaRef = useRef(null);
  const inputRef      = useRef(null);

  // ----------------------------------------------------------
  // Carrega lista de conversas ao montar
  // ----------------------------------------------------------
  useEffect(() => {
    carregarConversas();
  }, []);

  // ----------------------------------------------------------
  // Rola para o final quando chegam novas mensagens
  // ----------------------------------------------------------
  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversaAtiva?.mensagens, carregando]);

  // ----------------------------------------------------------
  // FUNÇÃO: Carrega lista de conversas da sidebar
  // ----------------------------------------------------------
  const carregarConversas = useCallback(async () => {
    try {
      setCarregandoLista(true);
      const { data } = await api.get('/ai/conversations');
      setConversas(data.conversas || []);
    } catch (erro) {
      tratarErro(erro, 'Erro ao carregar conversas');
    } finally {
      setCarregandoLista(false);
    }
  }, [tratarErro]);

  // ----------------------------------------------------------
  // FUNÇÃO: Seleciona uma conversa e carrega suas mensagens
  // ----------------------------------------------------------
  const selecionarConversa = useCallback(async (conversaId) => {
    if (conversaAtiva?.id === conversaId) return;
    try {
      setCarregandoChat(true);
      const { data } = await api.get(`/ai/conversations/${conversaId}`);
      setConversaAtiva(data.conversa);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (erro) {
      tratarErro(erro, 'Erro ao carregar conversa');
    } finally {
      setCarregandoChat(false);
    }
  }, [conversaAtiva?.id, tratarErro]);

  // ----------------------------------------------------------
  // FUNÇÃO INTERNA: Envia mensagem para a API
  // ----------------------------------------------------------
  const enviarMensagemParaAPI = useCallback(async (conversaId, texto) => {
    setMensagemInput('');
    setCarregando(true);

    // Adiciona mensagem do usuário otimisticamente (UX responsiva)
    const msgTemp = {
      id:        `temp-${Date.now()}`,
      remetente: 'user',
      conteudo:  texto,
      criado_em: new Date().toISOString(),
    };

    setConversaAtiva((prev) => ({
      ...prev,
      mensagens: [...(prev?.mensagens || []), msgTemp],
    }));

    try {
      const { data } = await api.post(`/ai/conversations/${conversaId}/messages`, {
        mensagem: texto,
      });

      // Substitui mensagem temporária pelas reais (usuário + IA)
      setConversaAtiva((prev) => ({
        ...prev,
        mensagens: [
          ...(prev?.mensagens || []).filter((m) => m.id !== msgTemp.id),
          data.mensagem_usuario,
          data.resposta_ia,
        ],
      }));

      // Atualiza sidebar (tokens e título podem ter mudado)
      await carregarConversas();
    } catch (erro) {
      // Desfaz a mensagem temporária em caso de erro
      setConversaAtiva((prev) => ({
        ...prev,
        mensagens: (prev?.mensagens || []).filter((m) => m.id !== msgTemp.id),
      }));
      setMensagemInput(texto); // Restaura o texto para o usuário tentar novamente
      tratarErro(erro, 'Erro ao enviar mensagem');
    } finally {
      setCarregando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [carregarConversas, tratarErro]);

  // ----------------------------------------------------------
  // FUNÇÃO: Cria nova conversa (com prompt inicial opcional)
  // ----------------------------------------------------------
  const criarNovaConversa = useCallback(async (promptInicial = null) => {
    try {
      setCarregando(true);
      const { data } = await api.post('/ai/conversations');
      const nova = { ...data.conversa, mensagens: [] };

      setConversas((prev) => [{ ...nova, total_mensagens: 0, total_tokens: 0 }, ...prev]);
      setConversaAtiva(nova);

      if (promptInicial) {
        await enviarMensagemParaAPI(nova.id, promptInicial);
      } else {
        setCarregando(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (erro) {
      setCarregando(false);
      tratarErro(erro, 'Erro ao criar conversa');
    }
  }, [enviarMensagemParaAPI, tratarErro]);

  // ----------------------------------------------------------
  // FUNÇÃO: Envia mensagem do formulário
  // ----------------------------------------------------------
  const enviarMensagem = useCallback(async (e) => {
    e?.preventDefault();
    const texto = mensagemInput.trim();
    if (!texto || carregando || !conversaAtiva) return;
    await enviarMensagemParaAPI(conversaAtiva.id, texto);
  }, [mensagemInput, carregando, conversaAtiva, enviarMensagemParaAPI]);

  // ----------------------------------------------------------
  // FUNÇÃO: Arquiva uma conversa
  // ----------------------------------------------------------
  const arquivarConversa = useCallback(async (conversaId) => {
    try {
      await api.delete(`/ai/conversations/${conversaId}`);
      setConversas((prev) => prev.filter((c) => c.id !== conversaId));
      if (conversaAtiva?.id === conversaId) setConversaAtiva(null);
      tratarSucesso('Conversa arquivada.');
    } catch (erro) {
      tratarErro(erro, 'Erro ao arquivar conversa');
    }
  }, [conversaAtiva?.id, tratarErro, tratarSucesso]);

  // ----------------------------------------------------------
  // HANDLER: Enter envia, Shift+Enter = nova linha
  // ----------------------------------------------------------
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------
  return (
    <div className="flex flex-col h-screen bg-surface">

      {/* HEADER */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-primary-800 bg-primary-950/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BotaoVoltar onClick={() => navigate('/admin')} />
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="text-white font-semibold text-sm">Chat com IA</span>
            <span className="badge bg-primary-900 text-primary-300 border border-primary-700 text-xs">
              OpenAI
            </span>
          </div>
        </div>
        <button
          onClick={() => criarNovaConversa()}
          disabled={carregando}
          className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Nova Conversa</span>
        </button>
      </header>

      {/* CORPO: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 border-r border-surface-border bg-surface">
          <div className="p-3 border-b border-surface-border">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Conversas
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {carregandoLista ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-lg animate-pulse">
                  <div className="h-3.5 bg-surface-card rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-surface-card rounded w-1/2" />
                </div>
              ))
            ) : conversas.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-slate-500 text-sm">Nenhuma conversa ainda.</p>
                <p className="text-slate-600 text-xs mt-1">Clique em "Nova Conversa" para começar.</p>
              </div>
            ) : (
              conversas.map((conversa) => (
                <ItemConversa
                  key={conversa.id}
                  conversa={conversa}
                  ativa={conversaAtiva?.id === conversa.id}
                  onClick={() => selecionarConversa(conversa.id)}
                  onArquivar={arquivarConversa}
                />
              ))
            )}
          </div>
          <div className="p-3 border-t border-surface-border">
            <p className="text-xs text-slate-600 text-center">Modelo: gpt-4o-mini</p>
          </div>
        </aside>

        {/* ÁREA DE CHAT */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {!conversaAtiva ? (
            <TelaVazia onNovaConversa={criarNovaConversa} carregando={carregando} />
          ) : (
            <>
              {/* Cabeçalho do chat */}
              <div className="flex items-center px-4 py-3 border-b border-surface-border flex-shrink-0">
                <div>
                  <h2 className="text-white font-medium text-sm truncate max-w-md">
                    {conversaAtiva.titulo}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(conversaAtiva.mensagens || []).length} mensagens
                    {conversaAtiva.total_tokens > 0 && (
                      <> · {conversaAtiva.total_tokens?.toLocaleString()} tokens</>
                    )}
                  </p>
                </div>
              </div>

              {/* Lista de mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {carregandoChat ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`flex gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                      <div className="w-8 h-8 rounded-full bg-surface-card animate-pulse flex-shrink-0" />
                      <div className={`rounded-2xl p-4 animate-pulse ${i % 2 === 0 ? 'bg-surface-card w-2/3' : 'bg-primary-900/30 w-1/2'}`}>
                        <div className="h-3 bg-slate-700 rounded w-full mb-2" />
                        <div className="h-3 bg-slate-700 rounded w-3/4" />
                      </div>
                    </div>
                  ))
                ) : (conversaAtiva.mensagens || []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <span className="text-4xl mb-3">💬</span>
                    <p className="text-slate-400 text-sm">
                      Conversa criada! Digite sua primeira mensagem abaixo.
                    </p>
                  </div>
                ) : (
                  (conversaAtiva.mensagens || []).map((msg) => (
                    <BolhaMensagem key={msg.id} mensagem={msg} />
                  ))
                )}

                {/* Indicador de digitação da IA */}
                {carregando && <IndicadorDigitando />}

                {/* Âncora para scroll automático */}
                <div ref={fimDaListaRef} />
              </div>

              {/* INPUT DE MENSAGEM */}
              <div className="flex-shrink-0 border-t border-surface-border p-4">
                <form onSubmit={enviarMensagem} className="flex gap-3 items-end">
                  <textarea
                    ref={inputRef}
                    value={mensagemInput}
                    onChange={(e) => {
                      setMensagemInput(e.target.value);
                      // Auto-resize
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                    disabled={carregando}
                    rows={1}
                    className="input flex-1 resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '44px', maxHeight: '144px' }}
                  />
                  <button
                    type="submit"
                    disabled={carregando || !mensagemInput.trim()}
                    className="btn-primary px-4 py-2.5 flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {carregando ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">{carregando ? 'Enviando...' : 'Enviar'}</span>
                  </button>
                </form>
                <p className="text-xs text-slate-600 mt-2 text-center">
                  Enter para enviar · Shift+Enter para nova linha
                </p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PaginaChatIA;
