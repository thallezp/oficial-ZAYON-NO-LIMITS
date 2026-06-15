-- ============================================================================
-- Migration: Row Level Security e Realtime - Módulo Estudo & Foco
-- ============================================================================

-- Habilitar RLS
alter table public.study_objectives    enable row level security;
alter table public.study_tracks        enable row level security;
alter table public.study_modules       enable row level security;
alter table public.study_module_items  enable row level security;
alter table public.study_resources     enable row level security;
alter table public.study_goals         enable row level security;
alter table public.focus_sessions      enable row level security;
alter table public.study_reviews       enable row level security;
alter table public.study_plans         enable row level security;
alter table public.study_achievements  enable row level security;
alter table public.study_settings      enable row level security;

-- Raiz (workspace_id direto): select + all
do $$
declare t text;
begin
  for t in select unnest(array[
    'study_objectives','study_tracks','study_resources','study_goals',
    'focus_sessions','study_reviews','study_plans','study_achievements','study_settings'
  ]) loop
    execute format('drop policy if exists %I_workspace_select on public.%I;', t, t);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', t, t);
    execute format('create policy %I_workspace_select on public.%I for select using (workspace_id in (select private.user_workspaces()));', t, t);
    execute format('create policy %I_workspace_mutate on public.%I for all using (workspace_id in (select private.user_workspaces())) with check (workspace_id in (select private.user_workspaces()));', t, t);
  end loop;
end $$;

-- study_modules (filha de study_tracks)
drop policy if exists study_modules_workspace_select on public.study_modules;
drop policy if exists study_modules_workspace_mutate on public.study_modules;
create policy study_modules_workspace_select on public.study_modules for select
  using (exists (select 1 from public.study_tracks t where t.id = track_id and t.workspace_id in (select private.user_workspaces())));
create policy study_modules_workspace_mutate on public.study_modules for all
  using (exists (select 1 from public.study_tracks t where t.id = track_id and t.workspace_id in (select private.user_workspaces())))
  with check (exists (select 1 from public.study_tracks t where t.id = track_id and t.workspace_id in (select private.user_workspaces())));

-- study_module_items (neta: module -> track)
drop policy if exists study_module_items_workspace_select on public.study_module_items;
drop policy if exists study_module_items_workspace_mutate on public.study_module_items;
create policy study_module_items_workspace_select on public.study_module_items for select
  using (exists (select 1 from public.study_modules m join public.study_tracks t on t.id = m.track_id where m.id = module_id and t.workspace_id in (select private.user_workspaces())));
create policy study_module_items_workspace_mutate on public.study_module_items for all
  using (exists (select 1 from public.study_modules m join public.study_tracks t on t.id = m.track_id where m.id = module_id and t.workspace_id in (select private.user_workspaces())))
  with check (exists (select 1 from public.study_modules m join public.study_tracks t on t.id = m.track_id where m.id = module_id and t.workspace_id in (select private.user_workspaces())));

-- Habilitar Realtime para as tabelas operacionais de estudo
do $$
declare
  table_name text;
  tables_to_add text[] := array[
    'focus_sessions',
    'study_tracks',
    'study_modules',
    'study_module_items',
    'study_resources',
    'study_reviews'
  ];
begin
  foreach table_name in array tables_to_add loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
