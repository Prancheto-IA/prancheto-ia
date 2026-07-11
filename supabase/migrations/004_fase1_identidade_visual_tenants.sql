-- =============================================================
-- FASE 1: Identidade Visual em Tenants
-- Adiciona suporte a logo e paleta de cores por organização.
-- Aplicada via MCP em 2026-07-11.
-- =============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS identidade_visual JSONB NOT NULL DEFAULT '{
    "cor_primaria": "#1e3a5f",
    "cor_secundaria": "#000000",
    "cor_acento": "#ffffff",
    "fonte": "Inter"
  }'::jsonb;
