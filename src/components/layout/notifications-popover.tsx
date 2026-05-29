"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  Bot,
  CheckCheck,
  CircleDollarSign,
  FileText,
  Target,
  Users,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useNotifications,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeNotifications } from "@/hooks/use-realtime";
import { toast } from "sonner";

const ICONS = {
  "task.assigned": Activity,
  "task": Activity,
  "tarefa": Activity,
  "lead.new": Target,
  "lead": Target,
  "ai.action": Bot,
  "ai": Bot,
  "IA": Bot,
  "finance.overdue": CircleDollarSign,
  "finance": CircleDollarSign,
  "financeiro": CircleDollarSign,
  "content.late": FileText,
  "content": FileText,
  "conteúdo": FileText,
  "team": Users,
  "equipe": Users,
  "document": FileText,
  "documento": FileText,
  "documentos": FileText,
} as const;

export function NotificationsPopover() {
  const user = useWorkspaceStore((s) => s.user);
  const { data: dbNotifications = [] } = useNotifications(user?.id);
  const queryClient = useQueryClient();
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  useRealtimeNotifications(user?.id ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  const notifications = (dbNotifications as any[]).filter(
    (n) => !n.archivedAt && !n.archived_at && !n.deletedAt && !n.deleted_at,
  );
  const unread = notifications.filter((n: any) => !(n.readAt ?? n.read_at)).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 rounded-full bg-destructive text-[9px] font-bold text-white px-1 flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Notificações</p>
            <Badge size="sm" variant="primary">
              {unread}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await markAllRead.mutateAsync();
                toast.success("Todas as notificações marcadas como lidas");
              } catch (e: any) {
                toast.error(e?.message ?? "Erro");
              }
            }}
            disabled={markAllRead.isPending || unread === 0}
          >
            <CheckCheck className="h-3 w-3" /> Tudo lido
          </Button>
        </div>

        <Tabs defaultValue="all">
          <div className="px-3 pt-2">
            <TabsList>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="mentions">Menções</TabsTrigger>
              <TabsTrigger value="ai">IA</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-2">
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
              {notifications.length === 0 && (
                <div className="px-6 py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    Sem notificações por aqui ✓
                  </p>
                </div>
              )}
              {notifications.map((n: any) => {
                const Icon = ICONS[n.type as keyof typeof ICONS] ?? Activity;
                const isUnread = !(n.readAt ?? n.read_at);
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? "#"}
                    onClick={() => {
                      if (isUnread) {
                        markRead.mutate(n.id);
                        toast.success("Notificação marcada como lida");
                      }
                    }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-accent transition border-l-2",
                      isUnread ? "bg-primary/5 border-l-primary" : "opacity-50 border-l-transparent",
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card/60 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-xs flex items-center gap-1", isUnread ? "font-semibold text-foreground" : "line-through text-muted-foreground")}>
                        {!isUnread && <span className="text-[9px] text-green-500 shrink-0">✓</span>}
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {relativeTime(n.createdAt ?? n.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="mentions" className="mt-2 px-6 py-10 text-center">
            <p className="text-xs text-muted-foreground">
              Sem menções pendentes.
            </p>
          </TabsContent>

          <TabsContent value="ai" className="mt-2">
            <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
              {notifications
                .filter((n: any) => n.type === "ai.action" || n.type === "ai" || n.type === "IA")
                .map((n: any) => {
                  const isUnread = !(n.readAt ?? n.read_at);
                  return (
                    <Link
                      key={n.id}
                      href={n.href ?? "#"}
                      onClick={() => {
                        if (isUnread) {
                          markRead.mutate(n.id);
                          toast.success("Notificação marcada como lida");
                        }
                      }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 hover:bg-accent transition border-l-2",
                        isUnread ? "bg-primary/5 border-l-primary" : "opacity-50 border-l-transparent",
                      )}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card/60 text-primary">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs flex items-center gap-1", isUnread ? "font-semibold text-foreground" : "line-through text-muted-foreground")}>
                          {!isUnread && <span className="text-[9px] text-green-500 shrink-0">✓</span>}
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {relativeTime(n.createdAt ?? n.created_at)}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border/60 px-3 py-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/notifications">Ver todas</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
