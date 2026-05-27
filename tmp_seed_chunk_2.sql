-- 16. Leads
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '5023c341-d888-542c-a753-ff89bbae5f84'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'Helena Pires',
  'lead1@gmail.com',
  '+55 11 980000000',
  '@user_1',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'open',
  68,
  0,
  (select id from public.users where email = 'marina@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  null,
  '2026-05-26T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '873f8d08-e987-53dc-ab61-0b62956e3c5e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'Camila Reis',
  'lead2@gmail.com',
  '+55 11 980000137',
  '@user_2',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'approached',
  86,
  0,
  (select id from public.users where email = 'lucas@nexus.team'),
  null,
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  null,
  '2026-05-25T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'ed260176-8686-5ff1-a941-04a154d3eec7'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'AndrÃ© Salles',
  'lead3@gmail.com',
  '+55 11 980000274',
  '@user_3',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'qualified',
  97,
  1,
  (select id from public.users where email = 'sofia@nexus.team'),
  null,
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  null,
  '2026-05-24T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '4eea7f60-8fdc-529d-aac6-d3ad059236f0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'),
  'Bruna Oliveira',
  'lead4@gmail.com',
  '+55 11 980000411',
  '@user_4',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'converted',
  93,
  1,
  (select id from public.users where email = 'rafael@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"PÃ¡gina Aurora"}'::jsonb,
  2994,
  '2026-05-23T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '2386d5c2-4c5a-58aa-ac0d-eb8daddbed1f'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'),
  'Pedro Vasconcelos',
  'lead5@gmail.com',
  '+55 11 980000548',
  '@user_5',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'lost',
  75,
  0,
  (select id from public.users where email = 'marina@nexus.team'),
  null,
  '{"sourceLabel":"YouTube descriÃ§Ã£o"}'::jsonb,
  null,
  '2026-05-22T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '7eda35d5-b896-5f0c-aab8-a6678fb2dcb6'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'Larissa Mota',
  'lead6@gmail.com',
  '+55 11 980000685',
  '@user_6',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'no_response',
  83,
  0,
  (select id from public.users where email = 'lucas@nexus.team'),
  null,
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  null,
  '2026-05-21T16:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'b86a31a8-c1c2-595b-ae4a-8cbfd2492110'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'Fernanda Carvalho',
  'lead7@gmail.com',
  '+55 11 980000822',
  '@user_7',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'open',
  95,
  0,
  (select id from public.users where email = 'sofia@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  null,
  '2026-05-20T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'c9dcaa03-a0da-5e67-a359-92f92b720bf4'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'Igor Lima',
  'lead8@gmail.com',
  '+55 11 980000959',
  '@user_8',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'approached',
  78,
  0,
  (select id from public.users where email = 'rafael@nexus.team'),
  null,
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  null,
  '2026-05-19T18:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'c48200ed-aa21-531f-a98b-4bbea60eeced'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'),
  'Helena Pires',
  'lead9@gmail.com',
  '+55 11 980001096',
  '@user_9',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'qualified',
  71,
  1,
  (select id from public.users where email = 'marina@nexus.team'),
  null,
  '{"sourceLabel":"PÃ¡gina Aurora"}'::jsonb,
  null,
  '2026-05-18T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '04798698-dd46-5939-abb9-062f50aad509'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'),
  'Camila Reis',
  'lead10@gmail.com',
  '+55 11 980001233',
  '@user_10',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'converted',
  95,
  1,
  (select id from public.users where email = 'lucas@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"YouTube descriÃ§Ã£o"}'::jsonb,
  1997,
  '2026-05-17T20:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '8bb72134-2682-5cc6-a9c2-9bb0458a1ed2'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'AndrÃ© Salles',
  'lead11@gmail.com',
  '+55 11 980001370',
  '@user_11',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'lost',
  80,
  0,
  (select id from public.users where email = 'sofia@nexus.team'),
  null,
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  null,
  '2026-05-16T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'f9a794a5-170c-53f8-ae1d-40a87fbcde31'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'Bruna Oliveira',
  'lead12@gmail.com',
  '+55 11 980001507',
  '@user_12',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'no_response',
  82,
  0,
  (select id from public.users where email = 'rafael@nexus.team'),
  null,
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  null,
  '2026-05-15T22:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '8a0e356b-379d-5db9-ac07-9f31656c8776'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'Pedro Vasconcelos',
  'lead13@gmail.com',
  '+55 11 980001644',
  '@user_13',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'open',
  96,
  0,
  (select id from public.users where email = 'marina@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  null,
  '2026-05-14T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'abc05e2c-62e7-5c84-a467-e94574796287'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'),
  'Larissa Mota',
  'lead14@gmail.com',
  '+55 11 980001781',
  '@user_14',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'approached',
  93,
  0,
  (select id from public.users where email = 'lucas@nexus.team'),
  null,
  '{"sourceLabel":"PÃ¡gina Aurora"}'::jsonb,
  null,
  '2026-05-13T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '4e54dc97-40b5-503b-a443-d853b90b81f8'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'),
  'Fernanda Carvalho',
  'lead15@gmail.com',
  '+55 11 980001918',
  '@user_15',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'qualified',
  69,
  1,
  (select id from public.users where email = 'sofia@nexus.team'),
  null,
  '{"sourceLabel":"YouTube descriÃ§Ã£o"}'::jsonb,
  null,
  '2026-05-12T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '46e22442-5cc5-57bc-a955-7918fb90a2a5'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'Igor Lima',
  'lead16@gmail.com',
  '+55 11 980002055',
  '@user_16',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'converted',
  79,
  1,
  (select id from public.users where email = 'rafael@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  1997,
  '2026-05-11T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'e074f712-2e6f-5254-aa0b-4e17142fb4f0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'Helena Pires',
  'lead17@gmail.com',
  '+55 11 980002192',
  '@user_17',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'lost',
  70,
  0,
  (select id from public.users where email = 'marina@nexus.team'),
  null,
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  null,
  '2026-05-10T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'bd81fc1d-8a99-5574-ac4f-a8949e370168'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'Camila Reis',
  'lead18@gmail.com',
  '+55 11 980002329',
  '@user_18',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'no_response',
  70,
  0,
  (select id from public.users where email = 'lucas@nexus.team'),
  null,
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  null,
  '2026-05-09T16:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '4386b05a-cac5-582a-a81d-8ebb08fb78d5'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'),
  'AndrÃ© Salles',
  'lead19@gmail.com',
  '+55 11 980002466',
  '@user_19',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'open',
  72,
  0,
  (select id from public.users where email = 'sofia@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"PÃ¡gina Aurora"}'::jsonb,
  null,
  '2026-05-08T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'd30238e2-e786-53aa-a571-cd154e9c41b7'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'),
  'Bruna Oliveira',
  'lead20@gmail.com',
  '+55 11 980002603',
  '@user_20',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'approached',
  62,
  0,
  (select id from public.users where email = 'rafael@nexus.team'),
  null,
  '{"sourceLabel":"YouTube descriÃ§Ã£o"}'::jsonb,
  null,
  '2026-05-07T18:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'a69543cc-36dc-501e-aa90-6aa622271a53'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'Pedro Vasconcelos',
  'lead21@gmail.com',
  '+55 11 980002740',
  '@user_21',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'qualified',
  90,
  1,
  (select id from public.users where email = 'marina@nexus.team'),
  null,
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  null,
  '2026-05-06T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '351695ae-3829-53d7-a6f5-b48e838a73cb'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'Larissa Mota',
  'lead22@gmail.com',
  '+55 11 980002877',
  '@user_22',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'converted',
  90,
  1,
  (select id from public.users where email = 'lucas@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  4988,
  '2026-05-05T20:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'c9888619-de06-5262-a6fe-b869dc742b26'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'Fernanda Carvalho',
  'lead23@gmail.com',
  '+55 11 980003014',
  '@user_23',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'lost',
  71,
  0,
  (select id from public.users where email = 'sofia@nexus.team'),
  null,
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  null,
  '2026-05-04T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '4bb28a02-68e7-501d-a038-4d1442cb1d25'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'),
  'Igor Lima',
  'lead24@gmail.com',
  '+55 11 980003151',
  '@user_24',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'no_response',
  78,
  0,
  (select id from public.users where email = 'rafael@nexus.team'),
  null,
  '{"sourceLabel":"PÃ¡gina Aurora"}'::jsonb,
  null,
  '2026-05-03T22:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'c31b82bf-d0c1-5d19-a299-78163a644ca1'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'),
  'Helena Pires',
  'lead25@gmail.com',
  '+55 11 980003288',
  '@user_25',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'open',
  90,
  0,
  (select id from public.users where email = 'marina@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"YouTube descriÃ§Ã£o"}'::jsonb,
  null,
  '2026-05-02T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '9e6cc525-490e-590d-a3f6-2bbb105ddbd2'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'),
  'Camila Reis',
  'lead26@gmail.com',
  '+55 11 980003425',
  '@user_26',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'approached',
  65,
  0,
  (select id from public.users where email = 'lucas@nexus.team'),
  null,
  '{"sourceLabel":"Instagram Form"}'::jsonb,
  null,
  '2026-05-01T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  '8ce13cca-ce16-5307-a263-d60782ec26b4'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'),
  'AndrÃ© Salles',
  'lead27@gmail.com',
  '+55 11 980003562',
  '@user_27',
  'PrÃ©-lanÃ§amento Aurora Q2',
  'qualified',
  65,
  1,
  (select id from public.users where email = 'sofia@nexus.team'),
  null,
  '{"sourceLabel":"TikTok bio"}'::jsonb,
  null,
  '2026-04-30T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com'
);
insert into public.leads (
  id, workspace_id, persona_id, source_id, name, email, phone, instagram, campaign,
  status, score, qualified, responsible_id, notes, metadata, converted_value, created_at
)
select
  'a978ae14-43c7-5737-a591-4a75c9404fff'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  (select id from public.lead_sources where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'),
  'Bruna Oliveira',
  'lead28@gmail.com',
  '+55 11 980003699',
  '@user_28',
  'CaptaÃ§Ã£o orgÃ¢nica',
  'converted',
  80,
  1,
  (select id from public.users where email = 'rafael@nexus.team'),
  'Trabalha com criaÃ§Ã£o de conteÃºdo. Mostrou interesse alto em pegada cinematogrÃ¡fica.',
  '{"sourceLabel":"Direct WhatsApp"}'::jsonb,
  4988,
  '2026-04-29T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.leads
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com'
);

-- 17. Lead answers
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '694dd200-999c-5d02-adf9-d1606e9add2f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '517a8105-529e-5d3e-acc6-b112d1bd15ac'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '73db710c-de28-5c0e-aef7-9fa4067390b6'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'f14dd2e2-ced7-5a29-a94d-4a7329ef9133'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'dc15e962-3b10-5d55-a07d-85f1ac0e57d7'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '7bdec25f-a827-5418-a602-2942c7c63e94'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a42b2238-67f7-5214-a47e-fefab8da5de6'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '18ac58ea-b408-5f29-abd8-fcb18636e594'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '0bec291c-dba6-5826-a752-0e8656776efe'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '5e6f7d86-55f6-5927-a4dd-d51271b1ac5e'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '6ed2a2e4-947f-553c-abf8-fd3073369aab'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '316415e7-01fe-5eee-ad1a-687e179b0498'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '5d3bbb29-5cc1-579d-a1f9-66dd03658413'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '240d341f-4e75-508a-aaac-3493d274c71f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '52d0c71b-dfb2-506d-a3ae-39c44e313502'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'cb05a0b6-2d05-56cf-a03c-84a41d891f88'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '48f4e0b5-2cae-5d90-aa7b-8fd7fa98b77f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e9ebfeae-d55c-509a-ac07-be511408145a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a6beec5f-e85f-5867-a5f4-a6826a455863'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '4c450196-edf7-5fbc-a982-65a583dda3fd'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '8145c720-5d98-5ed1-a1cf-b155f9bd1a46'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '121c7b09-0d83-5e18-ad52-8deb5a35532a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '035b44ea-e1da-5f51-a128-c27214377d5d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '7a47831c-c89c-5335-a38c-886a785a600f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'b6b84085-3bdb-5b1f-ac1b-b70a60f5d7dc'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '0a52b2e0-e9b6-548d-a274-fcb1a489bd40'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '116c6711-f907-519e-acd8-676149342213'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '31923e2b-1070-5b7e-a6cd-69c296023b7a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '4fe80fe7-44be-5092-a7a9-6383dab2068d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'f20413aa-64f2-5add-aa42-6bc3f31353b1'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e8dacdd3-048c-5b8c-ac62-2bbed7f494de'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'ee8acd5a-e74c-5faf-ab56-f2773dca0652'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '4a675d24-129f-5adb-a4b0-1b94435dc849'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '4ce702ed-cd8b-5df5-a272-f152b6f7bdf4'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '04845ccc-62a2-5c7f-a013-5c2bb877a919'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'dc1ade99-351e-521a-aad6-93cb8a844875'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '88679196-bf5f-58bd-a4b1-e54ae1af324d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '77264658-0287-5995-afa0-9365ee4628f4'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a1950f0f-e549-5eda-ae8c-49e816a8df0f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '47f1b3ae-cc02-509d-a93e-a36152862a6a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a984e0e5-6cf0-59f4-a98e-962164a5af90'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '2c68ef31-6707-5b4a-a92a-80eea50385a4'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '36817693-5777-5dce-a437-f258dc68a338'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '61a92a79-56b5-5e6c-a751-1f4c990dc71e'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a0839b34-5d9f-5128-a0d5-6c296857fe2d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'aa2b8c68-a512-55db-af0d-7dd7ac1966a4'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '0399a88d-158d-5618-afda-4c5fb150d5b9'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '985f6dc7-517c-5a5e-a156-eee204b9b0db'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '52850cd0-45e3-56c8-ae9a-83bbe2cd83f6'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '33430557-c256-5b1f-ac8e-0ed86aedc4b1'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '75fc10de-b5e3-52f9-a0ca-e68717c49de0'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '1e00bb0a-1697-5a64-a280-47e285ac542c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '247ff217-2c74-5649-aec5-d99beb37940f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '443ac418-3519-55a1-ad4b-1f87f33f4e37'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'd64e5798-507c-59c4-a2a1-02e10ee37123'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '7fdda917-7364-519e-a9ef-4753150e67c2'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '807e5c9b-2913-5d9f-a40c-e91c7417bd21'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '33e0af06-11c8-50e4-ac10-4c8d445fc17c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'ff22ca85-cc8b-5ef9-af0e-0ab4f6956303'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '9b80655b-f884-5780-adf7-2bbb092d8728'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '697cd15c-dbc0-51e6-a71b-5eebb3e996f9'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'f321ad8c-db67-531c-a7e5-09112c8f4383'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e0b32f03-ea34-5307-aebd-cc3fa35121e8'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '756f0994-56cc-5ea6-a753-a86a5fe06525'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'cc602aa7-2c74-59fc-a723-0d008ca4ee86'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'f9cb437c-e973-5dd4-a035-8f648a8c4158'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e293e496-d29a-5360-a61a-27f4465d2143'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '6f2d7ac4-fd01-5af9-a91d-345cf460e601'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '0f641882-7841-598c-a939-19822bc02a3c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'a7d1b7de-8110-5f20-a4cf-9563c63a97af'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'b1088c89-540b-51d1-a9ed-1442620f1678'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e41e0936-2a9b-542f-a91a-666b3a90baa9'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '49f6046e-79f1-56b1-a352-4148813dcb06'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '92e04206-73b3-5a44-a2a1-0f6cbba20852'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '0-3k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"0-3k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'fbba636b-5e28-5677-a0b0-1fdc57283482'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'e7744033-2429-5a64-a5d0-f67e765c1a90'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '62e20195-b4eb-547f-ae11-0c89e0372d25'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '3-10k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"3-10k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '24930497-b216-51b9-a808-0b69ddac50ff'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'c4304295-4e4f-5bf5-ab67-b07958e8bdf5'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '5eebcc19-eca9-54e3-acc4-4636c2713696'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '10-30k', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"10-30k"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'f5e87bbb-56d7-53bf-a786-8c48aedb14ad'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Sim, totalmente', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Sim, totalmente"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select 'cb739e7a-c2b1-535f-a39a-8fc9245ed30c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com'), 'Qual o seu maior desafio hoje?', 'Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar.', '{"question":"Qual o seu maior desafio hoje?","answer":"Sinto que estou parada. Sei que sou capaz de mais, mas trava na hora de me posicionar."}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com') and question = 'Qual o seu maior desafio hoje?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '3f77db84-1278-5972-aa6c-701f09143261'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com'), 'Quanto faturou nos Ãºltimos 30 dias?', '30k+', '{"question":"Quanto faturou nos Ãºltimos 30 dias?","answer":"30k+"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com') and question = 'Quanto faturou nos Ãºltimos 30 dias?'
);
insert into public.lead_answers (id, lead_id, question, answer, raw)
select '7c1de5a7-4dfa-51ad-a19f-ba922ec66a1a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com'), 'EstÃ¡ pronta para investir agora?', 'Em atÃ© 30 dias', '{"question":"EstÃ¡ pronta para investir agora?","answer":"Em atÃ© 30 dias"}'::jsonb
where not exists (
  select 1 from public.lead_answers where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com') and question = 'EstÃ¡ pronta para investir agora?'
);

-- 18. Lead status history
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'fb900914-c399-5c01-ab9b-1420b836782d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com'), null, 'open', (select id from public.users where email = 'marina@nexus.team'), '2026-05-26T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead1@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '506416e9-2451-57c8-aca7-a8c41fc386f4'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com'), null, 'approached', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-25T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead2@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'ad920201-f04d-52e7-ac65-657bc5fe954c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com'), null, 'qualified', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-24T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead3@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'db58e001-52f0-5e9a-ae0e-1d15f84546aa'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com'), null, 'converted', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-23T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead4@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'a0f6c57d-a0c0-5c5c-abe3-e3d80c19c0e1'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com'), null, 'lost', (select id from public.users where email = 'marina@nexus.team'), '2026-05-22T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead5@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'dd8cd03d-718a-5847-a20f-e1cc0860930e'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com'), null, 'no_response', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-21T16:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead6@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'a8dd20c6-6116-5572-a6d6-14900a533b4d'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com'), null, 'open', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-20T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead7@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '0456dc86-57ef-511b-a63d-2edef94413c1'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com'), null, 'approached', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-19T18:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead8@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '26b34d6d-e729-5791-a589-95c15066889c'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com'), null, 'qualified', (select id from public.users where email = 'marina@nexus.team'), '2026-05-18T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead9@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'ddced36d-157c-5707-a8cd-a6ce3b174735'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com'), null, 'converted', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-17T20:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead10@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'd3a88ce7-c579-5a07-aa50-fdb981294f82'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com'), null, 'lost', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-16T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead11@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '40259685-8f17-54fc-a92a-458fce8f8f9a'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com'), null, 'no_response', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-15T22:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead12@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'c38703b6-1251-5d92-a9a7-60309265eb60'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com'), null, 'open', (select id from public.users where email = 'marina@nexus.team'), '2026-05-14T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead13@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'ce899ac3-d50b-58b4-af9c-daad6b171c34'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com'), null, 'approached', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-13T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead14@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '36d3456e-3228-596b-ad81-e53a4fa90e61'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com'), null, 'qualified', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-12T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead15@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '4806b6ee-55a3-5791-a914-dfead7fa6acc'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com'), null, 'converted', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-11T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead16@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '31dec8e6-d917-5c92-a19b-1dc33af7add6'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com'), null, 'lost', (select id from public.users where email = 'marina@nexus.team'), '2026-05-10T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead17@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '54f88ea5-42dd-589a-a2af-564c6214956e'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com'), null, 'no_response', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-09T16:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead18@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '9c57e113-8985-5d21-a79a-8d6f986e60d8'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com'), null, 'open', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-08T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead19@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '3fa82933-7017-51ca-afdf-1d90a8ab4b3f'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com'), null, 'approached', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-07T18:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead20@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '7cc8ae5a-a4ed-586b-afe1-89add3dc8924'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com'), null, 'qualified', (select id from public.users where email = 'marina@nexus.team'), '2026-05-06T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead21@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '438b6a4d-c58c-5bdc-ac56-883d7a2b1ae9'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com'), null, 'converted', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-05T20:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead22@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '5c427387-a9ad-57db-a91e-9c46bf85bdc6'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com'), null, 'lost', (select id from public.users where email = 'sofia@nexus.team'), '2026-05-04T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead23@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '609c54e0-d674-534c-a85d-bfd74ad76d95'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com'), null, 'no_response', (select id from public.users where email = 'rafael@nexus.team'), '2026-05-03T22:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead24@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select 'b462d096-2988-505f-a9a1-9b8a06584891'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com'), null, 'open', (select id from public.users where email = 'marina@nexus.team'), '2026-05-02T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead25@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '58119d44-8843-5356-aa4f-8733555c09dc'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com'), null, 'approached', (select id from public.users where email = 'lucas@nexus.team'), '2026-05-01T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead26@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '2ccf83e8-d092-53b3-a17c-2fa23413cba2'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com'), null, 'qualified', (select id from public.users where email = 'sofia@nexus.team'), '2026-04-30T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead27@gmail.com')
);
insert into public.lead_status_history (id, lead_id, from_status, to_status, changed_by, changed_at)
select '36ccd429-46e0-5737-a70d-6aabc719174b'::uuid, (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com'), null, 'converted', (select id from public.users where email = 'rafael@nexus.team'), '2026-04-29T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.lead_status_history where lead_id = (select id from public.leads where workspace_id = (select id from public.workspaces where slug = 'nexus') and email = 'lead28@gmail.com')
);

