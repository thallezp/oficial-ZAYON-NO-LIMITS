-- ============================================================================
-- Migration: Banco de Hooks
-- Tabela para guardar hooks/ganchos reutilizaveis para roteiros (TikTok, Reels)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_hooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.personas(id) ON DELETE CASCADE,
  text text NOT NULL,
  category text DEFAULT 'custom',
  tag text,
  tested jsonb,
  performance_score integer,
  notes text,
  created_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_hooks_workspace_idx ON public.content_hooks (workspace_id);
CREATE INDEX IF NOT EXISTS content_hooks_persona_idx ON public.content_hooks (persona_id);
CREATE INDEX IF NOT EXISTS content_hooks_category_idx ON public.content_hooks (category);

-- RLS
ALTER TABLE public.content_hooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS content_hooks_select ON public.content_hooks;
CREATE POLICY content_hooks_select ON public.content_hooks
  FOR SELECT
  USING (workspace_id IN (SELECT private.user_workspaces()));

DROP POLICY IF EXISTS content_hooks_insert ON public.content_hooks;
CREATE POLICY content_hooks_insert ON public.content_hooks
  FOR INSERT
  WITH CHECK (workspace_id IN (SELECT private.user_workspaces()));

DROP POLICY IF EXISTS content_hooks_update ON public.content_hooks;
CREATE POLICY content_hooks_update ON public.content_hooks
  FOR UPDATE
  USING (workspace_id IN (SELECT private.user_workspaces()))
  WITH CHECK (workspace_id IN (SELECT private.user_workspaces()));

DROP POLICY IF EXISTS content_hooks_delete ON public.content_hooks;
CREATE POLICY content_hooks_delete ON public.content_hooks
  FOR DELETE
  USING (workspace_id IN (SELECT private.user_workspaces()));

COMMENT ON TABLE public.content_hooks IS
  'Biblioteca de ganchos/atrativos reutilizaveis para roteiros de conteudo curto (TikTok, Reels, Shorts).';
