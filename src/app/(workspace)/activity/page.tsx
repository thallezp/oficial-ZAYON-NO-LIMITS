"use client";

import * as React from "react";
import {
  Activity as ActivityIcon,
  Bot,
  Cog,
  Download,
  Filter,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_ACTIVITY } from "@/data";
import { initials, relativeTime } from "@/lib/utils/format";

const actorIcon = {
  user: UserIcon,
  ai: Bot,
  system: Cog,
} as const;

export default function ActivityLogPage() {
  const [filter, setFilter] = React.useState<"all" | "user" | "ai" | "system">(
    "all",
  );
  const items = MOCK_ACTIVITY.filter(
    (a) => filter === "all" || a.actorType === filter,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Auditoria · todas as ações importantes do workspace, com filtros por tipo e ator."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> Filtros avançados
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> Exportar
            </Button>
          </>
        }
      />

      <div className="flex gap-1">
        {[
          { id: "all", label: "Todos" },
          { id: "user", label: "Equipe" },
          { id: "ai", label: "IA" },
          { id: "system", label: "Sistema" },
        ].map((f) => (
          <Badge
            key={f.id}
            variant={filter === f.id ? "primary" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(f.id as typeof filter)}
          >
            {f.label}
          </Badge>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {items.map((a) => {
            const Icon = actorIcon[a.actorType] ?? ActivityIcon;
            return (
              <div key={a.id} className="flex items-start gap-4 p-4">
                {a.actor ? (
                  <Avatar size="sm">
                    <AvatarFallback>{initials(a.actor.fullName)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed">
                    <span className="font-medium">
                      {a.actor?.fullName ?? "ZAYON"}
                    </span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  {a.payload && (
                    <p className="text-[11px] text-muted-foreground">
                      {Object.values(a.payload).join(" · ")}
                    </p>
                  )}
                </div>
                <Badge size="sm" variant="ghost">
                  {a.actorType}
                </Badge>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {relativeTime(a.createdAt)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <CardContent className="relative p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold">Auditoria pronta para SOC 2</p>
            <p className="text-xs text-muted-foreground mt-1">
              Logs imutáveis · retenção configurável · exportação CSV/JSON.
            </p>
          </div>
          <Button variant="gradient" size="sm">
            <Sparkles className="h-3.5 w-3.5" /> Resumir últimas 24h com IA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
