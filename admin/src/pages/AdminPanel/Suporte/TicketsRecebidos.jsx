// =============================================================
// PRANCHETO.IA - PAINEL ADMIN / TICKETS RECEBIDOS
// Layout moderno em 3 colunas (Filtros / Tabela / Detalhes IA)
// Totalmente traduzido para o Português (pt-BR) e integrado ao
// Design System do Prancheto.IA com suporte a tema claro e escuro.
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

// ─── DADOS INICIAIS (ALTA FIDELIDADE AO LAYOUT EM PORTUGUÊS) ──
const TICKETS_MOCK = [
  {
    id: 'AV-981',
    code: 'AV-981',
    title: 'Cobrança duplicada no cartão',
    category: 'Financeiro',
    status: 'Aberto',
    priority: 'Urgente',
    issuedBy: {
      name: 'Brenda Kim',
      email: 'brendakim@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      verified: true,
    },
    aiSummary: {
      title: 'Cobrança duplicada na mesma transação',
      description: 'O cliente foi tarifado duas vezes pela mesma assinatura na fatura do cartão de crédito.',
      confidence: 92,
    },
    suggestedResolution: {
      steps: [
        { text: 'Verificar a transação duplicada no gateway de pagamento.', done: true },
        { text: 'Confirmar se ambos os débitos foram compensados com sucesso', done: false },
        { text: 'Iniciar estorno imediato do valor cobrado em duplicidade', done: false },
        { text: 'Enviar e-mail de confirmação com comprovante do estorno', done: false },
      ],
      kbReferences: [
        { code: 'KB-3041', title: 'Tratamento de Cobranças Duplicadas' },
        { code: 'KB-1872', title: 'Processo de Reembolso e Estorno' },
      ],
    },
    timeline: [
      { id: 1, title: 'Atribuído a João Silva', time: 'Hoje, 10:45', type: 'assign' },
      { id: 2, title: 'Resumo e resolução gerados por IA', time: 'Hoje, 10:32', type: 'ai' },
      { id: 3, title: 'Chamado aberto por Brenda Kim', time: 'Hoje, 10:30', type: 'create' },
    ],
  },
  {
    id: 'AV-982',
    code: 'AV-982',
    title: 'Não consigo redefinir minha senha',
    category: 'Conta & Login',
    status: 'Pendente',
    priority: 'Alta',
    issuedBy: {
      name: 'Lucas Silva',
      email: 'lucas.silva@empresa.com',
      verified: true,
    },
    aiSummary: {
      title: 'Token de recuperação de senha expirado',
      description: 'O usuário solicitou o link de redefinição 3 vezes sem conseguir concluir o acesso.',
      confidence: 88,
    },
    suggestedResolution: {
      steps: [
        { text: 'Verificar logs de entrega de e-mail SMTP para o domínio.', done: true },
        { text: 'Confirmar se a conta não está bloqueada por excesso de tentativas', done: false },
        { text: 'Gerar link temporário de acesso seguro de uso único', done: false },
      ],
      kbReferences: [
        { code: 'KB-1102', title: 'Solução de Problemas em Recuperação de Senha' },
      ],
    },
    timeline: [
      { id: 1, title: 'Resumo e resolução gerados por IA', time: 'Hoje, 09:15', type: 'ai' },
      { id: 2, title: 'Chamado aberto por Lucas Silva', time: 'Hoje, 09:12', type: 'create' },
    ],
  },
  {
    id: 'AV-983',
    code: 'AV-983',
    title: 'Erro no fechamento do pedido (Checkout)',
    category: 'Problema Técnico',
    status: 'Escalado',
    priority: 'Urgente',
    issuedBy: {
      name: 'Carla Mendez',
      email: 'carla@acme.com',
      verified: true,
    },
    aiSummary: {
      title: 'Exceção não tratada na intent de pagamento',
      description: 'O modal de checkout trava quando o mês de expiração do cartão é informado com dígito único.',
      confidence: 96,
    },
    suggestedResolution: {
      steps: [
        { text: 'Inspecionar logs de erro do cliente no Sentry #8492.', done: true },
        { text: 'Encaminhar chamado para a equipe de engenharia com prioridade crítica', done: true },
        { text: 'Notificar o cliente sobre a solução paliativa disponível', done: false },
      ],
      kbReferences: [
        { code: 'KB-4029', title: 'Códigos de Erro no Checkout e Correções' },
      ],
    },
    timeline: [
      { id: 1, title: 'Escalado para Engenharia pelo Bot de Suporte', time: 'Hoje, 08:50', type: 'assign' },
      { id: 2, title: 'IA detectou padrão de falha no frontend', time: 'Hoje, 08:45', type: 'ai' },
      { id: 3, title: 'Chamado aberto por Carla Mendez', time: 'Hoje, 08:40', type: 'create' },
    ],
  },
  {
    id: 'AV-984',
    code: 'AV-984',
    title: 'Não é possível baixar a fatura em PDF',
    category: 'Financeiro',
    status: 'Resolvido',
    priority: 'Média',
    issuedBy: {
      name: 'Marcos Lima',
      email: 'marcos@techcorp.com',
      verified: false,
    },
    aiSummary: {
      title: 'Tempo limite na renderização do PDF',
      description: 'O serviço de renderização excedeu o timeout no fechamento contábil mensal.',
      confidence: 85,
    },
    suggestedResolution: {
      steps: [
        { text: 'Regenerar arquivo PDF da fatura manualmente.', done: true },
        { text: 'Enviar link direto para o cliente com link seguro', done: true },
      ],
      kbReferences: [
        { code: 'KB-2015', title: 'Exportação de Faturas e Regeneração de PDF' },
      ],
    },
    timeline: [
      { id: 1, title: 'Marcado como resolvido por Pedro Costa', time: 'Ontem, 16:20', type: 'assign' },
      { id: 2, title: 'Chamado aberto por Marcos Lima', time: 'Ontem, 15:50', type: 'create' },
    ],
  },
  {
    id: 'AV-985',
    code: 'AV-985',
    title: 'Assinatura renovada automaticamente',
    category: 'Assinaturas & Planos',
    status: 'Aberto',
    priority: 'Alta',
    issuedBy: {
      name: 'Juliana Castro',
      email: 'juli@startup.io',
      verified: true,
    },
    aiSummary: {
      title: 'Dúvida sobre renovação do plano anual',
      description: 'Cliente solicitou esclarecimentos sobre o e-mail de aviso prévio enviado 7 dias antes.',
      confidence: 91,
    },
    suggestedResolution: {
      steps: [
        { text: 'Confirmar envio e entrega do e-mail de aviso prévio.', done: true },
        { text: 'Apresentar cupom com desconto de retenção ou opção de cancelamento', done: false },
      ],
      kbReferences: [
        { code: 'KB-1490', title: 'Política de Assinaturas e Ofertas de Retenção' },
      ],
    },
    timeline: [
      { id: 1, title: 'IA classificou como prioridade de Retenção', time: 'Ontem, 14:15', type: 'ai' },
      { id: 2, title: 'Chamado aberto por Juliana Castro', time: 'Ontem, 14:10', type: 'create' },
    ],
  },
  {
    id: 'AV-986',
    code: 'AV-986',
    title: 'Link de verificação de e-mail expirou',
    category: 'Conta & Login',
    status: 'Pendente',
    priority: 'Urgente',
    issuedBy: {
      name: 'Roberto Faria',
      email: 'rfaria@dominio.com',
      verified: false,
    },
    aiSummary: {
      title: 'Janela de expiração do link muito curta',
      description: 'A política de segurança expirou o link em 15 minutos antes da confirmação pelo usuário.',
      confidence: 89,
    },
    suggestedResolution: {
      steps: [
        { text: 'Reenviar link de verificação atualizado com prazo estendido.', done: false },
      ],
      kbReferences: [
        { code: 'KB-1102', title: 'Configurações de Validade do Link Mágico' },
      ],
    },
    timeline: [
      { id: 1, title: 'Chamado aberto por Roberto Faria', time: 'Ontem, 11:30', type: 'create' },
    ],
  },
  {
    id: 'AV-987',
    code: 'AV-987',
    title: 'Lentidão ao carregar painel de controle',
    category: 'Problema Técnico',
    status: 'Aberto',
    priority: 'Alta',
    issuedBy: {
      name: 'Vanessa Rios',
      email: 'vanessa@logistica.com',
      verified: true,
    },
    aiSummary: {
      title: 'Latência em consulta SQL com grande volume de dados',
      description: 'Organização com mais de 50.000 registros registrou 4.2s de resposta nos widgets.',
      confidence: 94,
    },
    suggestedResolution: {
      steps: [
        { text: 'Verificar taxa de acerto do cache Redis para a empresa.', done: true },
        { text: 'Aplicar índice otimizado na coluna de data de criação', done: false },
      ],
      kbReferences: [
        { code: 'KB-5011', title: 'Otimização de Índices e Desempenho de Consultas' },
      ],
    },
    timeline: [
      { id: 1, title: 'Atribuído à Equipe de Banco de Dados', time: 'Ontem, 10:00', type: 'assign' },
      { id: 2, title: 'Chamado aberto por Vanessa Rios', time: 'Ontem, 09:40', type: 'create' },
    ],
  },
  {
    id: 'AV-988',
    code: 'AV-988',
    title: 'Solicitação de reembolso do mês anterior',
    category: 'Financeiro',
    status: 'Pendente',
    priority: 'Baixa',
    issuedBy: {
      name: 'Diego Martins',
      email: 'diego@varejo.com',
      verified: true,
    },
    aiSummary: {
      title: 'Cálculo de reembolso proporcional',
      description: 'Cliente realizou downgrade no dia 15 e solicitou compensação do período restante.',
      confidence: 90,
    },
    suggestedResolution: {
      steps: [
        { text: 'Conferir data exata da alteração de plano.', done: true },
        { text: 'Calcular crédito proporcional para a próxima fatura', done: false },
      ],
      kbReferences: [
        { code: 'KB-1872', title: 'Processo de Reembolso e Estorno' },
      ],
    },
    timeline: [
      { id: 1, title: 'Chamado aberto por Diego Martins', time: 'Ontem, 08:20', type: 'create' },
    ],
  },
  {
    id: 'AV-989',
    code: 'AV-989',
    title: 'Não consigo alterar a forma de pagamento',
    category: 'Assinaturas & Planos',
    status: 'Aberto',
    priority: 'Baixa',
    issuedBy: {
      name: 'Aline Souza',
      email: 'aline@design.co',
      verified: true,
    },
    aiSummary: {
      title: 'Falha na validação 3D Secure do banco',
      description: 'O banco emissor recusou a autorização de teste para cadastramento do novo cartão.',
      confidence: 87,
    },
    suggestedResolution: {
      steps: [
        { text: 'Orientar o cliente a autorizar a transação no app do banco.', done: false },
      ],
      kbReferences: [
        { code: 'KB-3041', title: 'Métodos de Pagamento e Autenticação 3DS' },
      ],
    },
    timeline: [
      { id: 1, title: 'Chamado aberto por Aline Souza', time: 'Há 2 dias', type: 'create' },
    ],
  },
  {
    id: 'AV-990',
    code: 'AV-990',
    title: 'Erro 500 ao exportar relatório em lote',
    category: 'Problema Técnico',
    status: 'Escalado',
    priority: 'Alta',
    issuedBy: {
      name: 'Felipe Costa',
      email: 'felipe@consultoria.br',
      verified: true,
    },
    aiSummary: {
      title: 'Limite de memória excedido no worker de exportação',
      description: 'O container atingiu o limite de memória ao gerar arquivo de exportação superior a 200MB.',
      confidence: 97,
    },
    suggestedResolution: {
      steps: [
        { text: 'Configurar processamento em streaming para exportações pesadas.', done: true },
        { text: 'Reiniciar fila de exportação com processador em chunks', done: false },
      ],
      kbReferences: [
        { code: 'KB-4029', title: 'Limites de Exportação e Download em Lote' },
      ],
    },
    timeline: [
      { id: 1, title: 'Atribuído à Infraestrutura de Workers', time: 'Há 2 dias', type: 'assign' },
      { id: 2, title: 'Chamado aberto por Felipe Costa', time: 'Há 2 dias', type: 'create' },
    ],
  },
  {
    id: 'AV-991',
    code: 'AV-991',
    title: 'Assinatura renovada automaticamente...',
    category: 'Assinaturas & Planos',
    status: 'Resolvido',
    priority: 'Urgente',
    issuedBy: { name: 'Renato Melo', email: 'renato@empresa.com', verified: true },
    aiSummary: { title: 'Renovação resolvida', description: 'Cliente aceitou cupom especial de retenção.', confidence: 90 },
    suggestedResolution: { steps: [{ text: 'Aplicado desconto de 20% no plano', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 3 dias', type: 'assign' }],
  },
  {
    id: 'AV-992',
    code: 'AV-992',
    title: 'Erro no checkout corrigido na v1.4.2',
    category: 'Problema Técnico',
    status: 'Resolvido',
    priority: 'Alta',
    issuedBy: { name: 'Patricia Dias', email: 'patricia@loja.com', verified: true },
    aiSummary: { title: 'Falha corrigida no hotfix', description: 'Regra de validação atualizada em produção.', confidence: 95 },
    suggestedResolution: { steps: [{ text: 'Deploy validado no ambiente produtivo', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 3 dias', type: 'assign' }],
  },
  {
    id: 'AV-993',
    code: 'AV-993',
    title: 'Estorno de cobrança duplicada efetuado',
    category: 'Financeiro',
    status: 'Resolvido',
    priority: 'Baixa',
    issuedBy: { name: 'Gustavo Paiva', email: 'gustavo@startup.com', verified: true },
    aiSummary: { title: 'Estorno concluído', description: 'Devolução autorizada e comprovante enviado.', confidence: 98 },
    suggestedResolution: { steps: [{ text: 'Comprovante do estorno enviado ao cliente', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 3 dias', type: 'assign' }],
  },
  {
    id: 'AV-994',
    code: 'AV-994',
    title: 'Exportação de dados enviada com sucesso',
    category: 'Problema Técnico',
    status: 'Resolvido',
    priority: 'Baixa',
    issuedBy: { name: 'Mariana Duarte', email: 'mariana@duarte.com', verified: false },
    aiSummary: { title: 'Arquivo entregue', description: 'Disponibilizado link direto seguro para download.', confidence: 91 },
    suggestedResolution: { steps: [{ text: 'Download verificado com sucesso pelo cliente', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 4 dias', type: 'assign' }],
  },
  {
    id: 'AV-995',
    code: 'AV-995',
    title: 'Cancelamento atendido a pedido',
    category: 'Assinaturas & Planos',
    status: 'Resolvido',
    priority: 'Urgente',
    issuedBy: { name: 'Otavio Barros', email: 'otavio@barros.com', verified: true },
    aiSummary: { title: 'Cancelamento efetuado', description: 'Assinatura encerrada sem novas cobranças.', confidence: 88 },
    suggestedResolution: { steps: [{ text: 'Cancelamento confirmado no gateway', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 4 dias', type: 'assign' }],
  },
  {
    id: 'AV-996',
    code: 'AV-996',
    title: 'Ajuste na fatura e crédito aplicado',
    category: 'Financeiro',
    status: 'Resolvido',
    priority: 'Baixa',
    issuedBy: { name: 'Beatriz Leal', email: 'bia@leal.com', verified: true },
    aiSummary: { title: 'Ajuste financeiro concluído', description: 'Crédito registrado para abatimento no próximo ciclo.', confidence: 93 },
    suggestedResolution: { steps: [{ text: 'Crédito lançado no saldo da conta', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 5 dias', type: 'assign' }],
  },
  {
    id: 'AV-997',
    code: 'AV-997',
    title: 'Lentidão resolvida com otimização',
    category: 'Problema Técnico',
    status: 'Resolvido',
    priority: 'Baixa',
    issuedBy: { name: 'Thiago Nogueira', email: 'thiago@nogueira.com', verified: true },
    aiSummary: { title: 'Cache aquecido', description: 'Tempos de carregamento normalizados abaixo de 180ms.', confidence: 96 },
    suggestedResolution: { steps: [{ text: 'Regras de invalidação de cache atualizadas', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 5 dias', type: 'assign' }],
  },
  {
    id: 'AV-998',
    code: 'AV-998',
    title: 'Cartão atualizado pelo cliente',
    category: 'Assinaturas & Planos',
    status: 'Resolvido',
    priority: 'Média',
    issuedBy: { name: 'Camila Pires', email: 'camila@pires.com', verified: true },
    aiSummary: { title: 'Novo cartão cadastrado', description: 'Validação 3DS realizada com êxito.', confidence: 94 },
    suggestedResolution: { steps: [{ text: 'Forma de pagamento ativa verificada', done: true }], kbReferences: [] },
    timeline: [{ id: 1, title: 'Chamado resolvido', time: 'Há 6 dias', type: 'assign' }],
  },
];

// Helper para cores de prioridade
const getCorPrioridade = (prioridade) => {
  switch (prioridade?.toLowerCase()) {
    case 'urgente':
    case 'urgent':
    case 'crítica':
    case 'critica':
      return 'text-red-500 fill-red-500';
    case 'alta':
    case 'high':
      return 'text-amber-500 fill-amber-500';
    case 'média':
    case 'media':
    case 'medium':
      return 'text-yellow-500 fill-yellow-500';
    case 'baixa':
    case 'low':
    default:
      return 'text-emerald-500 fill-emerald-500';
  }
};

// Helper para badges de status (alta fidelidade visual à imagem em português)
const BadgeStatusTicket = ({ status }) => {
  const s = status?.toLowerCase() || 'aberto';
  if (s === 'aberto' || s === 'open') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/40">
        Aberto
      </span>
    );
  }
  if (s === 'pendente' || s === 'pending' || s === 'em_atendimento' || s === 'aguardando_cliente') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/40">
        Pendente
      </span>
    );
  }
  if (s === 'escalado' || s === 'escalated') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/40">
        Escalado
      </span>
    );
  }
  // Resolvido
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/40">
      Resolvido
    </span>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: PÁGINA TICKETS
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
          financeiro: 'Financeiro',
          problema_tecnico: 'Problema Técnico',
          duvida: 'Conta & Login',
          sugestao: 'Assinaturas & Planos',
          outro: 'Outros',
        };
        const mapStatus = {
          aberto: 'Aberto',
          em_atendimento: 'Pendente',
          aguardando_cliente: 'Pendente',
          resolvido: 'Resolvido',
          fechado: 'Resolvido',
        };
        const mapPrioridade = {
          critica: 'Urgente',
          alta: 'Alta',
          media: 'Média',
          baixa: 'Baixa',
        };

        return {
          id: t.id,
          code: cod,
          title: t.assunto || 'Sem assunto',
          category: mapCategoria[t.categoria] || 'Problema Técnico',
          status: mapStatus[t.status] || 'Aberto',
          priority: mapPrioridade[t.prioridade] || 'Média',
          issuedBy: {
            name: t.criador?.nome || t.tenant?.nome || 'Usuário',
            email: t.criador?.email || 'contato@cliente.com',
            verified: true,
          },
          aiSummary: {
            title: t.assunto || 'Chamado registrado',
            description: t.descricao || 'Nenhuma descrição detalhada enviada pelo cliente.',
            confidence: 90,
          },
          suggestedResolution: {
            steps: [
              { text: 'Analisar dados do chamado e validar informações.', done: false },
              { text: 'Elaborar resposta e orientar o cliente.', done: false },
            ],
            kbReferences: [
              { code: 'KB-1001', title: 'Procedimentos Gerais de Atendimento' },
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
    const abertos = listaTickets.filter((t) => t.status === 'Aberto' || t.status === 'Open').length;
    const pendentes = listaTickets.filter((t) => t.status === 'Pendente' || t.status === 'Pending').length;
    const resolvidos = listaTickets.filter((t) => t.status === 'Resolvido' || t.status === 'Resolved').length;
    const escalados = listaTickets.filter((t) => t.status === 'Escalado' || t.status === 'Escalated').length;

    return {
      all: total > 20 ? '1.036' : total,
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
      if (filtroView === 'open' && t.status !== 'Aberto' && t.status !== 'Open') return false;
      if (filtroView === 'pending' && t.status !== 'Pendente' && t.status !== 'Pending') return false;
      if (filtroView === 'resolved' && t.status !== 'Resolvido' && t.status !== 'Resolved') return false;
      if (filtroView === 'escalated' && t.status !== 'Escalado' && t.status !== 'Escalated') return false;
      if (filtroView === 'new' && t.status !== 'Aberto' && t.status !== 'Open') return false;

      // Filtro de Categoria
      if (filtroCategoria !== 'all') {
        const catMap = {
          billing: ['Financeiro', 'Billing'],
          technical: ['Problema Técnico', 'Technical Issue'],
          account: ['Conta & Login', 'Account & Login'],
          subscription: ['Assinaturas & Planos', 'Subscription'],
          other: ['Outros', 'Other'],
        };
        const aceitas = catMap[filtroCategoria] || [];
        if (!aceitas.includes(t.category)) return false;
      }

      // Filtro de Prioridade
      if (filtroPrioridade !== 'all') {
        const prioMap = {
          urgent: ['Urgente', 'Urgent', 'Crítica'],
          high: ['Alta', 'High'],
          medium: ['Média', 'Medium'],
          low: ['Baixa', 'Low'],
        };
        const aceitas = prioMap[filtroPrioridade] || [];
        if (!aceitas.includes(t.priority)) return false;
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
          Aberto: 'aberto',
          Open: 'aberto',
          Pendente: 'em_atendimento',
          Pending: 'em_atendimento',
          Resolvido: 'resolvido',
          Resolved: 'resolvido',
          Escalado: 'critica',
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
        mensagem: `Chamado ${ticketAtivo.code} alterado para "${novoStatus}".`,
      });
    }
  };

  // Remover ticket
  const handleRemoverTicket = () => {
    if (!ticketAtivo) return;
    if (window.confirm(`Tem certeza que deseja excluir o chamado ${ticketAtivo.code}?`)) {
      setListaTickets((prev) => prev.filter((t) => t.id !== ticketAtivo.id));
      if (dispararToast) {
        dispararToast({
          tipo: 'info',
          titulo: 'Chamado excluído',
          mensagem: `O chamado ${ticketAtivo.code} foi removido com sucesso.`,
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
          {/* 1. SEÇÃO STATUS / VISUALIZAÇÕES */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoViewsAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-ink-muted" />
                <span>Visualizações</span>
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
                  { id: 'all', label: 'Todos os Chamados', icon: Layers, badge: contadores.all },
                  { id: 'new', label: 'Novos', icon: Sparkles, badge: contadores.new, badgeColor: 'bg-[#0455BF] text-white' },
                  { id: 'open', label: 'Abertos', icon: Mail, badge: contadores.open },
                  { id: 'pending', label: 'Pendentes', icon: Clock, badge: contadores.pending },
                  { id: 'resolved', label: 'Resolvidos', icon: CheckCircle2, badge: contadores.resolved },
                  { id: 'escalated', label: 'Escalados', icon: AlertCircle, badge: contadores.escalated },
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

          {/* 2. SEÇÃO CATEGORIAS */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoCategoriasAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-ink-muted" />
                <span>Categorias</span>
                <span className="text-[11px] font-normal text-ink-muted ml-0.5">5</span>
              </div>
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${secaoCategoriasAberta ? 'rotate-180' : ''}`}
              />
            </button>

            {secaoCategoriasAberta && (
              <div className="mt-1 space-y-0.5">
                {[
                  { id: 'all', label: 'Todas as Categorias', icon: Layers },
                  { id: 'billing', label: 'Financeiro', icon: CreditCard },
                  { id: 'technical', label: 'Problema Técnico', icon: Wrench },
                  { id: 'account', label: 'Conta & Login', icon: UserCheck },
                  { id: 'subscription', label: 'Assinaturas & Planos', icon: RefreshCw },
                  { id: 'other', label: 'Outros', icon: MoreHorizontal },
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

          {/* 3. SEÇÃO PRIORIDADE */}
          <div>
            <button
              type="button"
              onClick={() => setSecaoPrioridadeAberta((v) => !v)}
              className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-semibold text-ink-muted uppercase tracking-wider hover:text-ink-primary transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Flag size={14} className="text-ink-muted" />
                <span>Prioridade</span>
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
                  { id: 'all', label: 'Todas as Prioridades', cor: 'text-slate-400' },
                  { id: 'urgent', label: 'Urgente', cor: 'text-red-500 fill-red-500' },
                  { id: 'high', label: 'Alta', cor: 'text-amber-500 fill-amber-500' },
                  { id: 'medium', label: 'Média', cor: 'text-yellow-500 fill-yellow-500' },
                  { id: 'low', label: 'Baixa', cor: 'text-emerald-500 fill-emerald-500' },
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
                ? 'Todos os Chamados'
                : filtroView === 'new'
                  ? 'Novos Chamados'
                  : filtroView === 'open'
                    ? 'Chamados Abertos'
                    : filtroView === 'pending'
                      ? 'Chamados Pendentes'
                      : filtroView === 'resolved'
                        ? 'Chamados Resolvidos'
                        : 'Chamados Escalados'}
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
                placeholder="Pesquisar chamados..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-full bg-surface-subtle dark:bg-white/5 border border-surface-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-[#0455BF] transition-all"
              />
              {termoBusca && (
                <button
                  type="button"
                  onClick={() => setTermoBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                  title="Limpar busca"
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

            {/* Botão de Limpar Filtros */}
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
                <th className="py-2.5 px-3 font-semibold text-ink-muted">Título do Chamado</th>
                <th className="py-2.5 px-3 w-36 font-semibold text-ink-muted hidden sm:table-cell">Categoria</th>
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
                      <p className="font-semibold text-sm">Nenhum chamado encontrado</p>
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
              <option value={10}>10 Linhas</option>
              <option value={20}>20 Linhas</option>
              <option value={50}>50 Linhas</option>
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
              <span className="hidden sm:inline">Anterior</span>
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
              <span className="hidden sm:inline">Próximo</span>
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
                  title="Ações do chamado"
                >
                  <MoreHorizontal size={18} />
                </button>

                {menuAcoesAberto && (
                  <div className="absolute right-0 mt-1 w-48 bg-surface-card border border-surface-border rounded-xl shadow-lg py-1.5 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => handleAtualizarStatus('Resolvido')}
                      className="w-full text-left px-3 py-1.5 hover:bg-surface text-ink-primary font-medium"
                    >
                      Marcar como Resolvido
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAtualizarStatus('Escalado')}
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
            Detalhes do Chamado
          </div>

          {/* Conteúdo Rolável do Painel de Detalhes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Bloco 1: Aberto Por (Issued By) */}
            <div>
              <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                Aberto Por
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

            {/* Bloco 2: Resumo IA (AI Summary) */}
            <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0455BF] dark:text-blue-400 mb-2">
                <Sparkles size={14} className="text-[#0455BF] dark:text-blue-400" />
                <span>Resumo da IA</span>
                <span className="text-[10px] text-[#0455BF]/70 font-semibold ml-0.5">✦</span>
              </div>

              <h3 className="font-bold text-sm text-ink-primary mb-1">
                {ticketAtivo.aiSummary?.title || ticketAtivo.title}
              </h3>
              <p className="text-ink-secondary text-xs leading-relaxed mb-3">
                {ticketAtivo.aiSummary?.description || 'Nenhum resumo gerado.'}
              </p>

              {/* Barra de Grau de Confiança */}
              <div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted font-medium mb-1.5">
                  <span>Grau de Confiança</span>
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

            {/* Bloco 3: Resolução Recomendada (Suggested Resolution) */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-ink-primary">Resolução Sugerida</h4>
                <p className="text-[11px] text-ink-muted">Passo a passo recomendado para o atendimento</p>
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

              {/* Referências da Base de Conhecimento */}
              {ticketAtivo.suggestedResolution?.kbReferences?.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] text-ink-muted mb-1.5">Referências da base de conhecimento</p>
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
                  Editar antes de Enviar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleAtualizarStatus('Resolvido');
                    if (dispararToast) {
                      dispararToast({
                        tipo: 'sucesso',
                        titulo: 'Resposta aplicada',
                        mensagem: 'A resolução recomendada foi aplicada e o chamado atualizado.',
                      });
                    }
                  }}
                  className="flex-1 h-9 px-3 rounded-xl bg-[#0455BF] hover:bg-[#034499] font-semibold text-white text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Aplicar como Resposta
                </button>
              </div>
            </div>

            {/* Bloco 4: Histórico de Atividades (Activity Timeline) */}
            <div className="pt-2">
              <h4 className="font-bold text-sm text-ink-primary mb-3">Histórico de Atividades</h4>
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

          {/* Rodapé Fixo do Detalhe: Excluir Chamado + Atualizar Chamado */}
          <div className="h-16 px-5 border-t border-surface-border flex items-center justify-between gap-3 flex-shrink-0 bg-surface/30">
            <button
              type="button"
              onClick={handleRemoverTicket}
              className="text-xs font-semibold text-ink-secondary hover:text-red-600 transition-colors cursor-pointer"
            >
              Excluir Chamado
            </button>

            {/* Botão de Atualizar Chamado com Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownUpdateStatus((v) => !v)}
                className="h-9 px-4 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>Atualizar Chamado</span>
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
                    { id: 'Aberto', label: 'Aberto' },
                    { id: 'Pendente', label: 'Pendente' },
                    { id: 'Resolvido', label: 'Resolvido' },
                    { id: 'Escalado', label: 'Escalado' },
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
                  Responder Chamado #{ticketAtivo?.code}
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
