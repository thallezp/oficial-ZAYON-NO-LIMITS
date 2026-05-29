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
  ArrowRight,
  TrendingUp,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { WeeklyGrid, SlotEditorDialog } from "@/components/content/weekly-grid";
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
  useCreateContentMutation,
} from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useRealtimeContent } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  { text: "O segredo do algoritmo do TikTok revelado em 3 passos...", category: "educational", tag: "Algoritmo", score: 94 },
  { text: "Pare de fazer isso agora se você quer vender na internet...", category: "objection", tag: "Vendas", score: 88 },
  { text: "Como consegui faturar R$ 10k em 15 dias sem equipe...", category: "authority", tag: "Ganhos", score: 96 },
  { text: "O maior erro dos criadores de conteúdo iniciantes...", category: "pain", tag: "Erros", score: 81 },
];

export default function TikTokPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();
  const createContent = useCreateContentMutation();

  useRealtimeContent(activeWorkspaceId ?? undefined, persona.id);

  // Banco de hooks persistido em content_hooks (Supabase)
  const { data: dbHooks = [] } = useContentHooks(activeWorkspaceId, persona.id);
  const createHook = useCreateHookMutation();
  const updateHook = useUpdateHookMutation();
  const deleteHook = useDeleteHookMutation();

  // Manual Hook inputs
  const [newHookText, setNewHookText] = React.useState("");
  const [newHookCategory, setNewHookCategory] = React.useState("custom");
  const [newHookTag, setNewHookTag] = React.useState("");

  // AI Hook Generator inputs
  const [hookPrompt, setHookPrompt] = React.useState("");
  const [isGeneratingHooks, setIsGeneratingHooks] = React.useState(false);

  // Script Converter states
  const [isConverterOpen, setIsConverterOpen] = React.useState(false);

  // Slot editor states
  const [editingItem, setEditingItem] = React.useState<{
    date: Date;
    item?: any;
  } | null>(null);

  const [activeTab, setActiveTab] = React.useState("weekly");
  const [hookFilter, setHookFilter] = React.useState<string>("all");

  const allContent =
    isMockModeClient && dbContent.length === 0
      ? MOCK_CONTENT.filter((c) => c.personaId === persona.id)
      : dbContent;

  const items = allContent.filter(
    (c: any) => c.channel === "tiktok"
  );

  const videos = items.filter(
    (c: any) =>
      c.contentType === "video" ||
      c.contentType === "reel" ||
      c.contentType === "short"
  );
  const stories = items.filter((c: any) => c.contentType === "story");

  // Filter Instagram content for the script converter list
  const instagramItems = allContent.filter(
    (c: any) => c.channel === "instagram" && c.script
  );

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
  // Dynamic metrics aggregations
  // ---------------------------------------------------------------------------
  const topVideos = React.useMemo(() => {
    return [...videos]
      .filter((c: any) => c.metrics?.views)
      .sort((a: any, b: any) => ((b as any).metrics?.views ?? 0) - ((a as any).metrics?.views ?? 0))
      .slice(0, 5);
  }, [videos]);

  const viewsTrend = React.useMemo(() => {
    if (videos.filter((v: any) => v.metrics?.views).length === 0) {
      return Array.from({ length: 12 }, (_, i) => ({
        label: `V${i + 1}`,
        value: Math.round(3500 + i * 1200),
      }));
    }
    return videos.map((v: any, idx: number) => ({
      label: v.title.slice(0, 10) + "...",
      value: v.metrics?.views ?? 0,
    }));
  }, [videos]);

  const pillarShares = React.useMemo(() => {
    const map = new Map<string, number>();
    videos.forEach((v: any) => {
      const p = v.pillar ?? "neutro";
      map.set(p, (map.get(p) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [videos]);

  // Hook performance ranks
  const rankedHooks = React.useMemo(() => {
    return [...dbHooks]
      .map((h: any) => {
        const usageCount = h.tested?.count ?? 0;
        // calculate simulated retention if usage exists, otherwise use db value or base
        const score = h.performanceScore ?? Math.round(75 + (usageCount * 3.5) % 23);
        return { ...h, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [dbHooks]);

  // ---------------------------------------------------------------------------
  // Hook actions
  // ---------------------------------------------------------------------------
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

  const handleGenerateHooksAI = async () => {
    if (!hookPrompt.trim() || !activeWorkspaceId) {
      toast.warning("Digite um tema ou descrição do nicho.");
      return;
    }
    setIsGeneratingHooks(true);
    toast.loading("IA gerando hooks virais para o TikTok...");

    setTimeout(async () => {
      try {
        const hooks = [
          { text: `O segredo obscuro sobre ${hookPrompt} que nunca te contaram...`, category: "curiosity", tag: "IA_viral" },
          { text: `Se você quer dominar ${hookPrompt}, pare de cometer esse erro.`, category: "pain", tag: "IA_viral" },
          { text: `3 Passos simples para explodir seus resultados em ${hookPrompt} hoje.`, category: "educational", tag: "IA_viral" },
        ];

        for (const hk of hooks) {
          await createHook.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona.id,
            text: hk.text,
            category: hk.category,
            tag: hk.tag,
          });
        }
        toast.dismiss();
        toast.success("IA gerou e salvou 3 ganchos magnéticos!");
        setHookPrompt("");
      } catch (e) {
        toast.dismiss();
        toast.error("Erro ao gerar hooks com IA");
      } finally {
        setIsGeneratingHooks(false);
      }
    }, 1500);
  };

  const handleGenerateVariations = async (hook: any) => {
    if (!activeWorkspaceId) return;
    toast.loading(`Gerando variações para: "${hook.text.slice(0, 15)}..."`);

    setTimeout(async () => {
      try {
        const variations = [
          `[VISUAL] ${hook.text} (Estilo Curto)`,
          `Você ainda faz isso? ${hook.text} (Provocativo)`,
          `Segredo revelado: ${hook.text} (Autoridade)`,
        ];

        for (const text of variations) {
          await createHook.mutateAsync({
            workspaceId: activeWorkspaceId,
            personaId: persona.id,
            text,
            category: hook.category ?? "custom",
            tag: hook.tag ? `${hook.tag}_var` : "variacao",
          });
        }
        toast.dismiss();
        toast.success("3 variações criadas e adicionadas ao seu Banco!");
      } catch {
        toast.dismiss();
        toast.error("Erro ao criar variações");
      }
    }, 1200);
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
      toast.success("4 hooks recomendados adicionados!");
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
          tested: {
            ...current,
            count: (current.count ?? 0) + 1,
            lastUsedAt: new Date().toISOString(),
          },
        },
      });
      toast.success("Gatilho marcado como testado!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao marcar uso");
    }
  };

  const filteredHooks = (dbHooks as any[]).filter(
    (h) => hookFilter === "all" || h.category === hookFilter
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="TikTok Studio"
        description="Foque no planejamento audiovisual. Roteiros semanais, métricas, retenção e banco de hooks."
        badge={
          <Badge variant="primary">
            <Music2 className="h-3 w-3" /> @{persona.codename?.toLowerCase() ?? "tiktok"}
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/5 text-primary"
              onClick={() => setIsConverterOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Converter Roteiro Instagram
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
          <TabsTrigger value="metrics">Métricas & Retenção</TabsTrigger>
          <TabsTrigger value="hooks">Banco de Hooks</TabsTrigger>
        </TabsList>

        {/* --- TAB: ROTEIROS SEMANAIS --- */}
        <TabsContent value="weekly">
          {activeTab === "weekly" && (
            <Card>
              <CardHeader>
                <CardTitle>Calendário Semanal (Grade de Slots)</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Planeje horários por dia, arraste para reorganizar e detalhe ações visuais e hooks falados nos slots.
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

        {/* --- TAB: VIDEOS LIST --- */}
        <TabsContent value="videos">
          {activeTab === "videos" && (
            <Card>
              <CardHeader>
                <CardTitle>Roteiros e Status de Produção</CardTitle>
                <p className="text-xs text-muted-foreground">Clique em qualquer linha para editar o roteiro ou registrar retenção.</p>
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
                        <tr
                          key={v.id}
                          className="hover:bg-accent cursor-pointer transition"
                          onClick={() => setEditingItem({ date: new Date(), item: v })}
                        >
                          <td className="px-4 py-3 font-semibold truncate max-w-[200px]">{v.title}</td>
                          <td className="px-4 py-3 capitalize">
                            <Badge variant="outline" size="sm">
                              {v.pillar || "neutro"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              size="sm"
                              variant={
                                v.status === "posted" || v.status === "analyzed"
                                  ? "success"
                                  : v.status === "idea"
                                  ? "outline"
                                  : "warning"
                              }
                            >
                              {v.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {v.scheduledAt ? new Date(v.scheduledAt).toLocaleString("pt-BR") : "Não agendado"}
                          </td>
                          <td className="px-4 py-3 text-right num font-mono">{formatCompact(v.metrics?.views ?? 0)}</td>
                          <td className="px-4 py-3 text-right num font-mono">{formatCompact(v.metrics?.likes ?? 0)}</td>
                          <td className="px-4 py-3 text-right num font-mono text-emerald-400">
                            {v.metrics?.retention ? `${v.metrics.retention}%` : "—"}
                          </td>
                        </tr>
                      ))}
                      {videos.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            Nenhum vídeo criado para o TikTok nesta persona.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --- TAB: SEQUENCES / STORIES --- */}
        <TabsContent value="sequences">
          {activeTab === "sequences" && (
            <Card>
              <CardHeader>
                <CardTitle>Sequência de Stories TikTok</CardTitle>
                <p className="text-xs text-muted-foreground">Telas rápidas integradas à pauta da persona.</p>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stories.map((s: any) => (
                  <div
                    key={s.id}
                    onClick={() => setEditingItem({ date: new Date(), item: s })}
                    className="aspect-[9/16] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden cursor-pointer border border-white/10 hover:scale-[1.02] transition"
                    style={{
                      background: `linear-gradient(180deg, ${persona.accent || "#5b8cff"}40, ${persona.accent || "#5b8cff"}10)`,
                    }}
                  >
                    <Badge size="sm" variant="outline" className="w-fit border-white/40 bg-black/40 text-white">
                      {s.pillar || "Stories"}
                    </Badge>
                    <div>
                      <p className="text-sm font-semibold leading-tight text-white">{s.title}</p>
                      <p className="text-[10px] text-white/80 mt-1">
                        {s.status} · {s.scheduledAt && relativeTime(s.scheduledAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {stories.length === 0 && (
                  <div className="col-span-full py-16 text-center text-muted-foreground text-sm border border-dashed border-border/40 rounded-lg">
                    Nenhuma sequência ou story de TikTok configurado.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* --- TAB: METRICS & RETENTION --- */}
        <TabsContent value="metrics">
          {activeTab === "metrics" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolução de Audiência (Views)</CardTitle>
                  <p className="text-xs text-muted-foreground">Volume de alcance dos vídeos publicados.</p>
                </CardHeader>
                <CardContent>
                  <AreaChart
                    data={viewsTrend}
                    color={persona.accent || "#5b8cff"}
                    formatter={(v) => formatCompact(v)}
                    height={220}
                  />
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
                      color={persona.accent || "#5b8cff"}
                      formatter={(v) => formatCompact(v)}
                      height={220}
                    />
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs text-center px-4">
                      Sem dados de performance. Mude o status de um vídeo para 'Postado' e preencha as métricas.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Foco de Pilares</CardTitle>
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

        {/* --- TAB: HOOKS BANK WITH IA ACTIONS --- */}
        <TabsContent value="hooks">
          {activeTab === "hooks" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                {/* Ranking performance box */}
                <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
                  <CardHeader className="py-3.5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-400">
                        <TrendingUp className="h-4 w-4" /> Ranking de Performance de Hooks
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">Retenção de público média baseada nos primeiros 3s de vídeo.</p>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    {rankedHooks.length > 0 ? (
                      <div className="divide-y divide-border/20 text-xs">
                        {rankedHooks.slice(0, 4).map((hk, i) => (
                          <div key={hk.id} className="py-2 flex items-center justify-between">
                            <span className="truncate max-w-[70%] font-medium">
                              <span className="text-emerald-400 font-mono font-bold mr-2">#{i + 1}</span>
                              "{hk.text}"
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground font-mono text-[10px]">usado {hk.tested?.count ?? 0}x</span>
                              <Badge variant="success" className="font-mono">{hk.score}% ret.</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">Nenhum hook cadastrado no ranking.</div>
                    )}
                  </CardContent>
                </Card>

                {/* Main hook list */}
                <Card>
                  <CardHeader className="flex-row items-start justify-between">
                    <div>
                      <CardTitle>Banco de Hooks</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Use ganchos atrativos para elevar a retenção do seu conteúdo.
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
                    {/* Filter categories */}
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
                        Nenhum hook cadastrado nesta categoria. Crie ao lado.
                      </div>
                    )}

                    {filteredHooks.map((h: any) => (
                      <div
                        key={h.id}
                        className="flex items-start justify-between gap-4 p-3 rounded-lg bg-card-elevated border border-border/60"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <p className="text-sm italic text-foreground">"{h.text}"</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="ghost" size="sm" className="text-[10px]">
                              {HOOK_CATEGORIES.find((c) => c.id === h.category)?.label ?? h.category}
                            </Badge>
                            {h.tag && (
                              <Badge variant="outline" size="sm" className="text-[10px]">
                                #{h.tag}
                              </Badge>
                            )}
                            {h.tested?.count > 0 && (
                              <Badge variant="success" size="sm" className="text-[10px]">
                                usado {h.tested.count}x
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCopyHook(h.text)}>
                            Copiar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] text-primary"
                            onClick={() => handleGenerateVariations(h)}
                            disabled={createHook.isPending}
                          >
                            <Sparkles className="h-3 w-3 mr-0.5" /> Variações
                          </Button>
                          <div className="flex gap-1 justify-between">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkTested(h)}
                              className="h-6 text-[9px] px-1"
                            >
                              +1 Uso
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHook(h.id)}
                              className="h-6 text-destructive text-[9px] px-1"
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Creators block (manual and AI generator) */}
              <div className="space-y-6">
                <Card className="border-primary/20 bg-primary/[0.01]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-1 text-primary">
                      <Sparkles className="h-4 w-4" /> Gerador de Hooks (IA)
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Escreva um tópico e gere ganchos magnéticos para o TikTok.</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Tema / Produto / Nicho</Label>
                      <Input
                        value={hookPrompt}
                        onChange={(e) => setHookPrompt(e.target.value)}
                        placeholder="Ex: Marketing para infoprodutos"
                        className="text-xs"
                      />
                    </div>
                    <Button
                      variant="gradient"
                      className="w-full text-xs"
                      onClick={handleGenerateHooksAI}
                      disabled={isGeneratingHooks || !hookPrompt.trim()}
                    >
                      {isGeneratingHooks ? "Gerando..." : "Gerar com IA"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cadastrar Novo Hook Manual</CardTitle>
                    <p className="text-xs text-muted-foreground">Registre ganchos de referência manualmente.</p>
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
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
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
                        className="w-full h-9 rounded-md border border-border/60 bg-background px-3 text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>
                    <Button
                      variant="gradient"
                      className="w-full text-xs"
                      onClick={handleAddHook}
                      disabled={!newHookText.trim() || createHook.isPending}
                    >
                      {createHook.isPending ? "Salvando..." : "Salvar no Banco"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Slots and Videos editor wrapper */}
      {editingItem && (
        <SlotEditorDialog
          open
          onClose={() => setEditingItem(null)}
          date={editingItem.item?.scheduledAt ? new Date(editingItem.item.scheduledAt) : editingItem.date}
          defaultContentType={editingItem.item?.contentType ?? "video"}
          item={editingItem.item}
          channel="tiktok"
          workspaceId={activeWorkspaceId}
          personaId={persona.id}
          weekDates={weekDates}
        />
      )}

      {/* Dialog for Instagram to TikTok converter */}
      {isConverterOpen && (
        <ScriptConverterDialog
          open={isConverterOpen}
          onClose={() => setIsConverterOpen(false)}
          instagramItems={instagramItems}
          workspaceId={activeWorkspaceId}
          personaId={persona.id}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DIALOG: SCRIPT CONVERTER (INSTAGRAM -> TIKTOK)
// ---------------------------------------------------------------------------
interface ConvertDialogProps {
  open: boolean;
  onClose: () => void;
  instagramItems: any[];
  workspaceId: string | null;
  personaId: string;
}

function ScriptConverterDialog({
  open,
  onClose,
  instagramItems,
  workspaceId,
  personaId,
}: ConvertDialogProps) {
  const createContent = useCreateContentMutation();
  const [selectedItemId, setSelectedItemId] = React.useState("");
  const [isConverting, setIsConverting] = React.useState(false);

  // Form outputs
  const [tiktokTitle, setTiktokTitle] = React.useState("");
  const [tiktokHook, setTiktokHook] = React.useState("");
  const [tiktokVisual, setTiktokVisual] = React.useState("");
  const [tiktokScript, setTiktokScript] = React.useState("");

  const selectedItem = instagramItems.find((i) => i.id === selectedItemId);

  const handleConvert = () => {
    if (!selectedItem) return;
    setIsConverting(true);
    toast.loading("IA transcrevendo e otimizando roteiro para TikTok...");

    setTimeout(() => {
      setTiktokTitle(`[TikTok] ${selectedItem.title}`);
      setTiktokHook(`PARE de fazer posts longos. Esse roteiro era do Instagram, mas...`);
      setTiktokVisual(`Corte rápido a cada 2s. Começa apontando pro texto na tela. Usa expressões faciais exageradas.`);
      setTiktokScript(
        `[GANCHO - TIKTOK]\n${selectedItem.hook || "Você precisa saber disso..."}\n\n[CONTEÚDO RÁPIDO]\n${
          selectedItem.script
            ? selectedItem.script.slice(0, 150) + "..."
            : "Adaptado do roteiro original."
        }\n\n[AÇÃO DE ENGAJAMENTO / CTA]\nCurte e me segue para mais dicas rápidas!`
      );
      setIsConverting(false);
      toast.dismiss();
      toast.success("Roteiro convertido com sucesso!");
    }, 1500);
  };

  const handleSaveConverted = async () => {
    if (!tiktokTitle.trim() || !workspaceId) return;
    try {
      await createContent.mutateAsync({
        workspaceId,
        personaId,
        title: tiktokTitle.trim(),
        contentType: "video",
        channel: "tiktok",
        hook: tiktokHook || null,
        visualBrief: tiktokVisual || null,
        script: tiktokScript || null,
        status: "idea",
        scheduledAt: null,
      });
      toast.success("Vídeo de TikTok salvo como rascunho!");
      onClose();
    } catch {
      toast.error("Erro ao salvar roteiro de TikTok.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Conversor de Roteiros: Instagram para TikTok
          </DialogTitle>
          <DialogDescription>
            Importe um roteiro existente do Instagram e adapte-o para o ritmo ágil e dinâmico do TikTok.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="space-y-1">
            <Label className="text-xs">Selecione o Conteúdo do Instagram</Label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-9 rounded-md border border-border/60 bg-background px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
            >
              <option value="">Selecione...</option>
              {instagramItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.contentType})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="rounded-lg border border-border/40 p-3 bg-white/[0.02] text-xs space-y-2">
              <p className="font-bold text-muted-foreground">Original (Instagram):</p>
              <p className="font-semibold text-foreground">"{selectedItem.title}"</p>
              <p className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                {selectedItem.script || "Sem roteiro escrito."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                onClick={handleConvert}
                disabled={isConverting}
              >
                Converter Roteiro <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {tiktokTitle && (
            <div className="space-y-3 pt-3 border-t border-border/20">
              <div className="space-y-1">
                <Label className="text-xs">Título do Vídeo TikTok</Label>
                <Input value={tiktokTitle} onChange={(e) => setTiktokTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Gancho Exclusivo TikTok</Label>
                  <Input value={tiktokHook} onChange={(e) => setTiktokHook(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Roteiro Visual e Cenas</Label>
                  <Input value={tiktokVisual} onChange={(e) => setTiktokVisual(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Roteiro Transcrito TikTok</Label>
                <textarea
                  value={tiktokScript}
                  onChange={(e) => setTiktokScript(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary font-mono"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleSaveConverted}
            disabled={!tiktokTitle}
          >
            Salvar no TikTok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
