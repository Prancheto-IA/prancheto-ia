# Especificação Funcional: Gestão de Tarefas (Kanban e Lista)

## 1. Identificação do Módulo
- **Nome:** Módulo de Quadro de Tarefas e Produtividade (Kanban)
- **Componente Principal:** `Tarefas` (`frontend/src/pages/Tarefas/Tarefas.jsx`)
- **Subcomponentes:** `ModalTarefa`, `CardTarefa`, `ColunaKanban`
- **Hook de Suporte:** `useTarefas.js`
- **Rota:** `/tarefas` (ou `/modulos/tarefas` via redirecionamento)
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Gerenciar a distribuição de tarefas da equipe através de visão Kanban em colunas de status ou visualização em lista tabular, permitindo atribuição a múltiplos responsáveis, controle de prazos de vencimento, estimativas em horas, priorização e checklists.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase):**
  - `tarefas`: `id`, `titulo`, `descricao`, `status` (`pendente`, `em_andamento`, `em_revisao`, `conclvida`), `prioridade` (`baixa`, `media`, `alta`, `critica`), `data_vencimento`, `estimativa_h`, `tenant_id`, `criado_por`.
  - `tarefa_atribuicoes`: vínculo N:N entre tarefas e usuários responsáveis.
  - `tarefa_checklist`: itens de checagem internos da tarefa com booleano `concluido`.
- **Hook `useTarefas`:** `tarefas`, `kanban`, `criarTarefa()`, `atualizarTarefa()`, `excluirTarefa()`, `atribuirUsuario()`, `removerAtribuicao()`.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Nova Tarefa (`+ Nova tarefa`)** | Botão Principal | Abre o `ModalTarefa` para criação de nova tarefa. | Fixo no topo do módulo. |
| **Toggle "Minhas Tarefas"** | Interruptor (`Switch`) | Filtra a exibição para mostrar apenas as tarefas atribuídas ao usuário logado (`atribuidoA: usuario.id`). | Atualiza o estado `apenasMinhas`. |
| **Alternador de Visão (Kanban / Lista)** | Botões de Alternância | Alterna entre a visualização gráfica em Colunas Kanban e a tabela em Lista Simples. | Atualiza o estado `visao`. |
| **Campo de Pesquisa de Tarefas** | Input Texto | Filtra as tarefas exibidas pelo título ou descrição em tempo real. | Atualiza o estado `busca`. |
| **Coluna Kanban (`ColunaKanban`)** | Coluna por Status | Exibe o nome do status (`Pendente`, `Em Andamento`, `Em Revisão`, `Concluída`), o contador de itens e botão `+` rápido para adicionar direto naquela coluna. | Cores temáticas por coluna. |
| **Card de Tarefa (`CardTarefa`)** | Card Clicável | Exibe o título, descrição resumida, indicador de prioridade (`🔴 Alta`, `🟡 Média`), progresso do checklist (`☑ 2/5`), data de vencimento (destacada em vermelho se atrasada), estimativa em horas e avatares dos responsáveis. | Clicar abre o `ModalTarefa` em modo de edição. |

---

## 5. Modal de Tarefa (`ModalTarefa`)
1. **Título (`*Required`):** Nome da atividade a ser realizada.
2. **Descrição:** Instruções detalhadas da tarefa.
3. **Status:** Select (`Pendente`, `Em andamento`, `Em revisão`, `Concluída`).
4. **Prioridade:** Select (`Baixa`, `Média`, `Alta`, `Crítica`).
5. **Data de Vencimento:** Input `type="date"`.
6. **Estimativa (Horas):** Input numérico em horas (ex: `2.5h`).
7. **Seleção de Responsáveis:** Lista de pílulas com os nomes dos usuários do tenant. Clicar em uma pílula marca/desmarca o usuário como atribuído.
8. **Botão Excluir:** Disponível apenas na edição com confirmação de exclusão.
