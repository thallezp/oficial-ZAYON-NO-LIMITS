"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertModuleItem, useStudyResources } from "@/hooks/use-queries";
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

interface UpsertModuleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  item?: any | null; // Pass an item object to edit
}

export function UpsertModuleItemDialog({
  open,
  onOpenChange,
  moduleId,
  item,
}: UpsertModuleItemDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: resources = [] } = useStudyResources(activeWorkspaceId);
  const upsertItemMutation = useUpsertModuleItem();

  const [name, setName] = React.useState("");
  const [hours, setHours] = React.useState("1");
  const [link, setLink] = React.useState("");
  const [resourceId, setResourceId] = React.useState("none");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name || "");
        setHours(item.hours ? String(item.hours) : "1");
        setLink(item.link || "");
        setResourceId(item.resourceId || "none");
      } else {
        setName("");
        setHours("1");
        setLink("");
        setResourceId("none");
      }
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nome do item é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await upsertItemMutation.mutateAsync({
        id: item?.id,
        moduleId,
        name,
        hours: hours ? parseInt(hours, 10) : 1,
        link: link || null,
        resourceId: resourceId === "none" ? null : resourceId,
      });

      toast.success(item ? "Submódulo atualizado!" : "Submódulo adicionado!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar Submódulo" : "Adicionar Submódulo"}</DialogTitle>
          <DialogDescription>
            Crie ou edite um item da checklist de estudos deste módulo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="itemName">Nome do Submódulo *</Label>
            <Input
              id="itemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Variáveis e Estruturas de Decisão"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="itemHours">Horas Estimadas</Label>
              <Input
                id="itemHours"
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ex: 2"
                min={0}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="itemResource">Recurso Vinculado</Label>
              <Select value={resourceId} onValueChange={setResourceId}>
                <SelectTrigger id="itemResource">
                  <SelectValue placeholder="Sem recurso..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Recurso</SelectItem>
                  {resources.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="itemLink">Link do Recurso / Conteúdo</Label>
            <Input
              id="itemLink"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
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
              {submitting ? "Salvando..." : item ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
