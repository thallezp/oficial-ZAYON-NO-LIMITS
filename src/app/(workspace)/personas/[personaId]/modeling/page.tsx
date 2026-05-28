"use client";

import * as React from "react";
import { ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_MODELING } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCompact, initials } from "@/lib/utils/format";
import {
  useModeling,
  useUpdateModelingProfileMutation,
  useDeleteModelingProfileMutation,
} from "@/hooks/use-queries";
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
  const [search, setSearch] = React.useState("");
  const { data: dbModeling = [] } = useModeling(persona.id);
  const updateMutation = useUpdateModelingProfileMutation();
  const deleteMutation = useDeleteModelingProfileMutation();

  const allProfiles =
    isMockModeClient && dbModeling.length === 0
      ? MOCK_MODELING.filter((m) => m.personaId === persona.id)
      : dbModeling;

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
    }
  }, [selectedProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
