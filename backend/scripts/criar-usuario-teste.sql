-- =============================================================
-- PRANCHETO.IA - SCRIPT DE CRIAÇÃO DE USUÁRIO DE TESTE
-- Execute este script no SQL Editor do Supabase:
--   Dashboard → SQL Editor → New Query → Cole e execute
--
-- CREDENCIAIS DO USUÁRIO DE TESTE:
--   E-mail: cliente@teste.com
--   Senha:  Teste@123
--
-- ATENÇÃO: O hash abaixo corresponde à senha "Teste@123"
-- gerado com bcrypt (12 rounds).
-- Para gerar um novo hash, use:
--   node -e "const b=require('bcryptjs'); b.hash('SuaSenha',12).then(console.log)"
-- =============================================================

-- -------------------------------------------------------
-- PASSO 1: Criar um tenant de teste (empresa cliente)
-- -------------------------------------------------------
INSERT INTO tenants (
  nome,
  slug,
  email_contato,
  plano,
  status,
  limite_usuarios,
  configuracoes
)
VALUES (
  'Empresa Teste Ltda',
  'empresa-teste',
  'contato@empresateste.com',
  'starter',
  'ativo',
  5,
  '{}'
)
ON CONFLICT (slug) DO NOTHING;

-- -------------------------------------------------------
-- PASSO 2: Criar o usuário de teste vinculado ao tenant
--
-- Senha: Teste@123
-- Hash bcrypt (12 rounds) gerado para "Teste@123":
-- -------------------------------------------------------
INSERT INTO users (
  tenant_id,
  nome,
  email,
  senha_hash,
  cargo,
  permissoes,
  ativo,
  tentativas_login_falhas
)
SELECT
  t.id,
  'Cliente Teste',
  'cliente@teste.com',
  '$2a$12$XPTAPdhzCo.KMLSmOuVEeegVDtxLUbZ0naNASnf85jW266wc6JnnK',
  'member',
  '{}',
  true,
  0
FROM tenants t
WHERE t.slug = 'empresa-teste'
ON CONFLICT (email) DO UPDATE
  SET
    senha_hash = '$2a$12$XPTAPdhzCo.KMLSmOuVEeegVDtxLUbZ0naNASnf85jW266wc6JnnK',
    ativo = true,
    tentativas_login_falhas = 0,
    bloqueado_ate = NULL;

-- -------------------------------------------------------
-- PASSO 3: Verificar os dados criados
-- -------------------------------------------------------
SELECT
  u.id,
  u.nome,
  u.email,
  u.cargo,
  u.ativo,
  t.nome AS tenant_nome,
  t.plano,
  t.status AS tenant_status
FROM users u
LEFT JOIN tenants t ON t.id = u.tenant_id
WHERE u.email = 'cliente@teste.com';

-- =============================================================
-- RESULTADO ESPERADO:
--   id        | nome           | email              | cargo  | ativo | tenant_nome         | plano   | tenant_status
--   <uuid>    | Cliente Teste  | cliente@teste.com  | member | true  | Empresa Teste Ltda  | starter | ativo
--
-- CREDENCIAIS PARA LOGIN:
--   E-mail: cliente@teste.com
--   Senha:  Teste@123
-- =============================================================
