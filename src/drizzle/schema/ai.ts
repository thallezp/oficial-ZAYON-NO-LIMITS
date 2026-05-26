import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import { aiActionStatusEnum } from "./enums";

export const aiThreads = pgTable(
  "ai_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    model: text("model"),
    contextEntity: jsonb("context_entity"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("ai_threads_workspace_idx").on(table.workspaceId),
    personaIdx: index("ai_threads_persona_idx").on(table.personaId),
  }),
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id").references(() => aiThreads.id, { onDelete: "cascade" }).notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    toolCalls: jsonb("tool_calls"),
    attachments: jsonb("attachments"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    threadIdx: index("ai_messages_thread_idx").on(table.threadId),
  }),
);

export const aiActions = pgTable(
  "ai_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id").references(() => aiThreads.id, { onDelete: "set null" }),
    actorId: uuid("actor_id").references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    status: aiActionStatusEnum("status").default("queued").notNull(),
    input: jsonb("input"),
    output: jsonb("output"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("ai_actions_workspace_idx").on(table.workspaceId),
    statusIdx: index("ai_actions_status_idx").on(table.status),
  }),
);

export const aiToolCalls = pgTable(
  "ai_tool_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actionId: uuid("action_id").references(() => aiActions.id, { onDelete: "cascade" }).notNull(),
    toolName: text("tool_name").notNull(),
    args: jsonb("args").notNull(),
    result: jsonb("result"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    actionIdx: index("ai_tool_calls_action_idx").on(table.actionId),
  }),
);

