"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  Archive,
  Bot,
  CheckCheck,
  CircleDollarSign,
  FileText,
  MoreVertical,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useArchiveNotificationMutation,
  useDeleteNotificationMutation,
  useClearReadNotificationsMutation,
} from "@/hooks/use-queries";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeNotifications } from "@/hooks/use-realtime";

const typeIcon = {
  "task.assigned": Activity,
  "lead.new": Target,
  "ai.action": Bot,
  "finance.overdue": CircleDollarSign,
  "content.late": FileText,
  "team": Users,
} as const;

const typeMap: Record<string, string[]> = {
  Tarefas: ["task.assigned"],
  Leads: ["lead.new"],
  IA: ["ai.action"],
  Financeiro: ["finance.overdue"],
  Conteúdo: ["content.late"],
};

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState("Todas");
  const [readFilter, setReadFilter] = React.useState<"all" | "unread" | "read">(
    "all",
  );
  const user = useWorkspaceStore((s) => s.user);
  const { data: dbNotifications = [] } = useNotifications(user?.id);
  const queryClient = useQueryClient();

  useRealtimeNotifications(user?.id ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();
  const archive = useArchiveNotificationMutation();
  const remove = useDeleteNotificationMutation();
  const clearRead = useClearReadNotificationsMutation();

  const notifications = (dbNotifications as any[]).filter(
    (n) => !n.archivedAt && !n.archived_at,
  );

  const filtered = notifications.filter((n: any) => {
    const isRead = !!(n.readAt ?? n.read_at);
    if (readFilter === "read" && !isRead) return false;
    if (readFilter === "unread" && isRead) return false;
    if (filter === "Todas") return true;
    const allowed = typeMap[filter] || [];
    return allowed.includes(n.type);
  });

  const unreadCount = notifications.filter(
    (n: any) => !(n.readAt ?? n.read_at),
  ).length;

  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("Notificações marcadas como lidas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao marcar");
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead.mutateAsync();
      toast.success("Notificações lidas removidas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao limpar");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        description={`Tudo o que aconteceu no workspace. ${unreadCount} não lida${unreadCount === 1 ? "" : "s"}.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRead}
              disabled={clearRead.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Limpar lidas
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllRead.isPending || unreadCount === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
            </Button>
          </>
        }
      />

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">
          Tipo:
        </span>
        {["Todas", "Tarefas", "Leads", "IA", "Financeiro", "Conteúdo"].map((t) => (
          <Badge
            key={t}
            variant={filter === t ? "primary" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(t)}
          >
            {t}
          </Badge>
        ))}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1 ml-3">
          Status:
        </span>
        {(["all", "unread", "read"] as const).map((s) => (
          <Badge
            key={s}
            variant={readFilter === s ? "primary" : "outline"}
            className="cursor-pointer capitalize"
            onClick={() => setReadFilter(s)}
          >
            {s === "all" ? "Todas" : s === "unread" ? "Não lidas" : "Lidas"}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {readFilter === "unread"
                ? "Tudo lido por aqui ✓"
                : "Nenhuma notificação nesta categoria."}
            </div>
          ) : (
            filtered.map((n: any) => {
              const Icon = typeIcon[n.type as keyof typeof typeIcon] ?? Activity;
              const isRead = !!(n.readAt ?? n.read_at);
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-accent/60 transition group",
                    isRead && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border bg-card/60 shrink-0",
                      isRead
                        ? "border-border/40"
                        : "border-primary/40 bg-primary/5",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        isRead ? "text-muted-foreground" : "text-primary",
                      )}
                    />
                  </div>
                  <Link
                    href={n.href ?? "#"}
                    onClick={() => {
                      if (!isRead) markRead.mutate(n.id);
                    }}
                    className="flex-1 min-w-0"
                  >
                    <p
                      className={cn(
                        "text-sm",
                        isRead ? "text-muted-foreground" : "font-medium",
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {relativeTime(n.createdAt ?? n.created_at)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition">
                          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isRead && (
                          <DropdownMenuItem
                            onClick={() => markRead.mutate(n.id)}
                          >
                            <CheckCheck className="h-4 w-4" /> Marcar como lida
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => archive.mutate(n.id)}
                        >
                          <Archive className="h-4 w-4" /> Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => remove.mutate(n.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
