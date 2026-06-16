# 00 — Notas de leitura (padrões confirmados no repo)

> Leitura feita na Fase 0 antes de escrever qualquer código. Tudo abaixo foi
> **confirmado lendo o código real**, não suposto. Onde a realidade diverge do
> texto do prompt original, está marcado com ⚠️.

---

## 1. Arquitetura de dados (Drizzle)

- **Cliente**: `src/lib/db/index.ts` exporta `db` como um **Proxy lazy** — só
  conecta no `postgres()` no primeiro acesso. Importar sempre `import { db } from "@/lib/db"`.
  Conecta via `DATABASE_URL` (postgres direto, `prepare: false`).
- **Schema por domínio**: um arquivo por domínio em `src/drizzle/schema/`
  (`core.ts`, `personas.ts`, `workspace.ts`, `content.ts`, `tools.ts`, `finance.ts`,
  `leads.ts`, `funnels.ts`, `launch.ts`, `ai.ts`). `index.ts` só faz `export *`
  de cada arquivo. **Enums centralizados** em `enums.ts`.
- **Convenção de coluna** (idêntica em todas as tabelas):
  - `id: uuid("id").primaryKey().defaultRandom()`
  - `workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull()`
  - `personaId: uuid("persona_id").references(() => personas.id, { onDelete: ... })` (opcional)
    - ⚠️ o `onDelete` da persona **varia**: `tools`/`projects`/`materials` usam `set null`;
      `content_items`/`content_hooks` usam `cascade`. Vou seguir o que o spec do módulo pedir caso a caso.
  - `metadata: jsonb("metadata")`, `tags: jsonb("tags")`
  - `createdBy: uuid("created_by").references(() => users.id)`
  - `createdAt`/`updatedAt`: `timestamp("...", { withTimezone: true }).defaultNow().notNull()`
  - colunas em **snake_case no banco**, camelCase no objeto Drizzle.
- **Índices**: declarados no 2º argumento de `pgTable`, sempre
  `index("<tabela>_<col>_idx").on(table.col)`. Padrão mínimo: índice por `workspace_id`.
- **Migrations**: `drizzle.config.ts` → `schema: "./src/drizzle/schema/*"`,
  `out: "./src/drizzle/migrations"`, dialect postgres, `strict: true`.
  Scripts: `npm run db:generate`, `npm run db:push`, `npm run db:studio`.

## 2. RLS (Row Level Security)

- ⚠️ A RLS **viva** está em **`src/drizzle/rls.sql`** (arquivo mestre) + migrations SQL
  pontuais. O `supabase_setup.sql` é o setup inicial. O template mais recente e limpo
  para tabela nova é **`src/drizzle/migrations/20260528_content_hooks_table.sql`**
  (CREATE TABLE + índices + 4 policies). Vou seguir esse template.
- Helper de escopo: `private.user_workspaces()` (SECURITY DEFINER) retorna os
  `workspace_id` do `auth.uid()`. **Toda policy de tabela-raiz** usa:
  `workspace_id in (select private.user_workspaces())` para SELECT e
  `... with check (...)` para INSERT/UPDATE/ALL.
- **Tabelas-filhas** (sem `workspace_id` próprio) herdam acesso via subquery no pai:
  `exists (select 1 from public.<pai> parent where parent.id = <fk> and parent.workspace_id in (select private.user_workspaces()))`.
  → `study_modules`/`study_module_items` (filhas de `study_tracks`/`study_modules`)
  seguem esse modelo.
- **Por que RLS é inegociável**: ver §3 — as escritas dependem 100% da RLS para
  isolar workspace.

## 3. Autorização — DOIS caminhos (detalhe crítico)

- **`supabaseServer()`** (`src/lib/supabase/server.ts`) usa a **chave anon/publishable
  + cookies do usuário** → roda **como o usuário autenticado**, então **a RLS É aplicada**.
- **Leituras via Drizzle `db`** usam `DATABASE_URL` (conexão postgres direta) →
  **bypassam a RLS**. Por isso as leituras precisam de **authz explícito**.
- Consequência prática para o módulo:
  - **LEITURA (Drizzle)** → o action correspondente **tem que** chamar
    `assertScope`/`assertWorkspaceMember`/`assertPersonaAccess` antes da query.
  - **ESCRITA (`/api/mutate`, Supabase SDK)** → só checa "usuário logado"; **a RLS
    faz o isolamento de workspace**. Logo, tabela nova SEM policy = escrita quebra/vaza.
- `src/server/services/authz.ts` expõe: `getCurrentUserOrThrow`,
  `getAllowedWorkspaceIds`, `assertWorkspaceMember(workspaceId)`,
  `assertPersonaAccess(personaId)`, `assertTaskAccess(taskId)`, etc.
  - ⚠️ **`assertScope` NÃO está em `authz.ts`** — é um helper **local** em
    `src/server/actions/queries-actions.ts`:
    ```ts
    async function assertScope(filter) {
      if (filter?.personaId) return assertPersonaAccess(filter.personaId);
      return assertWorkspaceMember(filter?.workspaceId);
    }
    ```
    Vou replicar/usar o mesmo helper lá.

## 4. Camada servidor → cliente (LEITURA) — são **4 arquivos** por recurso

⚠️ O prompt cita "use-queries + api/query", mas o caminho real de uma leitura passa por **quatro** lugares:

1. **`src/server/queries/index.ts`** — objeto `queries.<dominio>.<metodo>(filter)`.
   Usa Drizzle (`db.select().from(s.X).where(and(...conditions))`). Mappers
   `mapX(row)` quando precisa reformatar. Paraleliza com `Promise.all`
   (ex.: `getPersonaMetrics`, `queries.launch.campaigns`). `ScopeFilter = {workspaceId?, personaId?}`.
2. **`src/server/actions/queries-actions.ts`** — `"use server"`. `getXAction(filter)`
   chama `await assertScope(filter)` e depois `queries.X.list(filter)`.
3. **`src/lib/queries-fetch.ts`** — wrapper **client** que faz `POST /api/query`
   com `{ resource, params }` e tipa o retorno via `Awaited<ReturnType<typeof Real.getXAction>>`
   (`import type` das actions). É **daqui** que os hooks importam (`import * as qa from "@/lib/queries-fetch"`).
4. **`src/app/api/query/route.ts`** — `handlers: Record<string, (p) => Promise>`.
   Registrar `studyTracks`, `studyResources`, … apontando para `qa.getXAction`.
   Roda em paralelo (fetch/HTTP2) — esse é o motivo de existir.

## 5. Camada de ESCRITA — 3 lugares

1. **`src/lib/validations/mutations.ts`** — schema zod por ação em
   `mutationPayloadSchemas: Record<string, ZodTypeAny>`. Quase tudo usa `.passthrough()`.
   `parseMutationPayload(action, payload)` valida e lança a 1ª mensagem de erro.
2. **`src/app/api/mutate/route.ts`** — `POST` único com `switch (action)` gigante.
   Usa **Supabase SDK** (`supabase.from("tabela").insert/update/delete`), **colunas snake_case**.
   - Checa `user` (logado) → `parseMutationPayload` → `switch` → no fim insere
     `activity_logs` (best-effort) → retorna `{ ok: true, data: result }`.
   - Helpers reutilizáveis já existentes: `mergeMetadata(cur, next)`,
     `deleteOrThrow(supabase, table, id)` (falha alto se nada deletado),
     `isUuid`, `sanitizeGraphForPersistence` (para nodes/edges).
3. **`src/lib/mutate-client.ts`** — `callMutate(action, payload)` faz `POST /api/mutate`,
   lança em `!json.ok`. Hooks de mutação chamam isto.

## 6. Cliente (hooks / realtime / store)

- **`src/hooks/use-queries.ts`** — `useX()` (TanStack `useQuery`, `queryKey: ["resource", workspaceId, personaId]`,
  `enabled: !!workspaceId`) e `useXMutation()` (`useMutation` + `callMutate` + update otimista +
  `invalidateQueries`). Manter as **mesmas query keys** entre hook, realtime e invalidations.
- **`src/hooks/use-realtime.ts`** — `useRealtime({ table, filter, event, onPayload })`
  inscreve em `postgres_changes` do Supabase e invalida `queryClient`. Há um mapa
  **`realtimeQueryKeys`** (nome_tabela_snake → [queryKeys a invalidar]) que **preciso
  estender** para `focus_sessions`, `study_tracks`, etc. `channelName` usa `React.useId()`
  para não colidir. Filtro por `workspace_id=eq.<id>` ou `persona_id=eq.<id>`
  (helper `scopeFilter`). Vou criar `useRealtimeFocusSession` e `useRealtimeStudyTracks`.
- **Stores zustand** (`src/stores/*`):
  - `workspace-store` (`activeWorkspaceId`, `user`, `bootstrap`) e `persona-store`
    (`activePersonaId`, `personas`) — **persistidos** (só o ID) com validação anti-ID-órfão.
  - `ui-store` (sidebar, commandOpen, theme) — persiste `sidebarCollapsed`+`theme`.
  - `quick-create-store` — `openWith(entity, context)`; `QuickCreateEntity` é uma
    union de strings (vou **adicionar** algo como `"focusSession"`/`"studyResource"`).
  - **Regra**: persist no zustand só para preferência de UI trivial. **Dado de domínio
    (timer, progresso, settings) vai pro banco**, nunca localStorage.
  - ⚠️ Timer: persistir no banco a **cada segundo** seria pesado. Plano: manter
    `elapsed` no `study-store` + realtime entre abas, e só gravar em `focus_sessions`
    no **start / pause / stop / checkpoint** (não por tick). A favor disso na Fase 3.

## 7. Páginas (App Router)

- Rotas de workspace em **`src/app/(workspace)/<rota>/page.tsx`**; há
  `src/app/(workspace)/layout.tsx`. Estudo vai em `src/app/(workspace)/study/...`.
- Padrão de página (ex.: `tasks/page.tsx`): `"use client"`, lê `activeWorkspaceId`
  do `useWorkspaceStore`, hooks do React Query (`useTasks`), `useRealtimeTasks` que
  invalida a query, estado local espelhado do `data` via `useEffect`, `PageHeader`,
  `Tabs`, `KanbanBoard`/`DataTable` (`@/components/tables/*`), `framer-motion`,
  `toast` do `sonner`, `useNewEntityShortcut`.
- Componentes do módulo vão em `src/components/study/...` (e fx premium em
  `src/components/study/fx/...`).

## 8. Navegação

- `src/components/layout/sidebar.tsx`: arrays `NavItem[]` (`workspaceNav`,
  `personaNav`, `intelligenceNav`, `systemNav`) renderizados por `<NavGroup>`.
  Vou adicionar **`studyNav`** + `<NavGroup label="Estudo & Foco" .../>`.
  Ícones via `lucide-react`. Registrar também no command-menu.

## 9. UI / tokens

- Base: `src/components/ui/*` (shadcn), tokens do `tailwind.config.ts`
  (`bg-card`, `text-muted-foreground`, `border-border/60`, `text-primary`,
  `bg-primary/10`, `warning`/`success`/`destructive`…), util **`cn`** de
  `@/lib/utils/cn`, `framer-motion`, `sonner`. Dark é o tema default.
- Libs já instaladas e úteis: `@dnd-kit/*` (reordenar módulos/submódulos),
  `@fullcalendar/*` (planner timeGrid), `echarts`/`echarts-for-react` (gráficos),
  `@tanstack/react-table` (DataTable da biblioteca), `@uploadthing/react` (capa/PDF),
  `date-fns`.

## 10. Stack / versões (de `package.json`)

- Next 14.2.18 (App Router), React 18.3, drizzle-orm 0.34, postgres 3.4,
  `@supabase/ssr` 0.5, `@tanstack/react-query` 5.56, zod, zustand.

---

### Checklist do que tocar por recurso novo (resumo operacional)

**Leitura nova** → (1) `queries/index.ts` + (2) `queries-actions.ts` (com authz) +
(3) `queries-fetch.ts` + (4) `api/query/route.ts` (handler) + (5) hook em `use-queries.ts`.

**Escrita nova** → (1) zod em `validations/mutations.ts` + (2) `case` no switch de
`api/mutate/route.ts` (Supabase SDK, snake_case) + (3) hook de mutação em `use-queries.ts`
(via `callMutate`).

**Tabela nova** → schema em `study.ts` + enum em `enums.ts` + export em `index.ts` +
`db:generate`/`db:push` + **RLS** (migration no padrão `content_hooks_table.sql` + entrada em `rls.sql`) +
tipo em `types/index.ts` + (se realtime) entrada em `realtimeQueryKeys` + publicação realtime da tabela.
