// =============================================================
// PRANCHETO.IA - PAINEL DE PERSONALIZAÇÃO DA HOME
// Mesmo padrão visual/interativo do ModalPersonalizarSidebar
// (LayoutCliente.jsx): @dnd-kit para reordenar, botão pra ocultar/mostrar.
// Diferença: aqui é uma lista única (todo widget já está "disponível",
// só oculto ou visível) — sem a divisão em duas colunas do Módulos.
// =============================================================

import React, { useState } from 'react';
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATALOGO_EM_BREVE } from '../../../hooks/useHomeWidgets.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DragDropVerticalIcon,
  Cancel01Icon,
  Delete02Icon,
  RotateLeft01Icon,
  Task01Icon,
  Calendar03Icon,
  FlashIcon,
  Megaphone01Icon,
  FireIcon,
  News01Icon,
  DashboardSquare01Icon,
} from '@hugeicons/core-free-icons';

const WIDGET_ICONES = {
  minhas_tarefas: Task01Icon,
  mini_agenda: Calendar03Icon,
  acessos_rapidos: FlashIcon,
  mural_anuncios: Megaphone01Icon,
  leads_quentes: FireIcon,
  noticias_negocios: News01Icon,
};

const getWidgetIcon = (slug) => {
  const IconComp = WIDGET_ICONES[slug] || DashboardSquare01Icon;
  return <HugeiconsIcon icon={IconComp} size={18} strokeWidth={1.8} className="text-[#0E382C]" />;
};

const ItemSortableWidget = ({ item, onToggle }) => {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: item.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: item.visivel ? 'var(--color-hover-surface)' : 'transparent',
    borderColor: item.visivel ? 'transparent' : 'var(--color-surface-border)',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
        item.visivel ? '' : 'border-dashed opacity-60'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="acao-sutil cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-0.5"
        title="Arrastar para reordenar"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} strokeWidth={1.8} />
      </button>
      <span className="w-8 h-8 rounded-lg bg-[#DCF5E4]/50 flex items-center justify-center flex-shrink-0">
        {getWidgetIcon(item.slug)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        <p className="text-xs opacity-50 truncate">{item.descricao}</p>
      </div>
      <button
        onClick={() => onToggle(item.slug)}
        className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
          item.visivel
            ? 'acao-sutil hover:text-red-500 hover:bg-red-500/10'
            : 'text-emerald-500 hover:bg-emerald-500/10'
        }`}
        title={item.visivel ? 'Ocultar da Início' : 'Mostrar na Início'}
      >
        {item.visivel ? (
          <>
            <HugeiconsIcon icon={Delete02Icon} size={12} strokeWidth={1.8} />
            <span>Ocultar</span>
          </>
        ) : (
          <span>+ Mostrar</span>
        )}
      </button>
    </div>
  );
};

const PainelPersonalizarHome = ({ aberto, onFechar, prefs }) => {
  const { itensParaModal, reordenar, toggleVisivel, resetar, salvando } = prefs;
  const [ordemLocal, setOrdemLocal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!aberto) return null;

  const itensExibidos = ordemLocal ?? itensParaModal;
  const visiveis = itensExibidos.filter((i) => i.visivel).length;

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) { setOrdemLocal(null); return; }
    const slugsAtuais = itensExibidos.map((i) => i.slug);
    const oldIdx = slugsAtuais.indexOf(active.id);
    const newIdx = slugsAtuais.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) { setOrdemLocal(null); return; }

    const novosSlugs = arrayMove(slugsAtuais, oldIdx, newIdx);
    const novosItens = novosSlugs.map((s) => itensExibidos.find((i) => i.slug === s)).filter(Boolean);
    setOrdemLocal(novosItens);
    await reordenar(novosSlugs);
    setOrdemLocal(null);
  };

  const handleResetar = async () => {
    await resetar();
    setOrdemLocal(null);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onFechar} />

      <div
        className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface-card)', borderLeft: '1px solid var(--color-surface-border)' }}
      >
        <div
          className="flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold">Personalizar Início</h2>
            <p className="text-xs opacity-50 mt-0.5">Arraste para reordenar • clique para ocultar</p>
          </div>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="Fechar">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-40 px-3 mb-2">
            Widgets ({visiveis} visíveis)
          </p>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={itensExibidos.map((i) => i.slug)} strategy={verticalListSortingStrategy}>
              {itensExibidos.map((item) => (
                <ItemSortableWidget key={item.slug} item={item} onToggle={toggleVisivel} />
              ))}
            </SortableContext>
          </DndContext>

          {CATALOGO_EM_BREVE.length > 0 && (
            <div className="pt-3 mt-2 border-t space-y-1" style={{ borderColor: 'var(--color-surface-border)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-40 px-3 mb-2">Em breve</p>
              {CATALOGO_EM_BREVE.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-dashed opacity-50"
                  style={{ borderColor: 'var(--color-surface-border)' }}
                >
                  <span className="w-8 h-8 rounded-lg bg-[#DCF5E4]/30 flex items-center justify-center flex-shrink-0">
                    {getWidgetIcon(item.slug)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    <p className="text-xs opacity-50 truncate">{item.descricao}</p>
                  </div>
                  <span className="text-xs opacity-40 flex-shrink-0">Em breve</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          {salvando && (
            <p className="text-xs opacity-40 text-center flex items-center justify-center gap-1">
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
              Salvando…
            </p>
          )}
          <button onClick={handleResetar} className="acao-sutil acao-sutil-bloco w-full text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium">
            <HugeiconsIcon icon={RotateLeft01Icon} size={14} strokeWidth={1.8} />
            <span>Restaurar padrão</span>
          </button>
          <button
            onClick={onFechar}
            className="w-full text-sm font-medium py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            Concluído
          </button>
        </div>
      </div>
    </>
  );
};

export default PainelPersonalizarHome;
