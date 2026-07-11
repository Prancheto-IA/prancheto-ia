import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useModulos, CATALOGO_MODULOS } from '../../hooks/useModulos';

// ─── Card de módulo arrastável (área de ativos) ───────────────────────────────
const CardModuloSortable = ({ modulo, onDesativar }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modulo.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col gap-2 p-4 rounded-xl border cursor-grab active:cursor-grabbing select-none"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: modulo.cor + '22' }}
        >
          {modulo.icone}
        </div>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDesativar(modulo.slug)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-500/20 hover:text-red-400"
          title="Remover módulo"
        >
          ✕
        </button>
      </div>
      <div>
        <p className="text-sm font-semibold">{modulo.nome}</p>
        <p className="text-xs opacity-50 mt-0.5 leading-tight">{modulo.descricao}</p>
      </div>
      <div className="absolute bottom-2 right-2 opacity-20 text-xs">⠿</div>
    </div>
  );
};

// ─── Card de módulo disponível (área de disponíveis) ─────────────────────────
const CardModuloDisponivel = ({ modulo, onAtivar }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `disponivel-${modulo.slug}` });

  return (
    <div
      ref={setNodeRef}
      onClick={() => onAtivar(modulo.slug)}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
        isOver ? 'border-primary-500 bg-primary-500/10' : 'border-dashed opacity-60 hover:opacity-100'
      }`}
      title="Clique para ativar"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: modulo.cor + '22' }}
      >
        {modulo.icone}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{modulo.nome}</p>
        <p className="text-xs opacity-40 truncate">{modulo.descricao}</p>
      </div>
      <span className="ml-auto text-xs opacity-40 flex-shrink-0">+ Ativar</span>
    </div>
  );
};

// ─── Overlay do card sendo arrastado ─────────────────────────────────────────
const CardOverlay = ({ modulo }) => {
  if (!modulo) return null;
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-xl border shadow-2xl cursor-grabbing select-none rotate-2"
      style={{ width: 160, backgroundColor: 'var(--color-surface)' }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
        style={{ backgroundColor: modulo.cor + '22' }}
      >
        {modulo.icone}
      </div>
      <p className="text-sm font-semibold">{modulo.nome}</p>
    </div>
  );
};

// ─── Zona droppable de ativos ─────────────────────────────────────────────────
const ZonaAtivos = ({ children, isEmpty }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'zona-ativos' });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-xl transition-all ${
        isOver ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-transparent' : ''
      } ${isEmpty ? 'border-2 border-dashed flex items-center justify-center' : ''}`}
    >
      {isEmpty ? (
        <p className="text-sm opacity-40 text-center px-4">
          Arraste módulos aqui ou clique em "+ Ativar"
        </p>
      ) : (
        children
      )}
    </div>
  );
};

// ─── Página principal ─────────────────────────────────────────────────────────
const ModulosHub = () => {
  const navigate = useNavigate();
  const {
    modulosAtivos,
    modulosDisponiveis,
    carregando,
    salvando,
    ativarModulo,
    desativarModulo,
    reordenar,
  } = useModulos();

  const [ativoDrag, setAtivoDrag] = useState(null);
  // Estado local para reordenação otimista
  const [ordemLocal, setOrdemLocal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const slugsAtivos = (ordemLocal ?? modulosAtivos).map(m => m.slug);
  const modulosExibidos = ordemLocal ?? modulosAtivos;

  const handleDragStart = ({ active }) => {
    const modulo = CATALOGO_MODULOS.find(m => m.slug === active.id);
    setAtivoDrag(modulo || null);
  };

  const handleDragEnd = async ({ active, over }) => {
    setAtivoDrag(null);

    if (!over) return;

    const activeSlug = active.id;
    const overSlug = over.id;

    // Drag de disponível → ativos (drop em zona-ativos ou em outro módulo ativo)
    const estaDisponivel = modulosDisponiveis.some(m => m.slug === activeSlug);
    if (estaDisponivel) {
      const novaOrdem = slugsAtivos.length;
      await ativarModulo(activeSlug, novaOrdem);
      setOrdemLocal(null);
      return;
    }

    // Reordenação dentro dos ativos
    if (overSlug === 'zona-ativos') return;
    if (activeSlug === overSlug) return;

    const oldIndex = slugsAtivos.indexOf(activeSlug);
    const newIndex = slugsAtivos.indexOf(overSlug);
    if (oldIndex === -1 || newIndex === -1) return;

    const novosslugs = arrayMove(slugsAtivos, oldIndex, newIndex);
    // Atualização otimista
    const novosModulos = novosslugs.map(s => CATALOGO_MODULOS.find(m => m.slug === s)).filter(Boolean);
    setOrdemLocal(novosModulos);
    await reordenar(novosslugs);
    setOrdemLocal(null);
  };

  const handleAtivar = async (slug) => {
    await ativarModulo(slug, modulosAtivos.length);
  };

  const handleDesativar = async (slug) => {
    await desativarModulo(slug);
  };

  const handleAbrirModulo = (modulo) => {
    navigate(modulo.rota);
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Módulos</h1>
        <p className="text-sm opacity-60 mt-1">
          Configure quais módulos aparecem na sua área de trabalho. Arraste para reordenar.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Coluna esquerda: módulos ativos ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
                Ativos ({modulosExibidos.length})
              </h2>
              {salvando && (
                <span className="text-xs opacity-40 flex items-center gap-1">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                  Salvando…
                </span>
              )}
            </div>

            <SortableContext items={slugsAtivos} strategy={rectSortingStrategy}>
              <ZonaAtivos isEmpty={modulosExibidos.length === 0}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {modulosExibidos.map(modulo => (
                    <CardModuloSortable
                      key={modulo.slug}
                      modulo={modulo}
                      onDesativar={handleDesativar}
                    />
                  ))}
                </div>
              </ZonaAtivos>
            </SortableContext>

            {/* Atalhos rápidos para módulos ativos */}
            {modulosExibidos.length > 0 && (
              <div className="pt-2">
                <p className="text-xs opacity-40 mb-2">Acesso rápido:</p>
                <div className="flex flex-wrap gap-2">
                  {modulosExibidos.map(m => (
                    <button
                      key={m.slug}
                      onClick={() => handleAbrirModulo(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: m.cor + '22', color: m.cor }}
                    >
                      {m.icone} {m.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Coluna direita: módulos disponíveis ── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">
              Disponíveis ({modulosDisponiveis.length})
            </h2>
            <div className="space-y-2">
              {modulosDisponiveis.length === 0 ? (
                <p className="text-sm opacity-40 text-center py-8">
                  Todos os módulos estão ativos 🎉
                </p>
              ) : (
                modulosDisponiveis.map(modulo => (
                  <CardModuloDisponivel
                    key={modulo.slug}
                    modulo={modulo}
                    onAtivar={handleAtivar}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          <CardOverlay modulo={ativoDrag} />
        </DragOverlay>
      </DndContext>

      {/* Dica de uso */}
      <div className="rounded-xl p-4 text-sm opacity-60 border border-dashed">
        💡 <strong>Dica:</strong> Arraste módulos da coluna "Disponíveis" para "Ativos" para ativá-los.
        Reordene os módulos ativos arrastando-os entre si. As alterações são salvas automaticamente.
      </div>
    </div>
  );
};

export default ModulosHub;
