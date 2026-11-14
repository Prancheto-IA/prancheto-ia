import React from 'react';
import { cn } from '@/lib/utils';

export const Field = ({ className, children, ...props }) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {children}
    </div>
  );
};

export const FieldLabel = ({ className, children, htmlFor, id, ...props }) => {
  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className={cn(
        'text-[11px] font-semibold text-ink-secondary uppercase tracking-wider block',
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
};

export const FieldDescription = ({ className, children, id, ...props }) => {
  return (
    <p
      id={id}
      className={cn('text-[11px] text-ink-secondary leading-tight mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  );
};

export default Field;

