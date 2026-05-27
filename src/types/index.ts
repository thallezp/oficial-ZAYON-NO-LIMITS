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
  name?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  campaign?: string;
  source?: string;
  status: LeadStatus;
  score?: number;
  responsible?: User;
  answers?: { question: string; answer: string }[];
  notes?: string;
  convertedValue?: number;
  createdAt: string;
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
