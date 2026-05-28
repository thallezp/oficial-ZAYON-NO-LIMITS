do $$
declare
  table_name text;
  tables_to_add text[] := array[
    'calendar_events',
    'documents',
    'materials',
    'flows',
    'flow_nodes',
    'flow_edges',
    'sales_funnels',
    'funnel_nodes',
    'funnel_edges',
    'task_comments',
    'comments',
    'ai_actions',
    'ai_threads',
    'ai_messages',
    'ai_tool_calls',
    'projects',
    'personas',
    'tools'
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
