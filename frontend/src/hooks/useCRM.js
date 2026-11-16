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
export const MAPA_ETAPAS_LEGADO = {
  lead: 'nao_chamei',
  qualificado: 'chamei',
  proposta: 'chamei',
  negociacao: 'chamar_novamente',
  fechado: 'deu_bom',
  perdido: 'deu_ruim',
};

export function normalizarEtapaFunil(key) {
  if (!key) return 'nao_chamei';
  return MAPA_ETAPAS_LEGADO[key] || key;
}

export const FUNIL_LEAD = [
  { key: 'nao_chamei',       label: 'Não Chamei',       cor: 'badge-neutro',                                              emoji: '🎯' },
  { key: 'chamei',           label: 'Chamei',           cor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',           emoji: '📞' },
  { key: 'chamar_novamente', label: 'Chamar Novamente', cor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',        emoji: '🔄' },
  { key: 'deu_bom',          label: 'Deu Bom!',         cor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',  emoji: '🏆' },
  { key: 'deu_ruim',         label: 'Deu Ruim!',        cor: 'bg-red-500/20 text-red-300 border-red-500/30',             emoji: '❌' },
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

export const funilInfo = (key) => {
  const norm = normalizarEtapaFunil(key);
  return FUNIL_LEAD.find(f => f.key === norm) ?? FUNIL_LEAD[0];
};
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
          id, nome, email, telefone, whatsapp, empresa, cargo,
          origem, origem_detalhes, status_funil,
          valor_estimado, observacoes, tags,
          negocio_nome, previsao_fechamento, campanha,
          razao_social, documento, segmento, site, porte, endereco,
          score, score_historico,
          tipo_registro, time_id,
          criado_em, atualizado_em,
          responsavel:responsavel_id (id, nome, email)
        `)
        .order('score', { ascending: false });

      if (filtros.tipo_registro) {
        q = q.eq('tipo_registro', filtros.tipo_registro);
      } else {
        q = q.in('tipo_registro', ['lead', 'cliente']);
      }

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
        tenant_id: usuario?.tenant_id || null,
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

  useEffect(() => {
    carregar();
  }, [carregar]);

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

  const remover = useCallback(async (interacaoId) => {
    const { error } = await supabase
      .from('crm_interacoes')
      .delete()
      .eq('id', interacaoId);
    if (error) throw error;
    setInteracoes(prev => prev.filter(i => i.id !== interacaoId));
  }, []);

  return { interacoes, carregando, carregar, adicionar, remover };
};

// ─── Hook: Campos Customizados ─────────────────────────────────
export const useCamposCustom = () => {
  const { usuario } = useAuthStore();
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
      .insert({ ...payload, tenant_id: usuario?.tenant_id || null })
      .select('*, time:time_id (id, nome, icone)')
      .single();
    if (error) throw error;
    setCampos(prev => [...prev, data].sort((a, b) => a.ordem - b.ordem));
    return data;
  }, [usuario]);

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

// ─── Constantes de Empresas B2B ─────────────────────────────────
export const STATUS_EMPRESA_OPCOES = [
  { value: 'prospect',      label: 'Em Prospecção',       cor: 'warning' },
  { value: 'cliente_ativo', label: 'Cliente Ativo',       cor: 'success' },
  { value: 'em_risco',      label: 'Em Risco / Atenção',  cor: 'destructive' },
  { value: 'parceiro',      label: 'Parceiro',            cor: 'violet' },
  { value: 'churn',         label: 'Encerrado',           cor: 'default' },
];

export const PORTE_EMPRESA_OPCOES = [
  { value: 'mei',     label: 'MEI' },
  { value: 'micro',   label: 'Microempresa' },
  { value: 'pequena', label: 'Pequena' },
  { value: 'media',   label: 'Média' },
  { value: 'grande',  label: 'Grande' },
];

export const PAPEIS_DECISAO_OPCOES = [
  { value: 'decisor',       label: 'Tomador de Decisão',  iconeKey: 'CrownIcon' },
  { value: 'influenciador', label: 'Influenciador',       iconeKey: 'FlashIcon' },
  { value: 'financeiro',    label: 'Financeiro / Compras',iconeKey: 'CoinsDollarIcon' },
  { value: 'tecnico',       label: 'Técnico',             iconeKey: 'Wrench01Icon' },
  { value: 'usuario',       label: 'Usuário Final',       iconeKey: 'UserIcon' },
];

export const formatarCNPJ = (valor) => {
  if (!valor) return '';
  const digits = String(valor).replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    // CPF fallback
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
      [a, b && `.${b}`, c && `.${c}`, d && `-${d}`].filter(Boolean).join('')
    );
  }
  return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
    [a, b && `.${b}`, c && `.${c}`, d && `/${d}`, e && `-${e}`].filter(Boolean).join('')
  );
};

// ─── Empresas Mock Iniciais (Retrocompatíveis com DEALS_DEMO) ────
const EMPRESAS_DEMO_INICIAIS = [
  {
    id: 'emp-1',
    nome_fantasia: 'Grupo Verado',
    razao_social: 'Verado Soluções em Compliance e Segurança LTDA',
    cnpj: '33.123.456/0001-89',
    logotipo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80',
    segmento: 'Tecnologia & Compliance',
    porte: 'grande',
    site: 'https://grupoverado.com.br',
    email_geral: 'contato@grupoverado.com.br',
    telefone_geral: '(11) 3245-8000',
    whatsapp_geral: '(11) 98765-4321',
    status: 'cliente_ativo',
    health_score: 94,
    observacoes: 'Cliente corporativo estratégico. Contrato anual de consultoria e expansão para filiais em andamento.',
    endereco: {
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: '14º Andar - Conjunto 142',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    contatos: [
      { id: 'c-1', nome: 'Carlos Mendes', cargo: 'Diretor de Operações', papel_decisao: 'decisor', email: 'carlos@grupoverado.com.br', whatsapp: '(11) 98765-4321', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&auto=format&fit=crop&q=80' },
      { id: 'c-2', nome: 'Juliana Rocha', cargo: 'Gerente de TI', papel_decisao: 'tecnico', email: 'juliana@grupoverado.com.br', whatsapp: '(11) 97777-1111', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&auto=format&fit=crop&q=80' },
      { id: 'c-3', nome: 'Marcelo Pires', cargo: 'Controler Financeiro', papel_decisao: 'financeiro', email: 'marcelo@grupoverado.com.br', whatsapp: '(11) 96666-2222', avatar: null },
    ],
    negocios: [
      { id: 'demo-1', nome: 'Módulo de compliance', status_funil: 'nao_chamei', valor_estimado: 118000, criado_em: new Date(Date.now() - 41 * 86400000).toISOString() },
      { id: 'deal-g1', nome: 'Consultoria de Governança', status_funil: 'deu_bom', valor_estimado: 75000, criado_em: new Date(Date.now() - 120 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 90 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'emp-2',
    nome_fantasia: 'Transportadora Norte',
    razao_social: 'Transportadora Norte e Sul Logística S/A',
    cnpj: '45.987.654/0001-20',
    logotipo_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80',
    segmento: 'Logística & Transporte',
    porte: 'media',
    site: 'https://transportadoranorte.com.br',
    email_geral: 'frotas@transportadoranorte.com.br',
    telefone_geral: '(41) 3320-9100',
    whatsapp_geral: '(41) 99123-4567',
    status: 'prospect',
    health_score: 78,
    observacoes: 'Negociação para renovação do módulo de rastreamento de frotas e telemetria.',
    endereco: {
      cep: '80010-000',
      logradouro: 'Rua Marechal Deodoro',
      numero: '630',
      complemento: 'Sala 401',
      bairro: 'Centro',
      cidade: 'Curitiba',
      estado: 'PR',
    },
    contatos: [
      { id: 'c-4', nome: 'Roberto Albuquerque', cargo: 'Gerente de Logística', papel_decisao: 'decisor', email: 'roberto@transportadoranorte.com.br', whatsapp: '(41) 99123-4567', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&auto=format&fit=crop&q=80' },
      { id: 'c-5', nome: 'Amanda Silveira', cargo: 'Coordenadora de Compras', papel_decisao: 'financeiro', email: 'amanda@transportadoranorte.com.br', whatsapp: '(41) 98888-5555', avatar: null },
    ],
    negocios: [
      { id: 'demo-2', nome: 'Piloto: otimizador de rotas', status_funil: 'nao_chamei', valor_estimado: 42000, criado_em: new Date(Date.now() - 35 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 45 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'emp-3',
    nome_fantasia: 'Rede DrogaMais',
    razao_social: 'DrogaMais Distribuidora Farmacêutica LTDA',
    cnpj: '12.876.543/0001-11',
    logotipo_url: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=120&auto=format&fit=crop&q=80',
    segmento: 'Saúde & Farmácia',
    porte: 'grande',
    site: 'https://drogamais.com.br',
    email_geral: 'compras@drogamais.com.br',
    telefone_geral: '(21) 2540-1200',
    whatsapp_geral: '(21) 99876-5432',
    status: 'cliente_ativo',
    health_score: 96,
    observacoes: 'Rede com mais de 80 lojas no RJ e ES. Utilizam atendimento automático integrado ao WhatsApp.',
    endereco: {
      cep: '20040-002',
      logradouro: 'Av. Rio Branco',
      numero: '156',
      complemento: 'Andar 22',
      bairro: 'Centro',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
    },
    contatos: [
      { id: 'c-6', nome: 'Dra. Fernanda Lins', cargo: 'Diretora de Operações', papel_decisao: 'decisor', email: 'fernanda@drogamais.com.br', whatsapp: '(21) 99876-5432', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=96&auto=format&fit=crop&q=80' },
      { id: 'c-7', nome: 'Lucas Esteves', cargo: 'Analista de Suporte', papel_decisao: 'usuario', email: 'lucas@drogamais.com.br', whatsapp: '(21) 97777-3333', avatar: null },
    ],
    negocios: [
      { id: 'demo-3', nome: 'Automação WhatsApp Lojas', status_funil: 'deu_bom', valor_estimado: 95000, criado_em: new Date(Date.now() - 60 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 70 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'emp-4',
    nome_fantasia: 'TechLog Transportes',
    razao_social: 'TechLog Soluções em Fretes e Armazéns LTDA',
    cnpj: '18.456.789/0001-34',
    logotipo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    segmento: 'Logística & E-commerce',
    porte: 'media',
    site: 'https://techlogtrans.com.br',
    email_geral: 'atendimento@techlogtrans.com.br',
    telefone_geral: '(31) 3280-4500',
    whatsapp_geral: '(31) 98654-3210',
    status: 'prospect',
    health_score: 82,
    observacoes: 'Em fase final de teste de integração da API de cálculo de frete.',
    endereco: {
      cep: '30130-100',
      logradouro: 'Av. Afonso Pena',
      numero: '2200',
      complemento: 'Sala 902',
      bairro: 'Funcionários',
      cidade: 'Belo Horizonte',
      estado: 'MG',
    },
    contatos: [
      { id: 'c-8', nome: 'Eduardo Martins', cargo: 'Head de Logística', papel_decisao: 'decisor', email: 'eduardo@techlogtrans.com.br', whatsapp: '(31) 98654-3210', avatar: null },
    ],
    negocios: [
      { id: 'demo-4', nome: 'Integração API Fretes', status_funil: 'chamar_novamente', valor_estimado: 56000, criado_em: new Date(Date.now() - 20 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 25 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'emp-5',
    nome_fantasia: 'Bella Cosméticos',
    razao_social: 'Bella Indústria de Dermocosméticos do Brasil S/A',
    cnpj: '60.111.222/0001-99',
    logotipo_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&auto=format&fit=crop&q=80',
    segmento: 'Beleza & Cosméticos',
    porte: 'media',
    site: 'https://bellacosmeticos.com.br',
    email_geral: 'comercial@bellacosmeticos.com.br',
    telefone_geral: '(11) 4004-9876',
    whatsapp_geral: '(11) 97654-3210',
    status: 'cliente_ativo',
    health_score: 89,
    observacoes: 'Expansão de vendas B2B para farmácias e boutiques. Integração com ERP em andamento.',
    endereco: {
      cep: '04543-011',
      logradouro: 'Av. Brigadeiro Faria Lima',
      numero: '3477',
      complemento: '10º Andar',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      estado: 'SP',
    },
    contatos: [
      { id: 'c-9', nome: 'Camila Duarte', cargo: 'Diretora Comercial', papel_decisao: 'decisor', email: 'camila@bellacosmeticos.com.br', whatsapp: '(11) 97654-3210', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&auto=format&fit=crop&q=80' },
      { id: 'c-10', nome: 'Paulo Vieira', cargo: 'Comprador Senior', papel_decisao: 'financeiro', email: 'paulo@bellacosmeticos.com.br', whatsapp: '(11) 97654-1122', avatar: null },
    ],
    negocios: [
      { id: 'demo-5', nome: 'CRM B2B e Portal de Revenda', status_funil: 'chamei', valor_estimado: 74000, criado_em: new Date(Date.now() - 15 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 30 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'emp-6',
    nome_fantasia: 'Alpha Distribuidora',
    razao_social: 'Alpha Comércio e Representações LTDA',
    cnpj: '82.333.444/0001-55',
    logotipo_url: null,
    segmento: 'Distribuição & Atacado',
    porte: 'pequena',
    site: 'https://alphadistribuidora.com.br',
    email_geral: 'sac@alphadistribuidora.com.br',
    telefone_geral: '(47) 3433-2100',
    whatsapp_geral: '(47) 98888-2233',
    status: 'prospect',
    health_score: 72,
    observacoes: 'Interesse inicial demonstrado no formulário web. Aguardando apresentação de proposta.',
    endereco: {
      cep: '89201-001',
      logradouro: 'Rua XV de Novembro',
      numero: '450',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Joinville',
      estado: 'SC',
    },
    contatos: [
      { id: 'c-11', nome: 'Tiago Santos', cargo: 'Sócio Proprietário', papel_decisao: 'decisor', email: 'tiago@alphadistribuidora.com.br', whatsapp: '(47) 98888-2233', avatar: null },
    ],
    negocios: [
      { id: 'demo-6', nome: 'Plano Pro CRM', status_funil: 'nao_chamei', valor_estimado: 28000, criado_em: new Date(Date.now() - 8 * 86400000).toISOString() },
    ],
    criado_em: new Date(Date.now() - 12 * 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Helper para ler/escrever no storage local de fallback
const LOCAL_STORAGE_KEY_EMPRESAS = 'prancheto_crm_empresas_v1';
const obterEmpresasLocal = () => {
  try {
    const salvo = localStorage.getItem(LOCAL_STORAGE_KEY_EMPRESAS);
    if (salvo) return JSON.parse(salvo);
    localStorage.setItem(LOCAL_STORAGE_KEY_EMPRESAS, JSON.stringify(EMPRESAS_DEMO_INICIAIS));
    return EMPRESAS_DEMO_INICIAIS;
  } catch {
    return EMPRESAS_DEMO_INICIAIS;
  }
};
const salvarEmpresasLocal = (lista) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_EMPRESAS, JSON.stringify(lista));
  } catch { /* noop */ }
};

// ─── Hook: useEmpresas ──────────────────────────────────────────
export const useEmpresas = () => {
  const { usuario } = useAuthStore();
  const [empresas, setEmpresas] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Calcula métricas consolidadas por empresa
  const enriquecerEmpresaComMetricas = useCallback((emp) => {
    const contatos = emp.contatos || [];
    const negocios = emp.negocios || [];
    const totalContatos = contatos.length;
    const totalNegocios = negocios.length;
    const valorTotalNegocios = negocios.reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);
    const pipelineAtivo = negocios
      .filter(d => !['deu_bom', 'deu_ruim', 'fechado', 'perdido'].includes(d.status_funil))
      .reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);
    const ltvGanho = negocios
      .filter(d => ['deu_bom', 'fechado'].includes(d.status_funil))
      .reduce((acc, d) => acc + (Number(d.valor_estimado) || 0), 0);

    return {
      ...emp,
      totalContatos,
      totalNegocios,
      valorTotalNegocios,
      pipelineAtivo,
      ltvGanho,
    };
  }, []);

  const carregar = useCallback(async (filtros = {}) => {
    setCarregando(true);
    setErro(null);
    try {
      // 1. Tenta carregar do Supabase
      let q = supabase
        .from('crm_empresas')
        .select(`
          *,
          responsavel:responsavel_id (id, nome, email),
          contatos:crm_contatos (
            id, nome, email, telefone, whatsapp, cargo, papel_decisao, status_funil, valor_estimado, score, tipo_registro
          )
        `)
        .order('criado_em', { ascending: false });

      if (filtros.status)   q = q.eq('status', filtros.status);
      if (filtros.porte)    q = q.eq('porte', filtros.porte);
      if (filtros.busca)    q = q.or(`nome_fantasia.ilike.%${filtros.busca}%,razao_social.ilike.%${filtros.busca}%,cnpj.ilike.%${filtros.busca}%,segmento.ilike.%${filtros.busca}%`);

      const { data, error } = await q;

      if (!error && data && data.length > 0) {
        // Mapeia os dados do Supabase
        const enriquecidos = data.map(emp => {
          const contatos = emp.contatos || [];
          const negocios = contatos.filter(c => c.valor_estimado && c.valor_estimado > 0);
          return enriquecerEmpresaComMetricas({ ...emp, negocios });
        });
        setEmpresas(enriquecidos);
      } else {
        // Fallback local enriquecido
        let lista = obterEmpresasLocal();
        if (filtros.status) lista = lista.filter(e => e.status === filtros.status);
        if (filtros.porte) lista = lista.filter(e => e.porte === filtros.porte);
        if (filtros.busca) {
          const termo = filtros.busca.toLowerCase();
          lista = lista.filter(e =>
            (e.nome_fantasia && e.nome_fantasia.toLowerCase().includes(termo)) ||
            (e.razao_social && e.razao_social.toLowerCase().includes(termo)) ||
            (e.cnpj && e.cnpj.toLowerCase().includes(termo)) ||
            (e.segmento && e.segmento.toLowerCase().includes(termo)) ||
            (e.endereco?.cidade && e.endereco.cidade.toLowerCase().includes(termo))
          );
        }
        setEmpresas(lista.map(enriquecerEmpresaComMetricas));
      }
    } catch (err) {
      console.warn('Erro ao consultar crm_empresas no Supabase, utilizando fallback local:', err.message);
      const lista = obterEmpresasLocal();
      setEmpresas(lista.map(enriquecerEmpresaComMetricas));
    } finally {
      setCarregando(false);
    }
  }, [enriquecerEmpresaComMetricas]);

  const obterEmpresaPorId = useCallback(async (id) => {
    try {
      const { data, error } = await supabase
        .from('crm_empresas')
        .select(`
          *,
          responsavel:responsavel_id (id, nome, email),
          contatos:crm_contatos (
            id, nome, email, telefone, whatsapp, cargo, papel_decisao, status_funil, valor_estimado, score, tipo_registro, criado_em
          )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        const contatos = data.contatos || [];
        const negocios = contatos.filter(c => c.valor_estimado && c.valor_estimado > 0);
        return enriquecerEmpresaComMetricas({ ...data, negocios });
      }
    } catch { /* fallback abaixo */ }

    // Fallback local
    const lista = obterEmpresasLocal();
    const encontrada = lista.find(e => String(e.id) === String(id));
    if (encontrada) return enriquecerEmpresaComMetricas(encontrada);
    return null;
  }, [enriquecerEmpresaComMetricas]);

  const criar = useCallback(async (payload) => {
    const novoRegistro = {
      ...payload,
      id: payload.id || `emp-${Date.now()}`,
      tenant_id: usuario?.tenant_id || null,
      responsavel_id: payload.responsavel_id || usuario?.id || null,
      health_score: payload.health_score ?? 100,
      status: payload.status || 'prospect',
      endereco: payload.endereco || { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
      contatos: payload.contatos || [],
      negocios: payload.negocios || [],
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('crm_empresas')
        .insert({
          ...novoRegistro,
          id: undefined, // deixa o Supabase gerar UUID se tabela existir
        })
        .select()
        .single();

      if (!error && data) {
        const enriquecido = enriquecerEmpresaComMetricas(data);
        setEmpresas(prev => [enriquecido, ...prev]);
        return enriquecido;
      }
    } catch { /* fallback abaixo */ }

    // Fallback local
    const lista = obterEmpresasLocal();
    const atualizada = [novoRegistro, ...lista];
    salvarEmpresasLocal(atualizada);
    const enriquecido = enriquecerEmpresaComMetricas(novoRegistro);
    setEmpresas(prev => [enriquecido, ...prev]);
    return enriquecido;
  }, [usuario, enriquecerEmpresaComMetricas]);

  const atualizar = useCallback(async (id, payload) => {
    try {
      const { data, error } = await supabase
        .from('crm_empresas')
        .update({ ...payload, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const enriquecido = enriquecerEmpresaComMetricas(data);
        setEmpresas(prev => prev.map(e => e.id === id ? enriquecido : e));
        return enriquecido;
      }
    } catch { /* fallback abaixo */ }

    // Fallback local
    const lista = obterEmpresasLocal();
    const atualizada = lista.map(e => {
      if (String(e.id) === String(id)) {
        return { ...e, ...payload, atualizado_em: new Date().toISOString() };
      }
      return e;
    });
    salvarEmpresasLocal(atualizada);
    const itemAtualizado = atualizada.find(e => String(e.id) === String(id));
    const enriquecido = itemAtualizado ? enriquecerEmpresaComMetricas(itemAtualizado) : null;
    setEmpresas(prev => prev.map(e => String(e.id) === String(id) ? enriquecido : e));
    return enriquecido;
  }, [enriquecerEmpresaComMetricas]);

  const excluir = useCallback(async (id) => {
    try {
      await supabase.from('crm_empresas').delete().eq('id', id);
    } catch { /* segue com fallback */ }

    const lista = obterEmpresasLocal();
    const filtrada = lista.filter(e => String(e.id) !== String(id));
    salvarEmpresasLocal(filtrada);
    setEmpresas(prev => prev.filter(e => String(e.id) !== String(id)));
    return true;
  }, []);

  const vincularContato = useCallback(async (empresaId, contato) => {
    try {
      await supabase
        .from('crm_contatos')
        .update({
          empresa_id: empresaId,
          papel_decisao: contato.papel_decisao || 'influenciador',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', contato.id);
    } catch { /* fallback local */ }

    // Atualiza localmente
    const lista = obterEmpresasLocal();
    const atualizada = lista.map(e => {
      if (String(e.id) === String(empresaId)) {
        const contatosExistentes = e.contatos || [];
        const jaExiste = contatosExistentes.some(c => String(c.id) === String(contato.id));
        const novosContatos = jaExiste
          ? contatosExistentes.map(c => String(c.id) === String(contato.id) ? { ...c, ...contato } : c)
          : [...contatosExistentes, contato];
        return { ...e, contatos: novosContatos };
      }
      return e;
    });
    salvarEmpresasLocal(atualizada);
    setEmpresas(atualizada.map(enriquecerEmpresaComMetricas));
  }, [enriquecerEmpresaComMetricas]);

  const desvincularContato = useCallback(async (empresaId, contatoId) => {
    try {
      await supabase
        .from('crm_contatos')
        .update({ empresa_id: null, atualizado_em: new Date().toISOString() })
        .eq('id', contatoId);
    } catch { /* fallback local */ }

    const lista = obterEmpresasLocal();
    const atualizada = lista.map(e => {
      if (String(e.id) === String(empresaId)) {
        return {
          ...e,
          contatos: (e.contatos || []).filter(c => String(c.id) !== String(contatoId)),
        };
      }
      return e;
    });
    salvarEmpresasLocal(atualizada);
    setEmpresas(atualizada.map(enriquecerEmpresaComMetricas));
  }, [enriquecerEmpresaComMetricas]);

  return {
    empresas,
    carregando,
    erro,
    carregar,
    obterEmpresaPorId,
    criar,
    atualizar,
    excluir,
    vincularContato,
    desvincularContato,
  };
};
