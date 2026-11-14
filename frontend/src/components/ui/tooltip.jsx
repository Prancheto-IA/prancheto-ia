import * as React from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = ({ delay = 100, closeDelay = 0, ...props }) => (
  <TooltipPrimitive.Provider delay={delay} closeDelay={closeDelay} {...props} />
);

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = React.forwardRef(({ asChild, render, children, ...props }, ref) => {
  const finalRender = render || (asChild && React.isValidElement(children) ? children : undefined);
  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      render={finalRender}
      {...props}
    >
      {finalRender ? undefined : children}
    </TooltipPrimitive.Trigger>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

const TooltipContent = React.forwardRef(
  (
    {
      className,
      side = 'inline-end',
      align = 'center',
      sideOffset = 10,
      children,
      ...props
    },
    ref
  ) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[100]"
      >
        <TooltipPrimitive.Popup
          ref={ref}
          className={cn(
            'z-50 select-none rounded-xl border border-surface-border bg-surface-card dark:bg-[#32105F] dark:border-[#8B5CF6]/50 px-3 py-1.5 text-xs font-semibold text-ink-primary dark:text-white shadow-xl dark:shadow-[0_8px_24px_rgba(0,0,0,0.55)]',
            'transition-all duration-150',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
            'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className
          )}
          {...props}
        >
          {children}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = 'TooltipContent';

const TooltipArrow = TooltipPrimitive.Arrow;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow };

