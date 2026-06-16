// =============================================================
// PRANCHETO.IA - HANDLER GLOBAL DE ERROS
// Captura TODOS os erros não tratados da aplicação Express.
// Garante que nenhuma falha retorne stack trace exposto ao cliente.
// Gera códigos de erro identificáveis (ex: #CRM-1024) para facilitar
// o suporte técnico sem expor detalhes internos ao usuário final.
// =============================================================

'use strict';

const logger = require('../services/logger.service');
const Sentry = require('../config/sentry');

/**
 * Mapeamento de tipos de erro para códigos HTTP e mensagens amigáveis.
 * Adicione novos tipos de erro aqui conforme o sistema crescer.
 */
const MAPA_ERROS = {
  // Erros de validação de dados enviados pelo cliente
  ValidationError:    { status: 400, codigo: 'CRM-0400', mensagem: 'Dados inválidos na requisição.' },
  // Token JWT ausente ou malformado
  JsonWebTokenError:  { status: 401, codigo: 'CRM-0401', mensagem: 'Token de autenticação inválido.' },
  // Token JWT expirado
  TokenExpiredError:  { status: 401, codigo: 'CRM-0401', mensagem: 'Sessão expirada. Faça login novamente.' },
  // Acesso negado por falta de permissão
  ForbiddenError:     { status: 403, codigo: 'CRM-0403', mensagem: 'Acesso negado. Você não tem permissão para esta ação.' },
  // Recurso não encontrado no banco de dados
  NotFoundError:      { status: 404, codigo: 'CRM-0404', mensagem: 'Recurso não encontrado.' },
  // Conflito de dados (ex: e-mail duplicado)
  ConflictError:      { status: 409, codigo: 'CRM-0409', mensagem: 'Conflito de dados. O recurso já existe.' },
};

/**
 * Gera um código de erro único para rastreamento de suporte.
 * Formato: CRM-XXXX onde XXXX é um número aleatório de 4 dígitos.
 * @returns {string} Código de erro único
 */
const gerarCodigoErro = () => {
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `CRM-${numero}`;
};

/**
 * Middleware global de tratamento de erros do Express.
 * DEVE ser registrado como o ÚLTIMO middleware no app.js.
 * Recebe 4 parâmetros (err, req, res, next) — o Express identifica
 * automaticamente como handler de erro pela assinatura de 4 parâmetros.
 */
const errorHandler = (err, req, res, next) => {
  // Gera um código único para este erro específico
  const codigoRastreamento = gerarCodigoErro();

  // Busca o mapeamento do tipo de erro, ou usa o padrão (500 - erro interno)
  const mapeamento = MAPA_ERROS[err.name] || MAPA_ERROS[err.constructor?.name];

  // Define o status HTTP da resposta
  const statusHttp = err.statusCode || err.status || mapeamento?.status || 500;

  // Define a mensagem amigável para o cliente
  const mensagemCliente = mapeamento?.mensagem
    || (statusHttp < 500 ? err.message : 'Ocorreu um erro interno no servidor.');

  // Define o código de erro para o cliente
  const codigoErro = mapeamento?.codigo || codigoRastreamento;

  // --- REGISTRO DO ERRO NO LOG ---
  // Erros 5xx (servidor) são registrados como 'error'; 4xx (cliente) como 'warn'
  const nivelLog = statusHttp >= 500 ? 'error' : 'warn';
  logger[nivelLog](`[${codigoRastreamento}] ${err.message || 'Erro desconhecido'}`, {
    codigoRastreamento,
    statusHttp,
    metodo:  req.method,
    rota:    req.originalUrl,
    tenantId: req.tenantId || 'N/A',
    userId:   req.userId   || 'N/A',
    stack:    err.stack,
  });

  // --- NOTIFICAÇÃO DO SENTRY (apenas para erros críticos 5xx) ---
  if (statusHttp >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag('codigoRastreamento', codigoRastreamento);
      scope.setTag('rota', req.originalUrl);
      scope.setContext('requisicao', {
        metodo:  req.method,
        rota:    req.originalUrl,
        tenantId: req.tenantId || 'N/A',
        userId:   req.userId   || 'N/A',
      });
      Sentry.captureException(err);
    });
  }

  // --- RESPOSTA AO CLIENTE ---
  // Nunca expõe stack trace ou detalhes internos ao cliente
  res.status(statusHttp).json({
    erro: mensagemCliente,
    codigo: codigoErro,
    // Em desenvolvimento, inclui detalhes extras para facilitar o debug
    ...(process.env.NODE_ENV === 'development' && {
      detalhe: err.message,
      stack:   err.stack,
    }),
  });
};

module.exports = errorHandler;
