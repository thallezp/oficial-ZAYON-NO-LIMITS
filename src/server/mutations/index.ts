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

