/**
 * Camada de queries — server-side data access.
 *
 * Comportamento:
 *   - `useMockData = true` (default sem Supabase) → devolve mocks de `@/data`
 *   - `useMockData = false` → usa Drizzle/Supabase real
 */

import {
  MOCK_TASKS,
  MOCK_CONTENT,
  MOCK_LEADS,
  MOCK_FINANCE,
  MOCK_PERSONAS,
  MOCK_DOCUMENTS,
  MOCK_MATERIALS,
  MOCK_TOOLS,
  MOCK_FLOWS,
  MOCK_ICP_PAINS,
  MOCK_PROMPT_CHAINS,
  MOCK_MODELING,
  MOCK_PROJECTS,
  MOCK_USERS,
  MOCK_PAYROLL,
  MOCK_BILLS,
  MOCK_NOTIFICATIONS,
  MOCK_ACTIVITY,
  MOCK_AI_ACTIONS,
  MOCK_FUNNEL_AURORA,
} from "@/data";
import { useMockData } from "@/lib/config";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import * as s from "@/drizzle/schema";

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
}

function matchScope<T extends ScopeFilter>(items: T[], filter?: ScopeFilter) {
  return items.filter(
    (i) =>
      (!filter?.workspaceId || i.workspaceId === filter.workspaceId) &&
      (!filter?.personaId || i.personaId === filter.personaId),
  );
}

export const queries = {
  tasks: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_TASKS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.tasks.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.tasks.personaId, filter.personaId));
      return db.select().from(s.tasks).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  projects: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_PROJECTS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.projects.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.projects.personaId, filter.personaId));
      return db.select().from(s.projects).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  content: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_CONTENT, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.contentItems.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.contentItems.personaId, filter.personaId));
      return db.select().from(s.contentItems).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  leads: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_LEADS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.leads.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.leads.personaId, filter.personaId));
      return db.select().from(s.leads).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  finance: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_FINANCE, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.financialTransactions.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.financialTransactions.personaId, filter.personaId));
      return db.select().from(s.financialTransactions).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
    payrollList: async (workspaceId: string) => {
      if (useMockData) return MOCK_PAYROLL;
      return db.select().from(s.payrollMembers).where(eq(s.payrollMembers.workspaceId, workspaceId));
    },
    billsList: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_BILLS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.bills.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.bills.personaId, filter.personaId));
      return db.select().from(s.bills).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  personas: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_PERSONAS.filter(
          (p) => !workspaceId || p.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.personas);
      return db.select().from(s.personas).where(eq(s.personas.workspaceId, workspaceId));
    },
    byId: async (id: string) => {
      if (useMockData) return MOCK_PERSONAS.find((p) => p.id === id);
      const rows = await db.select().from(s.personas).where(eq(s.personas.id, id));
      return rows[0] || null;
    },
  },
  documents: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_DOCUMENTS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.documents.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.documents.personaId, filter.personaId));
      return db.select().from(s.documents).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
    byId: async (id: string) => {
      if (useMockData) return MOCK_DOCUMENTS.find((d) => d.id === id) || null;
      const rows = await db.select().from(s.documents).where(eq(s.documents.id, id));
      return rows[0] || null;
    },
  },
  materials: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_MATERIALS, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.materials.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.materials.personaId, filter.personaId));
      return db.select().from(s.materials).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  tools: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_TOOLS.filter(
          (t) => !workspaceId || t.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.tools);
      return db.select().from(s.tools).where(eq(s.tools.workspaceId, workspaceId));
    },
  },
  flows: {
    list: async (workspaceId?: string) => {
      if (useMockData)
        return MOCK_FLOWS.filter(
          (f) => !workspaceId || f.workspaceId === workspaceId,
        );
      if (!workspaceId) return db.select().from(s.flows);
      return db.select().from(s.flows).where(eq(s.flows.workspaceId, workspaceId));
    },
    byId: async (id: string) => {
      if (useMockData) return MOCK_FLOWS.find((f) => f.id === id) || null;
      const rows = await db.select().from(s.flows).where(eq(s.flows.id, id));
      if (!rows[0]) return null;
      const nodes = await db.select().from(s.flowNodes).where(eq(s.flowNodes.flowId, id));
      const edges = await db.select().from(s.flowEdges).where(eq(s.flowEdges.flowId, id));
      return {
        ...rows[0],
        nodes: nodes.map((n: any) => ({
          id: n.id,
          type: n.nodeType,
          title: n.title,
          description: n.description,
          position: n.position as { x: number; y: number },
          data: n.data,
        })),
        edges: edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          data: e.data,
        })),
      };
    },
  },
  funnels: {
    byPersonaId: async (personaId: string) => {
      if (useMockData) return MOCK_FUNNEL_AURORA;
      const rows = await db.select().from(s.salesFunnels).where(eq(s.salesFunnels.personaId, personaId));
      if (!rows[0]) return null;
      const id = rows[0].id;
      const nodes = await db.select().from(s.funnelNodes).where(eq(s.funnelNodes.funnelId, id));
      const edges = await db.select().from(s.funnelEdges).where(eq(s.funnelEdges.funnelId, id));
      return {
        ...rows[0],
        conversionRate: Number(rows[0].conversionRate),
        nodes: nodes.map((n: any) => ({
          id: n.id,
          type: n.nodeType,
          title: n.title,
          description: n.description,
          position: n.position as { x: number; y: number },
          data: n.data,
          metrics: n.metrics as any,
        })),
        edges: edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          data: e.data,
        })),
      };
    },
  },
  icpPains: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_ICP_PAINS.filter((p) => p.personaId === personaId);
      return db.select().from(s.icpPains).where(eq(s.icpPains.personaId, personaId));
    },
  },
  prompts: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_PROMPT_CHAINS.filter((p) => p.personaId === personaId);
      return db.select().from(s.promptChains).where(eq(s.promptChains.personaId, personaId));
    },
  },
  modeling: {
    list: async (personaId: string) => {
      if (useMockData) return MOCK_MODELING.filter((m) => m.personaId === personaId);
      return db.select().from(s.modelingProfiles).where(eq(s.modelingProfiles.personaId, personaId));
    },
  },
  team: {
    list: async (workspaceId?: string) => {
      if (useMockData) return MOCK_USERS;
      if (!workspaceId) return db.select().from(s.users);
      const rows = await db
        .select({
          id: s.users.id,
          email: s.users.email,
          fullName: s.users.fullName,
          avatarUrl: s.users.avatarUrl,
          role: s.workspaceMembers.role,
        })
        .from(s.users)
        .innerJoin(s.workspaceMembers, eq(s.workspaceMembers.userId, s.users.id))
        .where(eq(s.workspaceMembers.workspaceId, workspaceId));
      return rows;
    },
  },
  notifications: {
    list: async (userId: string) => {
      if (useMockData) return MOCK_NOTIFICATIONS;
      return db.select().from(s.notifications).where(eq(s.notifications.userId, userId));
    },
  },
  activity: {
    list: async (workspaceId: string) => {
      if (useMockData) return MOCK_ACTIVITY;
      const rows = await db
        .select({
          id: s.activityLogs.id,
          workspaceId: s.activityLogs.workspaceId,
          personaId: s.activityLogs.personaId,
          actorId: s.activityLogs.actorId,
          actorType: s.activityLogs.actorType,
          action: s.activityLogs.action,
          entityType: s.activityLogs.entityType,
          entityId: s.activityLogs.entityId,
          payload: s.activityLogs.payload,
          createdAt: s.activityLogs.createdAt,
          actor: {
            fullName: s.users.fullName,
            avatarUrl: s.users.avatarUrl,
          },
        })
        .from(s.activityLogs)
        .leftJoin(s.users, eq(s.activityLogs.actorId, s.users.id))
        .where(eq(s.activityLogs.workspaceId, workspaceId))
        .orderBy(s.activityLogs.createdAt);
      return rows.map((r: any) => ({
        ...r,
        actor: r.actor.fullName ? r.actor : null,
      }));
    },
  },
  aiActions: {
    list: async (workspaceId: string, personaId?: string) => {
      if (useMockData) return MOCK_AI_ACTIONS;
      const conditions = [eq(s.aiActions.workspaceId, workspaceId)];
      if (personaId) conditions.push(eq(s.aiActions.personaId, personaId));
      return db
        .select()
        .from(s.aiActions)
        .where(and(...conditions))
        .orderBy(s.aiActions.createdAt);
    },
  },
};

