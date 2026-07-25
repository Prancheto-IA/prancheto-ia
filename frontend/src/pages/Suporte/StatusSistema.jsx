// =============================================================
// PRANCHETO.IA - SUPORTE / Status do Sistema
// Visão geral de disponibilidade; gestão para admin/manager.
// =============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  useStatusSistema,
  STATUS_COMPONENTE,
  IMPACTO_INCIDENTE,
} from '../../hooks/useStatusSistema.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';

const inputBase =
  'w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50';

const formatarDataHora = (valor) =>
  valor ? new Date(valor).toLocaleString('pt-BR') : '';

const FORM_COMPONENTE_VAZIO = { nome: '', descricao: '', status: 'operacional' };
const FORM_INCIDENTE_VAZIO = { titulo: '', descricao: '', impacto: 'menor', componente_id: '' };

// ─── Banner de status geral ────────────────────────────────────
const BannerGeral = ({ componentes }) => {
  if (componentes.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 mb-6">
        <p className="text-white font-medium">Nenhum componente monitorado</p>
        <p className="text-slate-400 text-sm mt-1">Adicione componentes para acompanhar a disponibilidade.</p>
      </div>
    );
  }

  const todosOperacionais = componentes.every((c) => c.status === 'operacional');
  const cor = todosOperacionais ? STATUS_COMPONENTE.operacional.cor : STATUS_COMPONENTE.degradado.cor;

  return (
    <div
      className="rounded-xl p-5 mb-6 border"
      style={{ backgroundColor: cor + '15', borderColor: cor + '40' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{todosOperacionais ? '🟢' : '🟡'}</span>
        <div>
          <p className="text-white font-semibold">
            {todosOperacionais ? 'Todos os sistemas operacionais' : 'Alguns sistemas com instabilidade'}
          </p>
          <p className="text-slate-400 text-sm">
            {componentes.filter((c) => c.status === 'operacional').length} de {componentes.length} componentes operacionais
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── Modal: componente ─────────────────────────────────────────
const ModalComponente = ({ aberto, componenteEditando, onFechar, onSalvar }) => {
  const [form, setForm] = useState(FORM_COMPONENTE_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (componenteEditando) {
      setForm({
        nome: componenteEditando.nome || '',
        descricao: componenteEditando.descricao || '',
        status: componenteEditando.status || 'operacional',
      });
    } else {
      setForm(FORM_COMPONENTE_VAZIO);
    }
    setErro('');
  }, [componenteEditando, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Informe o nome do componente.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        status: form.status,
      });
      onFechar();
    } catch (err) {
      console.error('ModalComponente.handleSubmit:', err);
      setErro('Não foi possível salvar o componente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">{componenteEditando ? 'Editar componente' : 'Novo componente'}</h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Nome *</label>
            <input type="text" value={form.nome} placeholder="Ex: API, Banco de dados, Chat"
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className={inputBase} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Descrição</label>
            <input type="text" value={form.descricao} placeholder="Opcional"
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className={inputBase} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputBase}>
              {Object.entries(STATUS_COMPONENTE).map(([k, v]) => (
                <option key={k} value={k}>{v.emoji} {v.label}</option>
              ))}
            </select>
          </div>
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">Cancelar</button>
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

// ─── Modal: incidente ──────────────────────────────────────────
const ModalIncidente = ({ aberto, componentes, onFechar, onSalvar }) => {
  const [form, setForm] = useState(FORM_INCIDENTE_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => { if (aberto) { setForm(FORM_INCIDENTE_VAZIO); setErro(''); } }, [aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro('Informe o título do incidente.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        impacto: form.impacto,
        componente_id: form.componente_id || null,
      });
      onFechar();
    } catch (err) {
      console.error('ModalIncidente.handleSubmit:', err);
      setErro('Não foi possível registrar o incidente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Registrar incidente</h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Título *</label>
            <input type="text" value={form.titulo} placeholder="Ex: Lentidão na API"
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} className={inputBase} />
          </div>
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Descrição</label>
            <textarea value={form.descricao} rows={3} placeholder="O que está acontecendo..."
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className={`${inputBase} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Impacto</label>
              <select value={form.impacto} onChange={(e) => setForm((f) => ({ ...f, impacto: e.target.value }))} className={inputBase}>
                {Object.entries(IMPACTO_INCIDENTE).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Componente</label>
              <select value={form.componente_id} onChange={(e) => setForm((f) => ({ ...f, componente_id: e.target.value }))} className={inputBase}>
                <option value="">Geral</option>
                {componentes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          {erro && <p className="text-red-400 text-xs">{erro}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">Cancelar</button>
            <button type="submit" disabled={salvando}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Linha de componente ───────────────────────────────────────
const LinhaComponente = ({ componente, podeEditar, onMudarStatus, onEditar, onExcluir }) => {
  const s = STATUS_COMPONENTE[componente.status] || STATUS_COMPONENTE.operacional;
  return (
    <div className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-xl p-4">
      <span className="text-lg">{s.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-medium truncate">{componente.nome}</p>
        {componente.descricao && <p className="text-slate-500 text-xs truncate">{componente.descricao}</p>}
      </div>
      {podeEditar ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={componente.status}
            onChange={(e) => onMudarStatus(componente.id, e.target.value)}
            className="bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-slate-300 text-xs focus:outline-none focus:border-primary-500/50"
          >
            {Object.entries(STATUS_COMPONENTE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => onEditar(componente)} className="text-slate-500 hover:text-primary-400 text-sm" title="Editar">✏️</button>
          <button onClick={() => onExcluir(componente.id)} className="text-slate-500 hover:text-red-400 text-sm" title="Excluir">🗑️</button>
        </div>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.cor + '22', color: s.cor }}>
          {s.label}
        </span>
      )}
    </div>
  );
};

// ─── Card de incidente ─────────────────────────────────────────
const CardIncidente = ({ incidente, componente, podeEditar, onResolver, onExcluir }) => {
  const imp = IMPACTO_INCIDENTE[incidente.impacto] || IMPACTO_INCIDENTE.menor;
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: imp.cor + '22', color: imp.cor }}>
              {imp.label}
            </span>
            {incidente.resolvido
              ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Resolvido</span>
              : <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300">Ativo</span>}
            {componente && <span className="text-slate-500 text-xs">• {componente.nome}</span>}
          </div>
          <p className="text-white text-sm font-medium mt-2">{incidente.titulo}</p>
          {incidente.descricao && <p className="text-slate-400 text-xs mt-1">{incidente.descricao}</p>}
          <p className="text-slate-500 text-xs mt-2">📅 {formatarDataHora(incidente.criado_em)}</p>
        </div>
        {podeEditar && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {!incidente.resolvido && (
              <button onClick={() => onResolver(incidente.id)}
                className="text-emerald-400 hover:text-emerald-300 text-xs whitespace-nowrap" title="Marcar como resolvido">
                ✓ Resolver
              </button>
            )}
            <button onClick={() => onExcluir(incidente.id)} className="text-slate-500 hover:text-red-400 text-sm" title="Excluir">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Página principal ──────────────────────────────────────────
const StatusSistema = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const { adicionarNotificacao } = useUIStore();
  const podeEditar = ['admin', 'manager'].includes(usuario?.cargo);

  const {
    componentes, incidentes, carregando,
    criarComponente, atualizarComponente, excluirComponente,
    criarIncidente, atualizarIncidente, excluirIncidente,
  } = useStatusSistema();

  const [modalComponente, setModalComponente] = useState(false);
  const [componenteEditando, setComponenteEditando] = useState(null);
  const [modalIncidente, setModalIncidente] = useState(false);

  const componentePorId = useMemo(
    () => Object.fromEntries(componentes.map((c) => [c.id, c])),
    [componentes]
  );

  const incidentesAtivos = incidentes.filter((i) => !i.resolvido);
  const incidentesResolvidos = incidentes.filter((i) => i.resolvido);

  const handleSalvarComponente = async (dados) => {
    if (componenteEditando) {
      await atualizarComponente(componenteEditando.id, dados);
      adicionarNotificacao('success', 'Componente atualizado.');
    } else {
      await criarComponente(dados);
      adicionarNotificacao('success', 'Componente criado.');
    }
  };

  const handleMudarStatusComponente = async (id, status) => {
    try {
      await atualizarComponente(id, { status });
    } catch {
      adicionarNotificacao('error', 'Não foi possível atualizar o status.');
    }
  };

  const handleExcluirComponente = async (id) => {
    if (!window.confirm('Excluir este componente?')) return;
    try {
      await excluirComponente(id);
      adicionarNotificacao('success', 'Componente excluído.');
    } catch {
      adicionarNotificacao('error', 'Não foi possível excluir o componente.');
    }
  };

  const handleSalvarIncidente = async (dados) => {
    await criarIncidente(dados);
    adicionarNotificacao('success', 'Incidente registrado.');
  };

  const handleResolverIncidente = async (id) => {
    try {
      await atualizarIncidente(id, { resolvido: true, resolvido_em: new Date().toISOString() });
      adicionarNotificacao('success', 'Incidente resolvido.');
    } catch {
      adicionarNotificacao('error', 'Não foi possível resolver o incidente.');
    }
  };

  const handleExcluirIncidente = async (id) => {
    if (!window.confirm('Excluir este incidente?')) return;
    try {
      await excluirIncidente(id);
      adicionarNotificacao('success', 'Incidente excluído.');
    } catch {
      adicionarNotificacao('error', 'Não foi possível excluir o incidente.');
    }
  };

  if (carregando) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-400 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Status do Sistema</h2>
          <p className="text-slate-400 text-sm mt-1">Disponibilidade dos serviços e incidentes.</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setModalIncidente(true)}
              className="bg-surface border border-surface-border text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Registrar incidente
            </button>
            <button
              onClick={() => { setComponenteEditando(null); setModalComponente(true); }}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>+</span> Componente
            </button>
          </div>
        )}
      </div>

      {/* Banner geral */}
      <BannerGeral componentes={componentes} />

      {/* Componentes */}
      {componentes.length > 0 && (
        <div className="space-y-2 mb-8">
          {componentes.map((c) => (
            <LinhaComponente
              key={c.id}
              componente={c}
              podeEditar={podeEditar}
              onMudarStatus={handleMudarStatusComponente}
              onEditar={(comp) => { setComponenteEditando(comp); setModalComponente(true); }}
              onExcluir={handleExcluirComponente}
            />
          ))}
        </div>
      )}

      {/* Incidentes ativos */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Incidentes ativos</h3>
        {incidentesAtivos.length === 0 ? (
          <div className="bg-surface-card border border-surface-border rounded-xl p-5 text-center">
            <p className="text-slate-400 text-sm">✅ Nenhum incidente ativo no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidentesAtivos.map((i) => (
              <CardIncidente
                key={i.id}
                incidente={i}
                componente={componentePorId[i.componente_id]}
                podeEditar={podeEditar}
                onResolver={handleResolverIncidente}
                onExcluir={handleExcluirIncidente}
              />
            ))}
          </div>
        )}
      </div>

      {/* Histórico */}
      {incidentesResolvidos.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Histórico</h3>
          <div className="space-y-3">
            {incidentesResolvidos.map((i) => (
              <CardIncidente
                key={i.id}
                incidente={i}
                componente={componentePorId[i.componente_id]}
                podeEditar={podeEditar}
                onResolver={handleResolverIncidente}
                onExcluir={handleExcluirIncidente}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modais */}
      <ModalComponente
        aberto={modalComponente}
        componenteEditando={componenteEditando}
        onFechar={() => { setModalComponente(false); setComponenteEditando(null); }}
        onSalvar={handleSalvarComponente}
      />
      <ModalIncidente
        aberto={modalIncidente}
        componentes={componentes}
        onFechar={() => setModalIncidente(false)}
        onSalvar={handleSalvarIncidente}
      />
    </div>
  );
};

export default StatusSistema;
