# Fluxo de trabalho — guia prático

Como alterar algo no Prancheto.IA sem risco de quebrar o que está no ar.

Este documento é o passo a passo. Para os detalhes de infraestrutura — como os
ambientes foram montados, credenciais, armadilhas do CLI — veja
[AMBIENTES.md](AMBIENTES.md).

---

## As peças

| Peça | O que é |
|---|---|
| **Branch** | Uma linha de trabalho paralela. `main` é o que está no ar; `develop` é onde você trabalha |
| **Commit** | Um ponto de salvamento, com uma descrição do que mudou |
| **Push** | Envia seus commits para o GitHub |
| **PR** | *Pull Request* — pedido para levar o trabalho da `develop` para a `main` |
| **Merge** | Aceitar esse pedido. É o que publica |
| **Preview** | Site de teste que a Vercel cria a cada push na `develop`, ligado ao banco de desenvolvimento |

A regra que resume tudo:

> **`main` está no ar. Nada entra nela sem passar pela `develop` antes.**

---

## O ciclo do dia a dia

### 1. Antes de começar

```bash
cd C:\Users\derek\OneDrive\Prancheto.ia\prancheto-ia
git checkout develop
git pull
```

Te coloca na branch de trabalho e traz o que houver de novo. Faça sempre — é o
que evita conflito mais adiante.

### 2. Trabalhando

```bash
cd frontend
npm run dev
```

Abre em `http://localhost:5173`, já conectado ao **banco de desenvolvimento**.
Crie, edite e apague à vontade: nada disso alcança dado de cliente.

Para entrar, use as contas do seed:

| E-mail | Senha | Cargo |
|---|---|---|
| `admin@acme.dev` | `prancheto-dev-2026` | Líder Geral |
| `gerente@acme.dev` | `prancheto-dev-2026` | Líder de Time |
| `membro@acme.dev` | `prancheto-dev-2026` | Membro de Time |

Os três têm permissões diferentes — útil para conferir se as guardas de
interface estão se comportando como você espera.

### 3. Salvando o trabalho

```bash
git add -A
git commit -m "descreve o que voce fez"
git push
```

- `git add -A` marca todos os arquivos alterados
- `git commit -m` cria o ponto de salvamento
- `git push` envia para o GitHub

Pode commitar várias vezes ao longo do trabalho. Não precisa esperar terminar.

### 4. Conferindo no preview

O push na `develop` faz a Vercel construir um preview automaticamente, em cerca
de 10 segundos. Ele usa o **banco de desenvolvimento**, então dá para testar de
verdade sem consequência.

O endereço aparece no PR, ou em https://vercel.com/prancheto/prancheto-ia.

### 5. Publicando

1. Vá em https://github.com/Prancheto-IA/prancheto-ia
2. Aparece o aviso **"develop had recent pushes"** → **Compare & pull request**
3. Descreva o que mudou e crie o PR
4. Revise a aba **Files changed**
5. **Merge pull request**

A Vercel publica em produção sozinha logo depois.

### 6. Depois do merge

```bash
git checkout main
git pull
git checkout develop
git merge main
git push
```

Realinha as duas branches para o próximo ciclo. Se pular esta etapa, a
`develop` vai ficando para trás e o próximo PR fica confuso.

---

## Quando a mudança envolve o banco

Aqui o cuidado é maior: banco não desfaz com `Ctrl+Z`.

### 1. Criar a migration

```bash
supabase migration new nome_do_que_voce_vai_fazer
```

Gera um arquivo em `supabase/migrations/`. Escreva o SQL nele.

### 2. Aplicar no desenvolvimento

```bash
supabase db push --db-url "postgresql://postgres.jjvvzndhwxdcvbikoqce:SENHA@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

A senha está em `%LOCALAPPDATA%\prancheto\dev-db-password.txt`.

### 3. Testar

Rode `npm run dev` e valide de ponta a ponta.

### 4. Seguir o ciclo normal

Commit, push, preview, PR, merge.

### 5. Só então aplicar em produção

Mesma linha do passo 2, trocando o projeto para `ujspjhmfdinkhjccjjuo` e a
senha para a de produção.

> **Nunca altere o banco pelo SQL Editor do dashboard.**
> Foi assim que 11 tabelas fundamentais do sistema ficaram sem histórico
> nenhum, e o que obrigou a reconstruir a baseline. Toda mudança de schema
> nasce de uma migration.

---

## Situações comuns

**Fiz besteira e quero desfazer antes de commitar**

```bash
git checkout -- .
```

Descarta tudo que não foi commitado. Não tem volta — confira antes com
`git status`.

**Quero ver o que mudei**

```bash
git status    # quais arquivos
git diff      # quais linhas
```

**Em que branch eu estou?**

```bash
git branch --show-current
```

Se responder `main`, pare e rode `git checkout develop` antes de tocar em
qualquer coisa.

**Commitei na `main` sem querer**

Tem conserto, mas os comandos são delicados e é fácil piorar tentando. Peça
ajuda antes de mexer.

**Um botão sumiu da interface**

Provavelmente é uma guarda de permissão agindo. Confira o cargo do usuário em
Organização → Cargos. Vale lembrar que sessões abertas antes da mudança
continuam com o perfil em cache: faça logout e login para ver o comportamento
real.

---

## Resumo

```bash
git checkout develop    # sempre trabalhe aqui
git pull                # antes de começar

# ... trabalha ...

git add -A
git commit -m "o que mudou"
git push                # gera o preview

# confere o preview → abre o PR no GitHub → mergeia
```
