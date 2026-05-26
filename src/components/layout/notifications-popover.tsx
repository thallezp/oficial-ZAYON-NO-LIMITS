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
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MOCK_NOTIFICATIONS } from "@/data";
import { relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const ICONS = {
  "task.assigned": Activity,
  "lead.new": Target,
  "ai.action": Bot,
  "finance.overdue": CircleDollarSign,
  "content.late": FileText,
} as const;

export function NotificationsPopover() {
  const [unread, setUnread] = React.useState(MOCK_NOTIFICATIONS.length);

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
            onClick={() => {
              setUnread(0);
              toast.success("Marcadas como lidas");
            }}
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
              {MOCK_NOTIFICATIONS.map((n, i) => {
                const Icon = ICONS[n.type as keyof typeof ICONS] ?? Activity;
                const isUnread = i < unread;
                return (
                  <Link
                    key={n.id}
                    href={n.href ?? "#"}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-accent transition",
                      isUnread && "bg-primary/5",
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card/60 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{n.title}</p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {relativeTime(n.createdAt)}
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
              {MOCK_NOTIFICATIONS.filter((n) => n.type === "ai.action").map(
                (n) => (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{n.title}</p>
                      {n.body && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
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
