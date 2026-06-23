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
import { PanicMode } from "@/components/life/panic-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Trophy,
  Flame,
  ThumbsUp,
  Trash2,
  Target,
  Plus,
  X,
  Siren,
  Brain,
  Lock,
  CheckCircle2,
} from "lucide-react";
import {
  computeCleanStreak,
  computeBestCleanStreak,
  STREAK_MILESTONES,
  milestoneProgress,
  RECOVERY_BENEFITS,
} from "@/lib/utils/life";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const TRIGGERS = ["Tédio", "Estresse", "Rede social", "Solidão", "Ansiedade", "Madrugada", "Outro"];

const EVENT_META: Record<string, { label: string; variant: "danger" | "success" | "info" }> = {
  relapse: { label: "Recaída", variant: "danger" },
  urge_resisted: { label: "Urgência vencida", variant: "success" },
  clean_checkin: { label: "Check-in limpo", variant: "info" },
};

const DAY_PERIODS = [
  { key: "madrugada", label: "Madrugada", from: 0, to: 5 },
  { key: "manha", label: "Manhã", from: 6, to: 11 },
  { key: "tarde", label: "Tarde", from: 12, to: 17 },
  { key: "noite", label: "Noite", from: 18, to: 23 },
];

const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function PornControlPage() {
  const ws = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data } = useEnergy(ws);
  const logEvent = useLogPornEvent();
  const deleteEvent = useDeletePornEvent();
  const updateSettings = useUpdateEnergySettings();

  const events: any[] = data?.pornEvents ?? [];
  const settingsData = (data?.settings?.data as any) ?? {};
  const goal: number = Number(settingsData.cleanStreakGoal) || 90;
  const reasons: string[] = Array.isArray(settingsData.reasons) ? settingsData.reasons : [];

  // Relógio ao vivo
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const base = computeCleanStreak(events);
  const sinceDate = base.since ? new Date(base.since) : null;
  const totalSec = sinceDate ? Math.max(0, Math.floor((now.getTime() - sinceDate.getTime()) / 1000)) : 0;
  const days = Math.floor(totalSec / 86400);
  const hh = Math.floor((totalSec % 86400) / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;

  const best = Math.max(computeBestCleanStreak(events), days);
  const relapses = events.filter((e) => e.type === "relapse").length;
  const resisted = events.filter((e) => e.type === "urge_resisted").length;
  const resistRate = resisted + relapses > 0 ? Math.round((resisted / (resisted + relapses)) * 100) : 0;
  const mp = milestoneProgress(days);

  // Estados de UI
  const [panicOpen, setPanicOpen] = React.useState(false);
  const [relapseOpen, setRelapseOpen] = React.useState(false);
  const [trigger, setTrigger] = React.useState("");
  const [intensity, setIntensity] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [goalInput, setGoalInput] = React.useState(String(goal));
  const [reasonInput, setReasonInput] = React.useState("");

  React.useEffect(() => setGoalInput(String(goal)), [goal]);

  // Ações
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
      await logEvent.mutateAsync({ workspaceId: ws, type: "relapse", trigger: trigger || null, intensity, notes });
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
      await updateSettings.mutateAsync({ workspaceId: ws, data: { ...settingsData, cleanStreakGoal: next } });
      toast.success("Meta atualizada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar meta");
    }
  };

  const saveReasons = async (next: string[]) => {
    if (!ws) return;
    try {
      await updateSettings.mutateAsync({ workspaceId: ws, data: { ...settingsData, reasons: next } });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    }
  };
  const addReason = async () => {
    const r = reasonInput.trim();
    if (!r) return;
    setReasonInput("");
    await saveReasons([...reasons, r]);
  };
  const removeReason = async (i: number) => saveReasons(reasons.filter((_, idx) => idx !== i));

  // Analytics de gatilhos
  const triggerCounts = React.useMemo(() => {
    const m = new Map<string, number>();
    events.filter((e) => e.type === "relapse" && e.trigger).forEach((e) => m.set(e.trigger, (m.get(e.trigger) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const periodCounts = React.useMemo(() => {
    const counts: Record<string, number> = { madrugada: 0, manha: 0, tarde: 0, noite: 0 };
    events.filter((e) => e.type === "relapse").forEach((e) => {
      const h = new Date(e.occurredAt).getHours();
      const p = DAY_PERIODS.find((x) => h >= x.from && h <= x.to);
      if (p) counts[p.key]++;
    });
    return counts;
  }, [events]);
  const periodMax = Math.max(1, ...Object.values(periodCounts));

  // Calendário do mês
  const calendar = React.useMemo(() => {
    const byDate = new Map<string, Set<string>>();
    events.forEach((e) => {
      const k = localKey(new Date(e.occurredAt));
      if (!byDate.has(k)) byDate.set(k, new Set());
      byDate.get(k)!.add(e.type);
    });
    const y = now.getFullYear();
    const mo = now.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const firstWeekday = new Date(y, mo, 1).getDay();
    const cells: ({ day: number; types: Set<string> } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, types: byDate.get(localKey(new Date(y, mo, d))) ?? new Set() });
    }
    return cells;
  }, [events, now]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Pornografia"
        description="Seu espaço de recuperação: streak ao vivo, modo pânico para urgências, seus porquês, marcos e análise de gatilhos."
        badge={<Badge variant="success" size="lg">{days} dias limpo</Badge>}
      />

      {/* HERO */}
      <Card variant="elevated" className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <p className="text-5xl font-bold tracking-tight text-success">{days}</p>
            <p className="text-sm text-muted-foreground">{days === 1 ? "dia limpo" : "dias limpo"}</p>
            {sinceDate && (
              <p className="mt-1 font-mono text-sm tabular-nums text-foreground/80">
                {String(hh).padStart(2, "0")}h {String(mm).padStart(2, "0")}m {String(ss).padStart(2, "0")}s
              </p>
            )}
          </div>

          <div className="w-full max-w-md space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{mp.prev ? `${mp.prev.emoji} ${mp.prev.label}` : "Início"}</span>
              <span>{mp.next ? `próximo: ${mp.next.label} (${mp.next.days}d)` : "Tudo desbloqueado 👑"}</span>
            </div>
            <Progress value={mp.next ? mp.pct : 100} />
          </div>

          {/* PÂNICO */}
          <Button
            size="xl"
            className="w-full max-w-md bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => setPanicOpen(true)}
          >
            <Siren className="h-5 w-5" /> Estou com vontade — Modo Pânico
          </Button>

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => quickLog("clean_checkin")} disabled={logEvent.isPending}>
              <ThumbsUp className="h-4 w-4" /> Check-in limpo
            </Button>
            <Button variant="outline" onClick={() => quickLog("urge_resisted")} disabled={logEvent.isPending}>
              <Flame className="h-4 w-4" /> Resisti a uma urgência
            </Button>
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setRelapseOpen(true)}>
              Registrar recaída
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Recorde" value={`${best} dias`} accent="warning" icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Urgências vencidas" value={resisted} accent="success" icon={<Flame className="h-4 w-4" />} />
        <StatCard label="Recaídas (total)" value={relapses} accent="danger" />
        <StatCard label="Taxa de resistência" value={`${resistRate}%`} accent="info" hint="urgências vencidas / total" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* PROGRESSO DE RECONEXÃO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4 text-primary" /> Progresso de reconexão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Reset de 90 dias</span>
                <span>{Math.min(100, Math.round((days / 90) * 100))}%</span>
              </div>
              <Progress value={Math.min(100, (days / 90) * 100)} />
            </div>
            <div className="space-y-1.5">
              {RECOVERY_BENEFITS.map((b) => {
                const reached = days >= b.day;
                return (
                  <div key={b.day} className={cn("flex items-start gap-2 text-sm", !reached && "opacity-50")}>
                    {reached ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>
                      <b className="text-xs text-muted-foreground">Dia {b.day}:</b> {b.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* MARCOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning" /> Marcos · {mp.reachedCount}/{STREAK_MILESTONES.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {STREAK_MILESTONES.map((m) => {
                const reached = days >= m.days;
                return (
                  <div
                    key={m.days}
                    className={cn(
                      "flex flex-col items-center gap-0.5 rounded-lg border p-2 text-center",
                      reached ? "border-primary/40 bg-primary/5" : "border-border/40 opacity-60",
                    )}
                  >
                    <span className="text-xl">{reached ? m.emoji : "🔒"}</span>
                    <span className="text-[11px] font-medium leading-tight">{m.label}</span>
                    <span className="text-[10px] text-muted-foreground">{m.days}d</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MEUS PORQUÊS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" /> Meus porquês
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Suas razões para parar. Elas aparecem no Modo Pânico, quando você mais precisa lembrar.
          </p>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r, i) => (
              <span key={i} className="group inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
                {r}
                <button onClick={() => removeReason(i)} className="text-muted-foreground transition hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {reasons.length === 0 && <span className="text-sm text-muted-foreground">Nenhum porquê ainda.</span>}
          </div>
          <div className="flex gap-2">
            <Input
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addReason()}
              placeholder="Ex: minha autoestima, meu relacionamento, meu foco..."
              className="max-w-md"
            />
            <Button variant="outline" onClick={addReason}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* GATILHOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gatilhos & padrões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relapses === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sem recaídas registradas — nada a analisar ainda. 🎉
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gatilhos mais comuns</p>
                  {triggerCounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem gatilho informado nas recaídas.</p>
                  ) : (
                    triggerCounts.map(([t, c]) => (
                      <div key={t} className="flex items-center gap-2 text-sm">
                        <span className="w-28 shrink-0 truncate">{t}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary/40">
                          <div className="h-full rounded-full bg-destructive/70" style={{ width: `${(c / triggerCounts[0][1]) * 100}%` }} />
                        </div>
                        <span className="w-6 text-right text-xs text-muted-foreground">{c}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período do dia</p>
                  <div className="grid grid-cols-4 gap-2">
                    {DAY_PERIODS.map((p) => (
                      <div key={p.key} className="flex flex-col items-center gap-1">
                        <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-secondary/30">
                          <div className="w-full bg-primary/60" style={{ height: `${(periodCounts[p.key] / periodMax) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{p.label}</span>
                        <span className="text-xs font-medium">{periodCounts[p.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* CALENDÁRIO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <span key={i} className="text-[10px] font-medium text-muted-foreground">{d}</span>
              ))}
              {calendar.map((cell, i) => {
                if (!cell) return <span key={i} />;
                const isRelapse = cell.types.has("relapse");
                const isClean = cell.types.has("clean_checkin") || cell.types.has("urge_resisted");
                const isToday = cell.day === now.getDate();
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-xs",
                      isRelapse
                        ? "bg-destructive/20 text-destructive font-semibold"
                        : isClean
                          ? "bg-success/20 text-success font-semibold"
                          : "text-muted-foreground",
                      isToday && "ring-1 ring-primary",
                    )}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success/60" /> limpo/resistiu</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/60" /> recaída</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* META */}
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
              <Input type="number" min={1} value={goalInput} onChange={(e) => setGoalInput(e.target.value)} className="w-28" />
            </div>
            <Button variant="outline" onClick={saveGoal} disabled={updateSettings.isPending}>Salvar meta</Button>
          </div>
        </CardContent>
      </Card>

      {/* HISTÓRICO */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum evento ainda. Use os botões acima para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 40).map((e) => {
                const meta = EVENT_META[e.type] ?? { label: e.type, variant: "info" as const };
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                      <span className="text-muted-foreground">
                        {new Date(e.occurredAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {e.trigger && <span className="text-xs text-muted-foreground">· {e.trigger}</span>}
                    </div>
                    <button onClick={() => deleteEvent.mutate(e.id)} className="text-muted-foreground transition hover:text-destructive" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modo Pânico */}
      <PanicMode
        open={panicOpen}
        onOpenChange={setPanicOpen}
        reasons={reasons}
        onResisted={() => quickLog("urge_resisted")}
        onRelapse={() => setRelapseOpen(true)}
      />

      {/* Dialog de recaída */}
      <Dialog open={relapseOpen} onOpenChange={setRelapseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recaída</DialogTitle>
            <DialogDescription>Sem julgamento. Entender o gatilho é o que te fortalece para a próxima vez.</DialogDescription>
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
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs transition",
                      trigger === t ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intensidade da urgência (1–5)</label>
              <LevelPicker value={intensity} onChange={setIntensity} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notas</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="O que aconteceu, o que aprendeu..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelapseOpen(false)}>Cancelar</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={logRelapse} disabled={logEvent.isPending}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
