import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Atenção: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar configurados no .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://sua-url.supabase.co', 
  supabaseKey || 'sua-chave-anonima'
);
