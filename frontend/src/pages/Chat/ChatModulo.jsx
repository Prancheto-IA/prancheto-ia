import { useState, useEffect, useMemo, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';

const formatarHora = (iso) => {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const AvatarUsuario = ({ nome, tamanho = 8 }) => {
  const iniciais = nome?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
  const cores = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];
  const cor = cores[iniciais.charCodeAt(0) % cores.length];
  return (
    <div
      className={`w-${tamanho} h-${tamanho} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ backgroundColor: cor, fontSize: tamanho <= 8 ? '0.65rem' : '0.9rem' }}
    >
      {iniciais}
    </div>
  );
};

const BolhaMensagem = ({ mensagem, ehMinha, nomeAutor }) => (
  <div className={`flex items-end gap-2 ${ehMinha ? 'flex-row-reverse' : 'flex-row'}`}>
    {!ehMinha && <AvatarUsuario nome={nomeAutor} tamanho={7} />}
    <div className={`max-w-[70%] space-y-1 ${ehMinha ? 'items-end' : 'items-start'} flex flex-col`}>
      {!ehMinha && <p className="text-xs opacity-40 px-1">{nomeAutor}</p>}
      <div
        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          ehMinha ? 'bg-primary-600 text-white rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={!ehMinha ? { backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' } : {}}
      >
        {mensagem.conteudo}
        {mensagem.editado_em && <span className="text-xs opacity-50 ml-1">(editado)</span>}
      </div>
      <p className="text-xs opacity-30 px-1">{formatarHora(mensagem.criado_em)}</p>
    </div>
  </div>
);

const ItemCanal = ({ canal, ativo, onClick, naoLidas }) => {
  const TIPO_ICONE = { direto: '👤', grupo: '👥', projeto: '📁', time: '🏷️' };
  return (
    <button
      onClick={() => onClick(canal)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        ativo ? 'bg-primary-600/30 border border-primary-500/30' : ''
      }`}
      onMouseEnter={e => { if (!ativo) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
      onMouseLeave={e => { if (!ativo) e.currentTarget.style.backgroundColor = ''; }}
    >
      <span className="text-lg flex-shrink-0">{canal.icone || TIPO_ICONE[canal.tipo] || '💬'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{canal.nome || 'Canal direto'}</p>
        <p className="text-xs opacity-40 capitalize">{canal.tipo}</p>
      </div>
      {naoLidas > 0 && (
        <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center flex-shrink-0">
          {naoLidas > 9 ? '9+' : naoLidas}
        </span>
      )}
    </button>
  );
};

// ─── Novo grupo (nome + membros iniciais) ───────────────────────
const ModalNovoGrupo = ({ aberto, onFechar, onCriar, usuariosTenant, usuarioAtualId }) => {
  const [form, setForm] = useState({ nome: '', descricao: '', icone: '💬' });
  const [membrosSelecionados, setMembrosSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (aberto) {
      setForm({ nome: '', descricao: '', icone: '💬' });
      setMembrosSelecionados([]);
      setBusca('');
      setErro('');
    }
  }, [aberto]);

  if (!aberto) return null;

  const inp = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500';
  const inpStyle = { border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' };

  const candidatos = usuariosTenant.filter((u) =>
    u.id !== usuarioAtualId &&
    !membrosSelecionados.includes(u.id) &&
    (busca ? u.nome.toLowerCase().includes(busca.toLowerCase()) : true)
  );
  const nomeSelecionado = (id) => usuariosTenant.find((u) => u.id === id)?.nome || 'Usuário';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await onCriar({ ...form, tipo: 'grupo', membrosIniciais: membrosSelecionados });
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao criar grupo.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Novo grupo</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input className="w-16 px-3 py-2 rounded-lg text-sm text-center" style={inpStyle} value={form.icone} onChange={e => setForm(f => ({ ...f, icone: e.target.value }))} />
            <input className={`flex-1 ${inp}`} style={inpStyle} placeholder="Nome do grupo" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
          </div>
          <input className={inp} style={inpStyle} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />

          <div>
            <p className="text-xs font-semibold opacity-60 mb-1.5">Adicionar membros</p>
            {membrosSelecionados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {membrosSelecionados.map((id) => (
                  <span key={id} className="text-xs px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}>
                    {nomeSelecionado(id)}
                    <button type="button" onClick={() => setMembrosSelecionados((prev) => prev.filter((m) => m !== id))} className="opacity-50 hover:opacity-100">✕</button>
                  </span>
                ))}
              </div>
            )}
            <input className={inp} style={inpStyle} placeholder="Buscar por nome..." value={busca} onChange={e => setBusca(e.target.value)} />
            <div className="mt-1.5 space-y-1 max-h-32 overflow-y-auto">
              {candidatos.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setMembrosSelecionados((prev) => [...prev, u.id])}
                  className="w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-sm transition-colors"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <AvatarUsuario nome={u.nome} tamanho={6} />
                  <span className="truncate">{u.nome}</span>
                </button>
              ))}
              {candidatos.length === 0 && <p className="text-xs opacity-40 text-center py-2">Ninguém encontrado.</p>}
            </div>
          </div>

          {erro && <p className="text-red-400 text-xs">{erro}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onFechar}
              className="flex-1 px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ border: '1px solid var(--color-surface-border)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>Cancelar</button>
            <button type="submit" disabled={salvando} className="flex-1 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 disabled:opacity-50 font-medium">
              {salvando ? 'Criando...' : 'Criar grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Membros do grupo: promover/rebaixar/remover/adicionar ─────
const ModalMembros = ({ aberto, onFechar, canal, membros, usuariosTenant, souAdmin, usuarioAtualId, onAdicionar, onRemover, onPromover, onRebaixar }) => {
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => { if (aberto) { setBusca(''); setErro(''); } }, [aberto]);

  if (!aberto || !canal) return null;

  const idsMembros = new Set(membros.map((m) => m.user_id));
  const candidatos = usuariosTenant.filter((u) =>
    !idsMembros.has(u.id) && (busca ? u.nome.toLowerCase().includes(busca.toLowerCase()) : true)
  );

  const executar = async (fn, ...args) => {
    setOcupado(true);
    setErro('');
    try {
      await fn(canal.id, ...args);
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar membro.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Membros do grupo</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>

        {erro && <p className="text-red-400 text-xs">{erro}</p>}

        <div className="space-y-2">
          {membros.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-surface-card)' }}>
              <AvatarUsuario nome={m.usuario?.nome} tamanho={7} />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{m.usuario?.nome || 'Usuário'}{m.user_id === usuarioAtualId ? ' (você)' : ''}</p>
                <p className="text-xs opacity-40">{m.papel === 'admin' ? '👑 Admin' : 'Membro'}</p>
              </div>
              {souAdmin && m.user_id !== usuarioAtualId && (
                <div className="flex gap-2 flex-shrink-0">
                  {m.papel === 'admin' ? (
                    <button disabled={ocupado} onClick={() => executar(onRebaixar, m.user_id)} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20" title="Remover admin">Rebaixar</button>
                  ) : (
                    <button disabled={ocupado} onClick={() => executar(onPromover, m.user_id)} className="text-xs opacity-50 hover:opacity-100 disabled:opacity-20" title="Tornar admin">Promover</button>
                  )}
                  <button disabled={ocupado} onClick={() => executar(onRemover, m.user_id)} className="text-xs text-red-400 opacity-70 hover:opacity-100 disabled:opacity-20" title="Remover do grupo">Remover</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {souAdmin && (
          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--color-surface-border)' }}>
            <p className="text-xs font-semibold opacity-60">Adicionar pessoa</p>
            <input
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {candidatos.map((u) => (
                <button
                  key={u.id}
                  onClick={() => executar(onAdicionar, u.id)}
                  disabled={ocupado}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors disabled:opacity-40"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                >
                  <AvatarUsuario nome={u.nome} tamanho={6} />
                  <span className="truncate">{u.nome}</span>
                </button>
              ))}
              {candidatos.length === 0 && <p className="text-xs opacity-40 text-center py-2">Ninguém encontrado.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatModulo = () => {
  const usuario = useAuthStore(s => s.usuario);
  const {
    canais, canalAtivo, mensagens, membros, usuariosTenant, souAdminDoCanalAtivo,
    carregandoCanais, carregandoMensagens, enviando,
    naoLidas, abrirCanal, enviarMensagem, criarCanal,
    adicionarMembro, removerMembro, promoverAdmin, rebaixarMembro,
  } = useChat();

  const [texto, setTexto] = useState('');
  const [modalNovoGrupoAberto, setModalNovoGrupoAberto] = useState(false);
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const fimRef = useRef(null);

  // Scroll automático para o fim
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Nome do autor de cada mensagem vem dos membros do canal aberto — não
  // existe (nunca existiu) coluna autor_nome em chat_mensagens.
  const nomePorUserId = useMemo(
    () => Object.fromEntries(membros.map((m) => [m.user_id, m.usuario?.nome])),
    [membros]
  );

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    const conteudo = texto;
    setTexto('');
    await enviarMensagem(conteudo);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(e);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar de canais */}
      <div className={`flex-shrink-0 border-r flex flex-col transition-all ${sidebarAberta ? 'w-64' : 'w-0 overflow-hidden'}`} style={{ borderColor: 'var(--color-surface-border)' }}>
        <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-surface-border)' }}>
          <h2 className="text-sm font-semibold">Canais</h2>
          <PermissaoGuarda permissao="chat.criar_grupo">
            <button
              onClick={() => setModalNovoGrupoAberto(true)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm transition-colors"
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              title="Novo grupo"
            >
              +
            </button>
          </PermissaoGuarda>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {carregandoCanais ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : canais.length === 0 ? (
            <p className="text-xs opacity-40 text-center py-8 px-2">
              Nenhum canal ainda.<br />Crie um grupo para começar.
            </p>
          ) : (
            canais.map(c => (
              <ItemCanal
                key={c.id}
                canal={c}
                ativo={canalAtivo?.id === c.id}
                onClick={abrirCanal}
                naoLidas={naoLidas[c.id] || 0}
              />
            ))
          )}
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Cabeçalho do canal */}
        <div className="px-4 py-3 border-b flex items-center gap-3" style={{ borderColor: 'var(--color-surface-border)' }}>
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="opacity-50 hover:opacity-100 text-sm"
          >
            ☰
          </button>
          {canalAtivo ? (
            <>
              <span className="text-lg">{canalAtivo.icone || '💬'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{canalAtivo.nome || 'Canal direto'}</p>
                {canalAtivo.descricao && <p className="text-xs opacity-40 truncate">{canalAtivo.descricao}</p>}
              </div>
              {canalAtivo.tipo === 'grupo' && (
                <button
                  onClick={() => setModalMembrosAberto(true)}
                  className="text-xs opacity-50 hover:opacity-100 flex-shrink-0 flex items-center gap-1"
                  title="Ver membros"
                >
                  👥 {membros.length || ''}
                </button>
              )}
            </>
          ) : (
            <p className="text-sm opacity-40">Selecione um canal</p>
          )}
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!canalAtivo ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <p className="text-4xl mb-3">💬</p>
              <p className="text-sm">Selecione um canal para começar</p>
            </div>
          ) : carregandoMensagens ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <p className="text-4xl mb-3">👋</p>
              <p className="text-sm">Seja o primeiro a enviar uma mensagem!</p>
            </div>
          ) : (
            mensagens.map(m => (
              <BolhaMensagem
                key={m.id}
                mensagem={m}
                ehMinha={m.autor_id === usuario?.id}
                nomeAutor={nomePorUserId[m.autor_id] || 'Usuário'}
              />
            ))
          )}
          <div ref={fimRef} />
        </div>

        {/* Input de mensagem */}
        {canalAtivo && (
          <form onSubmit={handleEnviar} className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--color-surface-border)' }}>
            <textarea
              className="flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-primary-500 resize-none"
              style={{ border: '1px solid var(--color-surface-border)', backgroundColor: 'var(--color-surface-card)' }}
              placeholder="Mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              rows={1}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="px-4 py-2 rounded-xl text-sm bg-primary-600 hover:bg-primary-500 disabled:opacity-40 font-medium flex-shrink-0"
            >
              {enviando ? '...' : '→'}
            </button>
          </form>
        )}
      </div>
      </div>

      <ModalNovoGrupo
        aberto={modalNovoGrupoAberto}
        onFechar={() => setModalNovoGrupoAberto(false)}
        onCriar={criarCanal}
        usuariosTenant={usuariosTenant}
        usuarioAtualId={usuario?.id}
      />

      <ModalMembros
        aberto={modalMembrosAberto}
        onFechar={() => setModalMembrosAberto(false)}
        canal={canalAtivo}
        membros={membros}
        usuariosTenant={usuariosTenant}
        souAdmin={souAdminDoCanalAtivo}
        usuarioAtualId={usuario?.id}
        onAdicionar={adicionarMembro}
        onRemover={removerMembro}
        onPromover={promoverAdmin}
        onRebaixar={rebaixarMembro}
      />
    </div>
  );
};

export default ChatModulo;
