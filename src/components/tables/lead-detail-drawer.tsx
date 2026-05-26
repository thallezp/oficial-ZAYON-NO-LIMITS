"use client";

import * as React from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Copy,
  Instagram,
  Mail,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";

const statusVariant = {
  open: "outline",
  approached: "primary",
  qualified: "info",
  converted: "success",
  lost: "danger",
  no_response: "ghost",
} as const;

const statusFlow = [
  "open",
  "approached",
  "qualified",
  "converted",
] as const;

interface Props {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailDrawer({ lead, open, onOpenChange }: Props) {
  const [note, setNote] = React.useState("");
  const [activeStatus, setActiveStatus] = React.useState<Lead["status"] | null>(
    null,
  );

  React.useEffect(() => {
    if (lead) setActiveStatus(lead.status);
  }, [lead]);

  if (!lead) return null;

  const score = lead.score ?? 0;
  const currentIndex = statusFlow.indexOf(activeStatus as any);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-2xl w-full overflow-y-auto"
      >
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initials(lead.name ?? "?")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{lead.name}</SheetTitle>
              <SheetDescription>
                {lead.campaign} · {lead.source}
              </SheetDescription>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge size="sm" variant={statusVariant[lead.status]}>
                  {lead.status}
                </Badge>
                <Badge size="sm" variant="ghost">
                  score {score}
                </Badge>
                {lead.convertedValue && (
                  <Badge size="sm" variant="success">
                    {formatCurrency(lead.convertedValue)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Pipeline visual */}
        <section className="py-5 space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Pipeline</span>
            <span>
              {currentIndex >= 0 ? currentIndex + 1 : "?"} / {statusFlow.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {statusFlow.map((s, i) => {
              const reached = currentIndex >= i;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setActiveStatus(s);
                    toast.success(`Movido para ${s}`);
                  }}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition",
                    reached
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "border border-border/60 text-muted-foreground hover:border-border",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Score IA</span>
              <span className="num text-foreground font-medium">{score}</span>
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

        {/* Contato */}
        <section className="py-5 grid grid-cols-2 gap-3 text-sm">
          {lead.email && (
            <InfoRow icon={<Mail className="h-3 w-3" />} label="Email" value={lead.email} copy />
          )}
          {lead.phone && (
            <InfoRow icon={<Phone className="h-3 w-3" />} label="Telefone" value={lead.phone} copy />
          )}
          {lead.instagram && (
            <InfoRow
              icon={<Instagram className="h-3 w-3" />}
              label="Instagram"
              value={lead.instagram}
              copy
            />
          )}
          {lead.responsible && (
            <InfoRow
              icon={<UserIcon className="h-3 w-3" />}
              label="Responsável"
              value={lead.responsible.fullName}
            />
          )}
          <InfoRow
            icon={<Clock className="h-3 w-3" />}
            label="Capturado"
            value={relativeTime(lead.createdAt)}
          />
          <InfoRow
            icon={<Tag className="h-3 w-3" />}
            label="Origem"
            value={lead.source ?? "—"}
          />
        </section>

        <Separator />

        {/* Respostas do form */}
        <section className="py-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Respostas do form
          </h3>
          {lead.answers?.map((a, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2"
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {a.question}
              </p>
              <p className="text-sm italic mt-0.5">"{a.answer}"</p>
            </div>
          ))}
        </section>

        <Separator />

        {/* IA actions */}
        <section className="py-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Wand2 className="h-3.5 w-3.5 text-primary" /> Qualificação com IA
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("IA gerou roteiro de abordagem", {
                  description: "Disponível em AI History",
                })
              }
            >
              <Sparkles className="h-3 w-3" /> Roteiro de abordagem
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("Score recalculado", {
                  description: `Novo score: ${Math.min(100, score + 5)}`,
                })
              }
            >
              <Wand2 className="h-3 w-3" /> Recalcular score
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("Tarefa de follow-up criada", {
                  description: "Vinculada a este lead",
                })
              }
            >
              <Plus className="h-3 w-3" /> Criar follow-up
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() =>
                toast.success("Resposta sugerida pronta", {
                  description: "Cole no WhatsApp",
                })
              }
            >
              <MessageSquare className="h-3 w-3" /> Resposta WhatsApp
            </Button>
          </div>
        </section>

        <Separator />

        {/* Notas */}
        <section className="py-5 space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Notas
          </h3>
          {lead.notes && (
            <div className="rounded-lg border border-border/60 bg-card-elevated px-3 py-2 text-xs text-muted-foreground">
              {lead.notes}
            </div>
          )}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Adicionar nota interna…"
            rows={2}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="gradient"
              disabled={!note.trim()}
              onClick={() => {
                toast.success("Nota adicionada");
                setNote("");
              }}
            >
              Salvar
            </Button>
          </div>
        </section>

        <section className="py-3 flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border/60">
          <Activity className="h-3 w-3" />
          Lead sincronizado em tempo real via Supabase Realtime · audit log ativo
          <CheckCircle2 className="h-3 w-3 text-success ml-auto" />
        </section>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
  copy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copy?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="truncate">{value}</span>
        {copy && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success("Copiado");
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
