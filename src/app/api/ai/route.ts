import { NextResponse } from "next/server";
import { z } from "zod";

const AIRequest = z.object({
  workspaceId: z.string().optional(),
  personaId: z.string().optional(),
  threadId: z.string().optional(),
  action: z.string().optional(),
  prompt: z.string().min(1),
  context: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AIRequest.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // TODO:
  // 1. Carregar contexto do workspace/persona ativos
  // 2. Chamar Vercel AI SDK (streamText) com modelo configurado
  // 3. Registrar ai_actions + ai_messages no Supabase
  // 4. Retornar stream

  return NextResponse.json({
    ok: true,
    message:
      "Endpoint pronto. Wire em produção: Vercel AI SDK + CopilotKit + Supabase logging.",
    echo: parsed.data,
  });
}
