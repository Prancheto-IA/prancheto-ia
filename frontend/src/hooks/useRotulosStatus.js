// =============================================================
// PRANCHETO.IA - HOOK DE RÓTULOS DE STATUS (Outbound + Funil do CRM)
//
// Modelo híbrido de 3 níveis, mesma cascata para os dois domínios:
//
//   rótulo pessoal (user_preferencias.metadata) >
//   padrão da empresa (tenants.configuracoes.rotulos_padrao) >
//   padrão do sistema (constantes abaixo)
//
// O valor técnico do status (outbound_acoes.status / crm_contatos.status_
// funil) é fixo e compartilhado por todo mundo — só o rótulo exibido muda
// por camada. Qualquer usuário edita o próprio; só dono do tenant,
// super_admin ou quem tem a permissão 'rotulos.gerenciar' define o padrão
// da empresa (função definir_rotulos_padrao_empresa, migration
// 20260928000000).
// =============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';
import { usePermission } from './usePermission.js';

export const STATUS_ORDEM_OUTBOUND = ['pendente', 'enviado', 'respondido', 'sem_retorno', 'convertido'];

export const ROTULOS_PADRAO_OUTBOUND = {
  pendente:    'Não chamei ainda',
  enviado:     'Já chamei',
  respondido:  'Chamar de novo',
  sem_retorno: 'Deu ruim',
  convertido:  'Deu bom',
};

export const STATUS_ORDEM_CRM_FUNIL = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];

export const ROTULOS_PADRAO_CRM_FUNIL = {
  lead:        'Não chamei ainda',
  qualificado: 'Já chamei',
  proposta:    'Mandei a proposta',
  negociacao:  'Chamar de novo',
  fechado:     'Deu bom',
  perdido:     'Deu ruim',
};

// Cor e emoji são fixos por etapa técnica — não fazem parte do que é
// personalizável (só o texto do rótulo muda). Consumidores que precisam de
// estilo (badges, colunas de kanban) usam isto; o texto vem de `rotulos`.
export const ETAPAS_CRM_FUNIL = [
  { key: 'lead',        cor: 'badge-neutro',                                              emoji: '🎯' },
  { key: 'qualificado', cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',            emoji: '✅' },
  { key: 'proposta',    cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',      emoji: '📄' },
  { key: 'negociacao',  cor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',         emoji: '🤝' },
  { key: 'fechado',     cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',   emoji: '🏆' },
  { key: 'perdido',     cor: 'bg-red-500/20 text-red-300 border-red-500/30',               emoji: '❌' },
];

export const etapaCrmFunilInfo = (key) => ETAPAS_CRM_FUNIL.find((e) => e.key === key) || ETAPAS_CRM_FUNIL[0];

const CONFIG_DOMINIO = {
  outbound:  { chaveMetadata: 'outbound_status_rotulos', ordem: STATUS_ORDEM_OUTBOUND, padraoSistema: ROTULOS_PADRAO_OUTBOUND },
  crm_funil: { chaveMetadata: 'crm_funil_rotulos',        ordem: STATUS_ORDEM_CRM_FUNIL, padraoSistema: ROTULOS_PADRAO_CRM_FUNIL },
};

/**
 * @param {'outbound'|'crm_funil'} dominio
 */
export const useRotulosStatus = (dominio) => {
  const { usuario } = useAuthStore();
  const { pode } = usePermission();
  const { chaveMetadata, ordem, padraoSistema } = CONFIG_DOMINIO[dominio];

  const [meuRotulo, setMeuRotulo] = useState({});
  const [metadataOutros, setMetadataOutros] = useState({});
  const [padraoEmpresa, setPadraoEmpresa] = useState({});
  const [souDono, setSouDono] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!usuario?.id) { setCarregando(false); return; }
    setCarregando(true);
    try {
      const [prefsResp, tenantResp, donoResp] = await Promise.all([
        supabase.from('user_preferencias').select('metadata').eq('user_id', usuario.id).single(),
        usuario.tenant_id
          ? supabase.from('tenants').select('configuracoes').eq('id', usuario.tenant_id).single()
          : Promise.resolve({ data: null, error: null }),
        supabase.rpc('sou_dono_tenant'),
      ]);

      const metadata = prefsResp.data?.metadata || {};
      const { [chaveMetadata]: meu, ...outros } = metadata;
      setMetadataOutros(outros);
      setMeuRotulo(meu || {});

      const configuracoes = tenantResp.data?.configuracoes || {};
      setPadraoEmpresa(configuracoes?.rotulos_padrao?.[dominio] || {});

      setSouDono(Boolean(donoResp.data));
    } catch (err) {
      console.warn('[useRotulosStatus] Erro ao carregar rótulos:', err.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario?.id, usuario?.tenant_id, chaveMetadata, dominio]);

  useEffect(() => { carregar(); }, [carregar]);

  // Precedência: pessoal > empresa > sistema, campo a campo.
  const rotulos = useMemo(() => (
    ordem.reduce((acc, status) => {
      acc[status] = meuRotulo[status] || padraoEmpresa[status] || padraoSistema[status];
      return acc;
    }, {})
  ), [meuRotulo, padraoEmpresa, padraoSistema, ordem]);

  const limparCampos = useCallback((novosRotulos) => ordem.reduce((acc, status) => {
    const valor = (novosRotulos[status] || '').trim();
    if (valor) acc[status] = valor;
    return acc;
  }, {}), [ordem]);

  // Salva o rótulo pessoal. Campo em branco = "não personalizei este
  // status" — cai pro padrão da empresa (ou do sistema), não força mais o
  // padrão do sistema como valor gravado (senão o padrão da empresa nunca
  // apareceria pra quem já tinha customizado o outbound antes).
  const salvarMeu = useCallback(async (novosRotulos) => {
    if (!usuario?.id) return;
    const limpos = limparCampos(novosRotulos);

    const { error } = await supabase
      .from('user_preferencias')
      .upsert({
        user_id: usuario.id,
        metadata: { ...metadataOutros, [chaveMetadata]: limpos },
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    setMeuRotulo(limpos);
  }, [usuario?.id, metadataOutros, chaveMetadata, limparCampos]);

  const restaurarMeu = useCallback(() => salvarMeu({}), [salvarMeu]);

  const podeDefinirPadraoEmpresa = souDono || pode('rotulos.gerenciar');

  const definirPadraoEmpresa = useCallback(async (novosRotulos) => {
    const limpos = limparCampos(novosRotulos);
    const { error } = await supabase.rpc('definir_rotulos_padrao_empresa', {
      p_dominio: dominio,
      p_rotulos: limpos,
    });
    if (error) throw error;
    setPadraoEmpresa(limpos);
  }, [dominio, limparCampos]);

  const restaurarPadraoEmpresa = useCallback(() => definirPadraoEmpresa({}), [definirPadraoEmpresa]);

  return {
    ordem,
    padraoSistema,
    meuRotulo,
    padraoEmpresa,
    rotulos,
    carregando,
    podeDefinirPadraoEmpresa,
    salvarMeu,
    restaurarMeu,
    definirPadraoEmpresa,
    restaurarPadraoEmpresa,
    recarregar: carregar,
  };
};
