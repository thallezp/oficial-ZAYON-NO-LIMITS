"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckSquare,
  Copy,
  ExternalLink,
  Hash,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Square,
  Star,
  StickyNote,
  Trash2,
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
import { cn } from "@/lib/utils/cn";
import { initials, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useDocuments,
  usePersonas,
  useDeleteDocumentMutation,
  useCreateDocumentMutation,
} from "@/hooks/use-queries";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";

export default function DocumentsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const openQuickCreate = useQuickCreate((s) => s.setOpen);
  const openWith = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("document");
  const router = useRouter();

  const { data: dbDocs = [] } = useDocuments(activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const deleteDoc = useDeleteDocumentMutation();
  const createDoc = useCreateDocumentMutation();

  const docs = dbDocs as any[];
  const personas = dbPersonas as any[];

  const [search, setSearch] = React.useState("");
  const [personaFilter, setPersonaFilter] = React.useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<any | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);

  const filteredDocs = React.useMemo(() => {
    return docs.filter((d: any) => {
      if (favoritesOnly && !d.isStarred) return false;
      if (personaFilter === "no-persona" && d.personaId) return false;
      if (
        personaFilter !== "all" &&
        personaFilter !== "no-persona" &&
        d.personaId !== personaFilter
      )
        return false;
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
  }, [docs, search, personaFilter, favoritesOnly]);

  const handleCreateDocument = () => {
    openWith("document");
    openQuickCreate(true);
  };

  const handleDuplicate = async (doc: any) => {
    if (!activeWorkspaceId) return;
    try {
      await createDoc.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: doc.personaId ?? undefined,
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

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={favoritesOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setFavoritesOnly((v) => !v)}
        >
          <Star
            className={cn(
              "h-3.5 w-3.5",
              favoritesOnly ? "fill-warning text-warning" : "",
            )}
          />
          Favoritos
        </Button>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1 ml-auto text-xs">
            <Badge variant="outline">{filteredDocs.length} documentos</Badge>
            <Badge variant="primary">
              <Star className="h-3 w-3" />{" "}
              {filteredDocs.filter((d: any) => d.isStarred).length}
            </Badge>
          </div>
        </div>

        {/* Barra de seleção em massa */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckSquare className="h-3.5 w-3.5 text-primary" />
              {selected.size} selecionado(s)
            </button>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set())}
              >
                Desselecionar
              </Button>
              <Button
                size="sm"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => setConfirmBulkDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir {selected.size}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* filtro de persona */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge
          variant={personaFilter === "all" ? "primary" : "outline"}
          className="cursor-pointer"
          onClick={() => setPersonaFilter("all")}
        >
          Todas as personas
        </Badge>
        <Badge
          variant={personaFilter === "no-persona" ? "primary" : "outline"}
          className="cursor-pointer"
          onClick={() => setPersonaFilter("no-persona")}
        >
          Sem persona
        </Badge>
        {personas.map((p: any) => (
          <Badge
            key={p.id}
            variant={personaFilter === p.id ? "primary" : "outline"}
            className="cursor-pointer"
            onClick={() => setPersonaFilter(p.id)}
          >
            {p.name}
          </Badge>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 bg-card/20 px-6 py-16 text-center">
          <StickyNote className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">Nenhum documento encontrado</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || favoritesOnly || personaFilter !== "all"
              ? "Ajuste seus filtros ou crie um novo documento."
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
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredDocs.map((d: any, i: number) => {
          const persona = personas.find((p: any) => p.id === d.personaId);
          const isSelected = selected.has(d.id);
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card
                variant="elevated"
                className={cn(
                  "group hover:border-primary/40 transition relative overflow-hidden",
                  isSelected && "border-primary/60 ring-1 ring-primary/30",
                )}
              >
                <Link href={`/documents/${d.id}`} className="block">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{d.emoji ?? "📄"}</span>
                        {d.isStarred && (
                          <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {persona && (
                          <Badge
                            size="sm"
                            variant="outline"
                            className="border-primary/30"
                          >
                            {persona.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold leading-tight">{d.title}</h3>
                      {d.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {d.summary}
                        </p>
                      )}
                    </div>

                    {d.tags && d.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {d.tags.map((t: string) => (
                          <Badge key={t} variant="ghost" size="sm">
                            <Hash className="h-2.5 w-2.5" /> {t}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      <div className="flex items-center gap-1.5">
                        <Avatar size="xs">
                          <AvatarFallback>
                            {initials(d.author?.fullName ?? "AV")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground">
                          {d.author?.fullName?.split(" ")[0] || "Equipe"}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(d.updatedAt ?? d.updated_at)}
                      </span>
                    </div>
                  </CardContent>
                </Link>

                {/* Checkbox de seleção */}
                <button
                  onClick={(e) => toggleSelect(d.id, e)}
                  className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition z-10"
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {/* menu de 3 pontos */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="p-1 rounded hover:bg-accent transition"
                      >
                        <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/documents/${d.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" /> Abrir
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(d.id)}>
                        <Copy className="h-4 w-4" /> Copiar link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(d)}>
                        <Copy className="h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
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

        {filteredDocs.length > 0 && (
          <button
            onClick={handleCreateDocument}
            className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40"
          >
            <StickyNote className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Criar documento em branco</span>
            <Badge variant="ghost" size="sm">
              slash · tabela · checklist · markdown
            </Badge>
          </button>
        )}
      </div>

      {/* Modal: Confirmar exclusão individual */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir documento
            </DialogTitle>
            <DialogDescription>
              "{confirmDelete?.title}" será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDoc.isPending}
            >
              {deleteDoc.isPending ? "Removendo..." : "Confirmar exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar exclusão em massa */}
      <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Excluir {selected.size} documento(s)
            </DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Os {selected.size} documentos selecionados serão removidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteDoc.isPending}
            >
              {deleteDoc.isPending ? "Removendo..." : `Excluir ${selected.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
