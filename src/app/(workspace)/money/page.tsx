"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  usePersonalFinance,
  useUpsertPersonalFinanceProfile,
  useUpsertPersonalCategory,
  useUpsertPersonalIncomeSource,
  useDeletePersonalIncomeSource,
  useUpsertPeriodLog,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart } from "@/components/charts/pie-chart";
import { GaugeChart } from "@/components/charts/gauge-chart";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PiggyBank,
  Lock,
  LineChart,
  Receipt,
  Target,
  Sparkles,
  AlertTriangle,
  ArrowLeftRight,
  Plus,
  Trash2,
  Pencil,
  Coins,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { brl, num, currentMonthKey } from "@/lib/utils/life";
import {
  PILLARS,
  SPENDING_PILLARS,
  DEFAULT_LIFE_SHARE,
  PILLAR_BY_KEY,
  periodRange,
  inPeriod,
  effectiveCap,
  periodKey,
  shiftPeriod,
  isCurrentPeriod,
  type PillarKey,
  type Period,
  type SpendingCaps,
} from "@/lib/utils/finance";
import { PeriodTabs } from "@/components/life/period-tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

export default function MoneyDashboardPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = usePersonalFinance(ws);
  const upsertProfile = useUpsertPersonalFinanceProfile();
  const upsertCategory = useUpsertPersonalCategory();
  const upsertPeriodLog = useUpsertPeriodLog();

  const categories: any[] = data?.categories ?? [];
  const transactions: any[] = data?.transactions ?? [];
  const goals: any[] = data?.goals ?? [];
  const profile: any = data?.profile ?? null;
  const incomeSources: any[] = data?.incomeSources ?? [];

  const upsertIncomeSource = useUpsertPersonalIncomeSource();
  const deleteIncomeSource = useDeletePersonalIncomeSource();

  // Fontes de Renda Dialog
  const [sourcesOpen, setSourcesOpen] = React.useState(false);
  const [sourceEditing, setSourceEditing] = React.useState<any | null>(null);
  const [sourceName, setSourceName] = React.useState("");
  const [sourceAmount, setSourceAmount] = React.useState("");
  const [sourceRecurrence, setSourceRecurrence] = React.useState("monthly");
  const [sourceStatus, setSourceStatus] = React.useState("active");
  const [sourceNotes, setSourceNotes] = React.useState("");

  const activeSourcesSum = React.useMemo(() => {
    return incomeSources
      .filter((s) => s.status === "active")
      .reduce((a, s) => a + num(s.amount), 0);
  }, [incomeSources]);

  // Estado local da renda e do % (sincroniza com o profile do banco).
  const [income, setIncome] = React.useState(0);
  const [pct, setPct] = React.useState(25);
  React.useEffect(() => {
    if (profile) {
      // Se houver fontes cadastradas, a renda mensal é a soma delas.
      // Senão, é a renda do perfil (manual).
      const finalIncome = incomeSources.length > 0 ? activeSourcesSum : num(profile.monthlyIncome);
      setIncome(finalIncome);
      setPct(num(profile.investPct) || 25);
    }
  }, [profile, incomeSources, activeSourcesSum]);

  const openNewSource = () => {
    setSourceEditing(null);
    setSourceName("");
    setSourceAmount("");
    setSourceRecurrence("monthly");
    setSourceStatus("active");
    setSourceNotes("");
  };

  const openEditSource = (src: any) => {
    setSourceEditing(src);
    setSourceName(src.name);
    setSourceAmount(String(num(src.amount)));
    setSourceRecurrence(src.recurrence || "monthly");
    setSourceStatus(src.status || "active");
    setSourceNotes(src.notes || "");
  };

  const saveSource = async () => {
    if (!ws || !sourceName.trim() || !sourceAmount) return;
    try {
      await upsertIncomeSource.mutateAsync({
        id: sourceEditing?.id,
        workspaceId: ws,
        name: sourceName.trim(),
        amount: Number(sourceAmount),
        recurrence: sourceRecurrence,
        status: sourceStatus,
        notes: sourceNotes.trim() || null,
      });
      // Clear form
      openNewSource();
      toast.success(sourceEditing ? "Fonte de renda atualizada" : "Fonte de renda adicionada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar fonte de renda");
    }
  };

  const removeSource = async (id: string) => {
    try {
      await deleteIncomeSource.mutateAsync(id);
      toast.success("Fonte de renda excluída");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir fonte de renda");
    }
  };

  const month = currentMonthKey();
  const invest = (income * pct) / 100;
  const life = income - invest;

  // ── Controle por período (Dia/Semana/Mês), navegável e persistido ─────────
  const [period, setPeriod] = React.useState<Period>("month");
  const [refDate, setRefDate] = React.useState(() => new Date());
  const [capsOpen, setCapsOpen] = React.useState(false);
  const caps: SpendingCaps = ((profile?.metadata as any)?.caps as SpendingCaps) ?? {};
  const [capDay, setCapDay] = React.useState("");
  const [capWeek, setCapWeek] = React.useState("");
  const [capMonth, setCapMonth] = React.useState("");
  React.useEffect(() => {
    const c = ((profile?.metadata as any)?.caps as SpendingCaps) ?? {};
    setCapDay(c.day != null ? String(c.day) : "");
    setCapWeek(c.week != null ? String(c.week) : "");
    setCapMonth(c.month != null ? String(c.month) : "");
  }, [profile]);

  const range = periodRange(period, refDate);
  const pKey = periodKey(period, range);
  const periodLogs: any[] = data?.periodLogs ?? [];
  const periodLog = periodLogs.find((l) => l.periodType === period && l.periodKey === pKey);

  const periodTx = transactions.filter((t) => inPeriod(t.occurredAt, range));
  const periodIn = periodTx.filter((t) => t.type === "income").reduce((a, t) => a + num(t.amount), 0);
  const periodOut = periodTx.filter((t) => t.type === "expense").reduce((a, t) => a + num(t.amount), 0);
  // Teto específico do período tem prioridade sobre o teto padrão (global).
  const perCap = periodLog?.cap != null ? num(periodLog.cap) : null;
  const periodCap = perCap != null && perCap > 0 ? perCap : effectiveCap(caps, period);
  const capPct = periodCap && periodCap > 0 ? Math.min(100, (periodOut / periodCap) * 100) : 0;
  const overCap = periodCap != null && periodOut > periodCap;

  // Rascunho do controle deste período (teto + nota), sincroniza ao navegar.
  const [capDraft, setCapDraft] = React.useState("");
  const [noteDraft, setNoteDraft] = React.useState("");
  React.useEffect(() => {
    setCapDraft(periodLog?.cap != null ? String(num(periodLog.cap)) : "");
    setNoteDraft(periodLog?.note ?? "");
  }, [periodLog?.id, pKey, period]);

  const savePeriodLog = (patch: Record<string, any>) => {
    if (!ws) return;
    upsertPeriodLog.mutate(
      { workspaceId: ws, periodType: period, periodKey: pKey, ...patch },
      { onSuccess: () => toast.success("Controle do período salvo") },
    );
  };

  const saveCaps = () => {
    if (!ws) return;
    const nextCaps: SpendingCaps = {};
    if (capDay) nextCaps.day = Number(capDay);
    if (capWeek) nextCaps.week = Number(capWeek);
    if (capMonth) nextCaps.month = Number(capMonth);
    upsertProfile.mutate(
      { workspaceId: ws, metadata: { ...((profile?.metadata as any) ?? {}), caps: nextCaps } },
      {
        onSuccess: () => {
          setCapsOpen(false);
          toast.success("Tetos atualizados");
        },
      },
    );
  };

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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-primary" /> Renda mensal
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary hover:text-primary-active flex items-center gap-1 h-fit p-1"
                  onClick={() => setSourcesOpen(true)}
                >
                  <Wallet className="h-3 w-3" /> Gerenciar Fontes ({incomeSources.length})
                </Button>
              </div>

              {incomeSources.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between rounded-lg border border-border/40 bg-muted/20 px-3.5 py-2.5">
                    <span className="font-mono text-2xl font-bold text-foreground">{brl(income)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      Soma das Fontes Ativas
                    </span>
                  </div>
                  {/* Mini-breakdown das fontes */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {incomeSources.map((s) => (
                      <Badge
                        key={s.id}
                        variant={s.status === "active" ? "default" : "outline"}
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          s.status === "inactive" && "opacity-50 line-through"
                        )}
                      >
                        {s.name}: {brl(num(s.amount))}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={income || ""}
                    onChange={(e) => setIncome(Number(e.target.value) || 0)}
                    onBlur={() => num(profile?.monthlyIncome) !== income && saveProfile({ monthlyIncome: income })}
                    placeholder="0,00"
                    className="h-11 text-lg font-semibold"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                    <span>Defina a renda manual ou</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSourcesOpen(true);
                        openNewSource();
                      }}
                      className="text-primary hover:underline font-semibold"
                    >
                      + Cadastrar Fontes de Renda
                    </button>
                  </div>
                </div>
              )}
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

      {/* ── Controle por período (Dia/Semana/Mês) ─────────────────────────── */}
      <Card variant="elevated">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Wallet className="h-4 w-4 text-primary" /> Controle por período
            </h2>
            <div className="flex items-center gap-2">
              <PeriodTabs value={period} onChange={(p) => { setPeriod(p); setRefDate(new Date()); }} />
              <Button variant="outline" size="sm" onClick={() => setCapsOpen(true)}>Tetos padrão</Button>
            </div>
          </div>

          {/* Navegação: mês a mês / semana a semana / dia a dia */}
          <div className="flex items-center justify-between rounded-lg border border-border/40 px-2 py-1.5">
            <Button variant="ghost" size="icon-sm" onClick={() => setRefDate((d) => shiftPeriod(d, period, -1))} aria-label="Período anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-medium capitalize">{range.label}</p>
              {isCurrentPeriod(refDate, period) ? (
                <span className="text-[11px] text-muted-foreground">período atual</span>
              ) : (
                <button onClick={() => setRefDate(new Date())} className="text-[11px] text-primary hover:underline">
                  voltar pra hoje
                </button>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setRefDate((d) => shiftPeriod(d, period, 1))} aria-label="Próximo período">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Entradas</p>
              <p className="num text-lg font-semibold text-success">{brl(periodIn)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Saídas</p>
              <p className="num text-lg font-semibold text-destructive">{brl(periodOut)}</p>
            </div>
            <div className="rounded-lg border border-border/40 p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Saldo</p>
              <p className={cn("num text-lg font-semibold", periodIn - periodOut >= 0 ? "text-foreground" : "text-destructive")}>
                {brl(periodIn - periodOut)}
              </p>
            </div>
          </div>

          {periodCap != null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  Teto do período
                  {overCap && <Badge variant="danger" size="sm">estourou</Badge>}
                </span>
                <span className={cn("num", overCap && "font-semibold text-destructive")}>
                  {brl(periodOut)} / {brl(periodCap)}
                </span>
              </div>
              <Progress value={capPct} />
              <p className="text-[11px] text-muted-foreground">
                {overCap
                  ? `Passou ${brl(periodOut - periodCap)} do teto.`
                  : `${brl(Math.max(0, periodCap - periodOut))} disponíveis neste período.`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum teto definido.{" "}
              <button onClick={() => setCapsOpen(true)} className="text-primary hover:underline">Configurar tetos</button>.
            </p>
          )}

          {/* Controle persistido deste período: teto específico + nota + fechamento */}
          <div className="space-y-2 rounded-lg border border-border/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Controle deste período</span>
              <button
                onClick={() => savePeriodLog({ closed: !periodLog?.closed })}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[11px] font-medium transition",
                  periodLog?.closed ? "border-success bg-success/15 text-success" : "border-border/60 text-muted-foreground hover:bg-accent",
                )}
              >
                {periodLog?.closed ? "✓ Fechado" : "Fechar período"}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-[170px_1fr]">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Teto deste período (R$)</label>
                <Input type="number" step="0.01" value={capDraft} onChange={(e) => setCapDraft(e.target.value)} placeholder="usa o teto padrão" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Nota / fechamento</label>
                <Input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Ex: mês apertado, meta batida..." />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="gradient" size="sm" onClick={() => savePeriodLog({ cap: capDraft, note: noteDraft })} disabled={upsertPeriodLog.isPending}>
                Salvar controle
              </Button>
            </div>
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

      {/* ── Modal de Tetos de Gasto por Período ───────────────────────────── */}
      <Dialog open={capsOpen} onOpenChange={setCapsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Tetos de gasto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Limite de gasto por período. Deixe em branco para ratear o teto mensal automaticamente (ex.: teto diário = mensal ÷ dias do mês).
            </p>
            {[
              { label: "Teto diário", v: capDay, set: setCapDay },
              { label: "Teto semanal", v: capWeek, set: setCapWeek },
              { label: "Teto mensal", v: capMonth, set: setCapMonth },
            ].map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs text-muted-foreground">{f.label} (R$)</label>
                <Input type="number" step="0.01" value={f.v} onChange={(e) => f.set(e.target.value)} placeholder="0,00" />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapsOpen(false)}>Cancelar</Button>
            <Button variant="gradient" onClick={saveCaps} disabled={upsertProfile.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Gerenciamento de Fontes de Renda ────────────────────── */}
      <Dialog open={sourcesOpen} onOpenChange={setSourcesOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" /> Fontes de Renda
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Lista de Fontes Existentes */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fontes Cadastradas
              </h3>
              {incomeSources.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/10 rounded-lg border border-dashed border-border/50">
                  Nenhuma fonte de renda cadastrada.
                </p>
              ) : (
                <div className="space-y-2">
                  {incomeSources.map((s) => (
                    <div
                      key={s.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3 bg-card transition-all",
                        s.status === "inactive" ? "border-border/30 opacity-60" : "border-border/60"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{s.name}</span>
                          <Badge variant={s.status === "active" ? "success" : "outline"} size="sm">
                            {s.status === "active" ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
                          <span>{brl(num(s.amount))}</span>
                          <span>•</span>
                          <span className="capitalize">{s.recurrence === "monthly" ? "Mensal" : s.recurrence === "yearly" ? "Anual" : s.recurrence === "weekly" ? "Semanal" : "Variável"}</span>
                        </div>
                        {s.notes && <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 ml-3">
                        <button
                          onClick={() => openEditSource(s)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeSource(s.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formulário de Adicionar/Editar */}
            <div className="rounded-xl border border-border/60 bg-muted/15 p-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                {sourceEditing ? <Pencil className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5 text-primary" />}
                {sourceEditing ? "Editar Fonte" : "Nova Fonte"}
              </h3>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nome da Fonte</Label>
                  <Input
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    placeholder="Ex: Salário CLT, Dividendos, Prolabore..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Valor esperado</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={sourceAmount}
                      onChange={(e) => setSourceAmount(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Recorrência</Label>
                    <select
                      value={sourceRecurrence}
                      onChange={(e) => setSourceRecurrence(e.target.value)}
                      className="flex h-9 w-full rounded-lg border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="monthly">Mensal</option>
                      <option value="weekly">Semanal</option>
                      <option value="yearly">Anual</option>
                      <option value="variable">Variável</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 items-center pt-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Status:</Label>
                    <div className="flex gap-1">
                      {(["active", "inactive"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSourceStatus(st)}
                          className={cn(
                            "rounded px-2.5 py-1 text-[10px] font-bold uppercase transition",
                            sourceStatus === st
                              ? "bg-primary/15 text-primary border border-primary/30"
                              : "border border-border/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {st === "active" ? "Ativa" : "Inativa"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
                  <Input
                    value={sourceNotes}
                    onChange={(e) => setSourceNotes(e.target.value)}
                    placeholder="Notas adicionais sobre esta fonte..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {sourceEditing && (
                  <Button variant="outline" size="sm" onClick={openNewSource}>
                    Cancelar Edição
                  </Button>
                )}
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={saveSource}
                  disabled={upsertIncomeSource.isPending || !sourceName.trim() || !sourceAmount}
                >
                  {sourceEditing ? "Salvar Alterações" : "Adicionar Fonte"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 col-span-2">
            <Button variant="outline" className="w-full" onClick={() => setSourcesOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
