"use client";

import { useRouter, usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { usePersonaStore } from "@/stores/persona-store";
import { useQuickCreate } from "@/stores/quick-create-store";
import { cn } from "@/lib/utils/cn";
import { initials } from "@/lib/utils/format";

const statusLabel = {
  active: { label: "ativa", variant: "success" as const },
  building: { label: "construindo", variant: "warning" as const },
  paused: { label: "pausada", variant: "outline" as const },
  archived: { label: "arquivada", variant: "ghost" as const },
};

export function PersonaSwitcher({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { personas, activePersonaId, setActivePersona } = usePersonaStore();
  const openQuickCreate = useQuickCreate((s) => s.openWith);
  const active =
    personas.find((p) => p.id === activePersonaId) ?? personas[0];

  if (!active) {
    return (
      <button
        onClick={() => openQuickCreate("persona")}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-card/40 text-xs text-muted-foreground transition hover:border-primary/60 hover:bg-card hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> Criar primeira persona
      </button>
    );
  }

  const handleSelect = (id: string) => {
    setActivePersona(id);
    if (pathname.includes("/personas/")) {
      const tail = pathname.split("/").pop() ?? "overview";
      router.push(`/personas/${id}/${tail}`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group w-full rounded-xl border border-border/60 bg-card/60 px-2 py-2 text-left transition hover:border-border hover:bg-card",
            "flex items-center gap-2.5",
          )}
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold uppercase text-white shadow-glow"
            style={{
              background: `linear-gradient(135deg, ${active.accent ?? "#5b8cff"}, #2a3ef5)`,
            }}
          >
            {initials(active.name)}
          </div>
          {!compact && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Persona ativa
              </p>
              <p className="text-sm font-medium leading-tight truncate">
                {active.name}
              </p>
            </div>
          )}
          {!compact && (
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground opacity-60 group-hover:opacity-100" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Personas</DropdownMenuLabel>
        {personas.map((p) => {
          const s = statusLabel[p.status];
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="gap-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${p.accent ?? "#5b8cff"}, #2a3ef5)`,
                }}
              >
                {initials(p.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{p.name}</p>
                  <Badge variant={s.variant} size="sm">
                    {s.label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {p.niche}
                </p>
              </div>
              {p.id === active.id && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground"
          onClick={() => openQuickCreate("persona")}
        >
          <Plus className="h-4 w-4" /> Nova persona
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
