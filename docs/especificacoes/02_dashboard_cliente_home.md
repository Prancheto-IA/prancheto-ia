# Especificação Funcional: Dashboard do Cliente (Início / Home)

## 1. Identificação do Módulo
- **Nome:** Dashboard Principal do Cliente (Página Inicial)
- **Componente Principal:** `DashboardCliente` (`frontend/src/pages/DashboardCliente/DashboardCliente.jsx`)
- **Subcomponentes & Widgets:** `PainelPersonalizarHome.jsx`, `WidgetMiniAgenda.jsx`, `WidgetMuralAnuncios.jsx`, `WidgetAcessosRapidos.jsx`, `WidgetMinhasTarefas.jsx`, `WidgetLeadsQuentes.jsx`, `WidgetShell.jsx`
- **Rota:** `/dashboard`
- **Permissão de Acesso:** Usuários autenticados de qualquer perfil (Admin, Manager, Member, Viewer).

---

## 2. Objetivo Funcional
Apresentar uma visão geral centralizada e totalmente customizável pelo usuário através de um sistema modular de widgets "Lego". O usuário pode personalizar a exibição, o tamanho e a ordem dos widgets de acordo com suas necessidades de trabalho.

---

## 3. Fontes de Dados e Estados
- **`useAuthStore`:** Dados do usuário (nome, cargo).
- **`useHomeWidgets`:** Gerenciamento dos widgets (lista de visíveis, ordem, tamanho `normal`/`grande`, persistência no banco Supabase/API via `@dnd-kit`).
- **Tabelas do Banco Integradas:**
  - `agenda_eventos`: Para `WidgetMiniAgenda`
  - `feed_postagens`, `feed_reacoes`, `feed_comentarios`: Para `WidgetMuralAnuncios`
  - `tarefas`: Para `WidgetMinhasTarefas`
  - `leads`: Para `WidgetLeadsQuentes`

---

## 4. Elementos da Interface e Funções da Tela Principal

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Cabeçalho de Saudação** | Bloco Informativo | Exibe "Boa tarde/Bom dia, [Nome]! 👋" com base na hora atual (`saudacao()`). | O primeiro nome é extraído de `usuario.nome`. |
| **Badge de Cargo** | Etiqueta (`Badge`) | Indica a função do usuário (`Administrador`, `Gerente`, `Membro`, `Visualizador`). | Cores customizadas por perfil (`BADGE_CARGO`). |
| **Botão Personalizar** | Botão (`✏️ Personalizar`) | Abre o modal `PainelPersonalizarHome` para adicionar, remover, redimensionar ou reordenar widgets. | Sempre visível no topo direito do dashboard. |
| **Estado Vazio (Sem Widgets)** | Card de Aviso | Notifica que nenhum widget está visível e oferece o botão para abrir o painel de personalização. | Exibido quando `widgetsVisiveis.length === 0`. |
| **Grade de Widgets** | Grid Flexível (1 ou 2 colunas) | Renderiza os widgets ativos. Widgets com tamanho `grande` ocupam a largura total de 2 colunas no desktop (`sm:col-span-2`). | Ordem e tamanhos guiados por `useHomeWidgets`. |

---

## 5. Especificação dos Widgets

### A. Mini Agenda (`WidgetMiniAgenda`)
- **Objetivo:** Exibir os eventos e compromissos agendados para o dia de hoje.
- **Elementos e Ações:**
  - **Lista de Eventos:** Exibe título, horário de início/fim e tipo do evento.
  - **Ação do Widget ("Ver agenda completa"):** Navega para `/dashboard/agenda`.
  - **Indicador do Dia:** Mostra a data atual formatada.

### B. Mural de Anúncios (`WidgetMuralAnuncios`)
- **Objetivo:** Exibir informativos da empresa e postagens da equipe.
- **Elementos e Ações:**
  - **Lista de Postagens:** Mostra o autor, ícone do tipo de post, indicação se está fixado (`📌`), tempo relativo da publicação e o texto do post (recortado em 3 linhas).
  - **Botão Curtir (`👍`):** Incrementa a reação na postagem gravando na tabela `feed_reacoes`.
  - **Botão Comentários (`💬`):** Redireciona para o feed completo para interação.
  - **Paginação (`‹ Mais recentes` / `Mais antigas ›`):** Navega entre páginas fixas de 4 postagens sem desalinhar o layout do widget.
  - **Ação do Widget ("Ver mural completo"):** Navega para `/modulos/feed`.

### C. Acessos Rápidos (`WidgetAcessosRapidos`)
- **Objetivo:** Botões de atalho direto para as principais ferramentas.
- **Atalhos:**
  - `🎯 Novo Lead` → Abre modal/navega para `/crm/leads`
  - `📋 Nova Tarefa` → Navega para `/tarefas`
  - `💬 Chat IA` → Navega para `/dashboard/chat`
  - `🎧 Abrir Ticket` → Navega para `/suporte/novo`

### D. Minhas Tarefas (`WidgetMinhasTarefas`)
- **Objetivo:** Listar as tarefas pendentes atribuídas ao usuário logado.
- **Elementos e Ações:**
  - **Checkbox de Conclusão:** Alterna o status da tarefa para concluída (`concluida = true`).
  - **Tag de Prioridade:** Destaca prioridades (Alta, Média, Baixa).
  - **Data de Vencimento:** Exibe alerta se a tarefa estiver atrasada.
  - **Ação do Widget ("Ver todas"):** Navega para `/tarefas`.

### E. Leads Quentes (`WidgetLeadsQuentes`)
- **Objetivo:** Exibir oportunidades no CRM com maior potencial ou valor financeiro.
- **Elementos e Ações:**
  - **Card do Lead:** Exibe nome do lead, empresa, valor estimado e estágio atual no funil.
  - **Ação do Widget ("Ir para o CRM"):** Navega para `/crm/leads`.

---

## 6. Modal de Personalização do Dashboard (`PainelPersonalizarHome`)

### Elementos e Funções:
1. **Handle Drag & Drop (`⠿`):** Reordena visualmente a posição dos widgets.
2. **Botão Ocultar/Exibir Widget (`👁️` / `🙈`):** Alterna se o widget deve ser renderizado no dashboard.
3. **Seletor de Tamanho (`Normal` / `Grande`):** Alterna a largura ocupada pelo widget no grid (1 coluna vs 2 colunas).
4. **Botão Restaurar Padrão (`↺`):** Redefine a configuração para a distribuição original.
5. **Botão Concluído:** Salva as preferências no banco e fecha o modal.
