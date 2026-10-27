# 📋 Relatório de Falhas no CI (ESLint) - PR #18 (`design` ➔ `main`)

Este documento analisa detalhadamente os **55 erros** apontados pelo ESLint durante o workflow de Integração Contínua (CI) na Pull Request [#18](https://github.com/Prancheto-IA/prancheto-ia/pull/18).

---

## 🚦 Visão Geral e Níveis de Gravidade

| Gravidade | Quantidade | Descrição |
| :--- | :---: | :--- |
| 🔴 **Crítico (`no-undef`)** | **6 ocorrências** | Variáveis utilizadas no fluxo de execução sem terem sido declaradas. Causa quebra de execução em tempo de execução (*ReferenceError*) ao interagir com a UI. |
| 🟡 **Advertência Estrita (`no-unused-vars`)** | **49 ocorrências** | Variáveis, estados, argumentos ou componentes importados que não são consumidos no arquivo. Embora não quebrem o app em tempo de execução, bloqueiam o build do CI devido às regras estritas do projeto. |

---

## 🔍 Detalhamento por Componente e Impacto no Sistema

### 1. 🔴 [`frontend/src/pages/CRM/Leads.jsx`](../frontend/src/pages/CRM/Leads.jsx)
* **O que afeta no sistema**: **Funil de Vendas e Gestão de Leads (CRM)** — É o componente central de listagem, visualização em Kanban/Tabela, filtros e ações rápidas sobre os leads.
* **Erros Críticos (`no-undef`)**:
  * Linhas `1119`, `1147`, `1156`, `1166`, `1167`, `1176`: Uso das variáveis `painelLead` e `setPainelLead`.
  * **Causa & Impacto**: No fluxo anterior existia um painel lateral retrátil controlado por `painelLead`. Ao migrar para a nova arquitetura do redesign (que abre via rota ou modal dedicado), esse `useState` foi removido, mas as funções de ação rápida (`handleEditar`, `handleExcluir`, `handleMudarStatus`, `handleConverter`) ainda tentam chamar `setPainelLead(null)` ou verificar `painelLead`. **Se o usuário clicar nessas ações, a aplicação lança um `ReferenceError` na tela.**
* **Erros de Limpeza (`no-unused-vars`)**:
  * 16 imports órfãos no topo do arquivo (ex: `useInteracoes`, `TIPOS_INTERACAO`, `ORIGENS`, `PermissaoGuarda`, `CamposNegocio`, etc.) deixados de implementações anteriores.
  * Variáveis `carregando` e `erro` desestruturadas de hooks mas não renderizadas.
  * Funções `handleEditar`, `handleExcluir`, `handleMudarStatus`, `handleConverter` declaradas mas não vinculadas aos botões do novo JSX.

---

### 2. 🟡 [`frontend/src/pages/CRM/LeadDetalhe.jsx`](../frontend/src/pages/CRM/LeadDetalhe.jsx)
* **O que afeta no sistema**: **Página de Detalhes do Lead** — Tela completa onde são exibidos dados de contato, campos personalizados, timeline de interações e propostas comerciais.
* **Erros apontados**:
  * Imports não utilizados: `useMemo`, `Link`, `tempoRelativo`, `formatarK`.
  * Variável de estado não utilizada: `setNovoLocal` (linha 58).
  * Variável local calculada mas não consumida: `nomeNegocio` (linha 322).
* **Impacto no usuário**: Nenhum impacto visual ou funcional direto; trata-se de código morto deixado durante o desenvolvimento da tela.

---

### 3. 🟡 [`frontend/src/pages/Tarefas/Tarefas.jsx`](../frontend/src/pages/Tarefas/Tarefas.jsx)
* **O que afeta no sistema**: **Módulo de Tarefas da Equipe** — Gestão operacional de afazeres diários, visualizações de prazos e responsáveis.
* **Erros apontados**:
  * Constantes não usadas: `STATUS_TAREFAS`, `PRIORIDADES` (linha 30).
  * Variáveis de estado/hook não usadas: `carregando` (linha 414), `usuariosTenant` (linha 418).
* **Impacto no usuário**: Nenhum em runtime. As tarefas funcionam normalmente, mas o código retém dados carregados que não estão sendo lidos pelo componente visual.

---

### 4. 🟡 [`frontend/src/pages/TimesPessoas/TimesPessoas.jsx`](../frontend/src/pages/TimesPessoas/TimesPessoas.jsx)
* **O que afeta no sistema**: **Módulo de Pessoas, Colaboradores e Times** — Listagem de membros da organização, convites e distribuição em departamentos.
* **Erros apontados**:
  * Linha 587: Variável `usuario` desestruturada em escopo interno e nunca lida.
* **Impacto no usuário**: Inofensivo em runtime; apenas variável sobressalente.

---

### 5. 🟡 [`frontend/src/pages/DashboardCliente/DashboardCliente.jsx`](../frontend/src/pages/DashboardCliente/DashboardCliente.jsx)
* **O que afeta no sistema**: **Página Principal (Home) do Cliente** — Painel onde ficam os cards com resumos e os widgets customizáveis.
* **Erros apontados**:
  * Linha 28: `COMPONENTES_WIDGET` declarado mas não referenciado (a renderização foi abstraída ou refeita).
* **Impacto no usuário**: Nenhum em runtime.

---

### 6. 🟡 [`frontend/src/pages/DashboardCliente/LayoutCliente.jsx`](../frontend/src/pages/DashboardCliente/LayoutCliente.jsx)
* **O que afeta no sistema**: **Layout Base Global** — Estrutura de navegação (Sidebar lateral, topo com notificações e menu de perfil).
* **Erros apontados**:
  * Linha 26: `NOME_PRODUTO` importado ou declarado e não utilizado (o novo design system utiliza a logo diretamente).
* **Impacto no usuário**: Nenhum em runtime.

---

### 7. 🟡 [`frontend/src/pages/DashboardCliente/Relatorios/Relatorios.jsx`](../frontend/src/pages/DashboardCliente/Relatorios/Relatorios.jsx)
* **O que afeta no sistema**: **Relatórios e Métricas de Desempenho** — Gráficos de vendas, pipelines e taxas de conversão.
* **Erros apontados**:
  * Linha 181: Parâmetros `valorFechadoFmt` e `valorPipelineFmt` passados em callback/função mas não utilizados no corpo da mesma.
* **Impacto no usuário**: Nenhum em runtime. Pode ser prefixado com `_` para indicar argumento propositalmente ignorado.

---

### 8. 🟡 [`frontend/src/pages/DashboardCliente/Configuracoes/SecaoPlano.jsx`](../frontend/src/pages/DashboardCliente/Configuracoes/SecaoPlano.jsx)
* **O que afeta no sistema**: **Assinatura e Planos** — Visualização do plano contratado, consumo de limites e upgrade.
* **Erros apontados**:
  * `FlashIcon` importado e não usado (linha 16).
  * `IconComp` atribuído mas não renderizado (linha 235).
* **Impacto no usuário**: Nenhum em runtime.

---

### 9. 🟡 [`frontend/src/pages/DashboardCliente/Organizacao/Cargos.jsx`](../frontend/src/pages/DashboardCliente/Organizacao/Cargos.jsx) & [`IdentidadeVisual.jsx`](../frontend/src/pages/DashboardCliente/Organizacao/IdentidadeVisual.jsx)
* **O que afeta no sistema**: **Configurações Organizacionais** — Gestão de permissões por cargo e personalização de cores/marca (White-label).
* **Erros apontados**:
  * Em `Cargos.jsx`: `SLUGS_CONHECIDOS` importado e não usado.
  * Em `IdentidadeVisual.jsx`: `tomClaro` calculado na manipulação de paleta de cores e não consumido.
* **Impacto no usuário**: Nenhum em runtime.

---

### 10. 🟡 [`frontend/src/pages/Chat/ChatModulo.jsx`](../frontend/src/pages/Chat/ChatModulo.jsx) & [`ChatMensagens.jsx`](../frontend/src/pages/DashboardCliente/Chat/ChatMensagens.jsx)
* **O que afeta no sistema**: **Comunicação Interna da Equipe (Chat)** — Listagem de canais e histórico de conversas em tempo real.
* **Erros apontados**:
  * Em `ChatModulo.jsx`: `ocupado` (estado de carregamento) e `setAbaAtiva` não utilizados.
  * Em `ChatMensagens.jsx`: `primeiroNome` calculado e não utilizado na renderização do balão de mensagem.
* **Impacto no usuário**: Nenhum em runtime.

---

### 11. 🟡 [`frontend/src/pages/AdminPanel/AdminPanel.jsx`](../frontend/src/pages/AdminPanel/AdminPanel.jsx) & [`widgets/WidgetMuralAnuncios.jsx`](../frontend/src/pages/DashboardCliente/widgets/WidgetMuralAnuncios.jsx)
* **O que afeta no sistema**: **Painel Super Admin** e **Widget de Anúncios da Home**.
* **Erros apontados**:
  * `Comment01Icon` em `AdminPanel.jsx` importado e não usado.
  * `TIPOS_POSTAGEM` e hook `navigate` em `WidgetMuralAnuncios.jsx` não utilizados.
* **Impacto no usuário**: Nenhum em runtime.

---

## 🎯 Síntese de Ação Recomendada

1. **Resolver `CRM/Leads.jsx` imediatamente**:
   * O código que referencia `painelLead` e `setPainelLead` precisa ser ajustado para abrir a tela/modal correta do novo design ou ter as funções atualizadas para não quebrar a página de Leads.
2. **Remoção de código morto (`clean up`)**:
   * Remover os imports e declarações não utilizados nos demais 13 arquivos (ou prefixar variáveis necessárias com `_`, que é aceito pelo ESLint do projeto).
3. **Re-executar validação**:
   * Rodar localmente `npm run lint` na pasta `frontend` até que o resultado seja `0 problems`.
   * Dar push no branch `design` para o GitHub Actions reexecutar automaticamente e validar a PR #18.
