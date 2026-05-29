import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  numeric,
  index,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personaStatusEnum } from "./enums";

export const personas = pgTable(
  "personas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    codename: text("codename"),
    status: personaStatusEnum("status").default("building").notNull(),
    avatarUrl: text("avatar_url"),
    coverUrl: text("cover_url"),
    niche: text("niche"),
    bigIdea: text("big_idea"),
    bioShort: text("bio_short"),
    objective: text("objective"),
    voiceTone: text("voice_tone"),
    archetype: text("archetype"),
    personality: jsonb("personality"),
    visualStyle: text("visual_style"),
    dressStyle: text("dress_style"),
    forbiddenWords: jsonb("forbidden_words"),
    preferredWords: jsonb("preferred_words"),
    referenceLinks: jsonb("reference_links"),
    guidelines: text("guidelines"),
    ownerId: uuid("owner_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => ({
    workspaceIdx: index("personas_workspace_idx").on(table.workspaceId),
    statusIdx: index("personas_status_idx").on(table.status),
  }),
);

export const personaChannels = pgTable(
  "persona_channels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }).notNull(),
    channel: text("channel").notNull(),
    handle: text("handle"),
    url: text("url"),
    followers: integer("followers").default(0),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    personaIdx: index("persona_channels_persona_idx").on(table.personaId),
  }),
);

export const personaMetricsSnapshots = pgTable(
  "persona_metrics_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
    revenue: numeric("revenue", { precision: 14, scale: 2 }).default("0"),
    followers: integer("followers").default(0),
    views: integer("views").default(0),
    engagement: numeric("engagement", { precision: 6, scale: 3 }).default("0"),
    leads: integer("leads").default(0),
    posts: integer("posts").default(0),
    raw: jsonb("raw"),
  },
  (table) => ({
    personaIdx: index("persona_metrics_persona_idx").on(table.personaId),
    capturedIdx: index("persona_metrics_captured_idx").on(table.capturedAt),
  }),
);

// ============================================================================
// Snapshots diários de seguidores por canal — alimenta a curva real de growth
// no Persona Overview (substitui o cálculo fake totalFollowers * decay).
// ============================================================================
export const personaFollowerSnapshots = pgTable(
  "persona_follower_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }).notNull(),
    channel: text("channel").notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    followers: integer("followers").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    personaDayIdx: index("pfs_persona_idx").on(table.personaId, table.snapshotDate),
    workspaceIdx: index("pfs_workspace_idx").on(table.workspaceId),
    uniqueDay: uniqueIndex("pfs_unique_day_channel").on(
      table.personaId,
      table.channel,
      table.snapshotDate,
    ),
  }),
);

export const contentPillars = pgTable("content_pillars", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  weight: integer("weight").default(1),
});
