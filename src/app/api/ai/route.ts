import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, workspaceId, personaId } = await req.json();

  let provider: any = null;
  let modelName = "";

  if (process.env.OPENAI_API_KEY) {
    provider = openai;
    modelName = "gpt-4o";
  } else if (process.env.ANTHROPIC_API_KEY) {
    provider = anthropic;
    modelName = "claude-3-5-sonnet-20240620";
  } else if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY
  ) {
    provider = google;
    modelName = "gemini-1.5-pro";
  }

  // Se nenhum provedor real tiver chaves, retornar erro explicativo ou resposta simulada
  if (!provider) {
    return new Response(
      JSON.stringify({
        error:
          "Nenhuma chave de API configurada para OpenAI, Claude ou Gemini nas variáveis de ambiente.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const systemPrompt = `Você é a NEXUS AI, assistente integrada ao Workspace OS.
Contexto Operacional:
- Workspace ID: ${workspaceId || "global"}
- Persona ID: ${personaId || "nenhuma"}

Instruções:
- Seja extremamente conciso, profissional, objetivo e focado na produtividade.
- Ajude a criar tarefas, planejar conteúdo para Instagram/TikTok, qualificar leads e gerenciar finanças.
- Escreva em português.`;

  try {
    const result = await streamText({
      model: provider(modelName),
      system: systemPrompt,
      messages,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || "Erro durante a execução do LLM",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

