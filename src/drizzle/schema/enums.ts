import { pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "editor",
  "viewer",
  "financeiro",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "todo",
  "doing",
  "review",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const personaStatusEnum = pgEnum("persona_status", [
  "active",
  "building",
  "paused",
  "archived",
]);

export const contentChannelEnum = pgEnum("content_channel", [
  "instagram",
  "tiktok",
  "youtube",
  "whatsapp",
  "email",
  "telegram",
]);

export const contentTypeEnum = pgEnum("content_type", [
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

export const contentStatusEnum = pgEnum("content_status", [
  "idea",
  "pending",
  "scripted",
  "recorded",
  "editing",
  "scheduled",
  "posted",
  "analyzed",
  "archived",
]);

export const contentPillarEnum = pgEnum("content_pillar", [
  "attraction",
  "educational",
  "tips",
  "opinion",
  "neutral",
  "offer",
  "authority",
  "behind",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "open",
  "approached",
  "qualified",
  "converted",
  "lost",
  "no_response",
]);

export const financialTypeEnum = pgEnum("financial_type", [
  "revenue",
  "expense",
]);

export const financialStatusEnum = pgEnum("financial_status", [
  "pending",
  "paid",
  "overdue",
  "canceled",
]);

export const financialSourceEnum = pgEnum("financial_source", [
  "gateway",
  "hotmart",
  "pix",
  "stripe",
  "boleto",
  "transfer",
  "other",
]);

export const promptStatusEnum = pgEnum("prompt_status", [
  "building",
  "robust",
  "archived",
]);

export const flowNodeTypeEnum = pgEnum("flow_node_type", [
  "content",
  "direct",
  "whatsapp",
  "landing",
  "checkout",
  "email",
  "community",
  "call",
  "webinar",
  "live",
  "remarketing",
  "custom",
]);

export const aiActionStatusEnum = pgEnum("ai_action_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const studyTrackStatusEnum   = pgEnum("study_track_status",   ["planned","active","paused","completed","archived"]);
export const studyItemStatusEnum    = pgEnum("study_item_status",    ["not_started","in_progress","completed"]);
export const studyResourceTypeEnum  = pgEnum("study_resource_type",  ["book","course","video","article","doc","pdf","other"]);
export const studyResourceStatusEnum= pgEnum("study_resource_status",["backlog","reading","completed","abandoned"]);
export const studyGoalStatusEnum    = pgEnum("study_goal_status",    ["active","achieved","paused","dropped"]);
export const focusSessionTypeEnum   = pgEnum("focus_session_type",   ["study","work","reading","review","deep_work"]);
export const focusSessionStatusEnum = pgEnum("focus_session_status", ["planned","active","completed","abandoned"]);
export const studyReviewKindEnum    = pgEnum("study_review_kind",    ["note","flashcard","attack_note"]);
