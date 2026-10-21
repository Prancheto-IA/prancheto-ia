// =============================================================
// PRANCHETO.IA - TIMES E PESSOAS (EMITLY DESIGN SYSTEM)
// Gestão de equipes, cargos e membros da organização em layout de Grid.
// Alinhado ao mesmo layout e experiência da página /projetos.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../hooks/useOrg';
import { useAuthStore } from '../../store/authStore';
import PermissaoGuarda from '../../components/ui/PermissaoGuarda.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserGroupIcon,
  Delete02Icon,
  PencilEdit01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';

// ----------------------------------------------------------
// MODAL: Criar / Editar Time
// ----------------------------------------------------------
const ModalTime = ({ aberto, onFechar, onSalvar, onExcluir, timeEditando }) => {
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    cor_primaria: '#0E382C',
    cor_texto: '#ffffff',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (timeEditando) {
      setForm({
        nome: timeEditando.nome || '',
        descricao: timeEditando.descricao || '',
        cor_primaria: timeEditando.cor_primaria || '#0E382C',
        cor_texto: timeEditando.cor_texto || '#ffffff',
      });
    } else {
      setForm({
        nome: '',
        descricao: '',
        cor_primaria: '#0E382C',
        cor_texto: '#ffffff',
      });
    }
    setErro('');
  }, [timeEditando, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErro('Nome do time é obrigatório.');
      return;
    }
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl border border-[#E4ECE7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E4ECE7]">
          <h2 className="text-base font-extrabold text-[#111915]">
            {timeEditando ? 'Editar Time' : 'Novo Time'}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">
              Nome do Time *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Time de Design & UX"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1">
              Descrição
            </label>
            <textarea
              rows={2}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Atribuições e responsabilidades do time"
              className="w-full px-3.5 py-2.5 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111915] mb-1.5">
              Cor Temática
            </label>
            <div className="flex items-center gap-2.5">
              {[
                { label: 'Verde Floresta', cor: '#0E382C' },
                { label: 'Azul Marinho', cor: '#1E3A8A' },
                { label: 'Índigo', cor: '#4F46E5' },
                { label: 'Esmeralda', cor: '#047857' },
                { label: 'Âmbar', cor: '#B45309' },
                { label: 'Ardósia', cor: '#334155' },
              ].map((item) => (
                <button
                  key={item.cor}
                  type="button"
                  title={item.label}
                  onClick={() => setForm((f) => ({ ...f, cor_primaria: item.cor }))}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.cor_primaria === item.cor
                      ? 'ring-2 ring-[#0E382C] ring-offset-2 scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: item.cor }}
                />
              ))}
            </div>
          </div>

          {erro && <p className="text-red-600 text-xs font-semibold">{erro}</p>}

          <div className="flex justify-between items-center pt-3 border-t border-[#E4ECE7]">
            {timeEditando && onExcluir && (
              <PermissaoGuarda permissao="times.gerenciar">
                <button
                  type="button"
                  onClick={() => {
                    onExcluir(timeEditando.id);
                    onFechar();
                  }}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  Excluir Time
                </button>
              </PermissaoGuarda>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onFechar}
                className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2 bg-[#0E382C] text-white text-xs font-semibold rounded-xl shadow-xs hover:bg-[#07261E] transition-all disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : timeEditando ? 'Salvar' : 'Criar Time'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// MODAL: Gerenciar Membros do Time
// ----------------------------------------------------------
const ModalGerenciarTime = ({
  aberto,
  onFechar,
  time,
  todosUsuarios = [],
  onAdicionarMembro,
  onRemoverMembro,
  onEditarTime,
}) => {
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [removendoId, setRemovendoId] = useState(null);
  const [erro, setErro] = useState('');

  if (!aberto || !time) return null;

  const membros = (time.membros || []).map((m) => ({
    ...m,
    usuario: m.usuario || todosUsuarios.find((u) => u.id === m.user_id) || m,
  }));

  const idsMembros = new Set(membros.map((m) => m.usuario?.id || m.user_id));
  const usuariosDisponiveis = todosUsuarios.filter((u) => !idsMembros.has(u.id));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!usuarioSelecionado) return;
    setAdicionando(true);
    setErro('');
    try {
      await onAdicionarMembro(time.id, usuarioSelecionado);
      setUsuarioSelecionado('');
    } catch (err) {
      setErro(err.message || 'Erro ao adicionar membro.');
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemove = async (userId) => {
    setRemovendoId(userId);
    setErro('');
    try {
      await onRemoverMembro(time.id, userId);
    } catch (err) {
      setErro(err.message || 'Erro ao remover membro.');
    } finally {
      setRemovendoId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl p-6 space-y-5 shadow-2xl border border-[#E4ECE7] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E4ECE7]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
              style={{
                backgroundColor: time.cor_primaria || '#0E382C',
                color: time.cor_texto || '#D4EC9D',
              }}
            >
              <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#111915]">{time.nome}</h2>
              <p className="text-xs text-[#687770]">
                {time.descricao || 'Gerenciamento de integrantes da equipe'}
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            ✕
          </button>
        </div>

        {/* Adicionar Membro */}
        <PermissaoGuarda permissao="times.gerenciar">
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="block text-xs font-semibold text-[#111915]">
              Adicionar Colaborador ao Time
            </label>
            <div className="flex gap-2">
              <select
                value={usuarioSelecionado}
                onChange={(e) => setUsuarioSelecionado(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-[#F7FAF8] border border-[#E4ECE7] rounded-xl text-xs text-[#111915] focus:outline-none focus:border-[#0E382C]"
              >
                <option value="">Selecione um colaborador...</option>
                {usuariosDisponiveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.cargo || 'Membro'}) - {u.email}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!usuarioSelecionado || adicionando}
                className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                {adicionando ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </PermissaoGuarda>

        {erro && <p className="text-xs font-semibold text-red-600">{erro}</p>}

        {/* Membros Atuais */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          <div className="flex items-center justify-between text-xs font-semibold text-[#687770] mb-2">
            <span>Integrantes Atuais</span>
            <span className="text-[11px] bg-[#F7FAF8] px-2.5 py-0.5 rounded-full border border-[#E4ECE7]">
              {membros.length} membro(s)
            </span>
          </div>

          {membros.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#687770] bg-[#F7FAF8] rounded-xl border border-dashed border-[#E4ECE7]">
              Nenhum colaborador adicionado a este time ainda.
            </div>
          ) : (
            membros.map((m) => {
              const u = m.usuario || {};
              const iniciais =
                u.nome
                  ?.split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || '?';
              return (
                <div
                  key={m.id || u.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {iniciais}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111915] truncate">{u.nome}</p>
                      <p className="text-[11px] text-[#687770] truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF0ED] text-[#0E382C] capitalize">
                      {u.cargo || 'Membro'}
                    </span>
                    <PermissaoGuarda permissao="times.gerenciar">
                      <button
                        type="button"
                        onClick={() => handleRemove(u.id)}
                        disabled={removendoId === u.id}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                        title="Remover do time"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.8} />
                      </button>
                    </PermissaoGuarda>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E4ECE7]">
          <PermissaoGuarda permissao="times.gerenciar">
            <button
              type="button"
              onClick={() => {
                onFechar();
                onEditarTime(time);
              }}
              className="text-xs font-semibold text-[#0E382C] hover:underline flex items-center gap-1"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={14} strokeWidth={1.8} />
              <span>Editar Informações do Time</span>
            </button>
          </PermissaoGuarda>
          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#687770] text-xs font-semibold rounded-xl hover:bg-slate-100 transition-colors ml-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD: Time (Estilo idêntico ao CardProjeto)
// ----------------------------------------------------------
const CardTime = ({
  time,
  membros = [],
  onGerenciarMembros,
  onEditar,
}) => {
  return (
    <div
      onClick={() => onGerenciarMembros(time)}
      className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
    >
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
            style={{
              backgroundColor: time.cor_primaria || '#0E382C',
              color: time.cor_texto || '#D4EC9D',
            }}
          >
            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-[#111915] truncate">{time.nome}</h3>
            {time.descricao && (
              <p className="text-xs text-[#687770] line-clamp-1">{time.descricao}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCF5E4] text-[#15803D]">
            {membros.length} {membros.length === 1 ? 'membro' : 'membros'}
          </span>
          <PermissaoGuarda permissao="times.gerenciar">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar(time);
              }}
              className="p-1 text-slate-400 hover:text-[#0E382C] transition-colors rounded-lg hover:bg-[#F7FAF8]"
              title="Editar time"
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={15} strokeWidth={1.8} />
            </button>
          </PermissaoGuarda>
        </div>
      </div>

      {/* Conteúdo Central: Avatares da equipe */}
      <div>
        <div className="flex justify-between text-xs text-[#687770] font-semibold mb-2">
          <span>Equipe</span>
          <span>{membros.length} integrante(s)</span>
        </div>
        {membros.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden py-0.5">
              {membros.slice(0, 5).map((m, idx) => {
                const nome = m.usuario?.nome || m.nome || 'Membro';
                const inicial = nome[0]?.toUpperCase() || '?';
                return (
                  <div
                    key={m.id || idx}
                    title={nome}
                    className="w-7 h-7 rounded-full bg-[#0E382C] text-[#D4EC9D] border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-xs flex-shrink-0"
                  >
                    {inicial}
                  </div>
                );
              })}
              {membros.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-[#EBF0ED] text-[#0E382C] border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-xs flex-shrink-0">
                  +{membros.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-[#687770] truncate">
              {membros.slice(0, 2).map((m) => (m.usuario?.nome || m.nome)?.split(' ')[0]).join(', ')}
              {membros.length > 2 ? ` e +${membros.length - 2}` : ''}
            </span>
          </div>
        ) : (
          <div className="py-1 text-xs text-slate-400 italic">
            Nenhum colaborador alocado
          </div>
        )}
      </div>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E4ECE7] text-[11px] text-[#687770]">
        <span>
          {time.criado_em
            ? `Criado em ${new Date(time.criado_em).toLocaleDateString('pt-BR')}`
            : 'Time ativo'}
        </span>
        <span className="font-semibold text-[#0E382C] flex items-center gap-1 hover:underline">
          Gerenciar membros
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD: Pessoa (Grid de Colaboradores)
// ----------------------------------------------------------
const CardMembro = ({ membro, timesDoMembro = [] }) => {
  const iniciais =
    membro.nome
      ?.split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E4ECE7] shadow-[0_4px_20px_-2px_rgba(14,56,44,0.04)] hover:shadow-md transition-all flex flex-col justify-between space-y-4">
      {/* Header do Card */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
            {iniciais}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-[#111915] truncate">{membro.nome}</h3>
            <p className="text-xs text-[#687770] truncate">{membro.email}</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EBF0ED] text-[#0E382C] capitalize flex-shrink-0">
          {membro.cargo || 'Membro'}
        </span>
      </div>

      {/* Conteúdo Central: Times vinculados */}
      <div>
        <div className="flex justify-between text-xs text-[#687770] font-semibold mb-2">
          <span>Times Vinculados</span>
          <span>{timesDoMembro.length} time(s)</span>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {timesDoMembro.length > 0 ? (
            timesDoMembro.map((t) => (
              <span
                key={t.id}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] flex items-center gap-1.5"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: t.cor_primaria || '#0E382C' }}
                />
                {t.nome}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic py-1">Nenhum time associado</span>
          )}
        </div>
      </div>

      {/* Rodapé do Card */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E4ECE7] text-[11px] text-[#687770]">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              membro.ativo !== false ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          />
          <span>{membro.ativo !== false ? 'Ativo na organização' : 'Inativo'}</span>
        </div>
        <span className="text-[10px] text-[#8A9A92] font-medium">
          {membro.cargo_org?.nome || membro.cargo || 'Colaborador'}
        </span>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: TimesPessoas
// ----------------------------------------------------------
const TimesPessoas = () => {
  const usuario = useAuthStore((s) => s.usuario);
  const {
    listarTimes,
    listarUsuariosCompleto,
    listarUsuariosTenant,
    criarTime,
    atualizarTime,
    excluirTime,
    adicionarMembro,
    removerMembro,
    carregando,
  } = useOrg();

  const [times, setTimes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [aba, setAba] = useState('times');
  const [modalTime, setModalTime] = useState(false);
  const [timeEditando, setTimeEditando] = useState(null);
  const [timeGerenciando, setTimeGerenciando] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [ts, us] = await Promise.all([
        listarTimes(),
        listarUsuariosCompleto ? listarUsuariosCompleto() : listarUsuariosTenant(),
      ]);
      setTimes(ts || []);
      setUsuarios(us || []);
    } catch (err) {
      console.error('Erro ao carregar times e usuários:', err);
    }
  }, [listarTimes, listarUsuariosCompleto, listarUsuariosTenant]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const handleSalvarTime = async (dados) => {
    if (timeEditando) {
      await atualizarTime(timeEditando.id, dados);
    } else {
      await criarTime(dados);
    }
    await carregar();
  };

  const handleExcluirTime = async (id) => {
    if (
      !window.confirm(
        'Tem certeza que deseja excluir este time? Todos os vínculos de membros serão desfeitos.'
      )
    ) {
      return;
    }
    try {
      await excluirTime(id);
      if (timeGerenciando?.id === id) setTimeGerenciando(null);
      await carregar();
    } catch (err) {
      alert(err.message || 'Erro ao excluir time.');
    }
  };

  const handleAdicionarMembro = async (timeId, userId) => {
    await adicionarMembro(timeId, userId);
    const ts = await listarTimes();
    setTimes(ts || []);
    if (timeGerenciando && timeGerenciando.id === timeId) {
      const atualizado = (ts || []).find((t) => t.id === timeId);
      if (atualizado) setTimeGerenciando(atualizado);
    }
  };

  const handleRemoverMembro = async (timeId, userId) => {
    await removerMembro(timeId, userId);
    const ts = await listarTimes();
    setTimes(ts || []);
    if (timeGerenciando && timeGerenciando.id === timeId) {
      const atualizado = (ts || []).find((t) => t.id === timeId);
      if (atualizado) setTimeGerenciando(atualizado);
    }
  };

  // Filtros de busca
  const termo = busca.trim().toLowerCase();

  const timesFiltrados = times.filter((t) => {
    if (!termo) return true;
    return (
      t.nome?.toLowerCase().includes(termo) ||
      t.descricao?.toLowerCase().includes(termo)
    );
  });

  const pessoasFiltradas = usuarios.filter((u) => {
    if (!termo) return true;
    return (
      u.nome?.toLowerCase().includes(termo) ||
      u.email?.toLowerCase().includes(termo) ||
      u.cargo?.toLowerCase().includes(termo) ||
      u.cargo_org?.nome?.toLowerCase().includes(termo)
    );
  });

  if (carregando && times.length === 0 && usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#111915]">Painel de Times e Pessoas</h1>
          <p className="text-xs text-[#687770]">
            {times.length} time(s) e {usuarios.length} colaborador(es) cadastrado(s)
          </p>
        </div>
        <PermissaoGuarda permissao="times.gerenciar">
          <button
            onClick={() => {
              setTimeEditando(null);
              setModalTime(true);
            }}
            className="px-4 py-2 bg-[#0E382C] hover:bg-[#07261E] text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.2} />
            <span>Novo Time</span>
          </button>
        </PermissaoGuarda>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#E4ECE7] pb-3">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setAba('times')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              aba === 'times'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            Times ({times.length})
          </button>
          <button
            onClick={() => setAba('pessoas')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              aba === 'pessoas'
                ? 'bg-[#D4EC9D] text-[#132E22] shadow-xs'
                : 'bg-white text-[#687770] border border-[#E4ECE7] hover:bg-[#F7FAF8]'
            }`}
          >
            Pessoas ({usuarios.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={1.8}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={aba === 'times' ? 'Buscar time...' : 'Buscar pessoa...'}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E4ECE7] rounded-xl text-xs text-[#111915] placeholder-slate-400 focus:outline-none focus:border-[#0E382C]"
          />
        </div>
      </div>

      {/* Grid Content */}
      {aba === 'times' ? (
        timesFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#E4ECE7]">
            <p className="text-xs text-[#687770] mb-3">
              {busca
                ? 'Nenhum time encontrado para a busca.'
                : 'Nenhum time cadastrado no momento.'}
            </p>
            <PermissaoGuarda permissao="times.gerenciar">
              <button
                onClick={() => {
                  setTimeEditando(null);
                  setModalTime(true);
                }}
                className="text-xs font-bold text-[#0E382C] hover:underline"
              >
                + Criar novo time agora
              </button>
            </PermissaoGuarda>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {timesFiltrados.map((time) => {
              const membrosDoTime = (time.membros || [])
                .map((m) => m.usuario || m)
                .filter(Boolean);
              return (
                <CardTime
                  key={time.id}
                  time={time}
                  membros={membrosDoTime}
                  onGerenciarMembros={(t) => setTimeGerenciando(t)}
                  onEditar={(t) => {
                    setTimeEditando(t);
                    setModalTime(true);
                  }}
                />
              );
            })}
          </div>
        )
      ) : pessoasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#E4ECE7]">
          <p className="text-xs text-[#687770]">
            {busca
              ? 'Nenhum colaborador encontrado para a busca.'
              : 'Nenhum colaborador cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pessoasFiltradas.map((u) => {
            const timesDoMembro = times.filter((t) =>
              t.membros?.some((m) => (m.usuario?.id || m.user_id) === u.id)
            );
            return (
              <CardMembro
                key={u.id}
                membro={u}
                timesDoMembro={timesDoMembro}
              />
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar Time */}
      <ModalTime
        aberto={modalTime}
        onFechar={() => {
          setModalTime(false);
          setTimeEditando(null);
        }}
        onSalvar={handleSalvarTime}
        onExcluir={handleExcluirTime}
        timeEditando={timeEditando}
      />

      {/* Modal Gerenciar Membros do Time */}
      <ModalGerenciarTime
        aberto={!!timeGerenciando}
        onFechar={() => setTimeGerenciando(null)}
        time={timeGerenciando}
        todosUsuarios={usuarios}
        onAdicionarMembro={handleAdicionarMembro}
        onRemoverMembro={handleRemoverMembro}
        onEditarTime={(t) => {
          setTimeEditando(t);
          setModalTime(true);
        }}
      />
    </div>
  );
};

export default TimesPessoas;
