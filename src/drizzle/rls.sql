-- ============================================================
-- ZAYON No Limits - Row Level Security policies
-- ============================================================
-- Apply after running `drizzle-kit push`. Root tables carry
-- `workspace_id` directly; child tables inherit access from
-- their parent entities via relational policies.
-- ============================================================

create schema if not exists private;

create or replace function private.user_workspaces()
returns setof uuid
language plpgsql
security definer
as $$
begin
  return query
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid();
end;
$$;

create or replace function private.can_select_workspace_member(ws_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.workspaces
    where id = ws_id
      and owner_id = auth.uid()
  ) or exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
end;
$$;

create or replace function private.can_insert_workspace_member(ws_id uuid, u_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.workspaces
    where id = ws_id
      and owner_id = auth.uid()
  ) or exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
end;
$$;

alter table public.users                     enable row level security;
alter table public.workspaces                enable row level security;
alter table public.workspace_members         enable row level security;
alter table public.invitations               enable row level security;
alter table public.personas                  enable row level security;
alter table public.persona_channels          enable row level security;
alter table public.persona_metrics_snapshots enable row level security;
alter table public.content_pillars           enable row level security;
alter table public.projects                  enable row level security;
alter table public.tasks                     enable row level security;
alter table public.task_labels               enable row level security;
alter table public.task_comments             enable row level security;
alter table public.documents                 enable row level security;
alter table public.document_blocks           enable row level security;
alter table public.folders                   enable row level security;
alter table public.materials                 enable row level security;
alter table public.calendar_events           enable row level security;
alter table public.content_items             enable row level security;
alter table public.content_metrics           enable row level security;
alter table public.content_comments          enable row level security;
alter table public.content_references        enable row level security;
alter table public.modeling_profiles         enable row level security;
alter table public.modeling_content_examples enable row level security;
alter table public.prompt_chains             enable row level security;
alter table public.prompt_iterations         enable row level security;
alter table public.sales_funnels             enable row level security;
alter table public.funnel_nodes              enable row level security;
alter table public.funnel_edges              enable row level security;
alter table public.flows                     enable row level security;
alter table public.flow_nodes                enable row level security;
alter table public.flow_edges                enable row level security;
alter table public.financial_categories      enable row level security;
alter table public.financial_transactions    enable row level security;
alter table public.bills                     enable row level security;
alter table public.payroll_members           enable row level security;
alter table public.lead_sources              enable row level security;
alter table public.leads                     enable row level security;
alter table public.lead_answers              enable row level security;
alter table public.lead_status_history       enable row level security;
alter table public.google_sheets_connections enable row level security;
alter table public.tool_categories           enable row level security;
alter table public.tools                     enable row level security;
alter table public.tool_tags                 enable row level security;
alter table public.tool_embeds               enable row level security;
alter table public.tool_links                enable row level security;
alter table public.tool_favorites            enable row level security;
alter table public.tool_recents              enable row level security;
alter table public.launch_campaigns          enable row level security;
alter table public.launch_events             enable row level security;
alter table public.icp_pains                 enable row level security;
alter table public.sales_copies              enable row level security;
alter table public.ai_threads                enable row level security;
alter table public.ai_messages               enable row level security;
alter table public.ai_actions                enable row level security;
alter table public.ai_tool_calls             enable row level security;
alter table public.comments                  enable row level security;
alter table public.mentions                  enable row level security;
alter table public.presence_sessions         enable row level security;
alter table public.activity_logs             enable row level security;
alter table public.notifications             enable row level security;
alter table public.roles                     enable row level security;
alter table public.permissions               enable row level security;
alter table public.study_objectives          enable row level security;
alter table public.study_tracks              enable row level security;
alter table public.study_modules             enable row level security;
alter table public.study_module_items        enable row level security;
alter table public.study_resources           enable row level security;
alter table public.study_goals               enable row level security;
alter table public.focus_sessions            enable row level security;
alter table public.study_reviews             enable row level security;
alter table public.study_plans               enable row level security;
alter table public.study_achievements        enable row level security;
alter table public.study_settings            enable row level security;
alter table public.energy_daily_logs         enable row level security;
alter table public.energy_settings           enable row level security;
alter table public.porn_events               enable row level security;
alter table public.personal_accounts         enable row level security;
alter table public.personal_categories       enable row level security;
alter table public.personal_transactions     enable row level security;
alter table public.personal_bills            enable row level security;
alter table public.personal_goals            enable row level security;

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert
  with check (id = auth.uid());

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (
    id = auth.uid()
    or exists (
      select 1
      from public.workspace_members wm_self
      join public.workspace_members wm_target
        on wm_self.workspace_id = wm_target.workspace_id
      where wm_self.user_id = auth.uid()
        and wm_target.user_id = users.id
    )
  );

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update using (id = auth.uid())
  with check (id = auth.uid());

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'personas','persona_channels','persona_metrics_snapshots','content_pillars',
      'projects','tasks','documents','folders','materials','calendar_events',
      'content_items','modeling_profiles','prompt_chains','sales_funnels','flows',
      'financial_categories','financial_transactions','bills','payroll_members',
      'lead_sources','leads','google_sheets_connections','tool_categories','tools',
      'launch_campaigns','icp_pains','sales_copies','ai_threads','ai_actions',
      'comments','presence_sessions','activity_logs','notifications','roles',
      'invitations',
      'focus_sessions','study_reviews','study_plans','study_achievements','study_settings'
    ])
  loop
    execute format('drop policy if exists %I_workspace_select on public.%I;', t, t);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', t, t);

    execute format(
      'create policy %I_workspace_select on public.%I for select using (workspace_id in (select private.user_workspaces()));',
      t, t
    );
    execute format(
      'create policy %I_workspace_mutate on public.%I for all using (workspace_id in (select private.user_workspaces())) with check (workspace_id in (select private.user_workspaces()));',
      t, t
    );
  end loop;
end $$;

do $$
declare policy_record record;
begin
  for policy_record in
    select *
    from (values
      ('task_labels', 'exists (select 1 from public.tasks parent where parent.id = task_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('task_comments', 'exists (select 1 from public.tasks parent where parent.id = task_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('document_blocks', 'exists (select 1 from public.documents parent where parent.id = document_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('content_comments', 'exists (select 1 from public.content_items parent where parent.id = content_item_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('content_metrics', 'exists (select 1 from public.content_items parent where parent.id = content_item_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('content_references', 'exists (select 1 from public.content_items parent where parent.id = content_item_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('modeling_content_examples', 'exists (select 1 from public.modeling_profiles parent where parent.id = profile_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('prompt_iterations', 'exists (select 1 from public.prompt_chains parent where parent.id = prompt_chain_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('flow_nodes', 'exists (select 1 from public.flows parent where parent.id = flow_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('flow_edges', 'exists (select 1 from public.flows parent where parent.id = flow_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('funnel_nodes', 'exists (select 1 from public.sales_funnels parent where parent.id = funnel_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('funnel_edges', 'exists (select 1 from public.sales_funnels parent where parent.id = funnel_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('lead_answers', 'exists (select 1 from public.leads parent where parent.id = lead_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('lead_status_history', 'exists (select 1 from public.leads parent where parent.id = lead_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('tool_tags', 'exists (select 1 from public.tools parent where parent.id = tool_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('tool_embeds', 'exists (select 1 from public.tools parent where parent.id = tool_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('tool_links', 'exists (select 1 from public.tools parent where parent.id = tool_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('tool_favorites', 'exists (select 1 from public.tools parent where parent.id = tool_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('tool_recents', 'exists (select 1 from public.tools parent where parent.id = tool_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('launch_events', 'exists (select 1 from public.launch_campaigns parent where parent.id = campaign_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('ai_messages', 'exists (select 1 from public.ai_threads parent where parent.id = thread_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('ai_tool_calls', 'exists (select 1 from public.ai_actions parent where parent.id = action_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('mentions', 'exists (select 1 from public.comments parent where parent.id = comment_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('permissions', 'exists (select 1 from public.roles parent where parent.id = role_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('study_modules', 'exists (select 1 from public.study_tracks parent where parent.id = track_id and parent.workspace_id in (select private.user_workspaces()))'),
      ('study_module_items', 'exists (select 1 from public.study_modules m join public.study_tracks t on t.id = m.track_id where m.id = module_id and t.workspace_id in (select private.user_workspaces()))')
    ) as policies(table_name, predicate_sql)
  loop
    execute format('drop policy if exists %I_workspace_select on public.%I;', policy_record.table_name, policy_record.table_name);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', policy_record.table_name, policy_record.table_name);

    execute format(
      'create policy %I_workspace_select on public.%I for select using (%s);',
      policy_record.table_name,
      policy_record.table_name,
      policy_record.predicate_sql
    );
    execute format(
      'create policy %I_workspace_mutate on public.%I for all using (%s) with check (%s);',
      policy_record.table_name,
      policy_record.table_name,
      policy_record.predicate_sql,
      policy_record.predicate_sql
    );
  end loop;
end $$;

-- Tabelas pessoais (Gestão de Energia + Financeiro Pessoal): além de pertencer
-- ao workspace, a linha só é visível/editável pelo próprio dono (user_id).
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'energy_daily_logs','energy_settings','porn_events',
      'personal_accounts','personal_categories','personal_transactions',
      'personal_bills','personal_goals',
      'study_tracks','study_resources','study_objectives','study_goals'
    ])
  loop
    -- remove políticas antigas, inclusive as workspace-scoped de study_* que
    -- agora passam a ser por-usuário.
    execute format('drop policy if exists %I_workspace_select on public.%I;', t, t);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', t, t);
    execute format('drop policy if exists %I_owner_select on public.%I;', t, t);
    execute format('drop policy if exists %I_owner_mutate on public.%I;', t, t);

    execute format(
      'create policy %I_owner_select on public.%I for select using (workspace_id in (select private.user_workspaces()) and user_id = auth.uid());',
      t, t
    );
    execute format(
      'create policy %I_owner_mutate on public.%I for all using (workspace_id in (select private.user_workspaces()) and user_id = auth.uid()) with check (workspace_id in (select private.user_workspaces()) and user_id = auth.uid());',
      t, t
    );
  end loop;
end $$;

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select using (
    user_id = auth.uid()
    or private.can_select_workspace_member(workspace_id)
  );

drop policy if exists workspace_members_insert on public.workspace_members;
create policy workspace_members_insert on public.workspace_members
  for insert
  with check (private.can_insert_workspace_member(workspace_id, user_id));

drop policy if exists workspace_members_update on public.workspace_members;
create policy workspace_members_update on public.workspace_members
  for update using (private.can_insert_workspace_member(workspace_id, user_id));

drop policy if exists workspace_members_delete on public.workspace_members;
create policy workspace_members_delete on public.workspace_members
  for delete using (
    user_id = auth.uid()
    or private.can_insert_workspace_member(workspace_id, user_id)
  );

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (
    owner_id = auth.uid()
    or id in (select private.user_workspaces())
  );

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert
  with check (owner_id = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete using (owner_id = auth.uid());

drop policy if exists activity_logs_no_delete on public.activity_logs;
create policy activity_logs_no_delete on public.activity_logs
  for delete using (false);
