import * as React from 'react';
import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import { cva } from 'class-variance-authority';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

const inputVariants = cva(
  'outline-none flex w-full text-ink-primary placeholder:text-slate-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 border border-surface-border focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/10 rounded-xl bg-surface-subtle focus-visible:bg-surface-card text-sm font-medium transition-all shadow-2xs',
  {
    variants: {
      size: {
        sm: 'h-8 px-3 pr-14',
        default: 'h-10 px-3.5 pr-14',
        lg: 'h-11 px-4 pr-16',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

const Autocomplete = AutocompletePrimitive.Root;

function AutocompleteValue({ ...props }) {
  return <AutocompletePrimitive.Value data-slot="autocomplete-value" {...props} />;
}

function AutocompleteInput({
  className,
  size = 'default',
  showClear = false,
  showTrigger = false,
  ...props
}) {
  return (
    <div className="relative w-full">
      <AutocompletePrimitive.Input
        data-slot="autocomplete-input"
        data-size={size}
        className={cn(inputVariants({ size }), className)}
        {...props}
      />
      {showTrigger && <AutocompleteTrigger />}
      {showClear && <AutocompleteClear />}
    </div>
  );
}

function AutocompleteStatus({ className, ...props }) {
  return (
    <AutocompletePrimitive.Status
      data-slot="autocomplete-status"
      className={cn(
        'text-ink-secondary px-3 py-2 text-sm font-medium border-b border-surface-border bg-surface-subtle/60 empty:hidden',
        className
      )}
      {...props}
    />
  );
}

function AutocompletePortal({ ...props }) {
  return <AutocompletePrimitive.Portal data-slot="autocomplete-portal" {...props} />;
}

function AutocompleteBackdrop({ ...props }) {
  return <AutocompletePrimitive.Backdrop data-slot="autocomplete-backdrop" {...props} />;
}

function AutocompletePositioner({ className, ...props }) {
  return (
    <AutocompletePrimitive.Positioner
      data-slot="autocomplete-positioner"
      className={cn('z-[100] outline-none', className)}
      {...props}
    />
  );
}

function AutocompleteList({ className, ...props }) {
  return (
    <div className="max-h-56 overflow-y-auto overscroll-contain custom-scrollbar">
      <AutocompletePrimitive.List
        data-slot="autocomplete-list"
        className={cn('p-1.5 space-y-0.5 empty:p-0', className)}
        {...props}
      />
    </div>
  );
}

function AutocompleteCollection({ ...props }) {
  return <AutocompletePrimitive.Collection data-slot="autocomplete-collection" {...props} />;
}

function AutocompleteRow({ className, ...props }) {
  return (
    <AutocompletePrimitive.Row
      data-slot="autocomplete-row"
      className={cn('flex items-center gap-2', className)}
      {...props}
    />
  );
}

function AutocompleteItem({ className, ...props }) {
  return (
    <AutocompletePrimitive.Item
      data-slot="autocomplete-item"
      className={cn(
        'text-ink-primary rounded-xl px-2.5 py-2 text-sm relative flex cursor-pointer items-center gap-2.5 outline-none transition-colors select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-brand-accent data-[highlighted]:text-brand-primary hover:bg-surface-subtle',
        className
      )}
      {...props}
    />
  );
}

function AutocompleteContent({
  className,
  children,
  showBackdrop = false,
  align = 'start',
  sideOffset = 6,
  alignOffset = 0,
  side = 'bottom',
  anchor,
  ...props
}) {
  return (
    <AutocompletePortal>
      {showBackdrop && <AutocompleteBackdrop />}
      <AutocompletePositioner
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        side={side}
        anchor={anchor}
      >
        <div className="relative flex max-h-full">
          <AutocompletePrimitive.Popup
            data-slot="autocomplete-popup"
            style={{ width: 'var(--anchor-width)' }}
            className={cn(
              'bg-surface-card text-ink-primary rounded-xl border border-surface-border shadow-xl flex max-h-80 min-w-[260px] flex-col overflow-hidden transition-all',
              className
            )}
            {...props}
          >
            {children}
          </AutocompletePrimitive.Popup>
        </div>
      </AutocompletePositioner>
    </AutocompletePortal>
  );
}

function AutocompleteGroup({ ...props }) {
  return <AutocompletePrimitive.Group data-slot="autocomplete-group" {...props} />;
}

function AutocompleteGroupLabel({ className, ...props }) {
  return (
    <AutocompletePrimitive.GroupLabel
      data-slot="autocomplete-group-label"
      className={cn('text-ink-secondary px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider', className)}
      {...props}
    />
  );
}

function AutocompleteEmpty({ className, ...props }) {
  return (
    <AutocompletePrimitive.Empty
      data-slot="autocomplete-empty"
      className={cn('text-ink-secondary px-3 py-3 text-sm text-center empty:hidden', className)}
      {...props}
    />
  );
}

function AutocompleteClear({ className, ...props }) {
  return (
    <AutocompletePrimitive.Clear
      data-slot="autocomplete-clear"
      className={cn(
        'absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-ink-muted opacity-75 transition-colors hover:bg-surface-hover hover:text-rose-500 hover:opacity-100 focus:outline-none disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2} />
    </AutocompletePrimitive.Clear>
  );
}

function AutocompleteTrigger({ className, ...props }) {
  return (
    <AutocompletePrimitive.Trigger
      data-slot="autocomplete-trigger"
      className={cn(
        'absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-ink-muted transition-colors hover:text-ink-primary focus:outline-none disabled:pointer-events-none',
        className
      )}
      {...props}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={1.8} />
    </AutocompletePrimitive.Trigger>
  );
}

function AutocompleteArrow({ ...props }) {
  return <AutocompletePrimitive.Arrow data-slot="autocomplete-arrow" {...props} />;
}

function AutocompleteSeparator({ className, ...props }) {
  return (
    <AutocompletePrimitive.Separator
      data-slot="autocomplete-separator"
      className={cn('bg-surface-border my-1 h-px', className)}
      {...props}
    />
  );
}

export {
  Autocomplete,
  AutocompleteValue,
  AutocompleteTrigger,
  AutocompleteInput,
  AutocompleteStatus,
  AutocompletePortal,
  AutocompleteBackdrop,
  AutocompletePositioner,
  AutocompleteContent,
  AutocompleteList,
  AutocompleteCollection,
  AutocompleteRow,
  AutocompleteItem,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteEmpty,
  AutocompleteClear,
  AutocompleteArrow,
  AutocompleteSeparator,
};
