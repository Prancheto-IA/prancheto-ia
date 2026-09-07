// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Permissões por cargo
//
// Usa os 3 usuários já seedados (supabase/seed.sql) — nenhum fixture novo.
// As permissões de cada um estão documentadas no próprio seed.sql:
//   admin@acme.dev   (Líder Geral)   tem os 4 slugs abaixo
//   gerente@acme.dev (Líder de Time) tem times.gerenciar, não os outros 3
//   membro@acme.dev  (Membro de Time) não tem nenhum dos 4
//
// Cada teste cria seu próprio dado descartável quando precisa exercitar o
// caminho "permitido" (o admin sempre pode limpar depois) — nunca toca nos
// dados fixos do seed.
// =============================================================

import { describe, it, expect } from 'vitest';
import { loginAs } from '../helpers/client.js';

const TENANT_ACME_ID = 'd0000000-0000-4000-8000-000000000001';
const SENHA_SEED = 'prancheto-dev-2026';

describe('Permissões por cargo (RLS + tem_permissao())', () => {
  it('crm.excluir: admin apaga, gerente e membro são negados', async () => {
    const comoAdmin = await loginAs('admin@acme.dev', SENHA_SEED);
    const comoGerente = await loginAs('gerente@acme.dev', SENHA_SEED);
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    const { data: criado, error: erroCriar } = await comoAdmin
      .from('crm_contatos')
      .insert({ tenant_id: TENANT_ACME_ID, nome: 'descartavel-teste-crm-excluir' })
      .select('id').single();
    expect(erroCriar).toBeNull();

    const { data: tentativaGerente } = await comoGerente.from('crm_contatos').delete().eq('id', criado.id).select();
    expect(tentativaGerente).toEqual([]);

    const { data: tentativaMembro } = await comoMembro.from('crm_contatos').delete().eq('id', criado.id).select();
    expect(tentativaMembro).toEqual([]);

    const { data: apagadoPeloAdmin, error: erroApagar } = await comoAdmin
      .from('crm_contatos').delete().eq('id', criado.id).select();
    expect(erroApagar).toBeNull();
    expect(apagadoPeloAdmin).toHaveLength(1);
  });

  it('times.gerenciar: gerente cria, membro é negado', async () => {
    const comoAdmin = await loginAs('admin@acme.dev', SENHA_SEED);
    const comoGerente = await loginAs('gerente@acme.dev', SENHA_SEED);
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    const { error: erroMembro } = await comoMembro
      .from('org_times')
      .insert({ tenant_id: TENANT_ACME_ID, nome: 'descartavel-teste-times-membro' });
    expect(erroMembro).not.toBeNull();

    const { data: criadoPeloGerente, error: erroGerente } = await comoGerente
      .from('org_times')
      .insert({ tenant_id: TENANT_ACME_ID, nome: 'descartavel-teste-times-gerente' })
      .select('id').single();
    expect(erroGerente).toBeNull();

    // limpeza: admin também tem times.gerenciar
    const { error: erroLimpeza } = await comoAdmin.from('org_times').delete().eq('id', criadoPeloGerente.id);
    expect(erroLimpeza).toBeNull();
  });

  it('cargos.gerenciar: admin edita, gerente e membro são negados', async () => {
    const comoAdmin = await loginAs('admin@acme.dev', SENHA_SEED);
    const comoGerente = await loginAs('gerente@acme.dev', SENHA_SEED);
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    // Cargo "Observador" (id fixo do seed) não tem usuário vinculado — seguro de tocar.
    const CARGO_OBSERVADOR_ID = 'c0000000-0000-4000-8000-000000000004';

    const { data: original, error: erroLeitura } = await comoAdmin
      .from('org_cargos').select('descricao').eq('id', CARGO_OBSERVADOR_ID).single();
    expect(erroLeitura).toBeNull();

    const { data: tentativaGerente } = await comoGerente
      .from('org_cargos').update({ descricao: original.descricao }).eq('id', CARGO_OBSERVADOR_ID).select();
    expect(tentativaGerente).toEqual([]);

    const { data: tentativaMembro } = await comoMembro
      .from('org_cargos').update({ descricao: original.descricao }).eq('id', CARGO_OBSERVADOR_ID).select();
    expect(tentativaMembro).toEqual([]);

    // admin pode — grava exatamente o mesmo valor de volta (no-op de conteúdo).
    const { data: viaAdmin, error: erroAdmin } = await comoAdmin
      .from('org_cargos').update({ descricao: original.descricao }).eq('id', CARGO_OBSERVADOR_ID).select();
    expect(erroAdmin).toBeNull();
    expect(viaAdmin).toHaveLength(1);
  });

  it('configuracoes.editar: admin edita o próprio tenant, gerente e membro são negados', async () => {
    const comoAdmin = await loginAs('admin@acme.dev', SENHA_SEED);
    const comoGerente = await loginAs('gerente@acme.dev', SENHA_SEED);
    const comoMembro = await loginAs('membro@acme.dev', SENHA_SEED);

    const { data: original, error: erroLeitura } = await comoAdmin
      .from('tenants').select('nome').eq('id', TENANT_ACME_ID).single();
    expect(erroLeitura).toBeNull();

    const { data: tentativaGerente } = await comoGerente
      .from('tenants').update({ nome: original.nome }).eq('id', TENANT_ACME_ID).select();
    expect(tentativaGerente).toEqual([]);

    const { data: tentativaMembro } = await comoMembro
      .from('tenants').update({ nome: original.nome }).eq('id', TENANT_ACME_ID).select();
    expect(tentativaMembro).toEqual([]);

    const { data: viaAdmin, error: erroAdmin } = await comoAdmin
      .from('tenants').update({ nome: original.nome }).eq('id', TENANT_ACME_ID).select();
    expect(erroAdmin).toBeNull();
    expect(viaAdmin).toHaveLength(1);
  });
});
