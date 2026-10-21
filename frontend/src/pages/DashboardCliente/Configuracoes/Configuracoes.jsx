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
import { useRotulosOutbound, STATUS_ORDEM, ROTULOS_PADRAO } from '../../../hooks/useRotulosOutbound.js';
import { supabase } from '../../../lib/supabase.js';
import AjustesTopNav from '../../../components/Ajustes/AjustesTopNav.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon02Icon, Key01Icon, Shield01Icon } from '@hugeicons/core-free-icons';

const SecaoPlano = lazy(() => import('./SecaoPlano.jsx'));

const ABAS = [
  { slug: 'geral', label: 'Geral' },
  { slug: 'plano', label: 'Plano da Organização' },
];

const DESCRICAO_STATUS = {
  pendente:    'Pendente',
  enviado:     'Enviado',
  respondido:  'Respondido',
  sem_retorno: 'Sem Retorno',
  convertido:  'Convertido',
};

const SUBTITULO_STATUS = {
  pendente:    'Ainda não contatado',
  enviado:     'Primeiro contato feito',
  respondido:  'A pessoa retornou',
  sem_retorno: 'Não respondeu',
  convertido:  'Fechou negócio',
};

const NOME_MAX     = 120;
const TELEFONE_MAX = 32;

const CampoTexto = ({ label, valor, placeholder, disabled = false, ajuda, maxLength, onChange }) => {
  const id = `config-${label.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-[#687770] mb-1.5"
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
        className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
      />
      {ajuda && (
        <p className="text-[11px] text-[#687770] mt-1.5 leading-tight">
          {ajuda}
        </p>
      )}
    </div>
  );
};

const ToggleSwitch = ({ label, descricao, ativo, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-[#E4ECE7] last:border-0">
    <div className="pr-4">
      <p className="text-xs sm:text-sm font-semibold text-[#111915]">
        {label}
      </p>
      {descricao && (
        <p className="text-[11px] sm:text-xs text-[#687770] mt-0.5">
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
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
        ativo ? 'bg-[#0E382C]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          ativo ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const Configuracoes = () => {
  const { usuario, atualizarUsuario } = useAuthStore();
  const { temaEscuro, setTemaEscuro, sincronizarComBanco } = useTema();
  const { pode } = usePermission();
  const { rotulos: rotulosSalvos, salvar: salvarRotulosOutbound } = useRotulosOutbound(usuario?.id);

  const [parametros, setParametros] = useSearchParams();
  const abaAtiva = ABAS.some(a => a.slug === parametros.get('aba'))
    ? parametros.get('aba')
    : 'geral';

  const [nome, setNome]                 = useState(usuario?.nome || '');
  const [telefone, setTelefone]         = useState(usuario?.telefone || '');
  const [notifEmail, setNotifEmail]     = useState(true);
  const [notifSistema, setNotifSistema] = useState(true);
  const [rotulosStatus, setRotulosStatus] = useState(ROTULOS_PADRAO);
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

  useEffect(() => {
    setRotulosStatus(rotulosSalvos);
  }, [rotulosSalvos]);

  const selecionarAba = (slug) => {
    setParametros(slug === 'geral' ? {} : { aba: slug }, { replace: true });
  };

  const salvar = async () => {
    const nomeLimpo     = nome.trim();
    const telefoneLimpo = telefone.trim() || null;

    if (podeEditarPerfil && !nomeLimpo) {
      setErro('O nome não pode ficar vazio.');
      return;
    }

    setSalvando(true);
    setErro('');
    try {
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

      await salvarRotulosOutbound(rotulosStatus);

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
        <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inicial = nome.trim()[0]?.toUpperCase() || 'U';

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* 1. Menu Horizontal no Topo */}
      <AjustesTopNav />

      {/* 2. Cabeçalho com Abas Internas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111915]">
            Configurações
          </h1>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Personalize sua conta, preferências do sistema e acompanhe o plano da organização.
          </p>
        </div>

        {/* Sub-abas: Geral e Plano */}
        <div className="flex items-center gap-1.5 bg-[#F7FAF8] p-1 rounded-xl border border-[#E4ECE7] self-start sm:self-auto">
          {ABAS.map((aba) => (
            <button
              key={aba.slug}
              type="button"
              onClick={() => selecionarAba(aba.slug)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                aba.slug === abaAtiva
                  ? 'bg-[#0E382C] text-[#D4EC9D] shadow-xs'
                  : 'text-[#687770] hover:text-[#111915]'
              }`}
            >
              <span>{aba.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Conteúdo da Aba */}
      {abaAtiva === 'plano' ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-6 shadow-xs">
            <SecaoPlano />
          </div>
        </Suspense>
      ) : (
        /* Layout Reorganizado em Múltiplas Colunas */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUNA ESQUERDA (lg:col-span-7) */}
          <div className="lg:col-span-7 flex flex-col space-y-5">
            {/* Card: Perfil */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#E4ECE7]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center text-lg font-bold shadow-xs flex-shrink-0 border border-[#E4ECE7]">
                    {inicial}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#111915]">
                      {nome || 'Seu Perfil'}
                    </h2>
                    <p className="text-xs text-[#687770]">{usuario?.email}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EDF2EE] text-[#0E382C] border border-[#E4ECE7]">
                  {usuario?.cargo?.toUpperCase() || 'MEMBRO'}
                </span>
              </div>

              {/* Grid de Campos em 2 Colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <CampoTexto
                  label="Nome completo"
                  valor={nome}
                  placeholder="Seu nome completo"
                  disabled={!podeEditarPerfil}
                  maxLength={NOME_MAX}
                  ajuda={
                    podeEditarPerfil
                      ? undefined
                      : 'Seu cargo não permite alterar o nome.'
                  }
                  onChange={(e) => setNome(e.target.value)}
                />
                <CampoTexto
                  label="Telefone / WhatsApp"
                  valor={telefone}
                  placeholder="(11) 99999-0000"
                  disabled={!podeEditarPerfil}
                  maxLength={TELEFONE_MAX}
                  onChange={(e) => setTelefone(e.target.value)}
                />
                <CampoTexto
                  label="E-mail de Login"
                  valor={usuario?.email || ''}
                  disabled
                  ajuda="Gerenciado via autenticação segura."
                />
                <CampoTexto
                  label="Cargo Atual"
                  valor={usuario?.cargo || 'Membro'}
                  disabled
                  ajuda="Definido pelo administrador da organização."
                />
              </div>
            </div>

            {/* Card: Rótulos do Outbound */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#E4ECE7]">
                <div>
                  <h2 className="text-base font-bold text-[#111915]">
                    Rótulos do Outbound
                  </h2>
                  <p className="text-xs text-[#687770] mt-0.5">
                    Personalize como os status dos contatos são exibidos no seu funil de vendas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRotulosStatus(ROTULOS_PADRAO)}
                  className="text-xs font-semibold text-[#0E382C] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Restaurar padrões
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {STATUS_ORDEM.map((status) => (
                  <div key={status} className="flex flex-col">
                    <CampoTexto
                      label={`${DESCRICAO_STATUS[status]} (${SUBTITULO_STATUS[status]})`}
                      valor={rotulosStatus[status] ?? ''}
                      placeholder={ROTULOS_PADRAO[status]}
                      maxLength={40}
                      onChange={(e) =>
                        setRotulosStatus((prev) => ({ ...prev, [status]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col space-y-5">
            {/* Card: Aparência */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#111915]">Aparência</h2>
              <p className="text-xs text-[#687770] mt-0.5 mb-4">
                Escolha o tema visual da interface.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTemaEscuro(false)}
                  className={`flex flex-col items-center gap-2.5 p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    !temaEscuro
                      ? 'border-[#0E382C] bg-[#F7FAF8] ring-2 ring-[#0E382C]/15 font-bold text-[#0E382C]'
                      : 'border-[#E4ECE7] bg-white text-[#687770] hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-slate-700 shadow-2xs">
                    <HugeiconsIcon icon={Sun01Icon} size={18} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs">Modo Claro</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTemaEscuro(true)}
                  className={`flex flex-col items-center gap-2.5 p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    temaEscuro
                      ? 'border-[#0E382C] bg-[#F7FAF8] ring-2 ring-[#0E382C]/15 font-bold text-[#0E382C]'
                      : 'border-[#E4ECE7] bg-white text-[#687770] hover:border-slate-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0E382C] text-[#D4EC9D] flex items-center justify-center shadow-2xs">
                    <HugeiconsIcon icon={Moon02Icon} size={18} strokeWidth={1.8} />
                  </div>
                  <span className="text-xs">Modo Escuro</span>
                </button>
              </div>
            </div>

            {/* Card: Notificações */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#111915]">Notificações</h2>
              <p className="text-xs text-[#687770] mt-0.5 mb-3">
                Controle os canais de recebimento de alertas.
              </p>

              <ToggleSwitch
                label="Notificações por e-mail"
                descricao="Receba atualizações importantes sobre projetos e tarefas."
                ativo={notifEmail}
                onChange={setNotifEmail}
              />
              <ToggleSwitch
                label="Notificações no sistema"
                descricao="Alertas instantâneos na interface da plataforma."
                ativo={notifSistema}
                onChange={setNotifSistema}
              />
            </div>

            {/* Card: Segurança */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
              <h2 className="text-base font-bold text-[#111915]">Segurança</h2>
              <p className="text-xs text-[#687770] mt-0.5 mb-4">
                Gerencie credenciais e proteção da sua conta.
              </p>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C]">
                      <HugeiconsIcon icon={Key01Icon} size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111915]">Alterar senha</p>
                      <p className="text-[11px] text-[#687770]">Recuperação via e-mail</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Em breve
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E4ECE7] bg-[#F7FAF8]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-[#E4ECE7] flex items-center justify-center text-[#0E382C]">
                      <HugeiconsIcon icon={Shield01Icon} size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#111915]">Autenticação 2FA</p>
                      <p className="text-[11px] text-[#687770]">Segurança em dois fatores</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                    Em breve
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Ação: Salvar */}
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto">
                {erro && <p className="text-red-500 text-xs font-medium">{erro}</p>}
                {salvo && (
                  <p className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                    ✓ Alterações salvas com sucesso!
                  </p>
                )}
                {!erro && !salvo && (
                  <p className="text-xs text-[#687770]">
                    Salve as alterações para aplicar suas preferências.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="w-full sm:w-auto bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {salvando ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#D4EC9D] border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Salvar alterações</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracoes;
