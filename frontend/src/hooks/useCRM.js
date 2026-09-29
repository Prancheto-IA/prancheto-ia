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

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';

// ─── Constantes ────────────────────────────────────────────────
// Etapas do funil (key/cor/emoji): ver ETAPAS_CRM_FUNIL em
// hooks/useRotulosStatus.js — o rótulo exibido de cada etapa é resolvido
// por lá (rótulo pessoal > padrão da empresa > padrão do sistema), não é
// mais um texto fixo aqui.

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

export const tipoInfo   = (key) => TIPOS_INTERACAO.find(t => t.key === key) || TIPOS_INTERACAO[0];
export const origemInfo = (key) => ORIGENS.find(o => o.key === key) || ORIGENS[0];

// ─── Helper: registra mudança de etapa como interação ──────────
// Não é hook (sem estado) — chamado por useLeads.mudarStatus e
// useContato.mudarStatus pra aba Histórico mostrar quem moveu e quando.
// Guarda os slugs técnicos em metadata (não rótulos já resolvidos): a UI
// resolve rotulos[metadata.de]/rotulos[metadata.para] no render, então
// continua certo mesmo se o usuário renomear os rótulos depois.
export const registrarMudancaStatus = async (contatoId, statusAnterior, statusNovo, criadoPorId) => {
  if (!statusAnterior || statusAnterior === statusNovo) return null;
  const { data, error } = await supabase
    .from('crm_interacoes')
    .insert({
      contato_id: contatoId,
      criado_por: criadoPorId || null,
      tipo: 'mudanca_status',
      conteudo: 'Mudança de etapa',
      metadata: { de: statusAnterior, para: statusNovo },
    })
    .select('*, criado_por_user:criado_por (id, nome)')
    .single();
  if (error) throw error;
  return data;
};

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
      // O embed de crm_interacoes só entra quando o silo "sem_contato" está
      // ativo — evita puxar esse array em toda carga normal da lista.
      const precisaEmbedInteracoes = filtros.silo === 'sem_contato';
      let q = supabase
        .from('crm_contatos')
        .select(`
          id, nome, email, telefone, whatsapp, empresa, cargo,
          origem, origem_detalhes, forma_aquisicao, status_funil,
          valor_estimado, observacoes, tags,
          negocio_nome, previsao_fechamento, campanha,
          razao_social, documento, segmento, site, porte, endereco,
          score, score_historico,
          tipo_registro, time_id,
          criado_em, atualizado_em,
          responsavel:responsavel_id (id, nome, email)
          ${precisaEmbedInteracoes ? ', crm_interacoes!left(id)' : ''}
        `)
        .eq('tipo_registro', 'lead');

      if (filtros.status_funil)   q = q.eq('status_funil', filtros.status_funil);
      if (filtros.time_id)        q = q.eq('time_id', filtros.time_id);
      if (filtros.busca)          q = q.ilike('nome', `%${filtros.busca}%`);
      if (filtros.responsavel_id) q = q.eq('responsavel_id', filtros.responsavel_id);

      // Silos de filtro rápido da tela de Leads. 'todos' não aplica
      // predicado nenhum; 'recentes' também não filtra linhas — só muda a
      // ordenação abaixo (mesmo universo de 'todos').
      if (filtros.silo === 'minhas')      q = q.eq('responsavel_id', usuario?.id);
      if (filtros.silo === 'sem_contato') q = q.is('crm_interacoes.id', null);
      if (filtros.silo === 'andamento')   q = q.not('status_funil', 'in', '(fechado,perdido)');

      q = filtros.silo === 'recentes'
        ? q.order('criado_em', { ascending: false })
        : q.order('score', { ascending: false });

      const { data, error } = await q;
      if (error) throw error;
      setLeads(data || []);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  // Contadores dos silos — independentes do filtro ativo (RPC própria,
  // ver leads_contadores_silos), pra trocar de silo não zerar os outros.
  const contarSilos = useCallback(async () => {
    const base = { todos: 0, minhas: 0, sem_contato: 0, andamento: 0 };
    const { data, error } = await supabase.rpc('leads_contadores_silos');
    if (error) {
      console.error('Erro ao contar silos de leads:', error);
      return base;
    }
    const contadores = { ...base };
    (data || []).forEach((linha) => { contadores[linha.silo] = Number(linha.total) || 0; });
    return contadores;
  }, []);

  const criar = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .insert({
        ...payload,
        tipo_registro: 'lead',
        responsavel_id: payload.responsavel_id || usuario?.id || null,
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
    const anterior = leads.find(l => l.id === id)?.status_funil;
    const atualizado = await atualizar(id, { status_funil: novoStatus });
    registrarMudancaStatus(id, anterior, novoStatus, usuario?.id)
      .catch(err => console.error('Erro ao registrar mudança de status:', err));
    return atualizado;
  }, [atualizar, leads, usuario]);

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

  // Exclusão em lote. RLS (crm_contatos_delete) filtra silenciosamente as
  // linhas sem permissão — não existe erro por linha num delete em lote
  // via PostgREST, então "quantos foram ignorados" só dá pra saber
  // comparando os ids pedidos com os ids que realmente vieram no .select().
  const excluirEmMassa = useCallback(async (ids) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .delete()
      .in('id', ids)
      .select('id');
    if (error) throw error;
    const excluidosIds = (data || []).map(d => d.id);
    setLeads(prev => prev.filter(l => !excluidosIds.includes(l.id)));
    return { excluidosIds, ignorados: ids.length - excluidosIds.length };
  }, []);

  return {
    leads, carregando, erro,
    carregar, criar, atualizar, excluir, excluirEmMassa,
    converterParaCliente, mudarStatus, moverParaTime,
    contarSilos,
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
          id, nome, email, telefone, whatsapp, empresa, cargo,
          origem, origem_detalhes, status_funil,
          valor_estimado, observacoes, tags,
          negocio_nome, previsao_fechamento, campanha,
          razao_social, documento, segmento, site, porte, endereco,
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

// ─── Hook: Contato único (Lead ou Cliente) ──────────────────────
// Usado pela página cheia /crm/leads/:id e /crm/clientes/:id — busca uma
// única linha de crm_contatos por id (lead/cliente é só tipo_registro,
// a mesma tabela), diferente de useLeads/useClientes que carregam listas.
export const useContato = (id) => {
  const { usuario } = useAuthStore();
  const [contato, setContato]       = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro]             = useState(null);

  const carregar = useCallback(async () => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('crm_contatos')
        .select(`
          id, nome, email, telefone, whatsapp, empresa, cargo,
          origem, origem_detalhes, forma_aquisicao, status_funil,
          valor_estimado, observacoes, tags,
          negocio_nome, previsao_fechamento, campanha,
          razao_social, documento, segmento, site, porte, endereco,
          score, score_historico, ltv,
          tipo_registro, time_id,
          convertido_em, convertido_por,
          data_inicio_contrato, data_fim_contrato,
          criado_em, atualizado_em,
          responsavel:responsavel_id (id, nome, email)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setContato(data);
    } catch (err) {
      setErro(err.message);
      setContato(null);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { carregar(); }, [carregar]);

  const atualizar = useCallback(async (payload) => {
    const { data, error } = await supabase
      .from('crm_contatos')
      .update({ ...payload, atualizado_em: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setContato(prev => ({ ...prev, ...data }));
    return data;
  }, [id]);

  const mudarStatus = useCallback(async (novoStatus) => {
    const anterior = contato?.status_funil;
    const atualizado = await atualizar({ status_funil: novoStatus });
    registrarMudancaStatus(id, anterior, novoStatus, usuario?.id)
      .catch(err => console.error('Erro ao registrar mudança de status:', err));
    return atualizado;
  }, [atualizar, contato, id, usuario]);

  const converterParaCliente = useCallback(async () => {
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
    setContato(data);
    return data;
  }, [id, usuario]);

  const moverParaTime = useCallback(async (novoTimeId) => atualizar({ time_id: novoTimeId }), [atualizar]);

  const excluir = useCallback(async () => {
    const { error } = await supabase.from('crm_contatos').delete().eq('id', id);
    if (error) throw error;
  }, [id]);

  return {
    contato, carregando, erro,
    recarregar: carregar,
    atualizar, mudarStatus, converterParaCliente, moverParaTime, excluir,
  };
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

  // `url` tem dupla natureza: começa com "http" -> link externo (fluxo
  // antigo, nunca usado por nenhuma tela ainda); senão -> caminho interno
  // do bucket privado crm-documentos. Sem coluna nova, só convenção de
  // leitura — se vier `arquivo` (File), faz upload de verdade.
  const adicionar = useCallback(async ({ arquivo, tipo = 'outro', nome, url }) => {
    let registro = { tipo, contato_id: contatoId, criado_por: usuario?.id };

    if (arquivo) {
      const caminho = `${contatoId}/${Date.now()}-${arquivo.name}`;
      const { error: erroUpload } = await supabase.storage
        .from('crm-documentos')
        .upload(caminho, arquivo);
      if (erroUpload) throw erroUpload;
      registro = {
        ...registro,
        nome: nome || arquivo.name,
        url: caminho,
        mime_type: arquivo.type || null,
        tamanho_kb: Math.round(arquivo.size / 1024),
      };
    } else {
      registro = { ...registro, nome, url };
    }

    const { data, error } = await supabase
      .from('crm_documentos')
      .insert(registro)
      .select()
      .single();
    if (error) throw error;
    setDocumentos(prev => [data, ...prev]);
    return data;
  }, [contatoId, usuario]);

  // Link externo abre em nova aba; caminho interno baixa via Storage
  // (bucket privado, .download() já autentica, sem precisar de signed URL).
  const baixar = useCallback(async (doc) => {
    if (doc.url.startsWith('http')) {
      window.open(doc.url, '_blank', 'noopener,noreferrer');
      return;
    }
    const { data, error } = await supabase.storage.from('crm-documentos').download(doc.url);
    if (error) throw error;
    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = doc.nome;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }, []);

  const excluir = useCallback(async (doc) => {
    if (!doc.url.startsWith('http')) {
      await supabase.storage.from('crm-documentos').remove([doc.url]);
    }
    const { error } = await supabase.from('crm_documentos').delete().eq('id', doc.id);
    if (error) throw error;
    setDocumentos(prev => prev.filter(d => d.id !== doc.id));
  }, []);

  return { documentos, carregando, carregar, adicionar, baixar, excluir };
};
