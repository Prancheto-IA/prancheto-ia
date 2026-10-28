# Especificação Funcional: Chat com IA (Assistente de CRM)

## 1. Identificação do Módulo
- **Nome:** Assistente de Inteligência Artificial com Ação no CRM
- **Componentes Principais:** `Chat.jsx` (`frontend/src/pages/DashboardCliente/Chat/Chat.jsx`), `ChatMensagens.jsx`
- **Hook de Suporte:** `useAssistente.js`
- **Rota:** `/dashboard/chat`
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Permitir que o usuário interaja via linguagem natural com um assistente inteligente capaz de consultar, criar e alterar informações no CRM (leads, contatos, notas, agendamentos). Para alterações de dados existentes, a IA gera cartões de confirmação para autorização explícita do usuário antes de executar a mutação no banco.

---

## 3. Fontes de Dados e Estados
- **`useAssistente`:**
  - `conversas` (lista de chats passados), `conversaAtual` (chat selecionado), `mensagens` (histórico de mensagens).
  - `acoesPendentes` (cartões de ações que requerem aprovação do usuário).
  - `carregando`, `enviando`, `resolvendoAcao`, `erro`.
  - Métodos: `carregarConversas()`, `abrirConversa()`, `novaConversa()`, `enviar(texto)`, `responderAcao(id, aprovado)`.
- **Estados Locais:** `texto` (mensagem digitada pelo usuário), `fimRef` (referência para autoscroll).

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Painel Lateral de Conversas** | Sidebar Interna | Exibe a lista de histórico de conversas gravadas do usuário. | Oculta em telas pequenas (`md:hidden`). |
| **Botão Nova Conversa** | Botão (`+ Nova conversa`) | Chama `novaConversa()`, limpando o chat atual e criando um novo canal de conversação limpo. | Fixo no topo do painel lateral. |
| **Item de Conversa Salva** | Botão / Card | Carrega o histórico da conversa ao clicar (`abrirConversa(c)`). Exibe o título da conversa e a data de criação. | Destaca visualmente a conversa atualmente ativa. |
| **Título da Conversa Ativa** | Cabeçalho do Chat | Exibe o título da conversa selecionada ou "Assistente" como padrão. | Fixo no topo do container de mensagens. |
| **Faixa de Indisponibilidade** | Alerta de Erro | Exibe aviso quando a API de IA está indisponível ou sem quota (`CODIGOS_INDISPONIVEL`). | Exibido apenas se houver erro crítico de integração. |
| **Sugestões de Perguntas Rápidas** | Botões Pílula (`SUGESTOES`) | Preenche e envia automaticamente comandos de exemplo (ex: "Quais são meus leads novos?", "Agende uma reunião"). | Exibido apenas em chats vazios (`mensagens.length === 0`). |
| **Bolha de Mensagem do Usuário** | Balão à direita | Exibe o texto enviado pelo usuário. | Alinhado à direita. |
| **Bolha de Mensagem da IA** | Balão à esquerda | Exibe a resposta em formato Markdown processada pelo assistente IA. | Alinhado à esquerda com avatar `🤖`. |
| **Linha de Atividade de Ferramenta** | Linha Discreta | Exibe em texto sutil as ações em segundo plano tomadas pela IA (ex: *Buscando leads no banco...*). | `remetente === 'tool'`. Indica se a ação falhou ou teve sucesso. |
| **Cartão de Ação Pendente (`CartaoAcao`)** | Card de Confirmação | Exibe a alteração proposta pela IA (ex: "Atualizar valor do Lead X para R$ 15.000"), com botões de decisão. | **Requer ação humana explícita**. |
| **Botão Aprovar Ação no Cartão** | Botão (`Confirmar / Executar`) | Executa a alteração no CRM chamando `responderAcao(acao.id, true)`. | Fica em estado de carregamento enquanto salva no banco. |
| **Botão Recusar Ação no Cartão** | Botão (`Descartar / Cancelar`) | Descarta a ação sem alterar dados no banco chamando `responderAcao(acao.id, false)`. | Cancela a proposta da IA. |
| **Indicador de Digitação da IA** | Animação de Pontos | Três pontos piscantes indicando que o modelo de linguagem está gerando a resposta. | Exibido enquanto `enviando === true`. |
| **Campo de Entrada de Mensagem** | Campo de Texto (`input`) | Digitação de dúvidas ou solicitações para a IA. Atualiza estado `texto`. | O placeholder altera informando para aprovar ações se houver pendências. |
| **Botão Enviar** | Botão Ícone (`➤`) | Submete o formulário enviando o texto para `enviar(texto)`. | Desabilitado se o texto estiver vazio ou `enviando === true`. |
