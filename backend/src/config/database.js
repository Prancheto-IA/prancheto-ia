// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
// Utiliza Knex.js como query builder e gerenciador de migrations.
// O pool de conexões é configurado para reutilizar conexões abertas,
// evitando overhead de reconexão a cada requisição.
// =============================================================

'use strict';

const knex = require('knex');

// --- CONFIGURAÇÃO DO POOL DE CONEXÕES ---
// min: mínimo de conexões mantidas abertas (mesmo sem requisições)
// max: máximo de conexões simultâneas permitidas
const configuracaoKnex = {
  client: 'pg', // Driver do PostgreSQL
  connection: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME     || 'prancheto_ia',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    // SSL obrigatório em produção para criptografar dados em trânsito
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  },
  pool: {
    min: 2,
    max: 10,
    // Tempo máximo (ms) que uma conexão pode ficar ociosa antes de ser encerrada
    idleTimeoutMillis: 30000,
    // Tempo máximo (ms) para adquirir uma conexão do pool antes de lançar erro
    acquireTimeoutMillis: 60000,
  },
  // Configuração de migrations e seeds
  migrations: {
    directory: '../database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: '../database/seeds',
  },
  // Exibe as queries SQL no console apenas em ambiente de desenvolvimento
  debug: process.env.NODE_ENV === 'development',
};

// Cria a instância única do Knex (padrão Singleton)
const db = knex(configuracaoKnex);

/**
 * Testa a conexão com o banco de dados executando uma query simples.
 * Utilizada no Health Check e na inicialização do servidor.
 * @returns {Promise<void>} Resolve se a conexão estiver OK, rejeita se falhar.
 */
const testarConexaoDB = async () => {
  // Executa uma query mínima para verificar se o banco responde
  await db.raw('SELECT 1');
};

module.exports = { db, testarConexaoDB };
