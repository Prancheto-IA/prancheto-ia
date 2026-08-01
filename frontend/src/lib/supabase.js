import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ambiente = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
export const isProducao = ambiente === 'production';

const REF_PRODUCAO = 'ujspjhmfdinkhjccjjuo';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Supabase nao configurado para o ambiente "${ambiente}". ` +
      'Copie frontend/.env.example para .env.development e preencha ' +
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.'
  );
}

const apontaParaProducao = supabaseUrl.includes(REF_PRODUCAO);
const escapeLiberado = import.meta.env.VITE_PERMITIR_PROD_EM_DEV === 'true';

if (!isProducao && apontaParaProducao && !escapeLiberado) {
  throw new Error(
    `Bloqueado: o ambiente "${ambiente}" esta apontando para o Supabase de PRODUCAO. ` +
      'Corrija VITE_SUPABASE_URL em frontend/.env.development. ' +
      'Se precisar mesmo depurar dados reais, defina VITE_PERMITIR_PROD_EM_DEV=true.'
  );
}

if (!isProducao && apontaParaProducao && escapeLiberado) {
  console.warn(
    '%cCONECTADO A PRODUCAO EM MODO DE DESENVOLVIMENTO',
    'background:#b91c1c;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px',
    '\nAs alteracoes afetam dados reais de clientes.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
