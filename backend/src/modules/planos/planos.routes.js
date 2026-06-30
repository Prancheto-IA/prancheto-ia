// =============================================================
// PRANCHETO.IA - ROTAS DE PLANOS
// GET /api/planos          → Lista todos os planos (autenticado)
// GET /api/planos/meu-plano → Plano do tenant do usuário logado
// =============================================================

'use strict';

const express    = require('express');
const router     = express.Router();
const { autenticar } = require('../../middlewares/auth.middleware');
const { listarPlanos, meuPlano } = require('./planos.controller');

// Lista todos os planos ativos (qualquer usuário autenticado)
router.get('/', autenticar, listarPlanos);

// Retorna o plano e recursos do tenant do usuário logado
router.get('/meu-plano', autenticar, meuPlano);

module.exports = router;
