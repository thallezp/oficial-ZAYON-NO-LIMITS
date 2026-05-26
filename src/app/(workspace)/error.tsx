"use client";

import * as React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Workspace error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card variant="elevated" className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Algo quebrou por aqui</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "Erro inesperado. A equipe foi notificada."}
            </p>
            {error.digest && (
              <p className="text-[10px] text-muted-foreground/60">
                ref: {error.digest}
              </p>
            )}
          </div>
          <Button variant="gradient" onClick={reset}>
            <RotateCw className="h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
