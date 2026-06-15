import {
  pgTable, uuid, text, timestamp, jsonb, boolean, integer, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import { projects, tasks } from "./workspace";
import {
  studyTrackStatusEnum, studyItemStatusEnum, studyResourceTypeEnum,
  studyResourceStatusEnum, studyGoalStatusEnum, focusSessionTypeEnum,
  focusSessionStatusEnum, studyReviewKindEnum,
} from "./enums";

// — Objetivos (guarda-chuva) —
export const studyObjectives = pgTable("study_objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  category: text("category"),
  status: text("status").default("active"),
  deadline: timestamp("deadline", { withTimezone: true }),
  milestones: jsonb("milestones"),
  achievedAt: timestamp("achieved_at", { withTimezone: true }),
  sourceId: text("source_id"),
  metadata: jsonb("metadata"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ workspaceIdx: index("study_objectives_workspace_idx").on(t.workspaceId) }));

// — Trilhas —
export const studyTracks = pgTable("study_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  objectiveId: uuid("objective_id").references(() => studyObjectives.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  area: text("area"),
  description: text("description"),
  status: studyTrackStatusEnum("status").default("active").notNull(),
  mode: text("mode"),
  startDate: timestamp("start_date", { withTimezone: true }),
  targetDate: timestamp("target_date", { withTimezone: true }),
  hoursTarget: integer("hours_target"),
  color: text("color"),
  icon: text("icon"),
  source: jsonb("source"),
  sortOrder: integer("sort_order").default(0),
  sourceId: text("source_id"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index("study_tracks_workspace_idx").on(t.workspaceId),
  objectiveIdx: index("study_tracks_objective_idx").on(t.objectiveId),
}));

// — Módulos (filha de tracks) —
export const studyModules = pgTable("study_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: uuid("track_id").references(() => studyTracks.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  status: studyItemStatusEnum("status").default("not_started").notNull(),
  hoursTarget: integer("hours_target"),
  position: integer("position").default(0),
  expanded: boolean("expanded").default(false),
  sourceId: text("source_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ trackIdx: index("study_modules_track_idx").on(t.trackId) }));

// — Recursos / Biblioteca —
export const studyResources = pgTable("study_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  trackId: uuid("track_id").references(() => studyTracks.id, { onDelete: "set null" }),
  objectiveId: uuid("objective_id").references(() => studyObjectives.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  authors: text("authors"),
  type: studyResourceTypeEnum("type").default("book").notNull(),
  status: studyResourceStatusEnum("status").default("backlog").notNull(),
  area: text("area"),
  language: text("language"),
  year: integer("year"),
  publisher: text("publisher"),
  pages: integer("pages"),
  currentPage: integer("current_page").default(0),
  hoursDone: integer("hours_done").default(0),
  link: text("link"),
  isbn: text("isbn"),
  edition: text("edition"),
  rating: integer("rating"),
  review: text("review"),
  recommend: boolean("recommend"),
  tags: jsonb("tags"),
  coverUrl: text("cover_url"),
  fileUrl: text("file_url"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  sourceId: text("source_id"),
  metadata: jsonb("metadata"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index("study_resources_workspace_idx").on(t.workspaceId),
  statusIdx: index("study_resources_status_idx").on(t.status),
  trackIdx: index("study_resources_track_idx").on(t.trackId),
}));

// — Submódulos (filha de modules; resourceId DEPOIS de resources p/ FK) —
export const studyModuleItems = pgTable("study_module_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  moduleId: uuid("module_id").references(() => studyModules.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  status: studyItemStatusEnum("status").default("not_started").notNull(),
  hours: integer("hours").default(1),
  position: integer("position").default(0),
  resourceId: uuid("resource_id").references(() => studyResources.id, { onDelete: "set null" }),
  link: text("link"),
  sourceId: text("source_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ moduleIdx: index("study_module_items_module_idx").on(t.moduleId) }));

// — Metas mensuráveis —
export const studyGoals = pgTable("study_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  trackId: uuid("track_id").references(() => studyTracks.id, { onDelete: "set null" }),
  objectiveId: uuid("objective_id").references(() => studyObjectives.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  metric: text("metric"),          // hours | pages | sessions | streak | custom
  target: integer("target"),
  current: integer("current").default(0),
  period: text("period"),          // daily | weekly | monthly | total
  status: studyGoalStatusEnum("status").default("active").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ workspaceIdx: index("study_goals_workspace_idx").on(t.workspaceId) }));

// — Sessões de Foco (PONTE estudo↔trabalho) —
export const focusSessions = pgTable("focus_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  type: focusSessionTypeEnum("type").notNull(),
  status: focusSessionStatusEnum("status").default("active").notNull(),
  trackId: uuid("track_id").references(() => studyTracks.id, { onDelete: "set null" }),
  moduleId: uuid("module_id").references(() => studyModules.id, { onDelete: "set null" }),
  moduleItemId: uuid("module_item_id").references(() => studyModuleItems.id, { onDelete: "set null" }),
  resourceId: uuid("resource_id").references(() => studyResources.id, { onDelete: "set null" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
  label: text("label"),
  technique: text("technique"),    // pomodoro | deep_work | free
  plannedMinutes: integer("planned_minutes"),
  actualMinutes: integer("actual_minutes").default(0),
  interruptions: integer("interruptions").default(0),
  focusScore: integer("focus_score"),
  notes: text("notes"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index("focus_sessions_workspace_idx").on(t.workspaceId),
  userIdx: index("focus_sessions_user_idx").on(t.userId),
  typeIdx: index("focus_sessions_type_idx").on(t.type),
  startedIdx: index("focus_sessions_started_idx").on(t.startedAt),
}));

// — Revisões / Caderno (SM-2) —
export const studyReviews = pgTable("study_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  trackId: uuid("track_id").references(() => studyTracks.id, { onDelete: "set null" }),
  moduleId: uuid("module_id").references(() => studyModules.id, { onDelete: "set null" }),
  resourceId: uuid("resource_id").references(() => studyResources.id, { onDelete: "set null" }),
  title: text("title"),
  content: text("content"),
  kind: studyReviewKindEnum("kind").default("note").notNull(),
  status: text("status").default("due"),   // due | learning | review | mastered
  ease: integer("ease").default(250),
  intervalDays: integer("interval_days").default(0),
  reps: integer("reps").default(0),
  dueAt: timestamp("due_at", { withTimezone: true }),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index("study_reviews_workspace_idx").on(t.workspaceId),
  userIdx: index("study_reviews_user_idx").on(t.userId),
  dueIdx: index("study_reviews_due_idx").on(t.dueAt),
}));

// — Plano / Rotina (blocos A/B/C + trabalho) —
export const studyPlans = pgTable("study_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  kind: text("kind"),              // study | work | routine
  name: text("name").notNull(),
  schedule: jsonb("schedule"),     // [{ days, start, end, label, trackId?, projectId? }]
  active: boolean("active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ workspaceIdx: index("study_plans_workspace_idx").on(t.workspaceId) }));

// — Conquistas —
export const studyAchievements = pgTable("study_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  key: text("key").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  tier: text("tier"),              // bronze | silver | gold
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }),
  progress: jsonb("progress"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceIdx: index("study_achievements_workspace_idx").on(t.workspaceId),
  uniqueKey: uniqueIndex("study_achievements_ws_user_key_uq").on(t.workspaceId, t.userId, t.key),
}));

// — Settings —
export const studySettings = pgTable("study_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  data: jsonb("data").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({ uniqueWsUser: uniqueIndex("study_settings_ws_user_uq").on(t.workspaceId, t.userId) }));
