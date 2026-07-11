import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeed, TIPOS_POSTAGEM, EMOJIS_REACAO } from '../../../hooks/useFeed';
import { useAuthStore } from '../../../store/authStore';

const formatarTempo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
};

const AvatarUsuario = ({ nome, tamanho = 8 }) => {
  const iniciais = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const cores = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
  const cor = cores[iniciais.charCodeAt(0) % cores.length];
  return (
    <div
      className={`w-${tamanho} h-${tamanho} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: cor, fontSize: tamanho <= 8 ? '0.7rem' : '1rem' }}
    >
      {iniciais}
    </div>
  );
};

const CardPostagem = ({ postagem, onReagir, onComentar, onExcluir, usuarioAtual }) => {
  const [expandirComentarios, setExpandirComentarios] = useState(false);
  const [novoComentario, setNovoComentario] = useState('');
  const [mostrarEmojis, setMostrarEmojis] = useState(false);

  const tipo = TIPOS_POSTAGEM.find(t => t.slug === postagem.tipo) || TIPOS_POSTAGEM[0];
  const comentarios = postagem.feed_comentarios || [];
  const reacoes = postagem.feed_reacoes || [];

  // Agrupa reações por emoji
  const reacoesPorEmoji = EMOJIS_REACAO.reduce((acc, emoji) => {
    const count = reacoes.filter(r => r.emoji === emoji).length;
    const euReagi = reacoes.some(r => r.emoji === emoji && r.user_id === usuarioAtual?.id);
    if (count > 0) acc.push({ emoji, count, euReagi });
    return acc;
  }, []);

  const handleComentar = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    await onComentar(postagem.id, novoComentario);
    setNovoComentario('');
  };

  return (
    <div className="rounded-xl p-5 space-y-4 border" style={{ borderColor: 'var(--color-surface-border)' }}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <AvatarUsuario nome={postagem.autor_nome || 'U'} />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{postagem.autor_nome || 'Usuário'}</p>
              <span className="text-xs opacity-40">{tipo.icone} {tipo.label}</span>
              {postagem.fixado && <span className="text-xs opacity-40">📌</span>}
            </div>
            <p className="text-xs opacity-40">{formatarTempo(postagem.criado_em)}</p>
          </div>
        </div>
        {postagem.autor_id === usuarioAtual?.id && (
          <button onClick={() => onExcluir(postagem.id)} className="opacity-30 hover:opacity-100 text-red-400 text-xs">✕</button>
        )}
      </div>

      {/* Conteúdo */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{postagem.conteudo}</p>

      {/* Reações existentes */}
      {reacoesPorEmoji.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reacoesPorEmoji.map(({ emoji, count, euReagi }) => (
            <button
              key={emoji}
              onClick={() => onReagir(postagem.id, emoji)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                euReagi ? 'bg-primary-500/30 border border-primary-500/50' : ''
              }`}
              style={!euReagi ? { backgroundColor: 'var(--color-surface-hover)' } : {}}
              onMouseEnter={e => { if (!euReagi) e.currentTarget.style.backgroundColor = 'var(--color-surface-border)'; }}
              onMouseLeave={e => { if (!euReagi) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
            >
              {emoji} {count}
            </button>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-4 pt-1 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="relative">
          <button
            onClick={() => setMostrarEmojis(!mostrarEmojis)}
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity"
          >
            😊 Reagir
          </button>
          {mostrarEmojis && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 rounded-xl z-10" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
              {EMOJIS_REACAO.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { onReagir(postagem.id, emoji); setMostrarEmojis(false); }}
                  className="text-lg hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpandirComentarios(!expandirComentarios)}
          className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          💬 {comentarios.length > 0 ? `${comentarios.length} comentário${comentarios.length > 1 ? 's' : ''}` : 'Comentar'}
        </button>
      </div>

      {/* Comentários */}
      {expandirComentarios && (
        <div className="space-y-3 pt-2">
          {comentarios.map(c => (
            <div key={c.id} className="flex items-start gap-2">
              <AvatarUsuario nome={c.autor_nome || 'U'} tamanho={6} />
              <div className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: 'var(--color-surface-card)' }}>
                <p className="text-xs font-medium opacity-70">{c.autor_nome || 'Usuário'}</p>
                <p className="text-sm">{c.conteudo}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleComentar} className="flex gap-2">
            <AvatarUsuario nome={usuarioAtual?.nome || 'U'} tamanho={6} />
            <input
              className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary-500"
              style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
              placeholder="Escreva um comentário..."
              value={novoComentario}
              onChange={e => setNovoComentario(e.target.value)}
            />
            <button type="submit" disabled={!novoComentario.trim()} className="px-3 py-2 rounded-xl text-sm bg-primary-600 hover:bg-primary-500 disabled:opacity-40">
              →
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const navigate = useNavigate();
  const usuario = useAuthStore(s => s.usuario);
  const { postagens, carregando, temMais, publicar, excluirPostagem, reagir, comentar, carregarMais } = useFeed();
  const [novaPostagem, setNovaPostagem] = useState('');
  const [tipoPostagem, setTipoPostagem] = useState('texto');
  const [publicando, setPublicando] = useState(false);

  const handlePublicar = async (e) => {
    e.preventDefault();
    if (!novaPostagem.trim()) return;
    setPublicando(true);
    try {
      await publicar({ conteudo: novaPostagem, tipo: tipoPostagem });
      setNovaPostagem('');
      setTipoPostagem('texto');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/modulos')}
        className="text-sm opacity-50 hover:opacity-100 transition-opacity"
        title="Voltar para Módulos"
      >
        ← Voltar
      </button>

      <h1 className="text-2xl font-bold">Feed</h1>

      {/* Caixa de nova postagem */}
      <form onSubmit={handlePublicar} className="rounded-xl p-4 space-y-3 border" style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="flex items-start gap-3">
          <AvatarUsuario nome={usuario?.nome || 'U'} />
          <textarea
            className="flex-1 bg-transparent text-sm resize-none focus:outline-none placeholder-white/30"
            placeholder="O que está acontecendo?"
            rows={3}
            value={novaPostagem}
            onChange={e => setNovaPostagem(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-surface-border)' }}>
          <div className="flex gap-1">
            {TIPOS_POSTAGEM.map(t => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setTipoPostagem(t.slug)}
                className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                  tipoPostagem === t.slug ? 'bg-primary-600' : 'opacity-40 hover:opacity-100'
                }`}
                title={t.label}
              >
                {t.icone}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={publicando || !novaPostagem.trim()}
            className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium disabled:opacity-40"
          >
            {publicando ? '...' : 'Publicar'}
          </button>
        </div>
      </form>

      {/* Lista de postagens */}
      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : postagens.length === 0 ? (
        <div className="text-center py-16 opacity-40">
          <p className="text-4xl mb-3">📢</p>
          <p className="text-sm">Nenhuma postagem ainda. Seja o primeiro!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {postagens.map(p => (
            <CardPostagem
              key={p.id}
              postagem={p}
              onReagir={reagir}
              onComentar={comentar}
              onExcluir={excluirPostagem}
              usuarioAtual={usuario}
            />
          ))}
          {temMais && (
            <button
              onClick={carregarMais}
              className="w-full py-3 text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              Carregar mais
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Feed;
