import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-semibold transition-colors focus:outline-none select-none shrink-0',
  {
    variants: {
      variant: {
        default:
          'border-surface-border bg-surface-subtle text-ink-secondary dark:bg-surface-hover/70 dark:text-ink-secondary',
        primary:
          'border-brand-secondary/30 bg-brand-secondary/10 text-brand-secondary dark:border-brand-secondary/35 dark:bg-brand-secondary/15 dark:text-[#7DD3FC]',
        secondary:
          'border-surface-border bg-surface-muted/70 text-ink-primary dark:bg-surface-muted/60',
        success:
          'border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-300',
        warning:
          'border-amber-500/30 bg-amber-500/12 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300',
        destructive:
          'border-red-500/30 bg-red-500/12 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300',
        violet:
          'border-brand-purple/30 bg-brand-purple/12 text-brand-purple dark:border-brand-violet/35 dark:bg-brand-purple/20 dark:text-brand-violet',
        info:
          'border-sky-500/30 bg-sky-500/12 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-300',
        outline:
          'border-surface-border-strong bg-transparent text-ink-primary',
      },
      appearance: {
        light: '',
        solid: '',
        outline: 'bg-transparent',
      },
      size: {
        xs: 'h-5 px-2 text-[10px] leading-none',
        sm: 'h-6 px-2.5 text-[11px] leading-none',
        md: 'h-7 px-3 text-xs leading-none',
        lg: 'h-8 px-3.5 text-sm leading-none',
      },
    },
    compoundVariants: [
      {
        variant: 'primary',
        appearance: 'solid',
        className: 'border-transparent bg-brand-secondary text-white dark:text-white',
      },
      {
        variant: 'success',
        appearance: 'solid',
        className: 'border-transparent bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white',
      },
      {
        variant: 'warning',
        appearance: 'solid',
        className: 'border-transparent bg-amber-500 text-white dark:text-white',
      },
      {
        variant: 'destructive',
        appearance: 'solid',
        className: 'border-transparent bg-red-600 text-white dark:text-white',
      },
      {
        variant: 'violet',
        appearance: 'solid',
        className: 'border-transparent bg-brand-purple text-white dark:text-white',
      },
    ],
    defaultVariants: {
      variant: 'default',
      appearance: 'light',
      size: 'sm',
    },
  }
);

const Badge = React.forwardRef(
  ({ className, variant, appearance, size, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="badge"
      className={cn(badgeVariants({ variant, appearance, size }), className)}
      {...props}
    >
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

const dotVariantClasses = {
  default: 'bg-ink-muted',
  primary: 'bg-brand-secondary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-red-500',
  violet: 'bg-brand-purple',
  info: 'bg-sky-500',
};

const BadgeDot = ({ className, variant = 'default', pulse = false }) => (
  <span className="relative inline-flex h-2 w-2 shrink-0">
    {pulse && (
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
          dotVariantClasses[variant] || dotVariantClasses.default
        )}
      />
    )}
    <span
      className={cn(
        'relative inline-flex h-2 w-2 rounded-full',
        dotVariantClasses[variant] || dotVariantClasses.default,
        className
      )}
    />
  </span>
);

export { Badge, BadgeDot, badgeVariants };

