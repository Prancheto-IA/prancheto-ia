// =============================================================
// PRANCHETO.IA - OUTBOUND (Em Construção)
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

const RecursoItem = ({ emoji, titulo, descricao }) => (
  <div className="flex items-start gap-4 p-4 bg-surface-card border border-surface-border rounded-xl">
    <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
      {emoji}
    </div>
    <div>
      <p className="text-white font-medium text-sm mb-1">{titulo}</p>
      <p className="text-slate-400 text-xs leading-relaxed">{descricao}</p>
    </div>
    <span className="ml-auto flex-shrink-0 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
      Em breve
    </span>
  </div>
);

const Outbound = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">📧 Outbound</h1>
        <p className="text-slate-400 text-sm mt-1">
          Automatize campanhas de e-mail e mensagens para seus contatos.
        </p>
      </div>

      {/* Banner principal */}
      <div className="bg-gradient-to-br from-primary-900/50 to-violet-900/50 border border-primary-500/20 rounded-2xl p-8 text-center mb-8">
        <div className="text-6xl mb-4">🚀</div>
        <h2 className="text-white text-xl font-bold mb-2">Módulo em Construção</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          O módulo de Outbound está sendo desenvolvido e estará disponível em breve.
          Você será notificado assim que for lançado.
        </p>
        <button
          onClick={() => navigate('/dashboard/planos')}
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Ver planos disponíveis →
        </button>
      </div>

      {/* Funcionalidades previstas */}
      <div>
        <h3 className="text-white font-semibold mb-4">O que estará disponível:</h3>
        <div className="space-y-3">
          <RecursoItem
            emoji="✉️"
            titulo="Campanhas de E-mail"
            descricao="Crie e envie campanhas de e-mail personalizadas para segmentos de contatos."
          />
          <RecursoItem
            emoji="🤖"
            titulo="Sequências Automatizadas"
            descricao="Configure fluxos de follow-up automáticos com base em ações dos contatos."
          />
          <RecursoItem
            emoji="📊"
            titulo="Analytics de Campanhas"
            descricao="Acompanhe taxas de abertura, cliques e conversões em tempo real."
          />
          <RecursoItem
            emoji="🎯"
            titulo="Segmentação Inteligente"
            descricao="Segmente seus contatos por tags, estágio no funil e comportamento."
          />
        </div>
      </div>
    </div>
  );
};

export default Outbound;
