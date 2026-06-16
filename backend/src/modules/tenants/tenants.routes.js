// =============================================================
// PRANCHETO.IA - ROTAS DE TENANTS (Gestão de Clientes)
// Todas as rotas aqui são EXCLUSIVAS da Conta Tronco (Super Admin).
// Qualquer tentativa de acesso por usuário comum é bloqueada
// pelo middleware exigirSuperAdmin.
//
// Prefixo: /api/admin/tenants
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

const {
  listarTenants,
  criarTenant,
  obterTenant,
  atualizarTenant,
  alterarStatusTenant,
} = require('./tenants.controller');

const { autenticar, exigirSuperAdmin } = require('../../middlewares/auth.middleware');

// Aplica autenticação + verificação de Super Admin em TODAS as rotas deste módulo
router.use(autenticar, exigirSuperAdmin);

// GET    /api/admin/tenants          → Listar todos os clientes (com paginação)
router.get('/',    listarTenants);

// POST   /api/admin/tenants          → Criar novo cliente
router.post('/',   criarTenant);

// GET    /api/admin/tenants/:id      → Detalhes de um cliente específico
router.get('/:id', obterTenant);

// PUT    /api/admin/tenants/:id      → Atualizar dados do cliente
router.put('/:id', atualizarTenant);

// PATCH  /api/admin/tenants/:id/status → Suspender/reativar/cancelar cliente
router.patch('/:id/status', alterarStatusTenant);

module.exports = router;
