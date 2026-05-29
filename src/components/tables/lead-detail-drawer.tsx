"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Sparkles,
  Tag,
  User as UserIcon,
  Wand2,
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
import { Progress } from "@/components/ui/progress";
import type { Lead } from "@/types";
import { initials, relativeTime, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  useArchiveLeadMutation,
  useCreateLeadCommentMutation,
  useUpdateLeadMutation,
} from "@/hooks/use-queries";

const statusVariant = {
  open: "outline",
  approached: "primary",
  qualified: "info",
  converted: "success",
  lost: "danger",
  no_response: "ghost",
} as const;

const statusFlow = ["open", "approached", "qualified", "converted"] as const;

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (lead: Lead) => void;
  onCreateTask?: (lead: Lead) => void;
}

export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  onEdit,
  onCreateTask,
}: Props) {
  const [comment, setComment] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState<Lead["status"] | null>(null);
  const updateLeadMutation = useUpdateLeadMutation();
  const archiveLeadMutation = useArchiveLeadMutation();
  const createCommentMutation = useCreateLeadCommentMutation();

  React.useEffect(() => {
    if (lead) setActiveStatus(lead.status);
  }, [lead]);

  if (!lead) return null;

  const score = lead.score ?? 0;
  const currentIndex = statusFlow.indexOf((activeStatus || lead.status) as any);
  const primaryPain = lead.answers?.[0]?.answer ?? lead.notes ?? "momento atual";

  const handleStatusChange = async (newStatus: Lead["status"]) => {
    try {
      setActiveStatus(newStatus);
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        input: { status: newStatus },
      });
      toast.success(`Lead movido para ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      await createCommentMutation.mutateAsync({
        leadId: lead.id,
        workspaceId: lead.workspaceId,
        content: comment.trim(),
      });
      setComment("");
      toast.success("Comentário salvo");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar comentário");
    }
  };

  const handleArchive = async () => {
    try {
      await archiveLeadMutation.mutateAsync(lead.id);
      toast.success("Lead arquivado");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao arquivar lead");
    }
  };

  const handleAiQualification = async () => {
    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "lead-qualification",
          input: {
            name: lead.name,
            campaign: lead.campaign,
            source: lead.source,
            notes: lead.notes,
            answers: lead.answers,
            email: lead.email,
            phone: lead.phone,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Erro ao qualificar");

      const next = json.data as { score: number; status: Lead["status"]; rationale: string };
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        input: {
          score: next.score,
          status: next.status,
          notes: [lead.notes, `IA: ${next.rationale}`].filter(Boolean).join("\n\n"),
        },
      });
      setActiveStatus(next.status);
      toast.success(`Lead qualificado com score ${next.score}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao qualificar lead");
    }
  };

  const handleApproach = async () => {
    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "lead-approach",
          input: {
            name: lead.name,
            campaign: lead.campaign,
            source: lead.source,
            primaryPain,
            answers: lead.answers,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Erro ao gerar abordagem");
      await navigator.clipboard.writeText(json.data.text);
      toast.success("Abordagem copiada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar abordagem");
    }
  };

  const openWhatsApp = () => {
    if (!lead.phone) return;
    const clean = lead.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank", "noopener,noreferrer");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-2xl w-full overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initials(lead.name ?? "?")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-xl">{lead.name || "Lead sem nome"}</SheetTitle>
              <SheetDescription>
                {lead.campaign || "Sem campanha"} · {lead.source || "Sem origem"}
              </SheetDescription>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge size="sm" variant={statusVariant[activeStatus || lead.status] || "outline"}>
                  {activeStatus || lead.status}
                </Badge>
                <Badge size="sm" variant="ghost">
                  score {score}
                </Badge>
                {lead.convertedValue ? (
                  <Badge size="sm" variant="success">
                    {formatCurrency(Number(lead.convertedValue))}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={openWhatsApp} disabled={!lead.phone}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={handleApproach}>
              <Sparkles className="h-3.5 w-3.5" /> Abordagem IA
            </Button>
            <Button size="sm" variant="outline" onClick={handleAiQualification}>
              <Wand2 className="h-3.5 w-3.5" /> Qualificar IA
            </Button>
            <Button size="sm" variant="outline" onClick={() => onEdit?.(lead)}>
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={handleArchive}>
              Arquivar
            </Button>
          </div>
        </SheetHeader>

        <section className="space-y-3 py-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Pipeline</span>
            <span>
              {currentIndex >= 0 ? currentIndex + 1 : "?"} / {statusFlow.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {statusFlow.map((status, index) => {
              const reached = currentIndex >= index;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-[10px] font-medium transition",
                    reached
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-border",
                  )}
                >
                  {status}
                </button>
              );
            })}
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Score</span>
              <span className="font-medium text-foreground">{score}</span>
            </div>
            <Progress
              value={score}
              indicatorClassName={cn(
                score > 80 && "bg-success",
                score > 60 && score <= 80 && "bg-warning",
                score <= 60 && "bg-muted-foreground",
              )}
            />
          </div>
        </section>

        <Separator />

        <section className="grid grid-cols-2 gap-3 py-5 text-sm">
          <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={lead.email} copy />
          <InfoRow icon={<Phone className="h-3 w-3" />} label="Telefone" value={lead.phone} copy />
          <InfoRow icon={<Instagram className="h-3 w-3" />} label="Instagram" value={lead.instagram} copy />
          <InfoRow
            icon={<UserIcon className="h-3 w-3" />}
            label="Responsável"
            value={lead.responsible?.fullName}
          />
          <InfoRow icon={<Clock className="h-3 w-3" />} label="Capturado" value={relativeTime(lead.createdAt)} />
          <InfoRow icon={<Tag className="h-3 w-3" />} label="Origem" value={lead.source} />
        </section>

        <Separator />

        <section className="space-y-3 py-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Respostas completas
          </h3>
          {lead.answers?.length ? (
            lead.answers.map((answer, index) => (
              <div key={`${answer.question}-${index}`} className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {answer.question}
                </p>
                <p className="mt-1 text-sm italic">"{answer.answer}"</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma resposta registrada.</p>
          )}
        </section>

        <Separator />

        <section className="space-y-3 py-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="h-3.5 w-3.5 text-primary" /> Tarefas vinculadas
            </h3>
            <Button size="sm" variant="outline" onClick={() => onCreateTask?.(lead)}>
              Criar tarefa
            </Button>
          </div>
          {lead.linkedTasks?.length ? (
            <div className="space-y-2">
              {lead.linkedTasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge size="sm" variant="outline">
                      {task.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    prioridade {task.priority}
                    {task.dueAt ? ` · vence ${relativeTime(task.dueAt)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada ainda.</p>
          )}
        </section>

        <Separator />

        <section className="space-y-3 py-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Comentários
          </h3>
          {lead.comments?.length ? (
            <div className="space-y-2">
              {lead.comments.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {entry.author?.fullName || "Time"}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(entry.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{entry.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem comentários até aqui.</p>
          )}
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Adicionar comentário interno..."
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="gradient"
              onClick={handleAddComment}
              disabled={!comment.trim() || createCommentMutation.isPending}
            >
              Salvar comentário
            </Button>
          </div>
        </section>

        <Separator />

        <section className="space-y-3 py-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-3.5 w-3.5 text-primary" /> Histórico
          </h3>
          {lead.history?.length ? (
            <div className="space-y-2">
              {lead.history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card-elevated px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">
                      {item.fromStatus ? `${item.fromStatus} → ${item.toStatus}` : item.toStatus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.changedBy?.fullName || "Sistema"}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(item.changedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sem transições registradas.</p>
          )}
        </section>

        {lead.notes ? (
          <>
            <Separator />
            <section className="space-y-2 py-5">
              <h3 className="text-sm font-semibold">Notas internas</h3>
              <div className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2 text-sm whitespace-pre-line">
                {lead.notes}
              </div>
            </section>
          </>
        ) : null}

        <section className="flex items-center gap-2 border-t border-border/60 py-3 text-[10px] text-muted-foreground">
          <Activity className="h-3 w-3" />
          Lead sincronizado em tempo real via Supabase Realtime
          <CheckCircle2 className="ml-auto h-3 w-3 text-success" />
        </section>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
  copy = false,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  copy?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="truncate">{value}</span>
        {copy ? (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copiado");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
