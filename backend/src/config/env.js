// =============================================================
// PRANCHETO.IA - VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// Garante que o servidor não suba sem as configurações críticas.
// Se uma variável obrigatória estiver ausente, o processo é encerrado
// com uma mensagem clara indicando qual variável está faltando.
// =============================================================

'use strict';

/**
 * Lista de variáveis de ambiente obrigatórias para o funcionamento do sistema.
 * Adicione aqui qualquer nova variável crítica que for criada.
 */
const VARIAVEIS_OBRIGATORIAS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
];

/**
 * Valida se todas as variáveis de ambiente obrigatórias estão definidas.
 * Deve ser chamada UMA VEZ no início do app.js, antes de qualquer outra lógica.
 * @throws {Error} Se alguma variável obrigatória estiver ausente.
 */
const validarEnv = () => {
  const variavelFaltando = VARIAVEIS_OBRIGATORIAS.find(
    (variavel) => !process.env[variavel]
  );

  if (variavelFaltando) {
    // Erro fatal: encerra o processo imediatamente com mensagem clara
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
