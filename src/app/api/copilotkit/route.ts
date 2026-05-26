import {
  CopilotRuntime,
  GoogleGenerativeAIAdapter,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

const serviceAdapter = () => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIAdapter({});
  } else if (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GEMINI_API_KEY
  ) {
    return new GoogleGenerativeAIAdapter({
      model: "gemini-1.5-pro",
    });
  } else {
    // Default fallback
    return new OpenAIAdapter({});
  }
};

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime: new CopilotRuntime(),
    serviceAdapter: serviceAdapter(),
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
