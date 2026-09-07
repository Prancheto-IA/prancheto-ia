// =============================================================
// PRANCHETO.IA - CONFIGURAÇÃO DO VITE (Bundler do Front-end)
// =============================================================
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Gera o robots.txt no build a partir do mesmo VITE_APP_ENV que decide o
// resto do ambiente (ver src/lib/ambiente.js). Producao e dev publicam o
// mesmo bundle a partir do mesmo comando `vite build`, entao o robots.txt
// nao pode ser um arquivo estatico em public/: ele precisa saber, na hora
// do build, se este e o deploy de producao ou o preview de dev.
function robotsTxtPorAmbiente(env) {
  const isProducao = (env.VITE_APP_ENV || '') === 'production';
  const conteudo = isProducao
    ? 'User-agent: *\nAllow: /\n'
    : 'User-agent: *\nDisallow: /\n';

  return {
    name: 'robots-txt-por-ambiente',
    apply: 'build',
    closeBundle() {
      fs.writeFileSync(path.resolve(__dirname, 'dist/robots.txt'), conteudo);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      // Plugin oficial do React para o Vite (suporte a JSX e Fast Refresh)
      react(),
      robotsTxtPorAmbiente(env),
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
  };
});
