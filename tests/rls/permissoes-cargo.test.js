// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Permissões por cargo
//
// Primeiro describe: usa os 3 usuários já seedados (supabase/seed.sql) —
// nenhum fixture novo. As permissões de cada um estão documentadas no
// próprio seed.sql:
//   admin@acme.dev   (Líder Geral)   tem os 4 slugs abaixo
//   gerente@acme.dev (Líder de Time) tem times.gerenciar, não os outros 3
//   membro@acme.dev  (Membro de Time) não tem nenhum dos 4
//
// Cada teste cria seu próprio dado descartável quando precisa exercitar o
// caminho "permitido" (o admin sempre pode limpar depois) — nunca toca nos
// dados fixos do seed.
//
// Segundo describe (subconjunto de permissões, Bloco 5): nenhum dos 3
// usuários do seed serve pra testar a regra que substituiu o nível
// hierárquico — só admin@acme.dev tem usuarios.gerenciar/cargos.gerenciar,
// e o conjunto dele é superconjunto de todo mundo. Usa fixtures próprias
// (criarFixtureSubconjuntoPermissoes), criadas e destruídas a cada rodada.
// =============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loginAs, adminClient } from '../helpers/client.js';
import {
  TENANT_ACME_ID, SENHA_SEED,
  criarFixtureSubconjuntoPermissoes, destruirFixtureSubconjuntoPermissoes,
} from '../helpers/fixtures.js';

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

describe('Permissões substituem nível hierárquico (subconjunto — Bloco 5)', () => {
  let admin;
  let fixture;

  beforeAll(async () => {
    admin = adminClient();
    fixture = await criarFixtureSubconjuntoPermissoes();
  });

  afterAll(async () => {
    await destruirFixtureSubconjuntoPermissoes(fixture);
  });

  it('cargo: usuário não cria nem edita cargo com permissão que não tem, mas pode usar as que já possui', async () => {
    const comoModesto = await loginAs(fixture.modesto.email, fixture.modesto.senha);

    // CRIAR: tentar conceder 'usuarios.convidar' — fora do conjunto do
    // próprio ator — é bloqueado pelo trigger (RAISE EXCEPTION, não RLS).
    const { data: criacaoNegada, error: erroCriacaoNegada } = await comoModesto
      .from('org_cargos')
      .insert({
        tenant_id: TENANT_ACME_ID,
        nome: 'descartavel-teste-subset-negado',
        permissoes: ['crm.ver', 'usuarios.convidar'],
      })
      .select();
    expect(erroCriacaoNegada).not.toBeNull();
    expect(criacaoNegada).toBeNull();

    // CRIAR: usando só permissões que o próprio ator possui — permitido.
    const { data: criado, error: erroCriar } = await comoModesto
      .from('org_cargos')
      .insert({
        tenant_id: TENANT_ACME_ID,
        nome: 'descartavel-teste-subset-permitido',
        permissoes: ['crm.ver', 'cargos.gerenciar'],
      })
      .select('id').single();
    expect(erroCriar).toBeNull();
    await admin.from('org_cargos').delete().eq('id', criado.id);

    // EDITAR: acrescentar uma permissão que o ator não possui é bloqueado,
    // mesmo em um cargo que ele tem poder de editar (cargos.gerenciar).
    const { data: edicaoNegada, error: erroEdicaoNegada } = await comoModesto
      .from('org_cargos')
      .update({ permissoes: ['crm.ver', 'usuarios.convidar'] })
      .eq('id', fixture.cargos.alvoEdicaoId)
      .select();
    expect(erroEdicaoNegada).not.toBeNull();
    expect(edicaoNegada).toBeNull();
  });

  it('usuarios.gerenciar: só gerencia (cargo/ativo) alvos com permissões em subconjunto estrito das suas', async () => {
    const comoModesto = await loginAs(fixture.modesto.email, fixture.modesto.senha);
    const comoAmplo   = await loginAs(fixture.amplo.email, fixture.amplo.senha);

    // Não gerencia quem tem MAIS permissões que ele.
    const { error: erroAlvoMaisForte } = await comoModesto.rpc('definir_ativo_usuario', {
      p_user_id: fixture.amplo.id, p_ativo: false,
    });
    expect(erroAlvoMaisForte).not.toBeNull();

    // Não gerencia um PEER com permissões idênticas — nem mais nem menos
    // poder conta como "abaixo". Só o dono manda em quem tem poder igual.
    const { error: erroPeer } = await comoModesto.rpc('definir_cargo_usuario', {
      p_user_id: fixture.peer.id, p_cargo_id: fixture.cargos.baseId,
    });
    expect(erroPeer).not.toBeNull();

    // Gerencia quem tem permissões estritamente ABAIXO (subconjunto próprio).
    const { error: erroDesativa } = await comoAmplo.rpc('definir_ativo_usuario', {
      p_user_id: fixture.modesto.id, p_ativo: false,
    });
    expect(erroDesativa).toBeNull();
    await admin.from('users').update({ ativo: true }).eq('id', fixture.modesto.id); // reverte

    const { error: erroTrocaCargo } = await comoAmplo.rpc('definir_cargo_usuario', {
      p_user_id: fixture.modesto.id, p_cargo_id: fixture.cargos.peerId,
    });
    expect(erroTrocaCargo).toBeNull();
    await admin.from('users').update({ cargo_id: fixture.cargos.baseId }).eq('id', fixture.modesto.id); // reverte
  });

  it('Chefe Supremo continua intocável, mesmo por quem tem usuarios.gerenciar', async () => {
    const comoAmplo = await loginAs(fixture.amplo.email, fixture.amplo.senha);
    const comoAdminSeed = await loginAs('admin@acme.dev', SENHA_SEED); // Líder Geral, também tem usuarios.gerenciar

    const { error: erroDesativarDono } = await comoAmplo.rpc('definir_ativo_usuario', {
      p_user_id: fixture.dono.id, p_ativo: false,
    });
    expect(erroDesativarDono).not.toBeNull();

    const { error: erroMudarCargoDono } = await comoAdminSeed.rpc('definir_cargo_usuario', {
      p_user_id: fixture.dono.id, p_cargo_id: fixture.cargos.baseId,
    });
    expect(erroMudarCargoDono).not.toBeNull();

    const { data: donoInalterado } = await admin
      .from('users').select('ativo, cargo_id').eq('id', fixture.dono.id).single();
    expect(donoInalterado.ativo).toBe(true);
    expect(donoInalterado.cargo_id).toBeNull();
  });
});
