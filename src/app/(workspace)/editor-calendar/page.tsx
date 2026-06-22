"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Video,
  MessageSquare,
  Calendar as CalIcon,
  User,
  Clock,
  ArrowRight,
  Settings,
  Link as LinkIcon,
  Edit2,
  Trash2,
  Filter,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  Info,
  Users,
  Check,
  CircleDollarSign,
  Briefcase,
  PlayCircle,
  Instagram,
  Music2,
  Youtube,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { initials, relativeTime, formatCurrency } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonaStore } from "@/stores/persona-store";
import { EditorDialog } from "@/components/calendar/editor-dialog";
import {
  useTasks,
  useContent,
  useTeam,
  usePersonas,
  useCreateContentMutation,
  useDeleteContentMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
  useUpdateTaskStatusAndPositionMutation,
  usePayroll,
} from "@/hooks/use-queries";

const COLUMNS = [
  { id: "backlog", label: "Pendências", tone: "border-zinc-800 bg-zinc-950/20 hover:border-zinc-700" },
  { id: "todo", label: "A Fazer", tone: "border-orange-950/30 bg-orange-950/5 hover:border-orange-900/40" },
  { id: "doing", tone: "border-primary/10 bg-primary/5 hover:border-primary/20", label: "Em Progresso" },
  { id: "review", tone: "border-warning/10 bg-warning/5 hover:border-warning/20", label: "Em Revisão" },
  { id: "done", tone: "border-success/10 bg-success/5 hover:border-success/20", label: "Concluído" },
];

const WEEKDAYS = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"];
const HOURS_SLOTS = ["13:30", "16:00", "21:00"];

const channelIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-3.5 w-3.5 text-pink-400" />,
  tiktok: <Music2 className="h-3.5 w-3.5 text-zinc-200" />,
  youtube: <Youtube className="h-3.5 w-3.5 text-red-500" />,
  whatsapp: <Globe className="h-3.5 w-3.5 text-green-400" />,
};

// Date helpers
function getWeekDates(pivotDate: Date) {
  const day = pivotDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Start week on Monday
  const monday = new Date(pivotDate);
  monday.setDate(pivotDate.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getMonthDaysGrid = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Index of first day: 0 is Sun, 1 is Mon...
  const firstDayIndex = new Date(year, month, 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Align to Mon

  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const grid = [];
  // Prev month days
  for (let i = startOffset - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  // Next month days
  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    grid.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  return grid;
};

export default function EditorCalendarPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activePersonaId = usePersonaStore((s) => s.activePersonaId);

  // Queries
  const { data: dbTasks = [] } = useTasks(activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId);
  const { data: dbTeam = [] } = useTeam(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const { data: dbPayroll = [] } = usePayroll(activeWorkspaceId);

  // Mutations
  const createContent = useCreateContentMutation();
  const deleteContent = useDeleteContentMutation();
  const deleteTask = useDeleteTaskMutation();
  const createTask = useCreateTaskMutation();
  const updateTaskStatus = useUpdateTaskStatusAndPositionMutation();

  // Navigation dates
  const [pivotDate, setPivotDate] = React.useState(() => new Date());
  const [calendarDate, setCalendarDate] = React.useState(() => new Date());

  // Filter states
  const [selectedEditorId, setSelectedEditorId] = React.useState<string>("all");
  const [selectedChannel, setSelectedChannel] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedContentItem, setSelectedContentItem] = React.useState<any>(null);
  const [selectedTaskItem, setSelectedTaskItem] = React.useState<any>(null);

  // Filtered lists
  const editors = React.useMemo(() => {
    return dbTeam.filter((m: any) => m.role === "editor" || m.role === "admin" || m.role === "owner");
  }, [dbTeam]);

  const activeEditor = React.useMemo(() => {
    if (selectedEditorId === "all") return null;
    return dbTeam.find((m: any) => m.id === selectedEditorId) || null;
  }, [selectedEditorId, dbTeam]);

  // Matching task lookup
  const getTaskForContent = React.useCallback(
    (contentId: string) => {
      return (
        dbTasks.find(
          (t: any) => t.relatedEntity?.type === "content" && t.relatedEntity?.id === contentId
        ) || null
      );
    },
    [dbTasks]
  );

  // Filter video contents & related tasks
  const videoContents = React.useMemo(() => {
    return dbContent.filter((c: any) => {
      // Must be video channel
      const isVideoChannel = ["instagram", "tiktok", "youtube"].includes(c.channel);
      if (!isVideoChannel) return false;

      // Persona check
      if (activePersonaId && c.personaId !== activePersonaId) return false;

      // Channel filter
      if (selectedChannel !== "all" && c.channel !== selectedChannel) return false;

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(query);
        const matchesScript = c.script?.toLowerCase().includes(query);
        const matchesBrief = c.visualBrief?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesScript && !matchesBrief) return false;
      }

      // Editor assignee check
      if (selectedEditorId !== "all") {
        const task = getTaskForContent(c.id);
        if (task?.assignee?.id !== selectedEditorId) return false;
      }

      return true;
    });
  }, [dbContent, activePersonaId, selectedChannel, searchQuery, selectedEditorId, getTaskForContent]);

  // Weekly layout mapping
  const weekDates = React.useMemo(() => getWeekDates(pivotDate), [pivotDate]);

  const weekRangeLabel = React.useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const format = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return `Semana: ${format(start)} a ${format(end)}`;
  }, [weekDates]);

  const handlePrevWeek = () => {
    setPivotDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setPivotDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  // Month dates mapping
  const monthDays = React.useMemo(() => getMonthDaysGrid(calendarDate), [calendarDate]);

  const monthLabel = React.useMemo(() => {
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${months[calendarDate.getMonth()]} De ${calendarDate.getFullYear()}`;
  }, [calendarDate]);

  const handlePrevMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Metrics counters
  const metrics = React.useMemo(() => {
    let pending = 0;
    let todo = 0;
    let doing = 0;
    let review = 0;
    let done = 0;

    videoContents.forEach((c: any) => {
      const task = getTaskForContent(c.id);
      if (!task) {
        pending++; // Video with no task is pending task creation
      } else {
        if (task.status === "backlog") pending++;
        else if (task.status === "todo") todo++;
        else if (task.status === "doing") doing++;
        else if (task.status === "review") review++;
        else if (task.status === "done") done++;
      }
    });

    return { pending, todo, doing, review, done, total: videoContents.length };
  }, [videoContents, getTaskForContent]);

  // Open edit dialog for content & its task
  const handleOpenEdit = (contentItem: any) => {
    setSelectedContentItem(contentItem);
    const task = getTaskForContent(contentItem.id);
    setSelectedTaskItem(task);
    setIsDialogOpen(true);
  };

  // Slot click: Create new content for specific date and time slot
  const handleSlotClick = async (dayDate: Date, slotTime?: string) => {
    if (!activeWorkspaceId) return;

    let scheduledTimeStr = "";
    if (slotTime) {
      const [hours, minutes] = slotTime.split(":");
      const newD = new Date(dayDate);
      newD.setHours(Number(hours), Number(minutes), 0, 0);
      scheduledTimeStr = newD.toISOString();
    } else {
      scheduledTimeStr = dayDate.toISOString();
    }

    try {
      const newContent = await createContent.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: activePersonaId || undefined,
        title: "Novo Rascunho de Vídeo",
        channel: selectedChannel !== "all" ? selectedChannel : "instagram",
        contentType: "reel",
        status: "idea",
        scheduledAt: scheduledTimeStr,
        metadata: { videoLink: "" },
      });

      handleOpenEdit(newContent);
      toast.success("Novo slot de vídeo planejado!");
    } catch (error: any) {
      toast.error("Erro ao planejar slot: " + error.message);
    }
  };

  // Quick createTask for an existing content
  const handleCreateTask = async (contentItem: any) => {
    if (!activeWorkspaceId) return;
    try {
      await createTask.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: contentItem.personaId || undefined,
        title: `Editar: ${contentItem.title}`,
        description: `Gravação/Edição do conteúdo: "${contentItem.title}".\nCanal: ${contentItem.channel}\nRoteiro: ${contentItem.script || ""}\nVisual: ${contentItem.visualBrief || ""}`,
        priority: "medium",
        status: "todo",
        assigneeId: selectedEditorId !== "all" ? selectedEditorId : undefined,
        relatedEntity: {
          type: "content",
          id: contentItem.id,
          title: contentItem.title,
        },
      });
      toast.success("Tarefa de edição criada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao criar tarefa: " + error.message);
    }
  };

  // Change task status (moves card in Kanban)
  const handleMoveStatus = async (taskId: string, nextStatus: string) => {
    try {
      await updateTaskStatus.mutateAsync({
        id: taskId,
        status: nextStatus,
        position: 0,
      });
      toast.success("Workflow atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar progresso: " + error.message);
    }
  };

  // Delete content item
  const handleDeleteContent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este conteúdo planejador?")) return;
    try {
      const task = getTaskForContent(id);
      if (task) {
        await deleteTask.mutateAsync(task.id);
      }
      await deleteContent.mutateAsync(id);
      toast.success("Conteúdo excluído!");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  // Payroll/Editor info
  const payrollMember = React.useMemo(() => {
    if (selectedEditorId === "all") return null;
    return dbPayroll.find((p: any) => p.name.toLowerCase() === activeEditor?.fullName.toLowerCase()) || null;
  }, [selectedEditorId, activeEditor, dbPayroll]);

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="CALENDÁRIO DO EDITOR DE VÍDEOS"
          description="Gerencie prazos, envie observações de edição e centralize feedbacks com os editores."
        />

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Editor Switcher */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEditorId} onValueChange={setSelectedEditorId}>
              <SelectTrigger className="w-[180px] bg-card border-border/80 text-foreground font-medium">
                <SelectValue placeholder="Selecione o Editor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Editores</SelectItem>
                {editors.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Channel Selector */}
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[140px] bg-card border-border/80 text-foreground">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Canais</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
            </SelectContent>
          </Select>

          {/* Search bar */}
          <div className="relative w-[200px]">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vídeos..."
              className="bg-card border-border/80 pl-8 text-xs"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <Button
            variant="gradient"
            size="sm"
            onClick={() => handleSlotClick(new Date())}
            className="shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Planejar Vídeo
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Planejado</span>
            <span className="text-2xl font-black text-foreground">{metrics.total}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-pulse" />
              Pendentes
            </span>
            <span className="text-2xl font-black text-zinc-300">{metrics.pending}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              A Fazer
            </span>
            <span className="text-2xl font-black text-orange-300">{metrics.todo}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Edição
            </span>
            <span className="text-2xl font-black text-primary">{metrics.doing}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-warning uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              Revisão
            </span>
            <span className="text-2xl font-black text-warning">{metrics.review}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/45 border-border/60 hover:bg-card/65 transition-all">
          <CardContent className="p-4 flex flex-col justify-between h-[80px]">
            <span className="text-[10px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Concluídos
            </span>
            <span className="text-2xl font-black text-success">{metrics.done}</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Board Area */}
      <Tabs defaultValue="slots" className="space-y-4">
        <TabsList className="bg-card/70 border border-border/50 p-1 w-full max-w-[500px]">
          <TabsTrigger value="slots" className="flex-1 text-xs font-semibold">Grade Semanal</TabsTrigger>
          <TabsTrigger value="kanban" className="flex-1 text-xs font-semibold">Quadro Kanban</TabsTrigger>
          <TabsTrigger value="deadlines" className="flex-1 text-xs font-semibold">Calendário Prazos</TabsTrigger>
          {selectedEditorId !== "all" && (
            <TabsTrigger value="mgmt" className="flex-1 text-xs font-semibold">Gestão Editor</TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: WEEKLY SLOTS GRADE */}
        <TabsContent value="slots" className="focus-visible:outline-none">
          <Card className="border-border/60 bg-card/15 shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevWeek}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-bold text-foreground bg-card/60 px-3 py-1.5 rounded-lg border border-border/40">
                    {weekRangeLabel}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextWeek}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Dica: clique em um slot em branco para planejar posts para aquele dia</span>
                </div>
              </div>

              {/* Weekly Grid */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background/40">
                {/* Header row */}
                <div className="grid grid-cols-12 border-b border-border/60 bg-card/35 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-left py-3">
                  <div className="col-span-2 pl-4">Dia da Semana</div>
                  <div className="col-span-10 pl-2">Vídeos Planejados</div>
                </div>

                {/* Body Rows */}
                <div className="divide-y divide-border/60">
                  {weekDates.map((dayDate, dayIdx) => {
                    const isToday = new Date().toDateString() === dayDate.toDateString();
                    
                    // Filter contents for this day
                    const dayContents = videoContents.filter(
                      (c: any) => c.scheduledAt && new Date(c.scheduledAt).toDateString() === dayDate.toDateString()
                    );

                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "grid grid-cols-12 items-center gap-4 py-4 px-3 text-left transition-colors",
                          isToday ? "bg-primary/5/20 border-y border-primary/20" : ""
                        )}
                      >
                        {/* Day of Week info */}
                        <div className="col-span-2 text-left pl-2 flex flex-col justify-center">
                          <span className={cn(
                            "text-xs font-bold",
                            isToday ? "text-primary" : "text-foreground"
                          )}>
                            {WEEKDAYS[dayIdx]}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            {dayDate.getDate()}/{dayDate.getMonth() + 1}
                            {isToday && (
                              <Badge className="text-[8px] px-1 py-0 h-4 bg-primary text-primary-foreground font-black">HOJE</Badge>
                            )}
                          </span>
                        </div>

                        {/* Planned Videos */}
                        <div className="col-span-10 pl-2">
                          <div className="flex flex-wrap gap-2.5">
                            {dayContents.map((item: any) => {
                              const task = getTaskForContent(item.id);
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => handleOpenEdit(item)}
                                  className={cn(
                                    "p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg bg-card/65 min-w-[200px] max-w-[280px] flex-1 group",
                                    task?.status === "done"
                                      ? "border-success/30 hover:border-success/60 bg-success/5"
                                      : task?.status === "review"
                                        ? "border-warning/30 hover:border-warning/60 bg-warning/5"
                                        : task?.status === "doing"
                                          ? "border-primary/30 hover:border-primary/60 bg-primary/5"
                                          : "border-border/60 hover:border-zinc-500"
                                  )}
                                >
                                  <div className="flex items-center gap-1.5 justify-between mb-1">
                                    <span className="flex items-center gap-1">
                                      {channelIcons[item.channel]}
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                        {item.channel}
                                      </span>
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {task?.dueAt && (
                                        <span className="text-[8px] font-bold text-warning flex items-center gap-0.5">
                                          <Clock className="h-2 w-2" />
                                          {new Date(task.dueAt).getDate()}/{new Date(task.dueAt).getMonth() + 1}
                                        </span>
                                      )}
                                      <button
                                        onClick={(e) => handleDeleteContent(item.id, e)}
                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                        title="Excluir vídeo"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-xs font-bold text-foreground line-clamp-1 truncate leading-tight">
                                    {item.title}
                                  </p>
                                </div>
                              );
                            })}
                            
                            {/* Inline add button */}
                            <button
                              onClick={() => handleSlotClick(dayDate)}
                              className="h-[52px] px-4 rounded-lg border border-dashed border-border/40 hover:border-primary/55 hover:bg-primary/5 transition flex items-center justify-center gap-1.5 text-xs text-muted-foreground cursor-pointer min-w-[140px]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Novo Vídeo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: KANBAN PRODUCTION WORKFLOW */}
        <TabsContent value="kanban" className="focus-visible:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLUMNS.map((col) => {
              // Group content items belonging to this status column
              const items = videoContents.filter((c: any) => {
                const task = getTaskForContent(c.id);
                if (!task) return col.id === "backlog"; // Items with no task go to backlog
                return task.status === col.id;
              });

              return (
                <div key={col.id} className="flex flex-col space-y-3 min-h-[500px]">
                  <div className="flex items-center justify-between px-2 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider">{col.label}</span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1">{items.length}</Badge>
                    </div>
                  </div>

                  <div className={cn(
                    "flex-1 border rounded-xl p-3 space-y-3 bg-zinc-950/5 min-h-[480px] overflow-y-auto",
                    col.tone
                  )}>
                    {items.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/30 rounded-lg">
                        <span className="text-[10px] text-muted-foreground/40">Sem itens nesta coluna</span>
                      </div>
                    ) : (
                      items.map((item: any) => {
                        const task = getTaskForContent(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleOpenEdit(item)}
                            className="group p-3 rounded-lg border border-border/80 bg-card hover:bg-card-elevated hover:border-zinc-500 cursor-pointer shadow-sm hover:shadow-md transition-all relative overflow-hidden space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="flex items-center gap-1">
                                {channelIcons[item.channel]}
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">{item.channel}</span>
                              </span>
                              {task?.dueAt && (
                                <Badge variant="outline" className="text-[8px] py-0 px-1 border-warning/30 bg-warning/5 text-warning flex items-center gap-0.5">
                                  <Clock className="h-2 w-2" />
                                  Vence: {new Date(task.dueAt).getDate()}/{new Date(task.dueAt).getMonth() + 1}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                              {item.title}
                            </p>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40 text-[9px] text-muted-foreground">
                              {task ? (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-4 w-4 border border-border/80">
                                    <AvatarFallback className="text-[8px]">{initials(task.assignee?.fullName || "Editor")}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[80px]">{task.assignee?.fullName || "Não atribuído"}</span>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[8px] text-warning hover:bg-warning/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateTask(item);
                                  }}
                                >
                                  <Plus className="h-2 w-2 mr-0.5" /> Criar Tarefa
                                </Button>
                              )}

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => handleDeleteContent(item.id, e)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                                  title="Excluir conteúdo"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Workflow Quick Mover */}
                            {task && (
                              <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {col.id !== "backlog" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const prevCol = COLUMNS[COLUMNS.findIndex(x => x.id === col.id) - 1].id;
                                      handleMoveStatus(task.id, prevCol);
                                    }}
                                    title="Mover para esquerda"
                                  >
                                    <ChevronLeft className="h-3 w-3" />
                                  </Button>
                                )}
                                {col.id !== "done" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 rounded"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nextCol = COLUMNS[COLUMNS.findIndex(x => x.id === col.id) + 1].id;
                                      handleMoveStatus(task.id, nextCol);
                                    }}
                                    title="Mover para direita"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 3: MONTHLY DEADLINES CALENDAR */}
        <TabsContent value="deadlines" className="focus-visible:outline-none">
          <Card className="border-border/60 bg-card/15 shadow-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-bold text-foreground bg-card/60 px-3 py-1.5 rounded-lg border border-border/40 min-w-[150px] text-center">
                    {monthLabel}
                  </span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
                  <span>Exibindo datas de entrega de edições (prazos máximos)</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-background/20">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-border/60 bg-card/35 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center py-2">
                  <div>Seg</div>
                  <div>Ter</div>
                  <div>Qua</div>
                  <div>Qui</div>
                  <div>Sex</div>
                  <div>Sáb</div>
                  <div>Dom</div>
                </div>

                <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-border/60 border-t border-border/60">
                  {monthDays.map((cell, idx) => {
                    const cellDate = cell.date;
                    const isToday = new Date().toDateString() === cellDate.toDateString();
                    
                    // Filter deadlines due on this day
                    const dueTasks = dbTasks.filter((t: any) => {
                      if (!t.dueAt) return false;
                      const matchesDay = new Date(t.dueAt).toDateString() === cellDate.toDateString();
                      
                      // Match filters
                      const isEditingTask = t.title.startsWith("Editar:") || t.relatedEntity?.type === "content";
                      if (!isEditingTask) return false;

                      if (selectedEditorId !== "all" && t.assignee?.id !== selectedEditorId) return false;

                      // Persona check
                      if (activePersonaId && t.personaId !== activePersonaId) return false;

                      return matchesDay;
                    });

                    return (
                      <div
                        key={idx}
                        className={cn(
                          "min-h-[90px] p-2 flex flex-col justify-between transition-colors",
                          cell.isCurrentMonth ? "bg-background/20" : "bg-card/10 text-muted-foreground/45",
                          isToday ? "bg-primary/5" : ""
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-xs font-bold",
                            isToday ? "text-primary bg-primary/10 h-5 w-5 rounded-full flex items-center justify-center" : "",
                            !cell.isCurrentMonth ? "text-muted-foreground/35" : ""
                          )}>
                            {cellDate.getDate()}
                          </span>
                          {isToday && (
                            <span className="text-[8px] font-black text-primary tracking-wide">HOJE</span>
                          )}
                        </div>

                        {/* List of deadlines */}
                        <div className="flex-1 overflow-y-auto space-y-1 mt-1 max-h-[60px] no-scrollbar">
                          {dueTasks.map((task: any) => {
                            // Find corresponding content
                            const content = dbContent.find((c: any) => c.id === task.relatedEntity?.id);
                            
                            return (
                              <div
                                key={task.id}
                                onClick={() => content && handleOpenEdit(content)}
                                className={cn(
                                  "p-1 rounded text-[9px] font-bold cursor-pointer border line-clamp-1 leading-normal truncate",
                                  task.status === "done"
                                    ? "bg-success/5 border-success/30 text-success-foreground"
                                    : "bg-warning/5 border-warning/30 text-warning-foreground"
                                )}
                                title={task.title}
                              >
                                {content && channelIcons[content.channel]}
                                <span className="ml-1">{task.title.replace("Editar: ", "")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: EDITOR MANAGEMENT & PAYMENTS */}
        {selectedEditorId !== "all" && activeEditor && (
          <TabsContent value="mgmt" className="focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <Card className="border-border/60 bg-card/25 p-5 flex flex-col items-center text-center space-y-4">
                <Avatar className="h-16 w-16 border-2 border-primary/50 shadow-md">
                  <AvatarFallback className="text-xl font-bold">{initials(activeEditor.fullName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-foreground">{activeEditor.fullName}</h3>
                  <p className="text-xs text-muted-foreground">{activeEditor.email}</p>
                  <Badge variant="outline" className="capitalize text-[10px] mt-1.5">{activeEditor.role}</Badge>
                </div>

                <div className="w-full text-left space-y-3 pt-4 border-t border-border/60 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Membro desde:</span>
                    <span className="font-bold">{activeEditor.joinedAt ? new Date(activeEditor.joinedAt).toLocaleDateString("pt-BR") : "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status do Workflow:</span>
                    <span className="text-success font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Ativo
                    </span>
                  </div>
                </div>
              </Card>

              {/* Payroll & Rates Card */}
              <Card className="border-border/60 bg-card/25 p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-primary" />
                  Acordo de Pagamento (Payroll)
                </h3>

                <div className="space-y-4 pt-2 text-xs">
                  {payrollMember ? (
                    <>
                      <div className="flex justify-between p-2.5 rounded-lg bg-card border border-border/50">
                        <span className="text-muted-foreground">Taxa Base / Salário:</span>
                        <span className="font-black text-foreground">{formatCurrency(payrollMember.baseSalary)}</span>
                      </div>
                      
                      {payrollMember.commission !== undefined && (
                        <div className="flex justify-between p-2.5 rounded-lg bg-card border border-border/50">
                          <span className="text-muted-foreground">Extra / Adicional por Vídeo:</span>
                          <span className="font-black text-foreground">{formatCurrency(payrollMember.commission)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dia do Pagamento:</span>
                        <span className="font-semibold text-foreground">Dia {payrollMember.payDay}</span>
                      </div>

                      {payrollMember.pixKey && (
                        <div className="space-y-1 bg-zinc-950/20 p-2.5 rounded-lg border border-border/40">
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Chave PIX Cadastrada</span>
                          <p className="font-mono text-xs select-all text-foreground">{payrollMember.pixKey}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border/60 rounded-lg space-y-2">
                      <Info className="h-6 w-6 text-warning" />
                      <p className="text-xs font-semibold">Sem Informações Financeiras</p>
                      <p className="text-[10px] text-muted-foreground max-w-[200px]">
                        Cadastre este membro na aba Equipe (Payroll) para ver PIX, valor por vídeo ou salário mensal aqui.
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Editor Active Tasks list */}
              <Card className="border-border/60 bg-card/25 p-5 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Vídeos Ativos Atribuídos
                </h3>

                <div className="space-y-2 overflow-y-auto max-h-[220px] no-scrollbar">
                  {videoContents
                    .filter((c: any) => {
                      const t = getTaskForContent(c.id);
                      return t && t.status !== "done";
                    })
                    .map((item: any) => {
                      const t = getTaskForContent(item.id)!;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEdit(item)}
                          className="p-2.5 rounded-lg border border-border/50 bg-card hover:bg-card-elevated cursor-pointer transition flex justify-between items-center text-xs"
                        >
                          <div className="space-y-0.5 max-w-[160px]">
                            <p className="font-bold truncate text-foreground">{item.title}</p>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              {channelIcons[item.channel]}
                              <span className="capitalize">{item.channel}</span>
                            </span>
                          </div>
                          <Badge variant={t.status === "review" ? "warning" : t.status === "doing" ? "primary" : "outline"} className="text-[9px] py-0.5">
                            {t.status === "review" ? "Ajustes" : t.status === "doing" ? "Edição" : "A Fazer"}
                          </Badge>
                        </div>
                      );
                    })}

                  {videoContents.filter((c: any) => {
                    const t = getTaskForContent(c.id);
                    return t && t.status !== "done";
                  }).length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhum vídeo em produção ativa.</p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Editor communication dialog */}
      {isDialogOpen && selectedContentItem && (
        <EditorDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          contentItem={selectedContentItem}
          task={selectedTaskItem}
          workspaceId={activeWorkspaceId ?? ""}
          editors={editors}
          personas={dbPersonas}
        />
      )}
    </div>
  );
}
