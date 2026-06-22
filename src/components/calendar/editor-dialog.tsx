"use client";

import * as React from "react";
import {
  MessageSquare,
  Calendar,
  Link as LinkIcon,
  Trash2,
  User,
  Plus,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
  Clock,
  PlayCircle,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ContentItem, Task, User as UserType, Persona } from "@/types";
import { initials, relativeTime } from "@/lib/utils/format";
import {
  useTaskComments,
  useCreateTaskCommentMutation,
  useDeleteTaskCommentMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
  useDeleteTaskMutation,
} from "@/hooks/use-queries";

interface EditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentItem: ContentItem | null;
  task: Task | null;
  workspaceId: string;
  editors: UserType[];
  personas: Persona[];
}

const STATUS_LABELS: Record<string, string> = {
  idea: "Ideia",
  pending: "Pendente",
  scripted: "Roteirizado",
  recorded: "Gravado",
  editing: "Editando",
  scheduled: "Agendado",
  posted: "Postado",
  analyzed: "Analisado",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: "Pendências",
  todo: "A Fazer",
  doing: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

export function EditorDialog({
  open,
  onOpenChange,
  contentItem,
  task,
  workspaceId,
  editors,
  personas,
}: EditorDialogProps) {
  // Mutations
  const updateContent = useUpdateContentMutation();
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const createTaskComment = useCreateTaskCommentMutation();
  const deleteTaskComment = useDeleteTaskCommentMutation();
  const deleteContent = useDeleteContentMutation();
  const deleteTask = useDeleteTaskMutation();

  // Task comments query (only runs if task exists)
  const { data: dbComments = [], refetch: refetchComments } = useTaskComments(task?.id);

  // Form states
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState("idea");
  const [script, setScript] = React.useState("");
  const [hook, setHook] = React.useState("");
  const [visualBrief, setVisualBrief] = React.useState("");
  const [audioReference, setAudioReference] = React.useState("");
  const [videoLink, setVideoLink] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("none");
  const [commentText, setCommentText] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Load initial values
  React.useEffect(() => {
    if (contentItem) {
      setTitle(contentItem.title || "");
      setStatus(contentItem.status || "idea");
      setScript(contentItem.script || "");
      setHook(contentItem.hook || "");
      setVisualBrief(contentItem.visualBrief || "");
      setAudioReference(contentItem.audioReference || "");
      setVideoLink((contentItem as any).metadata?.videoLink || "");
    } else {
      setTitle("");
      setStatus("idea");
      setScript("");
      setHook("");
      setVisualBrief("");
      setAudioReference("");
      setVideoLink("");
    }

    if (task) {
      setAssigneeId(task.assignee?.id || "none");
      if (task.dueAt) {
        const d = new Date(task.dueAt);
        if (!isNaN(d.getTime())) {
          setDueAt(d.toISOString().slice(0, 10)); // YYYY-MM-DD
        } else {
          setDueAt("");
        }
      } else {
        setDueAt("");
      }
    } else {
      setAssigneeId("none");
      setDueAt("");
    }
  }, [contentItem, task]);

  if (!contentItem) return null;

  const handleSaveData = async () => {
    if (!title.trim()) {
      toast.error("O título é obrigatório!");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update content item
      const updatedMetadata = {
        ...(contentItem as any).metadata,
        videoLink: videoLink.trim(),
      };

      await updateContent.mutateAsync({
        id: contentItem.id,
        input: {
          title: title.trim(),
          status: status,
          script: script.trim(),
          hook: hook.trim(),
          visualBrief: visualBrief.trim(),
          audioReference: audioReference.trim(),
          metadata: updatedMetadata,
        },
      });

      // 2. Create or Update associated Task
      if (task) {
        // Update existing task
        await updateTask.mutateAsync({
          id: task.id,
          input: {
            title: `Editar: ${title.trim()}`,
            assigneeId: assigneeId === "none" ? null : assigneeId,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            description: `Gravação/Edição do conteúdo: "${title.trim()}".\nCanal: ${contentItem.channel}\nRoteiro: ${script.trim()}\nVisual: ${visualBrief.trim()}`,
          },
        });
      } else if (assigneeId !== "none" || dueAt) {
        // Create new task if assignee or deadline is set
        await createTask.mutateAsync({
          workspaceId,
          personaId: contentItem.personaId || undefined,
          title: `Editar: ${title.trim()}`,
          description: `Gravação/Edição do conteúdo: "${title.trim()}".\nCanal: ${contentItem.channel}\nRoteiro: ${script.trim()}\nVisual: ${visualBrief.trim()}`,
          priority: "medium",
          status: "todo",
          assigneeId: assigneeId === "none" ? undefined : assigneeId,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
          relatedEntity: {
            type: "content",
            id: contentItem.id,
            title: title.trim(),
          },
        });
      }

      toast.success("Dados salvos com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao salvar dados: " + (error?.message ?? error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!contentItem) return;
    if (!confirm("Tem certeza que deseja excluir este vídeo?")) return;

    setIsSaving(true);
    try {
      if (task) {
        await deleteTask.mutateAsync(task.id);
      }
      await deleteContent.mutateAsync(contentItem.id);
      toast.success("Vídeo excluído com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao excluir vídeo: " + (error?.message ?? error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTaskDirectly = async () => {
    try {
      await createTask.mutateAsync({
        workspaceId,
        personaId: contentItem.personaId || undefined,
        title: `Editar: ${title.trim()}`,
        description: `Gravação/Edição do conteúdo: "${title.trim()}".\nCanal: ${contentItem.channel}\nRoteiro: ${script.trim()}\nVisual: ${visualBrief.trim()}`,
        priority: "medium",
        status: "todo",
        assigneeId: assigneeId === "none" ? undefined : assigneeId,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        relatedEntity: {
          type: "content",
          id: contentItem.id,
          title: title.trim(),
        },
      });
      toast.success("Tarefa de edição criada e vinculada!");
    } catch (error: any) {
      toast.error("Erro ao criar tarefa: " + error.message);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !task) return;
    try {
      await createTaskComment.mutateAsync({
        taskId: task.id,
        body: commentText.trim(),
      });
      setCommentText("");
      toast.success("Comentário enviado!");
      refetchComments();
    } catch (error: any) {
      toast.error("Erro ao enviar comentário: " + error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task) return;
    try {
      await deleteTaskComment.mutateAsync({
        id: commentId,
        taskId: task.id,
      });
      toast.success("Comentário excluído!");
      refetchComments();
    } catch (error: any) {
      toast.error("Erro ao excluir comentário: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background border border-border/80 rounded-xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-border/60 shrink-0 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Video className="h-5 w-5 text-primary" />
              {title || "Novo Conteúdo"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span>Canal: <span className="capitalize font-semibold text-foreground">{contentItem.channel}</span></span>
              <span>•</span>
              <span>Tipo: <span className="capitalize font-semibold text-foreground">{contentItem.contentType}</span></span>
              {task && (
                <>
                  <span>•</span>
                  <span>Tarefa vinculada: <Badge variant="outline" className="text-[10px] py-0.5">{TASK_STATUS_LABELS[task.status]}</Badge></span>
                </>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* LEFT SIDE: BRIEFING & FILES */}
          <div className="w-full md:w-3/5 p-6 overflow-y-auto space-y-6 border-r border-border/60">
            {/* Title & Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Título do Vídeo</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: 5 erros fatais de marketing"
                  className="bg-card/45 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status do Vídeo</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="bg-card/45 border-border/60">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, val]) => (
                      <SelectItem key={k} value={k}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Script & Hook */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hook" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gancho (Hook)</Label>
                <Input
                  id="hook"
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Os primeiros 3 segundos cruciais..."
                  className="bg-card/45 border-border/60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="script" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roteiro Completo (Script)</Label>
                <Textarea
                  id="script"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Falas do apresentador, legendas principais..."
                  rows={4}
                  className="bg-card/45 border-border/60 font-sans text-sm resize-none"
                />
              </div>
            </div>

            {/* Observations for Editor (Briefing Visual) */}
            <div className="space-y-1.5">
              <Label htmlFor="visualBrief" className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                Observações de Edição (Briefing Visual)
              </Label>
              <Textarea
                id="visualBrief"
                value={visualBrief}
                onChange={(e) => setVisualBrief(e.target.value)}
                placeholder="Insira notas de estilo, referências de corte, fontes, cores e instruções detalhadas para o editor..."
                rows={3}
                className="bg-primary/5 border-primary/20 focus:border-primary/45 font-sans text-sm resize-none"
              />
            </div>

            {/* Audio reference & Inspiring links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="audioReference" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Áudio de Referência (Link)</Label>
                <div className="relative">
                  <Input
                    id="audioReference"
                    value={audioReference}
                    onChange={(e) => setAudioReference(e.target.value)}
                    placeholder="Link do áudio viral, música no Spotify..."
                    className="bg-card/45 border-border/60 pl-8"
                  />
                  <PlayCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="bg-card/45 border-border/60">
                    <SelectValue placeholder="Selecione o editor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Apenas Criador)</SelectItem>
                    {editors.map((ed) => (
                      <SelectItem key={ed.id} value={ed.id}>
                        {ed.fullName} ({ed.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="bg-border/60" />

            {/* Editor deliveries & Due dates */}
            <div className="bg-card/30 border border-border/60 rounded-lg p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Informações de Entrega do Editor</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dueAt" className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Dia Máximo de Entrega (Prazo)
                  </Label>
                  <Input
                    id="dueAt"
                    type="date"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="bg-card border-border/80 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="videoLink" className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Link do Vídeo Final / Rascunho
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="videoLink"
                      value={videoLink}
                      onChange={(e) => setVideoLink(e.target.value)}
                      placeholder="Link do Drive, Frame.io, Dropbox..."
                      className="bg-card border-border/80 flex-1 text-foreground"
                    />
                    {videoLink && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-border/80"
                        onClick={() => window.open(videoLink, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: COLLABORATIVE CHAT & DISCUSSION */}
          <div className="w-full md:w-2/5 flex flex-col bg-card/15 overflow-hidden">
            <div className="p-4 border-b border-border/60 shrink-0 bg-card/25 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Comunicação e Ajustes</span>
            </div>

            {task ? (
              <>
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {dbComments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-xs font-medium text-muted-foreground">Nenhum ajuste ou comentário registrado.</p>
                      <p className="text-[10px] text-muted-foreground/80 max-w-[200px]">Use esta área para alinhar cortes, legendas ou dar feedback sobre as versões enviadas.</p>
                    </div>
                  ) : (
                    dbComments.map((c: any) => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar size="sm" className="shrink-0 border border-border/60 mt-0.5">
                          <AvatarFallback className="text-[10px]">{initials(c.author?.fullName || "Colaborador")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 rounded-lg border border-border/50 bg-background/55 px-3 py-2 text-foreground space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold truncate">
                              {c.author?.fullName || "Membro da Equipe"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] text-muted-foreground">
                                {relativeTime(c.createdAt)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-muted-foreground hover:text-destructive transition ml-1"
                                title="Excluir"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs whitespace-pre-wrap leading-relaxed">{c.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <div className="p-4 border-t border-border/60 bg-background/50 space-y-2 shrink-0">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Solicite ajustes ou valide a edição..."
                    rows={2}
                    className="bg-card border-border/80 text-xs resize-none"
                  />
                  <div className="flex justify-between items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7 px-2 hover:bg-card border border-border/40 text-muted-foreground"
                      onClick={() => {
                        setCommentText("Edição aprovada de acordo com o briefing! Pronto para exportação final.");
                        toast.success("Sugestão carregada!");
                      }}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Aprovar vídeo
                    </Button>

                    <Button
                      variant="gradient"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!commentText.trim() || createTaskComment.isPending}
                      onClick={handleSendComment}
                    >
                      {createTaskComment.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <Clock className="h-10 w-10 text-warning" />
                <div className="space-y-1.5 max-w-[240px]">
                  <p className="text-sm font-semibold">Sem Tarefa de Edição Ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Para habilitar o chat de comentários e o acompanhamento de prazos, você precisa criar uma tarefa para o editor.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-border/80" onClick={handleCreateTaskDirectly}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Criar Tarefa de Edição
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <DialogFooter className="p-4 border-t border-border/60 shrink-0 bg-card/20 flex flex-row items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
            onClick={handleDeleteContent}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4" />
            Excluir Vídeo
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button variant="gradient" size="sm" onClick={handleSaveData} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
