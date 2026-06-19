-- ============================================================================
-- Migration: RLS por USUÁRIO para tabelas pessoais do módulo Estudo & Foco
-- ----------------------------------------------------------------------------
-- Contexto: as políticas criadas em 20260615_study_rls.sql escopavam estas
-- tabelas apenas por WORKSPACE. Como o ZAYON tem vários membros no mesmo
-- workspace (ex.: dono, Renan, Diogo), qualquer um podia, via cliente Supabase
-- (RLS), enxergar as sessões/registros dos outros. As tabelas abaixo possuem
-- `user_id` e são pessoais — então restringimos cada linha ao seu dono.
--
-- A camada de aplicação (queries Drizzle) já filtra por userId, mas isto é
-- defesa em profundidade no próprio banco.
-- ============================================================================

-- Garante RLS habilitada (idempotente)
alter table public.focus_sessions     enable row level security;
alter table public.study_reviews       enable row level security;
alter table public.study_plans         enable row level security;
alter table public.study_achievements  enable row level security;
alter table public.study_settings      enable row level security;

-- Substitui as políticas de workspace por políticas escopadas ao usuário dono.
do $$
declare t text;
begin
  for t in select unnest(array[
    'focus_sessions','study_reviews','study_plans','study_achievements','study_settings'
  ]) loop
    -- remove políticas antigas (workspace) e quaisquer versões anteriores por usuário
    execute format('drop policy if exists %I_workspace_select on public.%I;', t, t);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', t, t);
    execute format('drop policy if exists %I_user_select on public.%I;', t, t);
    execute format('drop policy if exists %I_user_mutate on public.%I;', t, t);

    -- só o dono da linha (user_id = auth.uid()) que também pertença ao workspace
    execute format(
      'create policy %I_user_select on public.%I for select using (user_id = auth.uid() and workspace_id in (select private.user_workspaces()));',
      t, t
    );
    execute format(
      'create policy %I_user_mutate on public.%I for all using (user_id = auth.uid() and workspace_id in (select private.user_workspaces())) with check (user_id = auth.uid() and workspace_id in (select private.user_workspaces()));',
      t, t
    );
  end loop;
end $$;
