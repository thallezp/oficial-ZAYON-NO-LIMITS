"use client";

import * as React from "react";
import {
  FileVideo,
  FileImage,
  FileText as FilePdf,
  Folder,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  Music,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MOCK_MATERIALS } from "@/data";
import { cn } from "@/lib/utils/cn";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useMaterials,
  useCreateMaterialMutation,
  useFolders,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
} from "@/hooks/use-queries";
import { UploadDropzone } from "@/lib/uploadthing";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";
import { DriveEmbed } from "@/components/materials/drive-embed";

const typeIcon = {
  video: FileVideo,
  image: FileImage,
  pdf: FilePdf,
  audio: Music,
  doc: FilePdf,
  other: FilePdf,
} as const;

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b > 1024 * 1024 * 1024) return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b > 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

const ALL_FOLDER_ID = "__all__";

interface FolderRow {
  id: string;
  name: string;
  color?: string | null;
  driveUrl?: string | null;
  driveProvider?: string | null;
}

export default function MaterialsPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbMaterials = [] } = useMaterials(activeWorkspaceId);
  const { data: dbFolders = [] } = useFolders(activeWorkspaceId);
  const createMaterialMutation = useCreateMaterialMutation();
  const updateFolderMutation = useUpdateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  useNewEntityShortcut("folder");

  const openQuickCreate = useQuickCreate((s) => s.openWith);

  const [search, setSearch] = React.useState("");
  const [activeFolderId, setActiveFolderId] = React.useState<string>(ALL_FOLDER_ID);
  const [editingFolder, setEditingFolder] = React.useState<FolderRow | null>(null);

  const items =
    isMockModeClient && dbMaterials.length === 0 ? MOCK_MATERIALS : dbMaterials;

  // Quando estamos numa pasta especifica filtra por folder_id
  const folderFilteredItems = React.useMemo(() => {
    if (activeFolderId === ALL_FOLDER_ID) return items;
    return (items as any[]).filter((m) => m.folderId === activeFolderId);
  }, [items, activeFolderId]);

  const filteredItems = folderFilteredItems.filter(
    (m: any) =>
      !search ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const folders: FolderRow[] = (dbFolders as any[]) ?? [];
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Materiais"
        description="Upload local, pastas organizadas e Google Drive embed — todos navegáveis dentro do sistema."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Use a área de dropzone abaixo do grid para enviar arquivos")
              }
            >
              <Upload className="h-3.5 w-3.5" /> Enviar Arquivo
            </Button>
            <Button
              variant="gradient"
              size="sm"
              onClick={() => openQuickCreate("folder")}
            >
              <Plus className="h-4 w-4" /> Nova Pasta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar de pastas */}
        <aside className="col-span-12 md:col-span-3 space-y-1">
          <FolderItem
            label="Todos os arquivos"
            count={items.length}
            active={activeFolderId === ALL_FOLDER_ID}
            onClick={() => setActiveFolderId(ALL_FOLDER_ID)}
            icon={<Folder className="h-4 w-4" />}
          />
          {folders.length === 0 && (
            <p className="px-3 py-3 text-[11px] text-muted-foreground italic">
              Nenhuma pasta ainda. Clique em <strong>Nova Pasta</strong> para criar uma —
              opcionalmente conecte uma pasta do Google Drive para navegar aqui dentro.
            </p>
          )}
          {folders.map((f) => {
            const itemCount = (items as any[]).filter(
              (m) => m.folderId === f.id,
            ).length;
            return (
              <FolderItem
                key={f.id}
                label={f.name}
                count={itemCount}
                active={activeFolderId === f.id}
                onClick={() => setActiveFolderId(f.id)}
                icon={
                  f.driveUrl ? (
                    <Globe className="h-4 w-4 text-emerald-400" />
                  ) : activeFolderId === f.id ? (
                    <FolderOpen className="h-4 w-4" />
                  ) : (
                    <Folder className="h-4 w-4" />
                  )
                }
                onEdit={() => setEditingFolder(f)}
              />
            );
          })}
        </aside>

        {/* Painel principal */}
        <div className="col-span-12 md:col-span-9 space-y-4">
          {activeFolder?.driveUrl ? (
            <>
              <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                <Globe className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-300">
                    Pasta Google Drive · {activeFolder.name}
                  </p>
                  <p className="text-[11px] text-emerald-400/70 truncate">
                    {activeFolder.driveUrl}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingFolder(activeFolder)}
                >
                  <Pencil className="h-3.5 w-3.5" /> Editar link
                </Button>
              </div>
              <DriveEmbed url={activeFolder.driveUrl} folderName={activeFolder.name} />
            </>
          ) : (
            <>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar materiais, tags…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredItems.map((m: any) => {
                  const Icon =
                    typeIcon[m.fileType as keyof typeof typeIcon] || FilePdf;
                  return (
                    <Card
                      key={m.id}
                      variant="elevated"
                      className="group cursor-pointer hover:border-primary/40 transition"
                    >
                      <CardContent className="p-3 space-y-3">
                        <div className="relative aspect-video rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                          <Icon className="h-7 w-7 text-muted-foreground/40" />
                          {m.isStarred && (
                            <Star className="absolute top-2 right-2 h-3.5 w-3.5 text-warning fill-warning" />
                          )}
                          <Badge
                            size="sm"
                            variant="outline"
                            className="absolute bottom-2 left-2 uppercase"
                          >
                            {m.fileType}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs font-medium truncate">{m.title}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{formatBytes(m.sizeBytes || undefined)}</span>
                            <span>{m.tags?.[0]}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 p-4 transition hover:border-primary/40 flex flex-col items-center justify-center min-h-[160px]">
                  <UploadDropzone
                    endpoint="materials"
                    onClientUploadComplete={(res) => {
                      res?.forEach((file) => {
                        createMaterialMutation.mutate({
                          workspaceId: activeWorkspaceId,
                          title: file.name,
                          fileUrl: file.url,
                          fileType: file.name.split(".").pop() || "other",
                          sizeBytes: file.size,
                          folderId:
                            activeFolderId === ALL_FOLDER_ID
                              ? undefined
                              : activeFolderId,
                        } as any);
                      });
                      toast.success("Arquivos enviados com sucesso!");
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro no upload: ${error.message}`);
                    }}
                    className="ut-label:text-xs ut-label:text-muted-foreground ut-allowed-content:text-[10px] ut-button:bg-primary/20 ut-button:text-primary ut-button:hover:bg-primary/30 ut-button:text-xs ut-button:py-1 ut-button:px-3 ut-button:h-auto border-0 p-0 m-0"
                  />
                </div>
              </div>

              {filteredItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/20 px-6 py-12 text-center">
                  <Folder className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm font-medium">Nenhum material aqui ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Faça upload pelo dropzone acima ou conecte uma pasta do Google Drive.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor de pasta (link Drive / nome / cor) */}
      {editingFolder && (
        <FolderEditDialog
          folder={editingFolder}
          onClose={() => setEditingFolder(null)}
          onSave={async (input) => {
            try {
              await updateFolderMutation.mutateAsync({ id: editingFolder.id, input });
              toast.success("Pasta atualizada");
              setEditingFolder(null);
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao atualizar pasta");
            }
          }}
          onDelete={async () => {
            try {
              await deleteFolderMutation.mutateAsync(editingFolder.id);
              toast.success("Pasta removida");
              setEditingFolder(null);
              if (activeFolderId === editingFolder.id) {
                setActiveFolderId(ALL_FOLDER_ID);
              }
            } catch (e: any) {
              toast.error(e?.message ?? "Erro ao remover pasta");
            }
          }}
          pending={updateFolderMutation.isPending || deleteFolderMutation.isPending}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------

function FolderItem({
  label,
  count,
  active,
  icon,
  onClick,
  onEdit,
}: {
  label: string;
  count: number;
  active?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
  onEdit?: () => void;
}) {
  return (
    <div
      className={cn(
        "group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition cursor-pointer",
        active
          ? "bg-card border border-border/60 text-foreground"
          : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
      )}
      onClick={onClick}
    >
      {icon}
      <span className="flex-1 text-left truncate">{label}</span>
      <Badge size="sm" variant="outline">
        {count}
      </Badge>
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="opacity-0 group-hover:opacity-60 hover:opacity-100 transition"
          title="Editar pasta"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------

interface EditDialogProps {
  folder: FolderRow;
  onClose: () => void;
  onSave: (input: {
    name?: string;
    color?: string;
    driveUrl?: string;
    driveProvider?: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
  pending: boolean;
}

function FolderEditDialog({
  folder,
  onClose,
  onSave,
  onDelete,
  pending,
}: EditDialogProps) {
  const [name, setName] = React.useState(folder.name);
  const [color, setColor] = React.useState(folder.color ?? "#6366f1");
  const [driveUrl, setDriveUrl] = React.useState(folder.driveUrl ?? "");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome da pasta é obrigatório");
      return;
    }
    const url = driveUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      toast.error("URL precisa começar com http(s)://");
      return;
    }
    const provider = url
      ? url.includes("drive.google.com")
        ? "google"
        : url.includes("dropbox.com")
          ? "dropbox"
          : url.includes("onedrive")
            ? "onedrive"
            : "external"
      : null;
    await onSave({
      name: name.trim(),
      color,
      driveUrl: url,
      driveProvider: provider,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar pasta
          </DialogTitle>
          <DialogDescription>
            Renomeie, mude a cor ou conecte uma pasta do Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome da pasta</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cor</Label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-20 p-1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <LinkIcon className="h-3 w-3" /> Link Google Drive (opcional)
            </Label>
            <Input
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <p className="text-[10px] text-muted-foreground">
              Cole a URL completa da pasta compartilhada. A pasta deve estar com
              acesso "qualquer pessoa com o link" para aparecer no embed.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!confirmDelete ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Remover pasta
            </Button>
          ) : (
            <Button
              variant="outline"
              className="bg-destructive/10 text-destructive border-destructive/40"
              onClick={onDelete}
              disabled={pending}
            >
              Confirmar remoção
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
