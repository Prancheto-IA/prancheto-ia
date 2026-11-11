// =============================================================
// PRANCHETO.IA - IDENTIDADE VISUAL DA ORGANIZAÇÃO
// Permite editar logo e cores da organização.
// Salvo por organização com sincronização em tempo real.
// =============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOrg } from '../../../hooks/useOrg.js';
import { useAuthStore } from '../../../store/authStore.js';
import { useTenantStore } from '../../../store/tenantStore.js';
import {
  IDENTIDADE_PADRAO,
  PALETAS_PREDEFINIDAS,
  normalizarIdentidade,
} from '../../../utils/identidadeVisual.js';
import PermissaoGuarda from '../../../components/ui/PermissaoGuarda.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, Upload01Icon } from '@hugeicons/core-free-icons';

// ----------------------------------------------------------
// COMPONENTE: Botão com Color Picker
// ----------------------------------------------------------
const BotaoColorPicker = ({ label, valor, onChange }) => (
  <label className="flex-1 min-w-[120px] flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover hover:border-surface-border-strong transition-all cursor-pointer group shadow-2xs relative">
    <div className="flex flex-col min-w-0 pr-2">
      <span className="text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">{label}</span>
      <span className="text-xs font-mono font-bold text-ink-primary truncate mt-0.5">{valor}</span>
    </div>
    <div
      className="w-7 h-7 rounded-lg border-2 border-white shadow-xs flex-shrink-0 group-hover:scale-110 transition-transform"
      style={{ backgroundColor: valor }}
    />
    <input
      type="color"
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="sr-only"
    />
  </label>
);

// ----------------------------------------------------------
// COMPONENTE PRINCIPAL: IDENTIDADE VISUAL
// ----------------------------------------------------------
const IdentidadeVisual = () => {
  const tenantId = useAuthStore((s) => s.usuario?.tenant_id);
  const { atualizarIdentidadeVisual } = useOrg();

  const tenant          = useTenantStore((s) => s.tenant);
  const carregandoOrg   = useTenantStore((s) => s.carregando);
  const carregarTenant  = useTenantStore((s) => s.carregar);
  const definirTenant   = useTenantStore((s) => s.definir);

  const [identidade, setIdentidade]         = useState(IDENTIDADE_PADRAO);
  const [paletaSelecionada, setPaletaSelecionada] = useState('verde-institucional');
  const [logoUrl, setLogoUrl]               = useState('');
  const [inputUrl, setInputUrl]             = useState('');
  const [nomeArquivo, setNomeArquivo]       = useState('');
  const fileInputRef                        = useRef(null);
  const [salvando, setSalvando]             = useState(false);
  const [salvo, setSalvo]                   = useState(false);
  const [erro, setErro]                     = useState('');

  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

  useEffect(() => {
    if (!tenant) return;
    const normalizada = normalizarIdentidade(tenant.identidade_visual);
    setIdentidade(normalizada);
    const urlAtual = tenant.logo_url || '';
    setLogoUrl(urlAtual);
    setInputUrl(urlAtual);

    const encontrada = PALETAS_PREDEFINIDAS.find(
      (p) =>
        p.cor_primaria.toLowerCase() === normalizada.cor_primaria.toLowerCase() &&
        p.cor_secundaria.toLowerCase() === normalizada.cor_secundaria.toLowerCase() &&
        p.cor_acento.toLowerCase() === normalizada.cor_acento.toLowerCase()
    );
    setPaletaSelecionada(encontrada ? encontrada.id : 'customizado');
  }, [tenant]);

  const aplicarUrl = () => {
    setLogoUrl(inputUrl.trim());
    setNomeArquivo('');
  };

  const handleArquivoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErro('O arquivo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setLogoUrl(dataUrl);
      setInputUrl('');
      setNomeArquivo(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removerLogo = () => {
    setLogoUrl('');
    setInputUrl('');
    setNomeArquivo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const salvar = useCallback(async () => {
    setSalvando(true);
    setErro('');
    try {
      const atualizado = await atualizarIdentidadeVisual({
        logo_url:          logoUrl.trim() || null,
        identidade_visual: { ...identidade, aplicar: true, versao_ds: 2 },
      });
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
    setInputUrl('');
    setNomeArquivo('');
    setPaletaSelecionada('verde-institucional');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!tenant && carregandoOrg) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-ink-primary">
            Identidade Visual da Organização
          </h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Personalize logotipo e paleta de cores para adequar a plataforma à sua marca.
          </p>
        </div>

        <PermissaoGuarda permissao="configuracoes.editar">
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {salvo && (
              <span className="text-xs font-bold text-emerald-700 animate-fade-in flex items-center gap-1">
                ✓ Salvo com sucesso!
              </span>
            )}
            <button
              onClick={restaurarPadrao}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary-hover text-brand-accent transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </PermissaoGuarda>
      </div>

      {erro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Cards de Configuração: Logotipo à esquerda e Paleta de Cores à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Card: Logotipo */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h2 className="text-base font-bold text-ink-primary">Logotipo</h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Exibido na barra de navegação e em relatórios compartilhados.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mt-5">
              {/* Preview do Logotipo */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-subtle border border-surface-border flex items-center justify-center p-2 flex-shrink-0 shadow-2xs overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <HugeiconsIcon icon={Image01Icon} size={32} strokeWidth={1.8} className="text-brand-primary" />
                  )}
                </div>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={removerLogo}
                    className="text-[11px] font-semibold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                  >
                    Remover
                  </button>
                )}
              </div>

              {/* Controles de URL e Upload */}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <label
                    htmlFor="identidade-logo-url"
                    className="block text-xs font-semibold text-ink-secondary mb-1.5"
                  >
                    URL da Imagem do Logotipo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="identidade-logo-url"
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') aplicarUrl(); }}
                      placeholder="https://exemplo.com/logo.png"
                      className="flex-1 min-w-0 bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={aplicarUrl}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-primary hover:bg-brand-primary-hover text-brand-accent transition-colors shadow-xs flex items-center justify-center cursor-pointer flex-shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Opção de anexar arquivo */}
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleArquivoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-surface-border bg-surface-subtle hover:bg-surface-hover text-ink-primary transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <HugeiconsIcon icon={Upload01Icon} size={16} strokeWidth={1.8} className="text-brand-primary" />
                    <span>Anexar Arquivo</span>
                  </button>
                  {nomeArquivo && (
                    <span className="text-xs text-brand-primary font-medium bg-surface-muted px-2.5 py-1 rounded-lg truncate max-w-[180px]" title={nomeArquivo}>
                      {nomeArquivo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-ink-secondary mt-4 pt-3 border-t border-surface-border">
            Formatos recomendados: PNG ou SVG com fundo transparente (resolução mínima 128x128px, até 2MB).
          </p>
        </div>

        {/* Card: Paleta de Cores (Lado Direito) */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <h2 className="text-base font-bold text-ink-primary">Paleta de Cores</h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Configure as cores institucionais para botões, fundos e contrastes.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* 1. Paletas Pré-definidas */}
              <div>
                <label
                  htmlFor="seletor-paletas-predefinidas"
                  className="block text-xs font-semibold text-ink-primary mb-2"
                >
                  Paletas Pré-definidas
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <select
                      id="seletor-paletas-predefinidas"
                      value={paletaSelecionada}
                      onChange={(e) => {
                        const id = e.target.value;
                        setPaletaSelecionada(id);
                        const paleta = PALETAS_PREDEFINIDAS.find((p) => p.id === id);
                        if (paleta) {
                          setIdentidade((prev) => ({
                            ...prev,
                            cor_primaria: paleta.cor_primaria,
                            cor_secundaria: paleta.cor_secundaria,
                            cor_acento: paleta.cor_acento,
                          }));
                        }
                      }}
                      className="w-full bg-surface-subtle border border-surface-border text-ink-primary rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-brand-primary focus:bg-surface-card transition-all shadow-2xs cursor-pointer appearance-none pr-9 font-medium"
                    >
                      <option value="" disabled>Selecione uma paleta...</option>
                      {PALETAS_PREDEFINIDAS.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                      <option value="customizado">Personalizada</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-secondary text-[10px]">
                      ▼
                    </div>
                  </div>

                  {/* Amostra rápida das 3 cores da paleta ativa */}
                  <div className="flex items-center p-2 rounded-xl bg-surface-subtle border border-surface-border gap-1.5 shadow-2xs flex-shrink-0" title="Amostra da paleta ativa">
                    <span className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: identidade.cor_primaria }} />
                    <span className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: identidade.cor_secundaria }} />
                    <span className="w-5 h-5 rounded-lg border border-black/10 shadow-2xs" style={{ backgroundColor: identidade.cor_acento }} />
                  </div>
                </div>
              </div>

              {/* 2. Crie o seu estilo: */}
              <div>
                <p className="text-xs font-semibold text-ink-primary mb-2">
                  Crie o seu estilo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <BotaoColorPicker
                    label="Cor Primária"
                    valor={identidade.cor_primaria}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_primaria: v }));
                    }}
                  />
                  <BotaoColorPicker
                    label="Cor Secundária"
                    valor={identidade.cor_secundaria}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_secundaria: v }));
                    }}
                  />
                  <BotaoColorPicker
                    label="Cor de Acento"
                    valor={identidade.cor_acento}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_acento: v }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentidadeVisual;
