// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Criação de usuário respeita o tenant do chamador
//
// A Edge Function tenant-usuarios (criação de usuário pelo próprio cliente,
// não super_admin) nunca deve deixar o tenant do novo usuário vir do
// payload da requisição — o servidor deriva isso do perfil autenticado de
// quem chama (chamador.tenant_id), sempre. Este teste simula exatamente o
// ataque/bug relatado: forjar um tenant_id de outra empresa (ou de uma
// "empresa padrão" qualquer) no corpo da requisição e confirmar que o
// usuário criado cai, mesmo assim, no tenant de quem criou.
// =============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loginAs, adminClient } from '../helpers/client.js';
import {
  criarTenantComDono, destruirTenantComDono,
  criarTenantVazio, destruirTenantVazio,
} from '../helpers/fixtures.js';

const SENHA_TESTE = 'teste-rls-2026-nao-usar-em-nada-real';

describe('tenant-usuarios: tenant do novo usuário nunca vem do payload', () => {
  let tenantA;
  let tenantB;
  let tenantPadrao;
  let comoDonoA;
  const emailsCriados = [];

  beforeAll(async () => {
    tenantA = await criarTenantComDono({ nome: 'Empresa A (teste RLS)' });
    tenantB = await criarTenantVazio({ nome: 'Empresa B (teste RLS)' });
    tenantPadrao = await criarTenantVazio({ nome: 'Empresa Padrão (teste RLS)' });
    comoDonoA = await loginAs(tenantA.dono.email, tenantA.dono.senha);
  });

  afterAll(async () => {
    const admin = adminClient();
    if (emailsCriados.length) {
      const { data } = await admin.from('users').select('id, email').in('email', emailsCriados);
      for (const u of data ?? []) {
        await admin.from('users').delete().eq('id', u.id);
        await admin.auth.admin.deleteUser(u.id);
      }
    }
    await destruirTenantComDono(tenantA);
    await destruirTenantVazio(tenantB);
    await destruirTenantVazio(tenantPadrao);
  });

  it.each([
    ['empresa B', () => tenantB.tenantId],
    ['empresa padrão', () => tenantPadrao.tenantId],
  ])('usuário da empresa A não consegue criar usuário na %s forjando tenant_id no payload', async (_label, tenantAlvoId) => {
    const alvo = tenantAlvoId();
    const email = `forjado-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@teste.dev`;
    emailsCriados.push(email);

    const { data, error } = await comoDonoA.functions.invoke('tenant-usuarios', {
      body: {
        action: 'create',
        payload: {
          nome: 'Usuário Forjado',
          email,
          senha: SENHA_TESTE,
          tenantId: alvo,
          tenant_id: alvo,
        },
      },
    });

    expect(error).toBeNull();
    expect(data?.error).toBeUndefined();

    const admin = adminClient();
    const { data: criado, error: erroBusca } = await admin
      .from('users')
      .select('tenant_id')
      .eq('email', email)
      .single();
    expect(erroBusca).toBeNull();
    expect(criado.tenant_id).toBe(tenantA.tenantId);
  });
});
