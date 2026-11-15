// =============================================================
// PRANCHETO.IA - HISTÓRICO E TRACE DE EXECUÇÕES DE AUTOMAÇÃO
// =============================================================
import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  Clock01Icon,
  ArrowRight01Icon,
  ArrowDown01Icon,
  WhatsappIcon,
  CodeIcon,
} from '@hugeicons/core-free-icons';
import { Badge, BadgeDot } from '@/components/reui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { funilInfo, tempoRelativo, formatarDataHora } from '../../hooks/useCRM.js';

const getIniciais = (nome = '') => {
  const partes = String(nome).trim().split(/\s+/);
  if (!partes[0]) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const LogsExecucao = ({ logs }) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [logExpandidoId, setLogExpandidoId] = useState(logs[0]?.id || null);

  const logsFiltrados = logs.filter((item) => {
    if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      item.leadNome?.toLowerCase().includes(q) ||
      item.leadEmpresa?.toLowerCase().includes(q) ||
      item.workflowNome?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-card p-3.5">
        <div className="relative flex-1 max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por lead, empresa ou fluxo..."
            className="h-9 w-full rounded-xl border border-surface-border bg-surface-subtle pl-9 pr-3 text-xs font-medium text-ink-primary placeholder:text-ink-muted outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="concluido">🟢 Concluídos</SelectItem>
                <SelectItem value="erro">🔴 Com falha</SelectItem>
                <SelectItem value="aguardando">🟡 Aguardando delay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" size="md">
            {logsFiltrados.length} execuções
          </Badge>
        </div>
      </div>

      {/* Lista de Execuções */}
      {logsFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-border bg-surface-card p-10 text-center space-y-2">
          <p className="text-sm font-bold text-ink-primary">Nenhuma execução encontrada</p>
          <p className="text-xs text-ink-secondary">
            Ajuste os filtros ou clique em &quot;Executar Teste&quot; no Construtor Visual para gerar um log ao vivo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logsFiltrados.map((item) => {
            const aberto = logExpandidoId === item.id;
            const statusVariant =
              item.status === 'concluido'
                ? 'success'
                : item.status === 'erro'
                ? 'destructive'
                : 'warning';
            const statusLabel =
              item.status === 'concluido'
                ? 'Concluído'
                : item.status === 'erro'
                ? 'Erro'
                : 'Aguardando';

            const orig = funilInfo(item.etapaOrigem);
            const dest = funilInfo(item.etapaDestino);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-surface-border bg-surface-card shadow-2xs overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setLogExpandidoId(aberto ? null : item.id)}
                  className="w-full p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-left hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0 border border-surface-border">
                      <AvatarFallback className="bg-brand-secondary/15 text-brand-secondary dark:text-[#7DD3FC] text-xs font-bold">
                        {getIniciais(item.leadNome)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink-primary truncate">
                          {item.leadNome}
                        </span>
                        <span className="text-xs text-ink-muted truncate">
                          · {item.leadEmpresa}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-ink-secondary truncate mt-0.5">
                        Fluxo: <strong className="text-ink-primary">{item.workflowNome}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <div className="inline-flex items-center gap-1.5 rounded-xl border border-surface-border bg-surface-subtle px-2.5 py-1 text-[11px] font-semibold text-ink-primary">
                      <span>{orig.emoji} {orig.label}</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-ink-muted" />
                      <span className="text-brand-secondary dark:text-[#7DD3FC]">
                        {dest.emoji} {dest.label}
                      </span>
                    </div>

                    <Badge variant={statusVariant} size="sm">
                      <BadgeDot variant={statusVariant} />
                      {statusLabel}
                    </Badge>

                    <span className="text-[11px] font-mono text-ink-muted">
                      {item.duracaoMs}ms · {tempoRelativo(item.criadoEm)}
                    </span>

                    <HugeiconsIcon
                      icon={ArrowDown01Icon}
                      size={16}
                      className={`text-ink-secondary transition-transform duration-200 ${
                        aberto ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {aberto && (
                  <div className="border-t border-surface-border bg-surface-subtle/40 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Trace Passo a Passo dos Nós */}
                    <div className="lg:col-span-7 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                        <HugeiconsIcon icon={CodeIcon} size={13} />
                        Trace Passo a Passo ({formatarDataHora(item.criadoEm)})
                      </p>
                      <div className="space-y-2">
                        {(item.passos || []).map((passo, idx) => (
                          <div
                            key={`${item.id}-${passo.id}-${idx}`}
                            className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface-card px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                  passo.status === 'erro'
                                    ? 'bg-red-500/15 text-red-500'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                <HugeiconsIcon
                                  icon={passo.status === 'erro' ? Alert02Icon : CheckmarkCircle02Icon}
                                  size={14}
                                />
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-ink-primary truncate">
                                  {idx + 1}. {passo.titulo}
                                </p>
                                <p className="text-[11px] text-ink-secondary truncate">
                                  {passo.detalhe}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono text-[11px] text-ink-muted shrink-0">
                              {passo.tempoMs}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview da Mensagem Disparada */}
                    <div className="lg:col-span-5 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
                        <HugeiconsIcon icon={WhatsappIcon} size={13} className="text-emerald-500" />
                        Mensagem WhatsApp ({item.conexaoNome})
                      </p>
                      <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                          <span>Para: {item.leadTelefone || 'Sem telefone'}</span>
                          <span className="inline-flex items-center gap-1">
                            <HugeiconsIcon icon={Clock01Icon} size={11} />
                            {tempoRelativo(item.criadoEm)}
                          </span>
                        </div>
                        <div className="rounded-xl bg-[#DCF8C6] dark:bg-[#005C4B] p-3 text-xs text-slate-900 dark:text-emerald-50 whitespace-pre-wrap leading-relaxed shadow-2xs">
                          {item.mensagemEnviada}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LogsExecucao;

