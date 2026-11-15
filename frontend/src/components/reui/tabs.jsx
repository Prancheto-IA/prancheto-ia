import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const TabsContext = React.createContext({ variant: 'default', size: 'md' });

const Tabs = ({ className, variant = 'default', size = 'md', ...props }) => (
  <TabsContext.Provider value={{ variant, size }}>
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  </TabsContext.Provider>
);

const tabsListVariants = cva('relative inline-flex items-center', {
  variants: {
    variant: {
      default:
        'rounded-2xl border border-surface-border bg-surface-subtle p-1 text-ink-secondary shadow-2xs',
      line:
        'border-b border-surface-border bg-transparent gap-1 text-ink-secondary',
    },
    size: {
      sm: 'gap-0.5',
      md: 'gap-1',
      lg: 'gap-1.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const tabsIndicatorVariants = cva(
  'pointer-events-none absolute left-0 transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        default:
          'top-[var(--active-tab-top)] h-[var(--active-tab-height)] w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-xl bg-surface-card dark:bg-[#1E2B48] border border-surface-border/70 shadow-sm z-0',
        line:
          'bottom-0 h-0.5 w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)] rounded-full bg-brand-secondary dark:bg-brand-violet z-10',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const TabsList = React.forwardRef(
  ({ className, variant: variantProp, size: sizeProp, children, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const variant = variantProp || ctx.variant;
    const size = sizeProp || ctx.size;

    return (
      <TabsPrimitive.List
        ref={ref}
        data-slot="tabs-list"
        className={cn(tabsListVariants({ variant, size }), className)}
        {...props}
      >
        <TabsPrimitive.Indicator className={cn(tabsIndicatorVariants({ variant }))} />
        {children}
      </TabsPrimitive.List>
    );
  }
);
TabsList.displayName = 'TabsList';

const tabsTriggerVariants = cva(
  'relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-secondary/40 disabled:pointer-events-none disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'rounded-xl text-ink-secondary hover:text-ink-primary data-[active]:text-ink-primary dark:data-[active]:text-white',
        line:
          'rounded-t-xl pb-2.5 pt-2 px-3 text-ink-secondary hover:text-ink-primary data-[active]:text-brand-secondary dark:data-[active]:text-[#7DD3FC]',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-3.5 py-2 text-sm',
        lg: 'px-4 py-2.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const TabsTrigger = React.forwardRef(
  ({ className, variant: variantProp, size: sizeProp, ...props }, ref) => {
    const ctx = React.useContext(TabsContext);
    const variant = variantProp || ctx.variant;
    const size = sizeProp || ctx.size;

    return (
      <TabsPrimitive.Tab
        ref={ref}
        data-slot="tabs-trigger"
        className={cn(tabsTriggerVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    data-slot="tabs-content"
    className={cn('outline-none', className)}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };

