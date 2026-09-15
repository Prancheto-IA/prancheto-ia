-- Migration: registra chat.criar_grupo no catálogo de permissões e
-- concede por padrão aos cargos de liderança já existentes. Sem este
-- passo a permissão nasceria negada pra quem já usa o sistema (mesmo
-- raciocínio já documentado pra perfil.editar_proprio).
--
-- Não existe coluna "nível do cargo" no schema, então a heurística de
-- "liderança" combina nome conhecido do seed padrão com permissões de
-- gestão já concedidas (usuarios.gerenciar / times.gerenciar).
UPDATE public.org_cargos
   SET permissoes    = permissoes || '["chat.criar_grupo"]'::jsonb,
       atualizado_em = now()
 WHERE NOT (permissoes ? 'chat.criar_grupo')
   AND (
     nome IN ('Líder Geral', 'Líder de Time')
     OR permissoes ? 'usuarios.gerenciar'
     OR permissoes ? 'times.gerenciar'
   );
