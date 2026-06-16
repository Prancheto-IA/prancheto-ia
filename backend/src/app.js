// =============================================================
// PRANCHETO.IA - BACK-END - ARQUIVO PRINCIPAL DO SERVIDOR
// Responsável por inicializar o Express, registrar middlewares
// globais e subir o servidor na porta configurada.
// =============================================================

'use strict';

// --- 1. CARREGAMENTO DAS VARIÁVEIS DE AMBIENTE ---
// Deve ser a primeira instrução do arquivo para garantir que
// todas as variáveis do .env estejam disponíveis antes de qualquer import.
require('dotenv').config();

// --- 2. INICIALIZAÇÃO DO SENTRY (Monitoramento de Erros) ---
// O Sentry DEVE ser inicializado antes de qualquer outro módulo
// para capturar erros em toda a aplicação.
const Sentry = require('./config/sentry');

// --- 3. IMPORTS PRINCIPAIS ---
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');

// --- 4. IMPORTS INTERNOS ---
const { validarEnv }         = require('./config/env');
const { testarConexaoDB }    = require('./config/database');
const logger                 = require('./services/logger.service');
const errorHandler           = require('./middlewares/errorHandler');
const securityMiddleware     = require('./middlewares/security.middleware');
const rotasPrincipais        = require('./routes/index');
const { iniciarSelfHealing } = require('./services/selfHealing.service');

// --- 5. VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE ---
// Garante que o servidor não suba sem as configurações obrigatórias.
validarEnv();

// --- 6. CRIAÇÃO DA INSTÂNCIA DO EXPRESS ---
const app = express();

// =============================================================
// BLOCO DE MIDDLEWARES GLOBAIS
// Ordem importa: segurança → parsing → rotas → erros
// =============================================================

// 6.1 - Handler de erros do Sentry (deve vir antes dos outros handlers)
//app.use(Sentry.Handlers.requestHandler());
//app.use(Sentry.Handlers.tracingHandler());

// 6.2 - Helmet: define headers HTTP de segurança (XSS, clickjacking, etc.)
app.use(helmet());

// 6.3 - CORS: permite apenas origens configuradas no .env
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  credentials: true,
}));

// 6.4 - Parsing de JSON e URL-encoded (limite de 10mb para uploads de dados)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6.5 - Middlewares de segurança customizados (rate limiting, detecção de anomalias)
// Usa o array 'default' exportado pelo security.middleware.js
app.use(securityMiddleware.default);

// =============================================================
// BLOCO DE ROTAS
// =============================================================

// 7.1 - Rota de Health Check (pública, para monitores externos como Better Stack/UptimeRobot)
// Responde {"status":"ok"} apenas quando servidor E banco estão funcionando.
app.get('/api/health', async (req, res) => {
  try {
    // Testa a conexão com o banco de dados antes de responder "ok"
    await testarConexaoDB();
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      ambiente: process.env.NODE_ENV,
    });
  } catch (erro) {
    // Se o banco falhar, retorna 503 (Service Unavailable) para o monitor detectar a queda
    logger.error('Health Check falhou - banco de dados inacessível', { erro: erro.message });
    res.status(503).json({
      status: 'error',
      mensagem: 'Banco de dados inacessível',
      timestamp: new Date().toISOString(),
    });
  }
});

// 7.2 - Todas as demais rotas da API (prefixo /api)
app.use('/api', rotasPrincipais);

// 7.3 - Rota 404: captura qualquer rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    codigo: 'CRM-0404',
    path: req.originalUrl,
  });
});

// =============================================================
// BLOCO DE TRATAMENTO DE ERROS GLOBAL
// Deve ser o ÚLTIMO middleware registrado
// =============================================================

// 8.1 - Handler de erros do Sentry (captura erros antes do handler customizado)
//app.use(Sentry.Handlers.errorHandler());

// 8.2 - Handler de erros customizado do Prancheto.IA
app.use(errorHandler);

// =============================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================
const PORTA = process.env.PORT || 3001;

const iniciarServidor = async () => {
  try {
    // Testa a conexão com o banco antes de abrir o servidor para requisições
    logger.info('Verificando conexão com o banco de dados...');
    await testarConexaoDB();
    logger.info('✅ Banco de dados conectado com sucesso.');

    // Inicia o serviço de Self-Healing (monitoramento contínuo e handlers globais)
    iniciarSelfHealing();

    // Sobe o servidor HTTP
    app.listen(PORTA, () => {
      logger.info(`🚀 Servidor Prancheto.IA rodando na porta ${PORTA}`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV}`);
      logger.info(`🔗 Health Check disponível em: http://localhost:${PORTA}/api/health`);
    });
  } catch (erro) {
    // Se o banco não conectar na inicialização, registra o erro e encerra o processo
    logger.error('❌ FALHA CRÍTICA: Não foi possível conectar ao banco de dados na inicialização.', {
      erro: erro.message,
    });
    // Notifica o Sentry sobre a falha crítica de inicialização
    Sentry.captureException(erro);
    process.exit(1); // Encerra o processo com código de erro
  }
};

// Inicia o servidor
iniciarServidor();

module.exports = app; // Exporta para uso em testes automatizados
