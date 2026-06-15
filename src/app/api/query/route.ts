import { NextResponse } from "next/server";
import * as qa from "@/server/actions/queries-actions";

/**
 * Route handler universal de LEITURA.
 *
 * PORQUÊ: as leituras antes passavam por Server Actions (qa.getXAction).
 * O App Router do Next 14 SERIALIZA Server Actions disparadas em paralelo —
 * elas entram numa fila e rodam uma de cada vez. A Home dispara 13 queries;
 * em série isso vira 13 round-trips encadeados (~2s) antes da página assentar,
 * e era a causa raiz da troca de abas "não 100% fluida".
 *
 * Route handlers chamados via fetch() rodam em PARALELO (multiplexação HTTP/2
 * na Vercel). Aqui reaproveitamos exatamente as mesmas funções de Server Action
 * (que já fazem authz + query) — só que agora cada hook do React Query bate
 * neste endpoint de forma concorrente, e o tempo total cai para ~1 query.
 *
 * Mantém a MESMA semântica de autorização: cada handler reusa o assertScope/
 * assertWorkspaceMember/assertPersonaAccess da action correspondente.
 */

type Params = {
  workspaceId?: string;
  personaId?: string;
  userId?: string;
  id?: string;
  taskId?: string;
  profileId?: string;
};

const handlers: Record<string, (p: Params) => Promise<unknown>> = {
  tasks: (p) => qa.getTasksAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  projects: (p) => qa.getProjectsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  content: (p) => qa.getContentAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  leads: (p) => qa.getLeadsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  launchCampaigns: (p) =>
    qa.getLaunchCampaignsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  finance: (p) => qa.getFinanceAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  payroll: (p) => qa.getPayrollListAction(p.workspaceId as string),
  bills: (p) => qa.getBillsListAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  personas: (p) => qa.getPersonasListAction(p.workspaceId),
  persona: (p) => qa.getPersonaByIdAction(p.id as string),
  documents: (p) => qa.getDocumentsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  document: (p) => qa.getDocumentByIdAction(p.id as string),
  materials: (p) => qa.getMaterialsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  folders: (p) => qa.getFoldersAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  contentHooks: (p) =>
    qa.getContentHooksAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  followerSnapshots: (p) => qa.getFollowerSnapshotsAction(p.personaId as string),
  tools: (p) => qa.getToolsAction(p.workspaceId),
  flows: (p) => qa.getFlowsAction(p.workspaceId),
  flow: (p) => qa.getFlowByIdAction(p.id as string),
  funnel: (p) => qa.getFunnelByPersonaIdAction(p.personaId as string),
  icpPains: (p) => qa.getIcpPainsAction(p.personaId as string),
  prompts: (p) => qa.getPromptsAction(p.personaId as string),
  modeling: (p) => qa.getModelingAction(p.personaId as string),
  modelingExamples: (p) => qa.getModelingContentExamplesAction(p.profileId as string),
  team: (p) => qa.getTeamAction(p.workspaceId),
  invitations: (p) => qa.getInvitationsAction(p.workspaceId as string),
  notifications: (p) => qa.getNotificationsAction(p.userId as string),
  activityLogs: (p) => qa.getActivityLogsAction(p.workspaceId as string),
  aiActions: (p) => qa.getAiActionsAction(p.workspaceId as string, p.personaId),
  calendarEvents: (p) =>
    qa.getCalendarEventsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  taskComments: (p) => qa.getTaskCommentsAction(p.taskId as string),
  taskSubtasks: (p) => qa.getTaskSubtasksAction(p.taskId as string),
  studyTracks: (p) => qa.getStudyTracksAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyResources: (p) => qa.getStudyResourcesAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyObjectives: (p) => qa.getStudyObjectivesAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyGoals: (p) => qa.getStudyGoalsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  focusSessions: (p) => qa.getFocusSessionsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyReviews: (p) => qa.getStudyReviewsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyPlans: (p) => qa.getStudyPlansAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyAchievements: (p) => qa.getStudyAchievementsAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
  studyDashboard: (p) => qa.getStudyDashboardAction({ workspaceId: p.workspaceId, personaId: p.personaId }),
};

export async function POST(req: Request) {
  let resource = "";
  try {
    const body = (await req.json().catch(() => null)) as
      | { resource?: string; params?: Params }
      | null;

    resource = body?.resource ?? "";
    if (!resource) {
      return NextResponse.json({ ok: false, error: "resource é obrigatório" }, { status: 400 });
    }

    const handler = handlers[resource];
    if (!handler) {
      return NextResponse.json(
        { ok: false, error: `Recurso desconhecido: ${resource}` },
        { status: 400 },
      );
    }

    const data = await handler(body?.params ?? {});
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao buscar dados";
    const isAuth = /autoriz|negad|acesso|permiss/i.test(msg);
    console.error("[/api/query] Erro:", resource, msg);
    return NextResponse.json({ ok: false, error: msg }, { status: isAuth ? 403 : 500 });
  }
}
