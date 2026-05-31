import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, leadAnswers, activityLogs } from "@/drizzle/schema";
import { leadSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição vazio" },
        { status: 400 },
      );
    }

    const {
      workspaceId,
      personaId,
      name,
      email,
      phone,
      instagram,
      campaign,
      source,
      answers,
    } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId é obrigatório" },
        { status: 400 },
      );
    }

    // Valida com o schema do lead
    const validated = leadSchema.safeParse({
      name,
      email,
      phone,
      instagram,
      campaign,
      source,
      personaId,
    });

    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Dados de lead inválidos",
          details: validated.error.flatten(),
        },
        { status: 400 },
      );
    }


    // Salva no banco de dados real
    const [newLead] = await db
      .insert(leads)
      .values({
        workspaceId,
        personaId: personaId || null,
        name: name || null,
        email: email || null,
        phone: phone || null,
        instagram: instagram || null,
        campaign: campaign || null,
        status: "open",
      })
      .returning();

    // Se houver respostas de formulário personalizadas
    if (answers && Array.isArray(answers)) {
      for (const ans of answers) {
        await db.insert(leadAnswers).values({
          leadId: newLead.id,
          question: ans.question,
          answer: ans.answer || "",
          raw: ans,
        });
      }
    }

    // Registra log de auditoria
    await db.insert(activityLogs).values({
      workspaceId,
      personaId: personaId || null,
      action: "webhook_lead_created",
      entityType: "lead",
      entityId: newLead.id,
      payload: newLead,
    });

    return NextResponse.json({ ok: true, leadId: newLead.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro no processamento do webhook" },
      { status: 500 },
    );
  }
}
