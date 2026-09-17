-- Migration: Bloco 2 — colapsar a sidebar inteira e alternar o Chat IA
-- entre bolha flutuante (padrão) e item fixo na barra lateral.
-- Segue o padrão já usado em sidebar_preferencias: uma linha por usuário
-- (UNIQUE user_id), RLS por auth.uid() já cobre as colunas novas porque as
-- policies existentes não restringem por coluna.

ALTER TABLE public.sidebar_preferencias
  ADD COLUMN IF NOT EXISTS sidebar_colapsada boolean NOT NULL DEFAULT false;

ALTER TABLE public.sidebar_preferencias
  ADD COLUMN IF NOT EXISTS chat_ia_modo text NOT NULL DEFAULT 'flutuante';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sidebar_preferencias_chat_ia_modo_check'
  ) THEN
    ALTER TABLE public.sidebar_preferencias
      ADD CONSTRAINT sidebar_preferencias_chat_ia_modo_check
      CHECK (chat_ia_modo = ANY (ARRAY['flutuante'::text, 'fixo'::text]));
  END IF;
END $$;

COMMENT ON COLUMN public.sidebar_preferencias.sidebar_colapsada IS 'Se true, a barra lateral inteira aparece recolhida (só ícones) pra esse usuário.';
COMMENT ON COLUMN public.sidebar_preferencias.chat_ia_modo IS 'flutuante (padrão): Chat IA vira bolha arrastável, some da navegação. fixo: comportamento antigo, item normal na sidebar.';
