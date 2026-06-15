"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertObjective } from "@/hooks/use-queries";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UpsertObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective?: any | null; // Pass an objective to edit
}

export function UpsertObjectiveDialog({
  open,
  onOpenChange,
  objective,
}: UpsertObjectiveDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertObjectiveMutation = useUpsertObjective();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [emoji, setEmoji] = React.useState("🎯");
  const [category, setCategory] = React.useState("Geral");
  const [status, setStatus] = React.useState("active");
  const [deadline, setDeadline] = React.useState("");
  const [milestonesRaw, setMilestonesRaw] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (objective) {
        setName(objective.name || "");
        setDescription(objective.description || "");
        setEmoji(objective.emoji || "🎯");
        setCategory(objective.category || "Geral");
        setStatus(objective.status || "active");
        setDeadline(objective.deadline ? new Date(objective.deadline).toISOString().slice(0, 10) : "");

        const miles = Array.isArray(objective.milestones) ? objective.milestones : [];
        const lines = miles.map((m: any) => typeof m === "string" ? m : m.title || "").filter(Boolean).join("\n");
        setMilestonesRaw(lines);
      } else {
        setName("");
        setDescription("");
        setEmoji("🎯");
        setCategory("Geral");
        setStatus("active");
        setDeadline("");
        setMilestonesRaw("");
      }
    }
  }, [open, objective]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo.");
      return;
    }
    if (!name.trim()) {
      toast.error("Nome do objetivo é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      // Parse milestones line-by-line
      const lines = milestonesRaw.split("\n").map(l => l.trim()).filter(Boolean);
      // Map to [{ title: string, completed: boolean }]
      const milestones = lines.map(line => {
        // Try to match existing milestones if editing
        const existing = Array.isArray(objective?.milestones) 
          ? objective.milestones.find((m: any) => (m.title === line || m === line)) 
          : null;
        const completed = typeof existing === "object" && existing !== null ? !!existing.completed : false;
        return { title: line, completed };
      });

      await upsertObjectiveMutation.mutateAsync({
        id: objective?.id,
        workspaceId: activeWorkspaceId,
        name: name.trim(),
        description: description.trim() || null,
        emoji: emoji.trim() || "🎯",
        category: category.trim(),
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        milestones,
      });

      toast.success(objective ? "Objetivo atualizado!" : "Objetivo criado!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar objetivo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{objective ? "Editar Objetivo" : "Novo Objetivo"}</DialogTitle>
          <DialogDescription>
            Defina objetivos estratégicos amplos para seus estudos e projetos, dividindo-os em marcos menores.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1">
              <Label htmlFor="objEmoji">Emoji</Label>
              <Input
                id="objEmoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🎯"
                maxLength={4}
                className="text-center text-lg"
              />
            </div>
            <div className="col-span-3 space-y-1">
              <Label htmlFor="objName">Nome do Objetivo</Label>
              <Input
                id="objName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dominar Backend & Banco de Dados"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="objDescription">Descrição</Label>
            <Textarea
              id="objDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que este objetivo significa e por que é importante."
              rows={2.5}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="objCategory">Categoria</Label>
              <Input
                id="objCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Carreira, Faculdade"
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="objDeadline">Prazo Limite</Label>
              <Input
                id="objDeadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="objMilestones">Marcos / Entregáveis (Um por linha)</Label>
              <span className="text-[10px] text-muted-foreground">Ex: Concluir curso SQL</span>
            </div>
            <Textarea
              id="objMilestones"
              value={milestonesRaw}
              onChange={(e) => setMilestonesRaw(e.target.value)}
              placeholder="Digite cada marco em uma linha diferente..."
              rows={4}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
