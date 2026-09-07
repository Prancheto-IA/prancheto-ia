// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Auto-edição de usuário
//
// A policy user_update_self, por si só, deixaria qualquer usuário
// reescrever seu próprio cargo/tenant_id (escalação de privilégio). Quem
// impede isso é o trigger trigger_users_protege_auto_edicao — RLS não tem
// granularidade de coluna, então a proteção fina é via trigger, não via
// policy. Este teste existe porque é exatamente o tipo de proteção que
// "parece" existir (a policy trabalha) mas pode estar silenciosamente
// quebrada se o trigger não estiver instalado/atualizado.
//
// Usa membro@acme.dev (seed) e sempre devolve o dado ao estado original.
// =============================================================

import { describe, it, expect, afterAll } from 'vitest';
import { loginAs, adminClient } from '../helpers/client.js';

const MEMBRO_ID = 'a0000000-0000-4000-8000-000000000003';
const SENHA_SEED = 'prancheto-dev-2026';

describe('Auto-edição de usuário (trigger_users_protege_auto_edicao)', () => {
  afterAll(async () => {
    // Garantia final, mesmo se algum teste falhar no meio: devolve o
    // membro exatamente ao estado do seed.
    const admin = adminClient();
    await admin.from('users').update({ nome: 'Carla Rodrigues', telefone: null }).eq('id', MEMBRO_ID);
  });

  it('membro consegue alterar o próprio nome e telefone', async () => {
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    const { data, error } = await comoMembro
      .from('users')
      .update({ nome: 'Carla Rodrigues Teste', telefone: '11999990000' })
      .eq('id', MEMBRO_ID)
      .select();

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data[0].nome).toBe('Carla Rodrigues Teste');
    expect(data[0].telefone).toBe('11999990000');

    // devolve ao original dentro do próprio teste
    const { error: erroRevert } = await comoMembro
      .from('users').update({ nome: 'Carla Rodrigues', telefone: null }).eq('id', MEMBRO_ID);
    expect(erroRevert).toBeNull();
  });

  it('membro NÃO consegue se auto-promover trocando o próprio cargo', async () => {
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    const { error } = await comoMembro.from('users').update({ cargo: 'admin' }).eq('id', MEMBRO_ID);
    expect(error).not.toBeNull();

    const admin = adminClient();
    const { data: depois } = await admin.from('users').select('cargo').eq('id', MEMBRO_ID).single();
    expect(depois.cargo).toBe('member');
  });

  it('membro NÃO consegue trocar o próprio tenant_id', async () => {
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);
    const outroTenantFalso = '00000000-0000-4000-8000-000000000099';

    const { error } = await comoMembro.from('users').update({ tenant_id: outroTenantFalso }).eq('id', MEMBRO_ID);
    expect(error).not.toBeNull();

    const admin = adminClient();
    const { data: depois } = await admin.from('users').select('tenant_id').eq('id', MEMBRO_ID).single();
    expect(depois.tenant_id).toBe('d0000000-0000-4000-8000-000000000001');
  });
});
