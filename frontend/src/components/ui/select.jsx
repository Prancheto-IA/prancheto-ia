import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-surface-border bg-surface-subtle px-3.5 py-2 text-xs sm:text-sm font-medium text-ink-primary shadow-2xs transition-all',
      ' hover:border-surface-border-strong focus:outline-none focus:border-brand-primary focus:bg-surface-card focus:ring-2 focus:ring-brand-accent/60',
      'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-ink-secondary opacity-80 flex-shrink-0 transition-transform duration-200" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-ink-secondary', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1 text-ink-secondary', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-[100] max-h-80 min-w-[8rem] overflow-hidden rounded-xl border border-surface-border bg-surface-card text-ink-primary shadow-xl',
        'data-[state=open]:animate-fade-in',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1.5',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2.5 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-secondary', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-xs sm:text-sm font-medium text-ink-primary outline-none transition-colors',
      'focus:bg-brand-accent focus:text-brand-primary data-[highlighted]:bg-brand-accent data-[highlighted]:text-brand-primary',
      'data-[state=checked]:font-semibold data-[state=checked]:text-brand-primary',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
      className
    )}
    {...props}
  >
    <span className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-brand-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-surface-border', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// -------------------------------------------------------------
// SelectField: Componente de alto nível baseado no Radix Select
// Aceita elementos <option> filhos e a mesma API (value/onChange)
// para substituir qualquer <select> nativo mantendo o shadcn/ui.
// -------------------------------------------------------------
const EMPTY_SENTINEL = '__SHADCN_EMPTY__';

function extrairOpcoes(children, lista = []) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      extrairOpcoes(child.props.children, lista);
    } else if (child.type === 'option') {
      const rawVal = child.props.value !== undefined ? String(child.props.value) : String(child.props.children ?? '');
      lista.push({
        value: rawVal,
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      });
    } else if (child.props?.children) {
      extrairOpcoes(child.props.children, lista);
    }
  });
  return lista;
}

const SelectField = React.forwardRef(
  ({ value, defaultValue, onChange, onValueChange, children, placeholder, className, disabled, id, name, ...props }, ref) => {
    const opcoes = extrairOpcoes(children);

    // Se houver uma opção vazia e desabilitada, usa como placeholder
    const opcaoPlaceholder = opcoes.find((o) => o.value === '' && o.disabled);
    const textoPlaceholder = placeholder || (opcaoPlaceholder ? opcaoPlaceholder.label : 'Selecione...');

    const opcoesRenderizaveis = opcoes.filter((o) => !(o.value === '' && o.disabled));

    const toRadixVal = (v) => {
      if (v === undefined || v === null) return undefined;
      const str = String(v);
      if (str === '') {
        // Verifica se existe uma opção selecionável com value=""
        const temOpcaoVazia = opcoesRenderizaveis.some((o) => o.value === '');
        return temOpcaoVazia ? EMPTY_SENTINEL : '';
      }
      return str;
    };

    const handleValueChange = (novoValorRadix) => {
      const valorReal = novoValorRadix === EMPTY_SENTINEL ? '' : novoValorRadix;
      if (onValueChange) onValueChange(valorReal);
      if (onChange) {
        onChange({
          target: { value: valorReal, name, id },
          currentTarget: { value: valorReal, name, id },
        });
      }
    };

    const radixValue = value !== undefined ? toRadixVal(value) : undefined;
    const radixDefaultValue = defaultValue !== undefined ? toRadixVal(defaultValue) : undefined;

    return (
      <Select
        value={radixValue}
        defaultValue={radixDefaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        name={name}
      >
        <SelectTrigger ref={ref} id={id} className={className} {...props}>
          <SelectValue placeholder={textoPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {opcoesRenderizaveis.map((opt, idx) => {
            const itemVal = opt.value === '' ? EMPTY_SENTINEL : opt.value;
            return (
              <SelectItem key={`${itemVal}-${idx}`} value={itemVal} disabled={opt.disabled}>
                {opt.label}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }
);
SelectField.displayName = 'SelectField';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectField,
};
export default SelectField;

