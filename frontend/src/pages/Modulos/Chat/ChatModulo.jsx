import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../../hooks/useChat';
import { useAuthStore } from '../../../store/authStore';

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
          ehMinha
            ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-white/10 rounded-bl-sm'
        }`}
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
        ativo ? 'bg-primary-600/30 border border-primary-500/30' : 'hover:bg-white/5'
      }`}
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

const ModalNovoCanal = ({ aberto, onFechar, onCriar }) => {
  const [form, setForm] = useState({ nome: '', tipo: 'grupo', descricao: '', icone: '💬' });

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCriar(form);
    onFechar();
  };

  const inp = 'w-full px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 focus:outline-none focus:border-primary-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Novo canal</h2>
          <button onClick={onFechar} className="opacity-50 hover:opacity-100 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input className="w-16 px-3 py-2 rounded-lg text-sm border border-white/10 bg-white/5 text-center" value={form.icone} onChange={e => setForm(f => ({ ...f, icone: e.target.value }))} />
            <input className={`flex-1 ${inp}`} placeholder="Nome do canal" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
          </div>
          <select className={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="grupo">Grupo</option>
            <option value="projeto">Projeto</option>
            <option value="time">Time</option>
          </select>
          <input className={inp} placeholder="Descrição (opcional)" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onFechar} className="flex-1 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5">Cancelar</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-500 font-medium">Criar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ChatModulo = () => {
  const usuario = useAuthStore(s => s.usuario);
  const {
    canais, canalAtivo, mensagens,
    carregandoCanais, carregandoMensagens, enviando,
    naoLidas, abrirCanal, enviarMensagem, criarCanal,
  } = useChat();

  const [texto, setTexto] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const fimRef = useRef(null);

  // Scroll automático para o fim
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sidebar de canais */}
      <div className={`flex-shrink-0 border-r border-white/10 flex flex-col transition-all ${sidebarAberta ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Canais</h2>
          <button
            onClick={() => setModalAberto(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-sm hover:bg-white/10 transition-colors"
            title="Novo canal"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {carregandoCanais ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : canais.length === 0 ? (
            <p className="text-xs opacity-40 text-center py-8 px-2">
              Nenhum canal ainda.<br />Crie um para começar.
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
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
          <button
            onClick={() => setSidebarAberta(!sidebarAberta)}
            className="opacity-50 hover:opacity-100 text-sm"
          >
            ☰
          </button>
          {canalAtivo ? (
            <>
              <span className="text-lg">{canalAtivo.icone || '💬'}</span>
              <div>
                <p className="text-sm font-semibold">{canalAtivo.nome || 'Canal direto'}</p>
                {canalAtivo.descricao && <p className="text-xs opacity-40">{canalAtivo.descricao}</p>}
              </div>
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
                nomeAutor={m.autor_nome || 'Usuário'}
              />
            ))
          )}
          <div ref={fimRef} />
        </div>

        {/* Input de mensagem */}
        {canalAtivo && (
          <form onSubmit={handleEnviar} className="p-3 border-t border-white/10 flex gap-2">
            <textarea
              className="flex-1 px-3 py-2 rounded-xl text-sm border border-white/10 bg-white/5 focus:outline-none focus:border-primary-500 resize-none"
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

      <ModalNovoCanal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriar={criarCanal}
      />
    </div>
  );
};

export default ChatModulo;
