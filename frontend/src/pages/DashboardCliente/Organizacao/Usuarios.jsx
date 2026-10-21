// =============================================================
// PRANCHETO.IA - USUÁRIOS DA ORGANIZAÇÃO
// Gestão de colaboradores pelo cliente em layout multi-coluna moderno.
// Criação via Edge Function, alteração de cargo e status via RPC.
// =============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuthStore } from '../../../store/authStore.js';
import { supabase } from '../../../lib/supabase.js';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Add01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';

const gerarSenhaAleatoria = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let senha = '';
  for (let i = 0; i < 10; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
};

// ----------------------------------------------------------
// MODAL: Novo Usuário
// ----------------------------------------------------------
const ModalNovoUsuario = ({ aberto, onFechar, onCriado, cargos, meuNivel, souDono }) => {
  const [form, setForm]         = useState({ nome: '', email: '', senha: '', cargoId: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');
  const [criado, setCriado]     = useState(null);
  const [copiado, setCopiado]   = useState(false);

  useEffect(() => {
    if (aberto) {
      setForm({ nome: '', email: '', senha: gerarSenhaAleatoria(), cargoId: '' });
      setErro('');
      setCriado(null);
      setCopiado(false);
    }
  }, [aberto]);

  if (!aberto) return null;

  const cargosDisponiveis = souDono ? cargos : cargos.filter((c) => (c.nivel ?? 0) < meuNivel);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      const { data, error } = await supabase.functions.invoke('tenant-usuarios', {
        body: {
          action: 'create',
          payload: {
            nome: form.nome.trim(),
            email: form.email.trim(),
            senha: form.senha,
            cargoId: form.cargoId || null,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCriado({ email: form.email.trim(), senha: form.senha });
      await onCriado();
    } catch (err) {
      setErro(err.message || 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const copiarCredenciais = () => {
    if (!criado) return;
    const texto = `Acesso Prancheto.IA\nE-mail: ${criado.email}\nSenha temporária: ${criado.senha}`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto" onClick={onFechar}>
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-[#E4ECE7] shadow-2xl my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4ECE7]">
          <h2 className="font-bold text-base text-[#111915]">
            {criado ? 'Credenciais do Novo Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onFechar} className="text-slate-400 hover:text-[#111915] transition-colors text-lg p-1">
            ✕
          </button>
        </div>

        {criado ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              <p className="font-bold mb-1">Usuário cadastrado com sucesso!</p>
              <p>Copie e repasse as credenciais abaixo ao colaborador. A senha só é exibida agora.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-[#687770]">E-mail</p>
                <p className="text-sm font-bold text-[#111915] font-mono break-all">{criado.email}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#687770]">Senha Temporária</p>
                <p className="text-sm font-bold text-[#0E382C] font-mono bg-white px-3 py-1.5 rounded-lg border border-[#E4ECE7] inline-block mt-0.5">
                  {criado.senha}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={copiarCredenciais}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#E4ECE7] hover:bg-[#F7FAF8] text-[#111915] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{copiado ? '✓ Copiado!' : 'Copiar dados'}</span>
              </button>
              <button
                type="button"
                onClick={onFechar}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-colors shadow-xs cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {erro && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">Nome Completo *</label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Ana Silva"
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">E-mail Corporativo *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ana@suaempresa.com"
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">Senha Temporária *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={form.senha}
                  onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="flex-1 bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, senha: gerarSenhaAleatoria() }))}
                  className="px-3 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8] hover:bg-white text-[#687770] text-xs font-semibold cursor-pointer transition-colors"
                  title="Gerar outra senha"
                >
                  Gerar
                </button>
              </div>
              <p className="text-[11px] text-[#687770] mt-1">
                O usuário poderá redefinir a própria senha após o primeiro acesso.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#687770] mb-1.5">Cargo Inicial</label>
              <select
                value={form.cargoId}
                onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))}
                className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs cursor-pointer"
              >
                <option value="">Sem cargo atribuído</option>
                {cargosDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} (Nível {c.nivel ?? 0})
                  </option>
                ))}
              </select>
            </div>

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
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {salvando ? 'Criando usuário...' : 'Criar Usuário'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// CARD DE USUÁRIO (Emitly Design System)
// ----------------------------------------------------------
const CardUsuario = ({ usuario, souEu, podeGerenciar, cargosDisponiveis, ocupado, onMudarCargo, onToggleAtivo }) => {
  const estaOcupado = ocupado === usuario.id;
  const inicial = usuario.nome?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
      usuario.ativo
        ? 'border-[#E4ECE7] hover:border-[#0E382C]/30'
        : 'border-dashed border-red-200 bg-red-50/20 opacity-80'
    }`}>
      <div>
        {/* Topo: Avatar e Identificação */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center font-bold text-sm shadow-2xs border border-[#E4ECE7]">
                {inicial}
              </div>
              <span className={`w-3 h-3 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-white ${
                usuario.ativo ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm text-[#111915] truncate">
                  {usuario.nome}
                </h3>
                {souEu && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#EDF2EE] text-[#0E382C]">
                    Você
                  </span>
                )}
                {usuario.e_dono_tenant && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Chefe Supremo
                  </span>
                )}
              </div>
              <p className="text-xs text-[#687770] truncate mt-0.5">{usuario.email}</p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            usuario.ativo
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {usuario.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Cargo Selector / Badge */}
        <div className="mt-4 pt-3 border-t border-[#E4ECE7]">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-[#687770]">Cargo atribuído:</span>
            {usuario.cargo_org && (
              <span className="text-[10px] font-semibold text-[#687770]">
                Nível {usuario.cargo_org.nivel ?? 0}
              </span>
            )}
          </div>

          {podeGerenciar ? (
            <select
              value={usuario.cargo_id || ''}
              disabled={estaOcupado || !usuario.ativo}
              onChange={(e) => onMudarCargo(usuario, e.target.value ? e.target.value : null)}
              className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all disabled:opacity-50 cursor-pointer"
            >
              <option value="">Sem cargo atribuído</option>
              {cargosDisponiveis.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} (Nível {c.nivel ?? 0})
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7] text-xs font-semibold text-[#111915]">
              {usuario.cargo_org?.nome || 'Sem cargo atribuído'}
            </div>
          )}
        </div>
      </div>

      {/* Ações Inferiores */}
      <div className="mt-4 pt-3 border-t border-[#E4ECE7] flex items-center justify-between">
        <span className="text-[11px] text-[#687770]">
          {usuario.cargo_org?.descricao || (usuario.ativo ? 'Acesso liberado' : 'Acesso suspenso')}
        </span>

        {podeGerenciar && (
          <button
            onClick={() => onToggleAtivo(usuario)}
            disabled={estaOcupado}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
              usuario.ativo
                ? 'text-red-600 hover:bg-red-50'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {estaOcupado ? 'Processando...' : usuario.ativo ? 'Desativar' : 'Reativar'}
          </button>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: USUÁRIOS
// ----------------------------------------------------------
const Usuarios = () => {
  const {
    listarUsuariosCompleto, listarCargos,
    definirAtivoUsuario, definirCargoUsuario,
    obterMeuNivel, souDonoTenant,
  } = useOrg();
  const { pode } = usePermission();
  const usuarioLogado = useAuthStore((s) => s.usuario);

  const [usuarios, setUsuarios]         = useState([]);
  const [cargos, setCargos]             = useState([]);
  const [meuNivel, setMeuNivel]         = useState(0);
  const [souDono, setSouDono]           = useState(false);
  const [carregando, setCarregando]     = useState(true);
  const [inicializado, setInicializado] = useState(false);
  const [modalAberto, setModalAberto]   = useState(false);
  const [ocupado, setOcupado]           = useState(null);
  const [erro, setErro]                 = useState('');

  // Filtros
  const [busca, setBusca]           = useState('');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [us, cg, nivel, dono] = await Promise.all([
      listarUsuariosCompleto(), listarCargos(), obterMeuNivel(), souDonoTenant(),
    ]);
    setUsuarios(us);
    setCargos(cg);
    setMeuNivel(nivel);
    setSouDono(dono);
    setCarregando(false);
    setInicializado(true);
  }, [listarUsuariosCompleto, listarCargos, obterMeuNivel, souDonoTenant]);

  useEffect(() => { carregar(); }, [carregar]);

  const podeGerenciarGeral = souDono || pode('usuarios.gerenciar');

  const podeGerenciarAlvo = (u) => {
    if (!podeGerenciarGeral) return false;
    if (u.id === usuarioLogado?.id) return false;
    if (u.e_dono_tenant) return false;
    if (souDono) return true;
    return (u.cargo_org?.nivel ?? 0) < meuNivel;
  };

  const cargosDisponiveis = souDono ? cargos : cargos.filter((c) => (c.nivel ?? 0) < meuNivel);

  const handleToggleAtivo = async (u) => {
    const confirmMsg = u.ativo
      ? `Desativar ${u.nome}? O histórico (mensagens, tarefas, negociações) permanece preservado e o acesso é bloqueado.`
      : `Reativar o acesso de ${u.nome}?`;
    if (!window.confirm(confirmMsg)) return;
    setOcupado(u.id);
    setErro('');
    try {
      await definirAtivoUsuario(u.id, !u.ativo);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar usuário.');
    } finally {
      setOcupado(null);
    }
  };

  const handleMudarCargo = async (u, cargoId) => {
    setOcupado(u.id);
    setErro('');
    try {
      await definirCargoUsuario(u.id, cargoId);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar cargo.');
    } finally {
      setOcupado(null);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const matchBusca =
        !busca.trim() ||
        u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        u.email?.toLowerCase().includes(busca.toLowerCase());

      const matchCargo =
        filtroCargo === 'todos' ||
        (filtroCargo === 'sem_cargo' && !u.cargo_id) ||
        u.cargo_id === filtroCargo;

      const matchStatus =
        filtroStatus === 'todos' ||
        (filtroStatus === 'ativos' && u.ativo) ||
        (filtroStatus === 'inativos' && !u.ativo);

      return matchBusca && matchCargo && matchStatus;
    });
  }, [usuarios, busca, filtroCargo, filtroStatus]);

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const ativosCount = usuarios.filter((u) => u.ativo).length;
  const inativosCount = usuarios.filter((u) => !u.ativo).length;

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111915]">
            Usuários da Organização
          </h1>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Gerencie os colaboradores da organização, atribua cargos e controle os acessos à plataforma.
          </p>
        </div>

        {podeGerenciarGeral && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2.2} />
            <span>Novo usuário</span>
          </button>
        )}
      </div>

      {erro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* KPI Stats em 3 Colunas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{usuarios.length}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Total de Colaboradores</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center">
            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{ativosCount}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Usuários Ativos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.8} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-[#111915]">{inativosCount}</p>
            <p className="text-xs font-semibold text-[#687770] mt-0.5">Usuários Inativos</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} />
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-2xl border border-[#E4ECE7] p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={filtroCargo}
            onChange={(e) => setFiltroCargo(e.target.value)}
            className="flex-1 md:flex-initial bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0E382C] cursor-pointer shadow-2xs"
          >
            <option value="todos">Todos os cargos</option>
            <option value="sem_cargo">Sem cargo</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="flex-1 md:flex-initial bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0E382C] cursor-pointer shadow-2xs"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Somente Ativos</option>
            <option value="inativos">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid de Usuários em Múltiplas Colunas */}
      {usuariosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-[#E4ECE7] p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EDF2EE] text-[#0E382C] flex items-center justify-center mb-3">
            <HugeiconsIcon icon={UserGroupIcon} size={24} strokeWidth={1.8} />
          </div>
          <h3 className="font-bold text-sm text-[#111915] mb-1">
            Nenhum usuário encontrado
          </h3>
          <p className="text-xs text-[#687770]">
            Tente ajustar os termos de pesquisa ou filtros selecionados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
          {usuariosFiltrados.map((u) => (
            <CardUsuario
              key={u.id}
              usuario={u}
              souEu={u.id === usuarioLogado?.id}
              podeGerenciar={podeGerenciarAlvo(u)}
              cargosDisponiveis={cargosDisponiveis}
              ocupado={ocupado}
              onMudarCargo={handleMudarCargo}
              onToggleAtivo={handleToggleAtivo}
            />
          ))}
        </div>
      )}

      {/* Modal Novo Usuário */}
      <ModalNovoUsuario
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriado={carregar}
        cargos={cargos}
        meuNivel={meuNivel}
        souDono={souDono}
      />
    </div>
  );
};

export default Usuarios;
