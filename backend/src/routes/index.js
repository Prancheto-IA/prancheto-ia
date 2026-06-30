// =============================================================
// PRANCHETO.IA - ROTEADOR PRINCIPAL DA API
// Agrega todas as rotas dos módulos em um único ponto de entrada.
// Todas as rotas aqui registradas ficam sob o prefixo /api
// (definido no app.js).
//
// ESTRUTURA DE ROTAS:
//   POST   /api/auth/login                        → Autenticação
//   POST   /api/auth/refresh                      → Renovação de token
//   GET    /api/users                             → Gestão de usuários (tenant)
//   GET    /api/sections                          → Biblioteca de Seções
//   GET    /api/modules                           → Biblioteca de Módulos
//   GET    /api/tabs                              → Biblioteca de Abas
//   GET    /api/widgets                           → Biblioteca de Widgets
//   GET    /api/admin/tenants                     → Gestão de clientes (Super Admin)
//   GET    /api/ai/conversations                  → Listar conversas com IA (Super Admin)
//   POST   /api/ai/conversations                  → Criar nova conversa
//   GET    /api/ai/conversations/:id              → Buscar conversa + mensagens
//   DELETE /api/ai/conversations/:id              → Arquivar conversa
//   POST   /api/ai/conversations/:id/messages     → Enviar mensagem à IA
// =============================================================

'use strict';

const express = require('express');
const router  = express.Router();

// =============================================================
// IMPORTAÇÃO DAS ROTAS DE CADA MÓDULO
// Cada módulo tem seu próprio arquivo de rotas.
// Descomente as linhas abaixo conforme os módulos forem criados.
// =============================================================

// --- Módulo de Autenticação (ATIVO) ---
const rotasAuth    = require('../modules/auth/auth.routes');

// --- Módulo de Usuários (ATIVO) ---
const rotasUsers   = require('../modules/users/users.routes');

// --- Módulo Administrativo - Tenants (ATIVO - Super Admin) ---
const rotasAdmin              = require('../modules/tenants/tenants.routes');

// --- Módulo Administrativo - Usuários (ATIVO - Super Admin) ---
const rotasAdminUsuarios      = require('../modules/users/admin-users.routes');

// --- Módulo de Chat com IA (ATIVO - Super Admin) ---
const rotasAI                 = require('../modules/ai/ai.routes');

// --- Módulo de Impersonation (ATIVO - Super Admin) ---
const rotasImpersonation      = require('../modules/auth/impersonation.routes');

// --- Módulo de Logs de Auditoria (ATIVO - Super Admin) ---
const rotasAuditLogs          = require('../modules/auth/audit-logs.routes');

// --- Módulo de Monitoramento (ATIVO - Super Admin) ---
const rotasMonitoring         = require('../modules/monitoring/monitoring.routes');

// --- Módulo de Planos (ATIVO - todos os usuários autenticados) ---
const rotasPlanos             = require('../modules/planos/planos.routes');

// --- Módulo de CRM (ATIVO) ---
const rotasCRM                = require('../modules/crm/crm.routes');

// --- Módulo de Preferências do Usuário (ATIVO) ---
const rotasPreferencias       = require('../modules/preferencias/preferencias.routes');

// --- Módulo de Agenda (ATIVO) ---
const rotasAgenda             = require('../modules/agenda/agenda.routes');

// --- Módulo de Outbound (ATIVO) ---
const rotasOutbound           = require('../modules/outbound/outbound.routes');

// --- Módulo de Seções (Nível 1 da hierarquia) ---
// const rotasSections = require('../modules/sections/sections.routes');

// --- Módulo de Módulos (Nível 2 da hierarquia) ---
// const rotasModules = require('../modules/modules-lib/modules.routes');

// --- Módulo de Abas (Nível 3 da hierarquia) ---
// const rotasTabs = require('../modules/tabs/tabs.routes');

// --- Módulo de Widgets (Nível 4 da hierarquia) ---
// const rotasWidgets = require('../modules/widgets/widgets.routes');

// =============================================================
// REGISTRO DAS ROTAS
// =============================================================

// Autenticação: login, logout, refresh, /me
router.use('/auth',        rotasAuth);

// Gestão de usuários do tenant
router.use('/users',       rotasUsers);

// Painel Admin (Super Admin): gestão de clientes/tenants
router.use('/admin/tenants', rotasAdmin);

// Painel Admin (Super Admin): gestão de usuários de todos os tenants
router.use('/admin/usuarios', rotasAdminUsuarios);

// Chat com IA (Super Admin): conversas e mensagens com OpenAI
router.use('/ai', rotasAI);

// Impersonation (Super Admin): acessar como qualquer usuário
router.use('/admin/impersonate', rotasImpersonation);

// Logs de auditoria (Super Admin): segurança e rastreabilidade
router.use('/admin/logs', rotasAuditLogs);

// Monitoramento (Super Admin): métricas e saúde do sistema
router.use('/admin/monitoring', rotasMonitoring);

// Planos: lista planos e recursos disponíveis
router.use('/planos', rotasPlanos);

// CRM: contatos, interações, kanban
router.use('/crm', rotasCRM);

// Preferências do usuário: tema, notificações, idioma
router.use('/preferencias', rotasPreferencias);

// Agenda: CRUD de eventos/compromissos
router.use('/agenda', rotasAgenda);

// Outbound: CRUD de ações de prospecção
router.use('/outbound', rotasOutbound);

// router.use('/sections', rotasSections);
// router.use('/modules',  rotasModules);
// router.use('/tabs',     rotasTabs);
// router.use('/widgets',  rotasWidgets);

// --- Rota de status da API (útil para verificar se o roteador está ativo) ---
router.get('/status', (req, res) => {
  res.json({
    api:     'Prancheto.IA API',
    versao:  '1.0.0',
    status:  'online',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
