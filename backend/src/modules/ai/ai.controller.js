// =============================================================
// PRANCHETO.IA - CONTROLLER DO MÓDULO DE CHAT COM IA
// Gerencia conversas com a OpenAI API, persistindo o histórico
// no banco de dados para manter contexto entre mensagens.
//
// ENDPOINTS:
//   GET    /api/ai/conversations          → Listar conversas do usuário
//   POST   /api/ai/conversations          → Criar nova conversa
//   GET    /api/ai/conversations/:id      → Buscar conversa com mensagens
//   DELETE /api/ai/conversations/:id      → Arquivar/deletar conversa
//   POST   /api/ai/conversations/:id/messages → Enviar mensagem e receber resposta
//
// SEGURANÇA:
//   - Apenas Super Admin pode acessar (exigirSuperAdmin no router)
//   - Chave da OpenAI fica APENAS no backend (nunca exposta ao frontend)
//   - Histórico completo é enviado à OpenAI para manter contexto
//   - Limite de tokens por resposta configurável via .env
//
// SISTEMA DE PROMPT:
//   O system prompt instrui a IA a atuar como assistente especializado
//   em desenvolvimento de módulos CRM para o Prancheto.IA.
// =============================================================

'use strict';

const OpenAI      = require('openai');
const { db }      = require('../../config/database');
const logger      = require('../../services/logger.service');

// ----------------------------------------------------------
// INICIALIZAÇÃO DO CLIENTE OPENAI
// O cliente é criado uma única vez (singleton) ao carregar o módulo.
// Se a chave não estiver configurada, as rotas retornarão erro 503.
// ----------------------------------------------------------
let clienteOpenAI = null;

const inicializarOpenAI = () => {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('sk-proj-sua_')) {
    logger.warn('[AI] OPENAI_API_KEY não configurada. Módulo de IA desativado.');
    return null;
  }

  try {
    const cliente = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('[AI] Cliente OpenAI inicializado com sucesso.');
    return cliente;
  } catch (erro) {
    logger.error('[AI] Falha ao inicializar cliente OpenAI:', erro.message);
    return null;
  }
};

// Inicializa o cliente ao carregar o módulo
clienteOpenAI = inicializarOpenAI();

// ----------------------------------------------------------
// CONFIGURAÇÕES PADRÃO DA IA
// ----------------------------------------------------------
const MODELO_PADRAO    = process.env.OPENAI_MODEL        || 'gpt-4o-mini';
const MAX_TOKENS       = parseInt(process.env.OPENAI_MAX_TOKENS  || '2048', 10);
const TEMPERATURA      = parseFloat(process.env.OPENAI_TEMPERATURE || '0.7');

// System prompt que define o comportamento da IA
const SYSTEM_PROMPT = `Você é um assistente especializado no Prancheto.IA, um CRM SaaS modular e multi-tenant.

Seu papel é ajudar o Super Admin a:
1. Criar e configurar novos módulos CRM (Seções, Módulos, Abas, Widgets)
2. Gerar código JavaScript/React para componentes do sistema
3. Sugerir estruturas de banco de dados e migrations Knex
4. Resolver problemas técnicos do sistema
5. Planejar funcionalidades e arquitetura

Contexto técnico do sistema:
- Backend: Node.js + Express + PostgreSQL + Knex.js
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

/**
 * Verifica se o cliente OpenAI está disponível.
 * Retorna false e envia resposta 503 se não estiver.
 */
const verificarClienteIA = (res) => {
  if (!clienteOpenAI) {
    res.status(503).json({
      sucesso: false,
      codigo:  'CRM-0601',
      mensagem: 'Módulo de IA não configurado. Adicione OPENAI_API_KEY ao arquivo .env e reinicie o servidor.',
    });
    return false;
  }
  return true;
};

/**
 * Gera um título automático para a conversa baseado na primeira mensagem.
 * Trunca em 60 caracteres para caber no campo do banco.
 */
const gerarTituloConversa = (primeiraMensagem) => {
  const titulo = primeiraMensagem.trim().substring(0, 60);
  return titulo.length < primeiraMensagem.trim().length ? `${titulo}...` : titulo;
};

// =============================================================
// CONTROLLERS
// =============================================================

/**
 * GET /api/ai/conversations
 * Lista todas as conversas ativas do usuário autenticado.
 * Retorna apenas metadados (sem as mensagens) para performance.
 */
const listarConversas = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Busca conversas ativas ordenadas pela mais recente
    const conversas = await db('ai_conversations')
      .where({ user_id: userId, status: 'ativa' })
      .orderBy('atualizado_em', 'desc')
      .select(
        'id',
        'titulo',
        'modelo',
        'total_tokens',
        'criado_em',
        'atualizado_em'
      );

    // Conta o número de mensagens de cada conversa
    const conversasComContagem = await Promise.all(
      conversas.map(async (conversa) => {
        const [{ count }] = await db('ai_messages')
          .where({ conversation_id: conversa.id })
          .count('id as count');

        return {
          ...conversa,
          total_mensagens: parseInt(count, 10),
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

/**
 * POST /api/ai/conversations
 * Cria uma nova conversa vazia (sem mensagens ainda).
 * O título pode ser definido pelo usuário ou gerado automaticamente
 * quando a primeira mensagem for enviada.
 */
const criarConversa = async (req, res, next) => {
  try {
    if (!verificarClienteIA(res)) return;

    const userId = req.userId;
    const { titulo }      = req.body;

    // Insere a nova conversa no banco
    const [novaConversa] = await db('ai_conversations')
      .insert({
        user_id: userId,
        titulo:  titulo || 'Nova conversa',
        modelo:  MODELO_PADRAO,
      })
      .returning(['id', 'titulo', 'modelo', 'criado_em']);

    logger.info(`[AI] Nova conversa criada: ${novaConversa.id} por usuário ${userId}`);

    return res.status(201).json({
      sucesso:   true,
      mensagem:  'Conversa criada com sucesso.',
      conversa:  novaConversa,
    });
  } catch (erro) {
    logger.error('[AI] Erro ao criar conversa:', erro.message);
    next(erro);
  }
};

/**
 * GET /api/ai/conversations/:id
 * Busca uma conversa específica com todas as suas mensagens.
 * Usado para carregar o histórico ao abrir uma conversa existente.
 */
const buscarConversa = async (req, res, next) => {
  try {
    const userId         = req.userId;
    const { id: conversationId } = req.params;

    // Busca a conversa garantindo que pertence ao usuário
    const conversa = await db('ai_conversations')
      .where({ id: conversationId, user_id: userId })
      .first();

    if (!conversa) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0602',
        mensagem: 'Conversa não encontrada.',
      });
    }

    // Busca todas as mensagens da conversa em ordem cronológica
    const mensagens = await db('ai_messages')
      .where({ conversation_id: conversationId })
      .orderBy('criado_em', 'asc')
      .select('id', 'remetente', 'conteudo', 'tokens_usados', 'criado_em');

    return res.status(200).json({
      sucesso:   true,
      conversa:  {
        ...conversa,
        mensagens,
      },
    });
  } catch (erro) {
    logger.error('[AI] Erro ao buscar conversa:', erro.message);
    next(erro);
  }
};

/**
 * DELETE /api/ai/conversations/:id
 * Arquiva uma conversa (soft delete — muda status para 'arquivada').
 * Os dados são mantidos no banco para auditoria.
 */
const arquivarConversa = async (req, res, next) => {
  try {
    const userId         = req.userId;
    const { id: conversationId } = req.params;

    // Verifica se a conversa pertence ao usuário
    const conversa = await db('ai_conversations')
      .where({ id: conversationId, user_id: userId })
      .first();

    if (!conversa) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0603',
        mensagem: 'Conversa não encontrada.',
      });
    }

    // Atualiza o status para 'arquivada'
    await db('ai_conversations')
      .where({ id: conversationId })
      .update({ status: 'arquivada', atualizado_em: new Date() });

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

/**
 * POST /api/ai/conversations/:id/messages
 * Envia uma mensagem do usuário e retorna a resposta da IA.
 *
 * FLUXO:
 *   1. Valida a mensagem do usuário
 *   2. Salva a mensagem do usuário no banco
 *   3. Carrega o histórico completo da conversa
 *   4. Envia histórico + nova mensagem para a OpenAI
 *   5. Salva a resposta da IA no banco
 *   6. Atualiza o contador de tokens e o título (se for a 1ª mensagem)
 *   7. Retorna a resposta ao frontend
 */
const enviarMensagem = async (req, res, next) => {
  try {
    if (!verificarClienteIA(res)) return;

    const userId         = req.userId;
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

    // Limita o tamanho da mensagem para evitar abusos (10.000 caracteres)
    if (mensagemLimpa.length > 10000) {
      return res.status(400).json({
        sucesso:  false,
        codigo:   'CRM-0605',
        mensagem: 'Mensagem muito longa. Limite: 10.000 caracteres.',
      });
    }

    // --- Verifica se a conversa existe e pertence ao usuário ---
    const conversa = await db('ai_conversations')
      .where({ id: conversationId, user_id: userId, status: 'ativa' })
      .first();

    if (!conversa) {
      return res.status(404).json({
        sucesso:  false,
        codigo:   'CRM-0606',
        mensagem: 'Conversa não encontrada ou já foi arquivada.',
      });
    }

    // --- Salva a mensagem do usuário no banco ---
    const [msgUsuario] = await db('ai_messages')
      .insert({
        conversation_id: conversationId,
        remetente:       'user',
        conteudo:        mensagemLimpa,
        tokens_usados:   0, // Tokens do usuário são contados pela OpenAI na resposta
      })
      .returning(['id', 'remetente', 'conteudo', 'criado_em']);

    // --- Carrega o histórico completo da conversa ---
    // Enviamos todo o histórico para a OpenAI manter o contexto
    const historico = await db('ai_messages')
      .where({ conversation_id: conversationId })
      .orderBy('criado_em', 'asc')
      .select('remetente', 'conteudo');

    // Formata o histórico no padrão da API OpenAI
    const mensagensOpenAI = [
      // System prompt sempre no início
      { role: 'system', content: SYSTEM_PROMPT },
      // Histórico da conversa (inclui a mensagem que acabamos de salvar)
      ...historico.map((msg) => ({
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
      // Trata erros específicos da API OpenAI
      logger.error('[AI] Erro na API OpenAI:', erroOpenAI.message);

      // Remove a mensagem do usuário que foi salva (rollback manual)
      await db('ai_messages').where({ id: msgUsuario.id }).delete();

      // Erros de autenticação (chave inválida)
      if (erroOpenAI.status === 401) {
        return res.status(503).json({
          sucesso:  false,
          codigo:   'CRM-0607',
          mensagem: 'Chave da OpenAI inválida ou expirada. Verifique o arquivo .env.',
        });
      }

      // Limite de rate da API
      if (erroOpenAI.status === 429) {
        return res.status(503).json({
          sucesso:  false,
          codigo:   'CRM-0608',
          mensagem: 'Limite de requisições da OpenAI atingido. Tente novamente em alguns instantes.',
        });
      }

      // Outros erros da OpenAI
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
    const [msgAssistente] = await db('ai_messages')
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
      .returning(['id', 'remetente', 'conteudo', 'tokens_usados', 'criado_em']);

    // --- Atualiza a conversa ---
    const atualizacoes = {
      total_tokens: db.raw('total_tokens + ?', [tokensTotal]),
      atualizado_em: new Date(),
    };

    // Se for a primeira mensagem, gera o título automaticamente
    if (conversa.titulo === 'Nova conversa') {
      atualizacoes.titulo = gerarTituloConversa(mensagemLimpa);
    }

    await db('ai_conversations')
      .where({ id: conversationId })
      .update(atualizacoes);

    logger.info(`[AI] Resposta recebida. Tokens usados: ${tokensTotal} (conversa: ${conversationId})`);

    // --- Retorna a resposta ao frontend ---
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

// =============================================================
// EXPORTAÇÕES
// =============================================================
module.exports = {
  listarConversas,
  criarConversa,
  buscarConversa,
  arquivarConversa,
  enviarMensagem,
};
