"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyAchievements } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Award,
  Sparkles,
  Lock,
  Calendar,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Define preset achievements
interface PresetAchievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold";
  requirement: string;
}

const PRESET_ACHIEVEMENTS: PresetAchievement[] = [
  {
    key: "first_focus_session",
    name: "Primeiro Passo",
    description: "Concluiu sua primeira sessão de foco no timer.",
    icon: "🌱",
    tier: "bronze",
    requirement: "Completar 1 sessão de foco",
  },
  {
    key: "first_review",
    name: "Fixação Ativa",
    description: "Completou sua primeira revisão de flashcard.",
    icon: "🧠",
    tier: "bronze",
    requirement: "Avaliar 1 card no spaced repetition",
  },
  {
    key: "first_book_completed",
    name: "Sabedoria Prática",
    description: "Concluiu seu primeiro livro ou curso na biblioteca.",
    icon: "📖",
    tier: "bronze",
    requirement: "Marcar 1 recurso como 'Concluído'",
  },
  {
    key: "first_goal_achieved",
    name: "Alvo Atingido",
    description: "Bateu sua primeira meta quantitativa.",
    icon: "🎯",
    tier: "bronze",
    requirement: "Atingir 1 meta mensurável",
  },
  {
    key: "focus_10_hours",
    name: "Foco Sólido",
    description: "Logou 10 horas totais de foco no timer.",
    icon: "⚡",
    tier: "silver",
    requirement: "Acumular 10 horas de foco",
  },
  {
    key: "streak_5_days",
    name: "Consistência de Ferro",
    description: "Alcançou um streak de 5 dias seguidos de foco.",
    icon: "🔥",
    tier: "silver",
    requirement: "Streak de 5 dias ativos",
  },
  {
    key: "reviews_50",
    name: "Neurônio de Aço",
    description: "Realizou 50 revisões de flashcards no caderno.",
    icon: "🛡️",
    tier: "silver",
    requirement: "Avaliar 50 cards acumulados",
  },
  {
    key: "completed_5_resources",
    name: "Mente Voraz",
    description: "Concluiu 5 recursos diferentes na biblioteca.",
    icon: "📚",
    tier: "silver",
    requirement: "Marcar 5 recursos como 'Concluído'",
  },
  {
    key: "focus_50_hours",
    name: "Mestre do Deep Work",
    description: "Logou 50 horas totais de foco profundo.",
    icon: "👑",
    tier: "gold",
    requirement: "Acumular 50 horas de foco",
  },
  {
    key: "streak_15_days",
    name: "Indomável",
    description: "Alcançou um streak de 15 dias seguidos de foco.",
    icon: "⚔️",
    tier: "gold",
    requirement: "Streak de 15 dias ativos",
  },
];

export default function StudyAchievementsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries
  const { data: unlockedAchievements = [], isLoading } = useStudyAchievements(activeWorkspaceId);

  // Map presets to user's unlocked achievements
  const mappedAchievements = React.useMemo(() => {
    return PRESET_ACHIEVEMENTS.map((preset) => {
      const dbRecord = unlockedAchievements.find((ua: any) => ua.key === preset.key);
      return {
        ...preset,
        unlocked: !!dbRecord,
        unlockedAt: dbRecord ? new Date(dbRecord.unlockedAt) : null,
      };
    });
  }, [unlockedAchievements]);

  // Compute overall stats
  const totalPresets = PRESET_ACHIEVEMENTS.length;
  const totalUnlocked = mappedAchievements.filter((a) => a.unlocked).length;
  const pctProgress = Math.round((totalUnlocked / totalPresets) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/study">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Galeria de Conquistas"
          description="Sua jornada de autodesenvolvimento gamificada. Desbloqueie medalhas ao estudar e praticar foco."
        />
      </div>

      {/* Progress Card */}
      <Card className="border-border/60 bg-card/40 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-amber-500" /> Progresso da Coleção
            </h3>
            <p className="text-xs text-muted-foreground">
              Você desbloqueou <strong className="text-foreground">{totalUnlocked}</strong> de{" "}
              <strong className="text-foreground">{totalPresets}</strong> conquistas disponíveis.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1">
                <Progress value={pctProgress} className="h-2" />
              </div>
              <span className="font-mono text-xs font-bold text-foreground">{pctProgress}%</span>
            </div>
          </div>
          <div className="flex gap-2.5 shrink-0 justify-around">
            <div className="text-center p-2.5 px-4 bg-muted/20 border border-border/40 rounded-lg min-w-20">
              <p className="text-xl font-bold font-mono text-yellow-500">
                {mappedAchievements.filter(a => a.unlocked && a.tier === "gold").length}
              </p>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase">Ouro</span>
            </div>
            <div className="text-center p-2.5 px-4 bg-muted/20 border border-border/40 rounded-lg min-w-20">
              <p className="text-xl font-bold font-mono text-slate-300">
                {mappedAchievements.filter(a => a.unlocked && a.tier === "silver").length}
              </p>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase">Prata</span>
            </div>
            <div className="text-center p-2.5 px-4 bg-muted/20 border border-border/40 rounded-lg min-w-20">
              <p className="text-xl font-bold font-mono text-amber-600">
                {mappedAchievements.filter(a => a.unlocked && a.tier === "bronze").length}
              </p>
              <span className="text-[9px] text-muted-foreground font-semibold uppercase">Bronze</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-muted-foreground">Carregando conquistas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mappedAchievements.map((ac) => {
            const isGold = ac.tier === "gold";
            const isSilver = ac.tier === "silver";

            return (
              <Card
                key={ac.key}
                className={cn(
                  "border-border/60 transition-all duration-300 relative overflow-hidden flex flex-col justify-between",
                  ac.unlocked
                    ? cn(
                        "bg-card/40 hover:scale-[1.01]",
                        isGold && "border-yellow-500/25 shadow-[0_0_15px_rgba(234,179,8,0.03)]",
                        isSilver && "border-slate-400/25 shadow-[0_0_15px_rgba(148,163,184,0.03)]",
                        !isGold && !isSilver && "border-amber-600/25"
                      )
                    : "bg-muted/10 opacity-55 grayscale border-dashed"
                )}
              >
                {/* Background light glow effect */}
                {ac.unlocked && (
                  <div
                    className={cn(
                      "absolute -top-12 -right-12 h-24 w-24 rounded-full blur-2xl opacity-15",
                      isGold && "bg-yellow-500",
                      isSilver && "bg-slate-400",
                      !isGold && !isSilver && "bg-amber-600"
                    )}
                  />
                )}

                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    {/* Badge Tier */}
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[8px] uppercase font-semibold px-1.5 py-0 border-transparent",
                        isGold && "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
                        isSilver && "bg-slate-400/10 text-slate-300 border-slate-400/20",
                        !isGold && !isSilver && "bg-amber-600/10 text-amber-500 border-amber-600/20"
                      )}
                    >
                      {ac.tier}
                    </Badge>

                    {/* Lock / Unlock Icon */}
                    {!ac.unlocked ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 pt-3">
                    <div
                      className={cn(
                        "text-3xl p-2 bg-muted/20 border border-border/40 rounded-xl flex items-center justify-center shrink-0 h-14 w-14 shadow-sm",
                        ac.unlocked && "animate-pulse"
                      )}
                    >
                      {ac.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold leading-tight">{ac.name}</CardTitle>
                      <CardDescription className="text-[10px] leading-relaxed pt-0.5">
                        {ac.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-4 border-t border-border/20 bg-muted/5 mt-3 flex justify-between items-center text-[10px]">
                  {ac.unlocked ? (
                    <span className="text-success font-semibold flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5" /> Conquistada em{" "}
                      {ac.unlockedAt?.toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                      <Lock className="h-3 w-3" /> Requisito: {ac.requirement}
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
