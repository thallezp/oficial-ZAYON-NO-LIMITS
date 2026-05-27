"use server";

import { queries } from "../queries";

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
}

export async function getTasksAction(filter?: ScopeFilter) {
  return queries.tasks.list(filter);
}

export async function getProjectsAction(filter?: ScopeFilter) {
  return queries.projects.list(filter);
}

export async function getContentAction(filter?: ScopeFilter) {
  return queries.content.list(filter);
}

export async function getLeadsAction(filter?: ScopeFilter) {
  return queries.leads.list(filter);
}

export async function getFinanceAction(filter?: ScopeFilter) {
  return queries.finance.list(filter);
}

export async function getPayrollListAction(workspaceId: string) {
  return queries.finance.payrollList(workspaceId);
}

export async function getBillsListAction(filter?: ScopeFilter) {
  return queries.finance.billsList(filter);
}

export async function getPersonasListAction(workspaceId?: string) {
  return queries.personas.list(workspaceId);
}

export async function getPersonaByIdAction(id: string) {
  return queries.personas.byId(id);
}

export async function getDocumentsAction(filter?: ScopeFilter) {
  return queries.documents.list(filter);
}

export async function getDocumentByIdAction(id: string) {
  return queries.documents.byId(id);
}

export async function getMaterialsAction(filter?: ScopeFilter) {
  return queries.materials.list(filter);
}

export async function getToolsAction(workspaceId?: string) {
  return queries.tools.list(workspaceId);
}

export async function getFlowsAction(workspaceId?: string) {
  return queries.flows.list(workspaceId);
}

export async function getFlowByIdAction(id: string) {
  return queries.flows.byId(id);
}

export async function getFunnelByPersonaIdAction(personaId: string) {
  return queries.funnels.byPersonaId(personaId);
}

export async function getIcpPainsAction(personaId: string) {
  return queries.icpPains.list(personaId);
}

export async function getPromptsAction(personaId: string) {
  return queries.prompts.list(personaId);
}

export async function getModelingAction(personaId: string) {
  return queries.modeling.list(personaId);
}

export async function getTeamAction(workspaceId?: string) {
  return queries.team.list(workspaceId);
}

export async function getNotificationsAction(userId: string) {
  return queries.notifications.list(userId);
}

export async function getActivityLogsAction(workspaceId: string) {
  return queries.activity.list(workspaceId);
}

export async function getAiActionsAction(workspaceId: string, personaId?: string) {
  return queries.aiActions.list(workspaceId, personaId);
}
