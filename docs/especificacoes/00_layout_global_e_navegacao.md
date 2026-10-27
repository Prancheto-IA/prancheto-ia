# Especificação Funcional: Layout Global, Sidebar e Navegação

## 1. Identificação do Módulo
- **Nome:** Layout Global e Estrutura de Navegação do Cliente
- **Componentes Principais:** `LayoutCliente.jsx`, `Sidebar.jsx`, `ModalPersonalizarSidebar.jsx`, `HeaderMobile.jsx`, `BarraTopo.jsx`, `BannerImpersonation.jsx`, `ToastContainer.jsx`, `BolhaChatIA.jsx`
- **Rotas Relacionadas:** Todas as rotas sob `/dashboard/*`, `/crm/*`, `/suporte/*`, `/chat`, `/calendario`, `/projetos`, `/tarefas`, `/times-pessoas`
- **Permissão de Acesso:** Usuários autenticados de qualquer cargo dentro de um Tenant (Super Admin não acessa o LayoutCliente, sendo redirecionado para `/admin`).

---

## 2. Objetivo Funcional
Fornecer a estrutura base (Shell) da aplicação para clientes, incluindo a navegação lateral responsiva (Sidebar), cabeçalhos móvel e desktop com suporte a botão de retorno, barra de aviso quando um administrador está assumindo a sessão do usuário (*impersonation*), bolha flutuante de assistente IA, notificações flutuantes (Toast) e capacidade de personalização da ordem e visibilidade dos itens de menu por usuário através de *Drag and Drop*.

---

## 3. Fontes de Dados e Estados
- **`useAuthStore`:** Dados do usuário logado (`nome`, `email`, `cargo`, `tenant_id`, `isSuperAdmin`).
- **`useTenantStore`:** Dados da organização cliente (`logo_url`, cores de identidade visual personalizadas).
- **`useSidebarPrefs`:** Preferências de itens da barra lateral (ordem, itens visíveis, modo do Chat IA, colapsado no desktop) persistidas via Supabase/API backend.
- **`useAuth`:** Função de logout e sincronização das permissões do cargo.

---

## 4. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Marca / Logo** | Imagem / Ícone | Exibe a logo da empresa enviada nas configurações ou fallback com emoji `🧠`. Se a imagem falhar ao carregar, exibe o fallback automaticamente. | Carregado via `useTenantStore`. |
| **Nome do Produto** | Texto | Exibe o nome oficial do produto (Prancheto.IA). | Estilizado conforme tema/identidade. |
| **Item de Navegação Lateral** | Botão / Link (`NavLink`) | Redireciona o usuário para a rota do módulo correspondente (`/dashboard`, `/crm`, `/suporte`, `/chat`, etc.). Ativa visualmente se a rota atual casar com a rota do item ou seu prefixo. | Respeita a visibilidade definida pelo usuário no modal de personalização. |
| **Avatar do Usuário** | Círculo / Inicial | Exibe a primeira letra do nome do usuário. | Localizado no rodapé da Sidebar. |
| **Badge de Cargo** | Etiqueta (`Badge`) | Exibe o nível hierárquico do usuário: `Admin`, `Gerente`, `Membro` ou `Visualizador`. | Cores e rótulos específicos por cargo (`BADGE_CARGO`). |
| **Botão Personalizar Sidebar** | Botão Ícone (`✏️`) | Abre o modal `ModalPersonalizarSidebar` para reordenar ou ocultar itens de menu. | Visível no bloco do usuário no rodapé da Sidebar. |
| **Botão Sair / Logout** | Botão Ícone (`🚪`) | Executa a função `logout()`, limpando token e estado da sessão, e redirecionando para `/login`. | Fixo no rodapé da Sidebar. |
| **Botão Recolher/Expandir Sidebar** | Botão Fixo Desktop (`☰`) | Alterna o estado `colapsada` da barra lateral no desktop. Quando colapsada, a Sidebar encolhe para largura 0px. | Exibido apenas em telas `lg:` (desktop). |
| **Botão Abrir Menu Mobile** | Botão Ícone (`☰`) | Abre a Sidebar sobreposta no modo mobile. | Exibido no `HeaderMobile` em telas menores que `lg:`. |
| **Botão Voltar** | Botão Ação (`← Voltar`) | Executa `navigate(-1)` para retornar à página anterior no histórico do navegador. | Não é exibido nas páginas raiz (ex: `/dashboard`, `/crm`, `/suporte`, `/chat`, `/calendario`). |
| **Banner de Impersonation** | Faixa de Alerta Global | Notifica visualmente se a sessão atual é uma representação efêmera executada por um Super Admin. Permite encerrar o impersonation com 1 clique. | Visível no topo de todas as páginas quando `impersonating = true`. |
| **Bolha Flutuante de Chat IA** | Botão Flutuante (`BolhaChatIA`) | Abre uma janela flutuante interativa com o assistente IA para comandos rápidos de CRM sem sair da página atual. | Exibido apenas se a preferência `chatIaModo === 'flutuante'`. |
| **Container Global de Toast** | Notificador Flutuante | Renderiza mensagens temporárias de sucesso, erro, aviso ou informação enviadas pelo sistema (`ToastContainer`). | Fixo no topo direito da tela. |

---

## 5. Modal de Personalização da Sidebar (`ModalPersonalizarSidebar`)

### Elementos e Funções do Modal:
1. **Botão Fechar (`✕` / "Concluído"):** Encerra o modal e salva/aplica as alterações locais.
2. **Seletor de Modo do Chat IA:**
   - **Opção "Bolha Flutuante":** Define o chat como assistente suspenso na tela.
   - **Opção "Item Fixo":** Adiciona o Chat como um item normal dentro da lista da Sidebar.
3. **Handle de Drag (`⠿`):** Permite arrastar os itens da lista para reordenar a posição de cada módulo no menu usando `@dnd-kit`.
4. **Botão Ocultar / Mostrar (`🗑️ Ocultar` / `+ Mostrar`):** Oculta ou reexibe um módulo na Sidebar.
   - *Regra:* Itens definidos em `SLUGS_FIXOS` possuem o ícone de cadeado (`🔒`) e não podem ser ocultados.
5. **Botão Restaurar Padrão (`↺`):** Reseta todas as ordenações e visibilidades para o padrão nativo do sistema.
