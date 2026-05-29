"use client";

import * as React from "react";
import {
  Heart,
  Instagram,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  BarChart2,
  Lightbulb,
  Eye,
  Share2,
  Copy,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { WeeklyGrid, SlotEditorDialog, PILLARS } from "@/components/content/weekly-grid";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { MOCK_CONTENT } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCompact, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useContent, useCreateContentMutation } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useRealtimeContent } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function InstagramPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();
  const createContent = useCreateContentMutation();

  useRealtimeContent(activeWorkspaceId ?? undefined, persona.id);

  // States for dynamic editing modal
  const [editingItem, setEditingItem] = React.useState<{
    date: Date;
    item?: any;
  } | null>(null);

  // States for Ideas Bank form
  const [ideaTitle, setIdeaTitle] = React.useState("");
  const [ideaType, setIdeaType] = React.useState("reel");
  const [ideaPillar, setIdeaPillar] = React.useState("tips");

  // State for AI Pauta generation
  const [isGeneratingPauta, setIsGeneratingPauta] = React.useState(false);

  const allContent =
    isMockModeClient && dbContent.length === 0
      ? MOCK_CONTENT.filter((c) => c.personaId === persona.id)
      : dbContent;

  const items = allContent.filter(
    (c: any) => c.channel === "instagram"
  );

  const reels = items.filter(
    (c: any) =>
      c.contentType === "reel" ||
      c.contentType === "feed" ||
      c.contentType === "carousel"
  );
  const stories = items.filter((c: any) => c.contentType === "story");
  const ideas = items.filter((c: any) => c.status === "idea");

  // ---------------------------------------------------------------------------
  // Week dates configuration for SlotEditorDialog
  // ---------------------------------------------------------------------------
  const weekStart = React.useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const r = new Date(d);
    r.setDate(d.getDate() + diff);
    r.setHours(0, 0, 0, 0);
    return r;
  }, []);

  const weekDates = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const r = new Date(weekStart);
        r.setDate(weekStart.getDate() + i);
        return r;
      }),
    [weekStart]
  );

  // ---------------------------------------------------------------------------
  // Metrics calculation
  // ---------------------------------------------------------------------------
  const postedItems = React.useMemo(() => {
    return items.filter(
      (c: any) => c.status === "posted" || c.status === "analyzed"
    );
  }, [items]);

  const topReels = React.useMemo(() => {
    return [...postedItems]
      .sort((a: any, b: any) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
      .slice(0, 5);
  }, [postedItems]);

  const viewsTrend = React.useMemo(() => {
    if (postedItems.length === 0) {
      return Array.from({ length: 6 }, (_, i) => ({
        label: `Semana ${i + 1}`,
        value: 2500 + i * 850,
      }));
    }
    return postedItems.slice(-10).map((p: any) => ({
      label: p.title.slice(0, 10) + "...",
      value: p.metrics?.views ?? 0,
    }));
  }, [postedItems]);

  const pillarShares = React.useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((it: any) => {
      const p = it.pillar ?? "neutral";
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleAddIdea = async () => {
    if (!ideaTitle.trim() || !activeWorkspaceId) return;
    try {
      await createContent.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        title: ideaTitle.trim(),
        contentType: ideaType,
        pillar: ideaPillar,
        channel: "instagram",
        status: "idea",
        scheduledAt: null,
      });
      setIdeaTitle("");
      toast.success("Ideia adicionada ao Banco de Ideias!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar ideia");
    }
  };

  const handleGeneratePauta = async () => {
    if (!activeWorkspaceId) return;
    setIsGeneratingPauta(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const generated = [
          {
            title: "O maior erro na hora de delegar tarefas para time criativo",
            contentType: "reel",
            pillar: "tips",
          },
          {
            title: "Como estruturamos nossa operação Zayon sem código",
            contentType: "carousel",
            pillar: "behind",
          },
          {
            title: "Minha opinião sincera sobre a nova IA do Google",
            contentType: "feed",
            pillar: "opinion",
          },
        ];

        for (const item of generated) {
          await createContent.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona.id,
            title: item.title,
            contentType: item.contentType,
            pillar: item.pillar,
            channel: "instagram",
            status: "idea",
            scheduledAt: null,
          });
        }
        resolve(true);
      } catch (e) {
        reject(e);
      }
    });

    toast.promise(promise, {
      loading: "Gerando 3 ideias criativas personalizadas...",
      success: "Pauta gerada! As ideias foram adicionadas no Banco de Ideias.",
      error: "Falha ao gerar ideias de pauta.",
    });

    try {
      await promise;
    } catch {}
    setIsGeneratingPauta(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram Studio"
        description="Planejador completo de Instagram. Crie roteiros, agende e meça resultados."
        badge={
          <Badge variant="primary">
            <Instagram className="h-3 w-3" /> @{persona.codename?.toLowerCase() ?? "persona"}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGeneratePauta}
              disabled={isGeneratingPauta || !activeWorkspaceId}
            >
              <Sparkles className="h-3.5 w-3.5" /> Gerar pauta
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("content")}>
              <Plus className="h-4 w-4" /> Novo post
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="instagram" />

      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Roteiros Semanais</TabsTrigger>
          <TabsTrigger value="reels">Reels & Feed</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="ideas">Banco de Ideias</TabsTrigger>
        </TabsList>

        {/* --- TAB: ROTEIROS SEMANAIS --- */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Roteiros Semanais (Grade de Slots)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Arraste posts entre horários e clique para editar visual, legenda, roteiro falado e CTAs.
              </p>
            </CardHeader>
            <CardContent>
              <WeeklyGrid
                items={items as any}
                channel="instagram"
                workspaceId={activeWorkspaceId}
                personaId={persona.id}
                defaultContentType="reel"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: REELS & FEED --- */}
        <TabsContent value="reels">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reels.map((r: any) => (
              <Card
                key={r.id}
                className="overflow-hidden hover:border-primary/40 transition group cursor-pointer"
                onClick={() => setEditingItem({ date: new Date(), item: r })}
              >
                <div
                  className="aspect-[4/5] relative flex items-end p-3"
                  style={{
                    background: `linear-gradient(180deg, ${persona.accent || "#e1306c"}30 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)`,
                  }}
                >
                  <div className="text-white">
                    <Badge size="sm" variant="outline" className="border-white/40 text-white bg-black/40">
                      {r.contentType}
                    </Badge>
                    <p className="mt-2 text-sm font-medium line-clamp-2">{r.title}</p>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge size="sm" variant={r.status === "posted" ? "success" : r.status === "idea" ? "outline" : "warning"}>
                      {r.status}
                    </Badge>
                    {(r.scheduledAt || r.publishedAt) && (
                      <span className="text-muted-foreground">
                        {relativeTime(r.scheduledAt ?? r.publishedAt!)}
                      </span>
                    )}
                  </div>
                  {r.metrics && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/10">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-500" />
                        {formatCompact(r.metrics.likes ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3 text-sky-500" />
                        {formatCompact(r.metrics.comments ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3 text-emerald-500" />
                        {formatCompact(r.metrics.shares ?? 0)}
                      </span>
                      <span className="ml-auto num text-foreground font-medium flex items-center gap-0.5">
                        <Eye className="h-3 w-3 text-primary/70" />
                        {formatCompact(r.metrics.views ?? 0)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {reels.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground text-sm border border-dashed border-border/60 rounded-xl">
                Nenhum Reels ou post no Feed cadastrado para esta persona.
              </div>
            )}
          </div>
        </TabsContent>

        {/* --- TAB: STORIES --- */}
        <TabsContent value="stories">
          <Card>
            <CardHeader>
              <CardTitle>Sequência Narrativa (Stories)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Telas planejadas para engajamento diário. Clique em um card para editar roteiro falado e CTAs.
              </p>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stories.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setEditingItem({ date: new Date(), item: s })}
                  className="aspect-[9/16] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition border border-white/10"
                  style={{
                    background: `linear-gradient(180deg, ${persona.accent || "#e1306c"}40, ${persona.accent || "#e1306c"}10)`,
                  }}
                >
                  <Badge size="sm" variant="outline" className="w-fit border-white/40 bg-black/40 text-white">
                    {s.pillar || "Stories"}
                  </Badge>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-white drop-shadow-md">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-white/80 mt-1 drop-shadow">
                      {s.status} · {s.scheduledAt && relativeTime(s.scheduledAt)}
                    </p>
                  </div>
                </div>
              ))}
              {stories.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                  Nenhuma sequência de Stories configurada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: METRICS (NOVA) --- */}
        <TabsContent value="metrics">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Evolução de Visualizações (Instagram)</CardTitle>
                <p className="text-xs text-muted-foreground">Views por post analisado no Instagram.</p>
              </CardHeader>
              <CardContent>
                <AreaChart
                  data={viewsTrend}
                  color={persona.accent || "#e1306c"}
                  formatter={(v) => formatCompact(v)}
                  height={220}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performance</CardTitle>
                <p className="text-xs text-muted-foreground">Posts com maior engajamento visual.</p>
              </CardHeader>
              <CardContent>
                {topReels.length > 0 ? (
                  <BarChart
                    data={topReels.map((v: any) => ({
                      label: v.title.slice(0, 15) + "…",
                      value: v.metrics?.views ?? 0,
                    }))}
                    horizontal
                    color={persona.accent || "#e1306c"}
                    formatter={(v) => formatCompact(v)}
                    height={220}
                  />
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs text-center px-4">
                    Nenhum post publicado com métricas registradas. Altere o status de um slot para 'Postado' e registre os dados.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Pilar</CardTitle>
                <p className="text-xs text-muted-foreground">Foco temático da persona.</p>
              </CardHeader>
              <CardContent>
                {pillarShares.length > 0 ? (
                  <PieChart data={pillarShares} height={220} />
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
                    Sem posts cadastrados.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* --- TAB: BANCO DE IDEIAS (NOVA) --- */}
        <TabsContent value="ideas">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Banco de Ideias / Pautas</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Ideias de posts que ainda não foram agendadas na grade semanal. Clique para detalhar ou agendar.
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {ideas.map((id: any) => (
                  <div
                    key={id.id}
                    onClick={() => setEditingItem({ date: new Date(), item: id })}
                    className="flex items-center justify-between p-3 rounded-lg bg-card-elevated hover:bg-card-elevated/80 border border-border/50 cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{id.title}</p>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        <Badge variant="ghost" size="sm" className="capitalize text-[10px]">
                          {id.contentType}
                        </Badge>
                        {id.pillar && (
                          <Badge variant="outline" size="sm" className="capitalize text-[10px]">
                            {PILLARS.find((p) => p.id === id.pillar)?.label ?? id.pillar}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs border border-white/5 bg-white/5">
                      Planejar / Agendar
                    </Button>
                  </div>
                ))}
                {ideas.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-xs border border-dashed border-border/40 rounded-lg">
                    Nenhuma ideia pendente. Cadastre novas ideias no formulário ao lado ou use a IA para gerar pauta no topo!
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cadastrar Nova Ideia</CardTitle>
                <p className="text-xs text-muted-foreground">Grave ideias rápidas para amadurecer depois.</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Título da Ideia</Label>
                  <textarea
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Ex: Por que a maioria falha no marketing de automação..."
                    rows={3}
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Formato</Label>
                  <select
                    value={ideaType}
                    onChange={(e) => setIdeaType(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="reel">Reels</option>
                    <option value="feed">Feed Post</option>
                    <option value="carousel">Carrossel</option>
                    <option value="story">Story</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pilar</Label>
                  <select
                    value={ideaPillar}
                    onChange={(e) => setIdeaPillar(e.target.value)}
                    className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    {PILLARS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="gradient"
                  className="w-full text-xs"
                  onClick={handleAddIdea}
                  disabled={!ideaTitle.trim() || createContent.isPending}
                >
                  {createContent.isPending ? "Salvando..." : "Salvar no Banco"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Slots and Ideas editor wrapper */}
      {editingItem && (
        <SlotEditorDialog
          open
          onClose={() => setEditingItem(null)}
          date={editingItem.item?.scheduledAt ? new Date(editingItem.item.scheduledAt) : editingItem.date}
          defaultContentType={editingItem.item?.contentType ?? "reel"}
          item={editingItem.item}
          channel="instagram"
          workspaceId={activeWorkspaceId}
          personaId={persona.id}
          weekDates={weekDates}
        />
      )}
    </div>
  );
}
