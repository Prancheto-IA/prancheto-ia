// =============================================================
// PRANCHETO.IA - HOOK DE ORGANIZAÇÃO
// Gerencia cargos, times e membros via Supabase client direto.
// Todas as operações são isoladas por tenant_id (RLS garante isso).
// =============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';

// ----------------------------------------------------------
// LISTA COMPLETA DE PERMISSÕES DISPONÍVEIS
// Usada para montar o editor de permissões dos cargos
// ----------------------------------------------------------
export const PERMISSOES_DISPONIVEIS = [
  // CRM
  { slug: 'crm.ver',     label: 'Ver contatos',      grupo: 'CRM' },
  { slug: 'crm.criar',   label: 'Criar contatos',     grupo: 'CRM' },
  { slug: 'crm.editar',  label: 'Editar contatos',    grupo: 'CRM' },
  { slug: 'crm.excluir', label: 'Excluir contatos',   grupo: 'CRM' },
  // Agenda
  { slug: 'agenda.ver',     label: 'Ver eventos',     grupo: 'Agenda' },
  { slug: 'agenda.criar',   label: 'Criar eventos',   grupo: 'Agenda' },
  { slug: 'agenda.editar',  label: 'Editar eventos',  grupo: 'Agenda' },
  { slug: 'agenda.excluir', label: 'Excluir eventos', grupo: 'Agenda' },
  // Outbound
  { slug: 'outbound.ver',     label: 'Ver ações',     grupo: 'Outbound' },
  { slug: 'outbound.criar',   label: 'Criar ações',   grupo: 'Outbound' },
  { slug: 'outbound.editar',  label: 'Editar ações',  grupo: 'Outbound' },
  { slug: 'outbound.excluir', label: 'Excluir ações', grupo: 'Outbound' },
  // Relatórios
  { slug: 'relatorios.ver',      label: 'Ver relatórios',      grupo: 'Relatórios' },
  { slug: 'relatorios.exportar', label: 'Exportar relatórios', grupo: 'Relatórios' },
  // Chat IA
  { slug: 'chat_ia.usar',   label: 'Usar Chat com IA',   grupo: 'Chat IA' },
  // Organização
  { slug: 'org.ver',          label: 'Ver organização',       grupo: 'Organização' },
  { slug: 'org.gerenciar',    label: 'Gerenciar times',       grupo: 'Organização' },
  { slug: 'org.cargos',       label: 'Gerenciar cargos',      grupo: 'Organização' },
  { slug: 'org.identidade',   label: 'Editar identidade visual', grupo: 'Organização' },
  // Configurações
  { slug: 'config.ver',    label: 'Ver configurações',    grupo: 'Configurações' },
  { slug: 'config.editar', label: 'Editar configurações', grupo: 'Configurações' },
  // Planos
  { slug: 'planos.ver',    label: 'Ver planos',    grupo: 'Planos' },
  { slug: 'planos.editar', label: 'Gerenciar planos', grupo: 'Planos' },
];

// Agrupa permissões por grupo para exibição no editor
export const PERMISSOES_POR_GRUPO = PERMISSOES_DISPONIVEIS.reduce((acc, p) => {
  if (!acc[p.grupo]) acc[p.grupo] = [];
  acc[p.grupo].push(p);
  return acc;
}, {});

// ----------------------------------------------------------
// HOOK PRINCIPAL
// ----------------------------------------------------------
export const useOrg = () => {
  const { usuario } = useAuthStore();
  const tenantId = usuario?.tenantId;

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]             = useState(null);

  // ========================================================
  // CARGOS
  // ========================================================

  /** Lista todos os cargos do tenant */
  const listarCargos = useCallback(async () => {
    if (!tenantId) return [];
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('org_cargos')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('ordem', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      setErro(err.message);
      return [];
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  /** Cria um novo cargo */
  const criarCargo = useCallback(async ({ nome, descricao, permissoes = [], ordem = 99 }) => {
    if (!tenantId) throw new Error('Tenant não identificado');
    const { data, error } = await supabase
      .from('org_cargos')
      .insert({
        tenant_id:  tenantId,
        nome,
        descricao,
        permissoes,
        ordem,
        e_padrao:   false,
        e_sistema:  false,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [tenantId]);

  /** Atualiza um cargo existente (não permite alterar e_sistema) */
  const atualizarCargo = useCallback(async (id, { nome, descricao, permissoes, ordem }) => {
    const payload = {};
    if (nome        !== undefined) payload.nome        = nome;
    if (descricao   !== undefined) payload.descricao   = descricao;
    if (permissoes  !== undefined) payload.permissoes  = permissoes;
    if (ordem       !== undefined) payload.ordem       = ordem;
    payload.atualizado_em = new Date().toISOString();

    const { data, error } = await supabase
      .from('org_cargos')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [tenantId]);

  /** Exclui um cargo (apenas se e_sistema = false) */
  const excluirCargo = useCallback(async (id) => {
    const { error } = await supabase
      .from('org_cargos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .eq('e_sistema', false); // proteção extra
    if (error) throw error;
  }, [tenantId]);

  // ========================================================
  // TIMES
  // ========================================================

  /** Lista todos os times do tenant com contagem de membros */
  const listarTimes = useCallback(async () => {
    if (!tenantId) return [];
    setCarregando(true);
    setErro(null);
    try {
      const { data, error } = await supabase
        .from('org_times')
        .select(`
          *,
          membros:org_time_membros(
            id,
            cargo_id,
            criado_em,
            usuario:users(id, nome, email, cargo)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('criado_em', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      setErro(err.message);
      return [];
    } finally {
      setCarregando(false);
    }
  }, [tenantId]);

  /** Cria um novo time */
  const criarTime = useCallback(async ({ nome, descricao, icone = '👥', cor_primaria = '#6366f1', cor_texto = '#ffffff' }) => {
    if (!tenantId) throw new Error('Tenant não identificado');
    const { data, error } = await supabase
      .from('org_times')
      .insert({
        tenant_id:   tenantId,
        nome,
        descricao,
        icone,
        cor_primaria,
        cor_texto,
        criado_por:  usuario?.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [tenantId, usuario?.id]);

  /** Atualiza um time */
  const atualizarTime = useCallback(async (id, { nome, descricao, icone, cor_primaria, cor_texto }) => {
    const payload = { atualizado_em: new Date().toISOString() };
    if (nome        !== undefined) payload.nome        = nome;
    if (descricao   !== undefined) payload.descricao   = descricao;
    if (icone       !== undefined) payload.icone       = icone;
    if (cor_primaria !== undefined) payload.cor_primaria = cor_primaria;
    if (cor_texto   !== undefined) payload.cor_texto   = cor_texto;

    const { data, error } = await supabase
      .from('org_times')
      .update(payload)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [tenantId]);

  /** Exclui um time (membros são removidos em cascata pelo DB) */
  const excluirTime = useCallback(async (id) => {
    const { error } = await supabase
      .from('org_times')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }, [tenantId]);

  // ========================================================
  // MEMBROS DE TIME
  // ========================================================

  /** Adiciona um usuário a um time */
  const adicionarMembro = useCallback(async (timeId, userId, cargoId = null) => {
    const { data, error } = await supabase
      .from('org_time_membros')
      .insert({ time_id: timeId, user_id: userId, cargo_id: cargoId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }, []);

  /** Remove um usuário de um time */
  const removerMembro = useCallback(async (timeId, userId) => {
    const { error } = await supabase
      .from('org_time_membros')
      .delete()
      .eq('time_id', timeId)
      .eq('user_id', userId);
    if (error) throw error;
  }, []);

  /** Lista todos os usuários do tenant (para adicionar como membros) */
  const listarUsuariosTenant = useCallback(async () => {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email, cargo, cargo_id, ativo')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .order('nome', { ascending: true });
    if (error) throw error;
    return data || [];
  }, [tenantId]);

  // ========================================================
  // IDENTIDADE VISUAL DO TENANT
  // ========================================================

  /** Busca os dados do tenant (logo + identidade visual) */
  const buscarTenant = useCallback(async () => {
    if (!tenantId) return null;
    const { data, error } = await supabase
      .from('tenants')
      .select('id, nome, logo_url, identidade_visual, plano')
      .eq('id', tenantId)
      .single();
    if (error) throw error;
    return data;
  }, [tenantId]);

  /** Atualiza a identidade visual do tenant */
  const atualizarIdentidadeVisual = useCallback(async ({ logo_url, identidade_visual }) => {
    if (!tenantId) throw new Error('Tenant não identificado');
    const payload = { atualizado_em: new Date().toISOString() };
    if (logo_url           !== undefined) payload.logo_url           = logo_url;
    if (identidade_visual  !== undefined) payload.identidade_visual  = identidade_visual;

    const { data, error } = await supabase
      .from('tenants')
      .update(payload)
      .eq('id', tenantId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }, [tenantId]);

  return {
    carregando,
    erro,
    // Cargos
    listarCargos,
    criarCargo,
    atualizarCargo,
    excluirCargo,
    // Times
    listarTimes,
    criarTime,
    atualizarTime,
    excluirTime,
    // Membros
    adicionarMembro,
    removerMembro,
    listarUsuariosTenant,
    // Identidade visual
    buscarTenant,
    atualizarIdentidadeVisual,
  };
};
