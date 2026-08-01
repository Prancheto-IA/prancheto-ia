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
