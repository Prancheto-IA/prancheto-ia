// =============================================================
// PRANCHETO.IA - ROTAS DO MÓDULO DE CHAT COM IA
// Todas as rotas aqui são protegidas por:
//   1. autenticar       → Verifica JWT válido
//   2. exigirSuperAdmin → Garante que só o Super Admin acessa
//
// Prefixo registrado em routes/index.js: /api/ai
//
// ROTAS DISPONÍVEIS:
//   GET    /api/ai/conversations              → Listar conversas
//   POST   /api/ai/conversations              → Criar nova conversa
//   GET    /api/ai/conversations/:id          → Buscar conversa + mensagens
//   DELETE /api/ai/conversations/:id          → Arquivar conversa
//   POST   /api/ai/conversations/:id/messages → Enviar mensagem à IA
// =============================================================

'use strict';

const express         = require('express');
const router          = express.Router();
const aiController    = require('./ai.controller');
const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');

// ----------------------------------------------------------
// PROTEÇÃO GLOBAL: Todas as rotas deste módulo exigem
// autenticação E cargo de Super Admin.
// ----------------------------------------------------------
router.use(autenticar);
router.use(exigirSuperAdmin);

// ----------------------------------------------------------
// ROTAS DE CONVERSAS
// ----------------------------------------------------------

/**
 * GET /api/ai/conversations
 * Lista todas as conversas ativas do Super Admin autenticado.
 * Retorna metadados (sem mensagens) para montar a sidebar.
 */
router.get('/conversations', aiController.listarConversas);

/**
 * POST /api/ai/conversations
 * Cria uma nova sessão de conversa vazia.
 * Body (opcional): { titulo: string }
 */
router.post('/conversations', aiController.criarConversa);

/**
 * GET /api/ai/conversations/:id
 * Retorna os dados da conversa + todas as mensagens em ordem cronológica.
 * Usado para carregar o histórico ao abrir uma conversa existente.
 */
router.get('/conversations/:id', aiController.buscarConversa);

/**
 * DELETE /api/ai/conversations/:id
 * Arquiva a conversa (soft delete — status muda para 'arquivada').
 * Os dados são mantidos no banco para auditoria.
 */
router.delete('/conversations/:id', aiController.arquivarConversa);

// ----------------------------------------------------------
// ROTAS DE MENSAGENS
// ----------------------------------------------------------

/**
 * POST /api/ai/conversations/:id/messages
 * Envia uma mensagem do usuário e retorna a resposta da IA.
 * Body obrigatório: { mensagem: string }
 *
 * Fluxo interno:
 *   1. Salva mensagem do usuário no banco
 *   2. Carrega histórico completo da conversa
 *   3. Envia para a OpenAI com system prompt
 *   4. Salva resposta da IA no banco
 *   5. Atualiza contador de tokens
 *   6. Retorna resposta ao frontend
 */
router.post('/conversations/:id/messages', aiController.enviarMensagem);

module.exports = router;
