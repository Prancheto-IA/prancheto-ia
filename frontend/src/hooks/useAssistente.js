// =============================================================
// PRANCHETO.IA - HOOK DO ASSISTENTE COM ACAO NO CRM
//
// Conversa com a Edge Function crm-assistente. O estado das mensagens
// e sempre o que o servidor devolve, e nunca o resultado de remendar
// a lista local: o assistente insere mensagens de ferramenta no meio
// do turno, e reconstruir isso no cliente seria manter duas versoes
// da mesma verdade.
//
// A unica excecao e a bolha otimista de quem digitou, que existe
// enquanto a requisicao viaja e some quando a lista real chega.
// =============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const FUNCAO = 'crm-assistente';

/** Erros que descrevem a conta da OpenAI, e nao a conversa. */
export const CODIGOS_INDISPONIVEL = ['sem_credito', 'sem_chave'];

export const useAssistente = () => {
  const [conversas, setConversas]           = useState([]);
  const [conversaAtual, setConversaAtual]   = useState(null);
  const [mensagens, setMensagens]           = useState([]);
  const [acoesPendentes, setAcoesPendentes] = useState([]);
  const [carregando, setCarregando]         = useState(false);
  const [enviando, setEnviando]             = useState(false);
  const [resolvendoAcao, setResolvendoAcao] = useState(null);
  const [erro, setErro]                     = useState(null);

  // Em resposta nao-2xx o supabase-js entrega o erro e descarta o corpo,
  // deixando so "non-2xx status code" na tela. O corpo real vem em
  // error.context, e e ele que explica o que houve — sessao expirada,
  // conversa de outra pessoa, acao ja resolvida.
  const invocar = useCallback(async (body) => {
    const { data, error } = await supabase.functions.invoke(FUNCAO, { body });

    if (error) {
      let mensagem = 'Nao foi possivel falar com o assistente.';
      let codigo;
      try {
        const corpo = await error.context?.json();
        if (corpo?.erro) { mensagem = corpo.erro; codigo = corpo.codigo; }
      } catch { /* sem corpo legivel: fica a mensagem generica */ }
      const e = new Error(mensagem);
      e.codigo = codigo;
      throw e;
    }

    if (data?.erro) {
      const e = new Error(data.erro);
      e.codigo = data.codigo;
      throw e;
    }
    return data;
  }, []);

  /**
   * Quem e o dono da conversa, segundo a sessao.
   *
   * Nao vem do authStore de proposito: aquele estado e persistido em
   * localStorage e sobrevive a troca de conta e a impersonation, entao
   * pode apontar para um usuario enquanto o JWT ja e de outro. A policy
   * de ai_conversations compara user_id com auth.uid(), e a divergencia
   * aparece como "new row violates row-level security policy" — erro que
   * nao diz nada sobre a causa real.
   */
  const identidadeDaSessao = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw new Error('Sua sessao expirou. Entre novamente.');
    const { data: perfil } = await supabase
      .from('users').select('tenant_id').eq('id', data.user.id).maybeSingle();
    return { id: data.user.id, tenant_id: perfil?.tenant_id ?? null };
  }, []);

  const carregarConversas = useCallback(async () => {
    setCarregando(true);
    try {
      const eu = await identidadeDaSessao();
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', eu.id)
        .eq('status', 'ativa')
        .order('atualizado_em', { ascending: false });
      if (error) throw error;
      setConversas(data || []);
    } catch {
      setErro({ mensagem: 'Nao foi possivel carregar as conversas.' });
    } finally {
      setCarregando(false);
    }
  }, [identidadeDaSessao]);

  /**
   * Recarrega a conversa do banco.
   *
   * Usado tambem depois de uma falha: o servidor grava a mensagem do
   * usuario antes de chamar o modelo, entao tirar a bolha da tela
   * quando da erro faz a mensagem sumir e reaparecer no proximo
   * carregamento. A tela mostra o que o banco tem.
   */
  const recarregarMensagens = useCallback(async (conversaId) => {
    const { data } = await supabase
      .from('ai_messages')
      .select('id, remetente, conteudo, metadata, criado_em')
      .eq('conversation_id', conversaId)
      .order('criado_em', { ascending: true });
    if (data) setMensagens(data);
  }, []);

  const abrirConversa = useCallback(async (conversa) => {
    setConversaAtual(conversa);
    setErro(null);
    try {
      const [{ data: msgs }, { data: acoes }] = await Promise.all([
        supabase.from('ai_messages')
          .select('id, remetente, conteudo, metadata, criado_em')
          .eq('conversation_id', conversa.id)
          .order('criado_em', { ascending: true }),
        supabase.from('ai_acoes')
          .select('id, ferramenta, argumentos, resumo, status, criado_em')
          .eq('conversation_id', conversa.id)
          .eq('status', 'pendente')
          .order('criado_em', { ascending: true }),
      ]);
      setMensagens(msgs || []);
      setAcoesPendentes(acoes || []);
    } catch {
      setMensagens([]);
      setAcoesPendentes([]);
    }
  }, []);

  const criarConversa = useCallback(async (titulo) => {
    const eu = await identidadeDaSessao();
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: eu.id, tenant_id: eu.tenant_id, titulo, modelo: 'gpt-4o-mini' })
      .select('*')
      .single();
    if (error) {
      // O texto cru do Postgres nao ajuda quem esta na tela.
      throw new Error(
        error.code === '42501'
          ? 'Sua sessao nao confere com a conta carregada. Saia e entre de novo.'
          : 'Nao foi possivel iniciar a conversa.',
      );
    }
    setConversas((prev) => [data, ...prev]);
    return data;
  }, [identidadeDaSessao]);

  const novaConversa = useCallback(async () => {
    try {
      const nova = await criarConversa('Nova conversa');
      setConversaAtual(nova);
      setMensagens([]);
      setAcoesPendentes([]);
      setErro(null);
    } catch {
      setErro({ mensagem: 'Erro ao criar conversa.' });
    }
  }, [criarConversa]);

  // 'aviso' e a falha que chegou depois de a acao ja ter sido gravada:
  // a lista de mensagens vale, e o alerta explica por que o assistente
  // nao comentou o resultado.
  const aplicarRetorno = useCallback((data) => {
    if (Array.isArray(data.mensagens)) setMensagens(data.mensagens);
    setAcoesPendentes(data.acoes_pendentes || []);
    setErro(data.aviso ? { mensagem: data.aviso.mensagem, codigo: data.aviso.codigo } : null);
  }, []);

  const enviar = useCallback(async (texto) => {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setEnviando(true);
    setErro(null);

    // Bolha otimista: some quando a lista real chega do servidor.
    const provisoria = {
      id: `local-${Date.now()}`,
      remetente: 'user',
      conteudo,
      criado_em: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, provisoria]);

    let conversa = conversaAtual;
    try {
      if (!conversa) {
        conversa = await criarConversa(conteudo.slice(0, 50));
        setConversaAtual(conversa);
      }
      const data = await invocar({ conversationId: conversa.id, mensagem: conteudo });
      aplicarRetorno(data);
      await carregarConversas();
    } catch (e) {
      setErro({ mensagem: e.message, codigo: e.codigo });
      // A mensagem pode ter sido gravada antes da falha. Quem decide o
      // que fica na tela e o banco, nao o palpite do cliente.
      if (conversa?.id) await recarregarMensagens(conversa.id);
      else setMensagens((prev) => prev.filter((m) => m.id !== provisoria.id));
    } finally {
      setEnviando(false);
    }
  }, [enviando, conversaAtual, criarConversa, invocar, aplicarRetorno, carregarConversas, recarregarMensagens]);

  const responderAcao = useCallback(async (acaoId, aprovada) => {
    if (!conversaAtual || resolvendoAcao) return;
    setResolvendoAcao(acaoId);
    setErro(null);
    try {
      const data = await invocar({ conversationId: conversaAtual.id, acaoId, aprovada });
      aplicarRetorno(data);
    } catch (e) {
      setErro({ mensagem: e.message, codigo: e.codigo });
    } finally {
      setResolvendoAcao(null);
    }
  }, [conversaAtual, resolvendoAcao, invocar, aplicarRetorno]);

  /** Checagem do caminho todo sem gastar token. Usada pela faixa de indisponibilidade. */
  const diagnosticar = useCallback(() => invocar({ modo: 'diagnostico' }), [invocar]);

  return {
    conversas, conversaAtual, mensagens, acoesPendentes,
    carregando, enviando, resolvendoAcao, erro,
    carregarConversas, abrirConversa, novaConversa, enviar, responderAcao, diagnosticar,
  };
};
