# Especificação Funcional: Agenda de Compromissos

## 1. Identificação do Módulo
- **Nome:** Agenda de Compromissos e Reuniões (CRUD)
- **Componente Principal:** `Agenda` (`frontend/src/pages/DashboardCliente/Agenda/Agenda.jsx`)
- **Subcomponentes:** `ModalEvento`
- **Rota:** `/dashboard/agenda`
- **Permissão de Acesso:** Usuários autenticados de qualquer cargo.

---

## 2. Objetivo Funcional
Permitir a gestão completa (criação, edição, visualização e exclusão) de compromissos, lembretes, ligações e reuniões do usuário e da equipe, com navegação por mês e detalhamento diário de eventos.

---

## 3. Fontes de Dados e Estados
- **Tabela `agenda_eventos` (Supabase):** `id`, `titulo`, `descricao`, `data_inicio`, `data_fim`, `tipo`, `local`, `cor`, `criado_por`, `tenant_id`.
- **Estados Locais:** `mesAtual`, `anoAtual`, `diaSelecionado`, `eventos` (lista total), `carregando`, `modalAberto`, `eventoEditando`, `excluindo`.

---

## 4. Elementos da Interface e Funções da Tela Principal

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Novo Evento** | Botão (`+ Novo evento`) | Abre o `ModalEvento` no estado de criação para o dia selecionado. | Fixo no cabeçalho da página. |
| **Navegador de Mês Anterior (`‹`)** | Botão Ícone | Decrementa o mês exibido (`setMesAtual`). Se for Janeiro, muda para Dezembro do ano anterior. | Recalcula a grade de dias do calendário. |
| **Navegador de Próximo Mês (`›`)** | Botão Ícone | Incrementa o mês exibido (`setMesAtual`). Se for Dezembro, muda para Janeiro do próximo ano. | Recalcula a grade de dias do calendário. |
| **Nome do Mês e Ano** | Título (`mês/ano`) | Exibe o mês por extenso e o ano selecionado (ex: "Outubro de 2026"). | Formatado dinamicamente via `toLocaleDateString`. |
| **Célula de Dia do Calendário** | Botão de Grade | Seleciona o dia ao clicar (`setDiaSelecionado(dia)`). | Exibe destaque especial se for o dia atual (`hoje`), se estiver selecionado, ou ponto azul/branco se possuir eventos. |
| **Ponto Indicador de Evento** | Ponto Inline | Indica visualmente que aquele dia possui 1 ou mais compromissos salvos no banco. | Calculado por `temEventoNoDia(dia)`. |
| **Cabeçalho da Lista Diária** | Título (`DD/MM/AAAA`) | Exibe a data completa do dia atualmente selecionado na grade. | Atualiza dinamicamente conforme o clique no calendário. |
| **Card de Evento do Dia** | Card Informativo | Exibe badge com o tipo do evento (`Reunião`, `Tarefa`, `Lembrete`, `Ligação`, `Outro`), horário de início, título e local. | Filtra os eventos salvos para bater com a data selecionada. |
| **Botão Editar Evento (`✏️`)** | Botão Ícone Inline | Abre o `ModalEvento` carregando os dados do evento em `eventoEditando`. | Visível em cada card de evento. |
| **Botão Excluir Evento (`🗑️`)** | Botão Ícone Inline | Exibe confirmação `confirm()` e executa a exclusão na tabela `agenda_eventos`. | Remove o item imediatamente do estado local. |
| **Estado de Dia Livre** | Card Vazio (`📭`) | Exibe aviso quando o dia selecionado não possui nenhum evento cadastrado e botão rápido `+ Adicionar evento`. | Renderizado se `eventosDoDia.length === 0`. |

---

## 5. Modal de Criação / Edição de Evento (`ModalEvento`)

### Campos e Elementos do Formulário:
1. **Título (`*Required`):** Input de texto obrigatório para o nome do compromisso (ex: *Reunião com Cliente*).
2. **Tipo de Evento:** Select com opções (`Reunião`, `Tarefa`, `Lembrete`, `Ligação`, `Outro`).
3. **Horário de Início:** Input `type="time"` (padrão: `09:00`).
4. **Horário de Fim:** Input `type="time"` (padrão: `10:00`).
5. **Local:** Input de texto opcional para endereço físico ou link de videochamada (Google Meet / Zoom).
6. **Descrição:** Área de texto (`textarea`) de 2 linhas para notas ou pauta da reunião.
7. **Botão Cancelar:** Fecha o modal sem aplicar alterações.
8. **Botão Salvar:** Envia o formulário disparando o `onSalvar(dados)`.
   - Em criação: Executa `INSERT` gravando `criado_por` e `tenant_id`.
   - Em edição: Executa `UPDATE` filtrando por `id`.
