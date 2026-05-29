"use client";

import * as React from "react";
import { AlertTriangle, RotateCw, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error boundary específico por persona. Quando uma página da persona
 * quebra (ex: dados malformados, query falhou), preserva o sidebar +
 * topbar + persona switcher, mostrando o fallback só no painel principal.
 */
export default function PersonaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[persona error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">
              Erro ao carregar esta persona
            </h2>
            <p className="text-xs text-muted-foreground">
              {error.message || "Não foi possível renderizar a página."}
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-muted-foreground/60">
                ref: {error.digest}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => reset()}>
              <RotateCw className="h-3.5 w-3.5" /> Tentar de novo
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/personas">
                <Users className="h-3.5 w-3.5" /> Outra persona
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
