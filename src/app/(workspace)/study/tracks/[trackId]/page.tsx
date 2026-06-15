"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useStudyStore } from "@/stores/study-store";
import {
  useStudyTracks,
  useUpsertStudyModule,
  useDeleteStudyModule,
  useDeleteModuleItem,
  useReorderModuleItems,
  useSetItemStatus,
} from "@/hooks/use-queries";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtimeStudyTracks } from "@/hooks/use-realtime";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronLeft,
  Plus,
  Play,
  Edit2,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  BookOpen,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Dialog imports
import { UpsertTrackDialog } from "@/components/study/upsert-track-dialog";
import { UpsertModuleDialog } from "@/components/study/upsert-module-dialog";
import { UpsertModuleItemDialog } from "@/components/study/upsert-module-item-dialog";

export default function TrackDetailPage() {
  const { trackId } = useParams() as { trackId: string };
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useStudyTracks(activeWorkspaceId);
  const track = React.useMemo(() => tracks.find((t: any) => t.id === trackId), [tracks, trackId]);

  // Realtime updates
  useRealtimeStudyTracks(activeWorkspaceId ?? undefined);

  // Mutations
  const deleteModuleMutation = useDeleteStudyModule();
  const deleteItemMutation = useDeleteModuleItem();
  const reorderItemsMutation = useReorderModuleItems();
  const setItemStatusMutation = useSetItemStatus();

  // Dialog states
  const [trackDialogOpen, setTrackDialogOpen] = React.useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = React.useState(false);
  const [selectedModule, setSelectedModule] = React.useState<any | null>(null);

  const [itemDialogOpen, setItemDialogOpen] = React.useState(false);
  const [activeModuleIdForNewItem, setActiveModuleIdForNewItem] = React.useState<string>("");
  const [selectedItem, setSelectedItem] = React.useState<any | null>(null);

  // Collapse/Expand state for modules
  const [expandedModules, setExpandedModules] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (track?.modules) {
      // Default to expanded for modules that are not completed
      const initial: Record<string, boolean> = {};
      track.modules.forEach((m: any) => {
        initial[m.id] = m.status !== "completed";
      });
      setExpandedModules((prev) => ({ ...initial, ...prev }));
    }
  }, [track]);

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="text-center py-16">
        <p className="text-lg font-semibold">Trilha não encontrada</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/study/tracks")}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Voltar para Trilhas
        </Button>
      </div>
    );
  }

  // DND Drag End Handler
  const handleDragEnd = async (event: any, moduleId: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const moduleObj = track.modules.find((m: any) => m.id === moduleId);
    if (!moduleObj) return;

    const oldIndex = moduleObj.items.findIndex((item: any) => item.id === active.id);
    const newIndex = moduleObj.items.findIndex((item: any) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistically reorder client state in React Query cache
    const reorderedItems = arrayMove(moduleObj.items, oldIndex, newIndex);
    
    // Build array of new positions
    const payloadItems = reorderedItems.map((item: any, idx: number) => ({
      id: item.id,
      position: idx,
    }));

    try {
      await reorderItemsMutation.mutateAsync({ items: payloadItems });
      toast.success("Ordem atualizada!");
      queryClient.invalidateQueries({ queryKey: ["studyTracks"] });
    } catch (error: any) {
      toast.error("Erro ao reordenar items.");
    }
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  // Focus Session Trigger
  const handleStartFocus = (target: { trackId: string; moduleId?: string; moduleItemId?: string }) => {
    // Save target in Zustand store
    const store = useStudyStore.getState();
    // In Phase 3, starting the timer hits /api/mutate for focus session, but we can set target first
    store.stop(); // Clear any existing
    // Set target and redirect to sessions page
    // Note: since the timer isn't started yet, the sessions page will let the user select the technique and start it.
    toast.success("Foco preparado! Redirecionando para o Timer...");
    router.push(`/study/sessions?trackId=${target.trackId}${target.moduleId ? `&moduleId=${target.moduleId}` : ""}${target.moduleItemId ? `&itemId=${target.moduleItemId}` : ""}`);
  };

  // Checkbox toggle status
  const handleToggleItemStatus = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "not_started" : "completed";
    try {
      await setItemStatusMutation.mutateAsync({ id: itemId, status: nextStatus });
      toast.success(nextStatus === "completed" ? "Submódulo concluído! 🎉" : "Submódulo reaberto.");
    } catch (error: any) {
      toast.error("Erro ao atualizar status do submódulo.");
    }
  };

  const handleCreateModule = () => {
    setSelectedModule(null);
    setModuleDialogOpen(true);
  };

  const handleEditModule = (mod: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedModule(mod);
    setModuleDialogOpen(true);
  };

  const handleDeleteModule = async (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza de que deseja excluir este módulo e todos os seus itens?")) {
      try {
        await deleteModuleMutation.mutateAsync({ id: moduleId });
        toast.success("Módulo excluído.");
      } catch (error: any) {
        toast.error("Erro ao excluir módulo.");
      }
    }
  };

  const handleCreateItem = (modId: string) => {
    setActiveModuleIdForNewItem(modId);
    setSelectedItem(null);
    setItemDialogOpen(true);
  };

  const handleEditItem = (itemObj: any, modId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveModuleIdForNewItem(modId);
    setSelectedItem(itemObj);
    setItemDialogOpen(true);
  };

  const handleDeleteItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja excluir este submódulo?")) {
      try {
        await deleteItemMutation.mutateAsync({ id: itemId });
        toast.success("Submódulo excluído.");
      } catch (error: any) {
        toast.error("Erro ao excluir submódulo.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={() => router.push("/study/tracks")} className="hover:text-foreground transition flex items-center">
          Trilhas de Estudo
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{track.name}</span>
      </div>

      <Card className="border-border/60 bg-card/40 overflow-hidden shadow-sm relative">
        <div className={cn("h-1.5 w-full", track.color || "bg-blue-500")} />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {track.area && (
                  <Badge variant="ghost" className="bg-muted/50 text-muted-foreground">
                    {track.area}
                  </Badge>
                )}
                {track.mode && (
                  <Badge variant="outline" className="border-border/60 bg-secondary/10">
                    {track.mode}
                  </Badge>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight pt-1">
                {track.name}
              </h2>
              {track.description && (
                <p className="text-sm text-muted-foreground max-w-3xl pt-1">
                  {track.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setTrackDialogOpen(true)}>
                <Edit2 className="h-4 w-4 mr-2" /> Editar Trilha
              </Button>
              <Button variant="gradient" size="sm" onClick={() => handleStartFocus({ trackId: track.id })}>
                <Play className="h-4 w-4 mr-2" /> Iniciar Foco
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border/40 pt-4 mt-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                Carga horária acumulada: <strong>{track.hoursDone || 0}h</strong> de {track.hoursTarget || "∞"}h planejadas
              </span>
            </div>
            {track.targetDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  Prazo limite: <strong>{new Date(track.targetDate).toLocaleDateString("pt-BR")}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>
                Módulos cadastrados: <strong>{track.modules?.length || 0}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-1 mt-6">
            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
              <span>COMPLEMENTAÇÃO DE SUBMÓDULOS</span>
              <span>{track.progress}%</span>
            </div>
            <Progress value={track.progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">Conteúdo e Checklist</h3>
        <Button variant="outline" size="sm" onClick={handleCreateModule}>
          <Plus className="h-4 w-4 mr-2" /> Novo Módulo
        </Button>
      </div>

      {track.modules?.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-xl bg-card/20 border-border/50">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm font-semibold">Nenhum módulo criado</p>
          <p className="text-xs text-muted-foreground mt-1">
            Divida esta trilha em módulos maiores para estruturar as etapas de aprendizado.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleCreateModule}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Criar Primeiro Módulo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {track.modules.map((mod: any) => {
            const isExpanded = expandedModules[mod.id] !== false;
            const completedItems = mod.items?.filter((i: any) => i.status === "completed").length || 0;
            const totalItems = mod.items?.length || 0;
            const modProgress = totalItems ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <Card key={mod.id} className="border-border/60 bg-card/50 overflow-hidden shadow-sm">
                {/* Cabeçalho do Módulo */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/40 transition"
                  onClick={() => toggleModuleExpand(mod.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button className="text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate flex items-center gap-2">
                        {mod.name}
                        {totalItems > 0 && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            ({completedItems}/{totalItems} concluídos)
                          </span>
                        )}
                      </h4>
                      {mod.hoursTarget && (
                        <p className="text-[11px] text-muted-foreground">
                          Estimativa do módulo: {mod.hoursTarget}h
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {totalItems > 0 && (
                      <div className="w-24 text-[10px] text-muted-foreground hidden sm:block">
                        <div className="flex justify-between mb-0.5 font-medium">
                          <span>Progresso</span>
                          <span>{modProgress}%</span>
                        </div>
                        <Progress value={modProgress} className="h-1" />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleCreateItem(mod.id)} title="Adicionar Submódulo">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => handleEditModule(mod, e)} title="Editar Módulo">
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={(e) => handleDeleteModule(mod.id, e)} title="Excluir Módulo">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Submódulos (Checkbox list com DND) */}
                {isExpanded && (
                  <div className="border-t border-border/40 p-2 bg-card-elevated/40 space-y-1.5">
                    {totalItems === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum submódulo adicionado ainda.
                        <button
                          onClick={() => handleCreateItem(mod.id)}
                          className="text-primary hover:underline ml-1 font-semibold"
                        >
                          Criar um submódulo
                        </button>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(e) => handleDragEnd(e, mod.id)}
                      >
                        <SortableContext
                          items={mod.items.map((i: any) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
                            {mod.items.map((item: any) => (
                              <SortableRow
                                key={item.id}
                                item={item}
                                moduleId={mod.id}
                                onToggleStatus={handleToggleItemStatus}
                                onStartFocus={handleStartFocus}
                                onEdit={handleEditItem}
                                onDelete={handleDeleteItem}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <UpsertTrackDialog
        open={trackDialogOpen}
        onOpenChange={setTrackDialogOpen}
        track={track}
      />

      <UpsertModuleDialog
        open={moduleDialogOpen}
        onOpenChange={setModuleDialogOpen}
        trackId={track.id}
        module={selectedModule}
      />

      <UpsertModuleItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        moduleId={activeModuleIdForNewItem}
        item={selectedItem}
      />
    </div>
  );
}

// Submódulo Row Component (DND Sortable)
function SortableRow({
  item,
  moduleId,
  onToggleStatus,
  onStartFocus,
  onEdit,
  onDelete,
}: {
  item: any;
  moduleId: string;
  onToggleStatus: (id: string, status: string) => void;
  onStartFocus: (target: any) => void;
  onEdit: (item: any, modId: string, e: any) => void;
  onDelete: (id: string, e: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompleted = item.status === "completed";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 py-2 px-3 hover:bg-accent/40 rounded-lg group border border-border/20 transition-all bg-card/60",
        isCompleted && "bg-muted/10 opacity-75"
      )}
    >
      {/* Handle de Arrasto */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground shrink-0"
        title="Arrastar para ordenar"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Checkbox Status */}
      <div className="flex items-center shrink-0">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(item.id, item.status)}
        />
      </div>

      {/* Nome e Info do Item */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-xs font-medium truncate block",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {item.name}
        </span>
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mt-0.5">
          {item.hours && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {item.hours}h
            </span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-0.5 text-primary hover:underline"
            >
              <LinkIcon className="h-3 w-3" /> Link externo
            </a>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onStartFocus({ trackId: item.trackId || "", moduleId, moduleItemId: item.id })}
          title="Iniciar foco neste item"
        >
          <Play className="h-3 w-3 text-success fill-success" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={(e) => onEdit(item, moduleId, e)} title="Editar">
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={(e) => onDelete(item.id, e)} title="Excluir">
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
