"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { useStudyStore } from "@/stores/study-store";
import {
  useStudyTracks,
  useProjects,
  useTasks,
  useFocusSessions,
  useStartFocusSession,
  useTickFocusSession,
  useEndFocusSession,
  useLogManualSession,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeFocusSession } from "@/hooks/use-realtime";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionsHeatmap } from "@/components/study/sessions-heatmap";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  StopCircle,
  Timer as TimerIcon,
  Flame,
  Clock,
  Layers,
  GraduationCap,
  Briefcase,
  Star,
  CheckCircle2,
  Trash2,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Web Audio API Chime generator (high-premium tone)
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    // Play dual tone chime
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45); // C6
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {
    console.error("Audio Context failed", e);
  }
};

function FocusSessionsContent() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Load study/work target queries
  const { data: tracks = [] } = useStudyTracks(activeWorkspaceId);
  const { data: projects = [] } = useProjects(activeWorkspaceId);
  const { data: tasks = [] } = useTasks(activeWorkspaceId);
  const { data: sessions = [], isLoading: loadingSessions } = useFocusSessions(activeWorkspaceId);

  // Realtime updates
  useRealtimeFocusSession(activeWorkspaceId ?? undefined);

  // Mutations
  const startSessionMutation = useStartFocusSession();
  const tickSessionMutation = useTickFocusSession();
  const endSessionMutation = useEndFocusSession();
  const logManualMutation = useLogManualSession();

  // Timer Zustand Store
  const store = useStudyStore();

  // Local state for UI configurations
  const [targetType, setTargetType] = React.useState<"study" | "work">("study");
  const [selectedTrackId, setSelectedTrackId] = React.useState<string>("none");
  const [selectedModuleId, setSelectedModuleId] = React.useState<string>("none");
  const [selectedItemId, setSelectedItemId] = React.useState<string>("none");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("none");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string>("none");

  const [timerType, setTimerType] = React.useState<"pomodoro" | "deep_work" | "free">("pomodoro");
  const [label, setLabel] = React.useState("");

  // Live timer tick states
  const [elapsed, setElapsed] = React.useState(0);
  const lastSyncedMinute = React.useRef(0);

  // Modal complete states
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [focusScore, setFocusScore] = React.useState(5);
  const [interruptions, setInterruptions] = React.useState("0");
  const [notes, setNotes] = React.useState("");
  const [submittingComplete, setSubmittingComplete] = React.useState(false);

  // Manual session states (lançar sessão sem cronômetro)
  const [manualDialogOpen, setManualDialogOpen] = React.useState(false);
  const [manualType, setManualType] = React.useState<"study" | "work">("study");
  const [manualTrackId, setManualTrackId] = React.useState<string>("none");
  const [manualModuleId, setManualModuleId] = React.useState<string>("none");
  const [manualItemId, setManualItemId] = React.useState<string>("none");
  const [manualProjectId, setManualProjectId] = React.useState<string>("none");
  const [manualTaskId, setManualTaskId] = React.useState<string>("none");
  const [manualHours, setManualHours] = React.useState("0");
  const [manualMinutes, setManualMinutes] = React.useState("30");
  const [manualDate, setManualDate] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [manualLabel, setManualLabel] = React.useState("");
  const [manualFocusScore, setManualFocusScore] = React.useState(5);
  const [manualNotes, setManualNotes] = React.useState("");
  const [submittingManual, setSubmittingManual] = React.useState(false);

  const manualTrack = React.useMemo(
    () => tracks.find((t: any) => t.id === manualTrackId),
    [tracks, manualTrackId]
  );
  const manualModules = React.useMemo(() => manualTrack?.modules || [], [manualTrack]);
  const manualModule = React.useMemo(
    () => manualModules.find((m: any) => m.id === manualModuleId),
    [manualModules, manualModuleId]
  );
  const manualItems = React.useMemo(() => manualModule?.items || [], [manualModule]);

  // Resolve pre-fill targets from URL params
  React.useEffect(() => {
    const trackIdParam = searchParams.get("trackId");
    const moduleIdParam = searchParams.get("moduleId");
    const itemIdParam = searchParams.get("itemId");

    if (trackIdParam) {
      setTargetType("study");
      setSelectedTrackId(trackIdParam);
      if (moduleIdParam) setSelectedModuleId(moduleIdParam);
      if (itemIdParam) setSelectedItemId(itemIdParam);
    }
  }, [searchParams]);

  // Compute sub-options
  const currentTrack = React.useMemo(
    () => tracks.find((t: any) => t.id === selectedTrackId),
    [tracks, selectedTrackId]
  );
  const modules = React.useMemo(() => currentTrack?.modules || [], [currentTrack]);
  const currentModule = React.useMemo(
    () => modules.find((m: any) => m.id === selectedModuleId),
    [modules, selectedModuleId]
  );
  const items = React.useMemo(() => currentModule?.items || [], [currentModule]);

  // Handle live clock ticking
  React.useEffect(() => {
    if (!store.sessionId) {
      setElapsed(0);
      lastSyncedMinute.current = 0;
      return;
    }

    const interval = setInterval(() => {
      let currentElapsed = store.baseSeconds;
      if (!store.paused && store.startedAt) {
        currentElapsed += Math.floor((Date.now() - store.startedAt) / 1000);
      }
      setElapsed(currentElapsed);

      // Check technique limits
      let limitSeconds = 0;
      if (store.technique === "pomodoro") limitSeconds = 25 * 60;
      else if (store.technique === "deep_work") limitSeconds = 50 * 60;

      if (limitSeconds > 0 && currentElapsed >= limitSeconds) {
        // Complete pomodoro
        clearInterval(interval);
        playChime();
        toast.info("Tempo esgotado! Excelente trabalho. Registre a conclusão.");
        // Auto trigger complete dialog
        setCompleteDialogOpen(true);
      }

      // Checkpoint every 60s (increment database actualMinutes)
      const currentMinute = Math.floor(currentElapsed / 60);
      if (currentMinute > lastSyncedMinute.current && currentMinute > 0) {
        lastSyncedMinute.current = currentMinute;
        tickSessionMutation.mutate({ id: store.sessionId!, actualMinutes: currentMinute });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [store.sessionId, store.startedAt, store.paused, store.baseSeconds, store.technique, tickSessionMutation]);

  const handleStart = async () => {
    if (!activeWorkspaceId) {
      toast.error("Selecione um workspace.");
      return;
    }

    let plannedMin = 0;
    if (timerType === "pomodoro") plannedMin = 25;
    else if (timerType === "deep_work") plannedMin = 50;

    const targetPayload = {
      trackId: targetType === "study" && selectedTrackId !== "none" ? selectedTrackId : undefined,
      moduleId: targetType === "study" && selectedModuleId !== "none" ? selectedModuleId : undefined,
      moduleItemId: targetType === "study" && selectedItemId !== "none" ? selectedItemId : undefined,
      projectId: targetType === "work" && selectedProjectId !== "none" ? selectedProjectId : undefined,
      taskId: targetType === "work" && selectedTaskId !== "none" ? selectedTaskId : undefined,
    };

    try {
      const session = await startSessionMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: activePersonaId || undefined,
        type: targetType === "study" ? "study" : "work",
        plannedMinutes: plannedMin > 0 ? plannedMin : undefined,
        technique: timerType,
        label: label.trim() || undefined,
        ...targetPayload,
      });

      const sessId = (session as any).data?.id || (session as any).id;
      store.start(sessId, targetPayload, timerType);
      toast.success("Timer de foco iniciado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar foco.");
    }
  };

  const handlePause = () => {
    store.pause(elapsed);
    toast.info("Timer pausado.");
  };

  const handleResume = () => {
    store.resume();
    toast.success("Timer retomado!");
  };

  const handleStop = () => {
    setCompleteDialogOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.sessionId) return;

    setSubmittingComplete(true);
    const minutesFocused = Math.max(1, Math.floor(elapsed / 60));

    try {
      await endSessionMutation.mutateAsync({
        id: store.sessionId,
        actualMinutes: minutesFocused,
        interruptions: parseInt(interruptions, 10) || 0,
        focusScore,
        notes: notes.trim() || null,
      });

      toast.success(`Foco de ${minutesFocused} min concluído com sucesso! 🎉`);
      store.stop();
      setCompleteDialogOpen(false);
      // Reset inputs
      setFocusScore(5);
      setInterruptions("0");
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao concluir sessão.");
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleAbandon = () => {
    if (confirm("Deseja realmente abandonar a sessão de foco atual? Nenhum progresso será registrado.")) {
      // End session as abandoned in database
      if (store.sessionId) {
        endSessionMutation.mutate({ id: store.sessionId, actualMinutes: 0 });
      }
      store.stop();
      setCompleteDialogOpen(false);
      toast.error("Sessão abandonada.");
    }
  };

  const resetManualForm = () => {
    setManualType("study");
    setManualTrackId("none");
    setManualModuleId("none");
    setManualItemId("none");
    setManualProjectId("none");
    setManualTaskId("none");
    setManualHours("0");
    setManualMinutes("30");
    setManualDate(new Date().toISOString().slice(0, 16));
    setManualLabel("");
    setManualFocusScore(5);
    setManualNotes("");
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId) {
      toast.error("Selecione um workspace.");
      return;
    }
    const totalMinutes = (parseInt(manualHours, 10) || 0) * 60 + (parseInt(manualMinutes, 10) || 0);
    if (totalMinutes < 1) {
      toast.error("Informe um tempo maior que zero.");
      return;
    }

    setSubmittingManual(true);
    try {
      await logManualMutation.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: activePersonaId || undefined,
        type: manualType,
        trackId: manualType === "study" && manualTrackId !== "none" ? manualTrackId : undefined,
        moduleId: manualType === "study" && manualModuleId !== "none" ? manualModuleId : undefined,
        moduleItemId: manualType === "study" && manualItemId !== "none" ? manualItemId : undefined,
        projectId: manualType === "work" && manualProjectId !== "none" ? manualProjectId : undefined,
        taskId: manualType === "work" && manualTaskId !== "none" ? manualTaskId : undefined,
        label: manualLabel.trim() || undefined,
        actualMinutes: totalMinutes,
        focusScore: manualFocusScore,
        notes: manualNotes.trim() || undefined,
        occurredAt: manualDate ? new Date(manualDate).toISOString() : undefined,
      });

      toast.success(`Sessão de ${totalMinutes} min registrada! 🎉`);
      setManualDialogOpen(false);
      resetManualForm();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar sessão manual.");
    } finally {
      setSubmittingManual(false);
    }
  };

  // Timer format display helpers
  const formatTime = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formatTargetName = (s: any) => {
    if (s.type === "study") {
      const tr = tracks.find((t: any) => t.id === s.trackId);
      return `Estudo: ${tr?.name || "Trilha Desconhecida"}`;
    } else {
      const pr = projects.find((p: any) => p.id === s.projectId);
      const tk = tasks.find((t: any) => t.id === s.taskId);
      return `Trabalho: ${pr?.name || "Projeto"} ${tk ? `> ${tk.title}` : ""}`;
    }
  };

  // Remaining calculation for pomodoro/deepwork countdowns.
  // Quando ocioso, usa a técnica selecionada localmente (timerType) para que o
  // mostrador reflita a escolha (ex.: "Livre" zera o relógio). Quando há sessão
  // ativa, usa a técnica gravada na sessão.
  const activeTechnique = store.sessionId ? store.technique : timerType;
  let targetTotal = 0;
  if (activeTechnique === "pomodoro") targetTotal = 25 * 60;
  else if (activeTechnique === "deep_work") targetTotal = 50 * 60;

  const displayTime = targetTotal > 0 && elapsed <= targetTotal
    ? formatTime(targetTotal - elapsed)
    : formatTime(elapsed);

  const activeProgress = targetTotal > 0 ? Math.min(100, (elapsed / targetTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timer de Foco"
        description="Foque em blocos de estudo ou trabalho profundo. Conecte sessões a trilhas de ensino e tarefas de projetos."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Timer e Setup */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cn(
            "border-border/60 bg-card/40 transition-all overflow-hidden",
            store.sessionId && !store.paused && "shadow-[0_0_20px_rgba(34,197,94,0.1)] border-success/40"
          )}>
            <CardHeader className="border-b border-border/40 bg-muted/10 p-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TimerIcon className={cn("h-4 w-4", store.sessionId && !store.paused && "text-success animate-spin")} />
                {store.sessionId ? (store.paused ? "Sessão Pausada" : "Foco Ativo") : "Configurar Sessão"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center space-y-6">
              {/* Cronômetro */}
              <div className="text-center space-y-2">
                <div className="text-6xl md:text-7xl font-mono font-bold tracking-tight text-foreground select-none">
                  {displayTime}
                </div>
                {store.sessionId && targetTotal > 0 && (
                  <div className="w-64 mx-auto space-y-1">
                    <Progress value={activeProgress} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {Math.round(activeProgress)}% CONCLUÍDO
                    </p>
                  </div>
                )}
                {store.sessionId && store.target && (
                  <Badge variant="outline" className="bg-success/5 text-success border-success/25 max-w-xs truncate px-2 py-0.5">
                    {formatTargetName(sessions.find((x: any) => x.id === store.sessionId) || {
                      type: store.target.trackId ? "study" : "work",
                      trackId: store.target.trackId,
                      projectId: store.target.projectId,
                      taskId: store.target.taskId
                    })}
                  </Badge>
                )}
              </div>

              {/* Controles de Play/Pause */}
              <div className="flex gap-3 justify-center">
                {!store.sessionId ? (
                  <>
                    <Button variant="gradient" size="lg" onClick={handleStart} className="px-8 shadow-glow">
                      <Play className="h-4.5 w-4.5 mr-2" /> Iniciar Foco
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setManualDialogOpen(true)}>
                      <PlusCircle className="h-4.5 w-4.5 mr-2" /> Lançar Sessão
                    </Button>
                  </>
                ) : (
                  <>
                    {store.paused ? (
                      <Button variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent" size="lg" onClick={handleResume}>
                        <Play className="h-4.5 w-4.5 mr-2" /> Continuar
                      </Button>
                    ) : (
                      <Button variant="default" className="bg-amber-500 hover:bg-amber-600 text-white border-transparent" size="lg" onClick={handlePause}>
                        <Pause className="h-4.5 w-4.5 mr-2" /> Pausar
                      </Button>
                    )}
                    <Button variant="destructive" size="lg" onClick={handleStop}>
                      <StopCircle className="h-4.5 w-4.5 mr-2" /> Parar
                    </Button>
                  </>
                )}
              </div>

              {/* Configurações apenas se o timer estiver ocioso */}
              {!store.sessionId && (
                <div className="w-full border-t border-border/40 pt-6 space-y-4">
                  {/* Seletor Estudo vs Trabalho */}
                  <div className="grid grid-cols-2 gap-2 p-0.5 bg-muted/40 rounded-lg border border-border/40">
                    <button
                      onClick={() => setTargetType("study")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                        targetType === "study"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <GraduationCap className="h-4 w-4" /> Estudos
                    </button>
                    <button
                      onClick={() => setTargetType("work")}
                      className={cn(
                        "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                        targetType === "work"
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Briefcase className="h-4 w-4" /> Trabalho
                    </button>
                  </div>

                  {/* Dropdowns Dinâmicos com base na seleção */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {targetType === "study" ? (
                      <>
                        <div className="space-y-1">
                           <Label className="text-xs">Trilha</Label>
                           <Select value={selectedTrackId} onValueChange={(v) => {
                             setSelectedTrackId(v);
                             setSelectedModuleId("none");
                             setSelectedItemId("none");
                           }}>
                             <SelectTrigger className="text-xs">
                               <SelectValue placeholder="Selecione a trilha..." />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="none">Nenhuma Trilha</SelectItem>
                               {tracks.map((t: any) => (
                                 <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Módulo</Label>
                           <Select value={selectedModuleId} onValueChange={(v) => {
                             setSelectedModuleId(v);
                             setSelectedItemId("none");
                           }} disabled={selectedTrackId === "none"}>
                             <SelectTrigger className="text-xs">
                               <SelectValue placeholder="Selecione o módulo..." />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="none">Nenhum Módulo</SelectItem>
                               {modules.map((m: any) => (
                                 <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Submódulo</Label>
                           <Select value={selectedItemId} onValueChange={setSelectedItemId} disabled={selectedModuleId === "none"}>
                             <SelectTrigger className="text-xs">
                               <SelectValue placeholder="Selecione o item..." />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="none">Nenhum Submódulo</SelectItem>
                               {items.map((i: any) => (
                                 <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs">Projeto</Label>
                          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Selecione o projeto..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum Projeto</SelectItem>
                              {projects.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tarefa</Label>
                          <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={selectedProjectId === "none"}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Selecione a tarefa..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma Tarefa</SelectItem>
                              {tasks.filter((t: any) => t.projectId === selectedProjectId).map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Técnica & Rótulo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Técnica</Label>
                      <Select value={timerType} onValueChange={(v: any) => setTimerType(v)}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Estilo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pomodoro">Pomodoro (25/5 min)</SelectItem>
                          <SelectItem value="deep_work">Deep Work (50/10 min)</SelectItem>
                          <SelectItem value="free">Livre (Cronômetro)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs" htmlFor="timerLabel">Rótulo / O que está fazendo?</Label>
                      <Input
                        id="timerLabel"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Ex: Estudando modelagem 3D, Programando login"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico Recente */}
          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sessões Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSessions ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Carregando histórico...</div>
              ) : sessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground italic">Nenhuma sessão registrada.</div>
              ) : (
                <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
                  {sessions.map((s: any) => (
                    <div key={s.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-muted/15 transition-all">
                      <div className="space-y-1 min-w-0 pr-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant={s.type === "study" ? "primary" : "outline"} className="text-[9px] h-4.5">
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
                        <p className="font-semibold truncate">{s.label || formatTargetName(s)}</p>
                        {s.notes && <p className="text-[10px] text-muted-foreground line-clamp-1 italic">"{s.notes}"</p>}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right space-y-0.5">
                          <p className="font-bold font-mono">{s.actualMinutes}m</p>
                          <span className="text-[9px] capitalize text-muted-foreground/80">{s.technique}</span>
                        </div>
                        {s.focusScore && (
                          <div className="flex items-center text-amber-400 gap-0.5" title={`Nota foco: ${s.focusScore}/5`}>
                            <Star className="h-3 w-3 fill-current" />
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

        {/* Lado Direito: Heatmap e Resumos */}
        <div className="space-y-6">
          <SessionsHeatmap sessions={sessions} />

          <Card className="border-border/60 bg-card/40 shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/40">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estatísticas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-border/40 bg-card-elevated/40 rounded-lg text-center space-y-1">
                  <Flame className="h-5 w-5 mx-auto text-orange-500" />
                  <p className="text-xs text-muted-foreground">Foco Total</p>
                  <p className="text-xl font-bold font-mono">
                    {Math.round(sessions.reduce((a: number, s: any) => a + (s.actualMinutes || 0), 0) / 60)}h
                  </p>
                </div>
                <div className="p-3 border border-border/40 bg-card-elevated/40 rounded-lg text-center space-y-1">
                  <CheckCircle2 className="h-5 w-5 mx-auto text-success" />
                  <p className="text-xs text-muted-foreground">Sessões Concluídas</p>
                  <p className="text-xl font-bold font-mono">
                    {sessions.filter((s: any) => s.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Concluir Bloco de Foco</DialogTitle>
            <DialogDescription>
              Avalie seu rendimento e adicione notas para consolidar seus registros.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-2">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground font-semibold">TEMPO TOTAL FOCADO</p>
              <p className="text-3xl font-mono font-bold text-foreground">
                {formatTime(elapsed)} ({Math.max(1, Math.floor(elapsed / 60))} min)
              </p>
            </div>

            <div className="space-y-1">
              <Label>Qualidade do Foco (Nota)</Label>
              <div className="flex items-center gap-1 justify-center py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFocusScore(star)}
                    className="text-amber-400 hover:scale-110 transition"
                  >
                    <Star
                      className="h-7 w-7"
                      fill={focusScore >= star ? "currentColor" : "none"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="interruptions">Interrupções / Distrações</Label>
              <Input
                id="interruptions"
                type="number"
                value={interruptions}
                onChange={(e) => setInterruptions(e.target.value)}
                min={0}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sessionNotes">Anotações / Resumo da Sessão</Label>
              <Textarea
                id="sessionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Concluí a modelagem da malha base. Sem interrupções."
                rows={3}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={handleAbandon} className="text-destructive hover:bg-destructive/10">
                Abandonar
              </Button>
              <div className="flex-1" />
              <Button type="submit" variant="gradient" disabled={submittingComplete}>
                {submittingComplete ? "Concluindo..." : "Salvar e Fechar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Session Dialog (lançar sessão sem cronômetro) */}
      <Dialog open={manualDialogOpen} onOpenChange={(o) => { setManualDialogOpen(o); if (!o) resetManualForm(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lançar Sessão Manual</DialogTitle>
            <DialogDescription>
              Registre uma sessão de estudo ou trabalho que você já fez, sem cronômetro. Informe o tempo livremente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualSubmit} className="space-y-4 pt-2">
            {/* Tipo: Estudos vs Trabalho */}
            <div className="grid grid-cols-2 gap-2 p-0.5 bg-muted/40 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setManualType("study")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                  manualType === "study"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GraduationCap className="h-4 w-4" /> Estudos
              </button>
              <button
                type="button"
                onClick={() => setManualType("work")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                  manualType === "work"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Briefcase className="h-4 w-4" /> Trabalho
              </button>
            </div>

            {/* Alvos dinâmicos */}
            {manualType === "study" ? (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Trilha</Label>
                  <Select value={manualTrackId} onValueChange={(v) => { setManualTrackId(v); setManualModuleId("none"); setManualItemId("none"); }}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione a trilha..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma Trilha</SelectItem>
                      {tracks.map((t: any) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Módulo</Label>
                    <Select value={manualModuleId} onValueChange={(v) => { setManualModuleId(v); setManualItemId("none"); }} disabled={manualTrackId === "none"}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Módulo..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum Módulo</SelectItem>
                        {manualModules.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Submódulo</Label>
                    <Select value={manualItemId} onValueChange={setManualItemId} disabled={manualModuleId === "none"}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Item..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum Submódulo</SelectItem>
                        {manualItems.map((i: any) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Projeto</Label>
                  <Select value={manualProjectId} onValueChange={(v) => { setManualProjectId(v); setManualTaskId("none"); }}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione o projeto..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum Projeto</SelectItem>
                      {projects.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tarefa</Label>
                  <Select value={manualTaskId} onValueChange={setManualTaskId} disabled={manualProjectId === "none"}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Selecione a tarefa..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma Tarefa</SelectItem>
                      {tasks.filter((t: any) => t.projectId === manualProjectId).map((t: any) => (<SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Tempo manual (horas + minutos) */}
            <div className="space-y-1">
              <Label className="text-xs">Tempo Focado</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} value={manualHours} onChange={(e) => setManualHours(e.target.value)} className="text-sm" />
                  <span className="text-xs text-muted-foreground">horas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} max={59} value={manualMinutes} onChange={(e) => setManualMinutes(e.target.value)} className="text-sm" />
                  <span className="text-xs text-muted-foreground">min</span>
                </div>
              </div>
            </div>

            {/* Data/hora da sessão */}
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="manualDate">Quando foi?</Label>
              <Input id="manualDate" type="datetime-local" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="text-sm" />
            </div>

            {/* Rótulo */}
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="manualLabel">Rótulo / O que você fez?</Label>
              <Input id="manualLabel" value={manualLabel} onChange={(e) => setManualLabel(e.target.value)} placeholder="Ex: Revisei anatomia, Programei o login" className="text-sm" />
            </div>

            {/* Nota de foco */}
            <div className="space-y-1">
              <Label className="text-xs">Qualidade do Foco (Nota)</Label>
              <div className="flex items-center gap-1 justify-center py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setManualFocusScore(star)} className="text-amber-400 hover:scale-110 transition">
                    <Star className="h-6 w-6" fill={manualFocusScore >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-1">
              <Label className="text-xs" htmlFor="manualNotes">Anotações</Label>
              <Textarea id="manualNotes" value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} placeholder="Resumo do que foi feito (opcional)" rows={2} />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => { setManualDialogOpen(false); resetManualForm(); }}>
                Cancelar
              </Button>
              <div className="flex-1" />
              <Button type="submit" variant="gradient" disabled={submittingManual}>
                {submittingManual ? "Registrando..." : "Registrar Sessão"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FocusSessionsPage() {
  return (
    <React.Suspense fallback={<div className="p-6 text-center text-xs text-muted-foreground">Carregando painel de foco...</div>}>
      <FocusSessionsContent />
    </React.Suspense>
  );
}
