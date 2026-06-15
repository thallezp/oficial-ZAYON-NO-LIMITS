"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyTracks, useDeleteStudyTrack } from "@/hooks/use-queries";
import { useRealtimeStudyTracks } from "@/hooks/use-realtime";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { UpsertTrackDialog } from "@/components/study/upsert-track-dialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const statusTranslations: Record<string, string> = {
  planned: "Planejado",
  active: "Ativo",
  paused: "Pausado",
  completed: "Concluído",
  archived: "Arquivado",
};

const statusVariants: Record<string, "outline" | "primary" | "warning" | "success" | "ghost"> = {
  planned: "outline",
  active: "primary",
  paused: "warning",
  completed: "success",
  archived: "ghost",
};

export default function StudyTracksPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const router = useRouter();

  const { data: tracks = [], isLoading } = useStudyTracks(activeWorkspaceId);
  const deleteTrackMutation = useDeleteStudyTrack();

  // Realtime updates
  useRealtimeStudyTracks(activeWorkspaceId ?? undefined);

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedTrack, setSelectedTrack] = React.useState<any | null>(null);

  const filteredTracks = React.useMemo(() => {
    return tracks.filter((t: any) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.area?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tracks, search, statusFilter]);

  const handleCreate = () => {
    setSelectedTrack(null);
    setDialogOpen(true);
  };

  const handleEdit = (track: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrack(track);
    setDialogOpen(true);
  };

  const handleDelete = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza de que deseja excluir esta trilha? Todos os módulos e submódulos vinculados serão apagados permanentemente.")) {
      try {
        await deleteTrackMutation.mutateAsync({ id: trackId });
        toast.success("Trilha excluída com sucesso.");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir trilha.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trilhas de Estudo"
        description="Acompanhe suas cadeiras, semestres ou trilhas de aprendizagem estruturadas em módulos e submódulos."
        actions={
          <Button variant="gradient" size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Nova Trilha
          </Button>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", "active", "planned", "paused", "completed", "archived"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-medium transition",
                statusFilter === st
                  ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                  : "border-border/60 bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              {st === "all" ? "Todos" : statusTranslations[st]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="animate-pulse border-border/40 bg-card/30">
              <CardContent className="h-48" />
            </Card>
          ))}
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-2xl bg-card/25 border-border/50">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold">Nenhuma trilha encontrada</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Comece criando uma nova trilha para estruturar seus estudos e registrar seu progresso.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleCreate}>
            <Plus className="h-3.5 w-3.5" /> Criar Primeira Trilha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((t: any) => {
            const hasDates = t.startDate || t.targetDate;
            const hoursDone = t.hoursDone || 0;
            const hoursTarget = t.hoursTarget || 0;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
                onClick={() => router.push(`/study/tracks/${t.id}`)}
                className="group relative cursor-pointer"
              >
                <Card className="h-full border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all flex flex-col shadow-sm">
                  {/* Linha decorativa de cor no topo */}
                  <div className={cn("h-1 w-full rounded-t-xl shrink-0", t.color || "bg-blue-500")} />

                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {t.area && (
                          <Badge variant="ghost" className="h-5 px-1.5 text-[10px] bg-muted/50 text-muted-foreground">
                            {t.area}
                          </Badge>
                        )}
                        <Badge variant={statusVariants[t.status] ?? "outline"} className="h-5 px-1.5 text-[10px] uppercase font-semibold">
                          {statusTranslations[t.status] || t.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-semibold group-hover:text-primary transition truncate pt-1">
                        {t.name}
                      </CardTitle>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEdit(t, e)}>
                          <Edit2 className="h-3.5 w-3.5 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => handleDelete(t.id, e)}>
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 flex-1 flex flex-col justify-between space-y-4">
                    {t.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 italic">Sem descrição.</p>
                    )}

                    <div className="space-y-3 shrink-0 pt-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground">
                          <span>PROGRESSO REAL</span>
                          <span>{t.progress}%</span>
                        </div>
                        <Progress value={t.progress} className="h-1.5" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40 pt-2.5">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {hoursDone}h <span className="text-[10px] text-muted-foreground/60">de {hoursTarget || "∞"}h</span>
                          </span>
                        </div>
                        {t.mode && (
                          <div className="flex items-center gap-1 font-medium text-[10px] bg-secondary/30 text-secondary-foreground rounded px-1.5 py-0.5 border border-border/40">
                            {t.mode}
                          </div>
                        )}
                      </div>

                      {hasDates && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {t.startDate ? new Date(t.startDate).toLocaleDateString("pt-BR") : "—"}
                            {" até "}
                            {t.targetDate ? new Date(t.targetDate).toLocaleDateString("pt-BR") : "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <UpsertTrackDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        track={selectedTrack}
      />
    </div>
  );
}
