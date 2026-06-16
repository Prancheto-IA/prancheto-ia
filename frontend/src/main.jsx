// =============================================================
// PRANCHETO.IA - ENTRY POINT DO FRONT-END
// Ponto de entrada da aplicação React.
// Responsável por:
//   1. Inicializar o Sentry ANTES de renderizar qualquer componente
//   2. Montar o componente raiz <App /> no DOM
//   3. Importar os estilos globais do TailwindCSS
// =============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';

import App from './App.jsx';
import './index.css'; // Estilos globais do TailwindCSS

// =============================================================
// INICIALIZAÇÃO DO SENTRY (Front-end)
// Deve ocorrer ANTES da renderização do React para capturar
// erros em todos os componentes, incluindo erros de inicialização.
// =============================================================
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Define o ambiente (development, production)
    environment: import.meta.env.VITE_APP_ENV || 'development',

    // Integração com React Router para rastrear navegação como transações
    integrations: [
      Sentry.browserTracingIntegration(),
      // Captura erros de componentes React (ErrorBoundary automático)
      Sentry.replayIntegration({
        // Mascara dados sensíveis nas gravações de sessão
        maskAllText: true,
        blockAllMedia: false,
      }),
    ],

    // Taxa de amostragem de performance
    tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,

    // Taxa de gravação de sessões com erro (100% dos erros são gravados)
    replaysOnErrorSampleRate: 1.0,
  });
}

// =============================================================
// MONTAGEM DO REACT NO DOM
// React.StrictMode ativa verificações extras em desenvolvimento
// (detecta efeitos colaterais e APIs obsoletas).
// =============================================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
