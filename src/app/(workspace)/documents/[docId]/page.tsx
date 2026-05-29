"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  History,
  MessageSquare,
  Share2,
  Sparkles,
  Star,
  Users,
  Folder,
  FolderOpen,
  User,
  Activity,
  Plus,
  X,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RichEditor } from "@/components/editor/rich-editor";
import { MOCK_DOCUMENTS, MOCK_PERSONAS, MOCK_FOLDERS, MOCK_PROJECTS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { initials, relativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { RoomProvider, useOthers, useUpdateMyPresence } from "@/lib/liveblocks";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useDocument,
  usePersonas,
  useFolders,
  useProjects,
  useUpdateDocumentContentMutation,
  useUpdateDocumentMetaMutation,
  useToggleDocumentStarMutation,
} from "@/hooks/use-queries";

const SAMPLE_HTML = `
<h1>Posicionamento · Aurora Voss</h1>
<p><em>Documento vivo · atualizado conforme a persona evolui.</em></p>
<h2>Big idea</h2>
<p>Construa uma vida exuberante sem pedir permissão. Cada peça da Aurora respira autoridade emocional, não performance.</p>
<h2>Tom de voz</h2>
<ul>
  <li>Afetiva · íntima · cinematográfica</li>
  <li>Frases curtas. Silêncio entre elas.</li>
  <li>Nunca usa "polêmica", "fofa", "gente"</li>
</ul>
<h2>Pilares de conteúdo</h2>
<ol>
  <li>Autoridade silenciosa</li>
  <li>Ritual estético</li>
  <li>Narrativa pessoal</li>
  <li>Oferta sem performance</li>
</ol>
<h2>Checklist editorial</h2>
<ul data-type="taskList">
  <li data-checked="true"><label><input type="checkbox" checked><span></span></label><div>Definir guideline de captação</div></li>
  <li data-checked="true"><label><input type="checkbox" checked><span></span></label><div>Validar 3 hooks ancestrais</div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div>Mapear gatilhos por canal</div></li>
  <li data-checked="false"><label><input type="checkbox"><span></span></label><div>Calibrar IA contextual</div></li>
</ul>
<blockquote>O silêncio é parte da entrega. Não preencha tudo só porque pode.</blockquote>
<h3>Referências cinematográficas</h3>
<p>Filmes 35mm · tons quentes · enquadramentos generosos · ritmo lento.</p>
`;

const EMOJIS = ["📄", "📕", "🚀", "🎭", "🧭", "🔥", "📝", "💡", "🧠", "💼", "🎨", "📈", "📅", "💻"];

function CollaborativeDocumentContent({ docId }: { docId: string }) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  
  // Queries
  const { data: dbDoc } = useDocument(docId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const { data: dbFolders = [] } = useFolders(activeWorkspaceId);
  const { data: dbProjects = [] } = useProjects(activeWorkspaceId);

  // Mutations
  const updateContentMutation = useUpdateDocumentContentMutation();
  const updateMeta = useUpdateDocumentMetaMutation();
  const toggleStar = useToggleDocumentStarMutation();

  const doc =
    dbDoc ||
    (isMockModeClient
      ? MOCK_DOCUMENTS.find((d) => d.id === docId) || MOCK_DOCUMENTS[0]
      : null);
  
  const personas =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;
  const folders =
    isMockModeClient && dbFolders.length === 0 ? MOCK_FOLDERS : dbFolders;
  const projects =
    isMockModeClient && dbProjects.length === 0 ? MOCK_PROJECTS : dbProjects;

  // Title Editing state
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [titleInput, setTitleInput] = React.useState("");

  // Tag creation state
  const [newTagInput, setNewTagInput] = React.useState("");
  const [isAddingTag, setIsAddingTag] = React.useState(false);

  React.useEffect(() => {
    if (doc) {
      setTitleInput(doc.title);
    }
  }, [doc]);

  // ── Hooks de colaboração/estado — devem rodar SEMPRE antes de qualquer
  // early return para não violar as regras de hooks do React. ──────────────
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<Date>(new Date());

  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();

  const onChange = React.useCallback((html: string) => {
    setSaving(true);
    const handler = setTimeout(async () => {
      try {
        await updateContentMutation.mutateAsync({ id: docId, content: html });
        setSaving(false);
        setSavedAt(new Date());
      } catch (err) {
        setSaving(false);
      }
    }, 1000);
    return () => clearTimeout(handler);
  }, [docId, updateContentMutation]);

  if (!doc) {
    return (
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="Documento não encontrado"
        description="Este documento não existe no workspace atual ou você não tem acesso a ele."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/documents">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para documentos
            </Link>
          </Button>
        }
      />
    );
  }

  const persona = personas.find((p: any) => p.id === doc.personaId);
  const folder = folders.find((f: any) => f.id === doc.folderId);
  const project = projects.find((p: any) => p.id === doc.projectId);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateMyPresence({ cursor: { x, y } });
  };

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null });
  };

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!titleInput.trim() || titleInput === doc.title) return;
    try {
      await updateMeta.mutateAsync({ id: docId, input: { title: titleInput.trim() } });
      toast.success("Título atualizado");
    } catch {
      toast.error("Erro ao atualizar título");
    }
  };

  const handleSelectEmoji = async (emoji: string) => {
    try {
      await updateMeta.mutateAsync({ id: docId, input: { emoji } });
      toast.success("Ícone atualizado");
    } catch {
      toast.error("Erro ao atualizar ícone");
    }
  };

  const handleToggleStar = async () => {
    try {
      await toggleStar.mutateAsync(docId);
      toast.success(doc.isStarred ? "Removido dos favoritos" : "Adicionado aos favoritos");
    } catch {
      toast.error("Erro ao favoritar");
    }
  };

  const handleUpdatePersona = async (val: string) => {
    const personaId = val === "none" ? null : val;
    try {
      await updateMeta.mutateAsync({ id: docId, input: { personaId } });
      toast.success("Persona vinculada com sucesso");
    } catch {
      toast.error("Erro ao vincular persona");
    }
  };

  const handleUpdateProject = async (val: string) => {
    const projectId = val === "none" ? null : val;
    try {
      await updateMeta.mutateAsync({ id: docId, input: { projectId } });
      toast.success("Projeto vinculado com sucesso");
    } catch {
      toast.error("Erro ao vincular projeto");
    }
  };

  const handleUpdateFolder = async (val: string) => {
    const folderId = val === "none" ? null : val;
    try {
      await updateMeta.mutateAsync({ id: docId, input: { folderId } });
      toast.success("Pasta atualizada com sucesso");
    } catch {
      toast.error("Erro ao atualizar pasta");
    }
  };

  const handleAddTag = async () => {
    const tag = newTagInput.trim();
    if (!tag) return;
    const currentTags = doc.tags || [];
    if (currentTags.includes(tag)) {
      toast.info("Esta tag já existe");
      return;
    }
    const nextTags = [...currentTags, tag];
    try {
      await updateMeta.mutateAsync({ id: docId, input: { tags: nextTags } });
      setNewTagInput("");
      setIsAddingTag(false);
      toast.success("Tag adicionada");
    } catch {
      toast.error("Erro ao adicionar tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = doc.tags || [];
    const nextTags = currentTags.filter((t: string) => t !== tagToRemove);
    try {
      await updateMeta.mutateAsync({ id: docId, input: { tags: nextTags } });
      toast.success("Tag removida");
    } catch {
      toast.error("Erro ao remover tag");
    }
  };

  const onlineNames = others.map((o: any) => o.info?.name || "Membro ZAYON").join(", ");
  const presenceText = onlineNames ? ` · ${onlineNames}` : "";

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/documents"
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Documentos
        </Link>
        <ChevronRight className="h-3 w-3" />
        {persona && (
          <>
            <Link
              href={`/personas/${persona.id}/overview`}
              className="hover:text-foreground"
            >
              {persona.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground truncate max-w-[200px]">{doc.title}</span>
      </div>

      {/* Title & Metadata editor block */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            {/* Clickable Emoji Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="text-4xl hover:scale-105 transition-transform p-1.5 rounded-xl hover:bg-accent border border-dashed border-transparent hover:border-border/80 shrink-0 select-none cursor-pointer"
                  title="Alterar emoji"
                >
                  {doc.emoji ?? "📄"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-2 w-48">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold px-2 pb-1.5">Escolha um ícone</p>
                <div className="grid grid-cols-5 gap-1">
                  {EMOJIS.map((e: string) => (
                    <button
                      key={e}
                      onClick={() => handleSelectEmoji(e)}
                      className="text-xl p-1 hover:bg-accent rounded transition text-center"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                {/* Title Editor */}
                {isEditingTitle ? (
                  <div className="flex items-center gap-1.5 max-w-xl w-full">
                    <Input
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                      autoFocus
                      className="text-xl font-semibold h-9 py-1 px-2.5"
                    />
                    <Button size="sm" variant="gradient" onClick={handleSaveTitle} className="h-9">
                      Salvar
                    </Button>
                  </div>
                ) : (
                  <h1
                    onClick={() => setIsEditingTitle(true)}
                    className="text-2xl font-semibold tracking-tight hover:bg-accent/40 cursor-pointer rounded px-1.5 -ml-1.5 py-0.5 truncate transition-all max-w-full"
                    title="Clique para editar"
                  >
                    {doc.title}
                  </h1>
                )}
                
                {/* Star Favorite toggle */}
                <button
                  onClick={handleToggleStar}
                  className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-warning transition-all shrink-0"
                  title={doc.isStarred ? "Remover dos favoritos" : "Marcar como favorito"}
                >
                  <Star className={cn("h-4.5 w-4.5", doc.isStarred && "fill-warning text-warning")} />
                </button>
              </div>

              {/* Document metadata info row */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Avatar size="xs">
                    <AvatarFallback>
                      {initials(doc.author?.fullName ?? "AV")}
                    </AvatarFallback>
                  </Avatar>
                  {doc.author?.fullName ?? "Equipe ZAYON"}
                </span>
                <span>·</span>
                <span>Atualizado {relativeTime(doc.updatedAt || doc.updated_at)}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  {saving ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                      salvando
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      salvo {savedAt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <Avatar size="sm" className="ring-2 ring-background">
                <AvatarFallback>Você</AvatarFallback>
              </Avatar>
              {others.map(({ connectionId, info }) => (
                <Avatar key={connectionId} size="sm" className="ring-2 ring-background">
                  <AvatarFallback>{initials(info?.name || "M")}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `${window.location.origin}/documents/${docId}`;
                navigator.clipboard.writeText(url);
                toast.success("Link de compartilhamento copiado");
              }}
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success("Resumo gerado pela IA copiado para a área de transferência!")}
            >
              <Sparkles className="h-3.5 w-3.5" /> Resumir
            </Button>
            <Button variant="ghost" size="icon-sm" title="Comentários" onClick={() => toast.info("Comentários carregados")}>
              <MessageSquare className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Dynamic Details Block (Folder, Project, Persona, Tags Editor) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-border/40 bg-card/10 text-xs shadow-soft">
          {/* Persona select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <User className="h-3 w-3" /> Persona Vinculada
            </label>
            <Select value={doc.personaId || "none"} onValueChange={handleUpdatePersona}>
              <SelectTrigger className="h-8 text-xs bg-transparent border-border/50">
                <SelectValue placeholder="Selecione a Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma Persona</SelectItem>
                {personas.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Activity className="h-3 w-3" /> Projeto Relacionado
            </label>
            <Select value={doc.projectId || "none"} onValueChange={handleUpdateProject}>
              <SelectTrigger className="h-8 text-xs bg-transparent border-border/50">
                <SelectValue placeholder="Selecione o Projeto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum Projeto</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder select */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
              <Folder className="h-3 w-3" /> Pasta do Knowledge Base
            </label>
            <Select value={doc.folderId || "none"} onValueChange={handleUpdateFolder}>
              <SelectTrigger className="h-8 text-xs bg-transparent border-border/50">
                <SelectValue placeholder="Selecione a Pasta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Raiz (Nenhuma Pasta)</SelectItem>
                {folders.map((f: any) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags list & Tag creator */}
          <div className="space-y-1 flex flex-col justify-between">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">
              Tags
            </label>
            <div className="flex flex-wrap gap-1 items-center max-h-[50px] overflow-y-auto pt-0.5">
              {doc.tags?.map((t: string) => (
                <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0 gap-0.5 pr-0.5 bg-background">
                  #{t}
                  <button
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-destructive text-muted-foreground focus:outline-none p-0.5"
                  >
                    <X className="h-2 w-2" />
                  </button>
                </Badge>
              ))}

              {isAddingTag ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    onBlur={() => {
                      if (!newTagInput.trim()) setIsAddingTag(false);
                      else handleAddTag();
                    }}
                    autoFocus
                    placeholder="tag..."
                    className="h-5 px-1 py-0 w-16 text-[9px] border-border"
                  />
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingTag(true)}
                  className="h-5 px-1.5 py-0 text-[9px] gap-0.5 text-primary hover:text-primary-hover"
                >
                  <Plus className="h-2 w-2" /> Tag
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time users presence details bar */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground border-b border-border/40 pb-2">
        <Users className="h-3.5 w-3.5 text-success" />
        {others.length + 1} {others.length === 0 ? "pessoa online" : "pessoas online"} · você{presenceText}
      </div>

      {/* Editor Content Area */}
      <div
        className="relative mx-auto max-w-3xl pb-24"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {/* Render live cursors */}
        {others.map(({ connectionId, presence, info }) => {
          if (!presence?.cursor) return null;
          return (
            <div
              key={connectionId}
              className="absolute pointer-events-none transition-transform duration-75 z-50"
              style={{
                left: presence.cursor.x,
                top: presence.cursor.y,
              }}
            >
              <svg
                className="h-5 w-5 text-brand-500 fill-current"
                viewBox="0 0 20 20"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V19a1 1 0 002 0v-3.429a1 1 0 00.725-.976l5 1.43a1 1 0 001.169-1.41l-7-14z" />
              </svg>
              <span className="ml-3 rounded bg-brand-500 px-1.5 py-0.5 text-[9px] text-white font-medium whitespace-nowrap shadow-md">
                {info?.name || "Membro"}
              </span>
            </div>
          );
        })}
        <RichEditor
          initialContent={
            typeof doc.content === "string"
              ? doc.content
              : isMockModeClient
                ? SAMPLE_HTML
                : ""
          }
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export default function DocumentDetailPage() {
  const params = useParams<{ docId: string }>();
  const docId = params?.docId || "global-doc";

  return (
    <RoomProvider id={`room-${docId}`} initialPresence={{ cursor: null, typing: false }}>
      <CollaborativeDocumentContent docId={docId} />
    </RoomProvider>
  );
}
