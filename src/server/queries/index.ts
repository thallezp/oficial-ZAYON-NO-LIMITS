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
import { supabaseServer } from "@/lib/supabase/server";
import { eq, and, sql, inArray } from "drizzle-orm";
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

function mapProject(row: any, taskCount?: { total: number; done: number }) {
  const total = taskCount?.total ?? 0;
  const done = taskCount?.done ?? 0;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    personaId: row.persona_id ?? undefined,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color ?? "#3b82f6",
    icon: row.icon ?? "Folder",
    status: row.status ?? "active",
    ownerId: row.owner_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    members: [],
    taskCount: { total, done },
    progress: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}

async function getPersonaMetrics(id: string) {
  const channels = await db.select().from(s.personaChannels).where(eq(s.personaChannels.personaId, id));
  const totalFollowers = channels.reduce((acc: number, c: any) => acc + (c.followers || 0), 0);

  const txs = await db.select().from(s.financialTransactions).where(eq(s.financialTransactions.personaId, id));
  const totalRevenue = txs
    .filter((t: any) => t.type === "revenue" && t.status === "paid")
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const revenuePeriod = txs
    .filter((t: any) => t.type === "revenue" && t.status === "paid" && new Date(t.occurredAt) >= thirtyDaysAgo)
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const revenuePeriodPrev = txs
    .filter((t: any) => t.type === "revenue" && t.status === "paid" && new Date(t.occurredAt) >= sixtyDaysAgo && new Date(t.occurredAt) < thirtyDaysAgo)
    .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

  const revenueDelta = revenuePeriodPrev > 0 ? ((revenuePeriod - revenuePeriodPrev) / revenuePeriodPrev) * 100 : 0;

  const allLeads = await db.select().from(s.leads).where(eq(s.leads.personaId, id));
  const totalLeads = allLeads.length;

  const leadsPeriod = allLeads.filter((l: any) => l.createdAt && new Date(l.createdAt) >= thirtyDaysAgo).length;
  const leadsPeriodPrev = allLeads.filter((l: any) => l.createdAt && new Date(l.createdAt) >= sixtyDaysAgo && new Date(l.createdAt) < thirtyDaysAgo).length;
  const leadsDelta = leadsPeriodPrev > 0 ? ((leadsPeriod - leadsPeriodPrev) / leadsPeriodPrev) * 100 : 0;

  const content = await db.select().from(s.contentItems).where(eq(s.contentItems.personaId, id));
  const postedContent = content.filter((c: any) => c.status === "posted");
  const totalPosts = postedContent.length;

  const contentIds = postedContent.map((c: any) => c.id);
  let totalViews = 0;
  let averageEngagement = 0;

  if (contentIds.length > 0) {
    const metrics = await db.select().from(s.contentMetrics).where(inArray(s.contentMetrics.contentItemId, contentIds));
    totalViews = metrics.reduce((sum: number, m: any) => sum + (m.views || 0), 0);
    const countWithEng = metrics.filter((m: any) => m.engagementRate !== null).length;
    const sumEng = metrics.reduce((sum: number, m: any) => sum + (m.engagementRate || 0), 0);
    averageEngagement = countWithEng > 0 ? sumEng / countWithEng : 0;
  }

  const paidSales = txs.filter((t: any) => t.type === "revenue" && t.status === "paid").length;
  const conversion = totalLeads > 0 ? (paidSales / totalLeads) * 100 : 0;

  const pillarsRows = await db.select().from(s.contentPillars).where(eq(s.contentPillars.personaId, id));
  const pillars = pillarsRows.map((p: any) => p.name);

  return {
    metrics: {
      revenue: totalRevenue,
      revenuePeriod,
      revenueDelta,
      followers: totalFollowers,
      followersDelta: 0,
      views: totalViews,
      viewsDelta: 0,
      engagement: averageEngagement,
      engagementDelta: 0,
      leads: totalLeads,
      leadsDelta,
      posts: totalPosts,
      conversion,
      conversionDelta: 0,
    },
    pillars,
    channels: channels.map((c: any) => ({
      channel: c.channel as any,
      handle: c.handle || undefined,
      url: c.url || undefined,
      followers: c.followers || 0,
    })),
  };
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
      const supabase = supabaseServer();
      let query = supabase
        .from("projects")
        .select("id, workspace_id, persona_id, name, description, color, icon, status, owner_id, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (filter?.workspaceId) query = query.eq("workspace_id", filter.workspaceId);
      if (filter?.personaId) query = query.eq("persona_id", filter.personaId);

      const { data: projects, error } = await query;
      if (error) throw new Error(error.message);

      const projectIds = (projects ?? []).map((project) => project.id);
      if (projectIds.length === 0) return [];

      const { data: tasks } = await supabase
        .from("tasks")
        .select("project_id, status")
        .in("project_id", projectIds);

      const counts = new Map<string, { total: number; done: number }>();
      (tasks ?? []).forEach((task) => {
        if (!task.project_id) return;
        const current = counts.get(task.project_id) ?? { total: 0, done: 0 };
        current.total += 1;
        if (task.status === "done") current.done += 1;
        counts.set(task.project_id, current);
      });

      return (projects ?? []).map((project) => mapProject(project, counts.get(project.id)));
    },
  },
  content: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return matchScope(MOCK_CONTENT, filter);
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.contentItems.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.contentItems.personaId, filter.personaId));
      const items = await db.select().from(s.contentItems).where(conditions.length > 0 ? and(...conditions) : undefined);
      if (items.length === 0) return [];
      const ids = items.map((it: any) => it.id);
      const metrics = await db.select().from(s.contentMetrics).where(inArray(s.contentMetrics.contentItemId, ids));
      return items.map((it: any) => {
        const m = metrics.find((met: any) => met.contentItemId === it.id);
        return {
          ...it,
          metrics: m || null,
        };
      });
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
      let rows;
      if (!workspaceId) {
        rows = await db.select().from(s.personas);
      } else {
        rows = await db.select().from(s.personas).where(eq(s.personas.workspaceId, workspaceId));
      }
      return Promise.all(
        rows.map(async (row: any) => {
          const details = await getPersonaMetrics(row.id);
          return {
            ...row,
            ...details,
          };
        })
      );
    },
    byId: async (id: string) => {
      if (useMockData) return MOCK_PERSONAS.find((p) => p.id === id);
      const rows = await db.select().from(s.personas).where(eq(s.personas.id, id));
      if (!rows[0]) return null;
      const details = await getPersonaMetrics(id);
      return {
        ...rows[0],
        ...details,
      };
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
  folders: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return [] as any[];
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.folders.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.folders.personaId, filter.personaId));
      return db.select().from(s.folders).where(conditions.length > 0 ? and(...conditions) : undefined);
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
        actor: r.actor?.fullName ? r.actor : null,
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
  calendar: {
    list: async (filter?: ScopeFilter) => {
      if (useMockData) return [];
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.calendarEvents.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.calendarEvents.personaId, filter.personaId));
      return db
        .select()
        .from(s.calendarEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(s.calendarEvents.startAt);
    },
  },
  taskExtensions: {
    comments: async (taskId: string) => {
      if (useMockData) return [];
      const rows = await db
        .select({
          id: s.taskComments.id,
          taskId: s.taskComments.taskId,
          authorId: s.taskComments.authorId,
          body: s.taskComments.body,
          createdAt: s.taskComments.createdAt,
          author: {
            fullName: s.users.fullName,
            avatarUrl: s.users.avatarUrl,
          },
        })
        .from(s.taskComments)
        .leftJoin(s.users, eq(s.taskComments.authorId, s.users.id))
        .where(eq(s.taskComments.taskId, taskId))
        .orderBy(s.taskComments.createdAt);
      return rows;
    },
    subtasks: async (taskId: string) => {
      if (useMockData) return [];
      return db
        .select()
        .from(s.tasks)
        .where(eq(s.tasks.parentTaskId, taskId))
        .orderBy(s.tasks.createdAt);
    },
  },
};
