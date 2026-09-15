-- Migration: alinha o CHECK de outbound_acoes.status com os valores que a
-- tela de Outbound já grava (sem_retorno/convertido) no lugar dos valores
-- antigos (sem_resposta/cancelado), que nunca chegaram a ser usados pelo
-- frontend. Também documenta onde ficam os rótulos personalizáveis por
-- usuário para cada status técnico.

-- Normaliza linhas antigas antes de trocar a constraint (idempotente: só
-- afeta linhas que, por algum motivo, ainda tenham os valores antigos).
UPDATE public.outbound_acoes SET status = 'sem_retorno' WHERE status = 'sem_resposta';
UPDATE public.outbound_acoes SET status = 'sem_retorno' WHERE status = 'cancelado';

ALTER TABLE public.outbound_acoes
  DROP CONSTRAINT outbound_acoes_status_check;

ALTER TABLE public.outbound_acoes
  ADD CONSTRAINT outbound_acoes_status_check
  CHECK (status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'respondido'::text, 'sem_retorno'::text, 'convertido'::text]));

COMMENT ON COLUMN public.outbound_acoes.status IS
  'Valor técnico do status (pendente, enviado, respondido, sem_retorno, convertido), compartilhado entre todos os usuários. O rótulo exibido na interface é personalizável por usuário — ver user_preferencias.metadata.outbound_status_rotulos.';

COMMENT ON COLUMN public.user_preferencias.metadata IS
  'Preferências livres em JSON. Chave "outbound_status_rotulos": objeto {status: rótulo_customizado} com os rótulos que o usuário definiu para os status de outbound_acoes. Status sem entrada usam o rótulo padrão do frontend.';
