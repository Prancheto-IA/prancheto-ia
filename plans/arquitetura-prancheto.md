# 🧠 Prancheto.IA — Documento de Arquitetura Técnica

> Versão: 1.0.0 | Data: Junho 2024 | Status: Em desenvolvimento ativo

---

## 1. Visão Geral do Sistema

O **Prancheto.IA** é um CRM B2B SaaS modular, multi-tenant, projetado para:
- **Clínicas** (gestão de pacientes, agendamentos, prontuários)
- **Instituições de Ensino** (gestão de alunos, matrículas, turmas)
- **Prestadores de Serviço** (gestão de clientes, projetos, contratos)

### Princípios Arquiteturais

| Princípio | Implementação |
|---|---|
| **API First** | Back-end RESTful desacoplado do front-end |
| **Multi-tenant** | Isolamento 100% por `tenant_id` em todas as tabelas |
| **Security by Design** | JWT + RBAC + Rate Limiting + Audit Logs |
| **Self-Healing** | Monitoramento contínuo + autocorreção de falhas básicas |
| **Observability** | Sentry + Winston + Health Check público |

---

## 2. Stack Tecnológica

### Back-end
```
Node.js 18+     → Runtime JavaScript
Express 4       → Framework HTTP
PostgreSQL 14+  → Banco de dados relacional
Knex.js         → Query builder + migrations
bcryptjs        → Hash de senhas
jsonwebtoken    → Autenticação JWT
Winston         → Logs estruturados
@sentry/node    → Monitoramento de erros
express-rate-limit → Proteção contra força bruta
helmet          → Headers de segurança HTTP
cors            → Controle de origens
uuid            → Geração de IDs únicos
```

### Front-end
```
React 18        → Framework de UI
Vite 5          → Bundler + servidor de desenvolvimento
TailwindCSS 3   → Framework CSS utilitário
React Router 6  → Roteamento SPA
Zustand         → Gerenciamento de estado global
Axios           → Cliente HTTP com interceptors
@sentry/react   → Monitoramento de erros no browser
```

---

## 3. Modelo de Dados (Multi-tenant)

### Diagrama de Entidades

```
tenants (empresas clientes)
  │
  ├── users (usuários do tenant)
  │     └── audit_logs (ações dos usuários)
  │
  ├── sections (Nível 1 - Grandes áreas)
  │     └── modules (Nível 2 - Sub-nichos)
  │           └── tabs (Nível 3 - Visualizações)
  │                 └── widgets (Nível 4 - Elementos granulares)
  │
  └── audit_logs (logs de auditoria do tenant)
```

### Regra de Isolamento Multi-tenant

**TODA** query de negócio deve incluir o filtro `WHERE tenant_id = ?`.

O middleware [`tenant.middleware.js`](../backend/src/middlewares/tenant.middleware.js) injeta automaticamente o `tenant_id` em todas as requisições autenticadas.

O helper `queryComTenant(knex('tabela'), req)` aplica o filtro automaticamente nos controllers.

---

## 4. Sistema de Autenticação

### Fluxo de Login

```
1. POST /api/auth/login { email, senha }
2. Verifica bloqueio temporário (tentativas excessivas)
3. Compara senha com bcrypt hash
4. Gera JWT (8h) + Refresh Token (7d)
5. Detecta isSuperAdmin → redireciona para /admin ou /crm
6. Registra em audit_logs
```

### Tokens JWT

| Token | Duração | Uso |
|---|---|---|
| **Access Token** | 8 horas | Autenticação de requisições |
| **Refresh Token** | 7 dias | Renovação automática do access token |

### Payload do JWT

```json
{
  "userId": "uuid",
  "tenantId": "uuid | null",
  "cargo": "admin | manager | member | viewer",
  "isSuperAdmin": false
}
```

---

## 5. Sistema RBAC (Controle de Acesso)

### Hierarquia de Cargos

```
super_admin (100) → Conta Tronco — acesso irrestrito a tudo
admin       (80)  → Administrador do tenant
manager     (60)  → Gerente com permissões amplas
member      (40)  → Membro padrão
viewer      (20)  → Apenas visualização
```

### Permissões Granulares (4 Níveis)

```json
{
  "secoes":  ["comercial", "outreach"],
  "modulos": ["leads", "campanhas"],
  "abas":    ["kanban", "dashboard"],
  "widgets": ["btn_whatsapp", "kpi_receita"]
}
```

**Regra:** `"*"` em qualquer nível = acesso total àquele nível.

### Middlewares de Proteção

| Middleware | Uso |
|---|---|
| `autenticar` | Verifica JWT em todas as rotas protegidas |
| `exigirSuperAdmin` | Bloqueia acesso ao painel admin |
| `exigirCargo([...])` | Exige cargo específico |
| `exigirNivelMinimo('manager')` | Exige nível mínimo na hierarquia |
| `exigirPermissaoSecao('comercial')` | Verifica permissão de seção |
| `garantirIsolamentoTenant` | Impede acesso a dados de outro tenant |

---

## 6. Hierarquia Modular (4 Níveis)

```
Nível 1: Seções    → Grandes áreas de trabalho
  └── Nível 2: Módulos  → Sub-nichos dentro da seção
        └── Nível 3: Abas    → Visualizações (Kanban, Table, Dashboard)
              └── Nível 4: Widgets → Elementos granulares (KPI, Botões, Gráficos)
```

### Interface (Estilo Finder do Mac)

A navegação usa colunas progressivas:
- Coluna 1: Lista de Seções
- Coluna 2: Módulos da seção selecionada
- Coluna 3: Abas do módulo selecionado
- Área principal: Conteúdo da aba com widgets

---

## 7. Painel Administrativo (Conta Tronco)

### Acesso

A URL `/admin` é **invisível** para usuários comuns. O `App.jsx` redireciona automaticamente para `/crm` se o usuário não for Super Admin, mesmo que conheça a URL.

### Funcionalidades

| Módulo | Status |
|---|---|
| Gestão de Clientes (Tenants) | ✅ Implementado |
| Gestão de Usuários | ✅ Implementado |
| Chat com IA (geração de módulos) | 🔜 Próxima etapa |
| Monitoramento do sistema | 🔜 Próxima etapa |
| Logs de segurança e auditoria | 🔜 Próxima etapa |

---

## 8. Resiliência e Monitoramento

### Health Check

```
GET /api/health
→ 200 { "status": "ok", "timestamp": "...", "ambiente": "production" }
→ 503 { "status": "error", "mensagem": "Banco de dados inacessível" }
```

Configure o Better Stack/UptimeRobot para verificar esta URL a cada 1 minuto.

### Sentry

- **Back-end:** Captura exceções não tratadas, erros 5xx, falhas críticas
- **Front-end:** Captura erros de componentes React, erros de rede

### Self-Healing

O serviço [`selfHealing.service.js`](../backend/src/services/selfHealing.service.js) monitora:
1. Conexão com o banco (reconexão automática)
2. Diretório de logs (recria se ausente)
3. Exceções não tratadas (`uncaughtException`)
4. Promises rejeitadas sem handler (`unhandledRejection`)
5. Encerramento gracioso (`SIGTERM`)

### Logs (Winston)

```
backend/logs/app.log     → Todos os eventos (info, warn, error)
backend/logs/errors.log  → Apenas erros críticos
```

Formato: `[TIMESTAMP] NÍVEL: mensagem | { contexto JSON }`

---

## 9. Segurança

### Camadas de Proteção

| Camada | Implementação |
|---|---|
| Headers HTTP | Helmet (XSS, clickjacking, MIME sniffing) |
| Rate Limiting | 100 req/15min global; 10 tentativas/15min no login |
| Autenticação | JWT com expiração curta + refresh token |
| Senhas | bcrypt com custo 12 |
| Multi-tenant | Isolamento por `tenant_id` em todas as queries |
| Auditoria | Log imutável de todas as ações críticas |
| Bloqueio | Conta bloqueada após 5 tentativas de login falhas |

---

## 10. Rotas da API

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/health` | Health Check | ❌ |
| GET | `/api/status` | Status da API | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| POST | `/api/auth/refresh` | Renovar token | ❌ |
| POST | `/api/auth/logout` | Logout | ✅ |
| GET | `/api/auth/me` | Dados do usuário | ✅ |
| GET | `/api/users` | Listar usuários | ✅ Admin+ |
| POST | `/api/users` | Criar usuário | ✅ Admin+ |
| GET | `/api/users/:id` | Ver usuário | ✅ Manager+ |
| PUT | `/api/users/:id` | Atualizar usuário | ✅ Admin+ |
| PATCH | `/api/users/:id/status` | Ativar/desativar | ✅ Admin+ |
| GET | `/api/admin/tenants` | Listar clientes | ✅ SuperAdmin |
| POST | `/api/admin/tenants` | Criar cliente | ✅ SuperAdmin |
| GET | `/api/admin/tenants/:id` | Ver cliente | ✅ SuperAdmin |
| PUT | `/api/admin/tenants/:id` | Atualizar cliente | ✅ SuperAdmin |
| PATCH | `/api/admin/tenants/:id/status` | Suspender cliente | ✅ SuperAdmin |

---

*Prancheto.IA © 2024 — Documento de Arquitetura Técnica v1.0.0*
