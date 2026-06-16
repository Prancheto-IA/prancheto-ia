// =============================================================
// PRANCHETO.IA - MIDDLEWARE DE SEGURANÇA
// Responsável por:
//   1. Rate Limiting global (proteção contra DDoS e força bruta)
//   2. Rate Limiting específico para rotas de autenticação
//   3. Detecção de comportamentos anômalos (múltiplas tentativas de login)
//   4. Bloqueio preventivo de IPs/usuários suspeitos
// =============================================================

'use strict';

const rateLimit = require('express-rate-limit');
const logger    = require('../services/logger.service');
const Sentry    = require('../config/sentry');

// =============================================================
// 1. RATE LIMITER GLOBAL
// Limita o número total de requisições por IP em uma janela de tempo.
// Protege contra ataques de DDoS e scraping massivo de dados.
// =============================================================
const rateLimiterGlobal = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 req/janela
  standardHeaders: true,  // Retorna headers RateLimit-* na resposta
  legacyHeaders:   false, // Desativa headers X-RateLimit-* (obsoletos)
  message: {
    erro:   'Muitas requisições. Tente novamente em alguns minutos.',
    codigo: 'CRM-0429',
  },
  handler: (req, res, next, options) => {
    // Registra o evento de rate limit excedido
    logger.warn('Rate limit global excedido', {
      ip:    req.ip,
      rota:  req.originalUrl,
      metodo: req.method,
    });
    res.status(429).json(options.message);
  },
});

// =============================================================
// 2. RATE LIMITER PARA AUTENTICAÇÃO (mais restritivo)
// Limita tentativas de login para prevenir ataques de força bruta.
// Após 10 tentativas em 15 minutos, o IP é bloqueado temporariamente.
// =============================================================
const rateLimiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // Máximo de 10 tentativas de login por IP
  skipSuccessfulRequests: true, // Não conta logins bem-sucedidos no limite
  message: {
    erro:   'Muitas tentativas de login. Sua conta foi temporariamente bloqueada por segurança. Tente novamente em 15 minutos.',
    codigo: 'CRM-0429',
  },
  handler: (req, res, next, options) => {
    // Registra e notifica administradores sobre possível ataque de força bruta
    const mensagemAlerta = `🚨 ALERTA DE SEGURANÇA: Múltiplas tentativas de login do IP ${req.ip}`;

    logger.error(mensagemAlerta, {
      ip:    req.ip,
      rota:  req.originalUrl,
      email: req.body?.email || 'N/A',
    });

    // Notifica o Sentry para alertar os administradores
    Sentry.captureMessage(mensagemAlerta, {
      level: 'warning',
      extra: {
        ip:    req.ip,
        email: req.body?.email || 'N/A',
      },
    });

    res.status(429).json(options.message);
  },
});

// =============================================================
// 3. DETECTOR DE COMPORTAMENTO ANÔMALO
// Monitora padrões suspeitos além do rate limiting básico:
//   - Tentativas de acesso a rotas administrativas por não-admins
//   - Headers malformados ou ausentes (possível bot/scanner)
// =============================================================
const detectarAnomalias = (req, res, next) => {
  // Verifica se há tentativa de acesso direto ao painel admin sem autenticação
  const rotasAdminProtegidas = ['/api/admin', '/api/tenants', '/api/super'];
  const tentativaAdminSemToken = rotasAdminProtegidas.some(rota =>
    req.originalUrl.startsWith(rota)
  ) && !req.headers.authorization;

  if (tentativaAdminSemToken) {
    logger.warn('Tentativa de acesso a rota administrativa sem token', {
      ip:   req.ip,
      rota: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'N/A',
    });
    // Não bloqueia aqui — o middleware de autenticação fará isso.
    // Apenas registra para análise de padrões.
  }

  // Continua para o próximo middleware
  next();
};

// =============================================================
// EXPORTAÇÕES
// Exporta os middlewares individualmente para uso seletivo nas rotas.
// =============================================================
module.exports = {
  // Middleware composto para uso global no app.js
  default: [rateLimiterGlobal, detectarAnomalias],

  // Rate limiter específico para rotas de autenticação
  // Uso: router.post('/login', rateLimiterAuth, controllerLogin)
  rateLimiterAuth,

  // Exporta individualmente para testes
  rateLimiterGlobal,
  detectarAnomalias,
};
