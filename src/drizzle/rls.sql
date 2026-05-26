-- ============================================================
-- NEXUS Workspace OS · Row Level Security policies
-- ============================================================
-- Aplicar após rodar `drizzle-kit push`. Toda tabela operacional
-- carrega workspace_id; apenas membros do workspace acessam suas
-- linhas. Personas seguem o mesmo princípio via cascata.
-- ============================================================

-- Helper: retorna a lista de workspaces aos quais o usuário pertence.
create or replace function public.user_workspaces()
returns setof uuid
language sql
security definer
as $$
  select workspace_id
    from public.workspace_members
   where user_id = auth.uid();
$$;

-- Habilita RLS em todas as tabelas operacionais
alter table public.workspaces            enable row level security;
alter table public.workspace_members     enable row level security;
alter table public.personas              enable row level security;
alter table public.projects              enable row level security;
alter table public.tasks                 enable row level security;
alter table public.documents             enable row level security;
alter table public.materials             enable row level security;
alter table public.calendar_events       enable row level security;
alter table public.content_items         enable row level security;
alter table public.content_metrics       enable row level security;
alter table public.modeling_profiles     enable row level security;
alter table public.prompt_chains         enable row level security;
alter table public.sales_funnels         enable row level security;
alter table public.flows                 enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.bills                 enable row level security;
alter table public.payroll_members       enable row level security;
alter table public.leads                 enable row level security;
alter table public.lead_answers          enable row level security;
alter table public.tools                 enable row level security;
alter table public.launch_campaigns      enable row level security;
alter table public.icp_pains             enable row level security;
alter table public.sales_copies          enable row level security;
alter table public.ai_threads            enable row level security;
alter table public.ai_messages           enable row level security;
alter table public.ai_actions            enable row level security;
alter table public.activity_logs         enable row level security;
alter table public.notifications         enable row level security;

-- Política genérica: SELECT/INSERT/UPDATE/DELETE restritos ao workspace do usuário
do $$
declare t text;
begin
  for t in
    select unnest(array[
      'personas','projects','tasks','documents','materials','calendar_events',
      'content_items','modeling_profiles','prompt_chains','sales_funnels','flows',
      'financial_transactions','bills','payroll_members','leads','lead_answers',
      'tools','launch_campaigns','icp_pains','sales_copies','ai_threads','ai_actions',
      'activity_logs','notifications'
    ])
  loop
    execute format('drop policy if exists %I_workspace_select on public.%I;', t, t);
    execute format('drop policy if exists %I_workspace_mutate on public.%I;', t, t);

    execute format(
      'create policy %I_workspace_select on public.%I for select using (workspace_id in (select user_workspaces()));',
      t, t
    );
    execute format(
      'create policy %I_workspace_mutate on public.%I for all using (workspace_id in (select user_workspaces())) with check (workspace_id in (select user_workspaces()));',
      t, t
    );
  end loop;
end $$;

-- Workspace members só veem membros do mesmo workspace
drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select using (workspace_id in (select user_workspaces()));

-- Workspaces: usuário só vê os seus
drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (id in (select user_workspaces()));

-- Auditoria: bloquear delete de activity_logs por roles comuns
drop policy if exists activity_logs_no_delete on public.activity_logs;
create policy activity_logs_no_delete on public.activity_logs
  for delete using (false);
