"use client";

import * as React from "react";
import {
  FileVideo,
  FileImage,
  FileText as FilePdf,
  FileSpreadsheet,
  FileText,
  Monitor,
  Folder,
  FolderOpen,
  Globe,
  Link as LinkIcon,
  Link2,
  Music,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Download,
  MoreVertical,
  Paperclip,
  Tag,
  Eye,
  X,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MOCK_MATERIALS } from "@/data";
import { cn } from "@/lib/utils/cn";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import {
  useMaterials,
  useCreateMaterialMutation,
  useUpdateMaterialMutation,
  useDeleteMaterialMutation,
  useFolders,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  usePersonas,
  useProjects,
  useTasks,
  useContent,
} from "@/hooks/use-queries";
import { UploadDropzone } from "@/lib/uploadthing";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import { toast } from "sonner";
import { DriveEmbed } from "@/components/materials/drive-embed";

const typeIcon = {
  video: FileVideo,
  vídeo: FileVideo,
  image: FileImage,
  imagem: FileImage,
  pdf: FilePdf,
  audio: Music,
  áudio: Music,
  spreadsheet: FileSpreadsheet,
  planilha: FileSpreadsheet,
  doc: FileText,
  documento: FileText,
  print: Monitor,
  reference: Link2,
  referência: Link2,
  other: FileText,
} as const;

const typeLabel: Record<string, string> = {
  image: "Imagem",
  imagem: "Imagem",
  video: "Vídeo",
  vídeo: "Vídeo",
  pdf: "PDF",
  audio: "Áudio",
  áudio: "Áudio",
  spreadsheet: "Planilha",
  planilha: "Planilha",
  doc: "Documento",
  documento: "Documento",
  print: "Print",
  reference: "Referência",
  referência: "Referência",
  other: "Outro",
};

const FILE_TYPES = [
  { id: "all", label: "Todos" },
  { id: "image", label: "Imagens" },
  { id: "video", label: "Vídeos" },
  { id: "pdf", label: "PDFs" },
  { id: "audio", label: "Áudios" },
  { id: "spreadsheet", label: "Planilhas" },
  { id: "doc", label: "Documentos" },
  { id: "print", label: "Prints" },
  { id: "reference", label: "Referências" },
];

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b > 1024 * 1024 * 1024) return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b > 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

function getFileTypeFromExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "spreadsheet";
  if (["doc", "docx", "txt", "md", "odt"].includes(ext)) return "doc";
  return "other";
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
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const { data: dbProjects = [] } = useProjects(activeWorkspaceId);
  const { data: dbTasks = [] } = useTasks(activeWorkspaceId);
  const { data: dbContents = [] } = useContent(activeWorkspaceId);

  const createMaterialMutation = useCreateMaterialMutation();
  const updateMaterialMutation = useUpdateMaterialMutation();
  const deleteMaterialMutation = useDeleteMaterialMutation();
  const updateFolderMutation = useUpdateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  useNewEntityShortcut("folder");

  const openQuickCreate = useQuickCreate((s) => s.openWith);

  const [search, setSearch] = React.useState("");
  const [selectedType, setSelectedType] = React.useState<string>("all");
  const [selectedPersonaId, setSelectedPersonaId] = React.useState<string>("all");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("all");

  const [activeFolderId, setActiveFolderId] = React.useState<string>(ALL_FOLDER_ID);
  const [editingFolder, setEditingFolder] = React.useState<FolderRow | null>(null);

  // Estados de modais
  const [previewMaterial, setPreviewMaterial] = React.useState<any | null>(null);
  const [editingMaterial, setEditingMaterial] = React.useState<any | null>(null);
  const [attachingMaterial, setAttachingMaterial] = React.useState<any | null>(null);

  // Suporte a mock local para testabilidade reativa em modo mock
  const [mockMaterials, setMockMaterials] = React.useState<any[]>(MOCK_MATERIALS);

  const items = React.useMemo(() => {
    if (isMockModeClient && dbMaterials.length === 0) {
      return mockMaterials;
    }
    return dbMaterials;
  }, [dbMaterials, mockMaterials]);

  // Quando estamos numa pasta especifica filtra por folder_id
  const folderFilteredItems = React.useMemo(() => {
    if (activeFolderId === ALL_FOLDER_ID) return items;
    return (items as any[]).filter((m) => m.folderId === activeFolderId);
  }, [items, activeFolderId]);

  // Filtros combinados
  const filteredItems = React.useMemo(() => {
    return folderFilteredItems.filter((m: any) => {
      // Busca
      const matchesSearch =
        !search ||
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.description?.toLowerCase().includes(search.toLowerCase()) ||
        m.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));

      // Tipo
      const matchesType =
        selectedType === "all" ||
        m.fileType === selectedType ||
        (selectedType === "spreadsheet" && m.fileType === "planilha") ||
        (selectedType === "doc" && m.fileType === "documento") ||
        (selectedType === "reference" && m.fileType === "referência") ||
        (selectedType === "audio" && m.fileType === "áudio") ||
        (selectedType === "video" && m.fileType === "vídeo") ||
        (selectedType === "image" && m.fileType === "imagem");

      // Persona
      const matchesPersona =
        selectedPersonaId === "all" || m.personaId === selectedPersonaId;

      // Projeto
      const matchesProject =
        selectedProjectId === "all" ||
        m.projectId === selectedProjectId ||
        m.relatedEntity?.projectId === selectedProjectId ||
        (m.relatedEntity?.type === "project" && m.relatedEntity?.id === selectedProjectId);

      return matchesSearch && matchesType && matchesPersona && matchesProject;
    });
  }, [folderFilteredItems, search, selectedType, selectedPersonaId, selectedProjectId]);

  const folders: FolderRow[] = (dbFolders as any[]) ?? [];
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? null;

  // Handlers para Mutations com suporte a mock
  const handleToggleStar = async (m: any) => {
    if (isMockModeClient && dbMaterials.length === 0) {
      setMockMaterials((prev) =>
        prev.map((item) =>
          item.id === m.id ? { ...item, isStarred: !item.isStarred } : item
        )
      );
      toast.success(m.isStarred ? "Removido dos favoritos" : "Adicionado aos favoritos");
      return;
    }
    try {
      await updateMaterialMutation.mutateAsync({
        id: m.id,
        input: { isStarred: !m.isStarred },
      });
      toast.success(m.isStarred ? "Removido dos favoritos" : "Adicionado aos favoritos");
    } catch (e: any) {
      toast.error("Erro ao atualizar favorito");
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (isMockModeClient && dbMaterials.length === 0) {
      setMockMaterials((prev) => prev.filter((item) => item.id !== id));
      toast.success("Material excluído");
      return;
    }
    try {
      await deleteMaterialMutation.mutateAsync(id);
      toast.success("Material excluído");
    } catch (e: any) {
      toast.error("Erro ao excluir material");
    }
  };

  const handleSaveMetadata = async (id: string, input: any) => {
    if (isMockModeClient && dbMaterials.length === 0) {
      setMockMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...input } : item))
      );
      toast.success("Material atualizado");
      setEditingMaterial(null);
      return;
    }
    try {
      await updateMaterialMutation.mutateAsync({ id, input });
      toast.success("Material atualizado");
      setEditingMaterial(null);
    } catch (e: any) {
      toast.error("Erro ao salvar dados");
    }
  };

  const handleAttachEntity = async (id: string, input: any) => {
    if (isMockModeClient && dbMaterials.length === 0) {
      setMockMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...input } : item))
      );
      toast.success("Material anexado com sucesso");
      setAttachingMaterial(null);
      return;
    }
    try {
      await updateMaterialMutation.mutateAsync({ id, input });
      toast.success("Material anexado com sucesso");
      setAttachingMaterial(null);
    } catch (e: any) {
      toast.error("Erro ao anexar entidade");
    }
  };

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
              {/* Barra de Filtros Premium */}
              <div className="flex flex-col gap-4 bg-card/40 border border-border/60 rounded-xl p-4">
                {/* Categorias / Chips de Tipo */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {FILE_TYPES.map((t) => {
                    const active = selectedType === t.id;
                    return (
                      <Button
                        key={t.id}
                        variant={active ? "gradient" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full px-4 h-7 text-xs shrink-0 transition-all duration-300 font-medium",
                          !active && "hover:border-primary/30"
                        )}
                        onClick={() => setSelectedType(t.id)}
                      >
                        {t.label}
                      </Button>
                    );
                  })}
                </div>

                {/* Filtros Dropdowns + Busca */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Filtro Persona */}
                  <div className="w-[160px]">
                    <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                      <SelectTrigger className="h-8 text-xs bg-background/30 border-border/50">
                        <SelectValue placeholder="Persona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Personas</SelectItem>
                        {dbPersonas.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Projeto */}
                  <div className="w-[160px]">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="h-8 text-xs bg-background/30 border-border/50">
                        <SelectValue placeholder="Projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Projetos</SelectItem>
                        {dbProjects.map((proj: any) => (
                          <SelectItem key={proj.id} value={proj.id}>
                            {proj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de Busca */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar materiais, tags…"
                      className="pl-9 h-8 text-xs bg-background/35 border-border/50 placeholder:text-muted-foreground/60"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Materiais */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((m: any) => {
                  const Icon =
                    typeIcon[m.fileType as keyof typeof typeIcon] || FileText;
                  const label = typeLabel[m.fileType] || "Arquivo";

                  // Se for imagem, tenta renderizar miniatura real
                  const isImage =
                    m.fileType === "image" ||
                    m.fileType === "imagem" ||
                    m.fileType === "print" ||
                    (m.fileUrl && m.fileUrl.match(/\.(png|jpe?g|gif|webp|svg)/i));

                  return (
                    <Card
                      key={m.id}
                      variant="elevated"
                      className="group cursor-pointer hover:border-primary/40 hover:shadow-glow/5 transition flex flex-col justify-between"
                      onClick={() => setPreviewMaterial(m)}
                    >
                      <CardContent className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        {/* Container de Preview com botões superiores */}
                        <div className="relative aspect-video rounded-lg bg-gradient-to-br from-secondary/80 to-muted/80 flex items-center justify-center overflow-hidden border border-border/40 select-none">
                          {isImage && m.fileUrl ? (
                            <img
                              src={m.fileUrl}
                              alt={m.title}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <Icon className="h-7 w-7 text-muted-foreground/40" />
                          )}

                          {/* Favoritar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(m);
                            }}
                            className="absolute top-2 left-2 p-1.5 rounded-md bg-background/70 backdrop-blur-md border border-border/60 hover:bg-background/90 text-foreground transition"
                            title={m.isStarred ? "Remover dos favoritos" : "Favoritar"}
                          >
                            <Star
                              className={cn(
                                "h-3.5 w-3.5",
                                m.isStarred
                                  ? "text-warning fill-warning"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            />
                          </button>

                          {/* Ações Dropdown */}
                          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="glass"
                                  size="icon"
                                  className="h-7 w-7 rounded-md p-0 bg-background/70 backdrop-blur-md border-border/60"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => setPreviewMaterial(m)}>
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  Visualizar
                                </DropdownMenuItem>
                                {m.fileUrl && (
                                  <DropdownMenuItem
                                    onClick={() => window.open(m.fileUrl, "_blank")}
                                  >
                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                    Download
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => setAttachingMaterial(m)}>
                                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                  Anexar a...
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingMaterial(m)}>
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:bg-destructive/10"
                                  onClick={() => handleDeleteMaterial(m.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <Badge
                            size="sm"
                            variant="outline"
                            className="absolute bottom-2 left-2 uppercase text-[9px] bg-background/70 border-border/60 font-medium"
                          >
                            {label}
                          </Badge>
                        </div>

                        {/* Título & Detalhes */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold truncate group-hover:text-primary transition">
                            {m.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{formatBytes(m.sizeBytes || undefined)}</span>
                            {m.tags && m.tags.length > 0 && (
                              <span className="flex items-center gap-0.5 truncate max-w-[80px]">
                                <Tag className="h-2.5 w-2.5 shrink-0" />
                                {m.tags[0]}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Entidade Relacionada */}
                        {m.relatedEntity && m.relatedEntity.type && (
                          <div className="flex items-center gap-1 text-[9px] bg-primary/10 border border-primary/20 text-primary rounded px-1.5 py-0.5 w-fit max-w-full truncate mt-1">
                            <Paperclip className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">
                              {m.relatedEntity.type === "task"
                                ? "Tarefa"
                                : m.relatedEntity.type === "content"
                                  ? "Conteúdo"
                                  : "Funil"}
                              : {m.relatedEntity.title || m.relatedEntity.id.slice(0, 8)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Dropzone para upload */}
                <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 p-4 transition hover:border-primary/40 flex flex-col items-center justify-center min-h-[160px]">
                  <UploadDropzone
                    endpoint="materials"
                    onClientUploadComplete={(res) => {
                      res?.forEach((file) => {
                        const newMaterialInput = {
                          workspaceId: activeWorkspaceId,
                          title: file.name,
                          fileUrl: file.url,
                          fileType: getFileTypeFromExtension(file.name),
                          sizeBytes: file.size,
                          folderId:
                            activeFolderId === ALL_FOLDER_ID
                              ? undefined
                              : activeFolderId,
                        };

                        if (isMockModeClient && dbMaterials.length === 0) {
                          setMockMaterials((prev) => [
                            {
                              id: `m_mock_${Date.now()}_${Math.random()}`,
                              ...newMaterialInput,
                              tags: [],
                              createdAt: new Date().toISOString(),
                            },
                            ...prev,
                          ]);
                        } else {
                          createMaterialMutation.mutate(newMaterialInput as any);
                        }
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
                  <p className="text-sm font-medium">Nenhum material correspondente encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Experimente remover os filtros ou faça um upload pelo dropzone acima.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Editor de pasta */}
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

      {/* Preview Dialog */}
      {previewMaterial && (
        <PreviewDialog
          material={previewMaterial}
          onClose={() => setPreviewMaterial(null)}
          onDownload={() => {
            if (previewMaterial.fileUrl) {
              window.open(previewMaterial.fileUrl, "_blank");
            }
          }}
          onEdit={() => {
            setEditingMaterial(previewMaterial);
            setPreviewMaterial(null);
          }}
          onDelete={() => {
            handleDeleteMaterial(previewMaterial.id);
            setPreviewMaterial(null);
          }}
        />
      )}

      {/* Edit Dialog */}
      {editingMaterial && (
        <EditMaterialDialog
          material={editingMaterial}
          folders={folders}
          personas={dbPersonas}
          onClose={() => setEditingMaterial(null)}
          onSave={(input) => handleSaveMetadata(editingMaterial.id, input)}
        />
      )}

      {/* Attach Entity Dialog */}
      {attachingMaterial && (
        <AttachEntityDialog
          material={attachingMaterial}
          tasks={dbTasks}
          contents={dbContents}
          personas={dbPersonas}
          onClose={() => setAttachingMaterial(null)}
          onAttach={(input) => handleAttachEntity(attachingMaterial.id, input)}
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
              className="h-9 w-20 p-1 bg-background/50 border border-border/50 rounded-lg"
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

// ----------------------------------------------------------------------------

interface PreviewDialogProps {
  material: any;
  onClose: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function PreviewDialog({
  material,
  onClose,
  onDownload,
  onEdit,
  onDelete,
}: PreviewDialogProps) {
  const isImage =
    material.fileType === "image" ||
    material.fileType === "imagem" ||
    material.fileType === "print" ||
    (material.fileUrl && material.fileUrl.match(/\.(png|jpe?g|gif|webp|svg)/i));
  const isVideo =
    material.fileType === "video" ||
    material.fileType === "vídeo" ||
    (material.fileUrl && material.fileUrl.match(/\.(mp4|mov|webm|ogg|m4v)/i));
  const isAudio =
    material.fileType === "audio" ||
    material.fileType === "áudio" ||
    (material.fileUrl && material.fileUrl.match(/\.(mp3|wav|ogg|m4a|aac)/i));
  const isPdf = material.fileType === "pdf" || (material.fileUrl && material.fileUrl.match(/\.pdf/i));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col justify-between overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            <span>Visualizando: {material.title}</span>
          </DialogTitle>
          <DialogDescription className="truncate">
            Tipo: {typeLabel[material.fileType] || material.fileType} · Tamanho:{" "}
            {formatBytes(material.sizeBytes)}
          </DialogDescription>
        </DialogHeader>

        {/* Corpo do Preview */}
        <div className="flex-1 overflow-y-auto min-h-[300px] flex items-center justify-center bg-background/40 border border-border/60 rounded-xl p-4 my-3 select-none">
          {isImage && material.fileUrl ? (
            <img
              src={material.fileUrl}
              alt={material.title}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-glow"
            />
          ) : isVideo && material.fileUrl ? (
            <video
              src={material.fileUrl}
              controls
              className="max-w-full max-h-[60vh] rounded-lg shadow-glow bg-black"
            />
          ) : isAudio && material.fileUrl ? (
            <div className="w-full max-w-lg p-6 bg-card/60 border border-border/40 rounded-xl space-y-4">
              <div className="flex items-center justify-center">
                <Music className="h-16 w-16 text-primary/80 animate-pulse" />
              </div>
              <audio src={material.fileUrl} controls className="w-full" />
            </div>
          ) : isPdf && material.fileUrl ? (
            <iframe
              src={material.fileUrl}
              className="w-full h-[60vh] rounded-lg border border-border/40 bg-white"
            />
          ) : (
            <div className="text-center p-8 max-w-md space-y-4 bg-card/40 border border-border/50 rounded-xl">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <div>
                <p className="text-sm font-semibold">Sem pré-visualização direta disponível</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este arquivo ({material.fileType}) pode ser baixado ou aberto em nova aba
                  para visualização completa.
                </p>
              </div>
              {material.description && (
                <p className="text-xs text-muted-foreground bg-background/50 border border-border/30 rounded p-2 italic">
                  "{material.description}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Detalhes & Relações do Material */}
        {(material.description ||
          (material.tags && material.tags.length > 0) ||
          material.relatedEntity) && (
          <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-3 text-xs select-none">
            {/* Esquerda: Tags e Detalhes */}
            <div className="space-y-2">
              {material.description && (
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Descrição: </strong>
                  {material.description}
                </p>
              )}
              {material.tags && material.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-foreground">Tags:</span>
                  {material.tags.map((t: string) => (
                    <Badge key={t} size="sm" variant="outline" className="gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Direita: Entidade Vinculada */}
            {material.relatedEntity && material.relatedEntity.type && (
              <div className="flex flex-col justify-end items-end space-y-1">
                <span className="text-[10px] text-muted-foreground">Vinculado a</span>
                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded px-2.5 py-1 font-medium w-fit">
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span>
                    {material.relatedEntity.type === "task"
                      ? "Tarefa"
                      : material.relatedEntity.type === "content"
                        ? "Conteúdo"
                        : "Funil"}
                    : {material.relatedEntity.title || material.relatedEntity.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
          {material.fileUrl && (
            <Button variant="gradient" size="sm" onClick={onDownload}>
              <Download className="h-3.5 w-3.5" /> Baixar / Abrir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------

interface EditMaterialDialogProps {
  material: any;
  folders: FolderRow[];
  personas: any[];
  onClose: () => void;
  onSave: (input: any) => void;
}

function EditMaterialDialog({
  material,
  folders,
  personas,
  onClose,
  onSave,
}: EditMaterialDialogProps) {
  const [title, setTitle] = React.useState(material.title);
  const [description, setDescription] = React.useState(material.description || "");
  const [fileType, setFileType] = React.useState(material.fileType);
  const [folderId, setFolderId] = React.useState(material.folderId || "none");
  const [personaId, setPersonaId] = React.useState(material.personaId || "none");
  const [tagsInput, setTagsInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(material.tags || []);

  const handleAddTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    const tag = tagsInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagsInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("O título do material é obrigatório");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      fileType,
      folderId: folderId === "none" ? null : folderId,
      personaId: personaId === "none" ? null : personaId,
      tags: tags.length > 0 ? tags : null,
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Editar Material
          </DialogTitle>
          <DialogDescription>
            Atualize o nome, a descrição, as tags ou a pasta de organização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Título */}
          <div className="space-y-1">
            <Label className="text-xs">Título do material</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que este arquivo contém..."
            />
          </div>

          {/* Tipo de arquivo */}
          <div className="space-y-1">
            <Label className="text-xs">Classificação de tipo</Label>
            <Select value={fileType} onValueChange={setFileType}>
              <SelectTrigger className="h-9 bg-background/50 border border-border/50 text-xs rounded-lg">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Imagem</SelectItem>
                <SelectItem value="video">Vídeo</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="audio">Áudio</SelectItem>
                <SelectItem value="spreadsheet">Planilha</SelectItem>
                <SelectItem value="doc">Documento</SelectItem>
                <SelectItem value="print">Print</SelectItem>
                <SelectItem value="reference">Referência</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organização em Pastas & Personas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Pasta</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="h-9 bg-background/50 border border-border/50 text-xs rounded-lg">
                  <SelectValue placeholder="Pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma pasta</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Persona</Label>
              <Select value={personaId} onValueChange={setPersonaId}>
                <SelectTrigger className="h-9 bg-background/50 border border-border/50 text-xs rounded-lg">
                  <SelectValue placeholder="Persona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma persona</SelectItem>
                  {personas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-xs">Gerenciar Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Adicionar tag..."
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => handleAddTag()}>
                Adicionar
              </Button>
            </div>

            {/* Listagem de Tags */}
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto p-1.5 border border-border/40 rounded-lg bg-background/30">
                {tags.map((tag) => (
                  <Badge key={tag} size="sm" className="gap-1 flex items-center bg-secondary/80">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic pl-1">
                Nenhuma tag associada.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------------

interface AttachEntityDialogProps {
  material: any;
  tasks: any[];
  contents: any[];
  personas: any[];
  onClose: () => void;
  onAttach: (input: any) => void;
}

function AttachEntityDialog({
  material,
  tasks,
  contents,
  personas,
  onClose,
  onAttach,
}: AttachEntityDialogProps) {
  const [entityType, setEntityType] = React.useState<"task" | "content" | "persona">("task");
  const [selectedEntityId, setSelectedEntityId] = React.useState<string>("none");

  // Filtra as opções com base no tipo de entidade selecionada
  const options = React.useMemo(() => {
    if (entityType === "task") {
      return tasks.map((t) => ({ id: t.id, name: t.title }));
    }
    if (entityType === "content") {
      return contents.map((c) => ({ id: c.id, name: c.title }));
    }
    return personas.map((p) => ({ id: p.id, name: `Funil · ${p.name}` }));
  }, [entityType, tasks, contents, personas]);

  // Limpa o select quando muda o tipo de entidade
  React.useEffect(() => {
    setSelectedEntityId("none");
  }, [entityType]);

  const handleAttach = () => {
    if (selectedEntityId === "none") {
      toast.error("Por favor, selecione uma entidade para anexar.");
      return;
    }

    const matched = options.find((o) => o.id === selectedEntityId);
    const title = matched ? matched.name : "";

    const patch: any = {
      relatedEntity: {
        type: entityType,
        id: selectedEntityId,
        title,
      },
    };

    // Atualiza automaticamente o persona_id do material se anexado a persona/funil ou tarefa
    if (entityType === "persona") {
      patch.personaId = selectedEntityId;
    } else if (entityType === "task") {
      const task = tasks.find((t) => t.id === selectedEntityId);
      if (task?.personaId) {
        patch.personaId = task.personaId;
      }
    } else if (entityType === "content") {
      const content = contents.find((c) => c.id === selectedEntityId);
      if (content?.personaId) {
        patch.personaId = content.personaId;
      }
    }

    onAttach(patch);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Anexar Material
          </DialogTitle>
          <DialogDescription>
            Vincule este material a uma Tarefa, Conteúdo Editorial ou Funil de Vendas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Tipo de Entidade */}
          <div className="space-y-1">
            <Label className="text-xs">Vincular a</Label>
            <Select value={entityType} onValueChange={(val: any) => setEntityType(val)}>
              <SelectTrigger className="h-9 bg-background/50 border border-border/50 text-xs rounded-lg">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Tarefa</SelectItem>
                <SelectItem value="content">Conteúdo Editorial</SelectItem>
                <SelectItem value="persona">Funil (Persona)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selecionar Entidade */}
          <div className="space-y-1">
            <Label className="text-xs">Selecionar Item</Label>
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger className="h-9 bg-background/50 border border-border/50 text-xs rounded-lg">
                <SelectValue placeholder={`Selecione a ${entityType === "task" ? "tarefa" : entityType === "content" ? "peça de conteúdo" : "persona"}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Selecione uma opção...</SelectItem>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/60 pt-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={handleAttach}>
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
