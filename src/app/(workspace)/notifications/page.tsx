"use client";

import Link from "next/link";
import { Activity, Bot, CheckCheck, CircleDollarSign, FileText, Target, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_NOTIFICATIONS } from "@/data";
import { relativeTime } from "@/lib/utils/format";

const typeIcon = {
  "task.assigned": Activity,
  "lead.new": Target,
  "ai.action": Bot,
  "finance.overdue": CircleDollarSign,
  "content.late": FileText,
} as const;

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        description="Tudo o que aconteceu no workspace. Filtrável por tipo."
        actions={
          <Button variant="outline" size="sm">
            <CheckCheck className="h-3.5 w-3.5" /> Marcar todas como lidas
          </Button>
        }
      />

      <div className="flex gap-2 flex-wrap">
        {["Todas", "Tarefas", "Leads", "IA", "Financeiro", "Conteúdo"].map((t, i) => (
          <Badge
            key={t}
            variant={i === 0 ? "primary" : "outline"}
            className="cursor-pointer"
          >
            {t}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {MOCK_NOTIFICATIONS.map((n) => {
            const Icon = typeIcon[n.type as keyof typeof typeIcon] ?? Activity;
            return (
              <Link
                key={n.id}
                href={n.href ?? "#"}
                className="flex items-start gap-3 p-4 hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/60">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {relativeTime(n.createdAt)}
                </span>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
