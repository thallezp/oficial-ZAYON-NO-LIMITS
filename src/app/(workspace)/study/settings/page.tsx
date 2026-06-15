"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyDashboard, useUpdateStudySettings } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Save, Timer, Shield, Info } from "lucide-react";

export default function StudySettingsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries
  const { data: dashboard, isLoading } = useStudyDashboard(activeWorkspaceId);

  // Mutations
  const updateSettingsMutation = useUpdateStudySettings();

  const [pomodoroWork, setPomodoroWork] = React.useState("25");
  const [pomodoroShortBreak, setPomodoroShortBreak] = React.useState("5");
  const [pomodoroLongBreak, setPomodoroLongBreak] = React.useState("15");
  const [dailyTargetHours, setDailyTargetHours] = React.useState("4");
  const [submitting, setSubmitting] = React.useState(false);

  // Load database settings when ready
  React.useEffect(() => {
    if (dashboard?.settings?.data) {
      const data = dashboard.settings.data as any;
      if (data.pomodoroWork) setPomodoroWork(String(data.pomodoroWork));
      if (data.pomodoroShortBreak) setPomodoroShortBreak(String(data.pomodoroShortBreak));
      if (data.pomodoroLongBreak) setPomodoroLongBreak(String(data.pomodoroLongBreak));
      if (data.dailyTargetHours) setDailyTargetHours(String(data.dailyTargetHours));
    }
  }, [dashboard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) return;

    const work = parseInt(pomodoroWork, 10);
    const short = parseInt(pomodoroShortBreak, 10);
    const long = parseInt(pomodoroLongBreak, 10);
    const target = parseInt(dailyTargetHours, 10);

    if (isNaN(work) || work <= 0 || isNaN(short) || short <= 0 || isNaN(long) || long <= 0 || isNaN(target) || target <= 0) {
      toast.error("Valores configurados devem ser números maiores que 0.");
      return;
    }

    setSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        data: {
          pomodoroWork: work,
          pomodoroShortBreak: short,
          pomodoroLongBreak: long,
          dailyTargetHours: target,
        },
      });
      toast.success("Configurações de estudo atualizadas!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/study">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title="Configurações de Estudo"
          description="Ajuste os blocos do cronômetro de foco e as metas de horas do seu segundo cérebro."
        />
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="border-border/60 bg-card/40">
          <CardHeader className="border-b border-border/40 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Parâmetros do Timer & Foco
            </CardTitle>
            <CardDescription className="text-xs">
              Valores definidos serão aplicados às novas sessões iniciadas no workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="text-center text-xs text-muted-foreground py-6">Carregando configurações...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pomWork">Foco Pomodoro (min)</Label>
                    <Input
                      id="pomWork"
                      type="number"
                      value={pomodoroWork}
                      onChange={(e) => setPomodoroWork(e.target.value)}
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pomShort">Pausa Curta (min)</Label>
                    <Input
                      id="pomShort"
                      type="number"
                      value={pomodoroShortBreak}
                      onChange={(e) => setPomodoroShortBreak(e.target.value)}
                      min={1}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pomLong">Pausa Longa (min)</Label>
                    <Input
                      id="pomLong"
                      type="number"
                      value={pomodoroLongBreak}
                      onChange={(e) => setPomodoroLongBreak(e.target.value)}
                      min={1}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-border/20 pt-4">
                  <Label htmlFor="dailyTarget">Meta de Foco Diário (horas)</Label>
                  <Input
                    id="dailyTarget"
                    type="number"
                    value={dailyTargetHours}
                    onChange={(e) => setDailyTargetHours(e.target.value)}
                    min={1}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" /> Configuração opcional para calibrar seus gráficos de progresso diário.
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/20">
                  <Button type="submit" variant="gradient" disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
