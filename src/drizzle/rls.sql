-- ============================================================
-- ZAYON No Limits · Row Level Security policies
-- ============================================================
-- Aplicar apos rodar `drizzle-kit push`. Tabelas-raiz carregam
-- workspace_id diretamente; tabelas-filhas herdam o acesso da
-- tabela-pai via policies relacionais.
-- ============================================================

create schema if not exists private;

-- Helper privado: retorna a lista de workspaces aos quais o usuario pertence.
create or replace function private.user_workspaces()
returns setof uuid
language sql
security definer
set search_path = ''
as $$
  select workspace_id
    from public.workspace_members
   where user_id = auth.uid();
$$;

-- Habilita RLS em todas as tabelas operacionais
alter table public.users                 enable row level security;
alter table public.workspaces            enable row level security;
alter table public.workspace_members     enable row level security;
alter table public.invitations           enable row level security;
alter table public.personas              enable row level security;
alter table public.projects              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.task_labels           enable row level security;
alter table public.task_comments         enable row level security;
alter table public.documents             enable row level security;
alter table public.document_blocks       enable row level security;
alter table public.folders               enable row level security;
alter table public.materials             enable row level security;
alter table public.calendar_events       enable row level security;
alter table public.content_items         enable row level security;
alter table public.content_metrics       enable row level security;
alter table public.content_comments      enable row level security;
alter table public.content_references    enable row level security;
alter table public.modeling_profiles     enable row level security;
alter table public.modeling_content_examples enable row level security;
alter table public.prompt_chains         enable row level security;
alter table public.prompt_iterations     enable row level security;
alter table public.sales_funnels         enable row level security;
alter table public.funnel_nodes          enable row level security;
alter table public.funnel_edges          enable row level security;
alter table public.flows                 enable row level security;
alter table public.flow_nodes            enable row level security;
alter table public.flow_edges            enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.bills                 enable row level security;
alter table public.payroll_members       enable row level security;
alter table public.lead_sources          enable row level security;
alter table public.leads                 enable row level security;
alter table public.lead_answers          enable row level security;
alter table public.lead_status_history   enable row level security;
alter table public.google_sheets_connections enable row level security;
alter table public.tool_categories       enable row level security;
alter table public.tools                 enable row level security;
alter table public.tool_tags             enable row level security;
alter table public.tool_embeds           enable row level security;
alter table public.tool_links            enable row level security;
alter table public.tool_favorites        enable row level security;
alter table public.tool_recents          enable row level security;
alter table public.launch_campaigns      enable row level security;
alter table public.launch_events         enable row level security;
alter table public.icp_pains             enable row level security;
alter table public.sales_copies          enable row level security;
alter table public.ai_threads            enable row level security;
alter table public.ai_messages           enable row level security;
alter table public.ai_actions            enable row level security;
alter table public.ai_tool_calls         enable row level security;
alter table public.comments              enable row level security;
alter table public.mentions              enable row level security;
alter table public.activity_logs         enable row level security;
alter table public.notifications         enable row level security;
alter table public.roles                 enable row level security;
alter table public.permissions           enable row level security;

-- Usuarios: perfil proprio ou pessoas que compartilham workspace
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

-- Politica generica: tabelas com workspace_id direto
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'personas','projects','tasks','documents','folders','materials',
      'calendar_events','content_items','modeling_profiles','prompt_chains',
      'sales_funnels','flows','financial_transactions','bills',
      'payroll_members','lead_sources','leads','google_sheets_connections',
      'tool_categories','tools','launch_campaigns','icp_pains','sales_copies',
      'ai_threads','ai_actions','comments','activity_logs','notifications',
      'roles','invitations'
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

-- Tabelas-filhas: o acesso segue o workspace da entidade-pai
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
        ('permissions', 'exists (select 1 from public.roles parent where parent.id = role_id and parent.workspace_id in (select private.user_workspaces()))')
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

-- Workspace members so veem membros do mesmo workspace
drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select using (workspace_id in (select private.user_workspaces()));

-- Workspaces: usuario so ve os seus
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (id in (select private.user_workspaces()));

-- Auditoria: bloquear delete de activity_logs por roles comuns
drop policy if exists activity_logs_no_delete on public.activity_logs;
create policy activity_logs_no_delete on public.activity_logs
  for delete using (false);
