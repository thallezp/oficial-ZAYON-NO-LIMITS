/**
 * Tipos derivados do schema Drizzle.
 *
 * Use estes tipos no server (queries/mutations) e em handlers de API. No
 * lado do cliente, prefira os tipos de domínio em `@/types` que são uma
 * versão "achatada" com relações já resolvidas.
 */

import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import * as s from "./schema";

// Core
export type UserRow = InferSelectModel<typeof s.users>;
export type WorkspaceRow = InferSelectModel<typeof s.workspaces>;
export type WorkspaceMemberRow = InferSelectModel<typeof s.workspaceMembers>;
export type InvitationRow = InferSelectModel<typeof s.invitations>;
export type ActivityLogRow = InferSelectModel<typeof s.activityLogs>;
export type NotificationRow = InferSelectModel<typeof s.notifications>;

// Personas
export type PersonaRow = InferSelectModel<typeof s.personas>;
export type PersonaChannelRow = InferSelectModel<typeof s.personaChannels>;
export type PersonaMetricsSnapshotRow = InferSelectModel<typeof s.personaMetricsSnapshots>;
export type ContentPillarRow = InferSelectModel<typeof s.contentPillars>;

// Workspace operacional
export type ProjectRow = InferSelectModel<typeof s.projects>;
export type TaskRow = InferSelectModel<typeof s.tasks>;
export type TaskCommentRow = InferSelectModel<typeof s.taskComments>;
export type CalendarEventRow = InferSelectModel<typeof s.calendarEvents>;
export type DocumentRow = InferSelectModel<typeof s.documents>;
export type MaterialRow = InferSelectModel<typeof s.materials>;
export type FolderRow = InferSelectModel<typeof s.folders>;

// Content
export type ContentItemRow = InferSelectModel<typeof s.contentItems>;
export type ContentMetricsRow = InferSelectModel<typeof s.contentMetrics>;
export type ContentReferenceRow = InferSelectModel<typeof s.contentReferences>;
export type ModelingProfileRow = InferSelectModel<typeof s.modelingProfiles>;
export type PromptChainRow = InferSelectModel<typeof s.promptChains>;
export type PromptIterationRow = InferSelectModel<typeof s.promptIterations>;

// Funnels & Flows
export type FlowRow = InferSelectModel<typeof s.flows>;
export type FlowNodeRow = InferSelectModel<typeof s.flowNodes>;
export type FlowEdgeRow = InferSelectModel<typeof s.flowEdges>;
export type SalesFunnelRow = InferSelectModel<typeof s.salesFunnels>;
export type FunnelNodeRow = InferSelectModel<typeof s.funnelNodes>;
export type FunnelEdgeRow = InferSelectModel<typeof s.funnelEdges>;

// Finance
export type FinancialCategoryRow = InferSelectModel<typeof s.financialCategories>;
export type FinancialTransactionRow = InferSelectModel<typeof s.financialTransactions>;
export type PayrollMemberRow = InferSelectModel<typeof s.payrollMembers>;
export type BillRow = InferSelectModel<typeof s.bills>;

// Leads
export type LeadRow = InferSelectModel<typeof s.leads>;
export type LeadAnswerRow = InferSelectModel<typeof s.leadAnswers>;
export type LeadStatusHistoryRow = InferSelectModel<typeof s.leadStatusHistory>;
export type LeadSourceRow = InferSelectModel<typeof s.leadSources>;
export type GoogleSheetsConnectionRow = InferSelectModel<typeof s.googleSheetsConnections>;

// Tools
export type ToolRow = InferSelectModel<typeof s.tools>;
export type ToolCategoryRow = InferSelectModel<typeof s.toolCategories>;
export type ToolFavoriteRow = InferSelectModel<typeof s.toolFavorites>;
export type ToolRecentRow = InferSelectModel<typeof s.toolRecents>;

// Launch
export type LaunchCampaignRow = InferSelectModel<typeof s.launchCampaigns>;
export type LaunchEventRow = InferSelectModel<typeof s.launchEvents>;
export type IcpPainRow = InferSelectModel<typeof s.icpPains>;
export type SalesCopyRow = InferSelectModel<typeof s.salesCopies>;

// AI
export type AIThreadRow = InferSelectModel<typeof s.aiThreads>;
export type AIMessageRow = InferSelectModel<typeof s.aiMessages>;
export type AIActionRow = InferSelectModel<typeof s.aiActions>;
export type AIToolCallRow = InferSelectModel<typeof s.aiToolCalls>;

// New Tables
export type RoleRow = InferSelectModel<typeof s.roles>;
export type PermissionRow = InferSelectModel<typeof s.permissions>;
export type CommentRow = InferSelectModel<typeof s.comments>;
export type MentionRow = InferSelectModel<typeof s.mentions>;
export type PresenceSessionRow = InferSelectModel<typeof s.presenceSessions>;
export type TaskLabelRow = InferSelectModel<typeof s.taskLabels>;
export type DocumentBlockRow = InferSelectModel<typeof s.documentBlocks>;
export type ToolTagRow = InferSelectModel<typeof s.toolTags>;
export type ToolEmbedRow = InferSelectModel<typeof s.toolEmbeds>;
export type ToolLinkRow = InferSelectModel<typeof s.toolLinks>;
export type ContentCommentRow = InferSelectModel<typeof s.contentComments>;
export type ModelingContentExampleRow = InferSelectModel<typeof s.modelingContentExamples>;

// Insert types — úteis em mutations
export type NewTask = InferInsertModel<typeof s.tasks>;
export type NewProject = InferInsertModel<typeof s.projects>;
export type NewPersona = InferInsertModel<typeof s.personas>;
export type NewContentItem = InferInsertModel<typeof s.contentItems>;
export type NewLead = InferInsertModel<typeof s.leads>;
export type NewFinancialTransaction = InferInsertModel<typeof s.financialTransactions>;
export type NewDocument = InferInsertModel<typeof s.documents>;
export type NewMaterial = InferInsertModel<typeof s.materials>;
export type NewTool = InferInsertModel<typeof s.tools>;
export type NewFlow = InferInsertModel<typeof s.flows>;
export type NewSalesFunnel = InferInsertModel<typeof s.salesFunnels>;
export type NewActivityLog = InferInsertModel<typeof s.activityLogs>;
export type NewAIAction = InferInsertModel<typeof s.aiActions>;
export type NewRole = InferInsertModel<typeof s.roles>;
export type NewPermission = InferInsertModel<typeof s.permissions>;
export type NewComment = InferInsertModel<typeof s.comments>;
export type NewMention = InferInsertModel<typeof s.mentions>;
export type NewPresenceSession = InferInsertModel<typeof s.presenceSessions>;
export type NewTaskLabel = InferInsertModel<typeof s.taskLabels>;
export type NewDocumentBlock = InferInsertModel<typeof s.documentBlocks>;
export type NewToolTag = InferInsertModel<typeof s.toolTags>;
export type NewToolEmbed = InferInsertModel<typeof s.toolEmbeds>;
export type NewToolLink = InferInsertModel<typeof s.toolLinks>;
export type NewContentComment = InferInsertModel<typeof s.contentComments>;
export type NewModelingContentExample = InferInsertModel<typeof s.modelingContentExamples>;
export type NewAIToolCall = InferInsertModel<typeof s.aiToolCalls>;

