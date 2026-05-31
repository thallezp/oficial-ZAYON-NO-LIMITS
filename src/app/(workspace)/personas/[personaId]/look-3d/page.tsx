"use client";

import * as React from "react";
import {
  FileText,
  History,
  Image as ImageIcon,
  Plus,
  Radio,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useUpsertPersonaMutation,
  useUpsertPersonaChannelMutation,
  useDeletePersonaChannelMutation,
  useCreateDocumentMutation,
  useActivityLogs,
} from "@/hooks/use-queries";
import { relativeTime } from "@/lib/utils/format";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";

const CHANNEL_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Email" },
  { value: "telegram", label: "Telegram" },
  { value: "twitter", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "site", label: "Site" },
];

const PERSONA_LOG_ACTIONS = new Set([
  "upsertPersona",
  "upsertPersonaChannel",
  "deletePersonaChannel",
  "ai_generateBio",
  "ai_generateVoiceTone",
]);

export default function LookPage() {
  const persona = usePersonaFromRoute();
  const router = useRouter();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertMutation = useUpsertPersonaMutation();
  const upsertChannel = useUpsertPersonaChannelMutation();
  const deleteChannel = useDeletePersonaChannelMutation();
  const createDocument = useCreateDocumentMutation();
  const { data: dbActivity = [] } = useActivityLogs(activeWorkspaceId);

  const [name, setName] = React.useState("");
  const [codename, setCodename] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "building" | "paused" | "archived">("building");
  const [niche, setNiche] = React.useState("");
  const [bigIdea, setBigIdea] = React.useState("");
  const [bioShort, setBioShort] = React.useState("");
  const [voiceTone, setVoiceTone] = React.useState("");
  const [archetype, setArchetype] = React.useState("");
  const [visualStyle, setVisualStyle] = React.useState("");
  const [dressStyle, setDressStyle] = React.useState("");
  const [personality, setPersonality] = React.useState("");
  const [preferredWords, setPreferredWords] = React.useState("");
  const [forbiddenWords, setForbiddenWords] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [coverUrl, setCoverUrl] = React.useState("");
  const [references, setReferences] = React.useState<string[]>([]);
  const [refDraft, setRefDraft] = React.useState("");
  const [channelDraft, setChannelDraft] = React.useState({
    channel: "instagram",
    handle: "",
    url: "",
    followers: "",
  });
  const [generatingBio, setGeneratingBio] = React.useState(false);
  const [generatingVoice, setGeneratingVoice] = React.useState(false);
  const [creatingDoc, setCreatingDoc] = React.useState(false);

  React.useEffect(() => {
    if (persona) {
      setName(persona.name || "");
      setCodename(persona.codename || "");
      setStatus((persona.status as any) || "building");
      setNiche(persona.niche || "");
      setBigIdea(persona.bigIdea || "");
      setBioShort(persona.bioShort || "");
      setVoiceTone(persona.voiceTone || "");
      setArchetype(persona.archetype || "");
      setVisualStyle(persona.visualStyle || "");
      setDressStyle(persona.dressStyle || "");
      setPersonality(persona.personality?.join(", ") || "");
      setPreferredWords(persona.preferredWords?.join(", ") || "");
      setForbiddenWords(persona.forbiddenWords?.join(", ") || "");
      setAvatarUrl(persona.avatarUrl || "");
      setCoverUrl(persona.coverUrl || "");
      const refLinks = (persona as any).referenceLinks;
      if (Array.isArray(refLinks)) setReferences(refLinks.filter(Boolean));
      else setReferences([]);
    }
  }, [persona]);

  const channels = ((persona as any)?.channels ?? []) as Array<{
    id?: string;
    channel: string;
    handle?: string;
    url?: string;
    followers?: number;
  }>;

  const personaLogs = React.useMemo(() => {
    return (dbActivity as any[])
      .filter((a) => {
        if (a.entityType === "persona" && a.entityId === persona.id) return true;
        if (
          PERSONA_LOG_ACTIONS.has(a.action) &&
          a.payload &&
          (a.payload.id === persona.id ||
            a.payload.personaId === persona.id)
        )
          return true;
        return false;
      })
      .slice(0, 8);
  }, [dbActivity, persona.id]);

  const personaSnapshot = () => ({
    name,
    codename: codename || undefined,
    niche: niche || undefined,
    bigIdea: bigIdea || undefined,
    archetype: archetype || undefined,
    visualStyle: visualStyle || undefined,
    dressStyle: dressStyle || undefined,
    personality: personality
      ? personality.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    preferredWords: preferredWords
      ? preferredWords.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    forbiddenWords: forbiddenWords
      ? forbiddenWords.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
  });

  const callPersonaAi = async (action: "generateBio" | "generateVoiceTone") => {
    const res = await fetch("/api/ai/persona-helpers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, persona: personaSnapshot() }),
    });
    if (!res.ok) throw new Error("Falha ao gerar texto com IA");
    const data = (await res.json()) as { text: string; provider?: string };
    return data;
  };

  const handleGenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const { text, provider } = await callPersonaAi("generateBio");
      setBioShort(text);
      toast.success(`Bio sugerida (${provider ?? "ia"}) — revise e salve.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar bio");
    } finally {
      setGeneratingBio(false);
    }
  };

  const handleGenerateVoice = async () => {
    setGeneratingVoice(true);
    try {
      const { text, provider } = await callPersonaAi("generateVoiceTone");
      setVoiceTone(text);
      toast.success(`Tom sugerido (${provider ?? "ia"}) — revise e salve.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar tom");
    } finally {
      setGeneratingVoice(false);
    }
  };

  const handleAddReference = () => {
    const url = refDraft.trim();
    if (!url) return;
    if (references.includes(url)) {
      toast.info("Referência já adicionada");
      return;
    }
    setReferences((prev) => [...prev, url]);
    setRefDraft("");
  };

  const handleRemoveReference = (url: string) => {
    setReferences((prev) => prev.filter((r) => r !== url));
  };

  const handleAddChannel = async () => {
    if (!activeWorkspaceId) return;
    if (!channelDraft.channel) {
      toast.error("Escolha o canal");
      return;
    }
    try {
      await upsertChannel.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        channel: channelDraft.channel,
        handle: channelDraft.handle || undefined,
        url: channelDraft.url || undefined,
        followers: channelDraft.followers
          ? Number(channelDraft.followers)
          : undefined,
      });
      toast.success(`Canal ${channelDraft.channel} adicionado`);
      setChannelDraft({
        channel: "instagram",
        handle: "",
        url: "",
        followers: "",
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar canal");
    }
  };

  const handleRemoveChannel = async (channel: any) => {
    if (!channel.id) {
      toast.info("Canal precisa ser salvo antes de ser removido.");
      return;
    }
    try {
      await deleteChannel.mutateAsync({
        id: channel.id,
        personaId: persona.id,
      });
      toast.success(`Canal ${channel.channel} removido`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover canal");
    }
  };

  const handleCreatePositioningDoc = async () => {
    if (!activeWorkspaceId) return;
    setCreatingDoc(true);
    try {
      const sections: string[] = [
        `# Posicionamento — ${name || persona.name}`,
        "",
        codename ? `**Codinome:** ${codename}` : null,
        niche ? `**Nicho:** ${niche}` : null,
        archetype ? `**Arquétipo:** ${archetype}` : null,
        "",
        bigIdea ? `## Big idea\n${bigIdea}` : null,
        bioShort ? `## Bio\n${bioShort}` : null,
        voiceTone ? `## Tom de voz\n${voiceTone}` : null,
        personality
          ? `## Personalidade\n${personality
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
              .map((p) => `- ${p}`)
              .join("\n")}`
          : null,
        visualStyle || dressStyle
          ? `## Estética\n${[
              visualStyle && `- Visual: ${visualStyle}`,
              dressStyle && `- Vestimenta: ${dressStyle}`,
            ]
              .filter(Boolean)
              .join("\n")}`
          : null,
        preferredWords
          ? `## Palavras preferidas\n${preferredWords}`
          : null,
        forbiddenWords
          ? `## Palavras proibidas\n${forbiddenWords}`
          : null,
        references.length > 0
          ? `## Referências visuais\n${references
              .map((r) => `- ${r}`)
              .join("\n")}`
          : null,
        channels.length > 0
          ? `## Canais ativos\n${channels
              .map(
                (c) =>
                  `- ${c.channel}${c.handle ? ` @${c.handle}` : ""}${c.followers ? ` · ${c.followers} seguidores` : ""}`,
              )
              .join("\n")}`
          : null,
      ].filter(Boolean) as string[];

      const created: any = await createDocument.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        title: `Posicionamento — ${name || persona.name}`,
        content: sections.join("\n\n"),
      });
      toast.success("Documento de posicionamento criado");
      const docId = created?.id ?? created?.data?.id;
      if (docId) router.push(`/documents/${docId}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar documento");
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("O nome da persona é obrigatório");
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        id: persona.id,
        workspaceId: activeWorkspaceId,
        name,
        codename: codename || undefined,
        status,
        niche: niche || undefined,
        bigIdea: bigIdea || undefined,
        bioShort: bioShort || undefined,
        voiceTone: voiceTone || undefined,
        archetype: archetype || undefined,
        visualStyle: visualStyle || undefined,
        dressStyle: dressStyle || undefined,
        avatarUrl: avatarUrl || undefined,
        coverUrl: coverUrl || undefined,
        personality: personality ? personality.split(",").map(s => s.trim()).filter(Boolean) : [],
        preferredWords: preferredWords ? preferredWords.split(",").map(s => s.trim()).filter(Boolean) : [],
        forbiddenWords: forbiddenWords ? forbiddenWords.split(",").map(s => s.trim()).filter(Boolean) : [],
        referenceLinks: references,
      });
      toast.success("Persona atualizada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar persona: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Look 3D · Identidade"
        description="Tudo o que define a persona — bio, tom, arquétipo, palavras, referências visuais e canais. Tudo persistido no Supabase."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreatePositioningDoc}
              disabled={creatingDoc}
            >
              <FileText className="h-3.5 w-3.5" />
              {creatingDoc ? "Gerando..." : "Gerar doc de posicionamento"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="identidade" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Posicionamento</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="field-name">Nome</Label>
              <Input id="field-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-codename">Codinome</Label>
              <Input id="field-codename" value={codename} onChange={(e) => setCodename(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-status">Status</Label>
              <select
                id="field-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="flex h-9 w-full rounded-md border border-border/60 bg-card px-3 py-1 text-sm shadow-sm transition-colors outline-none focus-visible:outline-none"
              >
                <option value="active">Active</option>
                <option value="building">Building</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-niche">Nicho</Label>
              <Input id="field-niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Foto / Avatar da persona</Label>
              <div className="flex flex-wrap items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="h-14 w-14 rounded-lg object-cover border border-border/60"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.display =
                        "none")
                    }
                  />
                ) : (
                  <div className="h-14 w-14 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <ImageUpload
                  folder="personas"
                  label="Upar foto"
                  maxMB={4}
                  onUploaded={(url) => setAvatarUrl(url)}
                />
              </div>
              <Input
                id="field-avatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="ou cole uma URL da imagem"
                className="mt-1"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Capa (cover)</Label>
              <div className="flex flex-wrap items-center gap-3">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="cover"
                    className="h-14 w-24 rounded-lg object-cover border border-border/60"
                    onError={(e) =>
                      ((e.currentTarget as HTMLImageElement).style.display =
                        "none")
                    }
                  />
                ) : (
                  <div className="h-14 w-24 rounded-lg border border-dashed border-border/60 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <ImageUpload
                  folder="personas"
                  label="Upar capa"
                  maxMB={16}
                  onUploaded={(url) => setCoverUrl(url)}
                />
              </div>
              <Input
                id="field-cover"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="ou cole uma URL da imagem"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="field-bigIdea">Big idea</Label>
              <Textarea id="field-bigIdea" value={bigIdea} onChange={(e) => setBigIdea(e.target.value)} rows={3} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-bioShort">Bio curta</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateBio}
                  disabled={generatingBio}
                  className="h-7"
                >
                  <Wand2 className="h-3 w-3" />
                  {generatingBio ? "Gerando..." : "Gerar com IA"}
                </Button>
              </div>
              <Textarea
                id="field-bioShort"
                value={bioShort}
                onChange={(e) => setBioShort(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voz e personalidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="field-voiceTone">Tom de voz</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateVoice}
                    disabled={generatingVoice}
                    className="h-7"
                  >
                    <Wand2 className="h-3 w-3" />
                    {generatingVoice ? "Gerando..." : "Gerar com IA"}
                  </Button>
                </div>
                <Input
                  id="field-voiceTone"
                  value={voiceTone}
                  onChange={(e) => setVoiceTone(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-archetype">Arquétipo</Label>
                <Input id="field-archetype" value={archetype} onChange={(e) => setArchetype(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-personality">Traços de Personalidade (separados por vírgula)</Label>
                <Input id="field-personality" value={personality} onChange={(e) => setPersonality(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estética</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="field-visualStyle">Estilo visual</Label>
                <Input id="field-visualStyle" value={visualStyle} onChange={(e) => setVisualStyle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="field-dressStyle">Estilo de vestimenta</Label>
                <Input id="field-dressStyle" value={dressStyle} onChange={(e) => setDressStyle(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Palavras preferidas (separadas por vírgula)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={preferredWords}
              onChange={(e) => setPreferredWords(e.target.value)}
              placeholder="Ex: exuberante, silêncio, autenticidade"
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras proibidas (separadas por vírgula)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={forbiddenWords}
              onChange={(e) => setForbiddenWords(e.target.value)}
              placeholder="Ex: fofo, polêmica, galera"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Referências visuais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              Referências visuais
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              URLs de moodboard, palettes, vídeos ou imagens. Persistidas em{" "}
              <code>personas.reference_links</code>.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {references.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {references.map((url) => (
                  <div
                    key={url}
                    className="group relative aspect-video rounded-lg border border-border/60 bg-card-elevated overflow-hidden"
                  >
                    {/^https?:\/\//.test(url) ? (
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-end justify-between p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-white truncate flex-1"
                        title={url}
                      >
                        {url}
                      </a>
                      <button
                        onClick={() => handleRemoveReference(url)}
                        className="text-white/80 hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={refDraft}
                onChange={(e) => setRefDraft(e.target.value)}
                placeholder="https://link-da-referencia"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddReference();
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddReference}
                disabled={!refDraft.trim()}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              As alterações entram no banco quando você clicar em "Salvar
              Alterações".
            </p>
          </CardContent>
        </Card>

        {/* Canais ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" />
              Canais ativos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {channels.length} canal{channels.length === 1 ? "" : "is"}{" "}
              cadastrado{channels.length === 1 ? "" : "s"}.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              {channels.length === 0 && (
                <p className="text-[11px] text-muted-foreground italic">
                  Nenhum canal cadastrado ainda.
                </p>
              )}
              {channels.map((c, i) => (
                <div
                  key={c.id ?? `${c.channel}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card-elevated px-2.5 py-1.5"
                >
                  <Badge size="sm" variant="outline" className="capitalize">
                    {c.channel}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {c.handle ? `@${c.handle}` : c.url || "—"}
                    </p>
                    {c.followers !== undefined && c.followers > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {c.followers.toLocaleString("pt-BR")} seguidores
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveChannel(c)}
                    className="text-muted-foreground hover:text-destructive transition"
                    title="Remover canal"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-1.5 border-t border-border/60 pt-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Adicionar canal
              </p>
              <Select
                value={channelDraft.channel}
                onValueChange={(v) =>
                  setChannelDraft((prev) => ({ ...prev, channel: v }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={channelDraft.handle}
                onChange={(e) =>
                  setChannelDraft((prev) => ({ ...prev, handle: e.target.value }))
                }
                placeholder="@handle"
                className="h-8 text-xs"
              />
              <Input
                value={channelDraft.url}
                onChange={(e) =>
                  setChannelDraft((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="https://"
                className="h-8 text-xs"
              />
              <Input
                value={channelDraft.followers}
                onChange={(e) =>
                  setChannelDraft((prev) => ({
                    ...prev,
                    followers: e.target.value,
                  }))
                }
                placeholder="Seguidores"
                type="number"
                className="h-8 text-xs"
              />
              <Button
                size="sm"
                onClick={handleAddChannel}
                disabled={upsertChannel.isPending}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5" />
                {upsertChannel.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de alterações */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico de alterações
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Eventos de <code>activity_logs</code> ligados a esta persona.
            </p>
          </CardHeader>
          <CardContent>
            {personaLogs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">
                Nenhuma alteração registrada ainda.
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {personaLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {log.actorType === "ai" ? (
                        <Sparkles className="h-3 w-3 text-primary" />
                      ) : (
                        <History className="h-3 w-3 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">
                          {log.actor?.fullName ?? (log.actorType === "ai" ? "ZAYON AI" : "Sistema")}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {log.action}
                        </span>
                      </p>
                      {log.entityType && (
                        <p className="text-[10px] text-muted-foreground/60">
                          {log.entityType} · {relativeTime(log.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
