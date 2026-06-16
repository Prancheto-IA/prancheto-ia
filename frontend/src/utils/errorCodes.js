// =============================================================
// PRANCHETO.IA - MAPEAMENTO DE CÓDIGOS DE ERRO
// Traduz os códigos de erro retornados pelo back-end em mensagens
// amigáveis para o usuário final.
//
// Formato dos códigos: CRM-XXXX
//   CRM-04XX → Erros do cliente (dados inválidos, não autorizado)
//   CRM-05XX → Erros do servidor (falhas internas)
//   CRM-XXXX → Erros específicos de módulos
// =============================================================

/**
 * Mapeamento de códigos de erro para mensagens amigáveis em português.
 * Adicione novos códigos aqui conforme o sistema crescer.
 */
export const MENSAGENS_ERRO = {
  // --- ERROS DE AUTENTICAÇÃO ---
  'CRM-0401': 'Sessão expirada ou credenciais inválidas. Faça login novamente.',
  'CRM-0403': 'Você não tem permissão para realizar esta ação.',
  'CRM-0404': 'O recurso solicitado não foi encontrado.',
  'CRM-0409': 'Este registro já existe no sistema.',
  'CRM-0429': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',

  // --- ERROS DE VALIDAÇÃO ---
  'CRM-0400': 'Dados inválidos. Verifique os campos e tente novamente.',

  // --- ERROS DO SERVIDOR ---
  'CRM-0500': 'Erro interno do servidor. Nossa equipe foi notificada.',
  'CRM-0503': 'Serviço temporariamente indisponível. Tente novamente em instantes.',

  // --- ERROS GENÉRICOS ---
  'CRM-0000': 'Ocorreu um erro inesperado. Tente novamente ou contate o suporte.',

  // --- ERROS DE MÓDULOS ESPECÍFICOS ---
  // Adicione aqui conforme novos módulos forem criados
  // 'CRM-1001': 'Erro ao carregar os leads.',
  // 'CRM-1002': 'Erro ao salvar o contato.',
};

/**
 * Retorna a mensagem amigável para um código de erro.
 * @param {string} codigo - Código de erro (ex: 'CRM-0401')
 * @param {string} fallback - Mensagem padrão se o código não for encontrado
 * @returns {string}
 */
export const obterMensagemErro = (codigo, fallback = MENSAGENS_ERRO['CRM-0000']) => {
  return MENSAGENS_ERRO[codigo] || fallback;
};
