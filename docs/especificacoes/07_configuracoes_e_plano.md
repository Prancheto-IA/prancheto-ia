# Especificação Funcional: Configurações e Plano

## 1. Identificação do Módulo
- **Nome:** Configurações do Usuário e Assinatura/Plano
- **Componentes Principais:** `Configuracoes` (`frontend/src/pages/DashboardCliente/Configuracoes/Configuracoes.jsx`), `SecaoPlano.jsx`
- **Subcomponentes:** `SecaoConfig`, `CampoTexto`, `Toggle`, `TabAba`
- **Rota:** `/dashboard/configuracoes` (com parâmetro de aba: `?aba=geral` ou `?aba=plano`)
- **Permissão de Acesso:** Usuários autenticados (edição de perfil sujeita a `perfil.editar_proprio`).

---

## 2. Objetivo Funcional
Oferecer ao usuário um painel unificado de preferências pessoais (nome, telefone, tema visual, notificações por e-mail/sistema, rótulos personalizados do outbound) e a visualização detalhada do plano assinado pela organização, consumo de limites e opção de upgrade.

---

## 3. Fontes de Dados e Estados
- **Tabela `users` (Supabase):** `nome`, `telefone` do usuário logado.
- **Tabela `user_preferencias` (Supabase):** `tema` (`escuro`/`claro`), `notif_email`, `notif_sistema`, `metadata` (rótulos de status).
- **Tabela `tenants` & `planos`:** Para exibição na aba Plano (`SecaoPlano.jsx`).
- **Estados Locais:** `abaAtiva` (`geral` ou `plano`), `nome`, `telefone`, `notifEmail`, `notifSistema`, `rotulosStatus`, `carregando`, `salvando`, `salvo`, `erro`.

---

## 4. Elementos da Interface e Funções

### A. Navegação por Abas (`ABAS`)
- **Aba Geral (`⚙️ Geral`):** Configurações de perfil, preferências de notificação, tema e status do outbound.
- **Aba Plano (`🚀 Plano`):** Detalhes da assinatura da empresa, consumo de limites (usuários, armazenamento, contatos) e upgrade.

---

### B. Elementos da Aba Geral

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Campo Nome Completo** | Input Texto | Atualiza o estado `nome`. Máximo de 120 caracteres (`NOME_MAX`). | Desabilitado se o usuário não possuir a permissão `perfil.editar_proprio`. |
| **Campo E-mail** | Input Texto (Desabilitado) | Exibe o e-mail cadastrado na conta. Não permite alteração por ser a credencial principal. | Sempre desabilitado (`readOnly`). |
| **Campo Telefone** | Input Texto | Atualiza o estado `telefone`. Máximo de 32 caracteres (`TELEFONE_MAX`). | Grava `null` no banco se ficar em branco. |
| **Toggle Tema Escuro** | Interruptor (`Switch`) | Alterna entre tema claro e escuro (`setTemaEscuro`). Persiste a preferência no banco e localStorage. | Aplica o tema imediatamente na aplicação. |
| **Toggle Notificações por E-mail** | Interruptor (`Switch`) | Ativa/Desativa o recebimento de alertas e resumos por e-mail (`setNotifEmail`). | Salva na tabela `user_preferencias`. |
| **Toggle Notificações no Sistema** | Interruptor (`Switch`) | Ativa/Desativa popups e notificações internas na interface (`setNotifSistema`). | Salva na tabela `user_preferencias`. |
| **Campos de Rótulos de Outbound** | 5 Inputs de Texto | Permite renomear os rótulos exibidos no funil outbound (`Pendente`, `Enviado`, `Respondido`, `Sem Retorno`, `Convertido`). | Não altera os identificadores técnicos dos status no banco. |
| **Botão Salvar Alterações** | Botão Principal | Executa atualização combinada na tabela `users` e `user_preferencias`. Atualiza a `useAuthStore`. | Exibe aviso de sucesso temporário ("Salvo com sucesso"). |

---

### C. Elementos da Aba Plano (`SecaoPlano.jsx`)

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Badge do Plano Atual** | Etiqueta (`Badge`) | Exibe o nome do plano ativo da organização (ex: *Professional*, *Enterprise*, *Starter*). | Carregado do tenant da empresa. |
| **Barras de Consumo de Limites** | Indicadores de Progresso | Mostra a porcentagem de uso de: Usuários cadastrados, Leads no CRM, Armazenamento de arquivos (GB). | Exibe alerta em vermelho se estiver próximo do limite de 100%. |
| **Grid de Recursos Incluídos** | Lista de Checagem (`✅`) | Lista os módulos e funcionalidades disponíveis no plano atual. | Baseado na tabela de limites do plano. |
| **Botão Fazer Upgrade / Alterar Plano** | Botão de Destaque | Redireciona o usuário para o fluxo de contratação ou contato com vendas. | Disponível para Administradores. |
