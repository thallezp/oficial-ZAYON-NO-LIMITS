"use client";

import { Bot, History, Sparkles, Wand2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_AI_ACTIONS } from "@/data";
import { useUIStore } from "@/stores/ui-store";
import { useActivePersona } from "@/stores/persona-store";
import { relativeTime } from "@/lib/utils/format";

export default function AIAssistantPage() {
  const setAIPanelOpen = useUIStore((s) => s.setAIPanelOpen);
  const persona = useActivePersona();

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="IA contextual integrada à operação. Cria tarefas, gera roteiros, qualifica leads, monta funis."
        badge={
          <Badge variant="primary">
            <Sparkles className="h-3 w-3" /> contexto: {persona?.name ?? "global"}
          </Badge>
        }
        actions={
          <Button variant="gradient" size="sm" onClick={() => setAIPanelOpen(true)}>
            <Bot className="h-4 w-4" /> Abrir painel
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            title: "Gerar roteiro de Reel",
            desc: "Hook + 4 cenas + CTA · pegada cinematográfica",
            icon: Sparkles,
          },
          {
            title: "Qualificar leads pendentes",
            desc: "Aplicar regra de score · marcar prioritários",
            icon: Wand2,
          },
          {
            title: "Resumir reunião",
            desc: "Decisões, ações, blockers · gerar tarefas",
            icon: Bot,
          },
          {
            title: "Plano de lançamento 30 dias",
            desc: "Cronograma · conteúdos · campanhas · KPIs",
            icon: Sparkles,
          },
          {
            title: "Dores ICP → criativos",
            desc: "Transformar dores em hooks de anúncio",
            icon: Wand2,
          },
          {
            title: "Auditar funil",
            desc: "Detectar gargalos e sugerir otimizações",
            icon: Bot,
          },
        ].map((a) => (
          <Card
            key={a.title}
            variant="elevated"
            className="group hover:border-primary/40 cursor-pointer"
            onClick={() => setAIPanelOpen(true)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 text-primary">
                <a.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {a.desc}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row justify-between">
          <div>
            <CardTitle>Histórico recente</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Cada ação executada pela IA gera registro em <Badge variant="outline" size="sm">ai_actions</Badge>.
            </p>
          </div>
          <Button variant="ghost" size="sm">
            <History className="h-3.5 w-3.5" /> Ver tudo
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_AI_ACTIONS.map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border border-border/60 bg-card-elevated p-3"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{a.name}</p>
                  <Badge
                    size="sm"
                    variant={a.status === "completed" ? "success" : "warning"}
                  >
                    {a.status}
                  </Badge>
                </div>
                {a.description && (
                  <p className="text-[11px] text-muted-foreground">
                    {a.description}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {relativeTime(a.createdAt)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
