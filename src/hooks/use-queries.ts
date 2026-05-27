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
    onSuccess: () => {
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


