// =============================================================
// PRANCHETO.IA - TESTES DE RLS - Clientes Supabase
//
// Dois tipos de cliente, dois propositos bem separados:
//   - adminClient(): usa a service_role key, ignora RLS. So serve para
//     montar e desmontar o fixture (criar/apagar o tenant de teste).
//     NUNCA usar para fazer as asserçoes dos testes — isso testaria o
//     bypass, nao a policy.
//   - loginAs(email, senha): usa a anon key + login real
//     (signInWithPassword), exatamente como o frontend faz. E o cliente
//     que os testes usam para checar o que a RLS realmente permite.
// =============================================================

import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Carrega tests/.env.test se existir. Em CI as variaveis ja vêm do
// workflow, então a ausência do arquivo aqui não é erro.
config({ path: path.resolve(__dirname, '..', '.env.test') });

const REF_PRODUCAO = 'ujspjhmfdinkhjccjjuo';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Faltam variaveis de ambiente. Copie tests/.env.test.example para ' +
    'tests/.env.test e preencha, ou configure SUPABASE_URL/SUPABASE_ANON_KEY/' +
    'SUPABASE_SERVICE_ROLE_KEY no ambiente (CI).'
  );
}

// Mesma trava que existe em frontend/src/lib/supabase.js: nunca deixar
// isto rodar contra producao. Aqui e mais estrito ainda — nao existe
// valvula de escape, porque estes testes usam a service_role key para
// criar e apagar dados.
if (SUPABASE_URL.includes(REF_PRODUCAO)) {
  throw new Error(
    `ABORTADO: SUPABASE_URL aponta para o projeto de PRODUCAO (${REF_PRODUCAO}). ` +
    'Os testes de RLS criam e apagam tenants/usuarios com a service_role key ' +
    '— isto nunca pode rodar contra producao.'
  );
}

export const adminClient = () =>
  createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

export const loginAs = async (email, senha) => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(`Falha ao logar como ${email}: ${error.message}`);
  return client;
};

export { SUPABASE_URL, SUPABASE_ANON_KEY };
