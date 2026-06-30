// =============================================================
// PRANCHETO.IA - SERVIÇO DE AUTOCORREÇÃO (Self-Healing)
// Monitora continuamente a saúde do sistema e tenta corrigir
// falhas básicas automaticamente, sem derrubar o servidor.
// Migrado de Knex.js para @supabase/supabase-js
// =============================================================

'use strict';

const fs     = require('fs');
const path   = require('path');
const { testarConexaoDB } = require('../config/database');
const logger = require('./logger.service');
const Sentry = require('../config/sentry');

// Intervalo de verificação da saúde do sistema (a cada 60 segundos)
const INTERVALO_VERIFICACAO_MS = 60 * 1000;

// Número máximo de tentativas de reconexão antes de notificar o Sentry
const MAX_TENTATIVAS_RECONEXAO = 3;

// Contador de falhas consecutivas de conexão
let falhasConexaoConsecutivas = 0;

// =============================================================
// 1. MONITOR DE CONEXÃO COM O BANCO DE DADOS (Supabase)
// =============================================================
const monitorarBancoDados = async () => {
  try {
    await testarConexaoDB();
    // Conexão OK: reseta o contador de falhas
    if (falhasConexaoConsecutivas > 0) {
      logger.info('✅ Self-Healing: Conexão com o Supabase restaurada automaticamente.');
      falhasConexaoConsecutivas = 0;
    }
  } catch (erro) {
    falhasConexaoConsecutivas++;
    logger.warn(`⚠️  Self-Healing: Falha de conexão com o Supabase (tentativa ${falhasConexaoConsecutivas}/${MAX_TENTATIVAS_RECONEXAO})`, {
      erro: erro.message,
    });

    // Após MAX_TENTATIVAS_RECONEXAO falhas consecutivas, notifica o Sentry
    if (falhasConexaoConsecutivas >= MAX_TENTATIVAS_RECONEXAO) {
      const mensagemCritica = `🚨 CRÍTICO: Supabase inacessível após ${MAX_TENTATIVAS_RECONEXAO} tentativas consecutivas.`;
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
// =============================================================
const registrarHandlersGlobais = () => {

  process.on('uncaughtException', (erro) => {
    logger.error('🚨 ERRO NÃO TRATADO (uncaughtException) — Self-Healing ativo', {
      erro:  erro.message,
      stack: erro.stack,
    });

    Sentry.captureException(erro);

    const ERROS_FATAIS = ['EADDRINUSE', 'ENOMEM', 'EACCES'];
    if (ERROS_FATAIS.includes(erro.code)) {
      logger.error(`❌ Erro fatal irrecuperável (${erro.code}). Encerrando processo para reinicialização.`);
      process.exit(1);
    }

    logger.warn('⚠️  Self-Healing: Continuando execução após erro não tratado.');
  });

  process.on('unhandledRejection', (motivo) => {
    logger.error('🚨 PROMISE REJEITADA SEM HANDLER (unhandledRejection)', {
      motivo: motivo?.message || String(motivo),
      stack:  motivo?.stack,
    });

    Sentry.captureException(motivo instanceof Error ? motivo : new Error(String(motivo)));
  });

  // Encerramento gracioso (SIGTERM — usado pelo Docker/PM2/Railway/Render)
  // Nota: Supabase usa HTTP/WebSocket — não há pool de conexões para fechar.
  process.on('SIGTERM', async () => {
    logger.info('📴 Sinal SIGTERM recebido. Encerrando servidor graciosamente...');
    logger.info('✅ Supabase client encerrado (sem pool de conexões para destruir).');
    process.exit(0);
  });

  logger.info('✅ Self-Healing: Handlers globais de erro registrados.');
};

// =============================================================
// 4. INICIALIZAÇÃO DO SERVIÇO DE AUTOCORREÇÃO
// =============================================================
const iniciarSelfHealing = () => {
  logger.info('🔄 Iniciando serviço de Self-Healing...');

  registrarHandlersGlobais();
  verificarDiretorioLogs();

  const intervalo = setInterval(async () => {
    verificarDiretorioLogs();
    await monitorarBancoDados();
  }, INTERVALO_VERIFICACAO_MS);

  intervalo.unref();

  logger.info(`✅ Self-Healing ativo. Verificação a cada ${INTERVALO_VERIFICACAO_MS / 1000}s.`);
};

module.exports = { iniciarSelfHealing, monitorarBancoDados };
