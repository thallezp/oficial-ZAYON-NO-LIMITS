import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import * as s from "@/drizzle/schema";

export const dynamic = "force-dynamic";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  req: Request,
  { params }: { params: { type: string } },
) {
  const { type } = params;
  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get("personaId");
  const workspaceId = searchParams.get("workspaceId");

  let headers: string[] = [];
  let rows: string[][] = [];

  if (type === "leads") {
    headers = [
      "id",
      "name",
      "email",
      "phone",
      "instagram",
      "source",
      "campaign",
      "status",
      "score",
      "convertedValue",
      "createdAt",
    ];

    let items: any[] = [];
    {
      const conditions = [];
      if (workspaceId) conditions.push(eq(s.leads.workspaceId, workspaceId));
      if (personaId) conditions.push(eq(s.leads.personaId, personaId));
      const leadRows = await db
        .select()
        .from(s.leads)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      const sourceIds = Array.from(
        new Set(leadRows.map((lead: any) => lead.sourceId).filter(Boolean)),
      );
      const sourceRows =
        sourceIds.length > 0
          ? await db.select().from(s.leadSources).where(inArray(s.leadSources.id, sourceIds as string[]))
          : [];
      items = leadRows
        .filter((lead: any) => !(lead.metadata as any)?.archivedAt)
        .map((lead: any) => ({
          ...lead,
          source:
            sourceRows.find((source: any) => source.id === lead.sourceId)?.name ??
            (lead.metadata as any)?.source ??
            "",
        }));
    }

    rows = items.map((l) => [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.instagram,
      l.source,
      l.campaign,
      l.status,
      l.score,
      l.convertedValue,
      l.createdAt,
    ]);
  } else if (type === "finance") {
    headers = [
      "id",
      "type",
      "status",
      "source",
      "amount",
      "description",
      "occurredAt",
      "createdAt",
    ];

    let items: any[] = [];
    {
      const conditions = [];
      if (workspaceId)
        conditions.push(eq(s.financialTransactions.workspaceId, workspaceId));
      if (personaId)
        conditions.push(eq(s.financialTransactions.personaId, personaId));
      items = await db
        .select()
        .from(s.financialTransactions)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    rows = items.map((f) => [
      f.id,
      f.type,
      f.status,
      f.source,
      f.amount,
      f.description,
      f.occurredAt,
      f.createdAt,
    ]);
  } else if (type === "posts") {
    headers = [
      "id",
      "channel",
      "contentType",
      "title",
      "pillar",
      "status",
      "scheduledAt",
      "publishedAt",
      "createdAt",
    ];

    let items: any[] = [];
    {
      const conditions = [];
      if (workspaceId)
        conditions.push(eq(s.contentItems.workspaceId, workspaceId));
      if (personaId)
        conditions.push(eq(s.contentItems.personaId, personaId));
      items = await db
        .select()
        .from(s.contentItems)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    rows = items.map((c) => [
      c.id,
      c.channel,
      c.contentType,
      c.title,
      c.pillar,
      c.status,
      c.scheduledAt,
      c.publishedAt,
      c.createdAt,
    ]);
  } else if (type === "metrics") {
    headers = [
      "id",
      "personaId",
      "capturedAt",
      "revenue",
      "followers",
      "views",
      "engagement",
      "leads",
      "posts",
    ];

    let items: any[] = [];
    {
      const conditions = [];
      if (workspaceId)
        conditions.push(eq(s.personaMetricsSnapshots.workspaceId, workspaceId));
      if (personaId)
        conditions.push(eq(s.personaMetricsSnapshots.personaId, personaId));
      items = await db
        .select()
        .from(s.personaMetricsSnapshots)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    rows = items.map((m) => [
      m.id,
      m.personaId,
      m.capturedAt,
      m.revenue,
      m.followers,
      m.views,
      m.engagement,
      m.leads,
      m.posts,
    ]);
  } else if (type === "activity") {
    headers = [
      "id",
      "actorType",
      "action",
      "entityType",
      "entityId",
      "createdAt",
    ];

    let items: any[] = [];
    {
      const conditions = [];
      if (workspaceId) conditions.push(eq(s.activityLogs.workspaceId, workspaceId));
      items = await db
        .select()
        .from(s.activityLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
    }

    rows = items.map((a) => [
      a.id,
      a.actorType,
      a.action,
      a.entityType,
      a.entityId,
      a.createdAt,
    ]);
  } else {
    return NextResponse.json(
      { error: "Tipo de exportação inválido" },
      { status: 400 },
    );
  }

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=zayon-${type}-${Date.now()}.csv`,
    },
  });
}
