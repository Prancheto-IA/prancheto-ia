import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// =============================================================
// PRANCHETO.IA - CRIAÇÃO DE USUÁRIOS PELO PRÓPRIO TENANT (Bloco 5)
//
// Diferente de admin-users (interno, só super_admin, tenant_id vem do
// corpo da requisição): aqui quem chama só cria dentro do PRÓPRIO tenant
// — o tenant_id nunca vem do payload, sempre é lido do perfil de quem
// chama — e a autorização é de verdade (tem_permissao('usuarios.gerenciar')
// ou ser o dono do tenant), não um cargo hardcoded.
//
// A regra de hierarquia (Bloco 5, item 2) também vale aqui: não dá pra
// criar alguém com cargo de nível igual ou maior que o de quem está
// criando — exceto o dono do tenant e o super_admin, que não têm teto.
// =============================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('Authorization header is required');
    const token = authHeader.replace('Bearer ', '');

    // Cliente "como o chamador": preserva o JWT dele, então RPCs que dependem
    // de auth.uid() (tem_permissao, get_user_cargo_nivel) avaliam certo —
    // um cliente service_role não tem auth.uid(), sempre voltaria nulo.
    const supabaseComoChamador = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Privilégio total — só pra operações que a RLS de users não libera pra
    // ninguém além de super_admin (criar no Auth, ajustar cargo_id depois).
    const supabaseServico = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseComoChamador.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { data: chamador, error: dbError } = await supabaseServico
      .from('users')
      .select('id, tenant_id, cargo, cargo_id, e_dono_tenant, ativo')
      .eq('id', user.id)
      .single();

    if (dbError || !chamador) throw new Error('Perfil do usuário não encontrado.');
    if (!chamador.ativo) throw new Error('Sua conta está desativada.');
    if (!chamador.tenant_id) throw new Error('Você não está associado a nenhuma empresa.');

    const ehDonoOuSuperAdmin = chamador.e_dono_tenant || chamador.cargo === 'super_admin';

    let podeGerenciar = ehDonoOuSuperAdmin;
    if (!podeGerenciar) {
      const { data: permitido } = await supabaseComoChamador.rpc('tem_permissao', { p_slug: 'usuarios.gerenciar' });
      podeGerenciar = Boolean(permitido);
    }
    if (!podeGerenciar) throw new Error('Sem permissão para criar usuários.');

    const { action, payload } = await req.json();

    if (action !== 'create') {
      throw new Error('Invalid action. Use: create');
    }
    if (!payload?.nome || !payload?.email || !payload?.senha) {
      throw new Error('nome, email e senha são obrigatórios.');
    }

    const cargoId: string | null = payload.cargoId ?? null;

    // Cargo pedido pro novo usuário precisa ser de nível abaixo do de quem
    // cria — exceto o dono/super_admin, que não têm teto.
    if (cargoId && !ehDonoOuSuperAdmin) {
      const { data: cargoNovo, error: cargoError } = await supabaseServico
        .from('org_cargos')
        .select('id, tenant_id, nivel')
        .eq('id', cargoId)
        .single();

      if (cargoError || !cargoNovo || cargoNovo.tenant_id !== chamador.tenant_id) {
        throw new Error('Cargo inválido.');
      }

      const { data: nivelChamador } = await supabaseComoChamador.rpc('get_user_cargo_nivel');
      if ((cargoNovo.nivel ?? 0) >= (nivelChamador ?? 0)) {
        throw new Error('Você não pode atribuir um cargo de nível igual ou superior ao seu.');
      }
    }

    // Cria já com tenant_id nos metadados — sai atômico (o trigger
    // handle_new_user já insere ativo=true e no tenant certo), diferente do
    // admin-users, que cria "solto" e corrige tenant_id depois com um UPDATE.
    const { data: authData, error: createError } = await supabaseServico.auth.admin.createUser({
      email: payload.email,
      password: payload.senha,
      email_confirm: true,
      user_metadata: {
        nome: payload.nome,
        cargo: 'member',
        tenant_id: chamador.tenant_id,
      },
    });

    if (createError) throw createError;

    if (cargoId) {
      const { error: updateError } = await supabaseServico
        .from('users')
        .update({ cargo_id: cargoId })
        .eq('id', authData.user.id);
      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, user: { id: authData.user.id, email: authData.user.email } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
