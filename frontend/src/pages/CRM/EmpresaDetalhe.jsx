// =============================================================
// PRANCHETO.IA - DETALHES DA EMPRESA (VISÃO 360° B2B)
// Emitly Design System & ReUI Components
// =============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building02Icon,
  ArrowLeft01Icon,
  Location01Icon,
  Call02Icon,
  WhatsappIcon,
  Mail01Icon,
  Globe02Icon,
  PlusSignIcon,
  Edit02Icon,
  AiSparklesIcon,
  UserGroupIcon,
  Briefcase02Icon,
  Note01Icon,
  Copy01Icon,
  CheckmarkCircle02Icon,
  LinkSquare02Icon,
  FlashIcon,
  Delete02Icon,
  CrownIcon,
  CoinsDollarIcon,
  Wrench01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/reui/tabs';
import { Badge } from '@/components/reui/badge';
import { SimpleTooltip } from '@/components/reui/tooltip';
import { Avatar } from '@/components/ui/avatar';
import { SelectField } from '@/components/ui/select';

import {
  useEmpresas,
  STATUS_EMPRESA_OPCOES,
  PORTE_EMPRESA_OPCOES,
  PAPEIS_DECISAO_OPCOES,
  formatarMoeda,
  formatarData,
  formatarDataHora,
  tempoRelativo,
} from '../../hooks/useCRM.js';
import ModalEmpresa from '../../components/crm/ModalEmpresa.jsx';

const ICONES_PAPEL = {
  decisor: CrownIcon,
  influenciador: FlashIcon,
  financeiro: CoinsDollarIcon,
  tecnico: Wrench01Icon,
  usuario: UserIcon,
};

const EmpresaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { obterEmpresaPorId, atualizar, vincularContato, desvincularContato } = useEmpresas();

  const [empresa, setEmpresa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [copiadoEndereco, setCopiadoEndereco] = useState(false);

  // Estados de modal
  const [modalEditarAberta, setModalEditarAberta] = useState(false);
  const [modalNovoContato, setModalNovoContato] = useState(false);
  const [modalNovoNegocio, setModalNovoNegocio] = useState(false);

  // Estado da timeline de notas locais
  const [notasLocais, setNotasLocais] = useState([]);
  const [novaNota, setNovaNota] = useState('');
  const [salvandoNota, setSalvandoNota] = useState(false);

  // Formulário de novo contato vinculado
  const [formContato, setFormContato] = useState({
    nome: '',
    cargo: '',
    email: '',
    whatsapp: '',
    papel_decisao: 'decisor',
  });

  // Formulário de novo negócio
  const [formNegocio, setFormNegocio] = useState({
    nome: '',
    valor_estimado: '',
    status_funil: 'nao_chamei',
  });

  // Carrega os dados da empresa
  const carregarEmpresa = async () => {
    setCarregando(true);
    try {
      const data = await obterEmpresaPorId(id);
      setEmpresa(data);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarEmpresa();
  }, [id, obterEmpresaPorId]);

  // Endereço formatado e link para Maps
  const enderecoCompleto = useMemo(() => {
    if (!empresa?.endereco) return '';
    const { logradouro, numero, complemento, bairro, cidade, estado, cep } = empresa.endereco;
    const partes = [
      logradouro && (numero ? `${logradouro}, ${numero}` : logradouro),
      complemento,
      bairro,
      cidade && (estado ? `${cidade} - ${estado}` : cidade),
      cep && `CEP ${cep}`,
    ].filter(Boolean);
    return partes.join(', ');
  }, [empresa]);

  const mapsUrl = useMemo(() => {
    if (!enderecoCompleto) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${empresa?.nome_fantasia || ''} ${enderecoCompleto}`
    )}`;
  }, [empresa, enderecoCompleto]);

  const copiarEndereco = () => {
    if (!enderecoCompleto) return;
    navigator.clipboard.writeText(enderecoCompleto);
    setCopiadoEndereco(true);
    setTimeout(() => setCopiadoEndereco(false), 2500);
  };

  // Helper de badges
  const badgeStatus = useMemo(() => {
    const opt = STATUS_EMPRESA_OPCOES.find(o => o.value === empresa?.status) || STATUS_EMPRESA_OPCOES[0];
    return <Badge variant={opt.cor || 'default'} size="md">{opt.label}</Badge>;
  }, [empresa?.status]);

  const badgePorte = useMemo(() => {
    const opt = PORTE_EMPRESA_OPCOES.find(o => o.value === empresa?.porte);
    if (!opt) return null;
    return <Badge variant="outline" size="md">{opt.label}</Badge>;
  }, [empresa?.porte]);

  // Ações de vincular contato e negócio
  const handleAdicionarContato = async (e) => {
    e.preventDefault();
    if (!formContato.nome.trim()) return;

    const novoContato = {
      id: `ct-${Date.now()}`,
      nome: formContato.nome,
      cargo: formContato.cargo,
      email: formContato.email,
      whatsapp: formContato.whatsapp,
      papel_decisao: formContato.papel_decisao,
    };

    await vincularContato(empresa.id, novoContato);
    setFormContato({ nome: '', cargo: '', email: '', whatsapp: '', papel_decisao: 'decisor' });
    setModalNovoContato(false);
    await carregarEmpresa();
  };

  const handleRemoverContato = async (contatoId) => {
    if (confirm('Deseja desvincular este contato da empresa?')) {
      await desvincularContato(empresa.id, contatoId);
      await carregarEmpresa();
    }
  };

  const handleAdicionarNegocio = async (e) => {
    e.preventDefault();
    if (!formNegocio.nome.trim()) return;

    const novoDeal = {
      id: `deal-${Date.now()}`,
      nome: formNegocio.nome,
      valor_estimado: Number(formNegocio.valor_estimado) || 0,
      status_funil: formNegocio.status_funil,
      criado_em: new Date().toISOString(),
    };

    const novosNegocios = [...(empresa.negocios || []), novoDeal];
    await atualizar(empresa.id, { negocios: novosNegocios });
    setFormNegocio({ nome: '', valor_estimado: '', status_funil: 'nao_chamei' });
    setModalNovoNegocio(false);
    await carregarEmpresa();
  };

  const handleAdicionarNota = (e) => {
    e.preventDefault();
    if (!novaNota.trim()) return;

    setSalvandoNota(true);
    const nota = {
      id: `nt-${Date.now()}`,
      texto: novaNota,
      autor: 'Você (Comercial)',
      criado_em: new Date().toISOString(),
    };
    setNotasLocais(prev => [nota, ...prev]);
    setNovaNota('');
    setSalvandoNota(false);
  };

  if (carregando) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-ink-primary">
        <div className="w-8 h-8 border-3 border-brand-secondary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-ink-secondary">Carregando detalhes da empresa...</p>
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8 text-ink-primary text-center">
        <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-ink-secondary mb-4">
          <HugeiconsIcon icon={Building02Icon} size={28} />
        </div>
        <h2 className="text-xl font-bold">Empresa não encontrada</h2>
        <p className="text-sm text-ink-secondary mt-1 mb-6">
          A empresa solicitada pode ter sido removida ou o link é inválido.
        </p>
        <button
          type="button"
          onClick={() => navigate('/crm/empresas')}
          className="px-5 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold text-sm shadow-sm transition-all"
        >
          Voltar para Empresas
        </button>
      </div>
    );
  }

  const contatos = empresa.contatos || [];
  const negocios = empresa.negocios || [];

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-surface-primary text-ink-primary overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-5 w-full">
        {/* ─────────────────────────────────────────────────────────
            VOLTAR E NAVEGAÇÃO DE TOPO
           ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <SimpleTooltip content="Retornar à lista de empresas">
            <button
              type="button"
              onClick={() => navigate('/crm/empresas')}
              className="inline-flex items-center gap-2 text-xs font-bold text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer group"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Voltar para Empresas Cadastradas
            </button>
          </SimpleTooltip>

          <div className="flex items-center gap-2">
            <SimpleTooltip content="Editar cadastro desta empresa">
              <button
                type="button"
                onClick={() => setModalEditarAberta(true)}
                className="px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-hover text-ink-primary text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <HugeiconsIcon icon={Edit02Icon} size={15} />
                Editar Cadastro
              </button>
            </SimpleTooltip>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            HERO HEADER DA CONTA: LOGOTIPO, NOME, BADGES E AÇÕES RÁPIDAS
           ───────────────────────────────────────────────────────── */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Logo e Informações Principais */}
            <div className="flex items-start sm:items-center gap-4">
              <Avatar
                src={empresa.logotipo_url}
                alt={empresa.nome_fantasia}
                fallback={empresa.nome_fantasia}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border border-surface-border bg-surface-subtle shadow-xs shrink-0 text-xl font-extrabold"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-ink-primary">
                    {empresa.nome_fantasia}
                  </h1>
                  {badgeStatus}
                  {badgePorte}
                </div>

                {empresa.razao_social && (
                  <p className="text-xs sm:text-sm text-ink-secondary">
                    {empresa.razao_social}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary pt-1 font-mono">
                  {empresa.cnpj && <span>CNPJ: {empresa.cnpj}</span>}
                  {empresa.segmento && (
                    <span className="font-sans font-medium text-ink-primary bg-surface-subtle px-2 py-0.5 rounded-md border border-surface-border">
                      {empresa.segmento}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ações Rápidas de Contato (WhatsApp, Telefone, Site, Maps) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {empresa.whatsapp_geral && (
                <SimpleTooltip content="Chamar no WhatsApp">
                  <a
                    href={`https://wa.me/55${empresa.whatsapp_geral.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <HugeiconsIcon icon={WhatsappIcon} size={16} />
                    WhatsApp
                  </a>
                </SimpleTooltip>
              )}

              {empresa.telefone_geral && (
                <SimpleTooltip content="Ligar para a empresa">
                  <a
                    href={`tel:${empresa.telefone_geral.replace(/\D/g, '')}`}
                    className="px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-ink-primary border border-surface-border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <HugeiconsIcon icon={Call02Icon} size={16} />
                    {empresa.telefone_geral}
                  </a>
                </SimpleTooltip>
              )}

              {empresa.site && (
                <SimpleTooltip content="Visitar website oficial">
                  <a
                    href={empresa.site.startsWith('http') ? empresa.site : `https://${empresa.site}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-surface-subtle hover:bg-surface-hover text-ink-primary border border-surface-border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <HugeiconsIcon icon={Globe02Icon} size={16} />
                    Website
                  </a>
                </SimpleTooltip>
              )}

              {mapsUrl && (
                <SimpleTooltip content="Ver localização no Google Maps">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <HugeiconsIcon icon={Location01Icon} size={16} />
                    Ver no Maps
                  </a>
                </SimpleTooltip>
              )}
            </div>
          </div>

          {/* Endereço Completo em Destaque */}
          {enderecoCompleto && (
            <div className="mt-5 pt-4 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-secondary bg-surface-subtle/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
              <div className="flex items-center gap-2 min-w-0">
                <HugeiconsIcon icon={Location01Icon} size={16} className="text-brand-secondary shrink-0" />
                <span className="truncate">{enderecoCompleto}</span>
              </div>
              <SimpleTooltip content="Copiar endereço formatado">
                <button
                  type="button"
                  onClick={copiarEndereco}
                  className="inline-flex items-center gap-1 font-semibold text-brand-secondary hover:underline cursor-pointer shrink-0"
                >
                  <HugeiconsIcon icon={copiadoEndereco ? CheckmarkCircle02Icon : Copy01Icon} size={14} />
                  {copiadoEndereco ? 'Endereço copiado!' : 'Copiar endereço'}
                </button>
              </SimpleTooltip>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────
            FAIXA DE KPIS DA CONTA (MÉTRICAS FINANCEIRAS E SAÚDE)
           ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Pipeline em Aberto</span>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {formatarMoeda(empresa.pipelineAtivo || 0)}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Negociações ativas</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Faturamento Acumulado (LTV)</span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatarMoeda(empresa.ltvGanho || 0)}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Contratos fechados e ganhos</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Equipe / Contatos</span>
            <div className="text-xl sm:text-2xl font-extrabold text-ink-primary mt-1">
              {contatos.length}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Pessoas vinculadas à conta</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Saúde da Conta (Health Score)</span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-purple dark:text-brand-violet mt-1 flex items-center gap-1.5">
              <span>{empresa.health_score || 90}/100</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                Alta
              </span>
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Nível de engajamento B2B</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            ABAS DE CONTEÚDO REUI (CONTATOS, NEGÓCIOS, HISTÓRICO, IA, DADOS)
           ───────────────────────────────────────────────────────── */}
        <Tabs defaultValue="contatos" className="w-full space-y-4">
          <TabsList className="bg-surface-card border border-surface-border p-1 rounded-2xl w-full sm:w-auto overflow-x-auto justify-start">
            <TabsTrigger value="contatos" className="text-xs font-bold gap-1.5">
              <HugeiconsIcon icon={UserGroupIcon} size={16} />
              Contatos Vinculados ({contatos.length})
            </TabsTrigger>
            <TabsTrigger value="negocios" className="text-xs font-bold gap-1.5">
              <HugeiconsIcon icon={Briefcase02Icon} size={16} />
              Negócios & Oportunidades ({negocios.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs font-bold gap-1.5">
              <HugeiconsIcon icon={Note01Icon} size={16} />
              Histórico & Atividades
            </TabsTrigger>
            <TabsTrigger value="ia" className="text-xs font-bold gap-1.5">
              <HugeiconsIcon icon={AiSparklesIcon} size={16} />
              Raio-X Inteligente IA
            </TabsTrigger>
            <TabsTrigger value="dados" className="text-xs font-bold gap-1.5">
              <HugeiconsIcon icon={Building02Icon} size={16} />
              Dados Fiscais & Endereço
            </TabsTrigger>
          </TabsList>

          {/* ── ABA 1: CONTATOS VINCULADOS ── */}
          <TabsContent value="contatos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-primary">Stakeholders e Equipe</h3>
                <p className="text-xs text-ink-secondary">
                  Tomadores de decisão e contatos operacionais associados a esta organização.
                </p>
              </div>
              <SimpleTooltip content="Cadastrar e vincular contato">
                <button
                  type="button"
                  onClick={() => setModalNovoContato(true)}
                  className="px-4 py-2 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  Vincular Contato
                </button>
              </SimpleTooltip>
            </div>

            {contatos.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-surface-border p-8 text-center">
                <p className="text-sm text-ink-secondary">Nenhum contato vinculado a esta empresa ainda.</p>
                <button
                  type="button"
                  onClick={() => setModalNovoContato(true)}
                  className="mt-3 text-xs font-bold text-brand-secondary hover:underline"
                >
                  Adicionar o primeiro contato
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contatos.map((c) => {
                  const papelOpt = PAPEIS_DECISAO_OPCOES.find(p => p.value === c.papel_decisao);

                  return (
                    <div
                      key={c.id}
                      className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={c.avatar}
                            alt={c.nome}
                            fallback={c.nome}
                            className="w-10 h-10 rounded-xl border border-surface-border bg-surface-subtle font-bold text-xs"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-ink-primary">{c.nome}</h4>
                            <p className="text-xs text-ink-secondary">{c.cargo || 'Cargo não informado'}</p>
                          </div>
                        </div>

                        {papelOpt && (
                          <SimpleTooltip content={papelOpt.label}>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-secondary/10 border border-brand-secondary/25 text-brand-secondary text-xs font-semibold">
                              <HugeiconsIcon icon={ICONES_PAPEL[c.papel_decisao] || UserIcon} size={15} />
                              <span className="hidden sm:inline">{papelOpt.label}</span>
                            </div>
                          </SimpleTooltip>
                        )}
                      </div>

                      {/* Informações de contato */}
                      <div className="space-y-1.5 text-xs text-ink-secondary pt-2 border-t border-surface-border/70">
                        {c.email && (
                          <div className="flex items-center gap-2 truncate">
                            <HugeiconsIcon icon={Mail01Icon} size={14} className="shrink-0" />
                            <a href={`mailto:${c.email}`} className="truncate hover:underline text-ink-primary">
                              {c.email}
                            </a>
                          </div>
                        )}
                        {c.whatsapp && (
                          <div className="flex items-center gap-2">
                            <HugeiconsIcon icon={WhatsappIcon} size={14} className="shrink-0 text-emerald-500" />
                            <a
                              href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline text-ink-primary"
                            >
                              {c.whatsapp}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Ações do contato */}
                      <div className="flex items-center justify-between pt-2 border-t border-surface-border/70">
                        <SimpleTooltip content="Abrir ficha detalhada do contato">
                          <button
                            type="button"
                            onClick={() => navigate(`/crm/leads/${c.id}`)}
                            className="text-xs font-bold text-brand-secondary hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            Ver perfil
                            <HugeiconsIcon icon={LinkSquare02Icon} size={13} />
                          </button>
                        </SimpleTooltip>

                        <SimpleTooltip content="Desvincular contato desta organização">
                          <button
                            type="button"
                            onClick={() => handleRemoverContato(c.id)}
                            className="text-xs text-ink-secondary hover:text-red-500 transition-colors cursor-pointer"
                          >
                            Desvincular
                          </button>
                        </SimpleTooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── ABA 2: NEGÓCIOS & OPORTUNIDADES ── */}
          <TabsContent value="negocios" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-ink-primary">Pipeline de Negócios da Conta</h3>
                <p className="text-xs text-ink-secondary">
                  Histórico de negociações em andamento e negócios já fechados com esta organização.
                </p>
              </div>
              <SimpleTooltip content="Criar nova oportunidade comercial">
                <button
                  type="button"
                  onClick={() => setModalNovoNegocio(true)}
                  className="px-4 py-2 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  Novo Negócio
                </button>
              </SimpleTooltip>
            </div>

            {negocios.length === 0 ? (
              <div className="bg-surface-card rounded-2xl border border-surface-border p-8 text-center">
                <p className="text-sm text-ink-secondary">Nenhum negócio registrado para esta empresa.</p>
                <button
                  type="button"
                  onClick={() => setModalNovoNegocio(true)}
                  className="mt-3 text-xs font-bold text-brand-secondary hover:underline"
                >
                  Registrar primeira oportunidade
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {negocios.map((deal) => {
                  const isGanho = ['deu_bom', 'fechado'].includes(deal.status_funil);
                  const isPerdido = ['deu_ruim', 'perdido'].includes(deal.status_funil);

                  let badgeEtapa = <Badge variant="secondary" size="sm">{deal.status_funil}</Badge>;
                  if (deal.status_funil === 'nao_chamei') badgeEtapa = <Badge variant="default" size="sm">Não Chamei</Badge>;
                  if (deal.status_funil === 'chamei') badgeEtapa = <Badge variant="primary" size="sm">Chamei</Badge>;
                  if (deal.status_funil === 'chamar_novamente') badgeEtapa = <Badge variant="warning" size="sm">Chamar Novamente</Badge>;
                  if (isGanho) badgeEtapa = <Badge variant="success" size="sm">Deu Bom! (Fechado)</Badge>;
                  if (isPerdido) badgeEtapa = <Badge variant="destructive" size="sm">Deu Ruim (Perdido)</Badge>;

                  return (
                    <div
                      key={deal.id}
                      onClick={() => navigate(`/crm/leads/${deal.id}`)}
                      className="bg-surface-card rounded-2xl p-4 border border-surface-border hover:border-brand-secondary/40 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-ink-primary group-hover:text-brand-secondary transition-colors">
                            {deal.nome || deal.negocio_nome || 'Oportunidade Comercial'}
                          </h4>
                          {badgeEtapa}
                        </div>
                        <span className="text-xs text-ink-secondary block">
                          Cadastrado em {formatarData(deal.criado_em)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-ink-primary block">
                            {formatarMoeda(deal.valor_estimado || 0)}
                          </span>
                          <span className="text-[11px] text-ink-secondary">Valor Estimado</span>
                        </div>
                        <span className="text-xs font-bold text-brand-secondary group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── ABA 3: HISTÓRICO & ATIVIDADES ── */}
          <TabsContent value="historico" className="space-y-4">
            <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-2xs">
              <h3 className="font-bold text-sm text-ink-primary mb-3">Registrar Nota ou Interação com a Conta</h3>
              <form onSubmit={handleAdicionarNota} className="space-y-3">
                <textarea
                  rows={3}
                  value={novaNota}
                  onChange={(e) => setNovaNota(e.target.value)}
                  placeholder="Ex: Reunião com diretoria sobre expansão de contrato. Solicitaram proposta até sexta-feira..."
                  className="w-full rounded-xl p-3 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 resize-none transition-all"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={salvandoNota || !novaNota.trim()}
                    className="px-4 py-2 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Salvar Registro
                  </button>
                </div>
              </form>
            </div>

            {/* Lista de Interações */}
            <div className="space-y-3">
              {notasLocais.map((nota) => (
                <div
                  key={nota.id}
                  className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-ink-secondary">
                    <span className="font-bold text-ink-primary">{nota.autor}</span>
                    <span>{tempoRelativo(nota.criado_em)}</span>
                  </div>
                  <p className="text-sm text-ink-secondary whitespace-pre-wrap">{nota.texto}</p>
                </div>
              ))}

              {/* Registro inicial de histórico */}
              <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-xs text-ink-secondary">
                  <span className="font-bold text-ink-primary">Sistema Prancheto.IA</span>
                  <span>{tempoRelativo(empresa.criado_em)}</span>
                </div>
                <p className="text-sm text-ink-secondary">
                  Empresa cadastrada no CRM e associada aos módulos corporativos.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA 4: RAIO-X INTELIGENTE IA (COPILOT) ── */}
          <TabsContent value="ia" className="space-y-4">
            <div className="bg-gradient-to-br from-brand-secondary/10 via-brand-purple/5 to-surface-card rounded-2xl p-6 border border-brand-secondary/30 shadow-2xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-secondary/20 border border-brand-secondary/40 flex items-center justify-center text-brand-secondary">
                  <HugeiconsIcon icon={AiSparklesIcon} size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-ink-primary">
                    Diagnóstico Executivo do Pranchetinho IA
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Análise em tempo real sobre o momento da conta, nível de engajamento e próximas ações.
                  </p>
                </div>
              </div>

              {/* Resumo Gerado */}
              <div className="p-4 rounded-xl bg-surface-card/80 border border-surface-border text-sm text-ink-primary leading-relaxed space-y-2">
                <p>
                  <strong>Visão da Conta:</strong> A <strong>{empresa.nome_fantasia}</strong> é uma organização do segmento de <strong>{empresa.segmento || 'Serviços'}</strong> com porte <strong>{empresa.porte || 'médio'}</strong>. Apresenta um volume de <strong>{contatos.length} contatos</strong> cadastrados e um pipeline estimado em <strong>{formatarMoeda(empresa.pipelineAtivo || 0)}</strong>.
                </p>
                <p>
                  <strong>Health Score & Engajamento:</strong> Pontuação de <strong>{empresa.health_score || 90}/100</strong>, considerada excelente para o ciclo de vendas. Canais de comunicação prioritários: <strong>WhatsApp e E-mail institucional</strong>.
                </p>
              </div>

              {/* Próximas Ações Recomendadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-secondary">
                    <HugeiconsIcon icon={FlashIcon} size={15} />
                    Próxima Melhor Ação Recomendada
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Agendar demonstração técnica focada nos módulos de expansão com os tomadores de decisão da conta.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-card border border-surface-border space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} />
                    Aderência ao Perfil Ideal (ICP Fit)
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Alta aderência (94%). Conta com potencial para contratação de pacotes anuais e múltiplos usuários.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── ABA 5: DADOS FISCAIS & ENDEREÇO ── */}
          <TabsContent value="dados" className="space-y-4">
            <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-ink-primary">Informações Cadastrais e Fiscais</h3>
                <p className="text-xs text-ink-secondary">Dados jurídicos da organização para faturamento e contratos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">Nome Fantasia</span>
                  <span className="font-bold text-ink-primary">{empresa.nome_fantasia || '—'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">Razão Social</span>
                  <span className="font-bold text-ink-primary">{empresa.razao_social || '—'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">CNPJ</span>
                  <span className="font-bold font-mono text-ink-primary">{empresa.cnpj || '—'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">Segmento / CNAE</span>
                  <span className="font-bold text-ink-primary">{empresa.segmento || '—'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">E-mail Institucional</span>
                  <span className="font-bold text-ink-primary">{empresa.email_geral || '—'}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-subtle border border-surface-border">
                  <span className="text-xs font-semibold text-ink-secondary block">Telefone Central</span>
                  <span className="font-bold text-ink-primary">{empresa.telefone_geral || '—'}</span>
                </div>
              </div>

              {/* Endereço detalhado */}
              <div className="pt-4 border-t border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-ink-primary">Endereço da Sede</h4>
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-brand-secondary hover:underline flex items-center gap-1"
                    >
                      Abrir no Google Maps
                      <HugeiconsIcon icon={LinkSquare02Icon} size={13} />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-ink-secondary block">Logradouro</span>
                    <span className="font-semibold text-ink-primary">
                      {empresa.endereco?.logradouro || '—'}, {empresa.endereco?.numero || 'S/N'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-ink-secondary block">Bairro</span>
                    <span className="font-semibold text-ink-primary">{empresa.endereco?.bairro || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border">
                    <span className="text-ink-secondary block">Cidade / UF</span>
                    <span className="font-semibold text-ink-primary">
                      {empresa.endereco?.cidade || '—'} / {empresa.endereco?.estado || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {empresa.observacoes && (
                <div className="pt-4 border-t border-surface-border space-y-2">
                  <h4 className="font-bold text-sm text-ink-primary">Observações e Diretrizes</h4>
                  <p className="text-sm text-ink-secondary p-3.5 rounded-xl bg-surface-subtle border border-surface-border whitespace-pre-wrap">
                    {empresa.observacoes}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ─────────────────────────────────────────────────────────
          MODAIS AUXILIARES: EDITAR, NOVO CONTATO E NOVO NEGÓCIO
         ───────────────────────────────────────────────────────── */}
      <ModalEmpresa
        aberta={modalEditarAberta}
        empresaParaEditar={empresa}
        onFechar={() => setModalEditarAberta(false)}
        onSalvar={async (dados) => {
          await atualizar(empresa.id, dados);
          await carregarEmpresa();
        }}
      />

      {/* Modal: Vincular / Criar Novo Contato */}
      {modalNovoContato && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setModalNovoContato(false)}
        >
          <div
            className="bg-surface-card rounded-2xl p-6 w-full max-w-md border border-surface-border shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-ink-primary">Vincular Contato à Empresa</h3>
            <form onSubmit={handleAdicionarContato} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formContato.nome}
                  onChange={(e) => setFormContato(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Carlos Mendes"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Cargo / Função</label>
                <input
                  type="text"
                  value={formContato.cargo}
                  onChange={(e) => setFormContato(prev => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ex: Diretor de Operações"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Papel na Decisão B2B</label>
                <SelectField
                  value={formContato.papel_decisao}
                  onChange={(e) => setFormContato(prev => ({ ...prev, papel_decisao: e.target.value }))}
                >
                  {PAPEIS_DECISAO_OPCOES.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </SelectField>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formContato.email}
                    onChange={(e) => setFormContato(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="carlos@empresa.com"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-secondary mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formContato.whatsapp}
                    onChange={(e) => setFormContato(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setModalNovoContato(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-white text-xs font-bold hover:bg-brand-secondary/90 shadow-2xs"
                >
                  Adicionar Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Negócio */}
      {modalNovoNegocio && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          onClick={() => setModalNovoNegocio(false)}
        >
          <div
            className="bg-surface-card rounded-2xl p-6 w-full max-w-md border border-surface-border shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-base text-ink-primary">Nova Oportunidade / Negócio</h3>
            <form onSubmit={handleAdicionarNegocio} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Título do Negócio</label>
                <input
                  type="text"
                  required
                  value={formNegocio.nome}
                  onChange={(e) => setFormNegocio(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Expansão Módulo Enterprise"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Valor Estimado (R$)</label>
                <input
                  type="number"
                  value={formNegocio.valor_estimado}
                  onChange={(e) => setFormNegocio(prev => ({ ...prev, valor_estimado: e.target.value }))}
                  placeholder="Ex: 50000"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-surface-subtle border border-surface-border text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-secondary mb-1">Etapa Inicial</label>
                <SelectField
                  value={formNegocio.status_funil}
                  onChange={(e) => setFormNegocio(prev => ({ ...prev, status_funil: e.target.value }))}
                >
                  <option value="nao_chamei">Não Chamei</option>
                  <option value="chamei">Chamei</option>
                  <option value="chamar_novamente">Chamar Novamente</option>
                  <option value="deu_bom">Deu Bom! (Ganho)</option>
                </SelectField>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setModalNovoNegocio(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink-primary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-secondary text-white text-xs font-bold hover:bg-brand-secondary/90 shadow-2xs"
                >
                  Criar Negócio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmpresaDetalhe;

