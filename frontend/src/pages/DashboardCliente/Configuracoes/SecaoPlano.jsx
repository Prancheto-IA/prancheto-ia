// =============================================================
// PRANCHETO.IA - SEÇÃO PLANO (aba de Configurações)
// Mostra o plano atual da organização e as opções disponíveis.
//
// Era a página /dashboard/planos, com item próprio na barra lateral.
// Virou uma aba de Configurações: é uma consulta ocasional, não um
// destino de navegação diária.
// =============================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useTenantStore } from '../../../store/tenantStore.js';

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------
const ICONES_RECURSO = {
  crm:           '📋',
  chat_ia:       '🤖',
  agenda:        '🗓️',
  relatorios:    '📊',
  outbound:      '📧',
  configuracoes: '⚙️',
};

const formatarPreco = (valor) => {
  if (!valor || valor === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// Usado quando a consulta falha: a aba mostra a tabela comercial em vez
// de um erro, já que os planos são informação pública do produto.
const PLANOS_FALLBACK = [
  { id: '1', slug: 'starter',    nome: 'Starter',    descricao: 'Ideal para pequenas equipes.',         preco_mensal: 0,   preco_anual: 0,    limite_usuarios: 5,   limite_contatos: 500,   destaque: false, ordem: 1 },
  { id: '2', slug: 'pro',        nome: 'Pro',        descricao: 'Para equipes em crescimento.',         preco_mensal: 97,  preco_anual: 970,  limite_usuarios: 20,  limite_contatos: 5000,  destaque: true,  ordem: 2 },
  { id: '3', slug: 'enterprise', nome: 'Enterprise', descricao: 'Solução completa para grandes times.', preco_mensal: 297, preco_anual: 2970, limite_usuarios: 100, limite_contatos: 50000, destaque: false, ordem: 3 },
];

const RECURSOS_FALLBACK = {
  starter: [
    { slug: 'crm',           nome: 'CRM',           habilitado: true,  limite: 500 },
    { slug: 'chat_ia',       nome: 'Chat com IA',   habilitado: false, limite: null },
    { slug: 'agenda',        nome: 'Agenda',        habilitado: false, limite: null },
    { slug: 'relatorios',    nome: 'Relatórios',    habilitado: false, limite: null },
    { slug: 'outbound',      nome: 'Outbound',      habilitado: false, limite: null },
    { slug: 'configuracoes', nome: 'Configurações', habilitado: true,  limite: null },
  ],
  pro: [
    { slug: 'crm',           nome: 'CRM',           habilitado: true,  limite: 5000 },
    { slug: 'chat_ia',       nome: 'Chat com IA',   habilitado: true,  limite: null },
    { slug: 'agenda',        nome: 'Agenda',        habilitado: true,  limite: null },
    { slug: 'relatorios',    nome: 'Relatórios',    habilitado: true,  limite: null },
    { slug: 'outbound',      nome: 'Outbound',      habilitado: false, limite: null },
    { slug: 'configuracoes', nome: 'Configurações', habilitado: true,  limite: null },
  ],
  enterprise: [
    { slug: 'crm',           nome: 'CRM',           habilitado: true, limite: null },
    { slug: 'chat_ia',       nome: 'Chat com IA',   habilitado: true, limite: null },
    { slug: 'agenda',        nome: 'Agenda',        habilitado: true, limite: null },
    { slug: 'relatorios',    nome: 'Relatórios',    habilitado: true, limite: null },
    { slug: 'outbound',      nome: 'Outbound',      habilitado: true, limite: null },
    { slug: 'configuracoes', nome: 'Configurações', habilitado: true, limite: null },
  ],
};

// ----------------------------------------------------------
// COMPONENTE: Card de Plano
// ----------------------------------------------------------
const CardPlano = ({ plano, recursos, planoAtual, onSelecionar }) => {
  const ehAtual  = plano.slug === planoAtual;
  const destaque = plano.destaque;

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col transition-all ${
        destaque ? 'shadow-lg shadow-primary-500/10' : ''
      } ${ehAtual ? 'ring-2 ring-emerald-500/50' : ''}`}
      style={{
        backgroundColor: 'var(--color-surface-card)',
        border: `1px solid ${destaque ? 'rgb(var(--color-primary-500) / 0.4)' : 'var(--color-surface-border)'}`,
      }}
    >
      {/* Badge destaque */}
      {destaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            ⭐ Recomendado
          </span>
        </div>
      )}

      {/* Badge plano atual */}
      {ehAtual && (
        <div className="absolute top-4 right-4">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full">
            ✓ Seu plano
          </span>
        </div>
      )}

      {/* Nome e preço */}
      <div className="mb-5">
        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {plano.nome}
        </h3>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          {plano.descricao}
        </p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatarPreco(plano.preco_mensal)}
          </span>
          {plano.preco_mensal > 0 && (
            <span className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>/mês</span>
          )}
        </div>
        {plano.preco_anual > 0 && plano.preco_mensal > 0 && (
          <p className="text-emerald-400 text-xs mt-1">
            ou {formatarPreco(plano.preco_anual)}/ano (economize{' '}
            {Math.round((1 - plano.preco_anual / (plano.preco_mensal * 12)) * 100)}%)
          </p>
        )}
      </div>

      {/* Limites */}
      <div
        className="flex gap-4 mb-5 pb-5"
        style={{ borderBottom: '1px solid var(--color-surface-border)' }}
      >
        <div className="text-center">
          <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{plano.limite_usuarios}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>usuários</p>
        </div>
        <div className="text-center">
          <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {plano.limite_contatos >= 50000 ? '∞' : plano.limite_contatos.toLocaleString('pt-BR')}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>contatos</p>
        </div>
      </div>

      {/* Recursos */}
      <div className="flex-1 space-y-2.5 mb-6">
        {recursos.map(recurso => (
          <div key={recurso.slug} className="flex items-center gap-2.5">
            <span className={`text-sm flex-shrink-0 ${recurso.habilitado ? 'opacity-100' : 'opacity-30'}`}>
              {ICONES_RECURSO[recurso.slug] || '•'}
            </span>
            <span
              className={`text-sm ${recurso.habilitado ? '' : 'line-through opacity-50'}`}
              style={{ color: recurso.habilitado ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
            >
              {recurso.nome}
              {recurso.limite && ` (até ${recurso.limite.toLocaleString('pt-BR')})`}
            </span>
            {recurso.habilitado
              ? <span className="ml-auto text-emerald-400 text-xs">✓</span>
              : <span className="ml-auto text-xs opacity-40" style={{ color: 'var(--color-text-secondary)' }}>✗</span>
            }
          </div>
        ))}
      </div>

      {/* Botão */}
      <button
        onClick={() => !ehAtual && onSelecionar(plano)}
        disabled={ehAtual}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
          ehAtual
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
            : destaque
              ? 'bg-primary-600 hover:bg-primary-500 text-white'
              : 'hover:bg-white/5'
        }`}
        style={ehAtual || destaque ? undefined : {
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {ehAtual ? '✓ Plano atual' : plano.preco_mensal === 0 ? 'Começar grátis' : 'Fazer upgrade'}
      </button>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL
// ----------------------------------------------------------
const SecaoPlano = () => {
  // O plano vem do tenantStore, já carregado pelo layout do cliente.
  const planoAtual = useTenantStore((s) => s.tenant?.plano) || 'starter';

  const [planos, setPlanos]         = useState([]);
  const [recursos, setRecursos]     = useState({});
  const [carregando, setCarregando] = useState(true);
  const [modalUpgrade, setModalUpgrade] = useState(null);

  useEffect(() => {
    const carregar = async () => {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*, recursos_plano(*)')
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        if (error) throw error;
        if (!data?.length) throw new Error('Nenhum plano ativo cadastrado.');

        setPlanos(data);
        setRecursos(
          data.reduce((mapa, p) => ({ ...mapa, [p.slug]: p.recursos_plano || [] }), {})
        );
      } catch {
        setPlanos(PLANOS_FALLBACK);
        setRecursos(RECURSOS_FALLBACK);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Carregando planos...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho da seção */}
      <div className="text-center mb-10">
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          🚀 Plano da organização
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Comece grátis e faça upgrade quando precisar de mais recursos.
        </p>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[...planos]
          .sort((a, b) => a.ordem - b.ordem)
          .map(plano => (
            <CardPlano
              key={plano.id || plano.slug}
              plano={plano}
              recursos={recursos[plano.slug] || []}
              planoAtual={planoAtual}
              onSelecionar={setModalUpgrade}
            />
          ))
        }
      </div>

      {/* FAQ */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
      >
        <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Perguntas frequentes
        </h3>
        <div className="space-y-4">
          {[
            { p: 'Posso cancelar a qualquer momento?', r: 'Sim. Não há fidelidade. Você pode cancelar ou fazer downgrade quando quiser.' },
            { p: 'O que acontece com meus dados se eu cancelar?', r: 'Seus dados ficam disponíveis por 30 dias após o cancelamento para exportação.' },
            { p: 'Posso mudar de plano no meio do mês?', r: 'Sim. O valor é calculado proporcionalmente ao período restante.' },
          ].map((item) => (
            <div
              key={item.p}
              className="pb-4 last:pb-0"
              style={{ borderBottom: '1px solid var(--color-surface-border)' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>{item.p}</p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{item.r}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de upgrade */}
      {modalUpgrade && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 w-full max-w-md"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
          >
            <div className="text-center mb-5">
              <p className="text-4xl mb-3">🚀</p>
              <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Upgrade para {modalUpgrade.nome}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                O processo de pagamento estará disponível em breve. Entre em contato com nosso suporte para fazer o upgrade agora.
              </p>
            </div>
            <div
              className="rounded-xl p-4 mb-5"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}
            >
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                📧 <a href="mailto:suporte@prancheto.ia" className="text-primary-400 hover:underline">suporte@prancheto.ia</a>
              </p>
            </div>
            <button
              onClick={() => setModalUpgrade(null)}
              className="w-full py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-surface-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecaoPlano;
