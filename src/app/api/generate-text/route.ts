import { NextResponse } from "next/server";
import { generateObject, generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const requestSchema = z.object({
  kind: z.enum(["launch-copy", "lead-approach", "lead-qualification"]),
  input: z.record(z.any()),
});

function getModel() {
  if (process.env.OPENAI_API_KEY) return openai("gpt-4o-mini");
  if (process.env.ANTHROPIC_API_KEY) return anthropic("claude-3-5-sonnet-20240620");
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    return google("gemini-1.5-pro");
  }
  return null;
}

function fallbackQualification(input: Record<string, any>) {
  const answers = Array.isArray(input.answers) ? input.answers : [];
  const answerText = answers
    .map((item: any) => `${item.question}: ${item.answer}`)
    .join(" ")
    .toLowerCase();

  let score = 35;
  if (input.email) score += 10;
  if (input.phone) score += 15;
  if (input.campaign) score += 5;
  if (answers.length > 0) score += 15;
  if (/sim|agora|pronta|pronto|investir|urgente|quero/.test(answerText)) score += 15;
  if (/30 dias|em breve|essa semana/.test(answerText)) score += 10;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: score >= 80 ? "qualified" : score >= 60 ? "approached" : "open",
    rationale:
      score >= 80
        ? "Lead com sinais claros de intenção, respostas completas e canal de contato acionável."
        : score >= 60
          ? "Lead com interesse inicial válido, mas ainda precisa de abordagem e qualificação complementar."
          : "Lead ainda frio, com poucas informações ou baixa urgência declarada.",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Payload invalido" },
        { status: 400 },
      );
    }

    const model = getModel();
    const { kind, input } = parsed.data;

    if (kind === "lead-qualification") {
      if (!model) {
        return NextResponse.json({ ok: true, data: fallbackQualification(input) });
      }

      const result = await generateObject({
        model,
        schema: z.object({
          score: z.number().min(0).max(100),
          status: z.enum(["open", "approached", "qualified", "converted", "lost", "no_response"]),
          rationale: z.string().min(20),
        }),
        system:
          "Você qualifica leads de infoprodutos. Seja pragmático, pontue intenção de compra, completude dos dados e urgência percebida.",
        prompt: `Qualifique este lead em JSON.\n${JSON.stringify(input, null, 2)}`,
      });

      return NextResponse.json({ ok: true, data: result.object });
    }

    if (!model) {
      if (kind === "launch-copy") {
        return NextResponse.json({
          ok: true,
          data: {
            text: `Headline: ${input.title || input.type || "Nova copy"}\n\nPromessa: ${input.goal || "Transformação clara com urgência real."}\n\nCorpo: Parta da dor "${input.pain || "a dor central da persona"}", apresente a virada desejada e feche com CTA para ${input.cta || "a próxima ação do funil"}.`,
          },
        });
      }

      return NextResponse.json({
        ok: true,
        data: {
          text: `Oi ${input.name || ""}, vi sua resposta sobre "${input.primaryPain || "o momento atual"}". Faz sentido você estar buscando um caminho mais claro agora. Se quiser, eu posso te mostrar em 2 minutos como isso funciona e ver se é aderente para você.`,
        },
      });
    }

    const prompt =
      kind === "launch-copy"
        ? `Escreva uma copy em português para lançamento.\n${JSON.stringify(input, null, 2)}`
        : `Escreva uma abordagem curta de WhatsApp em português para este lead.\n${JSON.stringify(input, null, 2)}`;

    const result = await generateText({
      model,
      system:
        kind === "launch-copy"
          ? "Você cria copys de lançamento com clareza, tensão narrativa, prova, CTA e linguagem brasileira natural."
          : "Você cria abordagens curtas de WhatsApp para vendas consultivas, sem soar robótico nem agressivo.",
      prompt,
    });

    return NextResponse.json({ ok: true, data: { text: result.text } });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Erro ao gerar texto" },
      { status: 500 },
    );
  }
}
