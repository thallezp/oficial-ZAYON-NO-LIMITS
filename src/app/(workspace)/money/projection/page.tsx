"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonalFinance } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { brl, num } from "@/lib/utils/life";
import { projectionSeries, earlyYearsImpact, PILLAR_BY_KEY, type PillarKey } from "@/lib/utils/finance";
import { cn } from "@/lib/utils/cn";
import { TrendingUp, Sparkles } from "lucide-react";

const YEAR_OPTIONS = [5, 10, 20, 30];

export default function MoneyProjectionPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const profile: any = data?.profile ?? null;
  const transactions: any[] = data?.transactions ?? [];
  const categories: any[] = data?.categories ?? [];

  const defaultAporte = Math.round((num(profile?.monthlyIncome) * (num(profile?.investPct) || 25)) / 100);

  const [aporte, setAporte] = React.useState(0);
  const [rate, setRate] = React.useState(9);
  const [years, setYears] = React.useState(20);
  const [principal, setPrincipal] = React.useState(0);

  React.useEffect(() => {
    if (profile) {
      setAporte(defaultAporte);
      setRate(num(profile.annualRate) || 9);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const earlyYears = Math.min(5, years);
  const { points, finalValue, totalContributed } = React.useMemo(
    () => projectionSeries({ monthly: aporte, annualRatePct: rate, years, principal }),
    [aporte, rate, years, principal],
  );
  const impact = React.useMemo(
    () => earlyYearsImpact({ monthly: aporte, annualRatePct: rate, years, earlyYears, principal }),
    [aporte, rate, years, earlyYears, principal],
  );
  const interestEarned = Math.max(0, finalValue - totalContributed);

  // Fluxo de caixa: resultado (entradas − saídas) dos últimos 6 meses.
  const cashflow = React.useMemo(() => {
    const out: { label: string; value: number }[] = [];
    const now = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = transactions
        .filter((t) => t.type === "income" && String(t.occurredAt).startsWith(key))
        .reduce((a, t) => a + num(t.amount), 0);
      const exp = transactions
        .filter((t) => t.type === "expense" && String(t.occurredAt).startsWith(key))
        .reduce((a, t) => a + num(t.amount), 0);
      out.push({ label: d.toLocaleDateString("pt-BR", { month: "short" }), value: Math.round(inc - exp) });
    }
    return out;
  }, [transactions]);

  // Saídas por pilar (mês atual).
  const byPillar = React.useMemo(() => {
    const pillarOf = new Map<string, PillarKey | null>(categories.map((c) => [c.id, (c.pillar as PillarKey) ?? null]));
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    const acc: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense" && String(t.occurredAt).startsWith(month))
      .forEach((t) => {
        const p = pillarOf.get(t.categoryId);
        if (!p) return;
        acc[p] = (acc[p] ?? 0) + num(t.amount);
      });
    return Object.entries(acc).map(([k, v]) => ({ label: PILLAR_BY_KEY[k as PillarKey]?.label ?? k, value: Math.round(v) }));
  }, [transactions, categories]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projeção de Patrimônio"
        description="Juros compostos sobre seus aportes mensais. Veja por que aportar cedo e pesado constrói o patrimônio."
      />

      {/* Controles */}
      <Card>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Aporte mensal (os 25%)</label>
            <Input type="number" value={aporte || ""} onChange={(e) => setAporte(Number(e.target.value) || 0)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Taxa real (% a.a.)</label>
            <Input type="number" step="0.1" value={rate || ""} onChange={(e) => setRate(Number(e.target.value) || 0)} placeholder="9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Saldo inicial (opcional)</label>
            <Input type="number" value={principal || ""} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} placeholder="0,00" />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <label className="text-xs text-muted-foreground">Prazo</label>
            <div className="flex gap-2">
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYears(y)}
                  className={cn(
                    "h-9 flex-1 rounded-lg border text-sm font-medium transition",
                    years === y ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                  )}
                >
                  {y} anos
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Patrimônio em ${years} anos`} value={brl(finalValue)} accent="success" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Total aportado" value={brl(totalContributed)} accent="primary" />
        <StatCard label="Só de juros" value={brl(interestEarned)} accent="success" />
      </div>

      {/* Projeção + destaque dos primeiros anos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-warning" /> Projeção (juros compostos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aporte > 0 ? (
            <>
              <ProjectionChart data={points} highlightYears={earlyYears} formatter={(v) => brl(v)} />
              <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
                <Badge variant="warning" size="sm" className="mb-1">Efeito dos primeiros anos</Badge>
                <p className="text-muted-foreground">
                  Aportando só nos <b className="text-foreground">primeiros {earlyYears} anos</b> e deixando render,
                  você chegaria a <b className="text-foreground">{brl(impact.earlyContribFinalValue)}</b> —{" "}
                  <b className="text-warning">{impact.pct}%</b> do patrimônio final. É por isso que o método pede
                  25% (e não 20%): peso cedo rende décadas.
                </p>
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Defina um aporte mensal (ou sua renda no painel) para ver a projeção.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Fluxo de caixa (6 meses)</CardTitle></CardHeader>
          <CardContent>
            {cashflow.some((c) => c.value !== 0) ? (
              <BarChart data={cashflow} formatter={(v) => brl(v)} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Sem transações nos últimos meses.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Saídas por pilar (mês)</CardTitle></CardHeader>
          <CardContent>
            {byPillar.length > 0 ? (
              <BarChart data={byPillar} horizontal formatter={(v) => brl(v)} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Classifique categorias por pilar para ver o gasto.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
