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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CColorPicker2 } from '@/components/reui/c-color-picker-2.jsx';
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, Upload01Icon } from '@hugeicons/core-free-icons';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ----------------------------------------------------------
// COMPONENTE: Menu Dropdown de Paletas com 5 Amostras de Cores
// ----------------------------------------------------------
const SeletorMenuPaletas = ({ paletaSelecionada, onSelecionarPaleta, identidade }) => {
  const [aberto, setAberto] = useState(false);
  const paletaAtiva = PALETAS_PREDEFINIDAS.find((p) => p.id === paletaSelecionada);

  // As 5 cores a exibir no trigger (da paleta pré-definida ou do estado customizado atual)
  const coresAtivas = paletaAtiva
    ? [
        paletaAtiva.cor_primaria,
        paletaAtiva.cor_secundaria,
        paletaAtiva.cor_acento,
        paletaAtiva.cor_roxo,
        paletaAtiva.cor_violeta,
      ]
    : [
        identidade.cor_primaria,
        identidade.cor_secundaria,
        identidade.cor_acento,
        identidade.cor_roxo,
        identidade.cor_violeta,
      ];

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full h-11 px-3.5 py-2 rounded-xl border border-surface-border bg-surface-subtle hover:bg-surface-hover hover:border-surface-border-strong text-ink-primary shadow-2xs transition-all focus:outline-none focus:border-brand-primary focus:bg-surface-card focus:ring-2 focus:ring-brand-accent/50 cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
            <span className="text-sm font-semibold text-ink-primary truncate">
              {paletaAtiva ? paletaAtiva.nome : 'Paleta Personalizada'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {/* 5 Amostras no Trigger */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface-muted/60 border border-surface-border/50">
              {coresAtivas.map((cor, idx) => (
                <span
                  key={idx}
                  className="w-4 h-4 rounded-md border border-black/15 shadow-2xs"
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
            <ChevronDown className={cn('w-4 h-4 text-ink-secondary opacity-70 transition-transform duration-200', aberto && 'rotate-180')} />
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[calc(100vw-2rem)] max-w-[460px] p-2 bg-surface-card border border-surface-border rounded-2xl shadow-xl z-[110]"
      >
        <div className="space-y-1">
          <div className="px-2.5 py-1 text-[11px] font-bold text-ink-secondary uppercase tracking-wider">
            Escolha uma paleta de 5 cores:
          </div>

          {PALETAS_PREDEFINIDAS.map((p) => {
            const ativa = paletaSelecionada === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelecionarPaleta(p.id);
                  setAberto(false);
                }}
                className={cn(
                  'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer group',
                  ativa
                    ? 'bg-brand-accent/40 text-brand-primary font-bold border border-brand-primary/20 shadow-2xs'
                    : 'hover:bg-surface-subtle text-ink-primary border border-transparent'
                )}
              >
                <div className="flex items-center gap-2 min-w-0 pr-3">
                  {ativa ? (
                    <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
                  ) : (
                    <span className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{p.nome}</span>
                </div>

                {/* 5 Amostras de cores dentro de cada item do menu */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.cor_primaria }}
                    title={`Primária: ${p.cor_primaria}`}
                  />
                  <span
                    className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.cor_secundaria }}
                    title={`Secundária: ${p.cor_secundaria}`}
                  />
                  <span
                    className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.cor_acento }}
                    title={`Acento: ${p.cor_acento}`}
                  />
                  <span
                    className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.cor_roxo }}
                    title={`Apoio 1: ${p.cor_roxo}`}
                  />
                  <span
                    className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: p.cor_violeta }}
                    title={`Apoio 2: ${p.cor_violeta}`}
                  />
                </div>
              </button>
            );
          })}

          {/* Opção Personalizada */}
          <button
            type="button"
            onClick={() => {
              onSelecionarPaleta('customizado');
              setAberto(false);
            }}
            className={cn(
              'flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left cursor-pointer group border-t border-surface-border mt-1.5 pt-2',
              paletaSelecionada === 'customizado'
                ? 'bg-brand-accent/40 text-brand-primary font-bold border border-brand-primary/20 shadow-2xs'
                : 'hover:bg-surface-subtle text-ink-primary border-transparent'
            )}
          >
            <div className="flex items-center gap-2 min-w-0 pr-3">
              {paletaSelecionada === 'customizado' ? (
                <Check className="w-4 h-4 text-brand-primary flex-shrink-0" />
              ) : (
                <span className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="truncate">Cores Customizadas (Manual)</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: identidade.cor_primaria }} />
              <span className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: identidade.cor_secundaria }} />
              <span className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: identidade.cor_acento }} />
              <span className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: identidade.cor_roxo }} />
              <span className="w-4 h-4 rounded-md border border-black/15 shadow-2xs group-hover:scale-110 transition-transform" style={{ backgroundColor: identidade.cor_violeta }} />
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

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
  const [paletaSelecionada, setPaletaSelecionada] = useState('azul-institucional');
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
        p.cor_acento.toLowerCase() === normalizada.cor_acento.toLowerCase() &&
        p.cor_roxo.toLowerCase() === (normalizada.cor_roxo || '').toLowerCase() &&
        p.cor_violeta.toLowerCase() === (normalizada.cor_violeta || '').toLowerCase()
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
        identidade_visual: { ...identidade, aplicar: true, versao_ds: 3 },
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
    setPaletaSelecionada('azul-institucional');
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
      {erro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro('')} className="text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Cards de Configuração: Logotipo à esquerda (desativado) e Paleta de Cores à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Card: Logotipo (Com aspecto de desativado) */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-5 sm:p-6 shadow-xs flex flex-col justify-between opacity-50 select-none pointer-events-none cursor-not-allowed relative">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-ink-primary">Logotipo</h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-ink-muted border border-surface-border">
                    Desativado
                  </span>
                </div>
                <p className="text-sm text-ink-secondary mt-0.5">
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
                      className="w-full h-full object-contain grayscale"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <HugeiconsIcon icon={Image01Icon} size={32} strokeWidth={1.8} className="text-ink-muted" />
                  )}
                </div>
              </div>

              {/* Controles de URL e Upload */}
              <div className="flex-1 w-full space-y-3">
                <div>
                  <label
                    htmlFor="identidade-logo-url"
                    className="block text-sm font-semibold text-ink-secondary mb-1.5"
                  >
                    URL da Imagem do Logotipo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="identidade-logo-url"
                      type="url"
                      disabled
                      value={inputUrl}
                      placeholder="https://exemplo.com/logo.png"
                      className="flex-1 min-w-0 bg-surface-subtle border border-surface-border text-ink-muted rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed shadow-2xs"
                    />
                    <button
                      type="button"
                      disabled
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-surface-muted text-ink-muted cursor-not-allowed shadow-xs flex items-center justify-center flex-shrink-0"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Opção de anexar arquivo */}
                <div className="pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled
                    className="px-3.5 py-2 rounded-xl text-sm font-bold border border-surface-border bg-surface-subtle text-ink-muted cursor-not-allowed flex items-center gap-2 shadow-2xs"
                  >
                    <HugeiconsIcon icon={Upload01Icon} size={16} strokeWidth={1.8} className="text-ink-muted" />
                    <span>Anexar Arquivo</span>
                  </button>
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
                <p className="text-sm text-ink-secondary mt-0.5">
                  Configure as cores institucionais para botões, fundos e contrastes.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {/* 1. Paletas Pré-definidas */}
              <div>
                <label className="block text-sm font-semibold text-ink-primary mb-2">
                  Paletas Pré-definidas
                </label>
                <SeletorMenuPaletas
                  paletaSelecionada={paletaSelecionada}
                  identidade={identidade}
                  onSelecionarPaleta={(id) => {
                    setPaletaSelecionada(id);
                    const paleta = PALETAS_PREDEFINIDAS.find((p) => p.id === id);
                    if (paleta) {
                      setIdentidade((prev) => ({
                        ...prev,
                        cor_primaria: paleta.cor_primaria,
                        cor_secundaria: paleta.cor_secundaria,
                        cor_acento: paleta.cor_acento,
                        cor_roxo: paleta.cor_roxo,
                        cor_violeta: paleta.cor_violeta,
                      }));
                    }
                  }}
                />
              </div>

              {/* 2. Crie o seu estilo: 5 Seletores ReUI c-color-picker-2 */}
              <div>
                <p className="text-sm font-semibold text-ink-primary mb-2.5">
                  Crie o seu estilo:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <CColorPicker2
                    id="picker-cor-primaria"
                    label="Cor Primária"
                    value={identidade.cor_primaria}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_primaria: v }));
                    }}
                    description="Botões e destaque principal"
                  />
                  <CColorPicker2
                    id="picker-cor-secundaria"
                    label="Cor Secundária"
                    value={identidade.cor_secundaria}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_secundaria: v }));
                    }}
                    description="Barra lateral e superfícies"
                  />
                  <CColorPicker2
                    id="picker-cor-acento"
                    label="Cor de Acento"
                    value={identidade.cor_acento}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_acento: v }));
                    }}
                    description="Realces, contraste e badges"
                  />
                  <CColorPicker2
                    id="picker-cor-roxo"
                    label="Cor de Apoio 1"
                    value={identidade.cor_roxo}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_roxo: v }));
                    }}
                    description="Gradientes e gráficos"
                  />
                  <CColorPicker2
                    id="picker-cor-violeta"
                    label="Cor de Apoio 2"
                    value={identidade.cor_violeta}
                    onChange={(v) => {
                      setPaletaSelecionada('customizado');
                      setIdentidade((prev) => ({ ...prev, cor_violeta: v }));
                    }}
                    description="Gradientes e estados ativos"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de Ação: Restaurar Padrão e Salvar Alterações (Abaixo dos Cards) */}
      <PermissaoGuarda permissao="configuracoes.editar">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div>
            {salvo && (
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 animate-fade-in flex items-center gap-1">
                ✓ Salvo com sucesso!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              onClick={restaurarPadrao}
              className="px-4 py-2 rounded-xl text-sm font-bold border border-surface-border text-ink-secondary hover:text-ink-primary hover:bg-surface-subtle transition-colors cursor-pointer"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-brand-primary hover:bg-brand-primary-hover text-brand-accent transition-colors shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </PermissaoGuarda>
    </div>
  );
};

export default IdentidadeVisual;
