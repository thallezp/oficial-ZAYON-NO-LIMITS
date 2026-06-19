"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, LayoutGrid, List as ListIcon, MoreVertical, Pencil, Trash2,
  Sparkles, FolderKanban, CheckCircle2, Activity, ListChecks, AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useProjects, usePersonas, useTasks,
  useUpdateProjectMutation, useDeleteProjectMutation,
} from "@/hooks/use-queries";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";
import { ProjectUpsertDialog } from "@/components/projects/project-upsert-dialog";
import { ProjectDetailSheet } from "@/components/projects/project-detail-sheet";
import {
  getProjectIcon, getProjectStatus, type ProjectStatus,
} from "@/components/projects/project-style";

type SortKey = "recent" | "progress" | "name" | "tasks";
type ViewMode = "grid" | "list";

export default function ProjectsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  useNewEntityShortcut("project");

  const { data: dbProjects = [] } = useProjects(activeWorkspaceId);
  const { data: personas = [] } = usePersonas(activeWorkspaceId);
  const { data: tasks = [] } = useTasks(activeWorkspaceId);
  const updateProject = useUpdateProjectMutation();
  const deleteProject = useDeleteProjectMutation();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [personaFilter, setPersonaFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("recent");
  const [view, setView] = React.useState<ViewMode>("grid");

  // Dialog / Sheet state
  const [upsertOpen, setUpsertOpen] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<any | null>(null);
  const [detailProject, setDetailProject] = React.useState<any | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  // Overdue por projeto (a partir das tarefas)
  const overdueByProject = React.useMemo(() => {
    const now = Date.now();
    const map = new Map<string, number>();
    tasks.forEach((t: any) => {
      if (!t.projectId || t.status === "done" || !t.dueAt) return;
      if (new Date(t.dueAt).getTime() < now) {
        map.set(t.projectId, (map.get(t.projectId) ?? 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  const personaName = (id?: string | null) =>
    id ? personas.find((p: any) => p.id === id)?.name ?? null : null;

  // Filtragem + ordenação
  const filtered = React.useMemo(() => {
    let list = [...dbProjects] as any[];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => (p.status ?? "active") === statusFilter);
    if (personaFilter !== "all") {
      list = personaFilter === "none"
        ? list.filter((p) => !p.personaId)
        : list.filter((p) => p.personaId === personaFilter);
    }
    list.sort((a, b) => {
      switch (sortKey) {
        case "progress": return (b.progress ?? 0) - (a.progress ?? 0);
        case "name": return (a.name ?? "").localeCompare(b.name ?? "");
        case "tasks": return (b.taskCount?.total ?? 0) - (a.taskCount?.total ?? 0);
        default: return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
    });
    return list;
  }, [dbProjects, search, statusFilter, personaFilter, sortKey]);

  // Stats globais
  const stats = React.useMemo(() => {
    const total = dbProjects.length;
    const active = dbProjects.filter((p: any) => (p.status ?? "active") === "active").length;
    const done = dbProjects.filter((p: any) => p.status === "done").length;
    const avg = total > 0 ? Math.round(dbProjects.reduce((a: number, p: any) => a + (p.progress ?? 0), 0) / total) : 0;
    const tasksDone = dbProjects.reduce((a: number, p: any) => a + (p.taskCount?.done ?? 0), 0);
    const tasksTotal = dbProjects.reduce((a: number, p: any) => a + (p.taskCount?.total ?? 0), 0);
    return { total, active, done, avg, tasksDone, tasksTotal };
  }, [dbProjects]);

  const openCreate = () => { setEditingProject(null); setUpsertOpen(true); };
  const openEdit = (p: any) => { setEditingProject(p); setUpsertOpen(true); setDetailOpen(false); };
  const openDetail = (p: any) => { setDetailProject(p); setDetailOpen(true); };

  const handleQuickStatus = (p: any, status: ProjectStatus) => {
    updateProject.mutate(
      { id: p.id, input: { status } },
      { onSuccess: () => toast.success(`Status alterado para "${getProjectStatus(status).label}"`) },
    );
  };

  const handleDelete = (p: any) => {
    if (!confirm(`Excluir o projeto "${p.name}"? As tarefas vinculadas serão desvinculadas (não apagadas).`)) return;
    deleteProject.mutate(p.id, {
      onSuccess: () => toast.success("Projeto excluído."),
      onError: (e: any) => toast.error(e.message ?? "Erro ao excluir projeto."),
    });
  };

  const hasProjects = dbProjects.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos"
        description="Iniciativas de longo prazo · podem ser globais ou vinculadas a uma persona."
        actions={
          <Button variant="gradient" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        }
      />

      {hasProjects && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Projetos" value={stats.total} icon={<FolderKanban className="h-4 w-4" />} accent="primary" hint={`${stats.active} ativos`} />
            <StatCard label="Progresso médio" value={`${stats.avg}%`} icon={<Activity className="h-4 w-4" />} accent="info" />
            <StatCard label="Tarefas concluídas" value={`${stats.tasksDone}/${stats.tasksTotal}`} icon={<CheckCircle2 className="h-4 w-4" />} accent="success" />
            <StatCard label="Concluídos" value={stats.done} icon={<CheckCircle2 className="h-4 w-4" />} accent="default" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
                <SelectItem value="done">Concluídos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas personas</SelectItem>
                <SelectItem value="none">Global</SelectItem>
                {personas.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="progress">Maior progresso</SelectItem>
                <SelectItem value="tasks">Mais tarefas</SelectItem>
                <SelectItem value="name">Nome (A–Z)</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5">
              <button
                onClick={() => setView("grid")}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition", view === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                title="Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn("flex h-7 w-7 items-center justify-center rounded-md transition", view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                title="Lista"
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Conteúdo */}
      {!hasProjects ? (
        <EmptyState
          icon={<FolderKanban className="h-6 w-6" />}
          title="Nenhum projeto ainda"
          description="Crie seu primeiro projeto para organizar iniciativas de longo prazo, vincular tarefas e acompanhar o progresso."
          action={
            <Button variant="gradient" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Criar primeiro projeto
            </Button>
          }
        />
      ) : !hasResults ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="Nenhum projeto encontrado"
          description="Ajuste a busca ou os filtros para ver seus projetos."
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              personaName={personaName(p.personaId)}
              overdue={overdueByProject.get(p.id) ?? 0}
              onOpen={() => openDetail(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p)}
              onStatus={(s) => handleQuickStatus(p, s)}
            />
          ))}
          <button
            onClick={openCreate}
            className="min-h-[180px] rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40"
          >
            <Plus className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Criar novo projeto</span>
            <Badge variant="ghost" size="sm">
              <Sparkles className="h-3 w-3" /> Personalize ícone e cor
            </Badge>
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card/40 divide-y divide-border/50">
          {filtered.map((p) => (
            <ProjectRow
              key={p.id}
              project={p}
              personaName={personaName(p.personaId)}
              overdue={overdueByProject.get(p.id) ?? 0}
              onOpen={() => openDetail(p)}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p)}
              onStatus={(s) => handleQuickStatus(p, s)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ProjectUpsertDialog
        open={upsertOpen}
        onOpenChange={setUpsertOpen}
        workspaceId={activeWorkspaceId}
        project={editingProject}
      />
      <ProjectDetailSheet
        project={detailProject}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        workspaceId={activeWorkspaceId}
        personaName={personaName(detailProject?.personaId)}
        onEdit={openEdit}
      />
    </div>
  );
}

// ── Card (grade) ──────────────────────────────────────────────────────────────
function ProjectCard({
  project: p, index, personaName, overdue, onOpen, onEdit, onDelete, onStatus,
}: {
  project: any; index: number; personaName: string | null; overdue: number;
  onOpen: () => void; onEdit: () => void; onDelete: () => void; onStatus: (s: ProjectStatus) => void;
}) {
  const Icon = getProjectIcon(p.icon);
  const status = getProjectStatus(p.status);
  const color = p.color ?? "#3b82f6";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3) }}
    >
      <div
        onClick={onOpen}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card hover:border-primary/40 transition"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
          style={{ background: `radial-gradient(at top right, ${color}22, transparent 60%)` }}
        />
        <div className="relative p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}30`, color }}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <Badge size="sm" variant={status.variant}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} /> {status.label}
              </Badge>
              <ProjectActions onEdit={onEdit} onDelete={onDelete} onStatus={onStatus} currentStatus={p.status} />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 min-h-[2rem]">
              {p.description || "Sem descrição."}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{p.progress ?? 0}%</span>
            </div>
            <Progress value={p.progress ?? 0} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {personaName && <Badge size="sm" variant="outline">{personaName}</Badge>}
              {overdue > 0 && (
                <Badge size="sm" variant="warning">
                  <AlertTriangle className="h-3 w-3" /> {overdue} em atraso
                </Badge>
              )}
            </div>
            <Badge size="sm" variant="outline">
              <ListChecks className="h-3 w-3" /> {p.taskCount?.done ?? 0}/{p.taskCount?.total ?? 0}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Row (lista) ───────────────────────────────────────────────────────────────
function ProjectRow({
  project: p, personaName, overdue, onOpen, onEdit, onDelete, onStatus,
}: {
  project: any; personaName: string | null; overdue: number;
  onOpen: () => void; onEdit: () => void; onDelete: () => void; onStatus: (s: ProjectStatus) => void;
}) {
  const Icon = getProjectIcon(p.icon);
  const status = getProjectStatus(p.status);
  const color = p.color ?? "#3b82f6";

  return (
    <div onClick={onOpen} className="group flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent transition">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}30`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{p.name}</p>
          <Badge size="sm" variant={status.variant}>{status.label}</Badge>
          {personaName && <Badge size="sm" variant="outline" className="hidden sm:inline-flex">{personaName}</Badge>}
        </div>
        {p.description && <p className="truncate text-xs text-muted-foreground mt-0.5">{p.description}</p>}
      </div>
      <div className="hidden md:flex w-32 items-center gap-2 shrink-0">
        <Progress value={p.progress ?? 0} className="h-1.5" />
        <span className="text-[10px] text-muted-foreground w-8 text-right">{p.progress ?? 0}%</span>
      </div>
      {overdue > 0 && (
        <Badge size="sm" variant="warning" className="hidden lg:inline-flex">
          <AlertTriangle className="h-3 w-3" /> {overdue}
        </Badge>
      )}
      <Badge size="sm" variant="outline" className="shrink-0">
        <ListChecks className="h-3 w-3" /> {p.taskCount?.done ?? 0}/{p.taskCount?.total ?? 0}
      </Badge>
      <span className="hidden lg:block text-[10px] text-muted-foreground shrink-0 w-20 text-right">
        {p.createdAt ? relativeTime(p.createdAt) : ""}
      </span>
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <ProjectActions onEdit={onEdit} onDelete={onDelete} onStatus={onStatus} currentStatus={p.status} />
      </div>
    </div>
  );
}

// ── Menu de ações ─────────────────────────────────────────────────────────────
function ProjectActions({
  onEdit, onDelete, onStatus, currentStatus,
}: {
  onEdit: () => void; onDelete: () => void; onStatus: (s: ProjectStatus) => void; currentStatus?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition" title="Ações">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" /> Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Mudar status</DropdownMenuLabel>
        {(["active", "paused", "done"] as ProjectStatus[]).map((s) => (
          <DropdownMenuItem key={s} onClick={() => onStatus(s)} disabled={currentStatus === s}>
            <span className={cn("h-1.5 w-1.5 rounded-full", getProjectStatus(s).dot)} />
            {getProjectStatus(s).label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
