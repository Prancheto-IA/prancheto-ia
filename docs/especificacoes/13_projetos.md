# Especificação Funcional: Projetos e Marcos (Milestones)

## 1. Identificação do Módulo
- **Nome:** Gestão de Projetos e Detalhamento de Entregáveis
- **Componentes Principais:** `Projetos` (`frontend/src/pages/Projetos/Projetos.jsx`), `ProjetoDetalhe.jsx`
- **Subcomponentes:** `ModalProjeto`, `CardProjeto`
- **Hook de Suporte:** `useProjetos.js`
- **Rotas:** `/projetos` e `/projetos/:id`
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Acompanhar o ciclo de vida dos projetos da empresa, barra de progresso percentual calculada via metas/entregáveis (*milestones*), gerenciamento de prazos de início/fim, cores customizadas, status e equipe alocada.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase):**
  - `projetos`: `id`, `nome`, `descricao`, `status` (`planejamento`, `em_andamento`, `pausado`, `concluido`, `cancelado`), `prioridade` (`baixa`, `media`, `alta`, `critica`), `cor`, `icone`, `progresso`, `data_inicio`, `data_fim`, `tenant_id`.
  - `projeto_milestones`: entregáveis vinculados a um projeto com marcação de concluído.
  - `projeto_membros`: membros da equipe alocados no projeto.
- **Hook `useProjetos`:** `projetos`, `carregando`, `criarProjeto()`, `atualizarProjeto()`, `excluirProjeto()`.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Novo Projeto (`+ Novo projeto`)** | Botão Principal | Abre o `ModalProjeto` em modo de criação. | Fixo no topo direito. |
| **Filtro de Status do Projeto** | Abas / Pílulas | Filtra os projetos exibidos por status (`Todos`, `Planejamento`, `Em andamento`, `Pausado`, `Concluido`, `Cancelado`). | Atualiza o estado `filtroStatus`. |
| **Card do Projeto (`CardProjeto`)** | Card Clicável | Exibe o ícone, nome do projeto, badge de status, datas de vigência, progresso percentual e milestones concluídos. Clicar no card navega para `/projetos/:id`. | Cor de destaque na borda esquerda (`projeto.cor`). |
| **Barra de Progresso do Projeto** | Barra Visual | Exibe a porcentagem acumulada de conclusão baseada no cumprimento das metas. | Preenchimento dinâmico proporcional a `projeto.progresso`. |
| **Botão Editar Projeto (`✏️`)** | Botão Ícone Inline | Abre o `ModalProjeto` carregando os dados do projeto para alteração. | Interrompe a propagação do clique para não navegar para a página de detalhes (`e.stopPropagation()`). |
| **Página de Detalhes (`ProjetoDetalhe.jsx`)** | Visão Completa | Exibe o cabeçalho do projeto, lista de tarefas vinculadas, gráfico de marcos (*milestones*), membros do time e arquivos anexados. | Acessada via `/projetos/:id`. |

---

## 5. Modal de Projeto (`ModalProjeto`)
1. **Ícone & Nome:** Campo para selecionar emoji representativo e título do projeto.
2. **Descrição:** Texto descritivo do objetivo do projeto.
3. **Status:** Select (`Planejamento`, `Em andamento`, `Pausado`, `Concluído`, `Cancelado`).
4. **Prioridade:** Select (`Baixa`, `Média`, `Alta`, `Crítica`).
5. **Datas de Início e Fim:** Inputs de data para prazos de entrega.
6. **Seletor de Cor:** Input `type="color"` para definir a cor visual do projeto no painel.
7. **Botão Excluir:** Disponível apenas na edição de projetos existentes com prompt de confirmação.
