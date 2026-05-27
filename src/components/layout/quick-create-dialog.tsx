"use client";

import * as React from "react";
import {
  Activity,
  CircleDollarSign,
  FileText,
  Hammer,
  Image as ImageIcon,
  ListChecks,
  Sparkles,
  Workflow,
  Folder,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useActivePersona } from "@/stores/persona-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useCreateTaskMutation,
  useCreateDocumentMutation,
  useCreateContentMutation,
  useCreateLeadMutation,
  useCreateFinancialMutation,
  useUpsertPersonaMutation,
  useCreateFlowMutation,
  useCreateToolMutation,
  useCreateProjectMutation,
} from "@/hooks/use-queries";

type Entity =
  | "task"
  | "document"
  | "content"
  | "lead"
  | "transaction"
  | "persona"
  | "flow"
  | "tool"
  | "project";

const entityOptions: {
  id: Entity;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "task", label: "Tarefa", description: "Atribuir, vincular a persona ou conteúdo", icon: ListChecks },
  { id: "document", label: "Documento", description: "Wiki, ata, briefing, playbook", icon: FileText },
  { id: "content", label: "Conteúdo", description: "Reel, story, post, email, ad", icon: ImageIcon },
  { id: "lead", label: "Lead", description: "Entrada manual no CRM", icon: Activity },
  { id: "transaction", label: "Lançamento financeiro", description: "Receita ou despesa", icon: CircleDollarSign },
  { id: "flow", label: "Flow", description: "Processo ou automação", icon: Workflow },
  { id: "persona", label: "Persona", description: "Nova unidade de negócio", icon: Sparkles },
  { id: "tool", label: "Ferramenta", description: "Adicionar ao Tools Hub", icon: Hammer },
  { id: "project", label: "Projeto", description: "Iniciativa ou campanha de longo prazo", icon: Folder },
];

export function QuickCreateDialog() {
  const { open, entity, setOpen, openWith } = useQuickCreate();
  const persona = useActivePersona();
  const [selected, setSelected] = React.useState<Entity | null>(entity);
  const [title, setTitle] = React.useState("");
  const [details, setDetails] = React.useState("");

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const createTask = useCreateTaskMutation();
  const createDocument = useCreateDocumentMutation();
  const createContent = useCreateContentMutation();
  const createLead = useCreateLeadMutation();
  const createFinancial = useCreateFinancialMutation();
  const createPersona = useUpsertPersonaMutation();
  const createFlow = useCreateFlowMutation();
  const createTool = useCreateToolMutation();
  const createProject = useCreateProjectMutation();

  React.useEffect(() => {
    if (open) {
      setSelected(entity ?? "task");
      setTitle("");
      setDetails("");
    }
  }, [open, entity]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo selecionado");
      return;
    }

    try {
      switch (selected) {
        case "task":
          await createTask.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            title,
            description: details || undefined,
            status: "todo",
            priority: "medium",
          });
          break;
        case "document":
          await createDocument.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            title,
            content: details || "",
          });
          break;
        case "content":
          await createContent.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            title,
            caption: details || undefined,
            channel: "instagram",
            contentType: "reel",
            status: "idea",
          });
          break;
        case "lead":
          await createLead.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            name: title,
            notes: details || undefined,
            status: "open",
            score: 50,
            source: "manual",
          });
          break;
        case "transaction":
          await createFinancial.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            description: title,
            category: "Geral",
            amount: Number(details) || 0,
            type: "revenue",
            status: "paid",
            occurredAt: new Date().toISOString(),
          });
          break;
        case "persona":
          await createPersona.mutateAsync({
            workspaceId: activeWorkspaceId,
            name: title,
            bigIdea: details || undefined,
            status: "building",
          });
          break;
        case "flow":
          await createFlow.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            name: title,
            description: details || undefined,
            type: "process",
          });
          break;
        case "tool":
          await createTool.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            name: title,
            description: details || undefined,
            url: details && details.startsWith("http") ? details : "https://",
            category: "IA",
          });
          break;
        case "project":
          await createProject.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona?.id || undefined,
            name: title,
            description: details || undefined,
            status: "active",
            color: "#3b82f6",
          });
          break;
      }

      const labels = {
        task: "Tarefa",
        document: "Documento",
        content: "Conteúdo",
        lead: "Lead",
        transaction: "Lançamento",
        persona: "Persona",
        flow: "Flow",
        tool: "Ferramenta",
        project: "Projeto",
      } as const;

      toast.success(`${labels[selected!]} criada com sucesso!`, {
        description: `${title} · contexto: ${persona?.name ?? "Workspace"}`,
      });
      setOpen(false);
    } catch (err: any) {
      toast.error(`Erro ao criar: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar rápido</DialogTitle>
          <DialogDescription>
            Escolha o tipo · vinculado ao workspace e à persona ativa quando
            aplicável.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {entityOptions.map((o) => {
            const active = selected === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSelected(o.id);
                  openWith(o.id);
                }}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition",
                  active
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <o.icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className="text-xs font-medium">{o.label}</span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="text-[11px] text-muted-foreground border border-dashed border-border/60 rounded-lg px-3 py-2 bg-card/30">
            {entityOptions.find((o) => o.id === selected)?.description}
            {persona && (
              <>
                {" · "}
                <Badge size="sm" variant="primary">
                  vinculado a {persona.name}
                </Badge>
              </>
            )}
          </div>
        )}

        <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1">
            <Label htmlFor="qc-title">Título</Label>
            <Input
              id="qc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Comece pelo essencial…"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qc-details">Detalhes (opcional)</Label>
            <Textarea
              id="qc-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Adicione contexto, links, anexos…"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={!title.trim()}>
              <Sparkles className="h-3.5 w-3.5" /> Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
