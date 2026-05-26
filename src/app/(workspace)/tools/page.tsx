"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Filter,
  Globe,
  Pin,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_TOOLS, TOOL_CATEGORIES } from "@/data";
import { cn } from "@/lib/utils/cn";

export default function ToolsPage() {
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("Todas");

  const tools = MOCK_TOOLS.filter(
    (t) =>
      (category === "Todas" || t.category === category) &&
      (!search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))),
  );

  const pinned = MOCK_TOOLS.filter((t) => t.isPinned);
  const favorites = MOCK_TOOLS.filter((t) => t.isFavorite && !t.isPinned);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tools Hub"
        description="Central de todas as ferramentas externas usadas pela equipe. Favoritos, fixos e organizados por categoria."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Adicionar ferramenta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 space-y-1">
          <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Categorias
          </p>
          {["Todas", ...TOOL_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "w-full text-left rounded-lg px-2.5 py-1.5 text-sm flex items-center justify-between transition",
                category === c
                  ? "bg-card border border-border/60 text-foreground"
                  : "text-muted-foreground hover:bg-card/60",
              )}
            >
              <span>{c}</span>
              <span className="text-[10px]">
                {c === "Todas"
                  ? MOCK_TOOLS.length
                  : MOCK_TOOLS.filter((t) => t.category === c).length}
              </span>
            </button>
          ))}
        </aside>

        <div className="col-span-12 md:col-span-9 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ferramentas, tags, descrição…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {category === "Todas" && pinned.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Pin className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fixadas
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {pinned.map((t) => (
                  <ToolCard key={t.id} tool={t} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {category === "Todas" && favorites.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Favoritas
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {favorites.map((t) => (
                  <ToolCard key={t.id} tool={t} />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category === "Todas" ? "Todas as ferramentas" : category}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  variant = "default",
}: {
  tool: (typeof MOCK_TOOLS)[number];
  variant?: "default" | "featured";
}) {
  return (
    <motion.a
      href={tool.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card-elevated p-3.5 transition hover:border-primary/40",
        variant === "featured" && "p-4",
      )}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
        style={{
          background: `radial-gradient(at top, ${tool.brandColor ?? "#5b8cff"}30, transparent 60%)`,
        }}
      />
      <div className="relative space-y-2.5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex items-center justify-center rounded-lg font-bold text-white border border-border/60",
              variant === "featured" ? "h-12 w-12 text-lg" : "h-9 w-9 text-sm",
            )}
            style={{
              background: tool.brandColor ?? "#5b8cff",
            }}
          >
            {tool.name[0]}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            {tool.isFavorite && (
              <Star className="h-3 w-3 text-warning fill-warning" />
            )}
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{tool.name}</p>
          <p className="text-[10px] text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        </div>
        <Badge size="sm" variant="ghost">
          {tool.category}
        </Badge>
      </div>
    </motion.a>
  );
}
