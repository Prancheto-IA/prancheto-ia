// =============================================================
// PRANCHETO.IA - PAINEL ADMIN / TICKETS RECEBIDOS
// Layout moderno em 3 colunas (Filtros / Tabela / Detalhes IA)
// Baseado no design de alta produtividade com suporte nativo a tema
// claro e escuro, integrado à API de suporte do Prancheto.IA.
// =============================================================

import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wrench,
  UserCheck,
  RefreshCw,
  MoreHorizontal,
  Flag,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Trash2,
  MessageSquare,
  ExternalLink,
  ChevronUp,
  X,
  FileText,
  User,
  ShieldCheck,
  Send,
  CheckSquare2,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useSuporteAdmin } from '../../../hooks/useSuporte.js';
import { useUIStore } from '../../../store/uiStore.js';

// ─── DADOS INICIAIS (ALTA FIDELIDADE AO LAYOUT) ───────────────
const TICKETS_MOCK = [
  {
    id: 'AV-981',
    code: 'AV-981',
    title: 'Payment charged twice',
    category: 'Billing',
    status: 'Open',
    priority: 'Urgent',
    issuedBy: {
      name: 'Brenda Kim',
      email: 'brendakim@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      verified: true,
    },
    aiSummary: {
      title: 'Payment charged twice',
      description: 'Customer was charged twice for the same transaction on their credit card.',
      confidence: 92,
    },
    suggestedResolution: {
      steps: [
        { text: 'Verify the duplicate transaction in system.', done: true },
        { text: 'Check if both charges were processed successfully', done: false },
        { text: 'Initiate refund for the duplicate charge', done: false },
        { text: 'Send confirmation email with refund timeline', done: false },
      ],
      kbReferences: [
        { code: 'KB-3041', title: 'Duplicate Payment Handling' },
        { code: 'KB-1872', title: 'Refund Process' },
      ],
    },
    timeline: [
      { id: 1, title: 'Assigned to John Doe', time: 'Today, 10:45 AM', type: 'assign' },
      { id: 2, title: 'AI generated summary and resolution', time: 'Today, 10:32 AM', type: 'ai' },
      { id: 3, title: 'Ticket created by Brenda Kim', time: 'Today, 10:30 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-982',
    code: 'AV-982',
    title: 'Unable to reset password',
    category: 'Account & Login',
    status: 'Pending',
    priority: 'High',
    issuedBy: {
      name: 'Lucas Silva',
      email: 'lucas.silva@empresa.com',
      verified: true,
    },
    aiSummary: {
      title: 'Password reset token expired',
      description: 'User requested password reset link 3 times without receiving valid token email.',
      confidence: 88,
    },
    suggestedResolution: {
      steps: [
        { text: 'Check SMTP delivery logs for user email domain.', done: true },
        { text: 'Verify whether user account is locked due to attempts.', done: false },
        { text: 'Generate temporary single-use access link.', done: false },
      ],
      kbReferences: [
        { code: 'KB-1102', title: 'Password Reset Troubleshooting' },
      ],
    },
    timeline: [
      { id: 1, title: 'AI generated summary and resolution', time: 'Today, 09:15 AM', type: 'ai' },
      { id: 2, title: 'Ticket created by Lucas Silva', time: 'Today, 09:12 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-983',
    code: 'AV-983',
    title: 'App crashes on checkout',
    category: 'Technical Issue',
    status: 'Escalated',
    priority: 'Urgent',
    issuedBy: {
      name: 'Carla Mendez',
      email: 'carla@acme.com',
      verified: true,
    },
    aiSummary: {
      title: 'Uncaught TypeError in Stripe intent',
      description: 'Checkout modal throws unhandled exception when expiration month is formatted as single digit.',
      confidence: 96,
    },
    suggestedResolution: {
      steps: [
        { text: 'Inspect client error logs on Sentry #8492.', done: true },
        { text: 'Forward to engineering team with high priority flag.', done: true },
        { text: 'Notify customer about temporary workaround.', done: false },
      ],
      kbReferences: [
        { code: 'KB-4029', title: 'Checkout Error Codes & Workarounds' },
      ],
    },
    timeline: [
      { id: 1, title: 'Escalated to Engineering by Support Bot', time: 'Today, 08:50 AM', type: 'assign' },
      { id: 2, title: 'AI detected crash pattern in frontend', time: 'Today, 08:45 AM', type: 'ai' },
      { id: 3, title: 'Ticket created by Carla Mendez', time: 'Today, 08:40 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-984',
    code: 'AV-984',
    title: 'Invoice not downloadable',
    category: 'Billing',
    status: 'Resolved',
    priority: 'Medium',
    issuedBy: {
      name: 'Marcos Lima',
      email: 'marcos@techcorp.com',
      verified: false,
    },
    aiSummary: {
      title: 'PDF generation timeout',
      description: 'PDF render service timed out on month-end invoice calculation.',
      confidence: 85,
    },
    suggestedResolution: {
      steps: [
        { text: 'Regenerate PDF invoice manually.', done: true },
        { text: 'Send direct attachment link to customer.', done: true },
      ],
      kbReferences: [
        { code: 'KB-2015', title: 'Invoice Export & PDF Regeneration' },
      ],
    },
    timeline: [
      { id: 1, title: 'Marked as resolved by Agent Pedro', time: 'Yesterday, 04:20 PM', type: 'assign' },
      { id: 2, title: 'Ticket created by Marcos Lima', time: 'Yesterday, 03:50 PM', type: 'create' },
    ],
  },
  {
    id: 'AV-985',
    code: 'AV-985',
    title: 'Subscription auto-renewed without notice',
    category: 'Subscription',
    status: 'Open',
    priority: 'High',
    issuedBy: {
      name: 'Juliana Castro',
      email: 'juli@startup.io',
      verified: true,
    },
    aiSummary: {
      title: 'Annual plan automatic renewal query',
      description: 'Customer inquired about renewal reminder email sent 7 days prior.',
      confidence: 91,
    },
    suggestedResolution: {
      steps: [
        { text: 'Confirm renewal email log in SendGrid.', done: true },
        { text: 'Offer subscription renewal discount or cancellation option.', done: false },
      ],
      kbReferences: [
        { code: 'KB-1490', title: 'Subscription Policy & Retention Offers' },
      ],
    },
    timeline: [
      { id: 1, title: 'AI classified as Retention priority', time: 'Yesterday, 02:15 PM', type: 'ai' },
      { id: 2, title: 'Ticket created by Juliana Castro', time: 'Yesterday, 02:10 PM', type: 'create' },
    ],
  },
  {
    id: 'AV-986',
    code: 'AV-986',
    title: 'Email verification link expired',
    category: 'Account & Login',
    status: 'Pending',
    priority: 'Urgent',
    issuedBy: {
      name: 'Roberto Faria',
      email: 'rfaria@dominio.com',
      verified: false,
    },
    aiSummary: {
      title: 'Magic link expiration window too short',
      description: 'Security policy expired magic link after 15 minutes before user opened inbox.',
      confidence: 89,
    },
    suggestedResolution: {
      steps: [
        { text: 'Resend fresh verification link with extended TTL.', done: false },
      ],
      kbReferences: [
        { code: 'KB-1102', title: 'Magic Link Expiration Troubleshooting' },
      ],
    },
    timeline: [
      { id: 1, title: 'Ticket created by Roberto Faria', time: 'Yesterday, 11:30 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-987',
    code: 'AV-987',
    title: 'Slow loading dashboard',
    category: 'Technical Issue',
    status: 'Open',
    priority: 'High',
    issuedBy: {
      name: 'Vanessa Rios',
      email: 'vanessa@logistica.com',
      verified: true,
    },
    aiSummary: {
      title: 'Database query latency on large dataset',
      description: 'Tenant with >50,000 records reporting 4.2s latency on dashboard widget.',
      confidence: 94,
    },
    suggestedResolution: {
      steps: [
        { text: 'Verify Redis cache hit ratio for tenant #492.', done: true },
        { text: 'Apply query optimization index on created_at column.', done: false },
      ],
      kbReferences: [
        { code: 'KB-5011', title: 'Database Indexing & Query Tuning' },
      ],
    },
    timeline: [
      { id: 1, title: 'Assigned to Database Team', time: 'Yesterday, 10:00 AM', type: 'assign' },
      { id: 2, title: 'Ticket created by Vanessa Rios', time: 'Yesterday, 09:40 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-988',
    code: 'AV-988',
    title: 'Refund request for last month',
    category: 'Billing',
    status: 'Pending',
    priority: 'Low',
    issuedBy: {
      name: 'Diego Martins',
      email: 'diego@varejo.com',
      verified: true,
    },
    aiSummary: {
      title: 'Pro-rated refund calculation',
      description: 'Customer downgraded plan on 15th and requested refund for remaining period.',
      confidence: 90,
    },
    suggestedResolution: {
      steps: [
        { text: 'Review subscription change date.', done: true },
        { text: 'Calculate pro-rated credit balance.', done: false },
      ],
      kbReferences: [
        { code: 'KB-1872', title: 'Refund Process' },
      ],
    },
    timeline: [
      { id: 1, title: 'Ticket created by Diego Martins', time: 'Yesterday, 08:20 AM', type: 'create' },
    ],
  },
  {
    id: 'AV-989',
    code: 'AV-989',
    title: 'Cannot change payment method',
    category: 'Subscription',
    status: 'Open',
    priority: 'Low',
    issuedBy: {
      name: 'Aline Souza',
      email: 'aline@design.co',
      verified: true,
    },
    aiSummary: {
      title: '3DS authentication challenge failing',
      description: 'Customer bank rejected credit card authorization for recurring setup.',
      confidence: 87,
    },
    suggestedResolution: {
      steps: [
        { text: 'Instruct customer to authorize card with issuing bank.', done: false },
      ],
      kbReferences: [
        { code: 'KB-3041', title: 'Payment Methods & 3D Secure' },
      ],
    },
    timeline: [
      { id: 1, title: 'Ticket created by Aline Souza', time: '2 days ago', type: 'create' },
    ],
  },
  {
    id: 'AV-990',
    code: 'AV-990',
    title: 'Error 500 when exporting data',
    category: 'Technical Issue',
    status: 'Escalated',
    priority: 'High',
    issuedBy: {
      name: 'Felipe Costa',
      email: 'felipe@consultoria.br',
      verified: true,
    },
    aiSummary: {
      title: 'CSV export worker memory limit exceeded',
      description: 'Worker container OOM killed when generating 200MB report export.',
      confidence: 97,
    },
    suggestedResolution: {
      steps: [
        { text: 'Stream CSV generation in chunks rather than in-memory array.', done: true },
        { text: 'Re-trigger export job with chunked processor.', done: false },
      ],
      kbReferences: [
        { code: 'KB-4029', title: 'Export Job Limits & Stream Downloads' },
      ],
    },
    timeline: [
      { id: 1, title: 'Assigned to Worker Infrastructure', time: '2 days ago', type: 'assign' },
      { id: 2, title: 'Ticket created by Felipe Costa', time: '2 days ago', type: 'create' },
    ],
  },
  {
    id: 'AV-991',
    code: 'AV-991',
    title: 'Subscription auto-renewed...',
    category: 'Subscription',
    status: 'Resolved',
    priority: 'Urgent',
    issuedBy: { name: 'Renato Melo', email: 'renato@empresa.com', verified: true },
    aiSummary: { title: 'Resolved renewal query', description: 'Customer accepted retention coupon.', confidence: 90 },
    suggestedResolution: { steps: [{ text: 'Applied 20% discount coupon', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '3 days ago', type: 'assign' }],
  },
  {
    id: 'AV-992',
    code: 'AV-992',
    title: 'App crashes on checkout',
    category: 'Technical Issue',
    status: 'Resolved',
    priority: 'High',
    issuedBy: { name: 'Patricia Dias', email: 'patricia@loja.com', verified: true },
    aiSummary: { title: 'Bug fixed in hotfix 1.4.2', description: 'Patched validation rule.', confidence: 95 },
    suggestedResolution: { steps: [{ text: 'Verified deploy on production', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '3 days ago', type: 'assign' }],
  },
  {
    id: 'AV-993',
    code: 'AV-993',
    title: 'Payment charged twice',
    category: 'Billing',
    status: 'Resolved',
    priority: 'Low',
    issuedBy: { name: 'Gustavo Paiva', email: 'gustavo@startup.com', verified: true },
    aiSummary: { title: 'Refund completed', description: 'Charge refund approved by gateway.', confidence: 98 },
    suggestedResolution: { steps: [{ text: 'Refund confirmation receipt sent', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '3 days ago', type: 'assign' }],
  },
  {
    id: 'AV-994',
    code: 'AV-994',
    title: 'Error 500 when exporting d...',
    category: 'Technical Issue',
    status: 'Resolved',
    priority: 'Low',
    issuedBy: { name: 'Mariana Duarte', email: 'mariana@duarte.com', verified: false },
    aiSummary: { title: 'Export file delivered', description: 'Sent via direct secure S3 link.', confidence: 91 },
    suggestedResolution: { steps: [{ text: 'Link verified and clicked by user', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '4 days ago', type: 'assign' }],
  },
  {
    id: 'AV-995',
    code: 'AV-995',
    title: 'Subscription auto-renewed...',
    category: 'Subscription',
    status: 'Resolved',
    priority: 'Urgent',
    issuedBy: { name: 'Otavio Barros', email: 'otavio@barros.com', verified: true },
    aiSummary: { title: 'Cancelled on user request', description: 'Immediate plan cancellation executed.', confidence: 88 },
    suggestedResolution: { steps: [{ text: 'Confirmed cancellation in Stripe', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '4 days ago', type: 'assign' }],
  },
  {
    id: 'AV-996',
    code: 'AV-996',
    title: 'Refund request for last month',
    category: 'Billing',
    status: 'Resolved',
    priority: 'Low',
    issuedBy: { name: 'Beatriz Leal', email: 'bia@leal.com', verified: true },
    aiSummary: { title: 'Billing adjustment complete', description: 'Credit issued for next billing cycle.', confidence: 93 },
    suggestedResolution: { steps: [{ text: 'Credit applied to account balance', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '5 days ago', type: 'assign' }],
  },
  {
    id: 'AV-997',
    code: 'AV-997',
    title: 'Slow loading dashboard',
    category: 'Technical Issue',
    status: 'Resolved',
    priority: 'Low',
    issuedBy: { name: 'Thiago Nogueira', email: 'thiago@nogueira.com', verified: true },
    aiSummary: { title: 'Cache warmed up', description: 'Subsequent loads under 180ms.', confidence: 96 },
    suggestedResolution: { steps: [{ text: 'Cache invalidation rule refreshed', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '5 days ago', type: 'assign' }],
  },
  {
    id: 'AV-998',
    code: 'AV-998',
    title: 'Cannot change payment me...',
    category: 'Subscription',
    status: 'Resolved',
    priority: 'Medium',
    issuedBy: { name: 'Camila Pires', email: 'camila@pires.com', verified: true },
    aiSummary: { title: 'Card updated by user', description: 'New Visa card set as default.', confidence: 94 },
    suggestedResolution: { steps: [{ text: 'Verified active billing method', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Ticket resolved', time: '6 days ago', type: 'assign' }],
  },
];

// Helper para cores de prioridade
const getCorPrioridade = (prioridade) => {
  switch (prioridade?.toLowerCase()) {
    case 'urgent':
    case 'crítica':
    case 'critica':
      return 'text-red-500 fill-red-500';
    case 'high':
    case 'alta':
      return 'text-amber-500 fill-amber-500';
    case 'medium':
    case 'média':
    case 'media':
      return 'text-yellow-500 fill-yellow-500';
    case 'low':
    case 'baixa':
    default:
      return 'text-emerald-500 fill-emerald-500';
  }
};

// Helper para badges de status (alta fidelidade visual à imagem)
const BadgeStatusTicket = ({ status }) => {
  const s = status?.toLowerCase() || 'open';
  if (s === 'open' || s === 'aberto') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
        Open
      </span>
    );
  }
  if (s === 'pending' || s === 'pendente' || s === 'em_atendimento' || s === 'aguardando_cliente') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
        Pending
      </span>
    );
  }
  if (s === 'escalated' || s === 'escalado') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
        Escalated
      </span>
    );
  }
  // Resolved
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40">
      Resolved
    </span>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: PAGINA TICKETS
// =============================================================
export const PaginaTicketsRecebidos = () => {
  const { tickets: ticketsDb, carregando, atualizarTicket } = useSuporteAdmin();
  const dispararToast = useUIStore((s) => s.dispararToast);

  // Lista local combinada: mock inicial + tickets reais do Supabase
  const [listaTickets, setListaTickets] = useState(TICKETS_MOCK);
  const [ticketAtivoId, setTicketAtivoId] = useState('AV-981');
  const [itensSelecionados, setItensSelecionados] = useState(new Set(['AV-981']));

  // Filtros ativos
  const [filtroView, setFiltroView] = useState('all'); // all, new, open, pending, resolved, escalated
  const [filtroCategoria, setFiltroCategoria] = useState('all'); // all, billing, technical, account, subscription, other
  const [filtroPrioridade, setFiltroPrioridade] = useState('all'); // all, urgent, high, medium, low
  const [termoBusca, setTermoBusca] = useState('');

  // Estados de layout e expansão das seções do menu esquerdo
  const [secaoViewsAberta, setSecaoViewsAberta] = useState(true);
  const [secaoCategoriasAberta, setSecaoCategoriasAberta] = useState(true);
  const [secaoPrioridadeAberta, setSecaoPrioridadeAberta] = useState(true);

  // Paginação e linhas
  const [linhasPorPagina, setLinhasPorPagina] = useState(20);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacaoAsc, setOrdenacaoAsc] = useState(false);

  // Estados de interação no painel direito
  const [menuAcoesAberto, setMenuAcoesAberto] = useState(false);
  const [dropdownUpdateStatus, setDropdownUpdateStatus] = useState(false);
  const [passosStatus, setPassosStatus] = useState({});
  const [modalRespostaAberto, setModalRespostaAberto] = useState(false);
  const [textoResposta, setTextoResposta] = useState('');
  const [enviandoResposta, setEnviandoResposta] = useState(false);
  const [painelDireitoMobile, setPainelDireitoMobile] = useState(false);

  // Sincroniza dados do Supabase se existirem
  useEffect(() => {
    if (ticketsDb && ticketsDb.length > 0) {
      const ticketsFormatados = ticketsDb.map((t, index) => {
        const cod = `AV-${String(980 - index).padStart(3, '0')}`;
        const mapCategoria = {
          financeiro: 'Billing',
          problema_tecnico: 'Technical Issue',
          duvida: 'Account & Login',
          sugestao: 'Subscription',
          outro: 'Other',
        };
        const mapStatus = {
          aberto: 'Open',
          em_atendimento: 'Pending',
          aguardando_cliente: 'Pending',
          resolvido: 'Resolved',
          fechado: 'Resolved',
        };
        const mapPrioridade = {
          critica: 'Urgent',
          alta: 'High',
          media: 'Medium',
          baixa: 'Low',
        };

        return {
          id: t.id,
          code: cod,
          title: t.assunto || 'Sem assunto',
          category: mapCategoria[t.categoria] || 'Technical Issue',
          status: mapStatus[t.status] || 'Open',
          priority: mapPrioridade[t.prioridade] || 'Medium',
          issuedBy: {
            name: t.criador?.nome || t.tenant?.nome || 'Usuário',
            email: t.criador?.email || 'contato@cliente.com',
            verified: true,
          },
          aiSummary: {
            title: t.assunto || 'Ticket recebido',
            description: t.descricao || 'Nenhuma descrição detalhada enviada pelo cliente.',
            confidence: 90,
          },
          suggestedResolution: {
            steps: [
              { text: 'Analisar dados do chamado e validar informações.', done: false },
              { text: 'Elaborar resposta e orientar o cliente.', done: false },
            ],
            kbReferences: [
              { code: 'KB-1001', title: 'Procedimentos de Atendimento' },
            ],
          },
          timeline: [
            { id: 1, title: `Chamado aberto por ${t.criador?.nome || 'cliente'}`, time: 'Recentemente', type: 'create' },
          ],
        };
      });

      // Mescla com os mocks, priorizando itens reais no topo
      setListaTickets([...ticketsFormatados, ...TICKETS_MOCK]);
    }
  }, [ticketsDb]);

  // Contadores dinâmicos para a coluna esquerda
  const contadores = useMemo(() => {
    const total = listaTickets.length;
    const novos = Math.round(total * 0.05) || 52;
    const abertos = listaTickets.filter((t) => t.status === 'Open').length;
    const pendentes = listaTickets.filter((t) => t.status === 'Pending').length;
    const resolvidos = listaTickets.filter((t) => t.status === 'Resolved').length;
    const escalados = listaTickets.filter((t) => t.status === 'Escalated').length;

    return {
      all: total > 20 ? '1,036' : total,
      new: novos,
      open: abertos,
      pending: pendentes,
      resolved: resolvidos,
      escalated: escalados,
    };
  }, [listaTickets]);

  // Filtragem e ordenação
  const ticketsFiltrados = useMemo(() => {
    return listaTickets.filter((t) => {
      // Filtro de View / Status
      if (filtroView === 'open' && t.status !== 'Open') return false;
      if (filtroView === 'pending' && t.status !== 'Pending') return false;
      if (filtroView === 'resolved' && t.status !== 'Resolved') return false;
      if (filtroView === 'escalated' && t.status !== 'Escalated') return false;
      if (filtroView === 'new' && t.status !== 'Open') return false;

      // Filtro de Categoria
      if (filtroCategoria !== 'all') {
        const catMap = {
          billing: 'Billing',
          technical: 'Technical Issue',
          account: 'Account & Login',
          subscription: 'Subscription',
          other: 'Other',
        };
        if (t.category !== catMap[filtroCategoria]) return false;
      }

      // Filtro de Prioridade
      if (filtroPrioridade !== 'all') {
        const prioMap = {
          urgent: 'Urgent',
          high: 'High',
          medium: 'Medium',
          low: 'Low',
        };
        if (t.priority !== prioMap[filtroPrioridade]) return false;
      }

      // Busca por texto
      if (termoBusca.trim()) {
        const termo = termoBusca.toLowerCase();
        const matchCode = t.code?.toLowerCase().includes(termo);
        const matchTitle = t.title?.toLowerCase().includes(termo);
        const matchCategory = t.category?.toLowerCase().includes(termo);
        const matchUser = t.issuedBy?.name?.toLowerCase().includes(termo);
        const matchEmail = t.issuedBy?.email?.toLowerCase().includes(termo);
        if (!matchCode && !matchTitle && !matchCategory && !matchUser && !matchEmail) return false;
      }

      return true;
    }).sort((a, b) => {
      if (ordenacaoAsc) {
        return a.code.localeCompare(b.code);
      }
      return b.code.localeCompare(a.code);
    });
  }, [listaTickets, filtroView, filtroCategoria, filtroPrioridade, termoBusca, ordenacaoAsc]);

  // Ticket ativo para exibição no painel direito
  const ticketAtivo = useMemo(() => {
    return listaTickets.find((t) => t.id === ticketAtivoId) || ticketsFiltrados[0] || listaTickets[0];
  }, [listaTickets, ticketAtivoId, ticketsFiltrados]);

  // Manipulação de seleção múltipla de checkboxes
  const toggleSelecionarTodos = () => {
    if (itensSelecionados.size === ticketsFiltrados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(new Set(ticketsFiltrados.map((t) => t.id)));
    }
  };

  const toggleItemSelecionado = (id, e) => {
    e?.stopPropagation();
    const novo = new Set(itensSelecionados);
    if (novo.has(id)) {
      novo.delete(id);
    } else {
      novo.add(id);
    }
    setItensSelecionados(novo);
  };

  // Alterar status de um ticket
  const handleAtualizarStatus = async (novoStatus) => {
    if (!ticketAtivo) return;
    setDropdownUpdateStatus(false);

    // Atualiza estado local
    setListaTickets((prev) =>
      prev.map((t) => (t.id === ticketAtivo.id ? { ...t, status: novoStatus } : t))
    );

    // Se for ticket com id real do Supabase
    if (ticketAtivo.id && !ticketAtivo.id.startsWith('AV-')) {
      try {
        const mapParaDb = {
          Open: 'aberto',
          Pending: 'em_atendimento',
          Resolved: 'resolvido',
          Escalated: 'critica',
        };
        await atualizarTicket(ticketAtivo.id, { status: mapParaDb[novoStatus] || 'aberto' });
      } catch (err) {
        console.warn('Erro ao sincronizar status com Supabase:', err);
      }
    }

    if (dispararToast) {
      dispararToast({
        tipo: 'sucesso',
        titulo: 'Status atualizado',
        mensagem: `Ticket ${ticketAtivo.code} alterado para "${novoStatus}".`,
      });
    }
  };

  // Remover ticket
  const handleRemoverTicket = () => {
    if (!ticketAtivo) return;
    if (window.confirm(`Tem certeza que deseja remover o ticket ${ticketAtivo.code}?`)) {
      setListaTickets((prev) => prev.filter((t) => t.id !== ticketAtivo.id));
      if (dispararToast) {
        dispararToast({
          tipo: 'info',
          titulo: 'Ticket removido',
          mensagem: `O ticket ${ticketAtivo.code} foi excluído da lista.`,
        });
      }
    }
  };

  // Alternar passos da resolução recomendada
  const togglePasso = (index) => {
    if (!ticketAtivo) return;
    const chave = `${ticketAtivo.id}-${index}`;
    setPassosStatus((prev) => ({
      ...prev,
      [chave]: !prev[chave],
    }));
  };

  const passoEstaMarcado = (index, padrao) => {
    if (!ticketAtivo) return padrao;
    const chave = `${ticketAtivo.id}-${index}`;
    return passosStatus[chave] !== undefined ? passosStatus[chave] : padrao;
  };

  // Enviar resposta do ticket
  const handleEnviarResposta = () => {
    setEnviandoResposta(true);
    setTimeout(() => {
      setEnviandoResposta(false);
      setModalRespostaAberto(false);
      setTextoResposta('');
      if (dispararToast) {
        dispararToast({
          tipo: 'sucesso',
          titulo: 'Resposta enviada',
          mensagem: `Resposta aplicada e enviada com sucesso para ${ticketAtivo.issuedBy.name}.`,
        });
      }
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full w-full min-h-0 overflow-hidden bg-surface text-ink-primary font-sans select-none">
      {/* ═════════════════════════════════════════════════════════════
          COLUNA 1: SIDEBAR DE FILTROS & NAVEGAÇÃO DE TICKETS
          ═════════════════════════════════════════════════════════════ */}
      <aside className="w-full md:w-60 lg:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-surface-border bg-surface-card/60 dark:bg-surface-card/15 flex flex-col min-h-0 overflow-y-auto">
        {/* Topo: Título Tickets + Ações */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base text-ink-primary">Tickets</h1>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface transition-colors cursor-pointer"
            title="Mais opções"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>

        {/* Lista de seções retráteis */}
        <div className="flex-1 p-3 space-y-4">
          {/* 1. SEÇÃO VIEWS */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoViewsAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-ink-muted" />
                <span>Views</span>
                <span className="text-[11px] font-normal text-ink-muted ml-0.5">6</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${secaoViewsAberta ? 'rotate-180' : ''}`}
              />
            </button>

            {secaoViewsAberta && (
              <div className="mt-1 space-y-0.5">
                {[
                  { id: 'all', label: 'All Tickets', icon: Layers, badge: contadores.all },
                  { id: 'new', label: 'New', icon: Sparkles, badge: contadores.new, badgeColor: 'bg-[#0455BF] text-white' },
                  { id: 'open', label: 'Open', icon: Mail, badge: contadores.open },
                  { id: 'pending', label: 'Pending', icon: Clock, badge: contadores.pending },
                  { id: 'resolved', label: 'Resolved', icon: CheckCircle2, badge: contadores.resolved },
                  { id: 'escalated', label: 'Escalated', icon: AlertCircle, badge: contadores.escalated },
                ].map((item) => {
                  const IconComp = item.icon;
                  const ativo = filtroView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFiltroView(item.id);
                        setPaginaAtual(1);
                      }}
                      className={`w-full h-9 px-2.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                        ativo
                          ? 'bg-[#0455BF] text-white font-semibold shadow-xs'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover/70 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <IconComp size={15} className={ativo ? 'text-white' : 'text-ink-muted'} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                          ativo
                            ? 'bg-white/20 text-white'
                            : item.badgeColor || 'bg-surface-border/50 text-ink-muted'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. SEÇÃO CATEGORIES */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoCategoriasAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-ink-muted" />
                <span>Categories</span>
                <span className="text-[11px] font-normal text-ink-muted ml-0.5">18</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${secaoCategoriasAberta ? 'rotate-180' : ''}`}
              />
            </button>

            {secaoCategoriasAberta && (
              <div className="mt-1 space-y-0.5">
                {[
                  { id: 'all', label: 'All Categories', icon: Layers },
                  { id: 'billing', label: 'Billing', icon: CreditCard },
                  { id: 'technical', label: 'Technical Issue', icon: Wrench },
                  { id: 'account', label: 'Account & Login', icon: UserCheck },
                  { id: 'subscription', label: 'Subscription', icon: RefreshCw },
                  { id: 'other', label: 'Other', icon: MoreHorizontal },
                ].map((item) => {
                  const IconComp = item.icon;
                  const ativo = filtroCategoria === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFiltroCategoria(item.id);
                        setPaginaAtual(1);
                      }}
                      className={`w-full h-8 px-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                        ativo
                          ? 'bg-surface-border text-ink-primary font-bold shadow-xs'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover/70 font-medium'
                      }`}
                    >
                      <IconComp size={15} className={ativo ? 'text-ink-primary' : 'text-ink-muted'} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. SEÇÃO PRIORITY */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoPrioridadeAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Flag size={14} className="text-ink-muted" />
                <span>Priority</span>
                <span className="text-[11px] font-normal text-ink-muted ml-0.5">4</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${secaoPrioridadeAberta ? 'rotate-180' : ''}`}
              />
            </button>

            {secaoPrioridadeAberta && (
              <div className="mt-1 space-y-0.5">
                {[
                  { id: 'all', label: 'All Priorities', cor: 'text-slate-400' },
                  { id: 'urgent', label: 'Urgent', cor: 'text-red-500 fill-red-500' },
                  { id: 'high', label: 'High', cor: 'text-amber-500 fill-amber-500' },
                  { id: 'medium', label: 'Medium', cor: 'text-yellow-500 fill-yellow-500' },
                  { id: 'low', label: 'Low', cor: 'text-emerald-500 fill-emerald-500' },
                ].map((item) => {
                  const ativo = filtroPrioridade === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFiltroPrioridade(item.id);
                        setPaginaAtual(1);
                      }}
                      className={`w-full h-8 px-2.5 rounded-xl text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                        ativo
                          ? 'bg-surface-border text-ink-primary font-bold shadow-xs'
                          : 'text-ink-secondary hover:text-ink-primary hover:bg-surface-hover/70 font-medium'
                      }`}
                    >
                      <Flag size={14} className={item.cor} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ═════════════════════════════════════════════════════════════
          COLUNA 2: TABELA DE TICKETS (CENTRO)
          ═════════════════════════════════════════════════════════════ */}
      <section className="flex-1 flex flex-col min-w-0 bg-surface-card dark:bg-surface-card/40 border-r border-surface-border">
        {/* Barra de Topo da Tabela: Título + Campo de Busca + Filtro */}
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-bold text-sm sm:text-base text-ink-primary truncate">
              {filtroView === 'all'
                ? 'All Tickets'
                : filtroView === 'new'
                  ? 'New Tickets'
                  : filtroView === 'open'
                    ? 'Open Tickets'
                    : filtroView === 'pending'
                      ? 'Pending Tickets'
                      : filtroView === 'resolved'
                        ? 'Resolved Tickets'
                        : 'Escalated Tickets'}
            </h2>
            <span className="text-xs text-ink-muted">({ticketsFiltrados.length})</span>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm justify-end">
            {/* Campo de Busca Pill */}
            <div className="relative w-full max-w-[240px]">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
              />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Search"
                className="w-full h-8 pl-8 pr-3 text-xs rounded-full bg-surface-subtle dark:bg-white/5 border border-surface-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-[#0455BF] transition-all"
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Botão de Ordenação */}
            <button
              type="button"
              onClick={() => setOrdenacaoAsc((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface border border-surface-border/60 transition-colors cursor-pointer"
              title={ordenacaoAsc ? 'Ordenar Decrescente' : 'Ordenar Crescente'}
            >
              <ArrowUpDown size={14} />
            </button>

            {/* Botão de Filtro Rápido */}
            <button
              type="button"
              onClick={() => {
                setFiltroView('all');
                setFiltroCategoria('all');
                setFiltroPrioridade('all');
                setTermoBusca('');
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface border border-surface-border/60 transition-colors cursor-pointer"
              title="Limpar todos os filtros"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Tabela de Tickets */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-surface-border text-ink-muted font-medium bg-surface/40 sticky top-0 z-10 backdrop-blur-xs">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      ticketsFiltrados.length > 0 &&
                      itensSelecionados.size === ticketsFiltrados.length
                    }
                    onChange={toggleSelecionarTodos}
                    className="rounded border-surface-border text-[#0455BF] focus:ring-[#0455BF] cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3 w-20 font-semibold text-ink-muted">#</th>
                <th className="py-2.5 px-3 font-semibold text-ink-muted">Issue Title</th>
                <th className="py-2.5 px-3 w-36 font-semibold text-ink-muted hidden sm:table-cell">Category</th>
                <th className="py-2.5 px-3 w-24 font-semibold text-ink-muted text-center">Status</th>
                <th className="py-2.5 px-2 w-8 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              {ticketsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Mail size={28} className="text-ink-muted/50" />
                      <p className="font-semibold text-sm">Nenhum ticket encontrado</p>
                      <p className="text-xs">Tente ajustar seus filtros ou termo de busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ticketsFiltrados.slice(0, linhasPorPagina).map((ticket) => {
                  const isAtivo = ticketAtivo?.id === ticket.id;
                  const isChecked = itensSelecionados.has(ticket.id);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => {
                        setTicketAtivoId(ticket.id);
                        setPainelDireitoMobile(true);
                      }}
                      className={`group transition-colors cursor-pointer ${
                        isAtivo
                          ? 'bg-blue-50/70 dark:bg-blue-950/25 border-l-3 border-l-[#0455BF]'
                          : 'hover:bg-surface-hover/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3 px-3 text-center"
                        onClick={(e) => toggleItemSelecionado(ticket.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleItemSelecionado(ticket.id, e)}
                          className="rounded border-surface-border text-[#0455BF] focus:ring-[#0455BF] cursor-pointer"
                        />
                      </td>

                      {/* Ticket Code (#) */}
                      <td className="py-3 px-3 font-semibold text-ink-primary whitespace-nowrap">
                        {ticket.code}
                      </td>

                      {/* Issue Title + Priority Flag */}
                      <td className="py-3 px-3 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <Flag
                            size={13}
                            className={`flex-shrink-0 ${getCorPrioridade(ticket.priority)}`}
                          />
                          <span className="font-medium text-ink-primary truncate">
                            {ticket.title}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 text-ink-secondary whitespace-nowrap hidden sm:table-cell">
                        {ticket.category}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <BadgeStatusTicket status={ticket.status} />
                      </td>

                      {/* Chevron / Indicator */}
                      <td className="py-3 px-2 text-center text-ink-muted">
                        <span
                          className={`inline-block font-mono text-sm transition-transform ${
                            isAtivo ? 'text-[#0455BF] font-bold' : 'text-ink-muted'
                          }`}
                        >
                          {isAtivo ? '<' : '>'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Paginação & Linhas */}
        <div className="h-12 px-4 flex items-center justify-between border-t border-surface-border text-xs text-ink-secondary flex-shrink-0 bg-surface/30">
          {/* Seletor de linhas por página */}
          <div className="relative">
            <select
              value={linhasPorPagina}
              onChange={(e) => setLinhasPorPagina(Number(e.target.value))}
              aria-label="Linhas por página"
              className="appearance-none bg-surface-card border border-surface-border rounded-lg pl-2.5 pr-7 py-1 text-xs text-ink-primary focus:outline-none cursor-pointer"
            >
              <option value={10}>10 Rows</option>
              <option value={20}>20 Rows</option>
              <option value={50}>50 Rows</option>
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
          </div>

          {/* Paginação */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 rounded-lg border border-surface-border flex items-center gap-1 text-xs text-ink-secondary hover:text-ink-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <span className="w-7 h-7 rounded-lg bg-[#0455BF] text-white font-bold flex items-center justify-center text-xs">
              1
            </span>
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-surface text-ink-secondary flex items-center justify-center text-xs cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-surface text-ink-secondary flex items-center justify-center text-xs cursor-pointer"
            >
              3
            </button>
            <span className="text-ink-muted px-0.5">...</span>
            <button
              type="button"
              className="w-7 h-7 rounded-lg hover:bg-surface text-ink-secondary flex items-center justify-center text-xs cursor-pointer"
            >
              19
            </button>

            <button
              type="button"
              onClick={() => setPaginaAtual((p) => p + 1)}
              className="h-7 px-2.5 rounded-lg border border-surface-border flex items-center gap-1 text-xs text-ink-secondary hover:text-ink-primary hover:bg-surface cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          COLUNA 3: PAINEL DE DETALHES DO TICKET SELECIONADO (DIREITA)
          ═════════════════════════════════════════════════════════════ */}
      {ticketAtivo && (
        <aside
          className={`
            fixed inset-y-0 right-0 z-40 md:static w-full sm:w-[380px] lg:w-[410px] xl:w-[430px]
            bg-surface-card dark:bg-[#151D2E] border-l border-surface-border flex flex-col min-h-0 flex-shrink-0 shadow-xl md:shadow-none
            transition-transform duration-200 ease-out
            ${painelDireitoMobile ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
          {/* Header do Detalhe: ID + Status + Menu */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-surface-border flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base text-ink-primary tracking-tight">
                #{ticketAtivo.code}
              </span>
              <BadgeStatusTicket status={ticketAtivo.status} />
            </div>

            <div className="flex items-center gap-1.5">
              {/* Botão fechar para telas mobile */}
              <button
                type="button"
                onClick={() => setPainelDireitoMobile(false)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface"
              >
                <X size={16} />
              </button>

              {/* Mais opções */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuAcoesAberto((v) => !v)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-secondary hover:text-ink-primary hover:bg-surface transition-colors cursor-pointer"
                  title="Ações do ticket"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuAcoesAberto && (
                  <div className="absolute right-0 mt-1 w-44 bg-surface-card border border-surface-border rounded-xl shadow-lg py-1.5 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAtualizarStatus('Resolved')}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface text-ink-primary font-medium"
                    >
                      Marcar como Resolvido
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAtualizarStatus('Escalated')}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface text-ink-primary font-medium"
                    >
                      Escalar para Engenharia
                    </button>
                    <div className="my-1 border-t border-surface-border" />
                    <button
                      type="button"
                      onClick={handleRemoverTicket}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 font-medium"
                    >
                      Excluir Chamado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-2 border-b border-surface-border/50 text-[11px] text-ink-muted uppercase font-semibold tracking-wider">
            Ticket Details
          </div>

          {/* Conteúdo Rolável do Painel de Detalhes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Bloco 1: Issued By */}
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Issued By
              </p>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle dark:bg-white/5 border border-surface-border/80">
                <div className="flex items-center gap-3 min-w-0">
                  {ticketAtivo.issuedBy?.avatar ? (
                    <img
                      src={ticketAtivo.issuedBy.avatar}
                      alt={ticketAtivo.issuedBy.name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-surface-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#0455BF]/10 text-[#0455BF] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {ticketAtivo.issuedBy?.name?.slice(0, 2).toUpperCase() || 'US'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-ink-primary truncate">
                        {ticketAtivo.issuedBy?.name || 'Cliente'}
                      </p>
                      {ticketAtivo.issuedBy?.verified && (
                        <CheckCircle2 size={13} className="text-[#0455BF] fill-[#0455BF]/20 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-ink-secondary truncate">
                      {ticketAtivo.issuedBy?.email || 'email@cliente.com'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalRespostaAberto(true)}
                  className="w-9 h-9 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white flex items-center justify-center flex-shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  title="Abrir chat ou enviar resposta"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>

            {/* Bloco 2: AI Summary */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0455BF] dark:text-blue-400 mb-2">
                <Sparkles size={14} className="text-[#0455BF] dark:text-blue-400" />
                <span>AI Summary</span>
                <span className="text-[10px] text-[#0455BF]/70 font-semibold ml-0.5">✦</span>
              </div>

              <h3 className="font-bold text-sm text-ink-primary mb-1">
                {ticketAtivo.aiSummary?.title || ticketAtivo.title}
              </h3>
              <p className="text-ink-secondary text-xs leading-relaxed mb-3">
                {ticketAtivo.aiSummary?.description || 'Nenhum resumo gerado.'}
              </p>

              {/* Confidence score progress bar */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted font-medium mb-1.5">
                  <span>Confidence score</span>
                  <span className="font-bold text-ink-primary">
                    {ticketAtivo.aiSummary?.confidence || 92}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0455BF] rounded-full transition-all duration-500"
                    style={{ width: `${ticketAtivo.aiSummary?.confidence || 92}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bloco 3: Suggested Resolution */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-ink-primary">Suggested Resolution</h4>
                <p className="text-[11px] text-ink-muted">Step-by-step recommended response</p>
              </div>

              {/* Checklist de Resolução */}
              <div className="space-y-2">
                {ticketAtivo.suggestedResolution?.steps?.map((step, idx) => {
                  const feito = passoEstaMarcado(idx, step.done);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePasso(idx)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl transition-colors cursor-pointer select-none ${
                        feito
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 text-ink-secondary'
                          : 'hover:bg-surface-hover/60 text-ink-primary'
                      }`}
                    >
                      <button
                        type="button"
                        className={`mt-0.5 flex-shrink-0 ${
                          feito ? 'text-emerald-600 dark:text-emerald-400' : 'text-ink-muted'
                        }`}
                      >
                        {feito ? <CheckSquare2 size={16} /> : <Square size={16} />}
                      </button>
                      <span className={`text-xs leading-tight ${feito ? 'line-through opacity-80' : ''}`}>
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Knowledge base references */}
              {ticketAtivo.suggestedResolution?.kbReferences?.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] text-ink-muted mb-1.5">Knowledge base references</p>
                  <div className="flex flex-wrap gap-2">
                    {ticketAtivo.suggestedResolution.kbReferences.map((kb, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (dispararToast) {
                            dispararToast({
                              tipo: 'info',
                              titulo: kb.code,
                              mensagem: `Visualizando base de conhecimento: ${kb.title}`,
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0455BF] hover:underline bg-blue-50/80 dark:bg-blue-950/30 px-2 py-1 rounded-md cursor-pointer"
                      >
                        <span>{kb.code}: {kb.title}</span>
                        <ExternalLink size={10} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Botões de Ação da Resolução */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTextoResposta(ticketAtivo.suggestedResolution?.steps?.map((s) => `• ${s.text}`).join('\n') || '');
                    setModalRespostaAberto(true);
                  }}
                  className="flex-1 h-9 px-3 rounded-xl border border-surface-border hover:bg-surface font-semibold text-ink-primary text-xs transition-colors cursor-pointer"
                >
                  Edit Before Sending
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAtualizarStatus('Resolved');
                    if (dispararToast) {
                      dispararToast({
                        tipo: 'sucesso',
                        titulo: 'Resposta aplicada',
                        mensagem: 'A resolução recomendada foi aplicada e o ticket atualizado.',
                      });
                    }
                  }}
                  className="flex-1 h-9 px-3 rounded-xl bg-[#0455BF] hover:bg-[#034499] font-semibold text-white text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Apply as Reply
                </button>
              </div>
            </div>

            {/* Bloco 4: Activity Timeline */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-ink-primary mb-3">Activity Timeline</h4>
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-border">
                {ticketAtivo.timeline?.map((item) => (
                  <div key={item.id} className="relative">
                    {/* Nó circular do evento */}
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-surface-card border-2 border-[#0455BF] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0455BF]" />
                    </div>

                    <div>
                      <p className="font-semibold text-ink-primary text-xs">{item.title}</p>
                      <p className="text-[11px] text-ink-muted mt-0.5">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rodapé Fixo do Detalhe: Remove Ticket + Update Ticket */}
          <div className="h-16 px-5 border-t border-surface-border flex items-center justify-between gap-3 flex-shrink-0 bg-surface/30">
            <button
              type="button"
              onClick={handleRemoverTicket}
              className="text-xs font-semibold text-ink-secondary hover:text-red-600 transition-colors cursor-pointer"
            >
              Remove Ticket
            </button>

            {/* Botão de Atualizar Ticket com Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownUpdateStatus((v) => !v)}
                className="h-9 px-4 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Update Ticket</span>
                <ChevronUp
                  size={14}
                  className={`transition-transform duration-150 ${dropdownUpdateStatus ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownUpdateStatus && (
                <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-ink-muted">
                    Definir Status
                  </div>
                  {[
                    { id: 'Open', label: 'Open' },
                    { id: 'Pending', label: 'Pending' },
                    { id: 'Resolved', label: 'Resolved' },
                    { id: 'Escalated', label: 'Escalated' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleAtualizarStatus(st.id)}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-surface cursor-pointer ${
                        ticketAtivo.status === st.id ? 'font-bold text-[#0455BF]' : 'text-ink-primary'
                      }`}
                    >
                      <span>{st.label}</span>
                      {ticketAtivo.status === st.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL: EDITAR / ENVIAR RESPOSTA PARA O CLIENTE
          ═════════════════════════════════════════════════════════════ */}
      {modalRespostaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink-primary">
                  Responder Ticket #{ticketAtivo?.code}
                </h3>
                <p className="text-xs text-ink-secondary">
                  Destinatário: {ticketAtivo?.issuedBy?.name} ({ticketAtivo?.issuedBy?.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalRespostaAberto(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={6}
              value={textoResposta}
              onChange={(e) => setTextoResposta(e.target.value)}
              placeholder="Digite sua resposta oficial ou edite os passos da resolução recomendada..."
              className="w-full p-3 rounded-xl bg-surface border border-surface-border text-xs text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-[#0455BF]"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setModalRespostaAberto(false)}
                className="h-9 px-4 rounded-xl border border-surface-border text-xs font-semibold text-ink-secondary hover:text-ink-primary"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={enviandoResposta || !textoResposta.trim()}
                onClick={handleEnviarResposta}
                className="h-9 px-4 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {enviandoResposta ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Enviar Resposta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaTicketsRecebidos;
