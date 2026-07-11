import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify if the caller is a super_admin
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) throw new Error('Authorization header is required');
    const token = authHeader.replace('Bearer ', '');
    
    // Validate token and get user role
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');
    
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('cargo')
      .eq('id', user.id)
      .single();
      
    if (dbError || userData?.cargo !== 'super_admin') {
      throw new Error('Forbidden: Super Admin access required');
    }

    const { action, payload, userId } = await req.json();

    if (action === 'create') {
      // 1. Create user in Supabase Auth
      const { data: authData, error: createError } = await supabase.auth.admin.createUser({
        email: payload.email,
        password: payload.senha,
        email_confirm: true,
        user_metadata: { nome: payload.nome, cargo: payload.cargo }
      });
      
      if (createError) throw createError;

      // The trigger will automatically create the row in public.users.
      // Update tenantId and cargo since they might not be passed correctly in metadata.
      const { error: updateError } = await supabase
        .from('users')
        .update({
          tenant_id: payload.tenantId,
          cargo: payload.cargo,
          nome: payload.nome
        })
        .eq('id', authData.user.id);
        
      if (updateError) throw updateError;
      
      return new Response(JSON.stringify({ success: true, user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
      
    } else if (action === 'update') {
      if (!userId) throw new Error('userId is required');
      
      // Update in public.users
      const { error: updateError } = await supabase
        .from('users')
        .update({
          nome: payload.nome,
          cargo: payload.cargo,
          tenant_id: payload.tenantId
        })
        .eq('id', userId);
        
      if (updateError) throw updateError;

      // Update in Auth if password was provided
      if (payload.senha) {
        const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
          userId,
          { password: payload.senha }
        );
        if (authUpdateError) throw authUpdateError;
      }
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    } else if (action === 'status') {
      // BUG FIX: campo correto é 'ativo' (boolean), não 'status' (text)
      // Converte o valor recebido para boolean de forma segura
      if (!userId) throw new Error('userId is required');
      if (payload.ativo === undefined && payload.status === undefined) {
        throw new Error('payload.ativo (boolean) é obrigatório para action=status');
      }

      // Aceita tanto payload.ativo (novo) quanto payload.status (legado) para compatibilidade
      let novoAtivo: boolean;
      if (payload.ativo !== undefined) {
        novoAtivo = Boolean(payload.ativo);
      } else {
        // Compatibilidade com chamadas legadas que enviavam payload.status
        novoAtivo = payload.status === 'ativo' || payload.status === true;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ ativo: novoAtivo })
        .eq('id', userId);
        
      if (updateError) {
        // Erro explícito — não silencia mais
        throw new Error(`Erro ao atualizar status do usuário: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ success: true, ativo: novoAtivo }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    }

    throw new Error('Invalid action. Use: create | update | status');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
