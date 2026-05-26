"use client";

import * as React from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = React.useCallback(async (value: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      toast.success(label ?? "Copiado para a área de transferência");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Falha ao copiar");
    }
  }, []);

  return { copy, copied };
}
