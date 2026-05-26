import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import { leadStatusEnum } from "./enums";

export const leadSources = pgTable("lead_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  type: text("type"),
  metadata: jsonb("metadata"),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    sourceId: uuid("source_id").references(() => leadSources.id),
    name: text("name"),
    email: text("email"),
    phone: text("phone"),
    instagram: text("instagram"),
    campaign: text("campaign"),
    status: leadStatusEnum("status").default("open").notNull(),
    score: integer("score").default(0),
    qualified: integer("qualified").default(0),
    responsibleId: uuid("responsible_id").references(() => users.id),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    convertedValue: numeric("converted_value", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("leads_workspace_idx").on(table.workspaceId),
    personaIdx: index("leads_persona_idx").on(table.personaId),
    statusIdx: index("leads_status_idx").on(table.status),
    createdIdx: index("leads_created_idx").on(table.createdAt),
  }),
);

export const leadAnswers = pgTable(
  "lead_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
    question: text("question").notNull(),
    answer: text("answer"),
    raw: jsonb("raw"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    leadIdx: index("lead_answers_lead_idx").on(table.leadId),
  }),
);

export const leadStatusHistory = pgTable("lead_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id").references(() => leads.id, { onDelete: "cascade" }).notNull(),
  fromStatus: leadStatusEnum("from_status"),
  toStatus: leadStatusEnum("to_status").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const googleSheetsConnections = pgTable("google_sheets_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  sheetUrl: text("sheet_url").notNull(),
  webhookSecret: text("webhook_secret"),
  fieldMapping: jsonb("field_mapping"),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
