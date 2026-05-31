"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";

type Event = "INSERT" | "UPDATE" | "DELETE" | "*";

interface Options<T extends Record<string, any> = Record<string, any>> {
  table: string;
  event?: Event;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onPayload?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

const realtimeQueryKeys: Record<string, string[]> = {
  activity_logs: ["activityLogs"],
  ai_actions: ["aiActions"],
  calendar_events: ["calendarEvents"],
  content_items: ["content"],
  documents: ["documents", "document"],
  financial_transactions: ["finance", "bills"],
  flow_edges: ["flows", "flow"],
  flow_nodes: ["flows", "flow"],
  flows: ["flows", "flow"],
  funnel_edges: ["funnel"],
  funnel_nodes: ["funnel"],
  leads: ["leads"],
  materials: ["materials"],
  notifications: ["notifications"],
  personas: ["personas", "persona"],
  projects: ["projects"],
  sales_funnels: ["funnel"],
  task_comments: ["taskComments"],
  tasks: ["tasks", "taskSubtasks"],
  tools: ["tools"],
};

export function useRealtime<T extends Record<string, any> = Record<string, any>>({
  table,
  event = "*",
  schema = "public",
  filter,
  enabled = true,
  onPayload,
}: Options<T>) {
  const queryClient = useQueryClient();

  // ID único por instância do hook. Evita que dois componentes inscritos na
  // MESMA tabela+filtro (ex: o sino global de Notificações no topbar + a página
  // de Notificações) reusem o mesmo nome de canal. Quando reusavam, o 2º .on()
  // rodava depois do .subscribe() do 1º → crash:
  // "cannot add postgres_changes callbacks ... after subscribe()".
  const instanceId = React.useId();

  // Salvar callback na ref para evitar desconexões constantes do realtime em renderizações secundárias
  const onPayloadRef = React.useRef(onPayload);
  React.useEffect(() => {
    onPayloadRef.current = onPayload;
  }, [onPayload]);

  React.useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }

    const supabase = supabaseBrowser();
    const channelName = `zayon-rt-${table}-${filter ?? "all"}-${instanceId}`;
    const channel: RealtimeChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as any,
        { event, schema, table, filter } as any,
        (payload: RealtimePostgresChangesPayload<T>) => {
          queryClient.invalidateQueries({ queryKey: [table] });
          realtimeQueryKeys[table]?.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey: [queryKey] });
          });
          onPayloadRef.current?.(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, event, filter, queryClient, schema, table, instanceId]);
}

function scopeFilter(workspaceId?: string, personaId?: string) {
  if (!workspaceId) return undefined;
  return personaId ? `persona_id=eq.${personaId}` : `workspace_id=eq.${workspaceId}`;
}

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
  useRealtime({
    table: "leads",
    filter: scopeFilter(workspaceId, personaId),
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeContent(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "content_items",
    filter: scopeFilter(workspaceId, personaId),
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

export function useRealtimeCalendar(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "calendar_events",
    filter: scopeFilter(workspaceId, personaId),
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeDocuments(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "documents",
    filter: scopeFilter(workspaceId, personaId),
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeMaterials(
  workspaceId: string | undefined,
  personaId?: string,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "materials",
    filter: scopeFilter(workspaceId, personaId),
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeFlows(
  workspaceId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "flows",
    filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}

export function useRealtimeTools(
  workspaceId: string | undefined,
  onChange?: (payload: RealtimePostgresChangesPayload<any>) => void,
) {
  useRealtime({
    table: "tools",
    filter: workspaceId ? `workspace_id=eq.${workspaceId}` : undefined,
    enabled: !!workspaceId,
    onPayload: onChange,
  });
}
