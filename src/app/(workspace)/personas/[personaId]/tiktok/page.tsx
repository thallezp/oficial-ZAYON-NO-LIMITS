"use client";

import { Eye, Heart, MessageCircle, Music2, Plus, Sparkles, Timer } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/charts/bar-chart";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_CONTENT } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { formatCompact, relativeTime } from "@/lib/utils/format";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useContent } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";
import { useRealtimeContent } from "@/hooks/use-realtime";

export default function TikTokPage() {
  const persona = usePersonaFromRoute();
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbContent = [] } = useContent(activeWorkspaceId, persona.id);
  const { openWith } = useQuickCreate();

  useRealtimeContent(activeWorkspaceId ?? undefined, persona.id);

  const allContent =
    isMockModeClient && dbContent.length === 0
      ? MOCK_CONTENT.filter((c) => c.personaId === persona.id)
      : dbContent;

  const items = allContent.filter(
    (c: any) => c.channel === "tiktok",
  );

  const topVideos = items
    .filter((c: any) => (c as any).metrics?.views)
    .sort((a: any, b: any) => ((b as any).metrics?.views ?? 0) - ((a as any).metrics?.views ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="TikTok"
        description="Hooks, roteiros e métricas individuais por vídeo."
        badge={
          <Badge variant="primary">
            <Music2 className="h-3 w-3" /> @{persona.codename?.toLowerCase()}
          </Badge>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Gerar hooks
            </Button>
            <Button variant="gradient" size="sm" onClick={() => openWith("content")}>
              <Plus className="h-4 w-4" /> Novo vídeo
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="tiktok" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline de produção</CardTitle>
            <p className="text-xs text-muted-foreground">Slots semanais.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((c: any) => (
              <Card key={c.id} variant="elevated" className="overflow-hidden">
                <CardContent className="p-3 space-y-2.5">
                  <Badge size="sm" variant="outline">
                    {c.pillar}
                  </Badge>
                  {c.hook && (
                    <p className="text-[11px] italic text-muted-foreground line-clamp-2">
                      "{c.hook}"
                    </p>
                  )}
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {c.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px]">
                    <Badge size="sm" variant={c.status === "posted" ? "success" : "outline"}>
                      {c.status}
                    </Badge>
                    {(c.scheduledAt || c.publishedAt) && (
                      <span className="text-muted-foreground">
                        {relativeTime(c.scheduledAt ?? c.publishedAt!)}
                      </span>
                    )}
                  </div>
                  {c.metrics && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" /> {formatCompact(c.metrics.views ?? 0)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Heart className="h-3 w-3" /> {formatCompact(c.metrics.likes ?? 0)}
                      </span>
                      {c.metrics.retention && (
                        <span className="flex items-center gap-0.5 ml-auto">
                          <Timer className="h-3 w-3" /> {c.metrics.retention}%
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top vídeos · 30d</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={topVideos.map((v: any) => ({
                label: v.title.slice(0, 18) + "…",
                value: v.metrics?.views ?? 0,
              }))}
              horizontal
              color={persona.accent ?? "#5b8cff"}
              formatter={(v) => formatCompact(v)}
              height={240}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
