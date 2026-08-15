-- =============================================================
-- TELEFONE NO PERFIL PRÓPRIO
--
-- 'perfil.editar_proprio' nasceu valendo só para o nome, porque era o
-- único dado pessoal que a tabela guardava. Agora existe telefone, e a
-- permissão passa a cobrir o conjunto.
--
-- O gatilho de auto-edição deixa de citar 'nome' em dois lugares — a
-- lista de colunas liberadas e a checagem de permissão — e passa a
-- derivar as duas de COLUNAS_PESSOAIS. Acrescentar um dado pessoal
-- amanhã vira uma linha só.
--
-- E-mail continua de fora, e não por esquecimento: users.email espelha
-- auth.users.email, que é a credencial de login. Trocar só a linha de
-- 'users' faria o usuário entrar com um endereço e ver outro na tela.
-- Mudança de e-mail exige o fluxo de confirmação do Supabase Auth.
-- =============================================================


-- -------------------------------------------------------------
-- 1. COLUNA
--
-- Sem formato imposto: o CRM atende clientes de fora do Brasil, e
-- máscara em coluna de texto só cria linha que a aplicação não sabe
-- reexibir. O limite existe para barrar abuso, não para validar.
-- -------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS telefone text;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_telefone_tamanho;

ALTER TABLE public.users
  ADD CONSTRAINT users_telefone_tamanho
  CHECK (telefone IS NULL OR char_length(telefone) <= 32);

COMMENT ON COLUMN public.users.telefone IS
  'Telefone de contato do usuário. Editável por ele mesmo sob a permissão perfil.editar_proprio.';


-- -------------------------------------------------------------
-- 2. GATILHO DE AUTO-EDIÇÃO
--
-- Substitui a versão de 20260808000000. Mesmas garantias: quem edita a
-- própria linha não muda cargo, tenant nem estado de bloqueio, e a
-- equipe (service_role, sem auth.uid()) segue passando direto.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_users_protege_auto_edicao()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
DECLARE
  colunas_pessoais  text[] := ARRAY['nome', 'telefone'];
  colunas_liberadas text[] := colunas_pessoais || ARRAY['atualizado_em'];
  bloqueadas        text[];
  mexeu_em_pessoal  boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  -- Não é auto-edição: quem cuida de linha de terceiro é a policy.
  IF auth.uid() IS DISTINCT FROM OLD.id THEN RETURN NEW; END IF;
  IF public.get_user_cargo() = 'super_admin' THEN RETURN NEW; END IF;

  SELECT array_agg(campo.chave ORDER BY campo.chave)
    INTO bloqueadas
    FROM jsonb_each(to_jsonb(NEW)) AS campo(chave, valor)
   WHERE campo.valor IS DISTINCT FROM (to_jsonb(OLD) -> campo.chave)
     AND NOT (campo.chave = ANY (colunas_liberadas));

  IF bloqueadas IS NOT NULL THEN
    RAISE EXCEPTION
      'Você pode alterar apenas os seus dados pessoais. Campos bloqueados: %',
      array_to_string(bloqueadas, ', ')
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM jsonb_each(to_jsonb(NEW)) AS campo(chave, valor)
     WHERE campo.valor IS DISTINCT FROM (to_jsonb(OLD) -> campo.chave)
       AND campo.chave = ANY (colunas_pessoais)
  ) INTO mexeu_em_pessoal;

  IF mexeu_em_pessoal
     AND NOT public.tem_permissao('perfil.editar_proprio', true) THEN
    RAISE EXCEPTION 'Seu cargo não permite alterar os próprios dados.'
      USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(NEW.nome, '')) = '' THEN
    RAISE EXCEPTION 'O nome não pode ficar vazio.'
      USING ERRCODE = '23514';
  END IF;

  -- Telefone em branco é ausência de telefone, não string vazia: sem isto
  -- a coluna acumula '' e todo filtro precisa testar os dois casos.
  IF btrim(COALESCE(NEW.telefone, '')) = '' THEN
    NEW.telefone := NULL;
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.trigger_users_protege_auto_edicao() OWNER TO postgres;

-- O gatilho de 20260808000000 aponta para esta mesma função; recriado
-- aqui para a migration valer sozinha em banco novo.
DROP TRIGGER IF EXISTS users_protege_auto_edicao ON public.users;
CREATE TRIGGER users_protege_auto_edicao
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.trigger_users_protege_auto_edicao();
