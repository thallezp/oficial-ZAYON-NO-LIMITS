"use client";

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
import {
  MOCK_TASKS,
  MOCK_PROJECTS,
  MOCK_ACTIVITY,
  MOCK_AI_ACTIONS,
  MOCK_TOOLS,
  MOCK_NOTIFICATIONS,
  MOCK_PERSONAS,
} from "@/data";
import { formatCompact, formatCurrency, initials, relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

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

export default function DashboardPage() {
  const todayTasks = MOCK_TASKS.filter(
    (t) => t.status !== "done" && t.priority !== "low",
  ).slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span>
            Boa noite, <span className="text-primary">Alex</span>
          </span>
        }
        description="Visão consolidada da operação. 8 ações pendentes hoje · 2 leads quentes · 1 conta atrasada."
        badge={<Badge variant="primary">premium</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Personalizar
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Novo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Receita 30d"
          value={formatCurrency(186_320)}
          delta={18.4}
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent="success"
        />
        <StatCard
          label="Leads quentes"
          value="42"
          delta={22.7}
          icon={<Target className="h-4 w-4" />}
          accent="primary"
          hint="14 com score > 80"
        />
        <StatCard
          label="Tarefas no doing"
          value={String(MOCK_TASKS.filter((t) => t.status === "doing").length)}
          delta={-4.2}
          icon={<ListChecks className="h-4 w-4" />}
          accent="info"
        />
        <StatCard
          label="Conteúdos publicados"
          value="138"
          delta={12.8}
          icon={<Flame className="h-4 w-4" />}
          accent="warning"
          hint="6 desta semana"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="elevated" className="lg:col-span-2">
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
            <AreaChart
              data={revenueSeries}
              color="#22c55e"
              formatter={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por canal</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              % do volume publicado em 30 dias.
            </p>
          </CardHeader>
          <CardContent>
            <PieChart data={channelDistribution} height={260} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Personas ativas</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Cada persona é uma unidade de negócio independente.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/personas/p_aurora/overview">
                Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {MOCK_PERSONAS.map((p) => (
              <Link
                key={p.id}
                href={`/personas/${p.id}/overview`}
                className="group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated p-4 transition hover:border-primary/40"
              >
                <div
                  className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(at top right, ${p.accent}30, transparent 60%)`,
                  }}
                />
                <div className="relative flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-glow"
                    style={{
                      background: `linear-gradient(135deg, ${p.accent}, #2a3ef5)`,
                    }}
                  >
                    {initials(p.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{p.name}</p>
                      <Badge
                        size="sm"
                        variant={
                          p.status === "active"
                            ? "success"
                            : p.status === "building"
                              ? "warning"
                              : "outline"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {p.niche}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-medium num">
                          {formatCompact(p.metrics?.revenuePeriod ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Seguidores</p>
                        <p className="font-medium num">
                          {formatCompact(p.metrics?.followers ?? 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Leads</p>
                        <p className="font-medium num">
                          {p.metrics?.leads ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Crescimento de seguidores</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Total consolidado · 30 dias.
              </p>
            </div>
            <Badge variant="primary" size="sm">+4.2%</Badge>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={followersSeries}
              color="#5b8cff"
              formatter={(v) => formatCompact(v)}
              height={260}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Tarefas em foco</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Prioridade alta ou urgente · não concluídas.
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-accent"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    task.priority === "urgent" && "bg-destructive animate-pulse",
                    task.priority === "high" && "bg-warning",
                    task.priority === "medium" && "bg-primary",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{task.title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {task.labels?.map((l) => (
                      <Badge key={l} size="sm" variant="ghost">
                        {l}
                      </Badge>
                    ))}
                    {task.dueAt && (
                      <span className="ml-auto">{relativeTime(task.dueAt)}</span>
                    )}
                  </div>
                </div>
                <Badge size="sm" variant={statusColor[task.status as keyof typeof statusColor] ?? "outline"}>
                  {task.status}
                </Badge>
                {task.assignee && (
                  <Avatar size="xs">
                    <AvatarFallback>
                      {initials(task.assignee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade recente</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Equipe + IA</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_ACTIVITY.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {a.actor ? (
                  <Avatar size="sm">
                    <AvatarFallback>{initials(a.actor.fullName)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-gradient-to-br from-brand-500/40 to-brand-700/40 text-white">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-relaxed">
                    <span className="font-medium">
                      {a.actor?.fullName ?? "NEXUS AI"}
                    </span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  {a.payload && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {Object.values(a.payload).join(" · ")}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {relativeTime(a.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Projetos ativos</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {MOCK_PROJECTS.length} projetos em execução
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {MOCK_PROJECTS.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-card-elevated p-3"
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                  style={{ background: `${p.color}40`, color: p.color }}
                >
                  <Gauge className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <Badge size="sm" variant="outline">
                      {p.taskCount?.done}/{p.taskCount?.total}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.description}
                  </p>
                  <Progress value={p.progress} className="mt-2 h-1" />
                </div>
                <div className="flex -space-x-2">
                  {p.members?.slice(0, 3).map((m) => (
                    <Avatar key={m.id} size="xs" className="ring-2 ring-card">
                      <AvatarFallback>{initials(m.fullName)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row justify-between">
            <div>
              <CardTitle>Ferramentas favoritas</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Acesso rápido
              </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tools">Hub <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {MOCK_TOOLS.filter((t) => t.isFavorite)
              .slice(0, 9)
              .map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col items-center gap-1.5 rounded-lg border border-border/60 bg-card-elevated p-2.5 transition hover:border-primary/40"
                  title={tool.name}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: tool.brandColor ?? "#5b8cff" }}
                  >
                    {tool.name[0]}
                  </div>
                  <span className="text-[10px] truncate w-full text-center text-muted-foreground group-hover:text-foreground">
                    {tool.name}
                  </span>
                </a>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações da IA (24h)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_AI_ACTIONS.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-card-elevated p-2.5"
              >
                <div className="mt-0.5">
                  {a.status === "completed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <span className="block h-3.5 w-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{a.name}</p>
                  {a.description && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {a.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_NOTIFICATIONS.slice(0, 5).map((n) => (
              <Link
                key={n.id}
                href={n.href ?? "#"}
                className="block rounded-lg border border-border/60 bg-card-elevated p-2.5 hover:border-primary/40"
              >
                <p className="text-xs font-medium">{n.title}</p>
                {n.body && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {n.body}
                  </p>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card variant="glass" className="relative overflow-hidden">
          <div className="absolute inset-0 mesh-bg opacity-60" />
          <CardHeader className="relative">
            <Badge variant="primary" size="sm" className="w-fit">
              <Sparkles className="h-3 w-3" /> IA contextual
            </Badge>
            <CardTitle className="mt-2">Pronto para acelerar?</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Diga o que precisa que a IA executa no sistema · roteiros, copy,
              qualificação de leads, calendário, funis.
            </p>
          </CardHeader>
          <CardContent className="relative">
            <Button variant="gradient" size="sm" className="w-full">
              <Bot className="h-4 w-4" /> Abrir NEXUS AI
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
