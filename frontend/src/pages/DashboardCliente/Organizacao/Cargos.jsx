// =============================================================
// PRANCHETO.IA - CARGOS E PERMISSÕES
// Gerencia os cargos customizáveis da organização.
// Cargos de sistema (e_sistema=true) podem ter permissões editadas
// mas não podem ser excluídos nem renomeados.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  useOrg,
  PERMISSOES_POR_GRUPO,
  PERMISSOES_DISPONIVEIS,
  SLUGS_CONHECIDOS,
  PERMISSOES_PADRAO_CARGO_NOVO,
} from '../../../hooks/useOrg.js';
import PermissaoGuarda from '../../../components/ui/PermissaoGuarda.jsx';

/** Índice slug → definição, para não varrer o catálogo a cada permissão exibida. */
const CATALOGO_POR_SLUG = new Map(PERMISSOES_DISPONIVEIS.map(p => [p.slug, p]));

// ----------------------------------------------------------
// BADGE DE CARGO
// ----------------------------------------------------------
const BadgeSistema = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
    Sistema
  </span>
);

const BadgePadrao = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
    Padrão
  </span>
);

// ----------------------------------------------------------
// EDITOR DE PERMISSÕES (inline dentro do card)
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
    <div className="space-y-3">
      {grupos.map(([grupo, perms]) => {
        const slugsGrupo = perms.map(p => p.slug);
        const todosMarcados = slugsGrupo.every(s => permissoesSelecionadas.includes(s));
        const algunsMarcados = slugsGrupo.some(s => permissoesSelecionadas.includes(s)) && !todosMarcados;

        return (
          <div key={grupo}>
            {/* Header do grupo */}
            <button
              type="button"
              onClick={() => toggleGrupo(perms)}
              disabled={desabilitado}
              className="flex items-center gap-2 mb-1.5 w-full text-left disabled:cursor-not-allowed"
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  todosMarcados
                    ? 'bg-primary-600'
                    : algunsMarcados
                    ? 'bg-primary-600/50'
                    : 'bg-transparent border'
                }`}
                style={
                  todosMarcados || algunsMarcados
                    ? undefined
                    : { borderColor: 'var(--color-control-border)' }
                }
              >
                {(todosMarcados || algunsMarcados) && (
                  <span className="text-white text-xs leading-none">
                    {todosMarcados ? '✓' : '−'}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                {grupo}
              </span>
            </button>

            {/* Permissões do grupo */}
            <div className="grid grid-cols-2 gap-1 pl-6">
              {perms.map((perm) => {
                const marcado = permissoesSelecionadas.includes(perm.slug);
                return (
                  <button
                    key={perm.slug}
                    type="button"
                    onClick={() => toggle(perm.slug)}
                    disabled={desabilitado}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left border transition-all disabled:cursor-not-allowed ${
                      marcado
                        ? 'bg-primary-500/15 border-primary-500/30'
                        : 'acao-sutil acao-sutil-bloco border-transparent'
                    }`}
                    style={marcado ? { color: 'var(--color-primaria-contraste)' } : undefined}
                  >
                    <span
                      className={`w-3 h-3 rounded flex-shrink-0 flex items-center justify-center ${
                        marcado ? 'bg-primary-600' : 'border'
                      }`}
                      style={marcado ? undefined : { borderColor: 'var(--color-control-border)' }}
                    >
                      {marcado && <span className="text-white text-xs leading-none">✓</span>}
                    </span>
                    {perm.label}
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
// O cargo novo abre com as permissões liberadas por padrão já marcadas —
// desmarcar é uma decisão do chefe, não o ponto de partida.
const formVazio = () => ({
  nome: '',
  descricao: '',
  permissoes: [...PERMISSOES_PADRAO_CARGO_NOVO],
});

const ModalCargo = ({ aberto, onFechar, onSalvar, cargoEditando }) => {
  const [form, setForm] = useState(formVazio);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (cargoEditando) {
      setForm({
        nome:       cargoEditando.nome       || '',
        descricao:  cargoEditando.descricao  || '',
        permissoes: cargoEditando.permissoes || [],
      });
    } else {
      setForm(formVazio());
    }
    setErro('');
  }, [cargoEditando, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
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

  const eSistema = cargoEditando?.e_sistema;

  if (!aberto) return null;

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-2xl rounded-xl shadow-2xl max-h-[90vh] flex flex-col"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
              {cargoEditando ? '✏️ Editar Cargo' : '➕ Novo Cargo'}
            </h2>
            {eSistema && <BadgeSistema />}
          </div>
          <button onClick={onFechar} className="acao-sutil text-xl">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Nome *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Coordenador de Vendas"
                disabled={eSistema}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={inputStyle}
              />
              {eSistema && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Cargos de sistema não podem ser renomeados.
                </p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Descrição
              </label>
              <input
                type="text"
                value={form.descricao}
                onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Breve descrição do cargo"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                style={inputStyle}
              />
            </div>

            {/* Permissões */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Permissões ({form.permissoes.length} selecionadas)
                </label>
                <div className="flex gap-2">
                  {/* Ambos preservam slugs fora do catálogo: o editor não os
                      exibe, então o admin não pode ter intenção de removê-los. */}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      permissoes: [...new Set([
                        ...f.permissoes.filter(s => !SLUGS_CONHECIDOS.has(s)),
                        ...PERMISSOES_DISPONIVEIS.map(p => p.slug),
                      ])],
                    }))}
                    className="text-xs transition-colors hover:opacity-80"
                    style={{ color: 'var(--color-primaria-contraste)' }}
                  >
                    Selecionar todas
                  </button>
                  <span style={{ color: 'var(--color-text-secondary)' }}>·</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      permissoes: f.permissoes.filter(s => !SLUGS_CONHECIDOS.has(s)),
                    }))}
                    className="acao-sutil text-xs"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}
              >
                <EditorPermissoes
                  permissoesSelecionadas={form.permissoes}
                  onChange={(novas) => setForm(f => ({ ...f, permissoes: novas }))}
                  desabilitado={false}
                />
              </div>
            </div>

            {erro && <p className="text-red-400 text-xs">{erro}</p>}
          </div>

          {/* Botões */}
          <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
            <button
              type="button"
              onClick={onFechar}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : cargoEditando ? 'Salvar' : 'Criar cargo'}
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
  const totalPerms = cargo.permissoes?.length || 0;

  // Agrupa permissões por grupo para exibição.
  // Slugs fora do catálogo aparecem em um grupo próprio, em vez de sumirem:
  // uma permissão invisível é impossível de revisar ou remover.
  const permsAgrupadas = (cargo.permissoes || []).reduce((acc, slug) => {
    const perm = CATALOGO_POR_SLUG.get(slug);
    const grupo = perm ? perm.grupo : 'Fora do catálogo';
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(perm ? perm.label : slug);
    return acc;
  }, {});

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center text-xl flex-shrink-0">
            🎭
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {cargo.nome}
              </h3>
              {cargo.e_sistema && <BadgeSistema />}
              {cargo.e_padrao  && <BadgePadrao />}
            </div>
            {cargo.descricao && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                {cargo.descricao}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {totalPerms} {totalPerms === 1 ? 'permissão' : 'permissões'}
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setExpandido(e => !e)}
              className="acao-sutil acao-sutil-bloco p-1.5 rounded-lg text-sm"
              title={expandido ? 'Recolher' : 'Ver permissões'}
            >
              {expandido ? '▲' : '▼'}
            </button>
            <PermissaoGuarda permissao="cargos.gerenciar">
              <button
                onClick={() => onEditar(cargo)}
                className="acao-sutil acao-sutil-bloco p-1.5 rounded-lg text-sm"
                title="Editar cargo"
              >
                ✏️
              </button>
            </PermissaoGuarda>
            {!cargo.e_sistema && (
              <PermissaoGuarda permissao="cargos.gerenciar">
                <button
                  onClick={() => onExcluir(cargo.id)}
                  disabled={excluindo === cargo.id}
                  className="acao-sutil p-1.5 rounded-lg text-sm hover:text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                  title="Excluir cargo"
                >
                  {excluindo === cargo.id ? '⏳' : '🗑️'}
                </button>
              </PermissaoGuarda>
            )}
          </div>
        </div>
      </div>

      {/* Permissões expandidas */}
      {expandido && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--color-surface-border)', paddingTop: '12px' }}>
          {totalPerms === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
              Nenhuma permissão atribuída.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(permsAgrupadas).map(([grupo, labels]) => (
                <div key={grupo}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {grupo}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {labels.map((label) => (
                      <span
                        key={label}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10"
                        style={{ color: 'var(--color-primaria-contraste)' }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------
// PÁGINA PRINCIPAL: CARGOS
// ----------------------------------------------------------
const Cargos = () => {
  const {
    carregando,
    listarCargos,
    criarCargo,
    atualizarCargo,
    excluirCargo,
  } = useOrg();

  const [cargos, setCargos]             = useState([]);
  const [modalCargo, setModalCargo]     = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [excluindo, setExcluindo]       = useState(null);
  const [erro, setErro]                 = useState('');
  const [inicializado, setInicializado] = useState(false);

  const carregar = useCallback(async () => {
    const data = await listarCargos();
    setCargos(data);
    setInicializado(true);
  }, [listarCargos]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSalvar = async (dados) => {
    if (cargoEditando) {
      // Cargo de sistema: só atualiza permissões e descrição
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
    if (!window.confirm('Excluir este cargo? Usuários com este cargo ficarão sem cargo atribuído.')) return;
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

  // Separa cargos de sistema dos customizados
  const cargosSistema    = cargos.filter(c => c.e_sistema);
  const cargosCustom     = cargos.filter(c => !c.e_sistema);

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            🎭 Cargos e Permissões
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Defina os cargos da organização e controle o que cada um pode fazer.
          </p>
        </div>
        <PermissaoGuarda permissao="cargos.gerenciar">
          <button
            onClick={abrirCriar}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            <span>+</span>
            <span>Novo cargo</span>
          </button>
        </PermissaoGuarda>
      </div>

      {/* Erro global */}
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Info sobre cargos de sistema */}
      <div
        className="mb-5 p-3 rounded-xl flex items-start gap-3"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
      >
        <span className="text-lg flex-shrink-0">ℹ️</span>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Cargos marcados como <strong className="text-violet-300">Sistema</strong> são criados automaticamente e não podem ser excluídos ou renomeados, mas você pode editar suas permissões.
          O cargo marcado como <strong className="text-emerald-300">Padrão</strong> é atribuído automaticamente a novos usuários.
        </p>
      </div>

      {/* Cargos de sistema */}
      {cargosSistema.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            Cargos de sistema
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
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

      {/* Cargos customizados */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Cargos customizados
        </h2>
        {cargosCustom.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px dashed var(--color-surface-border)' }}
          >
            <div className="text-4xl mb-3">🎭</div>
            <h3 className="font-semibold mb-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Nenhum cargo customizado
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
              Crie cargos personalizados com permissões específicas para sua organização.
            </p>
            <button
              onClick={abrirCriar}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            >
              Criar cargo
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
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

      {/* Modal criar/editar cargo */}
      <ModalCargo
        aberto={modalCargo}
        onFechar={() => setModalCargo(false)}
        onSalvar={handleSalvar}
        cargoEditando={cargoEditando}
      />
    </div>
  );
};

export default Cargos;
