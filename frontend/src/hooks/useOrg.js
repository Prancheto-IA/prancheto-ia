// =============================================================
// PRANCHETO.IA - HOOK DE ORGANIZAÇÃO
// Gerencia cargos, times e membros via Supabase client direto.
// Todas as operações são isoladas por tenant_id (RLS garante isso).
// =============================================================

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuthStore } from '../store/authStore.js';
import { COLUNAS_TENANT } from '../store/tenantStore.js';

// ----------------------------------------------------------
// CATÁLOGO DE PERMISSÕES
//
// Fonte única da verdade: estes slugs são os mesmos gravados em
// org_cargos.permissoes. Editor de cargos e verificação em tela
// leem daqui — se divergirem, a permissão vira decoração.
//
// Historicamente havia duas listas incompatíveis: a do seed no banco
// (times.*, usuarios.*, cargos.*, configuracoes.*) e a desta tela
// (org.*, config.*). Só 13 dos slugs coincidiam, e os 9 que existiam
// apenas no banco ficavam invisíveis para o admin. Prevaleceu o
// vocabulário do banco, para não reescrever dados de produção.
//
// São exatamente os 22 slugs presentes nos dados. Um slug que ninguém
// possui esconderia o recurso de todo mundo, já que a verificação passou
// a ser real — foi o que quase aconteceu ao inventar 'identidade.editar'
// para uma tela que hoje qualquer administrador edita.
//
// Ao criar uma permissão nova, faça as três coisas na mesma mudança:
// acrescente o slug aqui, use-o no <PermissaoGuarda> da tela, e conceda-o
// aos cargos existentes por migration. Sem o terceiro passo, a
// funcionalidade some para quem já a tinha.
// ----------------------------------------------------------
export const PERMISSOES_DISPONIVEIS = [
  // CRM
  { slug: 'crm.ver',     label: 'Ver contatos',    grupo: 'CRM' },
  { slug: 'crm.criar',   label: 'Criar contatos',  grupo: 'CRM' },
  { slug: 'crm.editar',  label: 'Editar contatos', grupo: 'CRM' },
  { slug: 'crm.excluir', label: 'Excluir contatos', grupo: 'CRM' },
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
  { slug: 'relatorios.ver', label: 'Ver relatórios', grupo: 'Relatórios' },
  // Times
  { slug: 'times.ver',       label: 'Ver times',       grupo: 'Times' },
  { slug: 'times.gerenciar', label: 'Gerenciar times', grupo: 'Times' },
  // Usuários
  { slug: 'usuarios.ver',       label: 'Ver usuários',       grupo: 'Usuários' },
  { slug: 'usuarios.convidar',  label: 'Convidar usuários',  grupo: 'Usuários' },
  { slug: 'usuarios.gerenciar', label: 'Gerenciar usuários', grupo: 'Usuários' },
  // Cargos
  { slug: 'cargos.ver',       label: 'Ver cargos',       grupo: 'Cargos' },
  { slug: 'cargos.gerenciar', label: 'Gerenciar cargos', grupo: 'Cargos' },
  // Configurações (inclui a identidade visual da organização)
  { slug: 'configuracoes.ver',    label: 'Ver configurações',    grupo: 'Configurações' },
  { slug: 'configuracoes.editar', label: 'Editar configurações', grupo: 'Configurações' },
  // Perfil próprio
  //
  // Liberada por padrão: a migration que criou o slug concedeu-o a todos
  // os cargos existentes, e quem não tem cargo organizacional já passa
  // pelo "sem lista, libera" de temPermissao(). O chefe da empresa pode
  // desmarcá-la para restringir cargos específicos.
  { slug: 'perfil.editar_proprio', label: 'Editar os próprios dados', grupo: 'Perfil', padrao: true },
];

/** Conjunto de slugs conhecidos, para detectar permissões fora do catálogo. */
export const SLUGS_CONHECIDOS = new Set(PERMISSOES_DISPONIVEIS.map(p => p.slug));

/**
 * Permissões que um cargo já nasce tendo.
 *
 * Marcar 'padrao' no catálogo não basta para o cargo criado depois: a coluna
 * org_cargos.permissoes é NOT NULL DEFAULT '[]', então um cargo salvo sem
 * nada marcado nega tudo, item liberado por padrão inclusive. O "sem lista,
 * libera" de temPermissao() não cobre esse caso — vale só para quem não tem
 * cargo algum, e um array vazio é uma lista.
 *
 * Marcar aqui é o que faz a promessa "o padrão é permitir" valer para o
 * cargo que o chefe criar amanhã, sem tirar dele a opção de desmarcar.
 */
export const PERMISSOES_PADRAO_CARGO_NOVO = PERMISSOES_DISPONIVEIS
  .filter(p => p.padrao)
  .map(p => p.slug);

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
  // O store guarda a linha de 'users' como ela vem do banco, então o campo
  // é tenant_id. Ler 'tenantId' aqui devolvia undefined e derrubava a tela
  // de Organização inteira: criar time e cargo lançavam "Tenant não
  // identificado", e as listagens voltavam vazias.
  const tenantId = usuario?.tenant_id;

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
  const criarCargo = useCallback(async ({ nome, descricao, permissoes = PERMISSOES_PADRAO_CARGO_NOVO, ordem = 99 }) => {
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

  /**
   * Atualiza logo e identidade visual do tenant.
   * Devolve a linha atualizada com as mesmas colunas do tenantStore, para
   * que a tela possa alimentá-lo sem uma segunda consulta.
   */
  const atualizarIdentidadeVisual = useCallback(async ({ logo_url, identidade_visual }) => {
    if (!tenantId) throw new Error('Tenant não identificado');
    const payload = { atualizado_em: new Date().toISOString() };
    if (logo_url           !== undefined) payload.logo_url           = logo_url;
    if (identidade_visual  !== undefined) payload.identidade_visual  = identidade_visual;

    const { data, error } = await supabase
      .from('tenants')
      .update(payload)
      .eq('id', tenantId)
      .select(COLUNAS_TENANT)
      .maybeSingle();
    if (error) throw error;
    // Sem permissão, o RLS filtra a linha em silêncio e o UPDATE não alcança
    // nada. maybeSingle() em vez de single() para transformar isso em uma
    // mensagem legível, e não no erro de coerção do PostgREST.
    if (!data) throw new Error('Você não tem permissão para alterar a identidade visual desta organização.');
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
    atualizarIdentidadeVisual,
  };
};
