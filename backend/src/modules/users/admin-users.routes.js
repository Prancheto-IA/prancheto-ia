// =============================================================
// PRANCHETO.IA - ROTAS ADMIN DE USUÁRIOS (Super Admin)
// Gerenciamento de usuários de TODOS os tenants.
// Exclusivo para o Super Admin via painel administrativo.
//
// Prefixo: /api/admin/usuarios
// Proteção: autenticar + exigirSuperAdmin
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const {
  listarUsuariosAdmin,
  criarUsuarioAdmin,
  obterUsuarioAdmin,
  atualizarUsuarioAdmin,
  alterarStatusUsuarioAdmin,
} = require('./admin-users.controller');

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');

// Aplica autenticação + verificação de Super Admin em TODAS as rotas
router.use(autenticar, exigirSuperAdmin);

// GET    /api/admin/usuarios              → Listar todos os usuários (com filtros)
router.get('/', listarUsuariosAdmin);

// POST   /api/admin/usuarios              → Criar usuário em qualquer tenant
router.post('/', criarUsuarioAdmin);

// GET    /api/admin/usuarios/:id          → Detalhes de um usuário
router.get('/:id', obterUsuarioAdmin);

// PUT    /api/admin/usuarios/:id          → Atualizar nome/cargo/senha
router.put('/:id', atualizarUsuarioAdmin);

// PATCH  /api/admin/usuarios/:id/status   → Ativar ou desativar usuário
router.patch('/:id/status', alterarStatusUsuarioAdmin);

module.exports = router;
