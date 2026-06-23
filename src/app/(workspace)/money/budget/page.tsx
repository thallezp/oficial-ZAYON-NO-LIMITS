"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalCategory,
  useDeletePersonalCategory,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { brl, num, currentMonthKey } from "@/lib/utils/life";
import { PILLARS } from "@/lib/utils/finance";
import { toast } from "sonner";

const COLORS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#0ea5e9", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function BudgetPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsert = useUpsertPersonalCategory();
  const remove = useDeletePersonalCategory();

  const categories: any[] = data?.categories ?? [];
  const transactions: any[] = data?.transactions ?? [];
  const month = currentMonthKey();

  const spentByCat = React.useMemo(() => {
    const m = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense" && String(t.occurredAt).startsWith(month))
      .forEach((t) => m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + num(t.amount)));
    return m;
  }, [transactions, month]);

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<"expense" | "income">("expense");
  const [budget, setBudget] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]);
  const [pillar, setPillar] = React.useState<string>("none");

  const openNew = () => {
    setEditing(null);
    setName("");
    setKind("expense");
    setBudget("");
    setColor(COLORS[0]);
    setPillar("none");
    setOpen(true);
  };
  const openEdit = (c: any) => {
    setEditing(c);
    setName(c.name);
    setKind(c.kind);
    setBudget(c.monthlyBudget != null ? String(num(c.monthlyBudget)) : "");
    setColor(c.color || COLORS[0]);
    setPillar(c.pillar || "none");
    setOpen(true);
  };

  const save = async () => {
    if (!ws || !name.trim()) return;
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        workspaceId: ws,
        name: name.trim(),
        kind,
        color,
        pillar: kind === "expense" && pillar !== "none" ? pillar : null,
        monthlyBudget: kind === "expense" && budget ? Number(budget) : null,
      });
      setOpen(false);
      toast.success(editing ? "Categoria atualizada" : "Categoria criada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const expenseCats = categories.filter((c) => c.kind === "expense");
  const incomeCats = categories.filter((c) => c.kind === "income");
  const totalBudget = expenseCats.reduce((a, c) => a + num(c.monthlyBudget), 0);
  const totalSpent = expenseCats.reduce((a, c) => a + (spentByCat.get(c.id) ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orçamento"
        description="Defina um limite mensal por categoria e acompanhe quanto já gastou neste mês."
        actions={
          <Button variant="gradient" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Button>
        }
      />

      {totalBudget > 0 && (
        <Card variant="elevated">
          <CardContent className="space-y-2 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Orçamento total do mês</span>
              <span className="num">{brl(totalSpent)} / {brl(totalBudget)}</span>
            </div>
            <Progress value={Math.min(100, totalBudget ? (totalSpent / totalBudget) * 100 : 0)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Despesas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {expenseCats.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria de despesa ainda.</p>
          ) : (
            expenseCats.map((c) => {
              const spent = spentByCat.get(c.id) ?? 0;
              const limit = num(c.monthlyBudget);
              const pct = limit ? Math.min(100, (spent / limit) * 100) : 0;
              const over = limit > 0 && spent > limit;
              return (
                <div key={c.id} className="group space-y-1.5 rounded-lg border border-border/40 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color || "#6366f1" }} />
                      {c.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn("num", over && "text-destructive")}>
                        {brl(spent)}{limit ? ` / ${brl(limit)}` : ""}
                      </span>
                      <button onClick={() => openEdit(c)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove.mutate(c.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {limit > 0 && <Progress value={pct} />}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Receitas</CardTitle></CardHeader>
        <CardContent>
          {incomeCats.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma categoria de receita ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {incomeCats.map((c) => (
                <div key={c.id} className="group flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color || "#22c55e" }} />
                  {c.name}
                  <button onClick={() => openEdit(c)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => remove.mutate(c.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={cn(
                    "h-9 flex-1 rounded-lg border text-sm font-medium transition",
                    kind === k ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                  )}
                >
                  {k === "expense" ? "Despesa" : "Receita"}
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Alimentação, Transporte..." autoFocus />
            </div>
            {kind === "expense" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Limite mensal (opcional)</label>
                <Input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0,00" />
              </div>
            )}
            {kind === "expense" && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Pilar (Pague-se Primeiro)</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPillar("none")}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                      pillar === "none" ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                    )}
                  >
                    Nenhum
                  </button>
                  {PILLARS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPillar(p.key)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition",
                        pillar === p.key ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
