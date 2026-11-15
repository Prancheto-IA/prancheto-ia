// =============================================================
// PRANCHETO.IA - DADOS, CATÁLOGO DE NÓS E PRESETS DE AUTOMAÇÃO
// Layout Studio Top-Down com Mesh Gradients e Árvore Ramificada
// =============================================================
import { FUNIL_LEAD, ORIGENS, funilInfo, formatarMoeda } from '../../hooks/useCRM.js';

export const NODE_WIDTH = 276;
export const NODE_HEIGHT = 68;

export const STORAGE_KEY_WORKFLOWS = 'prancheto_automacoes_workflows_v3';
export const STORAGE_KEY_CONEXOES  = 'prancheto_automacoes_conexoes_v1';
export const STORAGE_KEY_LOGS      = 'prancheto_automacoes_logs_v1';

export const VARIAVEIS_DISPONIVEIS = [
  { token: '{{lead.nome}}',           label: 'Nome do Lead',          exemplo: 'Mariana Costa' },
  { token: '{{lead.empresa}}',        label: 'Empresa',               exemplo: 'Vértice Arquitetura' },
  { token: '{{lead.valor_estimado}}', label: 'Valor do Negócio',      exemplo: 'R$ 18.500,00' },
  { token: '{{etapa.anterior}}',      label: 'Etapa Anterior',        exemplo: 'Chamei' },
  { token: '{{etapa.nova}}',          label: 'Nova Etapa',            exemplo: 'Chamar Novamente' },
  { token: '{{responsavel.nome}}',    label: 'Vendedor Responsável',  exemplo: 'Derek Almeida' },
  { token: '{{ia.mensagem_gerada}}',  label: 'Texto Pranchetinho IA', exemplo: 'Preparamos a proposta sob medida para a Vértice.' },
];

export const MESH_GRADIENTS = {
  brand:    'radial-gradient(circle at 20% 20%, #38BDF8 0%, #0455BF 45%, #7338F2 100%)',
  indigo:   'radial-gradient(circle at 80% 20%, #A855F7 0%, #6366F1 48%, #1E3A8A 100%)',
  magenta:  'radial-gradient(circle at 25% 25%, #F43F5E 0%, #9333EA 52%, #0EA5E9 100%)',
  sunset:   'radial-gradient(circle at 30% 20%, #FB923C 0%, #F43F5E 50%, #38BDF8 100%)',
  coral:    'radial-gradient(circle at 75% 25%, #FB7185 0%, #F97316 45%, #E0E7FF 100%)',
  aurora:   'radial-gradient(circle at 20% 80%, #2DD4BF 0%, #818CF8 55%, #C084FC 100%)',
  amber:    'radial-gradient(circle at 30% 30%, #FBBF24 0%, #F97316 55%, #CBD5E1 100%)',
  emerald:  'radial-gradient(circle at 20% 25%, #34D399 0%, #0EA5E9 55%, #6366F1 100%)',
  crimson:  'radial-gradient(circle at 70% 30%, #EF4444 0%, #EC4899 50%, #8B5CF6 100%)',
  cyan:     'radial-gradient(circle at 25% 25%, #22D3EE 0%, #3B82F6 55%, #A78BFA 100%)',
  rose:     'radial-gradient(circle at 20% 25%, #FB7185 0%, #E11D48 55%, #881337 100%)',
  violet:   'radial-gradient(circle at 20% 20%, #C084FC 0%, #7C3AED 50%, #1E1B4B 100%)',
};

export const CATEGORIAS_NO = {
  trigger: {
    key: 'trigger',
    label: 'Gatilho Inicial',
    badgeVariant: 'violet',
    meshGradient: MESH_GRADIENTS.indigo,
  },
  logic: {
    key: 'logic',
    label: 'Controle & Lógica',
    badgeVariant: 'warning',
    meshGradient: MESH_GRADIENTS.sunset,
  },
  ai: {
    key: 'ai',
    label: 'Pranchetinho IA',
    badgeVariant: 'primary',
    meshGradient: MESH_GRADIENTS.magenta,
  },
  whatsapp: {
    key: 'whatsapp',
    label: 'WhatsApp',
    badgeVariant: 'success',
    meshGradient: MESH_GRADIENTS.emerald,
  },
  crm: {
    key: 'crm',
    label: 'CRM & Pipeline',
    badgeVariant: 'info',
    meshGradient: MESH_GRADIENTS.cyan,
  },
};

export const CATALOGO_NOS = [
  // --- FASE 1: GATILHOS DE FUNIL & CICLO DE VIDA ---
  {
    type: 'trigger_stage_changed',
    category: 'trigger',
    grupo: 'fase1',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Funil',
    title: 'Lead Movido de Etapa',
    shortDesc: 'Dispara quando o lead avança ou recua no funil CRM',
    meshGradient: MESH_GRADIENTS.brand,
    defaultConfig: {
      customTitle: 'Lead Movido de Etapa (CRM)',
      phaseLabel: 'Gatilho Inicial',
      meshKey: 'brand',
      etapaOrigem: 'qualquer',
      etapaDestino: 'chamei',
      apenasHorarioComercial: true,
    },
  },
  {
    type: 'trigger_lead_created',
    category: 'trigger',
    grupo: 'fase1',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Entrada',
    title: 'Novo Lead Criado',
    shortDesc: 'Dispara imediatamente na entrada de um novo lead',
    meshGradient: MESH_GRADIENTS.aurora,
    defaultConfig: {
      customTitle: 'Novo Lead no CRM',
      phaseLabel: 'Gatilho Inicial',
      meshKey: 'aurora',
      origem: 'qualquer',
      etapaInicial: 'nao_chamei',
    },
  },
  {
    type: 'trigger_lead_won',
    category: 'trigger',
    grupo: 'fase1',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Sucesso',
    title: 'Lead Ganho / Fechado',
    shortDesc: 'Dispara quando o negócio é marcado como Ganho / Venda realizada',
    meshGradient: MESH_GRADIENTS.emerald,
    defaultConfig: {
      customTitle: 'Venda Concluída · Ganho',
      phaseLabel: 'Gatilho · Sucesso',
      meshKey: 'emerald',
      valorMinimo: 0,
      registrarComissao: true,
    },
  },
  {
    type: 'trigger_lead_lost',
    category: 'trigger',
    grupo: 'fase1',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Arquivado',
    title: 'Lead Perdido / Desqualificado',
    shortDesc: 'Dispara quando o lead é desqualificado ou marcado como perdido',
    meshGradient: MESH_GRADIENTS.rose,
    defaultConfig: {
      customTitle: 'Lead Perdido / Arquivado',
      phaseLabel: 'Gatilho · Reengajamento',
      meshKey: 'rose',
      motivoPerda: 'todos',
    },
  },

  // --- FASE 2: TEMPO, INATIVIDADE, AGENDA & TAGS ---
  {
    type: 'trigger_inactivity',
    category: 'trigger',
    grupo: 'fase2',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · SLA',
    title: 'Lead Parado na Etapa',
    shortDesc: 'Dispara se o lead ficar parado por mais de X horas na etapa',
    meshGradient: MESH_GRADIENTS.amber,
    defaultConfig: {
      customTitle: 'Monitor de Parada na Etapa',
      phaseLabel: 'Gatilho · SLA',
      meshKey: 'amber',
      horasSemResposta: 24,
      etapaAlvo: 'chamar_novamente',
    },
  },
  {
    type: 'trigger_no_contact',
    category: 'trigger',
    grupo: 'fase2',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Inatividade',
    title: 'Sem Contato com o Lead',
    shortDesc: 'Dispara após X dias sem nenhuma mensagem ou atividade',
    meshGradient: MESH_GRADIENTS.sunset,
    defaultConfig: {
      customTitle: 'Resgate de Inatividade',
      phaseLabel: 'Gatilho · Cadência',
      meshKey: 'sunset',
      diasSemContato: 3,
      apenasHorarioComercial: true,
    },
  },
  {
    type: 'trigger_meeting_scheduled',
    category: 'trigger',
    grupo: 'fase2',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Agenda',
    title: 'Reunião Agendada no CRM',
    shortDesc: 'Dispara imediatamente quando uma reunião ou demo é agendada',
    meshGradient: MESH_GRADIENTS.indigo,
    defaultConfig: {
      customTitle: 'Confirmação de Reunião',
      phaseLabel: 'Gatilho · Agenda',
      meshKey: 'indigo',
      tipoReuniao: 'online',
      enviarConfirmacaoImediata: true,
    },
  },
  {
    type: 'trigger_meeting_reminder',
    category: 'trigger',
    grupo: 'fase2',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Lembrete',
    title: 'Lembrete Pré-Reunião',
    shortDesc: 'Dispara X horas ou minutos antes da reunião agendada',
    meshGradient: MESH_GRADIENTS.violet,
    defaultConfig: {
      customTitle: 'Lembrete Antes da Reunião',
      phaseLabel: 'Gatilho · Lembrete',
      meshKey: 'violet',
      antecedenciaValor: 1,
      antecedenciaUnidade: 'horas',
    },
  },
  {
    type: 'trigger_tag_added',
    category: 'trigger',
    grupo: 'fase2',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Tag',
    title: 'Tag Adicionada ao Lead',
    shortDesc: 'Dispara quando uma tag específica (ex: VIP, Urgente) é atribuída',
    meshGradient: MESH_GRADIENTS.magenta,
    defaultConfig: {
      customTitle: 'Tag Atribuída ao Lead',
      phaseLabel: 'Gatilho · Segmentação',
      meshKey: 'magenta',
      tag: 'vip',
    },
  },

  // --- DATA & HORÁRIO: AGENDAMENTO / CRON ---
  {
    type: 'trigger_schedule_datetime',
    category: 'trigger',
    grupo: 'agendamento',
    nodeRole: 'start',
    phaseLabel: 'Gatilho · Agendamento',
    title: 'Data & Horário Programado',
    shortDesc: 'Disparo agendado para data/hora ou com frequência recorrente',
    meshGradient: MESH_GRADIENTS.cyan,
    defaultConfig: {
      customTitle: 'Disparo Programado',
      phaseLabel: 'Gatilho · Cron',
      meshKey: 'cyan',
      tipoDisparo: 'pontual',
      data: '',
      horario: '09:00',
      diasSemana: 'seg-sex',
    },
  },
  {
    type: 'ai_pranchetinho',
    category: 'ai',
    nodeRole: 'step',
    phaseLabel: 'Fase IA · Personalização',
    title: 'Pranchetinho IA · Copy',
    shortDesc: 'Personaliza a abordagem com contexto do lead',
    meshGradient: MESH_GRADIENTS.magenta,
    defaultConfig: {
      customTitle: 'Definição de Tom & Copy IA',
      phaseLabel: 'Fase 1 · Inteligência',
      meshKey: 'magenta',
      tom: 'consultivo',
      promptInstrucao: 'Gere uma mensagem curta e persuasiva convidando para revisar a proposta enviada hoje.',
      salvarVariavel: '{{ia.mensagem_gerada}}',
    },
  },
  {
    type: 'logic_condition',
    category: 'logic',
    nodeRole: 'step',
    phaseLabel: 'Fase · Condição IF',
    title: 'Condição IF / Filtro',
    shortDesc: 'Valida valor estimado, telefone ou origem do lead',
    meshGradient: MESH_GRADIENTS.sunset,
    defaultConfig: {
      customTitle: 'Filtro de Ticket >= R$ 5.000',
      phaseLabel: 'Fase · Decisão IF',
      meshKey: 'sunset',
      campo: 'valor_estimado',
      operador: '>=',
      valor: '5000',
    },
  },
  {
    type: 'logic_delay',
    category: 'logic',
    nodeRole: 'step',
    phaseLabel: 'Fase · Temporizador',
    title: 'Aguardar (Delay)',
    shortDesc: 'Pausa a execução antes do próximo bloco',
    meshGradient: MESH_GRADIENTS.coral,
    defaultConfig: {
      customTitle: 'Aguardar Janela Comercial',
      phaseLabel: 'Fase · Delay',
      meshKey: 'coral',
      quantidade: 15,
      unidade: 'minutos',
      apenasHorarioComercial: true,
    },
  },
  {
    type: 'action_whatsapp_text',
    category: 'whatsapp',
    nodeRole: 'step',
    phaseLabel: 'Ação · WhatsApp',
    title: 'Enviar Mensagem WhatsApp',
    shortDesc: 'Dispara mensagem com variáveis na instância conectada',
    meshGradient: MESH_GRADIENTS.emerald,
    defaultConfig: {
      customTitle: 'Disparar WhatsApp Comercial',
      phaseLabel: 'Ação · WhatsApp',
      meshKey: 'emerald',
      conexaoId: 'evo-comercial',
      tipoEnvio: 'texto',
      mensagem:
        'Olá {{lead.nome}}! 👋 Aqui é {{responsavel.nome}} da Prancheto.\n\nAcabei de atualizar o seu atendimento para a etapa *{{etapa.nova}}*.\n\n{{ia.mensagem_gerada}}\n\nQualquer dúvida estou por aqui!',
    },
  },
  {
    type: 'action_crm_task',
    category: 'crm',
    nodeRole: 'step',
    phaseLabel: 'Ação · CRM',
    title: 'Registrar Follow-up CRM',
    shortDesc: 'Cria tarefa ou interação automática no card do lead',
    meshGradient: MESH_GRADIENTS.cyan,
    defaultConfig: {
      customTitle: 'Sincronizar Timeline CRM',
      phaseLabel: 'Ação · CRM',
      meshKey: 'cyan',
      tipo: 'whatsapp',
      tituloTarefa: 'Confirmar recebimento da mensagem automática',
      prazoHoras: 4,
    },
  },
];

export const getCatalogoNo = (type) =>
  CATALOGO_NOS.find((item) => item.type === type) || CATALOGO_NOS[0];

export const resumirConfigNo = (node) => {
  const cfg = node?.config || {};
  switch (node?.type) {
    case 'trigger_stage_changed': {
      const origem =
        cfg.etapaOrigem && cfg.etapaOrigem !== 'qualquer'
          ? funilInfo(cfg.etapaOrigem).label
          : 'Qualquer etapa';
      const destino = funilInfo(cfg.etapaDestino || 'nao_chamei').label;
      return `${origem} → ${destino}`;
    }
    case 'trigger_lead_created': {
      const origemObj = ORIGENS.find((o) => o.key === cfg.origem);
      return `Origem: ${origemObj ? origemObj.label : 'Todas as origens'}`;
    }
    case 'trigger_lead_won':
      return `Deu Bom! · Negócio Fechado${cfg.valorMinimo ? ` (>= R$ ${cfg.valorMinimo})` : ''}`;
    case 'trigger_lead_lost':
      return `Deu Ruim! / Desqualificado (${cfg.motivoPerda === 'todos' ? 'Todos os motivos' : cfg.motivoPerda || 'Arquivado'})`;
    case 'trigger_inactivity':
      return `${cfg.horasSemResposta || 24}h parado em ${funilInfo(cfg.etapaAlvo || 'chamar_novamente').label}`;
    case 'trigger_no_contact':
      return `${cfg.diasSemContato || 3} dias sem interação com o lead`;
    case 'trigger_meeting_scheduled':
      return `Reunião agendada (${cfg.tipoReuniao === 'online' ? 'Online' : cfg.tipoReuniao === 'presencial' ? 'Presencial' : 'Call'})`;
    case 'trigger_meeting_reminder':
      return `${cfg.antecedenciaValor || 1} ${cfg.antecedenciaUnidade || 'horas'} antes da reunião`;
    case 'trigger_tag_added':
      return `Tag adicionada: #${cfg.tag || 'vip'}`;
    case 'trigger_schedule_datetime':
      return cfg.tipoDisparo === 'recorrente'
        ? `Recorrente às ${cfg.horario || '09:00'} (${cfg.diasSemana || 'dias úteis'})`
        : `Disparo programado às ${cfg.horario || '09:00'}${cfg.data ? ` em ${cfg.data}` : ''}`;
    case 'logic_delay':
      return `Aguardar ${cfg.quantidade || 5} ${cfg.unidade || 'minutos'}`;
    case 'logic_condition':
      return `Se ${cfg.campo || 'valor_estimado'} ${cfg.operador || '>='} ${cfg.valor || '0'}`;
    case 'ai_pranchetinho':
      return `Tom ${cfg.tom || 'consultivo'} → {{ia.mensagem_gerada}}`;
    case 'action_whatsapp_text': {
      const texto = (cfg.mensagem || '').replace(/\s+/g, ' ').trim();
      return texto ? `"${texto.slice(0, 56)}${texto.length > 56 ? '…' : ''}"` : 'Configurar template';
    }
    case 'action_crm_task':
      return `${cfg.tituloTarefa || 'Follow-up'} (+${cfg.prazoHoras || 2}h)`;
    default:
      return 'Configurar bloco';
  }
};

export const interpolarMensagemWhatsApp = (template, lead = {}, extra = {}) => {
  const origemLabel = lead.etapaAnterior
    ? funilInfo(lead.etapaAnterior).label
    : extra.etapaAnterior || 'Não Chamei';
  const novaLabel = lead.status_funil
    ? funilInfo(lead.status_funil).label
    : extra.etapaNova || 'Chamei';

  const mapa = {
    '{{lead.nome}}': lead.nome || 'Mariana Costa',
    '{{lead.empresa}}': lead.empresa || 'Vértice Arquitetura',
    '{{lead.valor_estimado}}':
      lead.valor_estimado != null ? formatarMoeda(lead.valor_estimado) : 'R$ 18.500,00',
    '{{etapa.anterior}}': origemLabel,
    '{{etapa.nova}}': novaLabel,
    '{{responsavel.nome}}': lead.responsavel?.nome || extra.responsavel || 'Derek Almeida',
    '{{ia.mensagem_gerada}}':
      extra.iaMensagem ||
      'Preparei uma condição especial válida até sexta-feira para agilizar a implantação.',
  };

  let resultado = String(template || '');
  Object.entries(mapa).forEach(([chave, valor]) => {
    resultado = resultado.split(chave).join(valor);
  });
  return resultado;
};

export const ordenarNosFluxo = (nodes = [], edges = []) => {
  if (!nodes.length) return [];
  const adj = new Map();
  const inDegree = new Map();
  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  edges.forEach((e) => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source).push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const queue = nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  const visited = new Set();
  const ordered = [];

  while (queue.length > 0) {
    const atual = queue.shift();
    if (visited.has(atual.id)) continue;
    visited.add(atual.id);
    ordered.push(atual);
    const filhos = adj.get(atual.id) || [];
    filhos.forEach((fid) => {
      inDegree.set(fid, Math.max(0, (inDegree.get(fid) || 1) - 1));
      if (inDegree.get(fid) === 0) {
        const nodeObj = nodes.find((n) => n.id === fid);
        if (nodeObj) queue.push(nodeObj);
      }
    });
  }

  nodes.forEach((n) => {
    if (!visited.has(n.id)) ordered.push(n);
  });

  return ordered;
};

/**
 * Reorganiza os nós automaticamente em árvore vertical Top-Down simétrica.
 */
export const autoOrganizarNosVertical = (
  nodes = [],
  edges = [],
  centerX = 620,
  startY = 46,
  levelGapY = 128,
  siblingGapX = 330
) => {
  if (!nodes.length) return nodes;

  const adj = new Map();
  const inDegree = new Map();
  nodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  });
  edges.forEach((e) => {
    if (adj.has(e.source) && inDegree.has(e.target)) {
      adj.get(e.source).push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const depthMap = new Map();
  const roots = nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .sort((a, b) => a.position.x - b.position.x);

  const bfs = roots.map((r) => ({ id: r.id, depth: 0 }));
  roots.forEach((r) => depthMap.set(r.id, 0));

  while (bfs.length > 0) {
    const { id, depth } = bfs.shift();
    const filhos = adj.get(id) || [];
    filhos.forEach((fid) => {
      const nextDepth = depth + 1;
      if ((depthMap.get(fid) ?? -1) < nextDepth) {
        depthMap.set(fid, nextDepth);
        bfs.push({ id: fid, depth: nextDepth });
      }
    });
  }

  nodes.forEach((n) => {
    if (!depthMap.has(n.id)) depthMap.set(n.id, 0);
  });

  const byLevel = new Map();
  nodes.forEach((n) => {
    const d = depthMap.get(n.id) || 0;
    if (!byLevel.has(d)) byLevel.set(d, []);
    byLevel.get(d).push(n);
  });

  const nextPos = new Map();
  Array.from(byLevel.keys())
    .sort((a, b) => a - b)
    .forEach((depth) => {
      const levelNodes = byLevel
        .get(depth)
        .slice()
        .sort((a, b) => a.position.x - b.position.x);
      const count = levelNodes.length;
      const totalWidth = (count - 1) * siblingGapX;
      levelNodes.forEach((n, idx) => {
        const x = Math.round(centerX - NODE_WIDTH / 2 - totalWidth / 2 + idx * siblingGapX);
        const y = startY + depth * levelGapY;
        nextPos.set(n.id, { x, y });
      });
    });

  return nodes.map((n) => ({
    ...n,
    position: nextPos.get(n.id) || n.position,
  }));
};

export const CONEXOES_INICIAIS = [
  {
    id: 'evo-comercial',
    provider: 'evolution',
    nome: 'Comercial Principal · Evolution API',
    instancia: 'prancheto-vendas-01',
    telefone: '+55 11 99842-1094',
    status: 'conectado',
    bateria: 94,
    webhookUrl: 'https://api.prancheto.ia/webhooks/whatsapp/evo-comercial',
    ultimaSincronizacao: 'Há 2 minutos',
    disparosHoje: 142,
  },
  {
    id: 'meta-oficial',
    provider: 'meta',
    nome: 'WhatsApp Cloud API (Oficial Meta)',
    instancia: 'WABA-482910384',
    phoneNumberId: '391847291023411',
    wabaId: '104928174920112',
    telefone: '+55 11 3090-4400',
    status: 'conectado',
    webhookUrl: 'https://api.prancheto.ia/webhooks/whatsapp/meta-cloud',
    templatesAprovados: [
      { nome: 'boas_vindas_qualificacao', status: 'APROVADO' },
      { nome: 'proposta_comercial_v2', status: 'APROVADO' },
      { nome: 'reativacao_lead_90d', status: 'EM_REVISAO' },
    ],
    ultimaSincronizacao: 'Online em tempo real',
    disparosHoje: 89,
  },
];

export const WORKFLOWS_INICIAIS = [
  {
    id: 'wf-jornada-proposta-studio',
    nome: 'Jornada Inteligente de Proposta & WhatsApp',
    descricao:
      'Orquestração completa com Pranchetinho IA, disparo paralelo no WhatsApp e qualificação de alto ticket no CRM.',
    ativo: true,
    categoria: 'Vendas · Studio',
    execucoesTotal: 318,
    taxaEntrega: 98.4,
    tempoMedio: '1,2s',
    ultimaExecucao: 'Hoje, 14:32',
    nodes: [
      {
        id: 's1',
        type: 'trigger_stage_changed',
        nodeRole: 'start',
        position: { x: 462, y: 42 },
        config: {
          customTitle: 'Lead Movido para Chamar Novamente (.CRM)',
          phaseLabel: 'Gatilho Inicial',
          meshKey: 'brand',
          etapaOrigem: 'chamei',
          etapaDestino: 'chamar_novamente',
          apenasHorarioComercial: true,
        },
      },
      {
        id: 's2',
        type: 'ai_pranchetinho',
        nodeRole: 'step',
        position: { x: 462, y: 170 },
        config: {
          customTitle: 'Definição Visual & Tom com IA',
          phaseLabel: 'Fase 1',
          meshKey: 'indigo',
          tom: 'consultivo',
          promptInstrucao:
            'Analisar o histórico de interações da {{lead.empresa}} e definir a melhor abordagem para a proposta de {{lead.valor_estimado}}.',
          salvarVariavel: '{{ia.mensagem_gerada}}',
        },
      },
      // Ramo 1 (Esquerda)
      {
        id: 's3',
        type: 'ai_pranchetinho',
        nodeRole: 'step',
        position: { x: 162, y: 298 },
        config: {
          customTitle: 'Copywriter IA · WhatsApp',
          phaseLabel: 'Fase 2 / Ramo 1 / Passo 1',
          meshKey: 'magenta',
          tom: 'executivo',
          promptInstrucao: 'Gerar mensagem objetiva convidando {{lead.nome}} para aprovar a proposta.',
          salvarVariavel: '{{ia.mensagem_gerada}}',
        },
      },
      {
        id: 's4',
        type: 'action_whatsapp_text',
        nodeRole: 'step',
        position: { x: 162, y: 426 },
        config: {
          customTitle: 'Enviar Proposta no WhatsApp',
          phaseLabel: 'Fase 2 / Ramo 1 / Passo 2',
          meshKey: 'crimson',
          conexaoId: 'evo-comercial',
          tipoEnvio: 'texto',
          mensagem:
            'Oi {{lead.nome}}! 📄 Acabamos de liberar a proposta da *{{lead.empresa}}* ({{lead.valor_estimado}}).\n\n{{ia.mensagem_gerada}}',
        },
      },
      {
        id: 's5',
        type: 'logic_delay',
        nodeRole: 'step',
        position: { x: 162, y: 554 },
        config: {
          customTitle: 'Aguardar Leitura (Janela 2h)',
          phaseLabel: 'Fase 2 / Ramo 1 / Passo 3',
          meshKey: 'coral',
          quantidade: 2,
          unidade: 'horas',
          apenasHorarioComercial: true,
        },
      },
      // Ramo 2 (Direita com sub-ramos 2.1 e 2.2)
      {
        id: 's6',
        type: 'logic_condition',
        nodeRole: 'step',
        position: { x: 762, y: 298 },
        config: {
          customTitle: 'Filtro de Ticket >= R$ 5.000',
          phaseLabel: 'Fase 2 / Ramo 2 / Passo 1',
          meshKey: 'sunset',
          campo: 'valor_estimado',
          operador: '>=',
          valor: '5000',
        },
      },
      {
        id: 's7',
        type: 'action_whatsapp_text',
        nodeRole: 'step',
        position: { x: 582, y: 426 },
        config: {
          customTitle: 'Alerta VIP para Vendedor',
          phaseLabel: 'Fase 2 / Ramo 2 / Ramo 2.1',
          meshKey: 'aurora',
          conexaoId: 'meta-oficial',
          tipoEnvio: 'texto',
          mensagem:
            '🔥 Lead estratégico *{{lead.nome}}* ({{lead.empresa}} · {{lead.valor_estimado}}) movido para *{{etapa.nova}}*!',
        },
      },
      {
        id: 's8',
        type: 'action_crm_task',
        nodeRole: 'step',
        position: { x: 942, y: 426 },
        config: {
          customTitle: 'Enriquecer Dados do Lead',
          phaseLabel: 'Fase 2 / Ramo 2 / Ramo 2.2',
          meshKey: 'amber',
          tipo: 'nota',
          tituloTarefa: 'Validar CNPJ e decisor da {{lead.empresa}}',
          prazoHoras: 2,
        },
      },
      {
        id: 's9',
        type: 'action_crm_task',
        nodeRole: 'step',
        position: { x: 762, y: 554 },
        config: {
          customTitle: 'Sincronizar Timeline CRM',
          phaseLabel: 'Fase 2 / Ramo 2 / Passo 3',
          meshKey: 'sunset',
          tipo: 'whatsapp',
          tituloTarefa: 'Registrar protocolo de envio no histórico',
          prazoHoras: 4,
        },
      },
      // Fase 3 & Final (Convergência)
      {
        id: 's10',
        type: 'logic_condition',
        nodeRole: 'step',
        position: { x: 462, y: 682 },
        config: {
          customTitle: 'Consolidação de Engajamento',
          phaseLabel: 'Fase 3',
          meshKey: 'emerald',
          campo: 'telefone',
          operador: '!=',
          valor: 'vazio',
        },
      },
      {
        id: 's11',
        type: 'action_whatsapp_text',
        nodeRole: 'final',
        position: { x: 462, y: 810 },
        config: {
          customTitle: 'Follow-up de Fechamento (WhatsApp)',
          phaseLabel: 'Final',
          meshKey: 'brand',
          conexaoId: 'evo-comercial',
          tipoEnvio: 'texto',
          mensagem:
            '{{lead.nome}}, conseguiu dar uma olhada na proposta de {{lead.valor_estimado}}? Posso liberar os próximos passos ainda hoje! 🚀',
        },
      },
    ],
    edges: [
      { id: 'es1-2', source: 's1', target: 's2' },
      { id: 'es2-3', source: 's2', target: 's3' },
      { id: 'es2-6', source: 's2', target: 's6' },
      { id: 'es3-4', source: 's3', target: 's4' },
      { id: 'es4-5', source: 's4', target: 's5' },
      { id: 'es6-7', source: 's6', target: 's7' },
      { id: 'es6-8', source: 's6', target: 's8' },
      { id: 'es7-9', source: 's7', target: 's9' },
      { id: 'es8-9', source: 's8', target: 's9' },
      { id: 'es5-10', source: 's5', target: 's10' },
      { id: 'es9-10', source: 's9', target: 's10' },
      { id: 'es10-11', source: 's10', target: 's11' },
    ],
  },
  {
    id: 'wf-qualificacao-boas-vindas',
    nome: 'Boas-vindas Chamei → WhatsApp',
    descricao:
      'Quando o lead avança para Chamei, valida telefone e dispara boas-vindas personalizadas.',
    ativo: true,
    categoria: 'Primeiro Contato',
    execucoesTotal: 194,
    taxaEntrega: 99.1,
    tempoMedio: '0,9s',
    ultimaExecucao: 'Hoje, 11:18',
    nodes: [
      {
        id: 'q1',
        type: 'trigger_stage_changed',
        nodeRole: 'start',
        position: { x: 462, y: 46 },
        config: {
          customTitle: 'Não Chamei → Chamei (CRM)',
          phaseLabel: 'Gatilho Inicial',
          meshKey: 'brand',
          etapaOrigem: 'nao_chamei',
          etapaDestino: 'chamei',
          apenasHorarioComercial: true,
        },
      },
      {
        id: 'q2',
        type: 'logic_condition',
        nodeRole: 'step',
        position: { x: 462, y: 174 },
        config: {
          customTitle: 'Validar Telefone WhatsApp',
          phaseLabel: 'Fase 1 · Validação',
          meshKey: 'sunset',
          campo: 'telefone',
          operador: '!=',
          valor: 'vazio',
        },
      },
      {
        id: 'q3',
        type: 'logic_delay',
        nodeRole: 'step',
        position: { x: 462, y: 302 },
        config: {
          customTitle: 'Aguardar 5 minutos',
          phaseLabel: 'Fase 2 · Humanização',
          meshKey: 'coral',
          quantidade: 5,
          unidade: 'minutos',
          apenasHorarioComercial: true,
        },
      },
      {
        id: 'q4',
        type: 'action_whatsapp_text',
        nodeRole: 'final',
        position: { x: 462, y: 430 },
        config: {
          customTitle: 'Enviar Boas-vindas WhatsApp',
          phaseLabel: 'Final · Disparo',
          meshKey: 'emerald',
          conexaoId: 'evo-comercial',
          tipoEnvio: 'texto',
          mensagem:
            'Olá {{lead.nome}}, tudo bem? 👋\n\nSou {{responsavel.nome}} do time da Prancheto.IA! Vi que a {{lead.empresa}} avançou para *{{etapa.nova}}*.\n\nPosso te enviar os melhores horários para uma call rápida de 15 min?',
        },
      },
    ],
    edges: [
      { id: 'eq1-2', source: 'q1', target: 'q2' },
      { id: 'eq2-3', source: 'q2', target: 'q3' },
      { id: 'eq3-4', source: 'q3', target: 'q4' },
    ],
  },
  {
    id: 'wf-fechado-onboarding',
    nome: 'Deu Bom! → Onboarding Cliente',
    descricao:
      'Dispara boas-vindas de implantação no WhatsApp e agenda Kickoff assim que o negócio é marcado como Deu Bom!.',
    ativo: true,
    categoria: 'Pós-Venda',
    execucoesTotal: 87,
    taxaEntrega: 100,
    tempoMedio: '0,8s',
    ultimaExecucao: 'Ontem, 17:45',
    nodes: [
      {
        id: 'f1',
        type: 'trigger_stage_changed',
        nodeRole: 'start',
        position: { x: 462, y: 46 },
        config: {
          customTitle: 'Negócio Marcado como Deu Bom!',
          phaseLabel: 'Gatilho Inicial',
          meshKey: 'emerald',
          etapaOrigem: 'chamar_novamente',
          etapaDestino: 'deu_bom',
          apenasHorarioComercial: false,
        },
      },
      {
        id: 'f2',
        type: 'action_whatsapp_text',
        nodeRole: 'step',
        position: { x: 462, y: 174 },
        config: {
          customTitle: 'Mensagem de Boas-vindas VIP',
          phaseLabel: 'Fase 1 · WhatsApp',
          meshKey: 'emerald',
          conexaoId: 'meta-oficial',
          tipoEnvio: 'texto',
          mensagem:
            'Parabéns, {{lead.nome}}! 🏆 Seja muito bem-vindo(a) com a *{{lead.empresa}}*!\n\nNosso time de Onboarding já recebeu os dados do projeto e enviará o link da reunião de Kickoff em instantes.',
        },
      },
      {
        id: 'f3',
        type: 'action_crm_task',
        nodeRole: 'final',
        position: { x: 462, y: 302 },
        config: {
          customTitle: 'Agendar Kickoff de Onboarding',
          phaseLabel: 'Final · CRM',
          meshKey: 'cyan',
          tipo: 'reuniao',
          tituloTarefa: 'Agendar Kickoff de Onboarding ({{lead.empresa}})',
          prazoHoras: 2,
        },
      },
    ],
    edges: [
      { id: 'ef1-2', source: 'f1', target: 'f2' },
      { id: 'ef2-3', source: 'f2', target: 'f3' },
    ],
  },
];

export const LEADS_DEMO = [
  {
    id: 'demo-lead-1',
    nome: 'Mariana Costa',
    empresa: 'Vértice Arquitetura',
    whatsapp: '+55 11 99421-8830',
    status_funil: 'chamei',
    valor_estimado: 18500,
    origem: 'anuncio',
    responsavel: { nome: 'Derek Almeida' },
  },
  {
    id: 'demo-lead-2',
    nome: 'Rafael Nogueira',
    empresa: 'Nogueira Logística',
    whatsapp: '+55 11 98210-4471',
    status_funil: 'chamar_novamente',
    valor_estimado: 32000,
    origem: 'indicacao',
    responsavel: { nome: 'Camila Soares' },
  },
  {
    id: 'demo-lead-3',
    nome: 'Juliana Mendes',
    empresa: 'Clínica Lumina',
    whatsapp: '+55 21 99104-7721',
    status_funil: 'nao_chamei',
    valor_estimado: 12900,
    origem: 'site',
    responsavel: { nome: 'Derek Almeida' },
  },
];

export const LOGS_INICIAIS = [
  {
    id: 'log-104',
    workflowId: 'wf-jornada-proposta-studio',
    workflowNome: 'Jornada Inteligente de Proposta & WhatsApp',
    leadNome: 'Mariana Costa',
    leadEmpresa: 'Vértice Arquitetura',
    leadTelefone: '+55 11 99421-8830',
    etapaOrigem: 'chamei',
    etapaDestino: 'chamar_novamente',
    conexaoNome: 'Comercial Principal · Evolution API',
    status: 'concluido',
    duracaoMs: 1180,
    criadoEm: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    mensagemEnviada:
      'Oi Mariana Costa! 📄 Acabamos de liberar a proposta da *Vértice Arquitetura* (R$ 18.500,00).\n\nPreparamos uma condição especial válida até sexta-feira para agilizar a implantação.',
    passos: [
      { id: 's1', titulo: 'Lead Movido para Chamar Novamente (.CRM)', status: 'ok', tempoMs: 45, detalhe: 'Chamei → Chamar Novamente' },
      { id: 's2', titulo: 'Definição Visual & Tom com IA', status: 'ok', tempoMs: 310, detalhe: 'Tom consultivo selecionado' },
      { id: 's4', titulo: 'Enviar Proposta no WhatsApp', status: 'ok', tempoMs: 620, detalhe: 'Entregue · ID wamid.HBgMNTUxMT...' },
      { id: 's6', titulo: 'Filtro de Ticket >= R$ 5.000', status: 'ok', tempoMs: 18, detalhe: 'R$ 18.500 >= R$ 5.000 (Verdadeiro)' },
    ],
  },
  {
    id: 'log-103',
    workflowId: 'wf-qualificacao-boas-vindas',
    workflowNome: 'Boas-vindas Chamei → WhatsApp',
    leadNome: 'Rafael Nogueira',
    leadEmpresa: 'Nogueira Logística',
    leadTelefone: '+55 11 98210-4471',
    etapaOrigem: 'nao_chamei',
    etapaDestino: 'chamei',
    conexaoNome: 'WhatsApp Cloud API (Oficial Meta)',
    status: 'concluido',
    duracaoMs: 920,
    criadoEm: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    mensagemEnviada:
      'Olá Rafael Nogueira, tudo bem? 👋\n\nSou Camila Soares do time da Prancheto.IA! Vi que a Nogueira Logística avançou para *Chamei*.',
    passos: [
      { id: 'q1', titulo: 'Não Chamei → Chamei (CRM)', status: 'ok', tempoMs: 38, detalhe: 'Não Chamei → Chamei' },
      { id: 'q2', titulo: 'Validar Telefone WhatsApp', status: 'ok', tempoMs: 14, detalhe: '+55 11 98210-4471 válido' },
      { id: 'q4', titulo: 'Enviar Boas-vindas WhatsApp', status: 'ok', tempoMs: 868, detalhe: 'Meta Graph 200 OK · Lida' },
    ],
  },
  {
    id: 'log-102',
    workflowId: 'wf-qualificacao-boas-vindas',
    workflowNome: 'Boas-vindas Chamei → WhatsApp',
    leadNome: 'Carlos Eduardo',
    leadEmpresa: 'Grupo Horizon',
    leadTelefone: '+55 31 99700-1122',
    etapaOrigem: 'nao_chamei',
    etapaDestino: 'chamei',
    conexaoNome: 'Comercial Principal · Evolution API',
    status: 'erro',
    duracaoMs: 540,
    criadoEm: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    mensagemEnviada:
      'Não enviada — sessão WhatsApp aguardando nova leitura de QR Code na Evolution API.',
    passos: [
      { id: 'n1', titulo: 'Lead Movido de Etapa', status: 'ok', tempoMs: 32, detalhe: 'Não Chamei → Chamei' },
      { id: 'n2', titulo: 'Condição IF / Filtro', status: 'ok', tempoMs: 18, detalhe: 'telefone != vazio (Verdadeiro)' },
      { id: 'n4', titulo: 'Enviar WhatsApp', status: 'erro', tempoMs: 490, detalhe: 'Erro 503: Sessão Evolution API temporariamente offline' },
    ],
  },
];

export { FUNIL_LEAD, ORIGENS, funilInfo };
