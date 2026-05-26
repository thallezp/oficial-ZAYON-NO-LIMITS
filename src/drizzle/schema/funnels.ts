import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import { flowNodeTypeEnum } from "./enums";

export const flows = pgTable(
  "flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type").default("process"),
    icon: text("icon"),
    color: text("color"),
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("flows_workspace_idx").on(table.workspaceId),
    personaIdx: index("flows_persona_idx").on(table.personaId),
  }),
);

export const flowNodes = pgTable("flow_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "cascade" }).notNull(),
  nodeType: flowNodeTypeEnum("node_type").default("custom"),
  title: text("title"),
  description: text("description"),
  position: jsonb("position"),
  data: jsonb("data"),
});

export const flowEdges = pgTable("flow_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id").references(() => flows.id, { onDelete: "cascade" }).notNull(),
  source: uuid("source").notNull(),
  target: uuid("target").notNull(),
  label: text("label"),
  data: jsonb("data"),
});

export const salesFunnels = pgTable(
  "sales_funnels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    conversionRate: numeric("conversion_rate", { precision: 6, scale: 3 }).default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    personaIdx: index("sales_funnels_persona_idx").on(table.personaId),
  }),
);

export const funnelNodes = pgTable("funnel_nodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  funnelId: uuid("funnel_id").references(() => salesFunnels.id, { onDelete: "cascade" }).notNull(),
  nodeType: flowNodeTypeEnum("node_type").default("custom"),
  title: text("title"),
  description: text("description"),
  position: jsonb("position"),
  data: jsonb("data"),
  metrics: jsonb("metrics"),
});

export const funnelEdges = pgTable("funnel_edges", {
  id: uuid("id").primaryKey().defaultRandom(),
  funnelId: uuid("funnel_id").references(() => salesFunnels.id, { onDelete: "cascade" }).notNull(),
  source: uuid("source").notNull(),
  target: uuid("target").notNull(),
  label: text("label"),
  data: jsonb("data"),
});
