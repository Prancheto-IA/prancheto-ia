// =============================================================
// PRANCHETO.IA - SEED 001: CRIAÇÃO DA CONTA TRONCO (Super Admin)
// Este seed cria o usuário administrador raiz do sistema.
// Deve ser executado UMA VEZ após as migrations iniciais.
//
// COMANDO PARA EXECUTAR: npm run seed
//
// ⚠️  IMPORTANTE: As credenciais são lidas do arquivo .env.
//     Configure SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD antes de executar.
//     Após o primeiro login, altere a senha imediatamente pelo painel.
// =============================================================

'use strict';

const bcrypt = require('bcryptjs');

/**
 * Cria o usuário Super Admin (Conta Tronco) no banco de dados.
 * @param {import('knex').Knex} knex
 */
exports.seed = async (knex) => {
  // --- LEITURA DAS CREDENCIAIS DO .env ---
  const emailSuperAdmin = process.env.SUPER_ADMIN_EMAIL;
  const senhaSuperAdmin = process.env.SUPER_ADMIN_PASSWORD;

  // Valida se as credenciais estão configuradas
  if (!emailSuperAdmin || !senhaSuperAdmin) {
    console.error(
      '\n❌ ERRO NO SEED: As variáveis SUPER_ADMIN_EMAIL e SUPER_ADMIN_PASSWORD ' +
      'não estão definidas no arquivo .env.\n' +
      'Configure-as antes de executar o seed.\n'
    );
    process.exit(1);
  }

  // --- VERIFICA SE O SUPER ADMIN JÁ EXISTE ---
  // Evita criar duplicatas se o seed for executado mais de uma vez
  const superAdminExistente = await knex('users')
    .where({ email: emailSuperAdmin, cargo: 'super_admin' })
    .first();

  if (superAdminExistente) {
    console.log(`ℹ️  Super Admin já existe (${emailSuperAdmin}). Seed ignorado.`);
    return;
  }

  // --- CRIPTOGRAFIA DA SENHA ---
  // Custo 12: bom equilíbrio entre segurança e performance
  // (cada incremento dobra o tempo de processamento)
  const CUSTO_BCRYPT = 12;
  console.log('🔐 Criptografando senha do Super Admin...');
  const senhaHash = await bcrypt.hash(senhaSuperAdmin, CUSTO_BCRYPT);

  // --- INSERÇÃO DO SUPER ADMIN ---
  await knex('users').insert({
    // tenant_id = NULL: Super Admin não pertence a nenhum tenant
    tenant_id: null,

    nome:       'Super Admin',
    email:      emailSuperAdmin,
    senha_hash: senhaHash,
    cargo:      'super_admin',

    // Super Admin tem acesso irrestrito a tudo
    permissoes: JSON.stringify({
      secoes:  ['*'], // '*' = acesso a todas as seções
      modulos: ['*'],
      abas:    ['*'],
      widgets: ['*'],
    }),

    ativo: true,
    tentativas_login_falhas: 0,
  });

  console.log(`\n✅ Conta Tronco (Super Admin) criada com sucesso!`);
  console.log(`   E-mail: ${emailSuperAdmin}`);
  console.log(`   ⚠️  Altere a senha após o primeiro login!\n`);
};
