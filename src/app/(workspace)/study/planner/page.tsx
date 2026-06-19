"use client";

import * as React from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useStudyPlans,
  useUpsertPlan,
  useDeletePlan,
  useStudyTracks,
  useProjects,
  useStudyObjectives,
  useUpsertObjective,
  useDeleteObjective,
  useStudyGoals,
  useUpsertGoal,
  useDeleteGoal,
} from "@/hooks/use-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UpsertObjectiveDialog } from "@/components/study/upsert-objective-dialog";
import { UpsertGoalDialog } from "@/components/study/upsert-goal-dialog";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit,
  Target,
  Trophy,
  CheckSquare,
  Square,
  Sparkles,
  TrendingUp,
  PlusCircle,
  Briefcase,
  GraduationCap,
  Milestone,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function StudyPlannerPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Queries
  const { data: plans = [], isLoading: loadingPlans } = useStudyPlans(activeWorkspaceId);
  const { data: tracks = [] } = useStudyTracks(activeWorkspaceId);
  const { data: projects = [] } = useProjects(activeWorkspaceId);
  const { data: objectives = [], isLoading: loadingObjectives } = useStudyObjectives(activeWorkspaceId);
  const { data: goals = [], isLoading: loadingGoals } = useStudyGoals(activeWorkspaceId);

  // Mutations
  const upsertPlanMutation = useUpsertPlan();
  const deletePlanMutation = useDeletePlan();
  const upsertObjectiveMutation = useUpsertObjective();
  const deleteObjectiveMutation = useDeleteObjective();
  const upsertGoalMutation = useUpsertGoal();
  const deleteGoalMutation = useDeleteGoal();

  // Active Plan Selector
  const activePlan = React.useMemo(() => {
    return plans.find((p: any) => p.active) || plans[0] || null;
  }, [plans]);

  // Dialog states for block editing
  const [blockDialogOpen, setBlockDialogOpen] = React.useState(false);
  const [editingBlockIdx, setEditingBlockIdx] = React.useState<number | null>(null);
  const [blockLabel, setBlockLabel] = React.useState("");
  const [blockDays, setBlockDays] = React.useState<number[]>([]);
  const [blockStart, setBlockStart] = React.useState("09:00");
  const [blockEnd, setBlockEnd] = React.useState("10:00");
  const [blockType, setBlockType] = React.useState<"study" | "work">("study");
  const [blockTrackId, setBlockTrackId] = React.useState("none");
  const [blockProjectId, setBlockProjectId] = React.useState("none");

  // Objective & Goal Dialog states
  const [objectiveDialogOpen, setObjectiveDialogOpen] = React.useState(false);
  const [selectedObjective, setSelectedObjective] = React.useState<any | null>(null);
  const [goalDialogOpen, setGoalDialogOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<any | null>(null);

  // Auto-cria o plano inicial se não existir — UMA única vez por workspace.
  // Trava por ref evita a corrida que inseria centenas de planos: o mutate é
  // assíncrono e `plans` continua vazio até o refetch, então sem essa guarda o
  // effect disparava de novo a cada render. Não dependemos de upsertPlanMutation
  // (cuja identidade muda a cada render) de propósito.
  const creatingPlanRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (loadingPlans || !activeWorkspaceId || plans.length > 0) return;
    if (creatingPlanRef.current === activeWorkspaceId) return;
    creatingPlanRef.current = activeWorkspaceId;
    upsertPlanMutation.mutate(
      {
        workspaceId: activeWorkspaceId,
        name: "Rotina Principal",
        kind: "study",
        schedule: [],
        active: true,
      },
      {
        // Se falhar, libera pra permitir nova tentativa.
        onError: () => {
          creatingPlanRef.current = null;
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length, loadingPlans, activeWorkspaceId]);

  // Map schedule blocks to FullCalendar events
  const calendarEvents = React.useMemo(() => {
    if (!activePlan || !Array.isArray(activePlan.schedule)) return [];
    return activePlan.schedule.map((item: any, idx: number) => {
      const isStudy = item.trackId ? true : !item.projectId;
      return {
        id: String(idx),
        title: item.label || (isStudy ? "Foco Estudos" : "Foco Trabalho"),
        daysOfWeek: item.days, // [1, 2...]
        startTime: item.start, // "HH:MM"
        endTime: item.end,
        color: isStudy ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)",
        borderColor: isStudy ? "hsl(var(--success))" : "hsl(var(--primary))",
        textColor: "hsl(var(--foreground))",
        extendedProps: {
          trackId: item.trackId || null,
          projectId: item.projectId || null,
          isStudy,
        },
      };
    });
  }, [activePlan]);

  // Handle slot drag selection on calendar
  const handleRangeSelect = (start: Date, end: Date) => {
    const startStr = start.toTimeString().slice(0, 5);
    const endStr = end.toTimeString().slice(0, 5);
    const day = start.getDay(); // Sunday = 0, Monday = 1...

    setEditingBlockIdx(null);
    setBlockLabel("");
    setBlockDays([day]);
    setBlockStart(startStr);
    setBlockEnd(endStr);
    setBlockType("study");
    setBlockTrackId("none");
    setBlockProjectId("none");
    setBlockDialogOpen(true);
  };

  // Handle clicking on an event
  const handleEventClick = (eventId: string) => {
    if (!activePlan || !Array.isArray(activePlan.schedule)) return;
    const idx = parseInt(eventId, 10);
    const item = activePlan.schedule[idx];
    if (!item) return;

    setEditingBlockIdx(idx);
    setBlockLabel(item.label || "");
    setBlockDays(item.days || []);
    setBlockStart(item.start || "09:00");
    setBlockEnd(item.end || "10:00");
    setBlockType(item.projectId ? "work" : "study");
    setBlockTrackId(item.trackId || "none");
    setBlockProjectId(item.projectId || "none");
    setBlockDialogOpen(true);
  };

  // Save Block creation/modification
  const handleSaveBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !activeWorkspaceId) return;

    const newBlock = {
      label: blockLabel.trim() || (blockType === "study" ? "Estudo" : "Trabalho"),
      days: blockDays,
      start: blockStart,
      end: blockEnd,
      trackId: blockType === "study" && blockTrackId !== "none" ? blockTrackId : null,
      projectId: blockType === "work" && blockProjectId !== "none" ? blockProjectId : null,
    };

    let updatedSchedule = [...(activePlan.schedule || [])];
    if (editingBlockIdx !== null) {
      updatedSchedule[editingBlockIdx] = newBlock;
    } else {
      updatedSchedule.push(newBlock);
    }

    try {
      await upsertPlanMutation.mutateAsync({
        id: activePlan.id,
        workspaceId: activeWorkspaceId,
        name: activePlan.name,
        kind: activePlan.kind || "study",
        schedule: updatedSchedule,
        active: true,
      });

      toast.success(editingBlockIdx !== null ? "Bloco atualizado!" : "Bloco adicionado à rotina!");
      setBlockDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar bloco.");
    }
  };

  // Delete Block
  const handleDeleteBlock = async () => {
    if (editingBlockIdx === null || !activePlan || !activeWorkspaceId) return;

    if (confirm("Deseja remover este bloco da sua rotina semanal?")) {
      const updatedSchedule = (activePlan.schedule || []).filter((_: any, idx: number) => idx !== editingBlockIdx);

      try {
        await upsertPlanMutation.mutateAsync({
          id: activePlan.id,
          workspaceId: activeWorkspaceId,
          name: activePlan.name,
          kind: activePlan.kind || "study",
          schedule: updatedSchedule,
          active: true,
        });

        toast.success("Bloco removido!");
        setBlockDialogOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Erro ao deletar bloco.");
      }
    }
  };

  // Toggle milestone completion
  const handleToggleMilestone = async (objective: any, mileIdx: number) => {
    const updatedMilestones = [...(objective.milestones || [])];
    if (updatedMilestones[mileIdx]) {
      updatedMilestones[mileIdx] = {
        ...updatedMilestones[mileIdx],
        completed: !updatedMilestones[mileIdx].completed,
      };
    }

    try {
      await upsertObjectiveMutation.mutateAsync({
        ...objective,
        milestones: updatedMilestones,
      });
      toast.success("Progresso do objetivo atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar marco.");
    }
  };

  // Delete objective
  const handleDeleteObjective = async (id: string) => {
    if (confirm("Tem certeza que deseja deletar este objetivo e desvincular suas trilhas?")) {
      try {
        await deleteObjectiveMutation.mutateAsync({ id });
        toast.success("Objetivo deletado.");
      } catch (err: any) {
        toast.error(err.message || "Erro ao deletar.");
      }
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (id: string) => {
    if (confirm("Excluir esta meta permanentemente?")) {
      try {
        await deleteGoalMutation.mutateAsync({ id });
        toast.success("Meta excluída.");
      } catch (err: any) {
        toast.error(err.message || "Erro ao excluir meta.");
      }
    }
  };

  // Quick increment goal current progress value
  const handleIncrementGoal = async (goal: any) => {
    try {
      await upsertGoalMutation.mutateAsync({
        ...goal,
        current: (goal.current || 0) + 1,
      });
      toast.success("Progresso da meta incrementado! 🚀");
    } catch (err: any) {
      toast.error(err.message || "Erro ao incrementar.");
    }
  };

  // Days of week helper
  const toggleDaySelection = (dayNum: number) => {
    if (blockDays.includes(dayNum)) {
      setBlockDays(blockDays.filter(d => d !== dayNum));
    } else {
      setBlockDays([...blockDays, dayNum].sort());
    }
  };

  const DAYS_LIST = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rotina & Planejamento"
        description="Agende blocos de foco para sua semana e gerencie objetivos conceituais com metas mensuráveis."
      />

      <Tabs defaultValue="planner" className="w-full space-y-4">
        <TabsList className="bg-muted/40 border border-border/40 rounded-lg">
          <TabsTrigger value="planner" className="text-xs font-semibold">Rotina Semanal</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs font-semibold">Objetivos & Metas</TabsTrigger>
        </TabsList>

        {/* Tab 1: Rotina Semanal */}
        <TabsContent value="planner" className="space-y-4">
          <Card className="border-border/60 bg-card/40">
            <CardHeader className="p-4 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  Grade de Blocos Fixos
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione faixas de horário na grade semanal para planejar sua rotina fixa.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="zayon-fullcalendar">
                <FullCalendar
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={false} // Clean weekly layout
                  events={calendarEvents}
                  height="auto"
                  allDaySlot={false}
                  slotMinTime="06:00"
                  slotMaxTime="23:30"
                  slotDuration="00:30:00"
                  selectable={true}
                  editable={false}
                  locale="pt-br"
                  firstDay={1} // Monday first
                  dayHeaderFormat={{ weekday: "short" }} // seg, ter...
                  select={(info) => handleRangeSelect(info.start, info.end)}
                  eventClick={(info) => handleEventClick(info.event.id)}
                  eventDisplay="block"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Objetivos & Metas */}
        <TabsContent value="goals" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Lado Esquerdo: Objetivos & Marcos (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" /> Objetivos de Longo Prazo
                </h3>
                <p className="text-[11px] text-muted-foreground">Linhas de chegada e marcos de progresso do segundo cérebro.</p>
              </div>
              <Button size="sm" onClick={() => {
                setSelectedObjective(null);
                setObjectiveDialogOpen(true);
              }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>

            {loadingObjectives ? (
              <div className="text-center text-xs text-muted-foreground p-8">Carregando objetivos...</div>
            ) : objectives.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-muted/5 p-6 text-center italic text-xs text-muted-foreground">
                Nenhum objetivo amplo registrado. Comece definindo suas linhas de chegada!
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectives.map((obj: any) => {
                  const miles = Array.isArray(obj.milestones) ? obj.milestones : [];
                  const doneMiles = miles.filter((m: any) => m.completed).length;
                  const progress = miles.length ? Math.round((doneMiles / miles.length) * 100) : 0;

                  return (
                    <Card key={obj.id} className="border-border/60 bg-card/40 flex flex-col justify-between group overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{obj.emoji || "🎯"}</span>
                            <div>
                              <h4 className="font-bold text-sm text-foreground line-clamp-1">{obj.name}</h4>
                              <p className="text-[9px] text-muted-foreground uppercase font-semibold">{obj.category || "Estudo"}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 capitalize border-primary/20 bg-primary/5">
                            {obj.status === "active" ? "Ativo" : obj.status}
                          </Badge>
                        </div>
                        {obj.description && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-2 leading-relaxed">
                            {obj.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-4 flex-1 flex flex-col justify-between">
                        {/* Milestones Checklist */}
                        {miles.length > 0 ? (
                          <div className="space-y-1.5 py-2">
                            <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">Marcos de Entrega</p>
                            <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                              {miles.map((m: any, idx: number) => (
                                <button
                                  key={idx}
                                  onClick={() => handleToggleMilestone(obj, idx)}
                                  className="flex items-center gap-2 text-xs text-left w-full hover:bg-muted/15 p-1 rounded transition-colors group/item"
                                >
                                  {m.completed ? (
                                    <CheckSquare className="h-3.5 w-3.5 text-success shrink-0" />
                                  ) : (
                                    <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0 group-hover/item:text-foreground" />
                                  )}
                                  <span className={cn(
                                    "truncate flex-1 text-muted-foreground group-hover/item:text-foreground",
                                    m.completed && "line-through text-muted-foreground/50 group-hover/item:text-muted-foreground/50"
                                  )}>
                                    {m.title}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-[10px] text-muted-foreground/60 italic">Nenhum marco cadastrado.</div>
                        )}

                        {/* Progress Bar & Actions */}
                        <div className="space-y-3 pt-2 border-t border-border/20">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-mono text-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                          </div>

                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedObjective(obj);
                              setObjectiveDialogOpen(true);
                            }} className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteObjective(obj.id)} className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lado Direito: Metas Quantitativas (1 Col) */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" /> Metas Mensuráveis
                </h3>
                <p className="text-[11px] text-muted-foreground">Indicadores numéricos recorrentes de esforço.</p>
              </div>
              <Button size="sm" onClick={() => {
                setSelectedGoal(null);
                setGoalDialogOpen(true);
              }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>

            {loadingGoals ? (
              <div className="text-center text-xs text-muted-foreground p-8">Carregando metas...</div>
            ) : goals.length === 0 ? (
              <Card className="border-dashed border-border/60 bg-muted/5 p-6 text-center italic text-xs text-muted-foreground">
                Nenhuma meta cadastrada. Defina números de esforço (Ex: Focar X horas).
              </Card>
            ) : (
              <div className="space-y-4">
                {goals.map((g: any) => {
                  const pct = Math.min(100, Math.round(((g.current || 0) / (g.target || 1)) * 100));
                  const isSuccess = pct >= 100;

                  return (
                    <Card key={g.id} className="border-border/60 bg-card/40 group relative overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-xs text-foreground line-clamp-1">{g.title}</h4>
                            <p className="text-[9px] text-muted-foreground capitalize">
                              {g.metric === "hours" ? "Horas" : g.metric === "pages" ? "Páginas" : g.metric === "sessions" ? "Sessões" : g.metric} · {g.period}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn(
                            "text-[8px] px-1 py-0 capitalize",
                            isSuccess && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5",
                            !isSuccess && "text-amber-500 border-amber-500/20 bg-amber-500/5"
                          )}>
                            {g.status === "active" ? (isSuccess ? "Atingida" : "Ativa") : g.status}
                          </Badge>
                        </div>

                        {/* Progress Bar & Value */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-semibold">{g.current || 0} / {g.target} ({pct}%)</span>
                            <span className="text-muted-foreground/60 text-[9px]">Restam: {Math.max(0, g.target - (g.current || 0))}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>

                        {/* Quick Increment & Actions */}
                        <div className="flex justify-between items-center pt-2 border-t border-border/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleIncrementGoal(g)}
                            className="h-7 text-[10px] text-success hover:bg-success/10 font-bold px-2 py-0"
                            disabled={isSuccess}
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" /> Registrar Progresso (+1)
                          </Button>

                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setSelectedGoal(g);
                              setGoalDialogOpen(true);
                            }} className="h-6 w-6 p-0">
                              <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteGoal(g.id)} className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Routine Block Editor Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingBlockIdx !== null ? "Editar Bloco da Rotina" : "Novo Bloco de Rotina"}</DialogTitle>
            <DialogDescription>
              Os blocos agendados ajudam a delimitar o espaço de foco para estudos ou trabalho em sua rotina semanal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveBlock} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="blockName">Nome do Bloco</Label>
              <Input
                id="blockName"
                value={blockLabel}
                onChange={(e) => setBlockLabel(e.target.value)}
                placeholder="Ex: Foco Algoritmos, Lançamento Curso"
                required
              />
            </div>

            {/* Selector: Estudo vs Trabalho */}
            <div className="grid grid-cols-2 gap-2 p-0.5 bg-muted/40 rounded-lg border border-border/40">
              <button
                type="button"
                onClick={() => setBlockType("study")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                  blockType === "study" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GraduationCap className="h-3.5 w-3.5" /> Estudos
              </button>
              <button
                type="button"
                onClick={() => setBlockType("work")}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition",
                  blockType === "work" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Briefcase className="h-3.5 w-3.5" /> Trabalho
              </button>
            </div>

            {/* Target Selectors */}
            {blockType === "study" ? (
              <div className="space-y-1">
                <Label>Vincular à Trilha de Estudos</Label>
                <Select value={blockTrackId} onValueChange={setBlockTrackId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione a trilha..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma Trilha (Geral)</SelectItem>
                    {tracks.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Vincular ao Projeto de Trabalho</Label>
                <Select value={blockProjectId} onValueChange={setBlockProjectId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Selecione o projeto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum Projeto (Geral)</SelectItem>
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="blockStart">Hora Início</Label>
                <Input
                  id="blockStart"
                  type="time"
                  value={blockStart}
                  onChange={(e) => setBlockStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="blockEnd">Hora Término</Label>
                <Input
                  id="blockEnd"
                  type="time"
                  value={blockEnd}
                  onChange={(e) => setBlockEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Days list selection */}
            <div className="space-y-1.5">
              <Label>Dias de Recorrência</Label>
              <div className="flex gap-1 justify-between">
                {DAYS_LIST.map((day) => {
                  const selected = blockDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDaySelection(day.value)}
                      className={cn(
                        "h-8 flex-1 text-[10px] font-bold rounded border transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
              {editingBlockIdx !== null && (
                <Button type="button" variant="ghost" onClick={handleDeleteBlock} className="text-destructive hover:bg-destructive/10">
                  Deletar Bloco
                </Button>
              )}
              <div className="flex-1" />
              <Button type="submit" variant="gradient">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Objectives dialog */}
      <UpsertObjectiveDialog
        open={objectiveDialogOpen}
        onOpenChange={setObjectiveDialogOpen}
        objective={selectedObjective}
      />

      {/* Goals dialog */}
      <UpsertGoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        goal={selectedGoal}
      />
    </div>
  );
}
