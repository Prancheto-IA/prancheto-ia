-- =============================================================
-- FASE 1: Coluna cargo_id em users
-- FK para org_cargos — associa cada usuário ao seu cargo customizado.
-- Aplicada via MCP em 2026-07-11.
-- =============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES public.org_cargos(id) ON DELETE SET NULL;
