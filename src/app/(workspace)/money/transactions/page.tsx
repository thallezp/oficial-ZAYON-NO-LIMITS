"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalTransaction,
  useDeletePersonalTransaction,
  useUpsertPersonalAccount,
  useDeletePersonalAccount,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2, Pencil, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { brl, num, todayISO } from "@/lib/utils/life";
import { periodRange, inPeriod, shiftPeriod, isCurrentPeriod, type Period } from "@/lib/utils/finance";
import { PeriodTabs } from "@/components/life/period-tabs";
import { toast } from "sonner";

const ACCOUNT_TYPES = [
  { value: "checking", label: "Conta corrente" },
  { value: "savings", label: "Poupança" },
  { value: "cash", label: "Dinheiro" },
  { value: "card", label: "Cartão" },
  { value: "investment", label: "Investimento" },
];

export default function TransactionsPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsertTx = useUpsertPersonalTransaction();
  const deleteTx = useDeletePersonalTransaction();
  const upsertAcct = useUpsertPersonalAccount();
  const deleteAcct = useDeletePersonalAccount();

  const accounts: any[] = data?.accounts ?? [];
  const categories: any[] = data?.categories ?? [];
  const transactions: any[] = data?.transactions ?? [];
  const incomeSources: any[] = data?.incomeSources ?? [];
  const acctById = new Map(accounts.map((a) => [a.id, a]));
  const catById = new Map(categories.map((c) => [c.id, c]));
  const sourceById = new Map(incomeSources.map((s) => [s.id, s]));

  // Filtro por período (Dia/Semana/Mês), navegável
  const [period, setPeriod] = React.useState<Period>("month");
  const [refDate, setRefDate] = React.useState(() => new Date());
  const range = periodRange(period, refDate);
  const periodTx = transactions.filter((t) => inPeriod(t.occurredAt, range));
  const periodIn = periodTx.filter((t) => t.type === "income").reduce((a, t) => a + num(t.amount), 0);
  const periodOut = periodTx.filter((t) => t.type === "expense").reduce((a, t) => a + num(t.amount), 0);

  // Transaction dialog
  const [txOpen, setTxOpen] = React.useState(false);
  const [editingTx, setEditingTx] = React.useState<any | null>(null);
  const [type, setType] = React.useState<"income" | "expense">("expense");
  const [amount, setAmount] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [accountId, setAccountId] = React.useState("none");
  const [categoryId, setCategoryId] = React.useState("none");
  const [incomeSourceId, setIncomeSourceId] = React.useState("none");
  const [occurredAt, setOccurredAt] = React.useState(todayISO());

  // Account dialog
  const [acctOpen, setAcctOpen] = React.useState(false);
  const [acctName, setAcctName] = React.useState("");
  const [acctType, setAcctType] = React.useState("checking");
  const [acctBalance, setAcctBalance] = React.useState("");

  const openNewTx = () => {
    setEditingTx(null);
    setType("expense");
    setAmount("");
    setDescription("");
    setAccountId(accounts[0]?.id ?? "none");
    setCategoryId("none");
    setIncomeSourceId("none");
    setOccurredAt(todayISO());
    setTxOpen(true);
  };

  const openEditTx = (t: any) => {
    setEditingTx(t);
    setType(t.type);
    setAmount(String(num(t.amount)));
    setDescription(t.description ?? "");
    setAccountId(t.accountId ?? "none");
    setCategoryId(t.categoryId ?? "none");
    setIncomeSourceId(t.incomeSourceId ?? "none");
    setOccurredAt(String(t.occurredAt).slice(0, 10));
    setTxOpen(true);
  };

  const saveTx = async () => {
    if (!ws) return;
    if (!amount || Number(amount) <= 0) return toast.error("Informe um valor válido");
    try {
      await upsertTx.mutateAsync({
        id: editingTx?.id,
        workspaceId: ws,
        type,
        amount: Number(amount),
        description: description || null,
        accountId: accountId === "none" ? null : accountId,
        categoryId: categoryId === "none" ? null : categoryId,
        incomeSourceId: type === "income" && incomeSourceId !== "none" ? incomeSourceId : null,
        occurredAt,
      });
      setTxOpen(false);
      toast.success(editingTx ? "Transação atualizada" : "Transação adicionada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const saveAcct = async () => {
    if (!ws || !acctName.trim()) return;
    try {
      await upsertAcct.mutateAsync({
        workspaceId: ws,
        name: acctName.trim(),
        type: acctType,
        balance: acctBalance ? Number(acctBalance) : 0,
      });
      setAcctOpen(false);
      setAcctName("");
      setAcctBalance("");
      setAcctType("checking");
      toast.success("Conta criada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar conta");
    }
  };

  const filteredCats = categories.filter((c) => c.kind === type);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações"
        description="Receitas e despesas pessoais, organizadas por conta e categoria."
        actions={
          <Button variant="gradient" size="sm" onClick={openNewTx}>
            <Plus className="h-4 w-4" /> Nova transação
          </Button>
        }
      />

      {/* Contas */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" /> Contas
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setAcctOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nova conta
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="py-3 text-center text-sm text-muted-foreground">
              Crie uma conta para vincular suas transações.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <div key={a.id} className="group flex items-center gap-2 rounded-lg border border-border/50 px-3 py-1.5 text-sm">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-muted-foreground num">{brl(num(a.balance))}</span>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir a conta "${a.name}"?`)) deleteAcct.mutate(a.id);
                    }}
                    className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de transações */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Histórico</CardTitle>
            <p className="text-xs capitalize text-muted-foreground">{range.label}</p>
          </div>
          <PeriodTabs value={period} onChange={(p) => { setPeriod(p); setRefDate(new Date()); }} />
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border/40 px-2 py-1.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setRefDate((d) => shiftPeriod(d, period, -1))} aria-label="Período anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium capitalize">{range.label}</p>
              {isCurrentPeriod(refDate, period) ? (
                <span className="text-[11px] text-muted-foreground">período atual</span>
              ) : (
                <button onClick={() => setRefDate(new Date())} className="text-[11px] text-primary hover:underline">voltar pra hoje</button>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setRefDate((d) => shiftPeriod(d, period, 1))} aria-label="Próximo período">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/40 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entradas</p>
              <p className="num text-sm font-semibold text-success">{brl(periodIn)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saídas</p>
              <p className="num text-sm font-semibold text-destructive">{brl(periodOut)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Saldo</p>
              <p className={cn("num text-sm font-semibold", periodIn - periodOut >= 0 ? "text-foreground" : "text-destructive")}>
                {brl(periodIn - periodOut)}
              </p>
            </div>
          </div>
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma transação ainda. Clique em “Nova transação”.
            </p>
          ) : periodTx.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma transação neste período.
            </p>
          ) : (
            <div className="space-y-1.5">
              {periodTx.map((t) => (
                <div key={t.id} className="group flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.description || catById.get(t.categoryId)?.name || "Sem descrição"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.occurredAt).toLocaleDateString("pt-BR")}
                      {acctById.get(t.accountId) && ` · ${acctById.get(t.accountId)!.name}`}
                      {catById.get(t.categoryId) && ` · ${catById.get(t.categoryId)!.name}`}
                      {t.type === "income" && sourceById.get(t.incomeSourceId) && ` · ${sourceById.get(t.incomeSourceId)!.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <b className={t.type === "income" ? "text-success" : "text-destructive"}>
                      {t.type === "income" ? "+" : "−"} {brl(num(t.amount))}
                    </b>
                    <button onClick={() => openEditTx(t)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => deleteTx.mutate(t.id)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog transação */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTx ? "Editar transação" : "Nova transação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              {(["expense", "income"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => { setType(tp); setCategoryId("none"); }}
                  className={cn(
                    "h-9 flex-1 rounded-lg border text-sm font-medium transition",
                    type === tp
                      ? tp === "income"
                        ? "border-success bg-success/15 text-success"
                        : "border-destructive bg-destructive/15 text-destructive"
                      : "border-border/60 text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tp === "income" ? "Receita" : "Despesa"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Valor (R$)</label>
                <Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Data</label>
                <Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Descrição</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado, salário..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Conta</label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Conta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem conta</SelectItem>
                    {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Categoria</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {filteredCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {type === "income" && incomeSources.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Fonte de Renda (opcional)</label>
                <Select value={incomeSourceId} onValueChange={setIncomeSourceId}>
                  <SelectTrigger><SelectValue placeholder="Selecione a fonte" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem fonte</SelectItem>
                    {incomeSources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {filteredCats.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Crie categorias na aba <b>Orçamento</b> para classificar suas transações.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={saveTx} disabled={upsertTx.isPending}>
              {editingTx ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog conta */}
      <Dialog open={acctOpen} onOpenChange={setAcctOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova conta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nome</label>
              <Input value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="Ex: Nubank, Carteira..." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tipo</label>
                <Select value={acctType} onValueChange={setAcctType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Saldo inicial</label>
                <Input type="number" step="0.01" value={acctBalance} onChange={(e) => setAcctBalance(e.target.value)} placeholder="0,00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcctOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={saveAcct} disabled={upsertAcct.isPending}>Criar conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
