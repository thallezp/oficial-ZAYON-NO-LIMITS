"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Hash,
  Plus,
  Search,
  Sparkles,
  Star,
  StickyNote,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_DOCUMENTS, MOCK_PERSONAS } from "@/data";
import { initials, relativeTime } from "@/lib/utils/format";

export default function DocumentsPage() {
  const [search, setSearch] = React.useState("");
  const docs = MOCK_DOCUMENTS.filter(
    (d) =>
      !search ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.summary?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentos"
        description="Wiki interna, playbooks, atas, briefings · com editor estilo Notion e colaboração ao vivo."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Sparkles className="h-3.5 w-3.5" /> Resumir com IA
            </Button>
            <Button variant="gradient" size="sm">
              <Plus className="h-4 w-4" /> Novo documento
            </Button>
          </>
        }
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 ml-auto text-xs">
          <Badge variant="outline">{docs.length} documentos</Badge>
          <Badge variant="primary">
            <Star className="h-3 w-3" /> {docs.filter((d) => d.isStarred).length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {docs.map((d, i) => {
          const persona = MOCK_PERSONAS.find((p) => p.id === d.personaId);
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/documents/${d.id}`} className="block">
              <Card variant="elevated" className="group hover:border-primary/40 transition relative overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{d.emoji ?? "📄"}</span>
                      {d.isStarred && (
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                      )}
                    </div>
                    {persona && (
                      <Badge size="sm" variant="outline" className="border-primary/30">
                        {persona.name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold leading-tight">{d.title}</h3>
                    {d.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {d.summary}
                      </p>
                    )}
                  </div>

                  {d.tags && (
                    <div className="flex flex-wrap gap-1">
                      {d.tags.map((t) => (
                        <Badge key={t} variant="ghost" size="sm">
                          <Hash className="h-2.5 w-2.5" /> {t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    {d.author && (
                      <div className="flex items-center gap-1.5">
                        <Avatar size="xs">
                          <AvatarFallback>
                            {initials(d.author.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground">
                          {d.author.fullName.split(" ")[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {relativeTime(d.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
              </Link>
            </motion.div>
          );
        })}

        <button className="rounded-xl border-2 border-dashed border-border/60 bg-card/20 flex flex-col items-center justify-center gap-2 py-10 transition hover:border-primary/40 hover:bg-card/40">
          <StickyNote className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">Criar documento em branco</span>
          <Badge variant="ghost" size="sm">
            slash · tabela · checklist · markdown
          </Badge>
        </button>
      </div>
    </div>
  );
}
