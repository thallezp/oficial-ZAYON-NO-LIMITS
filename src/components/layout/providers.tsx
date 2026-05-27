"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { CURRENT_USER, MOCK_WORKSPACES, MOCK_PERSONAS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import type { Persona, User, Workspace } from "@/types";

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
  const [bootstrapError, setBootstrapError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isMockModeClient) {
      bootstrap({ workspaces: MOCK_WORKSPACES, user: CURRENT_USER });
      setPersonas(MOCK_PERSONAS);
      return;
    }

    let cancelled = false;

    const loadBootstrap = async () => {
      try {
        const res = await fetch("/api/bootstrap", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          // 401 = não logado ainda → usar mock
          // 400 = usuário não tem perfil/workspace → usar mock
          console.warn("[bootstrap] Falhou com status", res.status, "— usando mock como fallback");
          if (!cancelled) {
            bootstrap({ workspaces: MOCK_WORKSPACES, user: CURRENT_USER });
            setPersonas(MOCK_PERSONAS);
          }
          return;
        }

        const payload = (await res.json()) as {
          user: User;
          workspaces: Workspace[];
          personas: Persona[];
        };

        if (cancelled) return;
        setBootstrapError(null);

        // Se veio workspaces vazio, mesclar com mock para não travar a UI
        const workspaces = payload.workspaces?.length > 0 ? payload.workspaces : MOCK_WORKSPACES;
        const personas = payload.personas?.length > 0 ? payload.personas : MOCK_PERSONAS;

        bootstrap({
          workspaces,
          user: payload.user ?? CURRENT_USER,
        });
        setPersonas(personas);
      } catch (error) {
        console.error("Erro ao carregar bootstrap real do Supabase:", error);
        if (cancelled) return;
        // Em vez de mostrar erro, usa mock silenciosamente
        bootstrap({ workspaces: MOCK_WORKSPACES, user: CURRENT_USER });
        setPersonas(MOCK_PERSONAS);
      }
    };

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, setPersonas]);

  const enableCopilot =
    process.env.NEXT_PUBLIC_ENABLE_COPILOT === "true" &&
    process.env.NEXT_PUBLIC_USE_MOCK_DATA !== "true";

  const content = (
    <TooltipProvider delayDuration={200}>
      {bootstrapError && (
        <div className="fixed inset-x-4 top-4 z-[9999] rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-glow md:left-auto md:w-[420px]">
          {bootstrapError}
        </div>
      )}
      {children}
    </TooltipProvider>
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
