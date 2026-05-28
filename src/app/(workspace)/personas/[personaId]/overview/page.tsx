"use client";

import * as React from "react";
import {
  Activity,
  CircleDollarSign,
  Eye,
  Flame,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
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
import { useFinance, useContent, useLeads, useFunnel } from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";

export default function PersonaOverviewPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  const { data: dbFinance = [] } = useFinance(activeWorkspaceId, persona.id);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { data: dbLeads = [] } = useLeads(activeWorkspaceId, persona.id);
  const { data: dbFunnel } = useFunnel(persona.id);

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

  // 2. Crescimento de seguidores realistas
  const totalFollowers = m.followers ?? 0;
  const followersSeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const val = Math.round(totalFollowers * (1 - (29 - i) * 0.002));
    return {
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      value: val,
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
        description="Dashboard analítico da persona ativa · receita, alcance, leads, performance."
        actions={
          <>
            <Button variant="outline" size="sm">7d</Button>
            <Button variant="default" size="sm">30d</Button>
            <Button variant="outline" size="sm">90d</Button>
            <Button variant="outline" size="sm">total</Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Receita 30d"
          value={formatCurrency(m.revenuePeriod ?? 0)}
          delta={m.revenueDelta}
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Seguidores"
          value={formatCompact(m.followers ?? 0)}
          delta={m.followersDelta}
          icon={<Users className="h-4 w-4" />}
          accent="primary"
        />
        <StatCard
          label="Views 30d"
          value={formatCompact(m.views ?? 0)}
          delta={m.viewsDelta}
          icon={<Eye className="h-4 w-4" />}
          accent="info"
        />
        <StatCard
          label="Engajamento"
          value={`${m.engagement?.toFixed(1) ?? "0.0"}%`}
          delta={m.engagementDelta}
          icon={<Activity className="h-4 w-4" />}
          accent="warning"
        />
        <StatCard
          label="Leads captados"
          value={String(m.leads ?? 0)}
          delta={m.leadsDelta}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Posts publicados"
          value={String(m.posts ?? 0)}
          icon={<Flame className="h-4 w-4" />}
          hint="contando todos os canais"
        />
        <StatCard
          label="Conversão"
          value={`${m.conversion?.toFixed(1) ?? "0.0"}%`}
          delta={m.conversionDelta}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Receita acumulada"
          value={formatCurrency(m.revenue ?? 0)}
          icon={<Sparkles className="h-4 w-4" />}
          accent="primary"
          hint="histórico total"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Curva de faturamento</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Últimos 30 dias.
              </p>
            </div>
            <Badge variant="success" size="sm">
              +{m.revenueDelta?.toFixed(1) ?? "0"}%
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
              Distribuição da semana
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
