"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_PERSONAS } from "@/data";
import { initials, formatCompact, formatCurrency } from "@/lib/utils/format";
import { isMockModeClient } from "@/lib/mock-mode-client";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { usePersonas } from "@/hooks/use-queries";
import { useQuickCreate } from "@/stores/quick-create-store";

const statusVariant = {
  active: "success",
  building: "warning",
  paused: "outline",
  archived: "ghost",
} as const;

export default function PersonasIndexPage() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const { data: dbPersonas = [] } = usePersonas(activeWorkspaceId);
  const { openWith } = useQuickCreate();

  const personas =
    isMockModeClient && dbPersonas.length === 0 ? MOCK_PERSONAS : dbPersonas;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personas"
        description="Cada persona opera como uma unidade de negócio · identidade, conteúdo, funil, finance e leads próprios."
        actions={
          <Button variant="gradient" size="sm" onClick={() => openWith("persona")}>
            <Plus className="h-4 w-4" /> Nova persona
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {personas.map((p: any, i: number) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link href={`/personas/${p.id}/overview`}>
              <Card variant="elevated" className="relative overflow-hidden hover:border-primary/40 transition group">
                <div
                  className="absolute inset-0 opacity-30 group-hover:opacity-60 transition"
                  style={{
                    background: `radial-gradient(at top right, ${p.accent || "#3b82f6"}, transparent 70%)`,
                  }}
                />
                <CardContent className="relative p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white shadow-glow"
                      style={{
                        background: `linear-gradient(135deg, ${p.accent || "#3b82f6"}, #2a3ef5)`,
                      }}
                    >
                      {initials(p.name)}
                    </div>
                    <Badge size="sm" variant={statusVariant[p.status as keyof typeof statusVariant] || "outline"}>
                      {p.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg leading-tight">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {p.bigIdea}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Receita</p>
                      <p className="num font-semibold">
                        {formatCurrency((p as any).metrics?.revenuePeriod ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Seguidores</p>
                      <p className="num font-semibold">
                        {formatCompact((p as any).metrics?.followers ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Leads</p>
                      <p className="num font-semibold">
                        {(p as any).metrics?.leads ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground truncate">
                      {p.niche}
                    </span>
                    <span className="text-primary flex items-center gap-1">
                      abrir <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}

        <button
          onClick={() => openWith("persona")}
          className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40 w-full"
        >
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Criar nova persona</span>
          <Badge variant="ghost" size="sm">
            <Sparkles className="h-3 w-3" /> IA pode preencher o briefing
          </Badge>
        </button>
      </div>
    </div>
  );
}
