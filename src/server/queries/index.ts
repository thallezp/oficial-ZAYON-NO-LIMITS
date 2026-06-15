/**
 * Camada de queries — server-side data access (Drizzle/Supabase, dados reais).
 */

import { db } from "@/lib/db";
import { supabaseServer } from "@/lib/supabase/server";
import { eq, and, sql, inArray, desc, isNull } from "drizzle-orm";
import * as s from "@/drizzle/schema";

interface ScopeFilter {
  workspaceId?: string;
  personaId?: string;
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

function isArchivedMetadata(metadata: unknown) {
  return Boolean((metadata as Record<string, unknown> | null)?.archivedAt);
}

async function getPersonaMetrics(id: string) {
  // PERF: estas 5 consultas são independentes — rodam em paralelo (Promise.all)
  // em vez de 5 round-trips sequenciais ao pooler. Reduz muito a latência do
  // bootstrap (que chama isto para cada persona).
  const [channels, txs, allLeads, content, pillarsRows] = await Promise.all([
    db.select().from(s.personaChannels).where(eq(s.personaChannels.personaId, id)),
    db.select().from(s.financialTransactions).where(eq(s.financialTransactions.personaId, id)),
    db.select().from(s.leads).where(eq(s.leads.personaId, id)),
    db.select().from(s.contentItems).where(eq(s.contentItems.personaId, id)),
    db.select().from(s.contentPillars).where(eq(s.contentPillars.personaId, id)),
  ]);

  const totalFollowers = channels.reduce((acc: number, c: any) => acc + (c.followers || 0), 0);

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

  const totalLeads = allLeads.length;

  const leadsPeriod = allLeads.filter((l: any) => l.createdAt && new Date(l.createdAt) >= thirtyDaysAgo).length;
  const leadsPeriodPrev = allLeads.filter((l: any) => l.createdAt && new Date(l.createdAt) >= sixtyDaysAgo && new Date(l.createdAt) < thirtyDaysAgo).length;
  const leadsDelta = leadsPeriodPrev > 0 ? ((leadsPeriod - leadsPeriodPrev) / leadsPeriodPrev) * 100 : 0;

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
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.tasks.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.tasks.personaId, filter.personaId));
      return db.select().from(s.tasks).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  projects: {
    list: async (filter?: ScopeFilter) => {
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
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.contentItems.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.contentItems.personaId, filter.personaId));
      
      const selectFields = {
        item: s.contentItems,
        ownerName: s.users.fullName,
        ownerAvatar: s.users.avatarUrl,
        ownerEmail: s.users.email,
      };

      const rows = await db
        .select(selectFields)
        .from(s.contentItems)
        .leftJoin(s.users, eq(s.contentItems.ownerId, s.users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      if (rows.length === 0) return [];
      const ids = rows.map((r: any) => r.item.id);
      const metrics = await db
        .select()
        .from(s.contentMetrics)
        .where(inArray(s.contentMetrics.contentItemId, ids));

      return rows.map((r: any) => {
        const it = r.item;
        const m = metrics.find((met: any) => met.contentItemId === it.id);
        return {
          ...it,
          owner: r.ownerName ? {
            id: it.ownerId,
            fullName: r.ownerName,
            avatarUrl: r.ownerAvatar,
            email: r.ownerEmail,
          } : null,
          metrics: m || null,
        };
      });
    },
  },
  leads: {
    list: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.leads.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.leads.personaId, filter.personaId));
      const rows = await db
        .select()
        .from(s.leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(s.leads.createdAt));

      const leads = rows.filter((row: any) => !isArchivedMetadata(row.metadata));
      if (leads.length === 0) return [];

      const leadIds = leads.map((lead: any) => lead.id);
      const sourceIds = Array.from(
        new Set(leads.map((lead: any) => lead.sourceId).filter(Boolean)),
      );
      const responsibleIds = Array.from(
        new Set(leads.map((lead: any) => lead.responsibleId).filter(Boolean)),
      );
      const personaIds = Array.from(
        new Set(leads.map((lead: any) => lead.personaId).filter(Boolean)),
      );

      const [answers, history, sources, responsibles, personas, comments, relatedTasks] =
        await Promise.all([
          db
            .select()
            .from(s.leadAnswers)
            .where(inArray(s.leadAnswers.leadId, leadIds)),
          db
            .select({
              id: s.leadStatusHistory.id,
              leadId: s.leadStatusHistory.leadId,
              fromStatus: s.leadStatusHistory.fromStatus,
              toStatus: s.leadStatusHistory.toStatus,
              changedAt: s.leadStatusHistory.changedAt,
              changedBy: {
                id: s.users.id,
                email: s.users.email,
                fullName: s.users.fullName,
                avatarUrl: s.users.avatarUrl,
                role: s.users.role,
              },
            })
            .from(s.leadStatusHistory)
            .leftJoin(s.users, eq(s.leadStatusHistory.changedBy, s.users.id))
            .where(inArray(s.leadStatusHistory.leadId, leadIds))
            .orderBy(desc(s.leadStatusHistory.changedAt)),
          sourceIds.length > 0
            ? db.select().from(s.leadSources).where(inArray(s.leadSources.id, sourceIds as string[]))
            : Promise.resolve([] as any[]),
          responsibleIds.length > 0
            ? db.select().from(s.users).where(inArray(s.users.id, responsibleIds as string[]))
            : Promise.resolve([] as any[]),
          personaIds.length > 0
            ? db
                .select({ id: s.personas.id, name: s.personas.name })
                .from(s.personas)
                .where(inArray(s.personas.id, personaIds as string[]))
            : Promise.resolve([] as any[]),
          db
            .select({
              id: s.comments.id,
              entityId: s.comments.entityId,
              content: s.comments.content,
              createdAt: s.comments.createdAt,
              author: {
                id: s.users.id,
                email: s.users.email,
                fullName: s.users.fullName,
                avatarUrl: s.users.avatarUrl,
                role: s.users.role,
              },
            })
            .from(s.comments)
            .leftJoin(s.users, eq(s.comments.userId, s.users.id))
            .where(
              and(
                eq(s.comments.entityType, "lead"),
                inArray(s.comments.entityId, leadIds),
              ),
            )
            .orderBy(desc(s.comments.createdAt)),
          filter?.workspaceId
            ? db
                .select()
                .from(s.tasks)
                .where(eq(s.tasks.workspaceId, filter.workspaceId))
            : Promise.resolve([] as any[]),
        ]);

      return leads.map((lead: any) => {
        const source = sources.find((item: any) => item.id === lead.sourceId);
        const responsible = responsibles.find((item: any) => item.id === lead.responsibleId) ?? null;
        const persona = personas.find((item: any) => item.id === lead.personaId) ?? null;

        return {
          ...lead,
          source: source?.name ?? (lead.metadata as any)?.source ?? null,
          responsible,
          persona,
          answers: answers
            .filter((answer: any) => answer.leadId === lead.id)
            .map((answer: any) => ({
              id: answer.id,
              question: answer.question,
              answer: answer.answer ?? "",
              createdAt: answer.createdAt,
            })),
          history: history
            .filter((entry: any) => entry.leadId === lead.id)
            .map((entry: any) => ({
              id: entry.id,
              fromStatus: entry.fromStatus,
              toStatus: entry.toStatus,
              changedAt: entry.changedAt,
              changedBy: entry.changedBy?.id ? entry.changedBy : null,
            })),
          comments: comments
            .filter((comment: any) => comment.entityId === lead.id)
            .map((comment: any) => ({
              id: comment.id,
              content: comment.content,
              createdAt: comment.createdAt,
              author: comment.author?.id ? comment.author : null,
            })),
          linkedTasks: relatedTasks
            .filter((task: any) => {
              const related = task.relatedEntity as any;
              return related?.type === "lead" && related?.id === lead.id;
            })
            .map((task: any) => ({
              id: task.id,
              title: task.title,
              status: task.status,
              priority: task.priority,
              dueAt: task.dueAt,
            })),
          archivedAt: (lead.metadata as any)?.archivedAt ?? null,
        };
      });
    },
  },
  finance: {
    list: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.financialTransactions.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.financialTransactions.personaId, filter.personaId));
      return db.select().from(s.financialTransactions).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
    payrollList: async (workspaceId: string) => {
      return db.select().from(s.payrollMembers).where(eq(s.payrollMembers.workspaceId, workspaceId));
    },
    billsList: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.bills.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.bills.personaId, filter.personaId));
      return db.select().from(s.bills).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  personas: {
    list: async (workspaceId?: string) => {
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
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.documents.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.documents.personaId, filter.personaId));
      return db.select().from(s.documents).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
    byId: async (id: string) => {
      const rows = await db.select().from(s.documents).where(eq(s.documents.id, id));
      return rows[0] || null;
    },
  },
  materials: {
    list: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.materials.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.materials.personaId, filter.personaId));
      return db.select().from(s.materials).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  folders: {
    list: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.folders.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.folders.personaId, filter.personaId));
      return db.select().from(s.folders).where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  contentHooks: {
    list: async (filter?: ScopeFilter) => {
      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.contentHooks.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.contentHooks.personaId, filter.personaId));
      return db
        .select()
        .from(s.contentHooks)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    },
  },
  followerSnapshots: {
    list: async (personaId: string) => {
      return db
        .select()
        .from(s.personaFollowerSnapshots)
        .where(eq(s.personaFollowerSnapshots.personaId, personaId))
        .orderBy(desc(s.personaFollowerSnapshots.snapshotDate));
    },
  },
  tools: {
    list: async (workspaceId?: string) => {
      
      const selectFields = {
        tool: s.tools,
        categoryName: s.toolCategories.name,
      };

      if (!workspaceId) {
        const rows = await db
          .select(selectFields)
          .from(s.tools)
          .leftJoin(s.toolCategories, eq(s.tools.categoryId, s.toolCategories.id));
        return rows.map((r: any) => {
          const t = r.tool;
          const meta = (t.metadata as any) || {};
          return {
            ...t,
            category: r.categoryName || "Outros",
            embedMode: meta.embedMode || "new_tab",
            brandColor: meta.brandColor || null,
            projectId: meta.projectId || null,
            documentId: meta.documentId || null,
            urlCheckedAt: meta.urlCheckedAt || null,
            urlStatus: meta.urlStatus || null,
          };
        });
      }

      const rows = await db
        .select(selectFields)
        .from(s.tools)
        .leftJoin(s.toolCategories, eq(s.tools.categoryId, s.toolCategories.id))
        .where(eq(s.tools.workspaceId, workspaceId));

      return rows.map((r: any) => {
        const t = r.tool;
        const meta = (t.metadata as any) || {};
        return {
          ...t,
          category: r.categoryName || "Outros",
          embedMode: meta.embedMode || "new_tab",
          brandColor: meta.brandColor || null,
          projectId: meta.projectId || null,
          documentId: meta.documentId || null,
          urlCheckedAt: meta.urlCheckedAt || null,
          urlStatus: meta.urlStatus || null,
        };
      });
    },
  },
  flows: {
    list: async (workspaceId?: string) => {
      if (!workspaceId) return db.select().from(s.flows);
      return db.select().from(s.flows).where(eq(s.flows.workspaceId, workspaceId));
    },
    byId: async (id: string) => {
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
      const rows = await db
        .select()
        .from(s.salesFunnels)
        .where(eq(s.salesFunnels.personaId, personaId))
        .orderBy(desc(s.salesFunnels.createdAt));
      if (!rows[0]) return null;
      const id = rows[0].id;
      const nodes = await db.select().from(s.funnelNodes).where(eq(s.funnelNodes.funnelId, id));
      const edges = await db.select().from(s.funnelEdges).where(eq(s.funnelEdges.funnelId, id));
      return {
        ...rows[0],
        conversionRate: Number(rows[0].conversionRate),
        nodes: nodes.map((n: any) => ({
          id: n.id,
          // node_type no banco é enum restrito; o tipo real (product, upsell...)
          // fica preservado em data.nodeType
          type: (n.data as any)?.nodeType ?? n.nodeType,
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
      return db.select().from(s.icpPains).where(eq(s.icpPains.personaId, personaId));
    },
  },
  prompts: {
    list: async (personaId: string) => {
      return db.select().from(s.promptChains).where(eq(s.promptChains.personaId, personaId));
    },
  },
  modeling: {
    list: async (personaId: string) => {
      return db.select().from(s.modelingProfiles).where(eq(s.modelingProfiles.personaId, personaId));
    },
  },
  modelingExamples: {
    list: async (profileId: string) => {
      return db
        .select()
        .from(s.modelingContentExamples)
        .where(eq(s.modelingContentExamples.profileId, profileId))
        .orderBy(desc(s.modelingContentExamples.createdAt));
    },
  },
  team: {
    list: async (workspaceId?: string) => {
      if (!workspaceId) return db.select().from(s.users);
      const rows = await db
        .select({
          id: s.users.id,
          email: s.users.email,
          fullName: s.users.fullName,
          avatarUrl: s.users.avatarUrl,
          role: s.workspaceMembers.role,
          joinedAt: s.workspaceMembers.joinedAt,
          metadata: s.users.metadata,
        })
        .from(s.users)
        .innerJoin(s.workspaceMembers, eq(s.workspaceMembers.userId, s.users.id))
        .where(eq(s.workspaceMembers.workspaceId, workspaceId));
      return rows;
    },
  },
  invitations: {
    list: async (workspaceId?: string) => {
      if (!workspaceId) return [];
      const rows = await db
        .select({
          id: s.invitations.id,
          email: s.invitations.email,
          role: s.invitations.role,
          token: s.invitations.token,
          accepted: s.invitations.accepted,
          expiresAt: s.invitations.expiresAt,
          createdAt: s.invitations.createdAt,
          invitedBy: s.invitations.invitedBy,
          inviter: {
            fullName: s.users.fullName,
            email: s.users.email,
          },
        })
        .from(s.invitations)
        .leftJoin(s.users, eq(s.invitations.invitedBy, s.users.id))
        .where(
          and(
            eq(s.invitations.workspaceId, workspaceId),
            eq(s.invitations.accepted, false),
          ),
        )
        .orderBy(desc(s.invitations.createdAt));
      return rows.map((r: any) => ({
        ...r,
        inviter: r.inviter?.fullName ? r.inviter : null,
      }));
    },
  },
  notifications: {
    list: async (userId: string) => {
      return db
        .select()
        .from(s.notifications)
        .where(
          and(
            eq(s.notifications.userId, userId),
            isNull(s.notifications.deletedAt)
          )
        )
        .orderBy(desc(s.notifications.createdAt));
    },
  },
  activity: {
    list: async (workspaceId: string) => {
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
  launch: {
    campaigns: async (filter?: ScopeFilter) => {

      const conditions = [];
      if (filter?.workspaceId) conditions.push(eq(s.launchCampaigns.workspaceId, filter.workspaceId));
      if (filter?.personaId) conditions.push(eq(s.launchCampaigns.personaId, filter.personaId));

      const campaigns = await db
        .select()
        .from(s.launchCampaigns)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(s.launchCampaigns.createdAt));

      if (campaigns.length === 0) return [];

      const campaignIds = campaigns.map((campaign: any) => campaign.id);
      const [events, copies] = await Promise.all([
        db
          .select()
          .from(s.launchEvents)
          .where(inArray(s.launchEvents.campaignId, campaignIds))
          .orderBy(s.launchEvents.startAt),
        db
          .select()
          .from(s.salesCopies)
          .where(inArray(s.salesCopies.campaignId, campaignIds))
          .orderBy(desc(s.salesCopies.updatedAt)),
      ]);

      return campaigns.map((campaign: any) => ({
        ...campaign,
        events: events.filter((event: any) => event.campaignId === campaign.id),
        copies: copies.filter((copy: any) => copy.campaignId === campaign.id),
      }));
    },
  },
  taskExtensions: {
    comments: async (taskId: string) => {
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
      return db
        .select()
        .from(s.tasks)
        .where(eq(s.tasks.parentTaskId, taskId))
        .orderBy(s.tasks.createdAt);
    },
  },
  study: {
    tracks: async (f?: ScopeFilter) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyTracks.workspaceId, f.workspaceId));
      if (f?.personaId)  conds.push(eq(s.studyTracks.personaId, f.personaId));
      const tracks = await db.select().from(s.studyTracks)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(s.studyTracks.sortOrder);
      if (!tracks.length) return [];
      const ids = tracks.map((t: any) => t.id);
      const [modules, sessions] = await Promise.all([
        db.select().from(s.studyModules).where(inArray(s.studyModules.trackId, ids)),
        db.select().from(s.focusSessions).where(inArray(s.focusSessions.trackId, ids)),
      ]);
      const modIds = modules.map((m: any) => m.id);
      const items = modIds.length
        ? await db.select().from(s.studyModuleItems).where(inArray(s.studyModuleItems.moduleId, modIds))
        : [];
      return tracks.map((t: any) => {
        const mods = modules.filter((m: any) => m.trackId === t.id).map((m: any) => ({
          ...m,
          items: items.filter((i: any) => i.moduleId === m.id),
        }));
        const allItems = mods.flatMap((m: any) => m.items);
        const done = allItems.filter((i: any) => i.status === "completed").length;
        const hoursDone = sessions.filter((x: any) => x.trackId === t.id)
          .reduce((a: number, x: any) => a + (x.actualMinutes || 0), 0) / 60;
        return {
          ...t,
          modules: mods,
          progress: allItems.length ? Math.round((done / allItems.length) * 100) : 0,
          hoursDone: Math.round(hoursDone),
        };
      });
    },
    resources: async (f?: ScopeFilter) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyResources.workspaceId, f.workspaceId));
      if (f?.personaId)  conds.push(eq(s.studyResources.personaId, f.personaId));
      return db.select().from(s.studyResources)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.studyResources.updatedAt));
    },
    objectives: async (f?: ScopeFilter) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyObjectives.workspaceId, f.workspaceId));
      if (f?.personaId)  conds.push(eq(s.studyObjectives.personaId, f.personaId));
      return db.select().from(s.studyObjectives)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.studyObjectives.createdAt));
    },
    goals: async (f?: ScopeFilter) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyGoals.workspaceId, f.workspaceId));
      if (f?.personaId)  conds.push(eq(s.studyGoals.personaId, f.personaId));
      return db.select().from(s.studyGoals)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.studyGoals.createdAt));
    },
    focusSessions: async (f: { workspaceId?: string; personaId?: string; userId?: string }) => {
      const conds = [];
      if (f.workspaceId) conds.push(eq(s.focusSessions.workspaceId, f.workspaceId));
      if (f.userId)      conds.push(eq(s.focusSessions.userId, f.userId));
      if (f.personaId)   conds.push(eq(s.focusSessions.personaId, f.personaId));
      return db.select().from(s.focusSessions)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.focusSessions.startedAt));
    },
    reviewsDue: async (f?: ScopeFilter & { userId?: string }) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyReviews.workspaceId, f.workspaceId));
      if (f?.userId)      conds.push(eq(s.studyReviews.userId, f.userId));
      conds.push(sql`${s.studyReviews.dueAt} <= now()`);
      return db.select().from(s.studyReviews)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(s.studyReviews.dueAt);
    },
    plans: async (f?: ScopeFilter & { userId?: string }) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyPlans.workspaceId, f.workspaceId));
      if (f?.userId)      conds.push(eq(s.studyPlans.userId, f.userId));
      return db.select().from(s.studyPlans)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.studyPlans.createdAt));
    },
    achievements: async (f?: ScopeFilter & { userId?: string }) => {
      const conds = [];
      if (f?.workspaceId) conds.push(eq(s.studyAchievements.workspaceId, f.workspaceId));
      if (f?.userId)      conds.push(eq(s.studyAchievements.userId, f.userId));
      return db.select().from(s.studyAchievements)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(s.studyAchievements.unlockedAt));
    },
    dashboard: async (f: ScopeFilter & { userId?: string }) => {
      const conds = [];
      if (f.workspaceId) conds.push(eq(s.focusSessions.workspaceId, f.workspaceId));
      if (f.userId)      conds.push(eq(s.focusSessions.userId, f.userId));
      if (f.personaId)   conds.push(eq(s.focusSessions.personaId, f.personaId));

      const settingsConds = [];
      if (f.workspaceId) settingsConds.push(eq(s.studySettings.workspaceId, f.workspaceId));
      if (f.userId)      settingsConds.push(eq(s.studySettings.userId, f.userId));
      
      const [sessions, tracks, reviews, achievements, settingsRows] = await Promise.all([
        db.select().from(s.focusSessions)
          .where(conds.length ? and(...conds) : undefined)
          .orderBy(desc(s.focusSessions.startedAt)),
        queries.study.tracks(f),
        queries.study.reviewsDue(f),
        queries.study.achievements(f),
        db.select().from(s.studySettings)
          .where(settingsConds.length ? and(...settingsConds) : undefined)
          .limit(1),
      ]);
      
      // Calculate streak
      let streak = 0;
      const sessionDates = new Set<string>();
      
      sessions.forEach((sess: any) => {
        if (sess.startedAt && sess.status === "completed") {
          const dateStr = new Date(sess.startedAt).toLocaleDateString("en-CA");
          sessionDates.add(dateStr);
        }
      });
      
      const sortedDates = Array.from(sessionDates).sort((a, b) => b.localeCompare(a));
      
      if (sortedDates.length > 0) {
        const todayStr = new Date().toLocaleDateString("en-CA");
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString("en-CA");
        
        if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
          streak = 1;
          let current = new Date(sortedDates[0]);
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDay = new Date(current);
            prevDay.setDate(prevDay.getDate() - 1);
            const prevDayStr = prevDay.toLocaleDateString("en-CA");
            
            if (sortedDates[i] === prevDayStr) {
              streak++;
              current = prevDay;
            } else {
              break;
            }
          }
        }
      }
      
      // Calculate weekly hours
      const now = new Date();
      const dayOfWeek = now.getDay();
      const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      let weeklyMinutes = 0;
      sessions.forEach((sess: any) => {
        if (sess.startedAt && sess.actualMinutes && sess.status === "completed") {
          const sessDate = new Date(sess.startedAt);
          if (sessDate >= startOfWeek) {
            weeklyMinutes += sess.actualMinutes;
          }
        }
      });
      const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10;
      
      return {
        streak,
        weeklyHours,
        sessions,
        tracks,
        reviews,
        achievements,
        settings: settingsRows[0] || null,
      };
    },
  },
};
