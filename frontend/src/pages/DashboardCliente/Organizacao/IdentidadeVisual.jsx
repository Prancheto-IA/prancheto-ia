// =============================================================
// PRANCHETO.IA - IDENTIDADE VISUAL DA ORGANIZAÇÃO
// Permite editar logo, cores e fonte da organização em layout multi-coluna.
// Salvo por organização com sincronização em tempo real.
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
import { HugeiconsIcon } from '@hugeicons/react';
import { Image01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';

/** Tom claro da primária, como o usado nos itens ativos da navegação real. */
const tomClaro = (hex) => {
  const rampa = gerarRampaPrimaria(hex);
  return rampa ? `rgb(${rampa[300]})` : hex;
};

// ----------------------------------------------------------
// COMPONENTE: Seletor de cor Emitly
// ----------------------------------------------------------
const SeletorCor = ({ label, descricao, valor, onChange }) => (
  <div className="flex items-center justify-between py-3.5 border-b border-[#E4ECE7] last:border-0">
    <div className="flex-1 min-w-0 mr-4">
      <p className="text-xs sm:text-sm font-bold text-[#111915]">{label}</p>
      {descricao && (
        <p className="text-[11px] sm:text-xs text-[#687770] mt-0.5 leading-snug">{descricao}</p>
      )}
    </div>
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <span className="text-xs font-mono font-semibold px-2 py-1 rounded-md bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915]">
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
          className="w-8 h-8 rounded-xl border-2 border-white shadow-xs cursor-pointer hover:scale-110 transition-transform"
          style={{ backgroundColor: valor }}
        />
      </label>
    </div>
  </div>
);

// ----------------------------------------------------------
// COMPONENTE: Live Preview da Interface
// ----------------------------------------------------------
const PreviewIdentidade = ({ nomeOrganizacao, logoUrl, identidade }) => {
  const { cor_primaria, cor_secundaria, cor_acento, fonte } = identidade;

  return (
    <div className="bg-white rounded-2xl border border-[#E4ECE7] overflow-hidden shadow-xs">
      <div className="px-5 py-3 border-b border-[#E4ECE7] bg-[#F7FAF8] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#687770]">
          Simulação em Tempo Real
        </span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#E4ECE7] text-[#0E382C]">
          Preview
        </span>
      </div>

      <div className="flex" style={{ fontFamily: fonte, minHeight: '210px' }}>
        {/* Barra lateral simulada */}
        <div className="w-36 flex-shrink-0 p-3 space-y-2 border-r border-[#E4ECE7]" style={{ backgroundColor: cor_secundaria }}>
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-6 w-6 rounded-lg object-contain bg-white/10 p-0.5" />
            ) : (
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: cor_primaria, color: cor_acento }}>
                P
              </div>
            )}
            <span className="text-xs font-bold truncate" style={{ color: cor_acento }}>
              {nomeOrganizacao || 'Organização'}
            </span>
          </div>

          <div
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            style={{
              backgroundColor: cor_primaria,
              color: cor_acento,
            }}
          >
            <span>Início</span>
          </div>

          {['CRM', 'Agenda', 'Projetos'].map((item) => (
            <div key={item} className="px-2.5 py-1.5 rounded-lg text-xs opacity-70" style={{ color: cor_acento }}>
              {item}
            </div>
          ))}
        </div>

        {/* Conteúdo simulado */}
        <div className="flex-1 p-4 bg-[#F7FAF8] flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: `${cor_primaria}50` }} />
            <div className="h-2 rounded-full w-1/3 bg-slate-200" />
            <div className="p-2.5 rounded-xl bg-white border border-[#E4ECE7] shadow-2xs mt-3">
              <p className="text-[11px] font-bold text-[#111915]">Card de Demonstração</p>
              <p className="text-[10px] text-[#687770]">Exemplo de aplicação das cores e tipografia da marca.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
              style={{ backgroundColor: cor_primaria, color: cor_acento }}
            >
              Ação Principal
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E4ECE7] text-[#111915]"
            >
              Secundário
            </button>
          </div>
        </div>
      </div>
    </div>
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

  const [identidade, setIdentidade] = useState(IDENTIDADE_PADRAO);
  const [logoUrl, setLogoUrl]       = useState('');
  const [salvando, setSalvando]     = useState(false);
  const [salvo, setSalvo]           = useState(false);
  const [erro, setErro]             = useState('');

  useEffect(() => { carregarTenant(tenantId); }, [tenantId, carregarTenant]);

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
        <div className="w-8 h-8 border-2 border-[#0E382C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111915]">
            Identidade Visual da Organização
          </h1>
          <p className="text-xs sm:text-sm text-[#687770] mt-0.5">
            Personalize logotipo, paleta cromática e tipografia para adequar a plataforma à sua marca.
          </p>
        </div>

        <PermissaoGuarda permissao="configuracoes.editar">
          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={restaurarPadrao}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-[#E4ECE7] text-[#687770] hover:text-[#111915] hover:bg-[#F7FAF8] transition-colors cursor-pointer"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={salvar}
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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

      {/* Grid Responsivo de Múltiplas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUNA ESQUERDA (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Card: Logotipo */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4ECE7]">
              <div>
                <h2 className="text-base font-bold text-[#111915]">Logotipo</h2>
                <p className="text-xs text-[#687770] mt-0.5">
                  Exibido na barra de navegação e em relatórios compartilhados.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 mt-5">
              <div className="w-20 h-20 rounded-2xl bg-[#F7FAF8] border border-[#E4ECE7] flex items-center justify-center p-2 flex-shrink-0 shadow-2xs">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <HugeiconsIcon icon={Image01Icon} size={32} strokeWidth={1.8} className="text-[#0E382C]" />
                )}
              </div>

              <div className="flex-1 w-full">
                <label
                  htmlFor="identidade-logo-url"
                  className="block text-xs font-semibold text-[#687770] mb-1.5"
                >
                  URL da Imagem do Logotipo
                </label>
                <input
                  id="identidade-logo-url"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs"
                />
                <p className="text-[11px] text-[#687770] mt-1.5">
                  Formatos recomendados: PNG ou SVG com fundo transparente (resolução mínima 128x128px).
                </p>
              </div>
            </div>
          </div>

          {/* Card: Cores da Marca */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4ECE7]">
              <div>
                <h2 className="text-base font-bold text-[#111915]">Paleta de Cores</h2>
                <p className="text-xs text-[#687770] mt-0.5">
                  Configure as cores institucionais para botões, fundos e contrastes.
                </p>
              </div>
            </div>

            <div className="mt-2 divide-y divide-[#E4ECE7]">
              <SeletorCor
                label="Cor Primária"
                descricao="Botões principais, badges de destaque e navegação ativa."
                valor={identidade.cor_primaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_primaria: v }))}
              />
              <SeletorCor
                label="Cor Secundária"
                descricao="Fundo da barra lateral esquerda e menus estruturais."
                valor={identidade.cor_secundaria}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_secundaria: v }))}
              />
              <SeletorCor
                label="Cor de Acento"
                descricao="Tipografia e ícones de contraste sobre as cores primária e secundária."
                valor={identidade.cor_acento}
                onChange={(v) => setIdentidade(i => ({ ...i, cor_acento: v }))}
              />
            </div>
          </div>

          {/* Card: Tipografia */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4ECE7]">
              <div>
                <h2 className="text-base font-bold text-[#111915]">Tipografia</h2>
                <p className="text-xs text-[#687770] mt-0.5">
                  Fonte tipográfica aplicada aos títulos e textos da aplicação.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="identidade-fonte"
                  className="block text-xs font-semibold text-[#687770] mb-1.5"
                >
                  Família Tipográfica Principal
                </label>
                <select
                  id="identidade-fonte"
                  value={identidade.fonte}
                  onChange={(e) => setIdentidade(i => ({ ...i, fonte: e.target.value }))}
                  className="w-full bg-[#F7FAF8] border border-[#E4ECE7] text-[#111915] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#0E382C] focus:bg-white transition-all shadow-2xs cursor-pointer"
                >
                  {FONTES_DISPONIVEIS.map((f) => (
                    <option key={f.valor} value={f.valor}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 rounded-xl bg-[#F7FAF8] border border-[#E4ECE7]">
                <p className="text-[11px] font-semibold text-[#687770] mb-1">Amostra da Fonte:</p>
                <p className="text-base font-bold text-[#111915]" style={{ fontFamily: identidade.fonte }}>
                  O Prancheto.IA simplifica a gestão da sua equipe.
                </p>
                <p className="text-xs text-[#687770] mt-1" style={{ fontFamily: identidade.fonte }}>
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 1234567890
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          {/* Card de Preview Interativo */}
          <PreviewIdentidade
            nomeOrganizacao={tenant?.nome}
            logoUrl={logoUrl}
            identidade={identidade}
          />

          {/* Card: Chave de Aplicação */}
          <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#111915]">
                  Aplicar na Interface
                </h3>
                <p className="text-xs text-[#687770] mt-0.5">
                  {identidade.aplicar
                    ? 'A interface usará as cores, fonte e logo da sua organização.'
                    : 'A interface usará as cores padrão do sistema.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={identidade.aplicar}
                aria-label="Aplicar identidade visual"
                onClick={() => setIdentidade(i => ({ ...i, aplicar: !i.aplicar }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                  identidade.aplicar ? 'bg-[#0E382C]' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    identidade.aplicar ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Card: Informações Institucionais */}
          <div className="bg-[#F7FAF8] border border-[#E4ECE7] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <HugeiconsIcon icon={InformationCircleIcon} size={16} strokeWidth={1.8} className="text-[#0E382C]" />
              <h3 className="text-xs font-bold text-[#111915]">Diretrizes de Marca</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-[#687770]">
              <li className="flex items-start gap-1.5">
                <span className="text-[#0E382C] font-bold">•</span>
                <span>As personalizações salvas são visíveis para todos os membros da sua organização.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#0E382C] font-bold">•</span>
                <span>Certifique-se de que a cor de acento possua alto contraste com as cores de fundo.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#0E382C] font-bold">•</span>
                <span>Desative a chave caso deseje retornar temporariamente ao visual nativo.</span>
              </li>
            </ul>
          </div>

          {/* Barra de Salvar Inferior */}
          <PermissaoGuarda permissao="configuracoes.editar">
            <div className="bg-white rounded-2xl border border-[#E4ECE7] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                {salvo && (
                  <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    ✓ Identidade visual salva com sucesso!
                  </p>
                )}
                {!salvo && (
                  <p className="text-xs text-[#687770]">
                    Clique para aplicar suas configurações à organização.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={salvar}
                disabled={salvando}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0E382C] hover:bg-[#07261E] text-[#D4EC9D] transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </PermissaoGuarda>
        </div>
      </div>
    </div>
  );
};

export default IdentidadeVisual;
