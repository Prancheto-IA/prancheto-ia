'use strict';

const express = require('express');
const router  = express.Router();
const { autenticar } = require('../../middlewares/auth.middleware');
const { buscarPreferencias, atualizarPreferencias } = require('./preferencias.controller');

// Todas as rotas exigem autenticação
router.use(autenticar);

// GET /api/preferencias — busca preferências do usuário logado
router.get('/', buscarPreferencias);

// PUT /api/preferencias — atualiza preferências do usuário logado
router.put('/', atualizarPreferencias);

module.exports = router;
