// =============================================================
// PRANCHETO.IA - CHAT DA EQUIPE & MENSAGENS DIRETAS (EMITLY DESIGN SYSTEM)
// Layout moderno de 3 colunas (Sidebar, Feed, Informações do Contato/Grupo)
// com suporte a conversas individuais (DMs), grupos de trabalho,
// notas de voz interativas com waveform, reações de emoji,
// envio de anexos/imagens simulados, gravador de áudio e painel de mídias/links.
// 100% em Português e integrado ao ecossistema do Prancheto.IA.
// =============================================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useChat } from '../../hooks/useChat.js';
import { useAuthStore } from '../../store/authStore.js';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  Call02Icon,
  Video01Icon,
  ViewSidebarRightIcon,
  MoreHorizontalIcon,
  Download01Icon,
  PlayIcon,
  PauseIcon,
  Attachment01Icon,
  SmileIcon,
  Mic01Icon,
  SentIcon,
  Add01Icon,
  Cancel01Icon,
  CrownIcon,
  Notification01Icon,
  PinIcon,
  UserAdd01Icon,
  UserGroupIcon,
  Settings02Icon,
  Image01Icon,
  File01Icon,
  Link01Icon,
  UserMultiple02Icon,
  Folder01Icon,
  Delete02Icon,
  Tag01Icon,
  ArrowDown01Icon,
  StarIcon,
} from '@hugeicons/core-free-icons';

// -------------------------------------------------------------
// UTILITÁRIOS
// -------------------------------------------------------------
const formatarHora = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatarDataCabecalho = (iso) => {
  if (!iso) return 'Hoje';
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return 'Hoje';
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// Colegas de trabalho padrão para demonstração ou tenant sem múltiplos usuários
const COLEGAS_DEMO = [
  { id: 'demo-1', nome: 'Jerome Bell', cargo: 'Product Designer', online: true, tempo: 'Agora', ultimaMsg: 'Olá, como você está?', unread: 2, fixado: true, etiquetas: ['urgente', 'projetos'] },
  { id: 'demo-2', nome: 'Brooklyn Simmons', cargo: 'Marketing Lead', online: true, tempo: '5 min', ultimaMsg: 'Enviei o arquivo de briefing no grupo.', unread: 0, fixado: false, etiquetas: ['projetos'] },
  { id: 'demo-3', nome: 'Jacob Jones', cargo: 'Copywriter Sênior', online: false, tempo: '12 min', ultimaMsg: 'O texto do anúncio ficou aprovado!', unread: 0, fixado: false, etiquetas: ['projetos'] },
  { id: 'demo-4', nome: 'Marvin McKinney', cargo: 'Desenvolvedor Frontend', online: true, tempo: '25 min', ultimaMsg: 'A tela de relatórios foi finalizada.', unread: 3, fixado: true, etiquetas: ['urgente'] },
  { id: 'demo-5', nome: 'Kristin Watson', cargo: 'Comercial & Vendas', online: false, tempo: '1h', ultimaMsg: 'Cliente confirmou a proposta hoje.', unread: 0, fixado: false, etiquetas: ['clientes'] },
];

const GRUPOS_DEMO = [
  { id: 'grp-1', nome: 'Equipe de Marketing', descricao: 'Campanhas, briefings e métricas de tráfego', totalMembros: 24, tempo: '1 min', ultimaMsg: 'Wade: O que precisamos fazer para iniciar?', unread: 1, fixado: true, etiquetas: ['projetos'] },
  { id: 'grp-2', nome: 'Design & UX/UI', descricao: 'Alinhamento visual e protótipos Figma', totalMembros: 8, tempo: '15 min', ultimaMsg: 'Vou dar uma olhada na prancha hoje.', unread: 0, fixado: false, etiquetas: ['projetos'] },
  { id: 'grp-3', nome: 'Comercial & Vendas', descricao: 'Negociações de alto valor e leads quentes', totalMembros: 12, tempo: '2h', ultimaMsg: 'Meta da semana batida com sucesso!', unread: 0, fixado: false, etiquetas: ['clientes'] },
];

// Configuração das Etiquetas de Filtro do Chat
const LISTA_ETIQUETAS = [
  { id: 'todas', nome: 'Todas as conversas', cor: '#0E382C', dot: 'bg-[#0E382C]', icone: Tag01Icon },
  { id: 'nao_lidas', nome: 'Não lidas', cor: '#0E382C', dot: 'bg-emerald-500', icone: Notification01Icon },
  { id: 'urgente', nome: 'Urgente', cor: '#EF4444', dot: 'bg-red-500', icone: Tag01Icon },
  { id: 'diretas', nome: 'Mensagens Diretas', cor: '#2563EB', dot: 'bg-blue-500', icone: UserMultiple02Icon },
  { id: 'grupos', nome: 'Grupos & Equipes', cor: '#059669', dot: 'bg-emerald-600', icone: UserGroupIcon },
  { id: 'fixadas', nome: 'Fixadas & Favoritas', cor: '#D97706', dot: 'bg-amber-500', icone: StarIcon },
  { id: 'projetos', nome: 'Projetos', cor: '#7C3AED', dot: 'bg-purple-500', icone: Folder01Icon },
  { id: 'clientes', nome: 'Clientes', cor: '#EA580C', dot: 'bg-orange-500', icone: Tag01Icon },
];

// -------------------------------------------------------------
// COMPONENTE: Avatar de Usuário / Grupo
// -------------------------------------------------------------
const AvatarChat = ({
  nome = 'Usuário',
  tamanho = 'w-10 h-10',
  tamanhoFonte = 'text-sm',
  online = false,
  badge = null,
  foto = null,
  tipo = 'usuario',
}) => {
  const iniciais = nome
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const paletas = [
    'from-[#0E382C] to-[#15803D]',
    'from-[#1E3A8A] to-[#3B82F6]',
    'from-[#701A75] to-[#D946EF]',
    'from-[#7C2D12] to-[#EA580C]',
    'from-[#0F766E] to-[#14B8A6]',
    'from-[#831843] to-[#F43F5E]',
  ];
  const charCode = (nome?.charCodeAt(0) || 0) + (nome?.charCodeAt(1) || 0);
  const gradiente = paletas[charCode % paletas.length];

  return (
    <div className={`relative shrink-0 ${tamanho}`}>
      {foto ? (
        <img
          src={foto}
          alt={nome}
          className={`${tamanho} rounded-full object-cover shadow-2xs border border-[#E4ECE7]`}
        />
      ) : (
        <div
          className={`${tamanho} rounded-full bg-gradient-to-br ${gradiente} flex items-center justify-center text-white font-bold ${tamanhoFonte} shadow-2xs`}
        >
          {tipo === 'grupo' ? (
            <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={2.2} />
          ) : (
            iniciais
          )}
        </div>
      )}

      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
      )}

      {badge !== null && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#0E382C] text-white rounded-full flex items-center justify-center ring-2 ring-white text-[10px] font-extrabold shadow-xs">
          {badge}
        </span>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE: Player de Nota de Voz com Waveform Interativo
// -------------------------------------------------------------
const PlayerNotaVoz = ({
  duracao = '0:36',
  reacoes = [{ emoji: '❤️', qtd: 2 }, { emoji: '😍', qtd: 4 }, { emoji: '👍', qtd: 2 }],
}) => {
  const [tocando, setTocando] = useState(false);

  return (
    <div className="space-y-1.5 max-w-sm">
      <div className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-2xl p-3 flex items-center gap-3 shadow-2xs">
        <button
          type="button"
          onClick={() => setTocando(!tocando)}
          className="w-9 h-9 rounded-full bg-[#0E382C] text-white flex items-center justify-center hover:bg-[#07261E] shadow-xs active:scale-95 transition-all shrink-0"
          title={tocando ? 'Pausar áudio' : 'Reproduzir áudio'}
        >
          <HugeiconsIcon icon={tocando ? PauseIcon : PlayIcon} size={18} strokeWidth={2.2} />
        </button>

        {/* Barras animadas de waveform */}
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 h-7 px-1">
          {[12, 18, 26, 14, 28, 22, 10, 18, 28, 14, 22, 10, 26, 18, 8, 14, 22, 12, 20, 14].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all ${
                i < 8
                  ? 'bg-[#0E382C]'
                  : i < 14
                  ? 'bg-[#15803D]/60'
                  : 'bg-[#CBDCD1]'
              } ${tocando ? 'animate-pulse' : ''}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>

        <span className="text-sm font-bold text-[#687770] shrink-0 font-mono">
          {duracao}
        </span>
      </div>

      {/* Pílulas de Reações com Emojis */}
      {reacoes && reacoes.length > 0 && (
        <div className="flex items-center gap-1.5 pl-2">
          {reacoes.map((r, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#E4ECE7] rounded-full text-[11px] font-semibold text-[#111915] shadow-2xs hover:bg-[#F7FAF8] cursor-pointer transition-colors"
            >
              <span>{r.emoji}</span>
              <span className="text-[10px] text-[#687770] font-bold">{r.qtd}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE: Bolha de Mensagem no Feed (Recebida vs Enviada)
// -------------------------------------------------------------
const BolhaMensagem = ({ mensagem, ehMinha, autorNome }) => {
  const horaStr = formatarHora(mensagem.criado_em) || 'Agora';
  const reacoesExemplo = mensagem.reacoes || (mensagem.tipo === 'audio' ? [{ emoji: '❤️', qtd: 2 }, { emoji: '😍', qtd: 4 }, { emoji: '👍', qtd: 2 }] : null);

  return (
    <div className={`flex items-start gap-2.5 sm:gap-3 group ${ehMinha ? 'justify-end' : 'justify-start'}`}>
      {!ehMinha && (
        <AvatarChat nome={autorNome} tamanho="w-8 h-8 sm:w-9 sm:h-9" online={false} />
      )}

      <div className={`space-y-1 max-w-[85%] sm:max-w-[70%] flex flex-col ${ehMinha ? 'items-end' : 'items-start'}`}>
        {!ehMinha && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-sm font-bold text-[#111915]">{autorNome}</span>
            <span className="text-[10px] text-[#687770] font-medium">{horaStr}</span>
          </div>
        )}

        {/* Tipo: Áudio Gravado */}
        {mensagem.tipo === 'audio' ? (
          <PlayerNotaVoz duracao={mensagem.duracao || '0:36'} reacoes={reacoesExemplo} />
        ) : mensagem.imagem_url ? (
          /* Tipo: Imagem Anexada */
          <div className="bg-white border border-[#E4ECE7] rounded-2xl p-2.5 shadow-2xs space-y-2">
            {mensagem.conteudo && (
              <p className="text-sm text-[#111915] font-medium leading-relaxed px-1">{mensagem.conteudo}</p>
            )}
            <div className="relative rounded-xl overflow-hidden border border-[#E4ECE7] group/img">
              <img
                src={mensagem.imagem_url}
                alt="Anexo"
                className="w-full max-h-60 object-cover transition-transform duration-300 group-hover/img:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-between p-2.5 text-white">
                <span className="text-[11px] font-medium truncate">{mensagem.nome_arquivo || 'Anexo_imagem.png'}</span>
                <button
                  type="button"
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/40 backdrop-blur-xs transition-colors"
                  title="Baixar imagem"
                >
                  <HugeiconsIcon icon={Download01Icon} size={15} />
                </button>
              </div>
            </div>
          </div>
        ) : mensagem.tipo === 'arquivo' ? (
          /* Tipo: Arquivo Anexado */
          <div className="bg-white border border-[#E4ECE7] rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3 max-w-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#DCF5E4] text-[#0E382C] flex items-center justify-center shrink-0">
                <HugeiconsIcon icon={File01Icon} size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111915] truncate">{mensagem.nome_arquivo || mensagem.conteudo}</p>
                <p className="text-[10px] text-[#687770] font-medium">{mensagem.tamanho || '2.4 MB'}</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg border border-[#E4ECE7] hover:bg-[#F7FAF8] text-[#0E382C] transition-colors shrink-0"
              title="Baixar arquivo"
            >
              <HugeiconsIcon icon={Download01Icon} size={15} />
            </button>
          </div>
        ) : (
          /* Tipo: Mensagem de Texto Padrão */
          <div className="space-y-1">
            <div
              className={`px-4 py-2.5 rounded-2xl text-sm sm:text-[13px] leading-relaxed shadow-2xs ${
                ehMinha
                  ? 'bg-[#0E382C] text-white rounded-tr-xs'
                  : 'bg-white text-[#111915] border border-[#E4ECE7] rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{mensagem.conteudo}</p>
            </div>

            {/* Reações / Carimbo de Hora */}
            <div className={`flex items-center gap-1.5 px-1 ${ehMinha ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-[#687770] font-medium">{horaStr}</span>
              {reacoesExemplo && (
                <div className="flex items-center gap-1 ml-1">
                  {reacoesExemplo.map((r, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-white border border-[#E4ECE7] rounded-full text-[10px] font-semibold text-[#111915] shadow-2xs"
                    >
                      <span>{r.emoji}</span>
                      <span className="text-[9px] text-[#687770] font-bold">{r.qtd}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {ehMinha && (
        <AvatarChat nome={autorNome} tamanho="w-8 h-8 sm:w-9 sm:h-9" online={true} />
      )}
    </div>
  );
};

// -------------------------------------------------------------
// COMPONENTE: Painel de Informações do Grupo / Contato (Coluna 3)
// -------------------------------------------------------------
const PainelInfoGrupo = ({ canal, membros, onFechar, onAbrirMembros }) => {
  const ehGrupo = canal?.tipo !== 'direto' && (canal?.tipo === 'grupo' || canal?.tipo === 'time' || (canal?.totalMembros || membros.length) > 2);
  const nomeExibicao = canal?.nome || (ehGrupo ? 'Grupo' : 'Contato');
  const totalMembros = canal?.totalMembros || membros.length || 1;

  // Imagens de exemplo compartilhadas no grupo
  const imagensExemplo = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=200&auto=format&fit=crop&q=60',
  ];

  // Arquivos compartilhados
  const arquivosExemplo = [
    { nome: '642 TB-DSHN_0001.pdf', tamanho: '3.58 MB', data: '12 Nov, 2026', ext: 'pdf' },
    { nome: 'Report_semana42.mp4', tamanho: '66.75 MB', data: '12 Nov, 2026', ext: 'mp4' },
    { nome: 'Briefing_Campanha_Marketing.docx', tamanho: '2.21 MB', data: '12 Nov, 2026', ext: 'word' },
  ];

  // Links compartilhados
  const linksExemplo = [
    { titulo: 'Neuromarketing: Como marcas crescem...', dominio: 'youtube.com', data: '12 Nov, 2026' },
    { titulo: 'Documentação da Equipe & Handover', dominio: 'confluence.com', data: '12 Nov, 2026' },
    { titulo: 'Estratégia de Posicionamento e Branding', dominio: 'youtube.com', data: '12 Nov, 2026' },
  ];

  return (
    <aside className="w-80 xl:w-88 bg-white border-l border-[#E4ECE7] h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar select-none animate-in fade-in duration-200">
      {/* Cabeçalho do Painel */}
      <div className="p-4 border-b border-[#E4ECE7] flex items-center justify-between sticky top-0 bg-white z-10">
        <h3 className="font-extrabold text-sm text-[#111915]">
          {ehGrupo ? 'Informações do Grupo' : 'Informações do Contato'}
        </h3>
        <button
          type="button"
          onClick={onFechar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#111915] hover:bg-[#F7FAF8] transition-colors"
          title="Fechar painel"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Bloco de Perfil do Grupo / Usuário */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AvatarChat nome={nomeExibicao} tamanho="w-20 h-20" tamanhoFonte="text-xl" tipo={ehGrupo ? 'grupo' : 'usuario'} />
          <div>
            <h2 className="text-base font-extrabold text-[#111915] leading-tight">
              {nomeExibicao}
            </h2>
            <p className="text-sm text-[#687770] font-medium mt-0.5">
              {canal?.descricao || (ehGrupo ? `${totalMembros} membros participantes` : (canal?.cargo ? `${canal.cargo} • Disponível` : 'Disponível online'))}
            </p>
          </div>

          {/* 4 Botões de Ação Rápida */}
          <div className="grid grid-cols-4 gap-2 w-full pt-3">
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#F7FAF8] group-hover:bg-[#DCF5E4] flex items-center justify-center text-[#111915] group-hover:text-[#0E382C] transition-colors">
                <HugeiconsIcon icon={Notification01Icon} size={15} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-[#687770] group-hover:text-[#111915] truncate">
                Notificação
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#F7FAF8] group-hover:bg-[#DCF5E4] flex items-center justify-center text-[#111915] group-hover:text-[#0E382C] transition-colors">
                <HugeiconsIcon icon={PinIcon} size={15} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-[#687770] group-hover:text-[#111915] truncate">
                Fixar
              </span>
            </button>

            <button
              type="button"
              onClick={onAbrirMembros}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#F7FAF8] group-hover:bg-[#DCF5E4] flex items-center justify-center text-[#111915] group-hover:text-[#0E382C] transition-colors">
                <HugeiconsIcon icon={UserAdd01Icon} size={15} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-[#687770] group-hover:text-[#111915] truncate">
                Membros
              </span>
            </button>

            <button
              type="button"
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-[#F7FAF8] group-hover:bg-[#DCF5E4] flex items-center justify-center text-[#111915] group-hover:text-[#0E382C] transition-colors">
                <HugeiconsIcon icon={Settings02Icon} size={15} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-[#687770] group-hover:text-[#111915] truncate">
                Ajustes
              </span>
            </button>
          </div>
        </div>

        {/* Seção: Membros */}
        <div className="space-y-3 pt-2 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#111915]">Membros</h4>
            <button
              type="button"
              onClick={onAbrirMembros}
              className="text-[11px] font-bold text-[#0E382C] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div
            onClick={onAbrirMembros}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F7FAF8] cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-[#DCF5E4] text-[#0E382C] flex items-center justify-center">
              <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-bold text-[#111915] block truncate">
                {totalMembros} {totalMembros === 1 ? 'membro participante' : 'membros participantes'}
              </span>
              <span className="text-[10px] text-[#687770]">Gerenciar permissões e convites</span>
            </div>
          </div>
        </div>

        {/* Seção: Imagens */}
        <div className="space-y-3 pt-2 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#111915]">Imagens & Mídias</h4>
            <button type="button" className="text-[11px] font-bold text-[#0E382C] hover:underline">
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {imagensExemplo.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden border border-[#E4ECE7] hover:opacity-90 cursor-pointer transition-opacity group"
              >
                <img src={url} alt={`Mídia ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ))}
          </div>
        </div>

        {/* Seção: Arquivos */}
        <div className="space-y-3 pt-2 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#111915]">Arquivos Compartilhados</h4>
            <button type="button" className="text-[11px] font-bold text-[#0E382C] hover:underline">
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {arquivosExemplo.map((arq, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAF8] transition-colors border border-transparent hover:border-[#E4ECE7] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#DCF5E4] text-[#0E382C] border border-[#CBDCD1] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={File01Icon} size={15} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111915] truncate">{arq.nome}</p>
                    <p className="text-[10px] text-[#687770] font-medium">{arq.tamanho}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#8A9A92] shrink-0 font-medium">{arq.data}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Seção: Links */}
        <div className="space-y-3 pt-2 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-[#111915]">Links Compartilhados</h4>
            <button type="button" className="text-[11px] font-bold text-[#0E382C] hover:underline">
              Ver todos
            </button>
          </div>

          <div className="space-y-2">
            {linksExemplo.map((lnk, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F7FAF8] transition-colors border border-transparent hover:border-[#E4ECE7] cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#DCF5E4] text-[#0E382C] flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Link01Icon} size={15} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#111915] truncate">{lnk.titulo}</p>
                    <p className="text-[10px] text-[#687770] font-medium">{lnk.dominio}</p>
                  </div>
                </div>
                <span className="text-[10px] text-[#8A9A92] shrink-0 font-medium">{lnk.data}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

// -------------------------------------------------------------
// MODAL: Nova Mensagem (Criar Grupo ou Iniciar Chat Individual)
// -------------------------------------------------------------
const ModalNovaMensagem = ({
  aberto,
  onFechar,
  onCriarGrupo,
  onIniciarChatDireto,
  usuariosTenant,
}) => {
  const [abaModal, setAbaModal] = useState('direta'); // 'direta' | 'grupo'
  const [busca, setBusca] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [descricaoGrupo, setDescricaoGrupo] = useState('');
  const [membrosSelecionados, setMembrosSelecionados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  if (!aberto) return null;

  const listaColegas = usuariosTenant.length > 0 ? usuariosTenant : COLEGAS_DEMO;
  const colegasFiltrados = listaColegas.filter((u) =>
    busca ? u.nome.toLowerCase().includes(busca.toLowerCase()) : true
  );

  const toggleMembro = (id) => {
    setMembrosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCriarGrupo = async (e) => {
    e.preventDefault();
    if (!nomeGrupo.trim() || salvando) return;
    setSalvando(true);
    try {
      await onCriarGrupo({
        nome: nomeGrupo.trim(),
        tipo: 'grupo',
        descricao: descricaoGrupo.trim() || null,
        membrosIniciais: membrosSelecionados,
      });
      onFechar();
    } catch (err) {
      console.error('Erro ao criar grupo:', err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E4ECE7] p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3.5">
          <div>
            <h2 className="font-extrabold text-[#111915] text-base">Nova Mensagem</h2>
            <p className="text-sm text-[#687770]">Converse individualmente ou crie um novo grupo</p>
          </div>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Abas: Chat Individual vs Criar Grupo */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F0F4F2] rounded-xl border border-[#E4ECE7]">
          <button
            type="button"
            onClick={() => setAbaModal('direta')}
            className={`py-1.5 text-sm font-bold rounded-lg transition-all ${
              abaModal === 'direta' ? 'bg-white text-[#111915] shadow-2xs' : 'text-[#687770] hover:text-[#111915]'
            }`}
          >
            Mensagem Individual
          </button>
          <button
            type="button"
            onClick={() => setAbaModal('grupo')}
            className={`py-1.5 text-sm font-bold rounded-lg transition-all ${
              abaModal === 'grupo' ? 'bg-white text-[#111915] shadow-2xs' : 'text-[#687770] hover:text-[#111915]'
            }`}
          >
            Criar Novo Grupo
          </button>
        </div>

        {abaModal === 'direta' ? (
          /* Lista de Colegas para Chat Individual */
          <div className="space-y-3">
            <div className="relative">
              <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Pesquisar colega pelo nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] focus:outline-none focus:border-[#0E382C] focus:bg-white"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-[#F0F4F2]">
              {colegasFiltrados.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    onIniciarChatDireto(u);
                    onFechar();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-sm hover:bg-[#F7FAF8] transition-colors group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <AvatarChat nome={u.nome} tamanho="w-8 h-8" online={u.online} />
                    <div className="text-left truncate">
                      <p className="font-bold text-[#111915] truncate group-hover:text-[#0E382C]">{u.nome}</p>
                      <p className="text-[10px] text-[#687770] truncate">{u.cargo || u.email || 'Membro da equipe'}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#0E382C] bg-[#DCF5E4] px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    Conversar →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Formulário de Criação de Grupo */
          <form onSubmit={handleCriarGrupo} className="space-y-3.5">
            <div>
              <label className="block text-sm font-bold text-[#111915] mb-1">Nome do Grupo *</label>
              <input
                type="text"
                placeholder="Ex: Equipe de Marketing, Campanhas..."
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] focus:outline-none focus:border-[#0E382C] focus:bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111915] mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Objetivo e assuntos abordados no canal"
                value={descricaoGrupo}
                onChange={(e) => setDescricaoGrupo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-sm text-[#111915] focus:outline-none focus:border-[#0E382C] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#111915] mb-1 flex items-center justify-between">
                <span>Selecionar Membros ({membrosSelecionados.length} selecionados)</span>
              </label>
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-[#F0F4F2]">
                {colegasFiltrados.map((u) => {
                  const marcado = membrosSelecionados.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleMembro(u.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-sm transition-colors ${
                        marcado ? 'bg-[#DCF5E4]/60 font-bold text-[#0E382C]' : 'hover:bg-[#F7FAF8] text-[#111915]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <AvatarChat nome={u.nome} tamanho="w-6 h-6" tamanhoFonte="text-[9px]" />
                        <span className="truncate">{u.nome}</span>
                      </div>
                      {marcado && <span className="text-[#0E382C] font-extrabold text-sm">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4ECE7]">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-sm font-semibold text-[#687770] rounded-xl hover:bg-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!nomeGrupo.trim() || salvando}
                className="px-5 py-2 bg-[#0E382C] hover:bg-[#07261E] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-all"
              >
                {salvando ? 'Criando...' : 'Criar Grupo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MODAL: Gerenciamento de Membros do Canal
// -------------------------------------------------------------
const ModalMembros = ({
  aberto,
  onFechar,
  canal,
  membros,
  usuariosTenant,
  souAdmin,
  usuarioAtualId,
  onAdicionar,
  onRemover,
  onPromover,
  onRebaixar,
}) => {
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');

  if (!aberto || !canal) return null;

  const idsMembros = new Set(membros.map((m) => m.user_id));
  const candidatos = usuariosTenant.filter(
    (u) => !idsMembros.has(u.id) && (busca ? u.nome.toLowerCase().includes(busca.toLowerCase()) : true)
  );

  const executar = async (fn, ...args) => {
    setErro('');
    try {
      await fn(canal.id, ...args);
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" onClick={onFechar}>
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E4ECE7] p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E4ECE7] pb-3">
          <div>
            <h2 className="font-extrabold text-[#111915] text-base">Membros do Grupo</h2>
            <p className="text-sm text-[#687770]">{canal.nome}</p>
          </div>
          <button onClick={onFechar} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </button>
        </div>

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {membros.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
              <AvatarChat nome={m.usuario?.nome} tamanho="w-8 h-8" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111915] truncate">
                  {m.usuario?.nome || 'Usuário'}{m.user_id === usuarioAtualId ? ' (você)' : ''}
                </p>
                <span className="text-[10px] text-[#687770] font-semibold">
                  {m.papel === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                      <HugeiconsIcon icon={CrownIcon} size={10} strokeWidth={2} />
                      Admin
                    </span>
                  ) : (
                    'Membro'
                  )}
                </span>
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
            <p className="text-sm font-bold text-[#687770]">Adicionar Pessoa ao Grupo</p>
            <input
              className="w-full px-3 py-2 rounded-xl text-sm border border-[#E4ECE7] bg-[#F7FAF8] focus:outline-none focus:border-[#0E382C]"
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {candidatos.map((u) => (
                <button
                  key={u.id}
                  onClick={() => executar(onAdicionar, u.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-sm hover:bg-[#DCF5E4]/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AvatarChat nome={u.nome} tamanho="w-7 h-7" />
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
// COMPONENTE PRINCIPAL: ChatModulo (Layout 3 Colunas)
// =============================================================
const ChatModulo = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const {
    canais,
    canalAtivo,
    mensagens,
    membros,
    usuariosTenant,
    souAdminDoCanalAtivo,
    carregandoCanais,
    carregandoMensagens,
    enviando,
    naoLidas,
    abrirCanal,
    enviarMensagem,
    criarCanal,
    adicionarMembro,
    removerMembro,
    promoverAdmin,
    rebaixarMembro,
    criarCanalDireto,
  } = useChat();

  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');
  const [etiquetaAtiva, setEtiquetaAtiva] = useState('todas'); // 'todas' | 'nao_lidas' | 'diretas' | 'grupos' | 'fixadas' | 'ia'
  const [menuEtiquetasAberto, setMenuEtiquetasAberto] = useState(false);
  const [painelInfoAberto, setPainelInfoAberto] = useState(true);
  const [modalNovaMensagemAberto, setModalNovaMensagemAberto] = useState(false);
  const [modalMembrosAberto, setModalMembrosAberto] = useState(false);

  // Estados dos recursos fictícios do input
  const [menuEmojiAberto, setMenuEmojiAberto] = useState(false);
  const [menuMaisAberto, setMenuMaisAberto] = useState(false);
  const [anexoPendente, setAnexoPendente] = useState(null); // { tipo, nome, tamanho, url }
  const [gravandoAudio, setGravandoAudio] = useState(false);
  const [tempoGravacao, setTempoGravacao] = useState(0);

  // Mensagens adicionais locais simuladas (para enriquecer o chat e exibir envio imediato de mídias/áudios)
  const [mensagensExtras, setMensagensExtras] = useState([]);

  // Conversa ativa alternativa (para quando o usuário clica em um colega demo ou canal novo)
  const [conversaAtivaFallback, setConversaAtivaFallback] = useState(null);

  const fimRef = useRef(null);
  const inputMsgRef = useRef(null);
  const inputArquivoRef = useRef(null);
  const inputImagemRef = useRef(null);
  const emojiRef = useRef(null);
  const menuEtiquetasRef = useRef(null);
  const timerGravacaoRef = useRef(null);

  // Auto-selecionar a primeira conversa se não houver canal ativo selecionado
  useEffect(() => {
    if (!canalAtivo && !conversaAtivaFallback) {
      if (canais.length > 0) {
        abrirCanal(canais[0]);
      } else {
        // Seleciona o primeiro grupo de demonstração como padrão
        setConversaAtivaFallback(GRUPOS_DEMO[0]);
      }
    }
  }, [canais, canalAtivo, conversaAtivaFallback, abrirCanal]);

  // Timer de gravação de áudio
  useEffect(() => {
    if (gravandoAudio) {
      setTempoGravacao(0);
      timerGravacaoRef.current = setInterval(() => {
        setTempoGravacao((t) => t + 1);
      }, 1000);
    } else {
      if (timerGravacaoRef.current) clearInterval(timerGravacaoRef.current);
    }
    return () => {
      if (timerGravacaoRef.current) clearInterval(timerGravacaoRef.current);
    };
  }, [gravandoAudio]);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleFora = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setMenuEmojiAberto(false);
        setMenuMaisAberto(false);
      }
      if (menuEtiquetasRef.current && !menuEtiquetasRef.current.contains(e.target)) {
        setMenuEtiquetasAberto(false);
      }
    };
    if (menuEmojiAberto || menuMaisAberto || menuEtiquetasAberto) {
      document.addEventListener('mousedown', handleFora);
      return () => document.removeEventListener('mousedown', handleFora);
    }
  }, [menuEmojiAberto, menuMaisAberto, menuEtiquetasAberto]);

  // Auto-scroll suave ao carregar ou receber mensagens
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, mensagensExtras]);

  // Mapa de nomes de usuários do canal ativo
  const nomePorUserId = useMemo(
    () => Object.fromEntries(membros.map((m) => [m.user_id, m.usuario?.nome])),
    [membros]
  );

  // Separação e filtragem de conversas individuais e grupos por busca e etiqueta ativa
  const { conversasIndividuais, gruposExibicao } = useMemo(() => {
    // 1. Mensagens individuais (DMs reais do banco + colegas da organização/demo)
    const dmsReais = canais.filter((c) => c.tipo === 'direto');
    const colegasBase = usuariosTenant.length > 0 ? usuariosTenant : COLEGAS_DEMO;

    const dmsMapeadas = colegasBase.map((colega) => {
      // Procura se já tem canal com esse colega
      const canalExistente = dmsReais.find(
        (c) => c.nome?.includes(colega.nome) || c.chat_membros?.some((m) => m.user_id === colega.id)
      );
      const unread = canalExistente ? (naoLidas[canalExistente.id] || 0) : (colega.unread || 0);
      return {
        id: canalExistente?.id || `dm-${colega.id}`,
        usuarioId: colega.id,
        nome: colega.nome,
        cargo: colega.cargo || 'Membro da Equipe',
        tipo: 'direto',
        online: colega.online ?? true,
        tempo: colega.tempo || 'Agora',
        ultimaMsg: colega.ultimaMsg || 'Clique para conversar...',
        unread,
        canalReal: canalExistente || null,
        etiquetas: colega.etiquetas || (unread > 0 ? ['urgente', 'projetos'] : ['projetos']),
        fixado: Boolean(colega.fixado),
      };
    });

    // 2. Grupos (reais do banco + grupos demo da organização)
    const gruposReais = canais.filter((c) => c.tipo !== 'direto');
    const gruposMapeados = gruposReais.length > 0 ? gruposReais : GRUPOS_DEMO;
    const gruposNormalizados = gruposMapeados.map((g) => ({
      ...g,
      unread: naoLidas[g.id] || g.unread || 0,
      etiquetas: g.etiquetas || ['projetos'],
      fixado: Boolean(g.fixado),
    }));

    // Filtro por busca
    const matchBusca = (item) => (busca ? item.nome?.toLowerCase().includes(busca.toLowerCase()) : true);

    // Filtro por etiqueta selecionada
    const matchEtiqueta = (item, isGrupo = false) => {
      if (etiquetaAtiva === 'todas') return true;
      if (etiquetaAtiva === 'nao_lidas') return (item.unread || 0) > 0;
      if (etiquetaAtiva === 'diretas') return !isGrupo;
      if (etiquetaAtiva === 'grupos') return isGrupo;
      if (etiquetaAtiva === 'fixadas') return Boolean(item.fixado);
      if (etiquetaAtiva === 'urgente') {
        return (item.unread || 0) > 0 || (item.etiquetas && item.etiquetas.includes('urgente'));
      }
      if (item.etiquetas && Array.isArray(item.etiquetas)) {
        return item.etiquetas.includes(etiquetaAtiva);
      }
      return false;
    };

    return {
      conversasIndividuais: dmsMapeadas.filter(matchBusca).filter((i) => matchEtiqueta(i, false)),
      gruposExibicao: gruposNormalizados.filter(matchBusca).filter((i) => matchEtiqueta(i, true)),
    };
  }, [canais, usuariosTenant, busca, naoLidas, etiquetaAtiva]);

  // Contadores dinâmicos para cada etiqueta
  const contadoresEtiquetas = useMemo(() => {
    const dmsReais = canais.filter((c) => c.tipo === 'direto');
    const colegasBase = usuariosTenant.length > 0 ? usuariosTenant : COLEGAS_DEMO;
    const dmsMapeadas = colegasBase.map((colega) => {
      const canalExistente = dmsReais.find(
        (c) => c.nome?.includes(colega.nome) || c.chat_membros?.some((m) => m.user_id === colega.id)
      );
      const unread = canalExistente ? (naoLidas[canalExistente.id] || 0) : (colega.unread || 0);
      return {
        ...colega,
        unread,
        etiquetas: colega.etiquetas || (unread > 0 ? ['urgente', 'projetos'] : ['projetos']),
        fixado: Boolean(colega.fixado),
      };
    });

    const gruposReais = canais.filter((c) => c.tipo !== 'direto');
    const gruposMapeados = (gruposReais.length > 0 ? gruposReais : GRUPOS_DEMO).map((g) => ({
      ...g,
      unread: naoLidas[g.id] || g.unread || 0,
      etiquetas: g.etiquetas || ['projetos'],
      fixado: Boolean(g.fixado),
    }));

    const todos = [
      ...dmsMapeadas.map((d) => ({ ...d, isGrupo: false })),
      ...gruposMapeados.map((g) => ({ ...g, isGrupo: true })),
    ];

    return {
      todas: todos.length,
      nao_lidas: todos.filter((i) => (i.unread || 0) > 0).length,
      urgente: todos.filter((i) => (i.unread || 0) > 0 || i.etiquetas?.includes('urgente')).length,
      diretas: dmsMapeadas.length,
      grupos: gruposMapeados.length,
      fixadas: todos.filter((i) => i.fixado).length,
      projetos: todos.filter((i) => i.etiquetas?.includes('projetos')).length,
      clientes: todos.filter((i) => i.etiquetas?.includes('clientes')).length,
    };
  }, [canais, usuariosTenant, naoLidas]);

  const etiquetaSelecionadaObj = useMemo(() => {
    return LISTA_ETIQUETAS.find((e) => e.id === etiquetaAtiva) || LISTA_ETIQUETAS[0];
  }, [etiquetaAtiva]);

  // Resolução inteligente do nome e detalhes do canal ou conversa ativa
  const canalAtual = useMemo(() => {
    const base = canalAtivo || conversaAtivaFallback || GRUPOS_DEMO[0];
    const ehDireto = base?.tipo === 'direto' || Boolean(conversaAtivaFallback?.tipo === 'direto');

    let nomeFinal = base?.nome;

    // Se for conversa individual direta ou se o nome estiver nulo/vazio/'Conversa'
    if (ehDireto || !nomeFinal || nomeFinal === 'Conversa') {
      // 1. Colega selecionado ativo
      if (conversaAtivaFallback?.nome && conversaAtivaFallback.nome !== 'Conversa') {
        nomeFinal = conversaAtivaFallback.nome;
      }
      // 2. Busca entre as conversas individuais mapeadas
      else {
        const dmMatch = conversasIndividuais.find(
          (dm) => dm.id === base?.id || dm.canalReal?.id === base?.id || dm.usuarioId === base?.id
        );
        if (dmMatch?.nome) {
          nomeFinal = dmMatch.nome;
        }
        // 3. Dos membros carregados do canal (outro participante)
        else {
          const outroMembro = membros.find((m) => m.user_id !== usuario?.id);
          if (outroMembro?.usuario?.nome) {
            nomeFinal = outroMembro.usuario.nome;
          } else if (outroMembro?.usuario?.email) {
            nomeFinal = outroMembro.usuario.email;
          }
          // 4. Dos chat_membros do canal cruzados com usuários do sistema
          else if (base?.chat_membros && usuario?.id) {
            const outroUserId = base.chat_membros.find((m) => m.user_id !== usuario.id)?.user_id;
            const userTenant = usuariosTenant.find((u) => u.id === outroUserId);
            const userDemo = COLEGAS_DEMO.find((u) => u.id === outroUserId);
            nomeFinal = userTenant?.nome || userDemo?.nome;
          }
        }
      }
    }

    // Se ainda assim for direto e não tiver nome, usa o primeiro colega demo
    if (ehDireto && (!nomeFinal || nomeFinal === 'Conversa')) {
      nomeFinal = COLEGAS_DEMO[0]?.nome || 'Usuário';
    }

    return {
      ...base,
      tipo: ehDireto ? 'direto' : base?.tipo || 'grupo',
      nome: nomeFinal || 'Conversa',
      cargo: conversaAtivaFallback?.cargo || base?.cargo || (ehDireto ? 'Membro da Equipe' : null),
      online: conversaAtivaFallback?.online ?? base?.online ?? true,
    };
  }, [canalAtivo, conversaAtivaFallback, conversasIndividuais, membros, usuariosTenant, usuario]);

  // Abertura de conversa individual com colega
  const handleSelecionarColega = async (colega) => {
    setConversaAtivaFallback(colega);
    if (colega.canalReal) {
      await abrirCanal(colega.canalReal);
    } else if (colega.usuarioId && !String(colega.usuarioId).startsWith('demo-')) {
      try {
        const c = await criarCanalDireto(colega.usuarioId);
        if (c) {
          await abrirCanal(c);
        }
      } catch (err) {
        console.warn('Fallback para chat direto demo:', err);
      }
    }
  };

  // Abertura de grupo
  const handleSelecionarGrupo = async (grupo) => {
    setConversaAtivaFallback(grupo);
    if (grupo.tipo && canais.some((c) => c.id === grupo.id)) {
      await abrirCanal(grupo);
    }
  };

  // Envio de mensagem
  const handleEnviar = async (e) => {
    e?.preventDefault();
    if ((!texto.trim() && !anexoPendente) || enviando) return;

    const conteudoTexto = texto.trim();
    const anexoAtual = anexoPendente;

    setTexto('');
    setAnexoPendente(null);

    // Se houver anexo simulado, injeta imediatamente na conversa como mensagem rica
    if (anexoAtual) {
      const msgSimulada = {
        id: `extra-${Date.now()}`,
        conteudo: conteudoTexto,
        tipo: anexoAtual.tipo,
        imagem_url: anexoAtual.url || null,
        nome_arquivo: anexoAtual.nome,
        tamanho: anexoAtual.tamanho,
        autor_id: usuario?.id || 'eu',
        criado_em: new Date().toISOString(),
      };
      setMensagensExtras((prev) => [...prev, msgSimulada]);
    }

    if (canalAtivo && conteudoTexto) {
      try {
        await enviarMensagem(conteudoTexto);
      } catch (err) {
        console.warn('Enviando mensagem localmente:', err);
        const msgTextoLocal = {
          id: `extra-${Date.now()}`,
          conteudo: conteudoTexto,
          tipo: 'texto',
          autor_id: usuario?.id || 'eu',
          criado_em: new Date().toISOString(),
        };
        setMensagensExtras((prev) => [...prev, msgTextoLocal]);
      }
    } else if (conteudoTexto) {
      // Chat demo fallback
      const msgTextoLocal = {
        id: `extra-${Date.now()}`,
        conteudo: conteudoTexto,
        tipo: 'texto',
        autor_id: usuario?.id || 'eu',
        criado_em: new Date().toISOString(),
      };
      setMensagensExtras((prev) => [...prev, msgTextoLocal]);
    }

    inputMsgRef.current?.focus();
  };

  // Finalizar gravação de áudio e enviar nota de voz
  const handleEnviarAudioGravado = () => {
    const minutos = Math.floor(tempoGravacao / 60);
    const segundos = tempoGravacao % 60;
    const duracaoFormatada = `${minutos}:${String(segundos).padStart(2, '0')}`;

    const msgAudio = {
      id: `audio-${Date.now()}`,
      tipo: 'audio',
      duracao: duracaoFormatada,
      autor_id: usuario?.id || 'eu',
      criado_em: new Date().toISOString(),
      reacoes: [{ emoji: '❤️', qtd: 1 }, { emoji: '👍', qtd: 1 }],
    };

    setMensagensExtras((prev) => [...prev, msgAudio]);
    setGravandoAudio(false);
    setTempoGravacao(0);
  };

  // Tratamento de arquivo ou imagem escolhido
  const handleArquivoSelecionado = (e, tipo) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (tipo === 'imagem') {
      const url = URL.createObjectURL(file);
      setAnexoPendente({
        tipo: 'imagem',
        nome: file.name,
        tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url,
      });
    } else {
      setAnexoPendente({
        tipo: 'arquivo',
        nome: file.name,
        tamanho: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(e);
    }
  };

  // Inserir emoji no input
  const handleInserirEmoji = (emoji) => {
    setTexto((prev) => prev + emoji);
    setMenuEmojiAberto(false);
    inputMsgRef.current?.focus();
  };

  const listaEmojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👏', '🙏', '🔥', '🎉', '❤️', '🚀', '💡', '✨', '💯', '🎯', '☕'];

  // Mensagens combinadas da thread
  const todasMensagens = useMemo(() => {
    return [...mensagens, ...mensagensExtras];
  }, [mensagens, mensagensExtras]);

  return (
    <div className="w-full h-[calc(100vh-5.5rem)] flex bg-white rounded-3xl border border-[#E4ECE7] shadow-[0_8px_30px_-4px_rgba(14,56,44,0.04)] overflow-hidden font-sans select-none">
      {/* ============================================================
          COLUNA 1: SIDEBAR DE MENSAGENS INDIVIDUAIS & GRUPOS
      ============================================================ */}
      <aside className="w-72 sm:w-80 lg:w-84 border-r border-[#E4ECE7] flex flex-col bg-white shrink-0 overflow-hidden">
        {/* Barra de Pesquisa Superior */}
        <div className="p-3.5 pb-2.5 space-y-3 flex-shrink-0">
          <div className="relative flex items-center">
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              strokeWidth={2}
              className="absolute left-3 text-[#8A9A92] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Pesquisar conversas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-[#F7FAF8] hover:bg-white text-sm text-[#111915] placeholder:text-[#8A9A92] pl-9 pr-8 py-2 rounded-xl border border-[#E4ECE7] focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpar busca"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Seletor de Etiquetas Dropdown */}
          <div className="relative" ref={menuEtiquetasRef}>
            <button
              type="button"
              onClick={() => setMenuEtiquetasAberto((prev) => !prev)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#F7FAF8] hover:bg-[#F0F4F2] border border-[#E4ECE7] rounded-xl text-sm font-semibold text-[#111915] transition-all shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C] shrink-0">
                  <HugeiconsIcon icon={etiquetaSelecionadaObj.icone || Tag01Icon} size={12} strokeWidth={2} />
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[11px] text-[#8A9A92] font-medium">Etiqueta:</span>
                  <span className="font-bold text-[#111915] truncate">{etiquetaSelecionadaObj.nome}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {(contadoresEtiquetas[etiquetaAtiva] || 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DCF5E4] text-[#0E382C]">
                    {contadoresEtiquetas[etiquetaAtiva]}
                  </span>
                )}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={14}
                  strokeWidth={2}
                  className={`text-[#8A9A92] transition-transform duration-200 ${menuEtiquetasAberto ? 'rotate-180 text-[#0E382C]' : ''}`}
                />
              </div>
            </button>

            {/* Menu Popover Flutuante de Seleção de Etiquetas */}
            {menuEtiquetasAberto && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-[#CBDCD1] shadow-xl p-1.5 z-50">
                <div className="px-2 py-1.5 mb-1 border-b border-[#E4ECE7] flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-[#687770] uppercase tracking-wider">
                    Filtrar por Etiqueta
                  </span>
                  {etiquetaAtiva !== 'todas' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEtiquetaAtiva('todas');
                        setMenuEtiquetasAberto(false);
                      }}
                      className="text-[10px] text-[#0E382C] hover:underline font-bold cursor-pointer"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>

                <div className="space-y-0.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {LISTA_ETIQUETAS.map((et) => {
                    const selecionada = etiquetaAtiva === et.id;
                    const qtd = contadoresEtiquetas[et.id] || 0;
                    const IconeEtiqueta = et.icone || Tag01Icon;

                    return (
                      <button
                        key={et.id}
                        type="button"
                        onClick={() => {
                          setEtiquetaAtiva(et.id);
                          setMenuEtiquetasAberto(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                          selecionada
                            ? 'bg-[#DCF5E4] text-[#0E382C] font-bold'
                            : 'text-[#111915] hover:bg-[#F7FAF8]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${et.dot || 'bg-[#0E382C]'}`} />
                          <HugeiconsIcon icon={IconeEtiqueta} size={13} strokeWidth={2} className="shrink-0 text-[#687770]" />
                          <span className="truncate">{et.nome}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                            selecionada
                              ? 'bg-[#0E382C] text-white'
                              : 'bg-[#F0F4F2] text-[#687770]'
                          }`}
                        >
                          {qtd}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Conversas (Mensagens Diretas & Grupos) filtradas por Etiqueta */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 custom-scrollbar">
          {/* Botão Primário: Nova Mensagem */}
          <PermissaoGuarda permissao="chat.criar_grupo">
            <button
              type="button"
              onClick={() => setModalNovaMensagemAberto(true)}
              className="w-full py-2.5 px-4 bg-[#0E382C] hover:bg-[#07261E] text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <HugeiconsIcon icon={Add01Icon} size={15} strokeWidth={2.5} />
              <span>Nova Mensagem</span>
            </button>
          </PermissaoGuarda>

          {/* Seção: Mensagens Diretas / Individuais */}
          {etiquetaAtiva !== 'grupos' && conversasIndividuais.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-sm text-[#111915] tracking-tight">
                  Mensagens Diretas
                </h3>
                <span className="text-[10px] text-[#8A9A92] font-semibold">
                  {conversasIndividuais.length}
                </span>
              </div>

              {/* Lista de Colegas / Mensagens Individuais */}
              <div className="space-y-1 pt-0.5">
                {carregandoCanais ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  conversasIndividuais.map((c) => {
                    const ativo =
                      canalAtual?.tipo === 'direto' &&
                      (canalAtual?.nome === c.nome || canalAtivo?.id === c.id || canalAtivo?.id === c.canalReal?.id);

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelecionarColega(c)}
                        className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                          ativo
                            ? 'bg-brand-accent border-brand-secondary/30'
                            : 'bg-white border-transparent hover:bg-[#F7FAF8]'
                        }`}
                      >
                        {ativo && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#0E382C] rounded-full" />
                        )}

                        <AvatarChat
                          nome={c.nome}
                          tamanho="w-10 h-10"
                          online={c.online}
                          tipo="usuario"
                        />

                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm font-extrabold truncate ${ativo ? 'text-[#0E382C]' : 'text-[#111915]'}`}>
                                {c.nome}
                              </p>
                              {c.fixado && (
                                <HugeiconsIcon icon={StarIcon} size={11} strokeWidth={2.5} className="text-amber-500 shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#8A9A92] font-semibold shrink-0">
                              {c.tempo}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[11px] text-[#687770] truncate font-medium">
                              {c.ultimaMsg}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {c.etiquetas?.includes('urgente') && (
                                <span className="text-[9px] font-bold text-red-700 bg-red-100 px-1.5 py-0.2 rounded-md">
                                  Urgente
                                </span>
                              )}
                              {c.unread > 0 && (
                                <span className="w-4 h-4 rounded-full bg-[#0E382C] text-white text-[9px] font-extrabold flex items-center justify-center">
                                  {c.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Seção: Grupos & Canais */}
          {etiquetaAtiva !== 'diretas' && gruposExibicao.length > 0 && (
            <div className={`space-y-2 ${etiquetaAtiva !== 'grupos' && conversasIndividuais.length > 0 ? 'pt-2 border-t border-[#E4ECE7]' : ''}`}>
              <div className="flex items-center justify-between px-1">
                <h3 className="font-extrabold text-sm text-[#111915] tracking-tight">
                  Grupos & Canais
                </h3>
                <span className="text-[10px] text-[#8A9A92] font-semibold">
                  {gruposExibicao.length}
                </span>
              </div>

              <div className="space-y-1">
                {gruposExibicao.map((g) => {
                  const ativo = canalAtual?.tipo !== 'direto' && (canalAtual?.nome === g.nome || canalAtivo?.id === g.id);
                  const unread = g.unread || 0;

                  return (
                    <div
                      key={g.id}
                      onClick={() => handleSelecionarGrupo(g)}
                      className={`relative flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                        ativo
                          ? 'bg-brand-accent border-brand-secondary/30'
                          : 'bg-white border-transparent hover:bg-[#F7FAF8]'
                      }`}
                    >
                      {ativo && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#0E382C] rounded-full" />
                      )}

                      <AvatarChat
                        nome={g.nome}
                        tamanho="w-10 h-10"
                        online={false}
                        tipo="grupo"
                      />

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className={`text-sm font-extrabold truncate ${ativo ? 'text-[#0E382C]' : 'text-[#111915]'}`}>
                              {g.nome}
                            </p>
                            {g.fixado && (
                              <HugeiconsIcon icon={StarIcon} size={11} strokeWidth={2.5} className="text-amber-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#8A9A92] font-semibold shrink-0">
                            {g.tempo || '1 min'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] text-[#687770] truncate font-medium">
                            {g.descricao || g.ultimaMsg || 'Atividade recente da equipe...'}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {unread > 0 && (
                              <span className="w-4 h-4 rounded-full bg-[#0E382C] text-white text-[9px] font-extrabold flex items-center justify-center">
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estado Vazio: nenhuma conversa encontrada com o filtro atual */}
          {conversasIndividuais.length === 0 && gruposExibicao.length === 0 && (
            <div className="text-center py-10 px-4 space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#F0F4F2] text-[#8A9A92] flex items-center justify-center mx-auto">
                <HugeiconsIcon icon={Tag01Icon} size={22} strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-[#111915]">Nenhuma conversa encontrada</p>
                <p className="text-[11px] text-[#8A9A92] max-w-xs mx-auto leading-relaxed">
                  Não encontramos mensagens ou canais com a etiqueta &ldquo;{etiquetaSelecionadaObj.nome}&rdquo;.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEtiquetaAtiva('todas');
                  setBusca('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DCF5E4] text-[#0E382C] text-sm font-bold hover:bg-[#CBDCD1] transition-all cursor-pointer"
              >
                <span>Mostrar todas</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================
          COLUNA 2: FEED DE CONVERSA PRINCIPAL
      ============================================================ */}
      <section className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Cabeçalho do Chat */}
        <div className="px-5 py-3 border-b border-[#E4ECE7] flex items-center justify-between bg-white shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <AvatarChat
              nome={canalAtual?.nome || 'Conversa'}
              tamanho="w-9 h-9"
              online={canalAtual?.online ?? true}
              tipo={canalAtual?.tipo === 'direto' ? 'usuario' : 'grupo'}
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-[#111915] truncate leading-tight">
                {canalAtual?.nome || 'Conversa'}
              </h2>
              <p className="text-[11px] text-[#687770] font-medium">
                {canalAtual?.tipo === 'direto'
                  ? (canalAtual?.cargo ? `${canalAtual.cargo} • Disponível online` : 'Disponível online')
                  : `${canalAtual?.totalMembros || membros.length || 24} membros participantes`}
              </p>
            </div>
          </div>

          {/* Ações do Cabeçalho: [📞] [📹] [•••] [◨ Alternar Painel Lateral] */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              className="w-8 h-8 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] flex items-center justify-center text-[#111915] transition-colors"
              title="Chamada de voz"
            >
              <HugeiconsIcon icon={Call02Icon} size={15} strokeWidth={2} />
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] flex items-center justify-center text-[#111915] transition-colors"
              title="Chamada de vídeo"
            >
              <HugeiconsIcon icon={Video01Icon} size={15} strokeWidth={2} />
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-xl border border-[#E4ECE7] hover:bg-[#F7FAF8] flex items-center justify-center text-[#111915] transition-colors"
              title="Mais opções"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} size={15} strokeWidth={2} />
            </button>

            {/* Botão de Alternância do Painel Lateral */}
            <button
              type="button"
              onClick={() => setPainelInfoAberto((prev) => !prev)}
              className={`w-8 h-8 rounded-xl border transition-colors flex items-center justify-center ${
                painelInfoAberto
                  ? 'border-[#0E382C] bg-[#DCF5E4] text-[#0E382C] shadow-2xs font-bold'
                  : 'border-[#E4ECE7] hover:bg-[#F7FAF8] text-[#111915]'
              }`}
              title={painelInfoAberto ? 'Ocultar informações do grupo/contato' : 'Abrir informações do grupo/contato'}
            >
              <HugeiconsIcon icon={ViewSidebarRightIcon} size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Área de Mensagens / Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-surface custom-scrollbar">
          {/* Separador de Data */}
          <div className="flex items-center justify-center my-2">
            <div className="h-px bg-[#E4ECE7] flex-1" />
            <span className="px-3.5 py-1 bg-white border border-[#E4ECE7] text-[#687770] rounded-full text-[10px] font-bold mx-3 shadow-2xs uppercase tracking-wider">
              {todasMensagens.length > 0 ? formatarDataCabecalho(todasMensagens[0].criado_em) : 'Hoje'}
            </span>
            <div className="h-px bg-[#E4ECE7] flex-1" />
          </div>

          {carregandoMensagens ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : todasMensagens.length === 0 ? (
            /* Demonstração inicial de mensagens quando o canal ainda não possui histórico no banco */
            <div className="space-y-4">
              {/* Mensagem demonstrativa de áudio inspirada na referência */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <AvatarChat nome="Brooklyn Simmons" tamanho="w-8 h-8 sm:w-9 sm:h-9" />
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2 px-1">
                    <span className="text-sm font-bold text-[#111915]">Brooklyn Simmons</span>
                    <span className="text-[10px] text-[#687770]">Quinta-feira, 17:22</span>
                  </div>
                  <PlayerNotaVoz duracao="0:36" />
                </div>
              </div>

              {/* Mensagem demonstrativa de texto recebida */}
              <div className="flex items-start gap-2.5 sm:gap-3">
                <AvatarChat nome="Jacob Jones" tamanho="w-8 h-8 sm:w-9 sm:h-9" />
                <div className="space-y-1 max-w-[85%] sm:max-w-[70%]">
                  <div className="flex items-baseline gap-2 px-1">
                    <span className="text-sm font-bold text-[#111915]">Jacob Jones</span>
                    <span className="text-[10px] text-[#687770]">Sexta-feira, 08:05</span>
                  </div>
                  <div className="bg-white border border-[#E4ECE7] rounded-2xl rounded-tl-xs p-3 text-sm sm:text-[13px] text-[#111915] shadow-2xs leading-relaxed">
                    O briefing criativo foi concluído com as metas, desafios e persona do público-alvo. O time de design já pode avançar com os primeiros layouts.
                  </div>
                </div>
              </div>

              {/* Mensagem demonstrativa enviada por mim */}
              <div className="flex items-start gap-2.5 sm:gap-3 justify-end">
                <div className="space-y-1 max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                  <div className="bg-[#0E382C] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm sm:text-[13px] shadow-2xs leading-relaxed">
                    Perfeito! Já estamos estruturando o repositório e disponibilizando os arquivos de apoio para a equipe.
                  </div>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-[10px] text-[#687770] font-medium">Sexta-feira, 16:10</span>
                    <div className="flex items-center gap-1 ml-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-white border border-[#E4ECE7] rounded-full text-[10px] font-semibold text-[#111915] shadow-2xs">
                        <span>❤️</span>
                        <span className="text-[9px] text-[#687770] font-bold">2</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-white border border-[#E4ECE7] rounded-full text-[10px] font-semibold text-[#111915] shadow-2xs">
                        <span>👍</span>
                        <span className="text-[9px] text-[#687770] font-bold">4</span>
                      </span>
                    </div>
                  </div>
                </div>
                <AvatarChat nome={usuario?.nome || 'Eu'} tamanho="w-8 h-8 sm:w-9 sm:h-9" online={true} />
              </div>
            </div>
          ) : (
            todasMensagens.map((m) => (
              <BolhaMensagem
                key={m.id}
                mensagem={m}
                ehMinha={m.autor_id === usuario?.id || m.autor_id === 'eu'}
                autorNome={m.autor_id === usuario?.id || m.autor_id === 'eu' ? (usuario?.nome || 'Você') : (nomePorUserId[m.autor_id] || canalAtual?.nome || 'Membro da Equipe')}
              />
            ))
          )}

          <div ref={fimRef} />
        </div>

        {/* Barra de Envio Inferior Interativa */}
        <div className="p-3.5 pt-2 bg-white border-t border-[#E4ECE7] shrink-0 space-y-1.5">
          {/* Indicador de Digitação (Fixado logo acima da barra de digitação) */}
          <div className="flex items-center gap-2 px-1 text-[11px] text-[#687770] min-h-[18px] animate-in fade-in duration-200">
            <AvatarChat nome="Robert Fox" tamanho="w-4 h-4" tamanhoFonte="text-[7px]" />
            <span className="font-medium italic">Robert Fox está digitando</span>
            <span className="inline-flex items-center gap-0.5 pt-0.5">
              <span className="w-1 h-1 rounded-full bg-[#8A9A92] animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-[#8A9A92] animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-[#8A9A92] animate-bounce" />
            </span>
          </div>

          {/* Pré-visualização de anexo pendente */}
          {anexoPendente && (
            <div className="flex items-center justify-between p-2 px-3 bg-brand-accent border border-surface-border rounded-xl text-sm text-brand-primary animate-in fade-in duration-150">
              <div className="flex items-center gap-2 truncate">
                <HugeiconsIcon icon={anexoPendente.tipo === 'imagem' ? Image01Icon : File01Icon} size={15} />
                <span className="font-bold truncate">{anexoPendente.nome}</span>
                <span className="text-[10px] text-[#065F46]">({anexoPendente.tamanho})</span>
              </div>
              <button
                type="button"
                onClick={() => setAnexoPendente(null)}
                className="p-1 hover:bg-[#CBDCD1]/50 rounded-lg text-[#0E382C] transition-colors"
                title="Remover anexo"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={13} strokeWidth={2.2} />
              </button>
            </div>
          )}

          {/* Modo de Gravação de Áudio Ativo */}
          {gravandoAudio ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-700">Gravando áudio:</span>
                  <span className="text-sm font-mono font-extrabold text-red-900">
                    {Math.floor(tempoGravacao / 60)}:{String(tempoGravacao % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGravandoAudio(false);
                    setTempoGravacao(0);
                  }}
                  className="px-3 py-1.5 bg-white border border-[#FECACA] hover:bg-red-50 text-red-600 rounded-xl text-sm font-bold transition-colors flex items-center gap-1"
                >
                  <HugeiconsIcon icon={Delete02Icon} size={13} />
                  <span>Cancelar</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarAudioGravado}
                  className="px-4 py-1.5 bg-[#0E382C] hover:bg-[#07261E] text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <HugeiconsIcon icon={SentIcon} size={14} />
                  <span>Enviar Áudio</span>
                </button>
              </div>
            </div>
          ) : (
            /* Campo de Texto Normal */
            <div className="relative">
              {/* Popover de Emojis */}
              {menuEmojiAberto && (
                <div
                  ref={emojiRef}
                  className="absolute bottom-full mb-2 right-24 bg-white border border-[#E4ECE7] rounded-2xl p-3 shadow-2xl z-30 w-64 space-y-2 animate-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E4ECE7]">
                    <span className="text-[11px] font-bold text-[#111915]">Reações Rápidas</span>
                    <button
                      type="button"
                      onClick={() => setMenuEmojiAberto(false)}
                      className="text-slate-400 hover:text-slate-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5 text-lg">
                    {listaEmojis.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => handleInserirEmoji(em)}
                        className="w-8 h-8 rounded-lg hover:bg-[#F7FAF8] flex items-center justify-center transition-colors active:scale-125"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popover de Mais Ações */}
              {menuMaisAberto && (
                <div className="absolute bottom-full mb-2 right-14 bg-white border border-[#E4ECE7] rounded-2xl p-2 shadow-2xl z-30 w-52 space-y-1 text-sm animate-in zoom-in-95 duration-150 divide-y divide-[#F0F4F2]">
                  <button
                    type="button"
                    onClick={() => {
                      setAnexoPendente({
                        tipo: 'arquivo',
                        nome: 'Relatorio_Mensal.pdf',
                        tamanho: '1.8 MB',
                      });
                      setMenuMaisAberto(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#F7FAF8] font-semibold text-[#111915] flex items-center gap-2"
                  >
                    <HugeiconsIcon icon={File01Icon} size={15} className="text-[#0E382C]" />
                    <span>Compartilhar Documento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTexto('📍 Localização compartilhada: Escritório Prancheto.IA - São Paulo/SP');
                      setMenuMaisAberto(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#F7FAF8] font-semibold text-[#111915] flex items-center gap-2"
                  >
                    <span className="text-base">📍</span>
                    <span>Enviar Localização</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTexto('📊 Enquete: Qual o melhor horário para o alinhamento? [ ] 10h  [ ] 14h  [ ] 16h');
                      setMenuMaisAberto(false);
                    }}
                    className="w-full text-left p-2 rounded-xl hover:bg-[#F7FAF8] font-semibold text-[#111915] flex items-center gap-2"
                  >
                    <span className="text-base">📊</span>
                    <span>Criar Enquete</span>
                  </button>
                </div>
              )}

              {/* Inputs de arquivo ocultos para upload */}
              <input
                type="file"
                ref={inputArquivoRef}
                onChange={(e) => handleArquivoSelecionado(e, 'arquivo')}
                className="hidden"
              />
              <input
                type="file"
                ref={inputImagemRef}
                accept="image/*"
                onChange={(e) => handleArquivoSelecionado(e, 'imagem')}
                className="hidden"
              />

              <form
                onSubmit={handleEnviar}
                className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs focus-within:border-[#0E382C] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0E382C]/10 transition-all"
              >
                <input
                  ref={inputMsgRef}
                  type="text"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 bg-transparent border-none text-sm text-[#111915] placeholder:text-[#8A9A92] focus:outline-none focus:ring-0 p-0"
                />

                {/* Ações da direita do input: [Emoji] [•••] [Anexo] [Imagem] [Microfone] [Enviar] */}
                <div className="flex items-center gap-1 shrink-0 text-[#687770]">
                  <button
                    type="button"
                    onClick={() => setMenuEmojiAberto(!menuEmojiAberto)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      menuEmojiAberto ? 'bg-white text-[#0E382C] shadow-2xs' : 'hover:text-[#0E382C] hover:bg-white'
                    }`}
                    title="Inserir emoji"
                  >
                    <HugeiconsIcon icon={SmileIcon} size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMenuMaisAberto(!menuMaisAberto)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      menuMaisAberto ? 'bg-white text-[#0E382C] shadow-2xs' : 'hover:text-[#0E382C] hover:bg-white'
                    }`}
                    title="Mais opções e enquetes"
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => inputArquivoRef.current?.click()}
                    className="p-1.5 hover:text-[#0E382C] hover:bg-white rounded-lg transition-colors"
                    title="Anexar arquivo"
                  >
                    <HugeiconsIcon icon={Attachment01Icon} size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => inputImagemRef.current?.click()}
                    className="p-1.5 hover:text-[#0E382C] hover:bg-white rounded-lg transition-colors"
                    title="Enviar foto ou imagem"
                  >
                    <HugeiconsIcon icon={Image01Icon} size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setGravandoAudio(true)}
                    className="p-1.5 hover:text-[#0E382C] hover:bg-white rounded-lg transition-colors"
                    title="Gravar nota de voz"
                  >
                    <HugeiconsIcon icon={Mic01Icon} size={16} strokeWidth={2} />
                  </button>

                  <button
                    type="submit"
                    disabled={enviando || (!texto.trim() && !anexoPendente)}
                    className="w-8 h-8 rounded-xl bg-[#0E382C] text-white hover:bg-[#07261E] disabled:opacity-40 flex items-center justify-center shadow-xs transition-all shrink-0 active:scale-95 ml-1"
                    title="Enviar mensagem"
                  >
                    {enviando ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={SentIcon} size={15} strokeWidth={2} className="ml-0.5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          COLUNA 3: PAINEL DE INFORMAÇÕES DO GRUPO OU CONTATO (TOGGLEABLE)
      ============================================================ */}
      {painelInfoAberto && (
        <PainelInfoGrupo
          canal={canalAtual}
          membros={membros}
          onFechar={() => setPainelInfoAberto(false)}
          onAbrirMembros={() => setModalMembrosAberto(true)}
        />
      )}

      {/* Modal para Nova Mensagem (Chat Individual ou Grupo) */}
      <ModalNovaMensagem
        aberto={modalNovaMensagemAberto}
        onFechar={() => setModalNovaMensagemAberto(false)}
        onCriarGrupo={criarCanal}
        onIniciarChatDireto={handleSelecionarColega}
        usuariosTenant={usuariosTenant}
      />

      {/* Modal para gerenciar membros do canal ativo */}
      <ModalMembros
        aberto={modalMembrosAberto}
        onFechar={() => setModalMembrosAberto(false)}
        canal={canalAtual}
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
