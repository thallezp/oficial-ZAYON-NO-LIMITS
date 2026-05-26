"use client";

import * as React from "react";
import {
  FileVideo,
  FileImage,
  FileText as FilePdf,
  Folder,
  Music,
  Plus,
  Search,
  Star,
  Upload,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_MATERIALS } from "@/data";
import { cn } from "@/lib/utils/cn";

const typeIcon = {
  video: FileVideo,
  image: FileImage,
  pdf: FilePdf,
  audio: Music,
  doc: FilePdf,
  other: FilePdf,
} as const;

function formatBytes(b?: number) {
  if (!b) return "—";
  if (b > 1024 * 1024 * 1024) return `${(b / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (b > 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b > 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

const folders = [
  { id: "all", name: "Todos os arquivos", count: 142 },
  { id: "aurora", name: "Aurora · brutal", count: 52 },
  { id: "obsidian", name: "Obsidian · forge", count: 18 },
  { id: "brand", name: "Brand kit", count: 14 },
  { id: "ref", name: "Referências", count: 31 },
];

export default function MaterialsPage() {
  const [search, setSearch] = React.useState("");
  const items = MOCK_MATERIALS.filter(
    (m) =>
      !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Materiais"
        description="Upload, organização e vínculos. PDFs, vídeos, imagens, prints, áudios — todos rastreáveis."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Nova pasta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-12 md:col-span-3 space-y-1">
          {folders.map((f, i) => (
            <button
              key={f.id}
              className={cn(
                "group w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition",
                i === 0
                  ? "bg-card border border-border/60 text-foreground"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
              )}
            >
              <Folder className="h-4 w-4" />
              <span className="flex-1 text-left truncate">{f.name}</span>
              <Badge size="sm" variant="outline">
                {f.count}
              </Badge>
            </button>
          ))}
        </aside>

        <div className="col-span-12 md:col-span-9 space-y-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar materiais, tags…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((m) => {
              const Icon = typeIcon[m.fileType];
              return (
                <Card
                  key={m.id}
                  variant="elevated"
                  className="group cursor-pointer hover:border-primary/40 transition"
                >
                  <CardContent className="p-3 space-y-3">
                    <div className="relative aspect-video rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center overflow-hidden">
                      <Icon className="h-7 w-7 text-muted-foreground/40" />
                      {m.isStarred && (
                        <Star className="absolute top-2 right-2 h-3.5 w-3.5 text-warning fill-warning" />
                      )}
                      <Badge
                        size="sm"
                        variant="outline"
                        className="absolute bottom-2 left-2 uppercase"
                      >
                        {m.fileType}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs font-medium truncate">{m.title}</p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{formatBytes(m.sizeBytes)}</span>
                        <span>{m.tags?.[0]}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <button className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">Arraste arquivos aqui</span>
              <Badge variant="ghost" size="sm">
                ou clique para selecionar
              </Badge>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
