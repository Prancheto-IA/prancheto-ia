// =============================================================
// PRANCHETO.IA - LISTAGEM DE EMPRESAS (FORMATO LISTA)
// Emitly Design System & ReUI Components
// =============================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Building02Icon,
  Search01Icon,
  PlusSignIcon,
  Location01Icon,
  WhatsappIcon,
  Globe02Icon,
  ArrowRight01Icon,
  Edit02Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';

import { Badge } from '@/components/reui/badge';
import { SimpleTooltip } from '@/components/reui/tooltip';
import { SelectField } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  useEmpresas,
  STATUS_EMPRESA_OPCOES,
  PORTE_EMPRESA_OPCOES,
  formatarMoeda,
} from '../../hooks/useCRM.js';
import ModalEmpresa from '../../components/crm/ModalEmpresa.jsx';

const Empresas = () => {
  const navigate = useNavigate();
  const { empresas, carregando, carregar, criar, atualizar, excluir } = useEmpresas();

  // Estados de controle e filtros
  const [busca, setBusca] = useState('');
  const [filtroPorte, setFiltroPorte] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  // Estados de modal
  const [modalAberta, setModalAberta] = useState(false);
  const [empresaParaEditar, setEmpresaParaEditar] = useState(null);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Filtros aplicados em tempo real
  const empresasFiltradas = useMemo(() => {
    return empresas.filter(emp => {
      const matchBusca = !busca || (
        (emp.nome_fantasia && emp.nome_fantasia.toLowerCase().includes(busca.toLowerCase())) ||
        (emp.razao_social && emp.razao_social.toLowerCase().includes(busca.toLowerCase())) ||
        (emp.cnpj && emp.cnpj.includes(busca)) ||
        (emp.segmento && emp.segmento.toLowerCase().includes(busca.toLowerCase())) ||
        (emp.endereco?.cidade && emp.endereco.cidade.toLowerCase().includes(busca.toLowerCase()))
      );

      const matchPorte = !filtroPorte || emp.porte === filtroPorte;
      const matchStatus = !filtroStatus || emp.status === filtroStatus;

      return matchBusca && matchPorte && matchStatus;
    });
  }, [empresas, busca, filtroPorte, filtroStatus]);

  // Métricas agregadas da carteira
  const metricas = useMemo(() => {
    const total = empresas.length;
    const clientesAtivos = empresas.filter(e => e.status === 'cliente_ativo').length;
    const pipelineTotal = empresas.reduce((acc, e) => acc + (e.pipelineAtivo || 0), 0);
    const ltvTotal = empresas.reduce((acc, e) => acc + (e.ltvGanho || 0), 0);

    return { total, clientesAtivos, pipelineTotal, ltvTotal };
  }, [empresas]);

  const handleAbrirCriar = () => {
    setEmpresaParaEditar(null);
    setModalAberta(true);
  };

  const handleAbrirEditar = (e, emp) => {
    e.stopPropagation();
    setEmpresaParaEditar(emp);
    setModalAberta(true);
  };

  const handleExcluir = async (e, emp) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja excluir a empresa "${emp.nome_fantasia}"?`)) {
      await excluir(emp.id);
    }
  };

  const handleSalvar = async (dados) => {
    if (empresaParaEditar) {
      await atualizar(empresaParaEditar.id, dados);
    } else {
      await criar(dados);
    }
  };

  // Helper de badge de status
  const getBadgeStatus = (status) => {
    const opt = STATUS_EMPRESA_OPCOES.find(o => o.value === status) || STATUS_EMPRESA_OPCOES[0];
    return (
      <Badge variant={opt.cor || 'default'} size="sm">
        {opt.label}
      </Badge>
    );
  };

  // Helper de badge de porte
  const getBadgePorte = (porte) => {
    const opt = PORTE_EMPRESA_OPCOES.find(o => o.value === porte);
    if (!opt) return null;
    return (
      <Badge variant="outline" size="sm" className="font-normal text-ink-secondary">
        {opt.label}
      </Badge>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-surface-primary text-ink-primary overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-5 w-full">
        {/* ─────────────────────────────────────────────────────────
            CABEÇALHO DA PÁGINA (SEM O TEXTO "CRM CORPORATIVO B2B")
           ───────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink-primary">
              Empresas Cadastradas
            </h1>
            <p className="text-sm text-ink-secondary mt-0.5">
              Gerencie empresas, parceiros e organizações com contatos e negócios vinculados.
            </p>
          </div>

          <SimpleTooltip content="Cadastrar nova organização">
            <button
              type="button"
              onClick={handleAbrirCriar}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold text-sm shadow-sm transition-all hover:shadow cursor-pointer shrink-0"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={18} />
              Nova Empresa
            </button>
          </SimpleTooltip>
        </div>

        {/* ─────────────────────────────────────────────────────────
            FAIXA DE MÉTRICAS CONSOLIDADAS (KPIS)
           ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Total de Empresas</span>
            <div className="text-xl sm:text-2xl font-extrabold text-ink-primary mt-1">
              {metricas.total}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Organizações cadastradas</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Clientes Ativos</span>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {metricas.clientesAtivos}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Contratos e contas ativas</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Pipeline em Aberto</span>
            <div className="text-xl sm:text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
              {formatarMoeda(metricas.pipelineTotal)}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Valor em negociação</span>
          </div>

          <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs">
            <span className="text-xs font-semibold text-ink-secondary">Faturamento Total (LTV)</span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-purple dark:text-brand-violet mt-1">
              {formatarMoeda(metricas.ltvTotal)}
            </div>
            <span className="text-[11px] text-ink-secondary mt-0.5 block">Receita de negócios fechados</span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            BARRA DE FERRAMENTAS: BUSCA E FILTROS EM LINHA
           ───────────────────────────────────────────────────────── */}
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1 min-w-[260px]">
            <span className="absolute left-3.5 top-3 text-ink-secondary pointer-events-none">
              <HugeiconsIcon icon={Search01Icon} size={18} />
            </span>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CNPJ, cidade ou segmento..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-surface-subtle border border-surface-border text-ink-primary placeholder-ink-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand-secondary/40 transition-all"
            />
          </div>

          {/* Filtros por Porte e Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="w-40">
              <SelectField
                value={filtroPorte}
                onChange={(e) => setFiltroPorte(e.target.value)}
              >
                <option value="">Todos os portes</option>
                {PORTE_EMPRESA_OPCOES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
            </div>

            <div className="w-44">
              <SelectField
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                {STATUS_EMPRESA_OPCOES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </SelectField>
            </div>

            {(busca || filtroPorte || filtroStatus) && (
              <button
                type="button"
                onClick={() => { setBusca(''); setFiltroPorte(''); setFiltroStatus(''); }}
                className="text-xs text-brand-secondary hover:underline px-2 py-1 font-semibold cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            LISTAGEM EXCLUSIVAMENTE EM FORMATO LISTA / TABELA CORPORATIVA
           ───────────────────────────────────────────────────────── */}
        {carregando ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-brand-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-ink-secondary">Carregando carteira de empresas...</p>
          </div>
        ) : empresasFiltradas.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center text-ink-secondary mx-auto mb-4">
              <HugeiconsIcon icon={Building02Icon} size={28} />
            </div>
            <h3 className="font-bold text-lg text-ink-primary">Nenhuma empresa encontrada</h3>
            <p className="text-xs text-ink-secondary mt-1 mb-6">
              {busca || filtroPorte || filtroStatus
                ? 'Tente ajustar os filtros ou o termo de busca para encontrar o que procura.'
                : 'Cadastre a primeira empresa para gerenciar contatos e negócios centralizados.'}
            </p>
            <button
              type="button"
              onClick={handleAbrirCriar}
              className="px-5 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              Cadastrar Empresa
            </button>
          </div>
        ) : (
          <div className="bg-surface-card rounded-2xl border border-surface-border shadow-2xs overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-subtle border-b border-surface-border text-xs uppercase tracking-wider text-ink-secondary font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Empresa</th>
                    <th className="px-4 py-3.5">CNPJ</th>
                    <th className="px-4 py-3.5">Localização</th>
                    <th className="px-4 py-3.5">Porte</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Equipe / Contatos</th>
                    <th className="px-4 py-3.5 text-right">Negócios</th>
                    <th className="px-5 py-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {empresasFiltradas.map((emp) => {
                    const contatos = emp.contatos || [];
                    const localizacao = [emp.endereco?.cidade, emp.endereco?.estado].filter(Boolean).join(' - ');

                    return (
                      <tr
                        key={emp.id}
                        onClick={() => navigate(`/crm/empresas/${emp.id}`)}
                        className="hover:bg-surface-hover/60 transition-colors cursor-pointer group"
                      >
                        {/* Logo e Nome */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={emp.logotipo_url}
                              alt={emp.nome_fantasia}
                              fallback={emp.nome_fantasia}
                              className="w-10 h-10 rounded-xl border border-surface-border bg-surface-subtle shrink-0 shadow-2xs group-hover:scale-105 transition-transform font-bold text-xs"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-ink-primary group-hover:text-brand-secondary transition-colors truncate">
                                {emp.nome_fantasia}
                              </div>
                              {emp.segmento && (
                                <div className="text-xs text-ink-secondary truncate max-w-[200px]">
                                  {emp.segmento}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* CNPJ */}
                        <td className="px-4 py-4 font-mono text-xs text-ink-secondary whitespace-nowrap">
                          {emp.cnpj || '—'}
                        </td>

                        {/* Localização */}
                        <td className="px-4 py-4 text-xs text-ink-secondary whitespace-nowrap">
                          {localizacao ? (
                            <span className="flex items-center gap-1.5">
                              <HugeiconsIcon icon={Location01Icon} size={14} className="text-brand-secondary shrink-0" />
                              {localizacao}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Porte */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getBadgePorte(emp.porte)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {getBadgeStatus(emp.status)}
                        </td>

                        {/* Contatos Vinculados */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {contatos.slice(0, 3).map((c, i) => (
                                <Avatar
                                  key={c.id || i}
                                  src={c.avatar}
                                  alt={c.nome}
                                  fallback={c.nome}
                                  className="w-6 h-6 rounded-full border-2 border-surface-card bg-surface-subtle text-[10px] font-bold"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-ink-secondary font-medium">
                              {contatos.length} {contatos.length === 1 ? 'contato' : 'contatos'}
                            </span>
                          </div>
                        </td>

                        {/* Negócios / Pipeline */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="font-extrabold text-ink-primary">
                            {formatarMoeda(emp.valorTotalNegocios || 0)}
                          </div>
                          <div className="text-[11px] text-ink-secondary">
                            {emp.totalNegocios || 0} {(emp.totalNegocios || 0) === 1 ? 'negócio' : 'negócios'}
                          </div>
                        </td>

                        {/* Ações Rápidas */}
                        <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {emp.whatsapp_geral && (
                              <SimpleTooltip content="WhatsApp Institucional">
                                <a
                                  href={`https://wa.me/55${emp.whatsapp_geral.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                                >
                                  <HugeiconsIcon icon={WhatsappIcon} size={16} />
                                </a>
                              </SimpleTooltip>
                            )}

                            {emp.site && (
                              <SimpleTooltip content="Website da Empresa">
                                <a
                                  href={emp.site.startsWith('http') ? emp.site : `https://${emp.site}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                >
                                  <HugeiconsIcon icon={Globe02Icon} size={16} />
                                </a>
                              </SimpleTooltip>
                            )}

                            <SimpleTooltip content="Editar Empresa">
                              <button
                                type="button"
                                onClick={(e) => handleAbrirEditar(e, emp)}
                                className="p-1.5 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-surface-hover transition-colors"
                              >
                                <HugeiconsIcon icon={Edit02Icon} size={16} />
                              </button>
                            </SimpleTooltip>

                            <SimpleTooltip content="Excluir Empresa">
                              <button
                                type="button"
                                onClick={(e) => handleExcluir(e, emp)}
                                className="p-1.5 rounded-lg text-ink-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={16} />
                              </button>
                            </SimpleTooltip>

                            <SimpleTooltip content="Ver Perfil Completo">
                              <button
                                type="button"
                                onClick={() => navigate(`/crm/empresas/${emp.id}`)}
                                className="p-1.5 rounded-lg text-brand-secondary hover:bg-brand-secondary/15 transition-colors font-bold"
                              >
                                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                              </button>
                            </SimpleTooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Empresa */}
      <ModalEmpresa
        aberta={modalAberta}
        empresaParaEditar={empresaParaEditar}
        onFechar={() => setModalAberta(false)}
        onSalvar={handleSalvar}
      />
    </div>
  );
};

export default Empresas;
