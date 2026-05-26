"use client";

import Link from "next/link";
import {
  Archive,
  ArrowUpRight,
  Pause,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePersonaStore } from "@/stores/persona-store";
import { initials, formatCompact, formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

const statusVariant = {
  active: "success",
  building: "warning",
  paused: "outline",
  archived: "ghost",
} as const;

export default function PersonaSettingsPage() {
  const personas = usePersonaStore((s) => s.personas);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Persona Settings"
        description="Crie, edite, pause, arquive ou exclua personas. Cada persona isola seus dados (conteúdo, leads, financeiro)."
        actions={
          <Button variant="gradient" size="sm">
            <Plus className="h-4 w-4" /> Nova persona
          </Button>
        }
      />

      <Card variant="glass" className="overflow-hidden relative">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <CardContent className="relative p-6 grid sm:grid-cols-3 gap-4">
          <Stat
            label="Personas ativas"
            value={String(personas.filter((p) => p.status === "active").length)}
          />
          <Stat
            label="Em construção"
            value={String(personas.filter((p) => p.status === "building").length)}
          />
          <Stat
            label="Pausadas / arquivadas"
            value={String(
              personas.filter(
                (p) => p.status === "paused" || p.status === "archived",
              ).length,
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Personas do workspace
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/60">
          {personas.map((p) => (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold text-white shadow-glow"
                style={{
                  background: `linear-gradient(135deg, ${p.accent ?? "#5b8cff"}, #2a3ef5)`,
                }}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold truncate">{p.name}</p>
                  <Badge size="sm" variant={statusVariant[p.status]}>
                    {p.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.niche}
                </p>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>{formatCompact(p.metrics?.followers ?? 0)} seguidores</span>
                  <span>·</span>
                  <span>{formatCurrency(p.metrics?.revenuePeriod ?? 0)} (30d)</span>
                  <span>·</span>
                  <span>{p.metrics?.leads ?? 0} leads</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`${p.name} pausada`)}
                >
                  <Pause className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success(`${p.name} arquivada`)}
                >
                  <Archive className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-destructive/30 text-destructive hover:bg-destructive/10",
                  )}
                  onClick={() =>
                    toast.error("Confirme a exclusão na zona perigosa")
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <Button variant="gradient" size="sm" asChild>
                  <Link href={`/personas/${p.id}/look-3d`}>
                    Editar <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" /> Zona perigosa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            A exclusão de uma persona apaga conteúdo, prompts, leads, dores ICP e
            funis vinculados. Apenas o owner pode confirmar a operação.
          </p>
          <p>Cada exclusão gera audit log permanente.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card-elevated p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl font-semibold num mt-1">{value}</p>
    </div>
  );
}
