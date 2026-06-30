// =============================================================
// PRANCHETO.IA - CONFIGURAÇÕES
// Persiste preferências no banco via GET/PUT /api/preferencias
// =============================================================

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore.js';
import { useTema } from '../../../hooks/useTema.js';
import api from '../../../services/api.js';

const SecaoConfig = ({ titulo, descricao, children }) => (
  <div
    className="border rounded-xl overflow-hidden mb-4"
    style={{
      backgroundColor: 'var(--color-surface-card)',
      borderColor: 'var(--color-surface-border)',
    }}
  >
    <div
      className="px-5 py-4 border-b"
      style={{ borderColor: 'var(--color-surface-border)' }}
    >
      <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {titulo}
      </h3>
      {descricao && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {descricao}
        </p>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const CampoTexto = ({ label, valor, placeholder, disabled = false, onChange }) => (
  <div className="mb-4">
    <label
      className="block text-xs font-medium mb-1.5"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      {label}
    </label>
    <input
      type="text"
      value={valor}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-surface-border)',
        color: 'var(--color-text-primary)',
      }}
    />
  </div>
);

const Toggle = ({ label, descricao, ativo, onChange }) => (
  <div
    className="flex items-center justify-between py-3 border-b last:border-0"
    style={{ borderColor: 'var(--color-surface-border)' }}
  >
    <div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </p>
      {descricao && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {descricao}
        </p>
      )}
    </div>
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
        ativo ? 'bg-primary-600' : 'bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          ativo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const Configuracoes = () => {
  const { usuario } = useAuthStore();
  const { temaEscuro, setTemaEscuro } = useTema();

  const [nome, setNome]                 = useState(usuario?.nome || '');
  const [notifEmail, setNotifEmail]     = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [carregando, setCarregando]     = useState(true);
  const [salvando, setSalvando]         = useState(false);
  const [salvo, setSalvo]               = useState(false);
  const [erro, setErro]                 = useState('');

  // Carrega preferências do banco ao montar
  useEffect(() => {
    const carregar = async () => {
      try {
        const { data } = await api.get('/preferencias');
        const prefs = data.dados || {};
        // Aplica tema do banco (prioridade sobre localStorage)
        if (prefs.tema === 'escuro') setTemaEscuro(true);
        else if (prefs.tema === 'claro') setTemaEscuro(false);
        setNotifEmail(prefs.notif_email   !== false);
        setNotifSistema(prefs.notif_sistema !== false);
      } catch (err) {
        // Se não encontrar preferências, usa os defaults
        console.warn('Preferências não encontradas, usando defaults.');
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      await api.put('/preferencias', {
        tema:          temaEscuro ? 'escuro' : 'claro',
        notif_email:   notifEmail,
        notif_sistema: notifSistema,
        idioma:        'pt-BR',
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err?.response?.data?.mensagem || 'Erro ao salvar preferências.');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          ⚙️ Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Personalize sua conta e preferências.
        </p>
      </div>

      {/* Perfil */}
      <SecaoConfig titulo="Perfil" descricao="Informações da sua conta.">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {nome[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {nome || 'Usuário'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {usuario?.email}
            </p>
          </div>
        </div>
        <CampoTexto
          label="Nome completo"
          valor={nome}
          placeholder="Seu nome"
          onChange={(e) => setNome(e.target.value)}
        />
        <CampoTexto label="E-mail"  valor={usuario?.email || ''} disabled />
        <CampoTexto label="Cargo"   valor={usuario?.cargo || ''} disabled />
      </SecaoConfig>

      {/* Aparência */}
      <SecaoConfig titulo="Aparência" descricao="Personalize a interface visual.">
        <Toggle
          label="Tema escuro"
          descricao="Interface com fundo escuro (recomendado para uso prolongado)."
          ativo={temaEscuro}
          onChange={setTemaEscuro}
        />
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-surface-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Tema atual:{' '}
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {temaEscuro ? '🌙 Escuro' : '☀️ Claro'}
            </span>
          </p>
        </div>
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

      {/* Segurança */}
      <SecaoConfig titulo="Segurança" descricao="Gerencie o acesso à sua conta.">
        <div className="space-y-3">
          <button
            disabled
            className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors opacity-60 cursor-not-allowed"
            style={{ borderColor: 'var(--color-surface-border)' }}
          >
            <div className="flex items-center gap-3">
              <span>🔑</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Alterar senha
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Em breve
                </p>
              </div>
            </div>
            <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
          </button>
          <button
            disabled
            className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors opacity-60 cursor-not-allowed"
            style={{ borderColor: 'var(--color-surface-border)' }}
          >
            <div className="flex items-center gap-3">
              <span>🛡️</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Autenticação em dois fatores
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Em breve
                </p>
              </div>
            </div>
            <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
          </button>
        </div>
      </SecaoConfig>

      {/* Botão salvar */}
      {erro && (
        <p className="text-red-400 text-sm mb-3">{erro}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar preferências'}
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
