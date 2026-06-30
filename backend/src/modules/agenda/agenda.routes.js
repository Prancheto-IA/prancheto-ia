'use strict';

const express = require('express');
const router  = express.Router();
const { autenticar } = require('../../middlewares/auth.middleware');
const {
  listarEventos,
  criarEvento,
  atualizarEvento,
  excluirEvento,
} = require('./agenda.controller');

// Todas as rotas exigem autenticação
router.use(autenticar);

// GET    /api/agenda          → listar eventos do usuário
router.get('/',     listarEventos);

// POST   /api/agenda          → criar novo evento
router.post('/',    criarEvento);

// PUT    /api/agenda/:id      → atualizar evento
router.put('/:id',  atualizarEvento);

// DELETE /api/agenda/:id      → excluir evento
router.delete('/:id', excluirEvento);

module.exports = router;
