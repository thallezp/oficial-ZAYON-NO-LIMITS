"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Calendar as CalendarIcon,
  Filter,
  KanbanSquare,
  LayoutList,
  Plus,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KanbanBoard, type KanbanColumn } from "@/components/tables/kanban-board";
import { DataTable } from "@/components/tables/data-table";
import { TaskDetailDrawer } from "@/components/tables/task-detail-drawer";
import { MOCK_TASKS } from "@/data";
import type { Task, TaskStatus } from "@/types";
import { initials, relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useTasks, useUpdateTaskStatusAndPositionMutation } from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeTasks } from "@/hooks/use-realtime";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";

const columns: KanbanColumn<TaskStatus>[] = [
  { id: "backlog", label: "Backlog", tone: "bg-muted/40" },
  { id: "todo", label: "Todo", tone: "bg-secondary/40" },
  { id: "doing", label: "Doing", tone: "bg-primary/10" },
  { id: "review", label: "Review", tone: "bg-warning/10" },
  { id: "done", label: "Done", tone: "bg-success/10" },
];

const priorityColor: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

const statusColor: Record<string, "primary" | "outline" | "warning" | "success" | "ghost"> = {
  todo: "outline",
  doing: "primary",
  review: "warning",
  done: "success",
  backlog: "ghost",
};

export default function TasksPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.setOpen);
  const openWith = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("task");

  const { data: dbTasks = [] } = useTasks(activeWorkspaceId);
  const updateStatusMutation = useUpdateTaskStatusAndPositionMutation();
  const queryClient = useQueryClient();

  useRealtimeTasks(activeWorkspaceId ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  });

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [search, setSearch] = React.useState("");
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  React.useEffect(() => {
    if (isMockModeClient && dbTasks.length === 0) {
      setTasks(MOCK_TASKS as Task[]);
      return;
    }
    setTasks(dbTasks as Task[]);
  }, [dbTasks]);

  const filteredTasks = React.useMemo(
    () =>
      tasks.filter(
        (t) =>
          !search ||
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          t.labels?.some((l) => l.toLowerCase().includes(search.toLowerCase())),
      ),
    [search, tasks],
  );

  const tableColumns = React.useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tarefa",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                priorityColor[row.original.priority],
              )}
            />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <Badge size="sm" variant={statusColor[getValue<string>()] ?? "outline"}>
            {getValue<string>()}
          </Badge>
        ),
      },
      {
        accessorKey: "priority",
        header: "Prioridade",
        cell: ({ getValue }) => (
          <span className="capitalize text-muted-foreground text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Responsável",
        cell: ({ row }) => {
          const a = row.original.assignee;
          if (!a) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-2">
              <Avatar size="xs">
                <AvatarFallback>{initials(a.fullName)}</AvatarFallback>
              </Avatar>
              <span className="text-xs">{a.fullName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "dueAt",
        header: "Prazo",
        cell: ({ getValue }) => {
          const v = getValue<string | undefined>();
          return (
            <span className="text-muted-foreground text-xs">
              {v ? relativeTime(v) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "labels",
        header: "Etiquetas",
        cell: ({ getValue }) => {
          const labels = (getValue<string[]>() ?? []) as string[];
          return (
            <div className="flex flex-wrap gap-1">
              {labels.map((l) => (
                <Badge key={l} size="sm" variant="ghost">
                  {l}
                </Badge>
              ))}
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tarefas"
        description="Tarefas globais e vinculadas a personas, conteúdos, leads e campanhas."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => {
                openWith("task");
                openQuickCreate(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nova Tarefa
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas, etiquetas, responsáveis…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
          <Badge variant="outline">
            {filteredTasks.filter((t) => t.status !== "done").length} ativas
          </Badge>
          <Badge variant="success">
            {filteredTasks.filter((t) => t.status === "done").length} concluídas
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanSquare className="h-3.5 w-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <LayoutList className="h-3.5 w-3.5" /> Lista
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon className="h-3.5 w-3.5" /> Tabela
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-3.5 w-3.5" /> Calendário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <KanbanBoard
            columns={columns}
            items={filteredTasks}
            onChange={(next) => {
              const oldTasks = [...tasks];
              setTasks((current) => {
                const map = new Map(next.map((t) => [t.id, t]));
                return current.map((t) => map.get(t.id) ?? t);
              });
              next.forEach((newTask) => {
                const oldTask = oldTasks.find((t) => t.id === newTask.id);
                if (oldTask && oldTask.status !== newTask.status) {
                  updateStatusMutation.mutate({
                    id: newTask.id,
                    status: newTask.status,
                  });
                }
              });
            }}
            onAdd={(col) => {
              openWith("task");
              openQuickCreate(true);
            }}
            renderCard={(t) => (
              <div
                className="rounded-lg border border-border/60 bg-card-elevated p-2.5 hover:border-primary/40"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(t);
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      priorityColor[t.priority],
                    )}
                  />
                  {t.dueAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(t.dueAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium leading-snug">{t.title}</p>
                {t.labels && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {t.labels.map((l) => (
                      <Badge key={l} size="sm" variant="ghost">
                        {l}
                      </Badge>
                    ))}
                  </div>
                )}
                {t.assignee?.fullName && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Avatar size="xs">
                      <AvatarFallback>
                        {initials(t.assignee.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground">
                      {t.assignee.fullName.split(" ")[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="list">
          <div className="rounded-xl border border-border/60 bg-card/50 divide-y divide-border/60">
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTask(task)}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    priorityColor[task.priority],
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {task.labels?.map((l) => (
                      <Badge key={l} size="sm" variant="ghost">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Badge size="sm" variant={statusColor[task.status] ?? "outline"}>
                  {task.status}
                </Badge>
                {task.dueAt && (
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    {relativeTime(task.dueAt)}
                  </span>
                )}
                {task.assignee && (
                  <Avatar size="xs">
                    <AvatarFallback>
                      {initials(task.assignee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <DataTable
            data={filteredTasks}
            columns={tableColumns}
            searchPlaceholder="Buscar tarefas…"
            enableSelection
            pageSize={10}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-16 text-center">
            <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Visualização de calendário</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aberto na rota <code>/calendar</code> com as mesmas tarefas via FullCalendar.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(o) => !o && setSelectedTask(null)}
      />
    </div>
  );
}
