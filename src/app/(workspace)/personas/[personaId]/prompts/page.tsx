"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Plus,
  Sparkles,
  TestTube,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PersonaHero } from "@/components/personas/persona-hero";
import { usePersonaFromRoute } from "@/components/personas/persona-resolver";
import { MOCK_PROMPT_CHAINS } from "@/data";
import { isMockModeClient } from "@/lib/mock-mode-client";
import type { PromptChain } from "@/types";
import { relativeTime } from "@/lib/utils/format";
import { usePrompts } from "@/hooks/use-queries";
import { toast } from "sonner";

export default function PromptsPage() {
  const persona = usePersonaFromRoute();
  const { data: dbPrompts = [] } = usePrompts(persona.id);
  const chains =
    isMockModeClient && dbPrompts.length === 0
      ? MOCK_PROMPT_CHAINS.filter((c) => c.personaId === persona.id)
      : dbPrompts;

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = chains.find((c: any) => c.id === activeId) || chains[0];

  React.useEffect(() => {
    if (chains.length > 0 && !activeId) {
      setActiveId(chains[0].id);
    }
  }, [chains, activeId]);

  const handleNewChain = () => {
    toast.info("Ação integrada com o Prompt Editor", {
      description: "Nova cadeia de prompts iniciada.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prompt Chains"
        description="Banco de prompts encadeados por persona. Cada cadeia é uma sequência ordenada de instruções."
        actions={
          <Button variant="gradient" size="sm" onClick={handleNewChain}>
            <Plus className="h-4 w-4" /> Nova cadeia
          </Button>
        }
      />
      <PersonaHero persona={persona} pageBadge="prompts" />

      {!active ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Nenhuma cadeia de prompts ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 lg:col-span-4 space-y-2">
            {chains.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  c.id === active.id
                    ? "border-primary/60 bg-primary/5"
                    : "border-border/60 bg-card/40 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm flex-1">{c.name}</p>
                  <Badge
                    size="sm"
                    variant={c.status === "robust" ? "success" : "warning"}
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5">
                  {c.chain.length} passos · {relativeTime(c.updatedAt)}
                </p>
              </button>
            ))}
          </aside>

          <div className="col-span-12 lg:col-span-8 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {active.name}
                  <Badge variant={active.status === "robust" ? "success" : "warning"}>
                    {active.status}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {active.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Prompt base
                  </div>
                  <Textarea defaultValue={active.basePrompt} rows={3} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Cadeia · {active.chain.length} passos
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <Wand2 className="h-3 w-3" /> Melhorar com IA
                    </Button>
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-3 w-3" /> Gerar variações
                    </Button>
                    <Button variant="gradient" size="sm">
                      <TestTube className="h-3 w-3" /> Testar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {active.chain.map((step: any, i: number) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex gap-3 rounded-xl border border-border/60 bg-card-elevated p-3"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 cursor-grab" />
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary text-xs font-semibold">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge size="sm" variant="ghost" className="mb-1">
                          {step.role}
                        </Badge>
                        <Textarea defaultValue={step.body} rows={2} className="text-sm" />
                      </div>
                    </motion.div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    <Plus className="h-3 w-3" /> Adicionar passo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
