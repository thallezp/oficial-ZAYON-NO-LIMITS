"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowUpRight,
  Loader2,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { usePersonaStore } from "@/stores/persona-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useDeletePersonaMutation,
  useUpsertPersonaMutation,
} from "@/hooks/use-queries";
import { initials, formatCompact, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import type { Persona } from "@/types";

const statusVariant = {
  active: "success",
  building: "warning",
  paused: "outline",
  archived: "ghost",
} as const;

export default function PersonaSettingsPage() {
  const personas = usePersonaStore((s) => s.personas);
  const removePersona = usePersonaStore((s) => s.removePersona);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.openWith);

  const upsertPersona = useUpsertPersonaMutation();
  const deletePersona = useDeletePersonaMutation();

  const [pendingStatusId, setPendingStatusId] = React.useState<string | null>(null);
  const [personaToDelete, setPersonaToDelete] = React.useState<Persona | null>(null);
  const [confirmText, setConfirmText] = React.useState("");

  const setStatus = async (p: Persona, status: Persona["status"], label: string) => {
    if (!activeWorkspaceId) return;
    setPendingStatusId(p.id);
    try {
      await upsertPersona.mutateAsync({
        id: p.id,
        workspaceId: activeWorkspaceId,
        name: p.name,
        status,
      });
      toast.success(`${p.name} ${label}`);
    } catch (err: any) {
      toast.error(err?.message ?? `Erro ao atualizar ${p.name}`);
    } finally {
      setPendingStatusId(null);
    }
  };

  const handleDelete = async () => {
    if (!personaToDelete) return;
    try {
      await deletePersona.mutateAsync(personaToDelete.id);
      removePersona(personaToDelete.id);
      toast.success(`Persona ${personaToDelete.name} excluída`);
      setPersonaToDelete(null);
      setConfirmText("");
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao excluir persona");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persona Settings"
        description="Crie, edite, pause, arquive ou exclua personas. Cada persona isola seus dados (conteúdo, leads, financeiro)."
        actions={
          <Button
            variant="gradient"
            size="sm"
            onClick={() => openQuickCreate("persona")}
          >
            <Plus className="h-4 w-4" /> Nova persona
          </Button>
        }
      />

      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <CardContent className="relative p-6 grid sm:grid-cols-3 gap-4">
          <Stat
            label="Personas ativas"
            value={String(personas.filter((p) => p.status === "active").length)}
          />
          <Stat
            label="Em construção"
            value={String(personas.filter((p) => p.status === "building").length)}
          />
          <Stat
            label="Pausadas / arquivadas"
            value={String(
              personas.filter(
                (p) => p.status === "paused" || p.status === "archived",
              ).length,
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Personas do workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {personas.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma persona ainda. Clique em &quot;Nova persona&quot; para criar a primeira.
            </div>
          )}
          {personas.map((p) => {
            const busy = pendingStatusId === p.id;
            return (
              <div key={p.id} className="flex items-center gap-4 p-4">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    className="h-12 w-12 rounded-xl object-cover shadow-glow"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-glow"
                    style={{
                      background: `linear-gradient(135deg, ${p.accent ?? "#5b8cff"}, #2a3ef5)`,
                    }}
                  >
                    {initials(p.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{p.name}</p>
                    <Badge size="sm" variant={statusVariant[p.status]}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.niche}
                  </p>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span>{formatCompact(p.metrics?.followers ?? 0)} seguidores</span>
                    <span>·</span>
                    <span>{formatCurrency(p.metrics?.revenuePeriod ?? 0)} (30d)</span>
                    <span>·</span>
                    <span>{p.metrics?.leads ?? 0} leads</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {p.status === "paused" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title="Reativar persona"
                      onClick={() => setStatus(p, "active", "reativada")}
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy || p.status === "archived"}
                      title="Pausar persona"
                      onClick={() => setStatus(p, "paused", "pausada")}
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                    </Button>
                  )}
                  {p.status === "archived" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title="Desarquivar persona"
                      onClick={() => setStatus(p, "building", "desarquivada")}
                    >
                      <ArchiveRestore className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      title="Arquivar persona"
                      onClick={() => setStatus(p, "archived", "arquivada")}
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    title="Excluir persona"
                    className={cn(
                      "border-destructive/30 text-destructive hover:bg-destructive/10",
                    )}
                    onClick={() => {
                      setConfirmText("");
                      setPersonaToDelete(p);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button variant="gradient" size="sm" asChild>
                    <Link href={`/personas/${p.id}/look-3d`}>
                      Editar <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Zona perigosa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            A exclusão de uma persona apaga em definitivo conteúdo, prompts, canais,
            dores ICP e campanhas vinculadas. Leads, tarefas, documentos e materiais
            ficam no workspace, mas perdem o vínculo com a persona.
          </p>
          <p>Esta ação não pode ser desfeita.</p>
        </CardContent>
      </Card>

      <Dialog
        open={!!personaToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPersonaToDelete(null);
            setConfirmText("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Excluir persona {personaToDelete?.name}?
            </DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Todo o conteúdo, prompts, canais e campanhas
              vinculados a <strong>{personaToDelete?.name}</strong> serão apagados.
              Digite o nome da persona para confirmar.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            placeholder={personaToDelete?.name ?? ""}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPersonaToDelete(null);
                setConfirmText("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                deletePersona.isPending ||
                confirmText.trim().toLowerCase() !==
                  (personaToDelete?.name ?? "").trim().toLowerCase()
              }
              onClick={handleDelete}
            >
              {deletePersona.isPending && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold num mt-1">{value}</p>
    </div>
  );
}
