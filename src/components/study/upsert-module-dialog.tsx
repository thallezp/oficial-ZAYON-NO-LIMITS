"use client";

import * as React from "react";
import { useUpsertStudyModule } from "@/hooks/use-queries";
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

interface UpsertModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackId: string;
  module?: any | null; // Pass a module object to edit
}

export function UpsertModuleDialog({
  open,
  onOpenChange,
  trackId,
  module,
}: UpsertModuleDialogProps) {
  const upsertModuleMutation = useUpsertStudyModule();

  const [name, setName] = React.useState("");
  const [hoursTarget, setHoursTarget] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (module) {
        setName(module.name || "");
        setHoursTarget(module.hoursTarget ? String(module.hoursTarget) : "");
      } else {
        setName("");
        setHoursTarget("");
      }
    }
  }, [open, module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome do módulo é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await upsertModuleMutation.mutateAsync({
        id: module?.id,
        trackId,
        name,
        hoursTarget: hoursTarget ? parseInt(hoursTarget, 10) : null,
      });

      toast.success(module ? "Módulo atualizado!" : "Módulo adicionado!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar módulo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{module ? "Editar Módulo" : "Adicionar Módulo"}</DialogTitle>
          <DialogDescription>
            Defina o nome do módulo e a carga horária estimada.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="moduleName">Nome do Módulo *</Label>
            <Input
              id="moduleName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Introdução ao Python"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="moduleHours">Estimativa de Horas</Label>
            <Input
              id="moduleHours"
              type="number"
              value={hoursTarget}
              onChange={(e) => setHoursTarget(e.target.value)}
              placeholder="Ex: 10"
              min={0}
            />
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
              {submitting ? "Salvando..." : module ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
