# Especificação Funcional: CRM Hub (Leads, Clientes e Campos Customizados)

## 1. Identificação do Módulo
- **Nome:** Módulo de Gestão de Relacionamento (CRM Hub)
- **Componentes Principais:** `CRMHub.jsx` (`frontend/src/pages/CRM/CRMHub.jsx`), `Leads.jsx`, `Clientes.jsx`, `CamposCustomizados.jsx`, `CRM.jsx`
- **Abas de Navegação:**
  - `🎯 Leads` (`/crm/leads`)
  - `🏆 Clientes` (`/crm/clientes`)
  - `🧩 Campos` (`/crm/campos`)
- **Permissão de Acesso:** Usuários com a permissão `crm.visualizar` (edições restritas a `crm.editar`).

---

## 2. Objetivo Funcional
Oferecer o controle total do ciclo de vida comercial da empresa, desde a triagem de leads recebidos, passando pela gestão de oportunidades no funil, conversão em clientes ativos com histórico de interações (Timeline), até o construtor de campos customizados "Lego".

---

## 3. Fontes de Dados e Estados
- **Tabela `crm_contatos`:** Armazena contatos marcados como `tipo_registro = 'lead'` ou `'cliente'`, campos do negócio, razão social, documento (CPF/CNPJ), score de qualificação e dados de endereço.
- **Tabela `crm_interacoes`:** Histórico de reuniões, anotações, chamadas e trocas de e-mail do contato.
- **Tabela `crm_campos_customizados`:** Estrutura de campos adicionais dinâmicos criados pelo usuário.
- **Hook Especializado `useCRM`:** Métodos `carregarLeads()`, `salvarLead()`, `converterParaCliente()`, `adicionarInteracao()`, `alterarStatusFunil()`.

---

## 4. Sub-Módulos e Funcionalidades

### A. Aba 1: Gestão de Leads (`/crm/leads`)
- **Objetivo:** Triagem, acompanhamento, scoring e qualificação de novas oportunidades.
- **Elementos e Funções:**
  - **Botão Novo Lead (`🎯 Novo Lead`):** Abre o `ModalLead` para cadastro manual com formulário dividido em seções (Dados Principais, Informações do Negócio, Dados da Empresa e Endereço).
  - **Filtros e Busca:** Busca textual por nome/empresa, filtro por estágio do funil (`Lead`, `Qualificado`, `Proposta`, `Negociação`, `Perdido`) e filtro por Origem (`Manual`, `Site`, `WhatsApp`, `Indicação`, `Outbound`).
  - **Badge de Lead Scoring (`⚡ Score`):** Exibe a pontuação de engajamento do lead calculada dinamicamente pelo algoritmo do sistema (Verde `≥50pts`, Amarelo `20-49pts`, Neutro `<20pts`).
  - **Botão Converter em Cliente (`🏆 Convertido`):** Converte a oportunidade em cliente ativo (`tipo_registro = 'cliente'`), mantendo todo o histórico e atribuindo tag de cliente.
  - **Painel Lateral de Detalhes e Timeline:** Abre uma gaveta lateral ao clicar em um lead, exibindo o histórico de interações, campo para adicionar novas notas e linha do tempo de alterações.

---

### B. Aba 2: Centro de Clientes (`/crm/clientes`)
- **Objetivo:** Gestão da carteira de clientes ativos e controle de histórico de relacionamento (LTV).
- **Elementos e Funções:**
  - **Tabela / Cards de Clientes:** Exibe o nome do cliente, empresa, e-mail, telefone/WhatsApp direto, valor total acumulado (LTV) e responsável pela conta.
  - **Botão Novo Cliente (`🏆 Novo Cliente`):** Abre formulário para adicionar diretamente uma conta à carteira de clientes ativos sem passar pelo funil de entrada.
  - **Seção de Contato Rápido por WhatsApp:** Ícone clicável que abre o WhatsApp Web diretamente com o número do cliente formatado.
  - **Gaveta de Timeline e Atividades:** Permite registrar chamadas, reuniões e feedback pós-venda diretamente no histórico do cliente.

---

### C. Aba 3: Construtor de Campos Customizados (`/crm/campos`)
- **Objetivo:** Permitir a criação flexível de novos campos de dados no sistema no modelo "Lego".
- **Elementos e Funções:**
  - **Seletor de Entidade:** Escolhe para onde o campo será aplicado (`Leads / Clientes`, `Projetos`, `Tarefas` ou `Tickets de Suporte`).
  - **Botão Novo Campo (`+ Criar Campo`):** Abre o modal de construção de campo com os tipos disponíveis:
    - `Texto Curto` / `Texto Longo`
    - `Número` / `Moeda BRL`
    - `Data` / `Data e Hora`
    - `Seleção Única` (Dropdown com opções editáveis)
    - `Sim/Não` (Checkbox / Boolean)
  - **Opção Obrigatoriedade:** Checkbox indicando se o campo é obrigatório no preenchimento do formulário.
  - **Drag & Drop de Reordenação:** Arraste de campos para definir a ordem em que aparecem na tela do formulário do CRM.
