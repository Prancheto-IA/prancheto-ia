// =============================================================
// PRANCHETO.IA - PÁGINA DE AUTOMAÇÕES STUDIO (ESTILO N8N TOP-DOWN)
// Alterna entre a visão Studio Canvas full-bleed e a página Lista
// de Workflows (ao clicar no botão voltar), com modais ReUI para
// Conexões WhatsApp, Logs de Execução e Simulador CRM.
// =============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Plus,
  Search,
  Play,
  Copy,
  Trash2,
  ArrowRight,
  Zap,
  Sparkles,
  Settings,
  Clock,
  GitBranch,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';
import { useLeads, FUNIL_LEAD, funilInfo } from '../../hooks/useCRM.js';
import { Badge, BadgeDot } from '@/components/reui/badge';
import { Switch } from '@/components/reui/switch';
import { AutocompleteReUI9 } from '@/components/reui/c-autocomplete-9';
import { SimpleTooltip } from '@/components/reui/tooltip';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import WorkflowCanvas from './WorkflowCanvas.jsx';
import WhatsAppConexoes from './WhatsAppConexoes.jsx';
import LogsExecucao from './LogsExecucao.jsx';
import {
  STORAGE_KEY_WORKFLOWS,
  STORAGE_KEY_CONEXOES,
  STORAGE_KEY_LOGS,
  WORKFLOWS_INICIAIS,
  CONEXOES_INICIAIS,
  LOGS_INICIAIS,
  LEADS_DEMO,
  MESH_GRADIENTS,
  getCatalogoNo,
  ordenarNosFluxo,
  interpolarMensagemWhatsApp,
} from './automacoesData.js';

const lerStorage = (chaveBase, tenantId, fallback) => {
  const chave = tenantId ? `${chaveBase}_${tenantId}` : chaveBase;
  try {
    const bruto = localStorage.getItem(chave);
    if (!bruto) return fallback;
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const salvarStorage = (chaveBase, tenantId, dados) => {
  const chave = tenantId ? `${chaveBase}_${tenantId}` : chaveBase;
  try {
    localStorage.setItem(chave, JSON.stringify(dados));
  } catch {
    // localStorage indisponível (modo privado/quota) — segue em memória
  }
};

const criarNovoWorkflow = (contador) => ({
  id: `wf-${Date.now().toString(36)}`,
  nome: `Nova Automação #${contador}`,
  descricao: 'Fluxo automático disparado quando o cliente muda de etapa no funil CRM.',
  ativo: true,
  categoria: 'Personalizado',
  execucoesTotal: 0,
  taxaEntrega: 100,
  tempoMedio: '1,0s',
  ultimaExecucao: 'Ainda não executado',
  nodes: [
    {
      id: 'n1',
      type: 'trigger_stage_changed',
      nodeRole: 'start',
      position: { x: 482, y: 46 },
      config: {
        customTitle: 'Cliente Movido de Etapa (.CRM)',
        phaseLabel: 'Gatilho Inicial',
        meshKey: 'brand',
        etapaOrigem: 'qualquer',
        etapaDestino: 'nao_chamei',
        apenasHorarioComercial: true,
      },
    },
    {
      id: 'n2',
      type: 'ai_pranchetinho',
      nodeRole: 'step',
      position: { x: 482, y: 174 },
      config: {
        customTitle: 'Personalização com IA',
        phaseLabel: 'Fase 1',
        meshKey: 'magenta',
        tom: 'consultivo',
        promptInstrucao: 'Adaptar mensagem cordial ao contexto do cliente.',
        salvarVariavel: '{{ia.mensagem_gerada}}',
      },
    },
    {
      id: 'n3',
      type: 'action_whatsapp_text',
      nodeRole: 'final',
      position: { x: 482, y: 302 },
      config: {
        customTitle: 'Enviar Mensagem WhatsApp',
        phaseLabel: 'Final · Disparo',
        meshKey: 'emerald',
        conexaoId: 'evo-comercial',
        tipoEnvio: 'texto',
        mensagem:
          'Olá {{lead.nome}}! 👋\n\nAvançamos o atendimento da *{{lead.empresa}}* para *{{etapa.nova}}*.\n\n{{ia.mensagem_gerada}}',
      },
    },
  ],
  edges: [
    { id: 'e1-2', source: 'n1', target: 'n2' },
    { id: 'e2-3', source: 'n2', target: 'n3' },
  ],
});

const Automacoes = () => {
  const tenantId = useAuthStore((s) => s.usuario?.tenant_id);
  const { adicionarNotificacao } = useUIStore();
  const { leads: leadsCRM, carregar: carregarLeadsCRM } = useLeads();

  const [workflows, setWorkflows] = useState(() =>
    lerStorage(STORAGE_KEY_WORKFLOWS, tenantId, WORKFLOWS_INICIAIS)
  );
  const [conexoes, setConexoes] = useState(() => {
    const salvas = lerStorage(STORAGE_KEY_CONEXOES, tenantId, CONEXOES_INICIAIS);
    const filtradas = salvas.filter((c) => c.provider !== 'zapi' && c.id !== 'zapi-suporte');
    return filtradas.length > 0 ? filtradas : CONEXOES_INICIAIS;
  });
  const [logs, setLogs] = useState(() =>
    lerStorage(STORAGE_KEY_LOGS, tenantId, LOGS_INICIAIS)
  );
  const [workflowSelecionadoId, setWorkflowSelecionadoId] = useState(
    () => lerStorage(STORAGE_KEY_WORKFLOWS, tenantId, WORKFLOWS_INICIAIS)[0]?.id || null
  );
  const [ultimoSalvoTexto, setUltimoSalvoTexto] = useState('agora');

  // Visão ativa na seção Workflows: 'lista' (tela inicial) | 'studio' (canvas)
  const [modoVisao, setModoVisao] = useState('lista');
  const [modalConexoesAberto, setModalConexoesAberto] = useState(false);
  const [modalLogsAberto, setModalLogsAberto] = useState(false);
  const [modalTesteAberto, setModalTesteAberto] = useState(false);

  // Filtros da página "Lista de Workflows"
  const [buscaFluxo, setBuscaFluxo] = useState('');
  const [filtroStatusFluxo, setFiltroStatusFluxo] = useState('todos');

  // Simulação passo a passo no Canvas
  const [simulacaoEstado, setSimulacaoEstado] = useState({
    executando: false,
    nosStatus: {},
  });
  const timersRef = useRef([]);

  // Estado do Simulador de Lead CRM
  const [testeLeadNome, setTesteLeadNome] = useState(LEADS_DEMO[0].nome);
  const [testeLeadSelecionado, setTesteLeadSelecionado] = useState(LEADS_DEMO[0]);
  const [testeEtapaDestino, setTesteEtapaDestino] = useState('chamei');
  const [testeWorkflowId, setTesteWorkflowId] = useState(
    () => lerStorage(STORAGE_KEY_WORKFLOWS, tenantId, WORKFLOWS_INICIAIS)[0]?.id || ''
  );

  useEffect(() => {
    carregarLeadsCRM();
  }, [carregarLeadsCRM]);

  useEffect(() => {
    salvarStorage(STORAGE_KEY_WORKFLOWS, tenantId, workflows);
  }, [workflows, tenantId]);

  useEffect(() => {
    salvarStorage(STORAGE_KEY_CONEXOES, tenantId, conexoes);
  }, [conexoes, tenantId]);

  useEffect(() => {
    salvarStorage(STORAGE_KEY_LOGS, tenantId, logs);
  }, [logs, tenantId]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const leadsDisponiveis = leadsCRM.length > 0 ? leadsCRM : LEADS_DEMO;
  const autocompleteLeadItems = leadsDisponiveis.map((lead) => ({
    id: lead.id,
    name: lead.nome || 'Sem nome',
    subtitle: [lead.empresa, lead.whatsapp || lead.telefone, funilInfo(lead.status_funil).label]
      .filter(Boolean)
      .join(' · '),
    keywords: [lead.empresa, lead.whatsapp, lead.telefone, lead.status_funil].filter(Boolean),
    leadObj: lead,
  }));

  const workflowAtual =
    workflows.find((w) => w.id === workflowSelecionadoId) || workflows[0] || null;

  const atualizarWorkflow = useCallback((id, updater) => {
    setWorkflows((prev) =>
      prev.map((wf) => (wf.id === id ? (typeof updater === 'function' ? updater(wf) : updater) : wf))
    );
    setUltimoSalvoTexto('agora');
  }, []);

  const alternarAtivoWorkflow = useCallback(
    (id, novoAtivo) => {
      atualizarWorkflow(id, (wf) => ({ ...wf, ativo: novoAtivo }));
      const alvo = workflows.find((w) => w.id === id);
      adicionarNotificacao(
        'info',
        `Automação "${alvo?.nome || 'Automação'}" ${novoAtivo ? 'ativada' : 'pausada'}.`
      );
    },
    [atualizarWorkflow, workflows, adicionarNotificacao]
  );

  const handleCriarNovoFluxo = () => {
    const novo = criarNovoWorkflow(workflows.length + 1);
    setWorkflows((prev) => [novo, ...prev]);
    setWorkflowSelecionadoId(novo.id);
    setModoVisao('studio');
    adicionarNotificacao('success', `"${novo.nome}" criada no Studio!`);
  };

  const handleDuplicarWorkflow = (wf) => {
    const copia = {
      ...wf,
      id: `wf-${Date.now().toString(36)}`,
      nome: `${wf.nome} (Cópia)`,
      ativo: false,
      execucoesTotal: 0,
      ultimaExecucao: 'Ainda não executado',
    };
    setWorkflows((prev) => [copia, ...prev]);
    adicionarNotificacao('success', `Automação duplicada como "${copia.nome}".`);
  };

  const handleExcluirWorkflow = (id) => {
    if (workflows.length <= 1) {
      adicionarNotificacao('warning', 'Mantenha ao menos uma automação cadastrada.');
      return;
    }
    const alvo = workflows.find((w) => w.id === id);
    const restantes = workflows.filter((w) => w.id !== id);
    setWorkflows(restantes);
    if (workflowSelecionadoId === id) {
      setWorkflowSelecionadoId(restantes[0]?.id || null);
    }
    adicionarNotificacao('info', `Automação "${alvo?.nome || ''}" removida.`);
  };

  const atualizarConexao = useCallback((id, patch) => {
    setConexoes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const executarSimulacaoFluxo = useCallback(
    (wf, leadParam = null, etapaDestinoOverride = null) => {
      if (!wf) return;
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.splice(0, timersRef.current.length);

      const ordered = ordenarNosFluxo(wf.nodes, wf.edges);
      if (ordered.length === 0) {
        adicionarNotificacao('warning', 'Adicione ao menos um bloco ao fluxo antes de executar.');
        return;
      }

      const leadTeste = leadParam || testeLeadSelecionado || leadsDisponiveis[0] || LEADS_DEMO[0];
      const triggerNo = ordered.find((n) => n.type.startsWith('trigger_'));
      const etapaOrigem =
        triggerNo?.config?.etapaOrigem && triggerNo.config.etapaOrigem !== 'qualquer'
          ? triggerNo.config.etapaOrigem
          : leadTeste.status_funil || 'nao_chamei';
      const etapaDestino =
        etapaDestinoOverride || triggerNo?.config?.etapaDestino || 'chamei';

      setWorkflowSelecionadoId(wf.id);
      setModoVisao('studio');
      setSimulacaoEstado({ executando: true, nosStatus: {} });

      ordered.forEach((no, idx) => {
        const inicioDelay = idx * 360;
        const fimDelay = inicioDelay + 280;

        const t1 = setTimeout(() => {
          setSimulacaoEstado((prev) => ({
            ...prev,
            nosStatus: { ...prev.nosStatus, [no.id]: 'running' },
          }));
        }, inicioDelay);

        const t2 = setTimeout(() => {
          setSimulacaoEstado((prev) => ({
            ...prev,
            nosStatus: { ...prev.nosStatus, [no.id]: 'success' },
          }));
        }, fimDelay);

        timersRef.current.push(t1, t2);
      });

      const tempoTotal = ordered.length * 360 + 220;
      const tFinal = setTimeout(() => {
        const whatsappNo = ordered.find((n) => n.type === 'action_whatsapp_text');
        const conexaoUsada =
          conexoes.find((c) => c.id === whatsappNo?.config?.conexaoId) || conexoes[0];
        const msgFinal = whatsappNo
          ? interpolarMensagemWhatsApp(whatsappNo.config.mensagem, {
              ...leadTeste,
              etapaAnterior: etapaOrigem,
              status_funil: etapaDestino,
            })
          : 'Fluxo concluído sem bloco de WhatsApp configurado.';

        const novoLog = {
          id: `log-${Date.now().toString(36)}`,
          workflowId: wf.id,
          workflowNome: wf.nome,
          leadNome: leadTeste.nome,
          leadEmpresa: leadTeste.empresa || 'Empresa não informada',
          leadTelefone: leadTeste.whatsapp || leadTeste.telefone || '+55 11 99999-0000',
          etapaOrigem,
          etapaDestino,
          conexaoNome: conexaoUsada?.nome || 'Evolution API',
          status: 'concluido',
          duracaoMs: ordered.length * 240 + 160,
          criadoEm: new Date().toISOString(),
          mensagemEnviada: msgFinal,
          passos: ordered.map((no) => {
            const meta = getCatalogoNo(no.type);
            return {
              id: no.id,
              titulo: no.config?.customTitle || meta.title,
              status: 'ok',
              tempoMs: 85 + Math.floor(Math.random() * 210),
              detalhe:
                no.type === 'action_whatsapp_text'
                  ? `Simulação entregue via ${conexaoUsada?.nome || 'WhatsApp'}`
                  : `Executado para ${leadTeste.nome}`,
            };
          }),
        };

        setLogs((prev) => [novoLog, ...prev]);
        atualizarWorkflow(wf.id, (prevWf) => ({
          ...prevWf,
          execucoesTotal: (prevWf.execucoesTotal || 0) + 1,
          ultimaExecucao: 'Agora mesmo',
        }));

        if (conexaoUsada) {
          atualizarConexao(conexaoUsada.id, {
            disparosHoje: (conexaoUsada.disparosHoje || 0) + 1,
          });
        }

        setSimulacaoEstado((prev) => ({ ...prev, executando: false }));
        adicionarNotificacao(
          'success',
          `Execução concluída para ${leadTeste.nome} (${funilInfo(etapaDestino).label})!`
        );
      }, tempoTotal);

      timersRef.current.push(tFinal);
    },
    [
      testeLeadSelecionado,
      leadsDisponiveis,
      conexoes,
      atualizarWorkflow,
      atualizarConexao,
      adicionarNotificacao,
    ]
  );

  const fluxosFiltrados = workflows.filter((wf) => {
    if (filtroStatusFluxo === 'ativos' && !wf.ativo) return false;
    if (filtroStatusFluxo === 'pausados' && wf.ativo) return false;
    if (!buscaFluxo.trim()) return true;
    const q = buscaFluxo.toLowerCase();
    return (
      wf.nome.toLowerCase().includes(q) ||
      (wf.descricao || '').toLowerCase().includes(q) ||
      (wf.categoria || '').toLowerCase().includes(q)
    );
  });

  const totalAtivos = workflows.filter((wf) => wf.ativo).length;
  const totalExecucoes = workflows.reduce((acc, wf) => acc + (wf.execucoesTotal || 0), 0);
  const conexoesOnline = conexoes.filter((c) => c.status === 'conectado').length;

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full">
      {modoVisao === 'studio' ? (
        /* STUDIO CANVAS EM TELA CHEIA */
        <WorkflowCanvas
          workflows={workflows}
          workflowAtual={workflowAtual}
          conexoes={conexoes}
          leadPreview={testeLeadSelecionado}
          totalLogs={logs.length}
          ultimoSalvoTexto={ultimoSalvoTexto}
          onUpdateWorkflow={atualizarWorkflow}
          onToggleAtivo={alternarAtivoWorkflow}
          onExecutarSimulacao={(wf) => executarSimulacaoFluxo(wf)}
          onOpenFluxos={() => setModoVisao('lista')}
          onOpenConexoes={() => setModalConexoesAberto(true)}
          onOpenLogs={() => setModalLogsAberto(true)}
          onOpenSimuladorLead={() => {
            setTesteWorkflowId(workflowAtual?.id || workflows[0]?.id || '');
            setModalTesteAberto(true);
          }}
          simulacaoEstado={simulacaoEstado}
        />
      ) : (
        /* PÁGINA LISTA DE WORKFLOWS (AINDA NA SEÇÃO WORKFLOW) */
        <div className="flex-1 w-full overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Cabeçalho da página */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink-primary">
                  Automações
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-ink-secondary">
                Gerencie suas automações por etapa do funil, acompanhe execuções e crie novas automações.
              </p>
            </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalConexoesAberto(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3.5 py-2 text-xs font-semibold text-ink-primary transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-ink-secondary" />
                  <span>Conexões WhatsApp</span>
                  <Badge variant={conexoesOnline > 0 ? 'success' : 'default'} size="xs">
                    <BadgeDot variant={conexoesOnline > 0 ? 'success' : 'default'} />
                    {conexoesOnline}/{conexoes.length}
                  </Badge>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTesteWorkflowId(workflowAtual?.id || workflows[0]?.id || '');
                    setModalTesteAberto(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3.5 py-2 text-xs font-semibold text-ink-primary transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                  <span>Simular Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={handleCriarNovoFluxo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Automação</span>
                </button>
              </div>
            </div>

            {/* Resumo rápido */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-1">
                <span className="text-[11px] font-semibold text-ink-secondary">
                  Total de Automações
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-ink-primary tabular-nums">
                    {workflows.length}
                  </span>
                  <Badge variant="outline" size="xs">
                    Studio
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-1">
                <span className="text-[11px] font-semibold text-ink-secondary">
                  Ativos em Produção
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-ink-primary tabular-nums">
                    {totalAtivos}
                  </span>
                  <Badge variant="success" size="xs">
                    <BadgeDot variant="success" pulse={totalAtivos > 0} />
                    {totalAtivos > 0 ? 'Rodando' : 'Pausados'}
                  </Badge>
                </div>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-card p-4 space-y-1">
                <span className="text-[11px] font-semibold text-ink-secondary">
                  Execuções Totais
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-ink-primary tabular-nums">
                    {totalExecucoes}
                  </span>
                  <span className="text-[11px] font-medium text-ink-muted">disparos</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalConexoesAberto(true)}
                className="rounded-2xl border border-surface-border bg-surface-card hover:border-surface-border-strong p-4 space-y-1 text-left transition-colors cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-ink-secondary">
                  Canais WhatsApp Online
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-ink-primary tabular-nums">
                    {conexoesOnline}/{conexoes.length}
                  </span>
                  <span className="text-[11px] font-semibold text-brand-secondary dark:text-[#7DD3FC]">
                    Configurar →
                  </span>
                </div>
              </button>
            </div>

            {/* Barra de busca e filtro */}
            <div className="rounded-2xl border border-surface-border bg-surface-card p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={buscaFluxo}
                  onChange={(e) => setBuscaFluxo(e.target.value)}
                  placeholder="Buscar automação por nome, descrição ou categoria..."
                  className="h-9 w-full rounded-xl border border-surface-border bg-surface-subtle pl-9 pr-8 text-xs font-medium text-ink-primary outline-none focus:border-brand-primary transition-colors"
                />
                {buscaFluxo && (
                  <button
                    type="button"
                    onClick={() => setBuscaFluxo('')}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-ink-muted hover:text-ink-primary cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <span className="text-xs font-medium text-ink-muted tabular-nums whitespace-nowrap">
                  {fluxosFiltrados.length} de {workflows.length} automações
                </span>
                <div className="w-44">
                  <Select value={filtroStatusFluxo} onValueChange={setFiltroStatusFluxo}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as automações</SelectItem>
                      <SelectItem value="ativos">Apenas ativos</SelectItem>
                      <SelectItem value="pausados">Apenas pausados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Lista de Automações */}
            {fluxosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-surface-border-strong bg-surface-card/70 px-6 py-12 text-center space-y-3">
                <span className="mx-auto h-11 w-11 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-ink-secondary">
                  <GitBranch className="w-5 h-5" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-ink-primary">
                    Nenhuma automação encontrada
                  </h2>
                  <p className="text-xs text-ink-secondary max-w-md mx-auto">
                    Ajuste os filtros de busca ou crie uma nova automação do zero no Studio visual.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {(buscaFluxo || filtroStatusFluxo !== 'todos') && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaFluxo('');
                        setFiltroStatusFluxo('todos');
                      }}
                      className="rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover px-3.5 py-2 text-xs font-semibold text-ink-primary cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCriarNovoFluxo}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Nova Automação
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {fluxosFiltrados.map((wf) => {
                  const selecionadoRecentemente = workflowAtual?.id === wf.id;
                  const firstMeshKey = wf.nodes?.[0]?.config?.meshKey || 'brand';
                  const orbBg = MESH_GRADIENTS[firstMeshKey] || MESH_GRADIENTS.brand;

                  return (
                    <div
                      key={wf.id}
                      className={`rounded-2xl border bg-surface-card px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        selecionadoRecentemente
                          ? 'border-brand-secondary/70 ring-1 ring-brand-secondary/20 shadow-2xs'
                          : 'border-surface-border hover:border-surface-border-strong hover:shadow-2xs'
                      }`}
                    >
                      {/* Lado Esquerdo: Ícone + Título + Metadados em formato compacto */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <SimpleTooltip content="Abrir automação no Studio" side="top">
                          <button
                            type="button"
                            onClick={() => {
                              setWorkflowSelecionadoId(wf.id);
                              setModoVisao('studio');
                            }}
                            style={{ background: orbBg }}
                            aria-label="Abrir automação no Studio"
                            className="h-9 w-9 rounded-xl flex items-center justify-center text-white shadow-2xs shrink-0 hover:scale-105 transition-transform cursor-pointer"
                          >
                            <Zap className="w-4 h-4" />
                          </button>
                        </SimpleTooltip>

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setWorkflowSelecionadoId(wf.id);
                                setModoVisao('studio');
                              }}
                              className="text-left text-sm font-bold text-ink-primary hover:text-brand-secondary dark:hover:text-[#7DD3FC] transition-colors truncate cursor-pointer"
                            >
                              {wf.nome}
                            </button>

                            <Badge variant={wf.ativo ? 'success' : 'default'} size="xs">
                              <BadgeDot variant={wf.ativo ? 'success' : 'default'} pulse={wf.ativo} />
                              {wf.ativo ? 'Ativo' : 'Pausado'}
                            </Badge>

                            {selecionadoRecentemente && (
                              <Badge variant="outline" size="xs">
                                Aberto recente
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-ink-secondary truncate">
                            <span className="truncate max-w-[260px] sm:max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl text-ink-muted">
                              {wf.descricao}
                            </span>
                            <span className="text-ink-muted/50 shrink-0">·</span>
                            <span className="shrink-0 text-[11px] text-ink-muted">
                              <strong className="text-ink-primary tabular-nums">{wf.nodes?.length || 0}</strong> blocos
                            </span>
                            <span className="text-ink-muted/50 shrink-0">·</span>
                            <span className="shrink-0 text-[11px] text-ink-muted">
                              <strong className="text-ink-primary tabular-nums">{wf.execucoesTotal || 0}</strong> disparos
                            </span>
                            <span className="text-ink-muted/50 shrink-0 hidden md:inline">·</span>
                            <span className="shrink-0 text-[11px] text-ink-muted hidden md:inline">
                              {wf.ultimaExecucao || 'Sem execuções'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lado Direito: Switch + Ações inline */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-surface-border/60">
                        <div className="flex items-center gap-2">
                          <Switch
                            size="sm"
                            variant="success"
                            checked={wf.ativo}
                            onCheckedChange={(checked) => alternarAtivoWorkflow(wf.id, checked)}
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <SimpleTooltip content="Executar simulação no Studio" side="top">
                            <button
                              type="button"
                              onClick={() => executarSimulacaoFluxo(wf)}
                              aria-label="Executar simulação no Studio"
                              className="rounded-lg p-1.5 text-brand-purple hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          </SimpleTooltip>

                          <SimpleTooltip content="Duplicar automação" side="top">
                            <button
                              type="button"
                              onClick={() => handleDuplicarWorkflow(wf)}
                              aria-label="Duplicar automação"
                              className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </SimpleTooltip>

                          <SimpleTooltip content="Excluir automação" side="top">
                            <button
                              type="button"
                              onClick={() => handleExcluirWorkflow(wf.id)}
                              aria-label="Excluir automação"
                              className="rounded-lg p-1.5 text-ink-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </SimpleTooltip>

                          <button
                            type="button"
                            onClick={() => {
                              setWorkflowSelecionadoId(wf.id);
                              setModoVisao('studio');
                            }}
                            className="ml-1 inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-3 py-1.5 text-xs font-semibold text-white transition-opacity cursor-pointer"
                          >
                            <span>Abrir</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      )}

      {/* MODAL: CONEXÕES WHATSAPP (EVOLUTION API & META CLOUD API) */}
      {modalConexoesAberto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setModalConexoesAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl max-h-[88vh] rounded-2xl border border-surface-border bg-surface-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-surface-border bg-surface-subtle/60">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-ink-primary">
                    Conexões WhatsApp &amp; Webhooks
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    Gerencie instâncias Evolution API (QR Code) e Meta WhatsApp Cloud API Oficial.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConexoesAberto(false)}
                className="rounded-xl p-1.5 text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <WhatsAppConexoes
                conexoes={conexoes}
                onUpdateConexao={atualizarConexao}
                onNotificar={adicionarNotificacao}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOGS DE EXECUÇÃO */}
      {modalLogsAberto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4"
          onClick={() => setModalLogsAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-5xl max-h-[88vh] rounded-2xl border border-surface-border bg-surface-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-surface-border bg-surface-subtle/60">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-xl bg-brand-secondary/15 text-brand-secondary dark:text-[#7DD3FC] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-ink-primary">
                    Histórico de Execuções &amp; Trace
                  </h2>
                  <p className="text-xs text-ink-secondary">
                    Inspecione cada etapa executada e a mensagem WhatsApp disparada por cliente.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalLogsAberto(false)}
                className="rounded-xl p-1.5 text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <LogsExecucao logs={logs} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TESTAR DISPARO COM CLIENTE CRM (AUTOCOMPLETE REUI 9) */}
      {modalTesteAberto && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setModalTesteAberto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/15 text-brand-purple">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink-primary">
                    Simulador de Mudança de Etapa CRM
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Escolha um cliente do CRM e execute a árvore visual no Studio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTesteAberto(false)}
                className="rounded-lg p-1.5 text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <Field>
              <FieldLabel>Cliente do CRM</FieldLabel>
              <AutocompleteReUI9
                items={autocompleteLeadItems}
                value={testeLeadNome}
                onValueChange={setTesteLeadNome}
                onSelectItem={(item) => {
                  if (item?.leadObj) setTesteLeadSelecionado(item.leadObj);
                }}
                placeholder="Buscar cliente por nome ou empresa..."
                entitySingular="cliente"
                entityPlural="clientes"
              />
              <FieldDescription>
                As variáveis {'{{lead.nome}}'}, {'{{lead.empresa}}'} e {'{{lead.valor_estimado}}'} serão preenchidas automaticamente.
              </FieldDescription>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field>
                <FieldLabel>Mover para Etapa</FieldLabel>
                <Select value={testeEtapaDestino} onValueChange={setTesteEtapaDestino}>
                  <SelectTrigger>
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

              <Field>
                <FieldLabel>Fluxo a Executar</FieldLabel>
                <Select value={testeWorkflowId} onValueChange={setTesteWorkflowId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.map((wf) => (
                      <SelectItem key={wf.id} value={wf.id}>
                        {wf.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setModalTesteAberto(false)}
                className="rounded-xl border border-surface-border px-3.5 py-2 text-xs font-semibold text-ink-secondary hover:bg-surface-hover cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const wf =
                    workflows.find((w) => w.id === testeWorkflowId) || workflowAtual;
                  setModalTesteAberto(false);
                  executarSimulacaoFluxo(wf, testeLeadSelecionado, testeEtapaDestino);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B132B] dark:bg-brand-purple hover:opacity-90 px-4 py-2 text-xs font-semibold text-white shadow-sm cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Executar no Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automacoes;
