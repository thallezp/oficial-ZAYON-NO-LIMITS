import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  leads,
  leadAnswers,
  leadStatusHistory,
  leadSources,
  activityLogs,
  googleSheetsConnections,
} from "@/drizzle/schema";
import { eq, and, ilike } from "drizzle-orm";

async function resolveLeadSourceId(
  workspaceId: string,
  personaId?: string | null,
  source?: string | null,
) {
  const normalized = source?.trim();
  if (!normalized) return null;

  const [existing] = await db
    .select()
    .from(leadSources)
    .where(
      and(
        eq(leadSources.workspaceId, workspaceId),
        ilike(leadSources.name, normalized),
      ),
    );

  if (existing) return existing.id;

  const [created] = await db
    .insert(leadSources)
    .values({
      workspaceId,
      personaId: personaId || null,
      name: normalized,
      type: "webhook",
      metadata: { source: "webhook" },
    })
    .returning();

  return created.id;
}

const LeadPayload = z.object({
  source: z.string().default("Google Sheets"),
  campaign: z.string().optional(),
  personaId: z.string().optional(),
  workspaceId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
  metadata: z.record(z.any()).optional(),
  secret: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = LeadPayload.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    let workspaceId = data.workspaceId || null;
    let personaId = data.personaId || null;

    // Se houver um secret, obter o workspace correspondente da conexão cadastrada
    if (data.secret) {
      const [conn] = await db
        .select()
        .from(googleSheetsConnections)
        .where(eq(googleSheetsConnections.webhookSecret, data.secret));
      if (conn) {
        workspaceId = conn.workspaceId;
        personaId = conn.personaId || personaId;
      }
    }

    // Se ainda não temos o workspace_id, falhar
    if (!workspaceId) {
      return NextResponse.json(
        { ok: false, error: "workspaceId ou secret válido é obrigatório" },
        { status: 400 },
      );
    }

    const sourceId = await resolveLeadSourceId(
      workspaceId,
      personaId || null,
      data.source,
    );

    // Salvar o Lead no banco de dados real
    const [newLead] = await db
      .insert(leads)
      .values({
        workspaceId,
        personaId: personaId || null,
        sourceId,
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        instagram: data.instagram || null,
        campaign: data.campaign || null,
        status: "open",
        score: 50,
        metadata: data.metadata
          ? { ...data.metadata, source: data.source }
          : { source: data.source },
      })
      .returning();

    await db.insert(leadStatusHistory).values({
      leadId: newLead.id,
      fromStatus: null,
      toStatus: "open",
    });

    // Se houver respostas do formulário
    if (data.answers && Array.isArray(data.answers)) {
      for (const ans of data.answers) {
        await db.insert(leadAnswers).values({
          leadId: newLead.id,
          question: ans.question,
          answer: ans.answer || "",
          raw: ans,
        });
      }
    }

    // Registrar o log de auditoria
    await db.insert(activityLogs).values({
      workspaceId,
      personaId: personaId || null,
      action: "webhook_lead_received",
      entityType: "lead",
      entityId: newLead.id,
      payload: newLead,
    });

    return NextResponse.json({
      ok: true,
      leadId: newLead.id,
      received_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[leads webhook] Erro:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Erro interno ao processar webhook" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST a JSON payload (source, name, email, phone, answers, secret, workspaceId) to ingest a lead.",
  });
}
