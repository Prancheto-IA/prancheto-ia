import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-surface-border bg-surface-card px-3.5 py-2.5 text-sm text-ink-primary shadow-2xs transition-all placeholder:text-ink-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };

