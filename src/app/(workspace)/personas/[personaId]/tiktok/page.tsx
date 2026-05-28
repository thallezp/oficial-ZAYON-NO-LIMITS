"use client";

import * as React from "react";
import {
  BarChart2,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Music2,
  Plus,
  Share2,
  Sparkles,
  Timer,
  Trash2,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { WeeklyGrid } from "@/components/content/weekly-grid";
import { BarChart } from "@/components/charts/bar-chart";
import { AreaChart } from "@/components/charts/area-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { MOCK_CONTENT } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCompact, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import {
  useContent,
  useContentHooks,
  useCreateHookMutation,
  useDeleteHookMutation,
  useUpdateHookMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useRealtimeContent } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const HOOK_CATEGORIES = [
  { id: "educational", label: "Educacional" },
  { id: "objection", label: "Quebra de objeção" },
  { id: "authority", label: "Autoridade" },
  { id: "pain", label: "Dor / Problema" },
  { id: "curiosity", label: "Curiosidade" },
  { id: "contrast", label: "Contraste" },
  { id: "custom", label: "Personalizado" },
];

const SUGGESTED_HOOKS = [
  { text: "O segredo do algoritmo do TikTok revelado em 3 passos...", category: "educational", tag: "Algoritmo" },
  { text: "Pare de fazer isso agora se você quer vender na internet...", category: "objection", tag: "Vendas" },
  { text: "Como consegui faturar R$ 10k em 15 dias sem equipe...", category: "authority", tag: "Ganhos" },
  { text: "O maior erro dos criadores de conteúdo iniciantes...", category: "pain", tag: "Erros" },
];

export default function TikTokPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();

  useRealtimeContent(activeWorkspaceId ?? undefined, persona.id);

  // Banco de hooks persistido em content_hooks (Supabase)
  const { data: dbHooks = [] } = useContentHooks(activeWorkspaceId, persona.id);
  const createHook = useCreateHookMutation();
  const updateHook = useUpdateHookMutation();
  const deleteHook = useDeleteHookMutation();
  const [newHookText, setNewHookText] = React.useState("");
  const [newHookCategory, setNewHookCategory] = React.useState("custom");
  const [newHookTag, setNewHookTag] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("weekly");
  const [hookFilter, setHookFilter] = React.useState<string>("all");

  const allContent =
    isMockModeClient && dbContent.length === 0
      ? MOCK_CONTENT.filter((c) => c.personaId === persona.id)
      : dbContent;

  const items = allContent.filter(
    (c: any) => c.channel === "tiktok",
  );

  const videos = items.filter((c: any) => c.contentType === "video" || c.contentType === "reel" || c.contentType === "short");
  const stories = items.filter((c: any) => c.contentType === "story");

  // Dynamic metrics aggregations
  const topVideos = React.useMemo(() => {
    return [...videos]
      .filter((c: any) => c.metrics?.views)
      .sort((a: any, b: any) => ((b as any).metrics?.views ?? 0) - ((a as any).metrics?.views ?? 0))
      .slice(0, 5);
  }, [videos]);

  const viewsTrend = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const value = videos.slice(0, i + 1).reduce((sum: number, v: any) => sum + (v.metrics?.views ?? 0), 0);
      return {
        label: `V${i + 1}`,
        value: value || Math.round(5000 + i * 1500),
      };
    });
  }, [videos]);

  const pillarShares = React.useMemo(() => {
    const map = new Map<string, number>();
    videos.forEach((v: any) => {
      const p = v.pillar ?? "neutro";
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [videos]);

  const handleCopyHook = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Hook copiado para a área de transferência!");
  };

  const handleAddHook = async () => {
    if (!newHookText.trim() || !activeWorkspaceId) return;
    try {
      await createHook.mutateAsync({
        workspaceId: activeWorkspaceId,
        personaId: persona.id,
        text: newHookText.trim(),
        category: newHookCategory,
        tag: newHookTag.trim() || null,
      });
      setNewHookText("");
      setNewHookTag("");
      setNewHookCategory("custom");
      toast.success("Hook salvo no banco!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar hook");
    }
  };

  const handleSeedSuggestions = async () => {
    if (!activeWorkspaceId) return;
    try {
      for (const sug of SUGGESTED_HOOKS) {
        await createHook.mutateAsync({
          workspaceId: activeWorkspaceId,
          personaId: persona.id,
          text: sug.text,
          category: sug.category,
          tag: sug.tag,
        });
      }
      toast.success("4 hooks sugeridos adicionados");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao adicionar sugestões");
    }
  };

  const handleDeleteHook = async (id: string) => {
    try {
      await deleteHook.mutateAsync(id);
      toast.success("Hook removido");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao remover");
    }
  };

  const handleMarkTested = async (hook: any) => {
    try {
      const current = hook.tested ?? { count: 0 };
      await updateHook.mutateAsync({
        id: hook.id,
        input: {
          tested: { ...current, count: (current.count ?? 0) + 1, lastUsedAt: new Date().toISOString() },
        },
      });
      toast.success("Marcado como usado em conteúdo");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    }
  };

  const filteredHooks = (dbHooks as any[]).filter(
    (h) => hookFilter === "all" || h.category === hookFilter,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="TikTok Studio"
        description="Foque no planejamento audiovisual. Roteiros semanais, vídeos publicados, métricas e banco de hooks."
        badge={
          <Badge variant="primary">
            <Music2 className="h-3 w-3" /> @{persona.codename?.toLowerCase() ?? "tiktok"}
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => openWith("content")}>
              <Sparkles className="h-3.5 w-3.5" /> IA Copilot
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("content")}>
              <Plus className="h-4 w-4" /> Novo Vídeo
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="tiktok" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly">Roteiros Semanais</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="sequences">Sequências / Stories</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="hooks">Banco de Hooks</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          {activeTab === "weekly" && (
            <Card>
              <CardHeader>
                <CardTitle>Calendário semanal de postagens</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Arraste, adicione slots e clique para criar/editar roteiros e briefs em segundos.
                </p>
              </CardHeader>
              <CardContent>
                <WeeklyGrid
                  items={items as any}
                  channel="tiktok"
                  workspaceId={activeWorkspaceId}
                  personaId={persona.id}
                  defaultContentType="video"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="videos">
          {activeTab === "videos" && (
            <Card>
              <CardHeader>
                <CardTitle>Todos os vídeos</CardTitle>
                <p className="text-xs text-muted-foreground">Vídeos cadastrados, status de gravação e performance.</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                        <th className="px-4 py-3">Título</th>
                        <th className="px-4 py-3">Pilar</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Agendamento</th>
                        <th className="px-4 py-3 text-right">Views</th>
                        <th className="px-4 py-3 text-right">Likes</th>
                        <th className="px-4 py-3 text-right">Retenção</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {videos.map((v: any) => (
                        <tr key={v.id} className="hover:bg-accent cursor-pointer" onClick={() => openWith("content")}>
                          <td className="px-4 py-3 font-medium truncate max-w-[200px]">{v.title}</td>
                          <td className="px-4 py-3 capitalize"><Badge variant="outline">{v.pillar || "neutro"}</Badge></td>
                          <td className="px-4 py-3">
                            <Badge
                              size="sm"
                              variant={v.status === "posted" ? "success" : v.status === "idea" ? "outline" : "warning"}
                            >
                              {v.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {v.scheduledAt ? new Date(v.scheduledAt).toLocaleDateString("pt-BR") : "Não agendado"}
                          </td>
                          <td className="px-4 py-3 text-right num font-mono">{formatCompact(v.metrics?.views ?? 0)}</td>
                          <td className="px-4 py-3 text-right num font-mono">{formatCompact(v.metrics?.likes ?? 0)}</td>
                          <td className="px-4 py-3 text-right num font-mono">{v.metrics?.retention ? `${v.metrics.retention}%` : "—"}</td>
                        </tr>
                      ))}
                      {videos.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum vídeo criado para o TikTok.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sequences">
          {activeTab === "sequences" && (
            <Card>
              <CardHeader>
                <CardTitle>Sequência de Histórias Narrativas</CardTitle>
                <p className="text-xs text-muted-foreground">Planeje sequências curtas para reter engajamento diário.</p>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stories.map((s: any) => (
                  <div
                    key={s.id}
                    className="aspect-[9/16] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
                    style={{
                      background: `linear-gradient(180deg, ${persona.accent || "#5b8cff"}40, ${persona.accent || "#5b8cff"}10)`,
                    }}
                  >
                    <Badge size="sm" variant="outline" className="w-fit border-white/40 bg-black/30 text-white">
                      {s.pillar || "Stories"}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium leading-tight text-white">{s.title}</p>
                      <p className="text-[10px] text-white/70 mt-1">
                        {s.status} · {s.scheduledAt && relativeTime(s.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {stories.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                    Nenhuma sequência ou story de TikTok configurado.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics">
          {activeTab === "metrics" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolução de Views</CardTitle>
                  <p className="text-xs text-muted-foreground">Visualizações totais estimadas por vídeo.</p>
                </CardHeader>
                <CardContent>
                  <AreaChart data={viewsTrend} color={persona.accent} formatter={(v) => formatCompact(v)} height={220} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Vídeos · Visualizações</CardTitle>
                </CardHeader>
                <CardContent>
                  {topVideos.length > 0 ? (
                    <BarChart
                      data={topVideos.map((v: any) => ({
                        label: v.title.slice(0, 15) + "…",
                        value: v.metrics?.views ?? 0,
                      }))}
                      horizontal
                      color={persona.accent}
                      formatter={(v) => formatCompact(v)}
                      height={220}
                    />
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
                      Sem dados de performance.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Conteúdo por Pilar</CardTitle>
                </CardHeader>
                <CardContent>
                  {pillarShares.length > 0 ? (
                    <PieChart data={pillarShares} height={220} />
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
                      Sem posts categorizados.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="hooks">
          {activeTab === "hooks" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="flex-row items-start justify-between">
                  <div>
                    <CardTitle>Banco de Hooks</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {dbHooks.length} hook{dbHooks.length === 1 ? "" : "s"} salvos no
                      Supabase — persistem em todos os dispositivos.
                    </p>
                  </div>
                  {dbHooks.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSeedSuggestions}
                      disabled={createHook.isPending}
                    >
                      <Sparkles className="h-3 w-3" /> Adicionar sugestões
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* filtro por categoria */}
                  <div className="flex gap-1 flex-wrap">
                    <Badge
                      variant={hookFilter === "all" ? "primary" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setHookFilter("all")}
                    >
                      Todas
                    </Badge>
                    {HOOK_CATEGORIES.map((c) => (
                      <Badge
                        key={c.id}
                        variant={hookFilter === c.id ? "primary" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setHookFilter(c.id)}
                      >
                        {c.label}
                      </Badge>
                    ))}
                  </div>

                  {filteredHooks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border/60 bg-card/30 px-4 py-8 text-center text-xs text-muted-foreground">
                      Nenhum hook nesta categoria ainda. Crie ao lado →
                    </div>
                  )}

                  {filteredHooks.map((h: any) => (
                    <div
                      key={h.id}
                      className="flex items-start justify-between gap-4 p-3 rounded-lg bg-card-elevated border border-border/60"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm italic">"{h.text}"</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="ghost" size="sm">
                            {HOOK_CATEGORIES.find((c) => c.id === h.category)
                              ?.label ?? h.category}
                          </Badge>
                          {h.tag && (
                            <Badge variant="outline" size="sm">
                              #{h.tag}
                            </Badge>
                          )}
                          {h.tested?.count > 0 && (
                            <Badge variant="success" size="sm">
                              usado {h.tested.count}x
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyHook(h.text)}
                        >
                          Copiar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkTested(h)}
                          className="text-[10px]"
                        >
                          + 1 uso
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteHook(h.id)}
                          className="text-destructive text-[10px]"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cadastrar Novo Hook</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Salva direto no banco com workspace + persona.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Texto do Gatilho</Label>
                    <textarea
                      value={newHookText}
                      onChange={(e) => setNewHookText(e.target.value)}
                      placeholder="Ex: 3 coisas que me disseram sobre..."
                      rows={4}
                      className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoria</Label>
                    <select
                      value={newHookCategory}
                      onChange={(e) => setNewHookCategory(e.target.value)}
                      className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary"
                    >
                      {HOOK_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tag (opcional)</Label>
                    <input
                      type="text"
                      value={newHookTag}
                      onChange={(e) => setNewHookTag(e.target.value)}
                      placeholder="Ex: Vendas, Curiosidade"
                      className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={handleAddHook}
                    disabled={!newHookText.trim() || createHook.isPending}
                  >
                    {createHook.isPending ? "Salvando..." : "Salvar no Banco"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
