import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import {
  contentChannelEnum,
  contentTypeEnum,
  contentStatusEnum,
  contentPillarEnum,
} from "./enums";

export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    channel: contentChannelEnum("channel").notNull(),
    contentType: contentTypeEnum("content_type").notNull(),
    title: text("title").notNull(),
    hook: text("hook"),
    script: text("script"),
    caption: text("caption"),
    visualBrief: text("visual_brief"),
    audioReference: text("audio_reference"),
    referenceLinks: jsonb("reference_links"),
    pillar: contentPillarEnum("pillar"),
    status: contentStatusEnum("status").default("idea").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ownerId: uuid("owner_id").references(() => users.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("content_items_workspace_idx").on(table.workspaceId),
    personaIdx: index("content_items_persona_idx").on(table.personaId),
    channelIdx: index("content_items_channel_idx").on(table.channel),
    statusIdx: index("content_items_status_idx").on(table.status),
    scheduledIdx: index("content_items_scheduled_idx").on(table.scheduledAt),
  }),
);

export const contentMetrics = pgTable(
  "content_metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).defaultNow().notNull(),
    views: integer("views").default(0),
    likes: integer("likes").default(0),
    comments: integer("comments").default(0),
    shares: integer("shares").default(0),
    saves: integer("saves").default(0),
    reach: integer("reach").default(0),
    engagementRate: integer("engagement_rate").default(0),
    retention: integer("retention").default(0),
    raw: jsonb("raw"),
  },
  (table) => ({
    contentIdx: index("content_metrics_content_idx").on(table.contentItemId),
  }),
);

export const contentReferences = pgTable("content_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  type: text("type"),
  url: text("url"),
  notes: text("notes"),
});

export const modelingProfiles = pgTable(
  "modeling_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    socialNetwork: text("social_network"),
    country: text("country"),
    link: text("link"),
    niche: text("niche"),
    category: text("category"),
    notes: text("notes"),
    photoUrl: text("photo_url"),
    tags: jsonb("tags"),
    refs: jsonb("refs"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("modeling_profiles_workspace_idx").on(table.workspaceId),
  }),
);

export const promptChains = pgTable(
  "prompt_chains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").default("building"),
    basePrompt: text("base_prompt"),
    chain: jsonb("chain"),
    tags: jsonb("tags"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("prompt_chains_workspace_idx").on(table.workspaceId),
  }),
);

export const promptIterations = pgTable("prompt_iterations", {
  id: uuid("id").primaryKey().defaultRandom(),
  promptChainId: uuid("prompt_chain_id").references(() => promptChains.id, { onDelete: "cascade" }).notNull(),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contentComments = pgTable("content_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentItemId: uuid("content_item_id").references(() => contentItems.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// Banco de Hooks (atrativos/ganchos reutilizaveis para roteiros TikTok/Reels)
// ============================================================================
export const contentHooks = pgTable(
  "content_hooks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    // ex: educational, objection, authority, pain, curiosity, contrast, custom
    category: text("category").default("custom"),
    tag: text("tag"),
    // marca se ja foi testado em conteudo real
    tested: jsonb("tested"), // { count, lastUsedAt, contentItemIds }
    // performance dos vídeos que usaram esse hook (auto-calculado)
    performanceScore: integer("performance_score"),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("content_hooks_workspace_idx").on(table.workspaceId),
    personaIdx: index("content_hooks_persona_idx").on(table.personaId),
    categoryIdx: index("content_hooks_category_idx").on(table.category),
  }),
);

export const modelingContentExamples = pgTable("modeling_content_examples", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => modelingProfiles.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  channel: text("channel"),
  analysis: text("analysis"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

