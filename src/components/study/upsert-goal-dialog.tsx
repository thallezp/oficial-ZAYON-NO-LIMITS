"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertGoal, useStudyTracks, useStudyObjectives } from "@/hooks/use-queries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UpsertGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: any | null; // Pass a goal to edit
}

export function UpsertGoalDialog({
  open,
  onOpenChange,
  goal,
}: UpsertGoalDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertGoalMutation = useUpsertGoal();

  const { data: tracks = [] } = useStudyTracks(activeWorkspaceId);
  const { data: objectives = [] } = useStudyObjectives(activeWorkspaceId);

  const [title, setTitle] = React.useState("");
  const [metric, setMetric] = React.useState("hours");
  const [target, setTarget] = React.useState("");
  const [period, setPeriod] = React.useState("weekly");
  const [status, setStatus] = React.useState("active");
  const [startDate, setStartDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [trackId, setTrackId] = React.useState("none");
  const [objectiveId, setObjectiveId] = React.useState("none");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (goal) {
        setTitle(goal.title || "");
        setMetric(goal.metric || "hours");
        setTarget(goal.target ? String(goal.target) : "");
        setPeriod(goal.period || "weekly");
        setStatus(goal.status || "active");
        setStartDate(goal.startDate ? new Date(goal.startDate).toISOString().slice(0, 10) : "");
        setDueDate(goal.dueDate ? new Date(goal.dueDate).toISOString().slice(0, 10) : "");
        setTrackId(goal.trackId || "none");
        setObjectiveId(goal.objectiveId || "none");
      } else {
        setTitle("");
        setMetric("hours");
        setTarget("");
        setPeriod("weekly");
        setStatus("active");
        setStartDate(new Date().toISOString().slice(0, 10));
        setDueDate("");
        setTrackId("none");
        setObjectiveId("none");
      }
    }
  }, [open, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo.");
      return;
    }
    if (!title.trim()) {
      toast.error("Título da meta é obrigatório.");
      return;
    }
    if (!target.trim() || isNaN(Number(target)) || Number(target) <= 0) {
      toast.error("Valor alvo inválido. Deve ser maior que 0.");
      return;
    }

    setSubmitting(true);
    try {
      await upsertGoalMutation.mutateAsync({
        id: goal?.id,
        workspaceId: activeWorkspaceId,
        title: title.trim(),
        metric,
        target: parseInt(target, 10),
        period,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        trackId: trackId !== "none" ? trackId : null,
        objectiveId: objectiveId !== "none" ? objectiveId : null,
      });

      toast.success(goal ? "Meta atualizada!" : "Meta criada com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar meta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{goal ? "Editar Meta" : "Nova Meta Mensurável"}</DialogTitle>
          <DialogDescription>
            Defina uma meta quantificável para impulsionar sua disciplina e acompanhar progresso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="goalTitle">Título da Meta</Label>
            <Input
              id="goalTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Focar 10 horas semanais"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Métrica</Label>
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger>
                  <SelectValue placeholder="Métrica..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Horas Focadas</SelectItem>
                  <SelectItem value="pages">Páginas Lidas</SelectItem>
                  <SelectItem value="sessions">Sessões Realizadas</SelectItem>
                  <SelectItem value="streak">Streak (Dias Seguidos)</SelectItem>
                  <SelectItem value="custom">Outra Métrica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="goalTarget">Valor Alvo (Target)</Label>
              <Input
                id="goalTarget"
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Ex: 10"
                min={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Recorrência / Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Recorrência..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="total">Total Acumulado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="achieved">Concluída (Atingida)</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="dropped">Abandonada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="goalStart">Data de Início</Label>
              <Input
                id="goalStart"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="goalDue">Prazo Final</Label>
              <Input
                id="goalDue"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Trilha Vinculada</Label>
              <Select value={trackId} onValueChange={setTrackId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a trilha..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma Trilha</SelectItem>
                  {tracks.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Objetivo Vinculado</Label>
              <Select value={objectiveId} onValueChange={setObjectiveId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o objetivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Objetivo</SelectItem>
                  {objectives.map((o: any) => (
                    <SelectItem key={o.id} value={o.id}>{o.emoji || "🎯"} {o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
