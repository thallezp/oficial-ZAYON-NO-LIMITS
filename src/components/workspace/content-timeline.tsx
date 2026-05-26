"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/types";
import { cn } from "@/lib/utils/cn";
import { formatCompact } from "@/lib/utils/format";

const channelEmoji: Record<string, string> = {
  instagram: "📸",
  tiktok: "🎵",
  youtube: "🎥",
  whatsapp: "💬",
  email: "✉️",
  telegram: "✈️",
};

const statusColor: Record<string, string> = {
  idea: "bg-muted-foreground",
  pending: "bg-muted-foreground",
  scripted: "bg-info",
  recorded: "bg-primary",
  editing: "bg-warning",
  scheduled: "bg-success",
  posted: "bg-success",
  analyzed: "bg-success",
  archived: "bg-muted-foreground",
};

interface Props {
  items: ContentItem[];
  accent?: string;
  onSelect?: (item: ContentItem) => void;
}

export function ContentTimeline({ items, accent = "#3b82f6", onSelect }: Props) {
  const sorted = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const aTime = new Date(a.scheduledAt ?? a.publishedAt ?? 0).getTime();
      const bTime = new Date(b.scheduledAt ?? b.publishedAt ?? 0).getTime();
      return aTime - bTime;
    });
  }, [items]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/30 py-12 text-center text-sm text-muted-foreground">
        Sem peças agendadas. Crie a primeira do Content Studio.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* eixo vertical */}
      <div
        className="absolute left-3 top-0 bottom-0 w-px"
        style={{
          background: `linear-gradient(180deg, ${accent}80, ${accent}20)`,
        }}
      />

      <ol className="space-y-4">
        {sorted.map((c, i) => {
          const when = c.scheduledAt ?? c.publishedAt;
          const date = when ? new Date(when) : null;
          return (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="relative"
            >
              {/* bolinha */}
              <div
                className="absolute -left-[20px] top-3 h-3 w-3 rounded-full ring-2 ring-background"
                style={{ background: accent }}
              />

              <button
                type="button"
                onClick={() => onSelect?.(c)}
                className="w-full text-left rounded-xl border border-border/60 bg-card-elevated px-4 py-3 hover:border-primary/40 transition"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  {date && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                      {date.toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      statusColor[c.status],
                    )}
                  />
                  <Badge size="sm" variant="outline">
                    {channelEmoji[c.channel]} {c.channel}
                  </Badge>
                  <Badge size="sm" variant="ghost">
                    {c.contentType}
                  </Badge>
                  {c.pillar && (
                    <Badge size="sm" variant="ghost">
                      {c.pillar}
                    </Badge>
                  )}
                  {c.metrics?.views !== undefined && c.metrics.views > 0 && (
                    <span
                      className="ml-auto text-[11px] font-medium num"
                      style={{ color: accent }}
                    >
                      {formatCompact(c.metrics.views)} views
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-medium leading-snug">
                  {c.title}
                </p>
                {c.hook && (
                  <p className="mt-0.5 text-[11px] italic text-muted-foreground line-clamp-1">
                    "{c.hook}"
                  </p>
                )}
              </button>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
