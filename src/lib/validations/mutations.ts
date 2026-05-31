import { z } from "zod";

const id = z.string().min(1, "id e obrigatorio");
const optionalId = z.string().min(1).optional().nullable();
const isoish = z.string().min(1).optional().nullable();

const taskStatus = z.enum(["backlog", "todo", "doing", "review", "done"]);
const taskPriority = z.enum(["low", "medium", "high", "urgent"]);
const leadStatus = z.enum([
  "open",
  "approached",
  "qualified",
  "converted",
  "lost",
  "no_response",
]);

const contentChannel = z.enum([
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "email",
  "telegram",
]);

const contentType = z.enum([
  "reel",
  "feed",
  "carousel",
  "story",
  "short",
  "video",
  "post",
  "email",
  "live",
  "ad",
]);

const createTask = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    projectId: optionalId,
    title: z.string().min(2, "Titulo da tarefa e obrigatorio"),
    description: z.string().optional().nullable(),
    status: taskStatus.optional(),
    priority: taskPriority.optional(),
    assigneeId: optionalId,
    dueAt: isoish,
    labels: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

const updateTask = z
  .object({
    id,
    input: createTask.partial().extend({
      title: z.string().min(2).optional(),
    }),
  })
  .passthrough();

const createContent = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    title: z.string().min(2, "Titulo do conteudo e obrigatorio"),
    channel: contentChannel.optional(),
    contentType: contentType.optional(),
    status: z.string().optional(),
    hook: z.string().optional().nullable(),
    script: z.string().optional().nullable(),
    caption: z.string().optional().nullable(),
    pillar: z.string().optional().nullable(),
    scheduledAt: isoish,
  })
  .passthrough();

const createLead = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
    status: leadStatus.optional(),
    score: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
    campaign: z.string().optional().nullable(),
  })
  .passthrough();

const launchCampaignStatus = z.enum(["planning", "active", "completed", "archived"]);

const updateLead = z
  .object({
    id,
    input: createLead.partial().extend({
      status: leadStatus.optional(),
    }),
  })
  .passthrough();

const createFinancial = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    type: z.enum(["revenue", "expense"]).optional(),
    amount: z.coerce.number().nonnegative(),
    description: z.string().min(1, "Descricao e obrigatoria"),
    category: z.string().optional().nullable(),
    status: z.enum(["pending", "paid", "overdue", "canceled"]).optional(),
    source: z.string().optional(),
    occurredAt: isoish,
  })
  .passthrough();

const createDocument = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    title: z.string().min(2, "Titulo do documento e obrigatorio"),
    content: z.any().optional(),
  })
  .passthrough();

const createMaterial = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    title: z.string().optional(),
    name: z.string().optional(),
    fileUrl: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
  })
  .passthrough()
  .refine((value) => value.title || value.name, {
    message: "Titulo ou nome do material e obrigatorio",
  });

const createFlow = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome do fluxo e obrigatorio"),
  })
  .passthrough();

const createTool = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome da ferramenta e obrigatorio"),
    url: z.string().min(1).optional(),
  })
  .passthrough();

const createProject = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome do projeto e obrigatorio"),
  })
  .passthrough();

const upsertPersona = z
  .object({
    id: optionalId,
    workspaceId: id,
    name: z.string().min(2, "Nome da persona e obrigatorio"),
    status: z.enum(["active", "building", "paused", "archived"]).optional(),
  })
  .passthrough();

const createPromptChain = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome da cadeia e obrigatorio"),
    description: z.string().optional().nullable(),
    status: z.enum(["building", "robust", "deprecated"]).optional(),
    basePrompt: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

const createModelingProfile = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome do perfil e obrigatorio"),
    socialNetwork: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    link: z.string().url("Link invalido").optional().nullable().or(z.literal("")),
    niche: z.string().optional().nullable(),
    category: z
      .enum([
        "emerging",
        "hidden_gem",
        "big_creator",
        "authority",
        "competitor",
        "international",
      ])
      .optional(),
    notes: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable(),
  })
  .passthrough();

const createFolder = z
  .object({
    workspaceId: id,
    personaId: optionalId,
    name: z.string().min(2, "Nome da pasta e obrigatorio"),
    parentId: optionalId,
    color: z.string().optional().nullable(),
    driveUrl: z.string().url().optional().nullable().or(z.literal("")),
    driveProvider: z.string().optional().nullable(),
  })
  .passthrough();

const inviteMember = z
  .object({
    workspaceId: id,
    email: z.string().email("Email invalido"),
    role: z.enum(["owner", "admin", "editor", "viewer", "financeiro"]).default("editor"),
    message: z.string().optional().nullable(),
  })
  .passthrough();

const simpleDelete = z.object({ id }).passthrough();

export const mutationPayloadSchemas: Record<string, z.ZodTypeAny> = {
  createTask,
  updateTask,
  updateTaskStatusAndPosition: z
    .object({ id, status: taskStatus, position: z.number().optional() })
    .passthrough(),
  createContent,
  updateContent: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteContent: simpleDelete,
  createLead,
  updateLead,
  archiveLead: simpleDelete,
  createLeadComment: z
    .object({
      leadId: id,
      workspaceId: id,
      content: z.string().min(1, "Comentario vazio"),
    })
    .passthrough(),
  createFinancial,
  upsertPersona,
  createDocument,
  updateDocumentContent: z
    .object({ id, content: z.any(), title: z.string().optional() })
    .passthrough(),
  updateDocumentMeta: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  toggleDocumentStar: simpleDelete,
  archiveDocument: simpleDelete,
  unarchiveDocument: simpleDelete,
  moveDocumentToFolder: z
    .object({
      ids: z.union([z.string().uuid(), z.array(z.string().uuid())]),
      folderId: z.string().uuid().nullable().optional(),
    })
    .passthrough(),
  bulkArchiveDocuments: z
    .object({
      ids: z.array(z.string().uuid()),
      archive: z.boolean(),
    })
    .passthrough(),
  bulkTagDocuments: z
    .object({
      ids: z.array(z.string().uuid()),
      tags: z.array(z.string()),
    })
    .passthrough(),
  createMaterial,
  createFlow,
  updateFlow: z.object({ id, input: z.object({ name: z.string().min(2).optional(), description: z.string().optional().nullable(), type: z.string().optional(), color: z.string().optional() }).passthrough() }).passthrough(),
  saveFlowData: z.object({ id, nodes: z.array(z.any()), edges: z.array(z.any()) }),
  saveFunnelData: z
    .object({
      id,
      nodes: z.array(z.any()),
      edges: z.array(z.any()),
      conversionRate: z.number().optional(),
    })
    .passthrough(),
  createTool,
  updateTool: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  toggleToolFavorite: z.object({ toolId: id }).passthrough(),
  createProject,
  updateUserMetadata: z.record(z.any()),
  updateProfile: z
    .object({
      fullName: z.string().min(1).optional(),
      jobTitle: z.string().optional().nullable(),
      timezone: z.string().optional().nullable(),
      avatarUrl: z.string().optional().nullable(),
    })
    .passthrough(),
  deleteTask: simpleDelete,
  deleteProject: simpleDelete,
  deleteLead: simpleDelete,
  deleteFinancial: simpleDelete,
  deletePersona: simpleDelete,
  deleteDocument: simpleDelete,
  deleteFlow: simpleDelete,
  deleteTool: simpleDelete,
  deleteMaterial: simpleDelete,
  updateMaterial: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  createLaunchCampaign: z
    .object({
      workspaceId: id,
      personaId: optionalId,
      name: z.string().min(2, "Nome da campanha e obrigatorio"),
      description: z.string().optional().nullable(),
      startsAt: isoish,
      endsAt: isoish,
      status: launchCampaignStatus.optional(),
      goal: z.string().optional().nullable(),
      metadata: z.record(z.any()).optional().nullable(),
    })
    .passthrough(),
  updateLaunchCampaign: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  archiveLaunchCampaign: simpleDelete,
  deleteLaunchCampaign: simpleDelete,
  createLaunchEvent: z
    .object({
      campaignId: id,
      title: z.string().min(2, "Titulo do evento e obrigatorio"),
      description: z.string().optional().nullable(),
      startAt: z.string().min(1, "Data inicial obrigatoria"),
      endAt: isoish,
      type: z.string().optional().nullable(),
      metadata: z.record(z.any()).optional().nullable(),
    })
    .passthrough(),
  updateLaunchEvent: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteLaunchEvent: simpleDelete,
  createIcpPain: z
    .object({
      workspaceId: id,
      personaId: optionalId,
      category: z.string().min(1, "Categoria obrigatoria"),
      body: z.string().min(3, "Dor obrigatoria"),
      intensity: z.string().optional().nullable(),
      tags: z.array(z.string()).optional().nullable(),
    })
    .passthrough(),
  updateIcpPain: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteIcpPain: simpleDelete,
  createSalesCopy: z
    .object({
      workspaceId: id,
      personaId: optionalId,
      campaignId: optionalId,
      type: z.string().min(1, "Tipo obrigatorio"),
      title: z.string().min(2, "Titulo obrigatorio"),
      body: z.string().min(3, "Copy obrigatoria"),
      status: z.string().optional(),
      metadata: z.record(z.any()).optional().nullable(),
    })
    .passthrough(),
  updateSalesCopy: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteSalesCopy: simpleDelete,
  deleteCalendarEvent: simpleDelete,
  createTaskComment: z.object({ taskId: id, body: z.string().min(1, "Comentario vazio") }).passthrough(),
  createSubtask: z
    .object({
      parentTaskId: id,
      title: z.string().min(2, "Titulo da subtarefa e obrigatorio"),
      workspaceId: id,
      personaId: optionalId,
    })
    .passthrough(),
  createCalendarEvent: z
    .object({
      workspaceId: id,
      personaId: optionalId,
      title: z.string().min(2, "Titulo do evento e obrigatorio"),
      startAt: z.string().min(1, "Data inicial e obrigatoria"),
    })
    .passthrough(),
  updateCalendarEvent: z.object({ id }).passthrough(),
  createPromptChain,
  createModelingProfile,
  createFolder,
  updateFolder: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteFolder: simpleDelete,
  inviteMember,
  createFollowerSnapshot: z
    .object({
      workspaceId: id,
      personaId: id,
      channel: z.string().min(1),
      followers: z.coerce.number().min(0),
      snapshotDate: z.string().optional(),
    })
    .passthrough(),
  createHook: z
    .object({
      workspaceId: id,
      personaId: optionalId,
      text: z.string().min(3, "Hook precisa de pelo menos 3 caracteres"),
      category: z.string().optional(),
      tag: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    })
    .passthrough(),
  updateHook: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  deleteHook: simpleDelete,
  markNotificationRead: simpleDelete,
  markAllNotificationsRead: z.object({}).passthrough(),
  archiveNotification: simpleDelete,
  deleteNotification: simpleDelete,
  clearReadNotifications: z.object({}).passthrough(),
  clearAllNotifications: z.object({}).passthrough(),
  updateMember: z
    .object({
      workspaceId: id,
      userId: id,
      role: z.enum(["owner", "admin", "editor", "viewer", "financeiro"]),
    })
    .passthrough(),
  removeMember: z
    .object({ workspaceId: id, userId: id })
    .passthrough(),
  transferOwnership: z
    .object({ workspaceId: id, newOwnerId: id })
    .passthrough(),
  resendInvitation: z.object({ invitationId: id }).passthrough(),
  cancelInvitation: z.object({ invitationId: id }).passthrough(),
  updateMemberPermissions: z
    .object({
      workspaceId: id,
      userId: id,
      permissions: z.record(z.array(z.string())),
    })
    .passthrough(),
  upsertPersonaChannel: z
    .object({
      id: optionalId,
      workspaceId: id,
      personaId: id,
      channel: z.string().min(1, "Canal e obrigatorio"),
      handle: z.string().optional().nullable(),
      url: z.string().optional().nullable(),
      followers: z.coerce.number().nonnegative().optional(),
    })
    .passthrough(),
  deletePersonaChannel: simpleDelete,
  createFunnel: z
    .object({
      workspaceId: id,
      personaId: id,
      name: z.string().min(2, "Nome do funil e obrigatorio"),
      description: z.string().optional().nullable(),
    })
    .passthrough(),
  deleteFunnel: simpleDelete,
  updatePromptChain: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  createPromptIteration: z
    .object({
      promptChainId: id,
      version: z.coerce.number().int(),
      body: z.string().min(1, "O prompt nao pode ser vazio"),
    })
    .passthrough(),
  deletePromptChain: simpleDelete,
  deleteModelingProfile: simpleDelete,
  updateModelingProfile: z
    .object({ id, input: z.object({}).passthrough() })
    .passthrough(),
  upsertModelingContentExample: z
    .object({
      id: optionalId,
      profileId: id,
      title: z.string().min(1, "Titulo e obrigatorio"),
      url: z.string().min(1, "URL e obrigatoria"),
      channel: z.string().optional().nullable(),
      analysis: z.string().optional().nullable(),
      metrics: z.record(z.any()).optional().nullable(),
    })
    .passthrough(),
  deleteModelingContentExample: simpleDelete,
};

export function parseMutationPayload(action: string, payload: unknown) {
  const schema = mutationPayloadSchemas[action];
  if (!schema) return payload;

  const parsed = schema.safeParse(payload ?? {});
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Payload invalido";
    throw new Error(message);
  }

  return parsed.data;
}
