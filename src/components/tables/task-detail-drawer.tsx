"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle2,
  Flag,
  Link2,
  ListChecks,
  MessageSquare,
  Paperclip,
  Sparkles,
  Tag,
  User as UserIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MOCK_USERS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { initials, relativeTime } from "@/lib/utils/format";
import type { Task } from "@/types";
import { cn } from "@/lib/utils/cn";

const priorityColor: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

const sampleSubtasks = [
  { id: "s1", title: "Definir hook do reel", done: true },
  { id: "s2", title: "Validar com strategist", done: true },
  { id: "s3", title: "Capturar B-roll", done: false },
  { id: "s4", title: "Editar e exportar", done: false },
];

const sampleComments = [
  {
    id: "c1",
    user: MOCK_USERS[1],
    body: "Aprovado pela Marina. Pode seguir.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "c2",
    user: MOCK_USERS[0],
    body: "Lembrar de manter o tom cinematográfico nas transições.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTaskComments,
  useTaskSubtasks,
  useCreateTaskCommentMutation,
  useCreateSubtaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusAndPositionMutation,
} from "@/hooks/use-queries";
import { toast } from "sonner";

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({ task, open, onOpenChange }: Props) {
  const [comment, setComment] = React.useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");
  const [showAddSubtask, setShowAddSubtask] = React.useState(false);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries reais
  const { data: dbComments = [] } = useTaskComments(task?.id);
  const { data: dbSubtasks = [] } = useTaskSubtasks(task?.id);

  // Mutations reais
  const createTaskComment = useCreateTaskCommentMutation();
  const createSubtask = useCreateSubtaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const updateTaskStatus = useUpdateTaskStatusAndPositionMutation();

  if (!task) return null;

  const comments = isMockModeClient && dbComments.length === 0 ? sampleComments : dbComments;
  const subtasks = isMockModeClient && dbSubtasks.length === 0 ? sampleSubtasks : dbSubtasks;
  const attachments = isMockModeClient ? ["mood-aurora.pdf", "broll-001.mp4"] : [];

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await createTaskComment.mutateAsync({ taskId: task.id, body: comment });
      setComment("");
      toast.success("Comentário adicionado!");
    } catch (e: any) {
      toast.error("Erro ao comentar: " + e.message);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !activeWorkspaceId) return;
    try {
      await createSubtask.mutateAsync({
        parentTaskId: task.id,
        title: newSubtaskTitle,
        workspaceId: activeWorkspaceId,
        personaId: task.personaId || undefined,
      });
      setNewSubtaskTitle("");
      setShowAddSubtask(false);
      toast.success("Subtarefa criada!");
    } catch (e: any) {
      toast.error("Erro ao criar subtarefa: " + e.message);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, checked: boolean) => {
    try {
      await updateTaskStatus.mutateAsync({
        id: subtaskId,
        status: checked ? "done" : "todo",
      });
      toast.success("Subtarefa atualizada!");
    } catch (e: any) {
      toast.error("Erro ao atualizar subtarefa: " + e.message);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm("Deseja realmente excluir esta tarefa?")) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success("Tarefa excluída!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao excluir tarefa: " + e.message);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-2xl w-full overflow-y-auto"
      >
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                priorityColor[task.priority],
              )}
            />
            <span>Tarefa · {task.id}</span>
            <span>·</span>
            <span>{task.priority}</span>
          </div>
          <SheetTitle className="text-xl">{task.title}</SheetTitle>
          {task.description && (
            <SheetDescription>{task.description}</SheetDescription>
          )}
        </SheetHeader>

        <div className="grid grid-cols-3 gap-4 py-6 text-xs">
          <Field
            icon={<Flag className="h-3 w-3" />}
            label="Status"
            value={<Badge size="sm">{task.status}</Badge>}
          />
          <Field
            icon={<UserIcon className="h-3 w-3" />}
            label="Responsável"
            value={
              task.assignee?.fullName ? (
                <div className="flex items-center gap-1.5">
                  <Avatar size="xs">
                    <AvatarFallback>
                      {initials(task.assignee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{task.assignee.fullName.split(" ")[0]}</span>
                </div>
              ) : (
                "—"
              )
            }
          />
          <Field
            icon={<Calendar className="h-3 w-3" />}
            label="Prazo"
            value={task.dueAt ? relativeTime(task.dueAt) : "—"}
          />
          {task.labels && task.labels.length > 0 && (
            <Field
              icon={<Tag className="h-3 w-3" />}
              label="Etiquetas"
              value={
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((l) => (
                    <Badge key={l} size="sm" variant="ghost">
                      {l}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}
          {task.relatedEntity && (
            <Field
              icon={<Link2 className="h-3 w-3" />}
              label="Vinculado a"
              value={
                <Badge variant="outline" size="sm">
                  {task.relatedEntity.title ?? task.relatedEntity.type}
                </Badge>
              }
              colSpan={2}
            />
          )}
        </div>

        <Separator />

        <section className="py-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-primary" /> Subtarefas
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAddSubtask(!showAddSubtask)}>
              {showAddSubtask ? "Cancelar" : "+ Adicionar"}
            </Button>
          </div>

          {showAddSubtask && (
            <div className="flex gap-2">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Título da subtarefa…"
                className="text-xs"
              />
              <Button size="sm" variant="gradient" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
                Adicionar
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            {subtasks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-card/30 px-3 py-3 text-xs text-muted-foreground">
                Nenhuma subtarefa cadastrada.
              </p>
            ) : (
              subtasks.map((s: any) => {
                const isDone = s.status === "done" || s.done;
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border/60 bg-card-elevated px-3 py-2 text-sm",
                      isDone && "opacity-60",
                    )}
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={(checked) => handleToggleSubtask(s.id, !!checked)}
                    />
                    <span className={cn(isDone && "line-through")}>{s.title}</span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <Separator />

        <section className="py-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Paperclip className="h-3.5 w-3.5 text-primary" /> Anexos
          </h3>
          <div className="flex flex-wrap gap-2">
            {attachments.length === 0 && (
              <span className="rounded-lg border border-dashed border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
                Nenhum anexo real.
              </span>
            )}
            {attachments.map((f) => (
              <Badge key={f} variant="outline" className="gap-1.5">
                <Paperclip className="h-3 w-3" /> {f}
              </Badge>
            ))}
            <Button variant="outline" size="sm">
              + Anexar
            </Button>
          </div>
        </section>

        <Separator />

        <section className="py-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Comentários
          </h3>
          <div className="space-y-3">
            {comments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-card/30 px-3 py-3 text-xs text-muted-foreground">
                Nenhum comentário cadastrado.
              </p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(c.author?.fullName || "Colaborador")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 rounded-lg border border-border/60 bg-card-elevated px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium">
                        {c.author?.fullName || "Equipe"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm">{c.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva um comentário…"
              rows={2}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setComment("Roteiro revisado e de acordo com as diretrizes da persona. Pronto para gravação!");
                toast.success("Sugestão de IA gerada com sucesso!");
              }}
            >
              <Sparkles className="h-3 w-3" /> Sugerir com IA
            </Button>
            <Button variant="gradient" size="sm" disabled={!comment.trim() || createTaskComment.isPending} onClick={handleAddComment}>
              {createTaskComment.isPending ? "Comentando…" : "Comentar"}
            </Button>
          </div>
        </section>

        <Separator />

        <section className="py-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Criada {relativeTime(task.createdAt)} · sincronizada via Supabase Realtime
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={handleDeleteTask}
            disabled={deleteTask.isPending}
          >
            {deleteTask.isPending ? "Excluindo…" : "Excluir tarefa"}
          </Button>
        </section>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  icon,
  label,
  value,
  colSpan,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <div className={cn("space-y-1.5", colSpan === 2 && "col-span-2")}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}
