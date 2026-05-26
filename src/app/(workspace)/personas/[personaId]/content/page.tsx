"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  Filter,
  Image as ImageIcon,
  KanbanSquare,
  ListChecks,
  Plus,
  Search,
  Sparkles,
  Table as TableIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContentTimeline } from "@/components/workspace/content-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_CONTENT } from "@/data";
import type { ContentItem, ContentStatus } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatCompact, relativeTime } from "@/lib/utils/format";

const STATUS_COLS: { id: ContentStatus; label: string; color: string }[] = [
  { id: "idea", label: "Ideia", color: "bg-muted/40" },
  { id: "scripted", label: "Roteirizado", color: "bg-primary/10" },
  { id: "recorded", label: "Gravado", color: "bg-info/10" },
  { id: "editing", label: "Editando", color: "bg-warning/10" },
  { id: "scheduled", label: "Agendado", color: "bg-success/10" },
  { id: "posted", label: "Postado", color: "bg-success/20" },
];

const channelEmoji: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  youtube: "🎥",
  whatsapp: "💬",
  email: "✉️",
  telegram: "✈️",
};

export default function ContentStudioPage() {
  const persona = usePersonaFromRoute();
  const [search, setSearch] = React.useState("");
  const content = React.useMemo(
    () =>
      MOCK_CONTENT.filter(
        (c) =>
          c.personaId === persona.id &&
          (!search || c.title.toLowerCase().includes(search.toLowerCase())),
      ),
    [persona.id, search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Studio"
        description="Unifica Instagram, TikTok, Stories e demais canais em uma única base."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Sugerir pauta
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Nova peça
            </Button>
          </>
        }
      />
      <PersonaHero persona={persona} pageBadge="content studio" />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Buscar título, hook, legenda…"
          />
        </div>
        <div className="ml-auto flex gap-1">
          <Badge variant="outline">{content.length} peças</Badge>
          <Badge variant="primary">
            {content.filter((c) => c.status === "scheduled").length} agendadas
          </Badge>
          <Badge variant="success">
            {content.filter((c) => c.status === "posted").length} postadas
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanSquare className="h-3.5 w-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-3.5 w-3.5" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="table">
            <TableIcon className="h-3.5 w-3.5" /> Tabela
          </TabsTrigger>
          <TabsTrigger value="list">
            <ListChecks className="h-3.5 w-3.5" /> Lista
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-3.5 w-3.5" /> Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 overflow-x-auto">
            {STATUS_COLS.map((col) => {
              const items = content.filter((c) => c.status === col.id);
              return (
                <div
                  key={col.id}
                  className="rounded-xl border border-border/60 bg-card/40 flex flex-col min-w-[220px]"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-t-xl px-3 py-2",
                      col.color,
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {col.label}
                    </span>
                    <Badge size="sm" variant="outline">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 p-2">
                    {items.map((c) => (
                      <ContentCard key={c.id} item={c} accent={persona.accent} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold uppercase text-muted-foreground border-b border-border/60 pb-2">
                {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                  <div key={d} className="px-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 mt-2">
                {Array.from({ length: 28 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - 7 + i);
                  const items = content.filter(
                    (c) =>
                      (c.scheduledAt &&
                        new Date(c.scheduledAt).toDateString() ===
                          date.toDateString()) ||
                      (c.publishedAt &&
                        new Date(c.publishedAt).toDateString() ===
                          date.toDateString()),
                  );
                  return (
                    <div
                      key={i}
                      className="min-h-[100px] rounded-lg border border-border/40 bg-card/30 p-2 text-[11px]"
                    >
                      <p className="font-medium">{date.getDate()}</p>
                      <div className="mt-1 space-y-1">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="truncate rounded px-1.5 py-0.5"
                            style={{
                              background: `${persona.accent}25`,
                              color: persona.accent,
                            }}
                          >
                            {channelEmoji[it.channel]} {it.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table">
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Pilar</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quando</th>
                  <th className="px-4 py-3 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {content.map((c) => (
                  <tr key={c.id} className="hover:bg-accent">
                    <td className="px-4 py-2.5 font-medium max-w-md truncate">{c.title}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" size="sm">
                        {channelEmoji[c.channel]} {c.channel}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">
                      {c.contentType}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground capitalize">
                      {c.pillar}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge size="sm" variant="outline">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {c.scheduledAt
                        ? relativeTime(c.scheduledAt)
                        : c.publishedAt
                          ? relativeTime(c.publishedAt)
                          : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right num">
                      {formatCompact(c.metrics?.views ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <ContentTimeline items={content} accent={persona.accent} />
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-2">
            {content.map((c) => (
              <Card key={c.id} className="hover:border-primary/40 transition">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="text-2xl">{channelEmoji[c.channel]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{c.title}</p>
                      <Badge size="sm" variant="outline">
                        {c.status}
                      </Badge>
                      <Badge size="sm" variant="ghost">
                        {c.contentType}
                      </Badge>
                    </div>
                    {c.hook && (
                      <p className="text-xs text-muted-foreground italic">
                        "{c.hook}"
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {c.scheduledAt && (
                      <p>agenda · {relativeTime(c.scheduledAt)}</p>
                    )}
                    {c.metrics?.views && (
                      <p className="num font-medium text-foreground">
                        {formatCompact(c.metrics.views)} views
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContentCard({
  item,
  accent,
}: {
  item: ContentItem;
  accent?: string;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border/60 bg-card-elevated p-2.5 cursor-grab hover:border-primary/40"
    >
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
        <span>{channelEmoji[item.channel]} {item.contentType}</span>
        {item.pillar && <Badge size="sm" variant="ghost">{item.pillar}</Badge>}
      </div>
      <p className="text-xs font-medium leading-snug line-clamp-3">
        {item.title}
      </p>
      {item.scheduledAt && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          {relativeTime(item.scheduledAt)}
        </p>
      )}
      {item.metrics?.views && (
        <div className="mt-1.5 text-[10px] num font-medium" style={{ color: accent }}>
          {formatCompact(item.metrics.views)} views
        </div>
      )}
    </motion.div>
  );
}
