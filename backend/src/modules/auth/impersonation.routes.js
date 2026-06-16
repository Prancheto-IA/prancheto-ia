// =============================================================
// PRANCHETO.IA - ROTAS DE IMPERSONATION
// Permite ao Super Admin "acessar como" qualquer usuário.
//
// Prefixo registrado em routes/index.js: /api/admin
//
// ROTAS:
//   POST /api/admin/impersonate/:userId → Inicia sessão como usuário
//   POST /api/admin/impersonate/stop    → Encerra sessão e volta ao admin
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const { iniciarImpersonation, encerrarImpersonation } = require('./impersonation.controller');
const { autenticar, exigirSuperAdmin }                = require('../../middlewares/auth.middleware');

/**
 * POST /api/admin/impersonate/stop
 * Encerra a sessão de impersonation.
 * IMPORTANTE: Esta rota deve vir ANTES de /:userId para não ser capturada como userId='stop'
 * Aceita tanto token de impersonation quanto token de Super Admin.
 */
router.post('/stop', autenticar, encerrarImpersonation);

/**
 * POST /api/admin/impersonate/:userId
 * Inicia uma sessão de impersonation como o usuário especificado.
 * Apenas Super Admin pode chamar esta rota.
 */
router.post('/:userId', autenticar, exigirSuperAdmin, iniciarImpersonation);

module.exports = router;
