// =============================================================
// PRANCHETO.IA - IDENTIDADE VISUAL DA ORGANIZAÇÃO
//
// Traduz o que está salvo em tenants.identidade_visual para as CSS
// variables que o Tailwind consome (ver index.css e tailwind.config.js).
//
// A paleta primary-* inteira é derivada de uma única cor. Assim
// bg-primary-600, text-primary-300 e ring-primary-500/50 — já espalhados
// por toda a interface — passam a seguir a marca do tenant sem que
// nenhuma tela precise saber que isto existe.
//
// As variáveis guardam canais RGB ("99 102 241") em vez de hex porque o
// Tailwind injeta a opacidade das classes com barra dentro de
// rgb(<canais> / <alpha-value>). Hex ali não funcionaria.
//
// NADA É APLICADO SEM identidade_visual.aplicar = true.
// O padrão de cor_secundaria no banco é #000000: aplicar por conta
// própria deixaria a barra lateral preta em todo tenant que nunca
// personalizou nada. Quem liga é o administrador, na própria tela.
// =============================================================

/** Espelha o default da coluna tenants.identidade_visual, mais a chave. */
export const IDENTIDADE_PADRAO = {
  cor_primaria:   '#1e3a5f',
  cor_secundaria: '#000000',
  cor_acento:     '#ffffff',
  fonte:          'Inter',
  aplicar:        false,
};

/**
 * Fontes oferecidas ao administrador. Também é a lista de famílias que
 * podemos buscar no Google Fonts — o valor vem do banco, então carregar
 * só o que está aqui evita montar URL com conteúdo arbitrário.
 */
export const FONTES_DISPONIVEIS = [
  { label: 'Inter (padrão)', valor: 'Inter' },
  { label: 'Roboto',         valor: 'Roboto' },
  { label: 'Poppins',        valor: 'Poppins' },
  { label: 'Nunito',         valor: 'Nunito' },
  { label: 'Open Sans',      valor: 'Open Sans' },
];

const TONS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Quanto cada tom se afasta da cor base, aproximando-se do branco (tons
// claros) ou do preto (tons escuros). Os pesos reproduzem a proporção da
// paleta indigo que o produto usa por padrão.
const PESO_CLARO  = { 50: 0.95, 100: 0.90, 200: 0.78, 300: 0.62, 400: 0.36 };
const PESO_ESCURO = { 600: 0.12, 700: 0.24, 800: 0.36, 900: 0.48, 950: 0.68 };

const BRANCO = [255, 255, 255];
const PRETO  = [0, 0, 0];

const HEX_VALIDO = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Converte '#6366f1' (ou '#63f') em [99, 102, 241]. Null se inválido. */
const paraRgb = (hex) => {
  if (typeof hex !== 'string') return null;
  const limpo = hex.trim();
  if (!HEX_VALIDO.test(limpo)) return null;
  const digitos = limpo.slice(1);
  const cheio = digitos.length === 3
    ? digitos.split('').map((c) => c + c).join('')
    : digitos;
  return [0, 2, 4].map((i) => parseInt(cheio.slice(i, i + 2), 16));
};

const misturar = (rgb, alvo, peso) =>
  rgb.map((canal, i) => Math.round(canal + (alvo[i] - canal) * peso));

/**
 * Gera os 11 tons da paleta primary a partir de uma cor.
 * @param {string} hex - Cor base, que vira o tom 500
 * @returns {Record<number, string>|null} tom → canais RGB, ou null se a cor for inválida
 */
export const gerarRampaPrimaria = (hex) => {
  const base = paraRgb(hex);
  if (!base) return null;

  const rampa = { 500: base.join(' ') };
  Object.entries(PESO_CLARO).forEach(([tom, peso]) => {
    rampa[tom] = misturar(base, BRANCO, peso).join(' ');
  });
  Object.entries(PESO_ESCURO).forEach(([tom, peso]) => {
    rampa[tom] = misturar(base, PRETO, peso).join(' ');
  });
  return rampa;
};

// ----------------------------------------------------------
// APLICAÇÃO NO DOM
// ----------------------------------------------------------
const VAR_CONTRASTE  = '--brand-contraste';
const VAR_SUPERFICIE = '--brand-superficie';
const VAR_FONTE      = '--brand-fonte';

const TODAS_AS_VARS = [
  ...TONS.map((tom) => `--color-primary-${tom}`),
  VAR_CONTRASTE,
  VAR_SUPERFICIE,
  VAR_FONTE,
];

const ID_LINK_FONTE = 'prancheto-fonte-marca';

/**
 * Garante o <link> do Google Fonts da família escolhida.
 * O app não embarca nenhuma fonte: sem isto, trocar a fonte na tela não
 * mudaria nada, porque o navegador cairia no system-ui.
 */
const carregarFonte = (familia) => {
  if (!FONTES_DISPONIVEIS.some((f) => f.valor === familia)) return;

  const nomeNaUrl = familia.trim().replace(/\s+/g, '+');
  const href = `https://fonts.googleapis.com/css2?family=${nomeNaUrl}:wght@400;500;600;700&display=swap`;

  let link = document.getElementById(ID_LINK_FONTE);
  if (!link) {
    link = document.createElement('link');
    link.id  = ID_LINK_FONTE;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') !== href) link.setAttribute('href', href);
};

const limparVars = () => {
  const raiz = document.documentElement;
  TODAS_AS_VARS.forEach((nome) => raiz.style.removeProperty(nome));
};

/**
 * Reflete a identidade visual do tenant nas CSS variables do documento.
 * Com aplicar = false, remove tudo e a interface volta à marca do produto
 * (os valores de :root em index.css).
 *
 * @param {object|null} identidade - Conteúdo de tenants.identidade_visual
 */
export const aplicarIdentidadeNoDOM = (identidade) => {
  if (!identidade?.aplicar) {
    limparVars();
    return;
  }

  const raiz = document.documentElement;

  // Cor primária: alimenta a paleta primary-* inteira. Cor inválida
  // volta para a paleta do produto em vez de deixar o app sem cor.
  const rampa = gerarRampaPrimaria(identidade.cor_primaria);
  TONS.forEach((tom) => {
    const nome = `--color-primary-${tom}`;
    if (rampa) raiz.style.setProperty(nome, rampa[tom]);
    else raiz.style.removeProperty(nome);
  });

  const definirCor = (nome, hex) => {
    if (paraRgb(hex)) raiz.style.setProperty(nome, hex.trim());
    else raiz.style.removeProperty(nome);
  };

  definirCor(VAR_CONTRASTE,  identidade.cor_acento);
  definirCor(VAR_SUPERFICIE, identidade.cor_secundaria);

  if (FONTES_DISPONIVEIS.some((f) => f.valor === identidade.fonte)) {
    carregarFonte(identidade.fonte);
    raiz.style.setProperty(VAR_FONTE, `'${identidade.fonte}'`);
  } else {
    raiz.style.removeProperty(VAR_FONTE);
  }
};

/** Completa o que vier do banco com os padrões, para as telas não checarem campo a campo. */
export const normalizarIdentidade = (identidadeSalva) => ({
  ...IDENTIDADE_PADRAO,
  ...(identidadeSalva || {}),
});
