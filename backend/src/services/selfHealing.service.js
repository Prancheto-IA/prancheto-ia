// =============================================================
// PRANCHETO.IA - SERVIÇO DE AUTOCORREÇÃO (Self-Healing)
// Monitora continuamente a saúde do sistema e tenta corrigir
// falhas básicas automaticamente, sem derrubar o servidor.
//
// Responsabilidades:
//   1. Monitorar a conexão com o banco de dados (reconexão automática)
//   2. Garantir que o diretório de logs existe (recria se ausente)
//   3. Detectar e registrar erros não tratados (uncaughtException)
//   4. Capturar Promises rejeitadas sem handler (unhandledRejection)
//   5. Notificar o Sentry em caso de falhas críticas irrecuperáveis
// =============================================================

'use strict';

const fs     = require('fs');
const path   = require('path');
const { db, testarConexaoDB } = require('../config/database');
const logger = require('./logger.service');
const Sentry = require('../config/sentry');

// Intervalo de verificação da saúde do sistema (a cada 60 segundos)
const INTERVALO_VERIFICACAO_MS = 60 * 1000;

// Número máximo de tentativas de reconexão antes de notificar o Sentry
const MAX_TENTATIVAS_RECONEXAO = 3;

// Contador de falhas consecutivas de conexão
let falhasConexaoConsecutivas = 0;

// =============================================================
// 1. MONITOR DE CONEXÃO COM O BANCO DE DADOS
// Verifica periodicamente se o banco está acessível.
// Em caso de falha, tenta reconectar automaticamente.
// =============================================================
const monitorarBancoDados = async () => {
  try {
    await testarConexaoDB();
    // Conexão OK: reseta o contador de falhas
    if (falhasConexaoConsecutivas > 0) {
      logger.info('✅ Self-Healing: Conexão com o banco de dados restaurada automaticamente.');
      falhasConexaoConsecutivas = 0;
    }
  } catch (erro) {
    falhasConexaoConsecutivas++;
    logger.warn(`⚠️  Self-Healing: Falha de conexão com o banco (tentativa ${falhasConexaoConsecutivas}/${MAX_TENTATIVAS_RECONEXAO})`, {
      erro: erro.message,
    });

    // Após MAX_TENTATIVAS_RECONEXAO falhas consecutivas, notifica o Sentry
    if (falhasConexaoConsecutivas >= MAX_TENTATIVAS_RECONEXAO) {
      const mensagemCritica = `🚨 CRÍTICO: Banco de dados inacessível após ${MAX_TENTATIVAS_RECONEXAO} tentativas consecutivas.`;
      logger.error(mensagemCritica, { erro: erro.message });
      Sentry.captureMessage(mensagemCritica, {
        level: 'fatal',
        extra: { tentativas: falhasConexaoConsecutivas, erro: erro.message },
      });
      // Reseta o contador para não enviar spam ao Sentry
      falhasConexaoConsecutivas = 0;
    }
  }
};

// =============================================================
// 2. VERIFICAÇÃO DO DIRETÓRIO DE LOGS
// Garante que a pasta de logs existe. Se foi deletada acidentalmente,
// recria automaticamente (Self-Healing básico de filesystem).
// =============================================================
const verificarDiretorioLogs = () => {
  const dirLogs = process.env.LOG_DIR
    ? path.resolve(process.env.LOG_DIR)
    : path.resolve(__dirname, '../../logs');

  if (!fs.existsSync(dirLogs)) {
    try {
      fs.mkdirSync(dirLogs, { recursive: true });
      logger.info(`✅ Self-Healing: Diretório de logs recriado automaticamente: ${dirLogs}`);
    } catch (erro) {
      console.error(`❌ Self-Healing: Não foi possível recriar o diretório de logs: ${erro.message}`);
    }
  }
};

// =============================================================
// 3. CAPTURA DE ERROS NÃO TRATADOS (Processo Node.js)
// Evita que o servidor caia por erros não capturados.
// Registra o erro, notifica o Sentry e tenta continuar.
// =============================================================
const registrarHandlersGlobais = () => {

  // Captura exceções síncronas não tratadas (ex: erro em código síncrono sem try-catch)
  process.on('uncaughtException', (erro) => {
    logger.error('🚨 ERRO NÃO TRATADO (uncaughtException) — Self-Healing ativo', {
      erro:  erro.message,
      stack: erro.stack,
    });

    Sentry.captureException(erro);

    // Para erros críticos de sistema (EADDRINUSE, ENOMEM), encerra o processo
    // O gerenciador de processos (PM2/Docker) reiniciará automaticamente
    const ERROS_FATAIS = ['EADDRINUSE', 'ENOMEM', 'EACCES'];
    if (ERROS_FATAIS.includes(erro.code)) {
      logger.error(`❌ Erro fatal irrecuperável (${erro.code}). Encerrando processo para reinicialização.`);
      process.exit(1);
    }

    // Para outros erros, tenta continuar (Self-Healing)
    logger.warn('⚠️  Self-Healing: Continuando execução após erro não tratado.');
  });

  // Captura Promises rejeitadas sem handler .catch()
  process.on('unhandledRejection', (motivo, promise) => {
    logger.error('🚨 PROMISE REJEITADA SEM HANDLER (unhandledRejection)', {
      motivo: motivo?.message || String(motivo),
      stack:  motivo?.stack,
    });

    Sentry.captureException(motivo instanceof Error ? motivo : new Error(String(motivo)));
  });

  // Captura sinal de encerramento gracioso (SIGTERM — usado pelo Docker/PM2)
  process.on('SIGTERM', async () => {
    logger.info('📴 Sinal SIGTERM recebido. Encerrando servidor graciosamente...');
    try {
      // Fecha o pool de conexões do banco antes de encerrar
      await db.destroy();
      logger.info('✅ Pool de conexões do banco encerrado com sucesso.');
    } catch (erro) {
      logger.error('Erro ao encerrar pool de conexões', { erro: erro.message });
    }
    process.exit(0);
  });

  logger.info('✅ Self-Healing: Handlers globais de erro registrados.');
};

// =============================================================
// 4. INICIALIZAÇÃO DO SERVIÇO DE AUTOCORREÇÃO
// Deve ser chamado UMA VEZ na inicialização do servidor (app.js).
// =============================================================
const iniciarSelfHealing = () => {
  logger.info('🔄 Iniciando serviço de Self-Healing...');

  // Registra os handlers globais de erro
  registrarHandlersGlobais();

  // Verifica o diretório de logs imediatamente
  verificarDiretorioLogs();

  // Inicia o monitoramento periódico do banco de dados
  const intervalo = setInterval(async () => {
    verificarDiretorioLogs();
    await monitorarBancoDados();
  }, INTERVALO_VERIFICACAO_MS);

  // Garante que o intervalo não impede o processo de encerrar
  intervalo.unref();

  logger.info(`✅ Self-Healing ativo. Verificação a cada ${INTERVALO_VERIFICACAO_MS / 1000}s.`);
};

module.exports = { iniciarSelfHealing, monitorarBancoDados };
