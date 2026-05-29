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
  Layers,
  CalendarDays,
  AlignJustify,
  MoreHorizontal,
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

const TYPE_ORDER = [
  "Tarefas",
  "Leads",
  "IA",
  "Financeiro",
  "Conteúdo",
  "Equipe",
  "Documentos",
  "Sistema",
  "Outras",
];

function classifyType(rawType: string): string {
  for (const [label, keys] of Object.entries(typeMap)) {
    if (keys.includes(rawType)) return label;
  }
  return "Outras";
}

type DateBucket =
  | "Hoje"
  | "Ontem"
  | "Esta semana"
  | "Este mês"
  | "Mais antigas";

function classifyDate(createdAtRaw: string | undefined): DateBucket {
  if (!createdAtRaw) return "Mais antigas";
  const created = new Date(createdAtRaw);
  if (isNaN(created.getTime())) return "Mais antigas";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (created >= startOfToday) return "Hoje";
  if (created >= startOfYesterday) return "Ontem";
  if (created >= sevenDaysAgo) return "Esta semana";
  if (created >= thirtyDaysAgo) return "Este mês";
  return "Mais antigas";
}

const DATE_ORDER: DateBucket[] = [
  "Hoje",
  "Ontem",
  "Esta semana",
  "Este mês",
  "Mais antigas",
];

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState("Todas");
  const [readFilter, setReadFilter] = React.useState<"all" | "unread" | "read">(
    "all",
  );
  const [groupBy, setGroupBy] = React.useState<"none" | "date" | "type">("date");
  const [confirmClearAll, setConfirmClearAll] = React.useState(false);
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
    try {
      await clearAll.mutateAsync();
      toast.success("Todas as notificações limpas");
      setConfirmClearAll(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao limpar todas");
    }
  };

  const groupedSections = React.useMemo(() => {
    if (groupBy === "none") return null;
    const map = new Map<string, any[]>();
    filtered.forEach((n: any) => {
      const key =
        groupBy === "date"
          ? classifyDate(n.createdAt ?? n.created_at)
          : classifyType(n.type ?? "");
      const arr = map.get(key) ?? [];
      arr.push(n);
      map.set(key, arr);
    });
    const order =
      groupBy === "date"
        ? (DATE_ORDER as readonly string[])
        : TYPE_ORDER;
    return order
      .filter((k) => map.has(k))
      .map((k) => ({ label: k, items: map.get(k) ?? [] }));
  }, [filtered, groupBy]);

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
        description={`Tudo o que aconteceu no workspace. ${unreadCount} não lida${unreadCount === 1 ? "" : "s"} · ${notifications.length} ativa${notifications.length === 1 ? "" : "s"}.`}
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-3.5 w-3.5" /> Limpar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem
                  onClick={handleClearRead}
                  disabled={clearRead.isPending}
                >
                  <Trash2 className="h-4 w-4" /> Limpar lidas
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmClearAll(true)}
                  disabled={clearAll.isPending || notifications.length === 0}
                >
                  <Trash2 className="h-4 w-4" /> Limpar todas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
        {["Todas", "Tarefas", "Leads", "IA", "Financeiro", "Conteúdo", "Equipe", "Documentos", "Sistema"].map((t) => (
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
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1 ml-3">
          Agrupar:
        </span>
        {(
          [
            ["none", "Nenhum", AlignJustify],
            ["date", "Data", CalendarDays],
            ["type", "Tipo", Layers],
          ] as const
        ).map(([key, label, Icon]) => (
          <Badge
            key={key}
            variant={groupBy === key ? "primary" : "outline"}
            className="cursor-pointer inline-flex items-center gap-1"
            onClick={() => setGroupBy(key)}
          >
            <Icon className="h-2.5 w-2.5" /> {label}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {readFilter === "unread"
                ? "Tudo lido por aqui ✓"
                : "Nenhuma notificação nesta categoria."}
            </div>
          ) : groupedSections ? (
            <div className="divide-y divide-border/80">
              {groupedSections.map((section) => {
                const sectionUnread = section.items.filter(
                  (n: any) => !(n.readAt ?? n.read_at),
                ).length;
                return (
                  <div key={section.label}>
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-2 bg-card/95 backdrop-blur border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {section.label}
                        </span>
                        <Badge size="sm" variant="ghost">
                          {section.items.length}
                        </Badge>
                        {sectionUnread > 0 && (
                          <Badge size="sm" variant="primary">
                            {sectionUnread} nova{sectionUnread === 1 ? "" : "s"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="divide-y divide-border/60">
                      {section.items.map((n: any) => (
                        <NotificationRow
                          key={n.id}
                          n={n}
                          onMarkRead={(id) => markRead.mutate(id)}
                          onArchive={(id) => handleArchive(id)}
                          onRemove={(id) => handleRemove(id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filtered.map((n: any) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onArchive={(id) => handleArchive(id)}
                  onRemove={(id) => handleRemove(id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {confirmClearAll && (
        <ConfirmDialog
          title="Limpar todas as notificações"
          description={`Isso irá excluir as ${notifications.length} notificações ativas (incluindo as não lidas). Os logs no banco serão removidos.`}
          onCancel={() => setConfirmClearAll(false)}
          onConfirm={handleClearAll}
          pending={clearAll.isPending}
        />
      )}
    </div>
  );
}

interface RowProps {
  n: any;
  onMarkRead: (id: string) => void;
  onArchive: (id: string) => void;
  onRemove: (id: string) => void;
}

function NotificationRow({ n, onMarkRead, onArchive, onRemove }: RowProps) {
  const Icon = typeIcon[n.type as keyof typeof typeIcon] ?? Activity;
  const isRead = !!(n.readAt ?? n.read_at);
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-accent/60 transition group",
        isRead && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border bg-card/60 shrink-0",
          isRead ? "border-border/40" : "border-primary/40 bg-primary/5",
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
          if (!isRead) onMarkRead(n.id);
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
              <DropdownMenuItem onClick={() => onMarkRead(n.id)}>
                <CheckCheck className="h-4 w-4" /> Marcar como lida
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onArchive(n.id)}>
              <Archive className="h-4 w-4" /> Arquivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onRemove(n.id)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface ConfirmProps {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  pending?: boolean;
}

function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
  pending,
}: ConfirmProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border/60 bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" /> {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5">{description}</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={pending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? "Limpando..." : "Confirmar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
