// =============================================================
// PRANCHETO.IA - SUPORTE / Base de Conhecimento
// Leitura de artigos para todos; gestão para admin/manager.
// =============================================================

import { useState, useEffect, useMemo } from 'react';
import { useBaseConhecimento } from '../../hooks/useBaseConhecimento.js';
import { useAuthStore } from '../../store/authStore.js';
import { useUIStore } from '../../store/uiStore.js';

const inputBase =
  'w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50';

const FORM_ARTIGO_VAZIO = { titulo: '', categoria_id: '', conteudo: '', publicado: true };

// ─── Modal: leitor de artigo ───────────────────────────────────
const LeitorArtigo = ({ artigo, categoria, podeEditar, onFechar, onEditar, onExcluir, onRegistrarVisualizacao }) => {
  useEffect(() => { onRegistrarVisualizacao(artigo); }, [artigo.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-2xl my-4 flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-surface-border">
          <div className="min-w-0">
            {categoria && (
              <span className="text-xs text-slate-400">{categoria.icone} {categoria.nome}</span>
            )}
            <h3 className="text-white font-semibold text-lg">{artigo.titulo}</h3>
            {!artigo.publicado && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                Rascunho
              </span>
            )}
          </div>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg flex-shrink-0">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {artigo.conteudo
            ? <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{artigo.conteudo}</p>
            : <p className="text-slate-500 text-sm">Este artigo ainda não tem conteúdo.</p>}
        </div>

        {podeEditar && (
          <div className="p-5 border-t border-surface-border flex gap-2">
            <button
              onClick={() => onExcluir(artigo.id)}
              className="px-4 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Excluir
            </button>
            <button
              onClick={() => onEditar(artigo)}
              className="ml-auto px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
            >
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Modal: criar/editar artigo ────────────────────────────────
const ModalArtigo = ({ aberto, artigoEditando, categorias, onFechar, onSalvar }) => {
  const [form, setForm] = useState(FORM_ARTIGO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (artigoEditando) {
      setForm({
        titulo: artigoEditando.titulo || '',
        categoria_id: artigoEditando.categoria_id || '',
        conteudo: artigoEditando.conteudo || '',
        publicado: artigoEditando.publicado ?? true,
      });
    } else {
      setForm(FORM_ARTIGO_VAZIO);
    }
    setErro('');
  }, [artigoEditando, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setErro('Informe o título do artigo.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar({
        titulo: form.titulo.trim(),
        categoria_id: form.categoria_id || null,
        conteudo: form.conteudo.trim() || null,
        publicado: form.publicado,
      });
      onFechar();
    } catch (err) {
      console.error('ModalArtigo.handleSubmit:', err);
      setErro('Não foi possível salvar o artigo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-2xl my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">{artigoEditando ? 'Editar artigo' : 'Novo artigo'}</h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Título *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Como fazer..."
              className={inputBase}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Categoria</label>
            <select
              value={form.categoria_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_id: e.target.value }))}
              className={inputBase}
            >
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Conteúdo</label>
            <textarea
              value={form.conteudo}
              onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))}
              placeholder="Escreva o conteúdo do artigo..."
              rows={8}
              className={`${inputBase} resize-none`}
            />
          </div>

          <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.publicado}
              onChange={(e) => setForm((f) => ({ ...f, publicado: e.target.checked }))}
              className="accent-primary-600"
            />
            Publicado (visível para todos os membros)
          </label>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onFechar}
              className="flex-1 bg-surface border border-surface-border text-slate-300 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">
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

// ─── Modal: gerenciar categorias ───────────────────────────────
const ModalCategorias = ({ aberto, categorias, onFechar, onCriar, onExcluir }) => {
  const [nome, setNome] = useState('');
  const [icone, setIcone] = useState('📚');
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    try {
      await onCriar({ nome: nome.trim(), icone: icone.trim() || '📚' });
      setNome('');
      setIcone('📚');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-card border border-surface-border rounded-xl p-6 w-full max-w-md my-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Categorias</h3>
          <button onClick={onFechar} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input value={icone} onChange={(e) => setIcone(e.target.value)}
            className="w-14 bg-surface border border-surface-border rounded-lg px-2 py-2 text-white text-sm text-center" />
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nova categoria"
            className={inputBase} />
          <button type="submit" disabled={salvando || !nome.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50">
            +
          </button>
        </form>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categorias.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">Nenhuma categoria criada.</p>
          ) : (
            categorias.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-surface border border-surface-border rounded-lg px-3 py-2">
                <span>{c.icone}</span>
                <span className="text-slate-300 text-sm flex-1 truncate">{c.nome}</span>
                <button onClick={() => onExcluir(c.id)} className="text-slate-500 hover:text-red-400 text-sm">🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Card de artigo ────────────────────────────────────────────
const CardArtigo = ({ artigo, categoria, onClick }) => (
  <div
    onClick={onClick}
    className="bg-surface-card border border-surface-border rounded-xl p-4 cursor-pointer hover:border-primary-500/30 transition-colors"
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-white font-medium text-sm">{artigo.titulo}</p>
      {!artigo.publicado && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 flex-shrink-0">Rascunho</span>
      )}
    </div>
    {categoria && <p className="text-slate-500 text-xs mt-1">{categoria.icone} {categoria.nome}</p>}
    {artigo.conteudo && <p className="text-slate-400 text-xs mt-2 line-clamp-2">{artigo.conteudo}</p>}
    <p className="text-slate-500 text-xs mt-3">👁️ {artigo.visualizacoes || 0} visualizaç{(artigo.visualizacoes === 1) ? 'ão' : 'ões'}</p>
  </div>
);

// ─── Página principal ──────────────────────────────────────────
const BaseConhecimento = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const { adicionarNotificacao } = useUIStore();
  const podeEditar = ['admin', 'manager'].includes(usuario?.cargo);

  const {
    categorias, artigos, carregando,
    criarCategoria, excluirCategoria,
    criarArtigo, atualizarArtigo, excluirArtigo,
    registrarVisualizacao,
  } = useBaseConhecimento();

  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [artigoLendo, setArtigoLendo] = useState(null);
  const [modalArtigo, setModalArtigo] = useState(false);
  const [artigoEditando, setArtigoEditando] = useState(null);
  const [modalCategorias, setModalCategorias] = useState(false);

  const categoriaPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c])),
    [categorias]
  );

  const artigosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return artigos.filter((a) => {
      if (filtroCategoria !== 'todas' && a.categoria_id !== filtroCategoria) return false;
      if (termo && !`${a.titulo} ${a.conteudo || ''}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [artigos, busca, filtroCategoria]);

  const handleSalvarArtigo = async (dados) => {
    if (artigoEditando) {
      await atualizarArtigo(artigoEditando.id, dados);
      adicionarNotificacao('success', 'Artigo atualizado.');
    } else {
      await criarArtigo(dados);
      adicionarNotificacao('success', 'Artigo criado.');
    }
  };

  const handleExcluirArtigo = async (id) => {
    if (!window.confirm('Excluir este artigo?')) return;
    try {
      await excluirArtigo(id);
      setArtigoLendo(null);
      adicionarNotificacao('success', 'Artigo excluído.');
    } catch {
      adicionarNotificacao('error', 'Não foi possível excluir o artigo.');
    }
  };

  const handleCriarCategoria = async (dados) => {
    try {
      await criarCategoria(dados);
    } catch {
      adicionarNotificacao('error', 'Não foi possível criar a categoria.');
    }
  };

  const handleExcluirCategoria = async (id) => {
    if (!window.confirm('Excluir esta categoria? Os artigos ficarão sem categoria.')) return;
    try {
      await excluirCategoria(id);
    } catch {
      adicionarNotificacao('error', 'Não foi possível excluir a categoria.');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Base de Conhecimento</h2>
          <p className="text-slate-400 text-sm mt-1">Artigos e tutoriais para tirar dúvidas.</p>
        </div>
        {podeEditar && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setModalCategorias(true)}
              className="bg-surface border border-surface-border text-slate-300 px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Categorias
            </button>
            <button
              onClick={() => { setArtigoEditando(null); setModalArtigo(true); }}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span>+</span> Novo artigo
            </button>
          </div>
        )}
      </div>

      {/* Busca */}
      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="🔍 Buscar artigos..."
        className={`${inputBase} mb-4`}
      />

      {/* Filtro de categorias */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'todas', nome: 'Todas', icone: '' }, ...categorias].map((c) => (
          <button
            key={c.id}
            onClick={() => setFiltroCategoria(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtroCategoria === c.id
                ? 'bg-primary-600 text-white'
                : 'bg-surface-card border border-surface-border text-slate-400 hover:text-white'
            }`}
          >
            {c.icone} {c.nome}
          </button>
        ))}
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      ) : artigosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-surface-card border border-surface-border rounded-xl">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-white font-medium mb-1">Nenhum artigo encontrado</p>
          <p className="text-slate-400 text-sm">
            {busca || filtroCategoria !== 'todas'
              ? 'Ajuste a busca ou o filtro de categoria.'
              : 'Ainda não há artigos na base de conhecimento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {artigosFiltrados.map((a) => (
            <CardArtigo
              key={a.id}
              artigo={a}
              categoria={categoriaPorId[a.categoria_id]}
              onClick={() => setArtigoLendo(a)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      {artigoLendo && (
        <LeitorArtigo
          artigo={artigoLendo}
          categoria={categoriaPorId[artigoLendo.categoria_id]}
          podeEditar={podeEditar}
          onFechar={() => setArtigoLendo(null)}
          onEditar={(a) => { setArtigoLendo(null); setArtigoEditando(a); setModalArtigo(true); }}
          onExcluir={handleExcluirArtigo}
          onRegistrarVisualizacao={registrarVisualizacao}
        />
      )}

      <ModalArtigo
        aberto={modalArtigo}
        artigoEditando={artigoEditando}
        categorias={categorias}
        onFechar={() => { setModalArtigo(false); setArtigoEditando(null); }}
        onSalvar={handleSalvarArtigo}
      />

      <ModalCategorias
        aberto={modalCategorias}
        categorias={categorias}
        onFechar={() => setModalCategorias(false)}
        onCriar={handleCriarCategoria}
        onExcluir={handleExcluirCategoria}
      />
    </div>
  );
};

export default BaseConhecimento;
