import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

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
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify if caller is super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header is required');
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');
    
    const { data: adminData, error: dbError } = await supabase
      .from('users')
      .select('cargo')
      .eq('id', user.id)
      .single();
      
    if (dbError || adminData?.cargo !== 'super_admin') {
      throw new Error('Forbidden: Super Admin access required');
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) throw new Error('targetUserId is required');

    // Get target user email
    const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(targetUserId);
    if (targetUserError || !targetUser.user) {
      throw new Error('Target user not found');
    }

    // Mint a new JWT for the target user
    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      sub: targetUserId,
      email: targetUser.user.email,
      app_metadata: targetUser.user.app_metadata,
      user_metadata: targetUser.user.user_metadata,
      role: 'authenticated'
    };

    const secret = new TextEncoder().encode(jwtSecret);
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(secret);

    // Provide the token and session object format
    return new Response(JSON.stringify({
      token: accessToken,
      session: {
        access_token: accessToken,
        refresh_token: '', // No refresh token for impersonation
        expires_in: 3600,
        user: targetUser.user
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
