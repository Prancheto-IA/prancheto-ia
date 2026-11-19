import * as React from 'react';
import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const switchRootVariants = cva(
  'group relative inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card disabled:cursor-not-allowed disabled:opacity-50 bg-slate-300 dark:bg-[#27365B]',
  {
    variants: {
      size: {
        sm: 'h-5 w-9 p-0.5',
        md: 'h-6 w-11 p-0.5',
        lg: 'h-7 w-[52px] p-1',
      },
      variant: {
        default: 'data-[checked]:bg-brand-secondary dark:data-[checked]:bg-brand-secondary',
        success: 'data-[checked]:bg-emerald-500 dark:data-[checked]:bg-emerald-500',
        violet: 'data-[checked]:bg-brand-purple dark:data-[checked]:bg-brand-purple',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

const switchThumbVariants = cva(
  'pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-out',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 translate-x-0 data-[checked]:translate-x-4',
        md: 'h-5 w-5 translate-x-0 data-[checked]:translate-x-5',
        lg: 'h-5 w-5 translate-x-0 data-[checked]:translate-x-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const Switch = React.forwardRef(
  ({ className, thumbClassName, size = 'md', variant = 'default', ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      data-slot="switch"
      className={cn(switchRootVariants({ size, variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }), thumbClassName)}
      />
    </SwitchPrimitive.Root>
  )
);
Switch.displayName = 'Switch';

export { Switch };

