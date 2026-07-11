// =============================================================
// PRANCHETO.IA - HOOK DO CRM (FASE 2)
// Gerencia: Leads, Clientes, Campos Customizados, Vínculos entre Times
//
// SEPARAÇÃO DE RESPONSABILIDADES:
//   - useLeads()         → contatos com tipo_registro = 'lead'
//   - useClientes()      → contatos com tipo_registro = 'cliente'
//   - useCamposCustom()  → campos e valores customizados
//   - useInteracoes()    → histórico de interações de um contato
// =============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';

// ─── Constantes ────────────────────────────────────────────────
export const FUNIL_LEAD = [
  { key: 'lead',        label: 'Lead',        cor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',    emoji: '🎯' },
  { key: 'qualificado', label: 'Qualificado', cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       emoji: '✅' },
  { key: 'proposta',    label: 'Proposta',    cor: 'bg-violet-500/20 text-violet-300 border-violet-500/30', emoji: '📄' },
  { key: 'negociacao',  label: 'Negociação',  cor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',    emoji: '🤝' },
  { key: 'fechado',     label: 'Fechado',     cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', emoji: '🏆' },
  { key: 'perdido',     label: 'Perdido',     cor: 'bg-red-500/20 text-red-300 border-red-500/30',          emoji: '❌' },
];

export const TIPOS_INTERACAO = [
  { key: 'nota',      label: 'Nota',      emoji: '📝', score: 5  },
  { key: 'email',     label: 'E-mail',    emoji: '✉️', score: 10 },
  { key: 'whatsapp',  label: 'WhatsApp',  emoji: '💬', score: 10 },
  { key: 'ligacao',   label: 'Ligação',   emoji: '📞', score: 15 },
  { key: 'reuniao',   label: 'Reunião',   emoji: '🤝', score: 25 },
  { key: 'outro',     label: 'Outro',     emoji: '📋', score: 5  },
  { key: 'conversao', label: 'Conversão', emoji: '🎉', score: 0  },
];

export const ORIGENS = [
  { key: 'manual',    label: 'Manual'     },
  { key: 'site',      label: 'Site'       },
  { key: 'formulario',label: 'Formulário' },
  { key: 'anuncio',   label: 'Anúncio'   },
  { key: 'indicacao', label: 'Indicação'  },
  { key: 'linkedin',  label: 'LinkedIn'   },
  { key: 'email',     label: 'E-mail'     },
  { key: 'outro',     label: 'Outro'      },
];

export const TIPOS_CAMPO = [
  { key: 'text',        label: 'Texto'         },
  { key: 'number',      label: 'Número'        },
  { key: 'date',        label: 'Data'          },
  { key: 'boolean',     label: 'Sim/Não'       },
  { key: 'select',      label: 'Seleção única' },
  { key: 'multiselect', label: 'Múltipla escolha' },
  { key: 'url',         label: 'URL'           },
  { key: 'email',       label: 'E-mail'        },
];

export const funilInfo  = (key) => FUNIL_LEAD.find(f => f.key === key) || FUNIL_LEAD[0];
export const tipoInfo   = (key) => TIPOS_INTERACAO.find(t => t.key === key) || TIPOS_INTERACAO[0];
export const origemInfo = (key) => ORIGENS.find(o => o.key === key) || ORIGENS[0];

// ─── Formatadores ──────────────────────────────────────────────
export const formatarMoeda = (v) =>
  v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

export const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

export const formatarDataHora = (iso) =>
  iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const tempoRelativo = (iso) => {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1)   return 'agora';
  if (min < 60)  return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24)    return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30)    return `${d}d atrás`;
  const m = Math.floor(d / 30);
  return `${m} ${m === 1 ? 'mês' : 'meses'} atrás`;
};

// ─── Hook: Leads ───────────────────────────────────────────────
export const useLeads = () => {
  const { usuario } = useAuthStore();
  const [leads, setLeads]         = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]           = useState(null);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      let q = supabase
        .from('crm_contatos')
        .select(`
          id, nome, email, telefone, empresa, cargo,
          origem, origem_detalhes, status_funil,
          valor_estimado, observacoes, tags,
          score, score_historico,
          tipo_registro, time_id,
          criado_em, atualizado_em,
          responsavel:responsavel_id (id, nome, email)
        `)
        .eq('tipo_registro', 'lead')
        .order('score', { ascending: false });

      if (filtros.status_funil) q = q.eq('status_funil', filtros.status_funil);
      if (filtros.time_id)      q = q.eq('time_id', filtros.time_id);
      if (filtros.busca)        q = q.ilike('nome', `%${filtros.busca}%`);

      const { data, error } = await q;
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const criar = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .insert({
        ...payload,
        tipo_registro: 'lead',
        responsavel_id: usuario?.id || null,
      })
      .select()
      .single();
    if (error) throw error;
    setLeads(prev => [data, ...prev]);
    return data;
  }, [usuario]);

  const atualizar = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setLeads(prev => prev.map(l => l.id === id ? data : l));
    return data;
  }, []);

  const excluir = useCallback(async (id) => {
    const { error } = await supabase.from('crm_contatos').delete().eq('id', id);
    if (error) throw error;
    setLeads(prev => prev.filter(l => l.id !== id));
  }, []);

  /**
   * Converte um Lead em Cliente.
   * O trigger trg_conversao_lead cuida de:
   *   - Registrar interação automática de 'conversao'
   *   - Disparar notificações para responsável e membros do time
   */
  const converterParaCliente = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({
        tipo_registro:  'cliente',
        convertido_em:  new Date().toISOString(),
        convertido_por: usuario?.id || null,
        atualizado_em:  new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    // Remove da lista de leads
    setLeads(prev => prev.filter(l => l.id !== id));
    return data;
  }, [usuario]);

  const mudarStatus = useCallback(async (id, novoStatus) => {
    return atualizar(id, { status_funil: novoStatus });
  }, [atualizar]);

  /**
   * Pendência A (FASE 3): Move um lead para outro time.
   * Os valores em crm_valores_customizados são preservados automaticamente
   * pois estão vinculados a campo_id, não a time_id do contato.
   */
  const moverParaTime = useCallback(async (id, novoTimeId) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({ time_id: novoTimeId, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setLeads(prev => prev.map(l => l.id === id ? data : l));
    return data;
  }, []);

  return {
    leads, carregando, erro,
    carregar, criar, atualizar, excluir,
    converterParaCliente, mudarStatus, moverParaTime,
  };
};

// ─── Hook: Clientes ────────────────────────────────────────────
export const useClientes = () => {
  const [clientes, setClientes]   = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]           = useState(null);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      let q = supabase
        .from('crm_contatos')
        .select(`
          id, nome, email, telefone, empresa, cargo,
          origem, origem_detalhes, status_funil,
          valor_estimado, observacoes, tags,
          score, ltv,
          tipo_registro, time_id,
          convertido_em, convertido_por,
          data_inicio_contrato, data_fim_contrato,
          criado_em, atualizado_em,
          responsavel:responsavel_id (id, nome, email)
        `)
        .eq('tipo_registro', 'cliente')
        .order('ltv', { ascending: false });

      if (filtros.time_id) q = q.eq('time_id', filtros.time_id);
      if (filtros.busca)   q = q.ilike('nome', `%${filtros.busca}%`);

      const { data, error } = await q;
      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const atualizar = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setClientes(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  const excluir = useCallback(async (id) => {
    const { error } = await supabase.from('crm_contatos').delete().eq('id', id);
    if (error) throw error;
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const moverParaTime = useCallback(async (id, novoTimeId) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({ time_id: novoTimeId, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setClientes(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  return { clientes, carregando, erro, carregar, atualizar, excluir, moverParaTime };
};

// ─── Hook: Interações ──────────────────────────────────────────
export const useInteracoes = (contatoId) => {
  const { usuario } = useAuthStore();
  const [interacoes, setInteracoes] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!contatoId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('crm_interacoes')
        .select('*, criado_por_user:criado_por (id, nome)')
        .eq('contato_id', contatoId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setInteracoes(data || []);
    } catch { setInteracoes([]); }
    finally { setCarregando(false); }
  }, [contatoId]);

  const adicionar = useCallback(async (tipo, conteudo, metadata = {}) => {
    const { data, error } = await supabase
      .from('crm_interacoes')
      .insert({
        contato_id: contatoId,
        criado_por: usuario?.id || null,
        tipo,
        conteudo,
        metadata,
      })
      .select('*, criado_por_user:criado_por (id, nome)')
      .single();
    if (error) throw error;
    setInteracoes(prev => [data, ...prev]);
    return data;
  }, [contatoId, usuario]);

  return { interacoes, carregando, carregar, adicionar };
};

// ─── Hook: Campos Customizados ─────────────────────────────────
export const useCamposCustom = () => {
  const [campos, setCampos]       = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]           = useState(null);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      let q = supabase
        .from('crm_campos_customizados')
        .select('*, time:time_id (id, nome, icone)')
        .eq('ativo', true)
        .order('ordem');

      if (filtros.time_id) q = q.eq('time_id', filtros.time_id);
      if (filtros.modulo)  q = q.eq('modulo', filtros.modulo);

      const { data, error } = await q;
      if (error) throw error;
      setCampos(data || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  const criar = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('crm_campos_customizados')
      .insert(payload)
      .select('*, time:time_id (id, nome, icone)')
      .single();
    if (error) throw error;
    setCampos(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem));
    return data;
  }, []);

  const atualizar = useCallback(async (id, payload) => {
    const { data, error } = await supabase
      .from('crm_campos_customizados')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select('*, time:time_id (id, nome, icone)')
      .single();
    if (error) throw error;
    setCampos(prev => prev.map(c => c.id === id ? data : c));
    return data;
  }, []);

  const excluir = useCallback(async (id) => {
    const { error } = await supabase
      .from('crm_campos_customizados')
      .update({ ativo: false })
      .eq('id', id);
    if (error) throw error;
    setCampos(prev => prev.filter(c => c.id !== id));
  }, []);

  // Buscar valores de campos para um contato específico
  // Inclui o nome do time para exibir namespace quando há conflito de label
  const buscarValores = useCallback(async (contatoId) => {
    const { data, error } = await supabase
      .from('crm_valores_customizados')
      .select('*, campo:campo_id (id, nome, label, tipo, time_id, time:time_id (id, nome))')
      .eq('contato_id', contatoId);
    if (error) throw error;
    return data || [];
  }, []);

  // Salvar valor de um campo para um contato (upsert)
  const salvarValor = useCallback(async (campoId, contatoId, tenantId, valor, valorJson = null) => {
    const { data, error } = await supabase
      .from('crm_valores_customizados')
      .upsert({
        campo_id:   campoId,
        contato_id: contatoId,
        tenant_id:  tenantId,
        valor:      valor != null ? String(valor) : null,
        valor_json: valorJson,
        atualizado_em: new Date().toISOString(),
      }, { onConflict: 'campo_id,contato_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  return {
    campos, carregando, erro,
    carregar, criar, atualizar, excluir,
    buscarValores, salvarValor,
  };
};

// ─── Hook: Documentos ──────────────────────────────────────────
export const useDocumentos = (contatoId) => {
  const { usuario } = useAuthStore();
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    if (!contatoId) return;
    setCarregando(true);
    try {
      const { data, error } = await supabase
        .from('crm_documentos')
        .select('*, criado_por_user:criado_por (id, nome)')
        .eq('contato_id', contatoId)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      setDocumentos(data || []);
    } catch { setDocumentos([]); }
    finally { setCarregando(false); }
  }, [contatoId]);

  const adicionar = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('crm_documentos')
      .insert({ ...payload, contato_id: contatoId, criado_por: usuario?.id })
      .select()
      .single();
    if (error) throw error;
    setDocumentos(prev => [data, ...prev]);
    return data;
  }, [contatoId, usuario]);

  const excluir = useCallback(async (id) => {
    const { error } = await supabase.from('crm_documentos').delete().eq('id', id);
    if (error) throw error;
    setDocumentos(prev => prev.filter(d => d.id !== id));
  }, []);

  return { documentos, carregando, carregar, adicionar, excluir };
};
