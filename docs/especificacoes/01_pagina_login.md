# Especificação Funcional: Página de Login

## 1. Identificação do Módulo
- **Nome:** Tela de Autenticação / Login
- **Componente Principal:** `PaginaLogin` (`frontend/src/pages/Login/Login.jsx`)
- **Rota:** `/login`
- **Permissão de Acesso:** Pública (Usuários não autenticados).

---

## 2. Objetivo Funcional
Autenticar usuários na plataforma Prancheto.IA com e-mail e senha, gerenciando redirecionamento inteligente baseado no perfil do usuário (Super Admin ou Cliente) e oferecendo alternância imediata de tema (claro/escuro).

---

## 3. Fontes de Dados e Estados
- **`useAuth`:** Função `login(email, senha)`, estado `carregando`, mensagem `erroLogin`.
- **`useAuthStore`:** `token`, dados do `usuario` autenticado.
- **`useTema`:** `temaEscuro`, função `alternarTema()`.
- **Estados Locais:** `email` (string), `senha` (string), `mostrarSenha` (boolean).

---

## 4. Fluxo de Redirecionamento Automático
- Se o usuário já possuir token válido e dados salvos no `authStore`:
  - Se `usuario.isSuperAdmin === true` → Redireciona para `/admin` (Painel Administrativo).
  - Caso contrário → Redireciona para `/dashboard` (Dashboard do Cliente).

---

## 5. Elementos da Interface e Funções

| Identificador / Elemento | Tipo de Componente | Função / Comportamento / Trigger | Condições / Regras de Negócio |
| :--- | :--- | :--- | :--- |
| **Botão de Alternar Tema** | Botão Ícone Circular (`☀️`/`🌙`) | Alterna globalmente entre o tema claro e escuro (`alternarTema`). | Posicionado fixo no canto superior direito. |
| **Marca / Título** | Logotipo e Texto | Apresenta o ícone `🧠` e a constante `NOME_PRODUTO` (Prancheto.IA). | Elemento informativo. |
| **Campo de E-mail** | Campo de Entrada (`input[type="email"]`) | Recebe o e-mail do usuário. Atualiza o estado `email`.Possui validação HTML `required`, foco automático e autocomplete. | Desabilitado durante o carregamento (`carregando === true`). |
| **Campo de Senha** | Campo de Entrada (`input[type="password"` ou `text"]`) | Recebe a senha do usuário. Atualiza o estado `senha`. Alterna visibilidade quando a opção de ver senha é acionada. | Desabilitado durante o carregamento (`carregando === true`). |
| **Botão Mostrar/Ocultar Senha** | Botão Ícone Inline (`👁️`/`🙈`) | Alterna o estado `mostrarSenha` entre `true` e `false`, mudando o atributo `type` do campo de senha. | Não recebe foco na navegação via tab (`tabIndex={-1}`). |
| **Caixa de Erro de Login** | Mensagem / Alerta | Exibe o texto retornado por `erroLogin` em caso de falha na autenticação (ex: credenciais inválidas, usuário suspenso). | Exibido apenas quando `erroLogin` contiver mensagem de erro. |
| **Botão Entrar** | Botão Submissão (`button[type="submit"]`) | Dispara o manipulador `handleSubmit`, efetuando a chamada assíncrona `login(email.trim(), senha)`. Exibe spinner de carregamento se `carregando === true`. | Desabilitado se `carregando === true` ou se `email` ou `senha` estiverem vazios. |
| **Rodapé de Direitos** | Texto | Exibe o ano atual dinâmico e mensagem de copyright. | Informativo estático. |
