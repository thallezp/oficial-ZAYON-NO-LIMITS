"use client";

import { motion } from "framer-motion";
import { Activity, Eye, Sparkles, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initials, formatCompact, formatCurrency } from "@/lib/utils/format";
import type { Persona } from "@/types";

interface PersonaHeroProps {
  persona: Persona;
  subtitle?: string;
  pageBadge?: string;
}

export function PersonaHero({ persona, subtitle, pageBadge }: PersonaHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card-elevated p-6"
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(at top right, ${persona.accent ?? "#5b8cff"}28, transparent 60%), radial-gradient(at bottom left, ${persona.accent ?? "#5b8cff"}15, transparent 60%)`,
        }}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-glow-strong"
            style={{
              background: `linear-gradient(135deg, ${persona.accent ?? "#5b8cff"}, #2a3ef5)`,
            }}
          >
            {initials(persona.name)}
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-success ring-2 ring-card" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {persona.name}
              </h1>
              <Badge variant="primary" size="sm">
                {persona.status}
              </Badge>
              {pageBadge && (
                <Badge size="sm" variant="outline">
                  {pageBadge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {subtitle ?? persona.bigIdea}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <Stat
                icon={<Users className="h-3 w-3" />}
                label="Seguidores"
                value={formatCompact(persona.metrics?.followers ?? 0)}
              />
              <Stat
                icon={<Eye className="h-3 w-3" />}
                label="Views 30d"
                value={formatCompact(persona.metrics?.views ?? 0)}
              />
              <Stat
                icon={<Activity className="h-3 w-3" />}
                label="Leads"
                value={String(persona.metrics?.leads ?? 0)}
              />
              <Stat
                icon={<Sparkles className="h-3 w-3" />}
                label="Receita"
                value={formatCurrency(persona.metrics?.revenuePeriod ?? 0)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {persona.channels?.slice(0, 4).map((c) => (
            <Badge key={c.channel} variant="outline" size="sm">
              {c.channel} · {formatCompact(c.followers ?? 0)}
            </Badge>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card/80 px-2 py-0.5 text-foreground/80">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold num text-foreground">{value}</span>
    </div>
  );
}
