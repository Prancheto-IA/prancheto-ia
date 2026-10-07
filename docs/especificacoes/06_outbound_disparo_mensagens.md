# Especificação Funcional: Outbound e Prospecção (Disparo de Mensagens)

## 1. Identificação do Módulo
- **Nome:** Módulo de Outbound e Gestão de Ações Proativas de Vendas
- **Componente Principal:** `Outbound` (`frontend/src/pages/DashboardCliente/Outbound/Outbound.jsx`)
- **Subcomponentes:** `ModalAcao`
- **Hook Especializado:** `useRotulosOutbound.js`
- **Rota:** `/dashboard/outbound`
- **Permissão de Acesso:** Usuários autenticados de qualquer perfil.

---

## 2. Objetivo Funcional
Cadastrar, acompanhar e gerenciar ações de prospecção ativa de clientes (E-mail, WhatsApp, Ligação, LinkedIn, Visitas), integrando os status das abordagens ao funil do CRM de forma automática.

---

## 3. Fontes de Dados e Estados
- **Tabela `outbound_acoes` (Supabase):** `id`, `contato_id`, `contato_nome`, `contato_email`, `contato_telefone`, `tipo` (`email`, `ligacao`, `whatsapp`, `linkedin`, `visita`, `outro`), `assunto`, `conteudo`, `status` (`pendente`, `enviado`, `respondido`, `sem_retorno`, `convertido`), `proxima_acao_em`, `notas`, `tenant_id`, `responsavel_id`.
- **Tabela `crm_contatos` (Supabase):** Utilizada para vincular o contato existente no CRM às ações de prospecção.
- **Hook `useRotulosOutbound`:** Fornece os rótulos dinâmicos configurados para os status de outbound (ex: personalizar o texto de `Pendente` para `Em Preparação`).

---

## 4. Elementos da Interface e Funções da Tela Principal

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Nova Ação (`+ Nova ação`)** | Botão Principal | Abre o `ModalAcao` em modo de inclusão. | Fixo no topo do módulo. |
| **Filtro por Tipo de Ação** | Select / Tabs | Filtra a lista exibindo apenas a modalidade selecionada (ex: apenas `WhatsApp`, apenas `E-mail` ou `Todos`). | Atualiza o estado `filtroTipo`. |
| **Campo de Pesquisa Rápida** | Input (`type="text"`) | Busca prospecções por nome do contato, e-mail, assunto ou conteúdo da mensagem. | Atualiza o estado `busca`. |
| **Colunas de Kanban por Status** | Quadro Kanban (5 colunas) | Agrupa as ações nas etapas: `Pendente`, `Enviado`, `Respondido`, `Sem Retorno`, `Convertido`. | Rótulos customizados pelo `useRotulosOutbound`. |
| **Card de Ação Outbound** | Card Informativo | Exibe o ícone do meio (`✉️`, `💬`, `📞`, `💼`), o nome do contato, e-mail, assunto, data agendada e badge do status. | Permite troca direta de status. |
| **Seletor de Alteração de Status Inline** | Dropdown (`select`) | Altera instantaneamente o status da ação no banco chamando `handleMudarStatus(id, novoStatus)`. | **Sincronização Automática:** Se a ação estiver vinculada a um contato do CRM, a transição para `convertido` move o lead automaticamente no funil. |
| **Botão Editar Ação (`✏️`)** | Botão Ícone Inline | Carrega os dados da ação no `ModalAcao`. | Localizado no card da ação. |
| **Botão Excluir Ação (`🗑️`)** | Botão Ícone Inline | Pede confirmação e remove o registro da tabela `outbound_acoes`. | Operação irreversível. |

---

## 5. Modal de Criação / Edição de Ação (`ModalAcao`)

### Campos e Elementos do Formulário:
1. **Busca e Vinculação ao CRM:**
   - **Input de Pesquisa:** Filtra a lista de contatos do CRM por nome ou empresa.
   - **Select de Seleção do CRM:** Ao selecionar um contato, preenche automaticamente os campos `contato_nome`, `contato_email` e `contato_telefone`.
2. **Nome do Contato (`*Required`):** Nome do destinatário da abordagem.
3. **Tipo de Abordagem:** Select (`E-mail`, `Ligação`, `WhatsApp`, `LinkedIn`, `Visita`, `Outro`).
4. **E-mail & Telefone:** Campos de contato para o disparo.
5. **Assunto:** Título da abordagem ou assunto do e-mail/reunião.
6. **Data da Próxima Ação:** Input `datetime-local` para agendamento de follow-up.
7. **Conteúdo / Mensagem:** Script ou mensagem enviada na prospecção.
8. **Notas Internas:** Observações privadas da equipe comercial sobre a negociação.
9. **Botões de Cancelar e Salvar:** Executam `INSERT` ou `UPDATE` com recarregamento em tempo real.
