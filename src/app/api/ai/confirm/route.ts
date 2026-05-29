/**
 * POST /api/ai/confirm
 *
 * Recebe um ai_action_id que está aguardando confirmação
 * (status='queued' + input.__awaitingConfirmation=true) e executa a
 * mutação real associada, escrevendo:
 *  - ai_actions (status → running → completed/failed)
 *  - ai_tool_calls
 *  - activity_logs
 *
 * POST /api/ai/confirm  body: { actionId: string, decision: 'confirm' | 'cancel' }
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as s from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 30;

type ToolName =
  | "qualifyLead"
  | "createFunnelNode"
  | "createLaunchPlan"
  | "insightToTask";

async function executeDeferred(toolName: ToolName, args: any, wsId: string, persId: string | null) {
  switch (toolName) {
    case "qualifyLead": {
      const patch: any = {
        score: args.score,
        notes: args.rationale,
        updatedAt: new Date(),
      };
      if (args.status) patch.status = args.status;
      const [updated] = await db
        .update(s.leads)
        .set(patch)
        .where(eq(s.leads.id, args.leadId))
        .returning();
      return updated;
    }
    case "createFunnelNode": {
      const [node] = await db
        .insert(s.funnelNodes)
        .values({
          funnelId: args.funnelId,
          nodeType: args.nodeType,
          title: args.title,
          description: args.description || null,
          position: { x: 0, y: 0 },
          data: {},
        })
        .returning();
      return node;
    }
    case "createLaunchPlan": {
      const [campaign] = await db
        .insert(s.launchCampaigns)
        .values({
          workspaceId: wsId,
          personaId: persId || null,
          name: args.name,
          description: args.description || null,
          goal: args.goal || null,
          startsAt: args.startsAt,
          endsAt: args.endsAt,
          status: "planning",
        })
        .returning();
      const events = await Promise.all(
        (args.events || []).map((evt: any) =>
          db
            .insert(s.launchEvents)
            .values({
              campaignId: campaign.id,
              title: evt.title,
              description: evt.description || null,
              startAt: new Date(evt.startAt),
              endAt: evt.endAt ? new Date(evt.endAt) : null,
              type: evt.type || "milestone",
            })
            .returning()
            .then((rows: any[]) => rows[0]),
        ),
      );
      return { campaign, events, count: events.length };
    }
    case "insightToTask": {
      const [task] = await db
        .insert(s.tasks)
        .values({
          workspaceId: wsId,
          personaId: persId || null,
          title: args.taskTitle,
          description: `${args.taskDescription || ""}\n\n💡 Insight base: ${args.insight}`.trim(),
          priority: args.priority || "medium",
          status: "todo",
          dueAt: args.dueAt ? new Date(args.dueAt) : null,
          labels: ["IA", "insight"],
        })
        .returning();
      await db.insert(s.activityLogs).values({
        workspaceId: wsId,
        personaId: persId || null,
        action: "ai_insight_to_task",
        actorType: "ai",
        entityType: "task",
        entityId: task.id,
        payload: { insight: args.insight, taskId: task.id },
      });
      return task;
    }
    default:
      throw new Error(`Ferramenta '${toolName}' não suporta confirmação deferida.`);
  }
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { actionId, decision } = body || {};
  if (!actionId || !["confirm", "cancel"].includes(decision)) {
    return NextResponse.json(
      { error: "Esperado { actionId, decision: 'confirm' | 'cancel' }" },
      { status: 400 },
    );
  }

  const [action] = await db
    .select()
    .from(s.aiActions)
    .where(eq(s.aiActions.id, actionId))
    .limit(1);

  if (!action) {
    return NextResponse.json({ error: "ação não encontrada" }, { status: 404 });
  }

  const input = (action.input as any) || {};
  if (!input.__awaitingConfirmation) {
    return NextResponse.json(
      { error: "ação não está aguardando confirmação" },
      { status: 409 },
    );
  }

  // Strip a flag de controle antes de executar / persistir
  const { __awaitingConfirmation, ...cleanArgs } = input;

  if (decision === "cancel") {
    await db
      .update(s.aiActions)
      .set({
        status: "failed",
        error: "Cancelado pelo usuário antes da execução",
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, action.id));
    await db.insert(s.activityLogs).values({
      workspaceId: action.workspaceId,
      personaId: action.personaId,
      action: `ai_${action.name}_cancelled`,
      actorType: "ai",
      entityType: action.name,
      entityId: action.id,
      payload: { cancelled: true },
    });
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  // decision === "confirm"
  await db
    .update(s.aiActions)
    .set({ status: "running", startedAt: new Date(), input: cleanArgs })
    .where(eq(s.aiActions.id, action.id));

  try {
    const result = await executeDeferred(
      action.name as ToolName,
      cleanArgs,
      action.workspaceId,
      action.personaId,
    );

    await db
      .update(s.aiActions)
      .set({
        status: "completed",
        output: result,
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, action.id));

    await db.insert(s.aiToolCalls).values({
      actionId: action.id,
      toolName: action.name,
      args: cleanArgs,
      result,
    });

    await db.insert(s.activityLogs).values({
      workspaceId: action.workspaceId,
      personaId: action.personaId,
      action: `ai_${action.name}`,
      actorType: "ai",
      entityType: action.name.replace(/^create|^update|^qualify/i, "").toLowerCase() || null,
      entityId: (result as any)?.id ? String((result as any).id) : null,
      payload: result,
    });

    return NextResponse.json({ ok: true, status: "completed", result });
  } catch (err: any) {
    await db
      .update(s.aiActions)
      .set({
        status: "failed",
        error: err.message || String(err),
        finishedAt: new Date(),
      })
      .where(eq(s.aiActions.id, action.id));

    await db.insert(s.aiToolCalls).values({
      actionId: action.id,
      toolName: action.name,
      args: cleanArgs,
      error: err.message || String(err),
    });

    return NextResponse.json(
      { ok: false, status: "failed", error: err.message || String(err) },
      { status: 500 },
    );
  }
}
