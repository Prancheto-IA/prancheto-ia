// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO VITE (Bundler do Front-end)
// =============================================================
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    // Plugin oficial do React para o Vite (suporte a JSX e Fast Refresh)
    react(),
  ],

  // Alias de importação: permite usar "@/components/..." em vez de "../../components/..."
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Configuração do servidor de desenvolvimento
  server: {
    port: 5173,
    // Proxy: redireciona chamadas /api para o back-end durante o desenvolvimento,
    // evitando problemas de CORS na máquina local.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Configurações de build para produção
  build: {
    outDir: 'dist',
    sourcemap: true, // Necessário para o Sentry mapear erros de produção ao código original
  },
});
