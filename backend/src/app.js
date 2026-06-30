// =============================================================
// PRANCHETO.IA - BACK-END - ARQUIVO PRINCIPAL DO SERVIDOR
// Responsável por inicializar o Express, registrar middlewares
// globais e subir o servidor na porta configurada.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

// --- 1. CARREGAMENTO DAS VARIÁVEIS DE AMBIENTE ---
require('dotenv').config();

// --- 2. INICIALIZAÇÃO DO SENTRY (Monitoramento de Erros) ---
const Sentry = require('./config/sentry');

// --- 3. IMPORTS PRINCIPAIS ---
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');

// --- 4. IMPORTS INTERNOS ---
const { validarEnv }         = require('./config/env');
const { supabase, testarConexaoDB } = require('./config/database');
const logger                 = require('./services/logger.service');
const errorHandler           = require('./middlewares/errorHandler');
const securityMiddleware     = require('./middlewares/security.middleware');
const rotasPrincipais        = require('./routes/index');
const { iniciarSelfHealing } = require('./services/selfHealing.service');

// --- 5. VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE ---
validarEnv();

// --- 6. CRIAÇÃO DA INSTÂNCIA DO EXPRESS ---
const app = express();

// Confia nos proxies reversos (Nginx, Railway, Render) para ler o IP correto do cliente
app.set('trust proxy', 1);

// =============================================================
// MIDDLEWARES GLOBAIS
// Ordem importa: segurança → parsing → rotas → erros
// =============================================================

// Helmet: headers HTTP de segurança (XSS, clickjacking, etc.)
app.use(helmet());

// CORS: permite apenas origens configuradas no .env
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true,
}));

// Parsing de JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middlewares de segurança customizados (rate limiting, detecção de anomalias)
app.use(securityMiddleware.default);

// =============================================================
// ROTAS
// =============================================================

// Health Check (pública — para monitores externos como UptimeRobot)
app.get('/api/health', async (req, res) => {
  try {
    await testarConexaoDB();
    res.status(200).json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      ambiente:  process.env.NODE_ENV,
      banco:     'supabase',
    });
  } catch (erro) {
    logger.error('Health Check falhou - Supabase inacessível', { erro: erro.message });
    res.status(503).json({
      status:    'error',
      mensagem:  'Banco de dados inacessível',
      timestamp: new Date().toISOString(),
    });
  }
});

// Todas as demais rotas da API (prefixo /api)
app.use('/api', rotasPrincipais);

// Rota 404: captura qualquer rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    erro:   'Rota não encontrada',
    codigo: 'CRM-0404',
    path:   req.originalUrl,
  });
});

// =============================================================
// TRATAMENTO DE ERROS GLOBAL (deve ser o ÚLTIMO middleware)
// =============================================================
app.use(errorHandler);

// =============================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================
const PORTA = process.env.PORT || 3001;

const iniciarServidor = async () => {
  try {
    // Testa a conexão com o Supabase antes de abrir o servidor
    logger.info('Verificando conexão com o Supabase...');
    await testarConexaoDB();
    logger.info('✅ Supabase conectado com sucesso.');

    // Garante que o Super Admin existe e está desbloqueado na inicialização.
    // IMPORTANTE: NÃO reseta a senha se o admin já existe — isso invalidaria
    // tokens JWT ativos e causaria loop de login.
    const emailSuperAdmin = process.env.SUPER_ADMIN_EMAIL;
    const senhaSuperAdmin = process.env.SUPER_ADMIN_PASSWORD;

    if (emailSuperAdmin && senhaSuperAdmin) {
      const bcrypt = require('bcryptjs');

      // Verifica se o super admin já existe
      const { data: admins } = await supabase
        .from('users')
        .select('id, tentativas_login_falhas, bloqueado_ate')
        .eq('email', emailSuperAdmin)
        .limit(1);

      if (admins?.length > 0) {
        // Apenas desbloqueia — NÃO reseta a senha para não invalidar tokens ativos
        const admin = admins[0];
        if (admin.tentativas_login_falhas > 0 || admin.bloqueado_ate) {
          await supabase
            .from('users')
            .update({
              tentativas_login_falhas: 0,
              bloqueado_ate:           null,
            })
            .eq('email', emailSuperAdmin);
          logger.info('🔓 Super Admin desbloqueado na inicialização.');
        } else {
          logger.info('✅ Super Admin verificado — sem bloqueios.');
        }
      } else {
        // Cria o super admin apenas se não existir
        const senhaHash = await bcrypt.hash(senhaSuperAdmin, 12);
        await supabase.from('users').insert({
          nome:                    process.env.SUPER_ADMIN_NOME || 'Super Admin',
          email:                   emailSuperAdmin,
          senha_hash:              senhaHash,
          cargo:                   'super_admin',
          ativo:                   true,
          tenant_id:               null,
          permissoes:              {},
          tentativas_login_falhas: 0,
        });
        logger.info('👤 Super Admin criado na inicialização.');
      }
    }

    // Inicia o serviço de Self-Healing
    iniciarSelfHealing();

    // Sobe o servidor HTTP
    app.listen(PORTA, () => {
      logger.info(`🚀 Servidor Prancheto.IA rodando na porta ${PORTA}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health Check: http://localhost:${PORTA}/api/health`);
    });
  } catch (erro) {
    logger.error('❌ FALHA CRÍTICA: Não foi possível conectar ao Supabase na inicialização.', {
      erro: erro.message,
    });
    Sentry.captureException(erro);
    process.exit(1);
  }
};

iniciarServidor();

module.exports = app;
