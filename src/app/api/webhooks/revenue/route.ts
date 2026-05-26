import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financialTransactions, activityLogs } from "@/drizzle/schema";
import { useMockData } from "@/lib/config";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Corpo da requisição vazio" },
        { status: 400 },
      );
    }

    // Estrutura genérica do webhook de faturamento
    const {
      workspaceId,
      personaId,
      amount,
      description,
      source,
      transactionId,
      occurredAt,
    } = body;

    if (!workspaceId || !amount) {
      return NextResponse.json(
        { error: "workspaceId e amount são obrigatórios" },
        { status: 400 },
      );
    }

    if (useMockData) {
      return NextResponse.json({
        ok: true,
        message: "Faturamento registrado com sucesso (modo mock)",
        transaction: body,
      });
    }

    // Insere transação financeira
    const [newTx] = await db
      .insert(financialTransactions)
      .values({
        workspaceId,
        personaId: personaId || null,
        type: "revenue",
        status: "paid",
        source: (source || "gateway") as any,
        amount: amount.toString(),
        description:
          description || `Venda automática via gateway (${transactionId})`,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      })
      .returning();

    // Registra log de auditoria
    await db.insert(activityLogs).values({
      workspaceId,
      personaId: personaId || null,
      action: "webhook_revenue_received",
      entityType: "financial_transaction",
      entityId: newTx.id,
      payload: newTx,
    });

    return NextResponse.json({ ok: true, transactionId: newTx.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro no processamento do webhook de receita" },
      { status: 500 },
    );
  }
}
