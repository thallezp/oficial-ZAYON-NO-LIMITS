export type ID = string;

export type Role = "owner" | "admin" | "editor" | "viewer" | "financeiro";

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  ownerId: ID;
  plan?: string;
  createdAt: string;
}

export interface User {
  id: ID;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: Role;
  online?: boolean;
  metadata?: Record<string, any>;
}

export type PersonaStatus = "active" | "building" | "paused" | "archived";

export interface Persona {
  id: ID;
  workspaceId: ID;
  name: string;
  codename?: string;
  status: PersonaStatus;
  avatarUrl?: string;
  coverUrl?: string;
  niche?: string;
  bigIdea?: string;
  bioShort?: string;
  objective?: string;
  voiceTone?: string;
  archetype?: string;
  personality?: string[];
  visualStyle?: string;
  dressStyle?: string;
  forbiddenWords?: string[];
  preferredWords?: string[];
  guidelines?: string;
  channels?: PersonaChannel[];
  pillars?: string[];
  metrics?: PersonaMetrics;
  accent?: string;
}

export interface PersonaChannel {
  channel: "instagram" | "tiktok" | "youtube" | "whatsapp" | "email" | "telegram";
  handle?: string;
  url?: string;
  followers?: number;
}

export interface PersonaMetrics {
  revenue?: number;
  revenuePeriod?: number;
  revenueDelta?: number;
  followers?: number;
  followersDelta?: number;
  views?: number;
  viewsDelta?: number;
  engagement?: number;
  engagementDelta?: number;
  leads?: number;
  leadsDelta?: number;
  posts?: number;
  conversion?: number;
  conversionDelta?: number;
}

export type TaskStatus = "backlog" | "todo" | "doing" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  projectId?: ID;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: User;
  dueAt?: string;
  labels?: string[];
  relatedEntity?: { type: string; id: ID; title?: string };
  createdAt: string;
}

export interface Project {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  status?: "active" | "paused" | "done";
  members?: User[];
  progress?: number;
  taskCount?: { total: number; done: number };
}

export type ContentChannel = "instagram" | "tiktok" | "youtube" | "whatsapp" | "email" | "telegram";
export type ContentType = "reel" | "feed" | "carousel" | "story" | "short" | "video" | "post" | "email" | "live" | "ad";
export type ContentStatus = "idea" | "pending" | "scripted" | "recorded" | "editing" | "scheduled" | "posted" | "analyzed" | "archived";
export type ContentPillar = "attraction" | "educational" | "tips" | "opinion" | "neutral" | "offer" | "authority" | "behind";

export interface ContentItem {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  channel: ContentChannel;
  contentType: ContentType;
  title: string;
  hook?: string;
  script?: string;
  caption?: string;
  visualBrief?: string;
  audioReference?: string;
  status: ContentStatus;
  pillar?: ContentPillar;
  scheduledAt?: string;
  publishedAt?: string;
  owner?: User;
  metrics?: ContentMetrics;
}

export interface ContentMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  retention?: number;
  engagementRate?: number;
}

export type LeadStatus = "open" | "approached" | "qualified" | "converted" | "lost" | "no_response";

export interface Lead {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  sourceId?: ID | null;
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  campaign?: string;
  source?: string;
  status: LeadStatus;
  score?: number;
  qualified?: number;
  responsibleId?: ID | null;
  responsible?: User | null;
  persona?: { id: ID; name: string } | null;
  answers?: LeadAnswer[];
  history?: LeadStatusEntry[];
  comments?: LeadComment[];
  linkedTasks?: LeadLinkedTask[];
  notes?: string;
  convertedValue?: number;
  metadata?: Record<string, any>;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface LeadAnswer {
  id?: ID;
  question: string;
  answer?: string;
  createdAt?: string;
}

export interface LeadComment {
  id: ID;
  content: string;
  author?: User | null;
  createdAt: string;
}

export interface LeadStatusEntry {
  id: ID;
  fromStatus?: LeadStatus | null;
  toStatus: LeadStatus;
  changedBy?: User | null;
  changedAt: string;
}

export interface LeadLinkedTask {
  id: ID;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
}

export type FinanceType = "revenue" | "expense";
export type FinanceStatus = "pending" | "paid" | "overdue" | "canceled";
export type FinanceSource = "gateway" | "hotmart" | "pix" | "stripe" | "boleto" | "transfer" | "other";

export interface FinanceTransaction {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  type: FinanceType;
  status: FinanceStatus;
  source: FinanceSource;
  amount: number;
  description: string;
  notes?: string;
  occurredAt: string;
  category?: string;
}

export interface PayrollMember {
  id: ID;
  workspaceId: ID;
  name: string;
  role: string;
  baseSalary: number;
  commission?: number;
  pixKey?: string;
  payDay: string;
  status: "active" | "paused";
}

export interface Bill {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  amount: number;
  dueAt: string;
  recurrence?: string;
  status: FinanceStatus;
}

export interface DocumentItem {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  title: string;
  icon?: string;
  emoji?: string;
  summary?: string;
  type?: string;
  tags?: string[];
  parentId?: ID;
  isStarred?: boolean;
  author?: User;
  updatedAt: string;
}

export interface MaterialItem {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: "image" | "video" | "pdf" | "doc" | "audio" | "other";
  sizeBytes?: number;
  tags?: string[];
  relatedEntity?: { type: string; id: ID };
  uploadedBy?: User;
  isStarred?: boolean;
  createdAt: string;
}

export interface Tool {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  url: string;
  logoUrl?: string;
  iconSlug?: string;
  category: string;
  tags?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  isEmbeddable?: boolean;
  brandColor?: string;
  embedMode?: "new_tab" | "embed" | "modal";
  projectId?: string;
  documentId?: string;
  urlCheckedAt?: string;
  urlStatus?: number | string;
}

export interface FlowItem {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  type: "process" | "automation" | "mindmap" | "onboarding" | "approval" | "content";
  icon?: string;
  color?: string;
  nodeCount?: number;
  updatedAt: string;
}

export interface FunnelNode {
  id: ID;
  type: "content" | "direct" | "whatsapp" | "landing" | "checkout" | "email" | "community" | "call" | "webinar" | "live" | "remarketing" | "custom";
  title: string;
  description?: string;
  position: { x: number; y: number };
  metrics?: { traffic?: number; conversion?: number; revenue?: number };
}

export interface FunnelEdge {
  id: ID;
  source: ID;
  target: ID;
  label?: string;
}

export interface Funnel {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  nodes: FunnelNode[];
  edges: FunnelEdge[];
  conversionRate?: number;
}

export interface ICPPain {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  category: "pain" | "frustration" | "aspiration" | "objection" | "desire" | "fear";
  body: string;
  tags?: string[];
  intensity?: "low" | "medium" | "high";
}

export type LaunchCampaignStatus =
  | "planning"
  | "active"
  | "completed"
  | "archived";

export type LaunchPhaseKey =
  | "research"
  | "warming"
  | "capture"
  | "event"
  | "sale"
  | "closing"
  | "post_sale";

export interface LaunchEvent {
  id: ID;
  campaignId: ID;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string | null;
  type?: string | null;
  metadata?: Record<string, any> | null;
}

export interface SalesCopy {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  campaignId?: ID | null;
  type: string;
  title: string;
  body: string;
  status: string;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchCampaign {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  status: LaunchCampaignStatus;
  goal?: string | null;
  metadata?: {
    funnelId?: ID | null;
    linkedTaskIds?: ID[];
    linkedContentIds?: ID[];
    linkedDocumentIds?: ID[];
    linkedMaterialIds?: ID[];
    phaseNotes?: Partial<Record<LaunchPhaseKey, string>>;
    copyPlan?: string;
    creativeScripts?: string;
    emails?: string;
    whatsapp?: string;
    salesPages?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  events?: LaunchEvent[];
  copies?: SalesCopy[];
}

export interface PromptChain {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  status: "building" | "robust" | "archived";
  basePrompt: string;
  chain: { id: ID; role: string; body: string }[];
  tags?: string[];
  updatedAt: string;
}

export interface ModelingProfile {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  socialNetwork: string;
  country?: string;
  link: string;
  niche?: string;
  category: "emerging" | "hidden_gem" | "big_creator" | "authority" | "competitor" | "international";
  notes?: string;
  photoUrl?: string;
  tags?: string[];
  followers?: number;
}

export interface NotificationItem {
  id: ID;
  workspaceId: ID;
  userId?: ID;
  type: string;
  title: string;
  body?: string;
  href?: string;
  readAt?: string;
  archivedAt?: string;
  deletedAt?: string;
  personaId?: ID;
  entityType?: string;
  entityId?: ID;
  createdAt: string;
}

export interface ActivityLogItem {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  actor?: User;
  actorType: "user" | "ai" | "system";
  action: string;
  entityType?: string;
  entityId?: ID;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export interface AIAction {
  id: ID;
  workspaceId: ID;
  personaId?: ID;
  name: string;
  description?: string;
  status: "queued" | "running" | "completed" | "failed";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: string;
}

export type StudyTrackStatus = "planned" | "active" | "paused" | "completed" | "archived";
export type StudyItemStatus = "not_started" | "in_progress" | "completed";
export type StudyResourceType = "book" | "course" | "video" | "article" | "doc" | "pdf" | "other";
export type StudyResourceStatus = "backlog" | "reading" | "completed" | "abandoned";
export type StudyGoalStatus = "active" | "achieved" | "paused" | "dropped";
export type FocusSessionType = "study" | "work" | "reading" | "review" | "deep_work";
export type FocusSessionStatus = "planned" | "active" | "completed" | "abandoned";
export type StudyReviewKind = "note" | "flashcard" | "attack_note";

export interface StudyObjective {
  id: ID;
  workspaceId: ID;
  personaId?: ID | null;
  name: string;
  description?: string | null;
  emoji?: string | null;
  category?: string | null;
  status?: string | null;
  deadline?: string | null;
  milestones?: any | null;
  achievedAt?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdBy?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyTrack {
  id: ID;
  workspaceId: ID;
  personaId?: ID | null;
  objectiveId?: ID | null;
  name: string;
  area?: string | null;
  description?: string | null;
  status: StudyTrackStatus;
  mode?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  hoursTarget?: number | null;
  color?: string | null;
  icon?: string | null;
  source?: any | null;
  sortOrder?: number | null;
  sourceId?: string | null;
  createdBy?: ID | null;
  createdAt: string;
  updatedAt: string;
  
  // Derived fields added by mappers
  progress?: number;
  hoursDone?: number;
}

export interface StudyModule {
  id: ID;
  trackId: ID;
  name: string;
  status: StudyItemStatus;
  hoursTarget?: number | null;
  position?: number | null;
  expanded?: boolean | null;
  sourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  
  // Derived/related items
  items?: StudyModuleItem[];
}

export interface StudyModuleItem {
  id: ID;
  moduleId: ID;
  name: string;
  status: StudyItemStatus;
  hours?: number | null;
  position?: number | null;
  resourceId?: ID | null;
  link?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyResource {
  id: ID;
  workspaceId: ID;
  personaId?: ID | null;
  trackId?: ID | null;
  objectiveId?: ID | null;
  title: string;
  subtitle?: string | null;
  authors?: string | null;
  type: StudyResourceType;
  status: StudyResourceStatus;
  area?: string | null;
  language?: string | null;
  year?: number | null;
  publisher?: string | null;
  pages?: number | null;
  currentPage?: number | null;
  hoursDone?: number | null;
  link?: string | null;
  isbn?: string | null;
  edition?: string | null;
  rating?: number | null;
  review?: string | null;
  recommend?: boolean | null;
  tags?: any | null;
  coverUrl?: string | null;
  fileUrl?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, any> | null;
  createdBy?: ID | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyGoal {
  id: ID;
  workspaceId: ID;
  personaId?: ID | null;
  trackId?: ID | null;
  objectiveId?: ID | null;
  title: string;
  metric?: string | null; // hours | pages | sessions | streak | custom
  target?: number | null;
  current?: number | null;
  period?: string | null; // daily | weekly | monthly | total
  status: StudyGoalStatus;
  startDate?: string | null;
  dueDate?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: ID;
  workspaceId: ID;
  personaId?: ID | null;
  userId: ID;
  type: FocusSessionType;
  status: FocusSessionStatus;
  trackId?: ID | null;
  moduleId?: ID | null;
  moduleItemId?: ID | null;
  resourceId?: ID | null;
  projectId?: ID | null;
  taskId?: ID | null;
  label?: string | null;
  technique?: string | null; // pomodoro | deep_work | free
  plannedMinutes?: number | null;
  actualMinutes?: number | null;
  interruptions?: number | null;
  focusScore?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyReview {
  id: ID;
  workspaceId: ID;
  userId: ID;
  trackId?: ID | null;
  moduleId?: ID | null;
  resourceId?: ID | null;
  title?: string | null;
  content?: string | null;
  kind: StudyReviewKind;
  status?: string | null; // due | learning | review | mastered
  ease?: number | null;
  intervalDays?: number | null;
  reps?: number | null;
  dueAt?: string | null;
  lastReviewedAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlan {
  id: ID;
  workspaceId: ID;
  userId: ID;
  kind?: string | null; // study | work | routine
  name: string;
  schedule?: Array<{
    days: number[];
    start: string;
    end: string;
    label: string;
    trackId?: string;
    projectId?: string;
  }> | null;
  active?: boolean | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyAchievement {
  id: ID;
  workspaceId: ID;
  userId: ID;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  tier?: string | null; // bronze | silver | gold
  unlockedAt?: string | null;
  progress?: any | null;
  createdAt: string;
}

export interface StudySettings {
  id: ID;
  workspaceId: ID;
  userId: ID;
  data?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

