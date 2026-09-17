-- Migration: Bloco 3 — sistema de widgets da tela de Início.
-- Mesmo padrão de sidebar_preferencias (uma linha por usuário, RLS só por
-- auth.uid(), sem gate de cargo) — não o padrão de modulos_config (que é
-- por tenant/time, escrita restrita a admin/manager, e começa tudo
-- desativado). Aqui os widgets padrão já nascem visíveis.

CREATE TABLE IF NOT EXISTS public.home_widgets_config (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  -- Array JSON: [{"slug":"mini_agenda","visivel":true,"ordem":0}, ...]
  widgets       jsonb NOT NULL DEFAULT '[]',
  criado_em     timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

COMMENT ON TABLE public.home_widgets_config IS 'Preferências individuais dos widgets da tela de Início por usuário (ordem e visibilidade).';
COMMENT ON COLUMN public.home_widgets_config.widgets IS 'Array JSON: [{slug, visivel, ordem}]. Widgets não listados usam os defaults do catálogo no frontend.';

CREATE INDEX IF NOT EXISTS idx_home_widgets_user ON public.home_widgets_config(user_id);
CREATE INDEX IF NOT EXISTS idx_home_widgets_tenant ON public.home_widgets_config(tenant_id);

CREATE OR REPLACE FUNCTION public.trigger_home_widgets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_home_widgets_updated_at ON public.home_widgets_config;
CREATE TRIGGER trg_home_widgets_updated_at
  BEFORE UPDATE ON public.home_widgets_config
  FOR EACH ROW EXECUTE FUNCTION public.trigger_home_widgets_updated_at();

ALTER TABLE public.home_widgets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "home_widgets_select" ON public.home_widgets_config
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "home_widgets_insert" ON public.home_widgets_config
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "home_widgets_update" ON public.home_widgets_config
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "home_widgets_delete" ON public.home_widgets_config
  FOR DELETE USING (user_id = auth.uid());
