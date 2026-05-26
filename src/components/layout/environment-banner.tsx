"use client";

import * as React from "react";
import { X, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EnvironmentBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  // Espelha NEXT_PUBLIC_USE_MOCK_DATA · default true em dev/preview
  const useMock =
    typeof window !== "undefined" &&
    (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL);

  if (!useMock || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-warning/30 bg-warning/5 px-4 py-1.5 text-[11px] text-warning-foreground/80">
      <div className="flex items-center gap-2">
        <Database className="h-3 w-3 text-warning" />
        <span className="font-medium text-warning">Modo demonstração</span>
        <span className="text-muted-foreground hidden sm:inline">
          · dados mockados · ligue Supabase em <code>.env.local</code> para
          ativar produção
        </span>
        <Badge size="sm" variant="warning" className="hidden md:inline-flex">
          NEXT_PUBLIC_USE_MOCK_DATA=true
        </Badge>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded-md p-0.5 hover:bg-warning/10"
        aria-label="Dispensar"
      >
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
}
