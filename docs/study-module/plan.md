# Plano — Módulo "Estudo & Foco" (Zayon NO LIMITS)

Entendimento confirmado após ler o repo (ver [00-notes.md](./00-notes.md)).
Trabalho **fase a fase**, com `npm run lint` + `npx tsc --noEmit` + `npm run build`
limpos e **commit ao fim de cada fase**, parando para revisão.

## Princípio

Adaptar ao que já existe. Sem segundo design system, sem segundo padrão de
data-fetching, sem segundo jeito de autorizar. Tudo segue o repo:
Drizzle via `@/lib/db`, leitura via `/api/query`, escrita via `/api/mutate`,
React Query nos hooks, `sonner`, `uploadthing`, `zod`, RLS por workspace.

## Fases

- **Fase 0 — Schema** _(atual)_
  - `src/drizzle/schema/study.ts` (10 tabelas) + enums novos em `enums.ts` + export em `index.ts`.
  - `npm run db:generate` → revisar migration. **⚠️ DECISÃO DO DONO: eu NÃO rodo
    `db:push` — é produção. Eu só gero a migration (offline) + escrevo o SQL de RLS;
    o dono revisa e aplica/`db:push` ele mesmo.**
  - RLS no padrão `content_hooks_table.sql` (tabelas-raiz por `workspace_id`;
    `study_modules`/`study_module_items` herdam do pai) + registrar em `rls.sql`.
  - Tipos em `src/types/index.ts`.
  - ✅ quando a migration + RLS estão escritas, revisadas, e `tsc` passa (push é manual pelo dono).

- **Fase 1 — Data layer**
  - `queries/index.ts` (mappers + `getStudy*` com `Promise.all` no dashboard),
    `queries-actions.ts` (authz), `queries-fetch.ts`, `api/query/route.ts` (handlers),
    `validations/mutations.ts` (zod), `api/mutate/route.ts` (cases Supabase SDK),
    `use-queries.ts` (hooks + mutations otimistas), `use-realtime.ts`
    (`useRealtimeFocusSession`, `useRealtimeStudyTracks` + `realtimeQueryKeys`),
    `stores/study-store.ts` (timer ativo).
  - ✅ quando `/api/query` responde para os novos recursos.

- **Fase 2 — Trilhas + Biblioteca** — `/study/tracks`, `/study/tracks/[trackId]`
  (dnd-kit), `/study/library` (DataTable + grid + upload capa/PDF via uploadthing).
- **Fase 3 — Sessões de Foco** — `/study/sessions`, timer (pomodoro/deep work),
  ponte trilha↔projeto/persona, realtime entre abas, atalho global "Iniciar foco".
- **Fase 4 — Revisões + Planner + Objetivos/Metas** — SM-2 simples, FullCalendar
  timeGrid (blocos A/B/C + trabalho), objetivo guarda-chuva + metas mensuráveis.
- **Fase 5 — Dashboard + Conquistas + polish** — bento overview (streak, horas,
  bloco-de-agora, continue de onde parou), echarts, conquistas, FX premium.
- **Fase 6 — Seed STUDY** — `scripts/seed-study.ts` idempotente (upsert por `sourceId`),
  PT→EN nos enums, escopo por env/flag. Critério: 7 trilhas FORTALEZA, 15 módulos,
  71 submódulos, 31 livros, objetivo "Aprender programação", zero duplicata em 2 runs.

## Decisões de design que vou aplicar (e quero validar antes de avançar)

1. **Timer sem write-por-segundo**: `elapsed` vive no `study-store` + realtime;
   gravo em `focus_sessions` só em start/pause/stop/checkpoint. (`tickFocusSession`
   vira checkpoint periódico, não 1×/s.) — evita martelar o banco.
2. **Authz**: leituras Drizzle → `assertScope` explícito; escritas → RLS. Toda
   tabela nova ganha policy de workspace (e herança no caso das filhas).
3. **Notas longas (obsidianNotes)**: reaproveitar o módulo `documents` existente +
   `study_reviews` para notas atômicas (como o prompt sugere) — não criar editor novo.
4. **Seed (Fase 6)**: a origem é o projeto **THALLES STUDY** (`wxazhueckvkwerzzpyml`),
   separado do projeto NO LIMITS. Vou suportar as duas vias do prompt (arquivo
   colado `scripts/study-export.json` OU `STUDY_SOURCE_DATABASE_URL` read-only) e
   parametrizar workspace/persona/usuário-alvo por env. **Confirmar com o dono qual
   workspace/persona/usuário recebe o seed antes de rodar.**

## Pontos onde a realidade diverge do prompt (já tratados nas notas)

- `assertScope` é helper **local** de `queries-actions.ts`, não de `authz.ts`.
- Leitura nova passa por **4** arquivos (inclui `queries-fetch.ts`, não citado no prompt).
- Escrita é um **switch + Supabase SDK** em `api/mutate/route.ts` (não actions Drizzle).
- RLS viva em `rls.sql` + migrations; `content_hooks_table.sql` é o template.

## Status

- [x] Fase 0 — leitura + docs (`00-notes.md`, `plan.md`) — **aguardando revisão**
- [ ] Fase 0 — schema + enums + migration + RLS + tipos
- [ ] Fases 1–6
