"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import type { Persona, User, Workspace } from "@/types";
import { usePersonas } from "@/hooks/use-queries";
import { usePathname } from "next/navigation";

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

function PersonaStoreSync() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const setPersonas = usePersonaStore((s) => s.setPersonas);
  const { data: dbPersonas } = usePersonas(activeWorkspaceId);

  React.useEffect(() => {
    if (dbPersonas) {
      setPersonas(dbPersonas);
    }
  }, [dbPersonas, setPersonas]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Equilíbrio entre frescor e fluidez ao navegar:
            // - staleTime 60s: trocar de aba dentro de 1 min usa cache (navegação
            //   instantânea, sem refetch em massa que travava a UI).
            // - refetchOnMount: revalida em background só quando os dados ficam
            //   stale (>60s), sem flash (gcTime mantém o cache visível).
            // - O reflexo imediato de create/edit/delete continua garantido pelas
            //   invalidateQueries das mutations (a invalidação ignora o staleTime).
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnMount: true,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
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
  const pathname = usePathname();

  React.useEffect(() => {
    // CRÍTICO: rotas públicas (login, forgot-password, invite) NÃO devem
    // chamar /api/bootstrap. O middleware já permite acesso sem sessão e
    // tentar bootstrap retorna 401 → redirect → loop infinito.
    const isPublicPath =
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/invite");

    if (isPublicPath) return;

    // Evita chamadas repetidas na navegação cliente se já houver dados carregados
    const currentStore = useWorkspaceStore.getState();
    const hasData = !!currentStore.user && currentStore.workspaces.length > 0;
    if (hasData) return;

    let cancelled = false;

    const fetchBootstrap = async () => {
      const res = await fetch("/api/bootstrap", {
        credentials: "include",
        cache: "no-store",
      });
      return res;
    };

    const loadBootstrap = async () => {
      try {
        let res = await fetchBootstrap();

        // Retry uma vez em 401 — cold start do Vercel pode falhar transientemente
        // mesmo o middleware tendo validado o cookie segundos antes.
        if (res.status === 401) {
          await new Promise((r) => setTimeout(r, 800));
          if (cancelled) return;
          res = await fetchBootstrap();
        }

        if (!res.ok) {
          console.warn("[bootstrap] Falhou com status", res.status);
          if (cancelled) return;

          if (res.status === 401) {
            // Sessão realmente expirou. Só redireciona se NÃO estiver já
            // numa rota pública (evita loop /login → /login).
            const currentPath = window.location.pathname;
            if (
              currentPath.startsWith("/login") ||
              currentPath.startsWith("/forgot-password") ||
              currentPath.startsWith("/invite")
            ) {
              return;
            }
            const next = encodeURIComponent(
              currentPath + window.location.search,
            );
            window.location.replace(`/login?next=${next}`);
            return;
          }

          toast.error("Não foi possível carregar o workspace", {
            description: "Recarregue a página para tentar novamente.",
            duration: 6000,
          });
          return;
        }

        const payload = (await res.json()) as {
          user: User;
          workspaces: Workspace[];
          personas: Persona[];
        };

        if (cancelled) return;

        bootstrap({
          workspaces: payload.workspaces ?? [],
          user: payload.user,
        });
        setPersonas(payload.personas ?? []);
      } catch (error) {
        console.error("Erro ao carregar bootstrap real do Supabase:", error);
        if (cancelled) return;
        toast.error("Falha ao conectar com o servidor", {
          description: "Verifique sua conexão e recarregue a página.",
          duration: 6000,
        });
      }
    };

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, setPersonas, pathname]);

  const enableCopilot = process.env.NEXT_PUBLIC_ENABLE_COPILOT === "true";

  const content = (
    <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PersonaStoreSync />
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
