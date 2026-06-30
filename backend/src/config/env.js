// =============================================================
// PRANCHETO.IA - VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// Garante que o servidor não suba sem as configurações críticas.
// Migrado de Knex/PostgreSQL para Supabase.
// =============================================================

'use strict';

/**
 * Lista de variáveis de ambiente obrigatórias para o funcionamento do sistema.
 */
const VARIAVEIS_OBRIGATORIAS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
];

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas.
 * Deve ser chamada UMA VEZ no início do app.js, antes de qualquer outra lógica.
 */
const validarEnv = () => {
  const variavelFaltando = VARIAVEIS_OBRIGATORIAS.find(
    (variavel) => !process.env[variavel]
  );

  if (variavelFaltando) {
    console.error(
      `\n❌ ERRO FATAL DE CONFIGURAÇÃO: A variável de ambiente obrigatória ` +
      `"${variavelFaltando}" não está definida.\n` +
      `Verifique o arquivo .env na raiz do backend e consulte o .env.example.\n`
    );
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente validadas com sucesso.');
};

module.exports = { validarEnv };
