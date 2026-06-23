"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Leituras agora vão por fetch paralelo (/api/query) em vez de Server Actions
// serializadas. Mesmas assinaturas das actions — só o import muda. Ver
// src/lib/queries-fetch.ts e src/app/api/query/route.ts.
import * as qa from "@/lib/queries-fetch";
import { callMutate } from "@/lib/mutate-client";

// Query Hooks --------------------------------------------------------------

export function useTasks(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["tasks", workspaceId, personaId],
    queryFn: () =>
      qa.getTasksAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useProjects(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["projects", workspaceId, personaId],
    queryFn: () =>
      qa.getProjectsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useContent(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["content", workspaceId, personaId],
    queryFn: () =>
      qa.getContentAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useLeads(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["leads", workspaceId, personaId],
    queryFn: () =>
      qa.getLeadsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useLaunchCampaigns(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["launchCampaigns", workspaceId, personaId],
    queryFn: () =>
      qa.getLaunchCampaignsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useFinance(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["finance", workspaceId, personaId],
    queryFn: () =>
      qa.getFinanceAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function usePayroll(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["payroll", workspaceId],
    queryFn: () => qa.getPayrollListAction(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useBills(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["bills", workspaceId, personaId],
    queryFn: () =>
      qa.getBillsListAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function usePersonas(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["personas", workspaceId],
    queryFn: () => qa.getPersonasListAction(workspaceId ?? undefined),
    enabled: !!workspaceId,
  });
}

export function usePersona(id?: string | null) {
  return useQuery({
    queryKey: ["persona", id],
    queryFn: () => qa.getPersonaByIdAction(id!),
    enabled: !!id,
  });
}

export function useDocuments(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["documents", workspaceId, personaId],
    queryFn: () =>
      qa.getDocumentsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useDocument(id?: string | null) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => qa.getDocumentByIdAction(id!),
    enabled: !!id,
  });
}

export function useMaterials(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["materials", workspaceId, personaId],
    queryFn: () =>
      qa.getMaterialsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useTools(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["tools", workspaceId],
    queryFn: () => qa.getToolsAction(workspaceId ?? undefined),
    enabled: !!workspaceId,
  });
}

export function useFlows(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["flows", workspaceId],
    queryFn: () => qa.getFlowsAction(workspaceId ?? undefined),
    enabled: !!workspaceId,
  });
}

export function useFlow(id?: string | null) {
  return useQuery({
    queryKey: ["flow", id],
    queryFn: () => qa.getFlowByIdAction(id!),
    enabled: !!id,
  });
}

export function useFunnel(personaId?: string | null, funnelId?: string | null) {
  return useQuery({
    queryKey: ["funnel", personaId, funnelId ?? null],
    queryFn: () => qa.getFunnelByPersonaIdAction(personaId!, funnelId ?? undefined),
    enabled: !!personaId,
  });
}

export function useFunnels(personaId?: string | null) {
  return useQuery({
    queryKey: ["funnels", personaId],
    queryFn: () => qa.getFunnelsListAction(personaId!),
    enabled: !!personaId,
  });
}

export function useIcpPains(personaId?: string | null) {
  return useQuery({
    queryKey: ["icpPains", personaId],
    queryFn: () => qa.getIcpPainsAction(personaId!),
    enabled: !!personaId,
  });
}

export function usePrompts(personaId?: string | null) {
  return useQuery({
    queryKey: ["prompts", personaId],
    queryFn: () => qa.getPromptsAction(personaId!),
    enabled: !!personaId,
  });
}

export function useModeling(personaId?: string | null) {
  return useQuery({
    queryKey: ["modeling", personaId],
    queryFn: () => qa.getModelingAction(personaId!),
    enabled: !!personaId,
  });
}

export function useTeam(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["team", workspaceId],
    queryFn: () => qa.getTeamAction(workspaceId ?? undefined),
    enabled: !!workspaceId,
  });
}

export function useFollowerSnapshots(personaId?: string | null) {
  return useQuery({
    queryKey: ["followerSnapshots", personaId],
    queryFn: () => qa.getFollowerSnapshotsAction(personaId!),
    enabled: !!personaId,
  });
}

export function useCreateFollowerSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId: string;
      channel: string;
      followers: number;
      snapshotDate?: string;
    }) => callMutate("createFollowerSnapshot", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followerSnapshots"] });
    },
  });
}

export function useContentHooks(
  workspaceId?: string | null,
  personaId?: string | null,
) {
  return useQuery({
    queryKey: ["contentHooks", workspaceId, personaId],
    queryFn: () =>
      qa.getContentHooksAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useCreateHookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId?: string | null;
      text: string;
      category?: string;
      tag?: string | null;
      notes?: string | null;
    }) => callMutate("createHook", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentHooks"] });
    },
  });
}

export function useUpdateHookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateHook", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentHooks"] });
    },
  });
}

export function useDeleteHookMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteHook", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contentHooks"] });
    },
  });
}

export function useNotifications(userId?: string | null) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => qa.getNotificationsAction(userId!),
    enabled: !!userId,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("markNotificationRead", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callMutate("markAllNotificationsRead", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useArchiveNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("archiveNotification", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteNotification", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearReadNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callMutate("clearReadNotifications", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useClearAllNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => callMutate("clearAllNotifications", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useActivityLogs(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["activityLogs", workspaceId],
    queryFn: () => qa.getActivityLogsAction(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useAiActions(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["aiActions", workspaceId, personaId],
    queryFn: () => qa.getAiActionsAction(workspaceId!, personaId ?? undefined),
    enabled: !!workspaceId,
  });
}

export function useCalendarEvents(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["calendarEvents", workspaceId, personaId],
    queryFn: () =>
      qa.getCalendarEventsAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useTaskComments(taskId?: string | null) {
  return useQuery({
    queryKey: ["taskComments", taskId],
    queryFn: () => qa.getTaskCommentsAction(taskId!),
    enabled: !!taskId,
  });
}

export function useTaskSubtasks(taskId?: string | null) {
  return useQuery({
    queryKey: ["taskSubtasks", taskId],
    queryFn: () => qa.getTaskSubtasksAction(taskId!),
    enabled: !!taskId,
  });
}

// Mutation Hooks -----------------------------------------------------------

export function useUpdateTaskStatusAndPositionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, position }: { id: string; status: any; position?: number }) =>
      callMutate("updateTaskStatusAndPosition", { id, status, position }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createTask", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useAddTaskDependencyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { taskId: string; dependsOnTaskId: string }) =>
      callMutate("addTaskDependency", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useRemoveTaskDependencyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { taskId: string; dependsOnTaskId: string }) =>
      callMutate("removeTaskDependency", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateTask", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createDocument", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUpdateDocumentContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content, title }: { id: string; content: string; title?: string }) =>
      callMutate("updateDocumentContent", { id, content, title }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
    },
  });
}

export function useCreateMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createMaterial", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useSaveFunnelDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      funnelId,
      nodes,
      edges,
      conversionRate,
    }: {
      funnelId: string;
      nodes: any[];
      edges: any[];
      conversionRate?: number;
    }) => callMutate("saveFunnelData", { id: funnelId, nodes, edges, conversionRate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnel"] });
    },
  });
}

export function useSaveFlowDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ flowId, nodes, edges }: { flowId: string; nodes: any[]; edges: any[] }) =>
      callMutate("saveFlowData", { id: flowId, nodes, edges }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      queryClient.invalidateQueries({ queryKey: ["flow", variables.flowId] });
    },
  });
}

export function useCreateToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createTool", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}

export function useUpdateToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateTool", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}

export function useToggleToolFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (toolId: string) => callMutate("toggleToolFavorite", { toolId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createProject", input),
    onSuccess: (result: any, input: any) => {
      const created = result?.data;
      if (created?.id) {
        const project = {
          id: created.id,
          workspaceId: created.workspace_id ?? created.workspaceId ?? input.workspaceId,
          personaId: created.persona_id ?? created.personaId ?? input.personaId,
          name: created.name ?? input.name,
          description: created.description ?? input.description,
          color: created.color ?? input.color ?? "#3b82f6",
          icon: created.icon ?? input.icon ?? "Folder",
          status: created.status ?? input.status ?? "active",
          createdAt: created.created_at ?? created.createdAt ?? new Date().toISOString(),
          updatedAt: created.updated_at ?? created.updatedAt ?? new Date().toISOString(),
          progress: 0,
          members: [],
          taskCount: { total: 0, done: 0 },
        };
        queryClient.setQueriesData({ queryKey: ["projects"] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          if (old.some((item: any) => item.id === project.id)) return old;
          return [project, ...old];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createLead", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateLead", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useArchiveLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("archiveLead", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateLeadCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { leadId: string; workspaceId: string; content: string }) =>
      callMutate("createLeadComment", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useCreateFinancialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createFinancial", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useUpdateFinancialStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      callMutate("updateFinancialStatus", { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useUpdateFinancialReceiptMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, receiptUrl }: { id: string; receiptUrl: string }) =>
      callMutate("updateFinancialReceipt", { id, receiptUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useCreateBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createBill", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useUpdateBillStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      callMutate("updateBillStatus", { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useDeleteBillMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => callMutate("deleteBill", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

export function useCreatePayrollMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createPayrollMember", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
}

export function useUpdatePayrollMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("updatePayrollMember", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
}

export function useDeletePayrollMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => callMutate("deletePayrollMember", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
    },
  });
}

export function usePayPayrollMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => callMutate("payPayrollMember", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useUpsertPersonaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("upsertPersona", input),
    onSuccess: (_, input: any) => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      if (input?.id) {
        queryClient.invalidateQueries({ queryKey: ["persona", input.id] });
      }
    },
  });
}

export function useUpsertPersonaChannelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id?: string;
      workspaceId: string;
      personaId: string;
      channel: string;
      handle?: string;
      url?: string;
      followers?: number;
    }) => callMutate("upsertPersonaChannel", input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["persona", input.personaId] });
    },
  });
}

export function useDeletePersonaChannelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; personaId: string }) =>
      callMutate("deletePersonaChannel", { id: input.id }),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
      queryClient.invalidateQueries({ queryKey: ["persona", input.personaId] });
    },
  });
}

export function useCreateFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createFlow", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
  });
}

export function useCreateContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createContent", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useUpdateContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateContent", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useDeleteContentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteContent", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content"] });
    },
  });
}

export function useUpdateUserMetadataMutation() {
  return useMutation({
    mutationFn: (metadata: any) => callMutate("updateUserMetadata", metadata),
  });
}

export function useUpdateProfileMutation() {
  return useMutation({
    mutationFn: (input: {
      fullName?: string;
      jobTitle?: string | null;
      timezone?: string | null;
      avatarUrl?: string | null;
    }) => callMutate("updateProfile", input),
  });
}

export function useSanitizeDatabaseEncodingMutation() {
  return useMutation({
    mutationFn: () => callMutate("sanitizeDatabaseEncoding"),
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteTask", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      // Subtarefas são tasks; atualiza a lista de subtarefas aberta no drawer.
      queryClient.invalidateQueries({ queryKey: ["taskSubtasks"] });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateProject", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteProject", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteLead", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteFinancialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteFinancial", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useDeletePersonaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersona", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
    },
  });
}

export function useCreateFunnelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; personaId: string; name: string; description?: string }) =>
      callMutate("createFunnel", input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["funnel", variables.personaId] });
      queryClient.invalidateQueries({ queryKey: ["funnels", variables.personaId] });
    },
  });
}

export function useDeleteFunnelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, personaId }: { id: string; personaId: string }) =>
      callMutate("deleteFunnel", { id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["funnel", variables.personaId] });
      queryClient.invalidateQueries({ queryKey: ["funnels", variables.personaId] });
    },
  });
}

export function useUpdatePromptChainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updatePromptChain", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useCreatePromptIterationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { promptChainId: string; version: number; body: string }) =>
      callMutate("createPromptIteration", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useDeletePromptChainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePromptChain", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useDeleteModelingProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteModelingProfile", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeling"] });
    },
  });
}

export function useUpdateModelingProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateModelingProfile", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeling"] });
    },
  });
}

export function useModelingContentExamples(profileId?: string | null) {
  return useQuery({
    queryKey: ["modelingExamples", profileId],
    queryFn: () => qa.getModelingContentExamplesAction(profileId!),
    enabled: !!profileId,
  });
}

export function useUpsertModelingContentExampleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id?: string;
      profileId: string;
      title: string;
      url: string;
      channel?: string;
      analysis?: string;
      metrics?: Record<string, any>;
    }) => callMutate("upsertModelingContentExample", input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: ["modelingExamples", input.profileId],
      });
    },
  });
}

export function useDeleteModelingContentExampleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; profileId: string }) =>
      callMutate("deleteModelingContentExample", { id: input.id }),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: ["modelingExamples", input.profileId],
      });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteDocument", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteFlow", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
  });
}

export function useUpdateFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      callMutate("updateFlow", { id, input }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      queryClient.invalidateQueries({ queryKey: ["flow", vars.id] });
    },
  });
}

export function useDeleteToolMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteTool", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tools"] });
    },
  });
}

export function useDeleteMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteMaterial", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUpdateMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateMaterial", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useCreateLaunchCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createLaunchCampaign", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useUpdateLaunchCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateLaunchCampaign", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useArchiveLaunchCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("archiveLaunchCampaign", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useDeleteLaunchCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteLaunchCampaign", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useCreateLaunchEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createLaunchEvent", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useUpdateLaunchEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateLaunchEvent", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useDeleteLaunchEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteLaunchEvent", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useCreateIcpPainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createIcpPain", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icpPains"] });
    },
  });
}

export function useUpdateIcpPainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateIcpPain", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icpPains"] });
    },
  });
}

export function useDeleteIcpPainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteIcpPain", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["icpPains"] });
    },
  });
}

export function useCreateSalesCopyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createSalesCopy", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useUpdateSalesCopyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateSalesCopy", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useDeleteSalesCopyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteSalesCopy", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["launchCampaigns"] });
    },
  });
}

export function useDeleteCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteCalendarEvent", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
}

export function useCreateTaskCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { taskId: string; body: string }) => callMutate("createTaskComment", input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", variables.taskId] });
    },
  });
}

export function useDeleteTaskCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; taskId: string }) =>
      callMutate("deleteTaskComment", { id: input.id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taskComments", variables.taskId] });
    },
  });
}

export function useCreateSubtaskMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { parentTaskId: string; title: string; workspaceId: string; personaId?: string }) =>
      callMutate("createSubtask", input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["taskSubtasks", variables.parentTaskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useCreateCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId?: string;
      title: string;
      description?: string;
      startAt: string;
      endAt?: string;
      allDay?: boolean;
      color?: string;
      category?: string;
    }) => callMutate("createCalendarEvent", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
}

export function useUpdateCalendarEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      title?: string;
      description?: string;
      startAt?: string;
      endAt?: string;
      allDay?: boolean;
      color?: string;
      category?: string;
    }) => callMutate("updateCalendarEvent", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
    },
  });
}

export function useCreatePromptChainMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId?: string | null;
      name: string;
      description?: string;
      status?: "building" | "robust" | "deprecated";
      basePrompt?: string;
      tags?: string[];
    }) => callMutate("createPromptChain", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prompts"] });
    },
  });
}

export function useCreateModelingProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId?: string | null;
      name: string;
      socialNetwork?: string;
      country?: string;
      link?: string;
      niche?: string;
      category?: string;
      notes?: string;
      tags?: string[];
    }) => callMutate("createModelingProfile", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modeling"] });
    },
  });
}

export function useCreateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      personaId?: string | null;
      name: string;
      parentId?: string;
      color?: string;
      driveUrl?: string;
      driveProvider?: string;
    }) => callMutate("createFolder", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useUpdateFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateFolder", { id, input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
}

export function useDeleteFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deleteFolder", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
  });
}

export function useFolders(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["folders", workspaceId, personaId],
    queryFn: () =>
      qa.getFoldersAction({
        workspaceId: workspaceId ?? undefined,
        personaId: personaId ?? undefined,
      }),
    enabled: !!workspaceId,
  });
}

export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      userId: string;
      role: "owner" | "admin" | "editor" | "viewer" | "financeiro";
    }) => callMutate("updateMember", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; userId: string }) =>
      callMutate("removeMember", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useTransferOwnershipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { workspaceId: string; newOwnerId: string }) =>
      callMutate("transferOwnership", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      email: string;
      role?: "owner" | "admin" | "editor" | "viewer" | "financeiro";
      message?: string;
    }) => callMutate("inviteMember", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useInvitations(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["invitations", workspaceId],
    queryFn: () => qa.getInvitationsAction(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useResendInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { invitationId: string }) =>
      callMutate("resendInvitation", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useCancelInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { invitationId: string }) =>
      callMutate("cancelInvitation", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
}

export function useUpdateMemberPermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      workspaceId: string;
      userId: string;
      permissions: Record<string, string[]>;
    }) => callMutate("updateMemberPermissions", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useUpdateDocumentMetaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: any }) =>
      callMutate("updateDocumentMeta", { id, input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
    },
  });
}

export function useToggleDocumentStarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("toggleDocumentStar", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useArchiveDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("archiveDocument", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useUnarchiveDocumentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("unarchiveDocument", { id }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", id] });
    },
  });
}

export function useMoveDocumentToFolderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, folderId }: { ids: string | string[]; folderId: string | null }) =>
      callMutate("moveDocumentToFolder", { ids, folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useBulkArchiveDocumentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, archive }: { ids: string[]; archive: boolean }) =>
      callMutate("bulkArchiveDocuments", { ids, archive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useBulkTagDocumentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, tags }: { ids: string[]; tags: string[] }) =>
      callMutate("bulkTagDocuments", { ids, tags }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

// ── STUDY MODULE QUERY HOOKS ──────────────────────────────────────────────────

export function useStudyTracks(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyTracks", workspaceId, personaId],
    queryFn: () => qa.getStudyTracksAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyResources(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyResources", workspaceId, personaId],
    queryFn: () => qa.getStudyResourcesAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyObjectives(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyObjectives", workspaceId, personaId],
    queryFn: () => qa.getStudyObjectivesAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyGoals(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyGoals", workspaceId, personaId],
    queryFn: () => qa.getStudyGoalsAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useFocusSessions(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["focusSessions", workspaceId, personaId],
    queryFn: () => qa.getFocusSessionsAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyReviews(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyReviews", workspaceId, personaId],
    queryFn: () => qa.getStudyReviewsAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyPlans(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyPlans", workspaceId, personaId],
    queryFn: () => qa.getStudyPlansAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyAchievements(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyAchievements", workspaceId, personaId],
    queryFn: () => qa.getStudyAchievementsAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useStudyDashboard(workspaceId?: string | null, personaId?: string | null) {
  return useQuery({
    queryKey: ["studyDashboard", workspaceId, personaId],
    queryFn: () => qa.getStudyDashboardAction({ workspaceId: workspaceId ?? undefined, personaId: personaId ?? undefined }),
    enabled: !!workspaceId,
  });
}

// ── STUDY MODULE MUTATION HOOKS ────────────────────────────────────────────────

export function useStartFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("startFocusSession", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focusSessions"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useTickFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("tickFocusSession", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focusSessions"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useEndFocusSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("endFocusSession", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focusSessions"] });
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useLogManualSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("logManualSession", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focusSessions"] });
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUpsertStudyTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertStudyTrack", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useDeleteStudyTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteStudyTrack", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUpsertStudyModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertStudyModule", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useDeleteStudyModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteStudyModule", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useUpsertModuleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertModuleItem", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useDeleteModuleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteModuleItem", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useReorderModuleItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("reorderModuleItems", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useSetItemStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("setItemStatus", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUpsertStudyResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertStudyResource", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyResources"] });
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useDeleteStudyResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteStudyResource", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyResources"] });
      qc.invalidateQueries({ queryKey: ["studyTracks"] });
    },
  });
}

export function useSetResourceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("setResourceStatus", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyResources"] });
    },
  });
}

export function useSetResourceProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("setResourceProgress", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyResources"] });
    },
  });
}

export function useUpsertObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertObjective", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyObjectives"] });
    },
  });
}

export function useDeleteObjective() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteObjective", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyObjectives"] });
    },
  });
}

export function useUpsertGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertGoal", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyGoals"] });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteGoal", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyGoals"] });
    },
  });
}

export function useUpsertReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertReview", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyReviews"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useReviewCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("reviewCard", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyReviews"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deleteReview", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyReviews"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUpsertPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPlan", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyPlans"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("deletePlan", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyPlans"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUnlockAchievement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("unlockAchievement", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyAchievements"] });
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

export function useUpdateStudySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("updateStudySettings", p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["studyDashboard"] });
    },
  });
}

// ── GESTÃO DE ENERGIA ──────────────────────────────────────────────────────────

export function useEnergy(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["energy", workspaceId],
    queryFn: () => qa.getEnergyAction({ workspaceId: workspaceId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useUpsertEnergyDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertEnergyDailyLog", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["energy"] }),
  });
}

export function useLogPornEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("logPornEvent", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["energy"] }),
  });
}

export function useDeletePornEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePornEvent", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["energy"] }),
  });
}

export function useUpdateEnergySettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("updateEnergySettings", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["energy"] }),
  });
}

// ── FINANCEIRO PESSOAL ──────────────────────────────────────────────────────────

export function usePersonalFinance(workspaceId?: string | null) {
  return useQuery({
    queryKey: ["personalFinance", workspaceId],
    queryFn: () => qa.getPersonalFinanceAction({ workspaceId: workspaceId ?? undefined }),
    enabled: !!workspaceId,
  });
}

export function useUpsertPersonalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalAccount", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalAccount", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalCategory", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalCategory", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalTransaction", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalTransaction", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalBill", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useSetPersonalBillStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; status: "pending" | "paid" }) =>
      callMutate("setPersonalBillStatus", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalBill", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalGoal", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalGoal", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalFinanceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalFinanceProfile", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useUpsertPersonalIncomeSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: any) => callMutate("upsertPersonalIncomeSource", p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

export function useDeletePersonalIncomeSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callMutate("deletePersonalIncomeSource", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personalFinance"] }),
  });
}

