"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { CURRENT_USER, MOCK_WORKSPACES, MOCK_PERSONAS } from "@/data";

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
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
