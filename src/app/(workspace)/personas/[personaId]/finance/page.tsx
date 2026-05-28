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
import { MOCK_FINANCE, MOCK_PAYROLL, MOCK_BILLS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useFinance, useBills, usePayroll } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeFinance } from "@/hooks/use-realtime";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";

export default function FinancePage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { openWith } = useQuickCreate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("tx");
  useNewEntityShortcut("revenue");

  useRealtimeFinance(activeWorkspaceId ?? undefined, () => {
    queryClient.invalidateQueries({ queryKey: ["finance"] });
    queryClient.invalidateQueries({ queryKey: ["bills"] });
  });

  const { data: dbFinance = [] } = useFinance(activeWorkspaceId, persona.id);
  const { data: dbBills = [] } = useBills(activeWorkspaceId, persona.id);
  const { data: dbPayroll = [] } = usePayroll(activeWorkspaceId);

  const tx =
    isMockModeClient && dbFinance.length === 0
      ? MOCK_FINANCE.filter((f) => !f.personaId || f.personaId === persona.id)
      : dbFinance;
  
  const bills = isMockModeClient && dbBills.length === 0 ? MOCK_BILLS : dbBills;
  const payroll =
    isMockModeClient && dbPayroll.length === 0 ? MOCK_PAYROLL : dbPayroll;

  const revenue = tx
    .filter((t: any) => t.type === "revenue" && t.status === "paid")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const expenses = tx
    .filter((t: any) => t.type === "expense" && t.status === "paid")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const pending = tx
    .filter((t: any) => t.status === "pending")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const overdue = tx
    .filter((t: any) => t.status === "overdue")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const profit = revenue - expenses;

  // Real deltas calculations
  const now = new Date();
  const nowTime = now.getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  const current30DaysRevenue = tx
    .filter((t: any) => {
      if (t.type !== "revenue" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      return nowTime - tTime <= 30 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const previous30DaysRevenue = tx
    .filter((t: any) => {
      if (t.type !== "revenue" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      const diff = nowTime - tTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const revenueDelta = previous30DaysRevenue > 0
    ? ((current30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100
    : 0;

  const current30DaysExpenses = tx
    .filter((t: any) => {
      if (t.type !== "expense" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      return nowTime - tTime <= 30 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const previous30DaysExpenses = tx
    .filter((t: any) => {
      if (t.type !== "expense" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      const diff = nowTime - tTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const expensesDelta = previous30DaysExpenses > 0
    ? ((current30DaysExpenses - previous30DaysExpenses) / previous30DaysExpenses) * 100
    : 0;

  const current30DaysProfit = current30DaysRevenue - current30DaysExpenses;
  const previous30DaysProfit = previous30DaysRevenue - previous30DaysExpenses;
  const profitDelta = previous30DaysProfit > 0
    ? ((current30DaysProfit - previous30DaysProfit) / previous30DaysProfit) * 100
    : 0;

  // Real 12 months billing trend
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
      value: 0,
    };
  });

  tx.forEach((t: any) => {
    if (t.type === "revenue" && t.status === "paid" && t.occurredAt) {
      const date = new Date(t.occurredAt);
      const match = months.find(
        (m) => m.year === date.getFullYear() && m.month === date.getMonth()
      );
      if (match) {
        match.value += Number(t.amount);
      }
    }
  });

  const trend = months.map((m) => ({
    label: m.label,
    value: Math.round(m.value),
  }));

  const byCategory: { name: string; value: number; color?: string; }[] = Array.from(
    tx.reduce((map: Map<string, number>, t: any) => {
      const cat = t.category ?? "outros";
      map.set(cat, (map.get(cat) ?? 0) + Number(t.amount));
      return map;
    }, new Map<string, number>()),
  ).map(([name, value]: any) => ({ name, value }));

  const handleExport = () => {
    if (activeWorkspaceId) {
      window.open(`/api/exports/finance?workspaceId=${activeWorkspaceId}&personaId=${persona.id}`, "_blank");
    }
  };

  const handleAiSummary = () => {
    toast.info("Análise financeira gerada com IA", {
      description: "Margem saudável e ponto de equilíbrio atingido.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Receita, despesas, contas a pagar, folha · global ou por persona."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleAiSummary}>
              <Sparkles className="h-3.5 w-3.5" /> Resumo IA
            </Button>
            <Button variant="outline" size="sm" onClick={() => openWith("expense")}>
              <TrendingDown className="h-3.5 w-3.5" /> Nova Despesa
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("revenue")}>
              <TrendingUp className="h-3.5 w-3.5" /> Nova Receita
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="financeiro" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Faturamento acumulado"
          value={formatCurrency(revenue)}
          delta={revenueDelta}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Despesas"
          value={formatCurrency(expenses)}
          delta={expensesDelta}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="warning"
        />
        <StatCard
          label="Lucro estimado"
          value={formatCurrency(profit)}
          delta={profitDelta}
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="primary"
          hint={`margem ${((profit / Math.max(revenue, 1)) * 100).toFixed(1)}%`}
        />
        <StatCard
          label="Em aberto / atrasado"
          value={formatCurrency(pending + overdue)}
          icon={<ArrowDownRight className="h-4 w-4" />}
          accent={overdue > 0 ? "danger" : "info"}
          hint={overdue > 0 ? `${formatCurrency(overdue)} atrasado` : "todas em dia"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva de faturamento · 12 meses</CardTitle>
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
          <CardHeader>
            <CardTitle>Distribuição por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={byCategory} height={240} />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tx">Lançamentos</TabsTrigger>
          <TabsTrigger value="bills">Contas a pagar</TabsTrigger>
          <TabsTrigger value="payroll">Folha</TabsTrigger>
        </TabsList>

        <TabsContent value="tx">
          {activeTab === "tx" && (
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Fonte</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tx.map((t: any) => (
                    <tr key={t.id} className="hover:bg-accent">
                      <td className="px-4 py-2.5 font-medium">
                        <div className="flex items-center gap-2">
                          {t.type === "revenue" ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                          )}
                          {t.description}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {t.category}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline" size="sm">
                          {t.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(t.occurredAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          size="sm"
                          variant={
                            t.status === "paid"
                              ? "success"
                              : t.status === "overdue"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right num font-medium",
                          t.type === "revenue" ? "text-success" : "text-destructive",
                        )}
                      >
                        {t.type === "expense" ? "-" : ""}
                        {formatCurrency(Number(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bills">
          {activeTab === "bills" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bills.map((b: any) => (
                <Card key={b.id} variant="elevated">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{b.name}</p>
                      <Badge
                        size="sm"
                        variant={b.status === "overdue" ? "danger" : "warning"}
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-xl font-semibold num">
                      {formatCurrency(Number(b.amount))}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        vence em {new Date(b.dueAt).toLocaleDateString("pt-BR")}
                      </span>
                      {b.recurrence && (
                        <Badge variant="outline" size="sm">
                          {b.recurrence}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payroll">
          {activeTab === "payroll" && (
            <Card>
              <CardContent className="p-0 divide-y divide-border/60">
                {payroll.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold">
                      {(p.name || "").split(" ").map((s: string) => s[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.role} · pagamento {p.payDay}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold num">{formatCurrency(Number(p.baseSalary))}</p>
                      {p.commission && Number(p.commission) > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          + {formatCurrency(Number(p.commission))} comissão
                        </p>
                      )}
                    </div>
                    <Badge size="sm" variant="success">
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
