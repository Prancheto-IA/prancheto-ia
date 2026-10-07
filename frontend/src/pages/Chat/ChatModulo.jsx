// =============================================================
// PRANCHETO.IA - CHAT DA EQUIPE & IA (EMITLY DESIGN SYSTEM)
// Interface de mensagens com suporte a canais, grupos, DMs,
// assistente IA, notas de voz com waveform e anexos.
// Baseado no protótipo Stitch (stitch_chat_c1fa328e.html).
// =============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { useAuthStore } from '../../store/authStore.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';

const formatarHora = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Mapeamento de Ícones SVG inline para alta fidelidade
const ICONES = {
  search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  tune: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  filter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  ),
  bot: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  video: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  sidebar: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  more: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  eye: (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  play: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  pause: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  clip: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  emoji: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  mic: (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  send: (
    <svg className="w-4 h-4 fill-current ml-0.5" viewBox="0 0 24 24">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  ),
  checkDouble: (
    <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7M5 7l4 4" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 5v14m7-7H5" />
    </svg>
  ),
};

const AvatarUsuario = ({ nome, tamanho = 'w-10 h-10', online = false, badge = null, foto = null }) => {
  const iniciais = nome?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';
  const cores = ['#0E382C', '#15803D', '#047857', '#0f766e', '#1d4ed8', '#4338ca'];
  const bgCor = cores[iniciais.charCodeAt(0) % cores.length];

  return (
    <div className={`relative shrink-0 ${tamanho}`}>
      {foto ? (
        <img src={foto} alt={nome} className={`${tamanho} rounded-xl object-cover shadow-xs`} />
      ) : (
        <div
          className={`${tamanho} rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs`}
          style={{ backgroundColor: bgCor }}
        >
          {iniciais}
        </div>
      )}
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
      )}
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4EC9D] text-[#0E382C] rounded-full flex items-center justify-center ring-2 ring-white text-[9px] font-bold shadow-xs">
          {badge}
        </span>
      )}
    </div>
  );
};

// Player de Áudio / Nota de Voz com Waveform Animado
const PlayerNotaVoz = ({ duracao = '0:36', tamanho = '2.0 MB', transcricao = '' }) => {
  const [tocando, setTocando] = useState(false);
  const [mostrarTranscricao, setMostrarTranscricao] = useState(true);

  return (
    <div className="bg-white border border-[#E4ECE7] rounded-2xl rounded-tl-xs p-3.5 shadow-xs max-w-md space-y-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTocando(!tocando)}
          className="w-10 h-10 rounded-full bg-[#0E382C] text-white flex items-center justify-center hover:bg-[#07261E] shadow-xs active:scale-95 transition-all shrink-0"
        >
          {tocando ? ICONES.pause : ICONES.play}
        </button>

        {/* Waveform Bars */}
        <div className="flex-1 flex items-center gap-1 h-8 px-1">
          {[12, 20, 28, 16, 32, 24, 12, 20, 32, 16, 24, 12, 28, 20, 8, 16, 24, 12].map((height, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full transition-all ${
                idx < 6
                  ? 'bg-[#0E382C]'
                  : idx < 12
                  ? 'bg-[#15803D]'
                  : 'bg-slate-300'
              } ${tocando ? 'animate-pulse' : ''}`}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs font-bold text-[#111915]">{duracao}</p>
          <p className="text-[10px] text-[#687770]">{tamanho}</p>
        </div>
      </div>

      {transcricao && (
        <div className="pt-2 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-[#15803D] text-[11px] font-semibold">
              {ICONES.sparkles}
              <span>Transcrição Prancheto.IA</span>
            </div>
            <button
              type="button"
              onClick={() => setMostrarTranscricao(!mostrarTranscricao)}
              className="text-[10px] font-semibold text-[#687770] hover:underline"
            >
              {mostrarTranscricao ? 'Ocultar' : 'Ver texto'}
            </button>
          </div>
          {mostrarTranscricao && (
            <p className="text-xs text-[#687770] bg-[#F7FAF8] p-2.5 rounded-xl border border-[#E4ECE7] italic leading-relaxed">
              "{transcricao}"
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Componente de Mensagem Rica (Texto, Imagens, Áudios, Reações)
const BolhaMensagem = ({ mensagem, ehMinha, nomeAutor }) => {

  return (
    <div className={`flex items-start gap-3 max-w-2xl ${ehMinha ? 'ml-auto justify-end' : ''}`}>
      {!ehMinha && <AvatarUsuario nome={nomeAutor} tamanho="w-9 h-9" />}

      <div className={`space-y-1.5 flex flex-col ${ehMinha ? 'items-end' : 'items-start'}`}>
        {!ehMinha && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold text-[#111915]">{nomeAutor}</span>
            <span className="text-[10px] text-[#687770]">{formatarHora(mensagem.criado_em)}</span>
          </div>
        )}

        {/* Áudio / Nota de Voz */}
        {mensagem.tipo === 'audio' ? (
          <PlayerNotaVoz
            duracao={mensagem.duracao || '0:36'}
            tamanho={mensagem.tamanho || '2.0 MB'}
            transcricao={mensagem.transcricao || 'Pessoal, ajustamos o cronograma da entrega e confirmamos o handover com o time.'}
          />
        ) : mensagem.imagem_url ? (
          /* Anexo de Imagem */
          <div className="bg-white border border-[#E4ECE7] rounded-2xl rounded-tl-xs p-3 shadow-xs max-w-lg space-y-2">
            <p className="text-xs text-[#111915] font-medium leading-relaxed">{mensagem.conteudo}</p>
            <div className="relative rounded-xl overflow-hidden border border-[#E4ECE7] group">
              <img
                src={mensagem.imagem_url}
                alt="Anexo"
                className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-3 text-white">
                <span className="text-[11px] font-medium truncate">Anexo_review_final.png</span>
                <button type="button" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-xs transition-colors">
                  {ICONES.download}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Balão de Texto Padrão */
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
              ehMinha
                ? 'bg-[#0E382C] text-white rounded-tr-xs'
                : 'bg-white text-[#111915] border border-[#E4ECE7] rounded-tl-xs'
            }`}
          >
            <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>

            {ehMinha && (
              <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-200">
                <span>{formatarHora(mensagem.criado_em)}</span>
              </div>
            )}
          </div>
        )}


      </div>

      {ehMinha && <AvatarUsuario nome={nomeAutor} tamanho="w-9 h-9" />}
    </div>
  );
};



// Modal Membros
const ModalMembros = ({ aberto, onFechar, canal, membros, usuariosTenant, souAdmin, usuarioAtualId, onAdicionar, onRemover, onPromover, onRebaixar }) => {
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  if (!aberto || !canal) return null;

  const idsMembros = new Set(membros.map((m) => m.user_id));
  const candidatos = usuariosTenant.filter(
    (u) => !idsMembros.has(u.id) && (busca ? u.nome.toLowerCase().includes(busca.toLowerCase()) : true)
  );

  const executar = async (fn, ...args) => {
    setOcupado(true);
    setErro('');
    try {
      await fn(canal.id, ...args);
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E4ECE7] p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3">
          <div>
            <h2 className="font-bold text-[#111915] text-base">Membros do Grupo</h2>
            <p className="text-xs text-[#687770]">{canal.nome}</p>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {erro && <p className="text-red-500 text-xs">{erro}</p>}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {membros.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
              <AvatarUsuario nome={m.usuario?.nome} tamanho="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#111915] truncate">
                  {m.usuario?.nome || 'Usuário'}{m.user_id === usuarioAtualId ? ' (você)' : ''}
                </p>
                <span className="text-[10px] text-[#687770] font-semibold">{m.papel === 'admin' ? '👑 Admin' : 'Membro'}</span>
              </div>
              {souAdmin && m.user_id !== usuarioAtualId && (
                <div className="flex gap-1.5 flex-shrink-0">
                  {m.papel === 'admin' ? (
                    <button onClick={() => executar(onRebaixar, m.user_id)} className="text-[11px] font-semibold text-slate-500 hover:underline">Rebaixar</button>
                  ) : (
                    <button onClick={() => executar(onPromover, m.user_id)} className="text-[11px] font-semibold text-emerald-700 hover:underline">Promover</button>
                  )}
                  <button onClick={() => executar(onRemover, m.user_id)} className="text-[11px] font-semibold text-red-600 hover:underline">Remover</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {souAdmin && (
          <div className="pt-3 border-t border-[#E4ECE7] space-y-2">
            <p className="text-xs font-bold text-[#687770]">Adicionar Pessoa ao Grupo</p>
            <input
              className="w-full px-3 py-2 rounded-xl text-xs border border-[#E4ECE7] bg-[#F7FAF8]"
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {candidatos.map((u) => (
                <button
                  key={u.id}
                  onClick={() => executar(onAdicionar, u.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs hover:bg-[#DCF5E4]/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AvatarUsuario nome={u.nome} tamanho="w-7 h-7" />
                    <span className="font-semibold text-[#111915]">{u.nome}</span>
                  </div>
                  <span className="text-[11px] text-[#15803D] font-bold">+ Adicionar</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================
// COMPONENTE PRINCIPAL: ChatModulo
// =============================================================
const ChatModulo = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const {
    canais, canalAtivo, mensagens, membros, usuariosTenant, souAdminDoCanalAtivo,
    carregandoCanais, carregandoMensagens, enviando,
    naoLidas, abrirCanal, enviarMensagem, criarCanal,
    adicionarMembro, removerMembro, promoverAdmin, rebaixarMembro,
  } = useChat();

  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('todos'); // 'todos' | 'canais' | 'ia' | 'diretas'
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);
  const fimRef = useRef(null);

  // Auto-scroll ao receber ou enviar mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const nomePorUserId = useMemo(
    () => Object.fromEntries(membros.map((m) => [m.user_id, m.usuario?.nome])),
    [membros]
  );

  // Filtro de canais por aba e busca
  const canaisFiltrados = useMemo(() => {
    return canais.filter((c) => {
      const matchBusca = c.nome ? c.nome.toLowerCase().includes(busca.toLowerCase()) : true;
      if (!matchBusca) return false;

      if (abaAtiva === 'canais') return c.tipo === 'grupo' || c.tipo === 'time' || c.tipo === 'projeto';
      if (abaAtiva === 'ia') return c.tipo === 'ia' || c.slug === 'assistente_ia' || c.nome?.toLowerCase().includes('ia');
      if (abaAtiva === 'diretas') return c.tipo === 'direto';
      return true;
    });
  }, [canais, abaAtiva, busca]);

  // Criação/Início direto de conversa sem modal
  const handleNovoChat = async () => {
    try {
      const novoCanal = await criarCanal({ nome: `Nova Conversa ${canais.length + 1}` });
      if (novoCanal) {
        await abrirCanal(novoCanal);
      }
    } catch (err) {
      console.error('Erro ao criar conversa:', err);
    }
  };

  const handleEnviar = async (e) => {
    e?.preventDefault();
    if (!texto.trim() || enviando) return;
    const conteudo = texto;
    setTexto('');

    let targetCanal = canalAtivo;
    if (!targetCanal) {
      if (canais.length > 0) {
        targetCanal = canais[0];
        await abrirCanal(targetCanal);
      } else {
        try {
          targetCanal = await criarCanal({ nome: 'Nova Conversa' });
          if (targetCanal) await abrirCanal(targetCanal);
        } catch (err) {
          console.error('Erro ao criar conversa:', err);
        }
      }
    }

    if (targetCanal) {
      await enviarMensagem(conteudo);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(e);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] flex gap-3 sm:gap-4 overflow-hidden font-sans">
      {/* --------------------------------------------------------
          COLUNA ESQUERDA: Conversas / Sidebar
         -------------------------------------------------------- */}
      <aside className="w-full md:w-80 lg:w-96 flex flex-col bg-white rounded-2xl border border-[#E4ECE7] shadow-[0_8px_30px_-4px_rgba(14,56,44,0.04)] shrink-0 overflow-hidden">
        {/* Top Search & Novo Chat */}
        <div className="p-3 border-b border-[#E4ECE7] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3 text-[#687770] pointer-events-none">{ICONES.search}</span>
              <input
                type="text"
                placeholder="Pesquisar conversas, membros..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#F7FAF8] hover:bg-white text-xs text-[#111915] placeholder-slate-400 pl-9 pr-8 py-2 rounded-xl border border-[#E4ECE7] focus:outline-none focus:border-[#0E382C] transition-all"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-600">✕</button>
              )}
            </div>

            <PermissaoGuarda permissao="chat.criar_grupo">
              <button
                onClick={handleNovoChat}
                className="p-2 text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8] rounded-xl border border-[#E4ECE7] transition-colors shrink-0 flex items-center justify-center"
                title="Nova conversa"
              >
                {ICONES.edit}
              </button>
            </PermissaoGuarda>
          </div>
        </div>

        {/* Lista de Canais / Conversas */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {carregandoCanais ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : canaisFiltrados.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs font-semibold text-[#687770]">Nenhuma conversa encontrada.</p>
            </div>
          ) : (
            canaisFiltrados.map((c) => {
              const ativo = canalAtivo?.id === c.id;
              const unread = naoLidas[c.id] || 0;
              const ehIA = c.tipo === 'ia' || c.nome?.toLowerCase().includes('ia');

              return (
                <div
                  key={c.id}
                  onClick={() => abrirCanal(c)}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    ativo
                      ? 'bg-[#DCF5E4]/40 border-[#DCF5E4]'
                      : 'bg-white border-transparent hover:bg-[#F7FAF8]'
                  }`}
                >
                  {ativo && <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-[#0E382C] rounded-r-full" />}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className={`text-xs font-bold truncate flex items-center gap-1 ${ativo ? 'text-[#0E382C]' : 'text-[#111915]'}`}>
                        {c.nome || 'Canal direto'}
                        {ehIA && (
                          <span className="px-1.5 py-0.2 bg-[#DCF5E4] text-[#15803D] text-[9px] font-extrabold rounded-md">BOT</span>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-[#687770] font-medium">14:32</span>
                        {unread > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#D4EC9D] text-[#0E382C] rounded-full flex items-center justify-center text-[9px] font-bold">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-[#687770] truncate">
                      {c.descricao || 'Mensagem mais recente da conversa...'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>


      </aside>

      {/* --------------------------------------------------------
          COLUNA DIREITA: Tela Principal do Chat
         -------------------------------------------------------- */}
      <section className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E4ECE7] shadow-[0_8px_30px_-4px_rgba(14,56,44,0.04)] overflow-hidden min-w-0">
        {/* Cabeçalho do Chat */}
        <div className="px-5 py-3 border-b border-[#E4ECE7] flex items-center justify-between bg-white flex-shrink-0 z-10">
          {canalAtivo ? (
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-base font-extrabold text-[#111915] truncate">{canalAtivo.nome || 'Canal de Comunicação'}</h1>
            </div>
          ) : (
            <p className="text-xs font-semibold text-[#687770]">Selecione uma conversa para começar</p>
          )}

          {/* Ações do Topo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="p-2 text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8] rounded-xl transition-colors" title="Busca no chat">{ICONES.search}</button>
          </div>
        </div>

        {/* Histórico de Mensagens / Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F7FAF8]/60 custom-scrollbar">
          {/* Date Separator */}
          <div className="flex items-center justify-center my-2">
            <div className="h-px bg-[#E4ECE7] flex-1" />
            <span className="px-3.5 py-1 bg-white border border-[#E4ECE7] text-[#687770] rounded-full text-[11px] font-semibold mx-4 shadow-2xs">
              Hoje, 6 de Outubro
            </span>
            <div className="h-px bg-[#E4ECE7] flex-1" />
          </div>

          {!canalAtivo ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center text-xl mb-3">💬</div>
              <h3 className="font-bold text-[#111915] text-sm mb-1">Nenhum canal selecionado</h3>
              <p className="text-xs text-[#687770]">Escolha uma conversa na barra lateral para interagir.</p>
            </div>
          ) : carregandoMensagens ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-[#DCF5E4] text-[#15803D] flex items-center justify-center text-xl mb-3">👋</div>
              <h3 className="font-bold text-[#111915] text-sm mb-1">Seja o primeiro a mandar mensagem!</h3>
              <p className="text-xs text-[#687770]">Inicie o alinhamento com a equipe ou tire dúvidas com a IA.</p>
            </div>
          ) : (
            mensagens.map((m) => (
              <BolhaMensagem
                key={m.id}
                mensagem={m}
                ehMinha={m.autor_id === usuario?.id}
                nomeAutor={nomePorUserId[m.autor_id] || 'Membro do Time'}
              />
            ))
          )}
          <div ref={fimRef} />
        </div>

        {/* Barra de Envio / Input Flutuante - Sempre Visível */}
        <div className="px-4 pb-4 pt-1 bg-[#F7FAF8]/60 flex-shrink-0">
          <form
            onSubmit={handleEnviar}
            className="bg-white border border-[#E4ECE7] rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-[0_4px_20px_-2px_rgba(14,56,44,0.08)] focus-within:border-[#0E382C] focus-within:ring-2 focus-within:ring-[#0E382C]/10 transition-all"
          >
            {/* Botão + para Anexar Arquivo */}
            <button
              type="button"
              className="p-1.5 text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8] rounded-xl transition-colors shrink-0"
              title="Anexar arquivo"
            >
              {ICONES.plus}
            </button>

            <input
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={canalAtivo ? "Digite sua mensagem..." : "Digite sua mensagem para iniciar uma conversa..."}
              className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#111915] placeholder-slate-400 focus:outline-none focus:ring-0 p-0"
            />

            <button type="button" className="p-1 text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8] rounded-lg transition-colors" title="Emoji">{ICONES.emoji}</button>
            <button type="button" className="p-1 text-[#687770] hover:text-[#0E382C] hover:bg-[#F7FAF8] rounded-lg transition-colors" title="Gravador de voz">{ICONES.mic}</button>

            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              className="w-7 h-7 rounded-xl bg-[#0E382C] text-white hover:bg-[#07261E] disabled:opacity-40 flex items-center justify-center shadow-xs transition-all shrink-0 active:scale-95 ml-1"
              title="Enviar mensagem"
            >
              {enviando ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : ICONES.send}
            </button>
          </form>
        </div>
      </section>

      {/* Modais de Gerenciamento */}
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
