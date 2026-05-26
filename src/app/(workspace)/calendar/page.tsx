"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Calendar as CalIcon, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MOCK_TASKS, MOCK_CONTENT, MOCK_BILLS } from "@/data";
import { toast } from "sonner";
import type { CalendarEvent } from "@/components/calendar/full-calendar";

const FullCalendarView = dynamic(
  () => import("@/components/calendar/full-calendar").then((m) => m.FullCalendarView),
  { ssr: false, loading: () => <div className="h-[680px] rounded-xl border border-border/60 bg-card/40 animate-pulse" /> },
);

const tagColors = {
  task: { bg: "rgba(91,140,255,0.2)", text: "#a4baff" },
  content: { bg: "rgba(192,138,61,0.2)", text: "#e2b97e" },
  bill: { bg: "rgba(248,113,113,0.2)", text: "#fda4af" },
} as const;

export default function CalendarPage() {
  const events = React.useMemo<CalendarEvent[]>(() => {
    const taskEvents: CalendarEvent[] = MOCK_TASKS.filter((t) => t.dueAt).map(
      (t) => ({
        id: `task-${t.id}`,
        title: `📋 ${t.title}`,
        start: t.dueAt!,
        backgroundColor: tagColors.task.bg,
        textColor: tagColors.task.text,
        extendedProps: { type: "task" },
      }) as CalendarEvent,
    );
    const contentEvents: CalendarEvent[] = MOCK_CONTENT.filter(
      (c) => c.scheduledAt,
    ).map(
      (c) => ({
        id: `content-${c.id}`,
        title: `🎬 ${c.title}`,
        start: c.scheduledAt!,
        backgroundColor: tagColors.content.bg,
        textColor: tagColors.content.text,
        extendedProps: { type: "content" },
      }) as CalendarEvent,
    );
    const billEvents: CalendarEvent[] = MOCK_BILLS.map(
      (b) => ({
        id: `bill-${b.id}`,
        title: `💸 ${b.name}`,
        start: b.dueAt,
        allDay: true,
        backgroundColor: tagColors.bill.bg,
        textColor: tagColors.bill.text,
        extendedProps: { type: "bill" },
      }) as CalendarEvent,
    );
    return [...taskEvents, ...contentEvents, ...billEvents];
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário"
        description="Tarefas, conteúdos, lançamentos e financeiro em uma única timeline."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Sugerir agendamento
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Novo evento
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Badge variant="primary">📋 Tarefas</Badge>
        <Badge variant="warning">🎬 Conteúdo</Badge>
        <Badge variant="danger">💸 Financeiro</Badge>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalIcon className="h-3.5 w-3.5" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-4">
              <FullCalendarView
                events={events}
                height={680}
                onEventClick={(id) =>
                  toast.success(`Evento ${id} · abrir detalhes`)
                }
                onDateClick={(date) =>
                  toast.success(
                    `Criar evento em ${date.toLocaleDateString("pt-BR")}`,
                  )
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda">
          <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/60">
            {events
              .sort(
                (a, b) =>
                  new Date(a.start as string).getTime() -
                  new Date(b.start as string).getTime(),
              )
              .slice(0, 30)
              .map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3">
                  <span
                    className="block h-2 w-2 rounded-full"
                    style={{ background: e.backgroundColor as string }}
                  />
                  <span className="text-xs text-muted-foreground w-40">
                    {new Date(e.start as string).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <p className="text-sm flex-1 truncate">{e.title}</p>
                </div>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

