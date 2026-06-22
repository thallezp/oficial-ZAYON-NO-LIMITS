"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalBill,
  useSetPersonalBillStatus,
  useDeletePersonalBill,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Check, Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { brl, num } from "@/lib/utils/life";
import { toast } from "sonner";

const RECURRENCES = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
  { value: "once", label: "Única" },
];
const recLabel = (v: string) => RECURRENCES.find((r) => r.value === v)?.label ?? v;

export default function BillsPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsert = useUpsertPersonalBill();
  const setStatus = useSetPersonalBillStatus();
  const remove = useDeletePersonalBill();

  const bills: any[] = data?.bills ?? [];
  const sorted = [...bills].sort((a, b) => (a.dueDay ?? 99) - (b.dueDay ?? 99));
  const monthlyTotal = bills
    .filter((b) => b.recurrence === "monthly")
    .reduce((a, b) => a + num(b.amount), 0);
  const pending = bills.filter((b) => b.status !== "paid").length;

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [dueDay, setDueDay] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("monthly");
  const [category, setCategory] = React.useState("");
  const [autopay, setAutopay] = React.useState(false);

  const openNew = () => {
    setEditing(null);
    setName(""); setAmount(""); setDueDay(""); setRecurrence("monthly"); setCategory(""); setAutopay(false);
    setOpen(true);
  };
  const openEdit = (b: any) => {
    setEditing(b);
    setName(b.name);
    setAmount(String(num(b.amount)));
    setDueDay(b.dueDay != null ? String(b.dueDay) : "");
    setRecurrence(b.recurrence || "monthly");
    setCategory(b.category ?? "");
    setAutopay(!!b.autopay);
    setOpen(true);
  };

  const save = async () => {
    if (!ws || !name.trim()) return;
    if (!amount || Number(amount) <= 0) return toast.error("Informe um valor válido");
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        workspaceId: ws,
        name: name.trim(),
        amount: Number(amount),
        dueDay: dueDay ? Number(dueDay) : null,
        recurrence,
        category: category || null,
        autopay,
        status: editing?.status ?? "pending",
      });
      setOpen(false);
      toast.success(editing ? "Conta atualizada" : "Conta adicionada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas & Assinaturas"
        description="Suas contas recorrentes e assinaturas, com vencimento e status de pagamento."
        actions={
          <Button variant="gradient" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova conta
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total mensal" value={brl(monthlyTotal)} accent="primary" icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Pendentes" value={pending} accent={pending > 0 ? "warning" : "success"} />
        <StatCard label="Total de contas" value={bills.length} accent="info" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Suas contas</CardTitle></CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma conta cadastrada. Clique em “Nova conta”.
            </p>
          ) : (
            <div className="space-y-2">
              {sorted.map((b) => {
                const paid = b.status === "paid";
                return (
                  <div key={b.id} className="group flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2.5 text-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setStatus.mutate({ id: b.id, status: paid ? "pending" : "paid" })}
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition",
                          paid ? "border-success bg-success/15 text-success" : "border-border/60 text-muted-foreground hover:bg-accent",
                        )}
                        title={paid ? "Marcar como pendente" : "Marcar como paga"}
                      >
                        {paid ? <Check className="h-3.5 w-3.5" /> : null}
                      </button>
                      <div className="min-w-0">
                        <p className={cn("truncate font-medium", paid && "text-muted-foreground line-through")}>{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {recLabel(b.recurrence)}{b.dueDay ? ` · vence dia ${b.dueDay}` : ""}{b.category ? ` · ${b.category}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {paid ? <Badge variant="success" size="sm">Paga</Badge> : <Badge variant="warning" size="sm">Pendente</Badge>}
                      <b className="num">{brl(num(b.amount))}</b>
                      <button onClick={() => openEdit(b)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => remove.mutate(b.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Netflix, Aluguel, Internet..." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Valor (R$)</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Dia do vencimento</label>
                <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Recorrência</label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Moradia..." />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutopay((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition",
                autopay ? "border-primary bg-primary/10 text-foreground" : "border-border/60 text-muted-foreground hover:bg-accent",
              )}
            >
              Débito automático
              <span className={cn("h-4 w-4 rounded-full border", autopay ? "border-primary bg-primary" : "border-border")} />
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={save} disabled={upsert.isPending}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
