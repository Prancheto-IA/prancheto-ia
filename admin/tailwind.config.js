// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO TAILWINDCSS
// =============================================================
/** @type {import('tailwindcss').Config} */
export default {
  // Habilita modo escuro via classe 'dark' no elemento <html>
  darkMode: 'class',

  // Define quais arquivos o Tailwind deve escanear para gerar apenas
  // as classes CSS utilizadas (tree-shaking de CSS)
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    extend: {
      // --- PALETA DE CORES DO PRANCHETO.IA ---
      colors: {
        // Cor primária da marca + compatibilidade com shadcn/ui e ReUI (bg-primary)
        primary: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          foreground: '#FFFFFF',
          50:  'rgb(var(--color-primary-50)  / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)', // Cor principal
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        // --- TOKENS SEMÂNTICOS SHADCN/UI & REUI MAPEADOS AO DESIGN SYSTEM ---
        background: 'var(--color-surface-card)',
        foreground: 'var(--color-text-primary)',
        card: {
          DEFAULT: 'var(--color-surface-card)',
          foreground: 'var(--color-text-primary)',
        },
        popover: {
          DEFAULT: 'var(--color-surface-card)',
          foreground: 'var(--color-text-primary)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--brand-secondary-rgb) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: 'rgb(var(--brand-secondary-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#065F46',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#92400E',
        },
        focus: {
          DEFAULT: 'rgb(var(--brand-purple-rgb) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        invert: {
          DEFAULT: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          foreground: '#FFFFFF',
        },
        border: 'var(--color-surface-border)',
        input: 'var(--color-surface-border)',
        ring: 'rgb(var(--brand-secondary-rgb) / <alpha-value>)',
        'muted-foreground': 'var(--color-text-secondary)',

        // --- TOKENS DE MARCA (DESIGN SYSTEM + WHITE-LABEL) ---
        brand: {
          primary:            'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          'primary-hover':    'rgb(var(--brand-primary-hover-rgb) / <alpha-value>)',
          secondary:          'rgb(var(--brand-secondary-rgb) / <alpha-value>)',
          'secondary-border': 'rgb(var(--brand-secondary-border-rgb) / <alpha-value>)',
          accent:             'rgb(var(--brand-accent-rgb) / <alpha-value>)',
          'accent-hover':     'rgb(var(--brand-accent-hover-rgb) / <alpha-value>)',
          purple:             'rgb(var(--brand-purple-rgb) / <alpha-value>)',
          violet:             'rgb(var(--brand-violet-rgb) / <alpha-value>)',
        },

        // --- SUPERFÍCIES E NEUTROS DO DESIGN SYSTEM ---
        'surface':               'var(--color-surface)',
        'surface-subtle':        'var(--color-surface-subtle)',
        'surface-hover':         'var(--color-surface-hover)',
        'surface-muted':         'var(--color-surface-muted)',
        'surface-card':          'var(--color-surface-card)',
        'surface-border':        'var(--color-surface-border)',
        'surface-border-strong': 'var(--color-surface-border-strong)',

        // --- TIPOGRAFIA ---
        ink: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted:     'var(--color-text-muted)',
        },
        'muted': 'var(--color-text-secondary)',
      },

      // --- FONTES ---
      // --brand-fonte é definida pela identidade visual da organização;
      // sem ela, o app usa Inter como sempre.
      fontFamily: {
        sans: ['var(--brand-fonte, Inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.875rem', { lineHeight: '1.25rem' }], // 14px padronizado no projeto
      },

      // --- ANIMAÇÕES CUSTOMIZADAS ---
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'flutuar-3d': 'flutuar3d 4.5s ease-in-out infinite',
        'sombra-flutuante': 'sombraFlutuante 4.5s ease-in-out infinite',
        'piscar-mascote': 'piscarMascote 15s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        // Balanço com rotação em 2 eixos + translateY — o ângulo precisa
        // ser exagerado (não sutil) pra ler como objeto 3D e não como
        // sticker plano subindo/descendo. Precisa de `perspective` no
        // elemento pai pra funcionar.
        flutuar3d: {
          '0%, 100%': { transform: 'translateY(0)     rotateY(0deg)   rotateX(0deg)' },
          '25%':      { transform: 'translateY(-10px) rotateY(16deg) rotateX(5deg)' },
          '50%':      { transform: 'translateY(-16px) rotateY(0deg)  rotateX(-5deg)' },
          '75%':      { transform: 'translateY(-10px) rotateY(-16deg) rotateX(5deg)' },
        },
        // Halo de contato no "chão" do ícone: encolhe quando o mascote sobe,
        // cresce quando ele desce — mesmo timing do flutuar3d, é o que vende
        // a sensação de profundidade/3D (cor da marca em vez de preto, pra
        // continuar visível no tema escuro do painel).
        sombraFlutuante: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.55' },
          '25%':      { transform: 'scale(0.75)', opacity: '0.35' },
          '50%':      { transform: 'scale(0.55)', opacity: '0.22' },
          '75%':      { transform: 'scale(0.75)', opacity: '0.35' },
        },
        // Piscada de verdade nos olhos: duas "pálpebras" absolutas
        // (ver BolhaChatIA.jsx) ficam com scaleY(0) — invisíveis — e vão
        // a scaleY(1) só por uma fração de segundo perto do fim de um
        // ciclo de 15s, cobrindo exatamente a região dos olhos.
        piscarMascote: {
          '0%, 95%, 100%': { transform: 'scaleY(0)' },
          '97%':           { transform: 'scaleY(1)' },
        },
      },
    },
  },

  plugins: [],
};
