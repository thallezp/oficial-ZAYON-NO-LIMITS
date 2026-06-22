"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useEnergy, useUpsertEnergyDailyLog } from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LevelPicker } from "@/components/life/level-picker";
import { cn } from "@/lib/utils/cn";
import { num, todayISO } from "@/lib/utils/life";
import { HeartPulse } from "lucide-react";
import { toast } from "sonner";

export default function SexualEnergyPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const upsert = useUpsertEnergyDailyLog();
  const logs: any[] = data?.dailyLogs ?? [];
  const today = logs.find((l) => l.logDate === todayISO());

  const [sexualEnergy, setSexualEnergy] = React.useState<number | null>(null);
  const [libido, setLibido] = React.useState<number | null>(null);
  const [retained, setRetained] = React.useState<boolean | null>(null);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (today) {
      setSexualEnergy(today.sexualEnergy ?? null);
      setLibido(today.libido ?? null);
      setRetained(today.retained ?? null);
      setNotes(today.notes ?? "");
    }
  }, [today]);

  const save = async () => {
    if (!ws) return;
    try {
      await upsert.mutateAsync({
        workspaceId: ws,
        logDate: todayISO(),
        sexualEnergy,
        libido,
        retained,
        notes,
      });
      toast.success("Check-in de energia sexual salvo");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };

  const history = logs.filter((l) => l.sexualEnergy != null || l.retained != null).slice(0, 14);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Energia Sexual"
        description="Retenção, libido e energia percebida. Faça o check-in diário para acompanhar a relação entre retenção e sua energia."
      />

      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HeartPulse className="h-4 w-4 text-primary" /> Check-in de hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Energia percebida (1–5)
            </label>
            <LevelPicker value={sexualEnergy} onChange={setSexualEnergy} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Libido (1–5)
            </label>
            <LevelPicker value={libido} onChange={setLibido} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Manteve retenção hoje?
            </label>
            <div className="flex gap-2">
              {[
                { v: true, label: "Sim" },
                { v: false, label: "Não" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setRetained(o.v)}
                  className={cn(
                    "h-9 rounded-lg border px-4 text-sm font-medium transition",
                    retained === o.v
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
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notas
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como você se sentiu, gatilhos, observações..."
              rows={3}
            />
          </div>
          <Button variant="gradient" onClick={save} disabled={upsert.isPending}>
            {upsert.isPending ? "Salvando..." : "Salvar check-in"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 14 registros</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum registro ainda. Faça seu primeiro check-in acima.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">
                    {new Date(l.logDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span>Energia: <b>{num(l.sexualEnergy) || "—"}</b></span>
                    <span>Libido: <b>{num(l.libido) || "—"}</b></span>
                    <span className={l.retained ? "text-success" : "text-muted-foreground"}>
                      {l.retained === true ? "Reteve" : l.retained === false ? "Não" : "—"}
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
