// =============================================================
// PRANCHETO.IA - CONFIGURAÇÕES
//
// Duas abas: Geral (perfil, aparência, notificações, segurança) e Plano.
// A aba fica na URL (?aba=plano) para que o endereço seja compartilhável
// e para que /dashboard/planos possa redirecionar direto para cá.
//
// Nome e telefone são gravados em 'users', sujeitos à permissão
// 'perfil.editar_proprio' — liberada por padrão, restringível por cargo.
// O e-mail fica fora: é a credencial de login, espelhada de auth.users.
// As demais preferências vivem em user_preferencias.
// =============================================================

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore.js';
import { useTema } from '../../../hooks/useTema.js';
import { usePermission } from '../../../hooks/usePermission.js';
import { supabase } from '../../../lib/supabase.js';

const SecaoPlano = lazy(() => import('./SecaoPlano.jsx'));

const ABAS = [
  { slug: 'geral', label: 'Geral', emoji: '⚙️' },
  { slug: 'plano', label: 'Plano', emoji: '🚀' },
];

const NOME_MAX     = 120;
// Espelha a constraint users_telefone_tamanho: cortar aqui evita a viagem
// até o banco só para receber a violação de volta.
const TELEFONE_MAX = 32;

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

const CampoTexto = ({ label, valor, placeholder, disabled = false, ajuda, maxLength, onChange }) => {
  const id = `config-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-xs font-medium mb-1.5"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={valor}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        onChange={onChange}
        className="w-full rounded-lg px-3 py-2.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-surface-border)',
          color: 'var(--color-text-primary)',
        }}
      />
      {ajuda && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          {ajuda}
        </p>
      )}
    </div>
  );
};

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
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label={label}
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
        ativo ? 'bg-primary-600' : 'bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          ativo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

// ----------------------------------------------------------
// ABA: navegação entre Geral e Plano
// ----------------------------------------------------------
const TabAba = ({ aba, ativa, onSelecionar }) => (
  <button
    type="button"
    onClick={() => onSelecionar(aba.slug)}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
      ativa
        ? 'bg-primary-500/15 border-primary-500/20'
        : 'acao-sutil acao-sutil-bloco border-transparent'
    }`}
    style={ativa ? { color: 'var(--color-primaria-contraste)' } : undefined}
  >
    <span className="text-base">{aba.emoji}</span>
    <span>{aba.label}</span>
  </button>
);

const Configuracoes = () => {
  const { usuario, atualizarUsuario } = useAuthStore();
  // sincronizarComBanco: banco prevalece sobre localStorage (fonte de verdade)
  const { temaEscuro, setTemaEscuro, sincronizarComBanco } = useTema();
  const { pode } = usePermission();

  const [parametros, setParametros] = useSearchParams();
  const abaAtiva = ABAS.some(a => a.slug === parametros.get('aba'))
    ? parametros.get('aba')
    : 'geral';

  const [nome, setNome]                 = useState(usuario?.nome || '');
  const [telefone, setTelefone]         = useState(usuario?.telefone || '');
  const [notifEmail, setNotifEmail]     = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [carregando, setCarregando]     = useState(true);
  const [salvando, setSalvando]         = useState(false);
  const [salvo, setSalvo]               = useState(false);
  const [erro, setErro]                 = useState('');

  const podeEditarPerfil = pode('perfil.editar_proprio');

  useEffect(() => {
    const carregar = async () => {
      if (!usuario?.id) return;
      try {
        const { data, error } = await supabase
          .from('user_preferencias')
          .select('*')
          .eq('user_id', usuario.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        const prefs = data || {};
        // Banco é a fonte de verdade: sincroniza localStorage com o valor do banco
        sincronizarComBanco(prefs.tema || null);
        setNotifEmail(prefs.notif_email !== false);
        setNotifSistema(prefs.notif_sistema !== false);
      } catch (err) {
        console.warn('Preferências não encontradas, usando defaults.', err);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, [usuario?.id, sincronizarComBanco]);

  const selecionarAba = (slug) => {
    setParametros(slug === 'geral' ? {} : { aba: slug }, { replace: true });
  };

  const salvar = async () => {
    const nomeLimpo     = nome.trim();
    // Telefone vazio é ausência de telefone: grava null, como o gatilho espera.
    const telefoneLimpo = telefone.trim() || null;

    if (podeEditarPerfil && !nomeLimpo) {
      setErro('O nome não pode ficar vazio.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
      // Perfil: só toca em 'users' quando há permissão e algo mudou.
      // O RLS e o gatilho no banco barram a gravação de quem não pode, mas
      // evitar a requisição deixa o retorno mais claro para quem pode.
      const alterouPerfil =
        nomeLimpo     !== (usuario?.nome     || '') ||
        telefoneLimpo !== (usuario?.telefone || null);

      if (podeEditarPerfil && alterouPerfil) {
        const { data, error } = await supabase
          .from('users')
          .update({
            nome:          nomeLimpo,
            telefone:      telefoneLimpo,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', usuario.id)
          .select('nome, telefone')
          .single();
        if (error) throw error;
        // Reflete na sidebar e nos avatares sem exigir novo login.
        atualizarUsuario({ nome: data.nome, telefone: data.telefone });
      }

      const { error: erroPrefs } = await supabase
        .from('user_preferencias')
        .upsert({
          user_id:       usuario.id,
          tema:          temaEscuro ? 'escuro' : 'claro',
          notif_email:   notifEmail,
          notif_sistema: notifSistema,
          idioma:        'pt-BR',
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (erroPrefs) throw erroPrefs;

      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar suas alterações.');
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
    <div className={`p-6 mx-auto ${abaAtiva === 'plano' ? 'max-w-5xl' : 'max-w-2xl'}`}>

      {/* Cabeçalho */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          ⚙️ Configurações
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Personalize sua conta e acompanhe o plano da organização.
        </p>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto">
        {ABAS.map((aba) => (
          <TabAba
            key={aba.slug}
            aba={aba}
            ativa={aba.slug === abaAtiva}
            onSelecionar={selecionarAba}
          />
        ))}
      </div>

      {abaAtiva === 'plano' ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <SecaoPlano />
        </Suspense>
      ) : (
        <>
          {/* Perfil */}
          <SecaoConfig titulo="Perfil" descricao="Informações da sua conta.">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {nome.trim()[0]?.toUpperCase() || '?'}
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
              disabled={!podeEditarPerfil}
              maxLength={NOME_MAX}
              ajuda={podeEditarPerfil
                ? undefined
                : 'Seu cargo não permite alterar os próprios dados. Fale com o administrador da organização.'}
              onChange={(e) => setNome(e.target.value)}
            />
            <CampoTexto
              label="Telefone"
              valor={telefone}
              placeholder="(11) 99999-0000"
              disabled={!podeEditarPerfil}
              maxLength={TELEFONE_MAX}
              onChange={(e) => setTelefone(e.target.value)}
            />
            {/* E-mail é a credencial de login, espelhada de auth.users.
                Trocá-lo exige o fluxo de confirmação do Supabase Auth. */}
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
              {[
                { emoji: '🔑', titulo: 'Alterar senha' },
                { emoji: '🛡️', titulo: 'Autenticação em dois fatores' },
              ].map((item) => (
                <button
                  key={item.titulo}
                  disabled
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border transition-colors opacity-60 cursor-not-allowed"
                  style={{ borderColor: 'var(--color-surface-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {item.titulo}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Em breve
                      </p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--color-text-secondary)' }}>›</span>
                </button>
              ))}
            </div>
          </SecaoConfig>

          {/* Botão salvar */}
          {erro && <p className="text-red-400 text-sm mb-3">{erro}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={salvar}
              disabled={salvando}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
            {salvo && (
              <span className="text-emerald-400 text-sm flex items-center gap-1">
                ✓ Salvo com sucesso!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Configuracoes;
