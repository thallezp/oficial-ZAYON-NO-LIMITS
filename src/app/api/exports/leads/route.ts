import { NextResponse } from "next/server";
import { MOCK_LEADS } from "@/data";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get("personaId");
  const leads = personaId
    ? MOCK_LEADS.filter((l) => l.personaId === personaId)
    : MOCK_LEADS;

  const headers = [
    "id",
    "name",
    "email",
    "phone",
    "instagram",
    "campaign",
    "source",
    "status",
    "score",
    "convertedValue",
    "createdAt",
  ];

  const rows = leads.map((l) =>
    [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.instagram,
      l.campaign,
      l.source,
      l.status,
      l.score,
      l.convertedValue,
      l.createdAt,
    ]
      .map(escapeCsv)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=nexus-leads-${Date.now()}.csv`,
    },
  });
}
