// =============================================================
// PRANCHETO.IA - CAMPOS CUSTOMIZADOS ("CAMPOS LEGO") (FASE 2)
// Gerenciador de campos personalizados por time/módulo
// =============================================================

import React, { useState, useEffect } from 'react';
import { useCamposCustom, TIPOS_CAMPO } from '../../hooks/useCRM.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import { useOrg } from '../../hooks/useOrg.js';
import { supabase } from '../../lib/supabase.js';

// ─── Componentes auxiliares ────────────────────────────────────
const Spinner = () => (
  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
);

const BadgeTipo = ({ tipo }) => {
  const t = TIPOS_CAMPO.find(t => t.key === tipo) || TIPOS_CAMPO[0];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-slate-500/20 text-slate-300 border-slate-500/30">
      {t.label}
    </span>
  );
};

// ─── Modal: Criar/Editar Campo ─────────────────────────────────
const ModalCampo = ({ aberto, onFechar, onSalvar, campoEditando, times }) => {
  const FORM_VAZIO = {
    nome: '', label: '', tipo: 'text',
    time_id: '', modulo: 'crm',
    obrigatorio: false, opcoes: '',
  };
  const [form, setForm]         = useState(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (campoEditando) {
      setForm({
        nome:        campoEditando.nome        || '',
        label:       campoEditando.label       || '',
        tipo:        campoEditando.tipo        || 'text',
        time_id:     campoEditando.time_id     || '',
        modulo:      campoEditando.modulo      || 'crm',
        obrigatorio: campoEditando.obrigatorio || false,
        opcoes:      Array.isArray(campoEditando.opcoes)
                       ? campoEditando.opcoes.join('\n')
                       : '',
      });
    } else {
      setForm(FORM_VAZIO);
    }
    setErro('');
  }, [campoEditando, aberto]);

  if (!aberto) return null;

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }));
  const setCheck = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.checked }));

  // Gerar slug automático a partir do label
  const gerarSlug = (label) =>
    label.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  const handleLabelChange = (e) => {
    const novoLabel = e.target.value;
    setForm(f => ({
      ...f,
      label: novoLabel,
      nome: f.nome || gerarSlug(novoLabel),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.label.trim()) { setErro('Label é obrigatório.'); return; }
    if (!form.nome.trim())  { setErro('Nome (slug) é obrigatório.'); return; }
    if (!/^[a-z0-9_]+$/.test(form.nome)) {
      setErro('Nome deve conter apenas letras minúsculas, números e underscore.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      const opcoes = ['select', 'multiselect'].includes(form.tipo)
        ? form.opcoes.split('\n').map(o => o.trim()).filter(Boolean)
        : [];
      await onSalvar({
        nome:        form.nome.trim(),
        label:       form.label.trim(),
        tipo:        form.tipo,
        time_id:     form.time_id || null,
        modulo:      form.modulo,
        obrigatorio: form.obrigatorio,
        opcoes,
      });
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar campo.');
    } finally {
      setSalvando(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  const precisaOpcoes = ['select', 'multiselect'].includes(form.tipo);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="rounded-xl p-6 w-full max-w-md my-4 border"
        style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {campoEditando ? '✏️ Editar Campo' : '🧩 Novo Campo'}
          </h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-slate-300 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label (exibição) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Label (exibição) *
            </label>
            <input type="text" value={form.label} onChange={handleLabelChange}
              placeholder="Ex: Valor da Proposta"
              className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={inputStyle} />
          </div>

          {/* Nome (slug interno) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Nome interno (slug) *
            </label>
            <input type="text" value={form.nome} onChange={set('nome')}
              placeholder="Ex: valor_proposta"
              className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 font-mono"
              style={inputStyle} />
            <p className="text-xs mt-1 text-slate-500">
              Usado como variável: {'{{'}{form.nome || 'nome_do_campo'}{'}}'} 
            </p>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tipo</label>
            <select value={form.tipo} onChange={set('tipo')}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={inputStyle}>
              {TIPOS_CAMPO.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          {/* Opções (para select/multiselect) */}
          {precisaOpcoes && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Opções (uma por linha) *
              </label>
              <textarea value={form.opcoes} onChange={set('opcoes')} rows={4}
                placeholder={'Opção A\nOpção B\nOpção C'}
                className="w-full rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none font-mono"
                style={inputStyle} />
            </div>
          )}

          {/* Time (escopo) */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Escopo (time)
            </label>
            <select value={form.time_id} onChange={set('time_id')}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              style={inputStyle}>
              <option value="">🌐 Global (todos os times)</option>
              {(times || []).map(t => (
                <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
              ))}
            </select>
            <p className="text-xs mt-1 text-slate-500">
              Campos de times diferentes com o mesmo nome coexistem com namespace próprio.
            </p>
          </div>

          {/* Obrigatório */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.obrigatorio} onChange={setCheck('obrigatorio')}
              className="w-4 h-4 rounded accent-primary-500" />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Campo obrigatório</span>
          </label>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 py-2 rounded-lg text-sm transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-secondary)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Card do Campo ─────────────────────────────────────────────
const CardCampo = ({ campo, onEditar, onExcluir }) => (
  <div className="rounded-xl p-4 border flex items-start gap-3"
    style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
    <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-xl flex-shrink-0">
      🧩
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{campo.label}</p>
        <BadgeTipo tipo={campo.tipo} />
        {campo.obrigatorio && (
          <span className="text-xs text-red-400">* obrigatório</span>
        )}
      </div>
      <p className="text-xs font-mono mt-0.5 text-slate-500">
        {'{{'}{campo.nome}{'}}'}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {campo.time ? (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {campo.time.icone} {campo.time.nome}
          </span>
        ) : (
          <span className="text-xs text-slate-500">🌐 Global</span>
        )}
        {campo.opcoes?.length > 0 && (
          <span className="text-xs text-slate-500">
            {campo.opcoes.length} opções
          </span>
        )}
      </div>
    </div>
    <div className="flex gap-2 flex-shrink-0">
      <button onClick={() => onEditar(campo)} className="text-slate-500 hover:text-primary-400 transition-colors text-sm" title="Editar">✏️</button>
      <PermissaoGuarda permissao="crm.excluir"><button onClick={() => onExcluir(campo.id)} className="text-slate-500 hover:text-red-400 transition-colors text-sm" title="Desativar">🗑️</button></PermissaoGuarda>
    </div>
  </div>
);

// ─── Página Principal: Campos Customizados ─────────────────────
const PaginaCamposCustomizados = () => {
  const { campos, carregando, erro, carregar, criar, atualizar, excluir } = useCamposCustom();
  const { listarTimes } = useOrg();
  const [times, setTimes] = useState([]);

  const [modalAberto, setModalAberto]     = useState(false);
  const [campoEditando, setCampoEditando] = useState(null);
  const [filtroTime, setFiltroTime]       = useState('');
  const [busca, setBusca]                 = useState('');

  useEffect(() => {
    carregar();
    listarTimes().then(setTimes).catch(() => {});
  }, [carregar, listarTimes]);

  const camposFiltrados = campos.filter(c => {
    const matchTime  = !filtroTime || c.time_id === filtroTime || (filtroTime === '__global' && !c.time_id);
    const matchBusca = !busca || c.label.toLowerCase().includes(busca.toLowerCase()) || c.nome.toLowerCase().includes(busca.toLowerCase());
    return matchTime && matchBusca;
  });

  const handleSalvar = async (dados) => {
    if (campoEditando) {
      await atualizar(campoEditando.id, dados);
    } else {
      await criar(dados);
    }
    setCampoEditando(null);
  };

  const handleEditar = (campo) => {
    setCampoEditando(campo);
    setModalAberto(true);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Desativar este campo? Os valores existentes serão preservados.')) return;
    await excluir(id);
  };

  // Agrupar por time para exibição
  const camposGlobais = camposFiltrados.filter(c => !c.time_id);
  const camposPorTime = (times || []).reduce((acc, t) => {
    const lista = camposFiltrados.filter(c => c.time_id === t.id);
    if (lista.length > 0) acc[t.id] = { time: t, campos: lista };
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            🧩 Campos Customizados
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {campos.length} campos ativos · Molde a estrutura de dados sem código
          </p>
        </div>
        <button
          onClick={() => { setCampoEditando(null); setModalAberto(true); }}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          + Novo Campo
        </button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar campo..."
          className="flex-1 min-w-48 rounded-lg px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        />
        <select
          value={filtroTime}
          onChange={e => setFiltroTime(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}>
          <option value="">Todos os escopos</option>
          <option value="__global">🌐 Global</option>
          {(times || []).map(t => (
            <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
          ))}
        </select>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{erro}</div>
      )}

      {/* Carregando */}
      {carregando && (
        <div className="flex justify-center py-12"><Spinner /></div>
      )}

      {/* Campos Globais */}
      {!carregando && camposGlobais.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-secondary)' }}>
            🌐 Campos Globais
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
              {camposGlobais.length}
            </span>
          </h2>
          <div className="space-y-2">
            {camposGlobais.map(c => (
              <CardCampo key={c.id} campo={c} onEditar={handleEditar} onExcluir={handleExcluir} />
            ))}
          </div>
        </div>
      )}

      {/* Campos por Time */}
      {!carregando && Object.values(camposPorTime).map(({ time, campos: lista }) => (
        <div key={time.id}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-text-secondary)' }}>
            {time.icone} {time.nome}
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
              {lista.length}
            </span>
          </h2>
          <div className="space-y-2">
            {lista.map(c => (
              <CardCampo key={c.id} campo={c} onEditar={handleEditar} onExcluir={handleExcluir} />
            ))}
          </div>
        </div>
      ))}

      {/* Estado vazio */}
      {!carregando && camposFiltrados.length === 0 && (
        <div className="rounded-xl border p-12 text-center"
          style={{ backgroundColor: 'var(--color-surface-card)', borderColor: 'var(--color-surface-border)' }}>
          <p className="text-4xl mb-3">🧩</p>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Nenhum campo customizado</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {busca || filtroTime
              ? 'Tente outros filtros.'
              : 'Crie campos personalizados para moldar a estrutura de dados do seu CRM.'}
          </p>
          {!busca && !filtroTime && (
            <button
              onClick={() => { setCampoEditando(null); setModalAberto(true); }}
              className="mt-4 bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Criar primeiro campo
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <ModalCampo
        aberto={modalAberto}
        onFechar={() => { setModalAberto(false); setCampoEditando(null); }}
        onSalvar={handleSalvar}
        campoEditando={campoEditando}
        times={times || []}
      />
    </div>
  );
};

export default PaginaCamposCustomizados;
