import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  date,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";

export const launchCampaigns = pgTable(
  "launch_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    startsAt: date("starts_at"),
    endsAt: date("ends_at"),
    status: text("status").default("planning"),
    goal: text("goal"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("launch_campaigns_workspace_idx").on(table.workspaceId),
  }),
);

export const launchEvents = pgTable("launch_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => launchCampaigns.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  type: text("type"),
  metadata: jsonb("metadata"),
});

export const icpPains = pgTable(
  "icp_pains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    body: text("body").notNull(),
    tags: jsonb("tags"),
    intensity: text("intensity"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("icp_pains_workspace_idx").on(table.workspaceId),
    personaIdx: index("icp_pains_persona_idx").on(table.personaId),
  }),
);

export const salesCopies = pgTable(
  "sales_copies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id").references(() => launchCampaigns.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: text("status").default("draft"),
    metadata: jsonb("metadata"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("sales_copies_workspace_idx").on(table.workspaceId),
    personaIdx: index("sales_copies_persona_idx").on(table.personaId),
  }),
);
