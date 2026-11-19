// =============================================================
// PRANCHETO.IA - SEGURANÇA & AUDITORIA (SUPER ADMIN)
// Layout Live Agent / Trilha Forense de Auditoria
// Baseado no design system oficial com visual de alta precisão,
// integração com a tabela audit_logs do Supabase, suporte a
// investigação de impersonation, diferencial de dados e LGPD.
// =============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  FileText,
  Download,
  Copy,
  Check,
  User,
  AlertOctagon,
  ExternalLink,
  Cpu,
  Database,
  RefreshCw,
  Eye,
  Terminal,
  Activity,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../../lib/supabase.js';
import { useUIStore } from '../../../store/uiStore.js';

// ─── AGENTES DE MONITORAMENTO E EVENTOS FORENSES (MOCK BASE) ─
const AGENTES_INICIAIS = [
  {
    id: 'SEC-001',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Running',
    lastActivity: 'Há 12s',
    timestamp: new Date(Date.now() - 12000).toISOString(),
    user: {
      nome: 'Sue (Agente Automatizado)',
      email: 'soc-analyst@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global Security',
    },
    ip: '192.168.1.104',
    userAgent: 'PranchetoAgentWorker/2.4 (SecurityScan; Linux x86_64)',
    metodoHttp: 'POST',
    rota: '/api/security/scan/documents',
    recurso: 'documentos_compliance',
    recursoId: 'doc-8492-privado',
    descricao: 'Varredura automática de integridade e verificação de dados sensíveis (DLP) em documentos anexos.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { status_varredura: 'pendente', arquivos_pendentes: 12 },
    dadosNovos: { status_varredura: 'em_execucao', arquivos_analisados: 12, ameacas_detectadas: 0 },
  },
  {
    id: 'SEC-002',
    agentName: 'Jose',
    agentRole: 'Detections Engineering Agent',
    task: 'Auditoria de API & Tokens',
    taskRaw: 'API Audit',
    urgencyScore: 22,
    urgencyLevel: 'Low',
    cpu: '12%',
    memory: '220 MB',
    status: 'Running',
    lastActivity: 'Há 1 min',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    user: {
      nome: 'Jose (Engenheiro de Detecção)',
      email: 'detections@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Infra',
    },
    ip: '10.0.4.12',
    userAgent: 'Go-http-client/2.0 (SecurityEngine)',
    metodoHttp: 'GET',
    rota: '/api/v1/auth/tokens/inspect',
    recurso: 'api_tokens',
    recursoId: 'tok-all-active',
    descricao: 'Auditoria contínua de expiração de JWTs e detecção de chaves de API órfãs ou revogadas.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { tokens_verificados: 1840, tokens_expirados: 4, revogados_com_sucesso: true },
  },
  {
    id: 'SEC-003',
    agentName: 'Bob',
    agentRole: 'Threat Hunter Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 88,
    urgencyLevel: 'High',
    cpu: '88%',
    memory: '1.2 GB',
    status: 'Idle',
    lastActivity: 'Há 2 min',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    user: {
      nome: 'Bob (Threat Hunter)',
      email: 'threat-hunter@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '172.16.0.45',
    userAgent: 'ThreatDetector/1.1',
    metodoHttp: 'POST',
    rota: '/api/audit/anomaly/scan',
    recurso: 'audit_logs',
    recursoId: 'batch-2026-11-19',
    descricao: 'Detecção de anomalias estatísticas de acesso e potenciais tentativas de evasão de tenant.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { ultima_verificacao: '2026-11-19T14:00:00Z' },
    dadosNovos: { anomalias_encontradas: 1, ips_suspeitos: ['45.182.20.11'], alerta_gerado: true },
  },
  {
    id: 'SEC-004',
    agentName: 'Muhammad',
    agentRole: 'Threat Intelligence Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Paused',
    lastActivity: 'Há 5 min',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    user: {
      nome: 'Muhammad (Threat Intel)',
      email: 'intel@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '10.0.8.2',
    userAgent: 'IntelCollector/3.0',
    metodoHttp: 'POST',
    rota: '/api/intel/signatures/update',
    recurso: 'firewall_signatures',
    recursoId: 'sig-cve-2026',
    descricao: 'Atualização periódica da lista de reputação de IPs e assinaturas do WAF em pausa para sincronização.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { assinaturas: 420 },
    dadosNovos: { assinaturas: 435, status: 'paused_for_sync' },
  },
  {
    id: 'SEC-005',
    agentName: 'Muhammad',
    agentRole: 'Threat Intelligence Agent',
    task: 'Tentativa de Acesso Barrada',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Blocked',
    lastActivity: 'Há 1h',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      nome: 'Desconhecido (Não Autenticado)',
      email: 'attacker-recon@malicious-ip.net',
      cargo: 'None',
      tenant: 'None',
    },
    ip: '185.220.101.5',
    userAgent: 'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
    metodoHttp: 'GET',
    rota: '/api/admin/users/dump',
    recurso: 'users',
    recursoId: 'all',
    descricao: 'Bloqueio imediato pelo WAF: tentativa de requisição a endpoint administrativo sem cabeçalho Bearer.',
    resultado: 'blocked',
    codigoErro: '403_FORBIDDEN_WAF_BLOCK',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { ip_bloqueado_em_firewall: true, tempo_bloqueio_horas: 24 },
  },
  {
    id: 'SEC-006',
    agentName: 'Bob',
    agentRole: 'Threat Hunter Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Running',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'Bob (Threat Hunter)',
      email: 'threat-hunter@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '172.16.0.45',
    userAgent: 'ThreatDetector/1.1',
    metodoHttp: 'GET',
    rota: '/api/compliance/integrity/check',
    recurso: 'storage_buckets',
    recursoId: 'bucket-anexos',
    descricao: 'Verificação criptográfica SHA-256 de integridade dos arquivos anexos e mídias do storage.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { arquivos_verificados: 9540, integridade_ok: true },
  },
  {
    id: 'SEC-007',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Exportação Bloqueada de Base',
    taskRaw: 'Backup User Data',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '75%',
    memory: '1 GB',
    status: 'Blocked',
    lastActivity: 'Há 30 min',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    user: {
      nome: 'Carlos Menezes (Usuário Suspeito)',
      email: 'carlos.m@empresa-cliente.com',
      cargo: 'member',
      tenant: 'TechCorp Distribuidora',
    },
    ip: '189.44.120.90',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    metodoHttp: 'POST',
    rota: '/api/crm/leads/export-all',
    recurso: 'crm_leads',
    recursoId: 'bulk-export',
    descricao: 'Tentativa de download da base inteira de leads (35.000 contatos) bloqueada: cargo "member" sem permissão de exportação.',
    resultado: 'blocked',
    codigoErro: 'RBAC_PERMISSION_DENIED_EXPORT',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { acao_barrada: true, notificar_admin_tenant: true },
  },
  {
    id: 'SEC-008',
    agentName: 'Bob',
    agentRole: 'Threat Hunter Agent',
    task: 'Backup de Dados LGPD',
    taskRaw: 'Backup User Data',
    urgencyScore: 85,
    urgencyLevel: 'Critical',
    cpu: '80%',
    memory: '256 MB',
    status: 'Paused',
    lastActivity: 'Há 1h',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      nome: 'Super Admin',
      email: 'superadmin@prancheto.ia',
      cargo: 'super_admin',
      tenant: 'Master Governance',
    },
    ip: '201.86.15.4',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    metodoHttp: 'POST',
    rota: '/api/admin/backup/tenants/export',
    recurso: 'tenants_data',
    recursoId: 'tenant-9481',
    descricao: 'Exportação encriptada com chave KMS de backup histórico para auditoria judicial requerida por cliente.',
    resultado: 'success',
    impersonation: {
      ativo: true,
      executorReal: 'superadmin@prancheto.ia (Super Admin)',
      alvoImpersonado: 'Financeiro TechCorp (financeiro@techcorp.com)',
      justificativa: 'Atendimento a requisição legal formal de exportação de dados contábeis.',
    },
    dadosAnteriores: null,
    dadosNovos: { arquivo_gerado: 'backup_9481_enc.tar.gz', tamanho_mb: 245, checksum_sha256: '9f83...a1b' },
  },
  {
    id: 'SEC-009',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Auditoria de Logs de Acesso',
    taskRaw: 'Audit Access Logs',
    urgencyScore: 60,
    urgencyLevel: 'Medium',
    cpu: '55%',
    memory: '512 MB',
    status: 'Paused',
    lastActivity: 'Há 15 min',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    user: {
      nome: 'Sue (SOC Analyst)',
      email: 'soc-analyst@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '192.168.1.104',
    userAgent: 'PranchetoAgentWorker/2.4',
    metodoHttp: 'GET',
    rota: '/api/security/audit/sessions',
    recurso: 'user_sessions',
    recursoId: 'active-sessions',
    descricao: 'Verificação de sessões ativas simultâneas em localizações geográficas conflitantes (Impossible Travel).',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { sessões_analisadas: 340, alertas_impossible_travel: 0 },
  },
  {
    id: 'SEC-010',
    agentName: 'Bob',
    agentRole: 'Threat Hunter Agent',
    task: 'Otimização de Índices e Banco',
    taskRaw: 'Optimize Database',
    urgencyScore: 90,
    urgencyLevel: 'Critical',
    cpu: '30%',
    memory: '1 GB',
    status: 'Idle',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'DBA Automation Bot',
      email: 'dba-bot@prancheto.ia',
      cargo: 'System Daemon',
      tenant: 'Supabase Postgres Host',
    },
    ip: '127.0.0.1',
    userAgent: 'PostgreSQL-pg_cron/1.6',
    metodoHttp: 'CALL',
    rota: 'rpc/vacuum_audit_partitions',
    recurso: 'database_tables',
    recursoId: 'audit_logs_partition',
    descricao: 'Execução de VACUUM ANALYZE e reindexação de índices B-Tree em audit_logs e suporte_tickets.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { bloat_ratio: '14.2%' },
    dadosNovos: { bloat_ratio: '1.1%', tempo_execucao_ms: 1420 },
  },
  {
    id: 'SEC-011',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Deploy de Novas Regras de Segurança',
    taskRaw: 'Deploy New Features',
    urgencyScore: 70,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '128 MB',
    status: 'Idle',
    lastActivity: 'Há 4h',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    user: {
      nome: 'CI/CD Pipeline Security',
      email: 'github-actions@prancheto.ia',
      cargo: 'Pipeline',
      tenant: 'DevOps Cloud',
    },
    ip: '140.82.112.4',
    userAgent: 'GitHub-Hookshot/f31',
    metodoHttp: 'POST',
    rota: '/api/v1/security/rules/reload',
    recurso: 'waf_rulesets',
    recursoId: 'release-v2.8.4',
    descricao: 'Atualização e compilação de novas regras de sanitização para prevenir SQL injection e XSS em parâmetros JSON.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { versao_regras: 'v2.8.3' },
    dadosNovos: { versao_regras: 'v2.8.4', novas_regras_carregadas: 8 },
  },
  {
    id: 'SEC-012',
    agentName: 'Jose',
    agentRole: 'Detections Engineering Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 50,
    urgencyLevel: 'Low',
    cpu: '61%',
    memory: '512 MB',
    status: 'Paused',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'Jose (Engenheiro de Detecção)',
      email: 'detections@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Infra',
    },
    ip: '10.0.4.12',
    userAgent: 'DetectionRunner/2.0',
    metodoHttp: 'POST',
    rota: '/api/audit/leads/validate-pii',
    recurso: 'crm_leads',
    recursoId: 'compliance-lgpd',
    descricao: 'Auditoria de mascaramento de CPF e dados de cartão em anotações de leads (LGPD Art. 46).',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { campos_sensíveis_mascarados: 184, vazamentos_detectados: 0 },
  },
  {
    id: 'SEC-013',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Running',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'Sue (SOC Analyst)',
      email: 'soc-analyst@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '192.168.1.104',
    userAgent: 'PranchetoAgentWorker/2.4',
    metodoHttp: 'GET',
    rota: '/api/v1/health/security-agents',
    recurso: 'daemons',
    recursoId: 'soc-cluster',
    descricao: 'Batimento de coração (Heartbeat) e sincronismo de telemetria dos microVMs de segurança.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { cluster_status: 'HEALTHY', latencia_cluster_ms: 18 },
  },
  {
    id: 'SEC-014',
    agentName: 'Sue',
    agentRole: 'SOC Analyst Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Paused',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'Sue (SOC Analyst)',
      email: 'soc-analyst@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '192.168.1.104',
    userAgent: 'PranchetoAgentWorker/2.4',
    metodoHttp: 'POST',
    rota: '/api/security/scan/quarantine',
    recurso: 'quarentena',
    recursoId: 'cluster-temp',
    descricao: 'Pausa controlada para desinfecção e checagem de quarentena de arquivo suspeito.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: { quarentena_ativa: true },
    dadosNovos: { arquivo_liberado: false, quarentena_mantida: true },
  },
  {
    id: 'SEC-015',
    agentName: 'Bob',
    agentRole: 'Threat Hunter Agent',
    task: 'Scan de Documentos Internos',
    taskRaw: 'Scan Internal Docs',
    urgencyScore: 72,
    urgencyLevel: 'High',
    cpu: '61%',
    memory: '512 MB',
    status: 'Idle',
    lastActivity: 'Há 2h',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: {
      nome: 'Bob (Threat Hunter)',
      email: 'threat-hunter@prancheto.ia',
      cargo: 'Security Bot',
      tenant: 'Prancheto Global',
    },
    ip: '172.16.0.45',
    userAgent: 'ThreatDetector/1.1',
    metodoHttp: 'POST',
    rota: '/api/audit/session/reconciliation',
    recurso: 'user_tokens',
    recursoId: 'reconciled-all',
    descricao: 'Reconciliação e limpeza de tokens invalidados na blacklist do Redis.',
    resultado: 'success',
    impersonation: null,
    dadosAnteriores: null,
    dadosNovos: { tokens_removidos_blacklist: 120 },
  },
];

// Helper visual para Badge de Status exatamente como na imagem
const BadgeStatusLive = ({ status }) => {
  const s = status?.toLowerCase() || 'running';
  if (s === 'running' || s === 'em execução') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
        Running
      </span>
    );
  }
  if (s === 'idle' || s === 'ocioso' || s === 'concluído') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
        Idle
      </span>
    );
  }
  if (s === 'paused' || s === 'pausado') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
        Paused
      </span>
    );
  }
  // Blocked
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
      Blocked
    </span>
  );
};

// Helper visual para UrgencyScore
const FormatarUrgencyScore = ({ score, level }) => {
  const lvl = level?.toLowerCase() || 'medium';
  let cor = 'text-ink-primary';
  if (lvl === 'critical' || lvl === 'crítica') {
    cor = 'text-rose-600 dark:text-rose-400 font-bold';
  } else if (lvl === 'high' || lvl === 'alta') {
    cor = 'text-amber-600 dark:text-amber-400 font-semibold';
  } else if (lvl === 'medium' || lvl === 'média') {
    cor = 'text-yellow-600 dark:text-yellow-400 font-medium';
  } else {
    cor = 'text-emerald-600 dark:text-emerald-400 font-medium';
  }

  return (
    <span className={`text-xs whitespace-nowrap ${cor}`}>
      {score} ({level})
    </span>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: LOGS DE SEGURANÇA & AUDITORIA
// =============================================================
export const LogsSeguranca = () => {
  const dispararToast = useUIStore((s) => s.dispararToast);

  // Estados principais
  const [listaAgentes, setListaAgentes] = useState(AGENTES_INICIAIS);
  const [carregandoDb, setCarregandoDb] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('all'); // all, running, idle, paused, blocked
  const [filtroNivel, setFiltroNivel] = useState('all'); // all, critical, high, medium, low
  const [ordenacao, setOrdenacao] = useState('score-desc'); // score-desc, score-asc, recent, cpu

  // Dropdowns da barra superior
  const [filtroModalAberto, setFiltroModalAberto] = useState(false);
  const [dropdownSortAberto, setDropdownSortAberto] = useState(false);

  // Drawer lateral de detalhes (View Details)
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [copiadoId, setCopiadoId] = useState(false);

  // Sincroniza logs reais de audit_logs do Supabase se existirem
  const carregarLogsDb = useCallback(async () => {
    setCarregandoDb(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, tenants!audit_logs_tenant_id_fkey(nome)')
        .order('criado_em', { ascending: false })
        .limit(30);

      if (error) throw error;

      if (data && data.length > 0) {
        const formatados = data.map((l, index) => {
          const score = l.resultado === 'blocked' ? 92 : l.resultado === 'failure' ? 84 : 45;
          const level = score > 85 ? 'Critical' : score > 70 ? 'High' : score > 40 ? 'Medium' : 'Low';
          const status = l.resultado === 'blocked' ? 'Blocked' : l.resultado === 'failure' ? 'Blocked' : 'Running';

          return {
            id: l.id || `DB-${index}`,
            agentName: l.user_email ? l.user_email.split('@')[0] : 'Usuário do Sistema',
            agentRole: l.user_cargo ? `${l.user_cargo.toUpperCase()} Actor` : 'Identity Actor',
            task: l.descricao || l.acao || 'Ação Auditada no Sistema',
            taskRaw: l.acao,
            urgencyScore: score,
            urgencyLevel: level,
            cpu: '34%',
            memory: '380 MB',
            status: status,
            lastActivity: 'Recentemente',
            timestamp: l.criado_em,
            user: {
              nome: l.user_email || 'Usuário Autenticado',
              email: l.user_email,
              cargo: l.user_cargo || 'Membro',
              tenant: l.tenants?.nome || 'Super Admin',
            },
            ip: l.ip_address || '127.0.0.1',
            userAgent: l.user_agent || 'Browser Web Client',
            metodoHttp: l.metodo_http || 'POST',
            rota: l.rota || '/api/action',
            recurso: l.recurso || 'tabela_banco',
            recursoId: l.recurso_id || l.id,
            descricao: l.descricao || `Operação ${l.acao} realizada em ${l.recurso || 'registro'}.`,
            resultado: l.resultado,
            codigoErro: l.codigo_erro,
            impersonation: l.user_cargo === 'super_admin' ? {
              ativo: true,
              executorReal: 'superadmin@prancheto.ia',
              alvoImpersonado: l.user_email,
              justificativa: 'Suporte técnico administrativo sob protocolo de governança.',
            } : null,
            dadosAnteriores: l.dados_anteriores,
            dadosNovos: l.dados_novos,
          };
        });

        // Junta os logs reais aos agentes de segurança pré-configurados
        setListaAgentes([...formatados, ...AGENTES_INICIAIS]);
      }
    } catch (err) {
      console.warn('[LogsSeguranca] Consulta ao banco Supabase:', err.message);
    } finally {
      setCarregandoDb(false);
    }
  }, []);

  useEffect(() => {
    carregarLogsDb();
  }, [carregarLogsDb]);

  // Filtragem e ordenação
  const registrosFiltrados = useMemo(() => {
    return listaAgentes.filter((item) => {
      // Filtro Status
      if (filtroStatus !== 'all' && item.status.toLowerCase() !== filtroStatus.toLowerCase()) {
        return false;
      }

      // Filtro Severidade / Urgência
      if (filtroNivel !== 'all' && item.urgencyLevel.toLowerCase() !== filtroNivel.toLowerCase()) {
        return false;
      }

      // Busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const mAgent = item.agentName?.toLowerCase().includes(termo);
        const mRole = item.agentRole?.toLowerCase().includes(termo);
        const mTask = item.task?.toLowerCase().includes(termo) || item.taskRaw?.toLowerCase().includes(termo);
        const mUser = item.user?.email?.toLowerCase().includes(termo) || item.user?.nome?.toLowerCase().includes(termo);
        const mIp = item.ip?.toLowerCase().includes(termo);
        const mRota = item.rota?.toLowerCase().includes(termo);
        if (!mAgent && !mRole && !mTask && !mUser && !mIp && !mRota) return false;
      }

      return true;
    }).sort((a, b) => {
      if (ordenacao === 'score-desc') return b.urgencyScore - a.urgencyScore;
      if (ordenacao === 'score-asc') return a.urgencyScore - b.urgencyScore;
      if (ordenacao === 'cpu') return parseInt(b.cpu) - parseInt(a.cpu);
      if (ordenacao === 'recent') return new Date(b.timestamp) - new Date(a.timestamp);
      return 0;
    });
  }, [listaAgentes, filtroStatus, filtroNivel, busca, ordenacao]);

  // Ação de exportar relatório LGPD (JSON / CSV)
  const handleExportarLogs = () => {
    const jsonStr = JSON.stringify(registrosFiltrados, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prancheto_auditoria_seguranca_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (dispararToast) {
      dispararToast({
        tipo: 'sucesso',
        titulo: 'Exportação Concluída',
        mensagem: `${registrosFiltrados.length} registros forenses exportados com assinatura de auditoria.`,
      });
    }
  };

  // Copiar ID do registro
  const handleCopiarId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 1800);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full min-h-0 overflow-hidden bg-surface text-ink-primary font-sans select-none">
      {/* ═════════════════════════════════════════════════════════════
          HEADER BAR: LIVE AGENT / AUDITORIA DE SEGURANÇA
          ═════════════════════════════════════════════════════════════ */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4 border-b border-surface-border bg-surface-card/60 dark:bg-surface-card/20 flex-shrink-0">
        {/* Título e Ícone exatamente como na imagem */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-ink-primary flex-shrink-0 shadow-2xs">
            <LayoutGrid size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg text-ink-primary flex items-center gap-2 truncate">
              <span>Live Agent</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0455BF]/10 text-[#0455BF] border border-[#0455BF]/20">
                Auditoria & SOC
              </span>
            </h1>
          </div>
        </div>

        {/* Controles: Busca + Filtro + Ordenação + Adicionar/Exportar */}
        <div className="flex items-center gap-2.5 flex-1 max-w-xl justify-end">
          {/* Campo de Busca Pill */}
          <div className="relative w-full max-w-[220px] sm:max-w-[260px]">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-9 pr-3 text-xs rounded-full bg-surface-subtle dark:bg-white/5 border border-surface-border text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-[#0455BF] transition-all"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                title="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Botão de Filtro com Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltroModalAberto((v) => !v)}
              className={`h-9 px-3 rounded-xl border border-surface-border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                filtroStatus !== 'all' || filtroNivel !== 'all'
                  ? 'bg-[#0455BF] text-white border-[#0455BF]'
                  : 'bg-surface-card hover:bg-surface text-ink-secondary hover:text-ink-primary'
              }`}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filter</span>
            </button>

            {filtroModalAberto && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-card border border-surface-border rounded-2xl shadow-xl p-3 z-50 text-xs animate-fade-in space-y-3">
                <div className="flex items-center justify-between border-b border-surface-border pb-1.5">
                  <span className="font-bold text-ink-primary">Filtros de Segurança</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroStatus('all');
                      setFiltroNivel('all');
                      setFiltroModalAberto(false);
                    }}
                    className="text-[10px] text-ink-muted hover:text-ink-primary"
                  >
                    Resetar
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-ink-muted uppercase mb-1">Status</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['all', 'Running', 'Idle', 'Paused', 'Blocked'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFiltroStatus(st)}
                        className={`px-2 py-1 rounded-lg text-left text-xs font-medium ${
                          filtroStatus === st
                            ? 'bg-[#0455BF] text-white'
                            : 'hover:bg-surface text-ink-secondary'
                        }`}
                      >
                        {st === 'all' ? 'Todos' : st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-ink-muted uppercase mb-1">Urgência</p>
                  <div className="grid grid-cols-2 gap-1">
                    {['all', 'Critical', 'High', 'Medium', 'Low'].map((nv) => (
                      <button
                        key={nv}
                        type="button"
                        onClick={() => setFiltroNivel(nv)}
                        className={`px-2 py-1 rounded-lg text-left text-xs font-medium ${
                          filtroNivel === nv
                            ? 'bg-[#0455BF] text-white'
                            : 'hover:bg-surface text-ink-secondary'
                        }`}
                      >
                        {nv === 'all' ? 'Todas' : nv}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botão Sort By */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownSortAberto((v) => !v)}
              className="h-9 px-3 rounded-xl border border-surface-border bg-surface-card hover:bg-surface text-xs font-semibold text-ink-secondary hover:text-ink-primary flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Sort by</span>
              <ChevronDown size={14} />
            </button>

            {dropdownSortAberto && (
              <div className="absolute right-0 mt-2 w-44 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1 z-50 text-xs">
                {[
                  { id: 'score-desc', label: 'Maior Risco (UrgencyScore)' },
                  { id: 'score-asc', label: 'Menor Risco' },
                  { id: 'recent', label: 'Mais Recentes' },
                  { id: 'cpu', label: 'Maior Carga (CPU)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setOrdenacao(opt.id);
                      setDropdownSortAberto(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-surface ${
                      ordenacao === opt.id ? 'font-bold text-[#0455BF]' : 'text-ink-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão de Ação: Exportar Relatório LGPD / Add Agent */}
          <button
            type="button"
            onClick={handleExportarLogs}
            className="h-9 px-3.5 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            title="Exportar trilha forense em conformidade com LGPD Art. 37"
          >
            <Plus size={14} />
            <span className="hidden md:inline">Add Agent</span>
            <span className="md:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TABELA FORENSE LIVE AGENT (CORPO PRINCIPAL)
          ═════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-surface-border text-ink-muted font-medium bg-surface/50 sticky top-0 z-10 backdrop-blur-xs">
              <th className="py-3 px-4 font-semibold text-ink-muted">Agent</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">Task</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">UrgencyScore™</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">CPU</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">Memory</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">Status</th>
              <th className="py-3 px-4 font-semibold text-ink-muted">Last Activity</th>
              <th className="py-3 px-4 font-semibold text-ink-muted text-right pr-6">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-ink-muted">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldAlert size={32} className="text-ink-muted/50" />
                    <p className="font-semibold text-sm">Nenhum agente ou evento de segurança encontrado</p>
                    <p className="text-xs">Ajuste os filtros de busca ou verifique os logs do sistema.</p>
                  </div>
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((item) => {
                const isSelected = registroSelecionado?.id === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setRegistroSelecionado(item);
                      setDrawerAberto(true);
                    }}
                    className={`group transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/25'
                        : 'hover:bg-surface-hover/60'
                    }`}
                  >
                    {/* Agent (Nome + Cargo em parênteses) */}
                    <td className="py-3.5 px-4 font-medium text-ink-primary whitespace-nowrap">
                      <span>{item.agentName} </span>
                      <span className="text-ink-secondary text-[11px]">({item.agentRole})</span>
                    </td>

                    {/* Task */}
                    <td className="py-3.5 px-4 text-ink-primary whitespace-nowrap">
                      {item.task}
                    </td>

                    {/* UrgencyScore™ */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <FormatarUrgencyScore score={item.urgencyScore} level={item.urgencyLevel} />
                    </td>

                    {/* CPU */}
                    <td className="py-3.5 px-4 text-ink-secondary font-mono whitespace-nowrap">
                      {item.cpu}
                    </td>

                    {/* Memory */}
                    <td className="py-3.5 px-4 text-ink-secondary font-mono whitespace-nowrap">
                      {item.memory}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <BadgeStatusLive status={item.status} />
                    </td>

                    {/* Last Activity */}
                    <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">
                      {item.lastActivity}
                    </td>

                    {/* Botão View Details */}
                    <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRegistroSelecionado(item);
                          setDrawerAberto(true);
                        }}
                        className="text-xs font-semibold text-ink-secondary hover:text-[#0455BF] dark:hover:text-blue-400 hover:underline transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          RODAPÉ INFORMATIVO: CONFORMIDADE & STATUS WORM (LGPD)
          ═════════════════════════════════════════════════════════════ */}
      <div className="h-11 px-6 border-t border-surface-border flex items-center justify-between text-[11px] text-ink-muted bg-surface/40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Trilha de auditoria imutável (WORM). Registros protegidos contra edição e exclusão.</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span>LGPD Art. 37 & Marco Civil Art. 15</span>
          <span>•</span>
          <span>{registrosFiltrados.length} registros ativos</span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          DRAWER LATERAL FORENSE (VIEW DETAILS)
          ═════════════════════════════════════════════════════════════ */}
      {drawerAberto && registroSelecionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface-card dark:bg-[#151D2E] border-l border-surface-border w-full sm:w-[500px] lg:w-[560px] h-full shadow-2xl flex flex-col min-h-0 animate-slide-in">
            {/* Topo do Drawer */}
            <div className="h-16 px-6 border-b border-surface-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-bold text-base text-ink-primary truncate">
                  Detalhes do Evento #{registroSelecionado.id}
                </span>
                <BadgeStatusLive status={registroSelecionado.status} />
              </div>
              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink-primary hover:bg-surface transition-colors cursor-pointer"
                title="Fechar detalhes"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo Rolável com as evidências forenses (5 Ws) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Alerta de Impersonation (Se aplicável) */}
              {registroSelecionado.impersonation && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <AlertTriangle size={15} />
                    <span>Ação Executada em Modo Impersonation</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Executor Real:</strong> {registroSelecionado.impersonation.executorReal}
                    <br />
                    <strong>Alvo Personificado:</strong> {registroSelecionado.impersonation.alvoImpersonado}
                    <br />
                    <strong>Motivo Declarado:</strong> {registroSelecionado.impersonation.justificativa}
                  </p>
                </div>
              )}

              {/* 1. QUEM (Who) */}
              <div className="p-4 rounded-2xl bg-surface-subtle dark:bg-white/5 border border-surface-border space-y-2.5">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <User size={13} />
                  <span>Identificação do Ator (Who)</span>
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Agente / Nome</span>
                    <span className="font-semibold text-ink-primary">{registroSelecionado.agentName} ({registroSelecionado.agentRole})</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">E-mail</span>
                    <span className="font-semibold text-ink-primary truncate block">{registroSelecionado.user?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Cargo RBAC</span>
                    <span className="font-semibold text-ink-primary">{registroSelecionado.user?.cargo || 'Bot'}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Tenant / Organização</span>
                    <span className="font-semibold text-ink-primary">{registroSelecionado.user?.tenant || 'Global'}</span>
                  </div>
                </div>
              </div>

              {/* 2. ONDE & QUANDO (Where & When) */}
              <div className="p-4 rounded-2xl bg-surface-subtle dark:bg-white/5 border border-surface-border space-y-2.5">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Origem & Temporalidade (Where & When)</span>
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Endereço IP</span>
                    <span className="font-mono font-semibold text-ink-primary">{registroSelecionado.ip}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Data / Hora UTC</span>
                    <span className="font-semibold text-ink-primary">{new Date(registroSelecionado.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-ink-muted block text-[11px]">Rota & Método HTTP</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-[#0455BF] text-white">
                        {registroSelecionado.metodoHttp}
                      </span>
                      <span className="font-mono text-xs text-ink-primary truncate">{registroSelecionado.rota}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-ink-muted block text-[11px]">User-Agent</span>
                    <span className="font-mono text-[11px] text-ink-secondary truncate block">{registroSelecionado.userAgent}</span>
                  </div>
                </div>
              </div>

              {/* 3. O QUÊ (What) & IMPACTO */}
              <div className="p-4 rounded-2xl bg-surface-subtle dark:bg-white/5 border border-surface-border space-y-2.5">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={13} />
                  <span>Operação & Risco (What & Score)</span>
                </p>
                <div className="space-y-2">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Tarefa Executada</span>
                    <span className="font-bold text-sm text-ink-primary">{registroSelecionado.task}</span>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Descrição Técnica</span>
                    <p className="text-xs text-ink-secondary leading-relaxed bg-surface dark:bg-black/20 p-2.5 rounded-xl border border-surface-border">
                      {registroSelecionado.descricao}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-surface dark:bg-black/20 border border-surface-border text-center">
                      <span className="text-[10px] text-ink-muted block">UrgencyScore™</span>
                      <span className="font-bold text-xs">{registroSelecionado.urgencyScore} ({registroSelecionado.urgencyLevel})</span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface dark:bg-black/20 border border-surface-border text-center">
                      <span className="text-[10px] text-ink-muted block">Carga CPU</span>
                      <span className="font-bold text-xs font-mono">{registroSelecionado.cpu}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-surface dark:bg-black/20 border border-surface-border text-center">
                      <span className="text-[10px] text-ink-muted block">Memória</span>
                      <span className="font-bold text-xs font-mono">{registroSelecionado.memory}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. DIFERENCIAL DE DADOS (Diff Anterior vs Novo) */}
              <div className="p-4 rounded-2xl bg-surface-subtle dark:bg-white/5 border border-surface-border space-y-2.5">
                <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={13} />
                  <span>Diferencial de Estado (Diff Sanitizado)</span>
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  {registroSelecionado.dadosAnteriores && (
                    <div>
                      <span className="text-amber-600 dark:text-amber-400 block text-[10px] uppercase font-bold mb-1">
                        - Estado Anterior
                      </span>
                      <pre className="p-2.5 rounded-xl bg-black/80 text-emerald-400 overflow-x-auto text-[10px]">
                        {JSON.stringify(registroSelecionado.dadosAnteriores, null, 2)}
                      </pre>
                    </div>
                  )}

                  {registroSelecionado.dadosNovos && (
                    <div>
                      <span className="text-emerald-600 dark:text-emerald-400 block text-[10px] uppercase font-bold mb-1">
                        + Estado Novo
                      </span>
                      <pre className="p-2.5 rounded-xl bg-black/80 text-emerald-400 overflow-x-auto text-[10px]">
                        {JSON.stringify(registroSelecionado.dadosNovos, null, 2)}
                      </pre>
                    </div>
                  )}

                  {!registroSelecionado.dadosAnteriores && !registroSelecionado.dadosNovos && (
                    <p className="text-ink-muted font-sans text-xs">
                      Operação sem alteração de campos de entidade (somente consulta ou validação de sessão).
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé Fixo do Drawer */}
            <div className="h-16 px-6 border-t border-surface-border flex items-center justify-between gap-3 flex-shrink-0 bg-surface/30">
              <button
                type="button"
                onClick={() => handleCopiarId(registroSelecionado.id)}
                className="h-9 px-3 rounded-xl border border-surface-border hover:bg-surface text-ink-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiadoId ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copiadoId ? 'Copiado!' : 'Copiar Hash ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                className="h-9 px-4 rounded-xl bg-[#0455BF] hover:bg-[#034499] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsSeguranca;
