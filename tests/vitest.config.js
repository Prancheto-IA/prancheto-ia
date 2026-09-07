import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Cada teste faz chamadas de rede reais contra o Supabase de dev
    // (login, insert, select) — precisa de mais tempo que o default de 5s.
    testTimeout: 20000,
    hookTimeout: 30000,
    // Um arquivo por vez: tenant-isolation.test.js cria/derruba um tenant
    // inteiro em beforeAll/afterAll, e paralelizar arquivos arriscaria dois
    // setups pisando um no outro no mesmo banco compartilhado de dev.
    fileParallelism: false,
  },
});
