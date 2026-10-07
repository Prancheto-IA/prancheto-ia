# Design System — Emitly UI (Especificação Técnica & Visual)

Este documento especifica o **Design System completo** extraído e fielmente baseado na interface visual da marca **Emitly**. Ele estabelece as diretrizes de cores, tipografia, espaçamentos, elevações, bordas, componentes e padrões de layout necessários para recriar a interface do projeto com acabamento *premium*, orgânico e moderno.

---

## 1. Filosofia e Estética Visual

- **Estilo:** *Modern Organic Clean Minimalist SaaS* (Interface com tons sage/menta suaves, superfícies brancas de alto contraste, acentos verde-floresta e destaques em tons pastel).
- **Cores Predominantes:** Fundo geral em tom verde-menta/sage desbotado suave (`#F2F5F3`), cartões brancos puros (`#FFFFFF`), botões primários em verde-floresta profundo (`#0E382C`) e item de navegação ativo em tom verde-lima vibrante e suave (`#D4EC9D`).
- **Geometria & Bordas:** Cantos extremamente suaves e arredondados (raio de 16px a 24px), proporcionando uma sensação moderna, amigável e refinada.
- **Hierarquia Visual:** Tipografia nítida, números de métricas em grande escala, divisores discretos de 1px e uso estratégico de pílulas (*badges*) coloridas para tendências e status.

---

## 2. Paleta de Cores (Tokens de Cor)

### 2.1 Cores de Fundo (Surfaces & Canvas)
| Token CSS | Cor Hex / Valor | Descrição / Aplicação |
| :--- | :--- | :--- |
| `--color-canvas` | `#F2F5F3` | Fundo principal da aplicação (Sage/Menta suave). |
| `--color-canvas-subtle` | `#EBF0ED` | Fundo de contraste secundário. |
| `--color-surface` | `#FFFFFF` | Fundo de cartões, painéis, sidebar e modais (Branco puro). |
| `--color-surface-secondary` | `#F7FAF8` | Fundo de campos de busca e controles de entrada. |
| `--color-surface-hover` | `#EDF2EE` | Estado de hover em itens de menu e botões neutros. |

### 2.2 Cores da Marca e Ações Primárias
| Token CSS | Cor Hex / Valor | Descrição / Aplicação |
| :--- | :--- | :--- |
| `--color-primary` | `#0E382C` | **Verde Floresta Escuro:** Botão principal de ação (`+ Create campaigns`), FAB de Chatbot e elementos de destaque primário. |
| `--color-primary-hover` | `#07261E` | Estado de hover do botão primário. |
| `--color-primary-text` | `#FFFFFF` | Texto sobre superfícies verde-floresta. |
| `--color-nav-active-bg` | `#D4EC9D` | **Verde Lima Vibrante:** Fundo do item de navegação ativo na Sidebar. |
| `--color-nav-active-text` | `#132E22` | Texto/ícone do item ativo na Sidebar. |

### 2.3 Badges Semânticos e Tendências
| Token CSS | Fundo (BG) | Texto (Text) | Aplicação |
| :--- | :--- | :--- | :--- |
| `--color-badge-success` | `#DCF5E4` | `#15803D` | Tendência positiva (ex: `+0.02% ▲`, `↑12% vs last month`). |
| `--color-badge-danger` | `#FEE2E2` | `#DC2626` | Tendência negativa (ex: `+0.02% ▼`). |
| `--color-badge-warning` | `#FEF3C7` | `#B45309` | Alertas e avisos neutros. |
| `--color-badge-dark` | `#0E382C` | `#FFFFFF` | Etiqueta de valor médio (ex: `Avg $150k`). |

### 2.4 Destaques Pastel (Cards de Agenda e Gráficos)
| Token CSS | Cor Hex / Valor | Aplicação |
| :--- | :--- | :--- |
| `--color-chart-coral` | `#FF6C57` | **Coral / Salmon Vibrante:** Barra de destaque principal em gráficos de barras com sombra projetada. |
| `--color-card-yellow` | `#FFF099` | **Amarelo Sol Suave:** Fundo de cards de eventos/compromissos do dia. |
| `--color-card-pink` | `#FCE4F6` | **Rosa Pastel / Lavanda:** Fundo de cards de eventos futuros. |

### 2.5 Bordas e Texto
| Token CSS | Cor Hex / Valor | Descrição / Aplicação |
| :--- | :--- | :--- |
| `--color-border` | `#E4ECE7` | Borda padrão de cartões, divisores de métricas e inputs. |
| `--color-border-subtle` | `#EEF3F0` | Linhas de grade suaves de gráficos. |
| `--color-text-primary` | `#111915` | Títulos, métricas e textos principais (Grafite Escuro). |
| `--color-text-secondary` | `#687770` | Subtítulos, rótulos de métricas e descrições (Cinza Menta). |
| `--color-text-tertiary` | `#99A6A0` | Textos desabilitados, placeholders e legendas secundárias. |

---

## 3. Tipografia

- **Família Tipográfica:** `'Plus Jakarta Sans'`, `'Inter'`, `-apple-system`, `sans-serif`.
- **Escala Tipográfica:**

| Nível / Uso | Tamanho | Peso (Font-Weight) | Altura de Linha |
| :--- | :--- | :--- | :--- |
| **Título Principal (Dashboard)** | 28px (`1.75rem`) | 700 (Bold) | 1.2 |
| **Métrica Principal (Hero Number)** | 32px (`2.00rem`) | 700 (Bold) | 1.1 |
| **Métrica Padrão (Grid Metric)** | 24px (`1.50rem`) | 700 (Bold) | 1.2 |
| **Título de Cartão (H2)** | 18px (`1.125rem`) | 600 (Semi-bold) | 1.3 |
| **Título de Seção (H3)** | 16px (`1.00rem`) | 600 (Semi-bold) | 1.4 |
| **Texto de Corpo (Body)** | 14px (`0.875rem`) | 500 (Medium) | 1.5 |
| **Legenda / Rótulo (Label)** | 12px (`0.75rem`) | 500 (Medium) | 1.4 |
| **Badge / Etiqueta** | 11px (`0.6875rem`) | 600 (Semi-bold) | 1.0 |

---

## 4. Bordas e Arredondamento (Border Radius)

| Token CSS | Valor | Aplicação |
| :--- | :--- | :--- |
| `--radius-sm` | `8px` | Botões pequenos, seletores e tags internas. |
| `--radius-md` | `12px` | Botões primários, pílulas de navegação e inputs. |
| `--radius-lg` | `16px` | Cards secundários de agendamento e modais. |
| `--radius-xl` | `20px` | Cartões principais do dashboard e containers de métricas. |
| `--radius-2xl` | `24px` | Moldura externa da aplicação (Main App Container). |
| `--radius-full` | `9999px` | Barra de busca, badges de tendência e FAB de Chatbot. |

---

## 5. Sombras e Elevação (Shadows)

```css
/* Sombra Suave de Cartão */
--shadow-card: 0px 4px 20px -2px rgba(14, 56, 44, 0.04), 0px 2px 6px -1px rgba(0, 0, 0, 0.02);

/* Sombra Projeta da Barra de Gráfico Destaque (Coral) */
--shadow-bar-highlight: 0px 8px 20px -4px rgba(255, 108, 87, 0.4);

/* Sombra de Botão Flutuante (FAB) */
--shadow-fab: 0px 8px 24px -2px rgba(14, 56, 44, 0.25);
```

---

## 6. Especificação dos Componentes da UI

### 6.1 Moldura da Aplicação (App Shell Container)
- **Fundo Tela:** `#F2F5F3` com padding generoso de `24px`.
- **Superfície Principal:** Card gigante de cantos arredondados (`24px`), fundo `#FFFFFF`, borda de `1px solid #E4ECE7` e sombra `--shadow-card`.

### 6.2 Barra Lateral (Sidebar)
- **Logo:** `emitly` em tipo geométrico minúsculo e negrito (`24px`, cor `#111915`).
- **Card de Espaço de Trabalho (Workspace Switcher):** Fundo `#FFFFFF`, borda `#E4ECE7`, raio `12px`, ícone de cadeado `🔒`, Nome "My Workspace", Badge "Free plan" e chevron inferior.
- **Item de Navegação:**
  - *Altura:* `44px`, Raio: `14px`.
  - *Item Ativo (`Overview`):* Fundo verde-lima `#D4EC9D`, texto e ícone verde-floresta `#132E22`, peso 600.
  - *Item Inativo:* Fundo transparente, texto/ícone cinza `#687770`. Hover: `#EDF2EE`.
- **Rodapé de Usuário:** Avatar circular (32px), Nome ("James Passaquindici"), E-mail ("jamespass@emi.com") e ícone de troca de conta.

### 6.3 Cabeçalho Superior (Header)
- **Barra de Busca (Search Bar):**
  - Formato de pílula (`rounded-full`), altura `42px`, fundo `#F7FAF8`, borda `#E4ECE7`.
  - Ícone de lupa no início, placeholder "Search", atalho de teclado `⌘ K` alinhado à direita.
- **Ações Rápidas (Direita):** Botão circular de presente 🎁, botão circular de notificações 🔔, menu de perfil com avatar (32px), nome e ID (`ID: 4827682`).

### 6.4 Botão de Ação Primário (`+ Create campaigns`)
- **Fundo:** Verde Floresta Escuro (`#0E382C`), Hover: (`#07261E`).
- **Texto:** Branco puro (`#FFFFFF`), peso 600.
- **Raio:** `12px` (`rounded-xl`), padding `10px 20px`.

### 6.5 Grid de Métricas ("Performance Over Time")
- Controles no topo: Título "Performance Over Time", data "29 Sept, 2024", botões à direita (`Short ↕`, `Filter ≡`, `⋮`).
- 4 Colunas com divisores verticais discretos de 1px (`#E4ECE7`):
  1. **Delivered:** `42,642.1` | Badge verde `+0.02% ▲`
  2. **Opened:** `26,843` | Badge vermelho `+0.02% ▼`
  3. **Clicked:** `525,753` | Badge verde `+0.02% ▲`
  4. **Subscribe:** `425` | Badge verde `+0.02% ▲`

### 6.6 Gráfico de Desempenho de Campanha ("Campaign Performance")
- Valor principal em destaque: `$24,747.01` + data + badge `↑12% vs last month`.
- Barras verticais arredondadas (Jan a Jun):
  - Barras normais: Cinza suave `#F2F5F3`.
  - Barra ativa (Março): Coral vibrante `#FF6C57` com indicador `67%` e sombra `--shadow-bar-highlight`.
  - Linha média pontilhada horizontal com badge escuro `Avg $150k`.

### 6.7 Widget de Agendamento ("Schedule Campaign")
- Seletor horizontal de dias da semana (Seg a Dom): Dia ativo (Sex 19) com círculo destacado.
- Cards de compromissos:
  - **Card Amarelo (Hoje):** Fundo `#FFF099`, raio `16px`, ícone `88`, Título `Element of Design Test`, Horário `10:00 - 11:00 AM`.
  - **Card Rosa (Sáb, Jan 20):** Fundo `#FCE4F6`, raio `16px`, ícone `⚡`, Título `Design Principle Test`, Horário `10:00 - 11:00 AM`.

### 6.8 Botão Flutuante de Chatbot (FAB)
- Botão circular de `52px` fixo no canto inferior direito.
- Fundo Verde Floresta (`#0E382C`), ícone de balão de mensagem `💬` e sombra `--shadow-fab`.

---

## 7. Variáveis CSS Globais (Prontas para Uso)

```css
:root {
  /* Surface & Canvas */
  --color-canvas:            #F2F5F3;
  --color-canvas-subtle:     #EBF0ED;
  --color-surface:           #FFFFFF;
  --color-surface-secondary: #F7FAF8;
  --color-surface-hover:     #EDF2EE;

  /* Primary Brand */
  --color-primary:           #0E382C;
  --color-primary-hover:     #07261E;
  --color-primary-text:      #FFFFFF;

  /* Active Nav */
  --color-nav-active-bg:     #D4EC9D;
  --color-nav-active-text:   #132E22;

  /* Badges Semânticos */
  --color-badge-success-bg:   #DCF5E4;
  --color-badge-success-text: #15803D;
  --color-badge-danger-bg:    #FEE2E2;
  --color-badge-danger-text:  #DC2626;
  --color-badge-warning-bg:   #FEF3C7;
  --color-badge-warning-text: #B45309;
  --color-badge-dark-bg:      #0E382C;
  --color-badge-dark-text:    #FFFFFF;

  /* Accent Highlight Cards */
  --color-chart-coral:       #FF6C57;
  --color-card-yellow-bg:    #FFF099;
  --color-card-yellow-text:  #1E2922;
  --color-card-pink-bg:      #FCE4F6;
  --color-card-pink-text:    #1E2922;

  /* Border & Text */
  --color-border:            #E4ECE7;
  --color-border-subtle:     #EEF3F0;
  --color-text-primary:      #111915;
  --color-text-secondary:    #687770;
  --color-text-tertiary:     #99A6A0;

  /* Radius */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-2xl:  24px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0px 4px 20px -2px rgba(14, 56, 44, 0.04), 0px 2px 6px -1px rgba(0, 0, 0, 0.02);
  --shadow-highlight: 0px 8px 20px -4px rgba(255, 108, 87, 0.4);
  --shadow-fab: 0px 8px 24px -2px rgba(14, 56, 44, 0.25);
}
```
