-- Migration 014: View condicional para vínculos entre times (Pendência B)
-- Exibe dados completos apenas para membros do time de origem

CREATE OR REPLACE VIEW crm_vinculos_times_view AS
SELECT
  v.id,
  v.tenant_id,
  v.contato_id,
  v.time_origem_id,
  v.time_destino_id,
  v.tipo_vinculo,
  v.metadados,
  v.criado_por,
  v.criado_em,
  -- Nome do contato: completo se membro do time de origem, restrito caso contrário
  CASE
    WHEN EXISTS (
      SELECT 1 FROM org_time_membros m
      WHERE m.time_id = v.time_origem_id
        AND m.user_id = auth.uid()
    ) THEN c.nome
    ELSE '[Contato Restrito]'
  END AS contato_nome_display,
  -- Status do funil: visível apenas para membros
  CASE
    WHEN EXISTS (
      SELECT 1 FROM org_time_membros m
      WHERE m.time_id = v.time_origem_id
        AND m.user_id = auth.uid()
    ) THEN c.status_funil
    ELSE NULL
  END AS contato_status_display,
  -- Email: visível apenas para membros
  CASE
    WHEN EXISTS (
      SELECT 1 FROM org_time_membros m
      WHERE m.time_id = v.time_origem_id
        AND m.user_id = auth.uid()
    ) THEN c.email
    ELSE NULL
  END AS contato_email_display,
  -- Empresa: visível apenas para membros
  CASE
    WHEN EXISTS (
      SELECT 1 FROM org_time_membros m
      WHERE m.time_id = v.time_origem_id
        AND m.user_id = auth.uid()
    ) THEN c.empresa
    ELSE NULL
  END AS contato_empresa_display,
  -- Flag de acesso completo
  CASE
    WHEN EXISTS (
      SELECT 1 FROM org_time_membros m
      WHERE m.time_id = v.time_origem_id
        AND m.user_id = auth.uid()
    ) THEN TRUE
    ELSE FALSE
  END AS tem_acesso_completo,
  -- Dados do time de origem
  torigem.nome AS time_origem_nome,
  torigem.icone AS time_origem_icone,
  torigem.cor_primaria AS time_origem_cor,
  -- Dados do time de destino
  tdestino.nome AS time_destino_nome,
  tdestino.icone AS time_destino_icone,
  tdestino.cor_primaria AS time_destino_cor
FROM crm_vinculos_times v
JOIN crm_contatos c ON c.id = v.contato_id
JOIN org_times torigem ON torigem.id = v.time_origem_id
JOIN org_times tdestino ON tdestino.id = v.time_destino_id;

COMMENT ON VIEW crm_vinculos_times_view IS
  'View de vínculos entre times com controle de acesso condicional. '
  'Exibe dados completos do contato apenas se o usuário autenticado for membro do time de origem. '
  'Caso contrário, exibe apenas nome mascarado e status do funil.';
