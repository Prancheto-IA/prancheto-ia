// =============================================================
// PRANCHETO.IA - IDENTIDADE VISUAL DA ORGANIZAÇÃO
// Permite editar logo, cores e fonte da organização.
// Acessível via /dashboard/organizacao/identidade
// =============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { useAuthStore } from '../../../store/authStore.js';

// ----------------------------------------------------------
// CONSTANTES
// ----------------------------------------------------------
const FONTES_DISPONIVEIS = [
  { label: 'Inter (padrão)', valor: 'Inter' },
  { label: 'Roboto',         valor: 'Roboto' },
  { label: 'Poppins',        valor: 'Poppins' },
  { label: 'Nunito',         valor: 'Nunito' },
  { label: 'Open Sans',      valor: 'Open Sans' },
];

const COR_PADRAO = {
  cor_primaria:   '#1e3a5f',
  cor_secundaria: '#000000',
  cor_acento:     '#ffffff',
  fonte:          'Inter',
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
// COMPONENTE: Preview da identidade visual
// ----------------------------------------------------------
const PreviewIdentidade = ({ tenant, identidade }) => {
  const { cor_primaria, cor_secundaria, cor_acento, fonte } = identidade;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--color-surface-border)' }}
    >
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

      {/* Conteúdo do preview */}
      <div style={{ backgroundColor: cor_secundaria, fontFamily: fonte }}>
        {/* Barra de navegação simulada */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: cor_primaria }}
        >
          {tenant?.logo_url ? (
            <img src={tenant.logo_url} alt="Logo" className="h-6 w-auto object-contain" />
          ) : (
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: cor_acento, color: cor_primaria }}
            >
              {tenant?.nome?.[0]?.toUpperCase() || 'P'}
            </div>
          )}
          <span className="text-sm font-bold" style={{ color: cor_acento, fontFamily: fonte }}>
            {tenant?.nome || 'Minha Organização'}
          </span>
        </div>

        {/* Conteúdo simulado */}
        <div className="p-4 space-y-3">
          <div
            className="h-2 rounded-full w-3/4"
            style={{ backgroundColor: `${cor_primaria}40` }}
          />
          <div
            className="h-2 rounded-full w-1/2"
            style={{ backgroundColor: `${cor_primaria}25` }}
          />
          <div className="flex gap-2 mt-3">
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: cor_primaria, color: cor_acento, fontFamily: fonte }}
            >
              Botão primário
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{ borderColor: cor_primaria, color: cor_primaria, fontFamily: fonte }}
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
  const { usuario } = useAuthStore();
  const { buscarTenant, atualizarIdentidadeVisual } = useOrg();

  const [tenant, setTenant]         = useState(null);
  const [identidade, setIdentidade] = useState(COR_PADRAO);
  const [logoUrl, setLogoUrl]       = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [salvo, setSalvo]           = useState(false);
  const [erro, setErro]             = useState('');

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const data = await buscarTenant();
      if (data) {
        setTenant(data);
        setLogoUrl(data.logo_url || '');
        setIdentidade({
          cor_primaria:   data.identidade_visual?.cor_primaria   || COR_PADRAO.cor_primaria,
          cor_secundaria: data.identidade_visual?.cor_secundaria || COR_PADRAO.cor_secundaria,
          cor_acento:     data.identidade_visual?.cor_acento     || COR_PADRAO.cor_acento,
          fonte:          data.identidade_visual?.fonte          || COR_PADRAO.fonte,
        });
      }
    } catch (err) {
      setErro('Erro ao carregar dados da organização.');
    } finally {
      setCarregando(false);
    }
  }, [buscarTenant]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      await atualizarIdentidadeVisual({
        logo_url:          logoUrl || null,
        identidade_visual: identidade,
      });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
      await carregar();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar identidade visual.');
    } finally {
      setSalvando(false);
    }
  };

  const restaurarPadrao = () => {
    setIdentidade(COR_PADRAO);
    setLogoUrl('');
  };

  if (carregando) {
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
                URL pública da imagem do logo (PNG, SVG recomendado).
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
                      alt="Logo preview"
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

              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                URL do logo
              </label>
              <input
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
                descricao="Cor principal da marca (barras, botões, destaques)."
                valor={identidade.cor_primaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_primaria: v }))}
              />
              <SeletorCor
                label="Cor secundária"
                descricao="Cor de fundo e superfícies."
                valor={identidade.cor_secundaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_secundaria: v }))}
              />
              <SeletorCor
                label="Cor de acento"
                descricao="Cor de texto sobre a cor primária."
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
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Fonte principal
              </label>
              <select
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

        {/* Coluna direita: preview */}
        <div className="space-y-4">
          <PreviewIdentidade
            tenant={{ ...tenant, logo_url: logoUrl }}
            identidade={identidade}
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
                'Alterações entram em vigor após salvar.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="text-primary-400 flex-shrink-0 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={salvar}
          disabled={salvando}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-primary-600 hover:bg-primary-500 text-white transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar identidade visual'}
        </button>
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
