// =============================================================
// PRANCHETO.IA - TIMES E PESSOAS (ORGANIZAÇÃO)
// Gerencia times da organização e seus membros.
// Layout moderno em múltiplas colunas integrado ao Design System Emitly.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import PermissaoGuarda from '../../../components/ui/PermissaoGuarda.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Search01Icon,
  PencilEdit01Icon,
  Delete02Icon,
  ArrowDown01Icon,
  Add01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  Building01Icon,
} from '@hugeicons/core-free-icons';

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------
const ICONES_DISPONIVEIS = ['👥', '🚀', '💡', '🎯', '⚡', '🌟', '🏆', '🛡️', '🎨', '📊', '🤝', '💼', '🔧', '📱', '⚙️'];
const CORES_DISPONIVEIS  = [
  { label: 'Verde Floresta', valor: '#0E382C' },
  { label: 'Esmeralda',     valor: '#10b981' },
  { label: 'Índigo',        valor: '#6366f1' },
  { label: 'Violeta',       valor: '#8b5cf6' },
  { label: 'Rosa',          valor: '#ec4899' },
  { label: 'Vermelho',      valor: '#ef4444' },
  { label: 'Laranja',       valor: '#f97316' },
  { label: 'Âmbar',         valor: '#f59e0b' },
  { label: 'Ciano',         valor: '#06b6d4' },
  { label: 'Azul',          valor: '#3b82f6' },
];

// ----------------------------------------------------------
// MODAL: Criar / Editar Time
// ----------------------------------------------------------
const ModalTime = ({ aberto, onFechar, onSalvar, timeEditando }) => {
  const [form, setForm] = useState({
    nome:         '',
    descricao:    '',
    icone:        '👥',
    cor_primaria: '#0E382C',
    cor_texto:    '#D4EC9D',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  useEffect(() => {
    if (timeEditando) {
      setForm({
        nome:         timeEditando.nome         || '',
        descricao:    timeEditando.descricao    || '',
        icone:        timeEditando.icone        || '👥',
        cor_primaria: timeEditando.cor_primaria || '#0E382C',
        cor_texto:    timeEditando.cor_texto    || '#D4EC9D',
      });
    } else {
      setForm({ nome: '', descricao: '', icone: '👥', cor_primaria: '#0E382C', cor_texto: '#D4EC9D' });
    }
    setErro('');
  }, [timeEditando, aberto]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) { setErro('Nome do time é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      await onSalvar(form);
      onFechar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar time.');
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto" onClick={onFechar}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#E4ECE7] shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECE7]">
          <h2 className="font-bold text-base text-[#111915]">
            {timeEditando ? 'Editar Time' : 'Novo Time'}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-[#111915] transition-colors text-lg p-1">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {erro && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              {erro}
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-2xs font-bold"
              style={{ backgroundColor: form.cor_primaria, color: form.cor_texto }}
            >
              {form.icone}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#111915] truncate">
                {form.nome || 'Nome do Time'}
              </p>
              <p className="text-xs text-[#687770] truncate">
                {form.descricao || 'Descrição da equipe'}
              </p>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-1.5">
              Nome do Time *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Comercial, Engenharia, Suporte..."
              className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm(f => ({ ...f, descricao: e.target.value }))}
              placeholder="Breve descrição das responsabilidades do time"
              className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Ícone */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-1.5">
              Ícone
            </label>
            <div className="flex flex-wrap gap-2">
              {ICONES_DISPONIVEIS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, icone: ic }))}
                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all cursor-pointer ${
                    form.icone === ic
                      ? 'bg-[#0E382C] text-[#D4EC9D] ring-2 ring-[#0E382C]/20 shadow-xs'
                      : 'bg-[#F7FAF8] border border-[#E4ECE7] hover:bg-slate-100'
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Cor Primária */}
          <div>
            <label className="block text-xs font-semibold text-[#687770] mb-1.5">
              Cor do Time
            </label>
            <div className="flex flex-wrap gap-2.5">
              {CORES_DISPONIVEIS.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cor_primaria: c.valor }))}
                  title={c.label}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    form.cor_primaria === c.valor
                      ? 'scale-125 ring-2 ring-offset-2 ring-[#0E382C]'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.valor }}
                />
              ))}
            </div>
          </div>

          {/* Botões */}
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
              {salvando ? 'Salvando...' : timeEditando ? 'Salvar' : 'Criar Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// MODAL: Adicionar Membro
// ----------------------------------------------------------
const ModalAdicionarMembro = ({ aberto, onFechar, onAdicionar, membrosAtuais, todosUsuarios }) => {
  const [busca, setBusca]             = useState('');
  const [adicionando, setAdicionando] = useState(null);

  const idsJaMembros = new Set((membrosAtuais || []).map(m => m.usuario?.id));

  const usuariosFiltrados = todosUsuarios.filter(u =>
    !idsJaMembros.has(u.id) &&
    (u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
     u.email?.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleAdicionar = async (usuario) => {
    setAdicionando(usuario.id);
    try {
      await onAdicionar(usuario.id);
    } finally {
      setAdicionando(null);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" onClick={onFechar}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#E4ECE7] shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECE7]">
          <h2 className="font-bold text-base text-[#111915]">
            Adicionar Colaborador ao Time
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-[#111915] transition-colors text-lg p-1">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar colaborador por nome ou e-mail..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
              autoFocus
            />
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {usuariosFiltrados.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#687770]">
                {busca ? 'Nenhum colaborador encontrado.' : 'Todos os membros da organização já fazem parte deste time.'}
              </p>
            ) : (
              usuariosFiltrados.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7FAF8] border border-transparent hover:border-[#E4ECE7] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {u.nome?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#111915] truncate">{u.nome}</p>
                    <p className="text-[11px] text-[#687770] truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAdicionar(u)}
                    disabled={adicionando === u.id}
                    className="text-xs px-3 py-1.5 rounded-lg font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-colors disabled:opacity-50 flex-shrink-0 cursor-pointer"
                  >
                    {adicionando === u.id ? '...' : '+ Adicionar'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD DE TIME (Emitly Design System)
// ----------------------------------------------------------
const CardTime = ({ time, onEditar, onExcluir, onAdicionarMembro, onRemoverMembro, todosUsuarios, excluindo }) => {
  const [expandido, setExpandido]     = useState(false);
  const [modalMembro, setModalMembro] = useState(false);
  const [removendo, setRemovendo]     = useState(null);

  const membros = time.membros || [];

  const handleRemover = async (userId) => {
    setRemovendo(userId);
    try {
      await onRemoverMembro(time.id, userId);
    } finally {
      setRemovendo(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs hover:border-[#0E382C]/30 transition-all flex flex-col justify-between">
      <div>
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-2xs font-bold"
              style={{ backgroundColor: time.cor_primaria || '#0E382C', color: time.cor_texto || '#D4EC9D' }}
            >
              {time.icone || '👥'}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-[#111915] truncate">
                {time.nome}
              </h3>
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDF2EE] text-[#0E382C] mt-0.5">
                {membros.length} {membros.length === 1 ? 'colaborador' : 'colaboradores'}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <PermissaoGuarda permissao="times.gerenciar">
              <button
                onClick={() => onEditar(time)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0E382C] hover:bg-[#F7FAF8] transition-colors"
                title="Editar time"
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={15} strokeWidth={1.8} />
              </button>
            </PermissaoGuarda>
            <PermissaoGuarda permissao="times.gerenciar">
              <button
                onClick={() => onExcluir(time.id)}
                disabled={excluindo === time.id}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                title="Excluir time"
              >
                {excluindo === time.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
                )}
              </button>
            </PermissaoGuarda>
          </div>
        </div>

        {/* Descrição */}
        {time.descricao && (
          <p className="text-xs text-[#687770] mt-3 line-clamp-2">
            {time.descricao}
          </p>
        )}

        {/* Membros Avatares (Preview) */}
        <div className="mt-4 pt-3 border-t border-[#E4ECE7] flex items-center justify-between">
          <div className="flex items-center -space-x-2 overflow-hidden">
            {membros.slice(0, 5).map((m) => (
              <div
                key={m.id}
                title={m.usuario?.nome}
                className="w-7 h-7 rounded-full bg-[#0E382C] text-[#D4EC9D] border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-2xs"
              >
                {m.usuario?.nome?.[0]?.toUpperCase() || 'U'}
              </div>
            ))}
            {membros.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 border-2 border-white flex items-center justify-center text-[10px] font-bold">
                +{membros.length - 5}
              </div>
            )}
            {membros.length === 0 && (
              <span className="text-[11px] text-[#687770] italic">
                Nenhum membro alocado
              </span>
            )}
          </div>

          <button
            onClick={() => setExpandido(v => !v)}
            className="text-xs font-semibold text-[#0E382C] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{expandido ? 'Ocultar' : 'Ver membros'}</span>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              strokeWidth={2}
              className={`transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Lista expandida de membros */}
      {expandido && (
        <div className="mt-3 pt-3 border-t border-[#E4ECE7] space-y-2">
          {membros.length === 0 ? (
            <p className="text-center py-2 text-xs text-[#687770]">
              Nenhum colaborador alocado neste time.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {membros.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {m.usuario?.nome?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111915] truncate">
                        {m.usuario?.nome || 'Usuário'}
                      </p>
                      <p className="text-[10px] text-[#687770] truncate">
                        {m.usuario?.email}
                      </p>
                    </div>
                  </div>
                  <PermissaoGuarda permissao="times.gerenciar">
                    <button
                      onClick={() => handleRemover(m.usuario?.id)}
                      disabled={removendo === m.usuario?.id}
                      className="text-slate-400 hover:text-red-500 p-1 text-xs disabled:opacity-50"
                      title="Remover do time"
                    >
                      ✕
                    </button>
                  </PermissaoGuarda>
                </div>
              ))}
            </div>
          )}

          <PermissaoGuarda permissao="times.gerenciar">
            <button
              onClick={() => setModalMembro(true)}
              className="w-full mt-2 py-2 rounded-xl text-xs font-bold border border-dashed border-[#0E382C]/30 text-[#0E382C] hover:bg-[#EDF2EE] transition-colors"
            >
              + Adicionar colaborador
            </button>
          </PermissaoGuarda>
        </div>
      )}

      {/* Modal adicionar membro */}
      <ModalAdicionarMembro
        aberto={modalMembro}
        onFechar={() => setModalMembro(false)}
        onAdicionar={(userId) => onAdicionarMembro(time.id, userId)}
        membrosAtuais={membros}
        todosUsuarios={todosUsuarios}
      />
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: TIMES (ORGANIZAÇÃO)
// ----------------------------------------------------------
const Times = () => {
  const {
    carregando,
    listarTimes,
    criarTime,
    atualizarTime,
    excluirTime,
    adicionarMembro,
    removerMembro,
    listarUsuariosTenant,
  } = useOrg();

  const [times, setTimes]                 = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [modalTime, setModalTime]         = useState(false);
  const [timeEditando, setTimeEditando]   = useState(null);
  const [excluindo, setExcluindo]         = useState(null);
  const [erro, setErro]                   = useState('');
  const [inicializado, setInicializado]   = useState(false);

  const carregar = useCallback(async () => {
    const [timesData, usuariosData] = await Promise.all([
      listarTimes(),
      listarUsuariosTenant(),
    ]);
    setTimes(timesData);
    setTodosUsuarios(usuariosData);
    setInicializado(true);
  }, [listarTimes, listarUsuariosTenant]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleSalvarTime = async (dados) => {
    if (timeEditando) {
      await atualizarTime(timeEditando.id, dados);
    } else {
      await criarTime(dados);
    }
    await carregar();
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Deseja excluir este time? Os colaboradores permanecerão cadastrados na organização.')) return;
    setExcluindo(id);
    try {
      await excluirTime(id);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao excluir time.');
    } finally {
      setExcluindo(null);
    }
  };

  const handleAdicionarMembro = async (timeId, userId) => {
    try {
      await adicionarMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar membro.');
    }
  };

  const handleRemoverMembro = async (timeId, userId) => {
    try {
      await removerMembro(timeId, userId);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao remover membro.');
    }
  };

  const abrirCriar = () => { setTimeEditando(null); setModalTime(true); };
  const abrirEditar = (time) => { setTimeEditando(time); setModalTime(true); };

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const alocacoesTotais = times.reduce((acc, t) => acc + (t.membros?.length || 0), 0);

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111915]">
            Times e Equipes
          </h1>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Estruture sua equipe em núcleos de trabalho, gerencie membros e lideranças de forma colaborativa.
          </p>
        </div>

        <PermissaoGuarda permissao="times.gerenciar">
          <button
            onClick={abrirCriar}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.2} />
            <span>Novo time</span>
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

      {/* Stats Cards em Grid de 3 Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{times.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Times Ativos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center">
            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{alocacoesTotais}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Alocações Totais</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{todosUsuarios.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Pessoas na Organização</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center">
            <HugeiconsIcon icon={Building01Icon} size={20} strokeWidth={1.8} />
          </div>
        </div>
      </div>

      {/* Grid de Times em Múltiplas Colunas */}
      {times.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-12 text-center shadow-xs flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center mb-4">
            <HugeiconsIcon icon={UserGroupIcon} size={32} strokeWidth={1.8} />
          </div>
          <h3 className="font-bold text-base text-[#111915] mb-1">
            Nenhum time criado ainda
          </h3>
          <p className="text-xs text-[#687770] max-w-sm mb-5">
            Crie times para organizar seus colaboradores por departamentos, squads ou projetos específicos.
          </p>
          <PermissaoGuarda permissao="times.gerenciar">
            <button
              onClick={abrirCriar}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer"
            >
              + Criar primeiro time
            </button>
          </PermissaoGuarda>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {times.map((time) => (
            <CardTime
              key={time.id}
              time={time}
              onEditar={abrirEditar}
              onExcluir={handleExcluir}
              onAdicionarMembro={handleAdicionarMembro}
              onRemoverMembro={handleRemoverMembro}
              todosUsuarios={todosUsuarios}
              excluindo={excluindo}
            />
          ))}
        </div>
      )}

      {/* Modal Criar / Editar Time */}
      <ModalTime
        aberto={modalTime}
        onFechar={() => setModalTime(false)}
        onSalvar={handleSalvarTime}
        timeEditando={timeEditando}
      />
    </div>
  );
};

export default Times;
