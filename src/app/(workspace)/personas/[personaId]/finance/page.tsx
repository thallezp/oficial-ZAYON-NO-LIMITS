"use client";

import * as React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Download,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  User,
  Paperclip,
  Trash2,
  Check,
  CheckCircle,
  ExternalLink,
  Edit2,
  DollarSign,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatCard } from "@/components/ui/stat-card";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { formatCurrency, formatCompact } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useFinance,
  useBills,
  usePayroll,
  usePersonas,
  useCreateFinancialMutation,
  useDeleteFinancialMutation,
  useUpdateFinancialStatusMutation,
  useUpdateFinancialReceiptMutation,
  useCreateBillMutation,
  useUpdateBillStatusMutation,
  useDeleteBillMutation,
  useCreatePayrollMemberMutation,
  useUpdatePayrollMemberMutation,
  useDeletePayrollMemberMutation,
  usePayPayrollMemberMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeFinance } from "@/hooks/use-realtime";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function FinancePage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { openWith } = useQuickCreate();
  const queryClient = useQueryClient();

  // Navigation tab
  const [activeTab, setActiveTab] = React.useState("tx");
  useNewEntityShortcut("revenue");

  // Realtime updates
  useRealtimeFinance(activeWorkspaceId ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
    queryClient.invalidateQueries({ queryKey: ["bills"] });
    queryClient.invalidateQueries({ queryKey: ["payroll"] });
  });

  // Filter States
  const [selectedPersonaId, setSelectedPersonaId] = React.useState<string>(persona.id);
  const [periodFilter, setPeriodFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals visibility
  const [isBillModalOpen, setIsBillModalOpen] = React.useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = React.useState(false);
  const [receiptTxId, setReceiptTxId] = React.useState<string | null>(null);

  // Modal input states (Bill)
  const [billName, setBillName] = React.useState("");
  const [billAmount, setBillAmount] = React.useState("");
  const [billDueAt, setBillDueAt] = React.useState(new Date().toISOString().slice(0, 10));
  const [billRecurrence, setBillRecurrence] = React.useState("none");
  const [billStatus, setBillStatus] = React.useState("pending");

  // Modal input states (Payroll)
  const [payName, setPayName] = React.useState("");
  const [payRole, setPayRole] = React.useState("");
  const [payBaseSalary, setPayBaseSalary] = React.useState("");
  const [payCommission, setPayCommission] = React.useState("");
  const [payPixKey, setPayPixKey] = React.useState("");
  const [payDay, setPayDay] = React.useState("05");

  // Modal input states (Receipt)
  const [receiptUrl, setReceiptUrl] = React.useState("");

  // Queries
  const { data: dbFinance = [] } = useFinance(
    activeWorkspaceId,
    selectedPersonaId === "all" ? null : selectedPersonaId
  );
  const { data: dbBills = [] } = useBills(
    activeWorkspaceId,
    selectedPersonaId === "all" ? null : selectedPersonaId
  );
  const { data: dbPayroll = [] } = usePayroll(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);

  // Mutations
  const deleteTx = useDeleteFinancialMutation();
  const updateTxStatus = useUpdateFinancialStatusMutation();
  const updateReceipt = useUpdateFinancialReceiptMutation();

  const createBill = useCreateBillMutation();
  const updateBillStatus = useUpdateBillStatusMutation();
  const deleteBill = useDeleteBillMutation();

  const createPayroll = useCreatePayrollMemberMutation();
  const deletePayroll = useDeletePayrollMemberMutation();
  const payPayroll = usePayPayrollMemberMutation();

  // ---------------------------------------------------------------------------
  // Data Resolve
  // ---------------------------------------------------------------------------
  const tx = React.useMemo(() => {
    return dbFinance;
  }, [dbFinance, selectedPersonaId]);

  const bills = React.useMemo(() => {
    return dbBills;
  }, [dbBills]);

  const payroll = React.useMemo(() => {
    return dbPayroll;
  }, [dbPayroll]);

  // Unique categories list for filters
  const categoriesList = React.useMemo(() => {
    const set = new Set<string>();
    tx.forEach((t: any) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [tx]);

  // ---------------------------------------------------------------------------
  // Client-side Filters logic
  // ---------------------------------------------------------------------------
  const msInDay = 24 * 60 * 60 * 1000;
  const now = new Date();

  const filteredTx = React.useMemo(() => {
    return tx.filter((t: any) => {
      if (searchQuery.trim() && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== "all" && t.category !== categoryFilter) {
        return false;
      }
      if (periodFilter !== "all" && t.occurredAt) {
        const tDate = new Date(t.occurredAt);
        const diffDays = (now.getTime() - tDate.getTime()) / msInDay;
        if (periodFilter === "30" && diffDays > 30) return false;
        if (periodFilter === "90" && diffDays > 90) return false;
        if (periodFilter === "12m" && diffDays > 365) return false;
        if (periodFilter === "month") {
          return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
        }
      }
      return true;
    });
  }, [tx, searchQuery, categoryFilter, periodFilter]);

  const filteredBills = React.useMemo(() => {
    return bills.filter((b: any) => {
      if (periodFilter !== "all" && b.dueAt) {
        const bDate = new Date(b.dueAt);
        const diffDays = (now.getTime() - bDate.getTime()) / msInDay;
        if (periodFilter === "30" && diffDays > 30) return false;
        if (periodFilter === "90" && diffDays > 90) return false;
        if (periodFilter === "12m" && diffDays > 365) return false;
        if (periodFilter === "month") {
          return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
        }
      }
      return true;
    });
  }, [bills, periodFilter]);

  // ---------------------------------------------------------------------------
  // KPI Calculations
  // ---------------------------------------------------------------------------
  const revenue = React.useMemo(() => {
    return filteredTx
      .filter((t: any) => t.type === "revenue" && t.status === "paid")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  }, [filteredTx]);

  const expenses = React.useMemo(() => {
    return filteredTx
      .filter((t: any) => t.type === "expense" && t.status === "paid")
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  }, [filteredTx]);

  const profit = revenue - expenses;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Overdue calculation
  const totalOverdue = React.useMemo(() => {
    const overdueTx = filteredTx.filter((t: any) => t.status === "overdue").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const overdueBillsVal = filteredBills.filter((b: any) => b.status === "overdue").reduce((sum: number, b: any) => sum + Number(b.amount), 0);
    return overdueTx + overdueBillsVal;
  }, [filteredTx, filteredBills]);

  // Saldo Projetado: Paid Balance + Pending Revenue - (Pending Expenses + Pending Bills)
  const projectedBalance = React.useMemo(() => {
    const currentBalance = revenue - expenses;
    const pendingRevenues = filteredTx.filter((t: any) => t.type === "revenue" && t.status === "pending").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const pendingExpenses = filteredTx.filter((t: any) => t.type === "expense" && t.status === "pending").reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const pendingBillsVal = filteredBills.filter((b: any) => b.status === "pending").reduce((sum: number, b: any) => sum + Number(b.amount), 0);
    return currentBalance + pendingRevenues - (pendingExpenses + pendingBillsVal);
  }, [revenue, expenses, filteredTx, filteredBills]);

  // Contas Próximas (due in next 7 days and pending)
  const totalNearDue = React.useMemo(() => {
    let sum = 0;
    filteredBills.forEach((b: any) => {
      if (b.status === "pending" && b.dueAt) {
        const diff = (new Date(b.dueAt).getTime() - now.getTime()) / msInDay;
        if (diff >= -1 && diff <= 7) {
          sum += Number(b.amount);
        }
      }
    });
    filteredTx.forEach((t: any) => {
      if (t.status === "pending" && t.occurredAt) {
        const diff = (new Date(t.occurredAt).getTime() - now.getTime()) / msInDay;
        if (diff >= -1 && diff <= 7) {
          sum += Number(t.amount);
        }
      }
    });
    return sum;
  }, [filteredBills, filteredTx]);

  // Deltas mock calculations for StatCards
  const revenueDelta = 12.4;
  const expensesDelta = -3.2;
  const profitDelta = 18.1;

  // Chart Data
  const trend = React.useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        label: d.toLocaleDateString("pt-BR", { month: "short" }),
        value: 0,
      };
    });
    filteredTx.forEach((t: any) => {
      if (t.type === "revenue" && t.status === "paid" && t.occurredAt) {
        const date = new Date(t.occurredAt);
        const match = months.find(
          (m) => m.label === date.toLocaleDateString("pt-BR", { month: "short" })
        );
        if (match) {
          match.value += Number(t.amount);
        }
      }
    });
    return months;
  }, [filteredTx]);

  const byCategory = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach((t: any) => {
      if (t.status === "paid") {
        const cat = t.category ?? "outros";
        map.set(cat, (map.get(cat) ?? 0) + Number(t.amount));
      }
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredTx]);

  const revenueByPersona = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach((t: any) => {
      if (t.type === "revenue" && t.status === "paid") {
        const pId = t.personaId || "global";
        map.set(pId, (map.get(pId) ?? 0) + Number(t.amount));
      }
    });
    return Array.from(map.entries()).map(([pId, value]) => {
      const name = dbPersonas.find((p: any) => p.id === pId)?.codename || "Workspace Global";
      return { name, value };
    });
  }, [filteredTx, dbPersonas]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleUpdateTxStatus = async (id: string, status: string) => {
    try {
      await updateTxStatus.mutateAsync({ id, status });
      toast.success("Lançamento atualizado!");
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleOpenReceiptModal = (id: string, currentUrl?: string) => {
    setReceiptTxId(id);
    setReceiptUrl(currentUrl || "");
  };

  const handleSaveReceipt = async () => {
    if (!receiptTxId) return;
    try {
      await updateReceipt.mutateAsync({ id: receiptTxId, receiptUrl });
      toast.success("Comprovante anexado!");
      setReceiptTxId(null);
      setReceiptUrl("");
    } catch {
      toast.error("Erro ao anexar comprovante");
    }
  };

  const handleDeleteTx = async (id: string) => {
    if (!confirm("Excluir este lançamento permanentemente?")) return;
    try {
      await deleteTx.mutateAsync(id);
      toast.success("Lançamento excluído");
    } catch {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const handleCreateBill = async () => {
    if (!billName.trim() || !billAmount || !activeWorkspaceId) {
      toast.warning("Preencha os campos obrigatórios");
      return;
    }
    const val = Number(billAmount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Valor inválido");
      return;
    }
    try {
      await createBill.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: selectedPersonaId === "all" ? null : selectedPersonaId,
        name: billName.trim(),
        amount: val,
        dueAt: billDueAt,
        recurrence: billRecurrence === "none" ? null : billRecurrence,
        status: billStatus,
      });
      toast.success("Conta a pagar cadastrada!");
      setIsBillModalOpen(false);
      setBillName("");
      setBillAmount("");
      setBillRecurrence("none");
    } catch {
      toast.error("Erro ao cadastrar conta a pagar");
    }
  };

  const handlePayBill = async (bill: any) => {
    try {
      await updateBillStatus.mutateAsync({ id: bill.id, status: "paid" });
      toast.success(`Conta "${bill.name}" marcada como paga! Uma despesa foi gerada.`);
    } catch {
      toast.error("Erro ao efetuar pagamento");
    }
  };

  const handleDeleteBill = async (id: string) => {
    if (!confirm("Excluir esta conta a pagar?")) return;
    try {
      await deleteBill.mutateAsync({ id });
      toast.success("Conta excluída");
    } catch {
      toast.error("Erro ao excluir conta");
    }
  };

  const handleCreatePayrollMember = async () => {
    if (!payName.trim() || !payBaseSalary || !activeWorkspaceId) {
      toast.warning("Preencha os campos obrigatórios");
      return;
    }
    try {
      await createPayroll.mutateAsync({
        workspaceId: activeWorkspaceId,
        name: payName.trim(),
        role: payRole.trim() || null,
        baseSalary: Number(payBaseSalary),
        commission: Number(payCommission) || 0,
        pixKey: payPixKey.trim() || null,
        payDay: payDay,
      });
      toast.success("Membro da folha cadastrado!");
      setIsPayrollModalOpen(false);
      setPayName("");
      setPayRole("");
      setPayBaseSalary("");
      setPayCommission("");
      setPayPixKey("");
    } catch {
      toast.error("Erro ao cadastrar membro");
    }
  };

  const handlePaySalary = async (member: any) => {
    const totalSalary = Number(member.baseSalary || 0) + Number(member.commission || 0);
    if (!confirm(`Confirmar Pix de ${formatCurrency(totalSalary)} para ${member.name}?`)) return;
    try {
      await payPayroll.mutateAsync({ id: member.id });
      toast.success("Pix de salário simulado e enviado! Despesa gerada.");
    } catch {
      toast.error("Erro ao pagar salário");
    }
  };

  const handleDeletePayrollMember = async (id: string) => {
    if (!confirm("Remover funcionário da folha de pagamento?")) return;
    try {
      await deletePayroll.mutateAsync({ id });
      toast.success("Membro removido da folha");
    } catch {
      toast.error("Erro ao remover membro");
    }
  };

  const handleExportCSV = () => {
    if (filteredTx.length === 0) {
      toast.warning("Nenhum dado para exportar");
      return;
    }
    const headers = ["Descrição", "Tipo", "Valor (R$)", "Categoria", "Fonte", "Data", "Status", "Comprovante URL"];
    const rows = filteredTx.map((t: any) => [
      t.description,
      t.type === "revenue" ? "Receita" : "Despesa",
      t.amount,
      t.category || "Outros",
      t.source || "",
      new Date(t.occurredAt).toLocaleDateString("pt-BR"),
      t.status,
      t.receiptUrl || "",
    ]);
    const csvContent = [headers.join(";"), ...rows.map((r: any) => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financeiro_${persona.codename || "persona"}_export.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com filtros aplicados!");
  };

  const handleAiSummary = () => {
    const healthPercent = margin.toFixed(0);
    toast.info("Análise Zayon AI", {
      description: `Sua margem de lucro operacional está em ${healthPercent}%. Recomenda-se provisionar o saldo projetado de ${formatCurrency(projectedBalance)} para despesas de marketing.`,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão Financeira"
        description="Gestão real de receitas, despesas, contas a pagar e folha de pagamento."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-3.5 w-3.5 mr-1" /> Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleAiSummary}>
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Diagnóstico IA
            </Button>
            <Button variant="outline" size="sm" onClick={() => openWith("expense")}>
              <TrendingDown className="h-3.5 w-3.5 mr-1 text-destructive" /> Nova Despesa
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("revenue")}>
              <TrendingUp className="h-3.5 w-3.5 mr-1 text-success" /> Nova Receita
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="financeiro" />

      {/* --- ADVANCED FILTERS SECTION --- */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-card/25 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Filtros:</span>
        </div>

        {/* Persona selector */}
        <select
          value={selectedPersonaId}
          onChange={(e) => setSelectedPersonaId(e.target.value)}
          className="h-8 text-xs bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary cursor-pointer text-foreground font-medium"
        >
          <option value="all">Todas as Personas</option>
          {dbPersonas.map((p: any) => (
            <option key={p.id} value={p.id}>
              Codinome: {p.codename || p.name}
            </option>
          ))}
        </select>

        {/* Period selection */}
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="h-8 text-xs bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary cursor-pointer text-foreground font-medium"
        >
          <option value="all">Todo o período</option>
          <option value="month">Este Mês</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="12m">Últimos 12 meses</option>
        </select>

        {/* Category selection */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-8 text-xs bg-card border border-border/60 rounded-md px-2 outline-none focus:border-primary cursor-pointer text-foreground font-medium"
        >
          <option value="all">Todas as Categorias</option>
          {categoriesList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Keyword text search */}
        <div className="relative ml-auto w-full sm:w-60">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lançamentos..."
            className="h-8 text-xs pl-8 bg-card border-border/60"
          />
        </div>
      </div>

      {/* --- REAL KPIs GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Faturamento Recebido"
          value={formatCurrency(revenue)}
          delta={revenueDelta}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Despesas Pagas"
          value={formatCurrency(expenses)}
          delta={expensesDelta}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="warning"
        />
        <StatCard
          label="Lucro e Margem"
          value={formatCurrency(profit)}
          delta={profitDelta}
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="primary"
          hint={`margem de ${margin.toFixed(1)}%`}
        />
        <StatCard
          label="Saldo Projetado"
          value={formatCurrency(projectedBalance)}
          icon={<DollarSign className="h-4 w-4" />}
          accent={projectedBalance >= 0 ? "info" : "danger"}
          hint={`Atrasado: ${formatCurrency(totalOverdue)}`}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4 flex flex-col justify-between">
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Contas Vencidas (Atrasadas)</div>
          <div className="text-2xl font-bold font-mono text-destructive mt-1">{formatCurrency(totalOverdue)}</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">Exige regularização imediata de caixa.</div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-4 flex flex-col justify-between">
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Contas Próximas (7 dias)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{formatCurrency(totalNearDue)}</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">Vencimentos provisionados de curto prazo.</div>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 flex flex-col justify-between">
          <div className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Margem Operacional Média</div>
          <div className="text-2xl font-bold font-mono text-primary mt-1">{margin.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground/60 mt-1">Razão entre lucro real e receita recebida.</div>
        </div>
      </div>

      {/* --- DASHBOARD CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva Mensal de Faturamento (Histórico)</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={trend}
              color="#22c55e"
              formatter={(v) => formatCurrency(v)}
              height={240}
            />
          </CardContent>
        </Card>
        <Card>
          <Tabs defaultValue="cats">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Breakdowns</CardTitle>
              <TabsList className="h-7">
                <TabsTrigger value="cats" className="text-[10px] px-2 py-0.5">Categorias</TabsTrigger>
                <TabsTrigger value="personas" className="text-[10px] px-2 py-0.5">Personas</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-2">
              <TabsContent value="cats" className="mt-0">
                {byCategory.length > 0 ? (
                  <PieChart data={byCategory} height={220} />
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs italic">
                    Sem lançamentos neste período.
                  </div>
                )}
              </TabsContent>
              <TabsContent value="personas" className="mt-0">
                {revenueByPersona.length > 0 ? (
                  <PieChart data={revenueByPersona} height={220} />
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs italic">
                    Sem faturamento por persona.
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* --- DATA TABS --- */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-border/20 pb-1">
          <TabsList className="border-none">
            <TabsTrigger value="tx">Lançamentos Financeiros</TabsTrigger>
            <TabsTrigger value="bills">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="payroll">Folha de Pagamento</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {activeTab === "bills" && (
              <Button size="sm" variant="gradient" className="h-8 text-xs" onClick={() => setIsBillModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Criar Conta a Pagar
              </Button>
            )}
            {activeTab === "payroll" && (
              <Button size="sm" variant="gradient" className="h-8 text-xs" onClick={() => setIsPayrollModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Cadastrar Funcionário/PJ
              </Button>
            )}
          </div>
        </div>

        {/* --- TAB: TRANSACTIONS LIST --- */}
        <TabsContent value="tx">
          {activeTab === "tx" && (
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-card/40">
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Comprovante</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTx.map((t: any) => (
                    <tr key={t.id} className="hover:bg-accent/40">
                      <td className="px-4 py-2.5 font-semibold">
                        <div className="flex items-center gap-2">
                          {t.type === "revenue" ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                          )}
                          {t.description}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{t.category || "Outros"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" size="sm">
                          {t.source || "Geral"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(t.occurredAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={t.status}
                          onChange={(e) => handleUpdateTxStatus(t.id, e.target.value)}
                          className={cn(
                            "text-[10px] font-bold rounded px-1 py-0.5 border outline-none bg-background cursor-pointer text-foreground",
                            t.status === "paid" && "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
                            t.status === "pending" && "border-amber-500/30 text-amber-400 bg-amber-500/10",
                            t.status === "overdue" && "border-rose-500/30 text-rose-400 bg-rose-500/10"
                          )}
                        >
                          <option value="pending">Pendente</option>
                          <option value="paid">Pago</option>
                          <option value="overdue">Atrasado</option>
                          <option value="canceled">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        {t.receiptUrl ? (
                          <a
                            href={t.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline text-xs"
                          >
                            <Paperclip className="h-3 w-3" /> Ver Comprovante
                          </a>
                        ) : (
                          <button
                            onClick={() => handleOpenReceiptModal(t.id, t.receiptUrl)}
                            className="text-[10px] text-muted-foreground hover:text-primary transition"
                          >
                            + Comprovante
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleOpenReceiptModal(t.id, t.receiptUrl)}>
                            <Paperclip className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive/70 hover:text-destructive"
                            onClick={() => handleDeleteTx(t.id)}
                            disabled={deleteTx.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right num font-mono font-bold",
                          t.type === "revenue" ? "text-success" : "text-destructive"
                        )}
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                  {filteredTx.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground italic text-xs">
                        Nenhum lançamento financeiro registrado com os filtros ativos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* --- TAB: BILLS TO PAY --- */}
        <TabsContent value="bills">
          {activeTab === "bills" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBills.map((b: any) => (
                <Card key={b.id} variant="elevated" className="hover:border-primary/30 transition">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate max-w-[70%]">{b.name}</p>
                      <Badge
                        size="sm"
                        variant={
                          b.status === "paid"
                            ? "success"
                            : b.status === "overdue"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>

                    <div className="flex items-baseline justify-between mt-1">
                      <p className="text-2xl font-bold font-mono text-foreground">
                        {formatCurrency(Number(b.amount))}
                      </p>
                      {b.recurrence && (
                        <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 capitalize">
                          {b.recurrence}
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-2 border-t border-border/10">
                      <span>Vencimento: {new Date(b.dueAt).toLocaleDateString("pt-BR")}</span>
                      <div className="flex gap-1">
                        {b.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-[10px] px-2 py-0 border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                            onClick={() => handlePayBill(b)}
                            disabled={updateBillStatus.isPending}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => handleDeleteBill(b.id)}
                          disabled={deleteBill.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredBills.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground text-xs italic border border-dashed border-border/40 rounded-xl">
                  Nenhuma conta a pagar programada.
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* --- TAB: PAYROLL --- */}
        <TabsContent value="payroll">
          {activeTab === "payroll" && (
            <Card>
              <CardContent className="p-0 divide-y divide-border/60">
                {payroll.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.01]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/20 text-xs font-bold shrink-0">
                      {(p.name || "").split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.metadata?.lastPaidMonth && (
                          <Badge variant="ghost" size="sm" className="text-[9px]">
                            Pago em: {p.metadata.lastPaidMonth}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Cargo: {p.role || "PJ"} · Paga dia {p.payDay || "05"} · Pix: <span className="font-mono">{p.pixKey || "Nenhum"}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm font-mono">{formatCurrency(Number(p.baseSalary))}</p>
                      {p.commission && Number(p.commission) > 0 && (
                        <p className="text-[10px] text-emerald-400 font-mono">
                          + {formatCurrency(Number(p.commission))} comissão
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
                        onClick={() => handlePaySalary(p)}
                        disabled={payPayroll.isPending}
                      >
                        <Check className="h-3 w-3 mr-0.5" /> Pagar Salário
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeletePayrollMember(p.id)}
                        disabled={deletePayroll.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {payroll.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-xs italic">
                    Nenhum colaborador ou PJ cadastrado na folha de pagamento.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* --- DIALOG: CREATE BILL --- */}
      {isBillModalOpen && (
        <Dialog open onOpenChange={setIsBillModalOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Programar Conta a Pagar</DialogTitle>
              <DialogDescription>Cadastre as despesas e vencimentos futuros da persona.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome / Descrição da Conta</Label>
                <Input value={billName} onChange={(e) => setBillName(e.target.value)} placeholder="Ex: Servidor Supabase" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Valor (R$)</Label>
                  <Input value={billAmount} onChange={(e) => setBillAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data de Vencimento</Label>
                  <Input type="date" value={billDueAt} onChange={(e) => setBillDueAt(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Recorrência</Label>
                  <select
                    value={billRecurrence}
                    onChange={(e) => setBillRecurrence(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="none">Nenhuma (Única)</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Status Inicial</Label>
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasada</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsBillModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" size="sm" onClick={handleCreateBill} disabled={createBill.isPending}>Salvar Conta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* --- DIALOG: CREATE PAYROLL MEMBER --- */}
      {isPayrollModalOpen && (
        <Dialog open onOpenChange={setIsPayrollModalOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Cadastrar na Folha de Pagamento</DialogTitle>
              <DialogDescription>Adicione prestadores, freelancers ou funcionários fixos vinculados ao time.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do Profissional</Label>
                  <Input value={payName} onChange={(e) => setPayName(e.target.value)} placeholder="Ex: Mariana Silva" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cargo / Função</Label>
                  <Input value={payRole} onChange={(e) => setPayRole(e.target.value)} placeholder="Ex: Designer UI/UX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Salário Base / Fixo (R$)</Label>
                  <Input type="number" value={payBaseSalary} onChange={(e) => setPayBaseSalary(e.target.value)} placeholder="4000" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comissão Variável (R$)</Label>
                  <Input type="number" value={payCommission} onChange={(e) => setPayCommission(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs">Chave Pix</Label>
                  <Input value={payPixKey} onChange={(e) => setPayPixKey(e.target.value)} placeholder="E-mail, CNPJ ou Celular" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dia de Vencimento Mensal</Label>
                  <select
                    value={payDay}
                    onChange={(e) => setPayDay(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                      <option key={d} value={d}>
                        Todo dia {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setIsPayrollModalOpen(false)}>Cancelar</Button>
              <Button variant="gradient" size="sm" onClick={handleCreatePayrollMember} disabled={createPayroll.isPending}>Cadastrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* --- DIALOG: ATTACH RECEIPT --- */}
      {receiptTxId && (
        <Dialog open onOpenChange={() => setReceiptTxId(null)}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Anexar Comprovante / Fatura</DialogTitle>
              <DialogDescription>Adicione a URL do comprovante de pagamento ou fatura digital correspondente.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">URL do Comprovante (PDF, JPG ou Drive)</Label>
                <Input
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setReceiptTxId(null)}>Cancelar</Button>
              <Button variant="gradient" size="sm" onClick={handleSaveReceipt} disabled={updateReceipt.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
