"use client";

import { ExternalLink, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_MODELING } from "@/data";
import { formatCompact, initials } from "@/lib/utils/format";

const categoryColor = {
  emerging: "info",
  hidden_gem: "primary",
  big_creator: "warning",
  authority: "success",
  competitor: "danger",
  international: "outline",
} as const;

export default function ModelingPage() {
  const persona = usePersonaFromRoute();
  const profiles = MOCK_MODELING.filter((m) => m.personaId === persona.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modelagem"
        description="Engenharia reversa · perfis estudados, padrões, categorias."
        actions={
          <Button variant="gradient" size="sm">
            <Plus className="h-4 w-4" /> Adicionar perfil
          </Button>
        }
      />
      <PersonaHero persona={persona} pageBadge="modelagem" />

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nome, nicho, tag…" className="pl-9" />
        </div>
        <Badge variant="outline">{profiles.length} perfis</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <Card key={p.id} variant="elevated" className="hover:border-primary/40 transition">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${persona.accent}, #2a3ef5)`,
                  }}
                >
                  {initials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{p.name}</p>
                    <Badge size="sm" variant={categoryColor[p.category]}>
                      {p.category.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {p.socialNetwork} · {p.country} · {formatCompact(p.followers ?? 0)}
                  </p>
                </div>
              </div>

              {p.notes && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {p.notes}
                </p>
              )}

              {p.tags && (
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
                    <Badge key={t} variant="ghost" size="sm">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                <Badge variant="outline" size="sm">
                  {p.niche}
                </Badge>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1"
                >
                  abrir <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
