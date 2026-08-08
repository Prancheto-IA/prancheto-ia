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

const CardStat = ({ emoji, label, valor, corValor }) => (
  <div
    className="rounded-xl p-4 flex items-center gap-4 border"
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}
  >
    <div className="text-2xl">{emoji}</div>
    <div>
      <p className="text-xs mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      <p className="font-semibold text-lg" style={{ color: corValor || 'var(--color-text-primary)' }}>{valor}</p>
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
        ? 'hover:border-primary-500/50 hover:bg-primary-500/5 cursor-pointer group'
        : 'cursor-not-allowed opacity-60'
      }
    `}
    style={{
      backgroundColor: 'var(--color-surface-card)',
      borderColor: 'var(--color-surface-border)',
    }}
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
          <h3 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{titulo}</h3>
          {!disponivel && (
            <span className="text-xs px-2 py-0.5 rounded-full border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              Em breve
            </span>
          )}
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{descricao}</p>
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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <CardStat emoji="🏢" label="Seu plano"    valor="Starter"  corValor="var(--color-primary-400)" />
        <CardStat emoji="👥" label="Usuários"     valor="1 / 5" />
        <CardStat emoji="📅" label="Membro desde" valor={new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} />
        <CardStat emoji="✅" label="Status"       valor="Ativo"    corValor="#34d399" />
      </div>

      {/* Módulos */}
      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Módulos do sistema
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Acesse as ferramentas disponíveis no seu plano.
        </p>

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
          <h3 className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
            🚀 Desbloqueie mais recursos
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Faça upgrade do seu plano para acessar todos os módulos e aumentar o limite de usuários.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/configuracoes?aba=plano')}
          className="flex-shrink-0 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Ver planos →
        </button>
      </div>
    </div>
  );
};

export default DashboardCliente;
