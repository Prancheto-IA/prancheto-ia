import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-3',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-bold capitalize text-ink-primary',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-surface-subtle hover:bg-brand-accent hover:text-brand-primary border border-surface-border rounded-lg p-0 flex items-center justify-center text-ink-secondary transition-colors cursor-pointer'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-ink-secondary rounded-md w-8 font-semibold text-[11px] uppercase',
        row: 'flex w-full mt-1',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-brand-accent/60 rounded-lg'
        ),
        day: cn(
          'h-8 w-8 p-0 font-medium rounded-lg text-ink-primary hover:bg-brand-accent hover:text-brand-primary transition-colors flex items-center justify-center cursor-pointer aria-selected:opacity-100'
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-brand-primary text-white hover:bg-brand-primary-hover hover:text-white focus:bg-brand-primary focus:text-white font-bold shadow-2xs',
        day_today: 'bg-brand-accent text-brand-primary font-bold',
        day_outside:
          'day-outside text-ink-muted opacity-50 aria-selected:bg-brand-accent/40 aria-selected:text-ink-secondary',
        day_disabled: 'text-ink-muted opacity-40 cursor-not-allowed',
        day_range_middle: 'aria-selected:bg-brand-accent aria-selected:text-brand-primary',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

