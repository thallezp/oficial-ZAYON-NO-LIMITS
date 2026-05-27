-- 19. Financial categories
insert into public.financial_categories (id, workspace_id, name, color, type)
select '141b96a4-630a-5a9d-a8eb-03f3cb6c75e7'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Infoproduto', null, 'revenue'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Infoproduto'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select 'b93389b7-83a6-59a7-a667-83a935b32d3e'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Mentoria', null, 'revenue'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Mentoria'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select 'da6949cc-a329-5241-a92e-0dc967e6decc'::uuid, (select id from public.workspaces where slug = 'nexus'), 'SaaS', null, 'expense'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'SaaS'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select '99c55ead-6e72-5303-a5e6-378b9da2f548'::uuid, (select id from public.workspaces where slug = 'nexus'), 'ProduÃ§Ã£o', null, 'expense'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'ProduÃ§Ã£o'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select '324848c6-f0ab-5b62-a8bb-a69a1e7a291e'::uuid, (select id from public.workspaces where slug = 'nexus'), 'IA', null, 'expense'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'IA'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select 'ddba09db-66d9-5fc6-aa75-cf857643e108'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Direct', null, 'revenue'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct'
);
insert into public.financial_categories (id, workspace_id, name, color, type)
select '976f4a1f-15af-50a8-a244-9178861018da'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Estrutura', null, 'expense'
where not exists (
  select 1 from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Estrutura'
);

-- 20. Financial transactions
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  '5cecb636-d9b9-58e8-afeb-5c4b0551d818'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  'revenue',
  'paid',
  'hotmart',
  12990,
  'Vendas Aurora Â· checkout Hotmart',
  null,
  '2026-05-26'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Infoproduto'),
  '{"categoryLabel":"Infoproduto"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Vendas Aurora Â· checkout Hotmart' and occurred_at = '2026-05-26'::date and amount = 12990
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  'f86f910e-08ca-50c6-a443-928fd7c082a0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  null,
  'revenue',
  'paid',
  'stripe',
  5421.4,
  'Mentoria Obsidian Â· 3 clientes',
  null,
  '2026-05-25'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Mentoria'),
  '{"categoryLabel":"Mentoria"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Mentoria Obsidian Â· 3 clientes' and occurred_at = '2026-05-25'::date and amount = 5421.4
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  'abaca628-2197-5ff2-ad81-71d52366875c'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  'expense',
  'paid',
  'transfer',
  2400,
  'Vercel + Supabase + Resend',
  null,
  '2026-05-24'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'SaaS'),
  '{"categoryLabel":"SaaS"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Vercel + Supabase + Resend' and occurred_at = '2026-05-24'::date and amount = 2400
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  'f681c90b-43a3-5ca5-ae39-81353c4937d4'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  'expense',
  'paid',
  'pix',
  7200,
  'EdiÃ§Ã£o Â· Rafael Â· Reels Aurora',
  null,
  '2026-05-23'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'ProduÃ§Ã£o'),
  '{"categoryLabel":"ProduÃ§Ã£o"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'EdiÃ§Ã£o Â· Rafael Â· Reels Aurora' and occurred_at = '2026-05-23'::date and amount = 7200
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  'c0306273-4825-5432-ab80-84b445834858'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  'revenue',
  'pending',
  'boleto',
  9400,
  'Parcelamento Â· turma piloto Aurora',
  null,
  '2026-05-29'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Infoproduto'),
  '{"categoryLabel":"Infoproduto"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Parcelamento Â· turma piloto Aurora' and occurred_at = '2026-05-29'::date and amount = 9400
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  '0d45c0a6-9ad1-51d4-a03f-a56e9f6bbb66'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  'expense',
  'paid',
  'stripe',
  1180,
  'OpenAI Â· GPT custos',
  null,
  '2026-05-26'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'IA'),
  '{"categoryLabel":"IA"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'OpenAI Â· GPT custos' and occurred_at = '2026-05-26'::date and amount = 1180
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  'fbb6182e-4c56-5907-adc5-90aa1a9fa0e8'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  'revenue',
  'paid',
  'pix',
  1997,
  'Venda direta Â· Helena P.',
  null,
  '2026-05-27'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct'),
  '{"categoryLabel":"Direct"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Venda direta Â· Helena P.' and occurred_at = '2026-05-27'::date and amount = 1997
);
insert into public.financial_transactions (
  id, workspace_id, persona_id, project_id, type, status, source, amount, description,
  notes, occurred_at, category_id, metadata, created_by
)
select
  '185676f8-2805-5e9c-ad94-066f47ba30ab'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  'expense',
  'overdue',
  'boleto',
  2800,
  'Aluguel estÃºdio Â· marÃ§o',
  null,
  '2026-05-20'::date,
  (select id from public.financial_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Estrutura'),
  '{"categoryLabel":"Estrutura"}'::jsonb,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.financial_transactions
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and description = 'Aluguel estÃºdio Â· marÃ§o' and occurred_at = '2026-05-20'::date and amount = 2800
);

-- 21. Payroll members
insert into public.payroll_members (
  id, workspace_id, name, role, base_salary, commission, pix_key, pay_day, status, metadata
)
select
  '59966a5b-d817-55d6-a205-ae29749781bb'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  'Marina Castro',
  'Strategist',
  8500,
  1200,
  'marina@nexus.team',
  'Dia 5',
  'active',
  null
where not exists (
  select 1 from public.payroll_members where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Marina Castro'
);
insert into public.payroll_members (
  id, workspace_id, name, role, base_salary, commission, pix_key, pay_day, status, metadata
)
select
  '5bd92fef-a9ed-57da-a3ea-cd8bb0c2cf46'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  'Lucas Hoffman',
  'Copywriter',
  6800,
  800,
  'lucas@nexus.team',
  'Dia 5',
  'active',
  null
where not exists (
  select 1 from public.payroll_members where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Lucas Hoffman'
);
insert into public.payroll_members (
  id, workspace_id, name, role, base_salary, commission, pix_key, pay_day, status, metadata
)
select
  '65bfbb27-053c-52c1-a520-6deec57a67e6'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  'Sofia Marques',
  'Designer',
  6400,
  0,
  'sofia@nexus.team',
  'Dia 5',
  'active',
  null
where not exists (
  select 1 from public.payroll_members where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Sofia Marques'
);
insert into public.payroll_members (
  id, workspace_id, name, role, base_salary, commission, pix_key, pay_day, status, metadata
)
select
  'd2db727a-0e31-56e8-a0d6-3cb47872d1c5'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  'Rafael Tavares',
  'Editor',
  7200,
  0,
  'rafael@nexus.team',
  'Dia 10',
  'active',
  null
where not exists (
  select 1 from public.payroll_members where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Rafael Tavares'
);

-- 22. Bills
insert into public.bills (
  id, workspace_id, persona_id, name, amount, due_at, recurrence, status, metadata
)
select
  'c840e01c-0636-55e3-a6c3-146d808dadc1'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Vercel Pro',
  420,
  '2026-06-03'::date,
  'monthly',
  'pending',
  null
where not exists (
  select 1 from public.bills where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Vercel Pro' and due_at = '2026-06-03'::date
);
insert into public.bills (
  id, workspace_id, persona_id, name, amount, due_at, recurrence, status, metadata
)
select
  '42b1187c-2be0-59c5-afc0-78d08df4366a'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Supabase',
  320,
  '2026-06-06'::date,
  'monthly',
  'pending',
  null
where not exists (
  select 1 from public.bills where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Supabase' and due_at = '2026-06-06'::date
);
insert into public.bills (
  id, workspace_id, persona_id, name, amount, due_at, recurrence, status, metadata
)
select
  'c67f19b7-0e0f-50c1-a95f-1243601a0a8d'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'EstÃºdio Â· marÃ§o',
  2800,
  '2026-05-25'::date,
  null,
  'overdue',
  null
where not exists (
  select 1 from public.bills where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'EstÃºdio Â· marÃ§o' and due_at = '2026-05-25'::date
);
insert into public.bills (
  id, workspace_id, persona_id, name, amount, due_at, recurrence, status, metadata
)
select
  'c95ec198-5609-5599-a1ac-31e02bee39b0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'ElevenLabs',
  280,
  '2026-06-08'::date,
  'monthly',
  'pending',
  null
where not exists (
  select 1 from public.bills where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'ElevenLabs' and due_at = '2026-06-08'::date
);

-- 23. Tool categories
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '53e951d8-035b-5f19-a3f9-ad2b7d72f90b'::uuid, (select id from public.workspaces where slug = 'nexus'), 'IA', 'ia', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ia'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select 'bcfc4afe-d556-5c7d-a822-90291491f5a9'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Design', 'design', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'design'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '949e8db2-6108-510d-a1ea-35590314ce50'::uuid, (select id from public.workspaces where slug = 'nexus'), 'VÃ­deo', 'video', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'video'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '47db8cb0-84b1-54ef-ae00-321b395da6d7'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Desenvolvimento', 'desenvolvimento', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'desenvolvimento'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '595b8461-b408-56b8-a3de-1e41654a08a1'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Banco de Dados', 'banco-de-dados', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'banco-de-dados'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select 'abf88817-5224-5391-aaf2-515b57db1df0'::uuid, (select id from public.workspaces where slug = 'nexus'), 'ComunicaÃ§Ã£o', 'comunicacao', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'comunicacao'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select 'e33eb9a6-d59c-500a-a68e-313f85e9423c'::uuid, (select id from public.workspaces where slug = 'nexus'), 'AutomaÃ§Ã£o', 'automacao', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'automacao'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '20e84d78-3c50-5018-a688-6bb906d2ae80'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Marketing', 'marketing', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'marketing'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '6fd8e4b9-2cc6-5f84-aad1-cd7bcb87b528'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Analytics', 'analytics', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'analytics'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '7bdd885a-d747-5462-a883-4f8240909274'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Financeiro', 'financeiro', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'financeiro'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '54b5ced5-188d-57d3-af76-e80fcb7e72b0'::uuid, (select id from public.workspaces where slug = 'nexus'), 'ConteÃºdo', 'conteudo', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'conteudo'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select 'c4345e9b-72ae-5cd3-ae57-2d6b3223c1b1'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Ads', 'ads', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ads'
);
insert into public.tool_categories (id, workspace_id, name, slug, icon, color)
select '3d8315ae-5e2e-52b8-a623-656ad1d2c1f9'::uuid, (select id from public.workspaces where slug = 'nexus'), 'Storage', 'storage', null, null
where not exists (
  select 1 from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'storage'
);

-- 24. Tools
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '2a0fe1c7-37b3-543d-a914-d6997c31687c'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'ChatGPT',
  'IA generalista para texto, cÃ³digo e brainstorming.',
  'https://chat.openai.com',
  null,
  'openai',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ia'),
  '["llm","geral"]'::jsonb,
  '{"brandColor":"#10a37f"}'::jsonb,
  true,
  false,
  true,
  0,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'c4372ae6-d3a3-5096-a81f-511f050c1f18'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Claude',
  'IA para raciocÃ­nio profundo, longos contextos e copy refinado.',
  'https://claude.ai',
  null,
  'anthropic',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ia'),
  '["llm","long-context"]'::jsonb,
  '{"brandColor":"#cc785c"}'::jsonb,
  true,
  false,
  true,
  1,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'fefd935c-a82d-5455-a191-dec4fcd6deb4'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Gemini',
  'Multimodal Google Â· imagem, Ã¡udio, texto e vÃ­deo.',
  'https://gemini.google.com',
  null,
  'googlegemini',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ia'),
  null,
  '{"brandColor":"#4796e3"}'::jsonb,
  true,
  false,
  false,
  2,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://gemini.google.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '6bc989cd-77d4-5950-a81d-86f4205d411a'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Google Drive',
  'Storage e compartilhamento de arquivos.',
  'https://drive.google.com',
  null,
  'googledrive',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'storage'),
  null,
  '{"brandColor":"#1fa463"}'::jsonb,
  true,
  false,
  true,
  3,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://drive.google.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'dbdf8c3b-0731-5104-a856-9b142c0eca0e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Figma',
  'Design colaborativo e prototipagem.',
  'https://figma.com',
  null,
  'figma',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'design'),
  null,
  '{"brandColor":"#f24e1e"}'::jsonb,
  true,
  false,
  false,
  4,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://figma.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '787f971e-0be4-5775-ada8-f8aaff12c1f3'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Canva',
  'CriaÃ§Ã£o rÃ¡pida de assets de mÃ­dia social.',
  'https://canva.com',
  null,
  'canva',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'design'),
  null,
  '{"brandColor":"#00c4cc"}'::jsonb,
  false,
  false,
  false,
  5,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://canva.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'b73945b8-6921-5877-a1bf-fe636fdbc6d0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'GitHub',
  'Versionamento e repositÃ³rios internos.',
  'https://github.com',
  null,
  'github',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'desenvolvimento'),
  null,
  '{"brandColor":"#ffffff"}'::jsonb,
  true,
  false,
  false,
  6,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://github.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '95a388de-1769-538b-a6ea-c32c4b02a14e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Slack',
  'ComunicaÃ§Ã£o da equipe.',
  'https://slack.com',
  null,
  'slack',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'comunicacao'),
  null,
  '{"brandColor":"#4a154b"}'::jsonb,
  false,
  false,
  false,
  7,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://slack.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'b1ffc3f3-c358-5ffb-a63b-30e43ca59fb9'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Discord',
  'Comunidade e canais paralelos.',
  'https://discord.com',
  null,
  'discord',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'comunicacao'),
  null,
  '{"brandColor":"#5865f2"}'::jsonb,
  false,
  false,
  false,
  8,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://discord.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '71e548f6-2d66-55ff-a5f0-05ca0b3b4406'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'CapCut',
  'EdiÃ§Ã£o rÃ¡pida vertical para Reels e TikTok.',
  'https://capcut.com',
  null,
  'capcut',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'video'),
  null,
  '{"brandColor":"#000000"}'::jsonb,
  false,
  false,
  false,
  9,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://capcut.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '64047526-d608-5be7-a0fc-6f6a9af76acb'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Premiere',
  'EdiÃ§Ã£o cinematogrÃ¡fica.',
  'https://adobe.com/products/premiere.html',
  null,
  'adobepremierepro',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'video'),
  null,
  '{"brandColor":"#9999ff"}'::jsonb,
  false,
  false,
  false,
  10,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://adobe.com/products/premiere.html'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'dba3a1cb-b021-5e99-afc8-970b40a0f00a'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Railway',
  'Deploy de workers e serviÃ§os.',
  'https://railway.app',
  null,
  'railway',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'desenvolvimento'),
  null,
  '{"brandColor":"#0b0d0e"}'::jsonb,
  false,
  false,
  false,
  11,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://railway.app'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'ce361f41-c38c-507f-acdb-b9876c656826'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Vercel',
  'Deploy do app Next.js da equipe.',
  'https://vercel.com',
  null,
  'vercel',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'desenvolvimento'),
  null,
  '{"brandColor":"#000000"}'::jsonb,
  true,
  false,
  true,
  12,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://vercel.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '18408c0d-1f7b-57a8-a71b-5d2d28712bf9'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Supabase',
  'Banco de dados, auth e storage do NEXUS.',
  'https://supabase.com',
  null,
  'supabase',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'banco-de-dados'),
  null,
  '{"brandColor":"#3ecf8e"}'::jsonb,
  true,
  false,
  true,
  13,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://supabase.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '2b213d90-5175-5415-abaa-a79d27aff4b7'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Notion',
  'Wiki secundÃ¡ria e atas legadas.',
  'https://notion.so',
  null,
  'notion',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'conteudo'),
  null,
  '{"brandColor":"#ffffff"}'::jsonb,
  false,
  false,
  false,
  14,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://notion.so'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'a7f20df4-d8a6-5de1-af2e-38b8955b7a45'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'ElevenLabs',
  'SÃ­ntese de voz para roteiros e ads.',
  'https://elevenlabs.io',
  null,
  'elevenlabs',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ia'),
  null,
  '{"brandColor":"#000000"}'::jsonb,
  false,
  false,
  false,
  15,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://elevenlabs.io'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'fef26c59-e14e-5e16-a12c-c2de375d1680'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Runway',
  'VÃ­deo generativo e ediÃ§Ã£o com IA.',
  'https://runwayml.com',
  null,
  'runway',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'video'),
  null,
  '{"brandColor":"#000000"}'::jsonb,
  false,
  false,
  false,
  16,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://runwayml.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '328c3a06-1e33-5cbf-a9cd-df9bfbc9734d'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Midjourney',
  'Imagens conceito Â· style guides.',
  'https://midjourney.com',
  null,
  'discord',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'design'),
  null,
  '{"brandColor":"#000000"}'::jsonb,
  false,
  false,
  false,
  17,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://midjourney.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'a94e7e16-6637-532b-ab30-62150ecbcd4e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Google Sheets',
  'Entrada de leads Â· planilhas legado.',
  'https://sheets.google.com',
  null,
  'googlesheets',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'analytics'),
  null,
  '{"brandColor":"#34a853"}'::jsonb,
  false,
  false,
  false,
  18,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://sheets.google.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'fcc3e940-2fa8-5a90-ad87-b3778b7c5d72'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Hotmart',
  'Plataforma de venda Â· Aurora.',
  'https://hotmart.com',
  null,
  'hotmart',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'financeiro'),
  null,
  '{"brandColor":"#ef4e23"}'::jsonb,
  true,
  false,
  false,
  19,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://hotmart.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  'a93953c4-cf3c-5116-a9c6-41214236f23d'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Stripe',
  'Pagamentos internacionais.',
  'https://stripe.com',
  null,
  'stripe',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'financeiro'),
  null,
  '{"brandColor":"#635bff"}'::jsonb,
  true,
  false,
  false,
  20,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://stripe.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '131f3765-b241-5383-acda-d718fa355f4e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Meta Business',
  'Ads Instagram + Facebook.',
  'https://business.facebook.com',
  null,
  'meta',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ads'),
  null,
  '{"brandColor":"#0668e1"}'::jsonb,
  false,
  false,
  false,
  21,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://business.facebook.com'
);
insert into public.tools (
  id, workspace_id, persona_id, name, description, url, logo_url, icon_slug,
  category_id, tags, metadata, is_favorite, is_embeddable, is_pinned, sort_order, created_by
)
select
  '952054bd-74f8-5555-aa0a-6427371ebbcc'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'TikTok Ads',
  'TrÃ¡fego pago vertical.',
  'https://ads.tiktok.com',
  null,
  'tiktok',
  (select id from public.tool_categories where workspace_id = (select id from public.workspaces where slug = 'nexus') and slug = 'ads'),
  null,
  '{"brandColor":"#ff0050"}'::jsonb,
  false,
  false,
  false,
  22,
  (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://ads.tiktok.com'
);

-- 25. Tool tags and favorites
insert into public.tool_tags (id, tool_id, tag)
select 'b778652f-8a57-5bbe-ae42-e0572437e519'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com'), 'llm'
where not exists (
  select 1 from public.tool_tags where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com') and tag = 'llm'
);
insert into public.tool_tags (id, tool_id, tag)
select '3f8df2cf-99a7-5152-a234-e0dd48a8ab1b'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com'), 'geral'
where not exists (
  select 1 from public.tool_tags where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com') and tag = 'geral'
);
insert into public.tool_favorites (id, tool_id, user_id)
select 'de668e1a-0b8c-5ba5-a124-b1406a78e157'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://chat.openai.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_tags (id, tool_id, tag)
select '116f164d-0e16-547e-a588-98d13c9d415b'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai'), 'llm'
where not exists (
  select 1 from public.tool_tags where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai') and tag = 'llm'
);
insert into public.tool_tags (id, tool_id, tag)
select '477835d7-0f05-594a-ade8-86d65a46cfcd'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai'), 'long-context'
where not exists (
  select 1 from public.tool_tags where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai') and tag = 'long-context'
);
insert into public.tool_favorites (id, tool_id, user_id)
select '4f1f8e56-098b-5327-aa7d-dbd6402a81dd'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://claude.ai') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select '2fa7275d-05d2-5fca-a0b7-37710b603c3d'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://gemini.google.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://gemini.google.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select '0f18f229-78c2-5778-acf4-e9c6171c0b67'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://drive.google.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://drive.google.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select '7ee2040f-c2ba-50d6-a1ca-7229e16c8a1b'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://figma.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://figma.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select 'b38a9431-c81d-5149-aa83-fcb6fb1cdba7'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://github.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://github.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select 'e0a11c25-63c3-5cdc-a445-6229edf0eb50'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://vercel.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://vercel.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select '8163d521-534b-57e4-a7fb-e5309906a12e'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://supabase.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://supabase.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select 'aa6403f0-c938-5d08-a563-060870555200'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://hotmart.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://hotmart.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);
insert into public.tool_favorites (id, tool_id, user_id)
select '072bf573-efd1-5431-a89d-92210d9d5f20'::uuid, (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://stripe.com'), (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.tool_favorites where tool_id = (select id from public.tools where workspace_id = (select id from public.workspaces where slug = 'nexus') and url = 'https://stripe.com') and user_id = (select id from public.users where email = 'alex@nexus.team')
);

