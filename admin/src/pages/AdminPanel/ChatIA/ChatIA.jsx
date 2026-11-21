// =============================================================
// PRANCHETO.IA - CHAT COM IA / ASSISTENTE ADMIN
// Layout idêntico ao Chat do Dashboard do Cliente (ChatMensagens.jsx).
//
// Construído com:
// - Padrão visual de 2 colunas com superfícies arredondadas e limpas
// - Suporte a histórico com busca, criação e exclusão em lote
// - Mascote Pranchetinho e renderização Markdown nativa
//
// ROTA: /chat (legado: /admin/chat)
// ACESSO: Super Admin
// =============================================================

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useUIStore } from '../../../store/uiStore.js';
import {
  Bolha,
  LinhaAtividade,
  CartaoAcao,
  FaixaIndisponivel,
  SUGESTOES,
} from './ChatIAComponentes.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Cancel01Icon,
  Add01Icon,
  AiSparklesIcon,
  SentIcon,
  Comment01Icon,
  Attachment01Icon,
  Delete02Icon,
  PencilEdit01Icon,
} from '@hugeicons/core-free-icons';
import pranchetinho from '../../../assets/mascote/pranchetinho-chat.png';

const PaginaChatIA = () => {
  const { usuario } = useAuthStore();
  const adicionarNotificacao = useUIStore((s) => s.adicionarNotificacao);

  // Estados principais
  const [conversas, setConversas] = useState([]);
  const [conversaAtiva, setConversaAtiva] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [acoesPendentes, setAcoesPendentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resolvendoAcao, setResolvendoAcao] = useState(null);
  const [erro, setErro] = useState(null);

  // Estados da interface e busca
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [apagando, setApagando] = useState(false);
  const [anexos, setAnexos] = useState([]);

  // Refs
  const fimRef = useRef(null);
  const inputRef = useRef(null);
  const arquivoInputRef = useRef(null);

  // ----------------------------------------------------------
  // CARREGAR CONVERSAS
  // ----------------------------------------------------------
  const carregarConversas = useCallback(async () => {
    if (!usuario?.id) return;
    try {
      setCarregando(true);
      const { data, error: erroQuery } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', usuario.id)
        .eq('status', 'ativa')
        .order('atualizado_em', { ascending: false });

      if (erroQuery) throw erroQuery;
      setConversas(data || []);

      // Se não há conversa ativa e existem conversas, seleciona a primeira
      if (!conversaAtiva && data && data.length > 0) {
        selecionarConversa(data[0]);
      }
    } catch (err) {
      setErro(err);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------
  // SELECIONAR CONVERSA E CARREGAR MENSAGENS
  // ----------------------------------------------------------
  const selecionarConversa = useCallback(async (conversa) => {
    if (!conversa?.id) return;
    setConversaAtiva(conversa);
    try {
      const { data, error: erroMsgs } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversa.id)
        .order('criado_em', { ascending: true });

      if (erroMsgs) throw erroMsgs;
      setMensagens(data || []);
      setAcoesPendentes([]);
    } catch (err) {
      setErro(err);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  useEffect(() => {
    carregarConversas();
  }, [carregarConversas]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, enviando, acoesPendentes]);

  // ----------------------------------------------------------
  // CRIAR NOVA CONVERSA
  // ----------------------------------------------------------
  const novaConversa = useCallback(async (promptInicial = null) => {
    if (!usuario?.id) return;
    try {
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: usuario.id,
          titulo: 'Nova conversa',
          modelo: 'gpt-4o-mini',
          status: 'ativa',
        })
        .select('*')
        .single();

      if (error) throw error;

      setConversas((prev) => [data, ...prev]);
      setConversaAtiva(data);
      setMensagens([]);
      setAcoesPendentes([]);

      if (promptInicial) {
        enviar(promptInicial, data.id);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Falha ao criar nova conversa.');
      }
    }
  }, [usuario?.id, adicionarNotificacao]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------
  // EXCLUIR CONVERSAS SELECIONADAS
  // ----------------------------------------------------------
  const handleExcluirSelecionadas = async () => {
    if (selecionadas.size === 0 || apagando) return;
    setApagando(true);
    try {
      const ids = Array.from(selecionadas);
      const { error } = await supabase
        .from('ai_conversations')
        .update({ status: 'arquivada' })
        .in('id', ids);

      if (error) throw error;

      setConversas((prev) => prev.filter((c) => !selecionadas.has(c.id)));
      if (conversaAtiva && selecionadas.has(conversaAtiva.id)) {
        setConversaAtiva(null);
        setMensagens([]);
      }
      setSelecionadas(new Set());
      setModoEdicao(false);

      if (adicionarNotificacao) {
        adicionarNotificacao('success', `${ids.length} conversa(s) arquivada(s).`);
      }
    } catch (err) {
      if (adicionarNotificacao) {
        adicionarNotificacao('error', err?.message || 'Erro ao arquivar conversas.');
      }
    } finally {
      setApagando(false);
    }
  };

  // ----------------------------------------------------------
  // ENVIAR MENSAGEM
  // ----------------------------------------------------------
  const enviar = async (textoMsg, convIdManual = null) => {
    let idAlvo = convIdManual || conversaAtiva?.id;

    // Se não há conversa ativa, cria uma automaticamente
    if (!idAlvo) {
      try {
        const { data, error } = await supabase
          .from('ai_conversations')
          .insert({
            user_id: usuario.id,
            titulo: textoMsg.slice(0, 36) || 'Nova conversa',
            modelo: 'gpt-4o-mini',
            status: 'ativa',
          })
          .select('*')
          .single();

        if (error) throw error;
        idAlvo = data.id;
        setConversas((prev) => [data, ...prev]);
        setConversaAtiva(data);
      } catch (err) {
        if (adicionarNotificacao) {
          adicionarNotificacao('error', err?.message || 'Erro ao inicializar conversa.');
        }
        return;
      }
    }

    setEnviando(true);
    setErro(null);

    const msgTemp = {
      id: `temp-${Date.now()}`,
      remetente: 'user',
      conteudo: textoMsg,
      criado_em: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, msgTemp]);

    try {
      const { data, error } = await supabase.functions.invoke('chat-ai', {
        body: { conversationId: idAlvo, mensagem: textoMsg },
      });

      if (error) throw error;
      if (data?.erro) throw new Error(data.erro);

      setMensagens((prev) => [
        ...prev.filter((m) => m.id !== msgTemp.id),
        data.mensagem_usuario,
        data.resposta_ia,
      ]);

      // Atualiza o título na lista se for a primeira mensagem
      if (conversaAtiva?.titulo === 'Nova conversa' && data.titulo_gerado) {
        setConversaAtiva((prev) => ({ ...prev, titulo: data.titulo_gerado }));
        setConversas((prev) =>
          prev.map((c) => (c.id === idAlvo ? { ...c, titulo: data.titulo_gerado } : c))
        );
      }
    } catch (err) {
      setMensagens((prev) => prev.filter((m) => m.id !== msgTemp.id));
      setErro({ mensagem: err?.message || 'Falha ao processar mensagem com a IA.' });
      setTexto(textoMsg);
    } finally {
      setEnviando(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const submeter = (e) => {
    e.preventDefault();
    if ((!texto.trim() && anexos.length === 0) || enviando) return;

    let msg = texto.trim();
    if (anexos.length > 0) {
      const nomes = anexos.map((a) => a.name).join(', ');
      msg = msg ? `${msg} [Anexos: ${nomes}]` : `[Anexos: ${nomes}]`;
    }

    setTexto('');
    setAnexos([]);
    enviar(msg);
  };

  // ----------------------------------------------------------
  // ANEXOS
  // ----------------------------------------------------------
  const handleSelecionarArquivos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAnexos((prev) => [...prev, ...files]);
    }
    e.target.value = '';
  };

  const removerAnexo = (index) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  // Resposta para ações de confirmação
  const responderAcao = (acaoId, aprovado) => {
    setResolvendoAcao(acaoId);
    setTimeout(() => {
      setAcoesPendentes((prev) => prev.filter((a) => a.id !== acaoId));
      setResolvendoAcao(null);
      if (adicionarNotificacao) {
        adicionarNotificacao(
          aprovado ? 'success' : 'info',
          aprovado ? 'Ação administrativa executada.' : 'Ação descartada.'
        );
      }
    }, 600);
  };

  // Conversas filtradas pela busca
  const conversasFiltradas = useMemo(() => {
    if (!busca.trim()) return conversas;
    const termo = busca.toLowerCase();
    return conversas.filter((c) =>
      c.titulo ? c.titulo.toLowerCase().includes(termo) : false
    );
  }, [conversas, busca]);

  const vazio = mensagens.length === 0 && !enviando && !carregando;

  return (
    <div className="w-full h-full flex-1 flex gap-4 min-h-0 font-sans overflow-hidden p-4 sm:p-6 bg-surface dark:bg-[#111928] select-text">
      {/* ─────────────────────────────────────────────────────────
          COLUNA ESQUERDA: LISTA DE CONVERSAS (BARRA LATERAL)
         ───────────────────────────────────────────────────────── */}
      <aside className="w-full md:w-72 lg:w-80 bg-surface-card rounded-2xl border border-surface-border shadow-2xs flex flex-col overflow-hidden shrink-0">
        {/* Controles no Topo: Campo de Pesquisa + Botão Nova Conversa */}
        <div className="p-3 border-b border-surface-border flex items-center gap-2 flex-shrink-0">
          <div className="relative flex-1 flex items-center min-w-0">
            <span className="absolute left-2.5 text-ink-secondary pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.8} />
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full bg-surface-subtle hover:bg-surface-card focus:bg-surface-card text-xs text-ink-primary placeholder:text-ink-secondary/60 pl-8 pr-7 py-2 rounded-xl border border-surface-border focus:outline-none focus:border-brand-primary transition-all"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2 p-0.5 rounded text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={1.8} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => novaConversa()}
            title="Iniciar nova conversa"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer flex-shrink-0"
          >
            <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2} />
            <span className="hidden sm:inline">Nova</span>
          </button>
        </div>

        {/* Subcabeçalho com Contador e Botão de Editar */}
        <div className="px-3.5 py-2 bg-surface-subtle border-b border-surface-border flex items-center justify-between flex-shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
            Histórico Recente
          </span>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              {conversasFiltradas.length}
            </span>
            {conversas.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setModoEdicao(!modoEdicao);
                  setSelecionadas(new Set());
                }}
                className={`text-xs font-semibold px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  modoEdicao
                    ? 'bg-brand-primary text-white shadow-2xs'
                    : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover'
                }`}
                title={modoEdicao ? 'Finalizar modo de seleção' : 'Editar e apagar conversas'}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={12} strokeWidth={2} />
                <span>{modoEdicao ? 'Concluir' : 'Editar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Ações do Modo Edição */}
        {modoEdicao && (
          <div className="px-3 py-2 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between text-xs flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                if (selecionadas.size === conversasFiltradas.length) {
                  setSelecionadas(new Set());
                } else {
                  setSelecionadas(new Set(conversasFiltradas.map((c) => c.id)));
                }
              }}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
            >
              {selecionadas.size === conversasFiltradas.length
                ? 'Desmarcar todas'
                : 'Selecionar todas'}
            </button>
            <button
              type="button"
              onClick={handleExcluirSelecionadas}
              disabled={selecionadas.size === 0 || apagando}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
            >
              <HugeiconsIcon icon={Delete02Icon} size={13} strokeWidth={2} />
              <span>{apagando ? 'Apagando...' : `Apagar (${selecionadas.size})`}</span>
            </button>
          </div>
        )}

        {/* Lista de Conversas com Scroll */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {carregando && conversas.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversasFiltradas.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-surface-border text-ink-secondary flex items-center justify-center mx-auto mb-2.5">
                <HugeiconsIcon icon={Comment01Icon} size={18} strokeWidth={1.8} />
              </div>
              <p className="text-xs font-bold text-ink-primary">
                {busca ? 'Nenhum resultado' : 'Nenhuma conversa'}
              </p>
              <p className="text-[11px] text-ink-secondary mt-0.5">
                {busca ? 'Tente outro termo de busca' : 'Clique em Nova para iniciar'}
              </p>
            </div>
          ) : (
            conversasFiltradas.map((c) => {
              const ativa = conversaAtiva?.id === c.id;
              const estaSelecionada = selecionadas.has(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (modoEdicao) {
                      const next = new Set(selecionadas);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      setSelecionadas(next);
                    } else {
                      selecionarConversa(c);
                    }
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all border relative flex items-center gap-2.5 cursor-pointer select-none ${
                    modoEdicao && estaSelecionada
                      ? 'bg-rose-500/10 border-rose-500/30 text-ink-primary'
                      : ativa
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
                        : 'bg-surface-card border-transparent hover:bg-surface-subtle text-ink-primary'
                  }`}
                >
                  {modoEdicao ? (
                    <input
                      type="checkbox"
                      checked={estaSelecionada}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-surface-border text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                    />
                  ) : (
                    ativa && (
                      <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-brand-primary rounded-r-full" />
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-ink-primary">
                      {c.titulo || 'Conversa sem título'}
                    </p>
                    <p className="text-[10px] text-ink-secondary font-medium mt-1">
                      {new Date(c.criado_em).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────
          COLUNA DIREITA: TELA PRINCIPAL DE MENSAGENS
         ───────────────────────────────────────────────────────── */}
      <section className="flex-1 bg-surface-card rounded-2xl border border-surface-border shadow-2xs flex flex-col overflow-hidden min-w-0">
        {/* Top Bar do Chat */}
        <div className="px-5 py-3.5 border-b border-surface-border flex items-center justify-between bg-surface-card flex-shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
              <img
                src={pranchetinho}
                alt="Pranchetinho"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-ink-primary truncate">
                {conversaAtiva?.titulo || 'Assistente IA do Prancheto'}
              </h3>
              <p className="text-[11px] text-ink-secondary truncate">
                Governança, inteligência analítica e automação administrativa
              </p>
            </div>
          </div>
        </div>

        {erro && <FaixaIndisponivel erro={erro} />}

        {/* Fluxo de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-surface-subtle/30">
          {vazio && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 p-2 flex items-center justify-center mb-3 shadow-xs border border-blue-500/20 overflow-hidden">
                <img
                  src={pranchetinho}
                  alt="Pranchetinho"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-ink-primary mb-1.5">
                O que vamos analisar no sistema hoje?
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed mb-6">
                Peça para consultar o status dos servidores, analisar auditorias de segurança,
                conferir contas corporativas ou gerar relatórios de uso.
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-2">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-card hover:bg-blue-500/10 border border-surface-border hover:border-blue-500/30 text-ink-primary hover:text-blue-600 rounded-full text-xs font-semibold shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <HugeiconsIcon
                      icon={AiSparklesIcon}
                      size={13}
                      strokeWidth={2}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mensagens.map((msg) => {
            if (msg.remetente === 'tool') {
              let falhou = false;
              try {
                falhou = !!JSON.parse(msg.conteudo)?.recusada;
              } catch {
                /* conteudo cru */
              }
              return (
                <LinhaAtividade
                  key={msg.id}
                  ferramenta={msg.metadata?.ferramenta}
                  falhou={falhou}
                />
              );
            }
            if (msg.remetente === 'assistant' && !msg.conteudo?.trim()) return null;
            return <Bolha key={msg.id} mensagem={msg} />;
          })}

          {acoesPendentes.map((acao) => (
            <CartaoAcao
              key={acao.id}
              acao={acao}
              resolvendo={resolvendoAcao}
              onResponder={responderAcao}
            />
          ))}

          {enviando && (
            <div className="flex gap-2.5 sm:gap-3 flex-row items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-2xs p-1 overflow-hidden">
                <img
                  src={pranchetinho}
                  alt="Pranchetinho"
                  className="w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-surface-card border border-surface-border shadow-2xs flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-brand-primary animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}

          <div ref={fimRef} />
        </div>

        {/* Formulário de Envio */}
        <form
          onSubmit={submeter}
          className="p-3 sm:p-4 bg-surface-card border-t border-surface-border flex-shrink-0"
        >
          {/* Pré-visualização de Anexos */}
          {anexos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-surface-subtle rounded-xl border border-surface-border animate-fade-in">
              {anexos.map((arq, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-surface-card border border-surface-border px-2.5 py-1 rounded-lg text-xs text-ink-primary shadow-2xs"
                >
                  <HugeiconsIcon icon={Attachment01Icon} size={13} className="text-blue-600 shrink-0" />
                  <span className="truncate max-w-[140px] font-medium">{arq.name}</span>
                  <span className="text-[10px] text-ink-secondary">
                    ({(arq.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removerAnexo(idx)}
                    className="p-0.5 text-ink-secondary hover:text-rose-500 rounded transition-colors cursor-pointer ml-0.5"
                    title="Remover anexo"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={
                acoesPendentes.length > 0
                  ? 'Confirme ou descarte a ação acima...'
                  : 'Faça uma pergunta sobre o sistema ou solicite uma análise...'
              }
              disabled={enviando}
              aria-label="Mensagem para o assistente"
              className="flex-1 bg-surface-subtle hover:bg-surface-card focus:bg-surface-card text-xs sm:text-sm text-ink-primary placeholder:text-ink-secondary/60 px-4 py-3 rounded-xl border border-surface-border focus:outline-none focus:border-brand-primary transition-all shadow-2xs"
            />

            {/* Input Invisível para Anexar Arquivos */}
            <input
              type="file"
              ref={arquivoInputRef}
              onChange={handleSelecionarArquivos}
              multiple
              className="hidden"
            />

            {/* Botão de Anexar Arquivo */}
            <button
              type="button"
              onClick={() => arquivoInputRef.current?.click()}
              disabled={enviando}
              title="Anexar arquivo"
              aria-label="Anexar arquivo"
              className="p-3 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer bg-surface-subtle border border-surface-border text-ink-secondary hover:text-brand-primary hover:border-brand-primary/40 shadow-2xs active:scale-95"
            >
              <HugeiconsIcon icon={Attachment01Icon} size={17} strokeWidth={2} />
            </button>

            {/* Botão de Enviar */}
            <button
              type="submit"
              disabled={(!texto.trim() && anexos.length === 0) || enviando}
              className="px-4 py-3 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed active:scale-95"
              aria-label="Enviar"
              title="Enviar mensagem"
            >
              <HugeiconsIcon icon={SentIcon} size={17} strokeWidth={2} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default PaginaChatIA;
