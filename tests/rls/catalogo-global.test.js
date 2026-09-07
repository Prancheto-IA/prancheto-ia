// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Catálogo global (planos, recursos_plano)
//
// planos e recursos_plano são as duas exceções deliberadas ao isolamento
// por tenant: são o catálogo de produto, igual para todo mundo. Leitura
// deve ser livre para qualquer autenticado; escrita, só super_admin.
//
// O banco de dev não tem nenhum plano cadastrado hoje (tabela vazia — não
// é bug, só não foi populada). recursos_plano depende de um plano_id
// válido para qualquer insert, então este arquivo planta um plano
// descartável via service_role antes dos testes de recursos_plano, e
// apaga no final — sem depender de dado nenhum já existir no banco.
// =============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loginAs, adminClient } from '../helpers/client.js';
import { criarSuperAdminTeste, destruirSuperAdminTeste } from '../helpers/fixtures.js';

const SENHA_SEED = 'prancheto-dev-2026';

describe.each(['planos', 'recursos_plano'])('Catálogo global: %s', (tabela) => {
  let superAdminFixture;
  let comoSuperAdmin;
  let comoAdminTenant;
  let planoDescartavelId;

  beforeAll(async () => {
    superAdminFixture = await criarSuperAdminTeste();
    comoSuperAdmin = await loginAs(superAdminFixture.email, superAdminFixture.senha);
    comoAdminTenant = await loginAs('admin@acme.dev', SENHA_SEED);

    if (tabela === 'recursos_plano') {
      const admin = adminClient();
      const { data, error } = await admin
        .from('planos')
        .insert({ slug: `plano-descartavel-teste-${Date.now()}`, nome: 'Plano Descartável de Teste' })
        .select('id').single();
      if (error) throw new Error(`Falha ao plantar plano descartável: ${error.message}`);
      planoDescartavelId = data.id;
    }
  });

  afterAll(async () => {
    await destruirSuperAdminTeste(superAdminFixture);
    if (planoDescartavelId) {
      const admin = adminClient();
      await admin.from('planos').delete().eq('id', planoDescartavelId);
    }
  });

  it('qualquer usuário autenticado consegue ler', async () => {
    const { data, error } = await comoAdminTenant.from(tabela).select('id').limit(1);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('admin de tenant (não super_admin) não consegue escrever', async () => {
    const payload = tabela === 'planos'
      ? { slug: `descartavel-teste-${Date.now()}`, nome: 'Descartável' }
      : { plano_id: planoDescartavelId, slug: `descartavel-teste-${Date.now()}`, nome: 'Descartável' };

    const { error } = await comoAdminTenant.from(tabela).insert(payload);
    expect(error).not.toBeNull();
  });

  it('super_admin consegue escrever', async () => {
    const payload = tabela === 'planos'
      ? { slug: `descartavel-teste-${Date.now()}`, nome: 'Descartável (super_admin)' }
      : { plano_id: planoDescartavelId, slug: `descartavel-teste-${Date.now()}`, nome: 'Descartável (super_admin)' };

    const { data, error } = await comoSuperAdmin.from(tabela).insert(payload).select('id').single();
    expect(error).toBeNull();

    await comoSuperAdmin.from(tabela).delete().eq('id', data.id);
  });
});
