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
