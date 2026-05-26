"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ListChecks,
  Plus,
  Sparkles,
  UserPlus,
  Workflow as WorkflowIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_FLOWS, MOCK_PERSONAS } from "@/data";
import { relativeTime } from "@/lib/utils/format";

const iconMap = {
  Workflow: WorkflowIcon,
  UserPlus: UserPlus,
  ListChecks: ListChecks,
  Sparkles: Sparkles,
};

export default function FlowsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Flows"
        description="Processos internos, automações, mindmaps e fluxos de aprovação · React Flow."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Templates
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Novo flow
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_FLOWS.map((f, i) => {
          const Icon = iconMap[f.icon as keyof typeof iconMap] ?? WorkflowIcon;
          const persona = MOCK_PERSONAS.find((p) => p.id === f.personaId);
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/flows/${f.id}`} className="block">
              <Card variant="elevated" className="group hover:border-primary/40 transition overflow-hidden relative">
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                  style={{
                    background: `radial-gradient(at top right, ${f.color}25, transparent 60%)`,
                  }}
                />
                <CardContent className="p-5 space-y-4 relative">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{
                        background: `${f.color}30`,
                        color: f.color,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge size="sm" variant="outline">
                      {f.type}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-semibold leading-tight">{f.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {f.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-3">
                    <span>{f.nodeCount} nós</span>
                    {persona && (
                      <Badge variant="ghost" size="sm">
                        {persona.name}
                      </Badge>
                    )}
                    <span>{relativeTime(f.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <CardContent className="relative p-8 grid sm:grid-cols-2 gap-6 items-center">
          <div>
            <Badge variant="primary" size="sm" className="w-fit">
              <Sparkles className="h-3 w-3" /> Templates
            </Badge>
            <h3 className="text-lg font-semibold mt-2">
              Comece com um fluxo pronto
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Onboarding, aprovação editorial, pipeline de criativos · ajustáveis
              em segundos.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {["Onboarding", "Aprovação editorial", "Pipeline conteúdo", "Mapa de canais"].map((t) => (
              <button
                key={t}
                className="rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-xs text-left hover:border-primary/40"
              >
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
