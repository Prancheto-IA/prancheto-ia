// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO SENTRY (Monitoramento de Erros)
// O Sentry captura automaticamente exceções não tratadas e as envia
// para o painel online, notificando os administradores por e-mail.
//
// IMPORTANTE: Este arquivo deve ser importado ANTES de qualquer
// outro módulo no app.js para garantir cobertura total de erros.
// =============================================================

'use strict';

const Sentry = require('@sentry/node');

// Inicializa o Sentry apenas se o DSN estiver configurado no .env
// Em desenvolvimento local sem DSN, o Sentry opera em modo silencioso.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Define o ambiente (development, staging, production)
    // Permite filtrar erros por ambiente no painel do Sentry
    environment: process.env.NODE_ENV || 'development',

    // Taxa de amostragem de performance (1.0 = 100% das transações monitoradas)
    // Reduza para 0.1 (10%) em produção com alto volume para economizar cota
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Ignora erros esperados que não precisam de alerta (ex: 404, validações)
    ignoreErrors: [
      'Not Found',
      'Unauthorized',
      'Forbidden',
      'ValidationError',
    ],

    // Adiciona contexto extra a todos os eventos enviados ao Sentry
    beforeSend(evento) {
      // Em desenvolvimento, não envia para o Sentry (apenas loga no console)
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Sentry - DEV] Erro capturado (não enviado):', evento.exception);
        return null; // Retornar null cancela o envio
      }
      return evento;
    },
  });

  console.log('✅ Sentry inicializado com sucesso.');
} else {
  console.warn(
    '⚠️  AVISO: SENTRY_DSN não configurado. ' +
    'Monitoramento de erros em produção estará DESATIVADO. ' +
    'Configure a variável SENTRY_DSN no arquivo .env para ativar.'
  );
}

module.exports = Sentry;
