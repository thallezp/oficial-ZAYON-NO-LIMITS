"use client";

import { Bot, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const threads = [
  {
    id: "th_001",
    title: "Roteiro de Reel · Aurora",
    persona: "Aurora",
    messageCount: 12,
    updatedAt: "há 2h",
    summary: "Geramos 5 variações de hook e o script final do reel 'O custo do silêncio'.",
  },
  {
    id: "th_002",
    title: "Plano de lançamento · 30 dias",
    persona: "Aurora",
    messageCount: 34,
    updatedAt: "há 8h",
    summary: "Cronograma completo dividido em 5 fases · conteúdos, lives, emails e ads.",
  },
  {
    id: "th_003",
    title: "Qualificação de leads · script",
    persona: "Aurora",
    messageCount: 8,
    updatedAt: "ontem",
    summary: "Regras de score, perguntas obrigatórias, gatilhos de qualificação imediata.",
  },
  {
    id: "th_004",
    title: "Resumo · reunião semanal #18",
    persona: "Global",
    messageCount: 4,
    updatedAt: "ontem",
    summary: "8 decisões, 12 ações, 3 blockers · tarefas geradas em /tasks.",
  },
];

export default function AIHistoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI History"
        description="Threads · todo o contexto da IA fica salvo e retomável a qualquer momento."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {threads.map((t) => (
          <Card key={t.id} variant="elevated" className="hover:border-primary/40 cursor-pointer">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <Badge variant="outline" size="sm">
                    {t.persona}
                  </Badge>
                </div>
                <Badge variant="ghost" size="sm">
                  <MessageSquare className="h-3 w-3" /> {t.messageCount}
                </Badge>
              </div>
              <div>
                <h3 className="font-medium">{t.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {t.summary}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Atualizado {t.updatedAt}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
