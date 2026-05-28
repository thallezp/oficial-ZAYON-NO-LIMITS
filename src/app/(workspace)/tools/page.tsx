"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Copy,
  ExternalLink,
  Filter,
  Globe,
  MoreVertical,
  Pencil,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { MOCK_TOOLS, TOOL_CATEGORIES } from "@/data";
import { cn } from "@/lib/utils/cn";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTools,
  useToggleToolFavoriteMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";

export default function ToolsPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todas");
  const [editingTool, setEditingTool] = React.useState<any | null>(null);
  const [confirmDeleteTool, setConfirmDeleteTool] = React.useState<any | null>(null);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbTools = [] } = useTools(activeWorkspaceId);
  const toggleFavoriteMutation = useToggleToolFavoriteMutation();
  const updateToolMutation = useUpdateToolMutation();
  const deleteToolMutation = useDeleteToolMutation();
  const { openWith } = useQuickCreate();
  useNewEntityShortcut("tool");

  const allTools = isMockModeClient && dbTools.length === 0 ? MOCK_TOOLS : dbTools;

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copiada");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteTool) return;
    try {
      await deleteToolMutation.mutateAsync(confirmDeleteTool.id);
      toast.success(`${confirmDeleteTool.name} removida`);
      setConfirmDeleteTool(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover ferramenta");
    }
  };

  const tools = allTools.filter(
    (t: any) =>
      (category === "Todas" || t.category === category) &&
      (!search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        (t as any).tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))),
  );

  const pinned = allTools.filter((t: any) => t.isPinned);
  const favorites = allTools.filter((t: any) => t.isFavorite && !t.isPinned);

  const handleToggleFavorite = async (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavoriteMutation.mutateAsync(toolId);
      toast.success("Favoritos atualizados!");
    } catch (err: any) {
      toast.error("Erro ao favoritar ferramenta: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools Hub"
        description="Central de todas as ferramentas externas usadas pela equipe. Favoritos, fixos e organizados por categoria."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("tool")}>
              <Plus className="h-4 w-4" /> Adicionar Ferramenta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 space-y-1">
          <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Categorias
          </p>
          {["Todas", ...TOOL_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "w-full text-left rounded-lg px-2.5 py-1.5 text-sm flex items-center justify-between transition",
                category === c
                  ? "bg-card border border-border/60 text-foreground"
                  : "text-muted-foreground hover:bg-card/60",
              )}
            >
              <span>{c}</span>
              <span className="text-[10px]">
                {c === "Todas"
                  ? allTools.length
                  : allTools.filter((t: any) => t.category === c).length}
              </span>
            </button>
          ))}
        </aside>

        <div className="col-span-12 md:col-span-9 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ferramentas, tags, descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {category === "Todas" && pinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fixadas
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {pinned.map((t: any) => (
                  <ToolCard
                    key={t.id}
                    tool={t}
                    variant="featured"
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                  />
                ))}
              </div>
            </section>
          )}

          {category === "Todas" && favorites.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Favoritas
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {favorites.map((t: any) => (
                  <ToolCard
                    key={t.id}
                    tool={t}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category === "Todas" ? "Todas as ferramentas" : category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tools.map((t: any) => (
                <ToolCard
                    key={t.id}
                    tool={t}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                  />
              ))}
            </div>
            {tools.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/60 bg-card/20 px-6 py-12 text-center">
                <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">Nenhuma ferramenta nesta categoria</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione uma ferramenta para começar a montar seu launcher.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openWith("tool")}
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar ferramenta
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal de edicao */}
      {editingTool && (
        <ToolEditDialog
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={async (input) => {
            try {
              await updateToolMutation.mutateAsync({
                id: editingTool.id,
                input,
              });
              toast.success("Ferramenta atualizada");
              setEditingTool(null);
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao salvar");
            }
          }}
          pending={updateToolMutation.isPending}
        />
      )}

      {/* Confirmacao de remocao */}
      <Dialog
        open={!!confirmDeleteTool}
        onOpenChange={(o) => !o && setConfirmDeleteTool(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-4 w-4" /> Remover ferramenta
            </DialogTitle>
            <DialogDescription>
              {confirmDeleteTool?.name} será removida do Tools Hub. Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteTool(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteToolMutation.isPending}
            >
              {deleteToolMutation.isPending ? "Removendo..." : "Confirmar remoção"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolCard({
  tool,
  variant = "default",
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopyUrl,
}: {
  tool: any;
  variant?: "default" | "featured";
  onToggleFavorite?: (e: React.MouseEvent, toolId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyUrl?: () => void;
}) {
  return (
    <motion.a
      href={tool.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated p-3.5 transition hover:border-primary/40",
        variant === "featured" && "p-4",
      )}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
        style={{
          background: `radial-gradient(at top, ${tool.brandColor ?? "#3b82f6"}30, transparent 60%)`,
        }}
      />
      <div className="relative space-y-2.5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center justify-center rounded-lg text-white border border-border/60 transition-transform group-hover:scale-105 duration-300",
              variant === "featured" ? "h-12 w-12" : "h-9 w-9",
            )}
            style={{
              background: tool.brandColor ?? "#3b82f6",
            }}
          >
            <BrandLogo
              slug={tool.iconSlug}
              fallback={tool.name}
              size={variant === "featured" ? 24 : 18}
              monochrome
              brandColor={tool.brandColor}
            />
          </div>
          <div className="flex items-center gap-1.5 z-20">
            <button
              onClick={(e) => onToggleFavorite?.(e, tool.id)}
              className="p-1 rounded hover:bg-white/10 transition"
              title={tool.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5 transition",
                  tool.isFavorite
                    ? "text-warning fill-warning"
                    : "text-muted-foreground hover:text-warning"
                )}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="p-1 rounded hover:bg-white/10 transition"
                  title="Mais ações"
                >
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(tool.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink className="h-4 w-4" /> Abrir
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCopyUrl?.();
                  }}
                >
                  <Copy className="h-4 w-4" /> Copiar URL
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  <Pencil className="h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{tool.name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        </div>
        <Badge size="sm" variant="ghost">
          {tool.category}
        </Badge>
      </div>
    </motion.a>
  );
}

// ----------------------------------------------------------------------------
// Modal de edicao de ferramenta
// ----------------------------------------------------------------------------

function ToolEditDialog({
  tool,
  onClose,
  onSave,
  pending,
}: {
  tool: any;
  onClose: () => void;
  onSave: (input: any) => Promise<void>;
  pending: boolean;
}) {
  const [name, setName] = React.useState(tool.name ?? "");
  const [description, setDescription] = React.useState(tool.description ?? "");
  const [url, setUrl] = React.useState(tool.url ?? "");
  const [category, setCategory] = React.useState(tool.category ?? "Outros");
  const [tags, setTags] = React.useState(((tool.tags ?? []) as string[]).join(", "));
  const [isPinned, setIsPinned] = React.useState(!!tool.isPinned);
  const [embedMode, setEmbedMode] = React.useState(tool.embedMode ?? "new_tab");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast.error("Nome e URL são obrigatórios");
      return;
    }
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      url: url.trim(),
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isPinned,
      embedMode,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar ferramenta
          </DialogTitle>
          <DialogDescription>
            Renomear, mudar URL, recategorizar ou ajustar embed.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modo de abertura</Label>
              <Select value={embedMode} onValueChange={setEmbedMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_tab">Nova aba</SelectItem>
                  <SelectItem value="embed">Embed (iframe)</SelectItem>
                  <SelectItem value="modal">Modal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tags (separadas por vírgula)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: design, vetorial, gratuito"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
            />
            Fixar no topo do Tools Hub
          </label>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={pending}>
              {pending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
