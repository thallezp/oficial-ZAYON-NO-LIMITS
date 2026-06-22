"use client";

import * as React from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useEnergy,
  useLogPornEvent,
  useDeletePornEvent,
  useUpdateEnergySettings,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { LevelPicker } from "@/components/life/level-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Trophy, Flame, ThumbsUp, Trash2, Target } from "lucide-react";
import { computeCleanStreak, computeBestCleanStreak } from "@/lib/utils/life";
import { toast } from "sonner";

const TRIGGERS = ["Tédio", "Estresse", "Rede social", "Solidão", "Ansiedade", "Madrugada", "Outro"];

const EVENT_META: Record<string, { label: string; variant: "danger" | "success" | "info" }> = {
  relapse: { label: "Recaída", variant: "danger" },
  urge_resisted: { label: "Urgência vencida", variant: "success" },
  clean_checkin: { label: "Check-in limpo", variant: "info" },
};

export default function PornControlPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const logEvent = useLogPornEvent();
  const deleteEvent = useDeletePornEvent();
  const updateSettings = useUpdateEnergySettings();

  const events: any[] = data?.pornEvents ?? [];
  const settings = (data?.settings?.data as any) ?? {};
  const goal: number = Number(settings.cleanStreakGoal) || 90;

  const streak = computeCleanStreak(events);
  const best = computeBestCleanStreak(events);
  const relapses = events.filter((e) => e.type === "relapse").length;
  const resisted = events.filter((e) => e.type === "urge_resisted").length;

  const [relapseOpen, setRelapseOpen] = React.useState(false);
  const [trigger, setTrigger] = React.useState<string>("");
  const [intensity, setIntensity] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [goalInput, setGoalInput] = React.useState(String(goal));

  React.useEffect(() => setGoalInput(String(goal)), [goal]);

  const quickLog = async (type: "urge_resisted" | "clean_checkin") => {
    if (!ws) return;
    try {
      await logEvent.mutateAsync({ workspaceId: ws, type });
      toast.success(type === "urge_resisted" ? "Urgência vencida registrada 💪" : "Check-in limpo de hoje ✅");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    }
  };

  const logRelapse = async () => {
    if (!ws) return;
    try {
      await logEvent.mutateAsync({
        workspaceId: ws,
        type: "relapse",
        trigger: trigger || null,
        intensity,
        notes,
      });
      setRelapseOpen(false);
      setTrigger("");
      setIntensity(null);
      setNotes("");
      toast.success("Recaída registrada. O contador recomeça — siga em frente.");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar");
    }
  };

  const saveGoal = async () => {
    if (!ws) return;
    const next = Math.max(1, Number(goalInput) || 90);
    try {
      await updateSettings.mutateAsync({ workspaceId: ws, data: { ...settings, cleanStreakGoal: next } });
      toast.success("Meta atualizada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar meta");
    }
  };

  const progress = Math.min(100, Math.round((streak.days / goal) * 100));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Pornografia"
        description="Seu espaço dedicado para vencer a pornografia. Registre urgências vencidas, recaídas e gatilhos — e veja seu streak crescer."
        badge={<Badge variant="success" size="lg">{streak.days} dias limpo</Badge>}
      />

      {/* Hero streak */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <p className="text-5xl font-bold tracking-tight text-success">{streak.days}</p>
            <p className="text-sm text-muted-foreground">
              {streak.days === 1 ? "dia limpo" : "dias limpo"}
              {streak.since && ` · desde ${new Date(streak.since).toLocaleDateString("pt-BR")}`}
            </p>
          </div>
          <div className="w-full max-w-md space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Meta: {goal} dias</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="outline" onClick={() => quickLog("clean_checkin")} disabled={logEvent.isPending}>
              <ThumbsUp className="h-4 w-4" /> Check-in limpo
            </Button>
            <Button variant="gradient" onClick={() => quickLog("urge_resisted")} disabled={logEvent.isPending}>
              <Flame className="h-4 w-4" /> Resisti a uma urgência
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => setRelapseOpen(true)}
            >
              Registrar recaída
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recorde" value={`${best} dias`} accent="warning" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Urgências vencidas" value={resisted} accent="success" icon={<Flame className="h-4 w-4" />} />
        <StatCard label="Recaídas (total)" value={relapses} accent="danger" />
        <StatCard label="Eventos registrados" value={events.length} accent="info" />
      </div>

      {/* Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Meta de dias limpo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Dias</label>
              <Input
                type="number"
                min={1}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-28"
              />
            </div>
            <Button variant="outline" onClick={saveGoal} disabled={updateSettings.isPending}>
              Salvar meta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum evento ainda. Use os botões acima para começar a registrar.
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 40).map((e) => {
                const meta = EVENT_META[e.type] ?? { label: e.type, variant: "info" as const };
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                      <span className="text-muted-foreground">
                        {new Date(e.occurredAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {e.trigger && <span className="text-xs text-muted-foreground">· {e.trigger}</span>}
                    </div>
                    <button
                      onClick={() => deleteEvent.mutate(e.id)}
                      className="text-muted-foreground transition hover:text-destructive"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de recaída */}
      <Dialog open={relapseOpen} onOpenChange={setRelapseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recaída</DialogTitle>
            <DialogDescription>
              Sem julgamento. Entender o gatilho é o que te fortalece para a próxima vez.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gatilho</label>
              <div className="flex flex-wrap gap-1.5">
                {TRIGGERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrigger(t)}
                    className={`rounded-md border px-2.5 py-1 text-xs transition ${
                      trigger === t
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Intensidade da urgência (1–5)
              </label>
              <LevelPicker value={intensity} onChange={setIntensity} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="O que aconteceu, o que aprendeu..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelapseOpen(false)}>Cancelar</Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={logRelapse}
              disabled={logEvent.isPending}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
