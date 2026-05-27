-- 11. Documents
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  '2832bf7b-ac87-5155-a9ac-0b20a61efb31'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Playbook editorial Â· pilares e tom',
  null,
  'ðŸ“˜',
  'Como cada peÃ§a da NEXUS passa do conceito ao postado. Pilares, narrativa, governanÃ§a.',
  null,
  'playbook',
  '["editorial","processo"]'::jsonb,
  (select id from public.users where email = 'marina@nexus.team'),
  true,
  '2026-05-26T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Playbook editorial Â· pilares e tom'
);
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  '63faaa5b-c7d9-5892-a064-efc6dbf28c83'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Posicionamento Â· Aurora Voss',
  null,
  'ðŸŽ­',
  'Tom de voz, palavras-chave, palavras proibidas, gatilhos narrativos.',
  null,
  'doc',
  '["persona","aurora"]'::jsonb,
  (select id from public.users where email = 'alex@nexus.team'),
  true,
  '2026-05-25T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Posicionamento Â· Aurora Voss'
);
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  'fdd093bc-2fa1-5325-a8b8-e7ec8f01eec1'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Briefing Â· lanÃ§amento Aurora Q2',
  null,
  'ðŸš€',
  'Cronograma brutal Â· datas-chave Â· responsÃ¡veis Â· KPIs.',
  null,
  'briefing',
  '["lancamento","aurora"]'::jsonb,
  (select id from public.users where email = 'marina@nexus.team'),
  false,
  '2026-05-24T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Briefing Â· lanÃ§amento Aurora Q2'
);
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  'b6e3bf91-87d2-5fb6-a997-31526396c48e'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Onboarding Â· novo time criativo',
  null,
  'ðŸ§­',
  'Tudo que um novo membro precisa nos primeiros 7 dias.',
  null,
  'playbook',
  '["onboarding"]'::jsonb,
  (select id from public.users where email = 'alex@nexus.team'),
  false,
  '2026-05-19T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Onboarding Â· novo time criativo'
);
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  '77fd3181-240d-5edb-a8bf-e518201b13d0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Grade Â· curso Obsidian Forge',
  null,
  'ðŸ”¥',
  'MÃ³dulos, ementa, professores, deadlines.',
  null,
  'doc',
  '["curso","obsidian"]'::jsonb,
  (select id from public.users where email = 'lucas@nexus.team'),
  false,
  '2026-05-23T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Grade Â· curso Obsidian Forge'
);
insert into public.documents (
  id, workspace_id, persona_id, title, icon, emoji, summary, content, type, tags, author_id, is_starred, updated_at
)
select
  '0ac75088-8bc5-592a-a989-7d00b5e07eaf'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Ata Â· reuniÃ£o semanal #18',
  null,
  'ðŸ—’ï¸',
  'DecisÃµes, prÃ³ximos passos, blockers.',
  null,
  'ata',
  '["reuniao"]'::jsonb,
  (select id from public.users where email = 'marina@nexus.team'),
  false,
  '2026-05-26T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.documents where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Ata Â· reuniÃ£o semanal #18'
);

-- 12. Materials
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  '15e0d372-eabc-5b57-a6b6-79763464329c'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Mood Aurora Â· referÃªncias cinematogrÃ¡ficas',
  'Frames de filmes de referÃªncia para reels.',
  '/files/mood-aurora.pdf',
  'pdf',
  5240000,
  '["mood","aurora"]'::jsonb,
  (select id from public.users where email = 'sofia@nexus.team'),
  true,
  '2026-05-24T16:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Mood Aurora Â· referÃªncias cinematogrÃ¡ficas'
);
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  'e35313aa-44c3-53f1-aa64-92cbcd081784'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'B-roll cozinha Â· ritual matinal',
  null,
  '/files/broll-001.mp4',
  'video',
  412000000,
  '["b-roll","ritual"]'::jsonb,
  (select id from public.users where email = 'rafael@nexus.team'),
  false,
  '2026-05-25T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'B-roll cozinha Â· ritual matinal'
);
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  'f85d10c8-3704-5bfe-af9e-32a7eb3b7a67'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Brand kit Â· cores e tipografia NEXUS',
  null,
  '/files/brand-kit.pdf',
  'pdf',
  2120000,
  '["brand"]'::jsonb,
  (select id from public.users where email = 'sofia@nexus.team'),
  true,
  '2026-05-12T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Brand kit Â· cores e tipografia NEXUS'
);
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  '0b472e5b-d2ec-5aff-ac3c-77877bdd5d9f'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Slides Â· aula 01 forge',
  null,
  '/files/aula01.pdf',
  'pdf',
  8400000,
  '["curso"]'::jsonb,
  (select id from public.users where email = 'lucas@nexus.team'),
  false,
  '2026-05-21T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Slides Â· aula 01 forge'
);
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  '8649083f-88a7-5a6c-a618-b80bed759039'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Capa Reels 003 Â· variaÃ§Ãµes',
  null,
  '/files/capas.jpg',
  'image',
  4120000,
  '["thumb"]'::jsonb,
  (select id from public.users where email = 'sofia@nexus.team'),
  false,
  '2026-05-26T22:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Capa Reels 003 Â· variaÃ§Ãµes'
);
insert into public.materials (
  id, workspace_id, persona_id, title, description, file_url, file_type, size_bytes, tags, uploaded_by, is_starred, created_at
)
select
  'efbfe717-d99d-5f56-aa8b-0bc69ba7b7fa'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  'Print Â· concorrÃªncia crescimento Q1',
  null,
  '/files/concorrencia.png',
  'image',
  980000,
  '["analise"]'::jsonb,
  (select id from public.users where email = 'marina@nexus.team'),
  false,
  '2026-05-18T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.materials where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Print Â· concorrÃªncia crescimento Q1'
);

-- 13. Content
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '42ab92a2-25d7-5f6b-a277-245683c289ac'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'instagram',
  'reel',
  'Hook: ''A vida que vocÃª adia te custa caro''',
  'A vida que vocÃª adia te custa caro.',
  'Cena 1: Espelho Â· Aurora se observa em silÃªncio Â· 2s
Cena 2: Voz baixa Â· ''VocÃª jura que estÃ¡ esperando o momento certo'' Â· 3s
Cena 3: SobreposiÃ§Ã£o rÃ¡pida de cenas adiadas Â· 4s
Cena 4: CTA Â· ''O ritual comeÃ§a quando vocÃª decide.''',
  'Cada dia que vocÃª adia, vocÃª assina um contrato silencioso com a versÃ£o menor de vocÃª.',
  'Tons quentes, neutros, pelÃ­cula 35mm.',
  'trend Â· ''sad strings Â· slow build''',
  null,
  'authority',
  'scheduled',
  '2026-05-27T21:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Hook: ''A vida que vocÃª adia te custa caro'''
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  'ed4a334f-133e-543d-ac4b-6c6c979ac332'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'instagram',
  'feed',
  'Carrossel Â· 5 verdades sobre presenÃ§a feminina',
  null,
  null,
  '5 verdades que toda mulher silencia atÃ© ser tarde.',
  null,
  null,
  null,
  'educational',
  'scripted',
  '2026-05-28T15:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Carrossel Â· 5 verdades sobre presenÃ§a feminina'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '247dbffa-fa8d-54eb-a49d-b681552f1904'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'instagram',
  'story',
  'SequÃªncia 4 telas Â· bastidor do reel 003',
  null,
  null,
  null,
  null,
  null,
  null,
  'behind',
  'editing',
  '2026-05-27T00:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'SequÃªncia 4 telas Â· bastidor do reel 003'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '34149228-69e0-5aaa-ae1d-bc1e70811e03'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'tiktok',
  'short',
  'POV Â· ''Quando vocÃª decide parar de pedir licenÃ§a''',
  'POV: o momento exato em que vocÃª decide parar de pedir licenÃ§a.',
  null,
  null,
  null,
  null,
  null,
  'opinion',
  'posted',
  null::timestamptz,
  '2026-05-24T22:00:00.000Z'::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'POV Â· ''Quando vocÃª decide parar de pedir licenÃ§a'''
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '54addad8-26b9-5f36-adf1-829d837ce161'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'tiktok',
  'short',
  'Aurora ensina Â· gesto de presenÃ§a',
  null,
  null,
  null,
  null,
  null,
  null,
  'tips',
  'recorded',
  '2026-05-29T22:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Aurora ensina Â· gesto de presenÃ§a'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  'a377348d-b879-505b-a2c1-66c90b32f18d'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'tiktok',
  'short',
  'Stack 2026 Â· benchmark brutal',
  null,
  null,
  null,
  null,
  null,
  null,
  'authority',
  'scheduled',
  '2026-05-28T00:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Stack 2026 Â· benchmark brutal'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '5748da83-75a7-5552-abe6-5748376ac028'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'instagram',
  'carousel',
  'Carrossel Â· os 7 erros mortais em React 19',
  null,
  null,
  null,
  null,
  null,
  null,
  'tips',
  'posted',
  null::timestamptz,
  '2026-05-21T21:00:00.000Z'::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Carrossel Â· os 7 erros mortais em React 19'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '552f938b-677b-5cf2-a601-4efd38090171'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'instagram',
  'story',
  'Story Â· oferta soft Â· prÃ©-lanÃ§amento',
  null,
  null,
  null,
  null,
  null,
  null,
  'offer',
  'idea',
  '2026-05-31T12:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Story Â· oferta soft Â· prÃ©-lanÃ§amento'
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  '896167f6-8ff1-562d-ad55-8371c4c2fdc0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'email',
  'email',
  'Email 03 Â· ''A janela estÃ¡ fechando''',
  null,
  null,
  null,
  null,
  null,
  null,
  'offer',
  'scripted',
  '2026-05-30T10:00:00.000Z'::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Email 03 Â· ''A janela estÃ¡ fechando'''
);
insert into public.content_items (
  id, workspace_id, persona_id, channel, content_type, title, hook, script, caption, visual_brief,
  audio_reference, reference_links, pillar, status, scheduled_at, published_at, owner_id, metadata
)
select
  'be464597-d864-576f-a728-f6d13706e851'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'instagram',
  'reel',
  'Reel Â· ''O custo do silÃªncio''',
  null,
  null,
  null,
  null,
  null,
  null,
  'authority',
  'idea',
  null::timestamptz,
  null::timestamptz,
  (select id from public.users where email = 'lucas@nexus.team'),
  null
where not exists (
  select 1 from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Reel Â· ''O custo do silÃªncio'''
);

-- 14. Content metrics
insert into public.content_metrics (
  id, content_item_id, captured_at, views, likes, comments, shares, saves, reach, engagement_rate, retention, raw
)
select
  'b788fbd9-60d0-5448-a3b9-f54c9712ec97'::uuid,
  (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Hook: ''A vida que vocÃª adia te custa caro'''),
  coalesce('2026-05-27T21:00:00.000Z'::timestamptz, now()),
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  '{"views":0,"likes":0,"comments":0,"shares":0,"saves":0}'::jsonb
where not exists (
  select 1 from public.content_metrics where content_item_id = (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Hook: ''A vida que vocÃª adia te custa caro''')
);
insert into public.content_metrics (
  id, content_item_id, captured_at, views, likes, comments, shares, saves, reach, engagement_rate, retention, raw
)
select
  '31fdef57-5b03-5b2d-aa0f-d1cc44724269'::uuid,
  (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'POV Â· ''Quando vocÃª decide parar de pedir licenÃ§a'''),
  coalesce('2026-05-24T22:00:00.000Z'::timestamptz, now()),
  184320,
  21400,
  1240,
  4120,
  6840,
  0,
  6.8,
  62,
  '{"views":184320,"likes":21400,"comments":1240,"shares":4120,"saves":6840,"retention":62,"engagementRate":6.8}'::jsonb
where not exists (
  select 1 from public.content_metrics where content_item_id = (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'POV Â· ''Quando vocÃª decide parar de pedir licenÃ§a''')
);
insert into public.content_metrics (
  id, content_item_id, captured_at, views, likes, comments, shares, saves, reach, engagement_rate, retention, raw
)
select
  'b9ed5ce7-a349-501f-aa09-2cb943fa9c24'::uuid,
  (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Carrossel Â· os 7 erros mortais em React 19'),
  coalesce('2026-05-21T21:00:00.000Z'::timestamptz, now()),
  92140,
  8420,
  612,
  1840,
  11240,
  0,
  7.2,
  0,
  '{"views":92140,"likes":8420,"comments":612,"shares":1840,"saves":11240,"engagementRate":7.2}'::jsonb
where not exists (
  select 1 from public.content_metrics where content_item_id = (select id from public.content_items where workspace_id = (select id from public.workspaces where slug = 'nexus') and title = 'Carrossel Â· os 7 erros mortais em React 19')
);

-- 15. Lead sources
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '046bf2c0-63b2-568f-a04a-a41104bf3a86'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Instagram Form',
  'instagram-form',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '95c5547f-9b5b-5fdd-af80-b60f105ee358'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'TikTok bio',
  'tiktok-bio',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '835ed3ea-56b6-5cdb-a006-3c9d32e057a0'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Direct WhatsApp',
  'direct-whatsapp',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '8b20cbe3-e05d-5824-aaa1-c32c34f5e862'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'PÃ¡gina Aurora',
  'pagina-aurora',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '0551c43d-38b5-57a6-a705-da2db0b9ed54'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'YouTube descriÃ§Ã£o',
  'youtube-descricao',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '4a55cb11-047d-57a3-ad9e-f723f1a3e071'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Instagram Form',
  'instagram-form',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Instagram Form'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  'c2ab3f0a-7e20-5e27-ae98-63f994c55625'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'TikTok bio',
  'tiktok-bio',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'TikTok bio'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '8b399ff9-a9d0-5e0f-a81b-3c06649b5571'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'PÃ¡gina Aurora',
  'pagina-aurora',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'PÃ¡gina Aurora'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '6c084f31-1d81-5824-ac30-b52d6580c95b'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'YouTube descriÃ§Ã£o',
  'youtube-descricao',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'YouTube descriÃ§Ã£o'
);
insert into public.lead_sources (id, workspace_id, persona_id, name, type, metadata)
select
  '1ce2df80-0239-5cd5-a2c6-4bd7db7ab797'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Direct WhatsApp',
  'direct-whatsapp',
  null
where not exists (
  select 1 from public.lead_sources
  where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Direct WhatsApp'
);

