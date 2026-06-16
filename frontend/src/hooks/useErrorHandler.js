// =============================================================
// PRANCHETO.IA - HOOK DE TRATAMENTO DE ERROS (useErrorHandler)
// Centraliza o tratamento de erros da API no front-end.
// Exibe notificações toast amigáveis com o código de erro.
// Captura erros críticos no Sentry automaticamente.
//
// Uso nos componentes:
//   const { tratarErro, tratarSucesso } = useErrorHandler();
//   try {
//     await api.post('/users', dados);
//     tratarSucesso('Usuário criado com sucesso!');
//   } catch (erro) {
//     tratarErro(erro);
//   }
// =============================================================

import * as Sentry from '@sentry/react';
import { useUIStore } from '../store/uiStore.js';
import { MENSAGENS_ERRO } from '../utils/errorCodes.js';

/**
 * Hook que fornece funções padronizadas de tratamento de erros.
 */
export const useErrorHandler = () => {
  const { adicionarNotificacao } = useUIStore();

  /**
   * Trata um erro da API e exibe uma notificação toast amigável.
   * @param {Error} erro - Erro capturado no catch
   * @param {string} contexto - Contexto da operação (para log)
   */
  const tratarErro = (erro, contexto = '') => {
    // Extrai o código de erro retornado pelo back-end
    const codigoErro = erro.codigo || 'CRM-0000';
    const statusHttp = erro.statusHttp || 500;

    // Busca a mensagem amigável mapeada ou usa a mensagem do erro
    const mensagemAmigavel = MENSAGENS_ERRO[codigoErro]
      || erro.message
      || 'Ocorreu um erro inesperado. Tente novamente.';

    // Formata a mensagem com o código para facilitar o suporte
    const mensagemFinal = `${mensagemAmigavel} (${codigoErro})`;

    // Exibe o toast de erro
    adicionarNotificacao('error', mensagemFinal, 6000);

    // Captura erros 5xx no Sentry (erros do servidor, não do usuário)
    if (statusHttp >= 500) {
      Sentry.captureException(erro, {
        extra: {
          contexto,
          codigoErro,
          mensagem: erro.message,
        },
      });
    }

    // Log no console em desenvolvimento
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.error(`[${codigoErro}] ${contexto}:`, erro);
    }
  };

  /**
   * Exibe uma notificação de sucesso.
   * @param {string} mensagem
   */
  const tratarSucesso = (mensagem) => {
    adicionarNotificacao('success', mensagem);
  };

  /**
   * Exibe uma notificação de aviso.
   * @param {string} mensagem
   */
  const tratarAviso = (mensagem) => {
    adicionarNotificacao('warning', mensagem);
  };

  /**
   * Exibe uma notificação informativa.
   * @param {string} mensagem
   */
  const tratarInfo = (mensagem) => {
    adicionarNotificacao('info', mensagem);
  };

  return {
    tratarErro,
    tratarSucesso,
    tratarAviso,
    tratarInfo,
  };
};
