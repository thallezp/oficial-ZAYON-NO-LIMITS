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
            // Cache agressivo + sem refetch automático pra reduzir carga
            staleTime: 5 * 60 * 1000, // 5 min
            gcTime: 10 * 60 * 1000, // 10 min
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
            retry: 1,
            retryDelay: 1000,
          },
          mutations: {
            retry: 0,
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
          // Em modo real (Supabase ligado), NÃO contaminar com mocks —
          // mocks têm IDs string ("ws_nexus") que não existem no banco e
          // travam todas as queries. Apenas registra erro pra dev e segue
          // com estado vazio (UI mostra empty states).
          console.warn("[bootstrap] Falhou com status", res.status);
          if (!cancelled) {
            setBootstrapError(
              res.status === 401
                ? "Sessão expirada. Faça login novamente."
                : "Não foi possível carregar o workspace. Recarregue a página.",
            );
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

        // ⚠️ Em modo real, NUNCA misturar com MOCK_WORKSPACES — seus IDs
        // são strings ("ws_nexus") que não batem com nada no banco e
        // quebram queries downstream.
        bootstrap({
          workspaces: payload.workspaces ?? [],
          user: payload.user ?? CURRENT_USER,
        });
        setPersonas(payload.personas ?? []);
      } catch (error) {
        console.error("Erro ao carregar bootstrap real do Supabase:", error);
        if (cancelled) return;
        setBootstrapError(
          "Falha ao conectar com o servidor. Verifique sua conexão.",
        );
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
