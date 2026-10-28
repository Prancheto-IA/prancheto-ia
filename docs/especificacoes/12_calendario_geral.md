# Especificação Funcional: Calendário Geral (Drag and Drop)

## 1. Identificação do Módulo
- **Nome:** Calendário Geral de Eventos e Compromissos
- **Componente Principal:** `Calendario` (`frontend/src/pages/Calendario/Calendario.jsx`)
- **Subcomponentes:** `ModalEvento`, `EventoArrastavel`, `CelulaDia`, `PainelProximos`
- **Bibliotecas:** `@dnd-kit/core`
- **Rota:** `/calendario` (ou `/modulos/calendario` via redirecionamento)
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Visualizar e reagendar compromissos em uma grade mensal interativa com capacidade de arrastar e soltar (*Drag and Drop*) eventos entre dias da semana, além de listagem de próximos compromissos e detalhamento completo de horários com correção fuso-horária.

---

## 3. Fontes de Dados e Estados
- **Tabela `agenda_eventos` (Supabase):** `id`, `titulo`, `tipo`, `data_inicio`, `descricao`, `local`, `tenant_id`, `criado_por`.
- **Estados Locais:** `mesAtual`, `anoAtual`, `eventos` (mês ativo), `proximosEventos` (visão lateral), `diaSelecionado`, `eventoEditando`, `modalAberto`.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Novo Evento (`+ Novo evento`)** | Botão Principal | Abre o `ModalEvento` em modo de criação. | Fixo no topo direito. |
| **Navegador de Mês (`‹` / `›`)** | Botões de Seta | Altera o mês/ano ativo da visualização (`irMesAnterior`/`irProximoMes`). | Recarrega os eventos do mês correspondente do banco. |
| **Botão Hoje (`Hoje`)** | Botão Atalho | Reseta a visão para o mês e ano atuais (`new Date()`). | Destaque na célula do dia atual. |
| **Célula de Dia Droppable (`CelulaDia`)** | Área de Soltura (`useDroppable`) | Recebe eventos arrastados. Ao soltar, atualiza instantaneamente a `data_inicio` do evento para o novo dia no banco Supabase via `onDragEnd`. | Destaca com borda primária ao passar o evento por cima (`isOver`). Exibe os primeiros 3 eventos e o contador `+X mais`. |
| **Pílula de Evento Arrastável (`EventoArrastavel`)** | Elemento Arrastável (`useDraggable`) | Representa visualmente um compromisso (ícone + título + cor por tipo). Ao ser clicado, abre o `ModalEvento` para edição. | Transparência de 40% durante o arrasto (`isDragging`). |
| **Painel Lateral de Próximos Compromissos** | Sidebar Direita | Lista os compromissos agendados a partir da data atual em ordem cronológica. | Exibe título e data/hora formatada. Clicar em um item abre o modal de edição. |

---

## 5. Modal de Evento (`ModalEvento`)
1. **Título:** Campo obrigatório do compromisso.
2. **Tipo de Evento:** Select (`Reunião`, `Tarefa`, `Lembrete`, `Ligação`, `Outro`).
3. **Hora e Data de Início:** Selects de hora local e data com ajuste de fuso horário em tempo real via `toISOString()`.
4. **Local & Descrição:** Campos opcionais.
5. **Botão Excluir:** Removível apenas em modo de edição de evento existente.
