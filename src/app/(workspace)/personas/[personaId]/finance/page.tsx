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
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function FinancePage() {
  const persona = usePersonaFromRoute();
  const tx = MOCK_FINANCE.filter(
    (f) => !f.personaId || f.personaId === persona.id,
  );

  const revenue = tx
    .filter((t) => t.type === "revenue" && t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = tx
    .filter((t) => t.type === "expense" && t.status === "paid")
    .reduce((sum, t) => sum + t.amount, 0);
  const pending = tx
    .filter((t) => t.status === "pending")
    .reduce((sum, t) => sum + t.amount, 0);
  const overdue = tx
    .filter((t) => t.status === "overdue")
    .reduce((sum, t) => sum + t.amount, 0);
  const profit = revenue - expenses;

  const trend = Array.from({ length: 12 }, (_, i) => ({
    label: `M${i + 1}`,
    value: Math.round(revenue / 12 + Math.sin(i / 2) * 4000 + i * 800),
  }));

  const byCategory = Array.from(
    tx.reduce((map, t) => {
      const cat = t.category ?? "outros";
      map.set(cat, (map.get(cat) ?? 0) + t.amount);
      return map;
    }, new Map<string, number>()),
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Receita, despesas, contas a pagar, folha · global ou por persona."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Resumo IA
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Lançamento
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="financeiro" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Faturamento acumulado"
          value={formatCurrency(revenue)}
          delta={18.4}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Despesas"
          value={formatCurrency(expenses)}
          delta={-6.2}
          icon={<TrendingDown className="h-4 w-4" />}
          accent="warning"
        />
        <StatCard
          label="Lucro estimado"
          value={formatCurrency(profit)}
          delta={22.4}
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

      <Tabs defaultValue="tx">
        <TabsList>
          <TabsTrigger value="tx">Lançamentos</TabsTrigger>
          <TabsTrigger value="bills">Contas a pagar</TabsTrigger>
          <TabsTrigger value="payroll">Folha</TabsTrigger>
        </TabsList>

        <TabsContent value="tx">
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
                {tx.map((t) => (
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
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="bills">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MOCK_BILLS.map((b) => (
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
                    {formatCurrency(b.amount)}
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
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardContent className="p-0 divide-y divide-border/60">
              {MOCK_PAYROLL.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-xs font-bold">
                    {p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.role} · pagamento {p.payDay}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold num">{formatCurrency(p.baseSalary)}</p>
                    {p.commission && p.commission > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        + {formatCurrency(p.commission)} comissão
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
