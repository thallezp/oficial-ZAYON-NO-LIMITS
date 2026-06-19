"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { useCreateProjectMutation, useUpdateProjectMutation, usePersonas } from "@/hooks/use-queries";
import {
  PROJECT_ICON_NAMES, PROJECT_COLORS, getProjectIcon, type ProjectStatus,
} from "./project-style";

interface ProjectUpsertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string | null;
  defaultPersonaId?: string | null;
  /** quando passado, o diálogo opera em modo edição */
  project?: any | null;
}

export function ProjectUpsertDialog({
  open, onOpenChange, workspaceId, defaultPersonaId, project,
}: ProjectUpsertDialogProps) {
  const isEdit = !!project;
  const create = useCreateProjectMutation();
  const update = useUpdateProjectMutation();
  const { data: personas = [] } = usePersonas(workspaceId);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState("#3b82f6");
  const [icon, setIcon] = React.useState("Folder");
  const [status, setStatus] = React.useState<ProjectStatus>("active");
  const [personaId, setPersonaId] = React.useState<string>("none");

  // Sincroniza os campos quando abre (cria ou edita)
  React.useEffect(() => {
    if (!open) return;
    if (project) {
      setName(project.name ?? "");
      setDescription(project.description ?? "");
      setColor(project.color ?? "#3b82f6");
      setIcon(project.icon ?? "Folder");
      setStatus((project.status as ProjectStatus) ?? "active");
      setPersonaId(project.personaId ?? "none");
    } else {
      setName("");
      setDescription("");
      setColor("#3b82f6");
      setIcon("Folder");
      setStatus("active");
      setPersonaId(defaultPersonaId ?? "none");
    }
  }, [open, project, defaultPersonaId]);

  const pending = create.isPending || update.isPending;
  const PreviewIcon = getProjectIcon(icon);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workspaceId) return;
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: project.id,
          input: {
            name: name.trim(),
            description: description.trim() || null,
            color,
            icon,
            status,
            personaId: personaId === "none" ? null : personaId,
          },
        });
        toast.success("Projeto atualizado!", { description: name });
      } else {
        await create.mutateAsync({
          workspaceId,
          personaId: personaId === "none" ? undefined : personaId,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          status,
        });
        toast.success("Projeto criado!", { description: name });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar projeto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${color}25`, color }}
            >
              <PreviewIcon className="h-4 w-4" />
            </span>
            {isEdit ? "Editar Projeto" : "Novo Projeto"}
          </DialogTitle>
          <DialogDescription>
            Iniciativa de longo prazo · personalize ícone, cor, status e vínculo com persona.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4 pt-1" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label className="text-xs">Nome do projeto <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ex: Lançamento Comunidade Eter" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Objetivo, escopo, contexto…" />
          </div>

          {/* Seletor de ícone */}
          <div className="space-y-1.5">
            <Label className="text-xs">Ícone</Label>
            <div className="grid grid-cols-10 gap-1.5">
              {PROJECT_ICON_NAMES.map((nm) => {
                const Ico = getProjectIcon(nm);
                const active = icon === nm;
                return (
                  <button
                    key={nm}
                    type="button"
                    onClick={() => setIcon(nm)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border transition",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                    title={nm}
                  >
                    <Ico className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de cor */}
          <div className="space-y-1.5">
            <Label className="text-xs">Cor</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-border/40 transition hover:scale-110"
                  style={{ background: c }}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
              <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-border/60 text-[9px] text-muted-foreground overflow-hidden">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-9 cursor-pointer border-0 bg-transparent p-0" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="done">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Persona</Label>
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Global (nenhuma)</SelectItem>
                  {personas.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" variant="gradient" disabled={!name.trim() || pending}>
              {pending ? "Salvando…" : isEdit ? "Salvar Alterações" : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
