import * as React from 'react';
import { cn } from '@/lib/utils';

export const extrairIniciais = (nome) => {
  if (!nome || typeof nome !== 'string') return '—';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '—';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
};

const Avatar = React.forwardRef(({ className, src, alt, fallback, children, ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  // Modo direto por props (src / fallback)
  if (src || fallback !== undefined) {
    const textoIniciais = typeof fallback === 'string' && fallback.length > 2
      ? extrairIniciais(fallback)
      : fallback || (alt ? extrairIniciais(alt) : '—');

    return (
      <span
        ref={ref}
        data-slot="avatar"
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border select-none font-bold uppercase tracking-wider',
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          <img
            src={src}
            alt={alt || ''}
            onError={() => setHasError(true)}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-secondary/15 text-brand-secondary">
            {textoIniciais}
          </span>
        )}
      </span>
    );
  }

  // Modo composto com children (<AvatarImage>, <AvatarFallback>)
  return (
    <span
      ref={ref}
      data-slot="avatar"
      className={cn(
        'relative inline-flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-surface-border',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className, src, alt = '', ...props }, ref) => {
  const [hasError, setHasError] = React.useState(false);

  if (!src || hasError) return null;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn('aspect-square h-full w-full object-cover', className)}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-brand-secondary/15 text-brand-secondary text-xs font-bold uppercase',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
