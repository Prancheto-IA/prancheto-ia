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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const defaultColors = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-600', text: 'text-blue-700', badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' },
  { name: 'Verde', value: 'green', bg: 'bg-emerald-600', text: 'text-emerald-700', badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-600', text: 'text-purple-700', badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-700', badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-600', text: 'text-pink-700', badgeBg: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30' },
  { name: 'Vermelho', value: 'red', bg: 'bg-rose-600', text: 'text-rose-700', badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
];

export const defaultCategories = ['Reunião', 'Tarefa', 'Lembrete', 'Pessoal'];
export const defaultAvailableTags = ['Importante', 'Urgente', 'Trabalho', 'Pessoal', 'Equipe', 'Cliente'];

export function EventManager({
  events: initialEvents = [],
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
    color: colors[0].value,
    category: categories[0],
    tags: [],
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

  const hasActiveFilters = selectedColors.length > 0 || selectedTags.length > 0 || selectedCategories.length > 0;

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

    setNewEvent({
      title: '',
      description: '',
      color: colors[0].value,
      category: categories[0],
      tags: [],
      startTime: inicio,
      endTime: fim,
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleCreateEvent = useCallback(() => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) return;

    const event = {
      id: Math.random().toString(36).substr(2, 9),
      title: newEvent.title,
      description: newEvent.description,
      startTime: new Date(newEvent.startTime),
      endTime: new Date(newEvent.endTime),
      color: newEvent.color || colors[0].value,
      category: newEvent.category,
      attendees: newEvent.attendees,
      tags: newEvent.tags || [],
    };

    setEvents((prev) => [...prev, event]);
    onEventCreate?.(event);
    setIsDialogOpen(false);
    setIsCreating(false);
    setNewEvent({
      title: '',
      description: '',
      color: colors[0].value,
      category: categories[0],
      tags: [],
      startTime: null,
      endTime: null,
    });
  }, [newEvent, colors, categories, onEventCreate]);

  const handleUpdateEvent = useCallback(() => {
    if (!selectedEvent) return;

    const eventoAtualizado = {
      ...selectedEvent,
      startTime: new Date(selectedEvent.startTime),
      endTime: new Date(selectedEvent.endTime),
    };

    setEvents((prev) => prev.map((e) => (e.id === eventoAtualizado.id ? eventoAtualizado : e)));
    onEventUpdate?.(eventoAtualizado.id, eventoAtualizado);
    setIsDialogOpen(false);
    setSelectedEvent(null);
  }, [selectedEvent, onEventUpdate]);

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
          newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
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

  return (
    <div className={cn('flex flex-col gap-4 font-sans text-ink-primary', className)}>
      {/* Header */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between bg-surface-card border border-surface-border p-4 rounded-2xl shadow-2xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-ink-primary capitalize tracking-tight">
            {view === 'month' &&
              currentDate.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            {view === 'week' &&
              `Semana de ${currentDate.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'short',
              })}`}
            {view === 'day' &&
              currentDate.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            {view === 'list' && 'Todos os Compromissos'}
          </h2>
          <div className="flex items-center gap-1.5">
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
              className="h-8 px-3 rounded-xl border-surface-border hover:bg-surface-hover text-xs font-bold"
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
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Mobile: Select dropdown */}
          <div className="sm:hidden">
            <Select value={view} onValueChange={(value) => setView(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Visão Mensal
                  </div>
                </SelectItem>
                <SelectItem value="week">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Visão Semanal
                  </div>
                </SelectItem>
                <SelectItem value="day">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Visão Diária
                  </div>
                </SelectItem>
                <SelectItem value="list">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    Lista de Eventos
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop: Button group */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-surface-border bg-surface-subtle p-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-7 text-xs rounded-lg"
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              <span>Mês</span>
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-7 text-xs rounded-lg"
            >
              <Grid3x3 className="h-3.5 w-3.5 mr-1" />
              <span>Semana</span>
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('day')}
              className="h-7 text-xs rounded-lg"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>Dia</span>
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="h-7 text-xs rounded-lg"
            >
              <List className="h-3.5 w-3.5 mr-1" />
              <span>Lista</span>
            </Button>
          </div>

          <Button
            onClick={() => handleOpenCreateDialog()}
            className="w-full sm:w-auto h-8 px-3.5 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Pesquisa */}
      <div className="flex flex-col gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Pesquisar compromissos por título, descrição ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 rounded-xl border-surface-border bg-surface-card"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-ink-muted hover:text-ink-primary"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Linha de filtros: Mobile com rolagem horizontal e Desktop integrado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Filtro de Cores */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-surface-border bg-surface-card hover:bg-surface-hover flex-shrink-0 text-xs">
                <Filter className="h-3.5 w-3.5 text-ink-secondary" />
                <span>Cores</span>
                {selectedColors.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {selectedColors.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filtrar por Cor</DropdownMenuLabel>
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
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', color.bg)} />
                    <span>{color.name}</span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro de Tags */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-surface-border bg-surface-card hover:bg-surface-hover flex-shrink-0 text-xs">
                <Filter className="h-3.5 w-3.5 text-ink-secondary" />
                <span>Tags</span>
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filtrar por Tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={(checked) => {
                    setSelectedTags((prev) => (checked ? [...prev, tag] : prev.filter((t) => t !== tag)));
                  }}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Filtro de Categorias */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl border-surface-border bg-surface-card hover:bg-surface-hover flex-shrink-0 text-xs">
                <Filter className="h-3.5 w-3.5 text-ink-secondary" />
                <span>Categorias</span>
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {selectedCategories.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
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
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1.5 text-xs text-ink-secondary hover:text-ink-primary flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Badges dos filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-ink-secondary">Filtros ativos:</span>
          {selectedColors.map((colorValue) => {
            const color = getColorClasses(colorValue);
            return (
              <Badge key={colorValue} variant="secondary" className="gap-1.5 rounded-lg py-0.5 text-xs">
                <div className={cn('h-2 w-2 rounded-full', color.bg)} />
                {color.name}
                <button
                  type="button"
                  onClick={() => setSelectedColors((prev) => prev.filter((c) => c !== colorValue))}
                  className="ml-1 hover:text-ink-primary cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1.5 rounded-lg py-0.5 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                className="ml-1 hover:text-ink-primary cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedCategories.map((category) => (
            <Badge key={category} variant="secondary" className="gap-1.5 rounded-lg py-0.5 text-xs">
              {category}
              <button
                type="button"
                onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== category))}
                className="ml-1 hover:text-ink-primary cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Visualizações do Calendário */}
      {view === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setIsCreating(false);
            setIsDialogOpen(true);
          }}
          onDayClick={(diaData) => handleOpenCreateDialog(diaData)}
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
          onEventClick={(event) => {
            setSelectedEvent(event);
            setIsCreating(false);
            setIsDialogOpen(true);
          }}
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
          onEventClick={(event) => {
            setSelectedEvent(event);
            setIsCreating(false);
            setIsDialogOpen(true);
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          getColorClasses={getColorClasses}
        />
      )}

      {view === 'list' && (
        <ListView
          events={filteredEvents}
          onEventClick={(event) => {
            setSelectedEvent(event);
            setIsCreating(false);
            setIsDialogOpen(true);
          }}
          getColorClasses={getColorClasses}
        />
      )}

      {/* Dialog de Criação / Edição do Evento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? 'Novo Compromisso' : 'Detalhes do Compromisso'}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? 'Preencha os detalhes para agendar na sua agenda.'
                : 'Visualize ou atualize as informações deste evento.'}
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
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={isCreating ? newEvent.category : selectedEvent?.category || categories[0]}
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, category: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, category: value } : null))
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color">Cor de identificação</Label>
                <Select
                  value={isCreating ? newEvent.color : selectedEvent?.color || colors[0].value}
                  onValueChange={(value) =>
                    isCreating
                      ? setNewEvent((prev) => ({ ...prev, color: value }))
                      : setSelectedEvent((prev) => (prev ? { ...prev, color: value } : null))
                  }
                >
                  <SelectTrigger id="color">
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-3.5 w-3.5 rounded-full', color.bg)} />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tags de identificação</Label>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {availableTags.map((tag) => {
                  const isSelected = isCreating
                    ? newEvent.tags?.includes(tag)
                    : selectedEvent?.tags?.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105 rounded-lg py-1 px-2.5 text-xs"
                      onClick={() => toggleTag(tag, isCreating)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
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

// Card do Evento com Drag & Drop e Popover informativo ao passar o mouse
function EventCard({
  event,
  onEventClick,
  onDragStart,
  onDragEnd,
  getColorClasses,
  variant = 'default',
}) {
  const [isHovered, setIsHovered] = useState(false);
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

  if (variant === 'compact') {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative cursor-pointer select-none"
      >
        <div
          className={cn(
            'rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-all duration-200',
            colorClasses.bg,
            'text-white truncate shadow-2xs leading-tight',
            isHovered && 'scale-[1.02] shadow-md z-10 brightness-105'
          )}
        >
          {event.title}
        </div>
        {isHovered && (
          <div className="absolute left-0 top-full z-50 mt-1 w-64 animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-none">
            <Card className="border border-surface-border bg-surface-card p-3 shadow-xl rounded-xl">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs text-ink-primary leading-tight">{event.title}</h4>
                  <div className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', colorClasses.bg)} />
                </div>
                {event.description && (
                  <p className="text-[11px] text-ink-secondary line-clamp-2">{event.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary font-medium">
                  <Clock className="h-3 w-3 text-ink-muted" />
                  <span>
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </span>
                  <span className="text-[10px] text-ink-muted">({getDuration()})</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {event.category && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded">
                      {event.category}
                    </Badge>
                  )}
                  {event.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 rounded">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        draggable
        onDragStart={() => onDragStart(event)}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick(event);
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'cursor-pointer rounded-xl p-2.5 sm:p-3 transition-all duration-200 select-none',
          colorClasses.bg,
          'text-white shadow-xs',
          isHovered && 'scale-[1.01] shadow-lg ring-2 ring-white/40'
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
        {((event.category) || (event.tags && event.tags.length > 0)) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.category && (
              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-transparent">
                {event.category}
              </Badge>
            )}
            {event.tags?.map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] text-white border-white/30">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(event)}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onEventClick(event);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative select-none"
    >
      <div
        className={cn(
          'cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition-all duration-200',
          colorClasses.bg,
          'text-white shadow-2xs',
          isHovered && 'scale-105 shadow-md z-10'
        )}
      >
        <div className="truncate">{event.title}</div>
      </div>
      {isHovered && (
        <div className="absolute left-0 top-full z-50 mt-1 w-68 animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-none">
          <Card className="border border-surface-border bg-surface-card p-3 shadow-xl rounded-xl">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-ink-primary leading-tight">{event.title}</h4>
                <div className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', colorClasses.bg)} />
              </div>
              {event.description && (
                <p className="text-[11px] text-ink-secondary line-clamp-2">{event.description}</p>
              )}
              <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                <Clock className="h-3 w-3 text-ink-muted" />
                <span>
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </span>
                <span className="text-[10px] text-ink-muted">({getDuration()})</span>
              </div>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {event.category && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded">
                    {event.category}
                  </Badge>
                )}
                {event.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1.5 rounded">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Visão Mensal (7 colunas x 6 semanas = 42 dias)
function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
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
    <Card className="overflow-hidden border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="grid grid-cols-7 border-b border-surface-border bg-surface-subtle">
        {diasSemana.map((day) => (
          <div
            key={day.curto}
            className="border-r border-surface-border p-2 text-center text-xs font-bold text-ink-secondary last:border-r-0"
          >
            <span className="hidden sm:inline">{day.completo}</span>
            <span className="sm:hidden">{day.curto}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              onClick={() => onDayClick?.(day)}
              className={cn(
                'min-h-20 sm:min-h-24 border-b border-r border-surface-border p-1.5 transition-colors last:border-r-0 cursor-pointer flex flex-col justify-start',
                !isCurrentMonth && 'bg-surface-subtle/50 opacity-45',
                'hover:bg-surface-hover/70'
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(day)}
            >
              <div className="flex items-center justify-between mb-1">
                <div
                  className={cn(
                    'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-bold transition-all',
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
              <div className="space-y-1 flex-1 overflow-hidden">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEventClick={onEventClick}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    getColorClasses={getColorClasses}
                    variant="compact"
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] font-bold text-ink-secondary px-1">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// Visão Semanal (Horas do dia x 7 dias da semana)
function WeekView({
  currentDate,
  events,
  onEventClick,
  onDragStart,
  onDragEnd,
  onDrop,
  getColorClasses,
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
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
    <Card className="overflow-auto border border-surface-border bg-surface-card rounded-2xl shadow-2xs max-h-[75vh]">
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
                        onEventClick={onEventClick}
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
  onEventClick,
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
    <Card className="overflow-auto border border-surface-border bg-surface-card rounded-2xl shadow-2xs max-h-[75vh]">
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
                      onEventClick={onEventClick}
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

// Visão em Lista (Eventos agrupados por data)
function ListView({
  events,
  onEventClick,
  getColorClasses,
}) {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const d = new Date(event.startTime);
    const dateKey = d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  return (
    <Card className="p-4 sm:p-5 border border-surface-border bg-surface-card rounded-2xl shadow-2xs">
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <div key={date} className="space-y-2.5">
            <h3 className="text-xs font-bold text-ink-secondary capitalize tracking-wider">{date}</h3>
            <div className="space-y-2">
              {dateEvents.map((event) => {
                const colorClasses = getColorClasses(event.color);
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="group cursor-pointer rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover p-3 transition-all hover:shadow-2xs select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-1 h-3 w-3 rounded-full flex-shrink-0', colorClasses.bg)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                          <h4 className="font-bold text-sm text-ink-primary group-hover:text-brand-primary transition-colors truncate">
                            {event.title}
                          </h4>
                          {event.category && (
                            <Badge variant="secondary" className="text-[11px] self-start sm:self-auto rounded-lg">
                              {event.category}
                            </Badge>
                          )}
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
                          {event.tags && event.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {event.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] h-4.5 rounded">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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

