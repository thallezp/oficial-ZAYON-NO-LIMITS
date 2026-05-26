import { NextRequest, NextResponse } from "next/server";

/**
 * CopilotKit runtime endpoint.
 *
 * Em modo demo (sem chave OPENAI/Gemini) retorna 503 com mensagem clara
 * em vez de explodir o processo. Em produção, instancia o runtime real
 * com o provider disponível.
 */

export const POST = async (req: NextRequest) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini =
    !!process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    !!process.env.GEMINI_API_KEY;

  if (!hasOpenAI && !hasGemini) {
    return NextResponse.json(
      {
        error: "copilot_disabled",
        message:
          "CopilotKit em modo demo. Defina OPENAI_API_KEY ou GEMINI_API_KEY para ativar.",
      },
      { status: 503 },
    );
  }

  try {
    const {
      CopilotRuntime,
      GoogleGenerativeAIAdapter,
      OpenAIAdapter,
      copilotRuntimeNextJSAppRouterEndpoint,
    } = await import("@copilotkit/runtime");

    const serviceAdapter = hasOpenAI
      ? new OpenAIAdapter({})
      : new GoogleGenerativeAIAdapter({ model: "gemini-1.5-pro" });

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime: new CopilotRuntime(),
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    return handleRequest(req);
  } catch (err: any) {
    return NextResponse.json(
      { error: "copilot_error", message: err?.message ?? "internal" },
      { status: 500 },
    );
  }
};
