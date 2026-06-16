// =============================================================
// PRANCHETO.IA - ROTAS DE USUÁRIOS
// Gerenciamento de usuários dentro de um tenant.
// Admins do tenant podem criar/editar usuários do seu tenant.
// Super Admin pode gerenciar usuários de qualquer tenant.
//
// Prefixo: /api/users
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const {
  listarUsuarios,
  criarUsuario,
  obterUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
} = require('./users.controller');

const { autenticar }                    = require('../../middlewares/auth.middleware');
const { exigirNivelMinimo,
        garantirIsolamentoTenant }       = require('../../middlewares/rbac.middleware');
const { injetarTenant }                 = require('../../middlewares/tenant.middleware');

// Aplica autenticação + isolamento de tenant em TODAS as rotas
router.use(autenticar, injetarTenant, garantirIsolamentoTenant);

// GET    /api/users          → Listar usuários (admin ou superior)
router.get('/',    exigirNivelMinimo('admin'), listarUsuarios);

// POST   /api/users          → Criar usuário (admin ou superior)
router.post('/',   exigirNivelMinimo('admin'), criarUsuario);

// GET    /api/users/:id      → Ver detalhes (manager ou superior)
router.get('/:id', exigirNivelMinimo('manager'), obterUsuario);

// PUT    /api/users/:id      → Atualizar usuário (admin ou superior)
router.put('/:id', exigirNivelMinimo('admin'), atualizarUsuario);

// PATCH  /api/users/:id/status → Ativar/desativar (admin ou superior)
router.patch('/:id/status', exigirNivelMinimo('admin'), alterarStatusUsuario);

module.exports = router;
