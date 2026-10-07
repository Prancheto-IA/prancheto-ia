# Especificação Funcional: Gestão Organizacional (Times, Cargos, Usuários e Identidade Visual)

## 1. Identificação do Módulo
- **Nome:** Módulo de Estrutura Organizacional
- **Componentes Principais:** `Organizacao.jsx` (`frontend/src/pages/DashboardCliente/Organizacao/Organizacao.jsx`), `Times.jsx`, `Cargos.jsx`, `Usuarios.jsx`, `IdentidadeVisual.jsx`
- **Sub-rotas:**
  - `/dashboard/organizacao/times`
  - `/dashboard/organizacao/cargos`
  - `/dashboard/organizacao/usuarios`
  - `/dashboard/organizacao/identidade`
- **Permissão de Acesso:** Administradores e Gerentes da Organização.

---

## 2. Objetivo Funcional
Gerenciar a estrutura interna da empresa cliente: criação de equipes/departamentos (Times), definição de cargos e matriz de permissões granulares de acesso (ACL), cadastro e edição de membros da equipe (Usuários) e personalização da identidade visual da empresa (upload de logo, cores de marca e tema customizado).

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase):** `org_times`, `org_cargos`, `org_permissoes`, `users`, `tenants`.
- **Stores:** `useAuthStore`, `useTenantStore`.

---

## 4. Sub-Módulos e Funcionalidades

### A. Sub-Módulo 1: Times e Pessoas (`Times.jsx`)
- **Objetivo:** Criar e gerenciar equipes (ex: *Comercial*, *Suporte*, *Engenharia*), alocando membros e definindo líderes de time.
- **Elementos e Funções:**
  - **Botão Criar Time (`+ Novo Time`):** Abre modal de criação com campos: `nome`, `descrição`, `ícone (emoji)`, `cor de acento`.
  - **Card de Time:** Exibe o ícone do time, nome, cor representativa, líder designado, total de membros e botão de editar/excluir.
  - **Modal de Gestão de Membros do Time:** Permite selecionar usuários da empresa e adicioná-los ou removê-los da equipe.
  - **Definição de Líder:** Select para atribuir a liderança da equipe a um usuário específico.

---

### B. Sub-Módulo 2: Cargos e Permissões (`Cargos.jsx`)
- **Objetivo:** Criar níveis de privilégio personalizados (ex: *Gerente de Vendas*, *Analista N1*) e controlar acessos granulares.
- **Elementos e Funções:**
  - **Lista de Cargos:** Exibe os cargos existentes com badge do número de usuários atribuídos.
  - **Matriz de Permissões (Checkboxes por Módulo):** Matriz onde o administrador pode marcar/desmarcar o que cada cargo pode fazer (ex: `crm.visualizar`, `crm.editar`, `relatorios.exportar`, `suporte.responder`).
  - **Botão Salvar Permissões:** Grava a nova matriz de acessos na tabela `org_permissoes`.
  - **Sincronização em Tempo Real:** Atualiza imediatamente as permissões do usuário logado através da revalidação do hook `useAuth`.

---

### C. Sub-Módulo 3: Gestão de Usuários (`Usuarios.jsx`)
- **Objetivo:** Cadastrar novos colaboradores da empresa, atribuir cargos e desativar acessos.
- **Elementos e Funções:**
  - **Botão Convidar / Criar Usuário (`+ Novo Usuário`):** Abre modal com campos: `nome`, `e-mail`, `senha provisória`, `cargo` (select) e `time` (select).
  - **Tabela de Usuários:** Exibe o avatar, nome, e-mail, cargo atual, time vinculado, status (`Ativo`/`Inativo`) e data de cadastro.
  - **Dropdown de Ações na Linha:**
    - **Editar Cargo / Time:** Altera a função ou equipe do colaborador.
    - **Redefinir Senha:** Envia link de redefinição ou gera nova senha.
    - **Ativar / Desativar Usuário:** Bloqueia temporariamente o acesso do colaborador ao sistema sem deletar o histórico de dados.

---

### D. Sub-Módulo 4: Identidade Visual (`IdentidadeVisual.jsx`)
- **Objetivo:** Aplicar a marca da empresa cliente na interface da aplicação (White-label).
- **Elementos e Funções:**
  - **Upload de Logotipo (`logo_url`):** Campo para envio de imagem da logo da empresa (PNG/SVG). Permite preview imediato no cabeçalho da Sidebar.
  - **Seletor de Cor Primária (`ColorPicker`):** Escolha da cor principal da marca (Hexadecimal). Altera dinamicamente os botões e seleções de toda a interface.
  - **Seletor de Cor de Fundo da Sidebar:** Define se a barra lateral terá a cor original do sistema ou a cor secundária da marca da empresa.
  - **Botão Salvar Identidade:** Salva as configurações na tabela `tenants` e invoca `useTenantStore.aplicarCores()`, injetando as variáveis CSS no elemento raiz `<html>`.
  - **Botão Restaurar Padrão:** Remove a personalização e volta para o tema padrão do Prancheto.IA.
