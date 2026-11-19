import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

/**
 * Componente unificado de ícones utilizando Hugeicons Core Free Icons.
 * Proporciona renderização consistente, acessível e estilizada conforme o Design System.
 */
export const Icon = ({
  icon,
  size = 18,
  strokeWidth = 1.8,
  color = 'currentColor',
  className = '',
  ...props
}) => {
  if (!icon) return null;

  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={`inline-block flex-shrink-0 ${className}`}
      {...props}
    />
  );
};

export default Icon;
