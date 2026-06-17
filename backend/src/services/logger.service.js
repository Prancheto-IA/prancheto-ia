// =============================================================
// PRANCHETO.IA - SERVIÇO DE LOGS ESTRUTURADOS (Winston)
// Registra todos os eventos do sistema com:
//   - Timestamp preciso
//   - Nível de severidade (info, warn, error)
//   - Arquivo e linha de origem do erro (via stack trace)
//   - Saída simultânea no console (dev) e em arquivo (produção)
// =============================================================

'use strict';

const winston = require('winston');
const path    = require('path');
const fs      = require('fs');

// --- GARANTE QUE O DIRETÓRIO DE LOGS EXISTE ---
// Se a pasta /logs não existir, cria automaticamente (Self-Healing básico)
const DIR_LOGS = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.resolve(__dirname, '../../logs');

if (!fs.existsSync(DIR_LOGS)) {
  fs.mkdirSync(DIR_LOGS, { recursive: true });
}

// --- FORMATO CUSTOMIZADO DOS LOGS ---
// Exibe: [TIMESTAMP] NÍVEL: mensagem | contexto JSON
const formatoLog = winston.format.combine(
  // Adiciona timestamp no formato ISO 8601
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),

  // Captura o stack trace de erros para identificar arquivo e linha exata
  winston.format.errors({ stack: true }),

  // Formato final da mensagem de log
  winston.format.printf(({ timestamp, level, message, stack, ...contexto }) => {
    // Monta a linha base do log
    let linha = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    // Se houver contexto adicional (ex: { tenantId, userId }), adiciona como JSON
    if (Object.keys(contexto).length > 0) {
      linha += ` | ${JSON.stringify(contexto)}`;
    }

    // Se for um erro com stack trace, adiciona o rastreamento completo
    if (stack) {
      linha += `\n  Stack: ${stack}`;
    }

    return linha;
  })
);

// --- CRIAÇÃO DO LOGGER ---
const logger = winston.createLogger({
  // Nível mínimo de log (configurável via .env)
  // Hierarquia: error > warn > info > http > debug
  level: process.env.LOG_LEVEL || 'info',

  format: formatoLog,

  // Destinos de saída dos logs (transports)
  transports: [
    // 1. Arquivo para TODOS os logs (info, warn, error)
    new winston.transports.File({
      filename: path.join(DIR_LOGS, 'app.log'),
      maxsize: 10 * 1024 * 1024, // Rotaciona o arquivo ao atingir 10MB
      maxFiles: 5,               // Mantém os últimos 5 arquivos de log
      tailable: true,
    }),

    // 2. Arquivo separado APENAS para erros críticos
    new winston.transports.File({
      filename: path.join(DIR_LOGS, 'errors.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10, // Mantém mais histórico de erros
      tailable: true,
    }),
  ],
});

// --- SAÍDA NO CONSOLE ---
// Habilitado em todos os ambientes (incluindo produção)
logger.add(new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(), // Coloriza o nível (verde=info, vermelho=error)
    formatoLog
  ),
}));

module.exports = logger;
