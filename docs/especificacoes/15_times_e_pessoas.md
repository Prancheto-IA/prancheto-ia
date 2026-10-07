# Especificação Funcional: Times e Pessoas

## 1. Identificação do Módulo
- **Nome:** Diretório de Equipes e Pessoas da Organização
- **Componente Principal:** `TimesPessoas` (`frontend/src/pages/TimesPessoas/TimesPessoas.jsx`)
- **Subcomponentes:** `ModalTime`, `ModalAdicionarMembro`, `CardMembro`, `AvatarUsuario`
- **Hook de Suporte:** `useOrg.js`
- **Rota:** `/times-pessoas` (ou `/modulos/times-pessoas` via redirecionamento)
- **Permissão de Acesso:** Usuários autenticados (criação/edição restrita a perfil com permissão de gestão).

---

## 2. Objetivo Funcional
Visualizar todos os colaboradores da empresa cliente organizados por equipes de trabalho, consultar informações de contato, cargo e atribuir ou remover membros de times em tempo real.

---

## 3. Fontes de Dados e Estados
- **Tabelas do Banco (Supabase):** `org_times`, `users`, `users_times`.
- **Hook `useOrg`:** `times`, `usuarios`, `carregarTimes()`, `criarTime()`, `atualizarTime()`, `adicionarMembroTime()`, `removerMembroTime()`.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão Criar Time (`+ Novo Time`)** | Botão Principal | Abre o `ModalTime` em modo de criação. | Restrito a Administradores/Gerentes. |
| **Filtro de Busca por Pessoa/Time** | Input Texto | Filtra a lista de times ou colaboradores exibidos pelo nome, e-mail ou cargo. | Atualiza o estado `busca`. |
| **Card do Time** | Card Informativo | Exibe o ícone (emoji), nome do time, cor representativa (`cor_primaria`), número de membros e lista de avatares dos integrantes. | Permite expandir para gerenciar integrantes. |
| **Botão Adicionar Integrante (`+ Membro`)** | Botão no Card | Abre o `ModalAdicionarMembro` para incluir um colaborador que ainda não faz parte do time. | Exibe apenas usuários do tenant que não estão no time. |
| **Botão Editar Time (`✏️`)** | Botão Ícone Inline | Abre o `ModalTime` carregando nome, ícone, cor e descrição do time para edição. | Atualiza os dados na tabela `org_times`. |
| **Botão Remover Integrante (`✕`)** | Botão Ícone Inline | Remove a associação do colaborador com a equipe na tabela `users_times`. | Atualiza a contagem do time em tempo real. |
| **Item de Membro da Equipe (`CardMembro`)** | Linha / Card | Exibe o avatar circular com iniciais e cor baseada no nome, o nome completo, e-mail e badge com o cargo do colaborador. | Elemento de diretório. |

---

## 5. Modais de Gestão do Módulo

### A. Modal Criar / Editar Time (`ModalTime`)
1. **Preview do Ícone e Nome:** Caixa visual no topo mostrando como a pílula do time será exibida.
2. **Nome do Time (`*Required`):** Título da equipe (ex: *Design Systems*, *Suporte N2*).
3. **Descrição:** Função do time na empresa.
4. **Seletor de Emoji / Ícone:** Grade de 15 emojis selecionáveis (`👥`, `🚀`, `💡`, `🎯`, `⚡`, `🏆`, `🎨`, `📊`, etc.).
5. **Seletor de Cores:** Paleta de 10 cores pré-definidas (Índigo, Violeta, Rosa, Vermelho, Laranja, Âmbar, Verde, Ciano, Azul, Slate).

### B. Modal Adicionar Membro ao Time (`ModalAdicionarMembro`)
1. **Campo de Busca:** Filtra colaboradores da empresa por nome ou e-mail.
2. **Lista de Candidatos:** Exibe os colaboradores que ainda não pertencem ao time.
3. **Botão Adicionar:** Executa `onAdicionar(usuario.id)`, incluindo a pessoa no time imediatamente.
