"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertReview, useStudyTracks, useStudyResources } from "@/hooks/use-queries";
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

interface UpsertReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: any | null; // Pass a review object to edit
}

export function UpsertReviewDialog({
  open,
  onOpenChange,
  review,
}: UpsertReviewDialogProps) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertReviewMutation = useUpsertReview();

  const { data: tracks = [] } = useStudyTracks(activeWorkspaceId);
  const { data: resources = [] } = useStudyResources(activeWorkspaceId);

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [kind, setKind] = React.useState<"note" | "flashcard" | "attack_note">("flashcard");
  const [trackId, setTrackId] = React.useState<string>("none");
  const [moduleId, setModuleId] = React.useState<string>("none");
  const [resourceId, setResourceId] = React.useState<string>("none");
  const [submitting, setSubmitting] = React.useState(false);

  // Compute modules for the selected track
  const modules = React.useMemo(() => {
    if (trackId === "none") return [];
    const t = tracks.find((track: any) => track.id === trackId);
    return t?.modules || [];
  }, [tracks, trackId]);

  React.useEffect(() => {
    if (open) {
      if (review) {
        setTitle(review.title || "");
        setContent(review.content || "");
        setKind(review.kind || "flashcard");
        setTrackId(review.trackId || "none");
        setModuleId(review.moduleId || "none");
        setResourceId(review.resourceId || "none");
      } else {
        setTitle("");
        setContent("");
        setKind("flashcard");
        setTrackId("none");
        setModuleId("none");
        setResourceId("none");
      }
    }
  }, [open, review]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Nenhum workspace ativo.");
      return;
    }
    if (!title.trim()) {
      toast.error("Título (Pergunta) é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      await upsertReviewMutation.mutateAsync({
        id: review?.id,
        workspaceId: activeWorkspaceId,
        title: title.trim(),
        content: content.trim() || null,
        kind,
        trackId: trackId !== "none" ? trackId : null,
        moduleId: moduleId !== "none" ? moduleId : null,
        resourceId: resourceId !== "none" ? resourceId : null,
      });

      toast.success(review ? "Revisão atualizada com sucesso!" : "Revisão criada com sucesso!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar revisão.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{review ? "Editar Item de Revisão" : "Novo Item de Revisão"}</DialogTitle>
          <DialogDescription>
            Crie flashcards para testar sua memória ou notas de brechas ("ataques") para fixação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="reviewKind">Tipo de Item</Label>
            <Select
              value={kind}
              onValueChange={(v: any) => setKind(v)}
            >
              <SelectTrigger id="reviewKind">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flashcard">Flashcard (Pergunta & Resposta)</SelectItem>
                <SelectItem value="note">Nota Geral</SelectItem>
                <SelectItem value="attack_note">Nota de Ataque (Tático/Resumo)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reviewTitle">
              {kind === "flashcard" ? "Frente (Pergunta / Título)" : "Título da Nota"}
            </Label>
            <Input
              id="reviewTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "flashcard" ? "Ex: Como funciona a herança no Python?" : "Ex: Conceito de RLS no Postgres"}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="reviewContent">
              {kind === "flashcard" ? "Verso (Resposta / Detalhes)" : "Conteúdo da Nota"}
            </Label>
            <Textarea
              id="reviewContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Adicione a resposta ou o resumo conceitual detalhado."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Vincular a Trilha</Label>
              <Select
                value={trackId}
                onValueChange={(v) => {
                  setTrackId(v);
                  setModuleId("none");
                }}
              >
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
              <Label>Vincular a Módulo</Label>
              <Select
                value={moduleId}
                onValueChange={setModuleId}
                disabled={trackId === "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o módulo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum Módulo</SelectItem>
                  {modules.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Vincular a Recurso da Biblioteca</Label>
            <Select
              value={resourceId}
              onValueChange={setResourceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o recurso..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Recurso</SelectItem>
                {resources.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>{r.title} ({r.authors || "Autor não informado"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
