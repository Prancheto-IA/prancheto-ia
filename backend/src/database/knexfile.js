// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO KNEX (Migrations e Seeds)
// Este arquivo é usado pelos comandos:
//   npm run migrate  → Executa as migrations pendentes
//   npm run seed     → Executa os seeds (dados iniciais)
// =============================================================

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

/**
 * @type { import("knex").Knex.Config }
 */
module.exports = {
  // --- AMBIENTE DE DESENVOLVIMENTO ---
  development: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME     || 'prancheto_ia',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    // Exibe as queries SQL no console em desenvolvimento
    debug: true,
  },

  // --- AMBIENTE DE PRODUÇÃO ---
  // Aceita DATABASE_URL completa (Render fornece automaticamente)
  // OU variáveis individuais DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host:     process.env.DB_HOST,
          port:     parseInt(process.env.DB_PORT || '5432', 10),
          database: process.env.DB_NAME,
          user:     process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: { rejectUnauthorized: false },
        },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
    debug: false,
  },
};
