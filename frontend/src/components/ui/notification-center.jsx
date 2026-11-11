import React, { useMemo, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE_BAR = {
  default: 'bg-brand-primary',
  info: 'bg-brand-secondary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  purple: 'bg-brand-purple',
};

export const NOTIFICACOES_INICIAIS = [
  {
    id: 'n1',
    source: 'CRM • Pipeline',
    emoji: '🔥',
    title: 'Lead qualificado em negociação',
    body: 'TechCorp Enterprise avançou para a etapa de Proposta Comercial com valor estimado de R$ 48.000,00.',
    time: 'há 2 min',
    unread: true,
    tone: 'purple',
  },
  {
    id: 'n2',
    source: 'Pranchetinho IA',
    emoji: '🤖',
    title: 'Triagem concluída automaticamente',
    body: 'Mariana Souza (FinTech Brasil) solicitou demonstração. Reunião pré-agendada para amanhã às 10h.',
    time: 'há 14 min',
    unread: true,
    tone: 'info',
  },
  {
    id: 'n3',
    source: 'Calendário',
    emoji: '🗓️',
    title: 'Próxima reunião em 30 minutos',
    body: 'Alinhamento Design System com Equipe de Produto & IA às 14:30.',
    time: 'há 30 min',
    unread: true,
    tone: 'default',
  },
  {
    id: 'n4',
    source: 'Tarefas',
    emoji: '⚠️',
    title: 'Prazo vencendo hoje',
    body: 'A tarefa "Revisar proposta comercial Q4" vence hoje às 18:00.',
    time: 'há 1h',
    unread: false,
    tone: 'warning',
  },
  {
    id: 'n5',
    source: 'Projetos',
    emoji: '🚀',
    title: 'Marco do projeto concluído',
    body: 'A entrega da Fase 1 do projeto Implantação Enterprise foi aprovada pelo cliente.',
    time: 'há 3h',
    unread: false,
    tone: 'success',
  },
];

/**
 * Central de Notificações empilhada (shadcn/ui) integrada ao Design System do Prancheto.IA.
 */
export function NotificationCenter({
  items = NOTIFICACOES_INICIAIS,
  onItemsChange,
  title = 'Notificações',
  defaultExpanded = true,
  showFooter = true,
  staggerMs = 50,
  className = '',
  onDismiss,
  onClearAll,
  onMarkAllRead,
}) {
  const [internalRows, setInternalRows] = useState(items);
  const rows = onItemsChange ? items : internalRows;
  const setRows = (updater) => {
    const next = typeof updater === 'function' ? updater(rows) : updater;
    if (onItemsChange) onItemsChange(next);
    else setInternalRows(next);
  };

  const [openIds, setOpenIds] = useState(new Set());

  const visible = useMemo(
    () => (defaultExpanded ? rows : rows.filter((n) => n.unread)),
    [rows, defaultExpanded]
  );

  const unreadCount = rows.filter((n) => n.unread).length;

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Marca como lida ao expandir
    setRows((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  const dismiss = (id) => {
    setRows((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  };

  const clearAll = () => {
    setRows([]);
    onClearAll?.();
  };

  const markAllRead = () => {
    setRows((prev) => prev.map((n) => ({ ...n, unread: false })));
    onMarkAllRead?.();
  };

  return (
    <section
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-surface-border bg-surface-card text-ink-primary shadow-2xl',
        className
      )}
      style={{ maxWidth: 400 }}
    >
      <style>{`
        @keyframes nstack-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nstack-row { animation: nstack-in 260ms ease-out both; }
      `}</style>

      <header className="flex items-center justify-between gap-2 border-b border-surface-border bg-surface-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-ink-primary">{title}</h2>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[11px] font-bold leading-none text-brand-accent">
              {unreadCount}
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-2.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-secondary transition-colors hover:text-brand-primary cursor-pointer"
              >
                Ler todas
              </button>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-ink-secondary transition-colors hover:text-red-600 cursor-pointer"
            >
              Limpar
            </button>
          </div>
        )}
      </header>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-ink-secondary">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent text-brand-primary">
            <Check className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-ink-primary mt-1">Tudo em dia por aqui!</p>
          <p className="text-[11px] text-ink-secondary">Você não possui notificações pendentes.</p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-border max-h-[380px] overflow-y-auto">
          {visible.map((n, i) => {
            const open = openIds.has(n.id);
            return (
              <li
                key={n.id}
                className={cn(
                  'nstack-row group relative flex cursor-pointer gap-3 px-4 py-3 pl-5 transition-colors hover:bg-surface-subtle',
                  n.unread ? 'bg-brand-accent/20' : 'bg-surface-card'
                )}
                style={{ animationDelay: `${i * staggerMs}ms` }}
                onClick={() => toggleOpen(n.id)}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute inset-y-0 left-0 w-1',
                    TONE_BAR[n.tone ?? 'default'] || TONE_BAR.default
                  )}
                />
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-surface-border bg-surface-subtle text-base text-brand-primary shadow-2xs">
                  {n.emoji ?? <Bell className="h-4 w-4 text-brand-secondary" />}
                </span>
                <div className="min-w-0 flex-1">
                  {n.source && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-secondary">
                      {n.source}
                    </p>
                  )}
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'min-w-0 truncate text-xs sm:text-sm',
                        n.unread ? 'font-bold text-ink-primary' : 'font-semibold text-ink-primary'
                      )}
                    >
                      {n.title}
                    </p>
                    <time className="shrink-0 text-[11px] text-ink-muted">{n.time}</time>
                  </div>
                  <p
                    className={cn(
                      'pt-0.5 text-xs text-ink-secondary leading-relaxed',
                      open ? '' : 'line-clamp-1'
                    )}
                  >
                    {n.body}
                  </p>
                </div>
                <span className="flex shrink-0 flex-col items-center justify-between py-0.5">
                  {n.unread ? (
                    <span
                      className="h-2 w-2 rounded-full bg-brand-purple"
                      aria-label="Não lida"
                    />
                  ) : (
                    <span className="h-2 w-2" />
                  )}
                  <button
                    type="button"
                    aria-label={`Dispensar ${n.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(n.id);
                    }}
                    className="ml-1 rounded-md p-1 text-ink-secondary opacity-0 transition-opacity hover:bg-brand-accent hover:text-brand-primary focus-visible:opacity-100 group-hover:opacity-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {showFooter && (
        <footer className="border-t border-surface-border bg-surface-subtle px-4 py-2.5 text-[11px] font-medium text-ink-secondary flex items-center justify-between">
          <span>
            {rows.length === 0
              ? 'Nenhuma notificação pendente'
              : `${rows.length} ${rows.length === 1 ? 'notificação' : 'notificações'} · clique para expandir`}
          </span>
        </footer>
      )}
    </section>
  );
}

export default NotificationCenter;
