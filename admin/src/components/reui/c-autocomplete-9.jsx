import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompleteStatus,
} from '@/components/reui/autocomplete';
import { Autocomplete as AutocompletePrimitive } from '@base-ui/react/autocomplete';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon, Add01Icon } from '@hugeicons/core-free-icons';

function extrairIniciaisTexto(nome = '') {
  const limpo = String(nome || '').trim();
  if (!limpo) return '?';
  const partes = limpo.split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Componente ReUI c-autocomplete-9 adaptado ao Design System do Prancheto.IA.
 * Suporta busca com filtro sensível à base, status de carregamento, Avatar com iniciais
 * e ação opcional no rodapé (ex: "+ Adicionar um contato" / "+ Adicione uma empresa").
 */
export function AutocompleteReUI9({
  items = [],
  value = '',
  onValueChange,
  onSelectItem,
  placeholder = 'Pesquisar...',
  entitySingular = 'registro',
  entityPlural = 'registros',
  addLabel,
  onAddClick,
  avatarClassName = '',
}) {
  const [searchValue, setSearchValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(items);
  const [error, setError] = useState(null);

  const { contains } = AutocompletePrimitive.useFilter({ sensitivity: 'base' });

  // Mantém sincronizado quando o valor externo mudar (ex: reset do modal ou edição)
  useEffect(() => {
    setSearchValue(value || '');
  }, [value]);

  useEffect(() => {
    const query = (searchValue || '').trim();

    if (!query) {
      setSearchResults(items);
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    setIsLoading(true);
    setError(null);

    let ignore = false;

    const timeoutId = setTimeout(() => {
      try {
        const filtrados = items.filter((item) => {
          const matchName = contains(item.name || '', query);
          const matchSub = item.subtitle ? contains(item.subtitle, query) : false;
          const matchKeywords = Array.isArray(item.keywords)
            ? item.keywords.some((k) => contains(String(k), query))
            : false;
          return matchName || matchSub || matchKeywords;
        });
        if (!ignore) {
          setSearchResults(filtrados);
        }
      } catch {
        if (!ignore) {
          setError(`Erro ao buscar ${entityPlural}.`);
          setSearchResults([]);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 160);

    return () => {
      clearTimeout(timeoutId);
      ignore = true;
    };
  }, [searchValue, items, contains, entityPlural]);

  let status = null;

  if (isLoading) {
    status = (
      <div className="flex items-center gap-2 text-brand-secondary">
        <HugeiconsIcon
          icon={Loading03Icon}
          size={14}
          strokeWidth={2}
          className="animate-spin shrink-0"
          aria-hidden="true"
        />
        <span>Buscando {entityPlural}...</span>
      </div>
    );
  } else if (error) {
    status = <span className="text-rose-500">{error}</span>;
  } else if (searchResults.length === 0 && searchValue.trim()) {
    status = `Nenhum ${entitySingular} encontrado para "${searchValue}"`;
  } else if (searchResults.length > 0 && searchValue.trim()) {
    status = `${searchResults.length} ${
      searchResults.length === 1 ? `${entitySingular} encontrado` : `${entityPlural} encontrados`
    }`;
  } else {
    status = `${items.length} ${
      items.length === 1 ? `${entitySingular} disponível` : `${entityPlural} disponíveis`
    } · digite para filtrar`;
  }

  const handleValueChange = (nextVal) => {
    if (typeof nextVal === 'string') {
      setSearchValue(nextVal);
      onValueChange?.(nextVal);
      const exactMatch = items.find(
        (it) => (it.name || '').toLowerCase() === nextVal.trim().toLowerCase()
      );
      if (exactMatch) {
        onSelectItem?.(exactMatch);
      }
    } else if (nextVal && typeof nextVal === 'object') {
      const nomeItem = nextVal.name || '';
      setSearchValue(nomeItem);
      onValueChange?.(nomeItem);
      onSelectItem?.(nextVal);
    }
  };

  return (
    <div className="w-full">
      <Autocomplete
        items={searchResults}
        value={searchValue}
        onValueChange={handleValueChange}
        itemToStringValue={(item) => (typeof item === 'string' ? item : item?.name || '')}
        filter={null}
      >
        <AutocompleteInput
          placeholder={placeholder}
          showTrigger
          showClear={Boolean(searchValue)}
        />
        <AutocompleteContent>
          <AutocompleteStatus>{status}</AutocompleteStatus>
          <AutocompleteList>
            {(item) => (
              <AutocompleteItem
                key={item.id || item.name}
                value={item}
                onClick={() => {
                  setSearchValue(item.name);
                  onValueChange?.(item.name);
                  onSelectItem?.(item);
                }}
                className="rounded-xl"
              >
                <div className="flex items-center gap-2.5 truncate w-full">
                  <Avatar className={`h-8 w-8 ${avatarClassName}`}>
                    {item.avatar && <AvatarImage src={item.avatar} alt={item.name} />}
                    <AvatarFallback className={avatarClassName}>
                      {extrairIniciaisTexto(item.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-sm text-ink-primary">
                      {item.name}
                    </div>
                    {item.subtitle && (
                      <div className="text-ink-secondary truncate text-[11px]">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  {value && value.toLowerCase() === (item.name || '').toLowerCase() && (
                    <span className="text-brand-primary font-bold text-sm ml-auto shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              </AutocompleteItem>
            )}
          </AutocompleteList>

          {addLabel && onAddClick && (
            <div className="p-1.5 border-t border-surface-border bg-surface-card">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddClick(searchValue);
                }}
                className="w-full py-2 px-3 text-center text-sm font-semibold text-brand-primary hover:bg-surface-subtle rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} />
                <span>{addLabel}</span>
              </button>
            </div>
          )}
        </AutocompleteContent>
      </Autocomplete>
    </div>
  );
}

export { AutocompleteReUI9 as Pattern };
export default AutocompleteReUI9;

