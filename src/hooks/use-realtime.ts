"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Options<T extends Record<string, any> = Record<string, any>> {
  table: string;
  event?: Event;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onPayload?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

/**
 * Hook genérico de Supabase Realtime.
 *
 * Em modo mock (sem URL/key Supabase) faz no-op silencioso. Quando ligado
 * a um projeto real, abre canal e chama `onPayload` a cada INSERT/UPDATE/DELETE.
 *
 * Garanta de habilitar Realtime na tabela:
 *   alter publication supabase_realtime add table <nome>;
 */
export function useRealtime<T extends Record<string, any> = Record<string, any>>({
  table,
  event = "*",
  schema = "public",
  filter,
  enabled = true,
  onPayload,
}: Options<T>) {
  React.useEffect(() => {
    if (!enabled) return;
    if (
      typeof window === "undefined" ||
      !process.env.NEXT_PUBLIC_SUPABASE_URL
    ) {
      return;
    }

    const supabase = supabaseBrowser();
    const channel: RealtimeChannel = supabase
      .channel(`zayon-rt-${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes" as any,
        { event, schema, table, filter } as any,
        (payload: RealtimePostgresChangesPayload<T>) => {
          onPayload?.(payload);
        },
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        /* ignored */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event, schema, filter, enabled]);
}

// Helpers tipados ---------------------------------------------------------

export function useRealtimeTasks(
  workspaceId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "tasks",
    filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeLeads(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  const filter = workspaceId
    ? personaId
      ? `persona_id=eq.${personaId}`
      : `workspace_id=eq.${workspaceId}`
    : undefined;
  useRealtime({
    table: "leads",
    filter,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeContent(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  const filter = workspaceId
    ? personaId
      ? `persona_id=eq.${personaId}`
      : `workspace_id=eq.${workspaceId}`
    : undefined;
  useRealtime({
    table: "content_items",
    filter,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeFinance(
  workspaceId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "financial_transactions",
    filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeNotifications(
  userId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "notifications",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    enabled: !!userId,
    onPayload: onChange,
  });
}

export function useRealtimeActivity(
  workspaceId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "activity_logs",
    event: "INSERT",
    filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}
