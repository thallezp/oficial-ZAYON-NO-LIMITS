-- 26. Notifications
insert into public.notifications (id, workspace_id, user_id, type, title, body, href, created_at)
select '8e776773-2e51-53cc-ad41-273de605a16e'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.users where email = 'alex@nexus.team'), 'task.assigned', 'Marina te atribuiu uma tarefa', 'Calibrar IA contextual da persona Aurora', '/tasks', '2026-05-26T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.notifications where workspace_id = (select id from public.workspaces where slug = 'nexus') and user_id = (select id from public.users where email = 'alex@nexus.team') and type = 'task.assigned' and title = 'Marina te atribuiu uma tarefa'
);
insert into public.notifications (id, workspace_id, user_id, type, title, body, href, created_at)
select '5f4528d5-adb0-5352-a03c-91239bdd60a3'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.users where email = 'alex@nexus.team'), 'lead.new', 'Novo lead qualificado', 'Helena Pires Â· score 92 Â· Aurora', '/personas/p_aurora/leads', '2026-05-26T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.notifications where workspace_id = (select id from public.workspaces where slug = 'nexus') and user_id = (select id from public.users where email = 'alex@nexus.team') and type = 'lead.new' and title = 'Novo lead qualificado'
);
insert into public.notifications (id, workspace_id, user_id, type, title, body, href, created_at)
select '12b3e097-276e-58b2-a45d-8063dc977a36'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.users where email = 'alex@nexus.team'), 'ai.action', 'IA gerou 3 variaÃ§Ãµes de hook', 'Para o Reel: ''A vida que vocÃª adia te custa caro''', '/ai', '2026-05-26T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.notifications where workspace_id = (select id from public.workspaces where slug = 'nexus') and user_id = (select id from public.users where email = 'alex@nexus.team') and type = 'ai.action' and title = 'IA gerou 3 variaÃ§Ãµes de hook'
);
insert into public.notifications (id, workspace_id, user_id, type, title, body, href, created_at)
select 'e1ebb3bc-4e7d-53b2-a7df-d532c034dad1'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.users where email = 'alex@nexus.team'), 'finance.overdue', 'Conta vencida Â· estÃºdio', 'R$ 2.800 vencido hÃ¡ 2 dias', '/personas/p_aurora/finance', '2026-05-24T10:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.notifications where workspace_id = (select id from public.workspaces where slug = 'nexus') and user_id = (select id from public.users where email = 'alex@nexus.team') and type = 'finance.overdue' and title = 'Conta vencida Â· estÃºdio'
);
insert into public.notifications (id, workspace_id, user_id, type, title, body, href, created_at)
select 'b80e1eff-833d-50ca-a684-76cce3584341'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.users where email = 'alex@nexus.team'), 'content.late', 'ConteÃºdo atrasado Â· Aurora', 'Story 4 telas em editing hÃ¡ 24h', '/personas/p_aurora/instagram', '2026-05-26T18:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.notifications where workspace_id = (select id from public.workspaces where slug = 'nexus') and user_id = (select id from public.users where email = 'alex@nexus.team') and type = 'content.late' and title = 'ConteÃºdo atrasado Â· Aurora'
);

-- 27. Activity logs
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  'ca6ca68d-96e4-507f-a224-55018d533720'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  (select id from public.users where email = 'marina@nexus.team'),
  'user',
  'comentou no documento',
  'document',
  null,
  '{"title":"Posicionamento Â· Aurora Voss"}'::jsonb,
  '2026-05-26T13:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'comentou no documento' and created_at = '2026-05-26T13:00:00.000Z'::timestamptz
);
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  '581bc942-c20d-5c1a-a2e6-692b62e50c21'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  'ai',
  'qualificou 12 leads',
  null,
  null,
  '{"persona":"Aurora"}'::jsonb,
  '2026-05-26T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'qualificou 12 leads' and created_at = '2026-05-26T12:00:00.000Z'::timestamptz
);
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  '5a40de33-e1a7-5849-acfe-7060e18a1e91'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  (select id from public.users where email = 'sofia@nexus.team'),
  'user',
  'publicou conteÃºdo',
  null,
  null,
  '{"title":"Carrossel Â· 5 verdades"}'::jsonb,
  '2026-05-26T10:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'publicou conteÃºdo' and created_at = '2026-05-26T10:00:00.000Z'::timestamptz
);
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  '553d3b0b-d3c7-5ffa-ac60-b5b3dda5f782'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  (select id from public.users where email = 'alex@nexus.team'),
  'user',
  'criou persona',
  null,
  null,
  '{"name":"SolÃ¨ne AymÃ©"}'::jsonb,
  '2026-05-25T19:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'criou persona' and created_at = '2026-05-25T19:00:00.000Z'::timestamptz
);
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  'b72f3cc4-71ef-51e0-a6c9-78dcd17f49b7'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  'ai',
  'gerou roteiro de email',
  null,
  null,
  '{"campaign":"LanÃ§amento Aurora Q2"}'::jsonb,
  '2026-05-25T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'gerou roteiro de email' and created_at = '2026-05-25T17:00:00.000Z'::timestamptz
);
insert into public.activity_logs (
  id, workspace_id, persona_id, actor_id, actor_type, action, entity_type, entity_id, payload, created_at
)
select
  'efdf1d7a-9120-5e12-a0a1-8b85e8447d7d'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  (select id from public.users where email = 'joana@nexus.team'),
  'user',
  'registrou pagamento',
  null,
  null,
  '{"amount":"R$ 12.990,00","source":"Hotmart"}'::jsonb,
  '2026-05-25T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.activity_logs where workspace_id = (select id from public.workspaces where slug = 'nexus') and action = 'registrou pagamento' and created_at = '2026-05-25T14:00:00.000Z'::timestamptz
);

-- 28. ICP pains
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select '8f89f7d6-bb28-5b6e-a6c4-3767de52bf85'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'pain', 'Sinto que estou parada Â· sei que sou capaz de mais.', '["estagnaÃ§Ã£o","autoridade"]'::jsonb, 'high', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'Sinto que estou parada Â· sei que sou capaz de mais.'
);
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select 'a6f03978-d704-518b-a8b5-788d61d16d8f'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'frustration', 'Quando me posiciono parece arrogÃ¢ncia, quando recuo desapareÃ§o.', '["voz","presenÃ§a"]'::jsonb, 'high', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'Quando me posiciono parece arrogÃ¢ncia, quando recuo desapareÃ§o.'
);
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select '3969269f-6ab2-5089-a4d9-9f692a551942'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'aspiration', 'Quero ser a referÃªncia silenciosa do meu nicho.', '["referÃªncia"]'::jsonb, 'high', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'Quero ser a referÃªncia silenciosa do meu nicho.'
);
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select '07fcf9aa-ad2b-5c44-a427-7a1f3bb8f06c'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'objection', 'E se eu investir e nÃ£o der certo? De novo.', '["medo financeiro"]'::jsonb, 'medium', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'E se eu investir e nÃ£o der certo? De novo.'
);
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select '1f47860b-56b4-5cfc-aae4-4f611c6c9fe9'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'desire', 'Quero acordar e saber exatamente o prÃ³ximo movimento.', '["clareza"]'::jsonb, 'high', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'Quero acordar e saber exatamente o prÃ³ximo movimento.'
);
insert into public.icp_pains (id, workspace_id, persona_id, category, body, tags, intensity, created_by)
select 'e4f305b1-89df-53e7-a219-b558e4d58a80'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'fear', 'Tenho pavor de chegar aos 45 percebendo que adiei a vida que eu queria.', '["tempo","arrependimento"]'::jsonb, 'high', (select id from public.users where email = 'alex@nexus.team')
where not exists (
  select 1 from public.icp_pains where workspace_id = (select id from public.workspaces where slug = 'nexus') and body = 'Tenho pavor de chegar aos 45 percebendo que adiei a vida que eu queria.'
);

-- 29. Modeling profiles
insert into public.modeling_profiles (
  id, workspace_id, persona_id, name, social_network, country, link, niche,
  category, notes, photo_url, tags, refs
)
select
  '850029e6-ab74-5cc5-acbe-592e1c5de664'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Sienna Lange',
  'Instagram',
  'DE',
  'https://instagram.com/sienna.lange',
  'Lifestyle premium feminino',
  'international',
  'EstÃ©tica cinematogrÃ¡fica Â· uso de silÃªncio entre frases.',
  null,
  '["cinematic","feminino"]'::jsonb,
  '{"followers":312000}'::jsonb
where not exists (
  select 1 from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://instagram.com/sienna.lange'
);
insert into public.modeling_profiles (
  id, workspace_id, persona_id, name, social_network, country, link, niche,
  category, notes, photo_url, tags, refs
)
select
  '316ea61f-2185-5123-ac42-2f089991fa35'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Ana Cordeiro',
  'TikTok',
  'BR',
  'https://tiktok.com/@anacordeiro',
  'Empoderamento sutil',
  'hidden_gem',
  'Cresceu de 0 a 80k em 90 dias. Hook curto, alto retention.',
  null,
  '["hook","br"]'::jsonb,
  '{"followers":84200}'::jsonb
where not exists (
  select 1 from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://tiktok.com/@anacordeiro'
);
insert into public.modeling_profiles (
  id, workspace_id, persona_id, name, social_network, country, link, niche,
  category, notes, photo_url, tags, refs
)
select
  'b3a93722-2aec-5394-a34c-2f995d74e264'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Theo Marlow',
  'Twitter / X',
  'US',
  'https://x.com/theomarlow',
  'Engenharia opinativa',
  'competitor',
  'Tom direto e tÃ©cnico. Threads viralizam em 4h.',
  null,
  '["tech","thread"]'::jsonb,
  '{"followers":142000}'::jsonb
where not exists (
  select 1 from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://x.com/theomarlow'
);

-- 30. Modeling content examples
insert into public.modeling_content_examples (id, profile_id, title, url, channel, analysis, metrics)
select '14742b4f-df24-531a-ab6b-2f4611d22fcd'::uuid, (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://instagram.com/sienna.lange'), 'Sienna Lange Â· referÃªncia principal', 'https://instagram.com/sienna.lange', 'Instagram', 'EstÃ©tica cinematogrÃ¡fica Â· uso de silÃªncio entre frases.', '{"followers":312000}'::jsonb
where not exists (
  select 1 from public.modeling_content_examples where profile_id = (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://instagram.com/sienna.lange')
);
insert into public.modeling_content_examples (id, profile_id, title, url, channel, analysis, metrics)
select '74eb9a3c-1938-53e4-a8a6-809485bf691d'::uuid, (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://tiktok.com/@anacordeiro'), 'Ana Cordeiro Â· referÃªncia principal', 'https://tiktok.com/@anacordeiro', 'TikTok', 'Cresceu de 0 a 80k em 90 dias. Hook curto, alto retention.', '{"followers":84200}'::jsonb
where not exists (
  select 1 from public.modeling_content_examples where profile_id = (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://tiktok.com/@anacordeiro')
);
insert into public.modeling_content_examples (id, profile_id, title, url, channel, analysis, metrics)
select '0bf7a3eb-16e3-5862-a3a9-7ed641f8e534'::uuid, (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://x.com/theomarlow'), 'Theo Marlow Â· referÃªncia principal', 'https://x.com/theomarlow', 'Twitter / X', 'Tom direto e tÃ©cnico. Threads viralizam em 4h.', '{"followers":142000}'::jsonb
where not exists (
  select 1 from public.modeling_content_examples where profile_id = (select id from public.modeling_profiles where workspace_id = (select id from public.workspaces where slug = 'nexus') and link = 'https://x.com/theomarlow')
);

-- 31. Prompt chains
insert into public.prompt_chains (
  id, workspace_id, persona_id, name, description, status, base_prompt, chain, tags, created_by, updated_at
)
select
  '8f6ab2eb-0e4d-552d-a6a5-674dae7131fc'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Cadeia Â· Hook brutal Aurora',
  'SequÃªncia de 5 passos que transforma uma dor do ICP em hook cinematogrÃ¡fico.',
  'robust',
  'VocÃª Ã© Aurora Voss. Tom afetivo, provocador, cinematogrÃ¡fico. Cada hook deve durar 3 segundos.',
  '[{"id":"s1","role":"user","body":"Identifique a dor mais visceral no banco de ICP."},{"id":"s2","role":"user","body":"Transforme essa dor em uma frase de 8 palavras."},{"id":"s3","role":"user","body":"Gere 5 variaÃ§Ãµes de hook Â· cada uma com gatilho diferente."},{"id":"s4","role":"user","body":"Escolha a mais cinematogrÃ¡fica. Justifique em 1 linha."},{"id":"s5","role":"user","body":"Escreva o script de 4 cenas para o reel a partir desse hook."}]'::jsonb,
  '["hook","reels"]'::jsonb,
  (select id from public.users where email = 'alex@nexus.team'),
  '2026-05-25T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'
);
insert into public.prompt_chains (
  id, workspace_id, persona_id, name, description, status, base_prompt, chain, tags, created_by, updated_at
)
select
  'b0610a73-ef3d-5548-a809-854187b9c1c5'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  'Cadeia Â· Copy de email de lanÃ§amento',
  'Aquecimento â†’ revelaÃ§Ã£o â†’ oferta â†’ urgÃªncia.',
  'robust',
  'VocÃª Ã© Aurora. CinematogrÃ¡fica, Ã­ntima, direta no fim.',
  '[{"id":"s1","role":"user","body":"Tema da semana e dor central."},{"id":"s2","role":"user","body":"Abertura cinematogrÃ¡fica em 3 frases."},{"id":"s3","role":"user","body":"Bridge para a oferta sem soar comercial."},{"id":"s4","role":"user","body":"CTA com gatilho de janela fechando."}]'::jsonb,
  '["email","lanÃ§amento"]'::jsonb,
  (select id from public.users where email = 'alex@nexus.team'),
  '2026-05-26T20:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento'
);
insert into public.prompt_chains (
  id, workspace_id, persona_id, name, description, status, base_prompt, chain, tags, created_by, updated_at
)
select
  '62aa7de5-5a8e-501f-ab4d-017cdc5aabdc'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  'Cadeia Â· Carrossel tÃ©cnico viral',
  'Da pergunta ao tweet final que vira oferta.',
  'building',
  'VocÃª Ã© Obsidian. Direto, tÃ©cnico, opiniÃ£o forte.',
  '[{"id":"s1","role":"user","body":"Pergunta polÃªmica do nicho."},{"id":"s2","role":"user","body":"Resposta brutalmente sincera em 2 linhas."},{"id":"s3","role":"user","body":"5 cards com evidÃªncia tÃ©cnica."},{"id":"s4","role":"user","body":"Card final com convite para mentoria."}]'::jsonb,
  '["carrossel","tech"]'::jsonb,
  (select id from public.users where email = 'alex@nexus.team'),
  '2026-05-23T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral'
);

-- 32. Prompt iterations
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select 'f54ae8ad-1421-563e-ae8a-57d8c2e5fb3a'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'), 1, 'Identifique a dor mais visceral no banco de ICP.', '{"role":"user","stepId":"s1"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora') and version = 1
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '4065f57a-a44c-5b03-ac58-ccce29876910'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'), 2, 'Transforme essa dor em uma frase de 8 palavras.', '{"role":"user","stepId":"s2"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora') and version = 2
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '7b90b19b-f01e-5396-ad3d-9e942f82d0f7'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'), 3, 'Gere 5 variaÃ§Ãµes de hook Â· cada uma com gatilho diferente.', '{"role":"user","stepId":"s3"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora') and version = 3
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select 'c5783b42-0e20-596e-a7cc-52719c30b581'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'), 4, 'Escolha a mais cinematogrÃ¡fica. Justifique em 1 linha.', '{"role":"user","stepId":"s4"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora') and version = 4
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '7cc351ea-1435-5c7a-a721-49226432976b'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora'), 5, 'Escreva o script de 4 cenas para o reel a partir desse hook.', '{"role":"user","stepId":"s5"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Hook brutal Aurora') and version = 5
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select 'c64f1c27-c0bc-5462-a76f-6340bfb5e69b'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento'), 1, 'Tema da semana e dor central.', '{"role":"user","stepId":"s1"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento') and version = 1
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '9bf76801-c610-5bc6-af10-5efda770b99a'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento'), 2, 'Abertura cinematogrÃ¡fica em 3 frases.', '{"role":"user","stepId":"s2"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento') and version = 2
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '038cf393-338d-591f-a0f5-e320cd4f4b01'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento'), 3, 'Bridge para a oferta sem soar comercial.', '{"role":"user","stepId":"s3"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento') and version = 3
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '794d2807-d65f-57ab-a03f-e9eb037e9c00'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento'), 4, 'CTA com gatilho de janela fechando.', '{"role":"user","stepId":"s4"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Copy de email de lanÃ§amento') and version = 4
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '8873a12f-c0cc-5162-a04b-e6e64bf2f18c'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral'), 1, 'Pergunta polÃªmica do nicho.', '{"role":"user","stepId":"s1"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral') and version = 1
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '56e711a2-3a2c-5789-a440-a0917fa39480'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral'), 2, 'Resposta brutalmente sincera em 2 linhas.', '{"role":"user","stepId":"s2"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral') and version = 2
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select '2e8d81bc-0b26-5737-af48-2f344082a4c0'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral'), 3, '5 cards com evidÃªncia tÃ©cnica.', '{"role":"user","stepId":"s3"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral') and version = 3
);
insert into public.prompt_iterations (id, prompt_chain_id, version, body, metrics)
select 'bf7ab7d6-d49f-5a64-a20f-91d761452193'::uuid, (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral'), 4, 'Card final com convite para mentoria.', '{"role":"user","stepId":"s4"}'::jsonb
where not exists (
  select 1 from public.prompt_iterations where prompt_chain_id = (select id from public.prompt_chains where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Cadeia Â· Carrossel tÃ©cnico viral') and version = 4
);

-- 33. Flows
insert into public.flows (id, workspace_id, persona_id, name, description, type, icon, color, owner_id, updated_at)
select 'b68e4581-9abb-5745-a59c-92292d532396'::uuid, (select id from public.workspaces where slug = 'nexus'), null, 'Pipeline editorial Â· NEXUS', 'IdeaÃ§Ã£o â†’ roteiro â†’ captaÃ§Ã£o â†’ ediÃ§Ã£o â†’ aprovaÃ§Ã£o â†’ publicaÃ§Ã£o.', 'process', 'Workflow', '#5b8cff', (select id from public.users where email = 'alex@nexus.team'), '2026-05-24T17:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.flows where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Pipeline editorial Â· NEXUS'
);
insert into public.flows (id, workspace_id, persona_id, name, description, type, icon, color, owner_id, updated_at)
select '79a4fd86-5154-59fa-a447-f5168669036f'::uuid, (select id from public.workspaces where slug = 'nexus'), null, 'Onboarding novo membro', 'Convite â†’ docs â†’ integraÃ§Ã£o â†’ primeira entrega.', 'onboarding', 'UserPlus', '#c08a3d', (select id from public.users where email = 'alex@nexus.team'), '2026-05-19T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.flows where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Onboarding novo membro'
);
insert into public.flows (id, workspace_id, persona_id, name, description, type, icon, color, owner_id, updated_at)
select '6fede7e8-416e-5951-ade5-43b4910c9beb'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'AprovaÃ§Ã£o editorial Â· Aurora', 'Roteirista â†’ strategist â†’ cliente interno â†’ publicaÃ§Ã£o.', 'approval', 'ListChecks', '#9b8cff', (select id from public.users where email = 'alex@nexus.team'), '2026-05-25T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.flows where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'AprovaÃ§Ã£o editorial Â· Aurora'
);
insert into public.flows (id, workspace_id, persona_id, name, description, type, icon, color, owner_id, updated_at)
select '69bcf791-f8bc-5705-a023-61268c6bd8d8'::uuid, (select id from public.workspaces where slug = 'nexus'), null, 'Mindmap Â· Big Idea NEXUS', 'Mapeamento da tese central.', 'mindmap', 'Sparkles', '#36b3ff', (select id from public.users where email = 'alex@nexus.team'), '2026-05-12T21:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.flows where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Mindmap Â· Big Idea NEXUS'
);

-- 34. Sales funnel
insert into public.sales_funnels (id, workspace_id, persona_id, name, description, conversion_rate)
select 'ebc09573-35cd-5979-abf8-94c85b0eff06'::uuid, (select id from public.workspaces where slug = 'nexus'), (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'), 'Funil principal Â· Aurora', 'TikTok â†’ Reels â†’ Direct â†’ WhatsApp â†’ Checkout', 3.8
where not exists (
  select 1 from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'
);
insert into public.funnel_nodes (id, funnel_id, node_type, title, description, position, data, metrics)
select '0758c06e-77cd-5c3c-a013-0f63b5e08957'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), 'content', 'TikTok orgÃ¢nico', 'Hooks autoridade Â· 3 posts/semana', '{"x":0,"y":100}'::jsonb, '{"sourceId":"n1"}'::jsonb, '{"traffic":184000,"conversion":4.2}'::jsonb
where not exists (
  select 1 from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and title = 'TikTok orgÃ¢nico'
);
insert into public.funnel_nodes (id, funnel_id, node_type, title, description, position, data, metrics)
select 'dc89d26e-be8a-5cc5-a4c4-6ea7ce20119b'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), 'content', 'Reel Instagram', 'Reposicionamento da peÃ§a vencedora', '{"x":240,"y":100}'::jsonb, '{"sourceId":"n2"}'::jsonb, '{"traffic":92000,"conversion":6.1}'::jsonb
where not exists (
  select 1 from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and title = 'Reel Instagram'
);
insert into public.funnel_nodes (id, funnel_id, node_type, title, description, position, data, metrics)
select '92305b7f-fc5b-59d7-a89a-ace0c16916ab'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), 'direct', 'Direct Aurora', 'Gatilho ''me chama no direct''', '{"x":480,"y":100}'::jsonb, '{"sourceId":"n3"}'::jsonb, '{"traffic":5620,"conversion":38}'::jsonb
where not exists (
  select 1 from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and title = 'Direct Aurora'
);
insert into public.funnel_nodes (id, funnel_id, node_type, title, description, position, data, metrics)
select '436e7043-0894-5e55-af45-d89448df7b85'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), 'whatsapp', 'WhatsApp atendimento', 'Roteiro de qualificaÃ§Ã£o Â· 3 perguntas', '{"x":720,"y":100}'::jsonb, '{"sourceId":"n4"}'::jsonb, '{"traffic":2140,"conversion":22}'::jsonb
where not exists (
  select 1 from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and title = 'WhatsApp atendimento'
);
insert into public.funnel_nodes (id, funnel_id, node_type, title, description, position, data, metrics)
select 'f84ad7a6-0569-5b92-a0d4-949294d1a2b5'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), 'checkout', 'Checkout Â· curso Aurora', 'Hotmart Â· R$ 1.997', '{"x":960,"y":100}'::jsonb, '{"sourceId":"n5"}'::jsonb, '{"traffic":472,"conversion":28,"revenue":264200}'::jsonb
where not exists (
  select 1 from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and title = 'Checkout Â· curso Aurora'
);
insert into public.funnel_edges (id, funnel_id, source, target, label, data)
select '0c3635e4-a43b-5870-adf1-f2cc1dcd667c'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n1'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n2'), 'remix', '{"sourceId":"n1","targetId":"n2"}'::jsonb
where not exists (
  select 1 from public.funnel_edges where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and label = 'remix' and source = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n1') and target = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n2')
);
insert into public.funnel_edges (id, funnel_id, source, target, label, data)
select '53162de8-52d0-5c26-a380-17d1d08e21dc'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n2'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n3'), 'CTA direct', '{"sourceId":"n2","targetId":"n3"}'::jsonb
where not exists (
  select 1 from public.funnel_edges where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and label = 'CTA direct' and source = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n2') and target = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n3')
);
insert into public.funnel_edges (id, funnel_id, source, target, label, data)
select '833899ea-563f-5b8b-ab38-a7e359891869'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n3'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n4'), 'envio', '{"sourceId":"n3","targetId":"n4"}'::jsonb
where not exists (
  select 1 from public.funnel_edges where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and label = 'envio' and source = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n3') and target = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n4')
);
insert into public.funnel_edges (id, funnel_id, source, target, label, data)
select 'c51bf4fb-109f-5ff4-af1d-4ba587f1f6f4'::uuid, (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n4'), (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n5'), 'fechamento', '{"sourceId":"n4","targetId":"n5"}'::jsonb
where not exists (
  select 1 from public.funnel_edges where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and label = 'fechamento' and source = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n4') and target = (select id from public.funnel_nodes where funnel_id = (select id from public.sales_funnels where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Funil principal Â· Aurora') and data->>'sourceId' = 'n5')
);

-- 35. AI actions
insert into public.ai_actions (
  id, workspace_id, persona_id, thread_id, actor_id, name, description, status, input, output, error, created_at
)
select
  'f6d8ee5f-a6ab-59b1-aed7-894e1c8e96be'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  (select id from public.users where email = 'alex@nexus.team'),
  'Qualificou 12 leads',
  'Score >80 marcados como prioritÃ¡rios',
  'completed',
  null,
  null,
  null,
  '2026-05-26T11:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.ai_actions where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Qualificou 12 leads' and created_at = '2026-05-26T11:00:00.000Z'::timestamptz
);
insert into public.ai_actions (
  id, workspace_id, persona_id, thread_id, actor_id, name, description, status, input, output, error, created_at
)
select
  'd02c2814-2d88-52e9-a483-9cda53bab6d7'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'AURORA'),
  null,
  (select id from public.users where email = 'alex@nexus.team'),
  'Gerou 5 variaÃ§Ãµes de hook',
  'Reel: ''A vida que vocÃª adia te custa caro''',
  'completed',
  null,
  null,
  null,
  '2026-05-26T12:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.ai_actions where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Gerou 5 variaÃ§Ãµes de hook' and created_at = '2026-05-26T12:00:00.000Z'::timestamptz
);
insert into public.ai_actions (
  id, workspace_id, persona_id, thread_id, actor_id, name, description, status, input, output, error, created_at
)
select
  '0384b6b1-fcab-5360-a885-5c9a5e4d7c23'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  null,
  null,
  (select id from public.users where email = 'alex@nexus.team'),
  'Resumiu reuniÃ£o semanal #18',
  '8 decisÃµes Â· 12 aÃ§Ãµes Â· 3 blockers',
  'completed',
  null,
  null,
  null,
  '2026-05-25T14:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.ai_actions where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Resumiu reuniÃ£o semanal #18' and created_at = '2026-05-25T14:00:00.000Z'::timestamptz
);
insert into public.ai_actions (
  id, workspace_id, persona_id, thread_id, actor_id, name, description, status, input, output, error, created_at
)
select
  '688d92d5-d51e-5308-a1b9-fb03231551bc'::uuid,
  (select id from public.workspaces where slug = 'nexus'),
  (select id from public.personas where workspace_id = (select id from public.workspaces where slug = 'nexus') and coalesce(codename, name) = 'OBSIDIAN'),
  null,
  (select id from public.users where email = 'alex@nexus.team'),
  'Sugerindo plano de lanÃ§amento',
  null,
  'running',
  null,
  null,
  null,
  '2026-05-26T15:00:00.000Z'::timestamptz
where not exists (
  select 1 from public.ai_actions where workspace_id = (select id from public.workspaces where slug = 'nexus') and name = 'Sugerindo plano de lanÃ§amento' and created_at = '2026-05-26T15:00:00.000Z'::timestamptz
);

commit;

