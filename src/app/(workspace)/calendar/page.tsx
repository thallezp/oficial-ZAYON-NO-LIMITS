"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Calendar as CalIcon, Filter, Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { CalendarEvent } from "@/components/calendar/full-calendar";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useTasks,
  useContent,
  useBills,
  useCalendarEvents,
  useCreateCalendarEventMutation,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} from "@/hooks/use-queries";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";

const FullCalendarView = dynamic(
  () => import("@/components/calendar/full-calendar").then((m) => m.FullCalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[680px] rounded-xl border border-border/60 bg-card/40 animate-pulse" />
    ),
  },
);

const tagColors = {
  task: { bg: "rgba(91,140,255,0.2)", text: "#a4baff" },
  content: { bg: "rgba(192,138,61,0.2)", text: "#e2b97e" },
  bill: { bg: "rgba(248,113,113,0.2)", text: "#fda4af" },
  event: { bg: "rgba(34,197,94,0.2)", text: "#86efac" },
  meeting: { bg: "rgba(168,85,247,0.2)", text: "#d8b4fe" },
  focus: { bg: "rgba(14,165,233,0.2)", text: "#7dd3fc" },
  launch: { bg: "rgba(244,114,182,0.2)", text: "#f9a8d4" },
} as const;

type FilterKey = "all" | "task" | "content" | "bill" | "event";

interface EditingEvent {
  id?: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  category: string;
  allDay: boolean;
  isNew: boolean;
}

function toLocalISO(d: Date) {
  const tz = d.getTimezoneOffset();
  const adjusted = new Date(d.getTime() - tz * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export default function CalendarPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.setOpen);
  const openWith = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("event");

  const { data: dbTasks = [] } = useTasks(activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId);
  const { data: dbBills = [] } = useBills(activeWorkspaceId);
  const { data: dbEvents = [] } = useCalendarEvents(activeWorkspaceId);

  const createEvent = useCreateCalendarEventMutation();
  const updateEvent = useUpdateCalendarEventMutation();
  const deleteEvent = useDeleteCalendarEventMutation();

  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [editing, setEditing] = React.useState<EditingEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const events = React.useMemo<CalendarEvent[]>(() => {
    const filtered = (key: FilterKey) =>
      filter === "all" || filter === key;

    const taskEvents: CalendarEvent[] = filtered("task")
      ? (dbTasks as any[])
          .filter((t) => t.dueAt)
          .map((t) => ({
            id: `task-${t.id}`,
            title: `📋 ${t.title}`,
            start: t.dueAt!,
            backgroundColor: tagColors.task.bg,
            textColor: tagColors.task.text,
            extendedProps: { type: "task", refId: t.id },
          }))
      : [];

    const contentEvents: CalendarEvent[] = filtered("content")
      ? (dbContent as any[])
          .filter((c) => c.scheduledAt)
          .map((c) => ({
            id: `content-${c.id}`,
            title: `🎬 ${c.title}`,
            start: c.scheduledAt!,
            backgroundColor: tagColors.content.bg,
            textColor: tagColors.content.text,
            extendedProps: { type: "content", refId: c.id },
          }))
      : [];

    const billEvents: CalendarEvent[] = filtered("bill")
      ? (dbBills as any[]).map((b) => ({
          id: `bill-${b.id}`,
          title: `💸 ${b.name}`,
          start: b.dueAt,
          allDay: true,
          backgroundColor: tagColors.bill.bg,
          textColor: tagColors.bill.text,
          extendedProps: { type: "bill", refId: b.id },
        }))
      : [];

    const userEvents: CalendarEvent[] = filtered("event")
      ? (dbEvents as any[]).map((e) => {
          const colorKey =
            (e.category as keyof typeof tagColors) in tagColors
              ? (e.category as keyof typeof tagColors)
              : "event";
          const col = tagColors[colorKey];
          return {
            id: `event-${e.id}`,
            title: e.title,
            start: e.startAt ?? e.start_at,
            end: e.endAt ?? e.end_at ?? undefined,
            allDay: !!(e.allDay ?? e.all_day),
            backgroundColor: col.bg,
            textColor: col.text,
            extendedProps: { type: "event", refId: e.id, category: e.category },
          };
        })
      : [];

    return [...taskEvents, ...contentEvents, ...billEvents, ...userEvents];
  }, [dbTasks, dbContent, dbBills, dbEvents, filter]);

  // Drag handlers ------------------------------------------------------------

  const handleRangeSelect = (start: Date, end: Date, allDay: boolean) => {
    setEditing({
      title: "",
      startAt: toLocalISO(start),
      endAt: toLocalISO(end),
      category: "meeting",
      allDay,
      isNew: true,
    });
  };

  const handleDateClick = (date: Date) => {
    // Click rapido em um dia: cria event default de 1h
    const end = new Date(date);
    end.setHours(end.getHours() + 1);
    setEditing({
      title: "",
      startAt: toLocalISO(date),
      endAt: toLocalISO(end),
      category: "meeting",
      allDay: false,
      isNew: true,
    });
  };

  const handleEventClick = (id: string) => {
    if (id.startsWith("event-")) {
      const realId = id.replace("event-", "");
      const e = (dbEvents as any[]).find((x) => x.id === realId);
      if (e) {
        setEditing({
          id: e.id,
          title: e.title,
          description: e.description ?? "",
          startAt: toLocalISO(new Date(e.startAt ?? e.start_at)),
          endAt: e.endAt || e.end_at
            ? toLocalISO(new Date(e.endAt ?? e.end_at))
            : undefined,
          category: e.category ?? "meeting",
          allDay: !!(e.allDay ?? e.all_day),
          isNew: false,
        });
      }
    } else if (id.startsWith("task-")) {
      toast.info("Editar tarefa em /tasks");
    } else if (id.startsWith("content-")) {
      toast.info("Editar conteúdo em Content Studio");
    } else if (id.startsWith("bill-")) {
      toast.info("Editar conta em Financeiro");
    }
  };

  const handleEventMove = async (
    id: string,
    newStart: Date,
    newEnd: Date | null,
  ) => {
    if (!id.startsWith("event-")) {
      toast.info("Apenas eventos próprios podem ser movidos pelo calendário");
      return;
    }
    const realId = id.replace("event-", "");
    try {
      await updateEvent.mutateAsync({
        id: realId,
        startAt: newStart.toISOString(),
        endAt: newEnd?.toISOString(),
      });
      toast.success("Evento movido");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao mover");
    }
  };

  const handleSaveEvent = async () => {
    if (!editing || !activeWorkspaceId) return;
    if (!editing.title.trim()) {
      toast.error("Defina um título");
      return;
    }
    try {
      if (editing.isNew) {
        await createEvent.mutateAsync({
          workspaceId: activeWorkspaceId,
          title: editing.title.trim(),
          description: editing.description?.trim() || undefined,
          startAt: new Date(editing.startAt).toISOString(),
          endAt: editing.endAt
            ? new Date(editing.endAt).toISOString()
            : undefined,
          category: editing.category,
          allDay: editing.allDay,
        });
        toast.success("Evento criado");
      } else if (editing.id) {
        await updateEvent.mutateAsync({
          id: editing.id,
          title: editing.title.trim(),
          description: editing.description?.trim(),
          startAt: new Date(editing.startAt).toISOString(),
          endAt: editing.endAt
            ? new Date(editing.endAt).toISOString()
            : undefined,
          category: editing.category,
          allDay: editing.allDay,
        });
        toast.success("Evento atualizado");
      }
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteEvent.mutateAsync(confirmDelete);
      toast.success("Evento removido");
      setConfirmDelete(null);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendário"
        description="Tarefas, conteúdos, lançamentos e financeiro em uma única timeline. Arraste para mover ou criar."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Sugerir agendamento
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                const start = new Date();
                const end = new Date();
                end.setHours(end.getHours() + 1);
                setEditing({
                  title: "",
                  startAt: toLocalISO(start),
                  endAt: toLocalISO(end),
                  category: "meeting",
                  allDay: false,
                  isNew: true,
                });
              }}
            >
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Filter className="h-3 w-3 text-muted-foreground" />
        {(
          [
            ["all", "Tudo"],
            ["task", "📋 Tarefas"],
            ["content", "🎬 Conteúdo"],
            ["bill", "💸 Financeiro"],
            ["event", "📌 Eventos"],
          ] as const
        ).map(([key, label]) => (
          <Badge
            key={key}
            variant={filter === key ? "primary" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(key)}
          >
            {label}
          </Badge>
        ))}
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
                editable
                onEventClick={handleEventClick}
                onDateClick={handleDateClick}
                onRangeSelect={handleRangeSelect}
                onEventMove={handleEventMove}
                onEventResize={handleEventMove}
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
                <button
                  key={e.id}
                  onClick={() => handleEventClick(e.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent transition text-left"
                >
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
                </button>
              ))}
            {events.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum item agendado.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de criar/editar evento */}
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing.isNew ? "Novo Evento" : "Editar Evento"}
              </DialogTitle>
              <DialogDescription>
                Persistido em calendar_events do workspace.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Título</Label>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Início</Label>
                  <Input
                    type="datetime-local"
                    value={editing.startAt}
                    onChange={(e) =>
                      setEditing({ ...editing, startAt: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fim</Label>
                  <Input
                    type="datetime-local"
                    value={editing.endAt ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, endAt: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select
                  value={editing.category}
                  onValueChange={(v) =>
                    setEditing({ ...editing, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="focus">Bloco de foco</SelectItem>
                    <SelectItem value="content">Gravação / conteúdo</SelectItem>
                    <SelectItem value="launch">Lançamento</SelectItem>
                    <SelectItem value="event">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Textarea
                  value={editing.description ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={editing.allDay}
                  onChange={(e) =>
                    setEditing({ ...editing, allDay: e.target.checked })
                  }
                />
                Dia inteiro
              </label>
            </div>

            <DialogFooter className="gap-2">
              {!editing.isNew && editing.id && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(editing.id!)}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                variant="gradient"
                onClick={handleSaveEvent}
                disabled={createEvent.isPending || updateEvent.isPending}
              >
                {editing.isNew ? "Criar evento" : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmação de remoção */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir evento
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? "Removendo..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
