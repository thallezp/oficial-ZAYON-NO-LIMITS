import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";
import { workspaces, users } from "./core";
import { personas } from "./personas";
import {
  financialTypeEnum,
  financialStatusEnum,
  financialSourceEnum,
} from "./enums";

export const financialCategories = pgTable("financial_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color"),
  type: financialTypeEnum("type").notNull(),
});

export const financialTransactions = pgTable(
  "financial_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    projectId: uuid("project_id"),
    type: financialTypeEnum("type").notNull(),
    status: financialStatusEnum("status").default("pending").notNull(),
    source: financialSourceEnum("source").default("other"),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    description: text("description"),
    notes: text("notes"),
    occurredAt: date("occurred_at").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => financialCategories.id),
    receiptUrl: text("receipt_url"),
    metadata: jsonb("metadata"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("financial_transactions_workspace_idx").on(table.workspaceId),
    personaIdx: index("financial_transactions_persona_idx").on(table.personaId),
    typeIdx: index("financial_transactions_type_idx").on(table.type),
    occurredIdx: index("financial_transactions_occurred_idx").on(table.occurredAt),
  }),
);

export const payrollMembers = pgTable(
  "payroll_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    role: text("role"),
    baseSalary: numeric("base_salary", { precision: 14, scale: 2 }).default("0"),
    commission: numeric("commission", { precision: 14, scale: 2 }).default("0"),
    pixKey: text("pix_key"),
    payDay: text("pay_day"),
    status: text("status").default("active"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("payroll_members_workspace_idx").on(table.workspaceId),
  }),
);

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    personaId: uuid("persona_id").references(() => personas.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    dueAt: date("due_at").notNull(),
    recurrence: text("recurrence"),
    status: financialStatusEnum("status").default("pending"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("bills_workspace_idx").on(table.workspaceId),
    dueIdx: index("bills_due_idx").on(table.dueAt),
  }),
);
