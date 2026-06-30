// =============================================================
// PRANCHETO.IA - CONFIGURAÇÕES
// =============================================================

import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore.js';

const SecaoConfig = ({ titulo, descricao, children }) => (
  <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden mb-4">
    <div className="px-5 py-4 border-b border-surface-border">
      <h3 className="text-white font-semibold text-sm">{titulo}</h3>
      {descricao && <p className="text-slate-400 text-xs mt-0.5">{descricao}</p>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const CampoTexto = ({ label, valor, placeholder, disabled = false, onChange }) => (
  <div className="mb-4">
    <label className="block text-slate-300 text-xs font-medium mb-1.5">{label}</label>
    <input
      type="text"
      value={valor}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>
);

const Toggle = ({ label, descricao, ativo, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-surface-border/50 last:border-0">
    <div>
      <p className="text-slate-200 text-sm font-medium">{label}</p>
      {descricao && <p className="text-slate-500 text-xs mt-0.5">{descricao}</p>}
    </div>
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${ativo ? 'bg-primary-600' : 'bg-slate-700'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const Configuracoes = () => {
  const { usuario } = useAuthStore();
  const [nome, setNome]           = useState(usuario?.nome || '');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [temaEscuro, setTemaEscuro]   = useState(true);
  const [salvo, setSalvo]         = useState(false);

  const salvar = () => {
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">⚙️ Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Personalize sua conta e preferências.</p>
      </div>

      {/* Perfil */}
      <SecaoConfig titulo="Perfil" descricao="Informações da sua conta.">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {nome[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-white font-medium">{nome || 'Usuário'}</p>
            <p className="text-slate-400 text-sm">{usuario?.email}</p>
          </div>
        </div>
        <CampoTexto
          label="Nome completo"
          valor={nome}
          placeholder="Seu nome"
          onChange={e => setNome(e.target.value)}
        />
        <CampoTexto
          label="E-mail"
          valor={usuario?.email || ''}
          disabled={true}
        />
        <CampoTexto
          label="Cargo"
          valor={usuario?.cargo || ''}
          disabled={true}
        />
      </SecaoConfig>

      {/* Notificações */}
      <SecaoConfig titulo="Notificações" descricao="Controle como você recebe alertas.">
        <Toggle
          label="Notificações por e-mail"
          descricao="Receba atualizações importantes no seu e-mail."
          ativo={notifEmail}
          onChange={setNotifEmail}
        />
        <Toggle
          label="Notificações do sistema"
          descricao="Alertas dentro da plataforma."
          ativo={notifSistema}
          onChange={setNotifSistema}
        />
      </SecaoConfig>

      {/* Aparência */}
      <SecaoConfig titulo="Aparência" descricao="Personalize a interface.">
        <Toggle
          label="Tema escuro"
          descricao="Interface com fundo escuro (recomendado)."
          ativo={temaEscuro}
          onChange={setTemaEscuro}
        />
      </SecaoConfig>

      {/* Segurança */}
      <SecaoConfig titulo="Segurança" descricao="Gerencie o acesso à sua conta.">
        <div className="space-y-3">
          <button
            disabled
            className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-surface-border hover:bg-white/5 transition-colors opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <span>🔑</span>
              <div>
                <p className="text-slate-200 text-sm font-medium">Alterar senha</p>
                <p className="text-slate-500 text-xs">Em breve</p>
              </div>
            </div>
            <span className="text-slate-500">›</span>
          </button>
          <button
            disabled
            className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-surface-border hover:bg-white/5 transition-colors opacity-60 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <span>🛡️</span>
              <div>
                <p className="text-slate-200 text-sm font-medium">Autenticação em dois fatores</p>
                <p className="text-slate-500 text-xs">Em breve</p>
              </div>
            </div>
            <span className="text-slate-500">›</span>
          </button>
        </div>
      </SecaoConfig>

      {/* Botão salvar */}
      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Salvar alterações
        </button>
        {salvo && (
          <span className="text-emerald-400 text-sm flex items-center gap-1">
            ✓ Salvo com sucesso!
          </span>
        )}
      </div>
    </div>
  );
};

export default Configuracoes;
