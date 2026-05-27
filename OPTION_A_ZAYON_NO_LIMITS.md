# Option A - ZAYON NO LIMITS

## Objetivo

Transformar o sistema de um estado "UI premium com fallback silencioso para mocks"
em uma operacao real conectada ao Supabase, com persistencia, realtime,
uploads, colaboracao e IA operacional de verdade.

## Regra principal

Quando `NEXT_PUBLIC_USE_MOCK_DATA=false`, nenhuma rota de produto deve cair
automaticamente para `MOCK_*` so porque a consulta real voltou vazia.

Em modo real:

- usa dados reais
- mostra estado vazio real
- persiste alteracoes reais
- registra audit log real

## Fases

### Fase A1 - Data truth

- remover fallback silencioso para `MOCK_*` nas rotas principais
- enriquecer `queries.*` para entregar formatos compativeis com a UI
- alinhar branding textual para `ZAYON NO LIMITS`
- validar que login + bootstrap + rotas principais usam Supabase real

### Fase A2 - Workspace core

- `/dashboard`
- `/tasks`
- `/projects`
- `/calendar`
- `/documents`
- `/materials`
- `/flows`
- `/tools`
- `/team`
- `/notifications`
- `/activity`

Checklist:

- ler do Supabase
- criar via UI
- editar via UI
- estados vazios reais
- export quando aplicavel

### Fase A3 - Persona Ops

- `/personas`
- `/personas/[id]/overview`
- `/content`
- `/instagram`
- `/tiktok`
- `/finance`
- `/leads`
- `/funnel`
- `/launch`
- `/modeling`
- `/prompts`
- `/look-3d`

Checklist:

- isolar por `workspace_id` e `persona_id`
- trocar a persona ativa sem usar dados fake
- remover hardcodes de KPI
- salvar alteracoes no banco

### Fase A4 - Mutations reais

- quick create
- botao `+ Novo`
- CTA de criacao por pagina
- drawers e modais de detalhe
- update de lead
- update de task
- update de document
- create/update de flow e funnel
- favoritar tools

### Fase A5 - Realtime e colaboracao

- tasks
- leads
- notifications
- activity logs
- calendar
- documents com Liveblocks

### Fase A6 - Uploads e storage

- materials com UploadThing
- avatars e referencias visuais
- anexos de documentos e tarefas
- URLs consistentes no Supabase Storage

### Fase A7 - IA operacional

- CopilotKit actions chamando mutations reais
- AI Assistant contextual por workspace/persona
- logs em `ai_actions` e `activity_logs`

## Ordem pratica recomendada

1. Tirar fallback silencioso para mocks nas rotas principais
2. Garantir mutations reais para criacao e update
3. Fazer dashboard e tasks refletirem estado real
4. Fechar documents/materials/flows
5. Fechar persona ops
6. Ligar realtime
7. Ligar uploads
8. Ligar IA operacional

## Status desta rodada

- bootstrap real do Supabase ja funcionando
- login real ja funcionando
- primeira rodada de eliminacao de fallback silencioso iniciada
- proximo foco: workspace core e dashboard com KPIs reais
