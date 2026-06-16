# IMPLEMENTAÇÃO TOTAL — Módulo "Estudo & Foco" (Zayon NO LIMITS)

> Documento único, auto-contido, para um agente codar o módulo inteiro.
> Complementa `00-notes.md` (padrões) e `plan.md` (fases). Ordem de trabalho:
> Fase 0 → 1 → 2 → 3 → 4 → 5 → 6. `lint` + `tsc --noEmit` + `build` limpos e 1 commit por fase.

## REGRAS QUE NÃO MUDAM
- Só **adicionar**. Não mexer em tasks/projects/personas/finance/etc.
- **Leitura Drizzle BYPASSA RLS** → action chama `assertScope` antes da query.
  **Escrita (`/api/mutate`) confia na RLS** → toda tabela nova tem policy.
- Leitura passa por 4 arquivos: `queries/index.ts` → `queries-actions.ts` → `lib/queries-fetch.ts` → `api/query/route.ts`.
- Escrita = `switch` em `api/mutate/route.ts` (Supabase SDK, snake_case) + zod em `validations/mutations.ts` + `callMutate`.
- `assertScope` é helper LOCAL de `queries-actions.ts` (não de `authz.ts`).
- **NÃO rodar `db:push`** — gerar migration; o dono aplica.
- Sem localStorage para dado de domínio. Tokens do `tailwind.config.ts` + `cn`. `sonner`, `framer-motion`, uploadthing, React Query, zustand.

---

# FASE 0 — Schema  → ver bloco completo em `docs/study-module` (mensagem do brief): enums, `study.ts` (11 tabelas), RLS SQL, realtime, tipos.
Resumo executável:
1. Adicionar 8 enums em `src/drizzle/schema/enums.ts`.
2. Criar `src/drizzle/schema/study.ts` (studyObjectives, studyTracks, studyModules, studyResources, studyModuleItems, studyGoals, focusSessions, studyReviews, studyPlans, studyAchievements, studySettings).
3. `export * from "./study";` em `index.ts`.
4. `npm run db:generate` (NÃO push).
5. Migration RLS `_study_rls.sql` (raiz por workspace_id; study_modules herda de tracks; study_module_items herda via module→track) + replicar em `src/drizzle/rls.sql`.
6. Publicar realtime: focus_sessions, study_tracks, study_modules, study_module_items, study_resources, study_reviews.
7. Tipos camelCase em `src/types/index.ts`.

---

# FASE 1 — DATA LAYER (código)

## 1.1 `src/server/queries/index.ts` — adicionar ao objeto `queries`
```ts
study: {
  tracks: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyTracks.workspaceId, f.workspaceId));
    if (f?.personaId)  conds.push(eq(s.studyTracks.personaId, f.personaId));
    const tracks = await db.select().from(s.studyTracks)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(s.studyTracks.sortOrder);
    if (!tracks.length) return [];
    const ids = tracks.map((t: any) => t.id);
    const [modules, sessions] = await Promise.all([
      db.select().from(s.studyModules).where(inArray(s.studyModules.trackId, ids)),
      db.select().from(s.focusSessions).where(inArray(s.focusSessions.trackId, ids)),
    ]);
    const modIds = modules.map((m: any) => m.id);
    const items = modIds.length
      ? await db.select().from(s.studyModuleItems).where(inArray(s.studyModuleItems.moduleId, modIds))
      : [];
    return tracks.map((t: any) => {
      const mods = modules.filter((m: any) => m.trackId === t.id).map((m: any) => ({
        ...m, items: items.filter((i: any) => i.moduleId === m.id),
      }));
      const allItems = mods.flatMap((m: any) => m.items);
      const done = allItems.filter((i: any) => i.status === "completed").length;
      const hoursDone = sessions.filter((x: any) => x.trackId === t.id)
        .reduce((a: number, x: any) => a + (x.actualMinutes || 0), 0) / 60;
      return {
        ...t,
        modules: mods,
        progress: allItems.length ? Math.round((done / allItems.length) * 100) : 0,
        hoursDone: Math.round(hoursDone),
      };
    });
  },
  resources: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyResources.workspaceId, f.workspaceId));
    if (f?.personaId)  conds.push(eq(s.studyResources.personaId, f.personaId));
    return db.select().from(s.studyResources)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(s.studyResources.updatedAt));
  },
  objectives: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyObjectives.workspaceId, f.workspaceId));
    if (f?.personaId)  conds.push(eq(s.studyObjectives.personaId, f.personaId));
    return db.select().from(s.studyObjectives).where(conds.length ? and(...conds) : undefined);
  },
  goals: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyGoals.workspaceId, f.workspaceId));
    if (f?.personaId)  conds.push(eq(s.studyGoals.personaId, f.personaId));
    return db.select().from(s.studyGoals).where(conds.length ? and(...conds) : undefined);
  },
  focusSessions: async (f: { workspaceId?: string; personaId?: string; userId?: string }) => {
    const conds = [];
    if (f.workspaceId) conds.push(eq(s.focusSessions.workspaceId, f.workspaceId));
    if (f.userId)      conds.push(eq(s.focusSessions.userId, f.userId));
    return db.select().from(s.focusSessions)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(s.focusSessions.startedAt));
  },
  reviewsDue: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyReviews.workspaceId, f.workspaceId));
    return db.select().from(s.studyReviews)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(s.studyReviews.dueAt);
  },
  plans: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyPlans.workspaceId, f.workspaceId));
    return db.select().from(s.studyPlans).where(conds.length ? and(...conds) : undefined);
  },
  achievements: async (f?: ScopeFilter) => {
    const conds = [];
    if (f?.workspaceId) conds.push(eq(s.studyAchievements.workspaceId, f.workspaceId));
    return db.select().from(s.studyAchievements)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(s.studyAchievements.unlockedAt));
  },
  dashboard: async (f: ScopeFilter & { userId?: string }) => {
    const wsConds = f.workspaceId ? eq(s.focusSessions.workspaceId, f.workspaceId) : undefined;
    const [sessions, tracks, reviews, achievements] = await Promise.all([
      db.select().from(s.focusSessions).where(wsConds).orderBy(desc(s.focusSessions.startedAt)),
      queries.study.tracks(f),
      queries.study.reviewsDue(f),
      queries.study.achievements(f),
    ]);
    // streak + horas da semana derivados de sessions (computar em JS, ver helper abaixo)
    return { sessions, tracks, reviews, achievements };
  },
},
```

## 1.2 `src/server/actions/queries-actions.ts` — adicionar
```ts
export async function getStudyTracksAction(f?: ScopeFilter)     { await assertScope(f); return queries.study.tracks(f); }
export async function getStudyResourcesAction(f?: ScopeFilter)  { await assertScope(f); return queries.study.resources(f); }
export async function getStudyObjectivesAction(f?: ScopeFilter) { await assertScope(f); return queries.study.objectives(f); }
export async function getStudyGoalsAction(f?: ScopeFilter)      { await assertScope(f); return queries.study.goals(f); }
export async function getFocusSessionsAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.focusSessions({ ...f, userId: user.id });
}
export async function getStudyReviewsAction(f?: ScopeFilter)      { await assertScope(f); return queries.study.reviewsDue(f); }
export async function getStudyPlansAction(f?: ScopeFilter)        { await assertScope(f); return queries.study.plans(f); }
export async function getStudyAchievementsAction(f?: ScopeFilter) { await assertScope(f); return queries.study.achievements(f); }
export async function getStudyDashboardAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.dashboard({ ...f, userId: user.id });
}
```

## 1.3 `src/lib/queries-fetch.ts` — adicionar
```ts
export const getStudyTracksAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyTracksAction>>("studyTracks", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyResourcesAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyResourcesAction>>("studyResources", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyObjectivesAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyObjectivesAction>>("studyObjectives", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyGoalsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyGoalsAction>>("studyGoals", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getFocusSessionsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getFocusSessionsAction>>("focusSessions", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyReviewsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyReviewsAction>>("studyReviews", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyPlansAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyPlansAction>>("studyPlans", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyAchievementsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyAchievementsAction>>("studyAchievements", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getStudyDashboardAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getStudyDashboardAction>>("studyDashboard", { workspaceId: f?.workspaceId, personaId: f?.personaId });
```

## 1.4 `src/app/api/query/route.ts` — adicionar ao mapa `handlers`
```ts
studyTracks:      (p) => qa.getStudyTracksAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyResources:   (p) => qa.getStudyResourcesAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyObjectives:  (p) => qa.getStudyObjectivesAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyGoals:       (p) => qa.getStudyGoalsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
focusSessions:    (p) => qa.getFocusSessionsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyReviews:     (p) => qa.getStudyReviewsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyPlans:       (p) => qa.getStudyPlansAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyAchievements:(p) => qa.getStudyAchievementsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
studyDashboard:   (p) => qa.getStudyDashboardAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
```

## 1.5 `src/lib/validations/mutations.ts` — adicionar ao `mutationPayloadSchemas`
```ts
upsertStudyTrack: z.object({ id: optionalId, workspaceId: id, personaId: optionalId, objectiveId: optionalId, name: z.string().min(1) }).passthrough(),
deleteStudyTrack: simpleDelete,
upsertStudyModule: z.object({ id: optionalId, trackId: id, name: z.string().min(1) }).passthrough(),
deleteStudyModule: simpleDelete,
upsertModuleItem: z.object({ id: optionalId, moduleId: id, name: z.string().min(1) }).passthrough(),
deleteModuleItem: simpleDelete,
reorderModuleItems: z.object({ items: z.array(z.object({ id, position: z.number() })) }).passthrough(),
setItemStatus: z.object({ id, status: z.enum(["not_started","in_progress","completed"]) }).passthrough(),
upsertStudyResource: z.object({ id: optionalId, workspaceId: id, personaId: optionalId, title: z.string().min(1) }).passthrough(),
setResourceStatus: z.object({ id, status: z.enum(["backlog","reading","completed","abandoned"]) }).passthrough(),
setResourceProgress: z.object({ id, currentPage: z.coerce.number().min(0).optional(), hoursDone: z.coerce.number().min(0).optional() }).passthrough(),
deleteStudyResource: simpleDelete,
upsertObjective: z.object({ id: optionalId, workspaceId: id, personaId: optionalId, name: z.string().min(1) }).passthrough(),
deleteObjective: simpleDelete,
upsertGoal: z.object({ id: optionalId, workspaceId: id, personaId: optionalId, title: z.string().min(1) }).passthrough(),
deleteGoal: simpleDelete,
startFocusSession: z.object({ workspaceId: id, personaId: optionalId, type: z.enum(["study","work","reading","review","deep_work"]).optional(), trackId: optionalId, moduleId: optionalId, moduleItemId: optionalId, resourceId: optionalId, projectId: optionalId, taskId: optionalId, technique: z.string().optional(), plannedMinutes: z.coerce.number().optional(), label: z.string().optional() }).passthrough(),
tickFocusSession: z.object({ id, actualMinutes: z.coerce.number().min(0), interruptions: z.coerce.number().min(0).optional() }).passthrough(),
endFocusSession: z.object({ id, actualMinutes: z.coerce.number().min(0).optional(), interruptions: z.coerce.number().min(0).optional(), focusScore: z.coerce.number().optional(), notes: z.string().optional().nullable() }).passthrough(),
upsertReview: z.object({ id: optionalId, workspaceId: id, kind: z.enum(["note","flashcard","attack_note"]).optional(), content: z.string().optional().nullable() }).passthrough(),
reviewCard: z.object({ id, grade: z.coerce.number().min(0).max(5) }).passthrough(),
upsertPlan: z.object({ id: optionalId, workspaceId: id, name: z.string().min(1), kind: z.string().optional(), schedule: z.any().optional() }).passthrough(),
deletePlan: simpleDelete,
unlockAchievement: z.object({ workspaceId: id, key: z.string().min(1), name: z.string().min(1), tier: z.string().optional() }).passthrough(),
updateStudySettings: z.object({ workspaceId: id, data: z.record(z.any()) }).passthrough(),
```

## 1.6 `src/app/api/mutate/route.ts` — cases (Supabase SDK, snake_case)
Padrão idêntico aos cases existentes. Principais:
```ts
case "upsertStudyTrack": {
  const row = {
    workspace_id: payload.workspaceId, persona_id: payload.personaId || null,
    objective_id: payload.objectiveId || null, name: payload.name,
    area: payload.area || null, description: payload.description || null,
    status: payload.status || "active", mode: payload.mode || null,
    start_date: payload.startDate || null, target_date: payload.targetDate || null,
    hours_target: payload.hoursTarget ?? null, color: payload.color || null,
    icon: payload.icon || null, sort_order: payload.sortOrder ?? 0,
    updated_at: new Date().toISOString(),
  };
  let q;
  if (payload.id) q = supabase.from("study_tracks").update(row).eq("id", payload.id);
  else q = supabase.from("study_tracks").insert({ ...row, created_by: user.id });
  const { data, error } = await q.select().single();
  if (error) throw error; result = data; break;
}
case "setItemStatus": {
  const { data, error } = await supabase.from("study_module_items")
    .update({ status: payload.status, updated_at: new Date().toISOString() })
    .eq("id", payload.id).select().single();
  if (error) throw error; result = data; break;
}
case "reorderModuleItems": {
  for (const it of payload.items) {
    await supabase.from("study_module_items").update({ position: it.position }).eq("id", it.id);
  }
  result = { ok: true }; break;
}
case "setResourceProgress": {
  const patch: any = { updated_at: new Date().toISOString() };
  if (payload.currentPage !== undefined) patch.current_page = payload.currentPage;
  if (payload.hoursDone !== undefined) patch.hours_done = payload.hoursDone;
  const { data, error } = await supabase.from("study_resources").update(patch).eq("id", payload.id).select().single();
  if (error) throw error; result = data; break;
}
case "startFocusSession": { /* insert focus_sessions, user_id: user.id, status:'active', started_at: now */ }
case "tickFocusSession":  { /* update actual_minutes/interruptions (checkpoint ~60s) */ }
case "endFocusSession":   { /* status:'completed', ended_at: now */ }
case "reviewCard": {
  // SM-2 simples
  const { data: card } = await supabase.from("study_reviews").select("*").eq("id", payload.id).single();
  const g = payload.grade;                       // 0..5
  let ease = (card.ease ?? 250) / 100;            // guardamos *100 (inteiro)
  let reps = card.reps ?? 0;
  let interval = card.interval_days ?? 0;
  if (g < 3) { reps = 0; interval = 1; }
  else {
    reps += 1;
    interval = reps === 1 ? 1 : reps === 2 ? 6 : Math.round(interval * ease);
    ease = Math.max(1.3, ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)));
  }
  const due = new Date(); due.setDate(due.getDate() + interval);
  const status = interval >= 21 ? "mastered" : reps <= 1 ? "learning" : "review";
  const { data, error } = await supabase.from("study_reviews").update({
    ease: Math.round(ease * 100), reps, interval_days: interval,
    due_at: due.toISOString(), last_reviewed_at: new Date().toISOString(),
    status, updated_at: new Date().toISOString(),
  }).eq("id", payload.id).select().single();
  if (error) throw error; result = data; break;
}
case "unlockAchievement": {
  const { data, error } = await supabase.from("study_achievements")
    .upsert({ workspace_id: payload.workspaceId, user_id: user.id, key: payload.key,
      name: payload.name, tier: payload.tier || "bronze", unlocked_at: new Date().toISOString() },
      { onConflict: "workspace_id,user_id,key" }).select().single();
  if (error) throw error; result = data; break;
}
case "updateStudySettings": {
  const { data, error } = await supabase.from("study_settings")
    .upsert({ workspace_id: payload.workspaceId, user_id: user.id, data: payload.data, updated_at: new Date().toISOString() },
      { onConflict: "workspace_id,user_id" }).select().single();
  if (error) throw error; result = data; break;
}
// deleteStudyTrack/Resource/etc → deleteOrThrow(supabase, "study_tracks", payload.id)
```

## 1.7 `src/hooks/use-queries.ts` — hooks
Query (padrão para todos):
```ts
export function useStudyTracks(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyTracks", workspaceId, personaId],
    queryFn: () => qa.getStudyTracksAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}
// idem: useStudyResources, useStudyObjectives, useStudyGoals, useFocusSessions,
//       useStudyReviews, useStudyPlans, useStudyAchievements, useStudyDashboard
```
Mutation (padrão otimista — invalidar a query e a do dashboard):
```ts
export function useStartFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("startFocusSession", p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["focusSessions"] }); qc.invalidateQueries({ queryKey: ["studyDashboard"] }); },
  });
}
// idem: useEndFocusSession, useSetItemStatus, useUpsertResource, useSetResourceProgress,
//       useReviewCard, useUpsertTrack, useUpsertGoal, useUpsertObjective, useUpsertPlan...
```

## 1.8 `src/hooks/use-realtime.ts`
Estender `realtimeQueryKeys`:
```ts
focus_sessions:    ["focusSessions", "studyDashboard"],
study_tracks:      ["studyTracks", "studyDashboard"],
study_modules:     ["studyTracks"],
study_module_items:["studyTracks"],
study_resources:   ["studyResources"],
study_reviews:     ["studyReviews", "studyDashboard"],
```
E criar:
```ts
export function useRealtimeFocusSession(workspaceId?: string) {
  useRealtime({ table: "focus_sessions", filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined, enabled: !!workspaceId });
}
export function useRealtimeStudyTracks(workspaceId?: string) {
  useRealtime({ table: "study_tracks", filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined, enabled: !!workspaceId });
}
```

## 1.9 `src/stores/study-store.ts` (novo)
```ts
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  sessionId: string | null;
  startedAt: number | null;   // epoch ms
  baseSeconds: number;        // segundos já acumulados antes do último resume
  paused: boolean;
  technique: "pomodoro" | "deep_work" | "free";
  target: { trackId?: string; moduleId?: string; moduleItemId?: string; resourceId?: string; projectId?: string; taskId?: string } | null;
  libraryView: "grid" | "table";
  start: (sessionId: string, target: TimerState["target"], technique: TimerState["technique"]) => void;
  pause: (elapsed: number) => void;
  resume: () => void;
  stop: () => void;
  setLibraryView: (v: "grid" | "table") => void;
}

export const useStudyStore = create<TimerState>()(
  persist(
    (set) => ({
      sessionId: null, startedAt: null, baseSeconds: 0, paused: false,
      technique: "pomodoro", target: null, libraryView: "grid",
      start: (sessionId, target, technique) => set({ sessionId, target, technique, startedAt: Date.now(), baseSeconds: 0, paused: false }),
      pause: (elapsed) => set({ paused: true, baseSeconds: elapsed, startedAt: null }),
      resume: () => set({ paused: false, startedAt: Date.now() }),
      stop: () => set({ sessionId: null, startedAt: null, baseSeconds: 0, paused: false, target: null }),
      setLibraryView: (v) => set({ libraryView: v }),
    }),
    { name: "zayon.study", partialize: (st) => ({ libraryView: st.libraryView }) }, // SÓ UI persiste
  ),
);
```
Componente do timer calcula `elapsed = baseSeconds + (startedAt ? (Date.now()-startedAt)/1000 : 0)` num `setInterval(1s)` local. Persistência só em start/pause/stop/checkpoint via mutations.

**✅ Aceite Fase 1:** `lint`+`tsc`+`build` ok; `/api/query` resource `studyTracks` responde autenticado.

---

# FASES 2–5 — TELAS
Rotas em `src/app/(workspace)/study/...`, componentes em `src/components/study/...`. Padrão = `tasks/page.tsx`.

## FASE 2 — Trilhas + Biblioteca

### `src/app/(workspace)/study/tracks/page.tsx`
```tsx
"use client";
import { PageHeader } from "@/components/ui/page-header";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyTracks } from "@/hooks/use-queries";
import { useRealtimeStudyTracks } from "@/hooks/use-realtime";
import { TrackCard } from "@/components/study/track-card";

export default function StudyTracksPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: tracks = [] } = useStudyTracks(ws);
  useRealtimeStudyTracks(ws ?? undefined);
  return (
    <div className="space-y-6">
      <PageHeader title="Trilhas" subtitle="Cadeiras, semestres e progresso" /* + botão Nova trilha via quick-create */ />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tracks.map((t: any) => <TrackCard key={t.id} track={t} />)}
      </div>
    </div>
  );
}
```
- `TrackCard`: nome, área, status (Badge), barra de progresso (`progress`), `hoursDone/hoursTarget`, expandir → módulos→submódulos.
- **Nova trilha**: adicionar `"studyTrack"` ao `QuickCreateEntity` e form no `quick-create-dialog`, OU dialog próprio chamando `useUpsertTrack`.

### `src/app/(workspace)/study/tracks/[trackId]/page.tsx`
- Checklist de módulos/submódulos com `@dnd-kit/sortable` (reordenar → `reorderModuleItems`).
- Clique no status cicla `not_started→in_progress→completed` (`setItemStatus`, otimista).
- Cada submódulo mostra recurso vinculado (`resourceId`).
- Botão **"Iniciar foco"** → abre o timer (`/study/sessions`) já com `{ trackId, moduleId }` (via `study-store.start` ou query param).

### `src/app/(workspace)/study/library/page.tsx`
- `Tabs` ou toggle grid/tabela (`useStudyStore.libraryView`).
- Tabela: `DataTable` (`@tanstack/react-table`, ver `src/components/tables/data-table.tsx`). Colunas: capa, título, autores, tipo, status, progresso (`currentPage/pages`), rating.
- Filtros: área/status/tipo/idioma (estado local + `useMemo`).
- Card de livro: capa, barra de páginas, workflow de status (`setResourceStatus`), rating/resenha.
- **Upload** capa/PDF: `@uploadthing/react` (`UploadButton`/`useUploadThing`) usando a rota `src/app/api/uploadthing` existente; gravar URL em `coverUrl`/`fileUrl` via `useUpsertResource`.
- **Novo recurso**: dialog com `useUpsertResource`.

**✅ Fase 2:** criar trilha, marcar submódulo, cadastrar livro (com upload) pela UI.

## FASE 3 — Sessões de Foco (a ponte)

### `src/app/(workspace)/study/sessions/page.tsx`
- **Timer grande**: lê `useStudyStore`; `setInterval` local p/ exibir `elapsed`; botões Start/Pause/Stop.
  - Start → `useStartFocusSession` (recebe alvo) → guarda `sessionId` no store.
  - Checkpoint a cada 60s → `tickFocusSession({ id, actualMinutes })`.
  - Stop → `endFocusSession({ id, actualMinutes, interruptions, notes })`.
- **Seletor do que está fazendo** (radio/tabs): 
  - "Estudo" → `Trilha` + `Módulo`/`Submódulo` (usa `useStudyTracks`).
  - "Trabalho" → `Projeto`/`Persona` + `Task` (usa `useProjects`, `useTasks`).
  - Define `type` (`study`/`work`/`deep_work`) e o alvo (`trackId` OU `projectId`+`taskId`).
- **Técnica**: pomodoro (25/5) / deep work / livre.
- **Histórico**: `useFocusSessions` → lista + heatmap por dia (componente `SessionsHeatmap`, calcular minutos/dia em JS).
- **Timer vivo entre abas**: `useRealtimeFocusSession(ws)` invalida; store sincroniza.
- **Atalho global "Iniciar foco"**: adicionar item no command-menu (`src/components/.../command-menu`) e no `quick-create` (entidade `"focusSession"`); botão no topbar.

**✅ Fase 3:** uma sessão loga horas numa trilha **e** outra num projeto; timer sobrevive a troca de aba.

## FASE 4 — Revisões + Planner + Objetivos/Metas

### `src/app/(workspace)/study/reviews/page.tsx`
- Fila de cards `due` (`useStudyReviews`, filtra `dueAt <= now`).
- Fluxo de revisão: mostrar card → botões de nota (Errei=0 … Fácil=5) → `useReviewCard({ id, grade })` (SM-2 já no backend).
- "Caderno de ataques": criar `attack_note` (`upsertReview` com `kind:"attack_note"`) a partir de um módulo/trilha.

### `src/app/(workspace)/study/planner/page.tsx`
- `@fullcalendar/react` + `timeGridPlugin` + `interactionPlugin` (já instalados). Ver uso no Calendar global p/ manter estilo.
- Blocos da rotina vêm de `study_plans.schedule` (jsonb `[{days,start,end,label,trackId?,projectId?}]`). Render como eventos recorrentes.
- Bloco A (09–10 Python diário), B/C (10–11), Trabalho (16–21). Criar/editar via `upsertPlan`.
- Cada bloco aponta p/ trilha ou projeto; clique → "Iniciar foco" pré-preenchido.

### Objetivos/Metas
- Seções (ou `/study/objectives`): criar objetivo guarda-chuva (`upsertObjective`), vincular trilhas/recursos (setar `objectiveId` neles), metas mensuráveis (`upsertGoal`) com barra `current/target` (current derivado: horas de `focus_sessions`, páginas de `study_resources`, streak de sessões).

**✅ Fase 4:** revisão agenda próximo `dueAt`; planner mostra blocos A/B/C + trabalho.

## FASE 5 — Dashboard + Conquistas + polish

### `src/app/(workspace)/study/page.tsx` (overview, bento)
- `useStudyDashboard(ws)`. Cards: streak atual, horas da semana (`echarts` bar/line), trilhas ativas (progresso), próximas revisões, **"bloco de agora"** (cruza `new Date()` com `study_plans.schedule`), "continue de onde parou" (última `focus_session`/recurso `reading`), conquistas recentes, `animated-list` das últimas sessões, `number-ticker` nas horas/streak.

### `src/app/(workspace)/study/achievements/page.tsx`
- Grade por tier (bronze/silver/gold); `useStudyAchievements`; progresso via `progress` jsonb.

### Settings de estudo (`/study/settings` ou tab em `/settings`)
- Tamanho do pomodoro, meta diária de horas, ordem das views → `updateStudySettings`.

### Navegação — `src/components/layout/sidebar.tsx`
```ts
const studyNav: NavItem[] = [
  { href: "/study", label: "Estudo", icon: GraduationCap },
  { href: "/study/tracks", label: "Trilhas", icon: Milestone },
  { href: "/study/library", label: "Biblioteca", icon: Library },
  { href: "/study/sessions", label: "Sessões", icon: Timer },
  { href: "/study/reviews", label: "Revisões", icon: Repeat },
  { href: "/study/planner", label: "Planner", icon: CalendarClock },
];
// e no JSX: <NavGroup label="Estudo & Foco" items={studyNav} pathname={pathname} />
```
(Importar os ícones de `lucide-react`.) Registrar as rotas no command-menu.

### UI premium (em `src/components/study/fx/`)
Copiar pontual e adaptar aos tokens + dark/light: Magic UI (bento-grid, animated-list, number-ticker, shimmer-button "Iniciar foco"); Aceternity (spotlight/background-gradient em heros/empty); ReUI (data-grid da Biblioteca). Sem shader pesado. **Se brigar com o padrão, prevalece o repo.**

**✅ Fase 5:** overview com streak/horas/bloco-de-agora; UI premium aplicada em light/dark.

---

# FASE 6 — Seed do STUDY: `scripts/seed-study.ts`
```ts
/**
 * Seed idempotente do STUDY → tabelas study_*. Upsert por sourceId (col source_id).
 * Origem: projeto THALLES STUDY (wxazhueckvkwerzzpyml), public.user_data.data (jsonb),
 * user_id 54cd93f9-3b20-4a78-9542-4518e52485d2.
 * Vias: (a) scripts/study-export.json colado pelo dono; (b) STUDY_SOURCE_DATABASE_URL (read-only).
 * Escopo: SEED_WORKSPACE_ID, SEED_PERSONA_ID?, SEED_USER_ID (envs). CONFIRMAR com o dono antes.
 * Rodar: npx tsx scripts/seed-study.ts
 */
import postgres from "postgres";
import * as fs from "node:fs";

const PT2EN = {
  track:    { "Ativo": "active", "Pausado": "paused", "Concluído": "completed" },
  item:     { "em andamento": "in_progress", "não iniciado": "not_started", "concluído": "completed" },
  resStatus:{ "Na fila": "backlog", "Lendo": "reading", "Concluído": "completed", "Abandonado": "abandoned" },
  resType:  { "Livro": "book", "Curso": "course", "Vídeo": "video", "Artigo": "article" },
};

async function loadSource(): Promise<any> {
  if (fs.existsSync("scripts/study-export.json"))
    return JSON.parse(fs.readFileSync("scripts/study-export.json", "utf8"));
  const src = postgres(process.env.STUDY_SOURCE_DATABASE_URL!, { prepare: false });
  const rows = await src`select data from user_data where user_id = '54cd93f9-3b20-4a78-9542-4518e52485d2'`;
  await src.end();
  return rows[0].data;
}

async function main() {
  const data = await loadSource();
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const WS = process.env.SEED_WORKSPACE_ID!, USER = process.env.SEED_USER_ID!, PERSONA = process.env.SEED_PERSONA_ID || null;
  const counts = { objectives: 0, tracks: 0, modules: 0, items: 0, resources: 0 };

  // upsert helper por source_id
  const upsert = async (table: string, sourceId: string, row: Record<string, any>) => {
    const existing = await db`select id from ${db(table)} where source_id = ${sourceId} and workspace_id = ${WS} limit 1`;
    if (existing.length) {
      await db`update ${db(table)} set ${db(row)} where id = ${existing[0].id}`;
      return existing[0].id;
    }
    const ins = await db`insert into ${db(table)} ${db({ ...row, source_id: sourceId, workspace_id: WS })} returning id`;
    return ins[0].id;
  };

  // 1) objetivos
  const objMap: Record<string, string> = {};
  for (const o of (data.objetivos ?? [])) {
    objMap[o.id] = await upsert("study_objectives", o.id, {
      persona_id: PERSONA, name: o.nome, emoji: o.emoji || null, category: o.categoria || null,
      status: "active", milestones: JSON.stringify(o.marcos ?? []), created_by: USER,
    });
    counts.objectives++;
  }

  // 2) recursos (antes de items p/ vincular)
  const resMap: Record<string, string> = {};
  for (const r of (data.recursos ?? [])) {
    resMap[r.id] = await upsert("study_resources", r.id, {
      persona_id: PERSONA, objective_id: r.objetivoId ? objMap[r.objetivoId] : null,
      title: r.titulo, subtitle: r.subtitulo || null, authors: r.autores || null, area: r.area || null,
      type: PT2EN.resType[r.tipo] || "other", status: PT2EN.resStatus[r.status] || "backlog",
      language: r.idioma || null, year: r.ano || null, publisher: r.editora || null,
      pages: r.paginas || null, current_page: r.paginaAtual || 0, hours_done: r.horasConcluidas || 0,
      link: r.link || null, isbn: r.isbn || null, edition: r.edicao || null, rating: r.rating || null,
      review: r.resenha || null, recommend: r.recomendaria ?? null, tags: JSON.stringify(r.tags ?? []),
      cover_url: r.capaPath || null, file_url: r.pdfPath || null, created_by: USER,
    });
    counts.resources++;
  }

  // 3) trilhas → módulos → submódulos
  for (const t of (data.trilhas ?? [])) {
    const trackId = await upsert("study_tracks", t.id, {
      persona_id: PERSONA, objective_id: t.objetivoId ? objMap[t.objetivoId] : null,
      name: t.nome, area: t.area || null, status: PT2EN.track[t.status] || "active",
      mode: t.modo || null, hours_target: t.horasMeta || null, created_by: USER,
    });
    counts.tracks++;
    for (const [mi, m] of (t.modulos ?? []).entries()) {
      const moduleId = await upsert("study_modules", m.id, {
        track_id: trackId, name: m.nome, status: PT2EN.item[m.status] || "not_started",
        hours_target: m.horas || null, position: mi, expanded: !!m._expanded,
      });
      counts.modules++;
      for (const [si, sm] of (m.submodulos ?? []).entries()) {
        await upsert("study_module_items", sm.id, {
          module_id: moduleId, name: sm.nome, status: PT2EN.item[sm.status] || "not_started",
          hours: sm.horas || 1, position: si,
          resource_id: sm.recursoId ? (resMap[sm.recursoId] || null) : null, link: sm.link || null,
        });
        counts.items++;
      }
    }
  }

  // 4) integridade: nenhum item com resource_id órfão
  const orphans = await db`select count(*)::int as n from study_module_items i
    where i.resource_id is not null and not exists (select 1 from study_resources r where r.id = i.resource_id)`;
  console.log("SEED OK", counts, "órfãos:", orphans[0].n);
  await db.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
```
**✅ Fase 6:** 7 trilhas FORTALEZA, 15 módulos, 71 submódulos, 31 livros, objetivo "Aprender programação"; vínculos intactos; rodar 2× = zero duplicata; órfãos = 0.

---

# CHECKLIST FINAL POR FASE
- [x] F0 schema+enums+RLS+tipos · `db:generate` (sem push) · `tsc` ok
- [x] F1 4-arquivos-leitura + 3-escrita + hooks + realtime + store · `/api/query` responde
- [x] F2 tracks + [trackId] + library (dnd + upload)
- [x] F3 sessions (timer + ponte + realtime + atalho global)
- [x] F4 reviews (SM-2) + planner (FullCalendar) + objetivos/metas
- [x] F5 overview bento + achievements + settings + sidebar/command-menu + fx premium
- [x] F6 seed idempotente
Cada fase: `npm run lint` + `npx tsc --noEmit` + `npm run build` limpos + 1 commit.
