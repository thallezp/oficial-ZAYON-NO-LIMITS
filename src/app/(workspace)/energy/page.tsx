"use client";

import * as React from "react";
import Link from "next/link";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEnergy } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, ShieldCheck, Utensils, Moon, Zap, ChevronRight } from "lucide-react";
import { computeCleanStreak, num, todayISO } from "@/lib/utils/life";

const links = [
  { href: "/energy/sexual", label: "Energia Sexual", desc: "Retenção, libido e energia percebida", icon: HeartPulse },
  { href: "/energy/porn-control", label: "Controle de Pornografia", desc: "Contador de dias limpo e gatilhos", icon: ShieldCheck },
  { href: "/energy/food", label: "Alimentação", desc: "Qualidade da dieta, água e jejum", icon: Utensils },
  { href: "/energy/sleep", label: "Sono", desc: "Horas, qualidade e horários", icon: Moon },
];

export default function EnergyDashboardPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const logs: any[] = data?.dailyLogs ?? [];
  const events: any[] = data?.pornEvents ?? [];

  const today = logs.find((l) => l.logDate === todayISO());
  const streak = computeCleanStreak(events);
  const last7 = logs.slice(0, 7);

  const avg = (key: string) => {
    const vals = last7.map((l) => num(l[key])).filter((v) => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Energia"
        description="Seu painel de energia vital: energia sexual, controle de pornografia, alimentação e sono. Faça o check-in diário e acompanhe seus streaks."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dias limpo" value={streak.days} accent="success" icon={<ShieldCheck className="h-4 w-4" />} hint="sem pornografia" />
        <StatCard label="Energia hoje" value={today?.energyLevel ?? today?.sexualEnergy ?? "—"} accent="primary" icon={<Zap className="h-4 w-4" />} hint="check-in do dia" />
        <StatCard label="Sono médio (7d)" value={avg("sleepHours") ? `${avg("sleepHours")}h` : "—"} accent="info" icon={<Moon className="h-4 w-4" />} />
        <StatCard label="Dieta média (7d)" value={avg("dietQuality") || "—"} accent="warning" icon={<Utensils className="h-4 w-4" />} hint="qualidade 1–5" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card variant="elevated" className="group transition-all hover:border-primary/40">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 bg-card/80 text-primary">
                  <l.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{l.label}</h3>
                  <p className="truncate text-xs text-muted-foreground">{l.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
