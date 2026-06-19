# PROMPT PARA O CLAUDE CODE — Módulo "Estudo & Foco" no Zayon NO LIMITS

> Cole este arquivo inteiro como tarefa inicial no Claude Code, rodando na raiz do repositório `Z - NO LIMITS`.
> Ele NÃO é para ser executado de uma vez: é um plano em fases. Trabalhe fase a fase, commitando ao fim de cada uma, rodando typecheck/lint e parando para revisão.

---

## 0. Quem você é e qual é a missão

Você é um engenheiro sênior Next.js/Drizzle entrando num app **já pronto e em produção** (Zayon NO LIMITS). Sua missão é **construir um módulo nativo de Estudo & Foco** que migra TODAS as funções de um app standalone do dono (o "STUDY") — adaptadas às convenções deste repositório — e amarra **estudo + sessões de trabalho** num só lugar.

Regra de ouro: **você se adapta ao código que já existe, não o contrário.** Nada de introduzir um segundo design system, um segundo padrão de data-fetching ou um segundo jeito de autorizar. Tudo segue o que já está no repo.

---

## 1. Leia ANTES de escrever uma linha

Faça a leitura destes arquivos e entenda os padrões. Não pule:

**Arquitetura de dados**
- `src/lib/db/index.ts` — cliente Drizzle lazy (proxy). Use `import { db } from "@/lib/db"`.
- `src/drizzle/schema/index.ts`, `enums.ts`, `core.ts`, `tools.ts`, `content.ts` — convenção de schema (um arquivo por domínio, enums centralizados, `workspaceId`/`personaId`, `createdAt/updatedAt`, índices).
- `drizzle.config.ts`, `supabase_setup.sql` — migrations e RLS.

**Camada servidor + API**
- `src/server/queries/index.ts` — funções de leitura, mappers `mapX(row)`, `ScopeFilter {workspaceId, personaId}`, `Promise.all` para paralelizar.
- `src/server/actions/queries-actions.ts` — server actions (authz + query).
- `src/server/services/authz.ts` — `assertScope` / `assertWorkspaceMember` / `assertPersonaAccess`.
- `src/app/api/query/route.ts` — **rota universal de LEITURA** (mapa `handlers`). É aqui que cada hook do React Query bate, em paralelo.
- `src/app/api/mutate/route.ts` + `src/lib/validations/mutations.ts` — **rota universal de ESCRITA**.

**Cliente**
- `src/hooks/use-queries.ts` — hooks TanStack Query (`useTasks`, mutations otimistas).
- `src/hooks/use-realtime.ts` — realtime Supabase (`useRealtimeTasks`).
- `src/stores/*` — zustand (`ui-store`, `workspace-store`, `persona-store`, `quick-create-store`).
- `src/components/layout/sidebar.tsx` — navegação declarativa (`workspaceNav`, `NavGroup`).
- `src/app/(workspace)/tasks/page.tsx` e `src/components/tables/*` — padrão de página (PageHeader, DataTable, KanbanBoard, Tabs, framer-motion, sonner).
- `src/types/index.ts` — tipos de domínio.
- `tailwind.config.ts` — tokens de cor/tema (use SEMPRE estes tokens + `cn` de `@/lib/utils/cn`).

**Saída esperada desta leitura:** um curto `docs/study-module/00-notes.md` com o que você confirmou sobre cada padrão (em bullets), pra você mesmo consultar nas fases seguintes.

---

## 2. O que estamos migrando (o "STUDY" de origem)

O STUDY é um app React+Supabase (https://gv-study.vercel.app) onde tudo vive num único JSONB (`public.user_data.data`). As features (= chaves do JSON) são:

| Chave no STUDY | O que é | Vira no NO LIMITS |
|---|---|---|
| `trilhas[]` | trilhas de estudo → `modulos[]` → `submodulos[]` | `study_tracks` → `study_modules` → `study_module_items` |
| `recursos[]` | biblioteca (livros/cursos) com status de leitura | `study_resources` |
| `objetivos[]` | objetivos com `marcos`, `trilhasVinculadas`, `recursosVinculados` | `study_objectives` (+ vínculos por FK) |
| `metas[]` | metas mensuráveis (horas/páginas/streak) | `study_goals` |
| `sessoes[]` | sessões de estudo (timer/pomodoro) | `focus_sessions` (type=study) |
| `trabalhoSessoes[]` | sessões de trabalho | `focus_sessions` (type=work, ligadas a projeto/persona) |
| `revisoes[]` | revisão espaçada / caderno | `study_reviews` |
| `planEstudo[]` / `planTrabalho[]` | rotina/blocos (A/B/C, 09–11 estudo, 16–21 trabalho) | `study_plans` |
| `obsidianNotes` | notas longas | reaproveitar o módulo **documents** existente + `study_reviews` p/ notas atômicas |
| `conquistas_desbloqueadas` | gamificação | `study_achievements` |
| `settings` | preferências (tamanho do pomodoro, meta diária) | `study_settings` |

**Schema exato de origem (para o seed/import — Fase 6):**
- Projeto Supabase de origem: **THALLES STUDY** (`wxazhueckvkwerzzpyml`), tabela `public.user_data`, coluna `data jsonb`, linha `user_id = 54cd93f9-3b20-4a78-9542-4518e52485d2` (email `thallescount@gmail.com`).
- `trilha`: `{id, nome, area, modo, status("Ativo"…), inicio, prazo, horasMeta, objetivoId, modulos[]}`
- `modulo`: `{id, nome, horas, status("em andamento"/"não iniciado"), _expanded, submodulos[], recursosVinculados[]}`
- `submodulo`: `{id, nome, horas, status, recursoId?, link?}`
- `recurso`: `{id, titulo, subtitulo, autores, area, tipo("Livro"/"Curso"), status("Na fila"/"Lendo"/"Concluído"), idioma, ano, editora, paginas, paginaAtual, link, isbn, edicao, rating, resenha, recomendaria, tags[], capaPath, pdfPath, trilhaId, objetivoId, dataInicio, dataConclusao, horasConcluidas}`
- `objetivo`: `{id, nome, emoji, categoria, status, prazo, marcos[], trilhasVinculadas[], recursosVinculados[]}`

Já existe lá dentro a "faculdade FORTALEZA": **7 trilhas** (6 semestres + Inglês), **15 módulos**, **71 submódulos**, **31 livros**, todas ligadas ao objetivo "Aprender programação". O seed precisa trazer isso intacto.

---

## 3. O que o dono precisa ter (visão — estudo + trabalho, à luz do "segundo cérebro")

O segundo cérebro do dono organiza a vida em **blocos fixos**: estudo de manhã (Bloco A Construção/Python 09–10 todo dia; Bloco B Base/Cyber e Bloco C Inglês 10–11) e **trabalho à tarde/noite** (16–21, produção de conteúdo LENNON/NOLLAN etc.). O módulo precisa refletir essa realidade:

1. **Trilhas** (cadeiras/semestres) com progresso real por módulo/submódulo e horas.
2. **Biblioteca** (livros/cursos) com status de leitura, progresso por página, rating/resenha, capa e PDF.
3. **Objetivos & Metas** (objetivo guarda-chuva → trilhas/recursos; metas mensuráveis: horas/semana, livros/mês, streak).
4. **Sessões de Foco** = o coração que une tudo: um timer (pomodoro/deep work) que pode ser logado **numa cadeira de estudo OU num projeto/persona existente** (LENNON, NOLLAN…). Horas alimentam trilha **e** projeto. Timer vivo entre abas (realtime).
5. **Revisões / Caderno** (revisão espaçada + "caderno de ataques" — notas de brecha que viram conteúdo).
6. **Plano & Rotina** (blocos A/B/C de estudo + blocos 16–21 de trabalho) integrado ao **Calendar** já existente.
7. **Dashboard de Estudo** (streak, horas da semana, próximas revisões, bloco de agora, "continue de onde parou", conquistas).
8. **Gamificação** (conquistas/tiers) e **Settings** (tamanho do pomodoro, meta diária de horas, etc.).

---

## 4. Decisões já tomadas pelo dono (não re-perguntar)

- **Backend:** tabelas **Drizzle nativas** no NO LIMITS + **import único** do STUDY (não sincroniza nos dois sentidos; não lê do banco antigo em runtime).
- **Sessões de trabalho:** timer de foco ligado a **Trilhas E Projetos/Personas** existentes.
- **UI:** **premium porém consistente** — base shadcn/ui (já no repo) + acentos pontuais (ver §8). Sem virar outro app.
- **Multi-tenant:** tudo escopado por `workspaceId` (+ `personaId` opcional, como o resto do app). `userId` quando for dado pessoal (sessão, streak, settings).

---

## 5. Modelo de dados (Drizzle) — Fase 0

Crie `src/drizzle/schema/study.ts` e exporte em `index.ts`. Adicione os enums em `enums.ts`. Siga a forma de `tools.ts`/`content.ts` (uuid pk `defaultRandom`, `references` com `onDelete`, índices por workspace, `createdAt/updatedAt`).

**Enums novos (`enums.ts`):**
```ts
export const studyTrackStatusEnum = pgEnum("study_track_status", ["planned","active","paused","completed","archived"]);
export const studyItemStatusEnum  = pgEnum("study_item_status",  ["not_started","in_progress","completed"]);
export const studyResourceTypeEnum= pgEnum("study_resource_type",["book","course","video","article","doc","pdf","other"]);
export const studyResourceStatusEnum=pgEnum("study_resource_status",["backlog","reading","completed","abandoned"]);
export const studyGoalStatusEnum  = pgEnum("study_goal_status",  ["active","achieved","paused","dropped"]);
export const focusSessionTypeEnum = pgEnum("focus_session_type", ["study","work","reading","review","deep_work"]);
export const focusSessionStatusEnum=pgEnum("focus_session_status",["planned","active","completed","abandoned"]);
export const studyReviewKindEnum  = pgEnum("study_review_kind",  ["note","flashcard","attack_note"]);
```

**Tabelas (`study.ts`):**
- `studyTracks` — `id, workspaceId(fk), personaId?(fk), objectiveId?(fk study_objectives), name, area, description, status(studyTrackStatusEnum default 'active'), mode, startDate, targetDate, hoursTarget(integer), color, icon, source(jsonb), sortOrder(integer), createdBy(fk users), createdAt, updatedAt`. Índice por workspace e por objetivo.
- `studyModules` — `id, trackId(fk study_tracks onDelete cascade), name, status(studyItemStatusEnum default 'not_started'), hoursTarget, position(integer), expanded(boolean default false), metadata(jsonb), createdAt, updatedAt`.
- `studyModuleItems` — `id, moduleId(fk study_modules cascade), name, status(studyItemStatusEnum), hours(integer default 1), position, resourceId?(fk study_resources set null), link(text), metadata, createdAt, updatedAt`.
- `studyResources` — `id, workspaceId, personaId?, trackId?(fk set null), objectiveId?, title, subtitle, authors, type(studyResourceTypeEnum), status(studyResourceStatusEnum default 'backlog'), area, language, year(integer), publisher, pages(integer), currentPage(integer default 0), hoursDone(integer default 0), link, isbn, edition, rating(integer), review(text), recommend(boolean), tags(jsonb), coverUrl, fileUrl, startedAt, completedAt, sourceId(text — id de origem p/ idempotência), metadata, createdBy, createdAt, updatedAt`. Índice por workspace, status, trackId.
- `studyObjectives` — `id, workspaceId, personaId?, name, description, emoji, category, status, deadline, milestones(jsonb), achievedAt, sourceId, metadata, createdAt, updatedAt`.
- `studyGoals` — `id, workspaceId, personaId?, trackId?, objectiveId?, title, metric(text: 'hours'|'pages'|'sessions'|'streak'|'custom'), target(integer), current(integer default 0), period(text: 'daily'|'weekly'|'monthly'|'total'), status(studyGoalStatusEnum), startDate, dueDate, metadata, createdAt, updatedAt`.
- `focusSessions` — `id, workspaceId, personaId?, userId(fk users), type(focusSessionTypeEnum), status(focusSessionStatusEnum default 'active'), trackId?, moduleId?, moduleItemId?, resourceId?, projectId?(fk projects set null), taskId?(fk tasks set null), label, technique(text:'pomodoro'|'deep_work'|'free'), plannedMinutes(integer), actualMinutes(integer default 0), interruptions(integer default 0), focusScore(integer), notes(text), startedAt(timestamptz), endedAt(timestamptz), metadata, createdAt, updatedAt`. Índice por workspace, userId, type, startedAt. **Esta tabela é a ponte estudo↔trabalho** (projectId/taskId ligam ao que já existe).
- `studyReviews` — `id, workspaceId, userId, trackId?, moduleId?, resourceId?, title, content(text), kind(studyReviewKindEnum default 'note'), status(text:'due'|'learning'|'review'|'mastered'), ease(integer default 250), intervalDays(integer default 0), reps(integer default 0), dueAt(timestamptz), lastReviewedAt, metadata, createdAt, updatedAt`.
- `studyPlans` — `id, workspaceId, userId, kind(text:'study'|'work'|'routine'), name, schedule(jsonb — blocos: dias, horário, label, trackId?/projectId?), active(boolean default true), metadata, createdAt, updatedAt`.
- `studyAchievements` — `id, workspaceId, userId, key(text), name, description, icon, tier(text:'bronze'|'silver'|'gold'), unlockedAt, progress(jsonb), createdAt`.
- `studySettings` — `id, workspaceId, userId, data(jsonb default '{}')` (pomodoro length, meta diária de horas, ordem das views, etc.). Unique (workspaceId,userId).

> **Streaks/horas** são derivados de `focusSessions` em query (não duplicar estado). `hoursTarget` é meta; "feito" calcula somando sessões.

**Entrega Fase 0:** schema + enums + `npm run db:generate` + revisar a migration em `src/drizzle/migrations` + `npm run db:push`. Adicionar políticas RLS no padrão do `supabase_setup.sql` (mesmas regras de workspace membership das outras tabelas). Adicionar tipos em `src/types/index.ts` (`StudyTrack`, `StudyModule`, `StudyModuleItem`, `StudyResource`, `StudyObjective`, `StudyGoal`, `FocusSession`, `StudyReview`, `StudyPlan`, `StudyAchievement`).

---

## 6. Camada de dados (servidor → cliente) — Fase 1

Replique EXATAMENTE o padrão existente:

1. **`server/queries/index.ts`**: adicione `mapStudyTrack`, `mapStudyResource`, etc. e funções `getStudyTracks(scope)`, `getStudyResources(scope)`, `getStudyObjectives(scope)`, `getFocusSessions({...,userId})`, `getStudyReviewsDue(scope)`, `getStudyGoals(scope)`, `getStudyPlans(scope)`, `getStudyAchievements(scope)`, `getStudyDashboard(scope)` (agrega streak/horas/próximas revisões com `Promise.all`).
2. **`server/actions/queries-actions.ts`**: `getStudyTracksAction`, … cada uma chamando `assertScope`/`assertWorkspaceMember` antes da query (igual às outras).
3. **`app/api/query/route.ts`**: registre no mapa `handlers`: `studyTracks`, `studyResources`, `studyObjectives`, `studyGoals`, `focusSessions`, `studyReviews`, `studyPlans`, `studyAchievements`, `studyDashboard`.
4. **`app/api/mutate/route.ts` + `lib/validations/mutations.ts`**: adicione os tipos de mutação (zod) e o handling: `upsertStudyTrack`, `reorderModuleItems`, `setItemStatus`, `upsertStudyResource`, `setResourceStatus/Progress`, `upsertObjective`, `upsertGoal`, `startFocusSession`, `tickFocusSession`, `endFocusSession`, `logReview`, `reviewCard` (atualiza ease/interval/dueAt — SM-2 simples), `upsertPlan`, `unlockAchievement`, `updateStudySettings`. Mantenha o estilo de validação/merge de metadata já usado.
5. **`hooks/use-queries.ts`**: `useStudyTracks`, `useStudyResources`, `useStudyObjectives`, `useStudyGoals`, `useFocusSessions`, `useStudyReviews`, `useStudyPlans`, `useStudyDashboard`, `useStudyAchievements` + mutations otimistas (`useStartFocusSession`, `useEndFocusSession`, `useSetItemStatus`, `useUpsertResource`…). Use as mesmas query keys e invalidations do padrão.
6. **`hooks/use-realtime.ts`**: `useRealtimeFocusSession` (timer vivo entre abas) e `useRealtimeStudyTracks`. Inscreva nas tabelas `focus_sessions` e `study_tracks`.
7. **`stores/study-store.ts`** (zustand): estado do timer ativo (sessionId, startedAt, elapsed, paused), view selecionada da biblioteca, filtros. **Nunca** use localStorage para dado de domínio; persista no banco. (Pode usar localStorage só para preferência de UI trivial, como hoje o resto do app faz — confirme antes.)

**Entrega Fase 1:** `npm run lint` + `tsc --noEmit` limpos; um teste manual de leitura via `/api/query?...` retornando os dados seedados (mesmo que vazio nesta fase).

---

## 7. Telas (App Router) — Fases 2 a 5

Tudo em `src/app/(workspace)/study/...`, componentes em `src/components/study/...`. Páginas seguem o padrão de `tasks/page.tsx` (client component, `PageHeader`, `Tabs`, framer-motion, `toast` do sonner, hooks do React Query).

**Fase 2 — Trilhas + Biblioteca (núcleo)**
- `/study/tracks` — grid de trilhas (cards com progresso, área, horas meta/feitas, status). Expandir mostra módulos→submódulos.
- `/study/tracks/[trackId]` — detalhe: checklist de módulos/submódulos com `@dnd-kit` para reordenar, marcar status (not_started→in_progress→completed), recursos vinculados, total de horas, botão **"Iniciar foco"** que abre o timer já preenchido com a trilha/módulo.
- `/study/library` — `DataTable` (TanStack) + alternância grid/tabela; filtros por área/status/tipo/idioma; card de livro com capa, progresso por página, workflow de status, rating/resenha; upload de capa/PDF via **uploadthing** (padrão `api/uploadthing`). Estilo de data-grid no capricho (ver ReUI em §8).

**Fase 3 — Sessões de Foco (a ponte estudo↔trabalho)**
- `/study/sessions` — timer grande (pomodoro/deep work/livre). Seletor do que está fazendo: **Trilha+Módulo** OU **Projeto/Persona+Task** (reusa `useProjects`/`useTasks`). Start/pause/stop → grava em `focus_sessions`; `actualMinutes`, `interruptions`, `notes`. Histórico (lista + heatmap por dia). **Timer vivo entre abas** via realtime + `study-store`. Atalho global de "Iniciar foco" no `topbar`/`command-menu` e no `quick-create-dialog`.

**Fase 4 — Revisões + Plano/Rotina + Objetivos/Metas**
- `/study/reviews` — fila de revisão espaçada (cards `due`), fluxo de revisão (SM-2 simples atualizando ease/interval/dueAt), + "Caderno de ataques" (notas `attack_note`) criáveis a partir de um módulo.
- `/study/planner` — rotina semanal em blocos (use **FullCalendar** timeGrid, já instalado): Bloco A/B/C de estudo + blocos 16–21 de trabalho; recorrência; cada bloco pode apontar p/ trilha ou projeto. Integre com o módulo **Calendar** global (mesma fonte/estilo). Liga objetivos↔metas.
- Objetivos/Metas: telas (ou seções no overview) para criar objetivo guarda-chuva, vincular trilhas/recursos (por FK), e metas mensuráveis com barra de progresso (horas/semana, livros/mês, streak).

**Fase 5 — Dashboard + Conquistas + polimento premium**
- `/study` (overview) — **bento grid**: streak atual, horas da semana (gráfico echarts, já instalado), progresso das trilhas ativas, próximas revisões, **"bloco de agora"** (cruza horário atual × `study_plans`), "continue de onde parou", conquistas recentes, `animated-list` das últimas sessões, `number-ticker` nas horas.
- `/study/achievements` — grade de conquistas por tier, progresso.
- Settings de estudo (tab em `/settings` ou `/study/settings`): tamanho do pomodoro, meta diária de horas, ordem das views.

**Navegação:** em `src/components/layout/sidebar.tsx`, adicione um grupo novo (ex.: `studyNav`) renderizado com `NavGroup`, com itens: `/study` (ícone `GraduationCap`), `/study/tracks` (`Route`/`Milestone`), `/study/library` (`Library`), `/study/sessions` (`Timer`), `/study/reviews` (`Repeat`), `/study/planner` (`CalendarClock`). Registre também no `command-menu`.

---

## 8. Direção de UI (premium, porém consistente)

**Base obrigatória:** os componentes já em `src/components/ui` (shadcn/ui), os tokens do `tailwind.config.ts`, o util `cn`, `framer-motion` (instalado) e `sonner` para toasts. Respeite dark/light. Sem novo design system.

**Acentos premium — copie só componentes pontuais (todos MIT/copy-paste), adaptando aos tokens do repo, dentro de `src/components/study/fx/`:**
- **Magic UI** → `bento-grid` (overview), `animated-list` (sessões recentes), `number-ticker` (horas/streak), `shimmer-button` (CTA "Iniciar foco").
- **Aceternity UI** → `spotlight`/`background-gradient`/`card-hover` em heros e estados vazios.
- **ReUI** (base shadcn) → data-grid/seletores avançados da **Biblioteca** e tabelas de sessões.
- **Cult UI** → botão de destaque (texture/stylized) só nos CTAs principais.
- **Dot Matrix** → animações de loading elegantes (skeletons/spinners do módulo).
- **Skipper UI** → scroll/nav diferenciado no `planner` se fizer sentido.
- **Square UI / Watermelon UI / Eudora** → fallback de blocos de dashboard e telas funcionais quando faltar componente.

**Regras:** não puxe libs de shader pesado (ex.: Alian Components) a não ser num hero isolado e opcional; nada de quebrar performance; cada componente premium precisa funcionar em light/dark e usar as cores do tema. Animações sutis > espalhafato. Se um componente premium brigar com o padrão, prevalece o padrão do repo.

---

## 9. Seed / import do STUDY — Fase 6

Crie `scripts/seed-study.ts` (rodável com `tsx`/`node`), **idempotente** (upsert por `sourceId` guardado em `metadata`/coluna `sourceId`):
1. Lê o JSON de origem. Forneça duas vias: (a) ler de um arquivo `scripts/study-export.json` que o dono cola, OU (b) conectar no Supabase de origem com `STUDY_SOURCE_DATABASE_URL` (read-only) e `select data from user_data where user_id='54cd93f9-...'`.
2. Mapeia conforme a tabela de origem da §2 → tabelas novas, preservando hierarquia trilha→módulo→submódulo e os vínculos (objetivo via FK; submódulo.recursoId → study_module_items.resourceId).
3. Converte enums PT→EN: status trilha `Ativo→active`; módulo/submódulo `em andamento→in_progress`, `não iniciado→not_started`, `concluído→completed`; recurso `Na fila→backlog`, `Lendo→reading`, `Concluído→completed`; tipo `Livro→book`, `Curso→course`.
4. Escopa tudo no workspace/persona/usuário-alvo do NO LIMITS (parametrize por env/flag).
5. Loga um resumo (quantas trilhas/módulos/submódulos/recursos/objetivos criados) e roda uma verificação de integridade (nenhum `resourceId`/`objectiveId` órfão).

**Critério de aceite do seed:** as **7 trilhas FORTALEZA** (6 semestres + Inglês), **15 módulos**, **71 submódulos**, **31 livros** e o objetivo "Aprender programação" aparecem corretos na UI, com vínculos intactos e zero duplicata ao rodar 2×.

---

## 10. Guardrails (inegociáveis)

- **Não quebre módulos existentes.** Nada de renomear/mexer em tasks, projects, personas, finance, etc. Apenas adicione.
- **Multi-tenant sempre:** toda query/mutação filtra por `workspaceId` (+ `personaId` quando aplicável) e passa pelo `authz` (`assertScope`/`assertWorkspaceMember`). Nunca exponha dado cross-workspace.
- **RLS:** toda tabela nova recebe policy no padrão do `supabase_setup.sql`.
- **Padrões do repo:** Drizzle via `@/lib/db`; leitura via `/api/query`; escrita via `/api/mutate`; React Query nos hooks; sonner para toast; uploadthing para arquivos; zod para validação. Sem fetch solto, sem outro ORM, sem outro state lib.
- **Sem segredos no código.** Use envs (`.env.local`). `STUDY_SOURCE_DATABASE_URL` só no seed, read-only.
- **Qualidade:** ao fim de CADA fase, `npm run lint` + `npx tsc --noEmit` limpos e `npm run build` passando. Commits pequenos e descritivos, um por fase. Pare para revisão entre fases.
- **Sem localStorage para dado de domínio** (sessões, progresso, settings vão pro banco).

---

## 11. Plano em fases (resumo executável)

- **Fase 0 — Schema:** `study.ts` + enums + migration + RLS + tipos. ✅ quando `db:push` aplica e `tsc` passa.
- **Fase 1 — Data layer:** queries/actions/api/hooks/store/realtime. ✅ quando `/api/query` responde.
- **Fase 2 — Trilhas + Biblioteca:** CRUD + progresso + uploads. ✅ quando dá pra criar trilha, marcar submódulo e cadastrar livro pela UI.
- **Fase 3 — Sessões de Foco:** timer + realtime + ponte projeto/persona. ✅ quando uma sessão loga horas em trilha E em projeto.
- **Fase 4 — Revisões + Planner + Objetivos/Metas:** ✅ quando revisão espaçada agenda e o planner mostra os blocos A/B/C + trabalho.
- **Fase 5 — Dashboard + Conquistas + polish:** ✅ quando o overview mostra streak/horas/bloco-de-agora e a UI premium está aplicada.
- **Fase 6 — Seed STUDY:** ✅ pelos critérios da §9.

Comece pela **Fase 0**. Antes de codar, escreva `docs/study-module/00-notes.md` (§1) e um `docs/study-module/plan.md` curto confirmando o entendimento. Depois siga fase a fase, parando para revisão ao fim de cada uma.
