'use strict';

const express = require('express');
const router  = express.Router();
const { autenticar } = require('../../middlewares/auth.middleware');
const {
  listarAcoes,
  criarAcao,
  atualizarAcao,
  excluirAcao,
} = require('./outbound.controller');

// Todas as rotas exigem autenticação
router.use(autenticar);

// GET    /api/outbound          → listar ações do tenant
router.get('/',     listarAcoes);

// POST   /api/outbound          → criar nova ação
router.post('/',    criarAcao);

// PUT    /api/outbound/:id      → atualizar ação
router.put('/:id',  atualizarAcao);

// DELETE /api/outbound/:id      → excluir ação
router.delete('/:id', excluirAcao);

module.exports = router;
