// =============================================================
// PRANCHETO.IA - DASHBOARD DO CLIENTE (Página Início)
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';

const BADGE_CARGO = {
  admin:   { label: 'Administrador', cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  manager: { label: 'Gerente',       cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  member:  { label: 'Membro',        cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  viewer:  { label: 'Visualizador',  cor: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
};

const saudacao = () => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

const CardStat = ({ emoji, label, valor, cor = 'text-white' }) => (
  <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-4">
    <div className="text-2xl">{emoji}</div>
    <div>
      <p className="text-slate-400 text-xs mb-0.5">{label}</p>
      <p className={`font-semibold text-lg ${cor}`}>{valor}</p>
    </div>
  </div>
);

const CardModulo = ({ emoji, titulo, descricao, disponivel = true, onClick }) => (
  <button
    onClick={disponivel ? onClick : undefined}
    disabled={!disponivel}
    className={`
      w-full text-left p-5 rounded-xl border transition-all duration-200
      ${disponivel
        ? 'bg-surface-card border-surface-border hover:border-primary-500/50 hover:bg-primary-500/5 cursor-pointer group'
        : 'bg-surface-card/50 border-surface-border/50 cursor-not-allowed opacity-60'
      }
    `}
  >
    <div className="flex items-start gap-4">
      <div className={`
        text-2xl w-12 h-12 flex items-center justify-center rounded-lg flex-shrink-0
        ${disponivel ? 'bg-primary-500/10 group-hover:bg-primary-500/20' : 'bg-slate-700/30'}
        transition-colors
      `}>
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-white font-medium text-sm">{titulo}</h3>
          {!disponivel && (
            <span className="text-xs bg-slate-700/50 text-slate-400 px-2 py-0.5 rounded-full border border-slate-600/30">
              Em breve
            </span>
          )}
        </div>
        <p className="text-slate-400 text-xs leading-relaxed">{descricao}</p>
      </div>
      {disponivel && (
        <div className="text-slate-500 group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1">→</div>
      )}
    </div>
  </button>
);

const DashboardCliente = () => {
  const { usuario } = useAuthStore();
  const navigate    = useNavigate();
  const badgeCargo  = BADGE_CARGO[usuario?.cargo] || BADGE_CARGO.member;
  const primeiroNome = usuario?.nome?.split(' ')[0] || 'Usuário';

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Boas-vindas */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {saudacao()}, {primeiroNome}! 👋
          </h1>
          <span className={`text-xs px-2 py-1 rounded-full border ${badgeCargo.cor}`}>
            {badgeCargo.label}
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Bem-vindo ao seu painel. Aqui você gerencia tudo do seu negócio.
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <CardStat emoji="🏢" label="Seu plano"    valor="Starter"  cor="text-primary-400" />
        <CardStat emoji="👥" label="Usuários"     valor="1 / 5"    cor="text-white" />
        <CardStat emoji="📅" label="Membro desde" valor={new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} cor="text-white" />
        <CardStat emoji="✅" label="Status"       valor="Ativo"    cor="text-emerald-400" />
      </div>

      {/* Módulos */}
      <div className="mb-6">
        <h2 className="text-white font-semibold text-lg mb-1">Módulos do sistema</h2>
        <p className="text-slate-400 text-sm mb-4">Acesse as ferramentas disponíveis no seu plano.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardModulo
            emoji="📋" titulo="CRM"
            descricao="Gerencie seus contatos, leads e oportunidades de negócio."
            disponivel={true}
            onClick={() => navigate('/crm')}
          />
          <CardModulo
            emoji="🤖" titulo="Chat com IA"
            descricao="Converse com a inteligência artificial para obter insights e sugestões."
            disponivel={true}
            onClick={() => navigate('/dashboard/chat')}
          />
          <CardModulo
            emoji="📊" titulo="Relatórios"
            descricao="Visualize métricas e indicadores de desempenho do seu negócio."
            disponivel={true}
            onClick={() => navigate('/dashboard/relatorios')}
          />
          <CardModulo
            emoji="📧" titulo="Outbound"
            descricao="Automatize o envio de e-mails e mensagens para seus contatos."
            disponivel={true}
            onClick={() => navigate('/dashboard/outbound')}
          />
          <CardModulo
            emoji="🗓️" titulo="Agenda"
            descricao="Organize reuniões, tarefas e compromissos da sua equipe."
            disponivel={true}
            onClick={() => navigate('/dashboard/agenda')}
          />
          <CardModulo
            emoji="⚙️" titulo="Configurações"
            descricao="Personalize o sistema de acordo com as necessidades da sua empresa."
            disponivel={true}
            onClick={() => navigate('/dashboard/configuracoes')}
          />
        </div>
      </div>

      {/* Banner de upgrade */}
      <div className="bg-gradient-to-r from-primary-900/40 to-violet-900/40 border border-primary-500/20 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-semibold mb-1">🚀 Desbloqueie mais recursos</h3>
          <p className="text-slate-400 text-sm">
            Faça upgrade do seu plano para acessar todos os módulos e aumentar o limite de usuários.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/planos')}
          className="flex-shrink-0 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Ver planos →
        </button>
      </div>
    </div>
  );
};

export default DashboardCliente;
