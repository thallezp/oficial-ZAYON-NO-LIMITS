"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEnergy, useUpsertEnergyDailyLog } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LevelPicker } from "@/components/life/level-picker";
import { num, todayISO } from "@/lib/utils/life";
import { Moon } from "lucide-react";
import { toast } from "sonner";

export default function SleepPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const upsert = useUpsertEnergyDailyLog();
  const logs: any[] = data?.dailyLogs ?? [];
  const today = logs.find((l) => l.logDate === todayISO());

  const [sleepHours, setSleepHours] = React.useState("");
  const [sleepQuality, setSleepQuality] = React.useState<number | null>(null);
  const [bedtime, setBedtime] = React.useState("");
  const [wakeTime, setWakeTime] = React.useState("");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (today) {
      setSleepHours(today.sleepHours != null ? String(today.sleepHours) : "");
      setSleepQuality(today.sleepQuality ?? null);
      setBedtime(today.bedtime ?? "");
      setWakeTime(today.wakeTime ?? "");
      setNotes(today.notes ?? "");
    }
  }, [today]);

  const save = async () => {
    if (!ws) return;
    try {
      await upsert.mutateAsync({
        workspaceId: ws,
        logDate: todayISO(),
        sleepHours: sleepHours ? Number(sleepHours) : null,
        sleepQuality,
        bedtime,
        wakeTime,
        notes,
      });
      toast.success("Sono de hoje salvo");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const history = logs.filter((l) => l.sleepHours != null || l.sleepQuality != null).slice(0, 14);
  const avgHours = (() => {
    const vals = history.map((l) => num(l.sleepHours)).filter((v) => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  })();
  const avgQuality = (() => {
    const vals = history.map((l) => num(l.sleepQuality)).filter((v) => v > 0);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sono"
        description="Horas, qualidade e horários de dormir/acordar. O alicerce de toda a sua energia."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Média de horas (14d)" value={avgHours ? `${avgHours}h` : "—"} accent="info" icon={<Moon className="h-4 w-4" />} />
        <StatCard label="Qualidade média (14d)" value={avgQuality || "—"} accent="primary" hint="1–5" />
      </div>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4 text-primary" /> Check-in de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Horas dormidas</label>
              <Input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="7.5" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Qualidade (1–5)</label>
              <LevelPicker value={sleepQuality} onChange={setSleepQuality} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Foi dormir</label>
              <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acordou</label>
              <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Acordou descansado? Sonhos, interrupções..." />
          </div>
          <Button variant="gradient" onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? "Salvando..." : "Salvar check-in"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos registros</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum registro ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    {new Date(l.logDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span><b>{num(l.sleepHours) || "—"}h</b></span>
                    <span>Qualidade: <b>{num(l.sleepQuality) || "—"}</b></span>
                    <span className="text-muted-foreground">
                      {l.bedtime || "—"} → {l.wakeTime || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
