"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalGoal,
  useDeletePersonalGoal,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { brl, num } from "@/lib/utils/life";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#0ea5e9", "#ec4899", "#8b5cf6"];

export default function GoalsPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsert = useUpsertPersonalGoal();
  const remove = useDeletePersonalGoal();
  const goals: any[] = data?.goals ?? [];

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [current, setCurrent] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);

  const openNew = () => {
    setEditing(null);
    setName(""); setTarget(""); setCurrent(""); setDueDate(""); setColor(COLORS[0]);
    setOpen(true);
  };
  const openEdit = (g: any) => {
    setEditing(g);
    setName(g.name);
    setTarget(String(num(g.targetAmount)));
    setCurrent(String(num(g.currentAmount)));
    setDueDate(g.dueDate ? String(g.dueDate).slice(0, 10) : "");
    setColor(g.color || COLORS[0]);
    setOpen(true);
  };

  const save = async () => {
    if (!ws || !name.trim()) return;
    if (!target || Number(target) <= 0) return toast.error("Informe um valor alvo válido");
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        workspaceId: ws,
        name: name.trim(),
        targetAmount: Number(target),
        currentAmount: current ? Number(current) : 0,
        dueDate: dueDate || null,
        color,
      });
      setOpen(false);
      toast.success(editing ? "Meta atualizada" : "Meta criada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const contribute = async (g: any) => {
    const raw = window.prompt(`Quanto aportar em "${g.name}"? (R$)`);
    if (raw === null) return;
    const value = Number(raw.replace(",", "."));
    if (!Number.isFinite(value) || value === 0) return;
    try {
      await upsert.mutateAsync({
        id: g.id,
        workspaceId: ws,
        name: g.name,
        targetAmount: num(g.targetAmount),
        currentAmount: Math.max(0, num(g.currentAmount) + value),
        dueDate: g.dueDate ? String(g.dueDate).slice(0, 10) : null,
        color: g.color,
      });
      toast.success("Aporte registrado");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao aportar");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas"
        description="Reserva de emergência, viagens, objetivos de poupança — acompanhe o progresso de cada meta."
        actions={
          <Button variant="gradient" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova meta
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PiggyBank className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">Nenhuma meta ainda</p>
            <p className="text-xs text-muted-foreground">Crie sua primeira meta de poupança.</p>
            <Button variant="gradient" size="sm" onClick={openNew} className="mt-2">
              <Plus className="h-3.5 w-3.5" /> Criar meta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const cur = num(g.currentAmount);
            const tgt = num(g.targetAmount);
            const pct = tgt ? Math.min(100, Math.round((cur / tgt) * 100)) : 0;
            const done = pct >= 100;
            return (
              <Card key={g.id} variant="elevated" className="group">
                <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color || "#6366f1" }} />
                    {g.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(g)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove.mutate(g.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-semibold num">{brl(cur)}</span>
                    <span className="text-sm text-muted-foreground num">de {brl(tgt)}</span>
                  </div>
                  <Progress value={pct} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className={cn(done && "font-medium text-success")}>
                      {done ? "Meta atingida! 🎉" : `${pct}%`}
                    </span>
                    {g.dueDate && <span>até {new Date(g.dueDate).toLocaleDateString("pt-BR")}</span>}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => contribute(g)}>
                    <Plus className="h-3.5 w-3.5" /> Aportar
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar meta" : "Nova meta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Valor alvo (R$)</label>
                <Input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="10000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Já guardado (R$)</label>
                <Input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Prazo (opcional)</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Cor</label>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn("h-7 w-7 rounded-full border-2 transition", color === c ? "border-foreground" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={save} disabled={upsert.isPending}>{editing ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
