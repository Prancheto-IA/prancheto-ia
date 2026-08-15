// =============================================================
// PRANCHETO.IA - LAYOUT DO CLIENTE (com Sidebar)
// Wrapper com navegação lateral para todas as páginas do cliente.
// Inclui:
//   - Sidebar responsiva com h-screen (P3)
//   - Itens de nav personalizáveis por usuário via useSidebarPrefs (P1/P4)
//   - Modal de personalização da sidebar com DnD (P4)
//   - Bloco de usuário fixo no rodapé da sidebar (P3)
//   - Scroll interno na área de navegação (P3)
//
// É também o ponto onde a identidade visual da organização entra em cena:
// carrega o tenant uma vez e o tenantStore aplica as cores no documento,
// valendo para toda a área do cliente.
// =============================================================

import React, { useState, useEffect } from 'react';
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
import { useTenantStore } from '../../store/tenantStore.js';
import { useAuth, carregarPermissoesCargo } from '../../hooks/useAuth.js';
import { useSidebarPrefs, SLUGS_FIXOS } from '../../hooks/useSidebarPrefs.js';
import { NOME_PRODUTO } from '../../lib/ambiente.js';

// Páginas onde o botão Voltar NÃO aparece (raízes do dashboard)
const ROTAS_SEM_VOLTAR = ['/dashboard', '/crm', '/suporte', '/dashboard/organizacao', '/modulos'];

// Dois tons por cargo: o escuro para o tema claro, o claro para o escuro.
// A classe .badge-cargo (index.css) escolhe qual usar. Antes eram só os tons
// claros, ilegíveis sobre a barra branca do tema claro.
const BADGE_CARGO = {
  admin:   { label: 'Admin',        rgb: '124  58 237', rgbClaro: '196 181 253' },
  manager: { label: 'Gerente',      rgb: ' 37  99 235', rgbClaro: '147 197 253' },
  member:  { label: 'Membro',       rgb: '  5 150 105', rgbClaro: '110 231 183' },
  viewer:  { label: 'Visualizador', rgb: ' 71  85 105', rgbClaro: '203 213 225' },
};

// ----------------------------------------------------------
// COMPONENTE: Marca (logo da organização + nome do produto)
// Cai no ícone padrão quando a organização não tem logo, e também
// quando a URL salva não carrega — logo quebrado é pior que nenhum.
// ----------------------------------------------------------
const Marca = ({ className = 'text-2xl' }) => {
  const logoUrl = useTenantStore((s) => s.tenant?.logo_url);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => { setFalhou(false); }, [logoUrl]);

  if (!logoUrl || falhou) return <span className={className}>🧠</span>;

  return (
    <img
      src={logoUrl}
      alt=""
      className="h-7 w-7 rounded object-contain flex-shrink-0"
      onError={() => setFalhou(true)}
    />
  );
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
      className={({ isActive }) =>
        `nav-lateral ${isActive || ativoViaPrefixo ? 'nav-lateral-ativo' : ''}`
      }
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
    // O modal fica sobre a superfície do tema, não sobre a barra: aqui as
    // cores seguem o tema, e não a identidade da organização.
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
      {/* Handle de drag */}
      <button
        {...attributes}
        {...listeners}
        className="acao-sutil cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        title="Arrastar para reordenar"
      >
        ⠿
      </button>

      <span className="text-base flex-shrink-0">{item.emoji}</span>
      <span className="flex-1 text-sm truncate">{item.label}</span>

      {fixo ? (
        <span className="text-xs opacity-40 flex-shrink-0" title="Item fixo — não pode ser ocultado">🔒</span>
      ) : (
        <button
          onClick={() => onToggle(item.slug)}
          className={`flex-shrink-0 text-xs px-2 py-1 rounded-md transition-colors ${
            item.visivel
              ? 'acao-sutil hover:text-red-500 hover:bg-red-500/10'
              : 'text-emerald-500 hover:bg-emerald-500/10'
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
          <button onClick={onFechar} className="acao-sutil text-lg">
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
            className="acao-sutil acao-sutil-bloco w-full text-xs py-1.5 rounded-lg"
          >
            ↺ Restaurar padrão
          </button>
          {/* Usava a variável --color-primary, que nunca existiu: o botão
              ficava sem fundo. A classe é a mesma dos demais botões primários. */}
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
          // --brand-superficie só existe quando a organização aplica a
          // própria identidade visual; sem ela, a superfície do tema vale.
          backgroundColor: 'var(--brand-superficie, var(--color-surface-card))',
          borderRight: '1px solid var(--color-surface-border)',
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center gap-3 px-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-surface-border)' }}
        >
          <Marca />
          {/* Era text-white fixo, invisível no tema claro. Com identidade
              aplicada, segue a cor de acento sobre a cor secundária. */}
          <span
            className="font-bold text-lg truncate"
            style={{ color: 'var(--sidebar-texto)' }}
          >
            {NOME_PRODUTO}
          </span>
          {/* Botão fechar mobile */}
          <button onClick={onFechar} className="acao-lateral ml-auto lg:hidden">
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
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--sidebar-texto)' }}
              >
                {primeiroNome}
              </p>
              <span
                className="badge-cargo"
                style={{
                  '--badge-cargo-rgb':       badgeCargo.rgb,
                  '--badge-cargo-rgb-claro': badgeCargo.rgbClaro,
                }}
              >
                {badgeCargo.label}
              </span>
            </div>
            {/* Botão personalizar sidebar — P4 */}
            <button
              onClick={() => setModalAberto(true)}
              title="Personalizar barra lateral"
              className="acao-lateral flex-shrink-0 text-base"
            >
              ✏️
            </button>
            {/* Botão sair */}
            <button
              onClick={logout}
              title="Sair"
              className="acao-lateral flex-shrink-0 text-lg hover:text-red-500"
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
      <button onClick={onVoltar} className="acao-sutil text-xl flex items-center gap-1" title="Voltar">
        ←
      </button>
    ) : (
      <button onClick={onAbrirSidebar} className="acao-sutil text-xl" title="Abrir menu">
        ☰
      </button>
    )}
    <Marca />
    <span className="font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
      {NOME_PRODUTO}
    </span>
    {mostrarVoltar && (
      <button onClick={onAbrirSidebar} className="acao-sutil ml-auto" title="Abrir menu">
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
      <button onClick={onVoltar} className="acao-sutil flex items-center gap-2 text-sm group">
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

  // Carrega a organização uma única vez por sessão. O tenantStore aplica a
  // identidade visual no documento, então isto vale para a área inteira.
  const tenantId        = useAuthStore((s) => s.usuario?.tenant_id);
  const carregarTenant  = useTenantStore((s) => s.carregar);
  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  // Revalida as permissões do cargo. A lista vem do login e fica em cache no
  // localStorage: sem isto, alteração de cargo feita pelo administrador só
  // valeria para quem fizesse logout e login de novo.
  const cargoId          = useAuthStore((s) => s.usuario?.cargo_id);
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario);
  useEffect(() => {
    if (!cargoId) return;
    carregarPermissoesCargo(cargoId).then((lista) => {
      if (Array.isArray(lista)) atualizarUsuario({ permissoesCargo: lista });
    });
  }, [cargoId, atualizarUsuario]);

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
