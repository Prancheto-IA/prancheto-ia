// =============================================================
// PRANCHETO.IA - IMPORTAÇÃO & EXPORTAÇÃO DE DADOS CRM
// Permite importar contatos de planilhas e CRMs externos (RD Station,
// HubSpot, Pipedrive, Salesforce, CSV/XLSX) com mapeamento inteligente "De-Para",
// deduplicação configurável e execução em lotes. Também permite exportação
// completa com suporte a Excel (.xlsx), CSV (com BOM para Excel BR) e JSON.
// Prioriza componentes e padrões visuais do ReUI e Emitly Design System.
// =============================================================

import React, { useState, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase.js';
import { useAuthStore } from '../../../store/authStore.js';
import { Badge } from '@/components/reui/badge';
import { Switch } from '@/components/reui/switch';
import { SimpleTooltip } from '@/components/reui/tooltip';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Download01Icon,
  Upload01Icon,
  FileImportIcon,
  FileExportIcon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  AlertCircleIcon,
  ArrowRight01Icon,
  RefreshIcon,
  DocumentValidationIcon,
  Folder01Icon,
  DatabaseIcon,
  Settings02Icon,
  EyeIcon,
  HelpCircleIcon,
  Delete02Icon,
  UserGroupIcon,
  AiSparklesIcon,
} from '@hugeicons/core-free-icons';

// ─── ÍCONES SVG OFICIAIS DOS CRMS ─────────────────────────────
const IconeRDStation = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 252 300" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M245.331 62.79C243.742 56.97 239.944 51.72 234.576 47.69C206.479 26.57 173.055 10.76 136.692 1.36C133.163 0.45 129.515 0 125.857 0C122.198 0 118.55 0.45 115.022 1.36C78.6486 10.76 45.2241 26.57 17.1271 47.69C11.7596 51.72 7.95133 56.98 6.37206 62.79C2.184 78.13 0.0949707 93.76 0.0949707 109.38V190.62C0.0949707 206.25 2.184 221.88 6.37206 237.21C7.95133 243.03 11.7596 248.28 17.1271 252.32C45.2241 273.43 78.6486 289.25 115.022 298.64C118.55 299.55 122.198 300 125.857 300C129.515 300 133.173 299.55 136.692 298.64C173.055 289.25 206.489 273.43 234.586 252.32C239.954 248.28 243.762 243.03 245.341 237.21C249.529 221.88 251.619 206.25 251.619 190.62V109.38C251.619 93.76 249.529 78.13 245.341 62.79M241.853 155.33C240.434 160.52 237.085 165.22 232.168 168.92C218.374 179.28 203.161 188.44 186.948 196.1C170.746 203.78 153.474 210 135.622 214.6C132.444 215.41 129.175 215.83 125.857 215.83C122.538 215.83 119.26 215.42 116.091 214.6C98.2395 210 80.9675 203.77 64.765 196.1C48.5525 188.43 33.3496 179.28 19.546 168.92C14.6182 165.23 11.2698 160.52 9.86045 155.33C8.92089 151.84 8.92089 148.17 9.86045 144.68C11.2698 139.49 14.6182 134.79 19.546 131.09C33.3396 120.73 48.5525 111.57 64.765 103.91C80.9675 96.23 98.2395 90.01 116.091 85.4C119.26 84.59 122.538 84.18 125.857 84.18C129.175 84.18 132.454 84.59 135.622 85.4C153.474 90.01 170.746 96.24 186.948 103.91C203.161 111.58 218.374 120.73 232.168 131.09C237.085 134.78 240.434 139.48 241.853 144.68C242.803 148.17 242.803 151.84 241.853 155.33Z"
      fill="#00A3FF"
    />
  </svg>
);

const IconeHubSpot = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#FF7A59" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z" />
  </svg>
);

const IconePipedrive = ({ className = 'w-4 h-5' }) => (
  <svg viewBox="0 20 75 100" className={className} fill="#027737" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.14 23.65C33.85 23.65 27.9 28.27 25.03 31.46 24.69 28.71 22.88 25.14 15.8 25.14H0.44v16.08h6.3c1.06 0 1.4.34 1.4 1.4v73.41h18.32V88.48c0-.74-.02-1.44-.04-2.06 2.86 2.63 8.32 6.24 16.86 6.24 17.9 0 30.4-14.18 30.4-34.5 0-20.64-11.88-34.51-29.54-34.51zm-3.72 53.07c-9.86 0-14.34-9.44-14.34-18.18 0-13.78 7.54-18.69 14.58-18.69 8.65 0 14.46 7.45 14.46 18.55 0 12.66-7.39 18.32-14.7 18.32z" />
  </svg>
);

const IconeSalesforce = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="#00A1E0" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.176 5.22c-.345 0-.69-.044-1.02-.104a3.75 3.75 0 01-3.3 1.95c-.6 0-1.155-.15-1.65-.375A4.314 4.314 0 018.88 20.4a4.302 4.302 0 01-4.05-2.82c-.27.062-.54.076-.825.076-2.204 0-4.005-1.8-4.005-4.05 0-1.5.811-2.805 2.01-3.51-.255-.57-.39-1.2-.39-1.846 0-2.58 2.1-4.65 4.65-4.65 1.53 0 2.85.705 3.72 1.8" />
  </svg>
);

// ─── CAMPOS DISPONÍVEIS NO CRM PRANCHETO ──────────────────────
const CAMPOS_CRM = [
  { key: 'ignorar', label: '— Não importar (Ignorar) —', obrigatorio: false, grupo: 'sistema' },
  { key: 'nome', label: 'Nome Completo', obrigatorio: true, desc: 'Identificação principal do cliente ou contato', grupo: 'principal' },
  { key: 'email', label: 'E-mail', obrigatorio: false, desc: 'Contato por e-mail e identificação única', grupo: 'contato' },
  { key: 'telefone', label: 'Telefone Fixo / Comercial', obrigatorio: false, desc: 'Telefone de contato', grupo: 'contato' },
  { key: 'whatsapp', label: 'WhatsApp / Celular', obrigatorio: false, desc: 'Número móvel com DDD', grupo: 'contato' },
  { key: 'empresa', label: 'Empresa / Razão Social', obrigatorio: false, desc: 'Nome da organização', grupo: 'corporativo' },
  { key: 'cargo', label: 'Cargo / Função', obrigatorio: false, desc: 'Cargo dentro da empresa', grupo: 'corporativo' },
  { key: 'status_funil', label: 'Etapa do Funil', obrigatorio: false, desc: 'Não Chamei, Chamei, Chamar Novamente, etc.', grupo: 'pipeline' },
  { key: 'valor_estimado', label: 'Valor Estimado (R$)', obrigatorio: false, desc: 'Valor em reais do negócio ou potencial', grupo: 'pipeline' },
  { key: 'negocio_nome', label: 'Nome da Oportunidade', obrigatorio: false, desc: 'Título do negócio comercial', grupo: 'pipeline' },
  { key: 'origem', label: 'Origem do Contato', obrigatorio: false, desc: 'Ex: RD Station, Site, Indicação, etc.', grupo: 'aquisicao' },
  { key: 'tags', label: 'Tags (Etiquetas)', obrigatorio: false, desc: 'Tags separadas por vírgula ou ponto-e-vírgula', grupo: 'geral' },
  { key: 'observacoes', label: 'Observações / Notas', obrigatorio: false, desc: 'Anotações e histórico', grupo: 'geral' },
  { key: 'documento', label: 'CPF / CNPJ', obrigatorio: false, desc: 'Identificação fiscal', grupo: 'corporativo' },
  { key: 'site', label: 'Website / URL', obrigatorio: false, desc: 'Página da web', grupo: 'corporativo' },
  { key: 'segmento', label: 'Segmento / Nicho', obrigatorio: false, desc: 'Ramo de atuação', grupo: 'corporativo' },
  { key: 'endereco', label: 'Endereço / Cidade / UF', obrigatorio: false, desc: 'Localização geográfica', grupo: 'contato' },
];

// Dicionário de Sinônimos para Matching Automático Inteligente
const SINONIMOS_CAMPOS = {
  nome: ['nome', 'name', 'full name', 'fullname', 'primeiro nome', 'first name', 'contato', 'cliente', 'lead', 'pessoa', 'razao social', 'nome completo', 'lead name', 'contact name'],
  email: ['email', 'e-mail', 'mail', 'correio', 'endereço de email', 'electronic mail', 'email address', 'contato email'],
  telefone: ['telefone', 'tel', 'phone', 'fone', 'telefone fixo', 'comercial', 'telephone', 'phone number', 'work phone'],
  whatsapp: ['whatsapp', 'whats', 'celular', 'mobile', 'zap', 'mobile phone', 'telefone celular', 'whatsapp number'],
  empresa: ['empresa', 'company', 'organization', 'organização', 'organizacao', 'conta', 'account', 'nome da empresa', 'company name'],
  cargo: ['cargo', 'title', 'job title', 'função', 'funcao', 'ocupação', 'ocupacao', 'position', 'role'],
  status_funil: ['status', 'etapa', 'fase', 'stage', 'funil', 'pipeline stage', 'lifecycle stage', 'fase do funil', 'estágio', 'estagio'],
  valor_estimado: ['valor', 'value', 'amount', 'deal value', 'preço', 'preco', 'quantia', 'valor da oportunidade', 'valor estimado'],
  negocio_nome: ['negocio', 'deal', 'oportunidade', 'deal name', 'nome do negócio', 'nome do negocio', 'titulo do negocio'],
  origem: ['origem', 'source', 'lead source', 'canal', 'fonte', 'utm_source', 'meio de entrada'],
  tags: ['tag', 'tags', 'etiqueta', 'etiquetas', 'labels', 'marcadores', 'categorias'],
  observacoes: ['observacoes', 'observações', 'notas', 'notes', 'comments', 'comentarios', 'descrição', 'descricao', 'detalhes', 'histórico'],
  documento: ['documento', 'cpf', 'cnpj', 'cpf/cnpj', 'tax id', 'doc', 'identidade'],
  site: ['site', 'website', 'url', 'webpage', 'pagina', 'link'],
  segmento: ['segmento', 'nicho', 'setor', 'industry', 'ramo', 'mercado'],
  endereco: ['endereco', 'endereço', 'cidade', 'city', 'address', 'localização', 'uf', 'estado', 'bairro'],
};

// Presets pré-configurados para CRMs populares
const PRESETS_CRM = [
  { id: 'auto', nome: 'Qualquer Planilha', desc: 'Identifica as colunas automaticamente', tipoIcone: 'hugeicon' },
  { id: 'rd', nome: 'RD Station CRM', desc: 'Arquivo exportado do RD Station', tipoIcone: 'rd' },
  { id: 'hubspot', nome: 'HubSpot', desc: 'Arquivo exportado do HubSpot', tipoIcone: 'hubspot' },
  { id: 'pipedrive', nome: 'Pipedrive', desc: 'Arquivo exportado do Pipedrive', tipoIcone: 'pipedrive' },
  { id: 'salesforce', nome: 'Salesforce', desc: 'Arquivo exportado do Salesforce', tipoIcone: 'salesforce' },
];

// Helper: Normalização de etapas de CRM
function normalizarEtapa(valor) {
  if (!valor) return 'nao_chamei';
  const str = String(valor).toLowerCase().trim();
  if (str.includes('chamar novamente') || str.includes('follow') || str.includes('negociação') || str.includes('proposta') || str.includes('negotiat')) {
    return 'chamar_novamente';
  }
  if (str.includes('fechad') || str.includes('ganh') || str.includes('bom') || str.includes('won') || str.includes('convertid') || str.includes('vendid')) {
    return 'deu_bom';
  }
  if (str.includes('perdid') || str.includes('ruim') || str.includes('lost') || str.includes('desqualificad') || str.includes('cancelad')) {
    return 'deu_ruim';
  }
  if (str.includes('chamei') || str.includes('contatad') || str.includes('apresenta') || str.includes('reuni') || str.includes('qualificad')) {
    return 'chamei';
  }
  return 'nao_chamei';
}

// Helper: Formata valor para moeda
function normalizarMoeda(valor) {
  if (valor == null || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  const limpo = String(valor).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : num;
}

// =============================================================
// COMPONENTE PRINCIPAL: SEÇÃO IMPORTAR & EXPORTAR
// =============================================================
export default function SecaoImportarExportar() {
  const { usuario } = useAuthStore();
  const [modoAba, setModoAba] = useState('importar'); // 'importar' | 'exportar' | 'historico'

  // ─── ESTADOS DA IMPORTAÇÃO ───
  const [passoAtual, setPassoAtual] = useState(1); // 1: Arquivo, 2: De-Para, 3: Regras, 4: Execução
  const [arquivo, setArquivo] = useState(null);
  const [presetSelecionado, setPresetSelecionado] = useState('auto');
  const [colunasArquivo, setColunasArquivo] = useState([]);
  const [linhasArquivo, setLinhasArquivo] = useState([]);
  const [mapeamento, setMapeamento] = useState({}); // { [colunaArquivo]: campoCrmKey }
  const [confiancaMatch, setConfiancaMatch] = useState({}); // { [colunaArquivo]: 'exato' | 'sugerido' | 'nenhum' }

  // Opções de Negócio na Importação
  const [estrategiaDuplicados, setEstrategiaDuplicados] = useState('atualizar'); // 'atualizar' | 'ignorar' | 'criar_sempre'
  const [chaveDeduplicacao, setChaveDeduplicacao] = useState('email'); // 'email' | 'telefone' | 'ambos'
  const [tipoRegistroPadrao, setTipoRegistroPadrao] = useState('cliente'); // 'cliente' | 'lead'
  const [etapaPadrao, setEtapaPadrao] = useState('nao_chamei');
  const [tagExtra, setTagExtra] = useState('');

  // Progresso da Importação
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState({ processados: 0, total: 0, criados: 0, atualizados: 0, erros: 0 });
  const [relatorioFinal, setRelatorioFinal] = useState(null);
  const [historicoLocal, setHistoricoLocal] = useState(() => {
    try {
      const salvo = localStorage.getItem('prancheto_historico_importacoes');
      return salvo ? JSON.parse(salvo) : [];
    } catch (_e) {
      return [];
    }
  });

  // ─── ESTADOS DA EXPORTAÇÃO ───
  const [formatoExportacao, setFormatoExportacao] = useState('xlsx'); // 'xlsx' | 'csv' | 'json'
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'cliente' | 'lead'
  const [filtroEtapa, setFiltroEtapa] = useState('todas');
  const [colunasExportar, setColunasExportar] = useState({
    nome: true,
    email: true,
    telefone: true,
    whatsapp: true,
    empresa: true,
    cargo: true,
    status_funil: true,
    valor_estimado: true,
    negocio_nome: true,
    origem: true,
    tags: true,
    observacoes: true,
    documento: true,
    score: true,
    criado_em: true,
  });
  const [exportando, setExportando] = useState(false);
  const [mensagemExportacao, setMensagemExportacao] = useState('');

  const inputArquivoRef = useRef(null);

  // ─── FUNÇÃO DE AUTO-MAPEAMENTO (FUZZY SYNONYMS) ───
  const autoMapearColunas = (colunas, linhasExemplo = []) => {
    const novoMapeamento = {};
    const novaConfianca = {};
    const camposJaAtribuidos = new Set();

    colunas.forEach((col) => {
      const colNorm = col.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

      // 1. Tenta correspondência exata
      let matchEncontrado = null;
      let tipoMatch = 'nenhum';

      for (const [campoKey, sinonimos] of Object.entries(SINONIMOS_CAMPOS)) {
        if (camposJaAtribuidos.has(campoKey)) continue;

        const sinonimoExato = sinonimos.some(s => s.replace(/[^a-z0-9]/g, '') === colNorm);
        if (sinonimoExato) {
          matchEncontrado = campoKey;
          tipoMatch = 'exato';
          break;
        }
      }

      // 2. Se não achou exato, tenta substring/fuzzy
      if (!matchEncontrado) {
        for (const [campoKey, sinonimos] of Object.entries(SINONIMOS_CAMPOS)) {
          if (camposJaAtribuidos.has(campoKey)) continue;

          const matchFuzzy = sinonimos.some(s => {
            const sNorm = s.replace(/[^a-z0-9]/g, '');
            return colNorm.includes(sNorm) || sNorm.includes(colNorm);
          });

          if (matchFuzzy) {
            matchEncontrado = campoKey;
            tipoMatch = 'sugerido';
            break;
          }
        }
      }

      // 3. Heurística pelo conteúdo da 1ª linha caso ainda não encontrou
      if (!matchEncontrado && linhasExemplo.length > 0) {
        const valorExemplo = String(linhasExemplo[0][col] || '').trim();
        if (!camposJaAtribuidos.has('email') && valorExemplo.includes('@') && valorExemplo.includes('.')) {
          matchEncontrado = 'email';
          tipoMatch = 'sugerido';
        } else if (!camposJaAtribuidos.has('whatsapp') && /^\+?[0-9\s()-]{8,20}$/.test(valorExemplo)) {
          matchEncontrado = 'whatsapp';
          tipoMatch = 'sugerido';
        }
      }

      if (matchEncontrado) {
        novoMapeamento[col] = matchEncontrado;
        novaConfianca[col] = tipoMatch;
        camposJaAtribuidos.add(matchEncontrado);
      } else {
        novoMapeamento[col] = 'ignorar';
        novaConfianca[col] = 'nenhum';
      }
    });

    setMapeamento(novoMapeamento);
    setConfiancaMatch(novaConfianca);
  };

  // ─── LEITURA DO ARQUIVO (CSV / EXCEL) ───
  const processarArquivo = (file) => {
    if (!file) return;
    setArquivo(file);
    setRelatorioFinal(null);

    const extensao = file.name.split('.').pop().toLowerCase();

    if (extensao === 'csv' || extensao === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const cols = results.meta.fields || Object.keys(results.data[0]);
            setColunasArquivo(cols);
            setLinhasArquivo(results.data);
            autoMapearColunas(cols, results.data);
            setPassoAtual(2);
          } else {
            alert('O arquivo selecionado não contém linhas válidas de dados.');
          }
        },
        error: (err) => {
          alert(`Erro ao ler arquivo CSV: ${err.message}`);
        },
      });
    } else if (extensao === 'xlsx' || extensao === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (jsonData && jsonData.length > 0) {
            const cols = Object.keys(jsonData[0]);
            setColunasArquivo(cols);
            setLinhasArquivo(jsonData);
            autoMapearColunas(cols, jsonData);
            setPassoAtual(2);
          } else {
            alert('A planilha Excel está vazia ou sem dados na primeira aba.');
          }
        } catch (err) {
          alert(`Erro ao processar planilha Excel: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Formato de arquivo não suportado. Por favor, utilize .csv ou .xlsx.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  };

  // ─── GERAR MODELO CSV / XLSX PARA DOWNLOAD ───
  const baixarModelo = (tipo = 'csv') => {
    const dadosModelo = [
      {
        'Nome Completo': 'Lucas Silva Santos',
        'E-mail': 'lucas.santos@empresaexemplo.com.br',
        'Telefone': '(11) 3214-5500',
        'WhatsApp': '(11) 98765-4321',
        'Empresa': 'Tech Soluções Ltda',
        'Cargo': 'Diretor Comercial',
        'Etapa': 'Não Chamei',
        'Valor Estimado': '15000',
        'Origem': 'RD Station',
        'Tags': 'lead-qualificado, inbound',
        'Observações': 'Entrou em contato pedindo demonstração da plataforma.',
      },
      {
        'Nome Completo': 'Mariana Oliveira Costa',
        'E-mail': 'mariana.costa@inovare.com',
        'Telefone': '(21) 2500-1122',
        'WhatsApp': '(21) 99123-8877',
        'Empresa': 'Inovare Consultoria',
        'Cargo': 'Head de Operações',
        'Etapa': 'Chamei',
        'Valor Estimado': '28000',
        'Origem': 'Indicação',
        'Tags': 'vip, decisor',
        'Observações': 'Apresentação agendada para próxima terça-feira.',
      },
    ];

    if (tipo === 'csv') {
      const csvContent = '\uFEFF' + Papa.unparse(dadosModelo, { delimiter: ';' });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modelo_importacao_prancheto_crm.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const ws = XLSX.utils.json_to_sheet(dadosModelo);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Modelo Contatos');
      XLSX.writeFile(wb, 'modelo_importacao_prancheto_crm.xlsx');
    }
  };

  // ─── VALIDAÇÕES E PRÉVIA ───
  const colunaMapeadaNome = useMemo(() => {
    return Object.entries(mapeamento).find(([_, val]) => val === 'nome')?.[0];
  }, [mapeamento]);

  const linhasPreviewTransformadas = useMemo(() => {
    return linhasArquivo.slice(0, 5).map((linhaOriginal) => {
      const objTransformado = {};
      Object.entries(mapeamento).forEach(([colOrig, campoCrm]) => {
        if (campoCrm && campoCrm !== 'ignorar') {
          objTransformado[campoCrm] = linhaOriginal[colOrig];
        }
      });
      return objTransformado;
    });
  }, [linhasArquivo, mapeamento]);

  // ─── EXECUÇÃO DA IMPORTAÇÃO EM LOTES (CHUNKS) ───
  const executarImportacao = async () => {
    if (!colunaMapeadaNome) {
      alert('A coluna "Nome Completo" é obrigatória para a importação.');
      setPassoAtual(2);
      return;
    }

    setImportando(true);
    const totalLinhas = linhasArquivo.length;
    let criados = 0;
    let atualizados = 0;
    let erros = 0;

    setProgresso({ processados: 0, total: totalLinhas, criados: 0, atualizados: 0, erros: 0 });

    try {
      // 1. Busca dados existentes para conferência de duplicatas
      let existentesMap = new Map(); // email/telefone -> id
      if (estrategiaDuplicados !== 'criar_sempre') {
        const { data: existentes } = await supabase
          .from('crm_contatos')
          .select('id, email, telefone, whatsapp')
          .limit(5000);

        if (existentes) {
          existentes.forEach((e) => {
            if (e.email) existentesMap.set(String(e.email).toLowerCase().trim(), e.id);
            if (e.telefone) existentesMap.set(String(e.telefone).replace(/\D/g, ''), e.id);
            if (e.whatsapp) existentesMap.set(String(e.whatsapp).replace(/\D/g, ''), e.id);
          });
        }
      }

      // 2. Processa em lotes de 50 registros
      const tamanhoLote = 50;
      for (let i = 0; i < totalLinhas; i += tamanhoLote) {
        const loteLinhas = linhasArquivo.slice(i, i + tamanhoLote);
        const paraInserir = [];
        const paraAtualizar = [];

        for (const linhaOriginal of loteLinhas) {
          const dadosContato = {
            tipo_registro: tipoRegistroPadrao,
            status_funil: etapaPadrao,
            tenant_id: usuario?.tenant_id || null,
            responsavel_id: usuario?.id || null,
          };

          // Aplica mapeamento De-Para
          Object.entries(mapeamento).forEach(([colOrig, campoCrm]) => {
            if (campoCrm && campoCrm !== 'ignorar') {
              const val = linhaOriginal[colOrig];
              if (val != null && String(val).trim() !== '') {
                if (campoCrm === 'valor_estimado') {
                  dadosContato[campoCrm] = normalizarMoeda(val);
                } else if (campoCrm === 'status_funil') {
                  dadosContato[campoCrm] = normalizarEtapa(val);
                } else if (campoCrm === 'tags') {
                  const tagsArr = String(val).split(/[,;]/).map(t => t.trim()).filter(Boolean);
                  if (tagExtra) tagsArr.push(tagExtra.trim());
                  dadosContato[campoCrm] = tagsArr;
                } else {
                  dadosContato[campoCrm] = String(val).trim();
                }
              }
            }
          });

          // Se não havia tags na linha mas tem tag extra
          if (!dadosContato.tags && tagExtra) {
            dadosContato.tags = [tagExtra.trim()];
          }

          // Se não tiver nome, ignora registro
          if (!dadosContato.nome) {
            erros++;
            continue;
          }

          // Verifica duplicidade
          let idExistente = null;
          const emailLimpo = dadosContato.email ? String(dadosContato.email).toLowerCase().trim() : null;
          const telLimpo = dadosContato.telefone ? String(dadosContato.telefone).replace(/\D/g, '') : null;
          const whatsLimpo = dadosContato.whatsapp ? String(dadosContato.whatsapp).replace(/\D/g, '') : null;

          if (chaveDeduplicacao === 'email' && emailLimpo) {
            idExistente = existentesMap.get(emailLimpo);
          } else if (chaveDeduplicacao === 'telefone' && (telLimpo || whatsLimpo)) {
            idExistente = existentesMap.get(whatsLimpo || telLimpo);
          } else if (chaveDeduplicacao === 'ambos') {
            idExistente = (emailLimpo && existentesMap.get(emailLimpo)) ||
              (whatsLimpo && existentesMap.get(whatsLimpo)) ||
              (telLimpo && existentesMap.get(telLimpo));
          }

          if (idExistente && estrategiaDuplicados === 'atualizar') {
            paraAtualizar.push({ id: idExistente, ...dadosContato });
          } else if (idExistente && estrategiaDuplicados === 'ignorar') {
            // Ignorado intencionalmente
          } else {
            paraInserir.push(dadosContato);
          }
        }

        // Executa Inserções no Supabase
        if (paraInserir.length > 0) {
          const { error: erroInsert } = await supabase.from('crm_contatos').insert(paraInserir);
          if (erroInsert) {
            console.error('Erro ao inserir lote:', erroInsert);
            erros += paraInserir.length;
          } else {
            criados += paraInserir.length;
          }
        }

        // Executa Atualizações no Supabase
        if (paraAtualizar.length > 0) {
          for (const item of paraAtualizar) {
            const { id, ...camposAtualizar } = item;
            const { error: erroUp } = await supabase
              .from('crm_contatos')
              .update({ ...camposAtualizar, atualizado_em: new Date().toISOString() })
              .eq('id', id);

            if (erroUp) {
              erros++;
            } else {
              atualizados++;
            }
          }
        }

        const processadosAteAgora = Math.min(i + tamanhoLote, totalLinhas);
        setProgresso({
          processados: processadosAteAgora,
          total: totalLinhas,
          criados,
          atualizados,
          erros,
        });
      }

      // Finalização com Relatório
      const relatorio = {
        data: new Date().toISOString(),
        arquivo: arquivo?.name || 'arquivo.csv',
        total: totalLinhas,
        criados,
        atualizados,
        erros,
        taxaSucesso: Math.round(((criados + atualizados) / (totalLinhas || 1)) * 100),
      };

      setRelatorioFinal(relatorio);

      // Salva no histórico local
      const novoHistorico = [relatorio, ...historicoLocal.slice(0, 19)];
      setHistoricoLocal(novoHistorico);
      try {
        localStorage.setItem('prancheto_historico_importacoes', JSON.stringify(novoHistorico));
      } catch (_e) { }

    } catch (err) {
      alert(`Ocorreu um erro durante a importação: ${err.message}`);
    } finally {
      setImportando(false);
    }
  };

  // ─── EXPORTAÇÃO DE DADOS CRM ───
  const executarExportacao = async () => {
    setExportando(true);
    setMensagemExportacao('Buscando registros no CRM...');

    try {
      let q = supabase
        .from('crm_contatos')
        .select(`
          id, nome, email, telefone, whatsapp, empresa, cargo,
          status_funil, valor_estimado, negocio_nome, origem, tags,
          observacoes, documento, score, criado_em, tipo_registro
        `)
        .order('criado_em', { ascending: false });

      if (filtroTipo !== 'todos') {
        q = q.eq('tipo_registro', filtroTipo);
      }
      if (filtroEtapa !== 'todas') {
        q = q.eq('status_funil', filtroEtapa);
      }

      const { data, error } = await q;
      if (error) throw error;

      if (!data || data.length === 0) {
        alert('Nenhum contato encontrado com os filtros selecionados para exportação.');
        setExportando(false);
        setMensagemExportacao('');
        return;
      }

      setMensagemExportacao(`Formatando ${data.length} contatos...`);

      // Mapeamento de Labels Amigáveis para as Colunas Selecionadas
      const colunasLabels = {
        nome: 'Nome Completo',
        email: 'E-mail',
        telefone: 'Telefone',
        whatsapp: 'WhatsApp',
        empresa: 'Empresa',
        cargo: 'Cargo',
        status_funil: 'Etapa do Funil',
        valor_estimado: 'Valor Estimado (R$)',
        negocio_nome: 'Oportunidade',
        origem: 'Origem',
        tags: 'Tags',
        observacoes: 'Observações',
        documento: 'CPF/CNPJ',
        score: 'Score',
        criado_em: 'Cadastrado em',
      };

      const dadosFormatados = data.map((item) => {
        const row = {};
        Object.entries(colunasExportar).forEach(([colKey, ativa]) => {
          if (ativa) {
            const label = colunasLabels[colKey] || colKey;
            let val = item[colKey];

            if (colKey === 'tags' && Array.isArray(val)) {
              val = val.join(', ');
            } else if (colKey === 'criado_em' && val) {
              val = new Date(val).toLocaleDateString('pt-BR');
            } else if (colKey === 'valor_estimado') {
              val = val ? Number(val).toFixed(2).replace('.', ',') : '0,00';
            }
            row[label] = val != null ? val : '';
          }
        });
        return row;
      });

      const dataHoje = new Date().toISOString().split('T')[0];
      const nomeBaseArquivo = `prancheto_crm_contatos_${dataHoje}`;

      if (formatoExportacao === 'csv') {
        // CSV com UTF-8 BOM e ponto-e-vírgula para Excel PT-BR
        const csv = '\uFEFF' + Papa.unparse(dadosFormatados, { delimiter: ';' });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeBaseArquivo}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (formatoExportacao === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(dadosFormatados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Contatos');
        XLSX.writeFile(wb, `${nomeBaseArquivo}.xlsx`);
      } else if (formatoExportacao === 'json') {
        const jsonStr = JSON.stringify(dadosFormatados, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${nomeBaseArquivo}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setMensagemExportacao('Exportação concluída com sucesso!');
      setTimeout(() => setMensagemExportacao(''), 3000);
    } catch (err) {
      alert(`Erro ao exportar dados: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ─── TOPO: NAVEGAÇÃO ENTRE IMPORTAÇÃO, EXPORTAÇÃO E HISTÓRICO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <h2 className="text-lg font-bold text-ink-primary flex items-center gap-2">
            <HugeiconsIcon icon={DatabaseIcon} size={22} className="text-[#0E382C] dark:text-[#D4EC9D]" />
            Importar e Exportar Dados
          </h2>
          <p className="text-sm text-ink-secondary mt-0.5">
            Importe contatos de uma planilha ou de outro CRM, ou baixe sua lista completa de clientes.
          </p>
        </div>

        {/* Abas Internas da Seção */}
        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-surface-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModoAba('importar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${modoAba === 'importar'
                ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
              }`}
          >
            <HugeiconsIcon icon={Upload01Icon} size={16} />
            <span>Importar Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setModoAba('exportar')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${modoAba === 'exportar'
                ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
              }`}
          >
            <HugeiconsIcon icon={Download01Icon} size={16} />
            <span>Exportar Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setModoAba('historico')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${modoAba === 'historico'
                ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
              }`}
          >
            <HugeiconsIcon icon={Folder01Icon} size={16} />
            <span>Histórico ({historicoLocal.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. MODO: IMPORTAR DADOS (ASSISTENTE DE 4 ETAPAS)           */}
      {/* ========================================================= */}
      {modoAba === 'importar' && (
        <div className="space-y-6">
          {/* Stepper Visual ReUI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-surface-subtle p-1.5 rounded-2xl border border-surface-border">
            {[
              { num: 1, titulo: 'Escolher Arquivo', desc: 'Excel ou CSV' },
              { num: 2, titulo: 'Conferir Colunas', desc: 'Campos identificados' },
              { num: 3, titulo: 'Preferências', desc: 'Contatos repetidos' },
              { num: 4, titulo: 'Concluir', desc: 'Revisão e envio' },
            ].map((etapa) => {
              const ativo = passoAtual === etapa.num;
              const concluido = passoAtual > etapa.num;
              return (
                <button
                  key={etapa.num}
                  type="button"
                  onClick={() => {
                    if (concluido || (etapa.num === 1) || (etapa.num === 2 && arquivo)) {
                      setPassoAtual(etapa.num);
                    }
                  }}
                  disabled={!arquivo && etapa.num > 1}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${ativo
                      ? 'bg-surface-card border border-surface-border shadow-xs'
                      : concluido
                        ? 'hover:bg-surface-card/60'
                        : 'opacity-70'
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${ativo
                        ? 'bg-[#0E382C] text-[#D4EC9D]'
                        : concluido
                          ? 'bg-emerald-600 text-white'
                          : 'bg-surface-border text-ink-secondary'
                      }`}
                  >
                    {concluido ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} /> : etapa.num}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${ativo ? 'text-ink-primary' : 'text-ink-secondary'}`}>
                      {etapa.titulo}
                    </p>
                    <p className="text-[10px] text-ink-secondary/70 truncate hidden sm:block">
                      {etapa.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── PASSO 1: ARQUIVO & ORIGEM ─── */}
          {passoAtual === 1 && (
            <div className="space-y-6">
              {/* Presets de CRM */}
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">1. De onde vêm esses contatos? (Opcional)</h3>
                  <p className="text-xs text-ink-secondary">
                    Selecione se o arquivo veio de outro sistema, ou deixe em "Qualquer Planilha".
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {PRESETS_CRM.map((p) => {
                    const sel = presetSelecionado === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPresetSelecionado(p.id)}
                        className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${sel
                            ? 'border-[#0E382C] bg-[#0E382C]/5 dark:bg-[#0E382C]/20 shadow-xs ring-1 ring-[#0E382C]'
                            : 'border-surface-border bg-surface-subtle hover:border-surface-border-strong'
                          }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E2B48] border border-surface-border/70 flex items-center justify-center mb-2 shadow-2xs shrink-0">
                          {p.tipoIcone === 'hugeicon' && (
                            <HugeiconsIcon icon={AiSparklesIcon} size={20} className="text-[#0E382C] dark:text-[#D4EC9D]" />
                          )}
                          {p.tipoIcone === 'rd' && <IconeRDStation className="w-5 h-5" />}
                          {p.tipoIcone === 'hubspot' && <IconeHubSpot className="w-5 h-5" />}
                          {p.tipoIcone === 'pipedrive' && <IconePipedrive className="w-4 h-5" />}
                          {p.tipoIcone === 'salesforce' && <IconeSalesforce className="w-5 h-5" />}
                        </div>
                        <span className="text-xs font-bold text-ink-primary">{p.nome}</span>
                        <span className="text-[10px] text-ink-secondary mt-0.5 line-clamp-2 leading-tight">
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dropzone de Arquivo */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputArquivoRef.current?.click()}
                className="bg-surface-card border-2 border-dashed border-surface-border hover:border-[#0E382C] rounded-2xl p-8 text-center cursor-pointer transition-all hover:bg-surface-subtle group"
              >
                <input
                  ref={inputArquivoRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processarArquivo(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-surface-subtle group-hover:bg-[#0E382C]/10 flex items-center justify-center text-[#0E382C] dark:text-[#D4EC9D] transition-colors">
                  <HugeiconsIcon icon={Upload01Icon} size={28} />
                </div>
                <h4 className="text-sm font-bold text-ink-primary">
                  Clique para selecionar ou arraste sua planilha aqui
                </h4>
                <p className="text-xs text-ink-secondary mt-1">
                  Formatos aceitos: Planilhas do Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) ou arquivos <strong>.csv</strong>
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Badge variant="outline" size="sm">Leitura automática de colunas</Badge>
                  <Badge variant="outline" size="sm">Aceita acentos e pontuação</Badge>
                </div>
              </div>

              {/* Botão de Download de Template Modelo */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-surface-subtle rounded-xl border border-surface-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center text-ink-secondary shrink-0">
                    <HugeiconsIcon icon={DocumentValidationIcon} size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink-primary">Precisa de uma planilha de exemplo?</p>
                    <p className="text-[11px] text-ink-secondary">
                      Baixe nosso modelo preenchido para usar como base ou preencher do zero.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => baixarModelo('csv')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-primary transition-all cursor-pointer"
                  >
                    Baixar Modelo CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => baixarModelo('xlsx')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all cursor-pointer"
                  >
                    Baixar Modelo Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── PASSO 2: MAPEAMENTO DE COLUNAS "DE-PARA" ─── */}
          {passoAtual === 2 && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-xl border border-surface-border">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary flex items-center gap-2">
                    <HugeiconsIcon icon={Settings02Icon} size={18} className="text-[#0E382C] dark:text-[#D4EC9D]" />
                    Conferir as colunas da planilha
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Arquivo: <strong>{arquivo?.name}</strong> ({colunasArquivo.length} colunas encontradas, cerca de {linhasArquivo.length} contatos).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => autoMapearColunas(colunasArquivo, linhasArquivo)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-ink-primary transition-all cursor-pointer"
                  >
                    <HugeiconsIcon icon={RefreshIcon} size={14} />
                    <span>Identificar Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const limpo = {};
                      colunasArquivo.forEach(c => limpo[c] = 'ignorar');
                      setMapeamento(limpo);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-ink-secondary transition-all cursor-pointer"
                  >
                    Limpar Todos
                  </button>
                </div>
              </div>

              {!colunaMapeadaNome && (
                <div className="flex items-center gap-2.5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-medium">
                  <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0" />
                  <span>
                    Por favor, indique abaixo qual coluna contém o <strong>Nome dos clientes</strong> para podermos cadastrá-los no CRM.
                  </span>
                </div>
              )}

              {/* Tabela de Colunas */}
              <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden shadow-xs">
                <div className="grid grid-cols-12 bg-surface-subtle px-4 py-2.5 border-b border-surface-border text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
                  <div className="col-span-5 sm:col-span-4">Coluna na sua planilha</div>
                  <div className="col-span-2 hidden sm:block">Exemplo (1ª linha)</div>
                  <div className="col-span-2 text-center">Situação</div>
                  <div className="col-span-5 sm:col-span-4">Salvar como no Prancheto</div>
                </div>

                <div className="divide-y divide-surface-border max-h-[460px] overflow-y-auto">
                  {colunasArquivo.map((colunaOriginal) => {
                    const matchAtual = mapeamento[colunaOriginal] || 'ignorar';
                    const tipoConfianca = confiancaMatch[colunaOriginal] || 'nenhum';
                    const valorExemplo = linhasArquivo[0]?.[colunaOriginal] || '—';

                    return (
                      <div
                        key={colunaOriginal}
                        className={`grid grid-cols-12 items-center px-4 py-3 text-xs transition-colors ${matchAtual !== 'ignorar' ? 'bg-surface-card' : 'bg-surface-subtle/40 opacity-75'
                          }`}
                      >
                        {/* Coluna Arquivo */}
                        <div className="col-span-5 sm:col-span-4 font-semibold text-ink-primary truncate pr-2">
                          {colunaOriginal}
                        </div>

                        {/* Exemplo de Dado */}
                        <div className="col-span-2 hidden sm:block text-ink-secondary truncate pr-2 text-[11px] font-mono">
                          {String(valorExemplo)}
                        </div>

                        {/* Status / Badge ReUI */}
                        <div className="col-span-2 flex justify-center">
                          {matchAtual === 'ignorar' ? (
                            <Badge variant="outline" size="xs">Não importar</Badge>
                          ) : tipoConfianca === 'exato' ? (
                            <Badge variant="success" size="xs">Reconhecido</Badge>
                          ) : (
                            <Badge variant="warning" size="xs">Sugerido</Badge>
                          )}
                        </div>

                        {/* Seletor de Campo CRM */}
                        <div className="col-span-5 sm:col-span-4 pl-2">
                          <select
                            value={matchAtual}
                            onChange={(e) => {
                              const novoVal = e.target.value;
                              setMapeamento(prev => ({ ...prev, [colunaOriginal]: novoVal }));
                              setConfiancaMatch(prev => ({ ...prev, [colunaOriginal]: novoVal === 'ignorar' ? 'nenhum' : 'exato' }));
                            }}
                            className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${matchAtual === 'nome'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                                : matchAtual !== 'ignorar'
                                  ? 'bg-surface-card border-[#0E382C] text-ink-primary'
                                  : 'bg-surface-subtle border-surface-border text-ink-secondary'
                              }`}
                          >
                            {CAMPOS_CRM.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.obrigatorio ? `★ ${c.label} (Obrigatório)` : c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botões de Ação do Passo 2 */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPassoAtual(1)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!colunaMapeadaNome) {
                      alert('Selecione qual coluna corresponde ao Nome dos clientes.');
                      return;
                    }
                    setPassoAtual(3);
                  }}
                  disabled={!colunaMapeadaNome}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <span>Avançar para Preferências</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── PASSO 3: REGRAS DE NEGÓCIO & DEDUPLICAÇÃO ─── */}
          {passoAtual === 3 && (
            <div className="space-y-6">
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-5 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-ink-primary">E se algum contato já existir no seu CRM?</h3>
                  <p className="text-xs text-ink-secondary">
                    Escolha o que fazer caso um contato da sua planilha já esteja cadastrado:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'atualizar', titulo: 'Atualizar os dados', desc: 'Atualiza o contato existente com as novas informações da planilha', badge: 'Recomendado' },
                    { id: 'ignorar', titulo: 'Manter como está', desc: 'Não mexe no contato que já existe e não cadastra repetido', badge: 'Mais Seguro' },
                    { id: 'criar_sempre', titulo: 'Cadastrar sempre', desc: 'Cria um novo contato mesmo se já houver outro igual', badge: 'Permitir Repetidos' },
                  ].map((est) => {
                    const sel = estrategiaDuplicados === est.id;
                    return (
                      <button
                        key={est.id}
                        type="button"
                        onClick={() => setEstrategiaDuplicados(est.id)}
                        className={`flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer ${sel
                            ? 'border-[#0E382C] bg-[#0E382C]/5 dark:bg-[#0E382C]/20 shadow-xs ring-1 ring-[#0E382C]'
                            : 'border-surface-border bg-surface-subtle hover:border-surface-border-strong'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-ink-primary">{est.titulo}</span>
                          <Badge variant={sel ? 'primary' : 'outline'} size="xs">{est.badge}</Badge>
                        </div>
                        <span className="text-[11px] text-ink-secondary mt-1 leading-relaxed">
                          {est.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {estrategiaDuplicados !== 'criar_sempre' && (
                  <div className="pt-2 border-t border-surface-border">
                    <label className="block text-xs font-bold text-ink-primary mb-2">
                      Como saber se o contato já existe:
                    </label>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-ink-primary">
                        <input
                          type="radio"
                          name="chaveDeduplicacao"
                          value="email"
                          checked={chaveDeduplicacao === 'email'}
                          onChange={() => setChaveDeduplicacao('email')}
                          className="accent-[#0E382C]"
                        />
                        <span>Pelo E-mail (Mais comum)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-ink-primary">
                        <input
                          type="radio"
                          name="chaveDeduplicacao"
                          value="telefone"
                          checked={chaveDeduplicacao === 'telefone'}
                          onChange={() => setChaveDeduplicacao('telefone')}
                          className="accent-[#0E382C]"
                        />
                        <span>Pelo WhatsApp ou Telefone</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-ink-primary">
                        <input
                          type="radio"
                          name="chaveDeduplicacao"
                          value="ambos"
                          checked={chaveDeduplicacao === 'ambos'}
                          onChange={() => setChaveDeduplicacao('ambos')}
                          className="accent-[#0E382C]"
                        />
                        <span>Pelo E-mail OU Telefone</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Parâmetros Padrão */}
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-ink-primary">Classificação dos novos contatos</h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Tipo de Registro */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                      Salvar como
                    </label>
                    <select
                      value={tipoRegistroPadrao}
                      onChange={(e) => setTipoRegistroPadrao(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3 py-2 text-xs font-medium focus:border-[#0E382C] focus:outline-none"
                    >
                      <option value="cliente">Cliente (Recomendado)</option>
                      <option value="lead">Lead</option>
                    </select>
                  </div>

                  {/* Etapa Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                      Fase inicial no funil (caso a planilha não tenha)
                    </label>
                    <select
                      value={etapaPadrao}
                      onChange={(e) => setEtapaPadrao(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3 py-2 text-xs font-medium focus:border-[#0E382C] focus:outline-none"
                    >
                      <option value="nao_chamei">🎯 Não Chamei</option>
                      <option value="chamei">📞 Chamei</option>
                      <option value="chamar_novamente">🔄 Chamar Novamente</option>
                      <option value="deu_bom">🏆 Deu Bom!</option>
                      <option value="deu_ruim">❌ Deu Ruim!</option>
                    </select>
                  </div>

                  {/* Tag adicional */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                      Adicionar uma etiqueta a todos (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="ex: clientes-antigos, feira-2026"
                      value={tagExtra}
                      onChange={(e) => setTagExtra(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3 py-2 text-xs font-medium focus:border-[#0E382C] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação do Passo 3 */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPassoAtual(2)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-all cursor-pointer"
                >
                  Voltar para Colunas
                </button>
                <button
                  type="button"
                  onClick={() => setPassoAtual(4)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer"
                >
                  <span>Revisar e Importar</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── PASSO 4: PRÉVIA & EXECUÇÃO ─── */}
          {passoAtual === 4 && (
            <div className="space-y-6">
              {/* Card Resumo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border shadow-xs">
                  <p className="text-[11px] text-ink-secondary">Total de contatos</p>
                  <p className="text-lg font-bold text-ink-primary">{linhasArquivo.length} contatos</p>
                </div>
                <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border shadow-xs">
                  <p className="text-[11px] text-ink-secondary">Colunas vinculadas</p>
                  <p className="text-lg font-bold text-[#0E382C] dark:text-[#D4EC9D]">
                    {Object.values(mapeamento).filter(v => v !== 'ignorar').length} de {colunasArquivo.length}
                  </p>
                </div>
                <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border shadow-xs">
                  <p className="text-[11px] text-ink-secondary">Se já existir</p>
                  <p className="text-xs font-bold text-ink-primary truncate capitalize mt-1">
                    {estrategiaDuplicados === 'atualizar' ? 'Atualizar dados' : estrategiaDuplicados === 'ignorar' ? 'Manter como está' : 'Cadastrar sempre'}
                  </p>
                </div>
                <div className="bg-surface-card p-3.5 rounded-xl border border-surface-border shadow-xs">
                  <p className="text-[11px] text-ink-secondary">Salvar como</p>
                  <p className="text-xs font-bold text-ink-primary capitalize mt-1">
                    {tipoRegistroPadrao === 'cliente' ? 'Cliente' : 'Lead'}
                  </p>
                </div>
              </div>

              {/* Tabela de Prévia Real */}
              <div className="bg-surface-card rounded-2xl border border-surface-border p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink-primary flex items-center gap-1.5">
                    <HugeiconsIcon icon={EyeIcon} size={16} />
                    Prévia dos primeiros contatos:
                  </h4>
                  <Badge variant="outline" size="xs">Primeiras 5 linhas</Badge>
                </div>

                <div className="overflow-x-auto border border-surface-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-subtle border-b border-surface-border text-ink-secondary text-[11px]">
                      <tr>
                        <th className="p-2.5">Nome</th>
                        <th className="p-2.5">E-mail</th>
                        <th className="p-2.5">Telefone / Whats</th>
                        <th className="p-2.5">Empresa</th>
                        <th className="p-2.5">Cargo</th>
                        <th className="p-2.5">Valor (R$)</th>
                        <th className="p-2.5">Etapa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {linhasPreviewTransformadas.map((r, idx) => (
                        <tr key={idx} className="hover:bg-surface-subtle/50">
                          <td className="p-2.5 font-semibold text-ink-primary">{r.nome || '—'}</td>
                          <td className="p-2.5 text-ink-secondary">{r.email || '—'}</td>
                          <td className="p-2.5 text-ink-secondary">{r.whatsapp || r.telefone || '—'}</td>
                          <td className="p-2.5 text-ink-secondary">{r.empresa || '—'}</td>
                          <td className="p-2.5 text-ink-secondary">{r.cargo || '—'}</td>
                          <td className="p-2.5 text-ink-secondary">
                            {r.valor_estimado ? `R$ ${Number(r.valor_estimado).toLocaleString('pt-BR')}` : '—'}
                          </td>
                          <td className="p-2.5">
                            <Badge variant="outline" size="xs">{r.status_funil || etapaPadrao}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Barra de Progresso durante a Execução */}
              {importando && (
                <div className="bg-surface-card p-5 rounded-2xl border border-surface-border space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink-primary flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
                      Importando seus contatos...
                    </span>
                    <span className="font-mono text-ink-secondary">
                      {progresso.processados} / {progresso.total} ({Math.round((progresso.processados / (progresso.total || 1)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-subtle h-2.5 rounded-full overflow-hidden border border-surface-border">
                    <div
                      className="bg-[#0E382C] h-full transition-all duration-200"
                      style={{ width: `${(progresso.processados / (progresso.total || 1)) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-ink-secondary">
                    <span>Cadastrados: <strong className="text-emerald-600">{progresso.criados}</strong></span>
                    <span>Atualizados: <strong className="text-sky-600">{progresso.atualizados}</strong></span>
                    {progresso.erros > 0 && <span>Não alterados: <strong className="text-ink-secondary">{progresso.erros}</strong></span>}
                  </div>
                </div>
              )}

              {/* Relatório Final Concluído */}
              {relatorioFinal && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
                    <span>Pronto! Importação Concluída com Sucesso</span>
                  </div>
                  <p className="text-xs text-ink-secondary">
                    O arquivo <strong>{relatorioFinal.arquivo}</strong> foi importado com sucesso. {relatorioFinal.criados} novos contatos cadastrados e {relatorioFinal.atualizados} contatos atualizados.
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href="/dashboard/crm"
                      className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      Ver Contatos no CRM
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setPassoAtual(1);
                        setArquivo(null);
                        setRelatorioFinal(null);
                      }}
                      className="px-4 py-2 border border-surface-border bg-surface-card text-ink-primary rounded-xl text-xs font-semibold hover:bg-surface-hover transition-all"
                    >
                      Importar Outro Arquivo
                    </button>
                  </div>
                </div>
              )}

              {/* Botões de Ação do Passo 4 */}
              {!importando && !relatorioFinal && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setPassoAtual(3)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-all cursor-pointer"
                  >
                    Voltar para Preferências
                  </button>
                  <button
                    type="button"
                    onClick={executarImportacao}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer"
                  >
                    <HugeiconsIcon icon={Upload01Icon} size={16} />
                    <span>Iniciar Importação de {linhasArquivo.length} Contatos</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODO: EXPORTAR DADOS (CSV / XLSX / JSON)               */}
      {/* ========================================================= */}
      {modoAba === 'exportar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Coluna Configurações de Exportação */}
            <div className="lg:col-span-7 space-y-5">
              {/* Formato de Exportação */}
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-3 shadow-xs">
                <h3 className="text-sm font-bold text-ink-primary">1. Formato do Arquivo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'xlsx', titulo: 'Planilha Excel (.xlsx)', desc: 'Pronta para abrir no Microsoft Excel', badge: 'Recomendado' },
                    { id: 'csv', titulo: 'Planilha CSV', desc: 'Compatível com Excel, Planilhas Google e outros programas', badge: 'Universal' },
                    { id: 'json', titulo: 'Arquivo JSON', desc: 'Para integrações técnicas ou desenvolvedores', badge: 'Técnico' },
                  ].map((fmt) => {
                    const sel = formatoExportacao === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setFormatoExportacao(fmt.id)}
                        className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${sel
                            ? 'border-[#0E382C] bg-[#0E382C]/5 dark:bg-[#0E382C]/20 shadow-xs ring-1 ring-[#0E382C]'
                            : 'border-surface-border bg-surface-subtle hover:border-surface-border-strong'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-ink-primary">{fmt.titulo}</span>
                          <Badge variant={sel ? 'primary' : 'outline'} size="xs">{fmt.badge}</Badge>
                        </div>
                        <span className="text-[10px] text-ink-secondary leading-relaxed">
                          {fmt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Escopo e Filtros */}
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-xs">
                <h3 className="text-sm font-bold text-ink-primary">2. Quais contatos você quer exportar?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-ink-secondary font-semibold mb-1.5">Tipo de Contato</label>
                    <select
                      value={filtroTipo}
                      onChange={(e) => setFiltroTipo(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3 py-2 text-xs font-medium focus:border-[#0E382C] focus:outline-none cursor-pointer"
                    >
                      <option value="todos">Todos (Clientes e Leads)</option>
                      <option value="cliente">Apenas Clientes</option>
                      <option value="lead">Apenas Leads</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-ink-secondary font-semibold mb-1.5">Fase do Funil</label>
                    <select
                      value={filtroEtapa}
                      onChange={(e) => setFiltroEtapa(e.target.value)}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3 py-2 text-xs font-medium focus:border-[#0E382C] focus:outline-none cursor-pointer"
                    >
                      <option value="todas">Todas as Etapas</option>
                      <option value="nao_chamei">🎯 Não Chamei</option>
                      <option value="chamei">📞 Chamei</option>
                      <option value="chamar_novamente">🔄 Chamar Novamente</option>
                      <option value="deu_bom">🏆 Deu Bom!</option>
                      <option value="deu_ruim">❌ Deu Ruim!</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Seletor de Colunas */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-surface-card rounded-2xl border border-surface-border p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-ink-primary">3. Informações a incluir</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const todas = {};
                        Object.keys(colunasExportar).forEach(k => todas[k] = true);
                        setColunasExportar(todas);
                      }}
                      className="text-[11px] text-[#0E382C] dark:text-[#D4EC9D] font-bold hover:underline cursor-pointer"
                    >
                      Marcar Todas
                    </button>
                    <span className="text-ink-secondary">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const minimas = { nome: true, email: true, whatsapp: true, empresa: true, status_funil: true };
                        const res = {};
                        Object.keys(colunasExportar).forEach(k => res[k] = !!minimas[k]);
                        setColunasExportar(res);
                      }}
                      className="text-[11px] text-ink-secondary hover:text-ink-primary cursor-pointer"
                    >
                      Apenas Principais
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {[
                    { key: 'nome', label: 'Nome Completo' },
                    { key: 'email', label: 'E-mail' },
                    { key: 'telefone', label: 'Telefone Fixo' },
                    { key: 'whatsapp', label: 'WhatsApp' },
                    { key: 'empresa', label: 'Empresa' },
                    { key: 'cargo', label: 'Cargo' },
                    { key: 'status_funil', label: 'Etapa Funil' },
                    { key: 'valor_estimado', label: 'Valor Estimado' },
                    { key: 'negocio_nome', label: 'Oportunidade' },
                    { key: 'origem', label: 'Origem' },
                    { key: 'tags', label: 'Tags' },
                    { key: 'observacoes', label: 'Observações' },
                    { key: 'documento', label: 'CPF / CNPJ' },
                    { key: 'score', label: 'Score' },
                    { key: 'criado_em', label: 'Data Cadastro' },
                  ].map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-subtle cursor-pointer text-xs text-ink-primary"
                    >
                      <input
                        type="checkbox"
                        checked={!!colunasExportar[col.key]}
                        onChange={(e) => {
                          setColunasExportar(prev => ({ ...prev, [col.key]: e.target.checked }));
                        }}
                        className="rounded accent-[#0E382C]"
                      />
                      <span className="truncate">{col.label}</span>
                    </label>
                  ))}
                </div>

                {/* Botão de Disparo */}
                <div className="pt-3 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={executarExportacao}
                    disabled={exportando}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {exportando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#D4EC9D] border-t-transparent rounded-full animate-spin" />
                        <span>{mensagemExportacao || 'Gerando arquivo...'}</span>
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Download01Icon} size={16} />
                        <span>Baixar Lista de Contatos ({formatoExportacao.toUpperCase()})</span>
                      </>
                    )}
                  </button>
                  {mensagemExportacao && !exportando && (
                    <p className="text-center text-xs text-emerald-600 font-semibold mt-2">
                      {mensagemExportacao}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODO: HISTÓRICO DE IMPORTAÇÕES                          */}
      {/* ========================================================= */}
      {modoAba === 'historico' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-ink-primary">Histórico de Importações</h3>
              <p className="text-xs text-ink-secondary">
                Veja os últimos arquivos importados neste navegador.
              </p>
            </div>
            {historicoLocal.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja limpar o histórico de importações?')) {
                    setHistoricoLocal([]);
                    localStorage.removeItem('prancheto_historico_importacoes');
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-red-600 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete02Icon} size={14} />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>

          {historicoLocal.length === 0 ? (
            <div className="bg-surface-card rounded-2xl border border-surface-border p-8 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-surface-subtle flex items-center justify-center text-ink-secondary">
                <HugeiconsIcon icon={Folder01Icon} size={24} />
              </div>
              <p className="text-sm font-bold text-ink-primary">Nenhuma importação realizada ainda</p>
              <p className="text-xs text-ink-secondary">
                Quando você importar uma planilha, o resumo do arquivo aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden shadow-xs divide-y divide-surface-border">
              {historicoLocal.map((h, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-ink-primary flex items-center gap-2">
                      <HugeiconsIcon icon={DocumentValidationIcon} size={16} className="text-[#0E382C] dark:text-[#D4EC9D]" />
                      {h.arquivo}
                    </p>
                    <p className="text-[11px] text-ink-secondary">
                      {new Date(h.data).toLocaleString('pt-BR')} • {h.total} contatos processados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">{h.criados} Cadastrados</Badge>
                    <Badge variant="primary" size="sm">{h.atualizados} Atualizados</Badge>
                    {h.erros > 0 && <Badge variant="destructive" size="sm">{h.erros} Ignorados</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
