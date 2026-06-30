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
        // Cor primária da marca
        primary: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fc',
          400: '#8191f8',
          500: '#6366f1', // Cor principal
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Cor de fundo do painel (estilo escuro profissional)
        // Usa CSS variables para suporte a tema claro/escuro
        // A classe 'dark' no <html> alterna os valores via index.css
        'surface':        'var(--color-surface)',
        'surface-card':   'var(--color-surface-card)',
        'surface-border': 'var(--color-surface-border)',
      },

      // --- FONTES ---
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // --- ANIMAÇÕES CUSTOMIZADAS ---
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
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
      },
    },
  },

  plugins: [],
};
