import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  numeric,
  date,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";

// =============================================================================
// GESTÃO DE ENERGIA — energia sexual, controle de pornografia, alimentação, sono
// Tudo escopado por workspace_id + user_id (dado pessoal). Campos "enum-like"
// ficam como text (validados na app via Zod) p/ manter a migração simples e
// evitar as armadilhas de pg-enum.
// =============================================================================

// — Check-in diário dos pilares de energia (1 linha por usuário/dia) —
export const energyDailyLogs = pgTable(
  "energy_daily_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    logDate: date("log_date").notNull(),
    // Energia sexual
    sexualEnergy: integer("sexual_energy"),     // 1..5 (energia percebida)
    retained: boolean("retained"),              // manteve retenção no dia?
    libido: integer("libido"),                  // 1..5
    // Sono
    sleepHours: numeric("sleep_hours", { precision: 4, scale: 1 }),
    sleepQuality: integer("sleep_quality"),     // 1..5
    bedtime: text("bedtime"),                   // "23:30"
    wakeTime: text("wake_time"),                // "06:30"
    // Alimentação
    dietQuality: integer("diet_quality"),       // 1..5
    waterMl: integer("water_ml"),
    meals: integer("meals"),
    fasting: boolean("fasting"),
    // Geral
    mood: integer("mood"),                      // 1..5
    energyLevel: integer("energy_level"),       // 1..5
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    workspaceIdx: index("energy_daily_logs_workspace_idx").on(t.workspaceId),
    userDateUq: uniqueIndex("energy_daily_logs_user_date_uq").on(t.workspaceId, t.userId, t.logDate),
  }),
);

// — Eventos do Controle de Pornografia (recaída / urgência vencida / check-in limpo) —
export const pornEvents = pgTable(
  "porn_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    type: text("type").notNull(),               // relapse | urge_resisted | clean_checkin
    occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
    trigger: text("trigger"),                   // gatilho (tédio, estresse, rede social...)
    intensity: integer("intensity"),            // 1..5 (força da urgência)
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    workspaceIdx: index("porn_events_workspace_idx").on(t.workspaceId),
    userIdx: index("porn_events_user_idx").on(t.userId),
    occurredIdx: index("porn_events_occurred_idx").on(t.occurredAt),
  }),
);

// — Settings da área de energia (meta de dias limpo, lembretes, etc.) —
export const energySettings = pgTable(
  "energy_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    data: jsonb("data").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ uniqueWsUser: uniqueIndex("energy_settings_ws_user_uq").on(t.workspaceId, t.userId) }),
);

// =============================================================================
// FINANCEIRO PESSOAL — contas, categorias, transações, contas a pagar, metas
// Escopado por workspace_id + user_id. Dinheiro em numeric(14,2).
// =============================================================================

export const personalAccounts = pgTable(
  "personal_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    type: text("type").default("checking"),     // checking | savings | cash | card | investment
    balance: numeric("balance", { precision: 14, scale: 2 }).default("0"),
    currency: text("currency").default("BRL"),
    color: text("color"),
    icon: text("icon"),
    archived: boolean("archived").default(false),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ workspaceIdx: index("personal_accounts_workspace_idx").on(t.workspaceId) }),
);

export const personalCategories = pgTable(
  "personal_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    kind: text("kind").default("expense"),       // income | expense
    color: text("color"),
    icon: text("icon"),
    // Orçamento mensal por categoria (null = sem limite). Cobre a aba "Orçamento".
    monthlyBudget: numeric("monthly_budget", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ workspaceIdx: index("personal_categories_workspace_idx").on(t.workspaceId) }),
);

export const personalTransactions = pgTable(
  "personal_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    accountId: uuid("account_id").references(() => personalAccounts.id, { onDelete: "set null" }),
    categoryId: uuid("category_id").references(() => personalCategories.id, { onDelete: "set null" }),
    type: text("type").notNull(),                // income | expense
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    description: text("description"),
    occurredAt: date("occurred_at").notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    workspaceIdx: index("personal_transactions_workspace_idx").on(t.workspaceId),
    userIdx: index("personal_transactions_user_idx").on(t.userId),
    occurredIdx: index("personal_transactions_occurred_idx").on(t.occurredAt),
  }),
);

export const personalBills = pgTable(
  "personal_bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    dueDay: integer("due_day"),                  // dia do mês (1..31)
    recurrence: text("recurrence").default("monthly"), // monthly | weekly | yearly | once
    category: text("category"),
    status: text("status").default("pending"),   // pending | paid
    autopay: boolean("autopay").default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ workspaceIdx: index("personal_bills_workspace_idx").on(t.workspaceId) }),
);

export const personalGoals = pgTable(
  "personal_goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    targetAmount: numeric("target_amount", { precision: 14, scale: 2 }).notNull(),
    currentAmount: numeric("current_amount", { precision: 14, scale: 2 }).default("0"),
    dueDate: date("due_date"),
    color: text("color"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ workspaceIdx: index("personal_goals_workspace_idx").on(t.workspaceId) }),
);
