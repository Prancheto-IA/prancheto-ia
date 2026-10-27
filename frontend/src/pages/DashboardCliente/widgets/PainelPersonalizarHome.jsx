// =============================================================
// PRANCHETO.IA - PAINEL DE PERSONALIZAÇÃO DA HOME (EMITLY DESIGN SYSTEM)
// Drawer lateral harmonizado com o ModalPersonalizarSidebar (LayoutCliente):
// @dnd-kit para reordenar widgets, botão para ocultar/mostrar e reset.
// =============================================================

import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CATALOGO_EM_BREVE } from '../../../hooks/useHomeWidgets.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  DragDropVerticalIcon,
  Cancel01Icon,
  RotateLeft01Icon,
  Task01Icon,
  Calendar03Icon,
  FlashIcon,
  Megaphone01Icon,
  FireIcon,
  News01Icon,
  DashboardSquare01Icon,
  Clock01Icon,
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
  return <HugeiconsIcon icon={IconComp} size={16} strokeWidth={1.8} className="text-[#0E382C]" />;
};

const ItemSortableWidget = ({ item, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${
        item.visivel
          ? 'bg-white border-[#E4ECE7] shadow-2xs hover:border-[#0E382C]/30'
          : 'bg-[#F7FAF8] border-dashed border-[#E4ECE7] opacity-65'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-1 rounded-md"
        title="Arrastar para reordenar"
        type="button"
      >
        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} strokeWidth={1.8} />
      </button>

      <span className="w-8 h-8 rounded-xl bg-[#DCF5E4] flex items-center justify-center shrink-0 border border-[#bbf0ca]/60">
        {getWidgetIcon(item.slug)}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-bold text-[#111915] truncate">
          {item.label}
        </p>
        <p className="text-[11px] text-[#687770] truncate">
          {item.descricao}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggle(item.slug)}
        className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
          item.visivel
            ? 'text-red-600 hover:bg-red-50'
            : 'text-[#15803D] hover:bg-[#DCF5E4]'
        }`}
        title={item.visivel ? 'Ocultar do painel inicial' : 'Mostrar no painel inicial'}
      >
        {item.visivel ? 'Ocultar' : '+ Mostrar'}
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
    if (!over || active.id === over.id) {
      setOrdemLocal(null);
      return;
    }
    const slugsAtuais = itensExibidos.map((i) => i.slug);
    const oldIdx = slugsAtuais.indexOf(active.id);
    const newIdx = slugsAtuais.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) {
      setOrdemLocal(null);
      return;
    }

    const novosSlugs = arrayMove(slugsAtuais, oldIdx, newIdx);
    const novosItens = novosSlugs
      .map((s) => itensExibidos.find((i) => i.slug === s))
      .filter(Boolean);
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
      {/* Backdrop com glassmorphism idêntico ao da sidebar */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-fade-in"
        onClick={onFechar}
      />

      {/* Drawer Lateral Direito */}
      <div className="fixed inset-y-0 right-0 w-84 max-w-[calc(100vw-1rem)] bg-white z-50 flex flex-col shadow-2xl border-l border-[#E4ECE7] animate-slide-left">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4ECE7] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#111915]">
              Personalizar Início
            </h2>
            <p className="text-xs text-[#687770]">
              Arraste para organizar seus blocos
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-[#F2F5F3] transition-colors cursor-pointer"
            title="Fechar personalização"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* Lista de Widgets Sortable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[#687770]">
              Widgets Ativos ({visiveis} de {itensExibidos.length})
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itensExibidos.map((i) => i.slug)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {itensExibidos.map((item) => (
                  <ItemSortableWidget
                    key={item.slug}
                    item={item}
                    onToggle={toggleVisivel}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Seção Em Breve */}
          {CATALOGO_EM_BREVE && CATALOGO_EM_BREVE.length > 0 && (
            <div className="pt-4 mt-3 border-t border-[#E4ECE7] space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#687770] mb-2 flex items-center gap-1.5">
                <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={2} />
                Em Breve
              </p>
              {CATALOGO_EM_BREVE.map((item) => (
                <div
                  key={item.slug}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dashed border-[#E4ECE7] bg-[#F7FAF8] opacity-60"
                >
                  <span className="w-8 h-8 rounded-xl bg-slate-200/70 flex items-center justify-center shrink-0 text-slate-500">
                    {getWidgetIcon(item.slug)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-[#111915] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[#687770] truncate">
                      {item.descricao}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full shrink-0">
                    Em breve
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 border-t border-[#E4ECE7] space-y-2 bg-[#F7FAF8] shrink-0">
          {salvando && (
            <p className="text-xs text-center text-emerald-700 font-medium animate-pulse flex items-center justify-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
              Salvando preferências...
            </p>
          )}

          <button
            type="button"
            onClick={handleResetar}
            className="w-full text-xs py-2 text-[#687770] hover:text-[#111915] font-semibold text-center cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <HugeiconsIcon icon={RotateLeft01Icon} size={14} strokeWidth={1.8} />
            <span>Restaurar Padrão</span>
          </button>

          <button
            type="button"
            onClick={onFechar}
            className="w-full py-2.5 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-sm rounded-xl transition-all shadow-xs cursor-pointer text-center"
          >
            Concluído
          </button>
        </div>
      </div>
    </>
  );
};

export default PainelPersonalizarHome;
