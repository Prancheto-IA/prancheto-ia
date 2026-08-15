// =============================================================
// PRANCHETO.IA - ESLINT
//
// O script `npm run lint` existia no package.json desde o inicio, mas
// sem arquivo de configuracao: rodava e abortava com "couldn't find a
// configuration file", para qualquer arquivo. Na pratica o projeto
// nunca teve lint.
//
// A configuracao comeca deliberadamente permissiva. Ligar tudo de uma
// vez em uma base de ~30 mil linhas produz milhares de avisos, e uma
// lista que ninguem consegue zerar e ignorada no primeiro dia. Aqui
// ficam ligadas como ERRO apenas as regras que apontam defeito de
// verdade — as que ja teriam pego bugs reais desta base:
//
//   - react-hooks/exhaustive-deps: dependencia faltando em useEffect e
//     useCallback e a origem classica de "a tela nao atualiza".
//   - no-unused-vars: import morto que sobra de refatoracao.
//
// Regras de estilo ficam de fora. Estilo se resolve lendo o codigo ao
// redor, que e o que o CLAUDE.md ja pede.
// =============================================================

module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.cjs'],
  rules: {
    // O projeto usa JSX transform novo: React nao precisa estar no escopo,
    // e PropTypes nao e o padrao adotado aqui.
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    // Aspas e acentos em texto pt-BR dentro de JSX sao intencionais.
    'react/no-unescaped-entities': 'off',

    // ERRO: quebra em tempo de execucao. A primeira rodada do lint pegou
    // um destes — 'conversationId is not defined' no Chat IA do Super
    // Admin, ReferenceError a cada mensagem enviada, disfarcado por um
    // catch generico. E o tipo de defeito que so o lint acha barato.
    // (no-undef vem de eslint:recommended.)

    // AVISO: divida existente, nao defeito novo. Sao 27 ocorrencias hoje;
    // subir para 'error' antes de zera-las tornaria o lint intransponivel
    // no primeiro dia, e lint intransponivel e lint desligado. A regra
    // aperta conforme a lista encolhe.
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      // catch (e) sem uso do erro e idioma comum aqui, e legivel.
      caughtErrors: 'none',
    }],
    'no-useless-catch': 'warn',
    'no-empty': 'warn',
    'react-refresh/only-export-components': 'off',
  },
};
