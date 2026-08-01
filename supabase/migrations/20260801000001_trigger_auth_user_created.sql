-- =============================================================
-- Trigger on_auth_user_created em auth.users
--
-- POR QUE ESTA FORA DA BASELINE
--
-- A baseline vem de pg_dump com --exclude-schema auth, porque o
-- schema auth e gerenciado pelo Supabase. Este trigger, porem, e
-- logica da aplicacao que apenas mora la: ele dispara a cada
-- cadastro no Supabase Auth e cria a linha correspondente em
-- public.users.
--
-- Sem ele o banco sobe integro, mas todo signup deixa de gerar
-- perfil, e o usuario autentica sem existir para a aplicacao.
-- Foi exatamente essa a diferenca detectada entre producao e o
-- projeto de desenvolvimento apos aplicar a baseline.
--
-- A funcao public.handle_new_user() ja vem na baseline; aqui so
-- religamos o gatilho. Idempotente: pode ser reaplicado.
--
-- Comportamento (definido na antiga migration 009):
--   - com tenant_id nos metadados  -> usuario ativo no tenant
--   - sem tenant_id (signup direto) -> tenant_id NULL e ativo=false,
--     pendente de associacao por um admin. O RLS bloqueia o acesso
--     enquanto isso.
-- =============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
