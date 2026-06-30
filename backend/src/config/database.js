// =============================================================
// PRANCHETO.IA - CLIENTE SUPABASE (substitui Knex.js)
// Usa o @supabase/supabase-js com a Service Role Key para
// acesso irrestrito ao banco (bypassa RLS).
//
// VARIÁVEIS OBRIGATÓRIAS:
//   SUPABASE_URL         → URL do projeto Supabase (ex: https://xxx.supabase.co)
//   SUPABASE_SERVICE_KEY → Service Role Key (NÃO use a anon key no backend)
//
// EXPORTAÇÕES:
//   supabase             → cliente Supabase pronto para uso
//   testarConexaoDB()    → verifica se o banco está acessível
// =============================================================

'use strict';

const { createClient } = require('@supabase/supabase-js');
const logger = require('../services/logger.service');

// --- Validação das variáveis de ambiente ---
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ ERRO FATAL: A variável de ambiente SUPABASE_URL não está definida.');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO FATAL: A variável de ambiente SUPABASE_SERVICE_KEY não está definida.');
  process.exit(1);
}

// --- Criação do cliente Supabase ---
// Usamos a Service Role Key para que o backend tenha acesso total
// sem ser bloqueado pelas Row Level Security (RLS) policies.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    // Desativa o gerenciamento automático de sessão (não necessário no backend)
    autoRefreshToken:  false,
    persistSession:    false,
    detectSessionInUrl: false,
  },
});

// --- Função de teste de conexão ---
// Usada pelo Self-Healing para verificar se o banco está acessível.
const testarConexaoDB = async () => {
  const { error } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  if (error) {
    throw new Error(`Falha na conexão com o Supabase: ${error.message}`);
  }

  return true;
};

// --- Log de inicialização ---
logger.info(`✅ Cliente Supabase inicializado. URL: ${SUPABASE_URL}`);

module.exports = { supabase, testarConexaoDB };
