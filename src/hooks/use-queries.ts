"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as qa from "@/server/actions/queries-actions";
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

export function useFunnel(personaId?: string | null) {
  return useQuery({
    queryKey: ["funnel", personaId],
    queryFn: () => qa.getFunnelByPersonaIdAction(personaId!),
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

export function useNotifications(userId?: string | null) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => qa.getNotificationsAction(userId!),
    enabled: !!userId,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["funnel", variables.funnelId] });
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

export function useCreateFinancialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("createFinancial", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
    },
  });
}

export function useUpsertPersonaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: any) => callMutate("upsertPersona", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personas"] });
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

