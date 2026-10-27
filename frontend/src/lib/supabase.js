import { createClient } from '@supabase/supabase-js';
import { ambiente, isProducao } from './ambiente.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-dev.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export { ambiente, isProducao };

const REF_PRODUCAO = 'ujspjhmfdinkhjccjjuo';
const apontaParaProducao = supabaseUrl.includes(REF_PRODUCAO);
const escapeLiberado = import.meta.env.VITE_PERMITIR_PROD_EM_DEV === 'true';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    `[Prancheto.IA] Supabase não configurado para o ambiente "${ambiente}". ` +
      'Preencha frontend/.env.development com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
} else if (!isProducao && apontaParaProducao && !escapeLiberado) {
  console.warn(
    `[Prancheto.IA] Aviso: O ambiente "${ambiente}" está apontando para o Supabase de PRODUÇÃO.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

