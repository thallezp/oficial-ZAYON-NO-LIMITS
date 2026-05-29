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
  Settings,
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
  useClearAllNotificationsMutation,
} from "@/hooks/use-queries";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeNotifications } from "@/hooks/use-realtime";

const typeIcon = {
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
  "system": Settings,
  "sistema": Settings,
} as const;

const typeMap: Record<string, string[]> = {
  Tarefas: ["task.assigned", "task", "tarefa"],
  Leads: ["lead.new", "lead"],
  IA: ["ai.action", "ai", "IA"],
  Financeiro: ["finance.overdue", "finance", "financeiro"],
  Conteúdo: ["content.late", "content", "conteúdo"],
  Sistema: ["system", "sistema"],
  Equipe: ["team", "equipe"],
  Documentos: ["document", "documento", "documentos"],
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
  const clearAll = useClearAllNotificationsMutation();

  const notifications = (dbNotifications as any[]).filter(
    (n) => !n.archivedAt && !n.archived_at && !n.deletedAt && !n.deleted_at,
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

  const handleMarkAsRead = async (id: string) => {
    try {
      await markRead.mutateAsync(id);
      toast.success("Notificação marcada como lida");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao marcar como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("Todas as notificações marcadas como lidas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao marcar");
    }
  };

  const handleClearRead = async () => {
    try {
      await clearRead.mutateAsync();
      toast.success("Notificações lidas limpas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao limpar");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Deseja realmente limpar todas as notificações?")) return;
    try {
      await clearAll.mutateAsync();
      toast.success("Todas as notificações limpas");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao limpar todas");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archive.mutateAsync(id);
      toast.success("Notificação arquivada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao arquivar");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Notificação excluída");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir");
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
