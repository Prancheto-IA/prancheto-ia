// =============================================================
// PRANCHETO.IA - IDENTIFICACAO DO AMBIENTE
//
// Fonte unica de "onde estou". O rotulo e derivado do ambiente, e nao
// digitado numa variavel: VITE_APP_NAME deveria trazer o sufixo [DEV]
// no preview e nao trazia, entao dev e producao ficaram visualmente
// identicos dentro da aplicacao sem ninguem perceber. Configuracao de
// painel diverge em silencio; codigo derivado, nao.
//
// VITE_APP_NAME segue valendo para o nome, caso alguem queira
// personalizar — mas quem decide o sufixo e o ambiente.
// =============================================================

const NOME_PADRAO = 'Prancheto.IA';

/** 'production', 'development', ou o modo do Vite quando a var falta. */
export const ambiente = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;

export const isProducao = ambiente === 'production';

/**
 * Sufixo curto do ambiente. Vazio em producao: o cliente nao precisa
 * ver rotulo nenhum, e um "[PROD]" na tela dele nao significa nada.
 */
export const ROTULO_AMBIENTE = isProducao
  ? ''
  : (ambiente === 'development' ? 'DEV' : String(ambiente).toUpperCase());

// Remove um sufixo entre colchetes ja existente, para nao gerar
// "Prancheto.IA [DEV] [DEV]" se a variavel for corrigida no painel
// depois — as duas fontes deixam de brigar.
const nomeBase = String(import.meta.env.VITE_APP_NAME || NOME_PADRAO)
  .replace(/\s*\[[^\]]*\]\s*$/, '')
  .trim() || NOME_PADRAO;

/** Nome do produto para exibicao, ja com o ambiente quando nao for producao. */
export const NOME_PRODUTO = ROTULO_AMBIENTE
  ? `${nomeBase} [${ROTULO_AMBIENTE}]`
  : nomeBase;

/**
 * Marca o ambiente no titulo da aba.
 *
 * A aba e onde a confusao acontece de verdade: com dev e producao
 * abertos lado a lado, o titulo e a unica parte visivel de quem esta
 * em segundo plano.
 */
export const aplicarTituloDoAmbiente = () => {
  if (typeof document !== 'undefined') document.title = NOME_PRODUTO;
};
