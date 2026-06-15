"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useStudyResources,
  useDeleteStudyResource,
  useSetResourceStatus,
  useSetResourceProgress,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/tables/data-table";
import { UpsertResourceDialog } from "@/components/study/upsert-resource-dialog";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  BookOpen,
  Star,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  Bookmark,
  Languages,
  Calendar,
  Layers,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const resourceTypeTranslations: Record<string, string> = {
  book: "Livro",
  course: "Curso",
  video: "Vídeo",
  article: "Artigo",
  pdf: "PDF",
  doc: "Documento",
  other: "Outro",
};

const resourceStatusTranslations: Record<string, string> = {
  backlog: "Na Fila",
  reading: "Consumindo",
  completed: "Concluído",
  abandoned: "Abandonado",
};

const resourceStatusVariants: Record<string, "outline" | "primary" | "warning" | "success" | "ghost"> = {
  backlog: "outline",
  reading: "primary",
  completed: "success",
  abandoned: "ghost",
};

const typeColors: Record<string, string> = {
  book: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  course: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  video: "bg-red-500/10 text-red-500 border-red-500/20",
  article: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pdf: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  doc: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  other: "bg-muted text-muted-foreground border-border/40",
};

export default function StudyLibraryPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useStudyResources(activeWorkspaceId);
  const deleteResourceMutation = useDeleteStudyResource();
  const setStatusMutation = useSetResourceStatus();
  const setProgressMutation = useSetResourceProgress();

  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedResource, setSelectedResource] = React.useState<any | null>(null);

  const filteredResources = React.useMemo(() => {
    return resources.filter((r: any) => {
      const matchesSearch =
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        r.authors?.toLowerCase().includes(search.toLowerCase()) ||
        r.area?.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [resources, search, typeFilter, statusFilter]);

  const handleCreate = () => {
    setSelectedResource(null);
    setDialogOpen(true);
  };

  const handleEdit = (resource: any) => {
    setSelectedResource(resource);
    setDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (confirm("Tem certeza de que deseja excluir este recurso?")) {
      try {
        await deleteResourceMutation.mutateAsync({ id: resourceId });
        toast.success("Recurso excluído com sucesso.");
      } catch (error: any) {
        toast.error("Erro ao excluir recurso.");
      }
    }
  };

  const handleUpdatePageProgress = async (resourceId: string, current: number, total: number, increment: number) => {
    const nextVal = Math.min(total, Math.max(0, current + increment));
    try {
      await setProgressMutation.mutateAsync({ id: resourceId, currentPage: nextVal });
      toast.success(`Progresso atualizado: pág. ${nextVal}/${total}`);
    } catch (error: any) {
      toast.error("Erro ao atualizar progresso.");
    }
  };

  const handleToggleStatus = async (resourceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "reading" : "completed";
    try {
      await setStatusMutation.mutateAsync({ id: resourceId, status: nextStatus });
      toast.success(`Status atualizado para: ${resourceStatusTranslations[nextStatus]}`);
    } catch (error: any) {
      toast.error("Erro ao atualizar status.");
    }
  };

  // Table Columns Setup
  const tableColumns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Recurso",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              {r.coverUrl ? (
                <img
                  src={r.coverUrl}
                  alt={r.title}
                  className="w-8 h-10 object-cover rounded shadow-sm shrink-0 border border-border/40"
                />
              ) : (
                <div className="w-8 h-10 rounded bg-gradient-to-br from-indigo-900 to-slate-900 border border-border/40 shrink-0 flex items-center justify-center text-[7px] text-white/80 font-bold p-0.5 text-center leading-none uppercase">
                  {r.title.slice(0, 10)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{r.title}</p>
                {r.authors && <p className="text-[10px] text-muted-foreground truncate">{r.authors}</p>}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ getValue }) => {
          const t = getValue<string>();
          return (
            <Badge variant="outline" className={typeColors[t]}>
              {resourceTypeTranslations[t] || t}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<string>();
          return (
            <Badge variant={resourceStatusVariants[s] ?? "outline"} className="uppercase text-[9px] font-bold">
              {resourceStatusTranslations[s] || s}
            </Badge>
          );
        },
      },
      {
        accessorKey: "area",
        header: "Área",
        cell: ({ getValue }) => {
          const a = getValue<string | undefined>();
          return <span className="text-xs text-muted-foreground">{a || "—"}</span>;
        },
      },
      {
        accessorKey: "progress",
        header: "Progresso",
        cell: ({ row }) => {
          const r = row.original;
          if (r.type === "book" && r.pages) {
            const pct = Math.round((r.currentPage / r.pages) * 100);
            return (
              <div className="w-32 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{r.currentPage}/{r.pages} pgs</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1" />
              </div>
            );
          }
          return <span className="text-xs text-muted-foreground">{r.hoursDone ? `${r.hoursDone}h ded.` : "—"}</span>;
        },
      },
      {
        accessorKey: "rating",
        header: "Avaliação",
        cell: ({ getValue }) => {
          const rat = getValue<number | undefined>();
          if (!rat) return <span className="text-muted-foreground text-xs">—</span>;
          return (
            <div className="flex items-center text-amber-400 gap-0.5">
              {Array.from({ length: rat }).map((_, idx) => (
                <Star key={idx} className="h-3 w-3 fill-current" />
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(r)} title="Editar">
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => handleDelete(r.id)} title="Excluir">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete, handleEdit]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca & Recursos"
        description="Gerencie seus livros, cursos, apostilas e documentações, controlando o progresso de leitura e horas dedicadas."
        actions={
          <>
            <div className="flex items-center border border-border/60 rounded-lg p-0.5 bg-muted/30">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("table")}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="gradient" size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4" /> Novo Recurso
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, autor, assunto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Tipo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="book">Livros</SelectItem>
              <SelectItem value="course">Cursos</SelectItem>
              <SelectItem value="video">Vídeos</SelectItem>
              <SelectItem value="article">Artigos</SelectItem>
              <SelectItem value="pdf">PDFs</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9 text-xs">
              <SelectValue placeholder="Status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="backlog">Na Fila</SelectItem>
              <SelectItem value="reading">Consumindo</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="abandoned">Abandonados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="animate-pulse border-border/40 bg-card/30">
              <CardContent className="h-56" />
            </Card>
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl bg-card/25 border-border/50">
          <Bookmark className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-semibold">Nenhum recurso encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Alimente sua biblioteca com materiais de estudo para acompanhar seu aprendizado.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Primeiro Recurso
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredResources.map((r: any) => {
            const isBook = r.type === "book";
            const progressPercent = isBook && r.pages ? Math.round((r.currentPage / r.pages) * 100) : 0;
            const completed = r.status === "completed";

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative flex flex-col justify-between"
              >
                <Card className="h-full border-border/60 bg-card/50 overflow-hidden hover:border-primary/40 transition flex flex-col justify-between shadow-sm">
                  {/* Container da Capa (Capa real ou fallback gradiente premium) */}
                  <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden bg-muted border-b border-border/40">
                    {r.coverUrl ? (
                      <img
                        src={r.coverUrl}
                        alt={r.title}
                        className="w-full h-full object-cover transition-all group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-3 flex flex-col justify-between text-left select-none transition-all group-hover:brightness-110">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold tracking-widest text-primary uppercase bg-primary/10 border border-primary/20 px-1 py-0.5 rounded">
                            {resourceTypeTranslations[r.type] || r.type}
                          </span>
                          <p className="text-xs font-bold text-white leading-tight line-clamp-4 pt-1">
                            {r.title}
                          </p>
                        </div>
                        {r.authors && (
                          <p className="text-[9px] text-muted-foreground truncate font-medium">
                            {r.authors}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Overlay de Ações Rápidas no Hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon-sm" className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm border border-border/60">
                            <MoreVertical className="h-4.5 w-4.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-28">
                          <DropdownMenuItem onClick={() => handleEdit(r)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Badges rápidos na capa */}
                    <div className="absolute bottom-2 left-2 flex gap-1">
                      <Badge variant={resourceStatusVariants[r.status]} className="h-4.5 px-1 text-[8px] uppercase font-bold tracking-wider">
                        {resourceStatusTranslations[r.status]}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-semibold text-xs truncate leading-tight group-hover:text-primary transition" title={r.title}>
                        {r.title}
                      </h4>
                      {r.authors && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {r.authors}
                        </p>
                      )}
                    </div>

                    {/* Se for livro, controle de páginas */}
                    {isBook && r.pages ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleUpdatePageProgress(r.id, r.currentPage, r.pages, -10)}
                              className="hover:text-foreground hover:bg-muted p-0.5 rounded transition text-[11px] font-bold"
                              title="Recuar 10 págs"
                            >
                              -10
                            </button>
                            <span>{r.currentPage}/{r.pages} pgs</span>
                            <button
                              onClick={() => handleUpdatePageProgress(r.id, r.currentPage, r.pages, 10)}
                              className="hover:text-foreground hover:bg-muted p-0.5 rounded transition text-[11px] font-bold"
                              title="Avançar 10 págs"
                            >
                              +10
                            </button>
                          </div>
                          <span className="font-semibold">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-1" />
                      </div>
                    ) : (
                      <div className="text-[9px] text-muted-foreground flex justify-between pt-1">
                        <span>Horas: <strong>{r.hoursDone || 0}h</strong></span>
                        {r.link && (
                          <a href={r.link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                            Acessar <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Detalhes extras, tags e rating */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-[9px] text-muted-foreground/60 shrink-0">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {r.rating ? (
                          <>
                            <Star className="h-3 w-3 fill-current" />
                            <span className="font-semibold text-foreground text-[10px]">{r.rating}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground/40 italic">Sem nota</span>
                        )}
                      </div>

                      {r.fileUrl && (
                        <a
                          href={r.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-primary hover:underline flex items-center gap-0.5"
                          title="Abrir PDF/Material"
                        >
                          Material <Bookmark className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <DataTable
          data={filteredResources}
          columns={tableColumns}
          searchPlaceholder="Buscar na biblioteca..."
          enableSelection={false}
          pageSize={12}
        />
      )}

      <UpsertResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        resource={selectedResource}
      />
    </div>
  );
}
