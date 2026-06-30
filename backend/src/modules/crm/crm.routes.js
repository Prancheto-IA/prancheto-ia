'use strict';

const express = require('express');
const router  = express.Router();
const { autenticar } = require('../../middlewares/auth.middleware');
const {
  listarContatos, criarContato, buscarContato, atualizarContato, excluirContato,
  listarInteracoes, criarInteracao, kanban,
} = require('./crm.controller');

router.use(autenticar);

// Kanban
router.get('/kanban', kanban);

// Contatos
router.get('/contatos',      listarContatos);
router.post('/contatos',     criarContato);
router.get('/contatos/:id',  buscarContato);
router.put('/contatos/:id',  atualizarContato);
router.delete('/contatos/:id', excluirContato);

// Interações por contato
router.get('/contatos/:id/interacoes',  listarInteracoes);
router.post('/contatos/:id/interacoes', criarInteracao);

module.exports = router;
