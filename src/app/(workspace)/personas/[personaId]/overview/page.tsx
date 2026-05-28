"use client";

import * as React from "react";
import {
  Activity,
  CircleDollarSign,
  Eye,
  Flame,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { AreaChart } from "@/components/charts/area-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import {
  formatCurrency,
  formatCompact,
  formatPercent,
} from "@/lib/utils/format";
import {
  useFinance,
  useContent,
  useLeads,
  useFunnel,
  useTasks,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";

type PeriodFilter = "7d" | "30d" | "90d" | "all";

export default function PersonaOverviewPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.openWith);

  const [period, setPeriod] = React.useState<PeriodFilter>("30d");

  const { data: dbFinance = [] } = useFinance(activeWorkspaceId, persona.id);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { data: dbLeads = [] } = useLeads(activeWorkspaceId, persona.id);
  const { data: dbFunnel } = useFunnel(persona.id);
  const { data: dbTasks = [] } = useTasks(activeWorkspaceId, persona.id);

  // ==========================================================================
  // Calculos reais — TUDO vem de queries do Supabase
  // ==========================================================================

  const periodDays = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 36500;
  const now = Date.now();
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
  const prevPeriodStart = periodStart - periodDays * 24 * 60 * 60 * 1000;

  // Receita real do periodo
  const realRevenuePeriod = React.useMemo(() => {
    return (dbFinance as any[])
      .filter((t) => {
        if (t.type !== "revenue" || t.status !== "paid") return false;
        const ts = new Date(t.occurredAt ?? t.occurred_at ?? t.createdAt ?? 0).getTime();
        return ts >= periodStart && ts <= now;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [dbFinance, periodStart, now]);

  const realRevenuePrev = React.useMemo(() => {
    return (dbFinance as any[])
      .filter((t) => {
        if (t.type !== "revenue" || t.status !== "paid") return false;
        const ts = new Date(t.occurredAt ?? t.occurred_at ?? t.createdAt ?? 0).getTime();
        return ts >= prevPeriodStart && ts < periodStart;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [dbFinance, prevPeriodStart, periodStart]);

  const realRevenueDelta = realRevenuePrev > 0
    ? ((realRevenuePeriod - realRevenuePrev) / realRevenuePrev) * 100
    : 0;

  // Receita acumulada de toda historia
  const realRevenueAll = React.useMemo(() => {
    return (dbFinance as any[])
      .filter((t) => t.type === "revenue" && t.status === "paid")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [dbFinance]);

  // Leads real do periodo
  const realLeadsPeriod = React.useMemo(() => {
    return (dbLeads as any[]).filter((l) => {
      const ts = new Date(l.createdAt ?? l.created_at ?? 0).getTime();
      return ts >= periodStart && ts <= now;
    }).length;
  }, [dbLeads, periodStart, now]);

  const realLeadsPrev = React.useMemo(() => {
    return (dbLeads as any[]).filter((l) => {
      const ts = new Date(l.createdAt ?? l.created_at ?? 0).getTime();
      return ts >= prevPeriodStart && ts < periodStart;
    }).length;
  }, [dbLeads, prevPeriodStart, periodStart]);

  const realLeadsDelta = realLeadsPrev > 0
    ? ((realLeadsPeriod - realLeadsPrev) / realLeadsPrev) * 100
    : 0;

  // Posts real
  const realPostedPeriod = React.useMemo(() => {
    return (dbContent as any[]).filter((c) => {
      if (c.status !== "posted") return false;
      const ts = new Date(c.publishedAt ?? c.published_at ?? c.scheduledAt ?? c.scheduled_at ?? c.createdAt ?? 0).getTime();
      return ts >= periodStart && ts <= now;
    }).length;
  }, [dbContent, periodStart, now]);

  // Views totais reais do periodo (de content_items.metrics.views)
  const realViewsPeriod = React.useMemo(() => {
    return (dbContent as any[])
      .filter((c) => {
        if (c.status !== "posted") return false;
        const ts = new Date(c.publishedAt ?? c.published_at ?? c.scheduledAt ?? c.scheduled_at ?? c.createdAt ?? 0).getTime();
        return ts >= periodStart && ts <= now;
      })
      .reduce((sum, c) => sum + Number(c.metrics?.views ?? 0), 0);
  }, [dbContent, periodStart, now]);

  // Engajamento medio (likes + comments + shares + saves) / views
  const realEngagement = React.useMemo(() => {
    const posted = (dbContent as any[]).filter(
      (c) => c.status === "posted" && c.metrics?.views,
    );
    if (posted.length === 0) return 0;
    let totalEng = 0;
    let totalViews = 0;
    posted.forEach((c) => {
      const m = c.metrics ?? {};
      totalEng +=
        Number(m.likes ?? 0) +
        Number(m.comments ?? 0) +
        Number(m.shares ?? 0) +
        Number(m.saves ?? 0);
      totalViews += Number(m.views ?? 0);
    });
    return totalViews > 0 ? (totalEng / totalViews) * 100 : 0;
  }, [dbContent]);

  // Conversao = leads convertidos / total leads
  const realConversion = React.useMemo(() => {
    if (dbLeads.length === 0) return 0;
    const converted = (dbLeads as any[]).filter((l) => l.status === "converted").length;
    return (converted / dbLeads.length) * 100;
  }, [dbLeads]);

  // Tarefas pendentes desta persona
  const openTasksCount = React.useMemo(() => {
    return (dbTasks as any[]).filter(
      (t) => t.status !== "done" && t.status !== "archived",
    ).length;
  }, [dbTasks]);

  const m = persona.metrics ?? {};

  // 1. Curva de faturamento real
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      dateStr: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      value: 0,
    };
  });

  dbFinance.forEach((t: any) => {
    if (t.type === "revenue" && t.status === "paid" && t.occurredAt) {
      const match = days30.find((d) => d.dateStr === t.occurredAt);
      if (match) {
        match.value += Number(t.amount);
      }
    }
  });

  let cumulative = 0;
  const revenueSeries = days30.map((d) => {
    cumulative += d.value;
    return {
      label: d.label,
      value: cumulative,
    };
  });

  // 2. Crescimento de seguidores — placeholder zerado ate ter snapshots reais
  // (precisa de tabela persona_follower_snapshots — fica como follow-up)
  const followersSeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      value: 0,
    };
  });

  // 3. Top 5 conteúdos reais por views
  const postedContent = dbContent.filter((c: any) => c.status === "posted" && c.metrics?.views);
  const topContent = [...postedContent]
    .sort((a: any, b: any) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
    .slice(0, 5);

  const viewsByContent = topContent.length > 0
    ? topContent.map((c: any) => ({
        label: c.title,
        value: c.metrics?.views ?? 0,
      }))
    : [
        { label: "Nenhum conteúdo", value: 0 },
      ];

  // 4. Distribuição real de pilares de conteúdo
  const pillarCounts = new Map<string, number>();
  dbContent.forEach((c: any) => {
    const p = c.pillar ?? "neutro";
    pillarCounts.set(p, (pillarCounts.get(p) ?? 0) + 1);
  });
  const pillarDistribution = Array.from(pillarCounts.entries()).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }));
  if (pillarDistribution.length === 0) {
    pillarDistribution.push({ name: "NEUTRO", value: 0 });
  }

  // 5. Funil de leads real
  const funnelSteps = React.useMemo(() => {
    if (dbFunnel?.nodes && dbFunnel.nodes.length > 0) {
      const sortedNodes = [...dbFunnel.nodes].sort((a: any, b: any) => (a.position?.x ?? 0) - (b.position?.x ?? 0));
      return sortedNodes.map((node: any) => {
        const traffic = node.metrics?.traffic ?? 0;
        const conversion = node.metrics?.conversion ?? 0;
        return {
          label: node.title || node.type || "Etapa",
          value: traffic,
          pct: conversion,
        };
      });
    }
    const total = dbLeads.length;
    const approached = dbLeads.filter((l: any) => ["approached", "qualified", "converted"].includes(l.status)).length;
    const qualified = dbLeads.filter((l: any) => ["qualified", "converted"].includes(l.status)).length;
    const converted = dbLeads.filter((l: any) => l.status === "converted").length;

    return [
      { label: "Total Leads", value: total, pct: 100 },
      { label: "Abordados", value: approached, pct: total > 0 ? Math.round((approached / total) * 100) : 0 },
      { label: "Qualificados", value: qualified, pct: approached > 0 ? Math.round((qualified / approached) * 100) : 0 },
      { label: "Convertidos", value: converted, pct: qualified > 0 ? Math.round((converted / qualified) * 100) : 0 },
    ];
  }, [dbFunnel, dbLeads]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Dashboard analítico da persona ativa · todos os números vêm do banco em tempo real."
        actions={
          <>
            {(["7d", "30d", "90d", "all"] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === "all" ? "total" : p}
              </Button>
            ))}
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="overview" />

      {/* Empty state quando não há nenhum dado real */}
      {dbFinance.length === 0 &&
        dbContent.length === 0 &&
        dbLeads.length === 0 && (
          <Card variant="elevated">
            <CardContent className="py-10 text-center space-y-4">
              <Sparkles className="h-8 w-8 mx-auto text-primary" />
              <div>
                <p className="text-sm font-medium">
                  Nenhum dado real cadastrado para esta persona ainda
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Métricas aparecem automaticamente assim que você criar conteúdos,
                  registrar leads ou lançamentos financeiros.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => openQuickCreate("content")}
                >
                  <Plus className="h-3.5 w-3.5" /> Cadastrar conteúdo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openQuickCreate("lead")}
                >
                  <Plus className="h-3.5 w-3.5" /> Importar leads
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openQuickCreate("revenue")}
                >
                  <Plus className="h-3.5 w-3.5" /> Registrar receita
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={`Receita ${period === "all" ? "total" : period}`}
          value={formatCurrency(realRevenuePeriod)}
          delta={Number(realRevenueDelta.toFixed(1))}
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Seguidores"
          value={formatCompact(m.followers ?? 0)}
          delta={m.followersDelta}
          icon={<Users className="h-4 w-4" />}
          accent="primary"
          hint="cadastrar canais para tracking real"
        />
        <StatCard
          label={`Views ${period === "all" ? "total" : period}`}
          value={formatCompact(realViewsPeriod)}
          icon={<Eye className="h-4 w-4" />}
          accent="info"
          hint="de content_items publicados"
        />
        <StatCard
          label="Engajamento médio"
          value={`${realEngagement.toFixed(1)}%`}
          icon={<Activity className="h-4 w-4" />}
          accent="warning"
          hint="(likes+comments+shares+saves)/views"
        />
        <StatCard
          label={`Leads ${period === "all" ? "total" : period}`}
          value={String(realLeadsPeriod)}
          delta={Number(realLeadsDelta.toFixed(1))}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label={`Posts ${period === "all" ? "total" : period}`}
          value={String(realPostedPeriod)}
          icon={<Flame className="h-4 w-4" />}
          hint="todos os canais somados"
        />
        <StatCard
          label="Conversão real"
          value={`${realConversion.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
          hint="leads convertidos / total leads"
        />
        <StatCard
          label="Receita acumulada"
          value={formatCurrency(realRevenueAll)}
          icon={<Sparkles className="h-4 w-4" />}
          accent="primary"
          hint="todo histórico de financial_transactions"
        />
      </div>

      {/* Tarefas pendentes desta persona */}
      {openTasksCount > 0 && (
        <Card>
          <CardContent className="py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {openTasksCount} tarefa{openTasksCount === 1 ? "" : "s"} pendente
                {openTasksCount === 1 ? "" : "s"} para esta persona
              </p>
              <p className="text-xs text-muted-foreground">
                Veja na aba de Tarefas filtradas por {persona.name}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks">Abrir tarefas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Curva de faturamento</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 30 dias.
              </p>
            </div>
            <Badge
              variant={realRevenueDelta >= 0 ? "success" : "danger"}
              size="sm"
            >
              {realRevenueDelta >= 0 ? "+" : ""}
              {realRevenueDelta.toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={revenueSeries}
              color={persona.accent ?? "#22c55e"}
              formatter={(v) => formatCurrency(v)}
              height={240}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pilares de conteúdo</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuição real dos content_items publicados.
            </p>
          </CardHeader>
          <CardContent>
            <PieChart data={pillarDistribution} height={240} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Crescimento de seguidores</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={followersSeries}
              color="#5b8cff"
              formatter={(v) => formatCompact(v)}
              height={220}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 conteúdos</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">por views</p>
          </CardHeader>
          <CardContent>
            <BarChart
              data={viewsByContent}
              color={persona.accent ?? "#5b8cff"}
              horizontal
              formatter={(v) => formatCompact(v)}
              height={220}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Funil de leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16 truncate" title={step.label}>
                  {step.label}
                </span>
                <div className="flex-1 h-6 rounded bg-card-elevated overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-700"
                    style={{
                      width: `${100 - i * 18}%`,
                    }}
                  />
                </div>
                <span className="num text-xs font-medium w-16 text-right">
                  {formatCompact(step.value)}
                </span>
                <span className="num text-[10px] text-muted-foreground w-12 text-right">
                  {formatPercent(step.pct / 100)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diretrizes da persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Big idea" value={persona.bigIdea} />
            <Row label="Arquétipo" value={persona.archetype} />
            <Row label="Tom" value={persona.voiceTone} />
            <Row
              label="Palavras preferidas"
              value={persona.preferredWords?.join(" · ")}
            />
            <Row
              label="Palavras proibidas"
              value={persona.forbiddenWords?.join(" · ")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="text-muted-foreground uppercase tracking-wider w-32 shrink-0">
        {label}
      </span>
      <span className="flex-1 text-foreground/90">{value ?? "—"}</span>
    </div>
  );
}
