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
    './src/**/*.{js,jsx}',
  ],

  theme: {
    extend: {
      // --- PALETA DE CORES DO PRANCHETO.IA ---
      colors: {
        // Cor primária da marca.
        // Os tons vêm de CSS variables (definidas em index.css) para que a
        // organização possa substituí-los pela própria cor em tempo de
        // execução — ver utils/identidadeVisual.js. O formato precisa ser
        // rgb(<canais> / <alpha-value>) para que classes com opacidade,
        // como bg-primary-500/15, continuem funcionando.
        primary: {
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
        // Cor de fundo do painel (estilo escuro profissional)
        // Usa CSS variables para suporte a tema claro/escuro
        // A classe 'dark' no <html> alterna os valores via index.css
        'surface':        'var(--color-surface)',
        'surface-card':   'var(--color-surface-card)',
        'surface-border': 'var(--color-surface-border)',

        // Texto secundário/discreto que acompanha o tema (rótulos, legendas,
        // texto de apoio). Substitui as antigas cores fixas do slate
        // (text-slate-400/500/600), que ficavam claras demais no tema claro.
        'muted': 'var(--color-text-secondary)',
      },

      // --- FONTES ---
      // --brand-fonte é definida pela identidade visual da organização;
      // sem ela, o app usa Inter como sempre.
      fontFamily: {
        sans: ['var(--brand-fonte, Inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
