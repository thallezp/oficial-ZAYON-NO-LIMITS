import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import { taskStatusEnum, taskPriorityEnum } from "./enums";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    icon: text("icon"),
    status: text("status").default("active"),
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("projects_workspace_idx").on(table.workspaceId),
    personaIdx: index("projects_persona_idx").on(table.personaId),
  }),
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    parentTaskId: uuid("parent_task_id"),
    title: text("title").notNull(),
    description: text("description"),
    status: taskStatusEnum("status").default("todo").notNull(),
    priority: taskPriorityEnum("priority").default("medium").notNull(),
    assigneeId: uuid("assignee_id").references(() => users.id),
    creatorId: uuid("creator_id").references(() => users.id),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    labels: jsonb("labels"),
    relatedEntity: jsonb("related_entity"),
    position: integer("position").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("tasks_workspace_idx").on(table.workspaceId),
    personaIdx: index("tasks_persona_idx").on(table.personaId),
    statusIdx: index("tasks_status_idx").on(table.status),
    assigneeIdx: index("tasks_assignee_idx").on(table.assigneeId),
  }),
);

export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    allDay: boolean("all_day").default(false),
    color: text("color"),
    category: text("category"),
    createdBy: uuid("created_by").references(() => users.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("calendar_events_workspace_idx").on(table.workspaceId),
    startIdx: index("calendar_events_start_idx").on(table.startAt),
  }),
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    icon: text("icon"),
    emoji: text("emoji"),
    summary: text("summary"),
    content: jsonb("content"),
    type: text("type").default("doc"),
    tags: jsonb("tags"),
    parentId: uuid("parent_id"),
    authorId: uuid("author_id").references(() => users.id),
    isStarred: boolean("is_starred").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("documents_workspace_idx").on(table.workspaceId),
    personaIdx: index("documents_persona_idx").on(table.personaId),
  }),
);

export const materials = pgTable(
  "materials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    fileUrl: text("file_url").notNull(),
    fileType: text("file_type"),
    sizeBytes: integer("size_bytes"),
    folderId: uuid("folder_id"),
    tags: jsonb("tags"),
    relatedEntity: jsonb("related_entity"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    isStarred: boolean("is_starred").default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("materials_workspace_idx").on(table.workspaceId),
    personaIdx: index("materials_persona_idx").on(table.personaId),
  }),
);

export const folders = pgTable("folders", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  parentId: uuid("parent_id"),
  color: text("color"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const taskLabels = pgTable("task_labels", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const documentBlocks = pgTable("document_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  blockId: text("block_id").notNull(),
  type: text("type").notNull(),
  content: jsonb("content"),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

