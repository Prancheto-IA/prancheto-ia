-- =============================================================
-- PRANCHETO.IA - Rótulos padrão da empresa (CRM funil + Outbound)
--
-- Modelo híbrido de 3 níveis, mesma ideia já usada só para Outbound
-- (user_preferencias.metadata.outbound_status_rotulos), agora com um
-- degrau novo no meio — o padrão da empresa:
--
--   rótulo pessoal (user_preferencias.metadata) >
--   padrão da empresa (tenants.configuracoes.rotulos_padrao) >
--   padrão do sistema (hardcoded no frontend)
--
-- Esta migration só cuida do degrau novo: quem pode escrever nele, e
-- onde ele mora. A leitura de tenants.configuracoes já é permitida pela
-- policy tenants_select_own existente — não precisa de nada novo aqui.
--
-- 1) Permissão nova 'rotulos.gerenciar' — igual à correção retroativa
--    já feita para chat.criar_grupo (20260918010000): concede pros
--    cargos de liderança já existentes, senão a permissão nasceria
--    negada pra quem já usa o sistema.
UPDATE public.org_cargos
   SET permissoes    = permissoes || '["rotulos.gerenciar"]'::jsonb,
       atualizado_em = now()
 WHERE NOT (permissoes ? 'rotulos.gerenciar')
   AND (
     nome IN ('Líder Geral', 'Líder de Time')
     OR permissoes ? 'usuarios.gerenciar'
     OR permissoes ? 'times.gerenciar'
   );

-- 2) Função SECURITY DEFINER: único portão de escrita do padrão da
--    empresa. Não reaproveita a policy tenants_update_proprio (que
--    exige 'configuracoes.editar') de propósito: 'configuracoes.editar'
--    também libera nome/logo/identidade visual da empresa, e o pedido
--    aqui é só para quem define os rótulos padrão, um grupo mais amplo
--    (Líder Geral + Líder de Time) do que quem edita a empresa toda.
--
--    Substitui (não faz merge com) o conteúdo do domínio pedido — quem
--    chama manda o objeto completo que quer gravar; um objeto vazio
--    limpa o override da empresa (cai pro padrão do sistema).
CREATE OR REPLACE FUNCTION public.definir_rotulos_padrao_empresa(p_dominio text, p_rotulos jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id      uuid;
  v_chaves_validas text[];
  v_chave          text;
BEGIN
  IF p_dominio NOT IN ('outbound', 'crm_funil') THEN
    RAISE EXCEPTION 'Domínio inválido: %', p_dominio USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_rotulos) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'p_rotulos precisa ser um objeto JSON.' USING ERRCODE = '22023';
  END IF;

  v_chaves_validas := CASE p_dominio
    WHEN 'outbound'  THEN ARRAY['pendente','enviado','respondido','sem_retorno','convertido']
    ELSE                  ARRAY['lead','qualificado','proposta','negociacao','fechado','perdido']
  END;

  FOR v_chave IN SELECT jsonb_object_keys(p_rotulos) LOOP
    IF NOT (v_chave = ANY (v_chaves_validas)) OR jsonb_typeof(p_rotulos -> v_chave) IS DISTINCT FROM 'string' THEN
      RAISE EXCEPTION 'Status inválido para %: %', p_dominio, v_chave USING ERRCODE = '22023';
    END IF;
  END LOOP;

  v_tenant_id := public.get_user_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Você não está associado a nenhuma empresa.';
  END IF;

  IF public.get_user_cargo() IS DISTINCT FROM 'super_admin'
     AND NOT public.sou_dono_tenant()
     AND NOT public.tem_permissao('rotulos.gerenciar') THEN
    RAISE EXCEPTION 'Sem permissão para definir os rótulos padrão da empresa.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.tenants
     SET configuracoes = jsonb_set(
           COALESCE(configuracoes, '{}'::jsonb),
           ARRAY['rotulos_padrao', p_dominio],
           p_rotulos,
           true
         ),
         atualizado_em = now()
   WHERE id = v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.definir_rotulos_padrao_empresa(text, jsonb) TO authenticated;

COMMENT ON FUNCTION public.definir_rotulos_padrao_empresa(text, jsonb) IS 'Define (substitui) o padrão de rótulos de status da empresa para um domínio (outbound | crm_funil), em tenants.configuracoes.rotulos_padrao. Objeto vazio remove o override e volta ao padrão do sistema. Só dono do tenant, super_admin, ou quem tem rotulos.gerenciar.';
