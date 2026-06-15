"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyDashboard, useStudyPlans } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { BarChart } from "@/components/charts/bar-chart";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Brain,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  Trophy,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Star,
  GraduationCap,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function StudyDashboardPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries
  const { data: dashboard, isLoading: loadingDash } = useStudyDashboard(activeWorkspaceId);
  const { data: plans = [] } = useStudyPlans(activeWorkspaceId);

  // Real-time time checking for "Bloco de Agora"
  const [currentTime, setCurrentTime] = React.useState("");
  const [currentDay, setCurrentDay] = React.useState(1);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().slice(0, 5));
      setCurrentDay(now.getDay()); // Sunday = 0, Monday = 1...
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Compute daily hours for the ECharts weekly bar chart
  const weeklyChartData = React.useMemo(() => {
    if (!dashboard?.sessions) return [];
    const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const dailyMinutes = [0, 0, 0, 0, 0, 0, 0];

    // Find start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    dashboard.sessions.forEach((s: any) => {
      if (s.startedAt && s.actualMinutes && s.status === "completed") {
        const d = new Date(s.startedAt);
        if (d >= monday) {
          const diffDays = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 7) {
            dailyMinutes[diffDays] += s.actualMinutes;
          }
        }
      }
    });

    return weekdays.map((label, idx) => ({
      label,
      value: Math.round((dailyMinutes[idx] / 60) * 10) / 10, // hours
    }));
  }, [dashboard]);

  // Real-time Block Resolver (matches local hour/weekday)
  const activeBlock = React.useMemo(() => {
    if (plans.length === 0 || !currentTime) return null;
    const activePlan = plans.find((p: any) => p.active) || plans[0];
    if (!activePlan || !Array.isArray(activePlan.schedule)) return null;

    return activePlan.schedule.find((item: any) => {
      if (!Array.isArray(item.days) || !item.days.includes(currentDay)) return false;
      return currentTime >= item.start && currentTime <= item.end;
    });
  }, [plans, currentTime, currentDay]);

  // "Continue de onde parou" Suggestion
  const suggestion = React.useMemo(() => {
    if (!dashboard?.sessions || dashboard.sessions.length === 0) return null;
    // Find last focus session that is completed and linked to a track or resource
    const lastSession = dashboard.sessions.find(
      (s: any) => s.status === "completed" && (s.trackId || s.resourceId)
    );
    if (!lastSession) return null;

    if (lastSession.trackId) {
      const t = dashboard.tracks?.find((x: any) => x.id === lastSession.trackId);
      return {
        type: "track",
        id: lastSession.trackId,
        name: t?.name || "Trilha Ativa",
        label: "Retomar Trilha de Estudos",
        path: `/study/tracks/${lastSession.trackId}`,
      };
    } else if (lastSession.resourceId) {
      return {
        type: "resource",
        id: lastSession.resourceId,
        name: lastSession.label || "Livro/Curso",
        label: "Retomar Leitura",
        path: `/study/library`,
      };
    }
    return null;
  }, [dashboard]);

  const streak = dashboard?.streak || 0;
  const weeklyHours = dashboard?.weeklyHours || 0;
  const dueReviewsCount = dashboard?.reviews?.length || 0;
  const recentSessions = dashboard?.sessions?.slice(0, 4) || [];
  const activeTracks = dashboard?.tracks?.filter((t: any) => t.status === "active").slice(0, 3) || [];
  const unlockedAchievements = dashboard?.achievements?.slice(0, 3) || [];

  if (loadingDash) {
    return (
      <div className="space-y-6">
        <PageHeader title="Painel de Estudos" description="Acompanhe seu desempenho e estatísticas." />
        <div className="p-12 text-center text-xs text-muted-foreground">Carregando painel de controle...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel de Estudos"
        description="Segundo Cérebro: acompanhe a consistência de sua rotina de foco e conquiste novas marcas."
        actions={
          <div className="flex gap-2">
            <Link href="/study/settings">
              <Button variant="outline" size="sm">
                Configurações
              </Button>
            </Link>
            <Link href="/study/sessions">
              <Button variant="gradient" size="sm">
                <Play className="h-4 w-4 mr-2" /> Iniciar Foco
              </Button>
            </Link>
          </div>
        }
      />

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: Streak e Horas Focadas (Large Metric Widget) */}
        <Card className="border-border/60 bg-card/40 md:col-span-1 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Consistência & Foco
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-around items-center gap-4">
              {/* Streak */}
              <div className="text-center space-y-1">
                <div className="relative inline-flex items-center justify-center p-3 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500">
                  <Flame className="h-8 w-8 animate-pulse" />
                </div>
                <p className="text-2xl font-bold font-mono tracking-tight">{streak}d</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Offensive Streak</p>
              </div>

              {/* Weekly Hours */}
              <div className="text-center space-y-1">
                <div className="relative inline-flex items-center justify-center p-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Clock className="h-8 w-8" />
                </div>
                <p className="text-2xl font-bold font-mono tracking-tight">{weeklyHours}h</p>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Horas na Semana</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Box 2: Gráfico de Foco Semanal */}
        <Card className="border-border/60 bg-card/40 md:col-span-2">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Distribuição de Foco Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <BarChart
              data={weeklyChartData}
              height={160}
              color="hsl(var(--primary))"
              formatter={(v) => `${v}h`}
            />
          </CardContent>
        </Card>

        {/* Box 3: Bloco de Agora & Planner Widget */}
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Bloco de Agora
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between min-h-40">
            {activeBlock ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <Badge variant={activeBlock.trackId ? "success" : "primary"} className="text-[9px] px-1.5 py-0">
                    {activeBlock.trackId ? "Estudos" : "Trabalho"}
                  </Badge>
                  <span className="font-mono text-[10px] text-muted-foreground font-bold">
                    {activeBlock.start} - {activeBlock.end}
                  </span>
                </div>
                <h4 className="font-bold text-base text-foreground leading-tight">{activeBlock.label}</h4>
                <Link href={activeBlock.trackId ? `/study/tracks/${activeBlock.trackId}` : "/projects"}>
                  <Button size="sm" variant="outline" className="w-full text-[10px] h-7 font-bold">
                    Acessar Meta Vincular <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  Nenhum bloco agendado para este horário. Aproveite para iniciar uma sessão livre.
                </p>
                <Link href="/study/planner">
                  <Button size="sm" variant="ghost" className="text-[10px] h-7 text-primary hover:bg-primary/10">
                    Configurar Rotina Fixa
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Box 4: Retomar Estudo Suggestion Widget */}
        <Card className="border-border/60 bg-card/40 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-primary" /> Continue de Onde Parou
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between min-h-40">
            {suggestion ? (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{suggestion.label}</p>
                  <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2">{suggestion.name}</h4>
                </div>
                <Link href={suggestion.path}>
                  <Button size="sm" variant="gradient" className="w-full text-[10px] h-7 font-bold">
                    Retomar Atividades
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Aprender Próximo</p>
                  <h4 className="font-bold text-sm text-foreground leading-snug">Cadastre Trilhas de Estudo</h4>
                </div>
                <Link href="/study/tracks">
                  <Button size="sm" variant="outline" className="w-full text-[10px] h-7 font-bold">
                    Explorar Trilhas
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Box 5: Revisões Pendentes Flashcard Link */}
        <Card className="border-border/60 bg-card/40 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary" /> Próximas Revisões (Card)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-between min-h-40">
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{dueReviewsCount}</p>
                <span className="text-[10px] text-muted-foreground font-semibold">CARDS VENCIDOS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {dueReviewsCount > 0
                  ? "Seus cartões de memória precisam ser revisados hoje para manter sua fixação."
                  : "Excelente! Nenhum cartão pendente. Sua memória está em dia."}
              </p>
            </div>
            <Link href="/study/reviews">
              <Button size="sm" variant="outline" className="w-full text-[10px] h-7 font-bold">
                Acessar Caderno de Revisão
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Box 6: Trilhas de Estudo Ativas */}
        <Card className="border-border/60 bg-card/40 md:col-span-2 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-primary" /> Trilhas de Estudo Ativas
            </CardTitle>
            <Link href="/study/tracks" className="text-[10px] text-primary hover:underline font-semibold uppercase">
              Ver Todas
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 divide-y divide-border/30">
            {activeTracks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground italic">Nenhuma trilha ativa cadastrada.</div>
            ) : (
              activeTracks.map((t: any) => (
                <div key={t.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="space-y-1.5 flex-1 pr-6">
                    <h5 className="font-bold text-xs leading-snug">{t.name}</h5>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={t.progress || 0} className="h-1.5" />
                      </div>
                      <span className="font-mono text-[9px] font-bold text-muted-foreground/80 shrink-0">{t.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs font-bold">{t.hoursDone || 0}h</p>
                    <span className="text-[8px] text-muted-foreground font-semibold uppercase">Feito de {t.hoursTarget || 0}h</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Box 7: Conquistas Recentes */}
        <Card className="border-border/60 bg-card/40 flex flex-col justify-between">
          <CardHeader className="p-4 pb-2 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Conquistas Recentes
            </CardTitle>
            <Link href="/study/achievements" className="text-[10px] text-primary hover:underline font-semibold uppercase">
              Galeria
            </Link>
          </CardHeader>
          <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-center">
            {unlockedAchievements.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <Trophy className="h-6 w-6 text-muted-foreground/30 mx-auto" />
                <p className="text-[10px] text-muted-foreground italic">Nenhuma conquista desbloqueada. Conclua focos para obter.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {unlockedAchievements.map((ac: any) => (
                  <div key={ac.id} className="flex items-center gap-2.5">
                    <div className="p-2 rounded bg-amber-500/10 text-amber-500 text-sm">
                      {ac.icon || "🏆"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate leading-snug">{ac.name}</p>
                      <p className="text-[9px] text-muted-foreground truncate leading-normal">{ac.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Box 8: Histórico de Foco (Recent Sessions List) */}
        <Card className="border-border/60 bg-card/40 md:col-span-3">
          <CardHeader className="p-4 pb-2 border-b border-border/40">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Histórico Recente de Foco
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground italic">Nenhuma sessão registrada recentemente.</div>
            ) : (
              <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                {recentSessions.map((s: any) => (
                  <div key={s.id} className="p-4 flex items-center justify-between text-xs hover:bg-muted/10 transition-colors">
                    <div className="space-y-1.5 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={s.type === "study" ? "primary" : "outline"} className="text-[9px] h-4.5 px-1 py-0">
                          {s.type === "study" ? "Estudo" : "Trabalho"}
                        </Badge>
                        <span className="font-mono text-muted-foreground text-[10px]">
                          {new Date(s.startedAt).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="font-semibold truncate text-foreground">{s.label || (s.type === "study" ? "Sessão de Estudo" : "Sessão de Trabalho")}</p>
                      {s.notes && <p className="text-[10px] text-muted-foreground italic line-clamp-1">"{s.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="font-bold font-mono">{s.actualMinutes}m</p>
                        <span className="text-[9px] capitalize text-muted-foreground/80">{s.technique}</span>
                      </div>
                      {s.focusScore && (
                        <div className="flex items-center text-amber-400 gap-0.5" title={`Foco: ${s.focusScore}/5`}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="text-[10px] font-bold text-foreground">{s.focusScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
