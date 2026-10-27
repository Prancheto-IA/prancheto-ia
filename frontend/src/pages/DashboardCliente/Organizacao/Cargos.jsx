// =============================================================
// PRANCHETO.IA - CARGOS E PERMISSÕES (ORGANIZAÇÃO)
// Gerencia os cargos e permissões da organização em layout multi-coluna.
// Cargos de sistema (e_sistema=true) têm permissões editáveis,
// mas não podem ser excluídos nem renomeados.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  useOrg,
  PERMISSOES_POR_GRUPO,
  PERMISSOES_DISPONIVEIS,
  PERMISSOES_PADRAO_CARGO_NOVO,
} from '../../../hooks/useOrg.js';
import PermissaoGuarda from '../../../components/ui/PermissaoGuarda.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PencilEdit01Icon,
  Delete02Icon,
  ArrowDown01Icon,
  Add01Icon,
  Shield01Icon,
  LockIcon,
  SparklesIcon,
  InformationCircleIcon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons';

/** Índice slug → definição, para não varrer o catálogo a cada permissão exibida. */
const CATALOGO_POR_SLUG = new Map(PERMISSOES_DISPONIVEIS.map(p => [p.slug, p]));

// ----------------------------------------------------------
// BADGES
// ----------------------------------------------------------
const BadgeSistema = () => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
    Sistema
  </span>
);

const BadgePadrao = () => (
  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
    Padrão
  </span>
);

// ----------------------------------------------------------
// EDITOR DE PERMISSÕES
// ----------------------------------------------------------
const EditorPermissoes = ({ permissoesSelecionadas, onChange, desabilitado }) => {
  const grupos = Object.entries(PERMISSOES_POR_GRUPO);

  const toggle = (slug) => {
    if (desabilitado) return;
    const novas = permissoesSelecionadas.includes(slug)
      ? permissoesSelecionadas.filter(p => p !== slug)
      : [...permissoesSelecionadas, slug];
    onChange(novas);
  };

  const toggleGrupo = (permsDoGrupo) => {
    if (desabilitado) return;
    const slugsGrupo = permsDoGrupo.map(p => p.slug);
    const todosMarcados = slugsGrupo.every(s => permissoesSelecionadas.includes(s));
    let novas;
    if (todosMarcados) {
      novas = permissoesSelecionadas.filter(s => !slugsGrupo.includes(s));
    } else {
      novas = [...new Set([...permissoesSelecionadas, ...slugsGrupo])];
    }
    onChange(novas);
  };

  return (
    <div className="space-y-4">
      {grupos.map(([grupo, perms]) => {
        const slugsGrupo = perms.map(p => p.slug);
        const todosMarcados = slugsGrupo.every(s => permissoesSelecionadas.includes(s));
        const algunsMarcados = slugsGrupo.some(s => permissoesSelecionadas.includes(s)) && !todosMarcados;

        return (
          <div key={grupo} className="p-3.5 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
            {/* Header do grupo */}
            <button
              type="button"
              onClick={() => toggleGrupo(perms)}
              disabled={desabilitado}
              className="flex items-center gap-2 mb-2 w-full text-left disabled:cursor-not-allowed cursor-pointer"
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  todosMarcados
                    ? 'bg-[#0E382C] text-[#D4EC9D]'
                    : algunsMarcados
                    ? 'bg-[#0E382C]/60 text-white'
                    : 'bg-white border border-[#E4ECE7]'
                }`}
              >
                {(todosMarcados || algunsMarcados) && (
                  <span className="text-[10px] font-bold leading-none">
                    {todosMarcados ? '✓' : '−'}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0E382C]">
                {grupo}
              </span>
            </button>

            {/* Permissões do grupo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
              {perms.map((perm) => {
                const marcado = permissoesSelecionadas.includes(perm.slug);
                return (
                  <button
                    key={perm.slug}
                    type="button"
                    onClick={() => toggle(perm.slug)}
                    disabled={desabilitado}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left border transition-all disabled:cursor-not-allowed cursor-pointer ${
                      marcado
                        ? 'bg-white border-[#0E382C] text-[#0E382C] font-semibold shadow-2xs'
                        : 'bg-transparent border-transparent text-[#687770] hover:bg-white hover:border-[#E4ECE7]'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex-shrink-0 flex items-center justify-center ${
                        marcado ? 'bg-[#0E382C] text-[#D4EC9D]' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {marcado && <span className="text-[9px] font-bold leading-none">✓</span>}
                    </span>
                    <span className="truncate">{perm.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ----------------------------------------------------------
// MODAL: Criar / Editar Cargo
// ----------------------------------------------------------
const formVazio = (nivelSugerido = 0) => ({
  nome: '',
  descricao: '',
  permissoes: [...PERMISSOES_PADRAO_CARGO_NOVO],
  nivel: nivelSugerido,
});

const ModalCargo = ({ aberto, onFechar, onSalvar, cargoEditando, meuNivel, souDono }) => {
  const [form, setForm]         = useState(formVazio());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  const nivelMaximoPermitido = souDono ? 100 : Math.max(0, meuNivel - 1);

  useEffect(() => {
    if (cargoEditando) {
      setForm({
        nome:        cargoEditando.nome || '',
        descricao:   cargoEditando.descricao || '',
        permissoes:  Array.isArray(cargoEditando.permissoes) ? cargoEditando.permissoes : [],
        nivel:       cargoEditando.nivel ?? 0,
      });
    } else {
      setForm(formVazio(Math.min(10, nivelMaximoPermitido)));
    }
    setErro('');
  }, [cargoEditando, aberto, nivelMaximoPermitido]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cargoEditando?.e_sistema && !form.nome.trim()) {
      setErro('Nome do cargo é obrigatório.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar(form);
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar cargo.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  const ehSistema = cargoEditando?.e_sistema;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto" onClick={onFechar}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-[#E4ECE7] shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECE7]">
          <div>
            <h2 className="font-bold text-base text-[#111915]">
              {cargoEditando ? `Editar Cargo: ${cargoEditando.nome}` : 'Novo Cargo'}
            </h2>
            <p className="text-xs text-[#687770]">
              {ehSistema
                ? 'Cargo de sistema: permissões e descrição podem ser alteradas.'
                : 'Defina o nome, nível hierárquico e permissões concedidas.'}
            </p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-[#111915] transition-colors text-lg p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {erro}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">
                Nome do Cargo *
              </label>
              <input
                type="text"
                disabled={ehSistema}
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Supervisor de Vendas"
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs disabled:opacity-60"
              />
            </div>

            {/* Nível */}
            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">
                Nível Hierárquico (0 a {nivelMaximoPermitido})
              </label>
              <input
                type="number"
                min="0"
                max={nivelMaximoPermitido}
                disabled={ehSistema}
                value={form.nivel}
                onChange={(e) => setForm(f => ({ ...f, nivel: parseInt(e.target.value, 10) || 0 }))}
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs disabled:opacity-60"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-1.5">
              Descrição do Cargo
            </label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Breve descrição da função e escopo de atuação"
              className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Editor de Permissões */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-2">
              Permissões de Acesso ({form.permissoes.length} selecionadas)
            </label>
            <div className="max-h-72 overflow-y-auto pr-1">
              <EditorPermissoes
                permissoesSelecionadas={form.permissoes}
                onChange={(novas) => setForm(f => ({ ...f, permissoes: novas }))}
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#E4ECE7]">
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#E4ECE7] text-[#687770] hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-colors disabled:opacity-50 shadow-xs"
            >
              {salvando ? 'Salvando...' : cargoEditando ? 'Salvar Alterações' : 'Criar Cargo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD DE CARGO
// ----------------------------------------------------------
const CardCargo = ({ cargo, onEditar, onExcluir, excluindo }) => {
  const [expandido, setExpandido] = useState(false);
  const permissoes = Array.isArray(cargo.permissoes) ? cargo.permissoes : [];

  const permsAgrupadas = permissoes.reduce((acc, slug) => {
    const perm = CATALOGO_POR_SLUG.get(slug);
    if (!perm) return acc;
    const grupo = perm.grupo || 'Outros';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(perm.label);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs hover:border-[#0E382C]/30 transition-all flex flex-col justify-between">
      <div>
        {/* Topo do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-[#111915] truncate">
                {cargo.nome}
              </h3>
              {cargo.e_sistema && <BadgeSistema />}
              {cargo.e_padrao && <BadgePadrao />}
            </div>
            <p className="text-[11px] text-[#687770] mt-0.5">
              Nível hierárquico: <strong className="text-[#111915]">{cargo.nivel ?? 0}</strong>
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <PermissaoGuarda permissao="cargos.gerenciar">
              <button
                onClick={() => onEditar(cargo)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0E382C] hover:bg-[#F7FAF8] transition-colors"
                title="Editar cargo"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={15} strokeWidth={1.8} />
              </button>
            </PermissaoGuarda>

            {!cargo.e_sistema && (
              <PermissaoGuarda permissao="cargos.gerenciar">
                <button
                  onClick={() => onExcluir(cargo.id)}
                  disabled={excluindo === cargo.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Excluir cargo"
                >
                  {excluindo === cargo.id ? (
                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
                  )}
                </button>
              </PermissaoGuarda>
            )}
          </div>
        </div>

        {/* Descrição */}
        {cargo.descricao && (
          <p className="text-xs text-[#687770] mt-2.5 line-clamp-2">
            {cargo.descricao}
          </p>
        )}

        {/* Resumo de Permissões */}
        <div className="mt-4 pt-3 border-t border-[#E4ECE7] flex items-center justify-between">
          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#EDF2EE] text-[#0E382C]">
            {permissoes.length} {permissoes.length === 1 ? 'permissão ativa' : 'permissões ativas'}
          </span>

          <button
            onClick={() => setExpandido(v => !v)}
            className="text-xs font-semibold text-[#0E382C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{expandido ? 'Ocultar' : 'Ver permissões'}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              strokeWidth={2}
              className={`transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Permissões Expandidas */}
      {expandido && (
        <div className="mt-3 pt-3 border-t border-[#E4ECE7] space-y-2 max-h-56 overflow-y-auto pr-1">
          {permissoes.length === 0 ? (
            <p className="text-center py-2 text-xs text-[#687770]">
              Nenhuma permissão atribuída.
            </p>
          ) : (
            Object.entries(permsAgrupadas).map(([grupo, labels]) => (
              <div key={grupo} className="p-2 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#0E382C] mb-1">
                  {grupo}
                </p>
                <div className="flex flex-wrap gap-1">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-[#E4ECE7] text-[#111915] font-medium"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: CARGOS
// ----------------------------------------------------------
const Cargos = () => {
  const {
    carregando,
    listarCargos,
    criarCargo,
    atualizarCargo,
    excluirCargo,
    obterMeuNivel,
    souDonoTenant,
  } = useOrg();

  const [cargos, setCargos]               = useState([]);
  const [modalCargo, setModalCargo]       = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [excluindo, setExcluindo]         = useState(null);
  const [erro, setErro]                   = useState('');
  const [inicializado, setInicializado]   = useState(false);
  const [meuNivel, setMeuNivel]           = useState(0);
  const [souDono, setSouDono]             = useState(false);

  const carregar = useCallback(async () => {
    const [data, nivel, dono] = await Promise.all([listarCargos(), obterMeuNivel(), souDonoTenant()]);
    setCargos(data);
    setMeuNivel(nivel);
    setSouDono(dono);
    setInicializado(true);
  }, [listarCargos, obterMeuNivel, souDonoTenant]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSalvar = async (dados) => {
    if (cargoEditando) {
      if (cargoEditando.e_sistema) {
        await atualizarCargo(cargoEditando.id, {
          descricao:  dados.descricao,
          permissoes: dados.permissoes,
        });
      } else {
        await atualizarCargo(cargoEditando.id, dados);
      }
    } else {
      await criarCargo(dados);
    }
    await carregar();
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este cargo? Usuários atribuídos a este cargo ficarão sem cargo até nova designação.')) return;
    setExcluindo(id);
    try {
      await excluirCargo(id);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao excluir cargo.');
    } finally {
      setExcluindo(null);
    }
  };

  const abrirCriar  = () => { setCargoEditando(null); setModalCargo(true); };
  const abrirEditar = (cargo) => { setCargoEditando(cargo); setModalCargo(true); };

  const cargosSistema = cargos.filter(c => c.e_sistema);
  const cargosCustom  = cargos.filter(c => !c.e_sistema);

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111915]">
            Cargos e Permissões
          </h1>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Defina os cargos da organização e configure os acessos e limites de cada função.
          </p>
        </div>

        <PermissaoGuarda permissao="cargos.gerenciar">
          <button
            onClick={abrirCriar}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.2} />
            <span>Novo cargo</span>
          </button>
        </PermissaoGuarda>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* KPI Stats em 3 Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{cargos.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Total de Cargos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center">
            <HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{cargosSistema.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Cargos de Sistema</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center">
            <HugeiconsIcon icon={LockIcon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{cargosCustom.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Cargos Customizados</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HugeiconsIcon icon={SparklesIcon} size={20} strokeWidth={1.8} />
          </div>
        </div>
      </div>

      {/* Info Card de Boas Práticas */}
      <div className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center flex-shrink-0 mt-0.5">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} strokeWidth={1.8} />
        </div>
        <p className="text-xs text-[#687770] leading-relaxed">
          Cargos marcados como <strong className="text-[#0E382C]">Sistema</strong> são pré-configurados pela plataforma e não podem ser excluídos ou renomeados, mas suas permissões internas podem ser customizadas. Cargos marcados como <strong className="text-emerald-800">Padrão</strong> são automaticamente atribuídos aos novos usuários convidados.
        </p>
      </div>

      {/* Seção: Cargos de Sistema */}
      {cargosSistema.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#687770]">
            Cargos de Sistema ({cargosSistema.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {cargosSistema.map((cargo) => (
              <CardCargo
                key={cargo.id}
                cargo={cargo}
                onEditar={abrirEditar}
                onExcluir={handleExcluir}
                excluindo={excluindo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seção: Cargos Customizados */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#687770]">
            Cargos Customizados ({cargosCustom.length})
          </h2>
        </div>

        {cargosCustom.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-[#E4ECE7] p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center mb-3">
              <HugeiconsIcon icon={UserAdd01Icon} size={24} strokeWidth={1.8} />
            </div>
            <h3 className="font-bold text-sm text-[#111915] mb-1">
              Nenhum cargo customizado criado
            </h3>
            <p className="text-xs text-[#687770] max-w-sm mb-4">
              Crie cargos sob medida com permissões granulares para a sua estrutura corporativa.
            </p>
            <PermissaoGuarda permissao="cargos.gerenciar">
              <button
                onClick={abrirCriar}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer"
              >
                + Criar primeiro cargo
              </button>
            </PermissaoGuarda>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
            {cargosCustom.map((cargo) => (
              <CardCargo
                key={cargo.id}
                cargo={cargo}
                onEditar={abrirEditar}
                onExcluir={handleExcluir}
                excluindo={excluindo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Cargo */}
      <ModalCargo
        aberto={modalCargo}
        onFechar={() => setModalCargo(false)}
        onSalvar={handleSalvar}
        cargoEditando={cargoEditando}
        meuNivel={meuNivel}
        souDono={souDono}
      />
    </div>
  );
};

export default Cargos;
