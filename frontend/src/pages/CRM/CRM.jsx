// =============================================================
// PRANCHETO.IA - PÁGINA PRINCIPAL DO CRM
// Tela principal para usuários comuns (clientes).
// Exibe a navegação em colunas estilo Finder do Mac com a
// hierarquia: Seções → Módulos → Abas → Widgets.
//
// PRÓXIMA ETAPA: Implementar o ColumnExplorer e carregar
// as seções/módulos da API com base nas permissões do usuário.
// =============================================================

import React from 'react';
import { useAuthStore } from '../../store/authStore.js';

const PaginaCRM = () => {
  const { usuario, logout } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧠</span>
          <span className="text-white font-semibold">Prancheto.IA</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">
            {usuario?.nome || usuario?.email}
          </span>
          <button
            onClick={logout}
            className="btn-secondary text-sm px-3 py-1.5"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">🏗️</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            CRM em Construção
          </h2>
          <p className="text-slate-400 mb-6">
            O módulo de CRM com navegação em colunas (Seções → Módulos → Abas → Widgets)
            será implementado na próxima etapa do desenvolvimento.
          </p>
          <div className="card text-left space-y-2">
            <p className="text-slate-300 text-sm font-medium">Próximas implementações:</p>
            <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
              <li>ColumnExplorer (navegação estilo Finder)</li>
              <li>Biblioteca de Seções (Nível 1)</li>
              <li>Biblioteca de Módulos (Nível 2)</li>
              <li>Biblioteca de Abas/Views (Nível 3)</li>
              <li>Biblioteca de Widgets (Nível 4)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaginaCRM;
