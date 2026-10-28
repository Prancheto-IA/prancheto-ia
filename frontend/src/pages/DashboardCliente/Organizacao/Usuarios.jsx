// =============================================================
// PRANCHETO.IA - USUÁRIOS DA ORGANIZAÇÃO (Bloco 5)
//
// Gestão de usuários pelo próprio cliente: criar (via Edge Function
// tenant-usuarios), mudar cargo e ativar/desativar (via RPC
// definir_cargo_usuario/definir_ativo_usuario). Nunca exclui — histórico
// preservado.
//
// A hierarquia (nível do cargo) e a proteção do Chefe Supremo são
// reforçadas no banco (RLS/RPC/trigger) — o que a interface faz aqui é
// só esconder ações que o banco recusaria de qualquer jeito, pra não
// convidar ninguém a tentar e levar um erro.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { useAuthStore } from '../../../store/authStore.js';
import { supabase } from '../../../lib/supabase.js';

const gerarSenhaAleatoria = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let senha = '';
  for (let i = 0; i < 10; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
};

const BadgeDono = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1">
    👑 Chefe Supremo
  </span>
);

const BadgeInativo = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-medium">Inativo</span>
);

// ─── Modal: Novo Usuário ─────────────────────────────────────────
const ModalNovoUsuario = ({ aberto, onFechar, onCriado, cargos, meuNivel, souDono }) => {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', cargoId: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [criado, setCriado] = useState(null);

  useEffect(() => {
    if (aberto) {
      setForm({ nome: '', email: '', senha: gerarSenhaAleatoria(), cargoId: '' });
      setErro('');
      setCriado(null);
    }
  }, [aberto]);

  if (!aberto) return null;

  const cargosDisponiveis = souDono ? cargos : cargos.filter((c) => (c.nivel ?? 0) < meuNivel);
  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onFechar}>
      <div
        className="w-full max-w-md rounded-xl shadow-2xl"
        style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>➕ Novo usuário</h2>
          <button onClick={onFechar} className="acao-sutil text-xl">✕</button>
        </div>

        {criado ? (
          <div className="p-5 space-y-4">
            <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Usuário criado! Anote a senha temporária abaixo — ela só aparece aqui, uma vez.
            </p>
            <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>E-mail</p>
              <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{criado.email}</p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>Senha temporária</p>
              <p className="text-sm font-mono" style={{ color: 'var(--color-text-primary)' }}>{criado.senha}</p>
            </div>
            <button
              onClick={onFechar}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
            >
              Concluído
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Nome *</label>
              <input type="text" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>E-mail *</label>
              <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Senha temporária *</label>
              <div className="flex gap-2">
                <input type="text" required value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50" style={inputStyle} />
                <button type="button" onClick={() => setForm((f) => ({ ...f, senha: gerarSenhaAleatoria() }))}
                  className="acao-sutil acao-sutil-bloco px-3 rounded-lg text-xs" title="Gerar outra senha">🔄</button>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Repasse essa senha à pessoa — ela pode trocá-la depois de entrar.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Cargo</label>
              <select value={form.cargoId} onChange={(e) => setForm((f) => ({ ...f, cargoId: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50" style={inputStyle}>
                <option value="">Sem cargo</option>
                {cargosDisponiveis.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} (nível {c.nivel ?? 0})</option>
                ))}
              </select>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Só aparecem cargos de nível abaixo do seu.
              </p>
            </div>

            {erro && <p className="text-red-400 text-xs">{erro}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onFechar}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-surface-border)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Linha de usuário ────────────────────────────────────────────
const LinhaUsuario = ({ usuario: u, souEu, podeGerenciar, cargosDisponiveis, ocupado, onMudarCargo, onToggleAtivo }) => {
  const iniciais = u.nome?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
    >
      <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {iniciais}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {u.nome}{souEu ? ' (você)' : ''}
          </p>
          {u.e_dono_tenant && <BadgeDono />}
          {!u.ativo && <BadgeInativo />}
        </div>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</p>
      </div>

      {podeGerenciar ? (
        <select
          value={u.cargo_id || ''}
          onChange={(e) => onMudarCargo(u, e.target.value || null)}
          disabled={ocupado === u.id}
          className="text-xs px-2 py-1.5 rounded-lg flex-shrink-0 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">Sem cargo</option>
          {cargosDisponiveis.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      ) : (
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {u.cargo_org?.nome || '—'}
        </span>
      )}

      {podeGerenciar && (
        <button
          onClick={() => onToggleAtivo(u)}
          disabled={ocupado === u.id}
          className={`text-xs px-2 py-1.5 rounded-lg flex-shrink-0 transition-colors disabled:opacity-50 ${
            u.ativo ? 'acao-sutil hover:text-red-500 hover:bg-red-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'
          }`}
          title={u.ativo ? 'Desativar usuário' : 'Reativar usuário'}
        >
          {ocupado === u.id ? '⏳' : u.ativo ? '🚫 Desativar' : '✅ Reativar'}
        </button>
      )}
    </div>
  );
};

// ─── Página principal ────────────────────────────────────────────
const Usuarios = () => {
  const {
    listarUsuariosCompleto, listarCargos,
    definirAtivoUsuario, definirCargoUsuario,
    obterMeuNivel, souDonoTenant,
  } = useOrg();
  const { pode } = usePermission();
  const usuarioLogado = useAuthStore((s) => s.usuario);

  const [usuarios, setUsuarios]     = useState([]);
  const [cargos, setCargos]         = useState([]);
  const [meuNivel, setMeuNivel]     = useState(0);
  const [souDono, setSouDono]       = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [inicializado, setInicializado] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [ocupado, setOcupado]       = useState(null);
  const [erro, setErro]             = useState('');

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

  // Mesma regra do banco (definir_ativo_usuario/definir_cargo_usuario):
  // não mexe em si mesmo, no dono, nem em alguém de nível igual/maior.
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
      ? `Desativar ${u.nome}? O histórico (mensagens, tarefas, negociações) é mantido — só o acesso é bloqueado. Dá pra reativar depois.`
      : `Reativar ${u.nome}?`;
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

  if (!inicializado && carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>👤 Usuários</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Crie usuários e gerencie cargos — sempre dentro do seu nível hierárquico.
          </p>
        </div>
        {podeGerenciarGeral && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors"
          >
            <span>+</span><span>Novo usuário</span>
          </button>
        )}
      </div>

      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      <div className="space-y-2">
        {usuarios.map((u) => (
          <LinhaUsuario
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
