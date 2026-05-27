"use client";

import * as React from "react";
import Link from "next/link";
import { Activity, Bot, CheckCheck, CircleDollarSign, FileText, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_NOTIFICATIONS } from "@/data";
import { relativeTime } from "@/lib/utils/format";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNotifications } from "@/hooks/use-queries";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeNotifications } from "@/hooks/use-realtime";

const typeIcon = {
  "task.assigned": Activity,
  "lead.new": Target,
  "ai.action": Bot,
  "finance.overdue": CircleDollarSign,
  "content.late": FileText,
} as const;

const typeMap: Record<string, string[]> = {
  "Tarefas": ["task.assigned"],
  "Leads": ["lead.new"],
  "IA": ["ai.action"],
  "Financeiro": ["finance.overdue"],
  "Conteúdo": ["content.late"],
};

export default function NotificationsPage() {
  const [filter, setFilter] = React.useState("Todas");
  const user = useWorkspaceStore((s) => s.user);
  const { data: dbNotifications = [] } = useNotifications(user?.id);
  const queryClient = useQueryClient();

  useRealtimeNotifications(user?.id ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  const notifications =
    isMockModeClient && dbNotifications.length === 0
      ? MOCK_NOTIFICATIONS
      : dbNotifications;

  const filtered = notifications.filter((n: any) => {
    if (filter === "Todas") return true;
    const allowed = typeMap[filter] || [];
    return allowed.includes(n.type);
  });

  const handleMarkAllAsRead = () => {
    toast.success("Todas as notificações foram marcadas como lidas.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        description="Tudo o que aconteceu no workspace. Filtrável por tipo."
        actions={
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
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
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação encontrada nesta categoria.
            </div>
          ) : (
            filtered.map((n: any) => {
              const Icon = typeIcon[n.type as keyof typeof typeIcon] ?? Activity;
              return (
                <Link
                  key={n.id}
                  href={n.href ?? "#"}
                  className="flex items-start gap-3 p-4 hover:bg-accent transition"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {relativeTime(n.createdAt)}
                  </span>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
