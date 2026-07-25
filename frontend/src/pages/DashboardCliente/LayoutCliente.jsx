// =============================================================
// PRANCHETO.IA - LAYOUT DO CLIENTE (com Sidebar)
// Wrapper com navegação lateral para todas as páginas do cliente.
// Inclui:
//   - Sidebar responsiva com h-screen (P3)
//   - Itens de nav personalizáveis por usuário via useSidebarPrefs (P1/P4)
//   - Modal de personalização da sidebar com DnD (P4)
//   - Bloco de usuário fixo no rodapé da sidebar (P3)
//   - Scroll interno na área de navegação (P3)
// =============================================================

import React, { useState, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
import { useAuthStore } from '../../store/authStore.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useSidebarPrefs, CATALOGO_SIDEBAR, SLUGS_FIXOS } from '../../hooks/useSidebarPrefs.js';

// Páginas onde o botão Voltar NÃO aparece (raízes do dashboard)
const ROTAS_SEM_VOLTAR = ['/dashboard', '/crm', '/suporte', '/dashboard/organizacao', '/modulos'];

const BADGE_CARGO = {
  admin:   { label: 'Admin',        cor: 'bg-violet-500/20 text-violet-300' },
  manager: { label: 'Gerente',      cor: 'bg-blue-500/20 text-blue-300' },
  member:  { label: 'Membro',       cor: 'bg-emerald-500/20 text-emerald-300' },
  viewer:  { label: 'Visualizador', cor: 'bg-slate-500/20 text-slate-300' },
};

// ----------------------------------------------------------
// COMPONENTE: Item da Sidebar
// ----------------------------------------------------------
const ItemNav = ({ item, onClick }) => {
  const location = useLocation();
  const ativoViaPrefixo = item.prefixoAtivo
    ? location.pathname.startsWith(item.prefixoAtivo)
    : false;

  return (
    <NavLink
      to={item.rota}
      end={item.exact}
      onClick={onClick}
      className={({ isActive }) => {
        const ativo = isActive || ativoViaPrefixo;
        return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
        ${ativo
          ? 'bg-primary-500/15 text-primary-300 border border-primary-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
        }`;
      }}
    >
      <span className="text-base flex-shrink-0">{item.emoji}</span>
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Item arrastável no modal de personalização
// ----------------------------------------------------------
const ItemSortableModal = ({ item, onToggle }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.slug });

  const fixo = SLUGS_FIXOS.includes(item.slug) || !item.removivel;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
        item.visivel
          ? 'border-transparent bg-white/5'
          : 'border-dashed opacity-50'
      }`}
    >
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        title="Arrastar para reordenar"
      >
        ⠿
      </button>

      <span className="text-base flex-shrink-0">{item.emoji}</span>
      <span className="flex-1 text-sm truncate">{item.label}</span>

      {fixo ? (
        <span className="text-xs opacity-30 flex-shrink-0" title="Item fixo — não pode ser ocultado">🔒</span>
      ) : (
        <button
          onClick={() => onToggle(item.slug)}
          className={`flex-shrink-0 text-xs px-2 py-1 rounded-md transition-colors ${
            item.visivel
              ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
              : 'text-emerald-400 hover:bg-emerald-500/10'
          }`}
          title={item.visivel ? 'Ocultar da sidebar' : 'Mostrar na sidebar'}
        >
          {item.visivel ? '🗑️ Ocultar' : '+ Mostrar'}
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Modal de personalização da sidebar
// ----------------------------------------------------------
const ModalPersonalizarSidebar = ({ aberto, onFechar, prefs }) => {
  const { itensParaModal, reordenar, toggleVisivel, resetar, salvando } = prefs;
  const [ordemLocal, setOrdemLocal] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!aberto) return null;

  const itensExibidos = ordemLocal ?? itensParaModal;
  const slugsVisiveis = itensExibidos.filter(i => i.visivel).map(i => i.slug);

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) {
      setOrdemLocal(null);
      return;
    }
    const slugsAtuais = itensExibidos.map(i => i.slug);
    const oldIdx = slugsAtuais.indexOf(active.id);
    const newIdx = slugsAtuais.indexOf(over.id);
    if (oldIdx === -1 || newIdx === -1) { setOrdemLocal(null); return; }

    const novosSlugs = arrayMove(slugsAtuais, oldIdx, newIdx);
    const novosItens = novosSlugs.map(s => itensExibidos.find(i => i.slug === s)).filter(Boolean);
    setOrdemLocal(novosItens);
    await reordenar(novosSlugs);
    setOrdemLocal(null);
  };

  const handleToggle = async (slug) => {
    await toggleVisivel(slug);
  };

  const handleResetar = async () => {
    await resetar();
    setOrdemLocal(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onFechar}
      />

      {/* Modal */}
      <div
        className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col shadow-2xl"
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderLeft: '1px solid var(--color-surface-border)',
        }}
      >
        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-4 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          <div>
            <h2 className="text-sm font-semibold">Personalizar barra lateral</h2>
            <p className="text-xs opacity-50 mt-0.5">Arraste para reordenar • clique para ocultar</p>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-500 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-40 px-3 mb-2">
            Visíveis ({slugsVisiveis.length})
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={itensExibidos.map(i => i.slug)}
              strategy={verticalListSortingStrategy}
            >
              {itensExibidos.map(item => (
                <ItemSortableModal
                  key={item.slug}
                  item={item}
                  onToggle={handleToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Rodapé */}
        <div
          className="p-3 flex-shrink-0 space-y-2"
          style={{ borderTop: '1px solid var(--color-surface-border)' }}
        >
          {salvando && (
            <p className="text-xs opacity-40 text-center flex items-center justify-center gap-1">
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
              Salvando…
            </p>
          )}
          <button
            onClick={handleResetar}
            className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors py-1.5 rounded-lg hover:bg-white/5"
          >
            ↺ Restaurar padrão
          </button>
          <button
            onClick={onFechar}
            className="w-full text-sm font-medium py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
            }}
          >
            Concluído
          </button>
        </div>
      </div>
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Sidebar
// P3: h-screen, flex-col, nav com overflow-y-auto flex-1,
//     bloco de usuário fixo no rodapé (flex-shrink-0)
// ----------------------------------------------------------
const Sidebar = ({ aberta, onFechar }) => {
  const { usuario } = useAuthStore();
  const { logout }  = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  const prefs = useSidebarPrefs();
  const { itensVisiveis } = prefs;

  const badgeCargo  = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <>
      {/* Overlay mobile */}
      {aberta && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={onFechar}
        />
      )}

      {/* Sidebar — P3: h-screen garante altura total no desktop */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 flex flex-col z-40 transition-transform duration-300
          ${aberta ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
        `}
        style={{
          backgroundColor: 'var(--color-surface-card)',
          borderRight: '1px solid var(--color-surface-border)',
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center gap-3 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          <span className="text-2xl">🧠</span>
          <span className="text-white font-bold text-lg">
            {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
          </span>
          {/* Botão fechar mobile */}
          <button
            onClick={onFechar}
            className="ml-auto text-slate-500 hover:text-white lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navegação — P3: flex-1 + overflow-y-auto = scroll interno */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
          {itensVisiveis.map((item) => (
            <ItemNav key={item.slug} item={item} onClick={onFechar} />
          ))}
        </nav>

        {/* Perfil do usuário — P3: flex-shrink-0 = sempre visível no rodapé */}
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {primeiroNome[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{primeiroNome}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${badgeCargo.cor}`}>
                {badgeCargo.label}
              </span>
            </div>
            {/* Botão personalizar sidebar — P4 */}
            <button
              onClick={() => setModalAberto(true)}
              title="Personalizar barra lateral"
              className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0 text-base"
            >
              ✏️
            </button>
            {/* Botão sair */}
            <button
              onClick={logout}
              title="Sair"
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0 text-lg"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Modal de personalização */}
      <ModalPersonalizarSidebar
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        prefs={prefs}
      />
    </>
  );
};

// ----------------------------------------------------------
// COMPONENTE: Header mobile
// ----------------------------------------------------------
const HeaderMobile = ({ onAbrirSidebar, mostrarVoltar, onVoltar }) => (
  <header
    className="h-14 flex items-center px-4 gap-3 lg:hidden sticky top-0 z-20"
    style={{
      backgroundColor: 'var(--color-surface-card)',
      borderBottom: '1px solid var(--color-surface-border)',
    }}
  >
    {mostrarVoltar ? (
      <button
        onClick={onVoltar}
        className="text-slate-400 hover:text-white transition-colors text-xl flex items-center gap-1"
        title="Voltar"
      >
        ←
      </button>
    ) : (
      <button
        onClick={onAbrirSidebar}
        className="text-slate-400 hover:text-white transition-colors text-xl"
      >
        ☰
      </button>
    )}
    <span className="text-2xl">🧠</span>
    <span className="text-white font-bold">
      {import.meta.env.VITE_APP_NAME || 'Prancheto.IA'}
    </span>
    {mostrarVoltar && (
      <button
        onClick={onAbrirSidebar}
        className="ml-auto text-slate-400 hover:text-white transition-colors"
      >
        ☰
      </button>
    )}
  </header>
);

// ----------------------------------------------------------
// COMPONENTE: Barra de topo desktop (com botão Voltar)
// ----------------------------------------------------------
const BarraTopo = ({ mostrarVoltar, onVoltar }) => {
  if (!mostrarVoltar) return null;
  return (
    <div
      className="hidden lg:flex items-center gap-2 px-6 py-3"
      style={{
        borderBottom: '1px solid var(--color-surface-border)',
        backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 30%, transparent)',
      }}
    >
      <button
        onClick={onVoltar}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        <span>Voltar</span>
      </button>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: Layout do Cliente
// P3: wrapper usa items-stretch para que a sidebar ocupe 100vh
// ----------------------------------------------------------
const LayoutCliente = ({ children }) => {
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const mostrarVoltar = !ROTAS_SEM_VOLTAR.includes(location.pathname);
  const voltar = () => navigate(-1);

  return (
    // P3: items-stretch garante que a sidebar (static no desktop) ocupe toda a altura
    <div className="min-h-screen bg-surface flex items-stretch">
      {/* Sidebar */}
      <Sidebar
        aberta={sidebarAberta}
        onFechar={() => setSidebarAberta(false)}
      />

      {/* Área de conteúdo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <HeaderMobile
          onAbrirSidebar={() => setSidebarAberta(true)}
          mostrarVoltar={mostrarVoltar}
          onVoltar={voltar}
        />

        {/* Barra de topo desktop com botão Voltar */}
        <BarraTopo mostrarVoltar={mostrarVoltar} onVoltar={voltar} />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutCliente;
