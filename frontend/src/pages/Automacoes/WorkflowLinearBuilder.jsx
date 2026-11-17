// =============================================================
// PRANCHETO.IA - CONSTRUTOR LINEAR DE AUTOMAÇÕES
// Interface moderna, limpa e intuitiva para criação de fluxos
// baseados em Gatilhos ("Quando...") e Ações ("Então...").
// =============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FlashIcon,
  PlayIcon,
  CheckmarkCircle02Icon,
  Add01Icon,
  MinusSignIcon,
  Delete02Icon,
  FilterIcon,
  Clock01Icon,
  AiSparklesIcon,
  WhatsappIcon,
  Settings02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  PencilEdit01Icon,
  Cancel01Icon,
  Task01Icon,
  Search01Icon,
  WorkflowSquare10Icon,
  HelpCircleIcon,
  Calendar03Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { Switch } from '@/components/reui/switch';
import { SimpleTooltip } from '@/components/reui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  CATALOGO_NOS,
  VARIAVEIS_DISPONIVEIS,
  FUNIL_LEAD,
  getCatalogoNo,
  ordenarNosFluxo,
} from './automacoesData.js';

// =============================================================
// CATÁLOGO DE SERVIÇOS DISPONÍVEIS
// =============================================================
export const SERVICOS_DISPONIVEIS = [
  {
    id: 'crm_funil',
    nome: 'Funil CRM',
    descricao: 'Mudanças de etapa, novos clientes e negócios ganhos ou perdidos no CRM.',
    cor: '#0080FF', // Azul Vibrante CRM
    icone: FlashIcon,
    gatilhos: [
      {
        type: 'trigger_stage_changed',
        title: 'Cliente movido de etapa',
        shortDesc: 'Dispara quando o cliente avança ou recua para uma etapa específica no funil.',
        badge: 'Tempo real',
        campos: ['etapa_origem', 'etapa_destino', 'apenas_comercial'],
        ingredientes: ['lead.nome', 'lead.empresa', 'lead.whatsapp', 'lead.valor'],
      },
      {
        type: 'trigger_lead_created',
        title: 'Novo cliente criado',
        shortDesc: 'Dispara imediatamente quando um novo lead entra no sistema.',
        badge: 'Tempo real',
        campos: ['origem_lead'],
        ingredientes: ['lead.nome', 'lead.email', 'lead.whatsapp'],
      },
      {
        type: 'trigger_lead_won',
        title: 'Negócio ganho / fechado',
        shortDesc: 'Dispara quando o cliente fecha contrato e é marcado como Ganho.',
        badge: 'Sucesso',
        campos: ['valor_fechado'],
        ingredientes: ['lead.nome', 'lead.valor_estimado', 'responsavel.nome'],
      },
      {
        type: 'trigger_lead_lost',
        title: 'Cliente perdido / arquivado',
        shortDesc: 'Dispara quando o lead é desqualificado ou marcado como Perdido.',
        badge: 'Arquivamento',
        campos: ['motivo_perda'],
        ingredientes: ['lead.nome', 'motivo'],
      },
    ],
    acoes: [
      {
        type: 'action_move_stage',
        title: 'Mover cliente de etapa',
        shortDesc: 'Altera automaticamente a etapa do lead no funil CRM.',
        badge: 'Pipeline',
        campos: ['etapa_destino'],
      },
    ],
  },
  {
    id: 'whatsapp',
    nome: 'WhatsApp',
    descricao: 'Disparo de mensagens instantâneas via Evolution API.',
    cor: '#10B981', // Verde Esmeralda WhatsApp
    icone: WhatsappIcon,
    gatilhos: [],
    acoes: [
      {
        type: 'action_whatsapp_text',
        title: 'Enviar mensagem no WhatsApp',
        shortDesc: 'Dispara uma mensagem de texto no WhatsApp do cliente com variáveis dinâmicas.',
        badge: 'Instantâneo',
        campos: ['conexao_whatsapp', 'mensagem'],
      },
    ],
  },
  {
    id: 'ia_pranchetinho',
    nome: 'Pranchetinho IA',
    descricao: 'Inteligência Artificial para personalizar mensagens e analisar leads.',
    cor: '#8B5CF6', // Roxo Violeta IA
    icone: AiSparklesIcon,
    gatilhos: [],
    acoes: [
      {
        type: 'ai_pranchetinho',
        title: 'Personalizar texto com IA',
        shortDesc: 'Gera uma resposta cordial e estratégica baseada no contexto do cliente.',
        badge: 'Inteligência Artificial',
        campos: ['tom_voz', 'instrucao_ia'],
        ingredientes: ['ia.mensagem_gerada'],
      },
    ],
  },
  {
    id: 'tempo_sla',
    nome: 'Data & Tempo',
    descricao: 'Temporizadores, regras de inatividade e atrasos programados.',
    cor: '#1E293B', // Grafite Escuro
    icone: Clock01Icon,
    gatilhos: [
      {
        type: 'trigger_inactivity',
        title: 'Cliente parado na etapa',
        shortDesc: 'Dispara se o cliente ficar sem contato por X horas na etapa atual.',
        badge: 'SLA',
        campos: ['horas_inatividade'],
        ingredientes: ['tempo_parado'],
      },
      {
        type: 'trigger_schedule_datetime',
        title: 'Data e horário programado',
        shortDesc: 'Dispara em um momento específico do dia.',
        badge: 'Agendamento',
        campos: ['horario_disparo'],
        ingredientes: ['data_hora'],
      },
    ],
    acoes: [
      {
        type: 'logic_delay',
        title: 'Atraso / Delay',
        shortDesc: 'Aguarda alguns minutos, horas ou dias antes de executar a próxima ação.',
        badge: 'Tempo',
        campos: ['duracao', 'unidade_tempo'],
      },
    ],
  },
  {
    id: 'crm_tarefas',
    nome: 'Tarefas',
    descricao: 'Atividades e lembretes para a equipe comercial.',
    cor: '#F59E0B', // Âmbar Tarefas
    icone: Task01Icon,
    gatilhos: [],
    acoes: [
      {
        type: 'action_crm_task',
        title: 'Criar tarefa para a equipe',
        shortDesc: 'Cria uma tarefa de acompanhamento com prazo para o vendedor responsável.',
        badge: 'CRM',
        campos: ['titulo_tarefa', 'prazo_dias', 'responsavel'],
      },
    ],
  },
  {
    id: 'webhooks',
    nome: 'Webhooks',
    descricao: 'Integração externa via requisições HTTP REST com payload JSON.',
    cor: '#06B6D4', // Ciano Webhooks
    icone: WorkflowSquare10Icon,
    gatilhos: [
      {
        type: 'trigger_webhook',
        title: 'Receber webhook com JSON',
        shortDesc: 'Dispara quando um sistema externo envia uma requisição POST com payload.',
        badge: 'API Externa',
        campos: ['endpoint_webhook'],
        ingredientes: ['payload.json'],
      },
    ],
    acoes: [
      {
        type: 'action_webhook',
        title: 'Fazer requisição Webhook',
        shortDesc: 'Envia dados do cliente para uma URL externa via POST JSON.',
        badge: 'API Externa',
        campos: ['url_destino', 'metodo_http'],
      },
    ],
  },
];

// Retorna as informações do serviço correspondente ao tipo de nó
export const getServicoDoNo = (tipoNo) => {
  for (const s of SERVICOS_DISPONIVEIS) {
    if (s.gatilhos.some((g) => g.type === tipoNo) || s.acoes.some((a) => a.type === tipoNo)) {
      return s;
    }
  }
  if (tipoNo.startsWith('trigger_')) return SERVICOS_DISPONIVEIS[0];
  if (tipoNo.startsWith('action_whatsapp')) return SERVICOS_DISPONIVEIS[1];
  if (tipoNo.startsWith('ai_')) return SERVICOS_DISPONIVEIS[2];
  if (tipoNo.startsWith('logic_')) return SERVICOS_DISPONIVEIS[3];
  return SERVICOS_DISPONIVEIS[0];
};

// =============================================================
// COMPONENTE PRINCIPAL: WorkflowLinearBuilder
// =============================================================
const WorkflowLinearBuilder = ({
  workflows = [],
  workflowAtual,
  conexoes = [],
  leadPreview,
  totalLogs = 0,
  ultimoSalvoTexto = 'agora',
  onUpdateWorkflow,
  onToggleAtivo,
  onExecutarSimulacao,
  onOpenFluxos,
  onOpenConexoes,
  onOpenLogs,
  onOpenSimuladorLead,
  onExcluirWorkflow,
  simulacaoEstado = { executando: false, nosStatus: {} },
  telaInicial = 'builder',
}) => {
  const [telaAtiva, setTelaAtiva] = useState(telaInicial);

  useEffect(() => {
    if (telaInicial) {
      setTelaAtiva(telaInicial);
    }
  }, [telaInicial]);

  // Navegação interna
  const [fluxoAlvo, setFluxoAlvo] = useState('gatilho'); // 'gatilho' | 'acao' | 'intermediario'
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [itemCatalogoSelecionado, setItemCatalogoSelecionado] = useState(null);
  const [noEditandoId, setNoEditandoId] = useState(null);
  const [configTemp, setConfigTemp] = useState({});

  // Menu expansível de passos intermediários (+/-)
  const [menuIntermediarioAberto, setMenuIntermediarioAberto] = useState(false);

  // Busca na tela de escolher serviços
  const [buscaServico, setBuscaServico] = useState('');

  // Título da Automação na tela Rever e Terminar
  const [tituloAutomacao, setTituloAutomacao] = useState(workflowAtual?.nome || '');

  useEffect(() => {
    setTituloAutomacao(workflowAtual?.nome || '');
  }, [workflowAtual?.nome]);

  // Lista ordenada de nós do fluxo
  const nosOrdenados = useMemo(() => {
    if (!workflowAtual?.nodes) return [];
    return ordenarNosFluxo(workflowAtual.nodes, workflowAtual.edges || []);
  }, [workflowAtual]);

  const gatilhoNo = nosOrdenados.find(
    (n) => n.type.startsWith('trigger_') || n.nodeRole === 'start'
  );
  const passosAcoes = nosOrdenados.filter((n) => n.id !== gatilhoNo?.id);

  // Serviços envolvidos
  const servicosEnvolvidos = useMemo(() => {
    const s = [];
    if (gatilhoNo) {
      s.push(getServicoDoNo(gatilhoNo.type));
    }
    passosAcoes.forEach((a) => {
      const serv = getServicoDoNo(a.type);
      if (!s.some((x) => x.id === serv.id)) {
        s.push(serv);
      }
    });
    return s.length > 0 ? s : [SERVICOS_DISPONIVEIS[0], SERVICOS_DISPONIVEIS[1]];
  }, [gatilhoNo, passosAcoes]);

  // Iniciar adição de Gatilho
  const handleIniciarAdicaoGatilho = () => {
    setFluxoAlvo('gatilho');
    setBuscaServico('');
    setTelaAtiva('escolher_servico');
  };

  // Iniciar adição de Ação
  const handleIniciarAdicaoAcao = () => {
    setFluxoAlvo('acao');
    setBuscaServico('');
    setTelaAtiva('escolher_servico');
  };

  // Iniciar adição de passo intermediário
  const handleIniciarAdicaoIntermediario = (tipo) => {
    setMenuIntermediarioAberto(false);
    if (tipo === 'ia') {
      const servIA = SERVICOS_DISPONIVEIS.find((s) => s.id === 'ia_pranchetinho');
      setServicoSelecionado(servIA);
      setItemCatalogoSelecionado(servIA.acoes[0]);
      setConfigTemp({
        tom: 'consultivo',
        promptInstrucao: 'Adaptar mensagem cordial ao contexto do cliente.',
      });
      setFluxoAlvo('acao');
      setTelaAtiva('configurar_acao');
    } else if (tipo === 'filtro') {
      const servCRM = SERVICOS_DISPONIVEIS.find((s) => s.id === 'crm_funil');
      setServicoSelecionado(servCRM);
      setItemCatalogoSelecionado(servCRM.gatilhos[0]);
      setConfigTemp({ etapaOrigem: 'qualquer', etapaDestino: 'chamei', apenasHorarioComercial: true });
      setFluxoAlvo('gatilho');
      setTelaAtiva('configurar_acao');
    } else if (tipo === 'atraso') {
      const servTempo = SERVICOS_DISPONIVEIS.find((s) => s.id === 'tempo_sla');
      setServicoSelecionado(servTempo);
      setItemCatalogoSelecionado(servTempo.acoes[0]);
      setConfigTemp({ duracao: 30, unidade: 'minutos' });
      setFluxoAlvo('acao');
      setTelaAtiva('configurar_acao');
    }
  };

  // Editar nó existente
  const handleEditarNoExistente = (no) => {
    const serv = getServicoDoNo(no.type);
    const meta = getCatalogoNo(no.type);
    setServicoSelecionado(serv);
    setItemCatalogoSelecionado({
      type: no.type,
      title: no.config?.customTitle || meta?.title,
      shortDesc: meta?.shortDesc,
      badge: meta?.badge || 'Configuração',
    });
    setConfigTemp(no.config || {});
    setNoEditandoId(no.id);
    setFluxoAlvo(no.type.startsWith('trigger_') ? 'gatilho' : 'acao');
    setTelaAtiva('configurar_acao');
  };

  // Selecionar serviço
  const handleSelecionarServico = (servico) => {
    setServicoSelecionado(servico);
    setTelaAtiva('escolher_acao');
  };

  // Selecionar ação/gatilho
  const handleSelecionarAcao = (item) => {
    setItemCatalogoSelecionado(item);
    const meta = getCatalogoNo(item.type);
    setConfigTemp(meta?.defaultConfig || {});
    setNoEditandoId(null);
    setTelaAtiva('configurar_acao');
  };

  // Concluir configuração do passo
  const handleConcluirConfiguracao = () => {
    if (!itemCatalogoSelecionado) return;
    const isTrigger = itemCatalogoSelecionado.type.startsWith('trigger_');

    if (noEditandoId) {
      onUpdateWorkflow(workflowAtual.id, (wf) => {
        const novosNodes = wf.nodes.map((n) =>
          n.id === noEditandoId ? { ...n, config: { ...n.config, ...configTemp } } : n
        );
        return { ...wf, nodes: novosNodes };
      });
    } else {
      const novoId = `n-${Date.now().toString(36)}`;
      const meta = getCatalogoNo(itemCatalogoSelecionado.type);
      const novoNo = {
        id: novoId,
        type: itemCatalogoSelecionado.type,
        nodeRole: isTrigger ? 'start' : 'step',
        position: { x: 0, y: 0 },
        config: {
          ...meta?.defaultConfig,
          ...configTemp,
          customTitle: itemCatalogoSelecionado.title,
        },
      };

      onUpdateWorkflow(workflowAtual.id, (wf) => {
        let lista = [...(wf.nodes || [])];
        if (isTrigger) {
          const semGatilho = lista.filter(
            (n) => !n.type.startsWith('trigger_') && n.nodeRole !== 'start'
          );
          lista = [novoNo, ...semGatilho];
        } else {
          lista.push(novoNo);
        }

        const novosEdges = [];
        for (let i = 0; i < lista.length - 1; i++) {
          novosEdges.push({
            id: `e-${lista[i].id}-${lista[i + 1].id}`,
            source: lista[i].id,
            target: lista[i + 1].id,
          });
        }
        return { ...wf, nodes: lista, edges: novosEdges };
      });
    }

    setTelaAtiva('builder');
    setNoEditandoId(null);
    setItemCatalogoSelecionado(null);
  };

  // Remover nó
  const handleRemoverNo = (noId) => {
    onUpdateWorkflow(workflowAtual.id, (wf) => {
      const novosNodes = (wf.nodes || []).filter((n) => n.id !== noId);
      const novosEdges = [];
      for (let i = 0; i < novosNodes.length - 1; i++) {
        novosEdges.push({
          id: `e-${novosNodes[i].id}-${novosNodes[i + 1].id}`,
          source: novosNodes[i].id,
          target: novosNodes[i + 1].id,
        });
      }
      return { ...wf, nodes: novosNodes, edges: novosEdges };
    });
  };

  // Salvar título e ir para detalhes
  const handleTerminarAutomacao = () => {
    if (tituloAutomacao.trim()) {
      onUpdateWorkflow(workflowAtual.id, (wf) => ({
        ...wf,
        nome: tituloAutomacao.trim(),
        ativo: true,
      }));
    }
    setTelaAtiva('detalhes');
  };

  // ══════════════════════════════════════════════════════════════
  // RENDERIZAÇÃO CONDICIONAL DE TELAS
  // ══════════════════════════════════════════════════════════════

  // ─── TELA 1: ESCOLHER SERVIÇO OU APLICATIVO ───
  if (telaAtiva === 'escolher_servico') {
    const servicosFiltrados = SERVICOS_DISPONIVEIS.filter((s) => {
      if (fluxoAlvo === 'gatilho' && s.gatilhos.length === 0) return false;
      if (fluxoAlvo === 'acao' && s.acoes.length === 0) return false;
      if (!buscaServico.trim()) return true;
      const q = buscaServico.toLowerCase();
      return s.nome.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q);
    });

    return (
      <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
        {/* Cabeçalho Prancheto.IA */}
        <div className="p-4 sm:p-6 bg-surface-card border-b border-surface-border flex-shrink-0">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTelaAtiva('builder')}
                  className="p-1.5 rounded-xl border border-surface-border hover:bg-surface-hover text-ink-primary transition-colors cursor-pointer"
                  title="Voltar ao Construtor"
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2.4} />
                </button>
                <div>
                  <h2 className="text-xl font-black text-ink-primary tracking-tight">
                    Selecione um Serviço
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    {fluxoAlvo === 'gatilho'
                      ? 'Escolha qual canal ou ferramenta irá iniciar este fluxo.'
                      : 'Escolha qual canal ou ferramenta irá executar a ação.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Campo de Busca */}
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                strokeWidth={2}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="text"
                placeholder="Pesquisar por nome do serviço ou palavra-chave..."
                value={buscaServico}
                onChange={(e) => setBuscaServico(e.target.value)}
                autoFocus
                className="h-9 w-full pl-9 pr-4 rounded-xl border border-surface-border bg-surface-subtle text-xs font-medium text-ink-primary outline-none focus:border-brand-primary focus:bg-surface-card transition-colors shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Grade de Serviços Responsiva */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {servicosFiltrados.map((servico) => {
              const Icone = servico.icone;
              return (
                <div
                  key={servico.id}
                  onClick={() => handleSelecionarServico(servico)}
                  style={{ backgroundColor: servico.cor }}
                  className="aspect-square rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer text-center group relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mb-2.5 shadow-xs">
                    <HugeiconsIcon icon={Icone} size={28} strokeWidth={2.2} className="text-white" />
                  </div>
                  <span className="text-sm font-black tracking-tight leading-snug">
                    {servico.nome}
                  </span>
                  <span className="text-[10px] text-white/75 mt-1 line-clamp-1 leading-tight">
                    {servico.descricao}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA 2: ESCOLHER EVENTO OU AÇÃO DO SERVIÇO ───
  if (telaAtiva === 'escolher_acao' && servicoSelecionado) {
    const listaItens =
      fluxoAlvo === 'gatilho' ? servicoSelecionado.gatilhos : servicoSelecionado.acoes;
    const IconeServ = servicoSelecionado.icone;

    return (
      <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
        {/* Banner do Serviço */}
        <div
          style={{ backgroundColor: servicoSelecionado.cor }}
          className="p-6 sm:p-8 text-white flex-shrink-0 transition-colors shadow-md"
        >
          <div className="max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setTelaAtiva('escolher_servico')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 font-semibold text-xs mb-4 cursor-pointer transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.4} />
              <span>Voltar aos serviços</span>
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                <HugeiconsIcon icon={IconeServ} size={30} strokeWidth={2.2} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black">{servicoSelecionado.nome}</h2>
                <p className="text-xs text-white/85 mt-0.5 max-w-md">{servicoSelecionado.descricao}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Ações / Gatilhos em Cards Prancheto */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="pb-1">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
                {fluxoAlvo === 'gatilho' ? 'Gatilhos Disponíveis' : 'Ações Disponíveis'}
              </span>
            </div>

            {listaItens.map((item) => (
              <div
                key={item.type}
                onClick={() => handleSelecionarAcao(item)}
                className="rounded-2xl border border-surface-border bg-surface-card p-4 sm:p-5 hover:border-brand-primary/40 hover:shadow-md transition-all cursor-pointer space-y-1.5 group"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-ink-primary group-hover:text-brand-primary transition-colors">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span
                      style={{ backgroundColor: servicoSelecionado.cor }}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg text-white shadow-2xs"
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed">{item.shortDesc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA 3: CONFIGURAR GATILHO OU AÇÃO ───
  if (telaAtiva === 'configurar_acao' && servicoSelecionado && itemCatalogoSelecionado) {
    const IconeServ = servicoSelecionado.icone;

    return (
      <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
        {/* Topo com botão voltar */}
        <div className="p-4 sm:p-6 bg-surface-card border-b border-surface-border flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTelaAtiva('escolher_acao')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border hover:bg-surface-hover text-ink-primary font-bold text-xs cursor-pointer transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.4} />
              <span>Voltar</span>
            </button>
            <span className="text-xs font-bold text-ink-muted">
              {fluxoAlvo === 'gatilho' ? 'Configuração do Gatilho' : 'Configuração da Ação'}
            </span>
          </div>
        </div>

        {/* Conteúdo rolável de configuração */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Bloco de Apresentação */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-5 flex items-center gap-4 shadow-xs">
              <div
                style={{ backgroundColor: servicoSelecionado.cor }}
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
              >
                <HugeiconsIcon icon={IconeServ} size={26} strokeWidth={2.2} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink-primary">
                    {itemCatalogoSelecionado.title}
                  </h2>
                  <span
                    style={{ backgroundColor: servicoSelecionado.cor }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg text-white"
                  >
                    {servicoSelecionado.nome}
                  </span>
                </div>
                <p className="text-xs text-ink-secondary">{itemCatalogoSelecionado.shortDesc}</p>
              </div>
            </div>

            {/* Inputs de Configuração */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6 shadow-xs space-y-4">
              {/* Mudança de Etapa */}
              {itemCatalogoSelecionado.type === 'trigger_stage_changed' && (
                <>
                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Etapa de Origem do Lead
                    </FieldLabel>
                    <Select
                      value={configTemp.etapaOrigem || 'qualquer'}
                      onValueChange={(v) => setConfigTemp((p) => ({ ...p, etapaOrigem: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-surface-border font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="qualquer">Qualquer etapa anterior</SelectItem>
                        {FUNIL_LEAD.map((etapa) => (
                          <SelectItem key={etapa.key} value={etapa.key}>
                            {etapa.emoji} {etapa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Mover para (Etapa Destino)
                    </FieldLabel>
                    <Select
                      value={configTemp.etapaDestino || 'chamei'}
                      onValueChange={(v) => setConfigTemp((p) => ({ ...p, etapaDestino: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-surface-border font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FUNIL_LEAD.map((etapa) => (
                          <SelectItem key={etapa.key} value={etapa.key}>
                            {etapa.emoji} {etapa.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-surface-border bg-surface-subtle">
                    <div>
                      <p className="text-xs font-bold text-ink-primary">Apenas horário comercial</p>
                      <p className="text-[11px] text-ink-muted">Segunda a Sexta, 08:00 às 19:00</p>
                    </div>
                    <Switch
                      size="sm"
                      variant="violet"
                      checked={Boolean(configTemp.apenasHorarioComercial)}
                      onCheckedChange={(checked) =>
                        setConfigTemp((p) => ({ ...p, apenasHorarioComercial: checked }))
                      }
                    />
                  </div>
                </>
              )}

              {/* Envio de WhatsApp */}
              {itemCatalogoSelecionado.type === 'action_whatsapp_text' && (
                <>
                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Canal de Disparo WhatsApp
                    </FieldLabel>
                    <Select
                      value={configTemp.conexaoId || conexoes[0]?.id || 'evo-comercial'}
                      onValueChange={(v) => setConfigTemp((p) => ({ ...p, conexaoId: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-surface-border font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {conexoes.map((con) => (
                          <SelectItem key={con.id} value={con.id}>
                            {con.status === 'conectado' ? '🟢 ' : '🔴 '}
                            {con.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Mensagem de Disparo
                    </FieldLabel>
                    <textarea
                      rows={5}
                      value={configTemp.mensagem || ''}
                      onChange={(e) => setConfigTemp((p) => ({ ...p, mensagem: e.target.value }))}
                      placeholder="Olá {{lead.nome}}! Tudo bem com você?"
                      className="w-full rounded-xl border border-surface-border bg-surface-card p-3 text-xs leading-relaxed font-semibold text-ink-primary outline-none focus:border-brand-primary resize-y transition-colors"
                    />
                  </Field>

                  {/* Chips de tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                      Variáveis Dinâmicas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {VARIAVEIS_DISPONIVEIS.map((v) => (
                        <button
                          key={v.token}
                          type="button"
                          onClick={() => {
                            setConfigTemp((p) => ({
                              ...p,
                              mensagem: `${p.mensagem || ''} ${v.token}`,
                            }));
                          }}
                          className="px-2.5 py-1 rounded-lg border border-surface-border bg-surface-subtle hover:bg-surface-hover text-[11px] font-bold text-ink-primary transition-colors cursor-pointer"
                        >
                          {v.token}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Pranchetinho IA */}
              {itemCatalogoSelecionado.type === 'ai_pranchetinho' && (
                <>
                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Tom de Voz da IA
                    </FieldLabel>
                    <Select
                      value={configTemp.tom || 'consultivo'}
                      onValueChange={(v) => setConfigTemp((p) => ({ ...p, tom: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-surface-border font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultivo">Cordial & Consultivo</SelectItem>
                        <SelectItem value="vendedor_ativo">Vendedor Persuasivo</SelectItem>
                        <SelectItem value="direto">Direto & Objetivo</SelectItem>
                        <SelectItem value="formal">Corporativo & Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">
                      Instruções para o Pranchetinho IA
                    </FieldLabel>
                    <textarea
                      rows={4}
                      value={configTemp.promptInstrucao || ''}
                      onChange={(e) =>
                        setConfigTemp((p) => ({ ...p, promptInstrucao: e.target.value }))
                      }
                      placeholder="Ex: Adapte uma mensagem cordial citando o nome da empresa e propondo um alinhamento rápido."
                      className="w-full rounded-xl border border-surface-border bg-surface-card p-3 text-xs leading-relaxed font-semibold text-ink-primary outline-none focus:border-brand-primary resize-y transition-colors"
                    />
                  </Field>
                </>
              )}

              {/* Delay / Atraso */}
              {itemCatalogoSelecionado.type === 'logic_delay' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">Tempo</FieldLabel>
                    <input
                      type="number"
                      min={1}
                      value={configTemp.duracao || 30}
                      onChange={(e) =>
                        setConfigTemp((p) => ({ ...p, duracao: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-card text-xs font-semibold text-ink-primary outline-none focus:border-brand-primary"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-bold text-ink-primary">Unidade</FieldLabel>
                    <Select
                      value={configTemp.unidade || 'minutos'}
                      onValueChange={(v) => setConfigTemp((p) => ({ ...p, unidade: v }))}
                    >
                      <SelectTrigger className="rounded-xl border-surface-border font-semibold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minutos">Minutos</SelectItem>
                        <SelectItem value="horas">Horas</SelectItem>
                        <SelectItem value="dias">Dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              )}

              {/* Tarefas CRM */}
              {itemCatalogoSelecionado.type === 'action_crm_task' && (
                <Field>
                  <FieldLabel className="text-xs font-bold text-ink-primary">
                    Título da Tarefa
                  </FieldLabel>
                  <input
                    type="text"
                    value={configTemp.tituloTarefa || ''}
                    onChange={(e) =>
                      setConfigTemp((p) => ({ ...p, tituloTarefa: e.target.value }))
                    }
                    placeholder="Ex: Ligar para confirmar proposta"
                    className="w-full px-3 py-2 rounded-xl border border-surface-border bg-surface-card text-xs font-semibold text-ink-primary outline-none focus:border-brand-primary"
                  />
                </Field>
              )}
            </div>

            {/* Botão de Conclusão */}
            <button
              type="button"
              onClick={handleConcluirConfiguracao}
              className="w-full h-10 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2.2} />
              <span>{fluxoAlvo === 'gatilho' ? 'Confirmar Gatilho' : 'Confirmar Ação'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA 4: REVISÃO E FINALIZAÇÃO ───
  if (telaAtiva === 'rever_terminar') {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
        {/* Topo com botão voltar */}
        <div className="p-4 sm:p-6 bg-surface-card border-b border-surface-border flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTelaAtiva('builder')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border hover:bg-surface-hover text-ink-primary font-semibold text-xs cursor-pointer transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.4} />
              <span>Voltar ao Construtor</span>
            </button>
            <span className="text-xs font-bold text-ink-muted">Finalização</span>
          </div>
        </div>

        {/* Formulário de Finalização */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Ícones dos serviços envolvidos */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                {servicosEnvolvidos.map((s, idx) => {
                  const Icone = s.icone;
                  return (
                    <div
                      key={idx}
                      style={{ backgroundColor: s.cor }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs"
                      title={s.nome}
                    >
                      <HugeiconsIcon icon={Icone} size={22} strokeWidth={2.2} />
                    </div>
                  );
                })}
              </div>

              {/* Nome da Automação */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-ink-primary">
                  <span>Nome da Automação</span>
                  <span className="text-ink-muted">{tituloAutomacao.length}/140</span>
                </div>

                <input
                  type="text"
                  maxLength={140}
                  value={tituloAutomacao}
                  onChange={(e) => setTituloAutomacao(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-surface-border bg-surface-subtle focus:bg-surface-card focus:border-brand-primary text-xs font-semibold text-ink-primary outline-none transition-colors"
                  placeholder="Ex: Quando cliente entrar em Negociação, enviar WhatsApp"
                />
                <p className="text-[11px] text-ink-muted">
                  Defina um nome claro para facilitar a identificação pela sua equipe.
                </p>
              </div>
            </div>

            {/* Botão de Finalizar */}
            <button
              type="button"
              onClick={handleTerminarAutomacao}
              className="w-full h-10 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2.2} />
              <span>Salvar e Ativar Automação</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA 5: DETALHES DA AUTOMAÇÃO ───
  if (telaAtiva === 'detalhes') {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
        {/* Cabeçalho de Navegação */}
        <div className="p-4 sm:p-6 bg-surface-card border-b border-surface-border flex-shrink-0">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenFluxos}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-surface-border hover:bg-surface-hover text-ink-primary font-semibold text-xs cursor-pointer transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2.4} />
              <span>Voltar às Automações</span>
            </button>

            <button
              type="button"
              onClick={() => setTelaAtiva('builder')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity cursor-pointer"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={15} />
              <span>Editar no Construtor</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal de Detalhes */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 pb-12">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Cartão de Resumo da Automação */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {servicosEnvolvidos.map((s, idx) => {
                    const Icone = s.icone;
                    return (
                      <div
                        key={idx}
                        style={{ backgroundColor: s.cor }}
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs"
                      >
                        <HugeiconsIcon icon={Icone} size={22} strokeWidth={2.2} />
                      </div>
                    );
                  })}
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-ink-primary leading-tight">
                      {workflowAtual?.nome || tituloAutomacao || 'Automação'}
                    </h1>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      {workflowAtual?.descricao || 'Fluxo inteligente executado automaticamente pelo Prancheto.IA.'}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={simulacaoEstado.executando}
                    onClick={() => onExecutarSimulacao(workflowAtual)}
                    className="px-3.5 py-2 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs transition-opacity flex items-center gap-1.5 cursor-pointer"
                  >
                    <HugeiconsIcon icon={PlayIcon} size={15} strokeWidth={2.4} />
                    <span>{simulacaoEstado.executando ? 'Executando...' : 'Testar Automação'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTelaAtiva('rever_terminar')}
                    className="px-3.5 py-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-primary font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Renomear
                  </button>

                  {onExcluirWorkflow && (
                    <button
                      type="button"
                      onClick={() => onExcluirWorkflow(workflowAtual)}
                      className="px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Excluir esta automação"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Seletor Oficial do Design System Prancheto.IA */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-surface-border bg-surface-subtle">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-primary">Status da Automação</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                        workflowAtual?.ativo
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-surface-card text-ink-muted border border-surface-border'
                      }`}
                    >
                      {workflowAtual?.ativo ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    {workflowAtual?.ativo
                      ? 'Este fluxo está ativo e respondendo aos gatilhos cadastrados.'
                      : 'Este fluxo está temporariamente pausado e não disparará ações.'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-ink-secondary hidden sm:inline">
                    {workflowAtual?.ativo ? 'Ligado' : 'Desligado'}
                  </span>
                  <Switch
                    size="sm"
                    variant="success"
                    checked={Boolean(workflowAtual?.ativo)}
                    onCheckedChange={(val) => onToggleAtivo(workflowAtual?.id, val)}
                  />
                </div>
              </div>
            </div>

            {/* Linha do Tempo da Automação */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-xs space-y-6">
              <h2 className="text-sm font-extrabold text-ink-primary uppercase tracking-wider">
                Estrutura do Fluxo
              </h2>

              {/* Gatilho Inicial */}
              {gatilhoNo && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#0080FF] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    {getIconeNo(gatilhoNo.type, 'w-5 h-5 text-white')}
                  </div>

                  <div className="space-y-1 flex-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#0080FF]">
                      Quando este evento acontecer (Gatilho)
                    </span>
                    <h3 className="text-sm font-extrabold text-ink-primary">
                      {gatilhoNo.config?.customTitle || getCatalogoNo(gatilhoNo.type)?.title}
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      {getCatalogoNo(gatilhoNo.type)?.shortDesc}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <span className="px-2 py-0.5 rounded-md border border-surface-border bg-surface-subtle text-[11px] font-mono font-semibold text-ink-primary">
                        etapa_destino: {gatilhoNo.config?.etapaDestino || 'qualquer'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Conector */}
              <div className="w-0.5 h-6 bg-surface-border ml-5" />

              {/* Ações */}
              {passosAcoes.map((acao, idx) => {
                const serv = getServicoDoNo(acao.type);
                return (
                  <React.Fragment key={acao.id}>
                    {idx > 0 && <div className="w-0.5 h-6 bg-surface-border ml-5" />}
                    <div className="flex items-start gap-4">
                      <div
                        style={{ backgroundColor: serv?.cor || '#10B981' }}
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5"
                      >
                        {getIconeNo(acao.type, 'w-5 h-5 text-white')}
                      </div>

                      <div className="space-y-1 flex-1">
                        <span
                          style={{ color: serv?.cor || '#10B981' }}
                          className="text-[10px] font-black uppercase tracking-wider"
                        >
                          Então executar esta ação
                        </span>
                        <h3 className="text-sm font-extrabold text-ink-primary">
                          {acao.config?.customTitle || getCatalogoNo(acao.type)?.title}
                        </h3>
                        <p className="text-xs text-ink-secondary">
                          {getCatalogoNo(acao.type)?.shortDesc}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          <span className="px-2 py-0.5 rounded-md border border-surface-border bg-surface-subtle text-[11px] font-mono font-semibold text-ink-primary">
                            {acao.type === 'action_whatsapp_text'
                              ? 'disparo: WhatsApp Comercial'
                              : 'ação automática'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA PADRÃO: CONSTRUTOR LINEAR PRANCHETO.IA ───
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-surface-subtle dark:bg-[#0F172A] overflow-hidden select-none font-sans">
      {/* Topo Limpo do Construtor */}
      <header className="h-16 px-4 sm:px-6 bg-surface-card border-b border-surface-border flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenFluxos}
            className="p-1.5 rounded-xl border border-surface-border hover:bg-surface-hover text-ink-primary transition-colors cursor-pointer"
            title="Voltar para a lista"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2.4} />
          </button>
          <div>
            <h1 className="text-sm sm:text-base font-black text-ink-primary tracking-tight">
              Construtor de Automação
            </h1>
            <p className="text-[11px] text-ink-muted">Configure o gatilho e as ações automáticas.</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface-subtle border border-surface-border p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setTelaAtiva('builder')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              telaAtiva === 'builder'
                ? 'bg-surface-card text-ink-primary shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Fluxo
          </button>
          <button
            type="button"
            onClick={() => setTelaAtiva('detalhes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              telaAtiva === 'detalhes'
                ? 'bg-surface-card text-ink-primary shadow-xs'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            Detalhes do Fluxo
          </button>
        </div>
      </header>

      {/* Corpo Central do Construtor com Passos Conectados */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-xl mx-auto space-y-0">
          {/* PASSO 1: GATILHO (QUANDO...) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block pl-1">
              Passo 1 · Gatilho Inicial
            </span>

            {!gatilhoNo ? (
              <div
                onClick={handleIniciarAdicaoGatilho}
                className="rounded-2xl border-2 border-dashed border-surface-border-strong hover:border-brand-primary bg-surface-card p-6 flex items-center justify-between gap-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-subtle group-hover:bg-brand-primary/10 text-ink-muted group-hover:text-brand-primary flex items-center justify-center transition-colors">
                    <HugeiconsIcon icon={FlashIcon} size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-primary">
                      Definir Gatilho Inicial
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Clique para escolher o evento que iniciará o fluxo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.4} />
                  <span>Definir</span>
                </button>
              </div>
            ) : (
              <CardEtapaFluxo
                etapaLabel="Quando acontecer:"
                no={gatilhoNo}
                servico={getServicoDoNo(gatilhoNo.type)}
                statusSimulacao={simulacaoEstado.nosStatus[gatilhoNo.id]}
                onEditar={() => handleEditarNoExistente(gatilhoNo)}
                onRemover={() => handleRemoverNo(gatilhoNo.id)}
              />
            )}
          </div>

          {/* Conector Vertical com Botão de Adição */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-0.5 h-6 bg-surface-border" />

            <button
              type="button"
              onClick={() => setMenuIntermediarioAberto((v) => !v)}
              className="px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-primary font-semibold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer z-10"
              title="Adicionar etapa intermediária"
            >
              <HugeiconsIcon
                icon={menuIntermediarioAberto ? MinusSignIcon : Add01Icon}
                size={14}
                strokeWidth={2.4}
              />
              <span>{menuIntermediarioAberto ? 'Fechar' : 'Adicionar Passo'}</span>
            </button>

            <div className="w-0.5 h-6 bg-surface-border" />
          </div>

          {/* Menu de Passos Intermediários */}
          {menuIntermediarioAberto && (
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3.5 shadow-md space-y-2 mb-4 animate-scale-up">
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-ink-primary">
                    Personalização com IA
                  </h4>
                  <p className="text-[11px] text-ink-muted">
                    Gere mensagens adaptadas ao contexto do lead.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleIniciarAdicaoIntermediario('ia')}
                  className="px-3 py-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              <div className="h-px bg-surface-border" />

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-ink-primary">Filtro de Regras</h4>
                  <p className="text-[11px] text-ink-muted">
                    Execute apenas se atender a critérios específicos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleIniciarAdicaoIntermediario('filtro')}
                  className="px-3 py-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Adicionar
                </button>
              </div>

              <div className="h-px bg-surface-border" />

              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-hover transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-ink-primary">Atraso / Delay</h4>
                  <p className="text-[11px] text-ink-muted">
                    Aguarde minutos ou horas antes da próxima ação.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleIniciarAdicaoIntermediario('atraso')}
                  className="px-3 py-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

          {/* PASSO 2: AÇÃO (ENTÃO...) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block pl-1">
              Passo 2 · Ação a Executar
            </span>

            {passosAcoes.length === 0 ? (
              <div
                onClick={handleIniciarAdicaoAcao}
                className="rounded-2xl border-2 border-dashed border-surface-border-strong hover:border-brand-primary bg-surface-card p-6 flex items-center justify-between gap-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-subtle group-hover:bg-brand-primary/10 text-ink-muted group-hover:text-brand-primary flex items-center justify-center transition-colors">
                    <HugeiconsIcon icon={WhatsappIcon} size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-primary">
                      Definir Ação Automática
                    </h3>
                    <p className="text-xs text-ink-secondary">
                      Clique para escolher o que será disparado pelo fluxo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2.4} />
                  <span>Definir</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {passosAcoes.map((acao, idx) => (
                  <CardEtapaFluxo
                    key={acao.id}
                    etapaLabel={idx === 0 ? 'Então executar:' : 'E também:'}
                    no={acao}
                    servico={getServicoDoNo(acao.type)}
                    statusSimulacao={simulacaoEstado.nosStatus[acao.id]}
                    onEditar={() => handleEditarNoExistente(acao)}
                    onRemover={() => handleRemoverNo(acao.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Botões Finais de Ação */}
          <div className="pt-8 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                if (gatilhoNo && passosAcoes.length > 0) {
                  setTelaAtiva('rever_terminar');
                }
              }}
              disabled={!gatilhoNo || passosAcoes.length === 0}
              className={`w-full h-11 rounded-xl font-semibold text-xs sm:text-sm shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 ${
                gatilhoNo && passosAcoes.length > 0
                  ? 'bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 text-white cursor-pointer'
                  : 'bg-surface-border text-ink-muted cursor-not-allowed'
              }`}
            >
              <span>Continuar e Finalizar</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2.4} />
            </button>

            {gatilhoNo && passosAcoes.length > 0 && (
              <button
                type="button"
                disabled={simulacaoEstado.executando}
                onClick={() => onExecutarSimulacao(workflowAtual)}
                className="w-full h-10 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-xs font-semibold text-ink-primary shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <HugeiconsIcon icon={PlayIcon} size={15} strokeWidth={2.4} />
                <span>
                  {simulacaoEstado.executando ? 'Testando fluxo...' : 'Testar Automação Agora'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================
// SUBCOMPONENTE: Card de Etapa do Fluxo (Design Prancheto.IA)
// =============================================================
const CardEtapaFluxo = ({
  etapaLabel = 'Quando acontecer:',
  no,
  servico,
  statusSimulacao,
  onEditar,
  onRemover,
}) => {
  const Icone = servico?.icone || FlashIcon;
  const meta = getCatalogoNo(no.type);
  const titulo = no.config?.customTitle || meta?.title || 'Ação';
  const badge = meta?.badge || servico?.nome || 'Tempo real';

  let bordaSimulacao = '';
  if (statusSimulacao === 'running') {
    bordaSimulacao = 'ring-4 ring-amber-400 animate-pulse';
  } else if (statusSimulacao === 'success') {
    bordaSimulacao = 'ring-4 ring-emerald-400 shadow-xl';
  }

  return (
    <div
      style={{ backgroundColor: servico?.cor || '#0080FF' }}
      className={`rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all flex items-center justify-between gap-4 cursor-pointer ${bordaSimulacao}`}
      onClick={onEditar}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center flex-shrink-0 shadow-xs">
          <HugeiconsIcon icon={Icone} size={24} strokeWidth={2.2} className="text-white" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
            {etapaLabel}
          </span>
          <h3 className="text-sm sm:text-base font-bold leading-tight truncate">{titulo}</h3>
          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/20 text-white backdrop-blur-xs">
            {badge}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onEditar}
          className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
          title="Editar configurações"
        >
          <HugeiconsIcon icon={Settings02Icon} size={18} strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={onRemover}
          className="p-2 rounded-xl hover:bg-white/20 transition-colors text-white cursor-pointer"
          title="Remover etapa"
        >
          <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

// Retorna o ícone Hugeicon correspondente ao tipo de nó
const getIconeNo = (type, className = 'w-4 h-4') => {
  switch (type) {
    case 'trigger_stage_changed':
    case 'trigger_lead_created':
    case 'trigger_lead_won':
    case 'trigger_lead_lost':
    case 'trigger_inactivity':
      return <HugeiconsIcon icon={FlashIcon} size={20} strokeWidth={2} className={className} />;
    case 'action_whatsapp_text':
      return <HugeiconsIcon icon={WhatsappIcon} size={20} strokeWidth={2} className={className} />;
    case 'ai_pranchetinho':
      return <HugeiconsIcon icon={AiSparklesIcon} size={20} strokeWidth={2} className={className} />;
    case 'logic_delay':
      return <HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={2} className={className} />;
    case 'action_crm_task':
      return <HugeiconsIcon icon={Task01Icon} size={20} strokeWidth={2} className={className} />;
    default:
      return <HugeiconsIcon icon={FlashIcon} size={20} strokeWidth={2} className={className} />;
  }
};

export default WorkflowLinearBuilder;
