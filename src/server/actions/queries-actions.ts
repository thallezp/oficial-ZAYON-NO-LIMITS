"use server";

import { queries } from "../queries";
import {
  assertPersonaAccess,
  assertTaskAccess,
  assertWorkspaceMember,
  getCurrentUserOrThrow,
} from "../services/authz";

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
}

async function assertScope(filter?: ScopeFilter) {
  if (filter?.personaId) {
    await assertPersonaAccess(filter.personaId);
    return;
  }
  await assertWorkspaceMember(filter?.workspaceId);
}

export async function getTasksAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.tasks.list(filter);
}

export async function getProjectsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.projects.list(filter);
}

export async function getContentAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.content.list(filter);
}

export async function getLeadsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.leads.list(filter);
}

export async function getLaunchCampaignsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.launch.campaigns(filter);
}

export async function getFinanceAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.finance.list(filter);
}

export async function getPayrollListAction(workspaceId: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.finance.payrollList(workspaceId);
}

export async function getBillsListAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.finance.billsList(filter);
}

export async function getPersonasListAction(workspaceId?: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.personas.list(workspaceId);
}

export async function getPersonaByIdAction(id: string) {
  await assertPersonaAccess(id);
  return queries.personas.byId(id);
}

export async function getDocumentsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.documents.list(filter);
}

export async function getDocumentByIdAction(id: string) {
  const doc = await queries.documents.byId(id);
  if (!doc) return null;
  await assertWorkspaceMember((doc as any).workspaceId);
  return doc;
}

export async function getMaterialsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.materials.list(filter);
}

export async function getFoldersAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.folders.list(filter);
}

export async function getContentHooksAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.contentHooks.list(filter);
}

export async function getFollowerSnapshotsAction(personaId: string) {
  await assertPersonaAccess(personaId);
  return queries.followerSnapshots.list(personaId);
}

export async function getToolsAction(workspaceId?: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.tools.list(workspaceId);
}

export async function getFlowsAction(workspaceId?: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.flows.list(workspaceId);
}

export async function getFlowByIdAction(id: string) {
  const flow = await queries.flows.byId(id);
  if (!flow) return null;
  await assertWorkspaceMember((flow as any).workspaceId);
  return flow;
}

export async function getFunnelByPersonaIdAction(personaId: string) {
  await assertPersonaAccess(personaId);
  return queries.funnels.byPersonaId(personaId);
}

export async function getIcpPainsAction(personaId: string) {
  await assertPersonaAccess(personaId);
  return queries.icpPains.list(personaId);
}

export async function getPromptsAction(personaId: string) {
  await assertPersonaAccess(personaId);
  return queries.prompts.list(personaId);
}

export async function getModelingAction(personaId: string) {
  await assertPersonaAccess(personaId);
  return queries.modeling.list(personaId);
}

export async function getTeamAction(workspaceId?: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.team.list(workspaceId);
}

export async function getInvitationsAction(workspaceId: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.invitations.list(workspaceId);
}

export async function getModelingContentExamplesAction(profileId: string) {
  return queries.modelingExamples.list(profileId);
}

export async function getNotificationsAction(userId: string) {
  const user = await getCurrentUserOrThrow();
  if (user.id !== userId) throw new Error("Acesso negado as notificacoes");
  return queries.notifications.list(userId);
}

export async function getActivityLogsAction(workspaceId: string) {
  await assertWorkspaceMember(workspaceId);
  return queries.activity.list(workspaceId);
}

export async function getAiActionsAction(workspaceId: string, personaId?: string) {
  if (personaId) {
    await assertPersonaAccess(personaId);
  } else {
    await assertWorkspaceMember(workspaceId);
  }
  return queries.aiActions.list(workspaceId, personaId);
}

export async function getCalendarEventsAction(filter?: ScopeFilter) {
  await assertScope(filter);
  return queries.calendar.list(filter);
}

export async function getTaskCommentsAction(taskId: string) {
  await assertTaskAccess(taskId);
  return queries.taskExtensions.comments(taskId);
}

export async function getTaskSubtasksAction(taskId: string) {
  await assertTaskAccess(taskId);
  return queries.taskExtensions.subtasks(taskId);
}

export async function getStudyTracksAction(f?: ScopeFilter)     { const user = await getCurrentUserOrThrow(); await assertScope(f); return queries.study.tracks({ ...f, userId: user.id }); }
export async function getStudyResourcesAction(f?: ScopeFilter)  { const user = await getCurrentUserOrThrow(); await assertScope(f); return queries.study.resources({ ...f, userId: user.id }); }
export async function getStudyObjectivesAction(f?: ScopeFilter) { const user = await getCurrentUserOrThrow(); await assertScope(f); return queries.study.objectives({ ...f, userId: user.id }); }
export async function getStudyGoalsAction(f?: ScopeFilter)      { const user = await getCurrentUserOrThrow(); await assertScope(f); return queries.study.goals({ ...f, userId: user.id }); }
export async function getFocusSessionsAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.focusSessions({ ...f, userId: user.id });
}
export async function getStudyReviewsAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.reviewsDue({ ...f, userId: user.id });
}
export async function getStudyPlansAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.plans({ ...f, userId: user.id });
}
export async function getStudyAchievementsAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.achievements({ ...f, userId: user.id });
}
export async function getStudyDashboardAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.study.dashboard({ ...f, userId: user.id });
}

export async function getEnergyAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.energy.bundle({ workspaceId: f?.workspaceId, userId: user.id });
}

export async function getPersonalFinanceAction(f?: ScopeFilter) {
  const user = await getCurrentUserOrThrow();
  await assertScope(f);
  return queries.personalFinance.bundle({ workspaceId: f?.workspaceId, userId: user.id });
}

