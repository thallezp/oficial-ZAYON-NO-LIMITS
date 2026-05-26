"use client";

import { Heart, Instagram, MessageCircle, Plus, Send, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_CONTENT } from "@/data";
import { formatCompact, relativeTime } from "@/lib/utils/format";

const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const slots = ["12h", "18h", "20h"];

export default function InstagramPage() {
  const persona = usePersonaFromRoute();
  const items = MOCK_CONTENT.filter(
    (c) => c.personaId === persona.id && c.channel === "instagram",
  );
  const reels = items.filter((c) => c.contentType === "reel" || c.contentType === "feed" || c.contentType === "carousel");
  const stories = items.filter((c) => c.contentType === "story");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instagram"
        description="Roteiros semanais, feed/reels e stories desta persona."
        badge={<Badge variant="primary"><Instagram className="h-3 w-3" /> @{persona.codename?.toLowerCase() ?? "persona"}</Badge>}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Gerar pauta
            </Button>
            <Button variant="gradient" size="sm">
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
        </TabsList>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Calendário semanal</CardTitle>
              <p className="text-xs text-muted-foreground">3 slots por dia · pilares táticos · status de produção.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-1 text-[11px]">
                <div />
                {weekdays.map((d) => (
                  <div
                    key={d}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold text-center"
                  >
                    {d}
                  </div>
                ))}
                {slots.map((slot) => (
                  <>
                    <div key={slot} className="px-2 py-2 text-[10px] text-muted-foreground">
                      {slot}
                    </div>
                    {weekdays.map((d, i) => {
                      const item = items[(i + slot.length) % items.length];
                      return (
                        <div
                          key={`${slot}-${d}`}
                          className="min-h-[80px] rounded-md border border-border/50 bg-card/30 p-1.5"
                          style={{
                            borderColor: `${persona.accent}30`,
                          }}
                        >
                          {item && (
                            <>
                              <Badge size="sm" variant="ghost" className="mb-1">
                                {item.pillar}
                              </Badge>
                              <p className="text-[10px] leading-tight line-clamp-2">
                                {item.title}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reels">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {reels.map((r) => (
              <Card key={r.id} className="overflow-hidden hover:border-primary/40 transition group">
                <div
                  className="aspect-[4/5] relative flex items-end p-3"
                  style={{
                    background: `linear-gradient(180deg, ${persona.accent}30 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)`,
                  }}
                >
                  <div className="text-white">
                    <Badge size="sm" variant="outline" className="border-white/40 text-white">
                      {r.contentType}
                    </Badge>
                    <p className="mt-2 text-sm font-medium line-clamp-2">{r.title}</p>
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge size="sm" variant={r.status === "posted" ? "success" : "outline"}>
                      {r.status}
                    </Badge>
                    {(r.scheduledAt || r.publishedAt) && (
                      <span className="text-muted-foreground">
                        {relativeTime(r.scheduledAt ?? r.publishedAt!)}
                      </span>
                    )}
                  </div>
                  {r.metrics && (
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {formatCompact(r.metrics.likes ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {formatCompact(r.metrics.comments ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        {formatCompact(r.metrics.shares ?? 0)}
                      </span>
                      <span className="ml-auto num text-foreground font-medium">
                        {formatCompact(r.metrics.views ?? 0)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stories">
          <Card>
            <CardHeader>
              <CardTitle>Sequência narrativa</CardTitle>
              <p className="text-xs text-muted-foreground">
                Objetivo, telas, métricas.
              </p>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stories.map((s) => (
                <div
                  key={s.id}
                  className="aspect-[9/16] rounded-xl p-3 flex flex-col justify-between relative overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, ${persona.accent}40, ${persona.accent}10)`,
                  }}
                >
                  <Badge size="sm" variant="outline" className="w-fit border-white/40 bg-black/30 text-white">
                    {s.pillar}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium leading-tight text-white">
                      {s.title}
                    </p>
                    <p className="text-[10px] text-white/70 mt-1">
                      {s.status} · {s.scheduledAt && relativeTime(s.scheduledAt)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
