// =============================================================
// PRANCHETO.IA - DASHBOARD DO CLIENTE (Página Início)
// Reconstruída como sistema de widgets "lego", mesmo padrão técnico do
// Módulos (@dnd-kit + configuração persistida por usuário), mas com
// arranjo padrão pronto e visível — sem exigir ativação manual (ver
// hooks/useHomeWidgets.js).
// =============================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore.js';
import { saudacao } from '../../lib/saudacao.js';
import { useHomeWidgets } from '../../hooks/useHomeWidgets.js';
import PainelPersonalizarHome from './widgets/PainelPersonalizarHome.jsx';
import WidgetMiniAgenda from './widgets/WidgetMiniAgenda.jsx';
import WidgetMuralAnuncios from './widgets/WidgetMuralAnuncios.jsx';
import WidgetAcessosRapidos from './widgets/WidgetAcessosRapidos.jsx';
import WidgetMinhasTarefas from './widgets/WidgetMinhasTarefas.jsx';
import WidgetLeadsQuentes from './widgets/WidgetLeadsQuentes.jsx';

const BADGE_CARGO = {
  admin:   { label: 'Administrador', cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  manager: { label: 'Gerente',       cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  member:  { label: 'Membro',        cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  viewer:  { label: 'Visualizador',  cor: 'badge-neutro' },
};

// slug -> componente. CATALOGO_WIDGETS (useHomeWidgets.js) é a fonte de
// verdade de label/emoji/tamanho; aqui só mapeia pra quem renderiza.
const COMPONENTES_WIDGET = {
  mini_agenda: WidgetMiniAgenda,
  mural_anuncios: WidgetMuralAnuncios,
  acessos_rapidos: WidgetAcessosRapidos,
  minhas_tarefas: WidgetMinhasTarefas,
  leads_quentes: WidgetLeadsQuentes,
};

const DashboardCliente = () => {
  const { usuario } = useAuthStore();
  const badgeCargo = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  const prefs = useHomeWidgets();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Boas-vindas */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {saudacao()}, {primeiroNome}! 👋
            </h1>
            <span className={`text-xs px-2 py-1 rounded-full border ${badgeCargo.cor}`}>
              {badgeCargo.label}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Bem-vindo ao seu painel. Aqui você gerencia tudo do seu negócio.
          </p>
        </div>

        <button
          onClick={() => setModalAberto(true)}
          title="Personalizar Início"
          className="acao-sutil acao-sutil-bloco flex-shrink-0 text-sm px-3 py-2 rounded-lg border flex items-center gap-2"
          style={{ borderColor: 'var(--color-surface-border)' }}
        >
          ✏️ Personalizar
        </button>
      </div>

      {/* Grade de widgets */}
      {prefs.carregando ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prefs.widgetsVisiveis.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed" style={{ borderColor: 'var(--color-surface-border)' }}>
          <p className="text-4xl mb-3">🧩</p>
          <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Nenhum widget visível</p>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            Personalize sua Início e escolha o que aparece aqui.
          </p>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            ✏️ Personalizar Início
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prefs.widgetsVisiveis.map((widget) => {
            const Componente = COMPONENTES_WIDGET[widget.slug];
            if (!Componente) return null;
            return (
              <div key={widget.slug} className={widget.tamanho === 'grande' ? 'sm:col-span-2' : ''}>
                <Componente />
              </div>
            );
          })}
        </div>
      )}

      <PainelPersonalizarHome
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        prefs={prefs}
      />
    </div>
  );
};

export default DashboardCliente;
