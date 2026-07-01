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
      // But we need to update the tenantId and cargo since they might not be passed correctly in metadata.
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
      if (!userId) throw new Error('userId is required');
      
      // Update status in public.users
      const { error: updateError } = await supabase
        .from('users')
        .update({ status: payload.status })
        .eq('id', userId);
        
      if (updateError) throw updateError;

      // Optionally, suspend the user in Auth to prevent login
      // auth.admin.updateUserById { ban_duration: "1000h" } could be used for 'inativo'
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });

    }

    throw new Error('Invalid action');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
