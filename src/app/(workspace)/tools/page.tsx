"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Link2,
  Download,
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
import { MOCK_TOOLS, TOOL_CATEGORIES } from "@/data/tools";
import { cn } from "@/lib/utils/cn";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { BrandLogo } from "@/components/ui/brand-logo";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useTools,
  useToggleToolFavoriteMutation,
  useUpdateToolMutation,
  useDeleteToolMutation,
  useCreateToolMutation,
  useProjects,
  usePersonas,
  useDocuments,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { getAutoPreview } from "@/lib/utils/tool-utils";
import { toast } from "sonner";

const PREDEFINED_IMPORTS = [
  { name: "ChatGPT", url: "https://chat.openai.com", category: "IA", iconSlug: "openai", brandColor: "#10a37f", description: "IA generalista para texto, código e brainstorming." },
  { name: "Claude", url: "https://claude.ai", category: "IA", iconSlug: "anthropic", brandColor: "#cc785c", description: "IA para raciocínio profundo e longos contextos." },
  { name: "Figma", url: "https://figma.com", category: "Design", iconSlug: "figma", brandColor: "#f24e1e", description: "Design colaborativo e prototipagem." },
  { name: "Canva", url: "https://canva.com", category: "Design", iconSlug: "canva", brandColor: "#00c4cc", description: "Criação rápida de assets de mídia social." },
  { name: "GitHub", url: "https://github.com", category: "Desenvolvimento", iconSlug: "github", brandColor: "#ffffff", description: "Versionamento e repositórios de código." },
  { name: "Vercel", url: "https://vercel.com", category: "Desenvolvimento", iconSlug: "vercel", brandColor: "#000000", description: "Deploy do app Next.js da equipe." },
  { name: "Supabase", url: "https://supabase.com", category: "Banco de Dados", iconSlug: "supabase", brandColor: "#3ecf8e", description: "Banco de dados Postgres, auth e storage." },
  { name: "Slack", url: "https://slack.com", category: "Comunicação", iconSlug: "slack", brandColor: "#4a154b", description: "Comunicação interna da equipe." },
  { name: "Google Drive", url: "https://drive.google.com", category: "Storage", iconSlug: "googledrive", brandColor: "#1fa463", description: "Armazenamento na nuvem e arquivos compartilhados." },
  { name: "Stripe", url: "https://stripe.com", category: "Financeiro", iconSlug: "stripe", brandColor: "#635bff", description: "Gestão de faturamento e pagamentos." }
];

export default function ToolsPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todas");
  const [editingTool, setEditingTool] = React.useState<any | null>(null);
  const [confirmDeleteTool, setConfirmDeleteTool] = React.useState<any | null>(null);
  
  // Custom states for launchers features
  const [recentToolIds, setRecentToolIds] = React.useState<string[]>([]);
  const [activeEmbedTool, setActiveEmbedTool] = React.useState<any | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [testingLinkMap, setTestingLinkMap] = React.useState<Record<string, boolean>>({});

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbTools = [] } = useTools(activeWorkspaceId);
  const toggleFavoriteMutation = useToggleToolFavoriteMutation();
  const updateToolMutation = useUpdateToolMutation();
  const deleteToolMutation = useDeleteToolMutation();
  const createToolMutation = useCreateToolMutation();
  const { openWith } = useQuickCreate();
  useNewEntityShortcut("tool");

  const allTools = isMockModeClient && dbTools.length === 0 ? MOCK_TOOLS : dbTools;

  // Sync recent tools from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("zayon_recent_tools");
    if (saved) {
      try {
        setRecentToolIds(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const trackClick = (toolId: string) => {
    setRecentToolIds((prev) => {
      const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(0, 6);
      localStorage.setItem("zayon_recent_tools", JSON.stringify(next));
      return next;
    });
  };

  const handleOpenTool = (e: React.MouseEvent, tool: any) => {
    trackClick(tool.id);
    if (tool.embedMode === "embed" || tool.embedMode === "modal") {
      e.preventDefault();
      e.stopPropagation();
      setActiveEmbedTool(tool);
    }
  };

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

  const handleToggleFavorite = async (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isMockModeClient && dbTools.length === 0) {
        const idx = MOCK_TOOLS.findIndex((t) => t.id === toolId);
        if (idx !== -1) {
          MOCK_TOOLS[idx] = {
            ...MOCK_TOOLS[idx],
            isFavorite: !MOCK_TOOLS[idx].isFavorite,
          };
          setSearch((s) => s);
          toast.success("Favoritos atualizados!");
        }
      } else {
        await toggleFavoriteMutation.mutateAsync(toolId);
        toast.success("Favoritos atualizados!");
      }
    } catch (err: any) {
      toast.error("Erro ao favoritar ferramenta: " + err.message);
    }
  };

  // Test url connection using server ping route
  const handleTestLink = async (e: React.MouseEvent | null, tool: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTestingLinkMap((prev) => ({ ...prev, [tool.id]: true }));
    try {
      const res = await fetch("/api/test-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: tool.url }),
      });
      const data = await res.json();
      const nextStatus = data.ok ? (data.status || 200).toString() : "Offline";

      if (isMockModeClient && dbTools.length === 0) {
        // Mock updates locally
        const idx = MOCK_TOOLS.findIndex((t) => t.id === tool.id);
        if (idx !== -1) {
          MOCK_TOOLS[idx] = {
            ...MOCK_TOOLS[idx],
            urlCheckedAt: new Date().toISOString(),
            urlStatus: nextStatus,
          };
          setSearch((s) => s); // Trigger re-render
        }
      } else {
        await updateToolMutation.mutateAsync({
          id: tool.id,
          input: {
            urlCheckedAt: new Date().toISOString(),
            urlStatus: nextStatus,
          },
        });
      }

      if (data.ok) {
        toast.success(`Conexão OK! Status: ${nextStatus}`);
      } else {
        toast.error(`Falha na conexão: ${data.error || "Indisponível"}`);
      }
    } catch (err: any) {
      toast.error("Erro ao testar conexão: " + err.message);
    } finally {
      setTestingLinkMap((prev) => ({ ...prev, [tool.id]: false }));
    }
  };

  // Clean duplicate tools by URL/Name
  const handleRemoveDuplicates = async () => {
    const seenUrls = new Map<string, string>(); // url -> id
    const toDeleteIds: string[] = [];

    allTools.forEach((t: any) => {
      const cleanUrl = t.url.toLowerCase().trim().replace(/\/$/, "");
      if (seenUrls.has(cleanUrl)) {
        toDeleteIds.push(t.id);
      } else {
        seenUrls.set(cleanUrl, t.id);
      }
    });

    if (toDeleteIds.length === 0) {
      toast.info("Nenhuma ferramenta duplicada encontrada.");
      return;
    }

    toast.loading(`Removendo ${toDeleteIds.length} duplicatas...`);

    try {
      if (isMockModeClient && dbTools.length === 0) {
        toDeleteIds.forEach((id) => {
          const idx = MOCK_TOOLS.findIndex((t) => t.id === id);
          if (idx !== -1) MOCK_TOOLS.splice(idx, 1);
        });
        toast.dismiss();
        toast.success(`${toDeleteIds.length} duplicatas removidas com sucesso.`);
        setSearch((s) => s); // Force re-render
      } else {
        for (const id of toDeleteIds) {
          await deleteToolMutation.mutateAsync(id);
        }
        toast.dismiss();
        toast.success(`${toDeleteIds.length} duplicatas removidas do banco de dados.`);
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro ao remover duplicatas: " + err.message);
    }
  };

  // Filter tools based on search and category
  const tools = allTools.filter(
    (t: any) =>
      (category === "Todas" || t.category === category) &&
      (!search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase())) ||
        t.category?.toLowerCase().includes(search.toLowerCase())),
  );

  const pinned = allTools.filter((t: any) => t.isPinned);
  const favorites = allTools.filter((t: any) => t.isFavorite && !t.isPinned);
  
  // Resolve recent tools list
  const recentTools = recentToolIds
    .map((id) => allTools.find((t: any) => t.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools Hub"
        description="Central de todas as ferramentas externas usadas pela equipe. Favoritos, fixas e organizados por categoria."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRemoveDuplicates}>
              <Trash2 className="h-3.5 w-3.5" /> Remover Duplicatas
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Download className="h-3.5 w-3.5" /> Importar Lista
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("tool")}>
              <Plus className="h-4 w-4" /> Adicionar Ferramenta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Categorias Sidebar */}
        <aside className="col-span-12 md:col-span-3 space-y-1">
          <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-2 font-semibold">
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
              <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-full">
                {c === "Todas"
                  ? allTools.length
                  : allTools.filter((t: any) => t.category === c).length}
              </span>
            </button>
          ))}
        </aside>

        {/* Dashboard Content */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, categoria, descrição ou tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/40 border-border/60 focus:border-primary/40 focus:ring-0"
            />
          </div>

          {/* Recentes */}
          {category === "Todas" && recentTools.length > 0 && !search && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-purple-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recentes
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {recentTools.map((t: any) => (
                  <ToolCard
                    key={`rec-${t.id}`}
                    tool={t}
                    variant="recent"
                    isTesting={testingLinkMap[t.id]}
                    onOpenTool={(e) => handleOpenTool(e, t)}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                    onTestLink={() => handleTestLink(null, t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Fixadas */}
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
                    isTesting={testingLinkMap[t.id]}
                    onOpenTool={(e) => handleOpenTool(e, t)}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                    onTestLink={() => handleTestLink(null, t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Favoritas */}
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
                    isTesting={testingLinkMap[t.id]}
                    onOpenTool={(e) => handleOpenTool(e, t)}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={() => setEditingTool(t)}
                    onDelete={() => setConfirmDeleteTool(t)}
                    onCopyUrl={() => handleCopyUrl(t.url)}
                    onTestLink={() => handleTestLink(null, t)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Listagem Geral */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category === "Todas" ? "Todas as ferramentas" : category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tools.map((t: any) => (
                <ToolCard
                  key={t.id}
                  tool={t}
                  isTesting={testingLinkMap[t.id]}
                  onOpenTool={(e) => handleOpenTool(e, t)}
                  onToggleFavorite={handleToggleFavorite}
                  onEdit={() => setEditingTool(t)}
                  onDelete={() => setConfirmDeleteTool(t)}
                  onCopyUrl={() => handleCopyUrl(t.url)}
                  onTestLink={() => handleTestLink(null, t)}
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

      {/* Iframe View Modal */}
      {activeEmbedTool && (
        <ToolEmbedModal tool={activeEmbedTool} onClose={() => setActiveEmbedTool(null)} />
      )}

      {/* Predefined Importer Dialog */}
      {importOpen && (
        <ToolImportDialog
          workspaceId={activeWorkspaceId}
          onClose={() => setImportOpen(false)}
          onSuccess={() => {
            setImportOpen(false);
          }}
        />
      )}

      {/* Modal de edicao */}
      {editingTool && (
        <ToolEditDialog
          tool={editingTool}
          onClose={() => setEditingTool(null)}
          onSave={async (input) => {
            try {
              if (isMockModeClient && dbTools.length === 0) {
                // Mock update
                const idx = MOCK_TOOLS.findIndex((t) => t.id === editingTool.id);
                if (idx !== -1) {
                  MOCK_TOOLS[idx] = {
                    ...MOCK_TOOLS[idx],
                    ...input,
                  };
                  toast.success("Ferramenta atualizada (Mock Mode)");
                  setEditingTool(null);
                }
              } else {
                await updateToolMutation.mutateAsync({
                  id: editingTool.id,
                  input,
                });
                toast.success("Ferramenta atualizada");
                setEditingTool(null);
              }
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

// ----------------------------------------------------------------------------
// CARD DE FERRAMENTA
// ----------------------------------------------------------------------------
function ToolCard({
  tool,
  variant = "default",
  isTesting = false,
  onOpenTool,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopyUrl,
  onTestLink,
}: {
  tool: any;
  variant?: "default" | "featured" | "recent";
  isTesting?: boolean;
  onOpenTool: (e: React.MouseEvent) => void;
  onToggleFavorite?: (e: React.MouseEvent, toolId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopyUrl?: () => void;
  onTestLink?: () => void;
}) {
  const isRecent = variant === "recent";
  const isFeatured = variant === "featured";

  // Resolve connectivity indicator
  const isOk = tool.urlStatus === "200" || tool.urlStatus === 200 || tool.urlStatus === "ok";
  const hasChecked = !!tool.urlStatus;
  
  return (
    <motion.a
      href={tool.url}
      target={tool.embedMode === "embed" || tool.embedMode === "modal" ? undefined : "_blank"}
      rel="noreferrer"
      onClick={onOpenTool}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated p-3.5 transition hover:border-primary/40 flex flex-col justify-between",
        isFeatured && "p-4 min-h-[140px]",
        isRecent && "p-3 min-h-[110px]"
      )}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(at top, ${tool.brandColor ?? "#3b82f6"}25, transparent 60%)`,
        }}
      />
      <div className="relative space-y-2.5 w-full">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center justify-center rounded-lg text-white border border-border/60 transition-transform group-hover:scale-105 duration-300",
              isFeatured ? "h-11 w-11" : "h-9 w-9",
            )}
            style={{
              background: tool.brandColor ?? "#3b82f6",
            }}
          >
            <BrandLogo
              slug={tool.iconSlug}
              fallback={tool.name}
              size={isFeatured ? 22 : 18}
              monochrome
              brandColor={tool.brandColor}
            />
          </div>

          <div className="flex items-center gap-1 z-20">
            {/* Status Indicator */}
            {hasChecked && (
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full mr-1 shrink-0 animate-pulse",
                  isOk ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]"
                )}
                title={isOk ? "Conexão OK" : `Erro de Conexão: ${tool.urlStatus}`}
              />
            )}

            <button
              onClick={(e) => onToggleFavorite?.(e, tool.id)}
              className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-warning transition"
              title={tool.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Star
                className={cn(
                  "h-3.5 w-3.5 transition",
                  tool.isFavorite && "text-warning fill-warning"
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
                  className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition"
                  title="Mais ações"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCopyUrl}>
                  <Copy className="h-3.5 w-3.5" /> Copiar Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onTestLink} disabled={isTesting}>
                  <RefreshCw className={cn("h-3.5 w-3.5", isTesting && "animate-spin")} />
                  {isTesting ? "Testando..." : "Testar Link"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold truncate max-w-[130px]">{tool.name}</p>
            {tool.isPinned && <Pin className="h-2.5 w-2.5 text-primary shrink-0" />}
          </div>
          {!isRecent && (
            <p className="text-[10px] text-muted-foreground line-clamp-2 min-h-[30px]">
              {tool.description || "Nenhuma descrição disponível."}
            </p>
          )}
        </div>
      </div>
      
      {!isRecent && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
          <Badge size="sm" variant="ghost" className="px-1 text-[9px] uppercase tracking-wider text-muted-foreground/80">
            {tool.category || "Outros"}
          </Badge>
          <div className="flex gap-1">
            {tool.tags?.slice(0, 2).map((tg: string) => (
              <Badge key={tg} size="sm" className="px-1 text-[8px] bg-white/5 border border-white/10 text-muted-foreground shrink-0">
                {tg}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </motion.a>
  );
}

// ----------------------------------------------------------------------------
// MODAL DE DIÁLOGO DE EDIÇÃO
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
  const [isFavorite, setIsFavorite] = React.useState(!!tool.isFavorite);
  const [embedMode, setEmbedMode] = React.useState(tool.embedMode ?? "new_tab");
  const [iconSlug, setIconSlug] = React.useState(tool.iconSlug ?? "");
  const [brandColor, setBrandColor] = React.useState(tool.brandColor ?? "#3b82f6");

  // Linking fields
  const [selectedPersonaId, setSelectedPersonaId] = React.useState(tool.personaId ?? "");
  const [projectId, setProjectId] = React.useState(tool.projectId ?? "");
  const [documentId, setDocumentId] = React.useState(tool.documentId ?? "");

  const [isTesting, setIsTesting] = React.useState(false);

  // Queries for selectors
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: projects = [] } = useProjects(activeWorkspaceId);
  const { data: personas = [] } = usePersonas(activeWorkspaceId);
  const { data: documents = [] } = useDocuments(activeWorkspaceId);

  const handleDetectPreview = () => {
    const detect = getAutoPreview(name, url);
    setIconSlug(detect.iconSlug);
    setBrandColor(detect.brandColor);
    toast.success("Logo e cor detectados!");
  };

  const handleTestLinkInside = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/test-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Conexão OK! Status HTTP: ${data.status}`);
      } else {
        toast.error(`Falha: ${data.error || "Indisponível"}`);
      }
    } catch {
      toast.error("Erro ao testar!");
    } finally {
      setIsTesting(false);
    }
  };

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
      isFavorite,
      embedMode,
      iconSlug: iconSlug.trim() || null,
      brandColor,
      personaId: selectedPersonaId && selectedPersonaId !== "none" ? selectedPersonaId : null,
      projectId: projectId && projectId !== "none" ? projectId : null,
      documentId: documentId && documentId !== "none" ? documentId : null,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar ferramenta
          </DialogTitle>
          <DialogDescription>
            Ajuste as configurações do launcher, categorização e vínculos de entidades.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-8 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-xs">URL</Label>
                  <button
                    type="button"
                    onClick={handleTestLinkInside}
                    disabled={isTesting}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3 w-3", isTesting && "animate-spin")} />
                    Testar link
                  </button>
                </div>
                <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>

            {/* Logo Preview Block */}
            <div className="col-span-4 flex flex-col items-center justify-center border border-border/60 bg-card-elevated/40 rounded-xl p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Preview</p>
              <div
                className="flex items-center justify-center rounded-lg text-white border border-border/60 h-14 w-14 shadow-lg shadow-black/20"
                style={{ background: brandColor }}
              >
                <BrandLogo slug={iconSlug} fallback={name || "?"} size={28} monochrome brandColor={brandColor} />
              </div>
              <div className="w-full space-y-1">
                <div className="flex gap-1 w-full">
                  <div className="flex-1">
                    <Input
                      value={iconSlug}
                      onChange={(e) => setIconSlug(e.target.value)}
                      className="h-6 text-[10px] px-1 text-center font-mono"
                      placeholder="Slug simple-icons"
                    />
                  </div>
                  <div className="w-8 shrink-0">
                    <Input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-6 w-full p-0 border-0 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-5 text-[9px] w-full mt-1.5 px-0"
                  onClick={handleDetectPreview}
                >
                  Auto-Detectar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          {/* Linked Entities Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Vincular Persona</Label>
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {personas.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Vincular Projeto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Vincular Documento</Label>
              <Select value={documentId} onValueChange={setDocumentId}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {documents.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tags (separadas por vírgula)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: llm, design, copy"
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

          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-border bg-card/60 text-primary focus:ring-0"
              />
              <span className="flex items-center gap-1"><Pin className="h-3 w-3 text-primary" /> Fixada</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded border-border bg-card/60 text-primary focus:ring-0"
              />
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-warning fill-warning" /> Favorita</span>
            </label>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border/20">
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

// ----------------------------------------------------------------------------
// MODAL DE EXIBIÇÃO IFRAME EMBED
// ----------------------------------------------------------------------------
function ToolEmbedModal({ tool, onClose }: { tool: any; onClose: () => void }) {
  const [iframeKey, setIframeKey] = React.useState(0);
  
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden border border-border/60 bg-card-elevated/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/40 z-20">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg text-white border border-border/60 h-8 w-8 shrink-0"
              style={{ background: tool.brandColor || "#3b82f6" }}
            >
              <BrandLogo slug={tool.iconSlug} fallback={tool.name} size={18} monochrome brandColor={tool.brandColor} />
            </div>
            <div className="truncate max-w-[200px] sm:max-w-md">
              <DialogTitle className="text-sm font-semibold truncate leading-none mb-0.5">{tool.name}</DialogTitle>
              <span className="text-[10px] text-muted-foreground/80 truncate block">{tool.url}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
              onClick={() => setIframeKey((k) => k + 1)}
              title="Recarregar Embed"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-white/5 bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground"
              onClick={() => {
                navigator.clipboard.writeText(tool.url);
                toast.success("URL copiada!");
              }}
              title="Copiar Link"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="gradient"
              size="sm"
              className="h-8 gap-1.5 px-3"
              onClick={() => window.open(tool.url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir em Nova Aba
            </Button>
            <Button variant="outline" size="sm" className="h-8 border-white/5" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>

        <div className="flex-1 bg-black/60 relative">
          {/* Warn about iframe CSP block */}
          <div className="absolute bottom-4 right-4 z-30 max-w-sm bg-card/90 border border-white/10 rounded-xl p-3 text-[11px] text-muted-foreground/90 backdrop-blur-md shadow-lg flex gap-2.5 items-start">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-xs">Problemas ao carregar?</p>
              <p className="mt-0.5 leading-relaxed text-[10px]">
                Alguns portais proíbem embeds. Se a janela acima ficar em branco, clique no botão <strong>Abrir em Nova Aba</strong> no cabeçalho.
              </p>
            </div>
          </div>

          <iframe
            key={iframeKey}
            src={tool.url}
            className="w-full h-full border-none bg-black/20"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            allow="clipboard-write"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------
// DIÁLOGO DE IMPORTAÇÃO DE LISTA / PREDEFINIDOS
// ----------------------------------------------------------------------------
function ToolImportDialog({
  workspaceId,
  onClose,
  onSuccess,
}: {
  workspaceId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const create = useCreateToolMutation();
  const [selectedTools, setSelectedTools] = React.useState<string[]>(
    PREDEFINED_IMPORTS.map((p) => p.name)
  );
  const [customJson, setCustomJson] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const toggleSelect = (name: string) => {
    setSelectedTools((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleRunImport = async () => {
    let toImport: any[] = [];

    if (customJson.trim()) {
      try {
        const parsed = JSON.parse(customJson);
        toImport = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err: any) {
        toast.error("JSON inválido: " + err.message);
        return;
      }
    } else {
      toImport = PREDEFINED_IMPORTS.filter((p) => selectedTools.includes(p.name));
    }

    if (toImport.length === 0) {
      toast.error("Selecione alguma ferramenta ou forneça um JSON de importação.");
      return;
    }

    setIsPending(true);
    toast.loading(`Importando ${toImport.length} ferramentas...`);

    try {
      if (isMockModeClient && !workspaceId) {
        // Mock import locally
        toImport.forEach((t) => {
          MOCK_TOOLS.unshift({
            id: "tl_" + Math.random().toString(36).substr(2, 9),
            workspaceId: "mock-workspace-id",
            name: t.name,
            url: t.url,
            category: t.category || "Outros",
            description: t.description || "",
            iconSlug: t.iconSlug || "globe",
            brandColor: t.brandColor || "#3b82f6",
            tags: t.tags || [],
            isFavorite: false,
            isPinned: false,
          });
        });
        toast.dismiss();
        toast.success("Ferramentas importadas localmente!");
        onSuccess();
      } else {
        // Live DB import
        for (const t of toImport) {
          await create.mutateAsync({
            workspaceId,
            name: t.name,
            url: t.url,
            category: t.category || "Outros",
            description: t.description || "",
            iconSlug: t.iconSlug || "globe",
            brandColor: t.brandColor || "#3b82f6",
            tags: t.tags || [],
            embedMode: "new_tab",
          });
        }
        toast.dismiss();
        toast.success("Ferramentas importadas no banco com sucesso!");
        onSuccess();
      }
    } catch (err: any) {
      toast.dismiss();
      toast.error("Erro na importação: " + err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Importar ferramentas
          </DialogTitle>
          <DialogDescription>
            Escolha ferramentas recomendadas do ecossistema ou cole um lote em JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Predefined selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Launcher de Recomendados</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {PREDEFINED_IMPORTS.map((p) => {
                const selected = selectedTools.includes(p.name);
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => toggleSelect(p.name)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition",
                      selected
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-card border-border/60 hover:bg-card/80 text-muted-foreground"
                    )}
                  >
                    <div
                      className="h-5 w-5 rounded flex items-center justify-center text-white text-[9px] shrink-0"
                      style={{ background: p.brandColor }}
                    >
                      <BrandLogo slug={p.iconSlug} fallback={p.name} size={10} monochrome brandColor={p.brandColor} />
                    </div>
                    <span className="truncate">{p.name} ({p.category})</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedTools(PREDEFINED_IMPORTS.map((p) => p.name))}
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                className="text-[10px] text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedTools([])}
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="border-t border-border/20 pt-3 space-y-1.5">
            <Label className="text-xs font-semibold">Ou importar via JSON customizado</Label>
            <Textarea
              placeholder='[{"name": "App", "url": "https://...", "category": "Design"}]'
              value={customJson}
              onChange={(e) => setCustomJson(e.target.value)}
              rows={3}
              className="font-mono text-xs bg-card/60 border-border/60"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleRunImport} disabled={isPending}>
            {isPending ? "Importando..." : "Confirmar Importação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


