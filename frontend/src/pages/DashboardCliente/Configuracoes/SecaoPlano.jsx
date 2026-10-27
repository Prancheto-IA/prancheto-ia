// =============================================================
// PRANCHETO.IA - SEÇÃO PLANO DA ORGANIZAÇÃO (EMITLY DESIGN SYSTEM)
// Gestão de assinatura, quotas de uso, alternância mensal/anual e
// comparativo de planos com o design system Emitly.
// =============================================================

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase.js';
import { useTenantStore } from '../../../store/tenantStore.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CrownIcon,
  Rocket01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  StarIcon,
  UserGroupIcon,
  Mail01Icon,
  HelpCircleIcon,
  CreditCardIcon,
  Shield01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  DatabaseIcon,
} from '@hugeicons/core-free-icons';

const formatarPreco = (valor) => {
  if (!valor || valor === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor);
};

// Planos padrão para exibição caso o banco ainda não tenha registros
const PLANOS_FALLBACK = [
  {
    id: '1',
    slug: 'starter',
    nome: 'Starter',
    descricao: 'Para profissionais autônomos e pequenas equipes iniciando a operação comercial.',
    preco_mensal: 0,
    preco_anual: 0,
    limite_usuarios: 5,
    limite_contatos: 500,
    destaque: false,
    ordem: 1,
  },
  {
    id: '2',
    slug: 'pro',
    nome: 'Pro',
    descricao: 'O pacote completo para times comerciais que precisam de escala e inteligência artificial.',
    preco_mensal: 97,
    preco_anual: 970,
    limite_usuarios: 20,
    limite_contatos: 5000,
    destaque: true,
    ordem: 2,
  },
  {
    id: '3',
    slug: 'enterprise',
    nome: 'Enterprise',
    descricao: 'Segurança dedicada, limites ilimitados e suporte consultivo para grandes operações.',
    preco_mensal: 297,
    preco_anual: 2970,
    limite_usuarios: 100,
    limite_contatos: 50000,
    destaque: false,
    ordem: 3,
  },
];

const RECURSOS_FALLBACK = {
  starter: [
    { slug: 'crm',           nome: 'Gestão de Funil e Negócios', habilitado: true,  limite: 500 },
    { slug: 'chat_ia',       nome: 'Assistente IA Integrado',    habilitado: false, limite: null },
    { slug: 'agenda',        nome: 'Agenda e Compromissos',      habilitado: false, limite: null },
    { slug: 'relatorios',    nome: 'Relatórios e Métricas',      habilitado: false, limite: null },
    { slug: 'outbound',      nome: 'Campanhas de Outbound',      habilitado: false, limite: null },
    { slug: 'configuracoes', nome: 'Membros e Organização',      habilitado: true,  limite: null },
  ],
  pro: [
    { slug: 'crm',           nome: 'Gestão de Funil e Negócios', habilitado: true,  limite: 5000 },
    { slug: 'chat_ia',       nome: 'Assistente IA Integrado',    habilitado: true,  limite: null },
    { slug: 'agenda',        nome: 'Agenda e Compromissos',      habilitado: true,  limite: null },
    { slug: 'relatorios',    nome: 'Relatórios e Métricas',      habilitado: true,  limite: null },
    { slug: 'outbound',      nome: 'Campanhas de Outbound',      habilitado: false, limite: null },
    { slug: 'configuracoes', nome: 'Membros e Organização',      habilitado: true,  limite: null },
  ],
  enterprise: [
    { slug: 'crm',           nome: 'Gestão de Funil e Negócios', habilitado: true, limite: null },
    { slug: 'chat_ia',       nome: 'Assistente IA Integrado',    habilitado: true, limite: null },
    { slug: 'agenda',        nome: 'Agenda e Compromissos',      habilitado: true, limite: null },
    { slug: 'relatorios',    nome: 'Relatórios e Métricas',      habilitado: true, limite: null },
    { slug: 'outbound',      nome: 'Campanhas de Outbound',      habilitado: true, limite: null },
    { slug: 'configuracoes', nome: 'Membros e Organização',      habilitado: true, limite: null },
  ],
};

const FAQS = [
  {
    pergunta: 'Como funciona a cobrança e o ciclo de faturamento?',
    resposta: 'Você pode escolher entre o faturamento mensal ou anual. Na cobrança anual, você recebe automaticamente um desconto de aproximadamente 20% no valor total do período.',
  },
  {
    pergunta: 'Posso alterar de plano ou cancelar a qualquer momento?',
    resposta: 'Sim. As mudanças de plano têm efeito imediato e cancelamentos não geram taxas adicionais nem fidelidade contratual.',
  },
  {
    pergunta: 'O que acontece quando atinjo o limite de contatos ou membros?',
    resposta: 'O sistema avisa proativamente quando você atingir 80% e 100% da cota. Seus dados permanecem seguros e você pode fazer o upgrade instantaneamente com 1 clique.',
  },
  {
    pergunta: 'Como funciona o Assistente de IA?',
    resposta: 'Nosso assistente nativo permite consultar dados, criar leads, redigir mensagens e consultar insights do CRM diretamente em linguagem natural.',
  },
];

// ----------------------------------------------------------
// COMPONENTE: Card de Plano Individual
// ----------------------------------------------------------
const CardPlano = ({ plano, recursos, planoAtual, cicloAnual, onSelecionar }) => {
  const ehAtual  = plano.slug === (planoAtual || 'starter');
  const destaque = plano.destaque;

  const precoExibido = cicloAnual
    ? (plano.preco_anual > 0 ? Math.round(plano.preco_anual / 12) : 0)
    : plano.preco_mensal;

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-7 flex flex-col transition-all duration-300 ${
        destaque
          ? 'bg-white border-2 border-[#0E382C] shadow-xl shadow-[#0E382C]/5 ring-4 ring-[#0E382C]/5'
          : 'bg-white border border-[#E4ECE7] shadow-xs hover:border-[#0E382C]/30 hover:shadow-md'
      } ${ehAtual ? 'ring-2 ring-emerald-600/30' : ''}`}
    >
      {/* Badge destaque */}
      {destaque && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="bg-[#0E382C] text-[#D4EC9D] text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap">
            <HugeiconsIcon icon={StarIcon} size={13} strokeWidth={2.5} />
            Mais Escolhido
          </span>
        </div>
      )}

      {/* Header do Card */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xl font-bold text-[#111915]">
            {plano.nome}
          </h3>
          <p className="text-xs text-[#687770] mt-1 line-clamp-2 leading-relaxed">
            {plano.descricao}
          </p>
        </div>
        {ehAtual && (
          <span className="bg-[#DCF5E4] text-[#15803D] border border-[#bbf0ca] text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
            <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} strokeWidth={2} />
            Seu plano
          </span>
        )}
      </div>

      {/* Preço */}
      <div className="py-3 border-y border-[#E4ECE7] my-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111915]">
            {formatarPreco(precoExibido)}
          </span>
          {plano.preco_mensal > 0 && (
            <span className="text-xs font-semibold text-[#687770]">/mês</span>
          )}
        </div>

        {cicloAnual && plano.preco_anual > 0 && (
          <p className="text-[11px] text-[#15803D] font-medium mt-1">
            Faturado anualmente ({formatarPreco(plano.preco_anual)}/ano)
          </p>
        )}
      </div>

      {/* Quotas principais */}
      <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C] shrink-0">
            <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#111915]">
              {plano.limite_usuarios >= 100 ? '100+' : plano.limite_usuarios}
            </p>
            <p className="text-[10px] text-[#687770]">usuários</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C] shrink-0">
            <HugeiconsIcon icon={DatabaseIcon} size={14} strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#111915]">
              {plano.limite_contatos >= 50000 ? 'Ilimitado' : (plano.limite_contatos / 1000) + 'k'}
            </p>
            <p className="text-[10px] text-[#687770]">contatos</p>
          </div>
        </div>
      </div>

      {/* Lista de recursos */}
      <div className="flex-1 space-y-3 my-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#687770]">
          Recursos inclusos:
        </p>
        {recursos.map((rec) => {
          return (
            <div key={rec.slug} className="flex items-center gap-2.5 text-xs">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                rec.habilitado
                  ? 'bg-[#DCF5E4] text-[#15803D]'
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <HugeiconsIcon
                  icon={rec.habilitado ? CheckmarkCircle02Icon : CancelCircleIcon}
                  size={14}
                  strokeWidth={2}
                />
              </span>
              <span className={`flex-1 font-medium ${
                rec.habilitado ? 'text-[#111915]' : 'text-slate-400 line-through'
              }`}>
                {rec.nome}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botão de Ação */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => !ehAtual && onSelecionar(plano)}
          disabled={ehAtual}
          className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            ehAtual
              ? 'bg-[#DCF5E4] text-[#15803D] border border-[#bbf0ca] cursor-default'
              : destaque
                ? 'bg-[#0E382C] hover:bg-[#154637] text-white shadow-xs cursor-pointer'
                : 'bg-[#F7FAF8] hover:bg-[#EDF2EE] text-[#0E382C] border border-[#E4ECE7] cursor-pointer'
          }`}
        >
          {ehAtual ? (
            <>
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} strokeWidth={2} />
              <span>Plano Atual</span>
            </>
          ) : (
            <>
              <span>{plano.preco_mensal === 0 ? 'Começar grátis' : 'Fazer upgrade'}</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: SecaoPlano
// ----------------------------------------------------------
const SecaoPlano = () => {
  const tenant = useTenantStore((s) => s.tenant);
  const planoAtual = tenant?.plano || 'starter';

  const [cicloAnual, setCicloAnual] = useState(false);
  const [planos, setPlanos]         = useState(PLANOS_FALLBACK);
  const [recursos, setRecursos]     = useState(RECURSOS_FALLBACK);
  const [carregando, setCarregando] = useState(true);
  const [modalUpgrade, setModalUpgrade] = useState(null);

  // Métricas reais de consumo da organização
  const [metricas, setMetricas] = useState({
    usuariosUsados: 1,
    usuariosLimite: 5,
    contatosUsados: 0,
    contatosLimite: 500,
  });

  useEffect(() => {
    const carregar = async () => {
      try {
        const { data, error } = await supabase
          .from('planos')
          .select('*, recursos_plano(*)')
          .eq('ativo', true)
          .order('ordem', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setPlanos(data);
          const mapaRecursos = data.reduce(
            (acc, p) => ({ ...acc, [p.slug]: p.recursos_plano || [] }),
            {}
          );
          setRecursos(mapaRecursos);
        }
      } catch {
        setPlanos(PLANOS_FALLBACK);
        setRecursos(RECURSOS_FALLBACK);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, []);

  // Busca cotas de uso do tenant atual
  useEffect(() => {
    const carregarMetricas = async () => {
      if (!tenant?.id) return;
      try {
        const [{ count: countUsers }, { count: countContatos }] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
          supabase.from('crm_contatos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        ]);

        const planoObj = planos.find((p) => p.slug === planoAtual) || planos[0];

        setMetricas({
          usuariosUsados: countUsers || 1,
          usuariosLimite: planoObj?.limite_usuarios || 5,
          contatosUsados: countContatos || 0,
          contatosLimite: planoObj?.limite_contatos || 500,
        });
      } catch (e) {
        console.warn('Erro ao carregar métricas de plano:', e);
      }
    };

    carregarMetricas();
  }, [tenant?.id, planoAtual, planos]);

  const planoAtivoObj = planos.find((p) => p.slug === planoAtual) || planos[0];
  const percUsuarios = Math.min(100, Math.round((metricas.usuariosUsados / (metricas.usuariosLimite || 1)) * 100));
  const percContatos = Math.min(100, Math.round((metricas.contatosUsados / (metricas.contatosLimite || 1)) * 100));

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-[#E4ECE7] shadow-xs">
        <div className="text-center">
          <div className="w-9 h-9 border-3 border-[#E4ECE7] border-t-[#0E382C] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-[#687770]">Carregando planos e recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. HERO BANNER: Status da Assinatura Atual & Quotas */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0E382C] to-[#124234] text-white p-6 sm:p-8 shadow-sm">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4EC9D]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Informações da Assinatura */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-[#D4EC9D] text-[#0E382C] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                <HugeiconsIcon icon={CrownIcon} size={13} strokeWidth={2.5} />
                Plano Ativo
              </span>
              <span className="text-xs text-emerald-200/90 font-medium">
                Renovação automática
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Plano {planoAtivoObj?.nome || 'Starter'}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-lg leading-relaxed">
                {planoAtivoObj?.descricao || 'Sua organização está operando com todos os benefícios ativos.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalUpgrade(planos.find(p => p.slug === 'pro') || planos[1])}
                className="bg-[#D4EC9D] hover:bg-[#c2de85] text-[#0E382C] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <HugeiconsIcon icon={Rocket01Icon} size={16} strokeWidth={2} />
                <span>Mudar de Plano</span>
              </button>

              <a
                href="mailto:suporte@prancheto.ia?subject=Faturamento%20e%20Notas"
                className="bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all border border-white/10 flex items-center gap-2"
              >
                <HugeiconsIcon icon={CreditCardIcon} size={16} strokeWidth={1.8} />
                <span>Histórico de Faturas</span>
              </a>
            </div>
          </div>

          {/* Medidores de Quota / Consumo */}
          <div className="lg:col-span-5 bg-black/20 backdrop-blur-xs rounded-2xl p-5 border border-white/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200/90 flex items-center gap-1.5">
              <HugeiconsIcon icon={Shield01Icon} size={14} strokeWidth={2} />
              Consumo de Recursos
            </h4>

            {/* Usuários */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={UserGroupIcon} size={14} strokeWidth={1.8} />
                  Membros da Equipe
                </span>
                <span className="text-emerald-200">
                  {metricas.usuariosUsados} de {metricas.usuariosLimite}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-[#D4EC9D] rounded-full transition-all duration-500"
                  style={{ width: `${percUsuarios}%` }}
                />
              </div>
            </div>

            {/* Contatos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={DatabaseIcon} size={14} strokeWidth={1.8} />
                  Contatos Cadastrados
                </span>
                <span className="text-emerald-200">
                  {metricas.contatosUsados.toLocaleString('pt-BR')} de {metricas.contatosLimite.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${percContatos}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-emerald-100/70 pt-1 leading-tight">
              Precisa de capacidade ilimitada ou migração assistida? Fale com nosso suporte.
            </p>
          </div>
        </div>
      </div>

      {/* 2. CABEÇALHO & SELETOR DE CICLO (MENSAL / ANUAL) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-[#111915]">
            Planos Comerciais Disponíveis
          </h3>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Evolua sua assinatura conforme sua operação cresce. Sem multas ou fidelidade.
          </p>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#F7FAF8] border border-[#E4ECE7] self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setCicloAnual(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              !cicloAnual
                ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                : 'text-[#687770] hover:text-[#111915]'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCicloAnual(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              cicloAnual
                ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                : 'text-[#687770] hover:text-[#111915]'
            }`}
          >
            <span>Anual</span>
            <span className="bg-[#DCF5E4] text-[#15803D] text-[10px] font-bold px-2 py-0.5 rounded-full">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* 3. GRID DE CARDS DE PLANOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {[...planos]
          .sort((a, b) => a.ordem - b.ordem)
          .map((plano) => (
            <CardPlano
              key={plano.id || plano.slug}
              plano={plano}
              recursos={recursos[plano.slug] || []}
              planoAtual={planoAtual}
              cicloAnual={cicloAnual}
              onSelecionar={setModalUpgrade}
            />
          ))}
      </div>

      {/* 4. PERGUNTAS FREQUENTES (FAQ) */}
      <div className="bg-white rounded-3xl border border-[#E4ECE7] p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-[#DCF5E4] text-[#0E382C] flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={HelpCircleIcon} size={20} strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#111915]">
              Dúvidas Frequentes sobre Assinaturas
            </h3>
            <p className="text-xs text-[#687770]">
              Tudo o que você precisa saber sobre faturamento e suporte.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {FAQS.map((faq) => (
            <div
              key={faq.pergunta}
              className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E4ECE7]"
            >
              <h4 className="text-xs sm:text-sm font-bold text-[#111915] mb-1.5">
                {faq.pergunta}
              </h4>
              <p className="text-xs text-[#687770] leading-relaxed">
                {faq.resposta}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. MODAL DE UPGRADE */}
      {modalUpgrade && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModalUpgrade(null)}
        >
          <div
            className="bg-white rounded-3xl border border-[#E4ECE7] shadow-2xl p-6 sm:p-8 max-w-md w-full relative animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              onClick={() => setModalUpgrade(null)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-[#F7FAF8] transition-colors"
              title="Fechar modal"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
            </button>

            {/* Ícone & Título */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#DCF5E4] text-[#0E382C] flex items-center justify-center mx-auto mb-4 shadow-xs">
                <HugeiconsIcon icon={Rocket01Icon} size={28} strokeWidth={1.8} />
              </div>
              <h3 className="text-xl font-bold text-[#111915]">
                Upgrade para o {modalUpgrade.nome}
              </h3>
              <p className="text-xs sm:text-sm text-[#687770] mt-1.5 leading-relaxed">
                Desbloqueie {modalUpgrade.limite_usuarios} membros, até {modalUpgrade.limite_contatos.toLocaleString('pt-BR')} contatos e recursos de Inteligência Artificial para alavancar seu CRM.
              </p>
            </div>

            {/* Card com Detalhes do Pagamento */}
            <div className="p-4 rounded-2xl bg-[#F7FAF8] border border-[#E4ECE7] mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#687770]">Valor da assinatura:</span>
                <span className="font-bold text-[#111915]">
                  {formatarPreco(cicloAnual && modalUpgrade.preco_anual > 0 ? modalUpgrade.preco_anual / 12 : modalUpgrade.preco_mensal)}/mês
                </span>
              </div>
              {cicloAnual && modalUpgrade.preco_anual > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#687770]">Total anual:</span>
                  <span className="font-bold text-[#15803D]">
                    {formatarPreco(modalUpgrade.preco_anual)}/ano (-20%)
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E4ECE7]">
                <span className="text-[#687770]">Status de ativação:</span>
                <span className="font-semibold text-emerald-700">Imediata</span>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2.5">
              <a
                href={`mailto:suporte@prancheto.ia?subject=Upgrade%20para%20Plano%20${modalUpgrade.nome}&body=Olá!%20Gostaria%20de%20ativar%20o%20plano%20${modalUpgrade.nome}%20para%20a%20minha%20organização.`}
                className="w-full py-3 px-4 rounded-xl bg-[#0E382C] hover:bg-[#154637] text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <HugeiconsIcon icon={Mail01Icon} size={16} strokeWidth={2} />
                <span>Solicitar Ativação com Suporte</span>
              </a>

              <button
                type="button"
                onClick={() => setModalUpgrade(null)}
                className="w-full py-2.5 text-xs text-[#687770] hover:text-[#111915] font-semibold text-center"
              >
                Voltar aos planos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecaoPlano;
