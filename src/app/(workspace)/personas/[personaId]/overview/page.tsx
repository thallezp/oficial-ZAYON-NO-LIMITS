"use client";

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

export default function PersonaOverviewPage() {
  const persona = usePersonaFromRoute();
  const m = persona.metrics ?? {};

  const revenueSeries = Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    value: Math.round(
      ((m.revenuePeriod ?? 50_000) / 30) * (1 + Math.sin(i / 3) * 0.4 + i * 0.04),
    ),
  }));

  const followersSeries = Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    value: Math.round((m.followers ?? 100_000) - (30 - i) * 1100),
  }));

  const viewsByContent = [
    { label: "Reel 003", value: 184_000 },
    { label: "Carrossel", value: 92_000 },
    { label: "Story seq.", value: 54_000 },
    { label: "Reel 002", value: 47_000 },
    { label: "Reel 001", value: 38_000 },
  ];

  const pillarDistribution = persona.pillars?.map((p, i) => ({
    name: p,
    value: 30 - i * 5,
  })) ?? [];

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
            {[
              { label: "Visitas", value: 184_000, pct: 100 },
              { label: "Direct", value: 5_620, pct: 3.0 },
              { label: "WhatsApp", value: 2_140, pct: 38 },
              { label: "Checkout", value: 472, pct: 22 },
              { label: "Pago", value: 132, pct: 28 },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground w-16">
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
