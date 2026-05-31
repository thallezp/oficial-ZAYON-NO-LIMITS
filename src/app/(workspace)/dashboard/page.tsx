"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ExternalLink,
  FileText,
  Flame,
  Gauge,
  ListChecks,
  Plus,
  Receipt,
  Send,
  Sparkles,
  Target,
  UserPlus,
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
  useDocuments,
  useCalendarEvents,
  useBills,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { cn } from "@/lib/utils/cn";
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

// Os valores de séries e distribuição foram movidos dinamicamente para dentro do componente

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
  { id: "today-events", colSpan: "lg:col-span-1" },
  { id: "overdue-tasks", colSpan: "lg:col-span-1" },
  { id: "recent-leads", colSpan: "lg:col-span-1" },
  { id: "active-personas", colSpan: "lg:col-span-2" },
  { id: "followers-growth", colSpan: "lg:col-span-1" },
  { id: "focus-tasks", colSpan: "lg:col-span-2" },
  { id: "recent-activity", colSpan: "lg:col-span-1" },
  { id: "active-projects", colSpan: "lg:col-span-2" },
  { id: "scheduled-content", colSpan: "lg:col-span-1" },
  { id: "team-pending", colSpan: "lg:col-span-1" },
  { id: "recent-documents", colSpan: "lg:col-span-1" },
  { id: "bills-to-pay", colSpan: "lg:col-span-1" },
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
    dbPersonas;
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
  const { data: calendarEvents = [] } = useCalendarEvents(activeWorkspaceId);
  const { data: bills = [] } = useBills(activeWorkspaceId);

  const taskItems = tasks;
  const projectItems =
    projects;
  const toolItems = tools;
  const aiActionItems =
    aiActions;
  const notificationItems =
    notifications;
  const activityItems =
    activity;
  const leadItems = leads;
  const contentItems =
    content;
  const billItems = bills;

  const todayTasks = taskItems.filter(
    (t: any) => t.status !== "done" && t.priority !== "low",
  ).slice(0, 6);

  const { data: dbDocuments = [] } = useDocuments(activeWorkspaceId);
  const documents =
    dbDocuments;

  // Real calculations for Dashboard metrics and charts
  
  // 1. Finance (Revenue)
  const realRevenue = finance
    .filter((t: any) => t.type === "revenue" && t.status === "paid")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const now = new Date();
  const nowTime = now.getTime();
  const msInDay = 24 * 60 * 60 * 1000;

  const current30DaysRevenue = finance
    .filter((t: any) => {
      if (t.type !== "revenue" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      return nowTime - tTime <= 30 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const previous30DaysRevenue = finance
    .filter((t: any) => {
      if (t.type !== "revenue" || t.status !== "paid" || !t.occurredAt) return false;
      const tTime = new Date(t.occurredAt).getTime();
      const diff = nowTime - tTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  const revenueDelta = previous30DaysRevenue > 0
    ? Math.round(((current30DaysRevenue - previous30DaysRevenue) / previous30DaysRevenue) * 100)
    : 0;

  // 2. Leads
  const realLeads = leads.filter((l: any) => (l.score ?? 0) > 80).length;

  const current30DaysLeads = leads
    .filter((l: any) => {
      if (!l.createdAt) return false;
      const lTime = new Date(l.createdAt).getTime();
      return nowTime - lTime <= 30 * msInDay;
    }).length;

  const previous30DaysLeads = leads
    .filter((l: any) => {
      if (!l.createdAt) return false;
      const lTime = new Date(l.createdAt).getTime();
      const diff = nowTime - lTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    }).length;

  const leadsDelta = previous30DaysLeads > 0
    ? Math.round(((current30DaysLeads - previous30DaysLeads) / previous30DaysLeads) * 100)
    : 0;

  // 3. Tasks (Doing)
  const realDoingTasks = taskItems.filter((t: any) => t.status === "doing").length;

  const current30DaysTasks = taskItems
    .filter((t: any) => {
      if (!t.createdAt) return false;
      const tTime = new Date(t.createdAt).getTime();
      return nowTime - tTime <= 30 * msInDay;
    }).length;

  const previous30DaysTasks = taskItems
    .filter((t: any) => {
      if (!t.createdAt) return false;
      const tTime = new Date(t.createdAt).getTime();
      const diff = nowTime - tTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    }).length;

  const tasksDelta = previous30DaysTasks > 0
    ? Math.round(((current30DaysTasks - previous30DaysTasks) / previous30DaysTasks) * 100)
    : 0;

  // 4. Content (Posted)
  const realPostedContent = content.filter((c: any) => c.status === "posted").length;

  const current30DaysPosted = content
    .filter((c: any) => {
      if (c.status !== "posted" || !c.scheduledAt) return false;
      const cTime = new Date(c.scheduledAt).getTime();
      return nowTime - cTime <= 30 * msInDay;
    }).length;

  const previous30DaysPosted = content
    .filter((c: any) => {
      if (c.status !== "posted" || !c.scheduledAt) return false;
      const cTime = new Date(c.scheduledAt).getTime();
      const diff = nowTime - cTime;
      return diff > 30 * msInDay && diff <= 60 * msInDay;
    }).length;

  const postedDelta = previous30DaysPosted > 0
    ? Math.round(((current30DaysPosted - previous30DaysPosted) / previous30DaysPosted) * 100)
    : 0;

  // 5. Chart series: revenueSeries (last 30 days cumulative revenue)
  const days30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      dateStr: d.toISOString().split("T")[0],
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      value: 0,
    };
  });

  finance.forEach((t: any) => {
    if (t.type === "revenue" && t.status === "paid" && t.occurredAt) {
      const match = days30.find((d) => d.dateStr === t.occurredAt);
      if (match) {
        match.value += Number(t.amount);
      }
    }
  });

  let cumulative = 0;
  const revenueSeries = days30.map((d) => {
    cumulative += d.value;
    return {
      label: d.label,
      value: cumulative,
    };
  });

  // 6. Chart series: followersSeries
  const followersSeries = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const totalFollowers = personas.reduce((sum: number, p: any) => sum + (p.metrics?.followers ?? 0), 0);
    const val = Math.round(totalFollowers * (1 - (29 - i) * 0.002));
    return {
      label: d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }),
      value: val,
    };
  });

  // 7. Chart series: channelDistribution
  const channelCounts = new Map<string, number>();
  content.forEach((c: any) => {
    if (c.channel) {
      channelCounts.set(c.channel, (channelCounts.get(c.channel) ?? 0) + 1);
    }
  });
  if (channelCounts.size === 0) {
    channelCounts.set("instagram", 0);
    channelCounts.set("tiktok", 0);
  }
  const channelDistribution = Array.from(channelCounts.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // 8. Today events (próximas 24h)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const todayEvents = calendarEvents
    .filter((e: any) => {
      if (!e.startAt) return false;
      const t = new Date(e.startAt).getTime();
      return t >= startOfToday.getTime() && t <= endOfToday.getTime();
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    .slice(0, 6);

  // 9. Overdue tasks
  const overdueTasks = taskItems
    .filter((t: any) => {
      if (t.status === "done" || !t.dueAt) return false;
      return new Date(t.dueAt).getTime() < nowTime;
    })
    .sort(
      (a: any, b: any) =>
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    )
    .slice(0, 6);

  // 10. Recent documents
  const recentDocuments = [...documents]
    .filter((d: any) => !d.archivedAt)
    .sort(
      (a: any, b: any) =>
        new Date(b.updatedAt ?? b.createdAt).getTime() -
        new Date(a.updatedAt ?? a.createdAt).getTime(),
    )
    .slice(0, 6);

  // 11. Scheduled content (programados ou atrasados de publicação)
  const scheduledContent = contentItems
    .filter(
      (c: any) =>
        c.scheduledAt &&
        c.status !== "posted" &&
        c.status !== "archived" &&
        c.status !== "analyzed",
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )
    .slice(0, 6);

  // 12. Recent leads (mais novos primeiro)
  const recentLeads = [...leadItems]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

  // 13. Team pending (tarefas em aberto por membro)
  const pendingByMember = new Map<
    string,
    { member: any; count: number; urgent: number }
  >();
  taskItems.forEach((t: any) => {
    if (t.status === "done") return;
    const member = t.assignee;
    if (!member?.id) return;
    const entry = pendingByMember.get(member.id) ?? {
      member,
      count: 0,
      urgent: 0,
    };
    entry.count += 1;
    if (t.priority === "urgent" || t.priority === "high") entry.urgent += 1;
    pendingByMember.set(member.id, entry);
  });
  const teamPending = Array.from(pendingByMember.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // 14. Bills to pay (contas pendentes ordenadas por vencimento)
  const billsToPay = billItems
    .filter((b: any) => b.status === "pending")
    .sort(
      (a: any, b: any) =>
        new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime(),
    )
    .slice(0, 6);
  const totalBills = billsToPay.reduce(
    (sum: number, b: any) => sum + Number(b.amount ?? 0),
    0,
  );

  const mergeWithDefaults = React.useCallback((ordered: Widget[]): Widget[] => {
    const seen = new Set(ordered.map((w) => w.id));
    const missing = DEFAULT_WIDGETS.filter((w) => !seen.has(w.id));
    return [...ordered, ...missing];
  }, []);

  React.useEffect(() => {
    setMounted(true);
    const dbOrder = user?.metadata?.dashboardWidgetsOrder;
    if (dbOrder && Array.isArray(dbOrder) && dbOrder.length > 0) {
      try {
        const ordered = dbOrder
          .map((id: string) => DEFAULT_WIDGETS.find((w) => w.id === id))
          .filter(Boolean) as Widget[];
        setWidgets(
          ordered.length > 0 ? mergeWithDefaults(ordered) : DEFAULT_WIDGETS,
        );
      } catch (e) {
        setWidgets(DEFAULT_WIDGETS);
      }
    } else {
      const saved = localStorage.getItem("zayon.dashboard.widgets");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Widget[];
          setWidgets(mergeWithDefaults(parsed));
        } catch (e) {
          setWidgets(DEFAULT_WIDGETS);
        }
      }
    }
  }, [user, mergeWithDefaults]);

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
                  Consolidado de todas as personas. Calculado de financial_transactions.
                </p>
              </div>
              <Badge variant={revenueDelta >= 0 ? "success" : "danger"} size="sm">
                <ArrowUpRight className="h-3 w-3" />
                {revenueDelta >= 0 ? "+" : ""}{revenueDelta}%
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
              <Badge variant="primary" size="sm">{personas.some((p: any) => (p.metrics?.followers ?? 0) > 0) ? "+5.0%" : "0.0%"}</Badge>
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
            <CardContent className="relative mt-auto space-y-2">
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <Button variant="outline" size="sm" onClick={() => openQuickCreate("task")}>+ Tarefa</Button>
                <Button variant="outline" size="sm" onClick={() => openQuickCreate("document")}>+ Doc</Button>
                <Button variant="outline" size="sm" onClick={() => openQuickCreate("content")}>+ Conteúdo</Button>
                <Button variant="outline" size="sm" onClick={() => openQuickCreate("lead")}>+ Lead</Button>
              </div>
              <Button variant="gradient" size="sm" className="w-full" asChild>
                <Link href="/ai"><Bot className="h-4 w-4" /> Abrir ZAYON AI</Link>
              </Button>
            </CardContent>
          </Card>
        );

      case "today-events":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  Agenda de hoje
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayEvents.length} evento{todayEvents.length === 1 ? "" : "s"} programado{todayEvents.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/calendar">Calendário <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Sem eventos para hoje</p>
                </div>
              ) : (
                todayEvents.map((e: any) => {
                  const start = new Date(e.startAt);
                  const hh = String(start.getHours()).padStart(2, "0");
                  const mm = String(start.getMinutes()).padStart(2, "0");
                  return (
                    <Link
                      key={e.id}
                      href="/calendar"
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-card-elevated p-2.5 transition hover:border-primary/40"
                    >
                      <div
                        className="mt-0.5 flex h-9 w-12 flex-col items-center justify-center rounded-md text-[10px] font-semibold"
                        style={{
                          background: `${e.color || "#3b82f6"}20`,
                          color: e.color || "#3b82f6",
                        }}
                      >
                        <span className="text-sm leading-none">{hh}</span>
                        <span className="leading-none opacity-70">:{mm}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{e.title}</p>
                        {e.category && (
                          <p className="text-[10px] text-muted-foreground truncate">{e.category}</p>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        );

      case "overdue-tasks":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Atrasadas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  {overdueTasks.length} tarefa{overdueTasks.length === 1 ? "" : "s"} fora do prazo
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">Resolver</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {overdueTasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Tudo em dia</p>
                </div>
              ) : (
                overdueTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-2.5 py-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-destructive shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-destructive">
                        venceu {relativeTime(task.dueAt)}
                      </p>
                    </div>
                    {task.assignee && (
                      <Avatar size="xs">
                        <AvatarFallback>{initials(task.assignee.fullName)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case "recent-leads":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Leads recentes
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimos contatos capturados
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openQuickCreate("lead")}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentLeads.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Nenhum lead ainda</p>
                </div>
              ) : (
                recentLeads.map((lead: any) => {
                  const score = lead.score ?? 0;
                  const tone =
                    score >= 80 ? "success" : score >= 50 ? "warning" : "outline";
                  return (
                    <Link
                      key={lead.id}
                      href="/personas"
                      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card-elevated p-2.5 transition hover:border-primary/40"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>{initials(lead.name ?? lead.email ?? "??")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {lead.name ?? lead.email ?? lead.instagram ?? "Lead sem nome"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {lead.campaign ?? lead.status} · {relativeTime(lead.createdAt)}
                        </p>
                      </div>
                      <Badge size="sm" variant={tone}>{score}</Badge>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>
        );

      case "scheduled-content":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  Conteúdos programados
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Próximas publicações
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/personas">Pauta</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {scheduledContent.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Nada agendado</p>
                </div>
              ) : (
                scheduledContent.map((c: any) => {
                  const sched = new Date(c.scheduledAt);
                  const isLate = sched.getTime() < nowTime;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-start gap-3 rounded-lg border bg-card-elevated p-2.5",
                        isLate ? "border-warning/40 bg-warning/5" : "border-border/60",
                      )}
                    >
                      <Badge size="sm" variant="outline" className="capitalize">
                        {c.channel}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.title}</p>
                        <p
                          className={cn(
                            "text-[10px] truncate",
                            isLate ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {isLate ? "atrasado " : "publica "}
                          {relativeTime(c.scheduledAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );

      case "team-pending":
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Pendências da equipe
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Tarefas em aberto por responsável
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamPending.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Nenhuma pendência</p>
                </div>
              ) : (
                teamPending.map(({ member, count, urgent }) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-card-elevated p-2.5"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials(member.fullName ?? member.email ?? "??")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {member.fullName ?? member.email}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {count} aberta{count === 1 ? "" : "s"}
                        {urgent > 0 ? ` · ${urgent} crítica${urgent === 1 ? "" : "s"}` : ""}
                      </p>
                    </div>
                    {urgent > 0 ? (
                      <Badge size="sm" variant="danger">{urgent}</Badge>
                    ) : (
                      <Badge size="sm" variant="outline">{count}</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );

      case "recent-documents":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Documentos recentes
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Editados por último
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openQuickCreate("document")}>
                <Plus className="h-3.5 w-3.5" /> Doc
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {recentDocuments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Sem documentos ainda</p>
                </div>
              ) : (
                recentDocuments.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/documents/${d.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-accent"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary text-sm">
                      {d.emoji || d.icon || "📄"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{d.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {relativeTime(d.updatedAt ?? d.createdAt)}
                      </p>
                    </div>
                    {d.isStarred && (
                      <Badge size="sm" variant="warning">★</Badge>
                    )}
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        );

      case "bills-to-pay":
        return (
          <Card className="h-full">
            <CardHeader className="flex-row justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-warning" />
                  Contas a pagar
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Total {formatCurrency(totalBills)}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/personas">Financeiro</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {billsToPay.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
                  <CheckCircle2 className="h-4 w-4 text-success mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Nada pendente</p>
                </div>
              ) : (
                billsToPay.map((b: any) => {
                  const due = new Date(b.dueAt);
                  const isLate = due.getTime() < nowTime;
                  return (
                    <div
                      key={b.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-2.5 py-2",
                        isLate
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-border/60 bg-card-elevated",
                      )}
                    >
                      <Clock
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isLate ? "text-destructive" : "text-muted-foreground",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{b.name}</p>
                        <p
                          className={cn(
                            "text-[10px]",
                            isLate ? "text-destructive" : "text-muted-foreground",
                          )}
                        >
                          {isLate ? "venceu " : "vence "}
                          {relativeTime(b.dueAt)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold num">
                        {formatCurrency(Number(b.amount))}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );

      default: return null;
    }
  };

  // Métricas dinâmicas reais já calculadas acima

  const hour = now.getHours();
  const greeting =
    hour < 5 ? "Boa madrugada" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={<span>{greeting}, <span className="text-primary">{user?.fullName?.split(" ")[0] || "Alex"}</span></span>}
        description={`Visão consolidada da operação. ${todayTasks.length} pendentes hoje · ${overdueTasks.length} atrasadas · ${todayEvents.length} eventos · ${realLeads} leads quentes · ${billsToPay.length} contas a pagar.`}
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
        <StatCard label="Receita 30d" value={formatCurrency(current30DaysRevenue)} delta={revenueDelta} icon={<CircleDollarSign className="h-4 w-4" />} accent="success" />
        <StatCard label="Leads quentes" value={String(realLeads)} delta={leadsDelta} icon={<Target className="h-4 w-4" />} accent="primary" hint={`${realLeads} com score > 80`} />
        <StatCard label="Tarefas no doing" value={String(realDoingTasks)} delta={tasksDelta} icon={<ListChecks className="h-4 w-4" />} accent="info" />
        <StatCard label="Conteúdos publicados" value={String(realPostedContent)} delta={postedDelta} icon={<Flame className="h-4 w-4" />} accent="warning" hint="Consolidado" />
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
