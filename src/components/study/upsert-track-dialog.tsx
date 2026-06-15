"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertStudyTrack } from "@/hooks/use-queries";
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

interface UpsertTrackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: any | null; // Pass a track object to edit
}

const COLORS = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-emerald-500", label: "Emerald" },
  { value: "bg-violet-500", label: "Violet" },
  { value: "bg-amber-500", label: "Amber" },
  { value: "bg-rose-500", label: "Rose" },
  { value: "bg-cyan-500", label: "Cyan" },
];

export function UpsertTrackDialog({
  open,
  onOpenChange,
  track,
}: UpsertTrackDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertTrackMutation = useUpsertStudyTrack();

  const [name, setName] = React.useState("");
  const [area, setArea] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("active");
  const [mode, setMode] = React.useState("");
  const [hoursTarget, setHoursTarget] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [targetDate, setTargetDate] = React.useState("");
  const [color, setColor] = React.useState("bg-blue-500");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (track) {
        setName(track.name || "");
        setArea(track.area || "");
        setDescription(track.description || "");
        setStatus(track.status || "active");
        setMode(track.mode || "");
        setHoursTarget(track.hoursTarget ? String(track.hoursTarget) : "");
        setStartDate(track.startDate ? new Date(track.startDate).toISOString().slice(0, 10) : "");
        setTargetDate(track.targetDate ? new Date(track.targetDate).toISOString().slice(0, 10) : "");
        setColor(track.color || "bg-blue-500");
      } else {
        setName("");
        setArea("");
        setDescription("");
        setStatus("active");
        setMode("");
        setHoursTarget("");
        setStartDate("");
        setTargetDate("");
        setColor("bg-blue-500");
      }
    }
  }, [open, track]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo.");
      return;
    }
    if (!name.trim()) {
      toast.error("Nome da trilha é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await upsertTrackMutation.mutateAsync({
        id: track?.id,
        workspaceId: activeWorkspaceId,
        name,
        area: area || null,
        description: description || null,
        status,
        mode: mode || null,
        hoursTarget: hoursTarget ? parseInt(hoursTarget, 10) : null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        color,
      });

      toast.success(track ? "Trilha atualizada com sucesso!" : "Trilha criada com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar trilha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{track ? "Editar Trilha" : "Nova Trilha de Estudo"}</DialogTitle>
          <DialogDescription>
            {track
              ? "Edite as configurações da sua trilha de estudo atual."
              : "Crie uma nova trilha para organizar seus módulos e submódulos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="name">Nome da Trilha *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Engenharia de Software, Inglês Fluente"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ex: Carreira, Idiomas"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mode">Modo</Label>
              <Input
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                placeholder="Ex: Autodidata, Faculdade"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Foque nos objetivos principais desta trilha..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="hoursTarget">Meta de Horas</Label>
              <Input
                id="hoursTarget"
                type="number"
                value={hoursTarget}
                onChange={(e) => setHoursTarget(e.target.value)}
                placeholder="Ex: 100"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="targetDate">Data Limite</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor de Identificação</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full transition-all border ${
                    color === c.value
                      ? "ring-2 ring-primary border-transparent scale-110"
                      : "border-border hover:scale-105"
                  } ${c.value}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={submitting}>
              {submitting ? "Salvando..." : track ? "Atualizar" : "Criar Trilha"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
