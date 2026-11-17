'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Grid3x3,
  List,
  Search,
  Filter,
  X,
  Briefcase,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

// Cores mapeadas automaticamente por tipo de evento
export const CATEGORY_COLORS = {
  'Reunião': { name: 'Azul', value: 'blue', bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-600', badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  'Tarefa': { name: 'Verde', value: 'green', bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-600', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  'Lembrete': { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-500', badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' },
  'Pessoal': { name: 'Roxo', value: 'purple', bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-600', badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
};

export const getCategoryColor = (category) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['Reunião'];
};

export const defaultColors = Object.values(CATEGORY_COLORS);
export const defaultCategories = ['Reunião', 'Tarefa', 'Lembrete', 'Pessoal'];
export const defaultAvailableTags = ['Importante', 'Urgente', 'Trabalho', 'Pessoal', 'Equipe', 'Cliente'];

export function EventManager({
  events: initialEvents = [],
  deals = [],
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  categories = defaultCategories,
  colors = defaultColors,
  defaultView = 'month',
  className,
  availableTags = defaultAvailableTags,
}) {
  const [events, setEvents] = useState(initialEvents);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState(defaultView);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    color: getCategoryColor(categories[0]).value,
    category: categories[0],
    deal: '',
    startTime: null,
    endTime: null,
  });

  // Atualiza eventos caso a prop initialEvents mude externamente
  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Filtro de busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          event.title?.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query) ||
          event.category?.toLowerCase().includes(query) ||
          event.deal?.toLowerCase().includes(query) ||
          event.tags?.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Filtro de cor
      if (selectedColors.length > 0 && !selectedColors.includes(event.color)) {
        return false;
      }

      // Filtro de tags
      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags?.some((tag) => selectedTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Filtro de categoria
      if (selectedCategories.length > 0 && event.category && !selectedCategories.includes(event.category)) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, selectedColors, selectedTags, selectedCategories]);

  const totalFiltrosAtivos = selectedColors.length + selectedTags.length + selectedCategories.length;
  const hasActiveFilters = totalFiltrosAtivos > 0 || Boolean(searchQuery);

  const clearFilters = () => {
    setSelectedColors([]);
    setSelectedTags([]);
    setSelectedCategories([]);
    setSearchQuery('');
  };

  const handleOpenCreateDialog = (dataBase) => {
    const inicio = dataBase ? new Date(dataBase) : new Date();
    if (!dataBase) {
      inicio.setHours(9, 0, 0, 0);
    }
    const fim = new Date(inicio);
    fim.setHours(inicio.getHours() + 1);

    const catPadrao = categories[0] || 'Reunião';
    setNewEvent({
      title: '',
      description: '',
      color: getCategoryColor(catPadrao).value,
      category: catPadrao,
      deal: '',
      startTime: inicio,
      endTime: fim,
    });
    setIsCreating(true);
    setSelectedEvent(null);
    setIsDialogOpen(true);
  };

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;

    const cat = newEvent.category || categories[0];
    const catColor = getCategoryColor(cat).value;

    const event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime),
      color: catColor,
      category: cat,
      deal: newEvent.deal || '',
      attendees: newEvent.attendees,
      tags: [],
    };

    setEvents((prev) => [...prev, event]);
    onEventCreate?.(event);
    setIsDialogOpen(false);
    setIsCreating(false);
    setNewEvent({
      title: '',
      description: '',
      color: catColor,
      category: cat,
      deal: '',
      startTime: null,
      endTime: null,
    });
  }, [newEvent, categories, onEventCreate]);

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return;

    const cat = selectedEvent.category || categories[0];
    const catColor = getCategoryColor(cat).value;

    const eventoAtualizado = {
      ...selectedEvent,
      color: catColor,
      startTime: new Date(selectedEvent.startTime),
      endTime: new Date(selectedEvent.endTime),
    };

    setEvents((prev) => prev.map((e) => (e.id === eventoAtualizado.id ? eventoAtualizado : e)));
    onEventUpdate?.(eventoAtualizado.id, eventoAtualizado);
    setIsDialogOpen(false);
    setSelectedEvent(null);
  }, [selectedEvent, categories, onEventUpdate]);

  const handleDeleteEvent = useCallback(
    (id) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      onEventDelete?.(id);
      setIsDialogOpen(false);
      setSelectedEvent(null);
    },
    [onEventDelete]
  );

  const handleDragStart = useCallback((event) => {
    setDraggedEvent(event);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedEvent(null);
  }, []);

  const handleDrop = useCallback(
    (date, hour) => {
      if (!draggedEvent) return;

      const duracao = draggedEvent.endTime.getTime() - draggedEvent.startTime.getTime();
      const newStartTime = new Date(date);
      if (hour !== undefined) {
        newStartTime.setHours(hour, draggedEvent.startTime.getMinutes(), 0, 0);
      } else {
        newStartTime.setHours(
          draggedEvent.startTime.getHours(),
          draggedEvent.startTime.getMinutes(),
          0,
          0
        );
      }
      const newEndTime = new Date(newStartTime.getTime() + duracao);

      const updatedEvent = {
        ...draggedEvent,
        startTime: newStartTime,
        endTime: newEndTime,
      };

      setEvents((prev) => prev.map((e) => (e.id === draggedEvent.id ? updatedEvent : e)));
      onEventUpdate?.(draggedEvent.id, updatedEvent);
      setDraggedEvent(null);
    },
    [draggedEvent, onEventUpdate]
  );

  const navigateDate = useCallback(
    (direction) => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);
        if (view === 'month') {
          newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
        } else if (view === 'week') {
          // Pula 1 dia de cada vez na visualização semanal
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
        } else if (view === 'day') {
          newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
        }
        return newDate;
      });
    },
    [view]
  );

  const getColorClasses = useCallback(
    (colorValue) => {
      const color = colors.find((c) => c.value === colorValue);
      return color || colors[0];
    },
    [colors]
  );

  const toggleTag = (tag, criando) => {
    if (criando) {
      setNewEvent((prev) => ({
        ...prev,
        tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
      }));
    } else {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              tags: prev.tags?.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...(prev.tags || []), tag],
            }
          : null
      );
    }
  };

  const formatarDataIsoInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    const hora = String(d.getHours()).padStart(2, '0');
    const minuto = String(d.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  };

  // Formatação do título do período atual em português correto (ex: "Novembro de 2026" com "de" minúsculo)
  const formatarTituloPeriodo = () => {
    if (view === 'month') {
      const mesAno = currentDate.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      });
      // "novembro de 2026" -> "Novembro de 2026"
      return mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
    }
    if (view === 'week') {
      const dataInicio = currentDate.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
      });
      return `Semana de ${dataInicio}`;
    }
    if (view === 'day') {
      const diaCompleto = currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return diaCompleto.charAt(0).toUpperCase() + diaCompleto.slice(1);
    }
    if (view === 'list') {
      return 'Compromissos';
    }
    return '';
  };

  return (
    <div className={cn('flex flex-col gap-2.5 font-sans text-ink-primary h-full min-h-0 overflow-hidden', className)}>
      {/* Header Unificado com Título, Navegação, Busca, Filtros, Visualizações e Novo Evento */}
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between bg-surface-card border border-surface-border px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-2xl shadow-2xs flex-shrink-0">
        {/* Lado Esquerdo: Navegação de Data */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-ink-primary tracking-tight whitespace-nowrap">
            {formatarTituloPeriodo()}
          </h2>
          {view !== 'list' && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('prev')}
                className="h-8 w-8 rounded-xl border-surface-border hover:bg-surface-hover"
                title="Período anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="h-8 px-2.5 rounded-xl border-surface-border hover:bg-surface-hover text-xs font-bold"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate('next')}
                className="h-8 w-8 rounded-xl border-surface-border hover:bg-surface-hover"
                title="Próximo período"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Centro: Barra de Pesquisa e Botão Único de Filtros */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-0 lg:mx-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <Input
              placeholder="Pesquisar compromissos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs rounded-xl border-surface-border bg-surface-ground/50 focus:bg-surface-card"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-1/2 h-6 w-6 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Botão Único de Filtros com Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-8 gap-1.5 rounded-xl border-surface-border bg-surface-card hover:bg-surface-hover flex-shrink-0 text-xs font-bold transition-all',
                  hasActiveFilters && 'border-brand-primary text-brand-primary bg-brand-primary/5'
                )}
              >
                <Filter className="h-3.5 w-3.5 text-ink-secondary" />
                <span className="hidden sm:inline">Filtros</span>
                {totalFiltrosAtivos > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[10px] bg-brand-primary text-white rounded-full font-bold ml-0.5"
                  >
                    {totalFiltrosAtivos}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-bold text-ink-primary">Filtros</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[11px] text-brand-primary hover:underline font-semibold cursor-pointer"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />

              {/* Submenu Categorias */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <span>Categorias</span>
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-1 h-4 px-1 text-[10px]">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuLabel className="text-xs">Filtrar por Categoria</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={(checked) => {
                        setSelectedCategories((prev) =>
                          checked ? [...prev, category] : prev.filter((c) => c !== category)
                        );
                      }}
                      className="text-xs"
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu Cores */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <span>Cores</span>
                  {selectedColors.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-1 h-4 px-1 text-[10px]">
                      {selectedColors.length}
                    </Badge>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuLabel className="text-xs">Filtrar por Cor</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {colors.map((color) => (
                    <DropdownMenuCheckboxItem
                      key={color.value}
                      checked={selectedColors.includes(color.value)}
                      onCheckedChange={(checked) => {
                        setSelectedColors((prev) =>
                          checked ? [...prev, color.value] : prev.filter((c) => c !== color.value)
                        );
                      }}
                      className="text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2.5 w-2.5 rounded-full', color.bg)} />
                        <span>{color.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Submenu Tags */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <span>Tags</span>
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-auto mr-1 h-4 px-1 text-[10px]">
                      {selectedTags.length}
                    </Badge>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  <DropdownMenuLabel className="text-xs">Filtrar por Tag</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        setSelectedTags((prev) =>
                          checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                        );
                      }}
                      className="text-xs"
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={clearFilters}
                    className="text-xs text-brand-primary focus:text-brand-primary focus:bg-brand-primary/10 cursor-pointer font-medium"
                  >
                    <X className="mr-2 h-3.5 w-3.5" />
                    Limpar todos os filtros ({totalFiltrosAtivos})
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lado Direito: Modos de Visualização e Botão Novo Evento */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden w-28">
            <Select value={view} onValueChange={(value) => setView(value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="list">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-surface-border bg-surface-subtle p-0.5">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-7 px-2.5 text-xs rounded-lg"
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>Mês</span>
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-7 px-2.5 text-xs rounded-lg"
            >
              <Grid3x3 className="h-3.5 w-3.5 mr-1" />
              <span>Semana</span>
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-7 px-2.5 text-xs rounded-lg"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Dia</span>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-7 px-2.5 text-xs rounded-lg"
            >
              <List className="h-3.5 w-3.5 mr-1" />
              <span>Lista</span>
            </Button>
          </div>

          <Button
            onClick={() => handleOpenCreateDialog()}
            className="h-8 px-3 rounded-xl text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Visualizações do Calendário Dentro de Container Flexível sem Scroll Externo */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={(event) => {
              setSelectedEvent(event);
              setIsCreating(false);
              setIsDialogOpen(true);
            }}
            onEventDelete={handleDeleteEvent}
            onDayClick={(diaData) => handleOpenCreateDialog(diaData)}
            onViewMore={(dia) => {
              setCurrentDate(new Date(dia));
              setView('week');
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            getColorClasses={getColorClasses}
          />
        )}

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={(event) => {
              setSelectedEvent(event);
              setIsCreating(false);
              setIsDialogOpen(true);
            }}
            onEventDelete={handleDeleteEvent}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            getColorClasses={getColorClasses}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            onEventEdit={(event) => {
              setSelectedEvent(event);
              setIsCreating(false);
              setIsDialogOpen(true);
            }}
            onEventDelete={handleDeleteEvent}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            getColorClasses={getColorClasses}
          />
        )}

        {view === 'list' && (
          <ListView
            events={filteredEvents}
            onEventEdit={(event) => {
              setSelectedEvent(event);
              setIsCreating(false);
              setIsDialogOpen(true);
            }}
            onEventDelete={handleDeleteEvent}
            getColorClasses={getColorClasses}
          />
        )}
      </div>

      {/* Dialog de Criação / Edição do Evento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Novo Compromisso' : 'Editar Compromisso'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Preencha os detalhes para agendar na sua agenda.'
                : 'Visualize ou atualize as informações deste compromisso.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título do compromisso *</Label>
              <Input
                id="title"
                value={isCreating ? newEvent.title : selectedEvent?.title || ''}
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                    : setSelectedEvent((prev) => (prev ? { ...prev, title: e.target.value } : null))
                }
                placeholder="Ex: Reunião de Alinhamento com Cliente"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={isCreating ? newEvent.description : selectedEvent?.description || ''}
                onChange={(e) =>
                  isCreating
                    ? setNewEvent((prev) => ({ ...prev, description: e.target.value }))
                    : setSelectedEvent((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                placeholder="Adicione tópicos, pauta ou detalhes adicionais..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Início *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={
                    isCreating
                      ? formatarDataIsoInput(newEvent.startTime)
                      : formatarDataIsoInput(selectedEvent?.startTime)
                  }
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, startTime: date }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, startTime: date } : null));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime">Término *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={
                    isCreating
                      ? formatarDataIsoInput(newEvent.endTime)
                      : formatarDataIsoInput(selectedEvent?.endTime)
                  }
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, endTime: date }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, endTime: date } : null));
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="category">Tipo de evento</Label>
                <Select
                  value={isCreating ? newEvent.category : selectedEvent?.category || categories[0]}
                  onValueChange={(value) => {
                    const catColor = getCategoryColor(value).value;
                    if (isCreating) {
                      setNewEvent((prev) => ({ ...prev, category: value, color: catColor }));
                    } else {
                      setSelectedEvent((prev) => (prev ? { ...prev, category: value, color: catColor } : null));
                    }
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const cColor = getCategoryColor(cat);
                      return (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <div className={cn('h-2.5 w-2.5 rounded-full', cColor.bg)} />
                            <span>{cat}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="deal">Atribuir negócio (CRM)</Label>
                <Select
                  value={isCreating ? (newEvent.deal || 'nenhum') : (selectedEvent?.deal || 'nenhum')}
                  onValueChange={(val) => {
                    const dealNome = val === 'nenhum' ? '' : val;
                    if (isCreating) {
                      setNewEvent((prev) => ({ ...prev, deal: dealNome }));
                    } else {
                      setSelectedEvent((prev) => (prev ? { ...prev, deal: dealNome } : null));
                    }
                  }}
                >
                  <SelectTrigger id="deal">
                    <SelectValue placeholder="Vincular a negócio..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">
                      <span className="text-ink-muted">Nenhum negócio atribuído</span>
                    </SelectItem>
                    {deals.map((d) => {
                      const nome = typeof d === 'string' ? d : (d.nome || d.negocio_nome || d.title);
                      const empresa = typeof d === 'object' ? d.empresa : null;
                      return (
                        <SelectItem key={d.id || nome} value={nome}>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-brand-primary flex-shrink-0" />
                            <span className="truncate">{nome}</span>
                            {empresa && <span className="text-[11px] text-ink-muted">({empresa})</span>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            {!isCreating && (
              <Button
                variant="destructive"
                onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
                className="sm:mr-auto rounded-xl"
              >
                Excluir
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setIsCreating(false);
                setSelectedEvent(null);
              }}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={isCreating ? handleCreateEvent : handleUpdateEvent}
              className="rounded-xl font-bold"
            >
              {isCreating ? 'Criar Evento' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Popover com detalhes do evento e botões para editar ou apagar
function EventDetailPopover({
  event,
  getColorClasses,
  onEdit,
  onDelete,
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const colorClasses = getColorClasses(event.color);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const diff = Math.max(0, end - start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full block cursor-pointer outline-none text-left"
        >
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        sideOffset={6}
        collisionPadding={16}
        className="w-76 sm:w-80 p-0 rounded-2xl border border-surface-border bg-surface-card shadow-2xl z-[150] overflow-hidden text-ink-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com indicador de cor e tipo de evento */}
        <div className={cn('px-3.5 py-2.5 flex items-center justify-between text-white', colorClasses.bg)}>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-black/25 px-2 py-0.5 rounded-full">
              {event.category || 'Compromisso'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-black/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Fechar detalhes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Informações detalhadas do evento */}
        <div className="p-3.5 space-y-2.5">
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-ink-primary leading-tight">
              {event.title}
            </h4>
            {event.description && (
              <p className="mt-1 text-xs text-ink-secondary leading-relaxed line-clamp-3">
                {event.description}
              </p>
            )}
          </div>

          {/* Horário */}
          <div className="flex items-start gap-2 text-xs text-ink-secondary bg-surface-subtle/70 p-2 rounded-xl border border-surface-border/60">
            <Clock className="h-3.5 w-3.5 text-ink-muted flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-ink-primary text-xs">
                {(() => {
                  const dataFormatada = new Date(event.startTime).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  });
                  return dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
                })()}
              </div>
              <div className="text-[11px] text-ink-muted">
                {formatTime(event.startTime)} às {formatTime(event.endTime)} ({getDuration()})
              </div>
            </div>
          </div>

          {/* Negócio Vinculado */}
          {event.deal && (
            <div className="flex items-center gap-2 text-xs bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1.5 rounded-xl text-brand-primary">
              <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium text-ink-muted text-[11px] mr-1">Negócio:</span>
                <span className="font-bold truncate">{event.deal}</span>
              </div>
            </div>
          )}

          {/* Participantes */}
          {event.attendees && event.attendees.length > 0 && (
            <div className="text-[11px] text-ink-muted truncate">
              <span className="font-semibold text-ink-secondary">Participantes:</span>{' '}
              {event.attendees.join(', ')}
            </div>
          )}
        </div>

        {/* Rodapé com Botões de Apagar e Editar */}
        <div className="px-3.5 py-2.5 bg-surface-subtle/50 border-t border-surface-border flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
              onDelete?.(event.id);
            }}
            className="h-7 px-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl gap-1 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Apagar</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setIsOpen(false);
              onEdit?.(event);
            }}
            className="h-7 px-3 text-xs font-bold rounded-xl gap-1 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            <span>Editar</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Card do Evento com Drag & Drop e Popover de Detalhes ao Clicar
function EventCard({
  event,
  onEventEdit,
  onEventDelete,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = 'default',
}) {
  const colorClasses = getColorClasses(event.color);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = () => {
    const start = new Date(event.startTime).getTime();
    const end = new Date(event.endTime).getTime();
    const diff = Math.max(0, end - start);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  let triggerElement = null;

  if (variant === 'compact') {
    triggerElement = (
      <div
        data-event-card="true"
        draggable
        onDragStart={() => onDragStart?.(event)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="relative cursor-pointer select-none"
      >
        <div
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-200',
            colorClasses.bg,
            'text-white truncate shadow-2xs leading-tight hover:scale-[1.02] hover:brightness-105'
          )}
        >
          {event.title}
        </div>
      </div>
    );
  } else if (variant === 'detailed') {
    triggerElement = (
      <div
        data-event-card="true"
        draggable
        onDragStart={() => onDragStart?.(event)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cn(
          'cursor-pointer rounded-xl p-2.5 sm:p-3 transition-all duration-200 select-none hover:scale-[1.01] hover:shadow-lg',
          colorClasses.bg,
          'text-white shadow-xs'
        )}
      >
        <div className="font-bold text-xs sm:text-sm">{event.title}</div>
        {event.description && (
          <div className="mt-1 text-xs opacity-90 line-clamp-2">{event.description}</div>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] opacity-85">
          <Clock className="h-3 w-3" />
          <span>
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
          <span className="text-[10px]">({getDuration()})</span>
        </div>
        {(event.deal || event.category) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.category && (
              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-transparent">
                {event.category}
              </Badge>
            )}
            {event.deal && (
              <Badge variant="outline" className="text-[10px] text-white border-white/30 flex items-center gap-1">
                <Briefcase className="h-2.5 w-2.5" />
                <span>{event.deal}</span>
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  } else {
    triggerElement = (
      <div
        data-event-card="true"
        draggable
        onDragStart={() => onDragStart?.(event)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="relative select-none"
      >
        <div
          className={cn(
            'cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition-all duration-200 hover:scale-105',
            colorClasses.bg,
            'text-white shadow-2xs'
          )}
        >
          <div className="truncate">{event.title}</div>
        </div>
      </div>
    );
  }

  return (
    <EventDetailPopover
      event={event}
      getColorClasses={getColorClasses}
      onEdit={onEventEdit}
      onDelete={onEventDelete}
    >
      {triggerElement}
    </EventDetailPopover>
  );
}

// Visão Mensal (7 colunas x 6 semanas = 42 dias)
function MonthView({
  currentDate,
  events,
  onEventEdit,
  onEventDelete,
  onDayClick,
  onViewMore,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}) {
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const days = [];
  const currentDay = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const getEventsForDay = (date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const diasSemana = [
    { curto: 'Dom', completo: 'Domingo' },
    { curto: 'Seg', completo: 'Segunda-feira' },
    { curto: 'Ter', completo: 'Terça-feira' },
    { curto: 'Qua', completo: 'Quarta-feira' },
    { curto: 'Qui', completo: 'Quinta-feira' },
    { curto: 'Sex', completo: 'Sexta-feira' },
    { curto: 'Sáb', completo: 'Sábado' },
  ];

  return (
    <Card className="flex-1 min-h-0 flex flex-col overflow-hidden border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="grid grid-cols-7 border-b border-surface-border bg-surface-subtle flex-shrink-0">
        {diasSemana.map((day) => (
          <div
            key={day.curto}
            className="border-r border-surface-border py-1.5 sm:py-2 text-center text-xs font-bold text-ink-secondary last:border-r-0"
          >
            <span className="hidden sm:inline">{day.completo}</span>
            <span className="sm:hidden">{day.curto}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0 divide-y divide-surface-border">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              onClick={(e) => {
                // Impede abertura do modal de criação se o clique veio de um evento ou botão
                if (e.target.closest('[data-event-card]') || e.target.closest('button')) {
                  return;
                }
                onDayClick?.(day);
              }}
              className={cn(
                'border-r border-surface-border p-1 sm:p-1.5 transition-colors last:border-r-0 cursor-pointer flex flex-col justify-start overflow-hidden min-h-0',
                !isCurrentMonth && 'bg-surface-subtle/50 opacity-45',
                'hover:bg-surface-hover/70'
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div className="flex items-center justify-between mb-0.5 flex-shrink-0">
                <div
                  className={cn(
                    'flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isToday
                      ? 'bg-brand-primary text-white shadow-xs'
                      : isCurrentMonth
                      ? 'text-ink-primary'
                      : 'text-ink-muted'
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
              <div
                className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {dayEvents.slice(0, 2).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventEdit={onEventEdit}
                    onEventDelete={onEventDelete}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {dayEvents.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewMore?.(day);
                    }}
                    className="text-[10px] font-bold text-ink-secondary hover:text-brand-primary hover:underline px-0.5 truncate cursor-pointer transition-colors text-left"
                    title="Ver compromissos na visão semanal"
                  >
                    +{dayEvents.length - 2} mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Visão Semanal (Horas do dia x 7 dias da semana a partir do dia selecionado)
function WeekView({
  currentDate,
  events,
  onEventEdit,
  onEventDelete,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}) {
  // Janela deslizante de 7 dias a partir de currentDate
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() + i);
    return day;
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForDayAndHour = (date, hour) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <Card className="flex-1 min-h-0 overflow-auto border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="grid grid-cols-8 border-b border-surface-border sticky top-0 bg-surface-subtle z-20">
        <div className="border-r border-surface-border p-2 text-center text-xs font-bold text-ink-secondary">
          Hora
        </div>
        {weekDays.map((day) => {
          const eHoje = day.toDateString() === new Date().toDateString();
          return (
            <div
              key={day.toISOString()}
              className="border-r border-surface-border p-2 text-center text-xs font-bold last:border-r-0"
            >
              <div className="text-ink-secondary capitalize">
                {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
              </div>
              <div
                className={cn(
                  'text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded-full font-extrabold',
                  eHoje ? 'bg-brand-primary text-white' : 'text-ink-primary'
                )}
              >
                {day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-8">
        {hours.map((hour) => (
          <React.Fragment key={`hour-row-${hour}`}>
            <div
              className="border-b border-r border-surface-border p-1 text-[11px] font-medium text-ink-muted text-center bg-surface-subtle/30"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayAndHour(day, hour);
              return (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="min-h-12 sm:min-h-14 border-b border-r border-surface-border p-1 transition-colors hover:bg-surface-hover/50 last:border-r-0"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(day, hour)}
                >
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        onEventEdit={onEventEdit}
                        onEventDelete={onEventDelete}
                        onDragStart={onDragStart}
                        onDragEnd={onDragEnd}
                        getColorClasses={getColorClasses}
                        variant="default"
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
}

// Visão Diária (Hora a hora para o dia selecionado)
function DayView({
  currentDate,
  events,
  onEventEdit,
  onEventDelete,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getEventsForHour = (hour) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      const eventHour = eventDate.getHours();
      return (
        eventDate.getDate() === currentDate.getDate() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventHour === hour
      );
    });
  };

  return (
    <Card className="flex-1 min-h-0 overflow-auto border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="space-y-0">
        {hours.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-surface-border last:border-b-0"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(currentDate, hour)}
            >
              <div className="w-16 sm:w-20 flex-shrink-0 border-r border-surface-border p-2 text-center text-xs font-semibold text-ink-muted bg-surface-subtle/30">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="min-h-14 sm:min-h-16 flex-1 p-1.5 transition-colors hover:bg-surface-hover/50">
                <div className="space-y-1.5">
                  {hourEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEventEdit={onEventEdit}
                      onEventDelete={onEventDelete}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      getColorClasses={getColorClasses}
                      variant="detailed"
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Visão em Lista (Eventos agrupados por data com Popover de detalhes)
function ListView({
  events,
  onEventEdit,
  onEventDelete,
  getColorClasses,
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const d = new Date(event.startTime);
    const dataFormatada = d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    // Capitaliza apenas a primeira letra (ex: "Terça-feira, 17 de novembro de 2026")
    const dateKey = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  return (
    <Card className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-2.5">
            <h3 className="text-xs font-bold text-ink-secondary tracking-wider">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color);
                return (
                  <EventDetailPopover
                    key={event.id}
                    event={event}
                    getColorClasses={getColorClasses}
                    onEdit={onEventEdit}
                    onDelete={onEventDelete}
                  >
                    <div
                      className="group cursor-pointer rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover p-3 transition-all hover:shadow-2xs select-none"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-1 h-3 w-3 rounded-full flex-shrink-0', colorClasses.bg)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                            <h4 className="font-bold text-sm text-ink-primary group-hover:text-brand-primary transition-colors truncate">
                              {event.title}
                            </h4>
                            <div className="flex items-center gap-1.5 self-start sm:self-auto">
                              {event.category && (
                                <Badge variant="secondary" className="text-[11px] rounded-lg">
                                  {event.category}
                                </Badge>
                              )}
                              {event.deal && (
                                <Badge variant="outline" className="text-[11px] rounded-lg border-brand-primary/30 text-brand-primary flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  <span>{event.deal}</span>
                                </Badge>
                              )}
                            </div>
                          </div>
                          {event.description && (
                            <p className="mt-1 text-xs text-ink-secondary line-clamp-2">
                              {event.description}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                            <div className="flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(event.startTime).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                -{' '}
                                {new Date(event.endTime).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </EventDetailPopover>
                );
              })}
            </div>
          </div>
        ))}

        {sortedEvents.length === 0 && (
          <div className="py-12 text-center text-sm text-ink-secondary">
            Nenhum compromisso encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </Card>
  );
}

export default EventManager;

