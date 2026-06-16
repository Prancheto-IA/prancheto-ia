// =============================================================
// PRANCHETO.IA - ROTAS DE AUTENTICAÇÃO
// Define os endpoints públicos e protegidos de autenticação.
//
// Rotas:
//   POST /api/auth/login    → Login (pública)
//   POST /api/auth/refresh  → Renovar token (pública com refresh token)
//   POST /api/auth/logout   → Logout (protegida — exige token válido)
//   GET  /api/auth/me       → Dados do usuário logado (protegida)
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const { login, refresh, logout } = require('./auth.controller');
const { autenticar }             = require('../../middlewares/auth.middleware');
const { rateLimiterAuth }        = require('../../middlewares/security.middleware');

// --- POST /api/auth/login ---
// Rate limiter específico para login (máx. 10 tentativas por 15 min por IP)
router.post('/login', rateLimiterAuth, login);

// --- POST /api/auth/refresh ---
// Renova o token JWT usando o refresh token
router.post('/refresh', refresh);

// --- POST /api/auth/logout ---
// Exige autenticação para invalidar o token no banco
router.post('/logout', autenticar, logout);

// --- GET /api/auth/me ---
// Retorna os dados do usuário atualmente logado
router.get('/me', autenticar, (req, res) => {
  res.json({
    id:          req.userId,
    tenantId:    req.tenantId,
    cargo:       req.userCargo,
    email:       req.userEmail,
    isSuperAdmin: req.isSuperAdmin,
    permissoes:  req.permissoes,
  });
});

module.exports = router;
