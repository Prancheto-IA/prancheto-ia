// =============================================================
// REUI DESIGN SYSTEM - TOOLTIP COMPONENT
// Base UI Primitive com classes Emitly e suporte a SimpleTooltip
// =============================================================

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
      side = 'top',
      align = 'center',
      sideOffset = 6,
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

/**
 * Componente utilitário de Tooltip estilo ReUI (acessível e de fácil aplicação).
 * Envolve qualquer elemento diretamente com o Tooltip do Base UI / ReUI.
 */
const SimpleTooltip = ({
  content,
  children,
  side = 'top',
  align = 'center',
  sideOffset = 6,
  disabled = false,
  className,
  ...props
}) => {
  if (disabled || !content) return children;
  return (
    <Tooltip {...props}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} align={align} sideOffset={sideOffset} className={className}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
};
SimpleTooltip.displayName = 'SimpleTooltip';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow, SimpleTooltip };
