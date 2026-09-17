-- Migration: RPC agregada para os contadores por status do Outbound
-- (Bloco 1, item 4). Corrige o bug em que trocar de aba/filtro zerava os
-- contadores das outras abas, porque eram calculados em cima da mesma
-- lista já filtrada pela query. Sem SECURITY DEFINER: roda com os
-- privilégios de quem chama, então a RLS de outbound_acoes (tenant/dono)
-- continua valendo normalmente.

CREATE OR REPLACE FUNCTION public.outbound_contadores()
RETURNS TABLE (status text, total bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT status, count(*)::bigint AS total
  FROM public.outbound_acoes
  GROUP BY status;
$$;

GRANT EXECUTE ON FUNCTION public.outbound_contadores() TO authenticated;
