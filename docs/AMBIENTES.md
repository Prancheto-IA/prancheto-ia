# Ambientes — Prancheto.IA

Este documento descreve como desenvolvimento e produção são separados, e qual
o caminho que uma alteração percorre até chegar ao cliente.

---

## Visão geral

| | Desenvolvimento | Produção |
|---|---|---|
| **Projeto Supabase** | `prancheto-ia-dev` | `Prancheto-IA's Project` |
| **Ref** | `jjvvzndhwxdcvbikoqce` | `ujspjhmfdinkhjccjjuo` |
| **Branch git** | `develop` | `main` |
| **Deploy Vercel** | Preview | Production |
| **Arquivo de env** | `frontend/.env.development` | `frontend/.env.production` |
| **Dados** | Fictícios e descartáveis | Reais de clientes |

Os dois bancos são fisicamente separados. Nada que você faça em desenvolvimento
alcança a produção.

---

## O caminho de uma alteração

```
   1. develop  ──► 2. Supabase dev ──► 3. Preview Vercel ──► 4. PR ──► 5. main ──► 6. Produção
      código        migration              validação          revisão      merge      deploy
```

1. **Trabalhe em `develop`.** Nunca faça commit direto em `main`.
2. **Mudou o banco?** Crie uma migration e aplique **primeiro no dev** (veja abaixo).
3. **Valide no preview.** Cada push em `develop` gera uma URL de preview na Vercel,
   já apontando para o Supabase de desenvolvimento.
4. **Abra um Pull Request** de `develop` para `main`.
5. **Faça o merge** só depois que o preview estiver validado.
6. **A Vercel publica** automaticamente, e só então a migration é aplicada em produção.

---

## Rodando localmente

```bash
cd frontend
npm install
npm run dev
```

O Vite carrega `.env.development` automaticamente — você já está no banco de
desenvolvimento, sem nenhum passo extra.

Na primeira vez, gere seus arquivos de ambiente a partir do template:

```bash
cp .env.example .env.development
cp .env.example .env.production
```

Preencha cada um com as credenciais do projeto Supabase correspondente
(Dashboard → Project Settings → API).

### Proteção contra apontar para produção

`frontend/src/lib/supabase.js` interrompe a aplicação com erro se um ambiente
que não seja `production` tentar se conectar ao Supabase de produção. Se você
realmente precisar depurar um dado real, a válvula de escape é consciente e
temporária:

```bash
# frontend/.env.development
VITE_PERMITIR_PROD_EM_DEV=true
```

Com ela ligada, o console exibe um aviso vermelho permanente. Desligue ao terminar.

---

## Alterações no banco de dados

Toda mudança de schema é uma migration versionada. Nunca altere o banco pelo
SQL Editor do dashboard — foi assim que as 11 tabelas fundamentais do sistema
acabaram sem histórico algum.

### 1. Criar a migration

```bash
supabase migration new nome_descritivo_da_mudanca
```

Isso gera `supabase/migrations/<timestamp>_nome_descritivo_da_mudanca.sql`.
Escreva o SQL nesse arquivo.

### 2. Aplicar em desenvolvimento

```bash
supabase link --project-ref jjvvzndhwxdcvbikoqce
supabase db push
```

### 3. Testar

Rode `npm run dev` e valide a mudança de ponta a ponta.

### 4. Aplicar em produção

Somente depois que o PR for aprovado e mergeado:

```bash
supabase link --project-ref ujspjhmfdinkhjccjjuo
supabase db push
```

> Confirme o projeto linkado com `supabase projects list` antes de qualquer
> `db push`. A coluna `LINKED` mostra onde o comando vai atuar.

### Trocando de projeto linkado

O CLI 2.109.1 falha ao religar quando a pasta de scratch já existe:

```
AlreadyExists: FileSystem.makeDirectory (...\supabase\.temp)
```

É um bug do próprio CLI, que tenta criar `supabase/.temp` sem checar se ela
está lá. Como o `link` recria a pasta, o erro reaparece a cada troca. Remova-a
antes de religar:

```bash
rm -rf supabase/.temp
supabase link --project-ref <ref-desejado>
```

A pasta é descartável — guarda apenas qual projeto está linkado, e está no
`.gitignore`.

---

## Conectando direto no banco

Duas armadilhas que custam tempo se você não souber de antemão:

**1. O host direto do projeto de dev é IPv6.** `db.jjvvzndhwxdcvbikoqce.supabase.co`
só publica registro `AAAA`. De uma rede sem IPv6 a conexão simplesmente não
completa. Use sempre o **pooler**, que é IPv4:

```
postgresql://postgres.jjvvzndhwxdcvbikoqce:<senha>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

Note o host `aws-0` — o `aws-1` existe e resolve, mas responde
`Tenant or user not found` para este projeto.

**2. `pg_dump` e `psql` não estão instalados nesta máquina.** O CLI do Supabase
resolve isso rodando o `pg_dump` dentro de um container, o que exige Docker.
Sem Docker, baixe os binários avulsos do PostgreSQL 17 (não precisa instalar
nada nem ter admin):

```
https://get.enterprisedb.com/postgresql/postgresql-17.10-2-windows-x64-binaries.zip
```

Extraia e aponte o PATH para `pgsql/bin`. A versão do cliente precisa ser igual
ou maior que a do servidor (17.6).

---

## Dados de teste (seed)

`supabase/seed.sql` cria um tenant fictício com times, cargos, funil de CRM,
projetos e tarefas — volume suficiente para que nenhuma tela apareça vazia.

```bash
export PATH="/caminho/para/pgsql/bin:$PATH"
PGPASSWORD='<senha-do-dev>' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -U postgres.jjvvzndhwxdcvbikoqce -d postgres \
  -f supabase/seed.sql
```

É idempotente: rodar duas vezes não duplica nada.

### Acessos criados

| E-mail | Senha | Cargo |
|---|---|---|
| `admin@acme.dev` | `prancheto-dev-2026` | admin |
| `gerente@acme.dev` | `prancheto-dev-2026` | manager |
| `membro@acme.dev` | `prancheto-dev-2026` | member |

Os usuários são criados em `auth.users`; o trigger `on_auth_user_created` é quem
gera as linhas em `public.users`. Ou seja, rodar o seed também exercita o
caminho real de cadastro.

### A trava contra produção

O seed aborta se encontrar no banco qualquer tenant que não seja o dele:

```
ABORTADO: este banco contem tenants que nao pertencem ao seed.
```

É a última linha de defesa, não a primeira. Confira a connection string antes.

---

## Variáveis na Vercel

As variáveis são definidas por ambiente no painel da Vercel
(Project Settings → Environment Variables):

| Variável | Production | Preview + Development |
|---|---|---|
| `VITE_SUPABASE_URL` | URL de produção | URL de desenvolvimento |
| `VITE_SUPABASE_ANON_KEY` | Chave de produção | Chave de desenvolvimento |
| `VITE_APP_NAME` | `Prancheto.IA` | `Prancheto.IA [DEV]` |
| `VITE_APP_ENV` | `production` | `development` |

Marcar cada variável apenas no ambiente correto é o que impede um preview de
gravar em dados reais.

---

## Segredos

Nenhum arquivo `.env` real é versionado. O único que entra no git é
`frontend/.env.example`, que não contém valores.

A senha do banco de desenvolvimento fica em `.supabase-dev-db-password.txt`,
na raiz e fora do git. Guarde-a no seu gerenciador de senhas — ela não pode
ser consultada depois, apenas redefinida no dashboard.
