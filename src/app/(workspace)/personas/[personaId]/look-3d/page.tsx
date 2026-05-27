"use client";

import * as React from "react";
import { Sparkles, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useUpsertPersonaMutation } from "@/hooks/use-queries";
import { toast } from "sonner";

export default function LookPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const upsertMutation = useUpsertPersonaMutation();

  const [name, setName] = React.useState("");
  const [codename, setCodename] = React.useState("");
  const [status, setStatus] = React.useState<"active" | "building" | "paused" | "archived">("building");
  const [niche, setNiche] = React.useState("");
  const [bigIdea, setBigIdea] = React.useState("");
  const [bioShort, setBioShort] = React.useState("");
  const [voiceTone, setVoiceTone] = React.useState("");
  const [archetype, setArchetype] = React.useState("");

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
    }
  }, [persona]);

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
        description="Tudo o que define a persona como uma entidade única."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button variant="gradient" size="sm">
              <Sparkles className="h-4 w-4" /> Refinar com IA
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
                className="flex h-9 w-full rounded-md border border-border/60 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="active" className="bg-card text-foreground">Active</option>
                <option value="building" className="bg-card text-foreground">Building</option>
                <option value="paused" className="bg-card text-foreground">Paused</option>
                <option value="archived" className="bg-card text-foreground">Archived</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-niche">Nicho</Label>
              <Input id="field-niche" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="field-bigIdea">Big idea</Label>
              <Textarea id="field-bigIdea" value={bigIdea} onChange={(e) => setBigIdea(e.target.value)} rows={3} />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label htmlFor="field-bioShort">Bio curta</Label>
              <Textarea id="field-bioShort" value={bioShort} onChange={(e) => setBioShort(e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voz e personalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="field-voiceTone">Tom de voz</Label>
              <Input id="field-voiceTone" value={voiceTone} onChange={(e) => setVoiceTone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="field-archetype">Arquétipo</Label>
              <Input id="field-archetype" value={archetype} onChange={(e) => setArchetype(e.target.value)} />
            </div>
            <div>
              <Label>Traços</Label>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {persona.personality?.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estética</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Estilo visual</Label>
              <Input readOnly value={persona.visualStyle || ""} className="bg-transparent opacity-80" />
            </div>
            <div className="space-y-1">
              <Label>Estilo de vestimenta</Label>
              <Input readOnly value={persona.dressStyle || ""} className="bg-transparent opacity-80" />
            </div>
            <div className="space-y-1">
              <Label>Cor accent</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={persona.accent || ""} className="flex-1 bg-transparent opacity-80" />
                <span
                  className="h-4 w-4 rounded-full ring-2 ring-card"
                  style={{ background: persona.accent }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras preferidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {persona.preferredWords?.map((w) => (
              <Badge key={w} variant="success">
                {w}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palavras proibidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {persona.forbiddenWords?.map((w) => (
              <Badge key={w} variant="danger">
                {w}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
