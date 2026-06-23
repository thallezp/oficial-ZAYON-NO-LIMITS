/**
 * Camada de LEITURA via fetch paralelo (/api/query).
 *
 * Substitui as Server Actions de leitura (qa.getXAction). O App Router
 * serializa Server Actions concorrentes — uma de cada vez — então uma página
 * que dispara 13 queries fazia 13 round-trips em série. Trocando por fetch(),
 * todas as queries do React Query rodam em PARALELO (HTTP/2), e o tempo total
 * cai para ~1 query. Cada função abaixo mantém a MESMA assinatura E o MESMO
 * tipo de retorno da action correspondente (derivado via `Awaited<ReturnType>`),
 * então `use-queries.ts` só troca o import — nenhum consumidor muda de tipo.
 *
 * `import type` é apagado em build (não traz o código "use server" pro client),
 * mas preserva a tipagem exata das actions reais.
 */
import type * as Real from "@/server/actions/queries-actions";

type ResultOf<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
}

async function callQuery<T>(
  resource: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource, params }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || "Erro ao buscar dados");
  }

  return json.data as T;
}

// ── Filtro (workspace/persona) ──────────────────────────────────────────────
export const getTasksAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getTasksAction>>("tasks", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getProjectsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getProjectsAction>>("projects", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getContentAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getContentAction>>("content", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getLeadsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getLeadsAction>>("leads", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getLaunchCampaignsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getLaunchCampaignsAction>>("launchCampaigns", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getFinanceAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getFinanceAction>>("finance", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getBillsListAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getBillsListAction>>("bills", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getDocumentsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getDocumentsAction>>("documents", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getMaterialsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getMaterialsAction>>("materials", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getFoldersAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getFoldersAction>>("folders", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getContentHooksAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getContentHooksAction>>("contentHooks", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });
export const getCalendarEventsAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getCalendarEventsAction>>("calendarEvents", {
    workspaceId: f?.workspaceId,
    personaId: f?.personaId,
  });

// ── Workspace ───────────────────────────────────────────────────────────────
export const getPayrollListAction = (workspaceId: string) =>
  callQuery<ResultOf<typeof Real.getPayrollListAction>>("payroll", { workspaceId });
export const getPersonasListAction = (workspaceId?: string) =>
  callQuery<ResultOf<typeof Real.getPersonasListAction>>("personas", { workspaceId });
export const getToolsAction = (workspaceId?: string) =>
  callQuery<ResultOf<typeof Real.getToolsAction>>("tools", { workspaceId });
export const getFlowsAction = (workspaceId?: string) =>
  callQuery<ResultOf<typeof Real.getFlowsAction>>("flows", { workspaceId });
export const getTeamAction = (workspaceId?: string) =>
  callQuery<ResultOf<typeof Real.getTeamAction>>("team", { workspaceId });
export const getInvitationsAction = (workspaceId: string) =>
  callQuery<ResultOf<typeof Real.getInvitationsAction>>("invitations", { workspaceId });
export const getActivityLogsAction = (workspaceId: string) =>
  callQuery<ResultOf<typeof Real.getActivityLogsAction>>("activityLogs", { workspaceId });

// ── Persona ─────────────────────────────────────────────────────────────────
export const getPersonaByIdAction = (id: string) =>
  callQuery<ResultOf<typeof Real.getPersonaByIdAction>>("persona", { id });
export const getFollowerSnapshotsAction = (personaId: string) =>
  callQuery<ResultOf<typeof Real.getFollowerSnapshotsAction>>("followerSnapshots", {
    personaId,
  });
export const getFunnelByPersonaIdAction = (personaId: string, funnelId?: string) =>
  callQuery<ResultOf<typeof Real.getFunnelByPersonaIdAction>>("funnel", { personaId, funnelId });
export const getFunnelsListAction = (personaId: string) =>
  callQuery<ResultOf<typeof Real.getFunnelsListAction>>("funnels", { personaId });
export const getIcpPainsAction = (personaId: string) =>
  callQuery<ResultOf<typeof Real.getIcpPainsAction>>("icpPains", { personaId });
export const getPromptsAction = (personaId: string) =>
  callQuery<ResultOf<typeof Real.getPromptsAction>>("prompts", { personaId });
export const getModelingAction = (personaId: string) =>
  callQuery<ResultOf<typeof Real.getModelingAction>>("modeling", { personaId });

// ── Por ID específico ───────────────────────────────────────────────────────
export const getDocumentByIdAction = (id: string) =>
  callQuery<ResultOf<typeof Real.getDocumentByIdAction>>("document", { id });
export const getFlowByIdAction = (id: string) =>
  callQuery<ResultOf<typeof Real.getFlowByIdAction>>("flow", { id });
export const getModelingContentExamplesAction = (profileId: string) =>
  callQuery<ResultOf<typeof Real.getModelingContentExamplesAction>>("modelingExamples", {
    profileId,
  });
export const getTaskCommentsAction = (taskId: string) =>
  callQuery<ResultOf<typeof Real.getTaskCommentsAction>>("taskComments", { taskId });
export const getTaskSubtasksAction = (taskId: string) =>
  callQuery<ResultOf<typeof Real.getTaskSubtasksAction>>("taskSubtasks", { taskId });

// ── Casos com assinatura própria ────────────────────────────────────────────
export const getNotificationsAction = (userId: string) =>
  callQuery<ResultOf<typeof Real.getNotificationsAction>>("notifications", { userId });
export const getAiActionsAction = (workspaceId: string, personaId?: string) =>
  callQuery<ResultOf<typeof Real.getAiActionsAction>>("aiActions", {
    workspaceId,
    personaId,
  });

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
export const getEnergyAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getEnergyAction>>("energy", { workspaceId: f?.workspaceId, personaId: f?.personaId });
export const getPersonalFinanceAction = (f?: ScopeFilter) =>
  callQuery<ResultOf<typeof Real.getPersonalFinanceAction>>("personalFinance", { workspaceId: f?.workspaceId, personaId: f?.personaId });

