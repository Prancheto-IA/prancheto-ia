-- =============================================================
-- SEED DE DESENVOLVIMENTO — Prancheto.IA
--
-- Popula o banco de desenvolvimento com um tenant ficticio e dados
-- suficientes para exercitar CRM, projetos, tarefas e times sem
-- encostar em nenhum dado real.
--
-- COMO RODAR
--   psql "<connection-string-do-dev>" -f supabase/seed.sql
--
-- NUNCA rode isto em producao. Ha uma trava logo abaixo que aborta
-- se o banco contiver qualquer tenant que nao seja o do seed, mas
-- ela e a ultima linha de defesa, nao a primeira: confira sempre a
-- connection string antes.
--
-- Idempotente: pode ser reaplicado. Usa UUIDs fixos e ON CONFLICT.
--
-- ACESSO (todos com a mesma senha: prancheto-dev-2026)
--
--   e-mail             users.cargo   cargo organizacional
--   admin@acme.dev     admin         Líder Geral      (22 permissões)
--   gerente@acme.dev   manager       Líder de Time    (16 permissões)
--   membro@acme.dev    member        Membro de Time   ( 9 permissões)
--
-- Use os três para conferir as guardas da interface: o Líder Geral vê
-- excluir e gerenciar, o Líder de Time vê gerenciar mas não excluir, e o
-- Membro não vê nenhum dos dois.
-- =============================================================

-- ---------- TRAVA DE SEGURANCA ----------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id <> 'd0000000-0000-4000-8000-000000000001'
  ) THEN
    RAISE EXCEPTION
      'ABORTADO: este banco contem tenants que nao pertencem ao seed. '
      'Isto parece ser producao ou um ambiente com dados reais. '
      'Verifique a connection string.';
  END IF;
END $$;

BEGIN;

-- ---------- TENANT ----------
INSERT INTO public.tenants (id, nome, slug, plano, status, email_contato, limite_usuarios)
VALUES (
  'd0000000-0000-4000-8000-000000000001',
  'Acme Consultoria',
  'acme-dev',
  'pro',
  'ativo',
  'contato@acme.dev',
  25
)
ON CONFLICT (id) DO NOTHING;

-- ---------- CARGOS ----------
-- Os tres primeiros reproduzem exatamente os cargos de producao (migration
-- 008), inclusive nas permissoes, para que o comportamento testado aqui seja
-- o mesmo que o cliente vai ver. O quarto e so-leitura, para exercitar o caso
-- restritivo — o que revela guarda faltando na interface.
--
-- Os slugs sao os de PERMISSOES_DISPONIVEIS (frontend/src/hooks/useOrg.js).
-- Inventar slug aqui nao da erro, apenas nao corresponde a guarda alguma.
INSERT INTO public.org_cargos (id, tenant_id, nome, descricao, ordem, e_padrao, e_sistema, permissoes)
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Líder Geral', 'Acesso completo à organização.', 1, false, true,
   '["crm.ver","crm.criar","crm.editar","crm.excluir","agenda.ver","agenda.criar","agenda.editar","agenda.excluir","outbound.ver","outbound.criar","outbound.editar","outbound.excluir","times.ver","times.gerenciar","usuarios.ver","usuarios.convidar","usuarios.gerenciar","cargos.ver","cargos.gerenciar","configuracoes.ver","configuracoes.editar","relatorios.ver"]'::jsonb),

  ('c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   'Líder de Time', 'Gerencia seu time. CRM, agenda e outbound sem exclusão.', 2, false, true,
   '["crm.ver","crm.criar","crm.editar","agenda.ver","agenda.criar","agenda.editar","outbound.ver","outbound.criar","outbound.editar","times.ver","times.gerenciar","usuarios.ver","usuarios.convidar","cargos.ver","configuracoes.ver","relatorios.ver"]'::jsonb),

  ('c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001',
   'Membro de Time', 'Visualiza e cria registros. Não exclui nem gerencia.', 3, true, true,
   '["crm.ver","crm.criar","agenda.ver","agenda.criar","outbound.ver","outbound.criar","times.ver","usuarios.ver","relatorios.ver"]'::jsonb),

  ('c0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001',
   'Observador', 'Somente leitura, em toda a organização.', 4, false, false,
   '["crm.ver","agenda.ver","outbound.ver","times.ver","usuarios.ver","cargos.ver","configuracoes.ver","relatorios.ver"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  nome       = EXCLUDED.nome,
  descricao  = EXCLUDED.descricao,
  ordem      = EXCLUDED.ordem,
  e_padrao   = EXCLUDED.e_padrao,
  e_sistema  = EXCLUDED.e_sistema,
  permissoes = EXCLUDED.permissoes;
-- DO UPDATE, e nao DO NOTHING: ao ajustar as permissoes deste arquivo,
-- reexecutar precisa sincronizar os cargos existentes. Com DO NOTHING o
-- banco ficaria preso na primeira versao do seed.

-- ---------- USUARIOS DE AUTENTICACAO ----------
-- O trigger on_auth_user_created cria a linha correspondente em
-- public.users, lendo tenant_id e cargo de raw_user_meta_data.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  v.id::uuid,
  'authenticated',
  'authenticated',
  v.email,
  crypt('prancheto-dev-2026', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'nome', v.nome,
    'cargo', v.cargo,
    'tenant_id', 'd0000000-0000-4000-8000-000000000001'
  ),
  '', '', '', ''
FROM (VALUES
  ('a0000000-0000-4000-8000-000000000001', 'admin@acme.dev',   'Ana Duarte',      'admin'),
  ('a0000000-0000-4000-8000-000000000002', 'gerente@acme.dev', 'Bruno Menezes',   'manager'),
  ('a0000000-0000-4000-8000-000000000003', 'membro@acme.dev',  'Carla Rodrigues', 'member')
) AS v(id, email, nome, cargo)
WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = v.id::uuid);

-- Vincula cada usuario ao cargo organizacional correspondente.
UPDATE public.users SET cargo_id = 'c0000000-0000-4000-8000-000000000001'
  WHERE id = 'a0000000-0000-4000-8000-000000000001';
UPDATE public.users SET cargo_id = 'c0000000-0000-4000-8000-000000000002'
  WHERE id = 'a0000000-0000-4000-8000-000000000002';
UPDATE public.users SET cargo_id = 'c0000000-0000-4000-8000-000000000003'
  WHERE id = 'a0000000-0000-4000-8000-000000000003';

-- ---------- TIMES ----------
INSERT INTO public.org_times (id, tenant_id, nome, descricao, icone, cor_primaria, criado_por)
VALUES
  ('70000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   'Comercial', 'Prospeccao e fechamento', '📈', '#10b981',
   'a0000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   'Entrega', 'Execucao dos projetos contratados', '🚀', '#6366f1',
   'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.org_time_membros (time_id, user_id, cargo_id)
VALUES
  ('70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'),
  ('70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('70000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('70000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003')
ON CONFLICT (time_id, user_id) DO NOTHING;

-- ---------- CRM: LEADS E CLIENTES ----------
-- Distribuidos por todo o funil, para que o Kanban tenha volume em
-- cada coluna e os estados vazios nao mascarem problemas de layout.
INSERT INTO public.crm_contatos (
  id, tenant_id, time_id, responsavel_id, nome, email, telefone, empresa, cargo,
  tipo_registro, status_funil, origem, score, valor_estimado, ltv, tags, observacoes
)
VALUES
  ('c8000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Marina Castro', 'marina@nortelog.dev', '(11) 94001-2233', 'Norte Logistica', 'Diretora de Operacoes',
   'lead', 'lead', 'site', 35, 18000.00, 0, '["inbound","logistica"]'::jsonb,
   'Baixou o material sobre roteirizacao. Ainda nao respondeu ao contato.'),

  ('c8000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Rafael Pinheiro', 'rafael@vitrinedigital.dev', '(21) 98812-7744', 'Vitrine Digital', 'Socio',
   'lead', 'qualificado', 'indicacao', 62, 45000.00, 0, '["indicacao","e-commerce"]'::jsonb,
   'Indicado pela Acme Retail. Reuniao de descoberta ja realizada.'),

  ('c8000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
   'Juliana Prado', 'juliana@clinicasaude.dev', '(31) 99120-5566', 'Clinica Saude Viva', 'Gestora',
   'lead', 'proposta', 'evento', 74, 72000.00, 0, '["saude","proposta-enviada"]'::jsonb,
   'Proposta enviada. Aguardando retorno do comite ate o fim do mes.'),

  ('c8000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Eduardo Lima', 'eduardo@construtorapl.dev', '(41) 98455-9911', 'Construtora PL', 'CFO',
   'lead', 'negociacao', 'outbound', 88, 130000.00, 0, '["enterprise","negociacao"]'::jsonb,
   'Discutindo prazo de pagamento. Pediu desconto de 8%.'),

  ('c8000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002',
   'Patricia Nunes', 'patricia@modaurbana.dev', '(11) 97733-1200', 'Moda Urbana', 'Head de Marketing',
   'lead', 'perdido', 'site', 20, 15000.00, 0, '["perdido","orcamento"]'::jsonb,
   'Optou por concorrente com preco menor. Retomar no proximo semestre.'),

  ('c8000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
   'Sergio Bastos', 'sergio@acmeretail.dev', '(11) 96622-3344', 'Acme Retail', 'CEO',
   'cliente', 'fechado', 'indicacao', 95, 96000.00, 96000, '["cliente","recorrente"]'::jsonb,
   'Cliente desde o inicio do ano. Contrato anual, renovacao automatica.'),

  ('c8000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000003',
   'Fernanda Alves', 'fernanda@techstart.dev', '(48) 99008-4412', 'TechStart', 'COO',
   'cliente', 'fechado', 'evento', 90, 54000.00, 54000, '["cliente","saas"]'::jsonb,
   'Projeto de implantacao em andamento, entrega prevista para o trimestre.'),

  ('c8000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000003',
   'Otavio Reis', 'otavio@agroverde.dev', '(62) 98177-2299', 'AgroVerde', 'Gerente de TI',
   'lead', 'lead', 'manual', 18, 9000.00, 0, '["frio"]'::jsonb,
   'Cadastro manual apos feira do setor. Sem contato ainda.')
ON CONFLICT (id) DO NOTHING;

-- ---------- PROJETOS ----------
INSERT INTO public.projetos (
  id, tenant_id, time_id, nome, descricao, status, prioridade, progresso,
  icone, cor, data_inicio, data_fim, criado_por
)
VALUES
  ('90000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000002',
   'Implantacao Acme Retail', 'Rollout do CRM em 12 lojas, com migracao de base e treinamento.',
   'em_andamento', 'alta', 65, '🏬', '#10b981', '2026-06-01', '2026-09-30',
   'a0000000-0000-4000-8000-000000000001'),

  ('90000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   '70000000-0000-4000-8000-000000000002',
   'Onboarding TechStart', 'Configuracao inicial, integracoes e migracao de dados legados.',
   'planejamento', 'media', 15, '🚀', '#6366f1', '2026-08-15', '2026-11-15',
   'a0000000-0000-4000-8000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- ---------- TAREFAS ----------
INSERT INTO public.tarefas (
  id, tenant_id, projeto_id, time_id, titulo, descricao,
  status, prioridade, data_vencimento, estimativa_h, criado_por
)
VALUES
  ('7a000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002',
   'Mapear campos da base legada', 'Levantar de-para entre planilhas e o modelo do CRM.',
   'concluida', 'alta', '2026-06-20 18:00-03', 16, 'a0000000-0000-4000-8000-000000000001'),

  ('7a000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002',
   'Migrar contatos das lojas 1 a 6', 'Primeira leva de importacao com validacao de duplicatas.',
   'concluida', 'alta', '2026-07-10 18:00-03', 24, 'a0000000-0000-4000-8000-000000000001'),

  ('7a000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002',
   'Migrar contatos das lojas 7 a 12', 'Segunda leva, aproveitando o script da primeira.',
   'em_andamento', 'alta', '2026-08-14 18:00-03', 20, 'a0000000-0000-4000-8000-000000000002'),

  ('7a000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002',
   'Treinar equipe de vendas', 'Duas turmas de 3h, presencial na matriz.',
   'em_revisao', 'media', '2026-08-28 18:00-03', 8, 'a0000000-0000-4000-8000-000000000002'),

  ('7a000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000002',
   'Configurar relatorio de conversao', 'Painel por loja e por vendedor.',
   'pendente', 'baixa', '2026-09-15 18:00-03', 12, 'a0000000-0000-4000-8000-000000000003'),

  ('7a000000-0000-4000-8000-000000000006', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002',
   'Kickoff com o cliente', 'Alinhar escopo, marcos e canal de comunicacao.',
   'pendente', 'critica', '2026-08-18 14:00-03', 3, 'a0000000-0000-4000-8000-000000000002'),

  ('7a000000-0000-4000-8000-000000000007', 'd0000000-0000-4000-8000-000000000001',
   '90000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002',
   'Levantar integracoes necessarias', 'ERP, gateway de pagamento e e-mail marketing.',
   'pendente', 'alta', '2026-08-25 18:00-03', 10, 'a0000000-0000-4000-8000-000000000003'),

  ('7a000000-0000-4000-8000-000000000008', 'd0000000-0000-4000-8000-000000000001',
   NULL, '70000000-0000-4000-8000-000000000001',
   'Revisar script de prospeccao', 'Ajustar abordagem para o setor de saude.',
   'em_andamento', 'media', '2026-08-08 18:00-03', 4, 'a0000000-0000-4000-8000-000000000002'),

  ('7a000000-0000-4000-8000-000000000009', 'd0000000-0000-4000-8000-000000000001',
   NULL, '70000000-0000-4000-8000-000000000001',
   'Follow-up Construtora PL', 'Responder pedido de desconto com contraproposta.',
   'pendente', 'critica', '2026-08-04 12:00-03', 1, 'a0000000-0000-4000-8000-000000000002'),

  ('7a000000-0000-4000-8000-00000000000a', 'd0000000-0000-4000-8000-000000000001',
   NULL, '70000000-0000-4000-8000-000000000001',
   'Retrospectiva do trimestre', 'Consolidar aprendizados do funil e taxa de perda.',
   'cancelada', 'baixa', '2026-07-31 18:00-03', 2, 'a0000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ---------- RESUMO ----------
SELECT 'tenants'   AS tabela, count(*) FROM public.tenants
UNION ALL SELECT 'users',            count(*) FROM public.users
UNION ALL SELECT 'org_cargos',       count(*) FROM public.org_cargos
UNION ALL SELECT 'org_times',        count(*) FROM public.org_times
UNION ALL SELECT 'org_time_membros', count(*) FROM public.org_time_membros
UNION ALL SELECT 'crm_contatos',     count(*) FROM public.crm_contatos
UNION ALL SELECT 'projetos',         count(*) FROM public.projetos
UNION ALL SELECT 'tarefas',          count(*) FROM public.tarefas;
