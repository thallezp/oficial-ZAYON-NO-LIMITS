"use server";

/**
 * Server Actions / mutations.
 *
 * Persiste no banco Supabase/Drizzle quando useMockData = false.
 * Cada mutation:
 *   1. valida com schema Zod
 *   2. checar permissão via Supabase Auth
 *   3. registra activity_log
 *   4. revalida cache (revalidatePath)
 */

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as s from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { supabaseServer } from "@/lib/supabase/server";
import { useMockData } from "@/lib/config";
import {
  taskSchema,
  contentSchema,
  leadSchema,
  financialSchema,
  personaSchema,
} from "@/lib/validations";

async function getAuthUser() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function writeAuditLog(
  workspaceId: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  payload: any,
) {
  try {
    await db.insert(s.activityLogs).values({
      workspaceId,
      actorId,
      actorType: "user",
      action,
      entityType,
      entityId,
      payload,
    });
  } catch (err) {
    console.error("Erro ao registrar log de atividade:", err);
  }
}

export async function createTask(input: any) {
  const data = taskSchema.parse(input);

  if (useMockData) {
    revalidatePath("/tasks");
    return { ok: true, data };
  }

  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");

  const [newTask] = await db
    .insert(s.tasks)
    .values({
      workspaceId,
      personaId: data.personaId || null,
      projectId: data.projectId || null,
      title: data.title,
      description: data.description || null,
      status: data.status as any,
      priority: data.priority as any,
      creatorId: user.id,
      assigneeId: input.assigneeId || null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      labels: data.labels || null,
    })
    .returning();

  await writeAuditLog(
    workspaceId,
    user.id,
    "create_task",
    "task",
    newTask.id,
    newTask,
  );

  revalidatePath("/tasks");
  return { ok: true, data: newTask };
}

export async function createContent(input: any) {
  const data = contentSchema.parse(input);

  if (useMockData) {
    revalidatePath(`/personas/${data?.["personaId" as never] ?? ""}/content`);
    return { ok: true, data };
  }

  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");

  const [newContent] = await db
    .insert(s.contentItems)
    .values({
      workspaceId,
      personaId: input.personaId || null,
      channel: data.channel as any,
      contentType: data.contentType as any,
      title: data.title,
      hook: data.hook || null,
      script: data.script || null,
      caption: data.caption || null,
      pillar: (data.pillar as any) || null,
      status: data.status as any,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      ownerId: user.id,
    })
    .returning();

  await writeAuditLog(
    workspaceId,
    user.id,
    "create_content",
    "content_item",
    newContent.id,
    newContent,
  );

  revalidatePath(`/personas/${input.personaId ?? ""}/content`);
  return { ok: true, data: newContent };
}

export async function createLead(input: any) {
  const data = leadSchema.parse(input);

  if (useMockData) {
    return { ok: true, data };
  }

  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");

  const [newLead] = await db
    .insert(s.leads)
    .values({
      workspaceId,
      personaId: data.personaId || null,
      name: data.name || null,
      email: data.email || null,
      phone: data.phone || null,
      instagram: data.instagram || null,
      campaign: data.campaign || null,
      sourceId: input.sourceId || null,
      status: "open",
    })
    .returning();

  await writeAuditLog(
    workspaceId,
    user.id,
    "create_lead",
    "lead",
    newLead.id,
    newLead,
  );

  return { ok: true, data: newLead };
}

export async function createFinancial(input: any) {
  const data = financialSchema.parse(input);

  if (useMockData) {
    return { ok: true, data };
  }

  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");

  const [newTransaction] = await db
    .insert(s.financialTransactions)
    .values({
      workspaceId,
      personaId: data.personaId || null,
      type: data.type as any,
      status: data.status as any,
      source: data.source as any,
      amount: data.amount.toString(),
      description: data.description || null,
      occurredAt: new Date(data.occurredAt),
      createdBy: user.id,
    })
    .returning();

  await writeAuditLog(
    workspaceId,
    user.id,
    "create_financial",
    "financial_transaction",
    newTransaction.id,
    newTransaction,
  );

  return { ok: true, data: newTransaction };
}

export async function upsertPersona(input: any) {
  const data = personaSchema.parse(input);

  if (useMockData) {
    revalidatePath("/personas");
    return { ok: true, data };
  }

  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");

  let persona;
  if (input.id) {
    // Update
    [persona] = await db
      .update(s.personas)
      .set({
        name: data.name,
        codename: data.codename || null,
        status: data.status as any,
        niche: data.niche || null,
        bigIdea: data.bigIdea || null,
        bioShort: data.bioShort || null,
        voiceTone: data.voiceTone || null,
        archetype: data.archetype || null,
        updatedAt: new Date(),
      })
      .where(eq(s.personas.id, input.id))
      .returning();

    await writeAuditLog(
      workspaceId,
      user.id,
      "update_persona",
      "persona",
      persona.id,
      persona,
    );
  } else {
    // Insert
    [persona] = await db
      .insert(s.personas)
      .values({
        workspaceId,
        name: data.name,
        codename: data.codename || null,
        status: data.status as any,
        niche: data.niche || null,
        bigIdea: data.bigIdea || null,
        bioShort: data.bioShort || null,
        voiceTone: data.voiceTone || null,
        archetype: data.archetype || null,
        ownerId: user.id,
      })
      .returning();

    await writeAuditLog(
      workspaceId,
      user.id,
      "create_persona",
      "persona",
      persona.id,
      persona,
    );
  }

  revalidatePath("/personas");
  return { ok: true, data: persona };
}

// Novos Mutations reais do sistema ZAYON No Limits
export async function updateTaskStatusAndPosition(id: string, status: any, position?: number) {
  if (useMockData) {
    revalidatePath("/tasks");
    return { ok: true };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [updated] = await db
    .update(s.tasks)
    .set({ status, position: position ?? null, updatedAt: new Date() })
    .where(eq(s.tasks.id, id))
    .returning();
  revalidatePath("/tasks");
  return { ok: true, data: updated };
}

export async function updateTask(id: string, input: any) {
  if (useMockData) {
    revalidatePath("/tasks");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [updated] = await db
    .update(s.tasks)
    .set({
      title: input.title,
      description: input.description || null,
      status: input.status,
      priority: input.priority,
      assigneeId: input.assigneeId || null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      labels: input.labels || null,
      updatedAt: new Date(),
    })
    .where(eq(s.tasks.id, id))
    .returning();
  revalidatePath("/tasks");
  return { ok: true, data: updated };
}

export async function createDocument(input: any) {
  if (useMockData) {
    revalidatePath("/documents");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");
  const [newDoc] = await db
    .insert(s.documents)
    .values({
      workspaceId,
      personaId: input.personaId || null,
      title: input.title,
      emoji: input.emoji || "📄",
      content: input.content || null,
      type: input.type || "doc",
      authorId: user.id,
    })
    .returning();
  revalidatePath("/documents");
  return { ok: true, data: newDoc };
}

export async function updateDocumentContent(id: string, content: string, title?: string) {
  if (useMockData) return { ok: true };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [updated] = await db
    .update(s.documents)
    .set({ content, title: title ?? undefined, updatedAt: new Date() })
    .where(eq(s.documents.id, id))
    .returning();
  return { ok: true, data: updated };
}

export async function createMaterial(input: any) {
  if (useMockData) {
    revalidatePath("/materials");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const workspaceId = input.workspaceId;
  if (!workspaceId) throw new Error("workspaceId é obrigatório");
  const [newMaterial] = await db
    .insert(s.materials)
    .values({
      workspaceId,
      personaId: input.personaId || null,
      title: input.title,
      fileUrl: input.fileUrl,
      fileType: input.fileType || "other",
      sizeBytes: input.sizeBytes || null,
      uploadedBy: user.id,
    })
    .returning();
  revalidatePath("/materials");
  return { ok: true, data: newMaterial };
}

export async function saveFunnelData(funnelId: string, nodes: any[], edges: any[], conversionRate?: number) {
  if (useMockData) return { ok: true };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  await db.delete(s.funnelNodes).where(eq(s.funnelNodes.funnelId, funnelId));
  await db.delete(s.funnelEdges).where(eq(s.funnelEdges.funnelId, funnelId));
  
  if (nodes.length > 0) {
    await db.insert(s.funnelNodes).values(
      nodes.map((n) => ({
        id: n.id,
        funnelId,
        nodeType: n.type || "custom",
        title: n.title || n.data?.title || "",
        description: n.description || n.data?.description || "",
        position: n.position,
        data: n.data || null,
        metrics: n.metrics || n.data?.metrics || null,
      }))
    );
  }
  if (edges.length > 0) {
    await db.insert(s.funnelEdges).values(
      edges.map((e) => ({
        id: e.id,
        funnelId,
        source: e.source,
        target: e.target,
        label: e.label || null,
        data: e.data || null,
      }))
    );
  }
  if (conversionRate !== undefined) {
    await db.update(s.salesFunnels).set({ conversionRate: conversionRate.toString(), updatedAt: new Date() }).where(eq(s.salesFunnels.id, funnelId));
  }
  return { ok: true };
}

export async function saveFlowData(flowId: string, nodes: any[], edges: any[]) {
  if (useMockData) return { ok: true };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  await db.delete(s.flowNodes).where(eq(s.flowNodes.flowId, flowId));
  await db.delete(s.flowEdges).where(eq(s.flowEdges.flowId, flowId));
  if (nodes.length > 0) {
    await db.insert(s.flowNodes).values(
      nodes.map((n) => ({
        id: n.id,
        flowId,
        nodeType: n.type || "custom",
        title: n.title || n.data?.title || "",
        description: n.description || n.data?.description || "",
        position: n.position,
        data: n.data || null,
      }))
    );
  }
  if (edges.length > 0) {
    await db.insert(s.flowEdges).values(
      edges.map((e) => ({
        id: e.id,
        flowId,
        source: e.source,
        target: e.target,
        label: e.label || null,
        data: e.data || null,
      }))
    );
  }
  await db.update(s.flows).set({ updatedAt: new Date() }).where(eq(s.flows.id, flowId));
  return { ok: true };
}

export async function createFlow(input: any) {
  if (useMockData) {
    revalidatePath("/flows");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [newFlow] = await db
    .insert(s.flows)
    .values({
      workspaceId: input.workspaceId,
      personaId: input.personaId || null,
      name: input.name,
      description: input.description || null,
      type: input.type || "process",
      icon: input.icon || "Workflow",
      color: input.color || "#5b8cff",
      ownerId: user.id,
    })
    .returning();
  revalidatePath("/flows");
  return { ok: true, data: newFlow };
}

export async function createTool(input: any) {
  if (useMockData) {
    revalidatePath("/tools");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [newTool] = await db
    .insert(s.tools)
    .values({
      workspaceId: input.workspaceId,
      personaId: input.personaId || null,
      name: input.name,
      description: input.description || null,
      url: input.url,
      iconSlug: input.iconSlug || null,
      brandColor: input.brandColor || null,
      category: input.category || "IA",
    })
    .returning();
  revalidatePath("/tools");
  return { ok: true, data: newTool };
}

export async function toggleToolFavorite(toolId: string) {
  if (useMockData) {
    revalidatePath("/tools");
    revalidatePath("/dashboard");
    return { ok: true };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [tool] = await db.select().from(s.tools).where(eq(s.tools.id, toolId));
  if (!tool) throw new Error("Ferramenta não encontrada");
  const [updated] = await db
    .update(s.tools)
    .set({ isFavorite: !tool.isFavorite })
    .where(eq(s.tools.id, toolId))
    .returning();
  revalidatePath("/tools");
  revalidatePath("/dashboard");
  return { ok: true, data: updated };
}

export async function createProject(input: any) {
  if (useMockData) {
    revalidatePath("/projects");
    return { ok: true, data: input };
  }
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [newProject] = await db
    .insert(s.projects)
    .values({
      workspaceId: input.workspaceId,
      personaId: input.personaId || null,
      name: input.name,
      description: input.description || null,
      color: input.color || "#3b82f6",
      icon: input.icon || "Folder",
      status: "active",
      ownerId: user.id,
    })
    .returning();
  revalidatePath("/projects");
  return { ok: true, data: newProject };
}

export async function updateLead(id: string, input: any) {
  if (useMockData) return { ok: true, data: input };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");
  const [updated] = await db
    .update(s.leads)
    .set({
      name: input.name || undefined,
      email: input.email || undefined,
      phone: input.phone || undefined,
      instagram: input.instagram || undefined,
      campaign: input.campaign || undefined,
      status: input.status,
      score: input.score !== undefined ? Number(input.score) : undefined,
      notes: input.notes || undefined,
      updatedAt: new Date(),
    })
    .where(eq(s.leads.id, id))
    .returning();
  return { ok: true, data: updated };
}

export async function updateUserMetadata(metadata: any) {
  if (useMockData) return { ok: true, data: metadata };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const [dbUser] = await db.select().from(s.users).where(eq(s.users.id, user.id));
  if (!dbUser) throw new Error("Usuário não encontrado");

  const currentMetadata = (dbUser.metadata as Record<string, any>) || {};
  const updatedMetadata = { ...currentMetadata, ...metadata };

  const [updated] = await db
    .update(s.users)
    .set({
      metadata: updatedMetadata,
      updatedAt: new Date(),
    })
    .where(eq(s.users.id, user.id))
    .returning();

  return { ok: true, data: updated };
}

export async function sanitizeDatabaseEncoding() {
  if (useMockData) return { ok: true };
  const user = await getAuthUser();
  if (!user) throw new Error("Não autorizado");

  const clean = (str: string | null | undefined): string | null => {
    if (!str) return null;
    return str
      .replace(/Ã§/g, "ç")
      .replace(/Ã£/g, "ã")
      .replace(/Ãµ/g, "õ")
      .replace(/Ã¡/g, "á")
      .replace(/Ã©/g, "é")
      .replace(/Ã­/g, "í")
      .replace(/Ã³/g, "ó")
      .replace(/Ãº/g, "ú")
      .replace(/Ã¢/g, "â")
      .replace(/Ãª/g, "ê")
      .replace(/Ã´/g, "ô")
      .replace(/Ã€/g, "À")
      .replace(/Ã/g, "Á")
      .replace(/Ã‰/g, "É")
      .replace(/Ã“/g, "Ó")
      .replace(/Ãš/g, "Ú")
      .replace(/Ã‡/g, "Ç")
      .replace(/Ãƒ/g, "Ã");
  };

  // Sanitize tools
  const dbTools = await db.select().from(s.tools);
  for (const t of dbTools) {
    const nextName = clean(t.name);
    const nextDesc = clean(t.description);
    const nextCat = clean(t.category);
    if (nextName !== t.name || nextDesc !== t.description || nextCat !== t.category) {
      await db
        .update(s.tools)
        .set({
          name: nextName || t.name,
          description: nextDesc,
          category: nextCat || t.category,
          updatedAt: new Date(),
        })
        .where(eq(s.tools.id, t.id));
    }
  }

  // Sanitize personas
  const dbPersonas = await db.select().from(s.personas);
  for (const p of dbPersonas) {
    const nextName = clean(p.name);
    const nextNiche = clean(p.niche);
    const nextBigIdea = clean(p.bigIdea);
    const nextBio = clean(p.bioShort);
    const nextVoice = clean(p.voiceTone);
    const nextArch = clean(p.archetype);
    if (
      nextName !== p.name ||
      nextNiche !== p.niche ||
      nextBigIdea !== p.bigIdea ||
      nextBio !== p.bioShort ||
      nextVoice !== p.voiceTone ||
      nextArch !== p.archetype
    ) {
      await db
        .update(s.personas)
        .set({
          name: nextName || p.name,
          niche: nextNiche,
          bigIdea: nextBigIdea,
          bioShort: nextBio,
          voiceTone: nextVoice,
          archetype: nextArch,
          updatedAt: new Date(),
        })
        .where(eq(s.personas.id, p.id));
    }
  }

  // Sanitize projects
  const dbProjects = await db.select().from(s.projects);
  for (const pr of dbProjects) {
    const nextName = clean(pr.name);
    const nextDesc = clean(pr.description);
    if (nextName !== pr.name || nextDesc !== pr.description) {
      await db
        .update(s.projects)
        .set({
          name: nextName || pr.name,
          description: nextDesc,
          updatedAt: new Date(),
        })
        .where(eq(s.projects.id, pr.id));
    }
  }

  return { ok: true };
}



