"use client";

import * as React from "react";
import {
  Calendar,
  CheckCircle2,
  Flag,
  GitBranch,
  Link2,
  ListChecks,
  MessageSquare,
  Paperclip,
  Sparkles,
  Tag,
  User as UserIcon,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initials, relativeTime } from "@/lib/utils/format";
import type { Task } from "@/types";
import { cn } from "@/lib/utils/cn";

const priorityColor: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-muted-foreground",
};

import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTaskComments,
  useTaskSubtasks,
  useTeam,
  useCreateTaskCommentMutation,
  useCreateSubtaskMutation,
  useCreateTaskMutation,
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

  // "Gerar próxima tarefa" — encadeamento de fluxo (tipo ClickUp)
  const [showNextTask, setShowNextTask] = React.useState(false);
  const [nextTitle, setNextTitle] = React.useState("");
  const [nextAssignee, setNextAssignee] = React.useState("none");
  const [nextDependent, setNextDependent] = React.useState(true);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries reais
  const { data: dbComments = [] } = useTaskComments(task?.id);
  const { data: dbSubtasks = [] } = useTaskSubtasks(task?.id);
  const { data: team = [] } = useTeam(activeWorkspaceId);

  // Mutations reais
  const createTaskComment = useCreateTaskCommentMutation();
  const createSubtask = useCreateSubtaskMutation();
  const createTask = useCreateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const updateTaskStatus = useUpdateTaskStatusAndPositionMutation();

  if (!task) return null;

  const comments = dbComments;
  const subtasks = dbSubtasks;
  const attachments: string[] = [];

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

  const handleCreateNextTask = async () => {
    if (!nextTitle.trim() || !activeWorkspaceId || !task) return;
    try {
      await createTask.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: task.personaId || undefined,
        projectId: task.projectId || undefined,
        title: nextTitle.trim(),
        status: "todo",
        priority: task.priority,
        assigneeId: nextAssignee === "none" ? undefined : nextAssignee,
        // Quando dependente, a nova tarefa fica bloqueada até esta concluir.
        // Quando não, guardamos só a origem (de onde foi gerada) em relatedEntity.
        dependsOnTaskId: nextDependent ? task.id : undefined,
        relatedEntity: nextDependent
          ? undefined
          : { type: "task", id: task.id, title: task.title },
      });
      setNextTitle("");
      setNextAssignee("none");
      setNextDependent(true);
      setShowNextTask(false);
      toast.success(
        nextDependent
          ? "Próxima tarefa criada e dependente desta!"
          : "Próxima tarefa criada!",
      );
    } catch (e: any) {
      toast.error("Erro ao gerar tarefa: " + e.message);
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
            <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
              {renderDescriptionWithImages(task.description)}
            </div>
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
          {task.dependsOn && (
            <Field
              icon={<AlertTriangle className="h-3 w-3 text-warning" />}
              label="Depende de"
              value={
                <div className="flex flex-col gap-1 p-2 rounded-lg border border-warning/20 bg-warning/5">
                  <span className="font-medium text-foreground">{task.dependsOn.title}</span>
                  <Badge 
                    size="sm" 
                    variant={task.dependsOn.status === "done" ? "success" : "warning"}
                    className="w-fit"
                  >
                    {task.dependsOn.status === "done" ? "Liberada (Pronto)" : "Bloqueada (Pendente)"}
                  </Badge>
                </div>
              }
              colSpan={3}
            />
          )}
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-primary" /> Gerar próxima tarefa
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowNextTask(!showNextTask)}>
              {showNextTask ? "Cancelar" : "+ Encadear"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Crie a próxima etapa do fluxo (passa para outra pessoa). Marque
            &quot;Depende desta&quot; para que ela só seja liberada quando esta
            tarefa for concluída.
          </p>

          {showNextTask && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-card-elevated/40 p-3">
              <Input
                value={nextTitle}
                onChange={(e) => setNextTitle(e.target.value)}
                placeholder="Título da próxima tarefa…"
                className="text-xs"
              />
              <Select value={nextAssignee} onValueChange={setNextAssignee}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Responsável…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {team.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={nextDependent}
                  onCheckedChange={(c) => setNextDependent(!!c)}
                />
                Depende desta tarefa (fica bloqueada até esta concluir)
              </label>
              <Button
                size="sm"
                variant="gradient"
                className="w-full"
                onClick={handleCreateNextTask}
                disabled={!nextTitle.trim() || createTask.isPending}
              >
                {createTask.isPending ? "Gerando…" : "Gerar tarefa"}
              </Button>
            </div>
          )}
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
    <div className={cn(
      "space-y-1.5",
      colSpan === 2 && "col-span-2",
      colSpan === 3 && "col-span-3"
    )}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function renderDescriptionWithImages(description: string) {
  const regex = /!\[.*?\]\((https?:\/\/.*?)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(description)) !== null) {
    const textBefore = description.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{textBefore}</span>);
    }
    const imageUrl = match[1];
    parts.push(
      <div key={match.index} className="my-2 border border-border/40 rounded-lg overflow-hidden max-w-full bg-card">
        <img src={imageUrl} alt="screenshot" className="max-w-full h-auto object-contain max-h-[350px] mx-auto" />
      </div>
    );
    lastIndex = regex.lastIndex;
  }

  const textAfter = description.substring(lastIndex);
  if (textAfter) {
    parts.push(<span key={lastIndex} className="whitespace-pre-wrap">{textAfter}</span>);
  }

  return parts.length > 0 ? <div className="space-y-1">{parts}</div> : <div className="whitespace-pre-wrap">{description}</div>;
}
