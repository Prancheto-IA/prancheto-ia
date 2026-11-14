import React from 'react';
import { ColorPicker } from './color-picker.jsx';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field.jsx';
import { cn } from '@/lib/utils';

/**
 * ReUI C-Color-Picker-2:
 * Outline trigger in a labelled field that opens the full popover color picker.
 */
export const CColorPicker2 = ({
  id,
  label,
  value,
  defaultValue,
  onChange,
  onValueChange,
  description,
  disabled = false,
  swatches,
  className,
}) => {
  const inputId = id || (label ? `picker-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const labelId = inputId ? `${inputId}-label` : undefined;
  const descId = description && inputId ? `${inputId}-desc` : undefined;

  return (
    <div className={cn('w-full', className)}>
      <Field>
        {label && (
          <FieldLabel id={labelId} htmlFor={inputId}>
            {label}
          </FieldLabel>
        )}
        <ColorPicker
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onValueChange={onValueChange}
          disabled={disabled}
          swatches={swatches}
          aria-labelledby={labelId}
          aria-describedby={descId}
        />
        {description && (
          <FieldDescription id={descId}>
            {description}
          </FieldDescription>
        )}
      </Field>
    </div>
  );
};

export default CColorPicker2;

