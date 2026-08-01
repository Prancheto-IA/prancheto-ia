# 🧠 Prancheto.IA — CRM Modular SaaS Multi-tenant

> CRM B2B modular com arquitetura multi-tenant, isolamento por Row Level Security
> e painel administrativo exclusivo da equipe fundadora.

> 🌱 **Antes de codar, leia [docs/AMBIENTES.md](docs/AMBIENTES.md).**
> Desenvolvimento e produção usam bancos Supabase separados. O documento explica
> o fluxo `develop → preview → main → produção` e como aplicar migrations com segurança.

---

## 📋 Índice

1. [Arquitetura](#-arquitetura)
2. [Pré-requisitos](#-pré-requisitos)
3. [Primeira execução](#-primeira-execução)
4. [Estrutura do projeto](#-estrutura-do-projeto)
5. [Banco de dados](#-banco-de-dados)
6. [Edge Functions](#-edge-functions)
7. [Rotas e navegação](#-rotas-e-navegação)
8. [Controle de acesso](#-controle-de-acesso)
9. [Monitoramento](#-monitoramento)
10. [Stack](#-stack)

---

## 🏗 Arquitetura

**Não existe servidor de aplicação próprio.** O front-end React conversa direto
com o Supabase, que cumpre o papel de back-end:

```
   React (Vite)
        │
        │  @supabase/supabase-js
        ▼
   ┌─────────────────────────────────────┐
   │  Supabase                           │
   │                                     │
   │   Auth        sessão e cadastro     │
   │   PostgreSQL  dados + RLS           │
   │   Edge Funcs  operações privilegiadas│
   └─────────────────────────────────────┘
```

A consequência mais importante disso: **o isolamento entre clientes é
responsabilidade do banco, não do front-end.** Cada tabela tem Row Level
Security ativo, e as políticas decidem o que cada usuário enxerga a partir de
`auth.uid()`. Não há camada intermediária para confiar — uma policy mal escrita
é um vazamento entre tenants.

Por isso, ao mexer em qualquer tabela, a pergunta não é só "o dado está certo?",
mas "quem consegue ver esse dado?".

---

## ✅ Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| **Node.js** | 18+ (usamos 24.x) | https://nodejs.org |
| **npm** | 9+ | vem com o Node |
| **Git** | recente | https://git-scm.com |
| **Supabase CLI** | 2.x | `npm i -g supabase` — só para migrations |

Não é necessário instalar PostgreSQL: o banco é gerenciado pelo Supabase.
Se precisar de `psql` ou `pg_dump` para inspeção, veja
[docs/AMBIENTES.md](docs/AMBIENTES.md#conectando-direto-no-banco).

---

## 🚀 Primeira execução

```bash
git clone https://github.com/Prancheto-IA/prancheto-ia.git
cd prancheto-ia/frontend
npm install
```

Crie o arquivo de ambiente a partir do template:

```bash
cp .env.example .env.development
```

Preencha com as credenciais do projeto Supabase **de desenvolvimento**
(Dashboard → Project Settings → API). Depois:

```bash
npm run dev
# http://localhost:5173
```

O Vite carrega `.env.development` automaticamente — você já está no banco de
desenvolvimento, sem passo extra.

### Dados para testar

`supabase/seed.sql` popula o banco de dev com um tenant fictício, times, funil
de CRM, projetos e tarefas. Instruções e credenciais de acesso em
[docs/AMBIENTES.md](docs/AMBIENTES.md#dados-de-teste-seed).

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (banco de dev) |
| `npm run build` | Build de produção (banco de produção) |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint, sem tolerância a warnings |

---

## 📁 Estrutura do projeto

```
prancheto-ia/
├── frontend/                  Aplicação React
│   └── src/
│       ├── pages/             Telas, agrupadas por área
│       ├── components/        Componentes compartilhados
│       ├── hooks/             Acesso a dados e regras de negócio
│       ├── store/             Estado global (Zustand)
│       ├── lib/supabase.js    Client do Supabase + guard de ambiente
│       └── utils/
│
├── supabase/
│   ├── migrations/            Histórico versionado do schema
│   ├── migrations_legado/     Arquivo histórico — não é executado
│   ├── functions/             Edge Functions (Deno)
│   ├── seed.sql               Dados de desenvolvimento
│   └── config.toml
│
├── docs/AMBIENTES.md          Separação dev/produção e fluxo de trabalho
└── plans/                     Documentação de arquitetura
```

### Onde fica a lógica

Os **hooks** concentram o acesso a dados: cada um encapsula as consultas
Supabase de um domínio e devolve estado pronto para a tela. Ao adicionar uma
funcionalidade, o caminho natural é estender o hook existente, não consultar o
Supabase direto do componente.

| Hook | Domínio |
|---|---|
| `useAuth` | Sessão, login, cargo do usuário |
| `usePermission` | Checagem de permissões na interface |
| `useCRM` | Leads, clientes, funil, campos customizados |
| `useProjetos` · `useTarefas` | Projetos, milestones, tarefas |
| `useOrg` | Times, cargos, membros |
| `useChat` · `useFeed` | Chat interno e feed |
| `useSuporte` · `useBaseConhecimento` · `useStatusSistema` | Módulo de suporte |
| `useModulos` · `useSidebarPrefs` · `useTema` | Preferências e navegação |
| `useErrorHandler` | Tratamento uniforme de erros |

---

## 🗄 Banco de dados

O schema vive em `supabase/migrations/` e tem como ponto de partida a
**baseline** `20260801000000_baseline_producao.sql`, gerada a partir do estado
real da produção: 41 tabelas, 109 políticas de RLS, 85 índices, 14 funções,
16 triggers.

### Regra que não se quebra

**Nada é alterado pelo SQL Editor do dashboard.** Foi assim que 11 tabelas
fundamentais do sistema acabaram sem histórico algum, e o que motivou a
baseline. Toda mudança nasce de:

```bash
supabase migration new nome_descritivo
```

Aplica-se primeiro no ambiente de desenvolvimento, testa-se, e só depois
promove para produção. O passo a passo está em
[docs/AMBIENTES.md](docs/AMBIENTES.md#alterações-no-banco-de-dados).

### Multi-tenancy

O isolamento se apoia em duas funções `SECURITY DEFINER` que evitam recursão
infinita nas políticas:

- `public.get_user_tenant_id()` — tenant do usuário autenticado
- `public.get_user_cargo()` — cargo do usuário autenticado

Além do tenant, o CRM filtra por **time**: um contato é visível para quem é
membro do time dono do registro ou para quem é o responsável direto por ele.

### Cadastro de usuários

O trigger `on_auth_user_created` em `auth.users` cria a linha correspondente em
`public.users`. Signup direto entra com `tenant_id` nulo e `ativo = false` —
o RLS bloqueia o acesso até que um admin associe a pessoa a um tenant.

`supabase/migrations_legado/` guarda as migrations anteriores à baseline. Não
são mais executadas, mas documentam decisões que ainda valem — veja o
[README de lá](supabase/migrations_legado/README.md).

---

## ⚡ Edge Functions

Operações que exigem privilégio acima do usuário e por isso não podem rodar no
browser. Ficam em `supabase/functions/`, escritas em TypeScript sobre Deno.

| Função | Responsabilidade |
|---|---|
| `admin-users` | Criação e gestão de usuários com `service_role` |
| `admin-impersonate` | Permite ao super admin assumir a sessão de um cliente |
| `chat-ai` | Intermedia as chamadas ao provedor de IA, sem expor a chave |

Deploy:

```bash
supabase functions deploy <nome>
```

Segredos são configurados com `supabase secrets set`, nunca no código.

---

## 🔗 Rotas e navegação

Todas as páginas usam lazy loading. As rotas do cliente compartilham o
`LayoutCliente`, que fornece a sidebar.

| Rota | Área | Acesso |
|---|---|---|
| `/login` | Autenticação | Pública |
| `/dashboard` | Início, agenda, chat, relatórios, outbound, configurações, planos | Cliente |
| `/dashboard/organizacao/*` | Times, cargos, identidade visual | Cliente |
| `/crm/*` | Leads, clientes, campos customizados | Cliente |
| `/modulos/*` | Dashboard, calendário, projetos, tarefas, feed, chat, times | Cliente |
| `/suporte/*` | Tickets, base de conhecimento, status do sistema | Cliente |
| `/admin/*` | Gestão de clientes, usuários, planos, monitoramento, logs | Super admin |

A rota `/` redireciona conforme o cargo: super admin vai para `/admin`, os
demais para `/dashboard`.

---

## 🔐 Controle de acesso

Cinco cargos, validados por `CHECK` na tabela `users`:

| Cargo | Alcance |
|---|---|
| `super_admin` | Equipe fundadora. Acessa `/admin`, atravessa tenants |
| `admin` | Administra o próprio tenant |
| `manager` | Gerencia times, projetos e funil |
| `member` | Operação do dia a dia |
| `viewer` | Somente leitura |

O que de fato barra o acesso é o **RLS no banco**. As rotas protegidas em
`App.jsx` (`RotaPrivada`, `RotaCliente`, `RotaSuperAdmin`) são conveniência de
navegação, não segurança: esconder uma tela não impede uma requisição.

### Permissões granulares — ainda não ligadas

Existe um segundo nível de permissões por tenant, em `org_cargos.permissoes`
(JSON, ex.: `["crm.ler","crm.escrever"]`). A infraestrutura está pronta no
banco, e há um hook `usePermission` e um componente `<PermissaoGuarda>`
escritos para consumi-la.

**Nada disso está em uso.** Hoje `usePermission` é importado apenas por
`PermissaoGuarda`, que por sua vez não é usado em tela nenhuma. Na prática, as
permissões gravadas em `org_cargos` não alteram o comportamento da interface —
o que vale é o cargo em `users.cargo` e as políticas de RLS.

Ao ligar isso, lembre-se de que a checagem na interface precisa ter uma policy
correspondente no banco. Sem o par, é decoração.

---

## 📊 Monitoramento

**Sentry** captura erros do front-end. Configure `VITE_SENTRY_DSN` apenas em
produção — em desenvolvimento, deixe vazio para não poluir os alertas.

A amostragem de performance é de 10% em produção e 100% fora dela
(`src/main.jsx`). O `Sentry.ErrorBoundary` em `App.jsx` evita tela branca:
mostra uma mensagem amigável com opção de tentar novamente.

O módulo de suporte tem uma página de **Status do Sistema** (`/suporte/status`)
alimentada pelas tabelas `suporte_status_componentes` e
`suporte_status_incidentes`.

---

## 🧰 Stack

| Camada | Tecnologia |
|---|---|
| Interface | React 18 + Vite 5 |
| Estilo | TailwindCSS 3 |
| Estado global | Zustand |
| Rotas | React Router 6 |
| Drag and drop | dnd-kit |
| Backend | Supabase (PostgreSQL 17, Auth, Edge Functions) |
| Segurança de dados | Row Level Security |
| Monitoramento | Sentry |
| Hospedagem | Vercel |

---

*Prancheto.IA © 2026 — Todos os direitos reservados.*
