// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Isolamento entre tenants
//
// Cria um segundo tenant descartavel (fixture) e confirma que o tenant
// original do seed (Acme) nunca consegue ver, alterar ou apagar dados do
// outro tenant, mesmo tentando pelo id direto — e que forcar um insert com
// o tenant_id de outro tenant e rejeitado, nao silenciosamente ignorado.
//
// Cobertura: as tabelas de maior risco/uso (ver plano). Tabelas-filhas que
// so herdam isolamento via join com estas (crm_documentos, tarefa_checklist
// etc.) ficam fora desta rodada — documentado, nao esquecido.
// =============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loginAs } from '../helpers/client.js';
import { criarTenantTeste, destruirTenantTeste } from '../helpers/fixtures.js';

// Id fixo do tenant do seed (supabase/seed.sql) — nunca muda entre execucoes.
const TENANT_ACME_ID = 'd0000000-0000-4000-8000-000000000001';

const TABELAS = ['crm_contatos', 'tarefas', 'projetos', 'agenda_eventos', 'outbound_acoes', 'suporte_tickets'];

describe('Isolamento entre tenants (RLS)', () => {
  let fixture;
  let comoAdminAcme;
  let comoSuperAdmin;

  beforeAll(async () => {
    fixture = await criarTenantTeste();
    comoAdminAcme = await loginAs('admin@acme.dev', 'prancheto-dev-2026');
    comoSuperAdmin = await loginAs(fixture.superAdmin.email, fixture.superAdmin.senha);
  });

  afterAll(async () => {
    await destruirTenantTeste(fixture);
  });

  it.each(TABELAS)('tenant Acme não vê a linha de %s do outro tenant via SELECT', async (tabela) => {
    const rowId = fixture.linhas[tabela];
    const { data, error } = await comoAdminAcme.from(tabela).select('id').eq('id', rowId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it.each(TABELAS)('tenant Acme não consegue UPDATE na linha de %s do outro tenant', async (tabela) => {
    const rowId = fixture.linhas[tabela];
    const { data } = await comoAdminAcme.from(tabela).update({ atualizado_em: new Date().toISOString() }).eq('id', rowId).select();
    // RLS filtra a linha do USING antes do update rodar: 0 linhas afetadas,
    // sem erro — não é "acesso negado com erro", é "essa linha não existe pra você".
    expect(data).toEqual([]);
  });

  it.each(TABELAS)('tenant Acme não consegue DELETE na linha de %s do outro tenant', async (tabela) => {
    const rowId = fixture.linhas[tabela];
    const { data } = await comoAdminAcme.from(tabela).delete().eq('id', rowId).select();
    expect(data).toEqual([]);
  });

  it('tenant Acme não consegue INSERT forjando o tenant_id de outro tenant (crm_contatos)', async () => {
    const { error } = await comoAdminAcme
      .from('crm_contatos')
      .insert({ tenant_id: fixture.tenantId, nome: 'tentativa-de-insert-cross-tenant' });
    expect(error).not.toBeNull();
  });

  it('tenant Acme não consegue INSERT forjando o tenant_id de outro tenant (tarefas)', async () => {
    const { error } = await comoAdminAcme
      .from('tarefas')
      .insert({ tenant_id: fixture.tenantId, titulo: 'tentativa-de-insert-cross-tenant' });
    expect(error).not.toBeNull();
  });

  it('super_admin vê tenants dos dois lados (bypass funcionando)', async () => {
    const { data, error } = await comoSuperAdmin
      .from('tenants')
      .select('id')
      .in('id', [TENANT_ACME_ID, fixture.tenantId]);
    expect(error).toBeNull();
    const idsEncontrados = (data ?? []).map((t) => t.id).sort();
    expect(idsEncontrados).toEqual([TENANT_ACME_ID, fixture.tenantId].sort());
  });
});
