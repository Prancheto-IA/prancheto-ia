// =============================================================
// PRANCHETO.IA - IDENTIDADE VISUAL DA ORGANIZAÇÃO
// Permite editar logo, cores e fonte da organização.
// Acessível via /dashboard/organizacao/identidade
//
// O que é salvo aqui vale para a interface de todos os membros, mas
// somente com a chave "Aplicar na interface" ligada — ver
// utils/identidadeVisual.js para o porquê e para onde cada cor vai.
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useTenantStore } from '../../../store/tenantStore.js';
import {
  FONTES_DISPONIVEIS,
  IDENTIDADE_PADRAO,
  gerarRampaPrimaria,
  normalizarIdentidade,
} from '../../../utils/identidadeVisual.js';
import PermissaoGuarda from '../../../components/ui/PermissaoGuarda.jsx';

/** Tom claro da primária, como o usado nos itens ativos da navegação real. */
const tomClaro = (hex) => {
  const rampa = gerarRampaPrimaria(hex);
  return rampa ? `rgb(${rampa[300]})` : hex;
};

// ----------------------------------------------------------
// COMPONENTE: Seletor de cor
// ----------------------------------------------------------
const SeletorCor = ({ label, descricao, valor, onChange }) => (
  <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
      {descricao && (
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{descricao}</p>
      )}
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
        {valor}
      </span>
      <label className="relative cursor-pointer">
        <span className="sr-only">{label}</span>
        <input
          type="color"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <div
          className="w-8 h-8 rounded-lg border-2 border-white/20 cursor-pointer hover:scale-110 transition-transform shadow-md"
          style={{ backgroundColor: valor }}
        />
      </label>
    </div>
  </div>
);

// ----------------------------------------------------------
// COMPONENTE: Chave de ativação
// ----------------------------------------------------------
const ChaveAplicar = ({ ativo, onChange }) => (
  <div
    className="rounded-xl p-4 flex items-start justify-between gap-4"
    style={{
      backgroundColor: 'var(--color-surface-card)',
      border: `1px solid ${ativo ? 'rgb(var(--color-primary-500) / 0.4)' : 'var(--color-surface-border)'}`,
    }}
  >
    <div className="min-w-0">
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
        Aplicar na interface
      </p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
        {ativo
          ? 'A interface usa as cores, a fonte e o logo da sua organização.'
          : 'A interface usa as cores padrão do Prancheto.IA. Ligue para usar as suas.'}
      </p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label="Aplicar a identidade visual na interface"
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
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
// COMPONENTE: Preview da identidade visual
// Reproduz onde cada cor realmente cai: secundária no fundo da barra
// lateral, acento no texto sobre ela, primária nos destaques do conteúdo.
// ----------------------------------------------------------
const PreviewIdentidade = ({ nomeOrganizacao, logoUrl, identidade }) => {
  const { cor_primaria, cor_secundaria, cor_acento, fonte } = identidade;

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-surface-border)' }}>
      {/* Header do preview */}
      <div
        className="px-4 py-2 text-xs font-medium"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-surface-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Preview
      </div>

      <div className="flex" style={{ fontFamily: fonte, minHeight: '190px' }}>
        {/* Barra lateral simulada */}
        <div className="w-32 flex-shrink-0 p-2.5 space-y-2" style={{ backgroundColor: cor_secundaria }}>
          <div className="flex items-center gap-1.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
            ) : (
              <span className="text-sm">🧠</span>
            )}
            <span className="text-xs font-bold truncate" style={{ color: cor_acento }}>
              {nomeOrganizacao || 'Organização'}
            </span>
          </div>

          <div
            className="px-2 py-1.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: `${cor_primaria}26`,
              color: tomClaro(cor_primaria),
            }}
          >
            Início
          </div>
          {['CRM', 'Agenda'].map((item) => (
            <div key={item} className="px-2 py-1.5 rounded-md text-xs" style={{ color: `${cor_acento}99` }}>
              {item}
            </div>
          ))}
        </div>

        {/* Conteúdo simulado */}
        <div className="flex-1 p-4 space-y-3" style={{ backgroundColor: 'var(--color-surface)' }}>
          <div className="h-2 rounded-full w-3/4" style={{ backgroundColor: `${cor_primaria}40` }} />
          <div className="h-2 rounded-full w-1/2" style={{ backgroundColor: `${cor_primaria}25` }} />
          <div className="flex gap-2 pt-1">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: cor_primaria, color: cor_acento }}
            >
              Botão primário
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: cor_primaria, color: cor_primaria }}
            >
              Secundário
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------
// PÁGINA PRINCIPAL: IDENTIDADE VISUAL
// ----------------------------------------------------------
const IdentidadeVisual = () => {
  const tenantId = useAuthStore((s) => s.usuario?.tenant_id);
  const { atualizarIdentidadeVisual } = useOrg();

  const tenant          = useTenantStore((s) => s.tenant);
  const carregandoOrg   = useTenantStore((s) => s.carregando);
  const carregarTenant  = useTenantStore((s) => s.carregar);
  const definirTenant   = useTenantStore((s) => s.definir);

  const [identidade, setIdentidade] = useState(IDENTIDADE_PADRAO);
  const [logoUrl, setLogoUrl]       = useState('');
  const [salvando, setSalvando]     = useState(false);
  const [salvo, setSalvo]           = useState(false);
  const [erro, setErro]             = useState('');

  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  // Sincroniza o formulário com o que está salvo, inclusive após gravar.
  useEffect(() => {
    if (!tenant) return;
    setIdentidade(normalizarIdentidade(tenant.identidade_visual));
    setLogoUrl(tenant.logo_url || '');
  }, [tenant]);

  const salvar = useCallback(async () => {
    setSalvando(true);
    setErro('');
    try {
      const atualizado = await atualizarIdentidadeVisual({
        logo_url:          logoUrl.trim() || null,
        identidade_visual: identidade,
      });
      // Alimenta o store: as cores novas passam a valer na hora, sem recarregar.
      definirTenant(atualizado);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (err) {
      setErro(err.message || 'Erro ao salvar identidade visual.');
    } finally {
      setSalvando(false);
    }
  }, [atualizarIdentidadeVisual, definirTenant, identidade, logoUrl]);

  const restaurarPadrao = () => {
    setIdentidade(IDENTIDADE_PADRAO);
    setLogoUrl('');
  };

  if (!tenant && carregandoOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inputStyle = {
    backgroundColor: 'var(--color-surface)',
    border: '1px solid var(--color-surface-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          🎨 Identidade Visual
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Personalize as cores, logo e tipografia da sua organização.
        </p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Coluna esquerda: formulário */}
        <div className="space-y-4">

          {/* Logo */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Logo</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Aparece na barra lateral, no lugar do ícone padrão.
              </p>
            </div>
            <div className="p-5">
              {/* Preview do logo */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-surface-border)' }}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo da organização"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-2xl">🏢</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {tenant?.nome || 'Organização'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {logoUrl ? 'Logo personalizado' : 'Sem logo (usando ícone padrão)'}
                  </p>
                </div>
              </div>

              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
                htmlFor="identidade-logo-url"
              >
                URL do logo
              </label>
              <input
                id="identidade-logo-url"
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                style={inputStyle}
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                💡 Dica: use o Supabase Storage para hospedar sua imagem.
              </p>
            </div>
          </div>

          {/* Cores */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Cores</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                Paleta de cores da organização.
              </p>
            </div>
            <div className="px-5 py-2">
              <SeletorCor
                label="Cor primária"
                descricao="Botões, itens ativos, destaques e badges em toda a interface."
                valor={identidade.cor_primaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_primaria: v }))}
              />
              <SeletorCor
                label="Cor secundária"
                descricao="Fundo da barra lateral. Use um tom escuro."
                valor={identidade.cor_secundaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_secundaria: v }))}
              />
              <SeletorCor
                label="Cor de acento"
                descricao="Texto e logo sobre a barra lateral e sobre a cor primária."
                valor={identidade.cor_acento}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_acento: v }))}
              />
            </div>
          </div>

          {/* Tipografia */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
          >
            <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--color-surface-border)' }}>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Tipografia</h3>
            </div>
            <div className="p-5">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
                htmlFor="identidade-fonte"
              >
                Fonte principal
              </label>
              <select
                id="identidade-fonte"
                value={identidade.fonte}
                onChange={(e) => setIdentidade(i => ({ ...i, fonte: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                style={inputStyle}
              >
                {FONTES_DISPONIVEIS.map((f) => (
                  <option key={f.valor} value={f.valor}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Coluna direita: preview e ativação */}
        <div className="space-y-4">
          <PreviewIdentidade
            nomeOrganizacao={tenant?.nome}
            logoUrl={logoUrl}
            identidade={identidade}
          />

          <ChaveAplicar
            ativo={identidade.aplicar}
            onChange={(v) => setIdentidade(i => ({ ...i, aplicar: v }))}
          />

          {/* Info */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-surface-border)' }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              ℹ️ Sobre a identidade visual
            </p>
            <ul className="space-y-1.5">
              {[
                'As cores são salvas por organização e visíveis para todos os membros.',
                'O preview mostra uma simulação de como ficará a interface.',
                'Alterações entram em vigor após salvar, com a chave ligada.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="text-primary-400 flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Botões de ação — sem permissão, a tela vira somente leitura */}
      <div className="flex items-center gap-3 mt-6">
        <PermissaoGuarda
          permissao="configuracoes.editar"
          fallback={
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Você pode visualizar a identidade visual, mas não alterá-la.
            </p>
          }
        >
          <button
            onClick={salvar}
            disabled={salvando}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar identidade visual'}
          </button>
        </PermissaoGuarda>
        <PermissaoGuarda permissao="configuracoes.editar">
          <button
            onClick={restaurarPadrao}
            className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-card)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-surface-border)',
            }}
          >
            Restaurar padrão
          </button>
        </PermissaoGuarda>
        {salvo && (
          <span className="text-emerald-400 text-sm flex items-center gap-1">
            ✓ Salvo com sucesso!
          </span>
        )}
      </div>
    </div>
  );
};

export default IdentidadeVisual;
