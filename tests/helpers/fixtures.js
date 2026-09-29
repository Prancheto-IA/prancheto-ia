// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Fixture do tenant de teste
//
// O seed.sql do projeto cria um unico tenant (Acme) — nao existe segundo
// tenant em lugar nenhum do repositorio. Isolamento entre tenants nao e
// testavel com um tenant so, entao este arquivo cria um segundo tenant
// descartavel na hora que o suite roda, e apaga tudo no final.
//
// Importante: o proprio seed.sql aborta se encontrar, no banco, qualquer
// tenant que nao seja o dele (trava de seguranca contra rodar em
// producao). Por isso este fixture e efemero — criado em beforeAll,
// destruido em afterAll — e nunca fica parado no banco de dev.
// =============================================================

import { randomUUID } from 'node:crypto';
import { adminClient } from './client.js';

const SENHA_TESTE = 'teste-rls-2026-nao-usar-em-nada-real';

// Id fixo do tenant do seed (supabase/seed.sql) e a senha de todos os
// usuarios seedados — usados pelos testes que exercitam os 3 usuarios
// ja seedados (permissoes-cargo.test.js), alem das fixtures deste arquivo.
export const TENANT_ACME_ID = 'd0000000-0000-4000-8000-000000000001';
export const SENHA_SEED = 'prancheto-dev-2026';

const criarUsuario = async (admin, { email, cargo, tenantId }) => {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: SENHA_TESTE,
    email_confirm: true,
    user_metadata: {
      nome: email.split('@')[0],
      cargo,
      tenant_id: tenantId, // handle_new_user() le esta chave para popular public.users
    },
  });
  if (error) throw new Error(`Falha ao criar usuario de teste ${email}: ${error.message}`);

  // handle_new_user() so marca ativo=true quando tenant_id vem preenchido
  // nos metadados (criacao "via admin"). O super_admin de teste não tem
  // tenant — força ativo aqui para não depender dessa regra colateral.
  const { error: erroAtivo } = await admin.from('users').update({ ativo: true }).eq('id', data.user.id);
  if (erroAtivo) throw new Error(`Falha ao ativar usuario de teste ${email}: ${erroAtivo.message}`);

  return data.user.id;
};

/**
 * Cria um tenant descartavel com 2 usuarios (admin e membro) presos a ele,
 * mais 1 super_admin avulso (sem tenant), e uma linha em cada uma das
 * tabelas Tier-1 cobertas por tenant-isolation.test.js — para o tenant
 * original (Acme) tentar (e falhar) acessar.
 *
 * @returns {Promise<object>} tudo que os testes precisam: ids do tenant,
 *   dos usuarios, credenciais de login, e os ids das linhas plantadas.
 */
export async function criarTenantTeste() {
  const admin = adminClient();
  const tenantId = randomUUID();
  const sufixo = tenantId.slice(0, 8);

  const { error: erroTenant } = await admin.from('tenants').insert({
    id: tenantId,
    nome: 'Tenant Teste RLS (efemero)',
    slug: `tenant-teste-rls-${sufixo}`,
    plano: 'starter',
    status: 'ativo',
  });
  if (erroTenant) throw new Error(`Falha ao criar tenant de teste: ${erroTenant.message}`);

  const emailAdmin = `tenant-b-admin-${sufixo}@teste.dev`;
  const emailMembro = `tenant-b-membro-${sufixo}@teste.dev`;
  const emailSuperAdmin = `qa-super-admin-${sufixo}@teste.dev`;

  const adminId = await criarUsuario(admin, { email: emailAdmin, cargo: 'admin', tenantId });
  const membroId = await criarUsuario(admin, { email: emailMembro, cargo: 'member', tenantId });
  const superAdminId = await criarUsuario(admin, { email: emailSuperAdmin, cargo: 'super_admin', tenantId: null });

  const marca = `TENANT-TESTE-${sufixo}-NAO-DEVE-VAZAR`;

  const { data: contato, error: erroContato } = await admin
    .from('crm_contatos')
    .insert({ tenant_id: tenantId, nome: marca, responsavel_id: adminId })
    .select('id').single();
  if (erroContato) throw new Error(`Falha ao plantar crm_contatos: ${erroContato.message}`);

  const { data: tarefa, error: erroTarefa } = await admin
    .from('tarefas')
    .insert({ tenant_id: tenantId, titulo: marca, criado_por: adminId })
    .select('id').single();
  if (erroTarefa) throw new Error(`Falha ao plantar tarefas: ${erroTarefa.message}`);

  const { data: projeto, error: erroProjeto } = await admin
    .from('projetos')
    .insert({ tenant_id: tenantId, nome: marca, criado_por: adminId })
    .select('id').single();
  if (erroProjeto) throw new Error(`Falha ao plantar projetos: ${erroProjeto.message}`);

  const { data: evento, error: erroEvento } = await admin
    .from('agenda_eventos')
    .insert({
      tenant_id: tenantId, criado_por: adminId, titulo: marca,
      data_inicio: new Date().toISOString(),
    })
    .select('id').single();
  if (erroEvento) throw new Error(`Falha ao plantar agenda_eventos: ${erroEvento.message}`);

  const { data: outbound, error: erroOutbound } = await admin
    .from('outbound_acoes')
    .insert({ tenant_id: tenantId, user_id: adminId, contato_nome: marca })
    .select('id').single();
  if (erroOutbound) throw new Error(`Falha ao plantar outbound_acoes: ${erroOutbound.message}`);

  const { data: ticket, error: erroTicket } = await admin
    .from('suporte_tickets')
    .insert({ tenant_id: tenantId, assunto: marca, criado_por: adminId })
    .select('id').single();
  if (erroTicket) throw new Error(`Falha ao plantar suporte_tickets: ${erroTicket.message}`);

  return {
    tenantId,
    marca,
    admin: { id: adminId, email: emailAdmin, senha: SENHA_TESTE },
    membro: { id: membroId, email: emailMembro, senha: SENHA_TESTE },
    superAdmin: { id: superAdminId, email: emailSuperAdmin, senha: SENHA_TESTE },
    linhas: {
      crm_contatos: contato.id,
      tarefas: tarefa.id,
      projetos: projeto.id,
      agenda_eventos: evento.id,
      outbound_acoes: outbound.id,
      suporte_tickets: ticket.id,
    },
  };
}

/**
 * Fixture leve para testes que so precisam de um super_admin (papel global,
 * sem tenant) — nao vale criar um tenant inteiro so pra isso.
 */
export async function criarSuperAdminTeste() {
  const admin = adminClient();
  const email = `qa-super-admin-solo-${randomUUID().slice(0, 8)}@teste.dev`;
  const id = await criarUsuario(admin, { email, cargo: 'super_admin', tenantId: null });
  return { id, email, senha: SENHA_TESTE };
}

export async function destruirSuperAdminTeste(usuario) {
  const admin = adminClient();
  await admin.from('users').delete().eq('id', usuario.id);
  const { error } = await admin.auth.admin.deleteUser(usuario.id);
  if (error) throw new Error(`Falha ao apagar super_admin de teste: ${error.message}`);
}

/**
 * Desfaz tudo que criarTenantTeste() criou. Ordem importa: não há FK de
 * auth.users para public.users neste schema (confirmado na migration
 * baseline), então apagar o usuario de auth NAO cascade sobre a linha de
 * public.users — apaga-se a linha de public.users primeiro, explicitamente,
 * depois o usuario de auth, depois o tenant (que cascade sobre o resto:
 * crm_contatos/tarefas/projetos/agenda_eventos/outbound_acoes/suporte_tickets
 * tem FK ON DELETE CASCADE para tenants).
 */
export async function destruirTenantTeste(fixture) {
  const admin = adminClient();
  const idsUsuarios = [fixture.admin.id, fixture.membro.id, fixture.superAdmin.id];

  await admin.from('users').delete().in('id', idsUsuarios);

  for (const id of idsUsuarios) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(`Falha ao apagar usuario de auth ${id}: ${error.message}`);
  }

  const { error: erroTenant } = await admin.from('tenants').delete().eq('id', fixture.tenantId);
  if (erroTenant) throw new Error(`Falha ao apagar tenant de teste: ${erroTenant.message}`);
}

/**
 * Cria, dentro do tenant Acme (seed), cargos e usuarios descartaveis para
 * exercitar a regra de subconjunto de permissoes que substituiu o nivel
 * hierarquico (migration 20260929020000_remove_hierarquia_nivel_cargos.sql).
 * Necessario porque nenhum dos 3 usuarios do seed serve para isso: so
 * admin@acme.dev tem cargos.gerenciar/usuarios.gerenciar, e o conjunto dele
 * e superconjunto de todo mundo — nao da pra testar negacao por
 * subconjunto com um unico usuario "poderoso".
 *
 *   cargos.baseId:      usuarios.gerenciar + cargos.gerenciar + crm.ver
 *   cargos.amploId:     baseId + crm.criar + crm.editar (superconjunto estrito)
 *   cargos.peerId:      as mesmas permissoes de baseId (par — nem mais, nem menos)
 *   cargos.alvoEdicaoId: so crm.ver, sem usuario vinculado (alvo de UPDATE)
 *   modesto/amplo/peer: usuarios vinculados aos cargos acima
 *   dono:               e_dono_tenant = true, sem cargo — alvo dos testes de
 *                       protecao do Chefe Supremo
 */
export async function criarFixtureSubconjuntoPermissoes() {
  const admin = adminClient();
  const sufixo = randomUUID().slice(0, 8);

  const criarCargo = async (permissoes) => {
    const { data, error } = await admin
      .from('org_cargos')
      .insert({
        tenant_id: TENANT_ACME_ID,
        nome: `qa-subconjunto-${randomUUID().slice(0, 8)}`,
        permissoes,
        ordem: 999,
      })
      .select('id').single();
    if (error) throw new Error(`Falha ao criar cargo de teste (subconjunto): ${error.message}`);
    return data.id;
  };

  const cargoBaseId       = await criarCargo(['usuarios.gerenciar', 'cargos.gerenciar', 'crm.ver']);
  const cargoAmploId      = await criarCargo(['usuarios.gerenciar', 'cargos.gerenciar', 'crm.ver', 'crm.criar', 'crm.editar']);
  const cargoPeerId       = await criarCargo(['usuarios.gerenciar', 'cargos.gerenciar', 'crm.ver']);
  const cargoAlvoEdicaoId = await criarCargo(['crm.ver']);

  const emailModesto = `qa-modesto-${sufixo}@teste.dev`;
  const emailAmplo   = `qa-amplo-${sufixo}@teste.dev`;
  const emailPeer    = `qa-peer-${sufixo}@teste.dev`;
  const emailDono    = `qa-dono-${sufixo}@teste.dev`;

  const userModestoId = await criarUsuario(admin, { email: emailModesto, cargo: 'member', tenantId: TENANT_ACME_ID });
  const userAmploId   = await criarUsuario(admin, { email: emailAmplo,   cargo: 'member', tenantId: TENANT_ACME_ID });
  const userPeerId    = await criarUsuario(admin, { email: emailPeer,    cargo: 'member', tenantId: TENANT_ACME_ID });
  const userDonoId    = await criarUsuario(admin, { email: emailDono,    cargo: 'member', tenantId: TENANT_ACME_ID });

  const vincular = async (userId, patch) => {
    const { error } = await admin.from('users').update(patch).eq('id', userId);
    if (error) throw new Error(`Falha ao configurar usuario de teste (subconjunto) ${userId}: ${error.message}`);
  };
  await vincular(userModestoId, { cargo_id: cargoBaseId });
  await vincular(userAmploId,   { cargo_id: cargoAmploId });
  await vincular(userPeerId,    { cargo_id: cargoPeerId });
  await vincular(userDonoId,    { e_dono_tenant: true });

  return {
    cargos: { baseId: cargoBaseId, amploId: cargoAmploId, peerId: cargoPeerId, alvoEdicaoId: cargoAlvoEdicaoId },
    modesto: { id: userModestoId, email: emailModesto, senha: SENHA_TESTE },
    amplo:   { id: userAmploId,   email: emailAmplo,   senha: SENHA_TESTE },
    peer:    { id: userPeerId,    email: emailPeer,    senha: SENHA_TESTE },
    dono:    { id: userDonoId,    email: emailDono,    senha: SENHA_TESTE },
  };
}

/** Desfaz tudo que criarFixtureSubconjuntoPermissoes() criou. */
export async function destruirFixtureSubconjuntoPermissoes(fixture) {
  const admin = adminClient();
  const idsUsuarios = [fixture.modesto.id, fixture.amplo.id, fixture.peer.id, fixture.dono.id];

  await admin.from('users').delete().in('id', idsUsuarios);
  for (const id of idsUsuarios) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(`Falha ao apagar usuario de teste (subconjunto) ${id}: ${error.message}`);
  }

  const idsCargos = [fixture.cargos.baseId, fixture.cargos.amploId, fixture.cargos.peerId, fixture.cargos.alvoEdicaoId];
  const { error: erroCargos } = await admin.from('org_cargos').delete().in('id', idsCargos);
  if (erroCargos) throw new Error(`Falha ao apagar cargos de teste (subconjunto): ${erroCargos.message}`);
}
