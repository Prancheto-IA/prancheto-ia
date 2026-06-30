// =============================================================
// PRANCHETO.IA - ROTAS DO MÓDULO DE CHAT COM IA
// Protegidas por autenticação JWT (qualquer usuário logado).
// Aliases em PT-BR para compatibilidade com o frontend.
//
// Prefixo registrado em routes/index.js: /api/ai
//
// ROTAS DISPONÍVEIS:
//   GET    /api/ai/conversas              → Listar conversas
//   POST   /api/ai/conversas              → Criar nova conversa
//   GET    /api/ai/conversas/:id          → Buscar conversa + mensagens
//   DELETE /api/ai/conversas/:id          → Arquivar conversa
//   POST   /api/ai/conversas/:id/mensagens → Enviar mensagem à IA
// =============================================================

'use strict';

const express      = require('express');
const router       = express.Router();
const aiController = require('./ai.controller');
const { autenticar } = require('../../middlewares/auth.middleware');

// ----------------------------------------------------------
// PROTEÇÃO GLOBAL: autenticação JWT (qualquer cargo)
// O controller filtra por user_id, garantindo isolamento.
// ----------------------------------------------------------
router.use(autenticar);

// ----------------------------------------------------------
// ROTAS DE CONVERSAS (aliases PT-BR)
// ----------------------------------------------------------

/** GET /api/ai/conversas — Lista conversas do usuário logado */
router.get('/conversas', aiController.listarConversas);

/** POST /api/ai/conversas — Cria nova conversa */
router.post('/conversas', aiController.criarConversa);

/** GET /api/ai/conversas/:id — Busca conversa + mensagens */
router.get('/conversas/:id', aiController.buscarConversa);

/** DELETE /api/ai/conversas/:id — Arquiva conversa */
router.delete('/conversas/:id', aiController.arquivarConversa);

// ----------------------------------------------------------
// ROTAS DE MENSAGENS
// ----------------------------------------------------------

/** POST /api/ai/conversas/:id/mensagens — Envia mensagem à IA */
router.post('/conversas/:id/mensagens', aiController.enviarMensagem);

// ----------------------------------------------------------
// ALIASES EM INGLÊS (retrocompatibilidade com Admin Panel)
// ----------------------------------------------------------
router.get('/conversations',              aiController.listarConversas);
router.post('/conversations',             aiController.criarConversa);
router.get('/conversations/:id',          aiController.buscarConversa);
router.delete('/conversations/:id',       aiController.arquivarConversa);
router.post('/conversations/:id/messages', aiController.enviarMensagem);

module.exports = router;
