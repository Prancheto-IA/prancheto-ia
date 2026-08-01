# 🧠 Prancheto.IA — CRM Modular SaaS Multi-tenant

> Sistema de CRM B2B modular, escalável e seguro, com arquitetura Multi-tenant e Painel Administrativo exclusivo para a equipe fundadora.

> 🌱 **Antes de codar, leia [docs/AMBIENTES.md](docs/AMBIENTES.md).**
> Desenvolvimento e produção usam bancos Supabase separados. O documento explica
> o fluxo `develop → preview → main → produção` e como aplicar migrations com segurança.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Instalação — Back-end](#instalação--back-end)
4. [Instalação — Front-end](#instalação--front-end)
5. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Executando o Projeto](#executando-o-projeto)
8. [Rotas Importantes](#rotas-importantes)
9. [Monitoramento e Segurança](#monitoramento-e-segurança)
10. [Stack Tecnológica](#stack-tecnológica)

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de ter instalado na sua máquina:

| Ferramenta | Versão Mínima | Download |
|---|---|---|
| **Node.js** | 18.x ou superior | https://nodejs.org |
| **npm** | 9.x ou superior | (incluído com Node.js) |
| **PostgreSQL** | 14.x ou superior | https://www.postgresql.org/download |
| **Git** | Qualquer versão recente | https://git-scm.com |

---

## 📁 Estrutura do Projeto

```
prancheto-ia/
├── backend/          # API RESTful (Node.js + Express + PostgreSQL)
├── frontend/         # Interface React (Vite + TailwindCSS)
├── plans/            # Documentação de arquitetura
└── README.md         # Este arquivo
```

---

## 🔧 Instalação — Back-end

> ⚠️ **ATENÇÃO — INSTALAÇÃO DE DEPENDÊNCIAS NECESSÁRIA**
> Os comandos abaixo instalam todas as bibliotecas do back-end.
> Execute-os UMA VEZ antes de iniciar o servidor pela primeira vez.

```bash
# 1. Entre na pasta do back-end
cd prancheto-ia/backend

# 2. Instale todas as dependências
npm install
```

**Dependências que serão instaladas:**
- `express` — Servidor HTTP
- `pg` — Driver do PostgreSQL
- `knex` — Query builder e migrations
- `bcryptjs` — Criptografia de senhas
- `jsonwebtoken` — Autenticação JWT
- `dotenv` — Variáveis de ambiente
- `winston` — Logs estruturados
- `express-rate-limit` — Proteção contra força bruta
- `helmet` — Headers de segurança HTTP
- `cors` — Controle de origens permitidas
- `@sentry/node` — Monitoramento de erros em produção
- `uuid` — Geração de IDs únicos

---

## 🎨 Instalação — Front-end

> ⚠️ **ATENÇÃO — INSTALAÇÃO DE DEPENDÊNCIAS NECESSÁRIA**
> Os comandos abaixo instalam todas as bibliotecas do front-end.

```bash
# 1. Entre na pasta do front-end
cd prancheto-ia/frontend

# 2. Instale todas as dependências
npm install
```

**Dependências que serão instaladas:**
- `react` + `react-dom` — Framework de UI
- `react-router-dom` — Roteamento de páginas
- `axios` — Cliente HTTP para chamadas à API
- `zustand` — Gerenciamento de estado global
- `@sentry/react` — Monitoramento de erros no front-end
- `tailwindcss` — Framework de CSS utilitário
- `vite` + `@vitejs/plugin-react` — Bundler e servidor de desenvolvimento

---

## 🗄️ Configuração do Banco de Dados

> ⚠️ **ATENÇÃO — AÇÃO NECESSÁRIA NO BANCO DE DADOS**

### 1. Crie o banco de dados no PostgreSQL

Abra o terminal do PostgreSQL (psql) ou use uma ferramenta como DBeaver/pgAdmin e execute:

```sql
CREATE DATABASE prancheto_ia;
```

### 2. Execute as migrations

Após configurar o arquivo `.env` (próximo passo), execute:

```bash
cd prancheto-ia/backend
npm run migrate
```

### 3. Execute os seeds (dados iniciais)

Cria a Conta Tronco (Super Admin) e os planos base:

```bash
npm run seed
```

---

## 🔐 Variáveis de Ambiente

### Back-end

```bash
# 1. Copie o arquivo de exemplo
cd prancheto-ia/backend
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux

# 2. Abra o arquivo .env e preencha os valores
```

**Variáveis obrigatórias:**

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_NAME` | Nome do banco | `prancheto_ia` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `sua_senha` |
| `JWT_SECRET` | Chave secreta JWT | (gere com o comando abaixo) |

**Gerar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Front-end

```bash
cd prancheto-ia/frontend
copy .env.example .env   # Windows
# cp .env.example .env   # Mac/Linux
```

---

## ▶️ Executando o Projeto

### Modo Desenvolvimento (recomendado para início)

**Terminal 1 — Back-end:**
```bash
cd prancheto-ia/backend
npm run dev
# Servidor rodando em: http://localhost:3001
```

**Terminal 2 — Front-end:**
```bash
cd prancheto-ia/frontend
npm run dev
# Interface rodando em: http://localhost:5173
```

### Modo Produção

```bash
# Back-end
cd prancheto-ia/backend
npm start

# Front-end (gera build otimizado)
cd prancheto-ia/frontend
npm run build
npm run preview
```

---

## 🔗 Rotas Importantes

| Rota | Método | Descrição | Autenticação |
|---|---|---|---|
| `/api/health` | GET | Health Check (monitor externo) | ❌ Pública |
| `/api/status` | GET | Status da API | ❌ Pública |
| `/api/auth/login` | POST | Login de usuários | ❌ Pública |
| `/api/auth/refresh` | POST | Renovar token JWT | ✅ Token |
| `/api/users` | GET | Listar usuários do tenant | ✅ Token + RBAC |
| `/api/sections` | GET | Biblioteca de Seções | ✅ Token + RBAC |
| `/api/admin/tenants` | GET | Gestão de clientes | ✅ Super Admin |

---

## 🛡️ Monitoramento e Segurança

### Health Check (Better Stack / UptimeRobot)

Configure seu monitor externo para verificar a URL:
```
GET http://seu-dominio.com/api/health
```
Resposta esperada quando tudo está OK:
```json
{ "status": "ok", "timestamp": "...", "ambiente": "production" }
```

### Sentry (Monitoramento de Erros)

1. Crie uma conta em https://sentry.io
2. Crie dois projetos: um para `Node.js` (back-end) e um para `React` (front-end)
3. Copie os DSNs e cole nas variáveis `SENTRY_DSN` (back-end) e `VITE_SENTRY_DSN` (front-end)

### Logs

Os logs são salvos automaticamente em:
- `backend/logs/app.log` — Todos os eventos
- `backend/logs/errors.log` — Apenas erros críticos

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Back-end | Node.js 18+ + Express 4 |
| Banco de Dados | PostgreSQL 14+ |
| ORM/Migrations | Knex.js |
| Autenticação | JWT + bcryptjs |
| Front-end | React 18 + Vite 5 |
| Estilo | TailwindCSS 3 |
| Estado Global | Zustand |
| HTTP Client | Axios |
| Monitoramento | Sentry |
| Logs | Winston |
| Segurança | Helmet + express-rate-limit |

---

*Prancheto.IA © 2024 — Todos os direitos reservados.*
