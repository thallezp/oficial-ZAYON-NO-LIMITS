create schema if not exists private;

create or replace function private.user_workspaces()
returns setof uuid as $$
begin
  return query
  select workspace_id
  from public.workspace_members
  where user_id = auth.uid();
end;
$$ language plpgsql stable security definer;

create or replace function private.can_select_workspace_member(ws_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspaces where id = ws_id and owner_id = auth.uid()
  ) or exists (
    select 1 from public.workspace_members where workspace_id = ws_id and user_id = auth.uid()
  );
end;
$$ language plpgsql stable security definer;

create or replace function private.can_insert_workspace_member(ws_id uuid, u_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workspaces where id = ws_id and owner_id = auth.uid()
  ) or exists (
    select 1
    from public.workspace_members
    where workspace_id = ws_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
end;
$$ language plpgsql stable security definer;

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert
  with check (id = auth.uid());

drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select
  using (
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
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select
  using (owner_id = auth.uid() or id in (select private.user_workspaces()));

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert
  with check (owner_id = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete
  using (owner_id = auth.uid());

drop policy if exists workspace_members_select on public.workspace_members;
create policy workspace_members_select on public.workspace_members
  for select
  using (user_id = auth.uid() or private.can_select_workspace_member(workspace_id));

drop policy if exists workspace_members_insert on public.workspace_members;
create policy workspace_members_insert on public.workspace_members
  for insert
  with check (private.can_insert_workspace_member(workspace_id, user_id));

drop policy if exists workspace_members_update on public.workspace_members;
create policy workspace_members_update on public.workspace_members
  for update
  using (private.can_insert_workspace_member(workspace_id, user_id));

drop policy if exists workspace_members_delete on public.workspace_members;
create policy workspace_members_delete on public.workspace_members
  for delete
  using (user_id = auth.uid() or private.can_insert_workspace_member(workspace_id, user_id));
