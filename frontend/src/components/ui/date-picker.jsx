import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

/**
 * Converte string 'YYYY-MM-DD' para Date local sem deslocamento de fuso.
 */
function parseDateLocal(valor) {
  if (!valor) return undefined;
  if (valor instanceof Date) return isValid(valor) ? valor : undefined;
  const str = String(valor).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (match) {
    const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return isValid(d) ? d : undefined;
  }
  const parsed = parseISO(str);
  return isValid(parsed) ? parsed : undefined;
}

/**
 * DatePicker do shadcn/ui adaptado ao Design System do projeto.
 * Aceita `value` ('YYYY-MM-DD') e `onChange` (evento sintético `{ target: { value } }`)
 * funcionando como substituto direto de `<input type="date" />`.
 */
const DatePicker = React.forwardRef(
  (
    {
      value,
      onChange,
      onValueChange,
      placeholder = 'Selecionar data',
      className,
      disabled = false,
      clearable = true,
      id,
      name,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const selectedDate = React.useMemo(() => parseDateLocal(value), [value]);

    const emitirMudanca = (novaString) => {
      if (onValueChange) onValueChange(novaString);
      if (onChange) {
        onChange({
          target: { value: novaString, id, name },
          currentTarget: { value: novaString, id, name },
        });
      }
    };

    const handleSelect = (day) => {
      if (!day) {
        emitirMudanca('');
      } else {
        const formatada = format(day, 'yyyy-MM-dd');
        emitirMudanca(formatada);
      }
      setOpen(false);
    };

    const limpar = (e) => {
      e.stopPropagation();
      emitirMudanca('');
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            id={id}
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-subtle px-3.5 py-2 text-left text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer',
              'hover:border-surface-border-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card focus:ring-2 focus:ring-brand-accent/60',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selectedDate ? 'text-ink-primary' : 'text-ink-muted',
              className
            )}
            {...props}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-brand-secondary flex-shrink-0" />
              <span className="truncate">
                {selectedDate
                  ? format(selectedDate, "dd 'de' MMM, yyyy", { locale: ptBR })
                  : placeholder}
              </span>
            </span>
            {clearable && selectedDate && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={limpar}
                title="Limpar data"
                className="rounded-md p-0.5 text-ink-secondary hover:bg-brand-accent hover:text-brand-primary transition-colors flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
export default DatePicker;

