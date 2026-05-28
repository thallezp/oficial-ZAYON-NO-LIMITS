# Auditoria Backend e Dados - ZAYON No Limits

Data: 2026-05-27

## Escopo Auditado

- Rotas App Router em `src/app/(workspace)` e APIs em `src/app/api`.
- Camada de queries em `src/server/queries` e Server Actions em `src/server/actions`.
- Mutations HTTP em `src/app/api/mutate/route.ts`.
- Hooks TanStack Query em `src/hooks/use-queries.ts`.
- Hooks Realtime em `src/hooks/use-realtime.ts`.
- Schemas Drizzle em `src/drizzle/schema`.
- Banco Supabase real `autacnfpywmattfyndyt`.

## Estado Do Banco Real

- 61 tabelas public com RLS habilitado.
- Policies existem na maioria das tabelas, geralmente 2 por tabela.
- Seed real ja existe para os modulos principais.
- Tabelas vazias relevantes: `calendar_events`, `launch_campaigns`, `launch_events`, `sales_copies`, `ai_threads`, `ai_messages`, `ai_tool_calls`, alguns blocos/comments auxiliares.
- Realtime antes estava ativo apenas para poucas tabelas.
- Realtime agora foi habilitado tambem para: `calendar_events`, `documents`, `materials`, `flows`, `flow_nodes`, `flow_edges`, `sales_funnels`, `funnel_nodes`, `funnel_edges`, `task_comments`, `comments`, `ai_actions`, `ai_threads`, `ai_messages`, `ai_tool_calls`, `projects`, `personas`, `tools`.

## O Que Ja Funciona De Verdade

- Supabase Auth e middleware protegem as rotas.
- Bootstrap real carrega usuario, workspaces e personas.
- Queries principais carregam dados reais quando `NEXT_PUBLIC_USE_MOCK_DATA=false`.
- Quick Create cria entidades principais via `/api/mutate`.
- Tarefas possuem create/update/status/delete, comentarios e subtarefas.
- Leads possuem create/update/status/notes e webhook.
- Conteudos, documentos, ferramentas, fluxos, funis, financeiro e materiais tem ao menos create/list basico.
- CSV export existe para alguns tipos e consulta Supabase em modo real.
- CopilotKit esta protegido por flag e nao quebra prerender quando desativado.

## Problemas Criticos Encontrados

- Server Actions de leitura usavam Drizzle/DATABASE_URL sem checar membership antes da query, podendo bypassar RLS se chamadas diretamente com IDs forjados. Corrigido com `src/server/services/authz.ts`.
- `/api/mutate` e muito grande, mistura todos os modulos e ainda usa `any` em muitos payloads. Precisa ser quebrada em services/actions por dominio.
- Alguns deletes ainda sao hard delete em `/api/mutate`; criterio final pede arquivar/soft delete quando fizer sentido.
- Validacao Zod existe, mas nao cobre todas as mutations HTTP.
- Activity logs sao best-effort e nem todos os fluxos registram metadata completa.
- Realtime estava incompleto e as query keys invalidavam errado para algumas tabelas. Corrigido parcialmente no hook.
- Algumas acoes de IA ainda sao toast/info e nao executam tools reais completas.
- Alguns botoes continuam placeholder, especialmente IA em leads, prompts/modeling, materiais/pastas, workspace settings e parts de documentos.
- AI chat persiste historico no localStorage, nao em `ai_threads`/`ai_messages`.
- Documentos salvam conteudo, mas faltam autosave robusto, historico e colaboracao real Liveblocks.
- UploadThing/Supabase Storage existe, mas falta cobertura completa de anexos por entidade.

## Riscos De Arquitetura

- `src/lib/db/index.ts` inicializa o cliente Postgres em module scope. Para build/runtime mais seguro no Next, deve virar lazy singleton.
- A camada de dados esta duplicada: `server/mutations` via Drizzle e `/api/mutate` via Supabase SDK. O frontend hoje usa principalmente `/api/mutate`.
- Existem schemas Drizzle completos, mas sem fluxo local formal de migrations versionadas fora dos arquivos SQL manuais.
- Policies parecem presentes, mas ainda precisam de auditoria funcional por papel (`owner`, `admin`, `editor`, `financeiro`, `viewer`).

## Correcoes Aplicadas Nesta Rodada

- Corrigida aba `AI Assistant > IAs pessoais`: ChatGPT/Claude/Gemini agora abrem em nova aba segura; iframe fica reservado para URLs custom embeddable.
- Criada migration SQL local `src/drizzle/migrations/20260527_enable_realtime_core_operational_tables.sql`.
- Aplicada migration no Supabase para ampliar Realtime.
- Reescrito `src/hooks/use-realtime.ts` com query key aliases corretos e helpers para calendar/documents/materials/flows/tools.
- Criado `src/server/services/authz.ts`.
- Reescritas Server Actions de leitura em `src/server/actions/queries-actions.ts` para exigir membership/persona/task access antes de retornar dados.

## Backlog Priorizado

1. Quebrar `/api/mutate` em services/actions por modulo com Zod por payload.
2. Trocar hard deletes por soft delete/archive onde existir `deleted_at`, `archived_at` ou status.
3. Conectar botoes placeholder restantes a mutations reais.
4. Persistir AI chat em `ai_threads` e `ai_messages`.
5. Criar CRUD completo para calendar events, launch campaigns/events, sales copies, prompt iterations e modeling examples.
6. Implementar storage metadata padrao para anexos de tarefas, funis, comprovantes, avatars e materiais.
7. Criar dashboard metrics service para KPIs calculados no backend.
8. Adicionar roles/permissions efetivas por modulo.
9. Rodar teste manual por aba e fechar cada item do criterio de aceite.

