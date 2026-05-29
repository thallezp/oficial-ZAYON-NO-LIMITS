"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Copy,
  ExternalLink,
  Hash,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Trash2,
  Folder,
  FolderPlus,
  FolderOpen,
  Archive,
  Eye,
  EyeOff,
  Tag,
  ListFilter,
  ArrowRightLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { initials, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useDocuments,
  usePersonas,
  useFolders,
  useProjects,
  useDeleteDocumentMutation,
  useCreateDocumentMutation,
  useToggleDocumentStarMutation,
  useArchiveDocumentMutation,
  useUnarchiveDocumentMutation,
  useMoveDocumentToFolderMutation,
  useBulkArchiveDocumentsMutation,
  useBulkTagDocumentsMutation,
} from "@/hooks/use-queries";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";

export default function DocumentsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.setOpen);
  const openWith = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("document");
  const router = useRouter();

  // Queries
  const { data: dbDocs = [] } = useDocuments(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const { data: dbFolders = [] } = useFolders(activeWorkspaceId);
  const { data: dbProjects = [] } = useProjects(activeWorkspaceId);

  // Mutations
  const deleteDoc = useDeleteDocumentMutation();
  const createDoc = useCreateDocumentMutation();
  const toggleStar = useToggleDocumentStarMutation();
  const archiveDoc = useArchiveDocumentMutation();
  const unarchiveDoc = useUnarchiveDocumentMutation();
  const moveDocFolder = useMoveDocumentToFolderMutation();
  const bulkArchiveDocs = useBulkArchiveDocumentsMutation();
  const bulkTagDocs = useBulkTagDocumentsMutation();

  const docs = dbDocs as any[];
  const personas = dbPersonas as any[];
  const folders = dbFolders as any[];
  const projects = dbProjects as any[];

  // States
  const [search, setSearch] = React.useState("");
  const [personaFilter, setPersonaFilter] = React.useState<string>("all");
  const [projectFilter, setProjectFilter] = React.useState<string>("all");
  const [folderFilter, setFolderFilter] = React.useState<string>("all");
  const [tagFilter, setTagFilter] = React.useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [viewArchived, setViewArchived] = React.useState(false);

  const [confirmDelete, setConfirmDelete] = React.useState<any | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
  
  // Folder moving & tagging modal states
  const [movingDocs, setMovingDocs] = React.useState<string[] | null>(null);
  const [targetFolderId, setTargetFolderId] = React.useState<string>("root");
  const [tagInput, setTagInput] = React.useState("");
  const [showTagModal, setShowTagModal] = React.useState(false);

  // Auto-collect unique tags
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    docs.forEach((d) => {
      if (d.tags && Array.isArray(d.tags)) {
        d.tags.forEach((t: string) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [docs]);

  // Documents list filtered
  const filteredDocs = React.useMemo(() => {
    return docs.filter((d: any) => {
      // Archive filter
      const isArchived = Boolean(d.archivedAt || d.archived_at);
      if (viewArchived !== isArchived) return false;

      // Favorites filter
      if (favoritesOnly && !d.isStarred) return false;

      // Persona filter
      if (personaFilter === "no-persona" && d.personaId) return false;
      if (
        personaFilter !== "all" &&
        personaFilter !== "no-persona" &&
        d.personaId !== personaFilter
      )
        return false;

      // Project filter
      if (projectFilter === "no-project" && d.projectId) return false;
      if (
        projectFilter !== "all" &&
        projectFilter !== "no-project" &&
        d.projectId !== projectFilter
      )
        return false;

      // Folder filter
      if (folderFilter === "no-folder" && d.folderId) return false;
      if (
        folderFilter !== "all" &&
        folderFilter !== "no-folder" &&
        d.folderId !== folderFilter
      )
        return false;

      // Tag filter
      if (
        tagFilter !== "all" &&
        (!d.tags || !Array.isArray(d.tags) || !d.tags.includes(tagFilter))
      )
        return false;

      // Search term
      const s = search.toLowerCase();
      if (
        s &&
        !d.title?.toLowerCase().includes(s) &&
        !d.summary?.toLowerCase().includes(s) &&
        !d.tags?.some?.((t: string) => t.toLowerCase().includes(s))
      )
        return false;

      return true;
    });
  }, [docs, search, personaFilter, projectFilter, folderFilter, tagFilter, favoritesOnly, viewArchived]);

  // Top 3 Recent documents (non-archived)
  const recentDocs = React.useMemo(() => {
    return docs
      .filter((d: any) => !d.archivedAt && !d.archived_at)
      .sort((a: any, b: any) => {
        const timeA = new Date(a.updatedAt || a.updated_at || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.updated_at || b.createdAt).getTime();
        return timeB - timeA;
      })
      .slice(0, 3);
  }, [docs]);

  const handleCreateDocument = () => {
    openWith("document");
    openQuickCreate(true);
  };

  const handleCreateFolder = () => {
    openWith("folder");
    openQuickCreate(true);
  };

  const handleToggleStar = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await toggleStar.mutateAsync(id);
      toast.success("Favorito atualizado");
    } catch {
      toast.error("Erro ao favoritar");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveDoc.mutateAsync(id);
      toast.success("Documento arquivado");
    } catch {
      toast.error("Erro ao arquivar");
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveDoc.mutateAsync(id);
      toast.success("Documento desarquivado");
    } catch {
      toast.error("Erro ao desarquivar");
    }
  };

  const handleDuplicate = async (doc: any) => {
    if (!activeWorkspaceId) return;
    try {
      await createDoc.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: doc.personaId ?? undefined,
        projectId: doc.projectId ?? undefined,
        folderId: doc.folderId ?? undefined,
        title: `${doc.title} (cópia)`,
        content: doc.content ?? "",
      } as any);
      toast.success("Documento duplicado");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao duplicar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDoc.mutateAsync(confirmDelete.id);
      toast.success("Documento removido");
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  const handleCopyLink = async (id: string) => {
    try {
      const url = `${window.location.origin}/documents/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  // Selection helpers
  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredDocs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredDocs.map((d: any) => d.id)));
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    let failed = 0;
    for (const id of ids) {
      try {
        await deleteDoc.mutateAsync(id);
      } catch {
        failed++;
      }
    }
    setSelected(new Set());
    setConfirmBulkDelete(false);
    if (failed > 0) {
      toast.error(`${failed} documento(s) não puderam ser removidos`);
    } else {
      toast.success(`${ids.length} documento(s) removido(s)`);
    }
  };

  const handleBulkArchive = async (archive: boolean) => {
    const ids = Array.from(selected);
    try {
      await bulkArchiveDocs.mutateAsync({ ids, archive });
      toast.success(`${ids.length} documento(s) ${archive ? "arquivado(s)" : "desarquivado(s)"}`);
      setSelected(new Set());
    } catch {
      toast.error("Erro ao processar ação em massa");
    }
  };

  const handleMoveToFolder = async () => {
    if (!movingDocs) return;
    const folderId = targetFolderId === "root" ? null : targetFolderId;
    try {
      await moveDocFolder.mutateAsync({ ids: movingDocs, folderId });
      toast.success("Documento(s) movidos com sucesso");
      setMovingDocs(null);
      setSelected(new Set());
    } catch {
      toast.error("Erro ao mover documento(s)");
    }
  };

  const handleBulkTag = async () => {
    const ids = Array.from(selected);
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (tags.length === 0) return;

    try {
      await bulkTagDocs.mutateAsync({ ids, tags });
      toast.success(`Tags aplicadas a ${ids.length} documento(s)`);
      setTagInput("");
      setShowTagModal(false);
      setSelected(new Set());
    } catch {
      toast.error("Erro ao aplicar tags");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Wiki interna, playbooks, atas, briefings · com editor estilo Notion e colaboração ao vivo."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Selecione um documento para resumir com IA")}
            >
              <Sparkles className="h-3.5 w-3.5" /> Resumir com IA
            </Button>
            <Button variant="gradient" size="sm" onClick={handleCreateDocument}>
              <Plus className="h-4 w-4" /> Novo Documento
            </Button>
          </>
        }
      />

      {/* Recentes Section */}
      {!viewArchived && recentDocs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Atualizados Recentemente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentDocs.map((rd: any) => (
              <Link href={`/documents/${rd.id}`} key={rd.id}>
                <Card variant="default" className="hover:border-primary/30 transition-all cursor-pointer bg-card/40 hover:bg-card/75">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-2xl shrink-0">{rd.emoji ?? "📄"}</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold truncate text-foreground">{rd.title}</h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Ajustado {relativeTime(rd.updatedAt || rd.updated_at || rd.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Folders Section */}
      {!viewArchived && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" /> Pastas do Workspace
            </h2>
            <Button variant="ghost" size="sm" onClick={handleCreateFolder} className="text-primary hover:text-primary-hover gap-1 text-[10px] font-semibold h-7">
              <FolderPlus className="h-3 w-3" /> Nova Pasta
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Folder Card: Todos */}
            <Card
              onClick={() => setFolderFilter("all")}
              className={cn(
                "cursor-pointer transition-all border border-border/40 hover:border-primary/20",
                folderFilter === "all" ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-card/20 hover:bg-card/40"
              )}
            >
              <CardContent className="p-3 flex flex-col justify-between h-20">
                <div className="flex justify-between items-start">
                  <Folder className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Todos</h3>
                  <p className="text-[9px] text-muted-foreground">{docs.filter(d => !d.archivedAt && !d.archived_at).length} itens</p>
                </div>
              </CardContent>
            </Card>

            {/* Folder Cards */}
            {folders.map((f: any) => {
              const folderDocsCount = docs.filter(d => d.folderId === f.id && !d.archivedAt && !d.archived_at).length;
              return (
                <Card
                  key={f.id}
                  onClick={() => setFolderFilter(f.id)}
                  className={cn(
                    "cursor-pointer transition-all border border-border/40 hover:border-primary/20 relative overflow-hidden",
                    folderFilter === f.id ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-card/20 hover:bg-card/40"
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: f.color || "#6366f1" }} />
                  <CardContent className="p-3 flex flex-col justify-between h-20 pt-4">
                    <Folder className="h-5 w-5" style={{ color: f.color || "#6366f1" }} />
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-foreground truncate">{f.name}</h3>
                      <p className="text-[9px] text-muted-foreground">{folderDocsCount} itens</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Folder Card: Sem Pasta */}
            <Card
              onClick={() => setFolderFilter("no-folder")}
              className={cn(
                "cursor-pointer transition-all border border-border/40 hover:border-primary/20",
                folderFilter === "no-folder" ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20" : "bg-card/20 hover:bg-card/40"
              )}
            >
              <CardContent className="p-3 flex flex-col justify-between h-20">
                <Folder className="h-5 w-5 text-muted-foreground/60" />
                <div>
                  <h3 className="text-xs font-semibold text-foreground">Sem pasta</h3>
                  <p className="text-[9px] text-muted-foreground">
                    {docs.filter(d => !d.folderId && !d.archivedAt && !d.archived_at).length} itens
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Control Bar (Filters, Search, Bulk Actions) */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          {/* Main search */}
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar documentos, tags, conteúdo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Project Filter Select */}
          <div className="w-40 min-w-[130px]">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Filtrar por Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Projetos</SelectItem>
                <SelectItem value="no-project">Sem Projeto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter Select */}
          <div className="w-36 min-w-[120px]">
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Filtrar por Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tags</SelectItem>
                {allTags.map((t) => (
                  <SelectItem key={t} value={t}>
                    #{t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Favoritos */}
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFavoritesOnly((v) => !v)}
            className="h-9 text-xs px-3"
          >
            <Star
              className={cn(
                "h-3.5 w-3.5 mr-1.5",
                favoritesOnly ? "fill-warning text-warning" : "",
              )}
            />
            Favoritos
          </Button>

          {/* Toggle Arquivo */}
          <Button
            variant={viewArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setViewArchived((v) => !v);
              setSelected(new Set()); // Clear selection when swapping views
            }}
            className="h-9 text-xs px-3 ml-auto"
          >
            {viewArchived ? (
              <>
                <Eye className="h-3.5 w-3.5 mr-1.5 text-primary" />
                Ver Ativos
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5 mr-1.5" />
                Ver Arquivo
              </>
            )}
          </Button>
        </div>

        {/* Persona Filter Row */}
        <div className="flex gap-1.5 flex-wrap items-center border-t border-border/40 pt-2.5">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold mr-1.5">Persona:</span>
          <Badge
            variant={personaFilter === "all" ? "primary" : "outline"}
            className="cursor-pointer text-[10px] px-2 py-0.5"
            onClick={() => setPersonaFilter("all")}
          >
            Todas
          </Badge>
          <Badge
            variant={personaFilter === "no-persona" ? "primary" : "outline"}
            className="cursor-pointer text-[10px] px-2 py-0.5"
            onClick={() => setPersonaFilter("no-persona")}
          >
            Sem Persona
          </Badge>
          {personas.map((p: any) => (
            <Badge
              key={p.id}
              variant={personaFilter === p.id ? "primary" : "outline"}
              className="cursor-pointer text-[10px] px-2 py-0.5"
              onClick={() => setPersonaFilter(p.id)}
            >
              {p.name}
            </Badge>
          ))}
        </div>

        {/* Bulk Action Bar */}
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 flex-wrap"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4">
              <CheckSquare className="h-4 w-4 text-primary cursor-pointer" onClick={selectAll} />
              <span>{selected.size} selecionado(s)</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setMovingDocs(Array.from(selected))}
              >
                <Folder className="h-3.5 w-3.5" /> Mover Pasta
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => setShowTagModal(true)}
              >
                <Tag className="h-3.5 w-3.5" /> Add Tags
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => handleBulkArchive(!viewArchived)}
              >
                <Archive className="h-3.5 w-3.5" /> {viewArchived ? "Desarquivar" : "Arquivar"}
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1"
                onClick={() => setConfirmBulkDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setSelected(new Set())}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid of Documents */}
      {filteredDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/10 px-6 py-16 text-center">
          <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Nenhum documento encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || favoritesOnly || personaFilter !== "all" || folderFilter !== "all" || projectFilter !== "all" || tagFilter !== "all"
              ? "Ajuste seus filtros ou faça uma nova busca."
              : "Crie seu primeiro documento ou importe um playbook."}
          </p>
          <Button
            variant="gradient"
            size="sm"
            className="mt-4"
            onClick={handleCreateDocument}
          >
            <Plus className="h-3.5 w-3.5" /> Criar primeiro documento
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredDocs.map((d: any, i: number) => {
              const persona = personas.find((p: any) => p.id === d.personaId);
              const project = projects.find((p: any) => p.id === d.projectId);
              const folder = folders.find((f: any) => f.id === d.folderId);
              const isSelected = selected.has(d.id);

              return (
                <motion.div
                  key={d.id}
                  layoutId={d.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    variant="elevated"
                    className={cn(
                      "group hover:border-primary/40 transition-all relative overflow-hidden h-full flex flex-col justify-between",
                      isSelected && "border-primary/60 ring-1 ring-primary/30 bg-primary/[0.02]",
                      d.isStarred && "border-warning/20"
                    )}
                  >
                    {/* Folder color indicator line if document belongs to a folder */}
                    {folder && (
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: folder.color || "#3b82f6" }} />
                    )}

                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Header card details */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl select-none">{d.emoji ?? "📄"}</span>
                            {d.isStarred && (
                              <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                            )}
                          </div>
                          
                          {/* Badges container */}
                          <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                            {persona && (
                              <Badge size="sm" variant="outline" className="border-primary/20 text-[9px] bg-primary/[0.02]">
                                {persona.name}
                              </Badge>
                            )}
                            {project && (
                              <Badge size="sm" variant="outline" className="border-secondary/20 text-[9px] bg-secondary/[0.02] text-secondary">
                                {project.name}
                              </Badge>
                            )}
                            {folder && (
                              <Badge size="sm" variant="outline" className="text-[9px] text-muted-foreground border-border/80">
                                <Folder className="h-2.5 w-2.5 mr-0.5" style={{ color: folder.color || "#6366f1" }} />
                                {folder.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Title and Summary */}
                        <Link href={`/documents/${d.id}`} className="block">
                          <h3 className="font-semibold leading-tight text-sm hover:text-primary transition-colors">{d.title}</h3>
                          {d.summary && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                              {d.summary}
                            </p>
                          )}
                        </Link>
                      </div>

                      {/* Tag badges */}
                      {d.tags && d.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {d.tags.map((t: string) => (
                            <Badge key={t} variant="ghost" size="sm" className="text-[9px] h-4">
                              <Hash className="h-2 w-2" /> {t}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer card metrics */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-border/40 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar size="xs">
                            <AvatarFallback>
                              {initials(d.author?.fullName ?? "AV")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[9px] text-muted-foreground">
                            {d.author?.fullName?.split(" ")[0] || "Equipe"}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground">
                          {relativeTime(d.updatedAt ?? d.updated_at)}
                        </span>
                      </div>
                    </div>

                    {/* Checkbox selector */}
                    <button
                      onClick={(e) => toggleSelect(d.id, e)}
                      className={cn(
                        "absolute top-3 left-3 transition z-10",
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary fill-primary/10" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      )}
                    </button>

                    {/* Quick actions row on card hover */}
                    <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition duration-150 bg-background/90 backdrop-blur-sm rounded-md border border-border/40 p-0.5 shadow-sm">
                      {/* Star toggle icon */}
                      <button
                        onClick={(e) => handleToggleStar(d.id, e)}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-warning transition"
                        title="Favoritar"
                      >
                        <Star className={cn("h-3.5 w-3.5", d.isStarred && "fill-warning text-warning")} />
                      </button>

                      {/* Quick move to folder */}
                      <button
                        onClick={(e) => { e.preventDefault(); setMovingDocs([d.id]); }}
                        className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition"
                        title="Mover pasta"
                      >
                        <Folder className="h-3.5 w-3.5" />
                      </button>

                      {/* Options dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/documents/${d.id}`)}>
                            <ExternalLink className="h-4 w-4" /> Abrir Documento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(d.id)}>
                            <Copy className="h-4 w-4" /> Copiar link público
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(d)}>
                            <Copy className="h-4 w-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (viewArchived) handleUnarchive(d.id);
                            else handleArchive(d.id);
                          }}>
                            <Archive className="h-4 w-4" />
                            {viewArchived ? "Restaurar do Arquivo" : "Arquivar Documento"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/15 focus:text-destructive"
                            onClick={() => setConfirmDelete(d)}
                          >
                            <Trash2 className="h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* "Criar novo documento" card shortcut */}
          {!viewArchived && filteredDocs.length > 0 && (
            <button
              onClick={handleCreateDocument}
              className="rounded-xl border-2 border-dashed border-border/60 bg-card/10 hover:bg-card/25 flex flex-col items-center justify-center gap-2 py-10 transition duration-200 hover:border-primary/40 text-center"
            >
              <StickyNote className="h-6 w-6 text-muted-foreground/60" />
              <span className="text-xs font-semibold">Novo documento em branco</span>
              <Badge variant="ghost" size="sm" className="text-[9px] uppercase tracking-wider">
                Markdown · Atas · Briefings
              </Badge>
            </button>
          )}
        </div>
      )}

      {/* Modal: Move documents to folder */}
      <Dialog
        open={movingDocs !== null}
        onOpenChange={(open) => !open && setMovingDocs(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <ArrowRightLeft className="h-4 w-4 text-primary" /> Mover para Pasta
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escolha para qual pasta deseja mover o(s) {movingDocs?.length} documento(s).
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Select value={targetFolderId} onValueChange={setTargetFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a pasta de destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Nenhuma (Raiz do Workspace)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMovingDocs(null)}>
              Cancelar
            </Button>
            <Button variant="gradient" size="sm" onClick={handleMoveToFolder}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Apply tags in bulk */}
      <Dialog
        open={showTagModal}
        onOpenChange={setShowTagModal}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Tag className="h-4 w-4 text-primary" /> Adicionar Tags em Massa
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escreva as tags separadas por vírgula para aplicar aos {selected.size} documentos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <Input
              placeholder="Ex: criativos, aurora, lancamento"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="text-xs"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowTagModal(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" size="sm" onClick={handleBulkTag} disabled={!tagInput.trim()}>
              Aplicar Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm single deletion */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <Trash2 className="h-4 w-4" /> Excluir documento
            </DialogTitle>
            <DialogDescription className="text-xs">
              O documento "{confirmDelete?.title}" será removido permanentemente. Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs px-3.5 py-1.5 rounded-md"
              disabled={deleteDoc.isPending}
            >
              {deleteDoc.isPending ? "Excluindo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirm bulk deletion */}
      <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-semibold text-sm">
              <Trash2 className="h-4 w-4" /> Excluir {selected.size} documento(s)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja excluir permanentemente estes {selected.size} documentos? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmBulkDelete(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs px-3.5 py-1.5 rounded-md"
              disabled={deleteDoc.isPending}
            >
              {deleteDoc.isPending ? "Excluindo..." : `Confirmar Exclusão (${selected.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
