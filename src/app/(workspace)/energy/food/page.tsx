"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEnergy, useUpsertEnergyDailyLog } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LevelPicker } from "@/components/life/level-picker";
import { cn } from "@/lib/utils/cn";
import { num, todayISO } from "@/lib/utils/life";
import { Utensils, Droplets } from "lucide-react";
import { toast } from "sonner";

export default function FoodPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const upsert = useUpsertEnergyDailyLog();
  const logs: any[] = data?.dailyLogs ?? [];
  const today = logs.find((l) => l.logDate === todayISO());

  const [dietQuality, setDietQuality] = React.useState<number | null>(null);
  const [waterMl, setWaterMl] = React.useState("");
  const [meals, setMeals] = React.useState("");
  const [fasting, setFasting] = React.useState<boolean | null>(null);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (today) {
      setDietQuality(today.dietQuality ?? null);
      setWaterMl(today.waterMl != null ? String(today.waterMl) : "");
      setMeals(today.meals != null ? String(today.meals) : "");
      setFasting(today.fasting ?? null);
      setNotes(today.notes ?? "");
    }
  }, [today]);

  const save = async () => {
    if (!ws) return;
    try {
      await upsert.mutateAsync({
        workspaceId: ws,
        logDate: todayISO(),
        dietQuality,
        waterMl: waterMl ? Number(waterMl) : null,
        meals: meals ? Number(meals) : null,
        fasting,
        notes,
      });
      toast.success("Alimentação de hoje salva");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const history = logs.filter((l) => l.dietQuality != null || l.waterMl != null).slice(0, 14);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alimentação"
        description="Qualidade da dieta, hidratação e jejum. Pequenos ajustes diários, grande impacto na energia."
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Utensils className="h-4 w-4 text-primary" /> Check-in de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Qualidade da dieta (1–5)
            </label>
            <LevelPicker value={dietQuality} onChange={setDietQuality} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Droplets className="h-3.5 w-3.5" /> Água (ml)
              </label>
              <Input type="number" min={0} step={100} value={waterMl} onChange={(e) => setWaterMl(e.target.value)} placeholder="2000" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Refeições
              </label>
              <Input type="number" min={0} value={meals} onChange={(e) => setMeals(e.target.value)} placeholder="3" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fez jejum hoje?
            </label>
            <div className="flex gap-2">
              {[
                { v: true, label: "Sim" },
                { v: false, label: "Não" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setFasting(o.v)}
                  className={cn(
                    "h-9 rounded-lg border px-4 text-sm font-medium transition",
                    fasting === o.v
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 text-muted-foreground hover:bg-accent",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="O que comeu, como se sentiu..." />
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
                    <span>Dieta: <b>{num(l.dietQuality) || "—"}</b></span>
                    <span>Água: <b>{num(l.waterMl) || "—"}ml</b></span>
                    <span className={l.fasting ? "text-success" : "text-muted-foreground"}>
                      {l.fasting === true ? "Jejum" : l.fasting === false ? "Sem jejum" : "—"}
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
