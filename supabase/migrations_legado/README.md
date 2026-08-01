# Migrations legadas — registro histórico

Estes 24 arquivos **não são mais executados**. Ficam aqui pelo que documentam,
não pelo que fazem.

## Por que saíram de `migrations/`

Eles nunca formaram um histórico completo. Criavam 28 tabelas, mas 11 tabelas
fundamentais do sistema — `users`, `tenants`, `crm_contatos`, `crm_interacoes`,
`planos`, `agenda_eventos`, `ai_conversations`, `ai_messages`, `audit_logs`,
`outbound_acoes` e `user_preferencias` — só apareciam em `ALTER TABLE` e
políticas de RLS, sem nunca serem criadas. Aplicar esta pasta num banco vazio
falhava.

A causa é que o banco era alterado direto pelo SQL Editor do dashboard, e só
parte das mudanças virava arquivo aqui.

Em 2026-08-01 o estado real da produção foi capturado por `pg_dump` e virou
`migrations/20260801000000_baseline_producao.sql`, que passou a ser o ponto de
partida do histórico.

## O que ainda vale a pena ler aqui

- **`009_fix_trigger_handle_new_user.sql`** — a regra de isolamento multi-tenant
  no cadastro: signup direto entra com `tenant_id` nulo e inativo, aguardando um
  admin. A função está na baseline; o trigger foi restaurado em
  `migrations/20260801000001_trigger_auth_user_created.sql`.

- **`014_fix_conversao_trigger_crm_interacoes.sql`** — documenta um bug real:
  o corpo de funções plpgsql só é validado em execução, então a migration 013
  aplicou sem erro uma função que inseria uma coluna inexistente. Toda conversão
  de lead falhava em silêncio. Vale como lembrete ao escrever triggers.

- **`020_fix_crm_contatos_rls_por_time.sql`** e **`001_enable_rls.sql`** — a
  evolução do modelo de permissões por time.

## Colisão de numeração

Havia dois arquivos com prefixo `014`: `014_fase3_vinculos_view.sql` e
`014_fix_conversao_trigger_crm_interacoes.sql`. A ordem entre eles era indefinida.
Como são independentes — um cria uma view, o outro substitui uma função — nunca
chegou a causar problema. Ficam com os nomes originais, já que o valor deles
agora é apenas histórico.

## Daqui em diante

Nada é adicionado a esta pasta. Toda mudança de schema nasce de
`supabase migration new` e é aplicada primeiro no ambiente de desenvolvimento.
Ver [`docs/AMBIENTES.md`](../../docs/AMBIENTES.md).
