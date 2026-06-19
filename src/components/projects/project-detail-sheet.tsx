"use client";

import * as React from "react";
import { Pencil, Plus, ListChecks, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";
import { useTasks } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { getProjectIcon, getProjectStatus } from "./project-style";

const TASK_STATUS_GROUPS: { id: string; label: string }[] = [
  { id: "doing", label: "Em Progresso" },
  { id: "review", label: "Em Revisão" },
  { id: "todo", label: "A Fazer" },
  { id: "backlog", label: "Pendências" },
  { id: "done", label: "Concluído" },
];

const priorityColor: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

interface ProjectDetailSheetProps {
  project: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  personaName?: string | null;
  onEdit: (project: any) => void;
}

export function ProjectDetailSheet({
  project, open, onOpenChange, workspaceId, personaName, onEdit,
}: ProjectDetailSheetProps) {
  const { data: allTasks = [] } = useTasks(workspaceId);
  const openWith = useQuickCreate((s) => s.openWith);

  const tasks = React.useMemo(
    () => (project ? allTasks.filter((t: any) => t.projectId === project.id) : []),
    [allTasks, project],
  );

  const stats = React.useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t: any) => t.status === "done").length;
    const now = Date.now();
    const overdue = tasks.filter(
      (t: any) => t.status !== "done" && t.dueAt && new Date(t.dueAt).getTime() < now,
    ).length;
    return {
      total,
      done,
      active: total - done,
      overdue,
      progress: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  if (!project) return null;

  const Icon = getProjectIcon(project.icon);
  const status = getProjectStatus(project.status);
  const color = project.color ?? "#3b82f6";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Cabeçalho */}
        <div className="relative overflow-hidden border-b border-border/50 p-6">
          <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(at top left, ${color}30, transparent 65%)` }} />
          <SheetHeader className="relative space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}25`, color }}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="leading-tight pr-6">{project.name}</SheetTitle>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge size="sm" variant={status.variant}>{status.label}</Badge>
                  {personaName && <Badge size="sm" variant="outline">{personaName}</Badge>}
                  {project.createdAt && (
                    <span className="text-[10px] text-muted-foreground">criado {relativeTime(project.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
            {project.description ? (
              <SheetDescription className="text-xs leading-relaxed">{project.description}</SheetDescription>
            ) : (
              <SheetDescription className="text-xs italic opacity-70">Sem descrição.</SheetDescription>
            )}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => onEdit(project)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
              <Button variant="gradient" size="sm" onClick={() => openWith("task", { projectId: project.id })}>
                <Plus className="h-3.5 w-3.5" /> Nova Tarefa
              </Button>
            </div>
          </SheetHeader>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Progresso */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso geral</span>
              <span className="font-semibold">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} />
          </div>

          {/* Mini-stats */}
          <div className="grid grid-cols-4 gap-2">
            <MiniStat icon={<ListChecks className="h-3.5 w-3.5" />} label="Total" value={stats.total} />
            <MiniStat icon={<Clock className="h-3.5 w-3.5 text-primary" />} label="Ativas" value={stats.active} />
            <MiniStat icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />} label="Feitas" value={stats.done} />
            <MiniStat icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" />} label="Atraso" value={stats.overdue} />
          </div>

          {/* Tarefas agrupadas */}
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-10 text-center">
              <p className="text-sm font-medium">Nenhuma tarefa ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Crie a primeira tarefa deste projeto.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => openWith("task", { projectId: project.id })}>
                <Plus className="h-3.5 w-3.5" /> Nova Tarefa
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {TASK_STATUS_GROUPS.map((group) => {
                const groupTasks = tasks.filter((t: any) => t.status === group.id);
                if (groupTasks.length === 0) return null;
                return (
                  <div key={group.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</h4>
                      <Badge size="sm" variant="outline">{groupTasks.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {groupTasks.map((t: any) => {
                        const overdue = t.status !== "done" && t.dueAt && new Date(t.dueAt).getTime() < Date.now();
                        return (
                          <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityColor[t.priority] ?? "bg-muted-foreground")} />
                            <span className={cn("flex-1 truncate text-xs", t.status === "done" && "line-through text-muted-foreground")}>
                              {t.title}
                            </span>
                            {t.dueAt && (
                              <span className={cn("shrink-0 text-[10px]", overdue ? "text-warning font-medium" : "text-muted-foreground")}>
                                {relativeTime(t.dueAt)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/40 p-2 text-center">
      <div className="flex items-center justify-center">{icon}</div>
      <p className="mt-0.5 text-base font-bold font-mono leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
