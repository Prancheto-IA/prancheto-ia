# Especificação Funcional: Painel Super Admin (Conta Tronco)

## 1. Identificação do Módulo
- **Nome:** Painel Administrativo Global (Super Admin / Conta Tronco)
- **Componentes Principais:** `AdminPanel.jsx` (`frontend/src/pages/AdminPanel/AdminPanel.jsx`), `GestaoClientes.jsx`, `GestaoUsuarios.jsx`, `PlanoLimites.jsx`, `LogsSeguranca.jsx`, `Monitoramento.jsx`, `TicketsRecebidos.jsx`, `ChatIA.jsx`
- **Rotas:** `/admin`, `/admin/chat`, `/admin/usuarios`, `/admin/clientes`, `/admin/planos`, `/admin/seguranca`, `/admin/monitoramento`, `/admin/tickets`
- **Permissão de Acesso:** Exclusivo para usuários onde `isSuperAdmin === true`. Qualquer outro usuário é redirecionado para `/dashboard`.

---

## 2. Objetivo Funcional
Permitir o gerenciamento centralizado da plataforma SaaS pela equipe fundadora: administração de tenants (empresas clientes), impersonation de usuários para suporte direto, controle global de planos e limites, logs de auditoria e segurança LGPD, monitoramento de saúde dos servidores e atendimento a tickets de suporte de todos os clientes.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Acesso Global):** `tenants`, `users`, `planos`, `logs_auditoria`, `suporte_tickets`, `user_preferencias`.
- **API Admin (`/api/admin/*`):** Endpoints restritos para operações administrativas.
- **Estado de Impersonation (`BannerImpersonation`):** Permite assumir temporariamente o token/sessão de qualquer usuário cliente para visualizar a plataforma com os exatos privilégios dele.

---

## 4. Sub-Módulos e Funcionalidades

### A. Sub-Módulo 1: Gestão de Clientes / Tenants (`GestaoClientes.jsx`)
- **Objetivo:** Criar, editar, suspender ou cancelar contas de empresas clientes.
- **Elementos e Funções:**
  - **Botão Criar Cliente (`➕ Novo Cliente`):** Abre `ModalCliente` com campos: `nome da empresa`, `slug único` (auto-gerado via regex), `e-mail de contato`, `plano` (`Free`, `Starter`, `Pro`, `Enterprise`) e `limite de usuários`.
  - **Filtros e Paginação:** Busca por nome/slug/e-mail e filtro por status (`Ativo`, `Suspenso`, `Cancelado`).
  - **Badge de Status:** Ativo (`verde`), Suspenso (`amarelo`), Cancelado (`cinza`).
  - **Botão Alterar Status (`ModalStatusTenant`):** Permite suspender temporariamente o acesso do cliente ou reativar.

---

### B. Sub-Módulo 2: Gestão de Usuários & Impersonation (`GestaoUsuarios.jsx`)
- **Objetivo:** Visualizar todos os usuários cadastrados no sistema em todos os clientes e assumir sessão.
- **Elementos e Funções:**
  - **Tabela Global de Usuários:** Exibe nome, e-mail, tenant vinculado, cargo e status.
  - **Botão Assumir Sessão (`Impersonate`):** Gera um token temporário em nome daquele usuário e redireciona o Super Admin para o `/dashboard` do cliente com o `BannerImpersonation` ativo no topo.

---

### C. Sub-Módulo 3: Planos e Limites (`PlanoLimites.jsx`)
- **Objetivo:** Configurar os pacotes comerciais do sistema, recursos ativos por plano e limites de consumo de banco/armazenamento.
- **Elementos e Funções:**
  - **Editor de Planos:** Definição de preços, módulos liberados e quotas máximas de armazenamento (GB) e contatos CRM.

---

### D. Sub-Módulo 4: Logs de Segurança e Auditoria (`LogsSeguranca.jsx`)
- **Objetivo:** Rastreabilidade LGPD e auditoria de ações no sistema.
- **Elementos e Funções:**
  - **Tabela de Logs:** Exibe IP de origem, data/hora, usuário, ação executada (ex: `login`, `delete_lead`, `export_csv`) e parâmetro da alteração.

---

### E. Sub-Módulo 5: Monitoramento do Sistema (`Monitoramento.jsx`)
- **Objetivo:** Acompanhar a saúde da infraestrutura, erros não tratados gravados pelo Sentry/backend e métricas de servidores.
- **Elementos e Funções:**
  - **Gráficos de Latência e Erros:** Métricas de tempo de resposta da API e taxa de erro 5xx.

---

### F. Sub-Módulo 6: Tickets Recebidos de Suporte (`TicketsRecebidos.jsx`)
- **Objetivo:** Responder a chamados de suporte abertos por qualquer empresa cliente.
- **Elementos e Funções:**
  - **Fila de Atendimento:** Filtro por prioridade e tenant.
  - **Editor de Resposta com Notas Internas:** Envio de soluções para o cliente e inclusão de anotações técnicas visíveis apenas para os administradores.

---

### G. Sub-Módulo 7: Chat com IA Admin (`ChatIA.jsx`)
- **Objetivo:** Assistente gerador de código e suporte a operações administrativas em linguagem natural.
