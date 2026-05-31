"use client";

import * as React from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
  Wand2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { formatCompact, initials } from "@/lib/utils/format";
import {
  useModeling,
  useUpdateModelingProfileMutation,
  useDeleteModelingProfileMutation,
  useModelingContentExamples,
  useUpsertModelingContentExampleMutation,
  useDeleteModelingContentExampleMutation,
  useCreateTaskMutation,
  useCreateContentMutation,
} from "@/hooks/use-queries";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useNewEntityShortcut } from "@/hooks/use-page-shortcuts";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProfileInsight {
  id: string;
  body: string;
  createdAt: string;
}

interface ProfileRefs {
  prints?: string[];
  insights?: ProfileInsight[];
}

function readRefs(value: any): ProfileRefs {
  if (!value || typeof value !== "object") return {};
  return {
    prints: Array.isArray(value.prints) ? value.prints.filter(Boolean) : [],
    insights: Array.isArray(value.insights)
      ? value.insights.filter((i: any) => i?.id && i?.body)
      : [],
  };
}

const categoryColor = {
  emerging: "info",
  hidden_gem: "primary",
  big_creator: "warning",
  authority: "success",
  competitor: "danger",
  international: "outline",
} as const;

export default function ModelingPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [search, setSearch] = React.useState("");
  const { data: dbModeling = [] } = useModeling(persona.id);
  const updateMutation = useUpdateModelingProfileMutation();
  const deleteMutation = useDeleteModelingProfileMutation();
  const createTask = useCreateTaskMutation();
  const createContent = useCreateContentMutation();

  const allProfiles =
    dbModeling;

  const profiles = allProfiles.filter(
    (p: any) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.niche?.toLowerCase().includes(search.toLowerCase()) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))),
  );

  const openQuickCreate = useQuickCreate((s) => s.openWith);
  useNewEntityShortcut("modelingProfile");
  const handleAddProfile = () => openQuickCreate("modelingProfile");

  // Edit Sheet State
  const [selectedProfile, setSelectedProfile] = React.useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const [editName, setEditName] = React.useState("");
  const [editSocialNetwork, setEditSocialNetwork] = React.useState("");
  const [editCountry, setEditCountry] = React.useState("");
  const [editLink, setEditLink] = React.useState("");
  const [editNiche, setEditNiche] = React.useState("");
  const [editCategory, setEditCategory] = React.useState("");
  const [editNotes, setEditNotes] = React.useState("");
  const [editTagsInput, setEditTagsInput] = React.useState("");
  const [prints, setPrints] = React.useState<string[]>([]);
  const [printDraft, setPrintDraft] = React.useState("");
  const [insights, setInsights] = React.useState<ProfileInsight[]>([]);
  const [insightDraft, setInsightDraft] = React.useState("");
  const [exampleDraft, setExampleDraft] = React.useState({
    title: "",
    url: "",
    channel: "instagram",
    analysis: "",
  });
  const [generatingAnalysis, setGeneratingAnalysis] = React.useState(false);
  const [convertingInsight, setConvertingInsight] = React.useState<string | null>(
    null,
  );

  const {
    data: dbExamples = [],
    refetch: refetchExamples,
  } = useModelingContentExamples(selectedProfile?.id);
  const upsertExample = useUpsertModelingContentExampleMutation();
  const deleteExample = useDeleteModelingContentExampleMutation();

  React.useEffect(() => {
    if (selectedProfile) {
      setEditName(selectedProfile.name || "");
      setEditSocialNetwork(selectedProfile.socialNetwork || "");
      setEditCountry(selectedProfile.country || "");
      setEditLink(selectedProfile.link || "");
      setEditNiche(selectedProfile.niche || "");
      setEditCategory(selectedProfile.category || "emerging");
      setEditNotes(selectedProfile.notes || "");
      setEditTagsInput(
        Array.isArray(selectedProfile.tags) ? selectedProfile.tags.join(", ") : "",
      );
      const refs = readRefs(selectedProfile.refs);
      setPrints(refs.prints ?? []);
      setInsights(refs.insights ?? []);
    } else {
      setPrints([]);
      setInsights([]);
    }
  }, [selectedProfile]);

  const examples = dbExamples as any[];

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedProfile) return;

    const tagsArray = editTagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await updateMutation.mutateAsync({
        id: selectedProfile.id,
        input: {
          name: editName,
          socialNetwork: editSocialNetwork,
          country: editCountry,
          link: editLink,
          niche: editNiche,
          category: editCategory,
          notes: editNotes,
          tags: tagsArray,
          refs: { prints, insights },
        },
      });
      toast.success("Perfil de modelagem atualizado com sucesso!");
      setIsSheetOpen(false);
    } catch (err: any) {
      toast.error("Erro ao salvar perfil: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    if (!confirm(`Deseja realmente apagar o perfil de "${editName}"?`)) return;

    try {
      await deleteMutation.mutateAsync(selectedProfile.id);
      toast.success("Perfil excluído com sucesso!");
      setIsSheetOpen(false);
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleAddPrint = () => {
    const url = printDraft.trim();
    if (!url) return;
    if (prints.includes(url)) {
      toast.info("Print já adicionado");
      return;
    }
    setPrints((prev) => [...prev, url]);
    setPrintDraft("");
  };

  const handleRemovePrint = (url: string) => {
    setPrints((prev) => prev.filter((p) => p !== url));
  };

  const handleAddInsight = () => {
    const body = insightDraft.trim();
    if (!body) return;
    setInsights((prev) => [
      ...prev,
      { id: `ins_${Date.now()}`, body, createdAt: new Date().toISOString() },
    ]);
    setInsightDraft("");
  };

  const handleRemoveInsight = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const handleInsightToTask = async (insight: ProfileInsight) => {
    if (!activeWorkspaceId) return;
    setConvertingInsight(insight.id);
    try {
      await createTask.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        title: insight.body.slice(0, 80),
        description: `Insight da modelagem de ${editName || selectedProfile?.name}: ${insight.body}`,
        priority: "medium",
        status: "todo",
        labels: ["modelagem", "insight"],
      });
      toast.success("Insight virou tarefa");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar tarefa");
    } finally {
      setConvertingInsight(null);
    }
  };

  const handleInsightToContent = async (insight: ProfileInsight) => {
    if (!activeWorkspaceId) return;
    setConvertingInsight(insight.id);
    try {
      await createContent.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        title: insight.body.slice(0, 80),
        channel: "instagram",
        contentType: "reel",
        status: "idea",
        hook: insight.body,
      });
      toast.success("Insight virou conteúdo (status: ideia)");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar conteúdo");
    } finally {
      setConvertingInsight(null);
    }
  };

  const handleAddExample = async () => {
    if (!selectedProfile) return;
    if (!exampleDraft.title.trim() || !exampleDraft.url.trim()) {
      toast.error("Título e URL são obrigatórios");
      return;
    }
    try {
      await upsertExample.mutateAsync({
        profileId: selectedProfile.id,
        title: exampleDraft.title.trim(),
        url: exampleDraft.url.trim(),
        channel: exampleDraft.channel || undefined,
        analysis: exampleDraft.analysis || undefined,
      });
      setExampleDraft({ title: "", url: "", channel: "instagram", analysis: "" });
      toast.success("Conteúdo analisado adicionado");
      refetchExamples();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao adicionar conteúdo");
    }
  };

  const handleRemoveExample = async (id: string) => {
    if (!selectedProfile) return;
    try {
      await deleteExample.mutateAsync({
        id,
        profileId: selectedProfile.id,
      });
      toast.success("Conteúdo removido");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  const handleGenerateAnalysis = async () => {
    if (!selectedProfile) return;
    setGeneratingAnalysis(true);
    try {
      const res = await fetch("/api/ai/persona-helpers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateModelingAnalysis",
          profile: {
            name: editName,
            socialNetwork: editSocialNetwork,
            country: editCountry,
            niche: editNiche,
            category: editCategory,
            notes: editNotes,
            tags: editTagsInput
              ? editTagsInput.split(",").map((t) => t.trim()).filter(Boolean)
              : [],
            examples: examples.map((x: any) => ({
              title: x.title,
              url: x.url,
              analysis: x.analysis,
            })),
          },
        }),
      });
      if (!res.ok) throw new Error("Falha na geração");
      const data = (await res.json()) as {
        text: string;
        provider?: string;
      };
      const lines = data.text
        .split("\n")
        .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
        .filter((l) => l.length > 4);
      if (lines.length === 0) {
        toast.info("A IA não retornou insights — tente novamente");
        return;
      }
      const newInsights: ProfileInsight[] = lines.map((body) => ({
        id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        body,
        createdAt: new Date().toISOString(),
      }));
      setInsights((prev) => [...prev, ...newInsights]);
      toast.success(
        `${newInsights.length} insight${newInsights.length === 1 ? "" : "s"} gerado${newInsights.length === 1 ? "" : "s"} (${data.provider ?? "ia"})`,
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar análise");
    } finally {
      setGeneratingAnalysis(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelagem"
        description="Engenharia reversa · perfis estudados, padrões, categorias."
        actions={
          <Button variant="gradient" size="sm" onClick={handleAddProfile}>
            <Plus className="h-4 w-4" /> Adicionar Perfil
          </Button>
        }
      />
      <PersonaHero persona={persona} pageBadge="modelagem" />

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar nome, nicho, tag…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline">{profiles.length} perfis</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map((p: any) => (
          <Card
            key={p.id}
            variant="elevated"
            className="hover:border-primary/60 hover:shadow-glow-muted transition cursor-pointer"
            onClick={() => {
              setSelectedProfile(p);
              setIsSheetOpen(true);
            }}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${persona.accent}, #2a3ef5)`,
                  }}
                >
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{p.name}</p>
                    <Badge
                      size="sm"
                      variant={categoryColor[p.category as keyof typeof categoryColor] || "outline"}
                    >
                      {p.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.socialNetwork} · {p.country} · {formatCompact(p.followers ?? 0)}
                  </p>
                </div>
              </div>

              {p.notes && <p className="text-xs text-muted-foreground line-clamp-3">{p.notes}</p>}

              {p.tags && p.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t: string) => (
                    <Badge key={t} variant="ghost" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              {(() => {
                const refs = readRefs(p.refs);
                const insightCount = refs.insights?.length ?? 0;
                const printCount = refs.prints?.length ?? 0;
                if (insightCount === 0 && printCount === 0) return null;
                return (
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {insightCount > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <Lightbulb className="h-3 w-3" /> {insightCount}
                      </span>
                    )}
                    {printCount > 0 && (
                      <span className="inline-flex items-center gap-0.5">
                        <ImageIcon className="h-3 w-3" /> {printCount}
                      </span>
                    )}
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <Badge variant="outline" size="sm">
                  {p.niche}
                </Badge>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  abrir <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader className="mb-4">
            <SheetTitle>Editar Perfil de Modelagem</SheetTitle>
            <SheetDescription>
              Ajuste as informações coletadas para engenharia reversa do concorrente ou referência.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nome / Perfil</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="socialNetwork">Rede Social</Label>
                <Input
                  id="socialNetwork"
                  value={editSocialNetwork}
                  onChange={(e) => setEditSocialNetwork(e.target.value)}
                  placeholder="ex: Instagram, TikTok"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="country">País</Label>
                <Input
                  id="country"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="ex: Brasil, EUA"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="link">Link do Perfil</Label>
              <Input
                id="link"
                value={editLink}
                onChange={(e) => setEditLink(e.target.value)}
                placeholder="https://"
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="niche">Nicho</Label>
                <Input
                  id="niche"
                  value={editNiche}
                  onChange={(e) => setEditNiche(e.target.value)}
                  placeholder="ex: Finanças, Fitness"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="emerging">Emerging</option>
                  <option value="hidden_gem">Hidden Gem</option>
                  <option value="big_creator">Big Creator</option>
                  <option value="authority">Authority</option>
                  <option value="competitor">Competitor</option>
                  <option value="international">International</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={editTagsInput}
                onChange={(e) => setEditTagsInput(e.target.value)}
                placeholder="reels, copy, lancamento"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notas / Padrões Estudados</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Padrão de hook, estilo de edição, funil utilizado..."
              />
            </div>

            {/* Prints */}
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <ImageIcon className="h-3 w-3" /> Prints ({prints.length})
                </Label>
              </div>
              {prints.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {prints.map((url) => (
                    <div
                      key={url}
                      className="group relative aspect-square rounded-md border border-border/60 bg-card-elevated overflow-hidden"
                    >
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePrint(url)}
                        className="absolute top-1 right-1 rounded bg-black/70 p-0.5 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  value={printDraft}
                  onChange={(e) => setPrintDraft(e.target.value)}
                  placeholder="URL do print"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPrint();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPrint}
                  disabled={!printDraft.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Lightbulb className="h-3 w-3" /> Insights ({insights.length})
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateAnalysis}
                  disabled={generatingAnalysis}
                  className="h-7"
                >
                  <Wand2 className="h-3 w-3" />
                  {generatingAnalysis ? "Gerando..." : "Gerar com IA"}
                </Button>
              </div>
              <div className="space-y-1.5">
                {insights.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Sem insights ainda. Adicione manualmente ou use "Gerar com IA".
                  </p>
                )}
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className="rounded-md border border-border/60 bg-background/40 p-2.5 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs flex-1">{ins.body}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveInsight(ins.id)}
                        className="text-muted-foreground hover:text-destructive transition shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => handleInsightToTask(ins)}
                        disabled={convertingInsight === ins.id}
                      >
                        <ListChecks className="h-3 w-3" /> Virar tarefa
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 text-[10px]"
                        onClick={() => handleInsightToContent(ins)}
                        disabled={convertingInsight === ins.id}
                      >
                        <Sparkles className="h-3 w-3" /> Virar conteúdo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={insightDraft}
                  onChange={(e) => setInsightDraft(e.target.value)}
                  placeholder="Novo insight (padrão observado, hipótese, ação)"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddInsight();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddInsight}
                  disabled={!insightDraft.trim()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Conteúdos analisados */}
            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <Label className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                <Video className="h-3 w-3" /> Conteúdos analisados ({examples.length})
              </Label>
              <div className="space-y-1.5">
                {examples.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Nenhum conteúdo registrado.
                  </p>
                )}
                {examples.map((ex: any) => (
                  <div
                    key={ex.id}
                    className="rounded-md border border-border/60 bg-background/40 p-2.5 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{ex.title}</p>
                        <a
                          href={ex.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-primary hover:underline truncate inline-block max-w-full"
                        >
                          {ex.url}
                        </a>
                      </div>
                      {ex.channel && (
                        <Badge size="sm" variant="outline" className="capitalize">
                          {ex.channel}
                        </Badge>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveExample(ex.id)}
                        className="text-muted-foreground hover:text-destructive transition shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {ex.analysis && (
                      <p className="text-[10px] text-muted-foreground whitespace-pre-wrap">
                        {ex.analysis}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 border-t border-border/40 pt-2">
                <div className="grid grid-cols-2 gap-1.5">
                  <Input
                    value={exampleDraft.title}
                    onChange={(e) =>
                      setExampleDraft((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Título"
                    className="h-8 text-xs"
                  />
                  <Input
                    value={exampleDraft.channel}
                    onChange={(e) =>
                      setExampleDraft((prev) => ({
                        ...prev,
                        channel: e.target.value,
                      }))
                    }
                    placeholder="Canal"
                    className="h-8 text-xs"
                  />
                </div>
                <Input
                  value={exampleDraft.url}
                  onChange={(e) =>
                    setExampleDraft((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="URL do conteúdo"
                  className="h-8 text-xs"
                />
                <Textarea
                  value={exampleDraft.analysis}
                  onChange={(e) =>
                    setExampleDraft((prev) => ({
                      ...prev,
                      analysis: e.target.value,
                    }))
                  }
                  placeholder="Análise: hook, estrutura, CTA…"
                  rows={2}
                  className="text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddExample}
                  disabled={upsertExample.isPending}
                  className="w-full"
                >
                  <Plus className="h-3 w-3" />
                  {upsertExample.isPending ? "Salvando..." : "Adicionar conteúdo"}
                </Button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-4 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
