# Especificação Funcional: Suporte Hub (Tickets, Base de Conhecimento e Status)

## 1. Identificação do Módulo
- **Nome:** Central de Suporte ao Cliente
- **Componentes Principais:** `SuporteHub.jsx` (`frontend/src/pages/Suporte/SuporteHub.jsx`), `NovoTicket.jsx`, `MeusTickets.jsx`, `BaseConhecimento.jsx`, `StatusSistema.jsx`
- **Abas de Navegação:**
  - `🎫 Novo Ticket` (`/suporte/novo`)
  - `📨 Meus Tickets` (`/suporte/meus`)
  - `📚 Base de Conhecimento` (`/suporte/base`)
  - `📡 Status do Sistema` (`/suporte/status`)
- **Permissão de Acesso:** Usuários autenticados de qualquer cargo.

---

## 2. Objetivo Funcional
Apresentar uma central de atendimento ao cliente completa contendo formulário de abertura de chamados, histórico e chat de acompanhamento de tickets, artigos explicativos de ajuda/FAQ com busca e monitoramento em tempo real do estado operacional dos serviços do sistema.

---

## 3. Fontes de Dados e Estados
- **Tabela `suporte_tickets`:** `id`, `assunto`, `categoria`, `prioridade`, `status` (`aberto`, `em_atendimento`, `resolvido`, `fechado`), `descricao`, `tenant_id`, `solicitante_id`.
- **Tabela `suporte_mensagens`:** Histórico de respostas entre a equipe de atendimento e o cliente.
- **Tabela `kb_artigos`:** Artigos da base de conhecimento (título, conteúdo markdown, categoria, curtidas/avaliações).
- **Tabela / API de Monitoramento (`StatusSistema`):** Saúde dos serviços (API Backend, Banco Supabase, Webhooks WhatsApp, Storage).

---

## 4. Sub-Módulos e Funcionalidades

### A. Sub-Módulo 1: Novo Ticket (`/suporte/novo`)
- **Objetivo:** Abrir chamados de suporte técnico, dúvidas ou relatos de bugs.
- **Elementos e Funções:**
  - **Campo Assunto (`*Required`):** Título legível da solicitação.
  - **Select de Categoria:** Opções (`Dúvida`, `Problema Técnico`, `Financeiro / Faturamento`, `Sugestão de Melhoria`, `Outro`).
  - **Select de Prioridade:** Níveis (`Baixa`, `Média`, `Alta`, `Urgente`).
  - **Área de Texto da Descrição:** Campo longo para detalhar a falha ou dúvida.
  - **Botão Enviar (`Abrir ticket`):** Executa `criarTicket()`, envia notificação de sucesso Toast e redireciona para `/suporte/meus`.

---

### B. Sub-Módulo 2: Meus Tickets (`/suporte/meus`)
- **Objetivo:** Listar e acompanhar o andamento dos chamados abertos pelo cliente.
- **Elementos e Funções:**
  - **Filtro de Status:** Abas para filtrar por `Todos`, `Abertos / Em Atendimento`, `Resolvidos` e `Fechados`.
  - **Lista / Tabela de Tickets:** Exibe o ID formatado, assunto, categoria, prioridade (badge colorida), data de atualização e status atual.
  - **Modal / Gaveta de Detalhe do Ticket:**
    - Exibe o histórico cronológico de mensagens trocadas entre o usuário e a equipe de suporte.
    - **Campo de Resposta:** Permite que o usuário digite uma nova réplica e anexe comentários ao chamado.
    - **Botão Encerrar Ticket:** Altera o status para `fechado` e permite avaliação do atendimento.

---

### C. Sub-Módulo 3: Base de Conhecimento (`/suporte/base`)
- **Objetivo:** Autoatendimento via documentação, FAQs e guias de uso do sistema.
- **Elementos e Funções:**
  - **Barra de Pesquisa Global:** Filtra artigos em tempo real por palavras-chave no título ou conteúdo.
  - **Filtro por Categorias:** Categorias organizadas (ex: *Primeiros Passos*, *CRM*, *Configurações*, *Faturamento*).
  - **Visualizador de Artigo:** Modal ou página de leitura formatada em Markdown.
  - **Avaliação de Utilidade (`👍 Útil` / `👎 Não ajudou`):** Botões no rodapé do artigo para registrar feedback sobre a documentação.

---

### D. Sub-Módulo 4: Status do Sistema (`/suporte/status`)
- **Objetivo:** Exibir a disponibilidade operacional da infraestrutura da plataforma em tempo real.
- **Elementos e Funções:**
  - **Indicador de Saúde Geral:** Banner no topo indicando "Todos os sistemas operacionais" (`verde`) ou "Instabilidade detectada" (`amarelo/vermelho`).
  - **Cards de Serviços Individuais:**
    - `API Backend` (Latência em ms)
    - `Banco de Dados Supabase` (Status de conexão)
    - `Serviço de WhatsApp / Outbound` (Status da API de envio)
    - `Armazenamento de Arquivos` (Storage)
  - **Histórico de Incidentes:** Linha do tempo dos últimos incidentes registrados e boletins de manutenção programada.
