"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { CURRENT_USER, MOCK_WORKSPACES, MOCK_PERSONAS } from "@/data";

/**
 * CopilotKit é carregado lazy e só monta quando a flag
 * `NEXT_PUBLIC_ENABLE_COPILOT=true` está ativa. Em modo demo,
 * sem chave OPENAI no servidor, o endpoint /api/copilotkit quebraria
 * com Unhandled Rejection (process exit 128), o que vaza pro client
 * como "Application error".
 *
 * Para ligar em produção, basta setar:
 *   NEXT_PUBLIC_ENABLE_COPILOT=true
 *   OPENAI_API_KEY=sk-...
 */
const CopilotProvider = React.lazy(async () => {
  const [{ CopilotKit }, { CopilotActionsRegistry }] = await Promise.all([
    import("@copilotkit/react-core"),
    import("@/components/ai/copilot-actions"),
  ]);
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <CopilotKit runtimeUrl="/api/copilotkit">
        <CopilotActionsRegistry />
        {children}
      </CopilotKit>
    ),
  };
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const bootstrap = useWorkspaceStore((s) => s.bootstrap);
  const setPersonas = usePersonaStore((s) => s.setPersonas);

  React.useEffect(() => {
    bootstrap({ workspaces: MOCK_WORKSPACES, user: CURRENT_USER });
    setPersonas(MOCK_PERSONAS);
  }, [bootstrap, setPersonas]);

  const enableCopilot =
    process.env.NEXT_PUBLIC_ENABLE_COPILOT === "true" &&
    process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "true";

  const content = (
    <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {enableCopilot ? (
        <React.Suspense fallback={content}>
          <CopilotProvider>{content}</CopilotProvider>
        </React.Suspense>
      ) : (
        content
      )}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          className: "!bg-card !border-border !text-foreground",
        }}
      />
    </QueryClientProvider>
  );
}
