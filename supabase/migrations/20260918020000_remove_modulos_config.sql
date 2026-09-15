-- Migration: remove modulos_config e a tela /modulos. Confirmado por
-- auditoria de código que nenhuma outra parte do sistema depende dela —
-- inclusive o slug 'crm' na tabela é vestigial: o item de CRM na sidebar
-- (CATALOGO_SIDEBAR) já é independente e nunca leu modulos_config.
DROP TABLE IF EXISTS public.modulos_config;
DROP FUNCTION IF EXISTS public.trigger_modulos_config_updated_at();
