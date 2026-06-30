// =============================================================
// PRANCHETO.IA - CONTROLLER DO MÓDULO DE CHAT COM IA
// Gerencia conversas com a OpenAI API, persistindo o histórico
// no banco de dados para manter contexto entre mensagens.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const OpenAI       = require('openai');
const { supabase } = require('../../config/database');
const logger       = require('../../services/logger.service');

// ----------------------------------------------------------
// INICIALIZAÇÃO DO CLIENTE OPENAI
// ----------------------------------------------------------
let clienteOpenAI = null;

const inicializarOpenAI = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-proj-sua_')) {
    logger.warn('[AI] OPENAI_API_KEY não configurada. Módulo de IA desativado.');
    return null;
  }

  try {
    const cliente = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    logger.info('[AI] Cliente OpenAI inicializado com sucesso.');
    return cliente;
  } catch (erro) {
    logger.error('[AI] Falha ao inicializar cliente OpenAI:', erro.message);
    return null;
  }
};

clienteOpenAI = inicializarOpenAI();

// ----------------------------------------------------------
// CONFIGURAÇÕES PADRÃO DA IA
// ----------------------------------------------------------
const MODELO_PADRAO = process.env.OPENAI_MODEL        || 'gpt-4o-mini';
const MAX_TOKENS    = parseInt(process.env.OPENAI_MAX_TOKENS   || '2048', 10);
const TEMPERATURA   = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');

const SYSTEM_PROMPT = `Você é um assistente especializado no Prancheto.IA, um CRM SaaS modular e multi-tenant.

Seu papel é ajudar o Super Admin a:
1. Criar e configurar novos módulos CRM (Seções, Módulos, Abas, Widgets)
2. Gerar código JavaScript/React para componentes do sistema
3. Sugerir estruturas de banco de dados para o Supabase
4. Resolver problemas técnicos do sistema
5. Planejar funcionalidades e arquitetura

Contexto técnico do sistema:
- Backend: Node.js + Express + Supabase (@supabase/supabase-js)
- Frontend: React + Vite + TailwindCSS + Zustand
- Autenticação: JWT com refresh tokens
- Multi-tenant: isolamento por tenant_id
- RBAC: super_admin > admin > manager > member > viewer
- Monitoramento: Sentry + Winston logs

Ao gerar código, sempre:
- Adicione comentários em português
- Siga os padrões do projeto (snake_case no banco, camelCase no JS)
- Inclua tratamento de erros
- Considere o isolamento multi-tenant

Seja direto, técnico e objetivo nas respostas.`;

// =============================================================
// HELPERS INTERNOS
// =============================================================

const verificarClienteIA = (res) => {
  if (!clienteOpenAI) {
    res.status(503).json({
      sucesso:  false,
      codigo:   'CRM-0601',
      mensagem: 'Módulo de IA não configurado. Adicione OPENAI_API_KEY ao arquivo .env e reinicie o servidor.',
    });
    return false;
  }
  return true;
};

const gerarTituloConversa = (primeiraMensagem) => {
  const titulo = primeiraMensagem.trim().substring(0, 60);
  return titulo.length < primeiraMensagem.trim().length ? `${titulo}...` : titulo;
};

// =============================================================
// GET /api/ai/conversations
// Lista todas as conversas ativas do usuário autenticado
// =============================================================
const listarConversas = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Busca conversas ativas ordenadas pela mais recente
    const { data: conversas, error } = await supabase
      .from('ai_conversations')
      .select('id, titulo, modelo, total_tokens, criado_em, atualizado_em')
      .eq('user_id', userId)
      .eq('status', 'ativa')
      .order('atualizado_em', { ascending: false });

    if (error) throw error;

    // Conta o número de mensagens de cada conversa em paralelo
    const conversasComContagem = await Promise.all(
      (conversas || []).map(async (conversa) => {
        const { count } = await supabase
          .from('ai_messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conversa.id);

        return {
          ...conversa,
          total_mensagens: count || 0,
        };
      })
    );

    return res.status(200).json({
      sucesso:   true,
      total:     conversasComContagem.length,
      conversas: conversasComContagem,
    });
  } catch (erro) {
    logger.error('[AI] Erro ao listar conversas:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/ai/conversations
// Cria uma nova conversa vazia
// =============================================================
const criarConversa = async (req, res, next) => {
  try {
    if (!verificarClienteIA(res)) return;

    const userId      = req.userId;
    const { titulo }  = req.body;

    const { data: novasConversas, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        titulo:  titulo || 'Nova conversa',
        modelo:  MODELO_PADRAO,
      })
      .select('id, titulo, modelo, criado_em');

    if (error) throw error;

    const novaConversa = novasConversas?.[0];

    logger.info(`[AI] Nova conversa criada: ${novaConversa.id} por usuário ${userId}`);

    return res.status(201).json({
      sucesso:  true,
      mensagem: 'Conversa criada com sucesso.',
      conversa: novaConversa,
    });
  } catch (erro) {
    logger.error('[AI] Erro ao criar conversa:', erro.message);
    next(erro);
  }
};

// =============================================================
// GET /api/ai/conversations/:id
// Busca uma conversa específica com todas as suas mensagens
// =============================================================
const buscarConversa = async (req, res, next) => {
  try {
    const userId                 = req.userId;
    const { id: conversationId } = req.params;

    // Busca a conversa garantindo que pertence ao usuário
    const { data: conversas, error: erroConversa } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .limit(1);

    if (erroConversa) throw erroConversa;

    const conversa = conversas?.[0];

    if (!conversa) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0602',
        mensagem: 'Conversa não encontrada.',
      });
    }

    // Busca todas as mensagens da conversa em ordem cronológica
    const { data: mensagens, error: erroMensagens } = await supabase
      .from('ai_messages')
      .select('id, remetente, conteudo, tokens_usados, criado_em')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: true });

    if (erroMensagens) throw erroMensagens;

    return res.status(200).json({
      sucesso:  true,
      conversa: {
        ...conversa,
        mensagens: mensagens || [],
      },
    });
  } catch (erro) {
    logger.error('[AI] Erro ao buscar conversa:', erro.message);
    next(erro);
  }
};

// =============================================================
// DELETE /api/ai/conversations/:id
// Arquiva uma conversa (soft delete)
// =============================================================
const arquivarConversa = async (req, res, next) => {
  try {
    const userId                 = req.userId;
    const { id: conversationId } = req.params;

    // Verifica se a conversa pertence ao usuário
    const { data: conversas, error: erroVerif } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .limit(1);

    if (erroVerif) throw erroVerif;

    if (!conversas?.length) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0603',
        mensagem: 'Conversa não encontrada.',
      });
    }

    // Atualiza o status para 'arquivada'
    const { error } = await supabase
      .from('ai_conversations')
      .update({ status: 'arquivada', atualizado_em: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) throw error;

    logger.info(`[AI] Conversa arquivada: ${conversationId}`);

    return res.status(200).json({
      sucesso:  true,
      mensagem: 'Conversa arquivada com sucesso.',
    });
  } catch (erro) {
    logger.error('[AI] Erro ao arquivar conversa:', erro.message);
    next(erro);
  }
};

// =============================================================
// POST /api/ai/conversations/:id/messages
// Envia uma mensagem do usuário e retorna a resposta da IA
// =============================================================
const enviarMensagem = async (req, res, next) => {
  try {
    if (!verificarClienteIA(res)) return;

    const userId                 = req.userId;
    const { id: conversationId } = req.params;
    const { mensagem }           = req.body;

    // --- Validação da mensagem ---
    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0604',
        mensagem: 'O campo "mensagem" é obrigatório e não pode estar vazio.',
      });
    }

    const mensagemLimpa = mensagem.trim();

    if (mensagemLimpa.length > 10000) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0605',
        mensagem: 'Mensagem muito longa. Limite: 10.000 caracteres.',
      });
    }

    // --- Verifica se a conversa existe e pertence ao usuário ---
    const { data: conversas, error: erroConversa } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('status', 'ativa')
      .limit(1);

    if (erroConversa) throw erroConversa;

    const conversa = conversas?.[0];

    if (!conversa) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0606',
        mensagem: 'Conversa não encontrada ou já foi arquivada.',
      });
    }

    // --- Salva a mensagem do usuário no banco ---
    const { data: msgUsuarioArr, error: erroInsertUser } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        remetente:       'user',
        conteudo:        mensagemLimpa,
        tokens_usados:   0,
      })
      .select('id, remetente, conteudo, criado_em');

    if (erroInsertUser) throw erroInsertUser;

    const msgUsuario = msgUsuarioArr?.[0];

    // --- Carrega o histórico completo da conversa ---
    const { data: historico, error: erroHistorico } = await supabase
      .from('ai_messages')
      .select('remetente, conteudo')
      .eq('conversation_id', conversationId)
      .order('criado_em', { ascending: true });

    if (erroHistorico) throw erroHistorico;

    // Formata o histórico no padrão da API OpenAI
    const mensagensOpenAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(historico || []).map((msg) => ({
        role:    msg.remetente === 'user' ? 'user' : 'assistant',
        content: msg.conteudo,
      })),
    ];

    // --- Chama a API da OpenAI ---
    logger.info(`[AI] Enviando ${mensagensOpenAI.length} mensagens para OpenAI (conversa: ${conversationId})`);

    let respostaOpenAI;
    try {
      respostaOpenAI = await clienteOpenAI.chat.completions.create({
        model:       conversa.modelo || MODELO_PADRAO,
        messages:    mensagensOpenAI,
        max_tokens:  MAX_TOKENS,
        temperature: TEMPERATURA,
      });
    } catch (erroOpenAI) {
      logger.error('[AI] Erro na API OpenAI:', erroOpenAI.message);

      // Remove a mensagem do usuário que foi salva (rollback manual)
      await supabase.from('ai_messages').delete().eq('id', msgUsuario.id);

      if (erroOpenAI.status === 401) {
        return res.status(503).json({
          sucesso:  false,
          codigo:   'CRM-0607',
          mensagem: 'Chave da OpenAI inválida ou expirada. Verifique o arquivo .env.',
        });
      }

      if (erroOpenAI.status === 429) {
        return res.status(503).json({
          sucesso:  false,
          codigo:   'CRM-0608',
          mensagem: 'Limite de requisições da OpenAI atingido. Tente novamente em alguns instantes.',
        });
      }

      return res.status(503).json({
        sucesso:  false,
        codigo:   'CRM-0609',
        mensagem: 'Erro ao comunicar com a IA. Tente novamente.',
        detalhe:  erroOpenAI.message,
      });
    }

    // --- Extrai a resposta da IA ---
    const conteudoResposta = respostaOpenAI.choices[0]?.message?.content || '';
    const tokensUsados     = respostaOpenAI.usage?.completion_tokens || 0;
    const tokensTotal      = respostaOpenAI.usage?.total_tokens || 0;

    // --- Salva a resposta da IA no banco ---
    const { data: msgAssistenteArr, error: erroInsertAI } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        remetente:       'assistant',
        conteudo:        conteudoResposta,
        tokens_usados:   tokensUsados,
        metadata: {
          finish_reason: respostaOpenAI.choices[0]?.finish_reason,
          model:         respostaOpenAI.model,
          total_tokens:  tokensTotal,
        },
      })
      .select('id, remetente, conteudo, tokens_usados, criado_em');

    if (erroInsertAI) throw erroInsertAI;

    const msgAssistente = msgAssistenteArr?.[0];

    // --- Atualiza a conversa (tokens + título automático) ---
    const atualizacaoConversa = {
      total_tokens:  (conversa.total_tokens || 0) + tokensTotal,
      atualizado_em: new Date().toISOString(),
    };

    if (conversa.titulo === 'Nova conversa') {
      atualizacaoConversa.titulo = gerarTituloConversa(mensagemLimpa);
    }

    await supabase
      .from('ai_conversations')
      .update(atualizacaoConversa)
      .eq('id', conversationId);

    logger.info(`[AI] Resposta recebida. Tokens usados: ${tokensTotal} (conversa: ${conversationId})`);

    return res.status(200).json({
      sucesso:          true,
      mensagem_usuario: msgUsuario,
      resposta_ia:      msgAssistente,
      uso: {
        tokens_resposta: tokensUsados,
        tokens_total:    tokensTotal,
      },
    });
  } catch (erro) {
    logger.error('[AI] Erro inesperado ao enviar mensagem:', erro.message);
    next(erro);
  }
};

module.exports = {
  listarConversas,
  criarConversa,
  buscarConversa,
  arquivarConversa,
  enviarMensagem,
};
