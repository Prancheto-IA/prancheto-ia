# Especificação Funcional: Chat Interno de Equipe (Mensagens e Grupos)

## 1. Identificação do Módulo
- **Nome:** Módulo de Chat de Equipe (Comunicação Interna)
- **Componente Principal:** `ChatModulo` (`frontend/src/pages/Chat/ChatModulo.jsx`)
- **Subcomponentes:** `BolhaMensagem`, `ItemCanal`, `AvatarUsuario`, `ModalNovoGrupo`, `ModalMembros`
- **Hook de Suporte:** `useChat.js`
- **Rota:** `/chat`
- **Permissão de Acesso:** Usuários autenticados.

---

## 2. Objetivo Funcional
Fornecer um ambiente de bate-papo em tempo real para a comunicação interna da empresa cliente, com suporte a mensagens diretas (1 a 1), grupos temáticos, canais de projetos/times, controle de membros e avatares visuais.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase Realtime):**
  - `chat_canais`: canais existentes (`direto`, `grupo`, `projeto`, `time`).
  - `chat_membros`: participantes vinculados a cada canal e privilégio (`admin` / `membro`).
  - `chat_mensagens`: histórico de mensagens enviadas.
- **Hook `useChat`:** `canais`, `canalAtivo`, `mensagens`, `membros`, `enviarMensagem()`, `criarGrupo()`, `adicionarMembro()`, `removerMembro()`, `promoverAdmin()`.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Criar Grupo (`+ Grupo`)** | Botão | Abre o `ModalNovoGrupo` para criar um novo canal coletivo. | Fixo no topo do painel de canais. |
| **Lista de Canais e DMs (`ItemCanal`)** | Lista Interativa | Alterna o chat exibido ao clicar no canal (`setCanalAtivo`). | Exibe ícone do canal (`👤` Direto, `👥` Grupo, `📁` Projeto, `🏷️` Time) e badge com contador de mensagens não lidas. |
| **Cabeçalho do Canal Ativo** | Barra Superior | Exibe o nome do canal selecionado, ícone e botão de gestão de membros (se for grupo). | Fixo no topo da conversa. |
| **Botão Gerenciar Membros (`👥 Membros`)** | Botão Ícone | Abre o `ModalMembros` para administrar participantes. | Exibido apenas em canais do tipo `grupo` ou `time`. |
| **Área de Scroll de Mensagens** | Conteúdo Principal | Renderiza a lista de mensagens (`BolhaMensagem`) ordenadas por horário (`criado_em`). | Executa auto-scroll para o final ao receber novas mensagens em tempo real via Supabase Realtime. |
| **Bolha de Mensagem Própria** | Balão à direita | Exibe a mensagem enviada pelo usuário logado em destaque na cor primária. | Alinhado à direita. |
| **Bolha de Mensagem de Terceiro** | Balão à esquerda | Exibe a mensagem de outros membros com avatar circular e nome do autor. | Alinhado à esquerda. |
| **Campo de Entrada de Texto** | Input (`type="text"`) | Digitação da mensagem em tempo real. Submete ao pressionar `Enter` ou clicar no botão. | Focado automaticamente ao trocar de canal. |
| **Botão Enviar Mensagem** | Botão Ícone (`➤`) | Dispara `enviarMensagem(conteudo)`. | Desabilitado se o texto estiver em branco. |

---

## 5. Modais de Gestão do Chat

### A. Modal Novo Grupo (`ModalNovoGrupo`)
1. **Nome do Grupo:** Campo de texto obrigatório.
2. **Ícone / Emoji do Grupo:** Seleção de emoji representativo (ex: `💬`, `📢`, `🚀`).
3. **Descrição:** Campo opcional de contexto.
4. **Adicionar Membros Iniciais:** Lista com busca textual para marcar os colaboradores que entrarão no grupo imediatamente.

### B. Modal de Membros (`ModalMembros`)
1. **Lista de Participantes:** Mostra todos os membros atuais com indicação se é `👑 Admin` do grupo.
2. **Botão Promover / Rebaixar Admin:** Altera o nível de acesso do membro no canal (`promoverAdmin`/`rebaixarAdmin`).
3. **Botão Remover:** Retira um participante do grupo (`removerMembro`).
4. **Adicionar Novos Membros:** Campo com autocompletar para convidar usuários da empresa que ainda não estão no canal.
