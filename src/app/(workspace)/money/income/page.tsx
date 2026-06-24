"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalIncomeSource,
  useDeletePersonalIncomeSource,
  useUpsertPersonalTransaction,
  useDeletePersonalTransaction,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Plus, Trash2, Pencil, Coins, Receipt, TrendingUp, Wallet, CircleDollarSign } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { brl, num, todayISO, currentMonthKey } from "@/lib/utils/life";
import { toast } from "sonner";

const RECURRENCES = [
  { value: "monthly", label: "Mensal" },
  { value: "weekly", label: "Semanal" },
  { value: "yearly", label: "Anual" },
  { value: "variable", label: "Variável" },
];
const recLabel = (v: string) => RECURRENCES.find((r) => r.value === v)?.label ?? v;

export default function IncomeSourcesPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsert = useUpsertPersonalIncomeSource();
  const remove = useDeletePersonalIncomeSource();
  const upsertTx = useUpsertPersonalTransaction();
  const deleteTx = useDeletePersonalTransaction();

  const sources: any[] = data?.incomeSources ?? [];
  const bills: any[] = data?.bills ?? [];
  const transactions: any[] = data?.transactions ?? [];
  const month = currentMonthKey();

  // contas vinculadas por fonte
  const billsBySource = React.useMemo(() => {
    const m = new Map<string, any[]>();
    bills.forEach((b) => {
      if (!b.incomeSourceId) return;
      if (!m.has(b.incomeSourceId)) m.set(b.incomeSourceId, []);
      m.get(b.incomeSourceId)!.push(b);
    });
    return m;
  }, [bills]);

  // entradas (transações de receita) por fonte
  const entriesBySource = React.useMemo(() => {
    const m = new Map<string, any[]>();
    transactions
      .filter((t) => t.type === "income" && t.incomeSourceId)
      .forEach((t) => {
        if (!m.has(t.incomeSourceId)) m.set(t.incomeSourceId, []);
        m.get(t.incomeSourceId)!.push(t);
      });
    return m;
  }, [transactions]);

  const receivedThisMonth = (sourceId: string) =>
    (entriesBySource.get(sourceId) ?? [])
      .filter((t) => String(t.occurredAt).startsWith(month))
      .reduce((a, t) => a + num(t.amount), 0);

  const estimatedIncome = sources.filter((s) => s.status === "active").reduce((a, s) => a + num(s.amount), 0);
  const receivedTotal = sources.reduce((a, s) => a + receivedThisMonth(s.id), 0);
  const committed = bills.filter((b) => b.incomeSourceId).reduce((a, b) => a + num(b.amount), 0);
  const unlinked = bills.filter((b) => !b.incomeSourceId);
  const unlinkedTotal = unlinked.reduce((a, b) => a + num(b.amount), 0);

  // ── Dialog de fonte ────────────────────────────────────────────────────────
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [name, setName] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [recurrence, setRecurrence] = React.useState("monthly");
  const [status, setStatus] = React.useState("active");
  const [notes, setNotes] = React.useState("");

  const openNew = () => {
    setEditing(null);
    setName(""); setAmount(""); setRecurrence("monthly"); setStatus("active"); setNotes("");
    setOpen(true);
  };
  const openEdit = (s: any) => {
    setEditing(s);
    setName(s.name);
    setAmount(String(num(s.amount)));
    setRecurrence(s.recurrence || "monthly");
    setStatus(s.status || "active");
    setNotes(s.notes ?? "");
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
        recurrence,
        status,
        notes: notes.trim() || null,
      });
      setOpen(false);
      toast.success(editing ? "Fonte atualizada" : "Fonte adicionada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  // ── Dialog de entrada (registra uma receita na fonte) ───────────────────────
  const [entryOpen, setEntryOpen] = React.useState(false);
  const [entrySource, setEntrySource] = React.useState<any | null>(null);
  const [entryAmount, setEntryAmount] = React.useState("");
  const [entryDate, setEntryDate] = React.useState(todayISO());
  const [entryDesc, setEntryDesc] = React.useState("");

  const openEntry = (s: any) => {
    setEntrySource(s);
    setEntryAmount("");
    setEntryDate(todayISO());
    setEntryDesc("");
    setEntryOpen(true);
  };
  const saveEntry = async () => {
    if (!ws || !entrySource) return;
    if (!entryAmount || Number(entryAmount) <= 0) return toast.error("Informe um valor válido");
    try {
      await upsertTx.mutateAsync({
        workspaceId: ws,
        type: "income",
        amount: Number(entryAmount),
        occurredAt: entryDate,
        description: entryDesc.trim() || entrySource.name,
        incomeSourceId: entrySource.id,
      });
      setEntryOpen(false);
      toast.success("Entrada registrada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar entrada");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fontes de Renda"
        description="Modo empresário autônomo: cadastre cada fonte, registre cada entrada (ex.: cada venda de mentoria) e vincule quais contas cada fonte banca."
        actions={
          <Button variant="gradient" size="sm" onClick={openNew}>
            <Plus className="h-4 w-4" /> Nova fonte
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimado (mês)" value={brl(estimatedIncome)} accent="info" icon={<TrendingUp className="h-4 w-4" />} hint="soma das fontes ativas" />
        <StatCard label="Recebido (mês)" value={brl(receivedTotal)} accent="success" icon={<CircleDollarSign className="h-4 w-4" />} hint="entradas registradas" />
        <StatCard label="Comprometido em contas" value={brl(committed)} accent="warning" icon={<Receipt className="h-4 w-4" />} />
        <StatCard label="Livre (estimado)" value={brl(estimatedIncome - committed)} accent={estimatedIncome - committed >= 0 ? "primary" : "danger"} icon={<Wallet className="h-4 w-4" />} />
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Coins className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium">Nenhuma fonte de renda ainda</p>
            <p className="text-xs text-muted-foreground">Cadastre sua primeira fonte (mentorias, freela, TikTok, vendas...).</p>
            <Button variant="gradient" size="sm" onClick={openNew} className="mt-2">
              <Plus className="h-3.5 w-3.5" /> Criar fonte
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sources.map((s) => {
            const linked = billsBySource.get(s.id) ?? [];
            const used = linked.reduce((a, b) => a + num(b.amount), 0);
            const estimated = num(s.amount);
            const received = receivedThisMonth(s.id);
            const recvPct = estimated > 0 ? Math.min(100, Math.round((received / estimated) * 100)) : 0;
            const entries = (entriesBySource.get(s.id) ?? []).slice(0, 5);
            const inactive = s.status !== "active";
            return (
              <Card key={s.id} variant="elevated" className={cn("group", inactive && "opacity-70")}>
                <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Coins className="h-4 w-4 text-success" /> {s.name}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="outline" size="sm">{recLabel(s.recurrence)}</Badge>
                      {inactive ? <Badge variant="ghost" size="sm">Inativa</Badge> : <Badge variant="success" size="sm">Ativa</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(s)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Excluir a fonte "${s.name}"?`)) remove.mutate(s.id); }}
                      className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Recebido no mês vs estimado */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-semibold num text-success">{brl(received)}</p>
                      <p className="text-[11px] text-muted-foreground">recebido no mês</p>
                    </div>
                    <span className="text-sm text-muted-foreground num">estimado {brl(estimated)}</span>
                  </div>
                  {estimated > 0 && <Progress value={recvPct} />}

                  <Button variant="outline" size="sm" className="w-full" onClick={() => openEntry(s)}>
                    <Plus className="h-3.5 w-3.5" /> Registrar entrada
                  </Button>

                  {/* Entradas recentes */}
                  {entries.length > 0 && (
                    <div className="space-y-1 border-t border-border/40 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Entradas recentes</p>
                      {entries.map((t) => (
                        <div key={t.id} className="group/e flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <CircleDollarSign className="h-3 w-3" />
                            {new Date(t.occurredAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            {t.description ? ` · ${t.description}` : ""}
                          </span>
                          <span className="flex items-center gap-2">
                            <b className="num text-success">{brl(num(t.amount))}</b>
                            <button onClick={() => deleteTx.mutate(t.id)} className="text-muted-foreground opacity-0 transition group-hover/e:opacity-100 hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contas vinculadas */}
                  {linked.length > 0 && (
                    <div className="space-y-1 border-t border-border/40 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Banca {linked.length} {linked.length === 1 ? "conta" : "contas"} · {brl(used)}
                      </p>
                      {linked.map((b) => (
                        <div key={b.id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Receipt className="h-3 w-3" /> {b.name}
                          </span>
                          <span className="num">{brl(num(b.amount))}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.notes && <p className="text-xs italic text-muted-foreground">{s.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contas sem fonte vinculada */}
      {unlinked.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Contas sem fonte ({unlinked.length})</CardTitle>
            <span className="text-sm text-muted-foreground num">{brl(unlinkedTotal)}</span>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-xs text-muted-foreground">
              Vincule essas contas a uma fonte em <Link href="/money/bills" className="text-primary underline-offset-2 hover:underline">Contas &amp; Assinaturas</Link>.
            </p>
            <div className="flex flex-wrap gap-2">
              {unlinked.map((b) => (
                <span key={b.id} className="rounded-lg border border-border/50 px-2.5 py-1 text-xs">
                  {b.name} · {brl(num(b.amount))}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de fonte */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar fonte de renda" : "Nova fonte de renda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mentorias, Freela, TikTok..." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Valor estimado (R$)</label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Recorrência</label>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <div className="flex gap-2">
                {[
                  { v: "active", label: "Ativa" },
                  { v: "inactive", label: "Inativa" },
                ].map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => setStatus(o.v)}
                    className={cn(
                      "h-9 flex-1 rounded-lg border text-sm font-medium transition",
                      status === o.v ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Notas</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ex: estimativa varia, cai todo dia 15..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={save} disabled={upsert.isPending}>{editing ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de entrada */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar entrada{entrySource ? ` · ${entrySource.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Valor (R$)</label>
                <Input type="number" step="0.01" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="0,00" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <Input value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Ex: Mentoria João, venda #12..." />
            </div>
            <p className="text-[11px] text-muted-foreground">
              A entrada vira uma transação de receita e entra no controle por período automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={saveEntry} disabled={upsertTx.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
