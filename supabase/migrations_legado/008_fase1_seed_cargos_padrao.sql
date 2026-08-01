-- =============================================================
-- FASE 1: Seed — Cargos padrão por tenant
-- Cria 3 cargos de sistema para cada tenant existente:
--   1. Líder Geral    (22 permissões, e_sistema=true, ordem=1)
--   2. Líder de Time  (16 permissões, e_sistema=true, ordem=2)
--   3. Membro de Time ( 9 permissões, e_sistema=true, e_padrao=true, ordem=3)
--
-- ATENÇÃO: Este seed usa INSERT ... ON CONFLICT DO NOTHING para ser
-- idempotente — pode ser re-executado sem duplicar dados.
-- Aplicada via MCP em 2026-07-11.
-- =============================================================

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM public.tenants LOOP

    -- Líder Geral
    INSERT INTO public.org_cargos (tenant_id, nome, descricao, permissoes, e_padrao, e_sistema, ordem)
    VALUES (
      t.id,
      'Líder Geral',
      'Acesso completo à organização. Pode gerenciar times, cargos e configurações.',
      '["crm.ver","crm.criar","crm.editar","crm.excluir","agenda.ver","agenda.criar","agenda.editar","agenda.excluir","outbound.ver","outbound.criar","outbound.editar","outbound.excluir","times.ver","times.gerenciar","usuarios.ver","usuarios.convidar","usuarios.gerenciar","cargos.ver","cargos.gerenciar","configuracoes.ver","configuracoes.editar","relatorios.ver"]'::jsonb,
      false, true, 1
    )
    ON CONFLICT (tenant_id, nome) DO NOTHING;

    -- Líder de Time
    INSERT INTO public.org_cargos (tenant_id, nome, descricao, permissoes, e_padrao, e_sistema, ordem)
    VALUES (
      t.id,
      'Líder de Time',
      'Gerencia seu time e membros. Acesso a CRM, Agenda e Outbound sem exclusão.',
      '["crm.ver","crm.criar","crm.editar","agenda.ver","agenda.criar","agenda.editar","outbound.ver","outbound.criar","outbound.editar","times.ver","times.gerenciar","usuarios.ver","usuarios.convidar","cargos.ver","configuracoes.ver","relatorios.ver"]'::jsonb,
      false, true, 2
    )
    ON CONFLICT (tenant_id, nome) DO NOTHING;

    -- Membro de Time (padrão para novos usuários)
    INSERT INTO public.org_cargos (tenant_id, nome, descricao, permissoes, e_padrao, e_sistema, ordem)
    VALUES (
      t.id,
      'Membro de Time',
      'Acesso básico. Pode visualizar e criar registros, mas não excluir nem gerenciar.',
      '["crm.ver","crm.criar","agenda.ver","agenda.criar","outbound.ver","outbound.criar","times.ver","usuarios.ver","relatorios.ver"]'::jsonb,
      true, true, 3
    )
    ON CONFLICT (tenant_id, nome) DO NOTHING;

  END LOOP;
END;
$$;

-- Atualiza cargo_id dos usuários existentes com base no cargo legado (enum)
-- super_admin: mantém cargo_id = NULL (não usa org_cargos)
-- admin:   → Líder Geral
-- manager: → Líder de Time
-- member/viewer: → Membro de Time
UPDATE public.users u
SET cargo_id = (
  SELECT oc.id FROM public.org_cargos oc
  WHERE oc.tenant_id = u.tenant_id
    AND oc.nome = CASE u.cargo
      WHEN 'admin'   THEN 'Líder Geral'
      WHEN 'manager' THEN 'Líder de Time'
      ELSE                'Membro de Time'
    END
  LIMIT 1
)
WHERE u.cargo != 'super_admin'
  AND u.cargo_id IS NULL;
