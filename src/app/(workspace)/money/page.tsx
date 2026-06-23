"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalFinanceProfile,
  useUpsertPersonalCategory,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart } from "@/components/charts/pie-chart";
import { GaugeChart } from "@/components/charts/gauge-chart";
import {
  PiggyBank,
  Lock,
  LineChart,
  Receipt,
  Target,
  Sparkles,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { brl, num, currentMonthKey } from "@/lib/utils/life";
import {
  PILLARS,
  SPENDING_PILLARS,
  DEFAULT_LIFE_SHARE,
  PILLAR_BY_KEY,
  type PillarKey,
} from "@/lib/utils/finance";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export default function MoneyDashboardPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsertProfile = useUpsertPersonalFinanceProfile();
  const upsertCategory = useUpsertPersonalCategory();

  const categories: any[] = data?.categories ?? [];
  const transactions: any[] = data?.transactions ?? [];
  const goals: any[] = data?.goals ?? [];
  const profile: any = data?.profile ?? null;

  // Estado local da renda e do % (sincroniza com o profile do banco).
  const [income, setIncome] = React.useState(0);
  const [pct, setPct] = React.useState(25);
  React.useEffect(() => {
    if (profile) {
      setIncome(num(profile.monthlyIncome));
      setPct(num(profile.investPct) || 25);
    }
  }, [profile]);

  const month = currentMonthKey();
  const invest = (income * pct) / 100;
  const life = income - invest;

  const saveProfile = (patch: Record<string, any>) => {
    if (!ws) return;
    upsertProfile.mutate({ workspaceId: ws, ...patch });
  };

  // Gasto do mês por pilar (categorias com pillar setado).
  const pillarById = React.useMemo(() => {
    const m = new Map<string, PillarKey | null>();
    categories.forEach((c) => m.set(c.id, (c.pillar as PillarKey) ?? null));
    return m;
  }, [categories]);

  const spentByPillar = React.useMemo(() => {
    const m: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense" && String(t.occurredAt).startsWith(month))
      .forEach((t) => {
        const p = pillarById.get(t.categoryId);
        if (!p) return;
        m[p] = (m[p] ?? 0) + num(t.amount);
      });
    return m;
  }, [transactions, pillarById, month]);

  // Alvo por pilar de gasto: soma dos orçamentos das categorias do pilar; se 0,
  // usa a sugestão (fração dos 75% "Vida").
  const targetByPillar = React.useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of SPENDING_PILLARS) {
      const budgets = categories
        .filter((c) => c.pillar === p.key)
        .reduce((a, c) => a + num(c.monthlyBudget), 0);
      m[p.key] = budgets > 0 ? budgets : life * DEFAULT_LIFE_SHARE[p.key as Exclude<PillarKey, "metas">];
    }
    return m;
  }, [categories, life]);

  const investedThisMonth = spentByPillar["metas"] ?? 0;
  const hasPillars = categories.some((c) => c.pillar);

  const totalSpentLife = SPENDING_PILLARS.reduce((a, p) => a + (spentByPillar[p.key] ?? 0), 0);
  const freeLeftover = Math.max(0, life - totalSpentLife);

  // Donut da alocação planejada: 25% Metas + os 4 pilares (alvo).
  const donutData = React.useMemo(
    () => [
      { name: "Metas (investir)", value: Math.round(invest), color: PILLAR_BY_KEY.metas.color },
      ...SPENDING_PILLARS.map((p) => ({
        name: p.label,
        value: Math.round(targetByPillar[p.key] ?? 0),
        color: p.color,
      })),
    ],
    [invest, targetByPillar],
  );

  // Meta principal (número mágico): progresso de aportes acumulados.
  const magicNumber = num(profile?.magicNumber);
  const totalInvested = transactions
    .filter((t) => t.type === "expense" && pillarById.get(t.categoryId) === "metas")
    .reduce((a, t) => a + num(t.amount), 0);
  const goalTarget = magicNumber > 0 ? magicNumber : goals.reduce((a, g) => a + num(g.targetAmount), 0);
  const goalCurrent = magicNumber > 0 ? totalInvested : goals.reduce((a, g) => a + num(g.currentAmount), 0);
  const goalPct = goalTarget > 0 ? Math.min(100, Math.round((goalCurrent / goalTarget) * 100)) : 0;

  // Insights calculados.
  const insights: { tone: "danger" | "warning" | "success"; text: string }[] = [];
  const cfTarget = targetByPillar["custo_fixo"] ?? 0;
  const cfSpent = spentByPillar["custo_fixo"] ?? 0;
  if (cfTarget > 0 && cfSpent > cfTarget) {
    insights.push({ tone: "danger", text: `Custo Fixo estourou: ${brl(cfSpent)} de ${brl(cfTarget)}.` });
  }
  if (income > 0 && investedThisMonth < invest) {
    insights.push({
      tone: "warning",
      text: `Você aportou ${brl(investedThisMonth)} este mês — faltam ${brl(invest - investedThisMonth)} para os ${pct}%.`,
    });
  }
  if (income > 0 && freeLeftover > 0) {
    insights.push({
      tone: "success",
      text: `Sobra livre de ${brl(freeLeftover)} não investida — considere aportar nas Metas.`,
    });
  }

  const setupPillars = async () => {
    if (!ws) return;
    try {
      for (const p of PILLARS) {
        const exists = categories.some((c) => c.pillar === p.key);
        if (exists) continue;
        const budget =
          p.key === "metas" ? invest : life * DEFAULT_LIFE_SHARE[p.key as Exclude<PillarKey, "metas">];
        await upsertCategory.mutateAsync({
          workspaceId: ws,
          name: p.label,
          kind: "expense",
          pillar: p.key,
          color: p.color,
          monthlyBudget: budget > 0 ? Math.round(budget) : null,
        });
      }
      toast.success("Pilares configurados!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao configurar pilares");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro Pessoal"
        description="Método Pague-se Primeiro: investe primeiro, vive com o resto."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/money/projection"><LineChart className="h-4 w-4" /> Projeção</Link>
            </Button>
            <Button variant="gradient" size="sm" asChild>
              <Link href="/money/transactions"><ArrowLeftRight className="h-4 w-4" /> Nova transação</Link>
            </Button>
          </div>
        }
      />

      {/* ── Header de distribuição: o coração do método ───────────────────── */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Renda mensal
              </label>
              <Input
                type="number"
                inputMode="decimal"
                value={income || ""}
                onChange={(e) => setIncome(Number(e.target.value) || 0)}
                onBlur={() => num(profile?.monthlyIncome) !== income && saveProfile({ monthlyIncome: income })}
                placeholder="0,00"
                className="h-11 text-lg font-semibold"
              />
            </div>

            {/* Bloco PAGUE-SE PRIMEIRO — reservado antes de qualquer gasto */}
            <div className="rounded-xl border border-success/30 bg-success/10 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-success">
                  <Lock className="h-3.5 w-3.5" /> Pague-se Primeiro
                </span>
                <Badge variant="success" size="sm">{pct}%</Badge>
              </div>
              <p className="mt-2 font-mono text-3xl font-bold text-success">{brl(invest)}</p>
              <p className="text-[11px] text-muted-foreground">
                Reservado pra investir <b>antes</b> de viver os {brl(life)} restantes.
              </p>
              <input
                type="range"
                min={5}
                max={50}
                step={1}
                value={pct}
                onChange={(e) => setPct(Number(e.target.value))}
                onPointerUp={() => num(profile?.investPct) !== pct && saveProfile({ investPct: pct })}
                onBlur={() => num(profile?.investPct) !== pct && saveProfile({ investPct: pct })}
                className="mt-3 w-full accent-success"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Investe {pct}%</span>
                <span>Vive com {100 - pct}%</span>
              </div>
            </div>
          </div>

          {/* Donut 25 vs 75 (alocação planejada) */}
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Alocação planejada
            </span>
            {income > 0 ? (
              <PieChart data={donutData} height={220} />
            ) : (
              <div className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
                Informe sua renda para ver a divisão 25/75.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── 4 pilares dos 75% + Metas ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Os 5 pilares</h2>
        {!hasPillars && (
          <Button variant="outline" size="sm" onClick={setupPillars} disabled={upsertCategory.isPending}>
            <Sparkles className="h-3.5 w-3.5" /> Configurar pilares
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((p) => {
          const isMetas = p.key === "metas";
          const spent = isMetas ? investedThisMonth : spentByPillar[p.key] ?? 0;
          const target = isMetas ? invest : targetByPillar[p.key] ?? 0;
          const pctUsed = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
          const over = !isMetas && target > 0 && spent > target;
          const tone = isMetas
            ? "bg-success"
            : over
              ? "bg-destructive"
              : pctUsed > 80
                ? "bg-warning"
                : "bg-primary";
          return (
            <Card
              key={p.key}
              className={cn(isMetas && "border-success/40 bg-success/[0.04]")}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </span>
                  {isMetas && <Badge variant="success" size="sm">25% • privilegiado</Badge>}
                </div>
                <p className="text-[11px] leading-snug text-muted-foreground">{p.desc}</p>
                <div className="flex items-baseline justify-between pt-1 text-sm">
                  <span className={cn("num font-semibold", over && "text-destructive")}>{brl(spent)}</span>
                  <span className="text-xs text-muted-foreground">de {brl(target)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                  <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pctUsed}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isMetas
                    ? spent >= target
                      ? "Meta de aporte do mês batida ✓"
                      : `Faltam ${brl(Math.max(0, target - spent))} para os ${pct}%`
                    : `Saldo: ${brl(Math.max(0, target - spent))}`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Insights + Meta (número mágico) ───────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Insights do mês</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {income <= 0 ? (
              <p className="py-3 text-center text-sm text-muted-foreground">Informe sua renda para gerar insights.</p>
            ) : insights.length === 0 ? (
              <p className="py-3 text-center text-sm text-success">Tudo nos trilhos: 25% reservado e gastos sob controle. 🎯</p>
            ) : (
              insights.map((ins, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm",
                    ins.tone === "danger" && "border-destructive/30 bg-destructive/5 text-destructive",
                    ins.tone === "warning" && "border-warning/30 bg-warning/5 text-warning",
                    ins.tone === "success" && "border-success/30 bg-success/5 text-success",
                  )}
                >
                  {ins.text}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Liberdade financeira</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/money/goals">Metas</Link></Button>
          </CardHeader>
          <CardContent>
            {goalTarget > 0 ? (
              <>
                <GaugeChart value={goalPct} color="#22c55e" height={150} />
                <p className="text-center text-xs text-muted-foreground">
                  {brl(goalCurrent)} de {brl(goalTarget)}
                </p>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Defina seu "número mágico" em Metas para acompanhar o progresso.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Atalhos ───────────────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { href: "/money/projection", label: "Projeção", icon: LineChart },
          { href: "/money/budget", label: "Orçamento", icon: PiggyBank },
          { href: "/money/bills", label: "Contas", icon: Receipt },
          { href: "/money/goals", label: "Metas", icon: Target },
        ].map((l) => (
          <Link key={l.href} href={l.href}>
            <Card variant="elevated" className="group transition-all hover:border-primary/40">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/80 text-primary">
                  <l.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">{l.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
