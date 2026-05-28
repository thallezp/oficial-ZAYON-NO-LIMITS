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
import { useContent } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useRealtimeContent } from "@/hooks/use-realtime";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

// Predefined hook library suggestions
const DEFAULT_HOOKS = [
  { id: "hook-1", text: "O segredo do algoritmo do TikTok revelado em 3 passos...", category: "educational", tag: "Algoritmo" },
  { id: "hook-2", text: "Pare de fazer isso agora se você quer vender na internet...", category: "objection", tag: "Vendas" },
  { id: "hook-3", text: "Como consegui faturar R$ 10k em 15 dias sem equipe...", category: "authority", tag: "Ganhos" },
  { id: "hook-4", text: "O maior erro dos criadores de conteúdo iniciantes...", category: "pain", tag: "Erros" },
];

export default function TikTokPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();

  useRealtimeContent(activeWorkspaceId ?? undefined, persona.id);

  const [hooks, setHooks] = React.useState(DEFAULT_HOOKS);
  const [newHookText, setNewHookText] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("weekly");

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

  const handleAddHook = () => {
    if (!newHookText.trim()) return;
    setHooks([
      ...hooks,
      {
        id: `hook-${Date.now()}`,
        text: newHookText.trim(),
        category: "custom",
        tag: "Personalizado",
      },
    ]);
    setNewHookText("");
    toast.success("Novo hook adicionado ao seu banco!");
  };

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
                <CardHeader>
                  <CardTitle>Biblioteca de Hooks (Atrativos)</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Gatilhos de atenção validados para aumentar a taxa de retenção nos primeiros 3 segundos.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hooks.map((h) => (
                    <div key={h.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-card-elevated border border-border/60">
                      <div className="space-y-1">
                        <p className="text-sm italic">"{h.text}"</p>
                        <Badge variant="ghost" size="sm">#{h.tag}</Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleCopyHook(h.text)}>
                        Copiar
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cadastrar Novo Hook</CardTitle>
                  <p className="text-xs text-muted-foreground">Registre novos gatilhos para usar nos seus roteiros.</p>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <Button variant="gradient" className="w-full" onClick={handleAddHook} disabled={!newHookText.trim()}>
                    Adicionar ao Banco
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
