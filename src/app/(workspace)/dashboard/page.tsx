"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Flame,
  Gauge,
  ListChecks,
  Plus,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  useTasks,
  useProjects,
  useFinance,
  useContent,
  useActivityLogs,
  useNotifications,
  useTools,
  useLeads,
  useAiActions,
  usePersonas,
  useUpdateUserMetadataMutation,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { cn } from "@/lib/utils/cn";
import {
  MOCK_PERSONAS,
  MOCK_TASKS,
  MOCK_PROJECTS,
  MOCK_TOOLS,
  MOCK_AI_ACTIONS,
  MOCK_NOTIFICATIONS,
  MOCK_ACTIVITY,
} from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { initials, relativeTime, formatCurrency, formatCompact } from "@/lib/utils/format";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

const revenueSeries = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  value: Math.round(8000 + Math.sin(i / 3) * 4000 + i * 540 + Math.random() * 2200),
}));

const followersSeries = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  value: Math.round(280_000 + i * 1100 + Math.sin(i / 4) * 2200),
}));

const channelDistribution = [
  { name: "Instagram", value: 42 },
  { name: "TikTok", value: 33 },
  { name: "YouTube", value: 8 },
  { name: "Email", value: 12 },
  { name: "Outros", value: 5 },
];

const statusColor = {
  todo: "outline",
  doing: "primary",
  review: "warning",
  done: "success",
  backlog: "ghost",
} as const;

interface Widget {
  id: string;
  colSpan: string;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: "revenue-chart", colSpan: "lg:col-span-2" },
  { id: "channel-distribution", colSpan: "lg:col-span-1" },
  { id: "active-personas", colSpan: "lg:col-span-2" },
  { id: "followers-growth", colSpan: "lg:col-span-1" },
  { id: "focus-tasks", colSpan: "lg:col-span-2" },
  { id: "recent-activity", colSpan: "lg:col-span-1" },
  { id: "active-projects", colSpan: "lg:col-span-2" },
  { id: "favorite-tools", colSpan: "lg:col-span-1" },
  { id: "ai-actions", colSpan: "lg:col-span-1" },
  { id: "notifications", colSpan: "lg:col-span-1" },
  { id: "ai-cta", colSpan: "lg:col-span-1" },
];

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

function SortableWidget({ id, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/widget h-full">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 right-3 opacity-0 group-hover/widget:opacity-100 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-accent bg-background/80 border border-border/40 transition-opacity z-10"
        title="Arraste para organizar o painel"
      >
        <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8h16M4 16h16" />
        </svg>
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [widgets, setWidgets] = React.useState<Widget[]>(DEFAULT_WIDGETS);
  const [mounted, setMounted] = React.useState(false);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const user = useWorkspaceStore((s) => s.user);
  const setUser = useWorkspaceStore((s) => s.setUser);
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const updateMetadataMutation = useUpdateUserMetadataMutation();

  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const personas =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;
  const defaultPersonaId = personas[0]?.id ?? "";

  const { data: tasks = [] } = useTasks(activeWorkspaceId);
  const { data: projects = [] } = useProjects(activeWorkspaceId);
  const { data: finance = [] } = useFinance(activeWorkspaceId);
  const { data: content = [] } = useContent(activeWorkspaceId);
  const { data: activity = [] } = useActivityLogs(activeWorkspaceId);
  const { data: notifications = [] } = useNotifications(user?.id);
  const { data: tools = [] } = useTools(activeWorkspaceId);
  const { data: aiActions = [] } = useAiActions(activeWorkspaceId);
  const { data: leads = [] } = useLeads(activeWorkspaceId);

  const taskItems = isMockModeClient && tasks.length === 0 ? MOCK_TASKS : tasks;
  const projectItems =
    isMockModeClient && projects.length === 0 ? MOCK_PROJECTS : projects;
  const toolItems = isMockModeClient && tools.length === 0 ? MOCK_TOOLS : tools;
  const aiActionItems =
    isMockModeClient && aiActions.length === 0 ? MOCK_AI_ACTIONS : aiActions;
  const notificationItems =
    isMockModeClient && notifications.length === 0
      ? MOCK_NOTIFICATIONS
      : notifications;
  const activityItems =
    isMockModeClient && activity.length === 0 ? MOCK_ACTIVITY : activity;

  const todayTasks = taskItems.filter(
    (t: any) => t.status !== "done" && t.priority !== "low",
  ).slice(0, 6);

  React.useEffect(() => {
    setMounted(true);
    const dbOrder = user?.metadata?.dashboardWidgetsOrder;
    if (dbOrder && Array.isArray(dbOrder) && dbOrder.length > 0) {
      try {
        const ordered = dbOrder
          .map((id: string) => DEFAULT_WIDGETS.find((w) => w.id === id))
          .filter(Boolean) as Widget[];
        setWidgets(ordered.length > 0 ? ordered : DEFAULT_WIDGETS);
      } catch (e) {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      const saved = localStorage.getItem("zayon.dashboard.widgets");
      if (saved) {
        try {
          setWidgets(JSON.parse(saved));
        } catch (e) {
          setWidgets(DEFAULT_WIDGETS);
        }
      }
    }
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const next = arrayMove(items, oldIndex, newIndex);
        const orderIds = next.map((w) => w.id);
        localStorage.setItem("zayon.dashboard.widgets", JSON.stringify(next));
        if (user) {
          updateMetadataMutation.mutate({ dashboardWidgetsOrder: orderIds });
          setUser({
            ...user,
            metadata: {
              ...(user.metadata || {}),
              dashboardWidgetsOrder: orderIds,
            },
          });
        }
        return next;
      });
      toast.success("Ordem dos widgets atualizada no painel");
    }
  };

  const handleResetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("zayon.dashboard.widgets");
    if (user) {
      updateMetadataMutation.mutate({ dashboardWidgetsOrder: null });
      setUser({
        ...user,
        metadata: {
          ...(user.metadata || {}),
          dashboardWidgetsOrder: undefined,
        },
      });
    }
    toast.success("Layout original restaurado");
  };

  const renderWidgetContent = (id: string) => {
    switch (id) {
      case "revenue-chart":
        return (
          <Card variant="elevated" className="h-full">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Receita acumulada · 30 dias</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Consolidado de todas as personas. Pico em 18/05 com lançamento Aurora.
                </p>
              </div>
              <Badge variant="success" size="sm">
                <ArrowUpRight className="h-3 w-3" />
                +18.4%
              </Badge>
            </CardHeader>
            <CardContent>
              <AreaChart data={revenueSeries} color="#22c55e" formatter={(v) => formatCurrency(v)} />
            </CardContent>
          </Card>
        );

      case "channel-distribution":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Distribuição por canal</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">% do volume publicado em 30 dias.</p>
            </CardHeader>
            <CardContent>
              <PieChart data={channelDistribution} height={260} />
            </CardContent>
          </Card>
        );

      case "active-personas":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Personas ativas</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Cada persona é uma unidade de negócio independente.</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/personas/${defaultPersonaId}/overview`}>Ver todas <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {personas.slice(0, 4).map((p: any) => (
                <Link key={p.id} href={`/personas/${p.id}/overview`} className="group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated p-4 transition hover:border-primary/40">
                  <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" style={{ background: `radial-gradient(at top right, ${p.accent || '#3b82f6'}30, transparent 60%)` }} />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-glow" style={{ background: `linear-gradient(135deg, ${p.accent || '#3b82f6'}, #2a3ef5)` }}>{initials(p.name)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><p className="font-semibold truncate">{p.name}</p><Badge size="sm" variant={p.status === "active" ? "success" : p.status === "building" ? "warning" : "outline"}>{p.status}</Badge></div>
                      <p className="text-[11px] text-muted-foreground truncate">{p.niche}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                        <div><p className="text-muted-foreground">Receita</p><p className="font-medium num">{formatCompact(p.metrics?.revenuePeriod ?? 0)}</p></div>
                        <div><p className="text-muted-foreground">Seguidores</p><p className="font-medium num">{formatCompact(p.metrics?.followers ?? 0)}</p></div>
                        <div><p className="text-muted-foreground">Leads</p><p className="font-medium num">{p.metrics?.leads ?? 0}</p></div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );

      case "followers-growth":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Crescimento de seguidores</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Total consolidado · 30 dias.</p>
              </div>
              <Badge variant="primary" size="sm">+4.2%</Badge>
            </CardHeader>
            <CardContent>
              <AreaChart data={followersSeries} color="#5b8cff" formatter={(v) => formatCompact(v)} height={260} />
            </CardContent>
          </Card>
        );

      case "focus-tasks":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Tarefas em foco</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Prioridade alta ou urgente · não concluídas.</p>
              </div>
              <Button variant="ghost" size="sm" asChild><Link href="/tasks">Ver todas</Link></Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {todayTasks.map((task: any) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-accent">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", task.priority === "urgent" && "bg-destructive animate-pulse", task.priority === "high" && "bg-warning", task.priority === "medium" && "bg-primary")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate font-medium">{task.title}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      {task.labels?.map((l: string) => <Badge key={l} size="sm" variant="ghost">{l}</Badge>)}
                      {task.dueAt && <span className="ml-auto">{relativeTime(task.dueAt)}</span>}
                    </div>
                  </div>
                  <Badge size="sm" variant={statusColor[task.status as keyof typeof statusColor] ?? "outline"}>{task.status}</Badge>
                  {task.assignee && <Avatar size="xs"><AvatarFallback>{initials(task.assignee.fullName)}</AvatarFallback></Avatar>}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        );

      case "recent-activity":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Atividade recente</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Equipe + IA</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityItems.slice(0, 6).map((a: any) => (
                <div key={a.id} className="flex items-start gap-3">
                  {a.actor ? (<Avatar size="sm"><AvatarFallback>{initials(a.actor.fullName)}</AvatarFallback></Avatar>) : (<div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-gradient-to-br from-brand-500/40 to-brand-700/40 text-white"><Bot className="h-3.5 w-3.5" /></div>)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed"><span className="font-medium">{a.actor?.fullName ?? "ZAYON AI"}</span> <span className="text-muted-foreground">{a.action}</span></p>
                    {a.payload && <p className="text-[10px] text-muted-foreground truncate">{Object.values(a.payload).join(" · ")}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{relativeTime(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "active-projects":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Projetos ativos</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{projectItems.length} projetos em execução</p>
              </div>
              <Button variant="ghost" size="sm" asChild><Link href="/projects">Ver todos</Link></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectItems.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card-elevated p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: `${p.color || '#3b82f6'}40`, color: p.color || '#3b82f6' }}><Gauge className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium truncate">{p.name}</p><Badge size="sm" variant="outline">{p.taskCount?.done || 0}/{p.taskCount?.total || 0}</Badge></div>
                    <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                    <Progress value={p.progress || 0} className="mt-2 h-1" />
                  </div>
                  <div className="flex -space-x-2">
                    {p.members?.slice(0, 3).map((m: any) => <Avatar key={m.id} size="xs" className="ring-2 ring-card"><AvatarFallback>{initials(m.fullName)}</AvatarFallback></Avatar>)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "favorite-tools":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle>Ferramentas favoritas</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Acesso rápido</p>
              </div>
              <Button variant="ghost" size="sm" asChild><Link href="/tools">Hub <ArrowUpRight className="h-3.5 w-3.5" /></Link></Button>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {toolItems.filter((t: any) => t.isFavorite).slice(0, 9).map((tool: any) => (
                <a key={tool.id} href={tool.url} target="_blank" rel="noreferrer" className="group flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card-elevated p-2.5 transition hover:border-primary/40" title={tool.name}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-md text-white animate-fade-in" style={{ background: tool.brandColor ?? "#3b82f6" }}>
                    <BrandLogo slug={tool.iconSlug} fallback={tool.name} size={16} monochrome brandColor={tool.brandColor} />
                  </div>
                  <span className="text-[10px] truncate w-full text-center text-muted-foreground group-hover:text-foreground">{tool.name}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        );

      case "ai-actions":
        return (
          <Card className="h-full">
            <CardHeader><CardTitle>Ações da IA (24h)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {aiActionItems.map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card-elevated p-2.5">
                  <div className="mt-0.5">{a.status === "completed" ? (<CheckCircle2 className="h-3.5 w-3.5 text-success" />) : (<span className="block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />)}</div>
                  <div className="flex-1 min-w-0"><p className="text-xs font-medium">{a.name}</p>{a.description && <p className="text-[10px] text-muted-foreground truncate">{a.description}</p>}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        );

      case "notifications":
        return (
          <Card className="h-full">
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {notificationItems.slice(0, 5).map((n: any) => (
                <Link key={n.id} href={n.href ?? "#"} className="block rounded-lg border border-border/60 bg-card-elevated p-2.5 hover:border-primary/40">
                  <p className="text-xs font-medium">{n.title}</p>
                  {n.body && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{n.body}</p>}
                </Link>
              ))}
            </CardContent>
          </Card>
        );

      case "ai-cta":
        return (
          <Card variant="glass" className="relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute inset-0 mesh-bg opacity-60 pointer-events-none" />
            <CardHeader className="relative">
              <Badge variant="primary" size="sm" className="w-fit"><Sparkles className="h-3 w-3" /> IA contextual</Badge>
              <CardTitle className="mt-2">Pronto para acelerar?</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Diga o que precisa que a IA executa no sistema · roteiros, copy, qualificação de leads, calendário, funis.</p>
            </CardHeader>
            <CardContent className="relative mt-auto">
              <Button variant="gradient" size="sm" className="w-full"><Bot className="h-4 w-4" /> Abrir ZAYON AI</Button>
            </CardContent>
          </Card>
        );

      default: return null;
    }
  };

  const realRevenue = finance.length > 0
    ? finance.filter((f: any) => f.type === "revenue").reduce((acc: number, f: any) => acc + Number(f.amount), 0)
    : isMockModeClient
      ? 186320
      : 0;

  const realLeads = leads.length > 0
    ? leads.filter((l: any) => Number(l.score ?? 0) > 80).length
    : isMockModeClient
      ? 42
      : 0;

  const realDoingTasks = taskItems.filter((t: any) => t.status === "doing").length;

  const realPostedContent = content.length > 0
    ? content.filter((c: any) => c.status === "posted").length
    : isMockModeClient
      ? 138
      : 0;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={<span>Boa noite, <span className="text-primary">{user?.fullName?.split(" ")[0] || "Alex"}</span></span>}
        description={`Visão consolidada da operação. ${todayTasks.length} ações pendentes hoje · ${realLeads} leads quentes.`}
        badge={<Badge variant="primary">premium</Badge>}
        actions={
          <>
            {mounted && localStorage.getItem("zayon.dashboard.widgets") && (
              <Button variant="ghost" size="sm" onClick={handleResetLayout}>Restaurar Painel</Button>
            )}
            <Button variant="outline" size="sm"><Sparkles className="h-3.5 w-3.5" /> Personalizar</Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => openQuickCreate("task")}
            >
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Receita 30d" value={formatCurrency(realRevenue)} delta={18.4} icon={<CircleDollarSign className="h-4 w-4" />} accent="success" />
        <StatCard label="Leads quentes" value={String(realLeads)} delta={22.7} icon={<Target className="h-4 w-4" />} accent="primary" hint={`${realLeads} com score > 80`} />
        <StatCard label="Tarefas no doing" value={String(realDoingTasks)} delta={-4.2} icon={<ListChecks className="h-4 w-4" />} accent="info" />
        <StatCard label="Conteúdos publicados" value={String(realPostedContent)} delta={12.8} icon={<Flame className="h-4 w-4" />} accent="warning" hint="Consolidado" />
      </div>

      {!mounted ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEFAULT_WIDGETS.map((widget) => <div key={widget.id} className={widget.colSpan}>{renderWidgetContent(widget.id)}</div>)}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {widgets.map((widget) => (
                <div key={widget.id} className={widget.colSpan}>
                  <SortableWidget id={widget.id}>{renderWidgetContent(widget.id)}</SortableWidget>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
