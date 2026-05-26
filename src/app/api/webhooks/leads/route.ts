import { NextResponse } from "next/server";
import { z } from "zod";

const LeadPayload = z.object({
  source: z.string().default("Google Sheets"),
  campaign: z.string().optional(),
  personaId: z.string().optional(),
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
  const body = await req.json().catch(() => null);
  const parsed = LeadPayload.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // TODO: validar webhook secret e persistir no Supabase
  // const lead = await db.insert(leads).values({ workspaceId, personaId, ... });

  return NextResponse.json({
    ok: true,
    received: parsed.data,
    received_at: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "POST a JSON payload (source, name, email, phone, answers, secret) to ingest a lead.",
  });
}
